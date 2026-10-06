const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type,x-internal-token","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const U=Deno.env.get("SUPABASE_URL")!,S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function db(p:string,o:RequestInit={}){const r=await fetch(`${U}/rest/v1/${p}`,{...o,headers:{apikey:S,Authorization:`Bearer ${S}`,"Content-Type":"application/json",...(o.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;}
async function email(to:string|undefined,subject:string,html:string,id:string){const k=Deno.env.get("RESEND_API_KEY");if(!k||!to)return;const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${k}`,"Content-Type":"application/json","Idempotency-Key":`delivery-${id}`},body:JSON.stringify({from:Deno.env.get("RESEND_FROM_EMAIL")||"RacharlaGPT <noreply@vibe.racharlagpt.in>",to:[to],subject,html})});if(!r.ok)throw new Error(await r.text());}
async function invoke(name:string,body:any){const r=await fetch(`${U}/functions/v1/${name}`,{method:"POST",headers:{"Content-Type":"application/json","x-internal-token":S,"apikey":S},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`${name} failed`);return d;}
async function enqueue(orderId:string){const url=`${U}/functions/v1/process-delivery`;const task=fetch(url,{method:"POST",headers:{"Content-Type":"application/json","x-internal-token":S,"apikey":S},body:JSON.stringify({order_id:orderId})});const rt=(globalThis as any).EdgeRuntime; if(rt?.waitUntil) rt.waitUntil(task); else await task;}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 if(req.headers.get("x-internal-token")!==S)return json({error:"Internal authorization required"},401);
 const b=await req.json(),orderId=String(b.order_id||"");if(!orderId)return json({error:"Order ID required"},400);
 const orders=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=id,razorpay_order_id,status,payment_status,product_type,product_name,amount,metadata,download_token,customer_email,customer_name,delivery_status`);if(!orders?.length)return json({error:"Order not found"},404);const o=orders[0];
 if(o.payment_status!=="captured" && !['paid','processing','ready'].includes(o.status))return json({error:"Payment is not captured"},409);
 const jobs=await db(`delivery_jobs?order_id=eq.${encodeURIComponent(o.id)}&select=id,status,cursor_page,attempts&limit=1`);let job=jobs?.[0];
 if(!job){
   const created=await db("delivery_jobs",{method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=representation"},body:JSON.stringify({order_id:o.id,status:"queued",cursor_page:1,attempts:0})}).catch(()=>[]);
   job=created?.[0] || (await db(`delivery_jobs?order_id=eq.${encodeURIComponent(o.id)}&select=id,status,cursor_page,attempts&limit=1`))?.[0];
 }
 if(!job)return json({error:"Delivery job could not be created"},500);
 const claimed=await db(`delivery_jobs?id=eq.${encodeURIComponent(job.id)}&status=eq.queued`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({status:"processing",attempts:Number(job.attempts||0)+1,locked_at:new Date().toISOString()})});if(!claimed?.length)return json({ok:true,already_processing:true});
 try{
   if(o.product_type==="website"){
     const d=await invoke("publish-site",{order_id:o.razorpay_order_id,expected_amount:o.amount,site:o.metadata});
     await db(`delivery_jobs?id=eq.${encodeURIComponent(job.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"done",finished_at:new Date().toISOString(),last_error:null})});
     return json({ok:true,ready:true,url:d.url});
   }
   if(o.product_type==="website_renewal"){
     const d=await invoke("renew-site",{order_id:o.razorpay_order_id,management_token:o.metadata?.managementToken,expected_amount:o.amount});
     await db(`delivery_jobs?id=eq.${encodeURIComponent(job.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"done",finished_at:new Date().toISOString(),last_error:null})});
     return json({ok:true,ready:true,url:d.url});
   }
   if(o.product_type==="photo_story"||o.product_type==="business_creative"){
     await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"ready",delivery_status:"ready",delivered_at:new Date().toISOString(),last_delivery_error:null})});
     await db(`delivery_jobs?id=eq.${encodeURIComponent(job.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"done",finished_at:new Date().toISOString(),last_error:null})});
     try{await email(o.customer_email,"RacharlaGPT — Your order is ready",`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>Your order is ready ✓</h2><p>${String(o.product_name||"Your digital product").replace(/[<>&]/g,"")}</p><p><b>Order:</b> ${o.razorpay_order_id}</p><p><a href="https://vibe.racharlagpt.in/#orders">Open My Orders</a></p></div>`,o.razorpay_order_id);await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({email_ready_sent_at:new Date().toISOString()})});}catch(e){await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({email_last_error:e instanceof Error?e.message:"Email failed"})}).catch(()=>{});}
     return json({ok:true,ready:true});
   }
   if(o.product_type==="book"){
     const total=Math.min(100,Math.max(1,Number(o.metadata?.pages||10)));const start=Math.max(1,Number(job.cursor_page||1));const count=Math.min(20,total-start+1);
     const ch=await invoke("generate-book",{mode:"chunk",order_id:o.razorpay_order_id,download_token:o.download_token,startPage:start,chunkSize:count});
     const pages=Array.isArray(ch.pages)?ch.pages:[];if(!pages.length)throw new Error("Book generation returned no pages");
     if(start+count-1>=total){await db(`delivery_jobs?id=eq.${encodeURIComponent(job.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"done",finished_at:new Date().toISOString(),last_error:null,cursor_page:total+1})});return json({ok:true,ready:true,pages:pages.length});}
     const next=start+count;await db(`delivery_jobs?id=eq.${encodeURIComponent(job.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"queued",cursor_page:next,last_error:null})});
     await enqueue(orderId);return json({ok:true,queued_next:true,next_page:next});
   }
   throw new Error(`Unsupported product type: ${o.product_type}`);
 }catch(e){
   const msg=e instanceof Error?e.message:"Delivery failed";await db(`delivery_jobs?id=eq.${encodeURIComponent(job.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"failed",last_error:msg})}).catch(()=>{});await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({delivery_status:"failed",last_delivery_error:msg,status:o.status==='ready'?'ready':'paid',delivery_attempts:Number(o.delivery_attempts||0)+1})}).catch(()=>{});return json({error:msg},500);
 }
}catch(e){return json({error:e instanceof Error?e.message:"Delivery worker failed"},500)}});
export {};

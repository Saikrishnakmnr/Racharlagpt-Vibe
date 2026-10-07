const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type,x-admin-token","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const U=Deno.env.get("SUPABASE_URL")!,S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,ADMIN=Deno.env.get("ADMIN_TOKEN")||"";
async function db(p:string,o:RequestInit={}){const r=await fetch(`${U}/rest/v1/${p}`,{...o,headers:{apikey:S,...(S.startsWith("sb_")?{}:{Authorization:`Bearer ${S}`}),"Content-Type":"application/json",...(o.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;}
async function sendEmail(to:string|undefined,subject:string,html:string,id:string){const k=Deno.env.get("RESEND_API_KEY");if(!k||!to)return;const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${k}`,"Content-Type":"application/json","Idempotency-Key":`admin-${id}`},body:JSON.stringify({from:Deno.env.get("RESEND_FROM_EMAIL")||"RacharlaGPT <noreply@vibe.racharlagpt.in>",to:[to],subject,html})});if(!r.ok)throw new Error(await r.text());}
function esc(s:string){return String(s||"").replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]||c));}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 if(!ADMIN||req.headers.get("x-admin-token")!==ADMIN)return json({error:"Admin authorization required"},401);
 const b=await req.json(),action=String(b.action||"summary");
 if(action==="summary"){
   const [orders,refunds,sites]=await Promise.all([
     db("orders?select=id,razorpay_order_id,razorpay_payment_id,amount,currency,status,payment_status,payment_error,product_type,product_name,customer_email,customer_name,delivery_status,delivery_attempts,last_delivery_error,refund_status,refund_requested_at,refund_processed_at,paid_at,created_at&order=created_at.desc&limit=200"),
     db("refunds?select=id,order_id,razorpay_payment_id,amount,reason,status,created_at,reviewed_at,processed_at,admin_note&order=created_at.desc&limit=200"),
     db("sites?select=id,slug,business_name,plan,pricing_key,duration_months,expires_at,published,customer_email,order_id,created_at&order=created_at.desc&limit=200")
   ]);
   const captured=(orders||[]).filter((o:any)=>o.payment_status==="captured").reduce((n:number,o:any)=>n+Number(o.amount||0),0);
   return json({orders:orders||[],refunds:refunds||[],sites:sites||[],stats:{orders:(orders||[]).length,captured_paise:captured,pending:(orders||[]).filter((o:any)=>o.payment_status==="captured"&&o.delivery_status!=="ready"&&o.status!=="refunded").length,refunds:(refunds||[]).filter((r:any)=>r.status==="requested").length}});
 }
 if(action==="reject_refund"){
   const r=await db(`refunds?id=eq.${encodeURIComponent(b.refund_id)}&status=eq.requested&select=id,order_id`);if(!r?.length)return json({error:"Refund request not found or already reviewed"},404);
   await db(`refunds?id=eq.${encodeURIComponent(b.refund_id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"rejected",reviewed_at:new Date().toISOString(),admin_note:String(b.note||"")})});
   await db(`orders?id=eq.${encodeURIComponent(r[0].order_id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({refund_status:"rejected"})});
   return json({ok:true});
 }
 if(action==="create_refund_request"){
   const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,status,refund_status,customer_email`);if(!rows?.length)return json({error:"Order not found"},404);const o=rows[0];
   if(!['paid','ready','processing'].includes(o.status))return json({error:"Order is not eligible"},400);
   const active=await db(`refunds?order_id=eq.${encodeURIComponent(o.id)}&status=in.(requested,approved,processing,processed)&select=id`);if(active?.length)return json({error:"A refund record already exists"},409);
   await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({refund_status:"requested",refund_requested_at:new Date().toISOString()})});
   const rr=await db("refunds",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({order_id:o.id,razorpay_payment_id:o.razorpay_payment_id,amount:o.amount,reason:String(b.reason||"Support refund review"),status:"requested"})});
   return json({ok:true,refund:rr?.[0]||null});
 }
 if(action==="approve_refund"){
   const rows=await db(`refunds?id=eq.${encodeURIComponent(b.refund_id)}&status=eq.requested&select=id,order_id,amount,reason`);if(!rows?.length)return json({error:"Refund request not found or already reviewed"},404);const r=rows[0];
   const orders=await db(`orders?id=eq.${encodeURIComponent(r.order_id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,status,customer_email,customer_name`);if(!orders?.length)return json({error:"Order not found"},404);const o=orders[0];
   if(!o.razorpay_payment_id)return json({error:"No captured Razorpay payment is attached to this order"},400);
   await db(`refunds?id=eq.${encodeURIComponent(r.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"processing",reviewed_at:new Date().toISOString()})});
   const auth=btoa(`${Deno.env.get("RAZORPAY_KEY_ID")!}:${Deno.env.get("RAZORPAY_KEY_SECRET")!}`);
   const rr=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(o.razorpay_payment_id)}/refund`,{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/json"},body:JSON.stringify({amount:Number(r.amount),notes:{reason:String(r.reason||"Admin approved refund")}})});
   const refund=await rr.json();if(!rr.ok){await db(`refunds?id=eq.${encodeURIComponent(r.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"requested",admin_note:String(refund?.error?.description||"Razorpay refund failed")})});return json({error:refund?.error?.description||"Razorpay refund failed"},502);}
   await db(`refunds?id=eq.${encodeURIComponent(r.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"processed",processed_at:new Date().toISOString(),razorpay_refund_id:refund.id})});
   await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"refunded",payment_status:"refunded",refund_status:"processed",refund_processed_at:new Date().toISOString(),delivery_status:"refunded"})});
   try{await sendEmail(o.customer_email,"RacharlaGPT — Refund processed",`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>Refund processed</h2><p>Your refund for <b>${esc(o.razorpay_order_id)}</b> has been submitted to Razorpay.</p><p>Refund ID: ${esc(refund.id)}</p><p>Please allow the payment provider/bank's normal processing time.</p></div>`,String(refund.id));}catch{}
   return json({ok:true,refund_id:refund.id,status:"processed"});
 }
 if(action==="reconcile"){
   const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,status,payment_status`);if(!rows?.length)return json({error:"Order not found"},404);const o=rows[0];
   if(!o.razorpay_payment_id)return json({error:"No Razorpay payment ID stored yet"},400);
   const auth=btoa(`${Deno.env.get("RAZORPAY_KEY_ID")!}:${Deno.env.get("RAZORPAY_KEY_SECRET")!}`);const rr=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(o.razorpay_payment_id)}`,{headers:{Authorization:`Basic ${auth}`}});const p=await rr.json();if(!rr.ok)return json({error:p?.error?.description||"Razorpay lookup failed"},502);
   const captured=p.status==="captured";await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({payment_status:captured?"captured":(p.status==="failed"?"failed":"created"),razorpay_payment_id:p.id,payment_captured_at:captured?(o.payment_status==="captured"?undefined:new Date().toISOString()):null,status:captured?(o.status==="created"?"paid":o.status):o.status})});
   return json({ok:true,payment:{id:p.id,status:p.status,amount:p.amount,method:p.method,created_at:p.created_at},order:o});
 }
 return json({error:"Unknown admin action"},400);
}catch(e){return json({error:e instanceof Error?e.message:"Admin operation failed"},500)}});
export {};

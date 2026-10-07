const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type,x-razorpay-signature","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const U=Deno.env.get("SUPABASE_URL")!,S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
function hex(b:ArrayBuffer){return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function h(m:string,s:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(s),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(m)));}
async function db(p:string,o:RequestInit={}){const r=await fetch(`${U}/rest/v1/${p}`,{...o,headers:{apikey:S,...(S.startsWith("sb_")?{}:{Authorization:`Bearer ${S}`}),"Content-Type":"application/json",...(o.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;}
async function queue(orderId:string){const task=fetch(`${U}/functions/v1/process-delivery`,{method:"POST",headers:{"Content-Type":"application/json","x-internal-token":S,"apikey":S},body:JSON.stringify({order_id:orderId})});const rt=(globalThis as any).EdgeRuntime;if(rt?.waitUntil)rt.waitUntil(task);else await task;}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const raw=await req.text(),sig=req.headers.get("x-razorpay-signature")||"",secret=Deno.env.get("RAZORPAY_WEBHOOK_SECRET")||"";if(!secret||!sig||await h(raw,secret)!==sig)return json({error:"Invalid webhook signature"},401);
 const p=JSON.parse(raw),event=String(p.event||""),eventId=String(p.id||"");
 if(eventId){const prior=await db(`razorpay_events?event_id=eq.${encodeURIComponent(eventId)}&select=id`);if(prior?.length)return json({ok:true,duplicate:true});const inserted=await db("razorpay_events",{method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=representation"},body:JSON.stringify({event_id:eventId,event_type:event})}).catch(()=>[]);if(!inserted?.length){const again=await db(`razorpay_events?event_id=eq.${encodeURIComponent(eventId)}&select=id`);if(again?.length)return json({ok:true,duplicate:true});}}
 const payment=p.payload?.payment?.entity,orderEntity=p.payload?.order?.entity;const orderId=payment?.order_id||orderEntity?.id;
 if(event==="payment.captured"&&orderId){
   const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=id,status,amount,payment_status`);if(rows?.length){const o=rows[0];if(Number(payment.amount)===Number(o.amount)){await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:o.status==='ready'?'ready':'paid',payment_status:"captured",delivery_status:o.status==='ready'?"ready":"processing",razorpay_payment_id:payment.id,paid_at:new Date().toISOString(),payment_captured_at:new Date().toISOString(),payment_error:null})});await queue(orderId);}}
 }
 if(event==="payment.failed"&&orderId){const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=id,payment_status`);if(rows?.length&&rows[0].payment_status!=="captured"){await db(`orders?id=eq.${encodeURIComponent(rows[0].id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"failed",payment_status:"failed",delivery_status:"failed",payment_error:String(payment?.error_description||payment?.error_reason||"Payment failed")})});}}
 if(event==="refund.processed"||event==="refund.created"||event==="refund.failed"){
   const refund=p.payload?.refund?.entity;const rid=refund?.id;const rstatus=event==="refund.processed"?"processed":event==="refund.created"?"processing":"failed";
   if(rid){
     let rr=await db(`refunds?razorpay_refund_id=eq.${encodeURIComponent(rid)}&select=id,order_id`);
     if(!rr?.length&&refund?.payment_id) rr=await db(`refunds?razorpay_payment_id=eq.${encodeURIComponent(refund.payment_id)}&status=in.(requested,processing)&select=id,order_id&limit=1`);
     if(rr?.length){await db(`refunds?id=eq.${encodeURIComponent(rr[0].id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:rstatus,processed_at:event==="refund.processed"?new Date().toISOString():null,razorpay_refund_id:rid})});if(event==="refund.processed")await db(`orders?id=eq.${encodeURIComponent(rr[0].order_id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"refunded",payment_status:"refunded",refund_status:"processed",delivery_status:"refunded",refund_processed_at:new Date().toISOString()})});}
   }
 }
 return json({ok:true});
}catch(e){return json({error:e instanceof Error?e.message:"Webhook failed"},500)}});
export {};

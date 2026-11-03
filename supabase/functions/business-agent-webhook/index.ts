/* Dedicated Racharla Business Agent Razorpay webhook.
Register a separate endpoint in Razorpay to receive payment.captured + refund.processed.
Secret must match BUSINESS_AGENT_WEBHOOK_SECRET or RAZORPAY_WEBHOOK_SECRET.
Never use client-submitted payment status to activate a license.
*/
const U=Deno.env.get("SUPABASE_URL")||"",K=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const SECRET=Deno.env.get("BUSINESS_AGENT_WEBHOOK_SECRET")||Deno.env.get("RAZORPAY_WEBHOOK_SECRET")||"";
const RZP_ID=Deno.env.get("RAZORPAY_KEY_ID")||"",RZP_SECRET=Deno.env.get("RAZORPAY_KEY_SECRET")||"";
const response=(o:unknown,status=200)=>new Response(JSON.stringify(o),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function db(path:string,init:RequestInit={}){let r=await fetch(U+"/rest/v1/"+path,{...init,headers:{apikey:K,...(K.startsWith("sb_")?{}:{Authorization:"Bearer "+K}),"Content-Type":"application/json",...(init.headers||{})}});let t=await r.text();if(!r.ok)throw Error("database "+r.status);return t?JSON.parse(t):null}
async function patch(path:string,data:unknown){return db(path,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify(data)})}
async function hmac(s:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const b=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function equal(a:string,b:string){if(a.length!==b.length)return false;let z=0;for(let i=0;i<a.length;i++)z|=a.charCodeAt(i)^b.charCodeAt(i);return z===0}
Deno.serve(async req=>{
 if(req.method!=="POST")return response({error:"POST required"},405);
 if(!U||!K||!SECRET)return response({error:"Webhook configuration unavailable"},503);
 let raw=await req.text();if(raw.length>200000)return response({error:"Payload too large"},413);
 const sig=req.headers.get("x-razorpay-signature")||"";if(!sig||!equal(await hmac(raw),sig))return response({error:"Invalid signature"},401);
 let event:any;try{event=JSON.parse(raw)}catch{return response({error:"Invalid body"},400)}
 try{
  let type=String(event.event||"");
  if(type==="payment.captured"){
   let p=event.payload?.payment?.entity;
   const orderId=String(p?.order_id||""),pid=String(p?.id||"");
   if(!orderId||!pid||p.status!=="captured"||p.currency!=="INR"||Number(p.amount)!==99900)return response({ok:true,ignored:true});
   const rows=await db("business_agent_purchases?razorpay_order_id=eq."+encodeURIComponent(orderId)+"&select=id,user_id,status,razorpay_payment_id&limit=1");
   if(!rows?.length)return response({ok:true,unrelated:true});
   const o=rows[0];if(o.status==="refunded"||o.status==="failed")return response({ok:true,not_eligible:true});
   if(o.razorpay_payment_id&&o.razorpay_payment_id!==pid)return response({error:"Conflicting captured payment"},409);
   if(o.status==="created")await patch("business_agent_purchases?id=eq."+encodeURIComponent(o.id)+"&status=eq.created",{status:"captured",razorpay_payment_id:pid,captured_at:new Date().toISOString(),updated_at:new Date().toISOString()});
   let l=await db("business_agent_licenses?user_id=eq."+encodeURIComponent(o.user_id)+"&select=id,status&limit=1");
   if(!l?.length){try{await db("business_agent_licenses",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({user_id:o.user_id,purchase_id:o.id,status:"active"})})}catch(e){const other=await db("business_agent_licenses?user_id=eq."+encodeURIComponent(o.user_id)+"&select=id,status");if(!other?.length)throw e}}
   return response({ok:true,activated:true});
  }
  if(type==="refund.processed"){
   const refund=event.payload?.refund?.entity,pid=String(refund?.payment_id||"");
   if(!pid)return response({ok:true,ignored:true});
   let rows=await db("business_agent_purchases?razorpay_payment_id=eq."+encodeURIComponent(pid)+"&select=id,user_id,status&limit=1");
   if(!rows?.length&&RZP_ID&&RZP_SECRET){const pr=await fetch("https://api.razorpay.com/v1/payments/"+encodeURIComponent(pid),{headers:{"Authorization":"Basic "+btoa(RZP_ID+":"+RZP_SECRET)}});if(!pr.ok)throw Error("Cannot reconcile refund payment");const payment=await pr.json();if(payment.order_id)rows=await db("business_agent_purchases?razorpay_order_id=eq."+encodeURIComponent(payment.order_id)+"&select=id,user_id,status&limit=1");}
   if(!rows?.length)return response({ok:true,unrelated:true});
   const p=rows[0];
   // A partial refund must not revoke a lifetime license. Check total processed refunds with Razorpay.
   let refunded=Number(refund?.amount||0);
   if(RZP_ID&&RZP_SECRET){const rr=await fetch("https://api.razorpay.com/v1/payments/"+encodeURIComponent(pid)+"/refunds",{headers:{"Authorization":"Basic "+btoa(RZP_ID+":"+RZP_SECRET)}});if(!rr.ok)throw Error("Cannot verify cumulative refund amount");const history=await rr.json();refunded=(history.items||[]).filter((r:any)=>r.status==="processed").reduce((n:number,r:any)=>n+Number(r.amount||0),0);}
   if(refunded<99900)return response({ok:true,partial_refund:true});
   const linked=await db("business_agent_licenses?purchase_id=eq."+encodeURIComponent(p.id)+"&select=id,user_id&limit=1");
   if(p.status!=="refunded")await patch("business_agent_purchases?id=eq."+encodeURIComponent(p.id),{status:"refunded",updated_at:new Date().toISOString()});
   await patch("business_agent_licenses?purchase_id=eq."+encodeURIComponent(p.id),{status:"revoked"});
   if(linked?.length)await patch("business_agent_shops?license_id=eq."+encodeURIComponent(linked[0].id),{published:false,updated_at:new Date().toISOString()});
   return response({ok:true,revoked:true});
  }
  return response({ok:true,ignored:true});
 }catch(e){return response({error:"Temporary webhook processing failure"},500)}
});
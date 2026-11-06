// Separate monthly Razorpay webhook; do not replace the old Vibe or ₹999 webhook.
// Configure Razorpay to send payment.captured and refund.processed to this endpoint.
// BUSINESS_AGENT_MONTHLY_WEBHOOK_SECRET must match the configured Razorpay webhook secret.
const U=Deno.env.get("SUPABASE_URL")||"",K=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const SECRET=Deno.env.get("BUSINESS_AGENT_MONTHLY_WEBHOOK_SECRET")||"";
const RK=Deno.env.get("RAZORPAY_KEY_ID")||"",RS=Deno.env.get("RAZORPAY_KEY_SECRET")||"";
const out=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function db(path:string,init:RequestInit={}){const r=await fetch(U+"/rest/v1/"+path,{...init,headers:{apikey:K,...(K.startsWith("sb_")?{}:{Authorization:"Bearer "+K}),"Content-Type":"application/json",...(init.headers||{})}});const raw=await r.text();if(!r.ok)throw Error("DB "+r.status);return raw?JSON.parse(raw):null}
async function signature(raw:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return [...new Uint8Array(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(raw)))].map(x=>x.toString(16).padStart(2,"0")).join("")}
function same(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function razorpay(path:string){if(!RK||!RS)throw Error("Payment provider unavailable");const r=await fetch("https://api.razorpay.com/v1/"+path,{headers:{Authorization:"Basic "+btoa(RK+":"+RS)}});if(!r.ok)throw Error("Cannot verify provider payment");return r.json()}
Deno.serve(async req=>{
 if(req.method!=="POST")return out({error:"POST only"},405);
 if(!SECRET||!U||!K)return out({error:"Webhook configuration unavailable"},503);
 const raw=await req.text();if(raw.length>200000)return out({error:"Too large"},413);
 const sig=req.headers.get("x-razorpay-signature")||"";
 if(!sig||!same(sig,await signature(raw)))return out({error:"Invalid webhook signature"},401);
 let e:any;try{e=JSON.parse(raw)}catch{return out({error:"Invalid JSON"},400)}
 try{
  if(e.event==="payment.captured"){
   const p=e.payload?.payment?.entity;
   if(!p?.order_id||!p?.id||p.status!=="captured"||p.currency!=="INR")return out({ok:true,ignored:true});
   const rows=await db("business_agent_monthly_purchases?razorpay_order_id=eq."+encodeURIComponent(String(p.order_id))+"&select=id,amount_paise&limit=1");
   if(!rows?.length)return out({ok:true,unrelated:true});
   if(Number(p.amount)!==Number(rows[0].amount_paise))throw Error("Captured amount does not match recorded purchase");
   const fetched=await razorpay("payments/"+encodeURIComponent(String(p.id)));
   if(fetched.status!=="captured"||fetched.order_id!==p.order_id||Number(fetched.amount)!==Number(rows[0].amount_paise)||fetched.currency!=="INR")throw Error("Captured payment mismatch");
   await db("rpc/business_agent_activate_month",{method:"POST",body:JSON.stringify({p_order_id:p.order_id,p_payment_id:p.id})});
   return out({ok:true,activated:true});
  }
  if(e.event==="refund.processed"){
   const p=e.payload?.refund?.entity, pay=String(p?.payment_id||"");
   if(!pay)return out({ok:true,ignored:true});
   const payment=await razorpay("payments/"+encodeURIComponent(pay));
   if(!payment?.order_id)return out({ok:true,ignored:true});
   const rows=await db("business_agent_monthly_purchases?razorpay_order_id=eq."+encodeURIComponent(payment.order_id)+"&select=id,status,razorpay_payment_id,amount_paise&limit=1");
   if(!rows?.length)return out({ok:true,unrelated:true});
   const record=rows[0];
   // Aggregate all provider-processed refunds, not merely the latest event.
   const refunds=await razorpay("payments/"+encodeURIComponent(pay)+"/refunds");
   const total=(refunds.items||[]).filter((x:any)=>x.status==="processed").reduce((n:number,x:any)=>n+Number(x.amount||0),0);
   if(total<Number(record.amount_paise))return out({ok:true,partial_refund:true});
   if(record.status==="created"){
    // If capture webhook was delayed, idempotently reconcile before refunding.
    if(payment.status==="captured"&&Number(payment.amount)===Number(record.amount_paise))await db("rpc/business_agent_activate_month",{method:"POST",body:JSON.stringify({p_order_id:payment.order_id,p_payment_id:pay})});
    else throw Error("Cannot reconcile captured refund");
   }
   await db("rpc/business_agent_refund_month",{method:"POST",body:JSON.stringify({p_payment_id:pay})});
   return out({ok:true,refunded:true});
  }
  return out({ok:true,ignored:true});
 }catch(e){return out({error:"Temporary processing failure"},500)}
});
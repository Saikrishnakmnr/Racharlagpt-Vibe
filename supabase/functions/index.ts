const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type,x-internal-token","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const U=Deno.env.get("SUPABASE_URL")!,S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function db(p:string,o:RequestInit={}){const r=await fetch(`${U}/rest/v1/${p}`,{...o,headers:{apikey:S,...(S.startsWith("sb_")?{}:{Authorization:`Bearer ${S}`}),"Content-Type":"application/json",...(o.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 if(req.headers.get("x-internal-token")!==S)return json({error:"Completion is server-controlled."},403);
 const b=await req.json();if(!b.order_id)return json({error:"Order ID is required"},400);
 await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"ready",delivery_status:"ready",delivered_at:new Date().toISOString(),last_delivery_error:null})});
 return json({ok:true,ready:true});
}catch(e){return json({error:e instanceof Error?e.message:"Completion failed"},500)}});
export {};

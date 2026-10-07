const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-admin-token","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!,SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,ADMIN=Deno.env.get("ADMIN_TOKEN")!;
async function db(path:string,options:RequestInit={}){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SERVICE,...(SERVICE.startsWith("sb_")?{}:{Authorization:`Bearer ${SERVICE}`}),"Content-Type":"application/json",...(options.headers||{})}});
 const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;
}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  if(!ADMIN||req.headers.get("x-admin-token")!==ADMIN)return json({error:"Admin authorization required"},401);
  const b=await req.json();
  const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.razorpay_order_id)}&select=id,razorpay_payment_id,amount,status`);
  if(!rows?.length)return json({error:"Order not found"},404);
  const o=rows[0];if(o.status!=="paid"&&o.status!=="ready")return json({error:"Order is not refundable in its current state"},400);
  const auth=btoa(`${Deno.env.get("RAZORPAY_KEY_ID")!}:${Deno.env.get("RAZORPAY_KEY_SECRET")!}`);
  const rr=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(o.razorpay_payment_id)}/refund`,{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/json"},body:JSON.stringify({amount:b.amount||o.amount,notes:{reason:String(b.reason||"Admin refund")}})});
  const refund=await rr.json();if(!rr.ok)return json({error:refund?.error?.description||"Refund failed"},502);
  await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",body:JSON.stringify({status:"refunded",payment_status:"refunded",refund_status:"processed",delivery_status:"refunded",refund_processed_at:new Date().toISOString()})});
  await db("refunds",{method:"POST",body:JSON.stringify({order_id:o.id,razorpay_payment_id:o.razorpay_payment_id,amount:refund.amount,reason:b.reason||"Admin refund",status:"processed",processed_at:new Date().toISOString()})});
  return json({ok:true,refund_id:refund.id,status:"refunded"});
 }catch(e){return json({error:e instanceof Error?e.message:"Refund failed"},500)}
});

export {};

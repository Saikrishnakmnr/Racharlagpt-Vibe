const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-admin-token","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const U=Deno.env.get("SUPABASE_URL")!,S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,ADMIN=Deno.env.get("ADMIN_TOKEN")||"";
async function db(p:string,o:RequestInit={}){const r=await fetch(`${U}/rest/v1/${p}`,{...o,headers:{apikey:S,...(S.startsWith("sb_")?{}:{Authorization:`Bearer ${S}`}),"Content-Type":"application/json",...(o.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 if(!ADMIN||req.headers.get("x-admin-token")!==ADMIN)return json({error:"Customer refund requests are disabled. Refunds are reviewed by RacharlaGPT support/admin."},403);
 const b=await req.json();if(!b.order_id)return json({error:"Order ID is required"},400);
 const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,status,refund_status`);if(!rows?.length)return json({error:"Order not found"},404);
 const o=rows[0];if(!['paid','ready','processing'].includes(o.status))return json({error:"Order is not eligible for refund review."},400);
 await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({refund_status:"requested",refund_requested_at:new Date().toISOString()})});
 const existing=await db(`refunds?order_id=eq.${encodeURIComponent(o.id)}&status=in.(requested,approved,processing,processed)&select=id`);if(!existing?.length){await db("refunds",{method:"POST",body:JSON.stringify({order_id:o.id,razorpay_payment_id:o.razorpay_payment_id,amount:o.amount,reason:String(b.reason||"Admin/support refund review"),status:"requested"})});}
 return json({ok:true,message:"Refund review recorded for admin processing."});
}catch(e){return json({error:e instanceof Error?e.message:"Refund request failed"},500)}});
export {};

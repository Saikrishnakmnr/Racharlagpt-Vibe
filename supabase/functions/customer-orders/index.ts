const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const U=Deno.env.get("SUPABASE_URL")!,S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function db(path:string,options:RequestInit={}){const r=await fetch(`${U}/rest/v1/${path}`,{...options,headers:{apikey:S,Authorization:`Bearer ${S}`,"Content-Type":"application/json",...(options.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;}
async function user(req:Request){const tok=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");if(!tok)throw new Error("AUTH");const r=await fetch(`${U}/auth/v1/user`,{headers:{apikey:Deno.env.get("SUPABASE_ANON_KEY")||S,Authorization:`Bearer ${tok}`}});if(!r.ok)throw new Error("AUTH");return await r.json();}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const u=await user(req);
 const orders=await db(`orders?user_id=eq.${encodeURIComponent(u.id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,currency,status,payment_status,payment_error,product_type,product_name,metadata,download_token,paid_at,payment_captured_at,created_at,updated_at,delivery_status,delivery_attempts,last_delivery_error,delivered_at,refund_status,refund_requested_at,refund_processed_at&order=created_at.desc&limit=100`);
 const sites=await db(`sites?user_id=eq.${encodeURIComponent(u.id)}&select=id,slug,business_name,plan,pricing_key,duration_months,expires_at,published,management_token,order_id,logo_url,showcase_images`);
 const orderIds=(orders||[]).map((x:any)=>x.id).filter(Boolean);
 let refunds:any[]=[];
 if(orderIds.length){
   const inList=`(${orderIds.join(',')})`;
   refunds=await db(`refunds?order_id=in.${encodeURIComponent(inList)}&select=order_id,status,reason,amount,created_at,reviewed_at,processed_at,admin_note&order=created_at.desc`);
 }
 const siteMap=new Map((sites||[]).map((x:any)=>[x.order_id,x]));
 const refundMap=new Map<string,any>();
 for(const r of refunds||[]) if(!refundMap.has(r.order_id)) refundMap.set(r.order_id,r);
 return json({orders:(orders||[]).map((o:any)=>({...o,site:siteMap.get(o.id)||null,refund:refundMap.get(o.id)||null}))});
}catch(e){return json({error:"Please log in to view your orders."},401)}});

export {};

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!, SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function db(path:string){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:SERVICE,...(SERVICE.startsWith("sb_")?{}:{Authorization:`Bearer ${SERVICE}`})}});
 const t=await r.text();if(!r.ok)throw new Error(t);return t?JSON.parse(t):null;
}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const {token}=await req.json();if(!token||String(token).length<40)return json({error:"Invalid token"},400);
  const rows=await db(`orders?download_token=eq.${encodeURIComponent(token)}&status=eq.ready&select=razorpay_order_id,product_name,content,metadata,download_token`);
  if(!rows?.length)return json({error:"Paid book not found or not ready"},404);
  const o=rows[0], c=o.content||{};
  return json({...c,order_id:o.razorpay_order_id,download_token:o.download_token,publisherName:c.publisherName||o.metadata?.publisherName||""});
 }catch(e){return json({error:e instanceof Error?e.message:"Download failed"},500)}
});

export {};

// Owner-authorized and administrator-reviewed inactive-shop storage cleanup.
// Never deletes billing records, accounts or customer order history.
// The privileged ADMIN_TOKEN stays in Supabase secrets; access is server-side only.
const U=Deno.env.get("SUPABASE_URL")||"",K=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",ADMIN=Deno.env.get("ADMIN_TOKEN")||"";
const ORIGIN="https://vibe.racharlagpt.in",BUCKET="business-agent-images";
const headers={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"apikey,x-admin-token,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin","Cache-Control":"no-store"};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,"Content-Type":"application/json"}});
function secureEq(a:string,b:string){if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0}
function keyHeaders(extra:Record<string,string>={}){return {apikey:K,...(K.startsWith("sb_")?{}:{Authorization:"Bearer "+K}),"Content-Type":"application/json",...extra}}
async function db(path:string,method="GET",body?:unknown){const r=await fetch(U+"/rest/v1/"+path,{method,headers:keyHeaders({"Prefer":"return=representation"}),body:body===undefined?undefined:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw Error("Database request failed "+r.status);return t?JSON.parse(t):null}
async function storage(path:string,method:string,body:unknown){const r=await fetch(U+"/storage/v1/"+path,{method,headers:keyHeaders(),body:JSON.stringify(body)});const txt=await r.text();if(!r.ok)throw Error("Storage cleanup failed "+r.status+" "+txt.slice(0,100));return txt?JSON.parse(txt):null}
async function shopEligible(uid:string,shopId?:string){
 const accounts=await db("business_agent_monthly_accounts?user_id=eq."+uid+"&select=paid_through&limit=1");
 const expiry=Date.parse(accounts?.[0]?.paid_through||"");if(!Number.isFinite(expiry))return false;
 const ops=await db("business_agent_operations?id=eq.1&select=retention_days");const days=Number(ops?.[0]?.retention_days||60);
 if(expiry+days*86400000>=Date.now())return false;
 const license=await db("business_agent_licenses?user_id=eq."+uid+"&status=eq.active&select=id&limit=1");if(license?.length)return false;
 if(shopId){const shops=await db("business_agent_shops?id=eq."+shopId+"&user_id=eq."+uid+"&select=id&limit=1");if(!shops?.length)return false}
 return true;
}
async function candidates(){
 const rows=await db("business_agent_cleanup_requests?status=in.(pending,failed)&execute_after=lte."+encodeURIComponent(new Date().toISOString())+"&select=user_id,shop_id,status,requested_at,execute_after,last_error&order=execute_after.asc&limit=30");
 const out=[];for(const item of rows||[]){if(await shopEligible(item.user_id,item.shop_id)){
 const shops=await db("business_agent_shops?id=eq."+item.shop_id+"&user_id=eq."+item.user_id+"&select=slug,published&limit=1");
 out.push({...item,slug:shops?.[0]?.slug||"",published:!!shops?.[0]?.published});
 }}return out
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return reply({error:"POST required"},405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==ORIGIN)return reply({error:"Origin not permitted"},403);
 if(!U||!K||!ADMIN)return reply({error:"Cleanup admin configuration unavailable"},503);
 if(!secureEq(req.headers.get("x-admin-token")||"",ADMIN))return reply({error:"Administrator authorization required"},401);
 let body:any;try{const raw=await req.text();if(raw.length>8000)return reply({error:"Payload too large"},413);body=JSON.parse(raw)}catch{return reply({error:"Invalid JSON"},400)}
 try{
  if(body.action==="preview")return reply({ready:await candidates(),note:"Only owner-authorized requests past the 7-day cancellation period and 60-day expiration grace are eligible."});
  if(body.action!=="execute")return reply({error:"Unknown action"},404);
  const uid=String(body.user_id||"");
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(uid))return reply({error:"Invalid user ID"},400);
  if(body.confirm!=="DELETE EXPIRED SHOP")return reply({error:"Explicit cleanup confirmation required"},400);
  const requests=await db("business_agent_cleanup_requests?user_id=eq."+uid+"&select=shop_id,status,execute_after&limit=1");
  if(!requests?.length||!["pending","failed"].includes(requests[0].status)||Date.parse(requests[0].execute_after)>Date.now())return reply({error:"There is no eligible owner-consented cleanup request"},409);
  if(!await shopEligible(uid,requests[0].shop_id))return reply({error:"The customer renewed or retains protected access"},409);
  // Database function locks the account row and verifies eligibility again, preventing cleanup against a renewed active shop.
  const claim=await db("rpc/business_agent_claim_cleanup_v2","POST",{p_user_id:uid});
  if(claim?.shop_id!==requests[0].shop_id||!Array.isArray(claim.files))throw Error("Database returned unexpected cleanup snapshot");
  const files=claim.files.filter((name:unknown)=>typeof name==="string"&&String(name).startsWith(uid+"/")&&String(name).length<500&&!String(name).includes(".."));if(files.length!==claim.files.length)throw Error("Invalid owner photo path in cleanup snapshot");
  const shopId=claim.shop_id;
  try{
   // Preserve the shop row (customer order references point to it) but release the inactive catalog JSON.
   // Catalog is already unpublished and cleared atomically by the database claim; only snapshot files may be deleted.
   let n=0;for(let i=0;i<files.length;i+=100){await storage("object/"+BUCKET,"DELETE",{prefixes:files.slice(i,i+100)});n+=files.slice(i,i+100).length}
   await db("business_agent_cleanup_requests?user_id=eq."+uid,"PATCH",{status:"completed",deleted_files:n,completed_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()});
   return reply({ok:true,shop_id:shopId,photos_removed:n,order_history_preserved:true,billing_history_preserved:true});
  }catch(e){await db("business_agent_cleanup_requests?user_id=eq."+uid,"PATCH",{status:"failed",last_error:String(e).slice(0,190),updated_at:new Date().toISOString()});throw e}
 }catch(e){return reply({error:"Cleanup could not be completed safely: "+String(e).slice(0,140)},503)}
});
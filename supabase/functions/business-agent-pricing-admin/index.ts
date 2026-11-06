// Business Agent Pricing Admin — protected by existing server-only ADMIN_TOKEN.
// Pricing is shared with monthly checkout; this API never accepts a client-supplied checkout price.
const U=Deno.env.get("SUPABASE_URL")||"",K=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",ADMIN=Deno.env.get("ADMIN_TOKEN")||"";
const origin="https://vibe.racharlagpt.in";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"x-admin-token,content-type,apikey","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store","Vary":"Origin"};
const output=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,"Content-Type":"application/json"}});
const safe=(a:string,b:string)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0};
async function db(path:string,method="GET",body?:unknown){const r=await fetch(U+"/rest/v1/"+path,{method,headers:{apikey:K,...(K.startsWith("sb_")?{}:{Authorization:"Bearer "+K}),"Content-Type":"application/json","Prefer":"return=representation"},body:body===undefined?undefined:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw Error("Database operation failed");return t?JSON.parse(t):null}
const fields="monthly_amount_paise,reference_amount_paise,reference_kind,offer_label,offer_details,offer_ends_at,updated_at,updated_by";
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return output({error:"POST required"},405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return output({error:"Invalid origin"},403);
 if(!ADMIN||!K||!U)return output({error:"Admin pricing is not configured"},503);
 if(!safe(req.headers.get("x-admin-token")||"",ADMIN))return output({error:"Administrator authentication required"},401);
 let body:any;try{const raw=await req.text();if(raw.length>12000)return output({error:"Payload too large"},413);body=JSON.parse(raw)}catch{return output({error:"Invalid JSON"})}
 try{
  if(body.action==="operations_get"||body.action==="operations_update"){
   const rows=await db("business_agent_operations?id=eq.1&select=*");const current=rows?.[0];if(!current)return output({error:"Operations settings unavailable"},503);
   if(body.action==="operations_get")return output({operations:current});
   const retention=Number(body.retention_days),message=String(body.maintenance_message||"").trim();
   if(!Number.isInteger(retention)||retention<60||retention>365)return output({error:"Retention must be 60 to 365 days"},400);
   if(message.length<10||message.length>280)return output({error:"Maintenance message must be 10–280 characters"},400);
   const enabled=["new_enrollment_enabled","renewal_enabled","public_orders_enabled"];
   if(enabled.some(k=>typeof body[k]!=="boolean"))return output({error:"All availability switches must be true or false"},400);
   const changes:any={retention_days:retention,maintenance_message:message,updated_by:"pricing-admin-token",updated_at:new Date().toISOString()};
   for(const k of enabled)changes[k]=body[k];
   const result=await db("business_agent_operations?id=eq.1","PATCH",changes);
   if(!result?.length)return output({error:"Could not update operations"},503);
   return output({ok:true,operations:result[0]});
  }
  const records=await db("business_agent_pricing?id=eq.1&select="+fields);const current=records?.[0];if(!current)return output({error:"Pricing record missing"},503);
  if(body.action==="get")return output({pricing:current});
  if(body.action!=="update")return output({error:"Unknown action"},404);
  const price=Number(body.monthly_amount_paise),reference=Number(body.reference_amount_paise),kind=String(body.reference_kind||"none"),label=String(body.offer_label??"").trim(),details=String(body.offer_details??"").trim();
  if(!Number.isInteger(price)||price<100||price>1000000)return output({error:"Monthly charge must be ₹1–₹10,000"},400);
  if(!Number.isInteger(reference)||reference<100||reference>1000000)return output({error:"Reference rate must be ₹1–₹10,000"},400);
  if(!["planned","former","none"].includes(kind))return output({error:"Invalid reference price label"},400);
  if(kind!=="none"&&reference<=price)return output({error:"Reference rate must be higher than offer rate"},400);
  if(label.length>70||details.length>280)return output({error:"Offer text is too long"},400);
  if(kind==="former"&&body.confirm_former_price_history!==true)return output({error:"Confirm documented actual prior sales at the higher price before using former-price comparison"},400);
  let expiry:string|null=null;
  if(body.offer_ends_at){const date=new Date(body.offer_ends_at);if(!Number.isFinite(date.getTime()))return output({error:"Invalid offer expiration"},400);expiry=date.toISOString()}
  // The public reference price is never charged. Only monthly_amount_paise is used for new Razorpay orders.
  const updatedBy="pricing-admin-token";
  const changed={monthly_amount_paise:price,reference_amount_paise:reference,reference_kind:kind,offer_label:label,offer_details:details,offer_ends_at:expiry,updated_at:new Date().toISOString(),updated_by:updatedBy};
  const result=await db("business_agent_pricing?id=eq.1","PATCH",changed);
  if(!result?.length)return output({error:"Could not update pricing"},503);
  try{await db("business_agent_pricing_audit","POST",{prior_amount_paise:current.monthly_amount_paise,next_amount_paise:price,prior_reference_paise:current.reference_amount_paise,next_reference_paise:reference,prior_reference_kind:current.reference_kind,next_reference_kind:kind,offer_label:label,offer_ends_at:expiry,updated_by:updatedBy})}catch{ /* Successful pricing updates must remain recoverable; audit failure should be monitored. */ }
  return output({ok:true,pricing:result[0],notice:"Only new checkout orders use this price. Previously created orders keep their original amount."});
 }catch{return output({error:"Pricing service temporarily unavailable"},503)}
});
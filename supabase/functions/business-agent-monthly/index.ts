// Racharla Business Agent: subscription and customer orders.
// Isolated from legacy Vibe ₹999 purchases. Server-side secret keys only.
const U=Deno.env.get("SUPABASE_URL")||"",K=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const RZ_ID=Deno.env.get("RAZORPAY_KEY_ID")||"",RZ_SECRET=Deno.env.get("RAZORPAY_KEY_SECRET")||"";
const PLAN=Deno.env.get("BUSINESS_AGENT_RAZORPAY_MONTHLY_PLAN_ID")||"";
const SALES=Deno.env.get("BUSINESS_AGENT_MONTHLY_SALES_ENABLED")==="true";
const ORIGIN="https://vibe.racharlagpt.in";
const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"};
const json=(o:unknown,status=200)=>new Response(JSON.stringify(o),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const error=(m:string,s=400)=>json({error:m},s);
const txt=(v:unknown,max=100)=>String(v??"").trim().slice(0,max);
const eq=(a:string,b:string)=>{if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0};
function auth(req:Request){return(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"")}
async function currentUser(req:Request){const token=auth(req);if(!token)throw Error("AUTH");const r=await fetch(U+"/auth/v1/user",{headers:{"apikey":K,"Authorization":"Bearer "+token}});if(!r.ok)throw Error("AUTH");const u=await r.json();if(!u?.id)throw Error("AUTH");return u}
async function db(path:string,method="GET",body?:unknown,prefer="return=representation"){const res=await fetch(U+"/rest/v1/"+path,{method,headers:{"apikey":K,...(K.startsWith("sb_")?{}:{"Authorization":"Bearer "+K}),"Content-Type":"application/json","Prefer":prefer},body:body===undefined?undefined:JSON.stringify(body)});const t=await res.text();if(!res.ok)throw Error("DB:"+res.status+":"+t.slice(0,220));return t?JSON.parse(t):null}
async function razor(path:string,method="GET",body?:unknown){if(!RZ_ID||!RZ_SECRET)throw Error("Payment provider unavailable");const r=await fetch("https://api.razorpay.com/v1/"+path,{method,headers:{"Authorization":"Basic "+btoa(RZ_ID+":"+RZ_SECRET),"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error("Razorpay: "+txt(j?.error?.description||r.status,130));return j}
async function sig(message:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(RZ_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const b=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(message));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function rows(uid:string){return await db("business_agent_subscriptions?user_id=eq."+encodeURIComponent(uid)+"&select=id,user_id,razorpay_subscription_id,razorpay_plan_id,status,paid_through,cancel_at_cycle_end,created_at&order=created_at.desc&limit=10")||[]}
function active(s:any){return!!(s&&["active","authenticated","cancelled"].includes(s.status)&&s.paid_through&&Date.parse(s.paid_through)>Date.now())}
async function entitlement(uid:string){const list=await rows(uid);if(list.some(active))return {active:true,source:"monthly",subscription:list.find(active)};const old=await db("business_agent_licenses?user_id=eq."+encodeURIComponent(uid)+"&status=eq.active&select=id&limit=1");return {active:!!old?.length,source:old?.length?"legacy":"none",subscription:list[0]||null}}
async function validatePlan(){if(!PLAN||!RZ_ID||!RZ_SECRET)throw Error("The monthly payment plan is not configured");const p=await razor("plans/"+encodeURIComponent(PLAN));if(p?.interval!==1||p?.period!=="monthly"||Number(p?.item?.amount)!==9900||p?.item?.currency!=="INR")throw Error("The payment plan does not match ₹99/month");return p}
async function syncSubscription(u:any,entity:any,confirmed=false){if(!entity?.id||entity.plan_id!==PLAN)throw Error("Subscription plan mismatch");const saved=await db("business_agent_subscriptions?razorpay_subscription_id=eq."+encodeURIComponent(entity.id)+"&user_id=eq."+encodeURIComponent(u.id)+"&select=*&limit=1");
if(!saved?.length)throw Error("Subscription does not belong to this account");
const period=Number(entity.current_end||0)*1000,paidThrough=period>Date.now()?new Date(period).toISOString():null;
const payload:any={status:["created","authenticated","active","pending","halted","paused","cancelled","completed","expired"].includes(entity.status)?entity.status:"pending",last_verified_at:new Date().toISOString()};
if(confirmed&&paidThrough)payload.paid_through=paidThrough;
if(entity.cancel_at_cycle_end===1||entity.cancel_at_cycle_end===true)payload.cancel_at_cycle_end=true;
await db("business_agent_subscriptions?id=eq."+saved[0].id,"PATCH",payload,"return=minimal");
return await entitlement(u.id)}
async function createSub(u:any){if(!SALES)return error("₹99 monthly billing is being verified. Free preview is available.",503);await validatePlan();
const list=await rows(u.id);if(list.some(active))return json({already_active:true});
const existing=list.find(x=>["created","authenticated","pending"].includes(x.status));
if(existing){const e=await razor("subscriptions/"+encodeURIComponent(existing.razorpay_subscription_id));if(["created","authenticated","pending"].includes(e.status))return json({subscription_id:e.id,key_id:RZ_ID,amount:9900,currency:"INR",reused:true})}
const sub=await razor("subscriptions","POST",{plan_id:PLAN,total_count:120,quantity:1,customer_notify:1,notes:{product:"racharla_business_agent_monthly",vendor_id:u.id}});
await db("business_agent_subscriptions","POST",{user_id:u.id,razorpay_subscription_id:sub.id,razorpay_plan_id:PLAN,status:"created"});
return json({subscription_id:sub.id,key_id:RZ_ID,amount:9900,currency:"INR"})}
async function confirmSub(u:any,body:any){const subId=txt(body.razorpay_subscription_id,100),payId=txt(body.razorpay_payment_id,100),signature=txt(body.razorpay_signature,200);
if(!subId||!payId||!signature||!eq(await sig(payId+"|"+subId),signature))return error("Invalid subscription payment signature",400);
const payment=await razor("payments/"+encodeURIComponent(payId));if(payment.status!=="captured"||Number(payment.amount)!==9900||payment.currency!=="INR"||payment.subscription_id!==subId)return error("₹99 subscription payment is not captured",409);
const sub=await razor("subscriptions/"+encodeURIComponent(subId));const result=await syncSubscription(u,sub,true);await db("business_agent_subscriptions?user_id=eq."+encodeURIComponent(u.id)+"&razorpay_subscription_id=eq."+encodeURIComponent(subId),"PATCH",{last_payment_id:payId},"return=minimal");return json({active:result.active,paid_through:result.subscription?.paid_through||null})}
async function cancelSub(u:any){const list=await rows(u.id);const match=list.find(x=>["active","authenticated","pending","created"].includes(x.status)&&!x.cancel_at_cycle_end);if(!match)return error("No active auto-renewal to cancel",409);
const sub=await razor("subscriptions/"+encodeURIComponent(match.razorpay_subscription_id)+"/cancel","POST",{cancel_at_cycle_end:1});
await db("business_agent_subscriptions?id=eq."+match.id,"PATCH",{cancel_at_cycle_end:true,updated_at:new Date().toISOString(),status:sub.status||match.status},"return=minimal");
return json({ok:true,paid_through:match.paid_through,notice:"Auto-renewal cancelled. Your catalog stays saved. Public ordering continues until the paid period ends."})}
async function listOrders(u:any){const auth=await entitlement(u.id);const out=await db("business_agent_customer_orders?user_id=eq."+encodeURIComponent(u.id)+"&select=id,order_number,customer_name,customer_phone,delivery_address,fulfillment,payment_method,items,amount_paise,note,status,payment_status,created_at&order=created_at.desc&limit=100");
return json({active:auth.active,orders:out||[]})}
async function updateOrder(u:any,body:any){const id=txt(body.id,80);if(!/^[a-f0-9-]{36}$/i.test(id))return error("Invalid order ID");
const payload:any={updated_at:new Date().toISOString()};if(body.status!==undefined){if(!["awaiting_confirmation","accepted","packed","ready","out_for_delivery","completed","cancelled"].includes(body.status))return error("Invalid order status");payload.status=body.status}
if(body.payment_status!==undefined){if(!["unverified","verified","pay_on_collection","refunded"].includes(body.payment_status))return error("Invalid payment status");payload.payment_status=body.payment_status}
if(Object.keys(payload).length===1)return error("Nothing to change");
const r=await db("business_agent_customer_orders?id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(u.id),"PATCH",payload);
if(!r?.length)return error("Order not found",404);return json({order:r[0]})}
async function placeOrder(req:Request,d:any){
const slug=txt(d.slug,70).toLowerCase();if(!/^[a-z0-9-]{3,70}$/.test(slug))return error("Invalid shop");
const shops=await db("business_agent_shops?slug=eq."+encodeURIComponent(slug)+"&published=eq.true&select=id,user_id,shop_data&limit=1");const shop=shops?.[0];if(!shop)return error("Shop unavailable",404);
const ent=await entitlement(shop.user_id);if(!ent.active)return error("Shop ordering is paused. Contact the merchant directly.",402);
const sd=shop.shop_data||{},fulfillment=txt(d.fulfillment,25),payment=txt(d.payment_method,30);
if(!["pickup","delivery","appointment"].includes(fulfillment)||!sd[fulfillment])return error("Fulfillment not available");
const payOk=payment==="cash_pickup"&&fulfillment==="pickup"&&sd.cashPickup||payment==="cash_delivery"&&fulfillment==="delivery"&&sd.cashDelivery||payment==="upi"&&sd.directUpi||payment==="qr"&&sd.showQr||payment==="confirm"&&fulfillment==="appointment";if(!payOk)return error("Selected payment method unavailable");
const delivery=txt(d.delivery_address,280);if(fulfillment==="delivery"&&delivery.length<8)return error("Enter a complete delivery address");
const input=Array.isArray(d.items)?d.items:[];if(!input.length||input.length>60)return error("Select 1–60 items");
const catalog=new Map((Array.isArray(sd.products)?sd.products:[]).map((p:any)=>[String(p.id),p]));let total=0;const cleaned:any[]=[];
for(const item of input){const p:any=catalog.get(String(item.id));const qty=Number(item.qty);
if(!p||p.available===false||p.stock===0||!Number.isInteger(qty)||qty<1||qty>100||p.stock!=null&&qty>Number(p.stock))return error("Item no longer available or quantity changed. Refresh your shop.",409);
if(cleaned.some(x=>x.id===String(item.id)))return error("Duplicate items",400);
const price=Number(p.price);if(!Number.isFinite(price)||price<0||price>1000000)return error("Invalid catalog price");
const line=Math.round(price*100)*qty;total+=line;cleaned.push({id:String(p.id),name:txt(p.name,100),unit:txt(p.unit,30),qty,unit_price_paise:Math.round(price*100),line_paise:line});}
if(total>100000000)return error("Order total too high");
if(Number(d.expected_total_paise)!==total)return error("Prices changed. Refresh the shop before ordering.",409);
const token=txt(d.client_token,60);if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(token))return error("Invalid request identifier");
const ip=txt(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown",100);const hashRaw=new TextEncoder().encode(ip+":"+slug);
const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",hashRaw))).map(b=>b.toString(16).padStart(2,"0")).join("");
const prior=await db("business_agent_customer_orders?shop_id=eq."+shop.id+"&client_token=eq."+encodeURIComponent(token)+"&select=order_number,amount_paise&limit=1");if(prior?.length)return json({order_number:prior[0].order_number,amount_paise:prior[0].amount_paise,reused:true});
const windowTime=new Date(Date.now()-600000).toISOString();const limited=await db("business_agent_customer_orders?shop_id=eq."+shop.id+"&source_hash=eq."+hash+"&created_at=gte."+encodeURIComponent(windowTime)+"&select=id&limit=6");if((limited||[]).length>=5)return error("Too many order requests. Please try later.",429);
const payload={shop_id:shop.id,user_id:shop.user_id,customer_name:txt(d.customer_name,100),customer_phone:txt(d.customer_phone,20).replace(/[^\d+]/g,""),delivery_address:delivery,fulfillment,payment_method:payment,items:cleaned,amount_paise:total,currency:"INR",note:txt(d.note,300),status:"awaiting_confirmation",payment_status:"unverified",client_token:token,source_hash:hash};
try{const out=await db("business_agent_customer_orders","POST",payload);return json({order_number:out[0].order_number,amount_paise:total})}
catch(e){if(String(e).includes("23505")){const again=await db("business_agent_customer_orders?shop_id=eq."+shop.id+"&client_token=eq."+encodeURIComponent(token)+"&select=order_number,amount_paise&limit=1");if(again?.length)return json({order_number:again[0].order_number,amount_paise:again[0].amount_paise,reused:true})}throw e}
}
Deno.serve(async req=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return error("POST required",405);
if(req.headers.get("Origin")&&req.headers.get("Origin")!==ORIGIN)return error("Origin not allowed",403);
if(!U||!K)return error("Service unavailable",503);
let b:any;try{const raw=await req.text();if(raw.length>100000)return error("Payload too large",413);b=JSON.parse(raw)}catch{return error("Invalid JSON")}
try{if(b.action==="place_order")return await placeOrder(req,b);const user=await currentUser(req);
if(b.action==="me"){const e=await entitlement(user.id);return json({active:e.active,source:e.source,monthly_sales_enabled:SALES,subscription:e.subscription,price_paise:9900})}
if(b.action==="subscribe")return createSub(user);
if(b.action==="confirm")return confirmSub(user,b);
if(b.action==="cancel")return cancelSub(user);
if(b.action==="orders")return listOrders(user);
if(b.action==="update_order")return updateOrder(user,b);
return error("Unknown action",404)}
catch(e){const msg=e instanceof Error?e.message:"Unexpected error";if(msg==="AUTH")return error("Please sign in",401);if(msg.startsWith("DB:"))return error("Database service could not complete this request",503);return error(msg,400)}
});

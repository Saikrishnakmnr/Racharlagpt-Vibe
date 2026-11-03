// Racharla Business Agent API — isolated from legacy Vibe orders.
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET.
// Every credential remains server-side. No public function may access private tables without its own checks.
const U=Deno.env.get("SUPABASE_URL")||"",K=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const RK=Deno.env.get("RAZORPAY_KEY_ID")||"",RS=Deno.env.get("RAZORPAY_KEY_SECRET")||"";
const ORIGIN="https://vibe.racharlagpt.in";
const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin"};
const output=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
function fail(message:string,status=400){return output({error:message},status)}
function clean(s:unknown,max=150){return String(s??"").trim().slice(0,max)}
function slug(s:unknown){return clean(s,70).toLowerCase()}
function authHeader(req:Request){return req.headers.get("Authorization")||""}
async function user(req:Request){let t=authHeader(req).replace(/^Bearer\s+/i,"");if(!t)throw Error("AUTH");let r=await fetch(U+"/auth/v1/user",{headers:{"apikey":K,"Authorization":"Bearer "+t}});if(!r.ok)throw Error("AUTH");const v=await r.json();if(!v?.id)throw Error("AUTH");return v}
async function db(path:string,init:RequestInit={}){let r=await fetch(U+"/rest/v1/"+path,{...init,headers:{"apikey":K,...(K.startsWith("sb_")?{}:{"Authorization":"Bearer "+K}),"Content-Type":"application/json",...(init.headers||{})}});let t=await r.text();if(!r.ok)throw Error("DB:"+r.status+":"+t.slice(0,300));return t?JSON.parse(t):null}
async function patch(path:string,body:unknown){return db(path,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify(body)})}
async function post(path:string,body:unknown,prefer="return=representation"){return db(path,{method:"POST",headers:{"Prefer":prefer},body:JSON.stringify(body)})}
function rzpHeaders(){return {"Authorization":"Basic "+btoa(RK+":"+RS),"Content-Type":"application/json"}}
async function razorpay(path:string,init:RequestInit={}){let r=await fetch("https://api.razorpay.com/v1/"+path,{...init,headers:{...rzpHeaders(),...(init.headers||{})}});let j=await r.json();if(!r.ok)throw Error("RZP:"+String(j?.error?.description||r.status));return j}
async function hmac(msg:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(RS),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(msg)))).map(x=>x.toString(16).padStart(2,"0")).join("")}
function constantTime(a:string,b:string){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function purchases(uid:string){return await db("business_agent_purchases?user_id=eq."+encodeURIComponent(uid)+"&select=id,razorpay_order_id,razorpay_payment_id,status,created_at&order=created_at.desc&limit=20")||[]}
async function license(uid:string){const r=await db("business_agent_licenses?user_id=eq."+encodeURIComponent(uid)+"&select=id,status,purchase_id&limit=1");return r?.[0]||null}
async function activate(p:any,pay:any){if(pay.order_id!==p.razorpay_order_id||pay.status!=="captured"||pay.amount!==99900||pay.currency!=="INR")throw Error("Payment verification did not match purchase");
 if(p.status==="refunded"||p.status==="failed")throw Error("Purchase is not eligible for activation");
 const l=await license(p.user_id);
 if(l?.status==="revoked")throw Error("This account is restricted; contact support");
 await patch("business_agent_purchases?id=eq."+encodeURIComponent(p.id)+"&status=eq.created",{status:"captured",razorpay_payment_id:pay.id,captured_at:new Date().toISOString(),updated_at:new Date().toISOString()});
 if(!l){
   try {await post("business_agent_licenses",{user_id:p.user_id,purchase_id:p.id,status:"active"});}
   catch(e){const again=await license(p.user_id);if(!again||again.status!=="active")throw e;}
 }
 return await license(p.user_id);
}
async function reconcile(uid:string){const ps=await purchases(uid);for(const p of ps){if(p.status!=="created")continue;const ids=await razorpay("orders/"+encodeURIComponent(p.razorpay_order_id)+"/payments");const captured=(ids.items||[]).find((x:any)=>x.status==="captured"&&x.order_id===p.razorpay_order_id&&x.amount===99900&&x.currency==="INR");if(captured){await activate({...p,user_id:uid},captured);break}}}
function normalizeShop(d:any,ownerId:string){if(!d||typeof d!=="object"||Array.isArray(d))throw Error("Invalid shop data");
 const name=clean(d.name,90);if(name.length<2)throw Error("Enter your business name");
 const phone=clean(d.phone,25).replace(/[^\d]/g,"");if(!/^\d{8,15}$/.test(phone))throw Error("Enter WhatsApp country code and number");
 const currency=clean(d.currency||"INR",3).toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error("Invalid currency");
 const pickup=!!d.pickup,delivery=!!d.delivery,appointment=!!d.appointment;if(!pickup&&!delivery&&!appointment)throw Error("Enable pickup, delivery or appointment enquiries");
 const cashPickup=pickup&&!!d.cashPickup,cashDelivery=delivery&&!!d.cashDelivery,directUpi=currency==="INR"&&!!d.directUpi,showQr=currency==="INR"&&!!d.showQr;const upi=currency==="INR"?clean(d.upi,120):"";const merchantQr=(typeof d.merchantQr==="string"&&d.merchantQr.startsWith(U+"/storage/v1/object/public/business-agent-images/"+ownerId+"/")&&d.merchantQr.length<1200)?d.merchantQr:"";if(directUpi&&!/^[a-zA-Z0-9._-]{2,100}@[a-zA-Z0-9.-]{2,60}$/.test(upi))throw Error("Enter a valid UPI ID");if(showQr&&!merchantQr)throw Error("Upload your shop QR image before publishing");
 if(!cashPickup&&!cashDelivery&&!directUpi&&!showQr&&!appointment)throw Error("Enable at least one payment method or enquiry mode");
 const allowed=["vegetables","kirana","meat","restaurant","bakery","salon","photography","wholesale","electronics","general"];const model=allowed.includes(d.model)?d.model:"general";
 const src=Array.isArray(d.products)?d.products:[];if(src.length>200)throw Error("Maximum 200 products per shop");
 const products=src.map((p:any,i:number)=>({id:clean(p.id||"item-"+i,100),name:clean(p.name,100),category:clean(p.category,60),unit:clean(p.unit,30),price:Number(p.price),stock:(p.stock===null||p.stock===undefined||p.stock==="")?null:Number(p.stock),available:p.available!==false&&p.stock!==0,image:(typeof p.image==="string"&&/^https:\/\//.test(p.image)&&p.image.length<1200)?p.image:""}));
 if(products.some((p:any)=>!p.name||!Number.isFinite(p.price)||p.price<0||p.price>10000000||(p.stock!==null&&(!Number.isInteger(p.stock)||p.stock<0||p.stock>999999))))throw Error("Invalid product price or stock");
 return {name,phone,currency,model,idea:clean(d.idea,700),kind:clean(d.kind,30),address:clean(d.address,300),tagline:clean(d.tagline,160),about:clean(d.about,1000),upi,merchantQr,showQr,pickup,delivery,appointment,cashPickup,cashDelivery,directUpi,products};
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return fail("Use POST",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==ORIGIN)return fail("Origin not allowed",403);
 if(!U||!K)return fail("Service configuration unavailable",503);
 let body:any={};try{let raw=await req.text();if(raw.length>160000)return fail("Payload too large",413);body=JSON.parse(raw||"{}")}catch{return fail("Invalid JSON")}
 const action=String(body.action||"");
 try {
  if(action==="public"){const s=slug(body.slug);if(!/^[a-z0-9-]{3,70}$/.test(s))return fail("Invalid shop",400);const rows=await db("business_agent_shops?slug=eq."+encodeURIComponent(s)+"&published=eq.true&select=slug,shop_data&limit=1");if(!rows?.length)return fail("Shop not found",404);return output({shop:rows[0].shop_data,slug:s})}
  const u=await user(req);
  if(action==="me"){const l=await license(u.id);const rows=l?.status==="active"?await db("business_agent_shops?user_id=eq."+encodeURIComponent(u.id)+"&select=slug,published,shop_data&limit=1"):[];return output({licensed:l?.status==="active",sales_enabled:Deno.env.get("BUSINESS_AGENT_SALES_ENABLED")==="true",shop:rows?.[0]||null,user_email:u.email||null})}
  if(action==="checkout"){
   if(Deno.env.get("BUSINESS_AGENT_SALES_ENABLED")!=="true")return fail("Sales are not live yet. Please use the free preview.",503);
   if(!RK||!RS)return fail("Checkout is not enabled",503);
   let l=await license(u.id);if(l?.status==="active")return output({already_licensed:true});
   if(l?.status==="revoked")return fail("Account requires a support review",403);
   await reconcile(u.id);if((await license(u.id))?.status==="active")return output({already_licensed:true});
   const ps=await purchases(u.id);for(const p of ps){if(p.status==="created"){let order=await razorpay("orders/"+encodeURIComponent(p.razorpay_order_id));if(order.amount===99900&&order.currency==="INR"&&order.status!=="paid")return output({id:order.id,amount:99900,currency:"INR",key_id:RK,reused:true});}}
   const order=await razorpay("orders",{method:"POST",body:JSON.stringify({amount:99900,currency:"INR",receipt:"rba_"+crypto.randomUUID().replaceAll("-","").slice(0,30),notes:{product:"business_agent"}})});
   await post("business_agent_purchases",{user_id:u.id,razorpay_order_id:order.id,amount_paise:99900,currency:"INR",status:"created"});
   return output({id:order.id,amount:99900,currency:"INR",key_id:RK});
  }
  if(action==="verify"){
   if(!RS)return fail("Payment verification unavailable",503);
   const oid=clean(body.razorpay_order_id,100),pid=clean(body.razorpay_payment_id,100),sig=clean(body.razorpay_signature,200);
   if(!oid||!pid||!sig||!constantTime(await hmac(oid+"|"+pid),sig))return fail("Payment signature invalid",400);
   const rows=await db("business_agent_purchases?razorpay_order_id=eq."+encodeURIComponent(oid)+"&user_id=eq."+encodeURIComponent(u.id)+"&select=*&limit=1");
   if(!rows?.length)return fail("Order not found",404);
   const p=rows[0],pay=await razorpay("payments/"+encodeURIComponent(pid));
   const l=await activate(p,pay);return output({licensed:l?.status==="active"});
  }
  if(action==="recover"){
   if(!RK||!RS)return fail("Payment recovery unavailable",503);
   await reconcile(u.id);return output({licensed:(await license(u.id))?.status==="active"});
  }
  if(action==="save"){
   const l=await license(u.id);if(l?.status!=="active")return fail("Paid active license required",403);
   const shop=normalizeShop(body.shop,u.id);
   let s=slug(body.slug||shop.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
   if(!/^[a-z0-9-]{3,70}$/.test(s))return fail("Use a valid shop URL slug",400);
   let existing=await db("business_agent_shops?user_id=eq."+encodeURIComponent(u.id)+"&select=id,slug&limit=1");
   let published=body.published===true;
   if(existing?.length){await patch("business_agent_shops?id=eq."+encodeURIComponent(existing[0].id)+"&user_id=eq."+encodeURIComponent(u.id),{slug:s,shop_data:shop,published,updated_at:new Date().toISOString()})}
   else await post("business_agent_shops",{user_id:u.id,license_id:l.id,slug:s,shop_data:shop,published});
   return output({ok:true,slug:s,published});
  }
  return fail("Unknown action",404);
 }catch(e){const msg=e instanceof Error?e.message:"Unexpected error";if(msg==="AUTH")return fail("Please sign in",401);if(msg.startsWith("RZP:"))return fail("Payment provider unavailable; please retry or recover an existing purchase",502);if(msg.startsWith("DB:")&&msg.includes("23505"))return fail("Shop URL already taken. Choose another",409);return fail(msg.startsWith("DB:")?"Data operation failed. Please retry.":msg,400)}
});

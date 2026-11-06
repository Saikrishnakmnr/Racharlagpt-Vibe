// Racharla Business Agent monthly hosted commerce API: ₹99 prepaid for one calendar month.
// Legacy Vibe products and the former ₹999 tables are not modified by payment actions.
// Client never receives Razorpay secrets or Supabase service keys.
const U=Deno.env.get("SUPABASE_URL")||"",K=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const RK=Deno.env.get("RAZORPAY_KEY_ID")||"",RS=Deno.env.get("RAZORPAY_KEY_SECRET")||"";
const ORIGIN="https://vibe.racharlagpt.in";
const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin","Cache-Control":"no-store"};
const respond=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...cors,"Content-Type":"application/json"}});
const err=(msg:string,status=400)=>respond({error:msg},status);
const clean=(s:unknown,n=120)=>String(s??"").trim().slice(0,n);
const slug=(s:unknown)=>clean(s,70).toLowerCase();
const esc=(s:string)=>s.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
async function db(path:string,init:RequestInit={}){const r=await fetch(U+"/rest/v1/"+path,{...init,headers:{"apikey":K,...(K.startsWith("sb_")?{}:{"Authorization":"Bearer "+K}),"Content-Type":"application/json",...(init.headers||{})}});const raw=await r.text();if(!r.ok)throw Error("DB:"+r.status+":"+raw.slice(0,140));return raw?JSON.parse(raw):null}
const post=(path:string,data:unknown)=>db(path,{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify(data)});
const patch=(path:string,data:unknown)=>db(path,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify(data)});
async function user(req:Request){const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");if(!token)throw Error("AUTH");const r=await fetch(U+"/auth/v1/user",{headers:{"apikey":K,Authorization:"Bearer "+token}});if(!r.ok)throw Error("AUTH");const j=await r.json();if(!j.id)throw Error("AUTH");return j}
const rpAuth=()=>({Authorization:"Basic "+btoa(RK+":"+RS),"Content-Type":"application/json"});
async function razorpay(path:string,init:RequestInit={}){if(!RK||!RS)throw Error("Payment provider is not configured");const r=await fetch("https://api.razorpay.com/v1/"+path,{...init,headers:{...rpAuth(),...(init.headers||{})}});const j=await r.json();if(!r.ok)throw Error("Payment provider could not complete request");return j}
async function hmac(message:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(RS),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return [...new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message)))].map(x=>x.toString(16).padStart(2,"0")).join("")}
function same(a:string,b:string){if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0}
async function entitlement(uid:string){
 const [mon,legacy]=await Promise.all([
  db("business_agent_monthly_accounts?user_id=eq."+encodeURIComponent(uid)+"&select=paid_through&limit=1"),
  db("business_agent_licenses?user_id=eq."+encodeURIComponent(uid)+"&status=eq.active&select=id&limit=1")
 ]);
 const until=mon?.[0]?.paid_through||null;
 return {active:!!legacy?.length||!!(until&&new Date(until).getTime()>Date.now()),paid_through:until,legacy:!!legacy?.length}
}
async function bought(uid:string){return db("business_agent_monthly_purchases?user_id=eq."+encodeURIComponent(uid)+"&select=id,user_id,razorpay_order_id,razorpay_payment_id,status,created_at,period_end&order=created_at.desc&limit=30")}
async function activate(order:string,payment:string){
 const purchases=await db("business_agent_monthly_purchases?razorpay_order_id=eq."+encodeURIComponent(order)+"&select=*&limit=1");const p=purchases?.[0];if(!p)throw Error("Order does not belong to Business Agent");
 const x=await razorpay("payments/"+encodeURIComponent(payment));
 if(x.order_id!==order||x.id!==payment||x.status!=="captured"||x.amount!==9900||x.currency!=="INR")throw Error("Payment capture did not match ₹99 plan");
 const v=await post("rpc/business_agent_activate_month",{p_order_id:order,p_payment_id:payment});
 return v;
}
async function recover(uid:string){
 const ps=await bought(uid);
 for(const p of ps||[]){if(p.status!=="created")continue;
  const r=await razorpay("orders/"+encodeURIComponent(p.razorpay_order_id)+"/payments");
  for(const pay of r.items||[]){if(pay.status==="captured"&&pay.amount===9900&&pay.currency==="INR"&&pay.order_id===p.razorpay_order_id){await activate(p.razorpay_order_id,pay.id);break}}
 }
 return entitlement(uid);
}
async function shopForSlug(s:string){
 const rows=await db("business_agent_shops?slug=eq."+encodeURIComponent(s)+"&published=eq.true&select=id,user_id,slug,shop_data&limit=1");
 const shop=rows?.[0];if(!shop)return null;
 const license=await entitlement(shop.user_id);if(!license.active)return null;return shop;
}
function normalizeShop(d:any,ownerId:string){if(!d||typeof d!=="object"||Array.isArray(d))throw Error("Invalid shop data");
 const name=clean(d.name,90);if(name.length<2)throw Error("Enter your business name");
 const address=clean(d.address,300);if(address.length<12)throw Error("Enter a full shop address customers can find");
 const bannerImage=(typeof d.bannerImage==="string"&&d.bannerImage.startsWith(U+"/storage/v1/object/public/business-agent-images/"+ownerId+"/")&&d.bannerImage.length<1200)?d.bannerImage:"";
 const phone=clean(d.phone,25).replace(/[^\d]/g,"");if(!/^\d{8,15}$/.test(phone))throw Error("Enter WhatsApp country code and number");
 const currency=clean(d.currency||"INR",3).toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error("Invalid currency");
 const pickup=!!d.pickup,delivery=!!d.delivery,appointment=!!d.appointment;const deliveryFee=delivery?Number(d.deliveryFee||0):0;if(!Number.isFinite(deliveryFee)||deliveryFee<0||deliveryFee>10000)throw Error("Delivery charge must be between ₹0 and ₹10,000");if(!pickup&&!delivery&&!appointment)throw Error("Enable pickup, delivery or appointment enquiries");
 const cashPickup=pickup&&!!d.cashPickup,cashDelivery=delivery&&!!d.cashDelivery,directUpi=currency==="INR"&&!!d.directUpi,showQr=currency==="INR"&&!!d.showQr;const upi=currency==="INR"?clean(d.upi,120):"";const merchantQr=(typeof d.merchantQr==="string"&&d.merchantQr.startsWith(U+"/storage/v1/object/public/business-agent-images/"+ownerId+"/")&&d.merchantQr.length<1200)?d.merchantQr:"";if(directUpi&&!/^[a-zA-Z0-9._-]{2,100}@[a-zA-Z0-9.-]{2,60}$/.test(upi))throw Error("Enter a valid UPI ID");if(showQr&&!merchantQr)throw Error("Upload your shop QR image before publishing");
 if(!cashPickup&&!cashDelivery&&!directUpi&&!showQr&&!appointment)throw Error("Enable at least one payment method or enquiry mode");
 const allowed=["vegetables","kirana","meat","restaurant","bakery","salon","photography","wholesale","electronics","general"];const model=allowed.includes(d.model)?d.model:"general";
 const src=Array.isArray(d.products)?d.products:[];if(src.length>200)throw Error("Maximum 200 products per shop");
 const products=src.map((p:any,i:number)=>({id:clean(p.id||"item-"+i,100),name:clean(p.name,100),category:clean(p.category,60),unit:clean(p.unit,30),price:Number(p.price),stock:(p.stock===null||p.stock===undefined||p.stock==="")?null:Number(p.stock),available:p.available!==false&&p.stock!==0,image:(typeof p.image==="string"&&/^https:\/\//.test(p.image)&&p.image.length<1200)?p.image:""}));
 if(products.some((p:any)=>!p.name||!Number.isFinite(p.price)||p.price<0||p.price>10000000||(p.stock!==null&&(!Number.isInteger(p.stock)||p.stock<0||p.stock>999999))))throw Error("Invalid product price or stock");
 return {name,phone,currency,model,idea:clean(d.idea,700),kind:clean(d.kind,30),address,bannerImage,tagline:clean(d.tagline,160),about:clean(d.about,1000),offerText:clean(d.offerText,240),upi,merchantQr,showQr,pickup,delivery,deliveryFee,appointment,cashPickup,cashDelivery,directUpi,products};
}

function itemQty(p:any){const n=Number(p.qty);if(!Number.isInteger(n)||n<1||n>50)throw Error("Choose 1–50 units per product");return n}
function calculate(shop:any,items:any[]){
 if(!Array.isArray(items)||items.length<1||items.length>50)throw Error("Select products");
 const products=Array.isArray(shop.products)?shop.products:[],seen=new Set<string>();let sum=0;const found=[];
 for(const item of items){const id=clean(item.id,100),qty=itemQty(item);if(seen.has(id))throw Error("Duplicate product");seen.add(id);
  const p=products.find((x:any)=>x.id===id);if(!p||p.available===false||p.stock===0)throw Error("An item is sold out. Refresh your cart.");
  if(p.stock!=null&&qty>Number(p.stock))throw Error("Selected quantity exceeds stock. Refresh your cart.");
  const price=Math.round(Number(p.price)*100);if(!Number.isSafeInteger(price)||price<0)throw Error("Invalid shop price");
  found.push({id,name:clean(p.name,100),qty,unit:clean(p.unit,30),price_paise:price,subtotal_paise:price*qty});
  sum+=price*qty;
 }
 if(!Number.isSafeInteger(sum))throw Error("Invalid cart");
 return {items:found,total:sum};
}
const statuses=new Set(["awaiting_confirmation","accepted","packed","ready","out_for_delivery","completed","cancelled"]);
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return err("POST required",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==ORIGIN)return err("Origin not allowed",403);
 if(!U||!K)return err("Service unavailable",503);
 let data:any;try{const s=await req.text();if(s.length>160000)return err("Request too large",413);data=JSON.parse(s||"{}")}catch{return err("Invalid JSON")}
 try{
  const action=clean(data.action,40);
  if(action==="public"){
   const s=slug(data.slug);if(!/^[a-z0-9-]{3,70}$/.test(s))return err("Invalid shop URL");
   const shop=await shopForSlug(s);return shop?respond({slug:s,shop:shop.shop_data}):err("Shop unavailable or awaiting renewal",404);
  }
  if(action==="order"){
   if(!data.consent)return err("Customer consent required for order details",400);
   const s=slug(data.slug);if(!/^[a-z0-9-]{3,70}$/.test(s))return err("Invalid shop");
   const row=await shopForSlug(s);if(!row)return err("Shop unavailable or awaiting renewal",404);
   const shop=row.shop_data,fulfillment=clean(data.fulfillment,30),pay=clean(data.payment_method,30);
   if(!["pickup","delivery","appointment"].includes(fulfillment)||!shop[fulfillment])return err("Fulfilment option unavailable");
   if(!["cash_pickup","cash_delivery","upi","qr","confirm"].includes(pay))return err("Invalid payment option");
   if(pay==="cash_pickup"&&(!shop.pickup||!shop.cashPickup||fulfillment!=="pickup"))return err("Cash pickup unavailable");
   if(pay==="cash_delivery"&&(!shop.delivery||!shop.cashDelivery||fulfillment!=="delivery"))return err("Cash delivery unavailable");
   if(pay==="upi"&&(!shop.directUpi||!shop.upi))return err("UPI unavailable");
   if(pay==="qr"&&(!shop.showQr||!shop.merchantQr))return err("QR unavailable");
   if(pay==="confirm"&&fulfillment!=="appointment")return err("Payment discussion is available for enquiries");
   const customer=clean(data.customer_name,90),phone=clean(data.customer_phone,25).replace(/\D/g,"");
   if(customer.length<2||!/^\d{8,15}$/.test(phone))return err("Enter your name and mobile number");
   const address=clean(data.delivery_address,350);if(fulfillment==="delivery"&&address.length<10)return err("Enter your delivery address");
   const note=clean(data.note,350),cart=calculate(shop,data.items);
   if(shop.currency!=="INR")return err("Hosted checkout currently supports INR shops");
   const fee=fulfillment==="delivery"?Math.round(Number(shop.deliveryFee||0)*100):0;
   const total=cart.total+fee;
   if(!Number.isSafeInteger(total)||total<0||total>1000000000)return err("Invalid order total");
   if(Number(data.expected_total_paise)!==total)return err("Prices or delivery fees changed. Refresh and review your cart.",409);
   const clientToken=clean(data.client_token,50);if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(clientToken))return err("Invalid order request. Refresh the shop.",400);
   const fmt=(n:number)=>"₹"+(n/100).toFixed(2);
   function orderResponse(orderNumber:number){
     const ref="BA-"+String(orderNumber).padStart(7,"0");
     const lines=["Hello "+shop.name+",","Order reference: "+ref,"Customer: "+customer,"Phone: "+phone,"Items:",...cart.items.map((p:any,i:number)=>String(i+1)+". "+p.name+" × "+p.qty+" "+p.unit+" — "+fmt(p.subtotal_paise)),"Items: "+fmt(cart.total),...(fee?["Delivery fee: "+fmt(fee)]:[]),"Estimated total: "+fmt(total),"Fulfilment: "+fulfillment,"Payment choice: "+pay,...(fulfillment==="delivery"?["Delivery address: "+address]:[]),...(note?["Note: "+note]:[]),"Please confirm stock, final amount and order acceptance. No payment has been automatically verified."];
     return respond({order_ref:ref,whatsapp_url:"https://wa.me/"+shop.phone+"?text="+encodeURIComponent(lines.join("\n")),amount_paise:total,status:"awaiting_confirmation"});
   }
   const prior=await db("business_agent_customer_orders?shop_id=eq."+row.id+"&client_token=eq."+encodeURIComponent(clientToken)+"&select=order_number,amount_paise,customer_phone&limit=1");
   if(prior?.length){if(prior[0].customer_phone!==phone||Number(prior[0].amount_paise)!==total)return err("Order data has changed. Start a new order.",409);return orderResponse(prior[0].order_number)}
   const since=new Date(Date.now()-3600000).toISOString();
   const duplicates=await db("business_agent_customer_orders?shop_id=eq."+row.id+"&customer_phone=eq."+encodeURIComponent(phone)+"&created_at=gte."+encodeURIComponent(since)+"&select=id&limit=9");
   if((duplicates||[]).length>=8)return err("Too many orders. Please contact the seller directly.",429);
   let order:any;
   try{const inserted=await post("business_agent_customer_orders",{shop_id:row.id,user_id:row.user_id,customer_name:customer,customer_phone:phone,delivery_address:fulfillment==="delivery"?address:"",fulfillment,payment_method:pay,items:cart.items,amount_paise:total,currency:"INR",note,status:"awaiting_confirmation",payment_status:"unverified",client_token:clientToken});order=inserted?.[0]}
   catch(e){if(!String(e).includes("23505"))throw e;const retry=await db("business_agent_customer_orders?shop_id=eq."+row.id+"&client_token=eq."+encodeURIComponent(clientToken)+"&select=order_number,amount_paise,customer_phone&limit=1");if(!retry?.length||retry[0].customer_phone!==phone||Number(retry[0].amount_paise)!==total)throw e;order=retry[0]}
   if(!order)return err("Could not record order",500);
   return orderResponse(order.order_number);
  }
  const u=await user(req);
  if(action==="me"){
   const ent=await entitlement(u.id);
   const shops=await db("business_agent_shops?user_id=eq."+encodeURIComponent(u.id)+"&select=id,slug,published,shop_data&limit=1");
   return respond({licensed:ent.active,paid_through:ent.paid_through,legacy:ent.legacy,sales_enabled:Deno.env.get("BUSINESS_AGENT_MONTHLY_SALES_ENABLED")==="true",shop:shops?.[0]||null,user_email:u.email||null,price_paise:9900,renewal_mode:"manual_prepaid"});
  }
  if(action==="checkout"){
   if(Deno.env.get("BUSINESS_AGENT_MONTHLY_SALES_ENABLED")!=="true")return err("₹99 monthly checkout is being tested. No payment is being taken.",503);
   if(!RK||!RS)return err("Checkout configuration unavailable",503);
   await recover(u.id);
   const purchases=await bought(u.id);
   for(const p of purchases||[]){if(p.status!=="created")continue;const o=await razorpay("orders/"+encodeURIComponent(p.razorpay_order_id));if(o.amount===9900&&o.currency==="INR"&&o.status!=="paid")return respond({id:o.id,key_id:RK,currency:"INR",amount:9900,reused:true})}
   const order=await razorpay("orders",{method:"POST",body:JSON.stringify({amount:9900,currency:"INR",receipt:"bam_"+crypto.randomUUID().replaceAll("-","").slice(0,30),notes:{product:"business_agent_monthly",months:"1"}})});
   await post("business_agent_monthly_purchases",{user_id:u.id,razorpay_order_id:order.id,amount_paise:9900,currency:"INR",status:"created"});
   return respond({id:order.id,key_id:RK,currency:"INR",amount:9900});
  }
  if(action==="verify"){
   if(!RS)return err("Verification unavailable",503);
   const id=clean(data.razorpay_order_id,110),pid=clean(data.razorpay_payment_id,110),sig=clean(data.razorpay_signature,200);
   if(!id||!pid||!sig||!same(await hmac(id+"|"+pid),sig))return err("Invalid payment signature",400);
   const orders=await db("business_agent_monthly_purchases?user_id=eq."+encodeURIComponent(u.id)+"&razorpay_order_id=eq."+encodeURIComponent(id)+"&select=id&limit=1");
   if(!orders?.length)return err("This order is not associated with your account",404);
   await activate(id,pid);return respond({licensed:true,...await entitlement(u.id)});
  }
  if(action==="recover"){
   if(!RK||!RS)return err("Recovery temporarily unavailable",503);
   const ent=await recover(u.id);return respond({licensed:ent.active,paid_through:ent.paid_through});
  }
  if(action==="save"){
   const ent=await entitlement(u.id);if(!ent.active)return err("Renew the ₹99 monthly plan to publish changes",403);
   const shop=normalizeShop(data.shop,u.id);
   const s=slug(data.slug||shop.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
   if(!/^[a-z0-9-]{3,70}$/.test(s))return err("Choose a valid URL name");
   const own=await db("business_agent_shops?user_id=eq."+encodeURIComponent(u.id)+"&select=id,license_id&limit=1");
   const published=data.published===true;
   if(own?.length)await patch("business_agent_shops?id=eq."+encodeURIComponent(own[0].id)+"&user_id=eq."+encodeURIComponent(u.id),{slug:s,shop_data:shop,published,updated_at:new Date().toISOString()});
   else await post("business_agent_shops",{user_id:u.id,slug:s,shop_data:shop,published});
   return respond({ok:true,slug:s,published});
  }
  if(action==="orders"){
   const rows=await db("business_agent_customer_orders?user_id=eq."+encodeURIComponent(u.id)+"&select=id,order_number,customer_name,customer_phone,delivery_address,fulfillment,payment_method,items,amount_paise,status,payment_status,created_at,note&order=created_at.desc&limit=100");
   return respond({orders:rows||[]});
  }
  if(action==="order_update"){
   const id=clean(data.id,60),status=clean(data.status,40),payment=clean(data.payment_status,40);
   if(!/^[a-f0-9-]{36}$/.test(id))return err("Invalid order");
   const owns=await db("business_agent_customer_orders?id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(u.id)+"&select=id,status,payment_status&limit=1");
   if(!owns?.length)return err("Order not found",404);
   const previous=owns[0],transitions:any={awaiting_confirmation:["accepted","cancelled"],accepted:["packed","ready","out_for_delivery","completed","cancelled"],packed:["ready","out_for_delivery","completed","cancelled"],ready:["out_for_delivery","completed","cancelled"],out_for_delivery:["completed","cancelled"],completed:[],cancelled:[]};
   if(status&&!transitions[previous.status]?.includes(status))return err("This order status change is not allowed");
   if(payment&&!["unverified","verified","pay_on_collection","refunded"].includes(payment))return err("Invalid payment status");
   if(payment==="refunded"&&previous.payment_status!=="verified")return err("Verify the original payment before recording refund");
   const changes:any={updated_at:new Date().toISOString()};
   if(status)changes.status=status;
   if(payment)changes.payment_status=payment;
   await patch("business_agent_customer_orders?id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(u.id),changes);
   return respond({ok:true});
  }
  return err("Unknown operation",404);
 }catch(e){
  const message=e instanceof Error?e.message:"Unknown error";
  if(message==="AUTH")return err("Please sign in",401);
  if(message.startsWith("DB:")&&message.includes("23505"))return err("This shop address or payment has already been used",409);
  if(message.startsWith("DB:"))return err("Could not save data. Try again.",503);
  return err(message,400);
 }
});
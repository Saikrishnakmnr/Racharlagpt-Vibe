/* Vendor workflow for Racharla Business Agent ₹99/month. */
(()=>{"use strict";const A=window.RBA;if(!A)return;const {$,state:S,call,notice,navigate,format,phone,slug,persist,compress,client}=A;
const models={vegetables:["Farm-fresh picks","Fresh fruits and vegetables for your family."],kirana:["Daily essentials","Browse groceries and home essentials nearby."],restaurant:["Fresh food, simple ordering","Explore our food menu and send an order enquiry."],meat:["Fresh cuts and packs","Select fresh chicken, meat and collection options."],bakery:["Freshly baked goodness","Cakes, breads and snacks for special moments."],salon:["Beauty and wellness","Explore our beauty services and ask about appointments."],photography:["Your moments, beautifully captured","Explore photography packages and request a quote."],wholesale:["Wholesale and bulk supply","Browse bulk items and enquire for a quotation."],electronics:["Products & repair services","Explore our electronics and services."],general:["Welcome to our business","Find products and services and contact us on WhatsApp."]};
function renderOwner(){
 const s=S.shop;for(const id of ["idea","name","model","phone","address","tagline","about","offerText","upi"])$(id).value=s[id]||"";
 for(const id of ["pickup","delivery","appointment","cashPickup","cashDelivery","directUpi","showQr"])$(id).checked=!!s[id];
 $("shopSlug").value=S.saved?.slug||slug(s.name);
 renderItems();
}
A.renderOwner=renderOwner;
function collectBusiness(){const s=S.shop;for(const id of ["idea","name","model","phone","address","tagline","about","offerText"])s[id]=$(id).value.trim();s.phone=phone(s.phone);s.currency="INR";s.kind=["salon","photography"].includes(s.model)?"service":s.model==="wholesale"?"wholesale":["restaurant","meat","bakery"].includes(s.model)?"food":"shop"}
function validate(){const s=S.shop;if(s.name.length<2)return "Enter your business name";if(s.address.length<12)return "Enter your complete shop number, street, area and city";if(!/^\d{8,15}$/.test(s.phone))return "Enter a WhatsApp phone with country code";return null}
$("generate").onclick=()=>{
 const idea=$("idea").value.toLowerCase();let model="general";
 for(const [m,regex] of Object.entries({photography:/photo|camera|wedding|portrait/,salon:/salon|beauty|haircut|spa|makeup/,wholesale:/wholesale|bulk|distribut/,vegetables:/vegetable|fruit|farm|produce/,kirana:/grocery|kirana|provision|supermarket/,restaurant:/restaurant|cafe|food|tiffin|biryani/,bakery:/bakery|cake|bread/,meat:/chicken|meat|fish|mutton/,electronics:/mobile|electronics|laptop|repair/})){if(regex.test(idea)){model=m;break}}
 $("model").value=model;$("tagline").value=models[model][0];$("about").value=models[model][1];notice("Suggested "+model+" layout and wording; edit anything.",true);
};
$("saveBusiness").onclick=()=>{collectBusiness();const error=validate();if(error)return notice(error);if(!persist())return;notice("Business saved. Next add products.",true);navigate("products")};
$("bannerFile").onchange=async e=>{try{const raw=await compress(e.target.files?.[0],1100,.65);if(raw){S.shop.bannerImage=raw;persist();notice("Business banner ready. Publish to share it.",true)}}catch(ex){notice(ex.message)}};
$("merchantQrFile").onchange=async e=>{try{const raw=await compress(e.target.files?.[0],800,.91);if(raw){S.shop.merchantQr=raw;persist();notice("Merchant QR added; verify the payment recipient.",true)}}catch(ex){notice(ex.message)}};
let editing=null;
function renderItems(){
 $("items").replaceChildren();if(!S.shop.products.length){const p=document.createElement("p");p.textContent="No products yet. Add your first item below."; $("items").append(p);return}
 for(const product of S.shop.products){
  const row=document.createElement("div");row.className="product";
  const visual=document.createElement(product.image?"img":"div");visual.className="thumb";if(product.image){visual.src=product.image;visual.alt=""}else visual.textContent="📦";
  const info=document.createElement("div");info.className="product-body";const title=document.createElement("strong");title.textContent=product.name;
  const line=document.createElement("small");line.textContent=(product.category||"General")+" · "+format(product.price)+"/"+(product.unit||"piece")+" · "+(product.available===false||product.stock===0?"Hidden / sold out":product.stock==null?"Available":"Stock "+product.stock);
  info.append(title,line);const actions=document.createElement("div");actions.className="product-controls";
  for(const [label,fn,type] of [["Edit",()=>edit(product.id),"ghost"],[product.available===false?"Show":"Hide",()=>toggle(product.id),"ghost"],["Delete",()=>remove(product.id),"danger"]]){const b=document.createElement("button");b.className="btn "+type;b.textContent=label;b.onclick=fn;actions.append(b)}
  row.append(visual,info,actions);$("items").append(row);
 }
}
function edit(id){const p=S.shop.products.find(x=>x.id===id);if(!p)return;editing=id;for(const [key,v] of Object.entries({itemName:p.name,itemCategory:p.category,itemPrice:p.price,itemUnit:p.unit,itemStock:p.stock??""}))$(key).value=v;$("editorTitle").textContent="Editing "+p.name;$("saveItem").textContent="Update product";$("cancelEdit").hidden=false;$("itemName").scrollIntoView({behavior:"smooth",block:"center"})}
function clearEdit(){editing=null;for(const id of ["itemName","itemCategory","itemPrice","itemStock","itemImage"])$(id).value="";$("editorTitle").textContent="Add product or service";$("saveItem").textContent="Save product";$("cancelEdit").hidden=true}
$("cancelEdit").onclick=clearEdit;
function toggle(id){const p=S.shop.products.find(x=>x.id===id);if(!p)return;p.available=p.available===false;persist();renderItems();notice("Product visibility changed. Republish to update customers.",true)}
function remove(id){const p=S.shop.products.find(x=>x.id===id);if(!p||!confirm("Delete "+p.name+"?"))return;S.shop.products=S.shop.products.filter(x=>x.id!==id);persist();renderItems();notice("Item deleted. Republish to update customers.",true)}
$("saveItem").onclick=async()=>{
 const name=$("itemName").value.trim(),price=Number($("itemPrice").value),rawStock=$("itemStock").value.trim(),stock=rawStock===""?null:Number(rawStock);
 if(!name||$("itemPrice").value.trim()===""||!Number.isFinite(price)||price<0||price>10000000)return notice("Enter a product name and a valid price");
 if(stock!==null&&(!Number.isInteger(stock)||stock<0||stock>999999))return notice("Stock must be a whole number");
 if(S.shop.products.length>=200&&!editing)return notice("Maximum 200 products per shop");
 try{
  const old=JSON.stringify(S.shop.products),existing=editing?S.shop.products.find(x=>x.id===editing):null;
  const image=$("itemImage").files?.[0]?await compress($("itemImage").files[0],600,.62):null;
  const item={id:existing?.id||(crypto.randomUUID?.()||"item-"+Date.now()),name:name.slice(0,100),category:$("itemCategory").value.trim().slice(0,60)||"General",price:Math.round(price*100)/100,unit:$("itemUnit").value,stock,available:stock===0?false:(existing?.available!==false),image:image||existing?.image||""};
  if(existing)Object.assign(existing,item);else S.shop.products.push(item);
  if(!persist()){S.shop.products=JSON.parse(old);return}
  clearEdit();renderItems();notice("Product saved. Republish for customers to get latest price.",true);
 }catch(e){notice("Cannot save product: "+e.message)}
};
$("nextOptions").onclick=()=>{if(!S.shop.products.length)return notice("Add your first product before continuing");navigate("settings")};
$("saveOptions").onclick=()=>{
 const s=S.shop;for(const id of ["pickup","delivery","appointment","cashPickup","cashDelivery","directUpi","showQr"])s[id]=$(id).checked;
 s.upi=$("upi").value.trim();s.cashPickup=s.pickup&&s.cashPickup;s.cashDelivery=s.delivery&&s.cashDelivery;
 if(!s.pickup&&!s.delivery&&!s.appointment)return notice("Enable pickup, delivery or service enquiries");
 if(s.directUpi&&!/^[a-zA-Z0-9._-]{2,100}@[a-zA-Z0-9.-]{2,60}$/.test(s.upi))return notice("Enter a valid seller UPI ID");
 if(s.showQr&&!s.merchantQr)return notice("Upload your own merchant payment QR first");
 if(!s.appointment&&!s.cashPickup&&!s.cashDelivery&&!s.directUpi&&!s.showQr)return notice("Enable at least one customer payment preference");
 if(!persist())return;notice("Customer choices saved. Next: monthly activation.",true);navigate("billing");
};
async function pay(){
 if(S.paying)return;
 if(!S.session?.user)return notice("Sign in before paying for monthly access");
 if(S.legacy)return notice("Your earlier paid purchase is honored.",true);
 if(!S.salesEnabled)return notice("₹99 payment checkout is temporarily closed for activation and refund verification. No charge has been taken.");
 collectBusiness();const invalid=validate();if(invalid){navigate("business");return notice(invalid)}
 if(!S.shop.products.length){navigate("products");return notice("Add your catalog before purchasing")}
 S.paying=true;$("payBtn").disabled=true;
 try{
  const order=await call("checkout");if(!order.id||order.amount!==9900||order.currency!=="INR"||!order.key_id)throw Error("Invalid Razorpay ₹99 order");
  if(typeof Razorpay!=="function")throw Error("Razorpay checkout did not load");
  const popup=new Razorpay({key:order.key_id,amount:9900,currency:"INR",order_id:order.id,name:"Racharla Business Agent",description:"One prepaid month of online shop hosting",prefill:{email:S.session.user.email},theme:{color:"#116b4f"},handler:async result=>{
   try{notice("Verifying Razorpay capture and activating your month...");const verified=await call("verify",result);if(!verified.licensed)throw Error("Payment activation pending");await A.refreshAccount();navigate("publish");notice("Payment verified. Your monthly shop is active. Publish now.",true)}catch(e){notice("Payment verification pending: "+e.message+". Use Recover Payment before paying again.")}
  }});
  popup.on("payment.failed",e=>notice("Payment failed: "+String(e?.error?.description||"Retry").slice(0,130)));popup.open();
 }catch(e){notice(e.message)}finally{S.paying=false;$("payBtn").disabled=!!S.legacy}
}
$("payBtn").onclick=pay;
$("recoverBtn").onclick=async()=>{if(!S.session?.user)return notice("Sign in to recover payments");try{notice("Checking captured Razorpay payments...");const result=await call("recover");await A.refreshAccount();notice(result.licensed?"Payment recovered and plan active.":"No captured monthly payment found. Contact support with your order ID if charged.",!!result.licensed)}catch(e){notice("Cannot recover payment: "+e.message)}};
async function upload(raw,kind,max){
 if(!/^data:image\/(png|jpeg|webp);base64,/.test(String(raw||"")))return raw||"";
 if(!client||!S.session?.user)throw Error("Sign in to upload photos");
 const blob=await fetch(raw).then(r=>r.blob());if(blob.size>max)throw Error("Photo exceeds upload limit");
 const path=S.session.user.id+"/"+kind+"-"+crypto.randomUUID()+".jpg";
 const r=await client.storage.from("business-agent-images").upload(path,blob,{contentType:blob.type||"image/jpeg",upsert:false});
 if(r.error)throw Error("Photo upload failed: "+r.error.message);
 return client.storage.from("business-agent-images").getPublicUrl(path).data.publicUrl;
}
$("publishBtn").onclick=async()=>{
 if(S.publishing)return;
 if(!S.entitled)return notice("Activate or renew your ₹99 plan before publishing. Your draft is still saved.");
 collectBusiness();const invalid=validate();if(invalid){navigate("business");return notice(invalid)}
 if(!S.shop.products.length)return notice("Add products before publishing");
 const name=slug($("shopSlug").value);if(!/^[a-z0-9-]{3,70}$/.test(name))return notice("Choose a 3–70 character shop URL name");
 S.publishing=true;$("publishBtn").disabled=true;
 try{
  notice("Uploading images and saving your latest live catalog...");
  const draft=structuredClone(S.shop);
  draft.bannerImage=await upload(draft.bannerImage,"cover",4000000);
  draft.merchantQr=await upload(draft.merchantQr,"qr",1500000);
  for(const p of draft.products)p.image=await upload(p.image,"product",1500000);
  const r=await call("save",{shop:draft,slug:name,published:$("visibility").value==="true"});
  S.shop=draft;persist();S.saved={slug:r.slug,published:r.published,shop_data:draft};A.displayPlan();
  notice(r.published?"Your updated shop is published. Share the link!":"Your shop is saved privately.",true);
 }catch(e){notice("Cannot publish: "+e.message)}
 finally{S.publishing=false;$("publishBtn").disabled=false}
};
function sharingUrl(){const url=A.getPublicLink();if(!url)notice("Publish your shop first to get a customer link");return url}
$("copyLink").onclick=async()=>{const url=sharingUrl();if(!url)return;try{await navigator.clipboard.writeText(url);notice("Shop link copied.",true)}catch{prompt("Copy shop link:",url)}};
$("shareWhatsapp").onclick=()=>{const url=sharingUrl();if(url)location.href="https://wa.me/?text="+encodeURIComponent("Visit "+S.shop.name+" online shop: "+url)};
$("preview").onclick=()=>{collectBusiness();if(!S.shop.name)return notice("Enter your shop name before preview");A.previewCustomer?.(structuredClone(S.shop))};
A.initVendor=async()=>{A.authHandlers();A.renderOwner();A.displayPlan();A.navigate(location.hash.slice(1)||"overview",true);if(client){client.auth.onAuthStateChange(()=>setTimeout(()=>A.refreshAccount(),0));await A.refreshAccount()}else notice("Cloud sign-in is unavailable. Check your internet connection.")};
})();
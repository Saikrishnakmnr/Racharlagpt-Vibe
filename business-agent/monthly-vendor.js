/* Vendor workflow for Racharla Business Agent ₹99/month. */
(()=>{"use strict";const A=window.RBA;if(!A)return;const {$,state:S,call,notice,navigate,format,phone,slug,persist,compress,client}=A;
const models={vegetables:["Farm-fresh picks","Fresh fruits and vegetables for your family."],kirana:["Daily essentials","Browse groceries and home essentials nearby."],restaurant:["Fresh food, simple ordering","Explore our food menu and send an order enquiry."],meat:["Fresh cuts and packs","Select fresh chicken, meat and collection options."],bakery:["Freshly baked goodness","Cakes, breads and snacks for special moments."],salon:["Beauty and wellness","Explore our beauty services and ask about appointments."],photography:["Your moments, beautifully captured","Explore photography packages and request a quote."],wholesale:["Wholesale and bulk supply","Browse bulk items and enquire for a quotation."],electronics:["Products & repair services","Explore our electronics and services."],general:["Welcome to our business","Find products and services and contact us on WhatsApp."]};
function renderOwner(){
 const s=S.shop;for(const id of ["idea","name","model","phone","address","tagline","about","offerText","upi"])$(id).value=s[id]||"";
 for(const id of ["pickup","delivery","appointment","cashPickup","cashDelivery","directUpi","showQr"])$(id).checked=!!s[id];$("deliveryFee").value=s.deliveryFee??0;
 $("shopSlug").value=S.saved?.slug||slug(s.name);
 renderItems();
}
function renderCatalogSync(){
 const el=$("catalogSyncStatus");if(!el)return;
 const live=S.saved?.published&&S.saved?.shop_data;
 if(!live){el.textContent="Not published yet. Customers cannot see this catalog until you activate and publish your shop.";return}
 const changed=JSON.stringify(S.shop)!==JSON.stringify(S.saved.shop_data);
 el.textContent=changed?"Changes saved on this device only — customers still see the previous published prices. Tap 'Publish latest prices to customers'.":"✓ Your saved catalog matches the last published copy. Customers can refresh to see it.";
 el.style.background=changed?"#fff2d1":"#e6f5e8";el.style.color=changed?"#5c481e":"#216243";
}
function markCatalogPending(){
 const el=$("catalogSyncStatus");if(el){el.textContent="Unpublished changes: customers still see the earlier catalog. Tap 'Publish latest prices to customers' when ready.";el.style.background="#fff2d1";el.style.color="#5c481e"}
}
A.renderOwner=()=>{renderOwner();renderCatalogSync()};
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
function toggle(id){const p=S.shop.products.find(x=>x.id===id);if(!p)return;const was=p.available;p.available=p.available===false;if(!persist()){p.available=was;return}renderItems();markCatalogPending();notice("Product visibility changed. Republish to update customers.",true)}
function remove(id){const p=S.shop.products.find(x=>x.id===id);if(!p||!confirm("Delete "+p.name+"?"))return;const old=S.shop.products;S.shop.products=old.filter(x=>x.id!==id);if(!persist()){S.shop.products=old;return}renderItems();markCatalogPending();notice("Item deleted. Republish to update customers.",true)}
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
  clearEdit();renderItems();markCatalogPending();notice("Product saved on your device. Customers will see the new price only after you publish.",true);
 }catch(e){notice("Cannot save product: "+e.message)}
};
$("nextOptions").onclick=()=>{if(!S.shop.products.length)return notice("Add your first product before continuing");navigate("settings")};
$("saveOptions").onclick=()=>{
 const s=S.shop;for(const id of ["pickup","delivery","appointment","cashPickup","cashDelivery","directUpi","showQr"])s[id]=$(id).checked;
 const charge=Number($("deliveryFee").value);if(!Number.isFinite(charge)||charge<0||charge>10000)return notice("Delivery charge must be between ₹0 and ₹10,000");s.deliveryFee=s.delivery?Math.round(charge*100)/100:0;s.upi=$("upi").value.trim();s.cashPickup=s.pickup&&s.cashPickup;s.cashDelivery=s.delivery&&s.cashDelivery;
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
 if(!S.salesEnabled)return notice("Monthly payment checkout is temporarily closed for activation and refund verification. No charge has been taken.");
 collectBusiness();const invalid=validate();if(invalid){navigate("business");return notice(invalid)}
 if(!S.shop.products.length){navigate("products");return notice("Add your catalog before purchasing")}
 S.paying=true;$("payBtn").disabled=true;
 try{
  const order=await call("checkout");if(!order.id||!Number.isInteger(order.amount)||order.amount<100||order.amount>1000000||order.currency!=="INR"||!order.key_id)throw Error("Invalid Razorpay monthly order");const charged="₹"+(order.amount/100).toLocaleString("en-IN",{maximumFractionDigits:2});if(order.amount!==Number(S.pricing?.monthly_amount_paise||9900)&&!confirm("Your saved unfinished checkout has a different price: "+charged+". Continue with that exact amount?"))return;
  if(typeof Razorpay!=="function")throw Error("Razorpay checkout did not load");
  const popup=new Razorpay({key:order.key_id,amount:order.amount,currency:"INR",order_id:order.id,name:"Racharla Business Agent",description:"One prepaid month of online shop hosting · "+charged,prefill:{email:S.session.user.email},theme:{color:"#116b4f"},handler:async result=>{
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
async function cleanupUnusedPhotos(previous,next){
 if(!client||!S.session?.user||!previous)return;
 const prefix=A.base+"/storage/v1/object/public/business-agent-images/"+S.session.user.id+"/";
 const urls=shop=>[shop?.bannerImage,shop?.merchantQr,...(Array.isArray(shop?.products)?shop.products.map(p=>p.image):[])].filter(x=>typeof x==="string"&&x.startsWith(prefix));
 const keep=new Set(urls(next));const remove=[...new Set(urls(previous).filter(x=>!keep.has(x)).map(x=>S.session.user.id+"/"+decodeURIComponent(x.slice(prefix.length))))];
 for(let i=0;i<remove.length;i+=50){const result=await client.storage.from("business-agent-images").remove(remove.slice(i,i+50));if(result.error)throw result.error}
}
$("publishBtn").onclick=async()=>{
 if(S.publishing)return;
 if(!S.entitled)return notice("Activate or renew your monthly plan before publishing. Your draft is still saved.");
 collectBusiness();const invalid=validate();if(invalid){navigate("business");return notice(invalid)}
 if(!S.shop.products.length)return notice("Add products before publishing");
 const name=slug($("shopSlug").value);if(!/^[a-z0-9-]{3,70}$/.test(name))return notice("Choose a 3–70 character shop URL name");
 if(slugChecked?.value!==name||!slugChecked.available){if(!(await checkSlug()))return notice("Shop URL not available. Choose a suggested unique website name.")}
 S.publishing=true;$("publishBtn").disabled=true;
 try{
  notice("Uploading images and saving your latest live catalog...");
  const draft=structuredClone(S.shop);
  draft.bannerImage=await upload(draft.bannerImage,"cover",4000000);
  draft.merchantQr=await upload(draft.merchantQr,"qr",1500000);
  for(const p of draft.products)p.image=await upload(p.image,"product",1500000);
  if(S.restartRequired&&!S.restartPrepared)throw Error("Your previous shop retention window ended. Back up your catalog, then choose Start fresh shop before publishing.");const r=await call("save",{shop:draft,slug:name,published:$("visibility").value==="true",restart_acknowledged:!!S.restartPrepared});
  const older=S.saved?.shop_data;S.shop=draft;persist();S.saved={slug:r.slug,published:r.published,shop_data:draft};S.restartRequired=false;S.restartPrepared=false;A.displayPlan();renderCatalogSync();try{await cleanupUnusedPhotos(older,draft)}catch(e){/* A successful publish must not fail because cleanup is delayed. */}
  notice(r.published?"Your updated shop is published. Share the link!":"Your shop is saved privately.",true);
 }catch(e){notice("Cannot publish: "+e.message)}
 finally{S.publishing=false;$("publishBtn").disabled=false}
};
let slugTimer=null,slugChecked=null;
function showSlugResult(result){
 const status=$("slugStatus"),suggestions=$("slugSuggestions");if(!status||!suggestions)return;
 suggestions.replaceChildren();
 status.textContent=result.available?"✓ This website link is available.":"That link is taken. Your shop name can stay the same; choose a different website link.";
 status.style.color=result.available?"#18734e":"#a34c20";
 for(const choice of result.suggestions||[]){const b=document.createElement("button");b.type="button";b.className="btn ghost";b.textContent=choice;b.onclick=()=>{$("shopSlug").value=choice;checkSlug()};suggestions.append(b)}
}
async function checkSlug(){
 const value=slug($("shopSlug").value);
 if(!/^[a-z0-9-]{3,70}$/.test(value)){slugChecked=null;$("slugStatus").textContent="Choose 3–70 letters, digits or hyphens.";return false}
 if(!S.session?.user){$("slugStatus").textContent="Sign in to check website link availability.";return false}
 try{$("slugStatus").textContent="Checking website link availability…";
 const result=await call("slug_check",{slug:value,model:S.shop.model});
 if(slug($("shopSlug").value)!==value)return false;
 slugChecked={value,available:result.available};showSlugResult(result);return result.available
 }catch(e){slugChecked=null;$("slugStatus").textContent="Cannot verify this shop link: "+e.message;return false}
}
$("shopSlug").addEventListener("input",()=>{slugChecked=null;clearTimeout(slugTimer);slugTimer=setTimeout(checkSlug,450)});
function sharingUrl(){const url=A.getPublicLink();if(!url)notice("Publish your shop first to get a customer link");return url}
$("catalogPublishNow").onclick=()=>{
 if(!S.entitled){navigate("billing");return notice("Activate your monthly shop access to publish these prices. Your edits remain saved on your device.")}
 if(!S.saved?.slug){navigate("publish");return notice("Choose a public shop URL, then tap Save & publish latest catalog.")}
 $("shopSlug").value=S.saved.slug; $("visibility").value="true";$("publishBtn").click();
};
function downloadCatalogBackup(){
 try{
  const payload={format:"racharla-business-agent-backup-v1",exported_at:new Date().toISOString(),shop:structuredClone(S.shop),last_published_shop:S.saved?.shop_data?structuredClone(S.saved.shop_data):null};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="business-agent-catalog-backup.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  notice("Catalog backup downloaded. Keep the file somewhere safe before resetting your shop.",true);return true;
 }catch(e){notice("Unable to create backup: "+e.message);return false}
}
async function refreshCleanup(){
 const box=$("cleanupControls"),status=$("cleanupStatus");
 if(!box||!S.session?.user){if(box)box.hidden=true;return}
 const expiry=S.paidThrough?Date.parse(S.paidThrough):NaN,cutoff=S.retentionDeadline?Date.parse(S.retentionDeadline):NaN;
 const eligible=!S.legacy&&!S.entitled&&Number.isFinite(cutoff)&&Date.now()>cutoff;
 let pending=null;
 try{const data=await call("cleanup_status");pending=data.cleanup||null}catch(e){status.textContent="Unable to check cleanup request status: "+e.message}
 box.hidden=!eligible&&!pending;
 $("requestCleanup").hidden=!eligible||pending?.status==="pending"||pending?.status==="processing"||pending?.status==="completed";
 $("cancelCleanup").hidden=pending?.status!=="pending";
 if(pending?.status==="pending")status.textContent="Deletion request received. You can cancel until "+new Date(pending.execute_after).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})+". After that, an administrator may remove the catalog and photos.";
 else if(pending?.status==="processing")status.textContent="A previously requested cleanup is being processed.";
 else if(pending?.status==="completed")status.textContent="Hosted catalog storage was removed as requested. Your paid receipts and order history were preserved.";
 else if(pending?.status==="failed")status.textContent="Cleanup needs administrator retry. Your existing records remain protected from another owner's access.";
 else status.textContent="Your paid month and 60-day grace period have ended. Back up your catalog first, then you can request old hosted files be removed. This does not delete payment or order history.";
}
A.refreshCleanup=refreshCleanup;
$("requestCleanup").onclick=async()=>{
 if(!S.session?.user||S.legacy||S.entitled)return notice("Deletion requests are only available to expired monthly shops past their grace period.");
 if(!downloadCatalogBackup())return;
 const confirmation=prompt("Your expired hosted catalog and photos may be deleted after 7 days and admin review. Type DELETE MY OLD CATALOG to request deletion:");
 if(confirmation!=="DELETE MY OLD CATALOG")return notice("Cleanup not requested. Exact confirmation is required.");
 try{await call("cleanup_request",{confirm_data_removal:confirmation});await refreshCleanup();notice("Deletion request recorded. You have seven days to cancel.",true)}
 catch(e){notice("Could not request cleanup: "+e.message)}
};
$("cancelCleanup").onclick=async()=>{
 if(!confirm("Cancel your pending hosted-catalog deletion?"))return;
 try{await call("cleanup_cancel");await refreshCleanup();notice("Deletion request cancelled.",true)}
 catch(e){notice("Could not cancel request: "+e.message)}
};
$("backupShop").onclick=downloadCatalogBackup;
$("restartShop").onclick=()=>{
 if(!confirm("Your paid renewal grace period ended. A new catalog is required. Download your old data as a backup now?"))return;
 if(!downloadCatalogBackup())return;
 if(!confirm("Start a NEW shop catalog? This device's previous products and details will be cleared. Your backup file can be kept for records."))return;
 const previous=S.shop;S.shop=A.blank();
 if(!persist()){S.shop=previous;return}
 S.restartPrepared=true;A.renderOwner();navigate("business");
 notice("New shop draft started. Enter business details, add products and publish when your renewed month is active.",true);
};
$("catalogRestorePublished").onclick=()=>{
 const published=S.saved?.shop_data;
 if(!published)return notice("No published catalog found. Publish a shop first, then it can be restored on another phone.");
 if(!confirm("Replace this device's unsaved draft with the last successfully published online shop? Any unpublished edits on this device will be lost."))return;
 const previous=S.shop;
 S.shop=structuredClone(published);
 if(!persist()){S.shop=previous;return}
 A.renderOwner();renderCatalogSync();notice("Restored your last published shop. Your products, prices and settings are loaded. Publish again after editing.",true);
};
$("catalogOpenShop").onclick=()=>{
 const url=A.getPublicLink();
 if(!url){navigate("publish");return notice("Publish your shop first to get a customer website link.")}
 const link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener noreferrer";document.body.append(link);link.click();link.remove();notice("Opening your published customer shop in a new tab.",true);
};
$("copyLink").onclick=async()=>{const url=sharingUrl();if(!url)return;try{await navigator.clipboard.writeText(url);notice("Shop link copied.",true)}catch{prompt("Copy shop link:",url)}};
$("shareWhatsapp").onclick=()=>{const url=sharingUrl();if(url)location.href="https://wa.me/?text="+encodeURIComponent("Visit "+S.shop.name+" online shop: "+url)};
$("preview").onclick=()=>{collectBusiness();if(!S.shop.name)return notice("Enter your shop name before preview");A.previewCustomer?.(structuredClone(S.shop))};
A.initVendor=async()=>{A.authHandlers();A.renderOwner();A.displayPlan();A.refreshPricing?.();const start=location.hash.slice(1)||"overview";try{history.replaceState({rba:start,rbaPrevious:null,rbaDepth:0},"",location.href)}catch{}A.navigate(start,true);if(client){client.auth.onAuthStateChange(()=>setTimeout(()=>A.refreshAccount(),0));await A.refreshAccount()}else notice("Cloud sign-in is unavailable. Check your internet connection.")};
})();
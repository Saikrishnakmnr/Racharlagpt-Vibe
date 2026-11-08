/* Live public storefront: latest pricing + server-validated order IDs + WhatsApp. */
(()=>{"use strict";const A=window.RBA;if(!A)return;const {$,state:S,call,format,customerNotice}=A;
let filteredCategory="All",opening=false,pendingWhatsApp="",orderToken=null;let deferredInstall=null,installed=false;
const safe=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const products=()=>Array.isArray(S.customerShop?.products)?S.customerShop.products.filter(x=>x.available!==false&&x.stock!==0):[];
function showTemporarilyClosed(res,slug){
 S.customerSlug=slug;S.customerShop=null;S.cart={};orderToken=null;
 $("vendorApp").hidden=true;$("customerApp").hidden=false;
 $("customerApp").classList.add("shop-paused");
 $("shopClosedName").textContent=res.shop?.name||"Shop temporarily closed";
 $("shopClosedText").textContent=res.message||"This shop is temporarily closed. Please check back later.";
 document.title=($("shopClosedName").textContent||"Shop")+" — Temporarily closed";
 $("placeOrder").disabled=true;
 $("shopClosedNotice").hidden=false;
 S.lastFetched=Date.now();
}
$("shopClosedCheckAgain").onclick=async()=>{
 const slug=S.customerSlug;if(!slug)return;
 $("shopClosedText").textContent="Checking whether this shop has reopened…";
 try{
  const data=await call("public",{slug},false);
  if(data.temporarily_closed)showTemporarilyClosed(data,slug);
  else {showCustomer(data.shop,slug);customerNotice("The shop has reopened. Refresh prices and review your selections before ordering.");}
 }catch(e){$("shopClosedText").textContent="Unable to check the shop right now. Please try again later.";}
};
function showCustomer(shop,slug=null){
 $("customerApp").classList.remove("shop-paused");$("shopClosedNotice").hidden=true;
 $("placeOrder").disabled=false;
 S.customerShop=shop;S.customerSlug=slug;S.cart={};orderToken=null;document.body.dataset.shopModel=String(shop.model||"general");S.lastFetched=Date.now();filteredCategory="All";$("backToEditor").hidden=!!slug;
 $("vendorApp").hidden=true;$("customerApp").hidden=false;document.title=(shop.name||"My shop")+" — Racharla Shops";
 $("customerName").textContent=shop.name||"Business shop";$("customerTagline").textContent=shop.tagline||shop.about||"Browse and enquire on WhatsApp";
 $("customerAddress").textContent=shop.address||"";const waPhone=String(shop.phone||"").replace(/\D/g,"");const contact=$("customerContact");contact.hidden=waPhone.length<8||waPhone.length>15;if(!contact.hidden)contact.href="https://wa.me/"+waPhone+"?text="+encodeURIComponent("Hello "+(shop.name||"Shop")+", I would like to enquire about your products and availability.");$("customerMap").hidden=!shop.address;if(shop.address)$("customerMap").href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(shop.address);
 $("customerOffer").hidden=!shop.offerText;$("customerOffer").textContent=shop.offerText||"";
 const cover=$("customerBanner");
 if(typeof shop.bannerImage==="string"&&/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(shop.bannerImage)){
   cover.replaceChildren();const img=document.createElement("img");img.src=shop.bannerImage;img.alt="Shop banner";img.className="store-cover";cover.append(img)
 }else{cover.replaceChildren();const name=document.createElement("strong");name.textContent=shop.name||"Your Shop";cover.append("✦ ",name)}
 renderProducts();renderFulfilment();renderCart();$("paymentHint").hidden=true;
 customerNotice(slug?"Latest online catalog loaded. Shop owner confirms the final order.":"Preview mode: no order will be submitted. Sign in and publish to enable WhatsApp orders.");showInstallBanner();
 if(slug)try{localStorage.setItem("rba_last_customer_shop",slug)}catch{}
 window.scrollTo({top:0,behavior:"smooth"});
}
A.previewCustomer=(shop)=>{try{history.pushState({rba:"customer_preview",rbaPrevious:S.tab,rbaDepth:(Number(history.state?.rbaDepth)||0)+1},"",location.pathname+location.search+"#customer_preview")}catch{}showCustomer(shop)};
function renderProducts(){
 const list=products(),q=$("productSearch").value.trim().toLowerCase();
 const categories=["All",...new Set(list.map(x=>x.category||"General"))];
 if(!categories.includes(filteredCategory))filteredCategory="All";
 $("productFilters").replaceChildren();
 for(const cat of categories){const btn=document.createElement("button");btn.className="btn ghost";btn.style.background=filteredCategory===cat?"#c7e8cd":"";btn.textContent=cat;btn.onclick=()=>{filteredCategory=cat;renderProducts()};$("productFilters").append(btn)}
 const display=list.filter(p=>(filteredCategory==="All"||p.category===filteredCategory)&&(!q||String(p.name).toLowerCase().includes(q)||String(p.category).toLowerCase().includes(q)));
 $("customerItems").replaceChildren();
 if(!display.length){const p=document.createElement("p");p.textContent="No matching products available right now."; $("customerItems").append(p);return}
 for(const item of display){
 const card=document.createElement("article");card.className="product-card";
 const photo=document.createElement("div");photo.className="product-photo";
 if(typeof item.image==="string"&&/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(item.image)){const img=document.createElement("img");img.src=item.image;img.alt=item.name||"Product";img.loading="lazy";photo.append(img)}else photo.textContent=({photography:"📷",salon:"💇",restaurant:"🍛",bakery:"🧁",meat:"🍗",wholesale:"📦",electronics:"📱",kirana:"🛒",vegetables:"🥬"})[S.customerShop?.model]||"🛍";
 const details=document.createElement("div");details.className="product-detail";
 const title=document.createElement("h3");title.textContent=item.name;
 const unit=document.createElement("p");unit.textContent=(item.category||"General")+" · "+(item.unit||"piece");
 const price=document.createElement("strong");price.textContent=format(item.price)+" / "+(item.unit||"piece");
 const b=document.createElement("button");b.className="btn";b.textContent=["photography","salon","wholesale"].includes(S.customerShop.model)?"Enquire":"Add to order";
 b.onclick=()=>{const count=S.cart[item.id]||0;if(item.stock!=null&&count>=item.stock){customerNotice("Only "+item.stock+" available. Please review.");return}S.cart[item.id]=count+1;orderToken=null;renderCart();customerNotice("Item selected. Review your cart before sending the order.")};
 details.append(title,unit,price,b);card.append(photo,details);$("customerItems").append(card)
 }
}
function renderFulfilment(){
 const s=S.customerShop||{},fulfil=$("fulfilment");fulfil.replaceChildren();
 for(const [id,yes,label]of [["pickup",s.pickup,"Pickup from shop"],["delivery",s.delivery,"Delivery request"],["appointment",s.appointment,"Appointment / quotation enquiry"]]){
 if(!yes)continue;const opt=document.createElement("option");opt.value=id;opt.textContent=label;fulfil.append(opt)
 }
 fillPayments();
}
function fillPayments(){
 const s=S.customerShop||{},which=$("fulfilment").value,opts=[];
 if(which==="pickup"&&s.cashPickup)opts.push(["cash_pickup","Cash on pickup"]);
 if(which==="delivery"&&s.cashDelivery)opts.push(["cash_delivery","Cash on delivery"]);
 if(s.directUpi&&s.upi)opts.push(["upi","Pay to owner's UPI after confirmation"]);
 if(s.showQr&&s.merchantQr)opts.push(["qr","Pay with owner's QR after confirmation"]);
 if(which==="appointment")opts.push(["confirm","Discuss payment with business"]);
 const el=$("paymentMethod");el.replaceChildren();for(const [value,label]of opts){const o=document.createElement("option");o.value=value;o.textContent=label;el.append(o)}
 $("deliveryAddressWrap").hidden=which!=="delivery";$("placeOrder").disabled=!opts.length;renderCart();
 showPaymentInfo();
}
function showPaymentInfo(){
 const s=S.customerShop||{},method=$("paymentMethod").value,el=$("paymentHint");el.replaceChildren();
 if(method!=="upi"&&method!=="qr"){el.hidden=true;return}
 el.hidden=false;
 const notice=document.createElement("p");notice.textContent="Confirm the final total and recipient with the shop owner before sending money. We do not verify UPI or QR payments.";
 el.append(notice);
 if(method==="upi"){const p=document.createElement("strong");p.textContent="Seller UPI: "+s.upi;el.append(p);const copy=document.createElement("button");copy.className="btn ghost";copy.textContent="Copy UPI ID";copy.onclick=()=>navigator.clipboard?.writeText(s.upi).then(()=>customerNotice("UPI ID copied")).catch(()=>customerNotice("Copy the UPI ID displayed above"));el.append(copy)}
 if(method==="qr"&&/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(s.merchantQr||"")){const img=document.createElement("img");img.src=s.merchantQr;img.alt="Owner-supplied merchant UPI QR";img.style.maxWidth="200px";img.style.display="block";el.append(img)}
}
function renderCart(){
 const list=products().filter(x=>S.cart[x.id]>0),parent=$("cartRows");parent.replaceChildren();
 let sum=0;for(const p of list){const qty=S.cart[p.id],line=Math.round(Number(p.price)*100)*qty;sum+=line;
 const row=document.createElement("div");row.className="row between";row.style.margin="9px 0";
 const title=document.createElement("span");title.textContent=p.name+" × "+qty+" · "+format(line/100);
 const minus=document.createElement("button");minus.className="btn ghost";minus.textContent="−";minus.setAttribute("aria-label","Remove one "+p.name);minus.onclick=()=>{S.cart[p.id]=Math.max(0,qty-1);orderToken=null;renderCart()};
 row.append(title,minus);parent.append(row)}
 const fee=$("fulfilment").value==="delivery"?Math.round(Number(S.customerShop?.deliveryFee||0)*100):0;$("cartTotal").textContent="Items: "+format(sum/100)+(fee?" + delivery "+format(fee/100):"")+" · Estimated total: "+format((sum+fee)/100)+" · Owner confirms final amount";
}
async function refresh({quiet=false}={}){
 if(!S.customerSlug)return true;
 try{if(!quiet)customerNotice("Checking latest prices and stock…");
 const res=await call("public",{slug:S.customerSlug},false);
 if(res.temporarily_closed){showTemporarilyClosed(res,S.customerSlug);return false}
 const old=JSON.stringify(S.customerShop),next=JSON.stringify(res.shop);
 S.lastFetched=Date.now();
 if($("customerApp").classList.contains("shop-paused")||old!==next){showCustomer(res.shop,S.customerSlug);customerNotice("Shop or products have changed. Please review your items again.");return false}
 if(!quiet)customerNotice("Catalog refreshed. Seller confirms final availability.");return true
 }catch(e){customerNotice("Cannot verify prices right now. Internet and active shop access are required before ordering: "+e.message);return false}
}
$("backToEditor").onclick=()=>{if(history.state?.rba==="customer_preview"){history.back();return}$("customerApp").hidden=true;$("vendorApp").hidden=false;A.navigate(S.tab,true)};
$("productSearch").oninput=renderProducts;$("fulfilment").onchange=fillPayments;$("paymentMethod").onchange=showPaymentInfo;$("customerRefresh").onclick=()=>refresh();
$("placeOrder").onclick=async()=>{
 if(opening)return;
 if($("customerApp").classList.contains("shop-paused"))return customerNotice("This shop is temporarily closed and cannot accept new orders.");
 if(!S.customerSlug)return customerNotice("Preview only. Publish an active shop for real customer orders.");
 const s=S.customerShop,selected=products().filter(p=>S.cart[p.id]>0);
 if(!selected.length)return customerNotice("Please select at least one product or service.");
 const name=$("buyerName").value.trim(),phone=$("buyerPhone").value.replace(/\D/g,""),fulfillment=$("fulfilment").value,method=$("paymentMethod").value;
 if(name.length<2||phone.length<8||phone.length>15)return customerNotice("Enter your name and mobile number with country code.");
 if(fulfillment==="delivery"&&$("deliveryAddress").value.trim().length<10)return customerNotice("Please enter a complete delivery address.");
 if(!$("customerConsent").checked)return customerNotice("Agree to share your order details with this shop.");
 opening=true;$("placeOrder").disabled=true;
 try{
  const unchanged=await refresh({quiet:true});if(!unchanged)return;
  const orderItems=selected.map(x=>({id:x.id,qty:S.cart[x.id]})),subtotal=selected.reduce((a,p)=>a+Math.round(Number(p.price)*100)*S.cart[p.id],0);const total=subtotal+($("fulfilment").value==="delivery"?Math.round(Number(S.customerShop?.deliveryFee||0)*100):0);
  const response=await call("order",{slug:S.customerSlug,customer_name:name,customer_phone:phone,delivery_address:$("deliveryAddress").value.trim(),fulfillment,payment_method:method,items:orderItems,expected_total_paise:total,note:$("buyerNote").value.trim(),consent:true,client_token:orderToken||(orderToken=crypto.randomUUID())},false);
  pendingWhatsApp=response.whatsapp_url;
  if(!/^https:\/\/wa\.me\/[0-9]+\?text=/.test(pendingWhatsApp))throw Error("Order recorded but WhatsApp link unavailable");
  customerNotice("Order "+response.order_ref+" created. Opening WhatsApp — tap Send to deliver the order to the shop. If WhatsApp doesn't open, tap Open WhatsApp again.");
  location.assign(pendingWhatsApp);
 }catch(e){customerNotice("Order not completed: "+e.message+". Refresh prices and retry.")}
 finally{opening=false;$("placeOrder").disabled=false}
};
const fallbackBtn=document.createElement("button");fallbackBtn.type="button";fallbackBtn.className="btn ghost";fallbackBtn.textContent="Open WhatsApp again";fallbackBtn.hidden=true;fallbackBtn.onclick=()=>{if(pendingWhatsApp)location.assign(pendingWhatsApp)};
$("placeOrder").insertAdjacentElement("afterend",fallbackBtn);
const oldNotice=customerNotice;
function showFallback(){fallbackBtn.hidden=!pendingWhatsApp}
const observer=new MutationObserver(showFallback);observer.observe($("customerOrderStatus"),{childList:true,characterData:true,subtree:true});
function standalone(){return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
function showInstallBanner(){
 const banner=$("customerInstallBanner");if(!S.customerSlug||standalone()||installed){banner.hidden=true;return}
 let dismissed=0;try{dismissed=Number(localStorage.getItem("rba_install_dismiss_"+S.customerSlug)||0)}catch{}
 banner.hidden=!!(dismissed&&Date.now()-dismissed<30*86400000);
}
async function installClick(){
 if(standalone()||installed){customerNotice("Racharla Shops is already on your home screen.");return}
 if(deferredInstall){
  const p=deferredInstall;deferredInstall=null;try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome==="accepted"){$("customerInstallBanner").hidden=true;customerNotice("Install accepted. Open your shop from the home screen.");return}}catch{}
 }
 customerNotice(/iPhone|iPad|iPod/i.test(navigator.userAgent)?"In Safari, tap Share → Add to Home Screen.":"Open your browser menu and choose Install app or Add to Home Screen. The shared Racharla Shops app remembers the last shop you opened.");
}
$("customerInstall").onclick=installClick;
$("installBannerAction").onclick=installClick;
$("installBannerDismiss").onclick=()=>{if(S.customerSlug)try{localStorage.setItem("rba_install_dismiss_"+S.customerSlug,String(Date.now()))}catch{}$("customerInstallBanner").hidden=true};
addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;showInstallBanner()});
addEventListener("appinstalled",()=>{installed=true;deferredInstall=null;$("customerInstallBanner").hidden=true});
addEventListener("focus",()=>{if(S.customerSlug&&Date.now()-S.lastFetched>45000)refresh({quiet:true})});
A.initCustomer=async()=>{const u=new URL(location.href);let slug=u.searchParams.get("shop");if(!slug&&u.searchParams.get("launch")==="shop")try{slug=localStorage.getItem("rba_last_customer_shop")}catch{}
 if(!slug)return false;if(!/^[a-z0-9-]{3,70}$/.test(slug)){customerNotice("Invalid shop link.");return true}
 try{const data=await call("public",{slug},false);if(data.temporarily_closed)showTemporarilyClosed(data,slug);else showCustomer(data.shop,slug)}catch(e){$("vendorApp").hidden=true;$("customerApp").hidden=false;customerNotice("This shop is not currently taking orders. The owner may need to renew ₹99/month. "+e.message)}
 return true;
};
})();
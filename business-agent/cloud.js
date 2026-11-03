/* Racharla Business Agent cloud integration. Independent of legacy Vibe checkout. */
(()=>{"use strict";
const cfg=window.RG_CONFIG||{};
const base=String(cfg.SUPABASE_URL||"").replace(/\/$/,"");
const key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY||"";
const $=id=>document.getElementById(id);
if(!window.supabase||!base||!key){$("accountStatus").textContent="Cloud services unavailable. You can still try the local preview.";return}
const client=window.supabase.createClient(base,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const API=base+"/functions/v1/business-agent-api";
let session=null,licensed=false,saved=null,processing=false,loadedFor=null;
function status(s){$("accountStatus").textContent=s}
function warn(s){$("salesWarning").textContent=s}
async function call(action,data={},requiresAuth=true){let headers={"Content-Type":"application/json","apikey":key};
if(requiresAuth){let x=(await client.auth.getSession()).data.session;if(!x?.access_token)throw Error("Please sign in first.");headers.Authorization="Bearer "+x.access_token}
let controller=new AbortController,timeout=setTimeout(()=>controller.abort(),25000);
try{let r=await fetch(API,{method:"POST",headers,body:JSON.stringify({action,...data}),signal:controller.signal});let j=await r.json().catch(()=>({error:"Invalid server response"}));if(!r.ok)throw Error(j.error||"Service unavailable");return j}
finally{clearTimeout(timeout)}}
function loggedIn(){return !!session?.user}
async function refresh(){
const current=(await client.auth.getSession()).data.session;session=current;
$("agentSignIn").hidden=loggedIn();$("agentSignUp").hidden=loggedIn();$("agentGoogle").hidden=loggedIn();$("agentSignOut").hidden=!loggedIn();
$("accountFields").hidden=loggedIn();
licensed=false;saved=null;$("agentLoadShop").hidden=true;updateShopLinks();
$("agentBuy").disabled=true;$("agentPublish").disabled=true;$("agentExportHTML").disabled=true;$("agentDownloadOwner").disabled=true;$("agentDownloadOwnerPublish").disabled=true;
if(!loggedIn()){$("agentSalesState").textContent="Preview is free. Sign in to buy and publish once checkout opens.";status("Try a free preview. Sign in to purchase or publish a permanent shop.");$("agentShare").textContent="A public shop URL requires a verified Business Agent license.";return}
status("Checking your purchases for "+(session.user.email||"your account")+"…");
try{const r=await call("me");licensed=!!r.licensed;saved=r.shop;updateShopLinks();
status(licensed?"✓ Business Agent licensed — "+session.user.email:"Signed in as "+session.user.email+" · free preview");
$("agentSalesState").textContent=licensed?"✓ Licensed: save, publish and manage your hosted shop whenever you sign in.":r.sales_enabled?"Preview complete? Buy ₹999 once to activate publishing and export.":"Your free preview is saved on this device. ₹999 checkout is temporarily disabled until payment and refund verification is complete.";
$("agentBuy").hidden=licensed;
$("agentBuy").disabled=!loggedIn()||licensed||!r.sales_enabled;
$("agentPublish").disabled=!licensed;$("agentExportHTML").disabled=!licensed;$("agentDownloadOwner").disabled=!licensed;$("agentDownloadOwnerPublish").disabled=!licensed;
if(saved){$("agentLoadShop").hidden=false;$("agentSlug").value=saved.slug;$("agentVisibility").value=String(!!saved.published);$("agentShare").textContent=saved.published?"Your shop: "+location.origin+location.pathname+"?shop="+encodeURIComponent(saved.slug):"Shop saved privately. Publish when ready.";
const local=window.RA_exportShop?.();const isDemo=!!local?.products?.length&&local.products.every(p=>String(p.id).startsWith("demo-"));if(saved.shop_data&&loadedFor!==session.user.id&&(isDemo||!local?.products?.length)){window.RA_importShop?.(saved.shop_data);loadedFor=session.user.id;}
}else if(licensed){$("agentShare").textContent="Enter a unique shop address and press Save & publish."}
warn(licensed?"You own your Business Agent license. Publish your shop or edit your catalog.":r.sales_enabled?"₹999 purchase available. Review the product and refund terms before paying.":"Free preview available. ₹999 purchase will open only after final checkout and recovery tests.")
}catch(e){status("Account is connected, but the shop service could not be reached: "+e.message);warn("Live sales and hosting are not available while this error persists.")}
}
async function auth(action){
const email=$("agentEmail").value.trim(),password=$("agentPassword").value;
if(!email||password.length<8){warn("Enter your email and password (at least 8 characters).");return}
const r=action==="signUp"?await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+"/"}}):await client.auth.signInWithPassword({email,password});
if(r.error)throw r.error;
warn(action==="signUp"?"Account created. Confirm the email if required, then sign in.":"Signed in successfully.");
await refresh()}
$("agentSignIn").onclick=()=>auth("signIn").catch(e=>warn(e.message));
$("agentSignUp").onclick=()=>auth("signUp").catch(e=>warn(e.message));
$("agentGoogle").onclick=async()=>{const r=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(r.error)warn(r.error.message)};
$("agentSignOut").onclick=async()=>{loadedFor=null;await client.auth.signOut();await refresh()};
$("agentLoadShop").onclick=()=>{if(!saved?.shop_data)return warn("No saved shop found.");if(confirm("Restore your saved shop from the cloud? Unsaved changes on this device will be replaced.")){window.RA_importShop?.(saved.shop_data);loadedFor=session?.user?.id||null;warn("Your cloud shop has been restored.")}};
async function downloadOwnerEditor(){
 if(!loggedIn()||!licensed){warn("Sign in to a licensed Business Agent account before downloading.");return}
 try{
  const token=(await client.auth.getSession()).data.session?.access_token;if(!token)throw Error("Sign in again");
  warn("Preparing your independent owner app…");
  const shop=window.RA_exportShop?.();const seed=shop&&Array.isArray(shop.products)?JSON.stringify({shop}):"{}";if(seed.length>12000000)throw Error("Catalog too large to embed. Back up and reduce your photo sizes.");
  const r=await fetch(base+"/functions/v1/business-agent-download",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+token,"Content-Type":"application/json"},body:seed,cache:"no-store"});
  if(!r.ok){const data=await r.json().catch(()=>({}));throw Error(data.error||"Download failed")}
  const blob=await r.blob();if(blob.size<12000||blob.size>15000000)throw Error("Invalid downloaded app");
  const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="Racharla-Independent-Vendor-App.html";document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(link.href),8000);
  warn("Owner app downloaded. Open the HTML file in your browser to manage products without Vibe. Back up your editable catalog regularly. The downloaded app does not automatically sync customers.");
 }catch(e){warn("Owner app download failed: "+e.message)}
}
$("agentDownloadOwner").onclick=downloadOwnerEditor;
$("agentDownloadOwnerPublish").onclick=downloadOwnerEditor;
$("agentRecover").onclick=async()=>{if(!loggedIn())return warn("Sign in to recover your payment.");if(processing)return;processing=true;try{warn("Checking Razorpay payment records…");const r=await call("recover");warn(r.licensed?"Payment recovered and license active.":"No captured Business Agent purchase found. If charged, contact support with your Razorpay order ID.");await refresh()}catch(e){warn("Recovery failed: "+e.message)}finally{processing=false}};
$("agentBuy").onclick=async()=>{
if(processing)return;if(!loggedIn())return warn("Sign in before purchasing.");processing=true;
try{
const o=await call("checkout");if(o.already_licensed){await refresh();return}
if(!o.id||!o.key_id||o.amount!==99900||o.currency!=="INR")throw Error("Invalid order response");
if(typeof Razorpay!=="function")throw Error("Payment checkout could not load.");
const rzp=new Razorpay({key:o.key_id,amount:o.amount,currency:o.currency,order_id:o.id,name:"Racharla Business Agent",description:"One-time licensed vendor catalog studio",prefill:{email:session.user.email},theme:{color:"#0c7658"},handler:async result=>{try{warn("Verifying captured payment…");const v=await call("verify",result);warn(v.licensed?"Payment verified. Your Business Agent is activated.":"Payment pending. Use Recover purchase if needed.");await refresh()}catch(e){warn("Verification pending: "+e.message+". Use Recover purchase, do not pay again.")}}});
rzp.on("payment.failed",e=>warn("Payment did not complete: "+String(e?.error?.description||"Please retry").slice(0,160)));
rzp.open();
}catch(e){warn(e.message)}
finally{processing=false}
};
$("agentPublish").onclick=async()=>{
if(processing)return;if(!licensed)return warn("A verified purchase is required before publishing.");processing=true;
$("agentPublish").disabled=true;
try{let shop=window.RA_exportShop?.();if(!shop)throw Error("Missing shop data");const uploaded=await uploadProductPhotos(shop);const slug=$("agentSlug").value.trim().toLowerCase(),published=$("agentVisibility").value==="true";if(!/^[a-z0-9-]{3,70}$/.test(slug))throw Error("Use 3–70 lowercase letters, numbers or hyphens for your shop URL.");const result=await call("save",{shop,slug,published});saved={slug:result.slug,published:!!result.published,shop_data:shop};updateShopLinks();if(uploaded)window.RA_importShop?.(shop);$("agentShare").textContent=published?"Your shop is live: "+location.origin+location.pathname+"?shop="+encodeURIComponent(result.slug):"Private draft saved successfully.";warn(published?"Shop published. Copy the displayed URL and open it in another browser to verify.":"Your shop draft is saved.");await refresh();
}catch(e){warn("Cannot save shop: "+e.message)}
finally{processing=false;$("agentPublish").disabled=!licensed}
};
async function uploadProductPhotos(shop){
let changed=false;
for(const p of (shop.products||[])){
 const raw=String(p.image||"");
 if(!/^data:image\/(png|jpeg|webp);base64,/i.test(raw))continue;
 const mime=raw.slice(5,raw.indexOf(";")).toLowerCase();
 const ext=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
 const blob=await fetch(raw).then(r=>r.blob());
 if(blob.size>5242880)throw Error("An image exceeds the 5 MB upload limit.");
 const filename=session.user.id+"/"+crypto.randomUUID()+"."+ext;
 warn("Uploading product photos securely…");
 const result=await client.storage.from("business-agent-images").upload(filename,blob,{contentType:mime,cacheControl:"3600",upsert:false});
 if(result.error)throw Error("Photo upload failed: "+result.error.message);
 const publicImage=client.storage.from("business-agent-images").getPublicUrl(filename).data.publicUrl;
 if(!publicImage?.startsWith("https://"))throw Error("Could not create public photo URL.");
 p.image=publicImage;changed=true;
}
const qr=String(shop.merchantQr||"");if(/^data:image\/(png|jpeg|webp);base64,/i.test(qr)){const mime=qr.slice(5,qr.indexOf(";")).toLowerCase(),ext=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";const blob=await fetch(qr).then(r=>r.blob());if(blob.size>1500000)throw Error("Merchant QR image exceeds 1.5 MB");const filename=session.user.id+"/payment-qr-"+crypto.randomUUID()+"."+ext;warn("Uploading merchant QR safely…");const res=await client.storage.from("business-agent-images").upload(filename,blob,{contentType:mime,upsert:false});if(res.error)throw Error("Merchant QR upload failed: "+res.error.message);shop.merchantQr=client.storage.from("business-agent-images").getPublicUrl(filename).data.publicUrl;changed=true;}
const banner=String(shop.bannerImage||"");if(/^data:image\/(png|jpeg|webp);base64,/i.test(banner)){const mime=banner.slice(5,banner.indexOf(";")).toLowerCase(),ext=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";const blob=await fetch(banner).then(r=>r.blob());if(blob.size>4000000)throw Error("Shop banner exceeds 4 MB");const filename=session.user.id+"/shop-banner-"+crypto.randomUUID()+"."+ext;warn("Uploading shop banner…");const res=await client.storage.from("business-agent-images").upload(filename,blob,{contentType:mime,upsert:false});if(res.error)throw Error("Banner upload failed: "+res.error.message);shop.bannerImage=client.storage.from("business-agent-images").getPublicUrl(filename).data.publicUrl;changed=true;}return changed;
}

async function embedImagesForOffline(shop){
 let used=0,linked=0;
 async function embed(url,cap){if(typeof url!=="string"||!url.startsWith("https://"))return url;
  try{const r=await fetch(url,{mode:"cors"});if(!r.ok)throw Error("image fetch failed");const blob=await r.blob();
   if(!/^image\/(jpeg|png|webp)$/.test(blob.type)||blob.size>cap||used+blob.size>18000000)throw Error("image size/type exceeds portable limit");
   const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=reject;reader.readAsDataURL(blob)});
   used+=blob.size;return encoded;
  }catch(e){linked++;return url;}
 }
 shop.merchantQr=await embed(shop.merchantQr,1500000);shop.bannerImage=await embed(shop.bannerImage,4000000);
 for(const p of (shop.products||[]))p.image=await embed(p.image,1500000);
 return linked;
}

$("agentExportHTML").onclick=async()=>{
if(!licensed)return warn("A verified Business Agent license is required to download your storefront.");
try{
 const shop=window.RA_exportShop?.();if(!shop)throw Error("Missing shop");warn("Preparing an offline-friendly shop copy…");const externalImages=await embedImagesForOffline(shop);
 const resp=await fetch("shop-export-template.html",{cache:"no-store"});if(!resp.ok)throw Error("Export template unavailable");
 const template=await resp.text();
 if(!template.includes("__SHOP_DATA__"))throw Error("Invalid export template");
 const encoded=JSON.stringify(shop).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
 const html=template.replace("__SHOP_DATA__",encoded);
 const blob=new Blob([html],{type:"text/html;charset=utf-8"}),link=document.createElement("a");
 link.href=URL.createObjectURL(blob);link.download=(shop.name||"my-shop").replace(/[^a-z0-9-]+/gi,"-").slice(0,50)+"-rach arla-shop.html".replace(" ","");link.click();
 setTimeout(()=>URL.revokeObjectURL(link.href),2000);
 warn("Customer-shop HTML downloaded. "+(externalImages?externalImages+" image(s) still need internet access. ":"Images embedded where supported. ")+"This is a static catalog snapshot; re-export after edits.");
}catch(e){warn("Shop export failed: "+e.message)}
};

let currentShopSlug=null,currentPublicShop=null,lastChecked=0,deferredInstall=null,installed=false;
const publicUrl=slug=>location.origin+location.pathname+"?shop="+encodeURIComponent(slug);
const shopStateKey="rba_last_shop_v1",dismissPrefix="rba_install_dismissed_";
function shareUrl(){
 const url=$("publishedShopUrl").value.trim();if(!url||!saved?.published){warn("Publish your shop before sharing a customer link.");return null}return url;
}
async function copyText(v){
 if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(v);return true}catch{}}
 const input=document.createElement("textarea");input.value=v;input.style.position="fixed";input.style.opacity="0";document.body.appendChild(input);input.select();
 let worked=false;try{worked=document.execCommand("copy")}catch{}input.remove();return worked;
}
function updateShopLinks(){
 const url=saved?.published?publicUrl(saved.slug):"";
 $("publishedShopUrl").value=url;["shareWhatsApp","shareNative","copyShopUrl"].forEach(id=>$(id).disabled=!url);
}
$("shareWhatsApp").onclick=()=>{const url=shareUrl();if(!url)return;const text="Discover "+(saved?.shop_data?.name||"our shop")+" — browse products, prices and order via WhatsApp:\n"+url;window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer")};
$("shareNative").onclick=async()=>{const url=shareUrl();if(!url)return;const title=saved?.shop_data?.name||"Our business shop";if(navigator.share){try{await navigator.share({title,text:"Browse our latest products and services",url});return}catch(e){if(e?.name==="AbortError")return}}const ok=await copyText(url);warn(ok?"Shop link copied. Paste it into Instagram bio, WhatsApp, Facebook or SMS.":"Copy the displayed link to share your shop.")};
$("copyShopUrl").onclick=async()=>{const url=shareUrl();if(url)warn(await copyText(url)?"Your shop URL is copied.":"Select and copy your shop URL manually.")};
$("publishedShopUrl").onclick=function(){this.select()};
function standalone(){return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
function showInstallPrompt(){
 $("installHelp").hidden=true;
 if(standalone()||installed){$("customerInstallBanner").hidden=true;return}
 const dismissed=Number(localStorage.getItem(dismissPrefix+currentShopSlug)||0);
 $("customerInstallBanner").hidden=!!(dismissed&&Date.now()-dismissed<30*86400000);
}
function installHelp(){
 $("installHelp").hidden=false;
 $("installInstructions").textContent=/iPhone|iPad|iPod/i.test(navigator.userAgent)?"On iPhone: Open this shop in Safari. Tap Share, then Add to Home Screen.": "Open your browser menu and choose Install app or Add to Home Screen if available. If you already installed Racharla Shops, opening it will return to the last shop you visited.";
}
async function installClick(){
 if(standalone()||installed){$("customerUpdateStatus").textContent="This Racharla Shops app is already installed.";return}
 if(deferredInstall){const e=deferredInstall;deferredInstall=null;try{await e.prompt();const choice=await e.userChoice;if(choice?.outcome==="accepted"){$("customerInstallBanner").hidden=true;$("customerUpdateStatus").textContent="Install accepted. Your home-screen icon will open Racharla Shops."}else installHelp()}catch{installHelp()}}
 else installHelp();
}
$("vendorInstall").onclick=async()=>{if(standalone())return warn("Racharla Shops is already running as an installed web app. Bookmark this dashboard for easy owner access.");if(deferredInstall){const prompt=deferredInstall;deferredInstall=null;try{await prompt.prompt();const result=await prompt.userChoice;if(result?.outcome==="accepted"){warn("Racharla Shops installed. Sign in any time to manage and publish your shop.");return}}catch{}}warn(/iPhone|iPad|iPod/i.test(navigator.userAgent)?"To add your owner dashboard on iPhone, open in Safari → Share → Add to Home Screen. The installed shared app may resume the last customer shop. Bookmark the vendor dashboard separately.":"Use your browser menu → Install app or Add to Home Screen. Bookmark this vendor dashboard if the installed Racharla Shops app opens a customer shop instead.");};
$("customerInstall").onclick=installClick;
$("installBannerAction").onclick=installClick;
$("installDismiss").onclick=()=>{$("installHelp").hidden=true};
$("installBannerDismiss").onclick=()=>{if(currentShopSlug)localStorage.setItem(dismissPrefix+currentShopSlug,String(Date.now()));$("customerInstallBanner").hidden=true};
addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;showInstallPrompt()});
addEventListener("appinstalled",()=>{installed=true;deferredInstall=null;$("customerInstallBanner").hidden=true;$("installHelp").hidden=true});
async function shareCustomer(){
 const url=location.origin+location.pathname+"?shop="+encodeURIComponent(currentShopSlug||"");
 if(navigator.share){try{await navigator.share({title:currentPublicShop?.name||"Shop",text:"See current products and order on WhatsApp",url});return}catch(e){if(e?.name==="AbortError")return}}
 $("customerUpdateStatus").textContent=await copyText(url)?"Shop link copied. Share it with friends.":"Copy the shop link from your browser's address bar.";
}
$("customerShare").onclick=shareCustomer;
async function refreshPublicCatalog({quiet=false}={}){
 if(!currentShopSlug)return true;
 if(!quiet)$("customerUpdateStatus").textContent="Checking latest products and prices…";
 try{
  const response=await call("public",{slug:currentShopSlug},false);
  const latest=response.shop;
  lastChecked=Date.now();
  const updated=JSON.stringify(latest)!==JSON.stringify(currentPublicShop);
  if(updated){
   currentPublicShop=latest;
   window.RA_openPublicShop?.(latest);
   $("customerUpdateStatus").textContent="The seller has updated this shop. The latest prices and products are shown. Please select your items again.";
  }else if(!quiet)$("customerUpdateStatus").textContent="Catalog is up to date. Seller confirms final prices and availability.";
  return !updated;
 }catch(e){
  $("customerUpdateStatus").textContent="Cannot check live prices or availability. Check your internet connection and refresh before ordering.";
  return false;
 }
}
window.RA_beforeOrder=()=>refreshPublicCatalog({quiet:true});
$("refreshCatalog").onclick=()=>refreshPublicCatalog();
addEventListener("visibilitychange",()=>{if(!document.hidden&&currentShopSlug&&Date.now()-lastChecked>45000)refreshPublicCatalog({quiet:true})});
addEventListener("focus",()=>{if(currentShopSlug&&Date.now()-lastChecked>45000)refreshPublicCatalog({quiet:true})});
if("serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{})}
async function publicShop(){
 const url=new URL(location.href);
 let slug=url.searchParams.get("shop");
 if(!slug&&url.searchParams.get("launch")==="shop"&&standalone()){try{slug=localStorage.getItem(shopStateKey)||""}catch{}}
 if(!slug)return false;
 if(!/^[a-z0-9-]{3,70}$/.test(slug)){status("Invalid shop URL");return true}
 document.title="Shop on Racharla Business Agent";
 try{
  let r=await call("public",{slug},false);
  currentShopSlug=slug;currentPublicShop=r.shop;lastChecked=Date.now();
  try{localStorage.setItem(shopStateKey,slug)}catch{}
  $("accountPanel").hidden=true;
  window.RA_openPublicShop?.(r.shop);
  $("customerUpdateStatus").textContent="Live shop loaded. Refresh before ordering; prices and stock may change.";
  showInstallPrompt();
  return true;
 }catch(e){
  $("studio").hidden=false;
  status("Could not open this shop: "+e.message);
  warn("This shop may be private, unpublished or unavailable. Try again online.");
  return true;
 }
}
(async()=>{if(await publicShop())return;await refresh();client.auth.onAuthStateChange(()=>{setTimeout(()=>refresh(),0)})})();

})();
/* Shared cloud/session/navigation primitives for Racharla Business Agent ₹99 monthly. */
(()=>{"use strict";
const $=id=>document.getElementById(id),$$=s=>Array.from(document.querySelectorAll(s));
const cfg=window.RG_CONFIG||{},base=String(cfg.SUPABASE_URL||"").replace(/\/$/,""),key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY||"";
const client=window.supabase&&base&&key?window.supabase.createClient(base,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const apiUrl=base+"/functions/v1/business-agent-monthly-api";
const blank=()=>({idea:"",name:"",model:"general",kind:"shop",phone:"",address:"",currency:"INR",tagline:"",about:"",offerText:"",bannerImage:"",upi:"",merchantQr:"",pickup:true,delivery:false,deliveryFee:0,appointment:false,cashPickup:true,cashDelivery:false,directUpi:false,showQr:false,products:[]});
const userKey=u=>"rba_monthly_owner_"+u,guestKey="rba_monthly_guest_v1";
const format=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(Number(v)||0);
const phone=p=>String(p||"").replace(/\D/g,"");
const slug=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/^-+|-+$/g,"").slice(0,70);
function read(k){try{const x=JSON.parse(localStorage.getItem(k)||"null");return x&&Array.isArray(x.products)?{...blank(),...x}:null}catch{return null}}
const state={ownerId:null,shop:read(guestKey)||blank(),session:null,entitled:false,legacy:false,paidThrough:null,salesEnabled:false,pricing:{monthly_amount_paise:9900,reference_amount_paise:49900,reference_kind:"planned",offer_label:"Launch offer",offer_details:"Introductory offer for shop owners.",offer_active:true},saved:null,retentionDeadline:null,retentionDays:60,restartRequired:false,restartPrepared:false,operations:null,tab:"overview",customerSlug:null,customerShop:null,cart:{},lastFetched:0,paying:false,publishing:false};
function notice(s,good=false){const el=$("notice");if(el){el.textContent=s;el.classList.toggle("success",!!good)}}
function customerNotice(s){const el=$("customerOrderStatus");if(el)el.textContent=s}
function persist(){
 try{localStorage.setItem(state.ownerId?userKey(state.ownerId):guestKey,JSON.stringify(state.shop));return true}
 catch{notice("Your device storage is full. Reduce photos and keep a backup. These changes may not be saved.");return false}
}
async function call(action,data={},auth=true){
 if(!key||!base)throw Error("Online service is not configured");
 const headers={"Content-Type":"application/json",apikey:key};
 if(auth){if(!client)throw Error("Sign-in unavailable");const t=(await client.auth.getSession()).data.session?.access_token;if(!t)throw Error("Sign in to continue");headers.Authorization="Bearer "+t}
 const ctl=new AbortController,timer=setTimeout(()=>ctl.abort(),25000);
 try{const r=await fetch(apiUrl,{method:"POST",headers,body:JSON.stringify({action,...data}),signal:ctl.signal,cache:"no-store"});const j=await r.json().catch(()=>({error:"Invalid server response"}));if(!r.ok)throw Error(j.error||"Request failed");return j}finally{clearTimeout(timer)}
}
const steps=["overview","business","products","settings","billing","publish","orders"];
function navigate(s,fromHistory=false){
 if(!steps.includes(s))s="overview";
 if(s!==state.tab&&!fromHistory)try{history.pushState({rba:s,rbaPrevious:state.tab,rbaDepth:(Number(history.state?.rbaDepth)||0)+1},"",location.pathname+location.search+"#"+s)}catch{}
 state.tab=s;
 $$("[data-section]").forEach(el=>el.hidden=el.dataset.section!==s);
 $$("[data-tab]").forEach(el=>{el.classList.toggle("active",el.dataset.tab===s);el.setAttribute("aria-current",el.dataset.tab===s?"step":"false")});
 const names={overview:"Your business, beautifully online.",business:"Business details",products:"Products & services",settings:"Customer choices",billing:"Monthly shop access",publish:"Publish your shop",orders:"Customer orders"};
 $("pageTitle").textContent=names[s];$("backStep").hidden=s==="overview";
 if(s==="orders"&&typeof window.RBA?.loadOrders==="function")window.RBA.loadOrders();
 const section=document.querySelector('[data-section="'+s+'"]');section?.scrollIntoView({behavior:"smooth",block:"start"});
}
if($("vendorApp")){
 $$("[data-tab]").forEach(b=>b.onclick=()=>navigate(b.dataset.tab));
 $("backStep").onclick=()=>{const i=steps.indexOf(state.tab);const previous=state.tab==="orders"?"overview":steps[Math.max(0,i-1)];if(history.state?.rbaPrevious===previous&&Number(history.state?.rbaDepth)>0){history.back();return}try{history.replaceState({...history.state,rba:previous,rbaPrevious:null},"",location.pathname+location.search+"#"+previous)}catch{}navigate(previous,true)};
 addEventListener("popstate",e=>{if(state.customerSlug)return;if($("customerApp")&&!$("customerApp").hidden){$("customerApp").hidden=true;$("vendorApp").hidden=false}navigate(e.state?.rba||location.hash.slice(1)||"overview",true)});
}
function getPublicLink(){return state.saved?.published?location.origin+location.pathname+"?shop="+encodeURIComponent(state.saved.slug):""}
function displayPricing(){const p=state.pricing||{};const amount=Number(p.monthly_amount_paise)||9900;const fmt=n=>"₹"+(n/100).toLocaleString("en-IN",{maximumFractionDigits:2});if($("billingAmount"))$("billingAmount").textContent=fmt(amount);if($("payBtnPrice"))$("payBtnPrice").textContent=fmt(amount);if($("billingOfferLabel"))$("billingOfferLabel").textContent=p.offer_active?(p.offer_label||"Launch offer"):"Current monthly rate";if($("billingOfferDetails"))$("billingOfferDetails").textContent=p.offer_active?(p.offer_details||"Introductory offer for shop owners."):"Current monthly rate";const show=!!p.offer_active&&p.reference_kind!=="none"&&Number(p.reference_amount_paise)>amount;if($("billingCompare"))$("billingCompare").hidden=!show;if(show){$("billingReference").textContent=fmt(Number(p.reference_amount_paise));$("billingCompareKind").textContent=p.reference_kind==="former"?"Genuine former selling price":"Planned regular rate — not a former selling price"}}
async function refreshPricing(){try{const r=await call("pricing",{},false);if(r.pricing&&Number.isInteger(r.pricing.monthly_amount_paise)){state.pricing=r.pricing;displayPricing();displayPlan()}}catch(e){/* The server must always verify actual checkout price. */}}
function displayRetention(){
 const el=$("retentionStatus"),maint=$("maintenanceStatus");if(!el||!maint)return;
 if(!state.session?.user){el.textContent="Sign in to see your paid period and renewal deadline.";return}
 if(state.legacy){el.textContent="Your earlier paid license is honored; the new monthly retention limit does not cancel it."}
 else if(state.restartRequired){el.textContent="Your earlier catalog retention window has ended. A fresh shop catalog is required for new activation."}
 else if(!state.paidThrough||Date.parse(state.paidThrough)<0){el.textContent="Your first month begins when your monthly payment activates."}
 else {const until=Date.parse(state.paidThrough),now=Date.now(),deadline=state.retentionDeadline?Date.parse(state.retentionDeadline):until+state.retentionDays*86400000;el.textContent=until>now?"Active until "+new Date(until).toLocaleDateString("en-IN")+". Renew anytime to extend one month.":now<deadline?"Shop paused. Renew within "+Math.max(1,Math.ceil((deadline-now)/86400000))+" day(s), by "+new Date(deadline).toLocaleDateString("en-IN")+", to continue with the same shop.":"Retention window ended. Renewing will require a new catalog."}
 const cutoffReached=!!(state.retentionDeadline&&Date.parse(state.retentionDeadline)<Date.now()&&!state.legacy);$("restartShop").hidden=!(state.restartRequired||cutoffReached);const op=state.operations;const newSales=!op?.new_enrollment_enabled,renewals=!op?.renewal_enabled;maint.hidden=!(newSales||renewals);if(!maint.hidden)maint.textContent=(newSales?"New enrollments are paused. ":"")+(renewals?"Renewals are paused. ":"")+(op?.maintenance_message||"Please try later.");
}
function displayPlan(){
 const end=state.paidThrough?new Date(state.paidThrough):null;
 const monthly="₹"+((Number(state.pricing?.monthly_amount_paise)||9900)/100).toLocaleString("en-IN",{maximumFractionDigits:2});const text=state.legacy?"Your earlier one-time purchase remains honored":state.entitled?"Active through "+(end?.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})||"your prepaid period"):"No active monthly access — "+monthly+" per prepaid month";
 $("accountSummary").textContent=state.session?.user?"Signed in as "+state.session.user.email+" · "+text:"Sign in to publish and manage your shop.";
 $("billingExpiry").textContent=text;$("planSummary").textContent=text;
 $("payBtn").disabled=state.legacy;$("payBtn").textContent=state.legacy?"Existing purchase recognized":state.entitled?"Extend by 1 month · "+monthly:"Activate 1 month · "+monthly;
 $("publishStatus").textContent=state.entitled?"Your paid shop is active. Publish your current catalog when ready.":"Your shop will be paused until you activate or renew a paid month. Your saved data is retained.";
 $("publicLink").value=getPublicLink();displayRetention();
}
async function refreshAccount(){
 if(!client){notice("Cloud sign-in is unavailable; try again with internet connection.");return}
 state.session=(await client.auth.getSession()).data.session;const signed=!!state.session?.user;
 for(const id of ["loginFields","loginBtn","signupBtn","googleBtn"])$(id).hidden=signed;
 $("logoutBtn").hidden=!signed;
 if(!signed){state.ownerId=null;state.entitled=false;state.legacy=false;state.paidThrough=null;state.salesEnabled=false;state.restartRequired=false;state.retentionDeadline=null;state.operations=null;state.saved=null;state.shop=read(guestKey)||blank();window.RBA?.renderOwner?.();displayPlan();return}
 const uid=state.session.user.id;
 if(state.ownerId!==uid){
  if(state.ownerId)persist();
  const existing=read(userKey(uid)),guest=state.ownerId===null?state.shop:null;
  state.shop=existing||((guest?.name&&guest.products?.length)?guest:blank());
  state.ownerId=uid;persist();
 }
 try{
  const r=await call("me");
  state.entitled=!!r.licensed;state.legacy=!!r.legacy;state.paidThrough=r.paid_through;state.salesEnabled=!!r.sales_enabled;state.restartRequired=!!r.requires_new_shop;state.retentionDeadline=r.retention_deadline||null;state.retentionDays=Number(r.retention_days)||60;state.operations=r.operations||null;if(r.pricing)state.pricing=r.pricing;displayPricing();state.saved=r.shop||null;
  if(state.saved?.shop_data){const local=read(userKey(uid));if(!local?.name||!local?.products?.length){state.shop={...blank(),...state.saved.shop_data};persist()}}
  window.RBA?.renderOwner?.();displayPlan();notice(state.entitled?"Your online shop access is active. Edit and republish for current prices.":"Free shop preview available. Your data stays on this account for renewal.",state.entitled);
 }catch(e){state.entitled=false;state.salesEnabled=false;displayPlan();notice("Cannot check plan: "+e.message)}
}
async function auth(kind){
 if(!client)throw Error("Cloud sign-in unavailable");
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||password.length<8)throw Error("Enter email and a password of at least 8 characters");
 const r=kind==="signup"?await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}}):await client.auth.signInWithPassword({email,password});
 if(r.error)throw r.error;await refreshAccount();
 notice(kind==="signup"?"Account created. Confirm your email if required, then sign in.":"Signed in.",true);
}
function authHandlers(){
 $("loginBtn").onclick=()=>auth("signin").catch(e=>notice(e.message));
 $("signupBtn").onclick=()=>auth("signup").catch(e=>notice(e.message));
 $("googleBtn").onclick=async()=>{if(!client)return notice("Google sign-in unavailable");const r=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(r.error)notice(r.error.message)};
 $("logoutBtn").onclick=async()=>{persist();await client.auth.signOut();state.ownerId=null;state.shop=read(guestKey)||blank();await refreshAccount();notice("Signed out; private shop data is no longer shown.",true)};
}
async function compress(file,dimension=700,quality=.7){
 if(!file)return null;if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>5000000)throw Error("Choose a JPG, PNG or WebP under 5 MB");
 const src=URL.createObjectURL(file);try{
  const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
  const scale=Math.min(1,dimension/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL("image/jpeg",quality);
 }finally{URL.revokeObjectURL(src)}
}
window.RBA={$, $$,state,blank,format,phone,slug,read,persist,call,notice,customerNotice,navigate,displayPlan,refreshAccount,refreshPricing,displayPricing,authHandlers,compress,client,base,key,getPublicLink};
})();
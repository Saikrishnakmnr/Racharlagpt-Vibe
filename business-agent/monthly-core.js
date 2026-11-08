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
const state={ownerId:null,shop:read(guestKey)||blank(),session:null,entitled:false,legacy:false,shopClosed:false,paidThrough:null,salesEnabled:false,pricing:{monthly_amount_paise:9900,reference_amount_paise:49900,reference_kind:"planned",offer_label:"Launch offer",offer_details:"Introductory offer for shop owners.",offer_active:true},saved:null,retentionDeadline:null,retentionDays:60,restartRequired:false,restartPrepared:false,operations:null,tab:"overview",customerSlug:null,customerShop:null,cart:{},lastFetched:0,paying:false,publishing:false};
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
 const monthly="₹"+((Number(state.pricing?.monthly_amount_paise)||9900)/100).toLocaleString("en-IN",{maximumFractionDigits:2});const text=state.shopClosed?"Shop permanently closed — its URL cannot be reactivated":state.legacy?"Your earlier one-time purchase remains honored":state.entitled?"Active through "+(end?.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})||"your prepaid period"):"No active monthly access — "+monthly+" per prepaid month";
 $("accountSummary").textContent=state.session?.user?"Signed in as "+state.session.user.email+" · "+text:"Sign in to publish and manage your shop.";
 $("billingExpiry").textContent=text;$("planSummary").textContent=text;
 $("payBtn").disabled=state.legacy||state.shopClosed;$("payBtn").textContent=state.shopClosed?"Closed — no further payments":state.legacy?"Existing purchase recognized":state.entitled?"Extend by 1 month · "+monthly:"Activate 1 month · "+monthly;
 $("publishStatus").textContent=state.shopClosed?"This shop has been closed permanently. Its published catalog and URL cannot be restored.":state.entitled?"Your paid shop is active. Publish your current catalog when ready.":"Your shop will be paused until you activate or renew a paid month. Your saved data is retained.";
 $("publicLink").value=getPublicLink();displayRetention();
}
async function refreshAccount(){
 if(!client){notice("Cloud sign-in is unavailable; try again with internet connection.");return}
 state.session=(await client.auth.getSession()).data.session;const signed=!!state.session?.user;
 for(const id of ["loginFields","loginBtn","signupBtn","googleBtn"])$(id).hidden=signed;
 $("logoutBtn").hidden=!signed;
 if(!signed){state.ownerId=null;state.entitled=false;state.legacy=false;state.shopClosed=false;state.paidThrough=null;state.salesEnabled=false;state.restartRequired=false;state.retentionDeadline=null;state.operations=null;state.saved=null;state.shop=read(guestKey)||blank();window.RBA?.renderOwner?.();displayPlan();if($("cleanupControls"))$("cleanupControls").hidden=true;if($("shopPauseControls"))$("shopPauseControls").hidden=true;return}
 const uid=state.session.user.id;
 if(state.ownerId!==uid){
  if(state.ownerId)persist();
  const existing=read(userKey(uid)),guest=state.ownerId===null?state.shop:null;
  // A shared-device guest preview must never silently become another owner's shop.
  const importGuest=!existing&&guest?.name&&guest.products?.length&&confirm("A free-preview shop draft exists on this device. Is it YOUR business draft, and do you want to import it into this account? Select Cancel to start with an empty shop.");
  state.shop=existing||(importGuest?structuredClone(guest):blank());
  try{localStorage.removeItem(guestKey)}catch(e){} // Never expose this guest draft to another account after account selection.
  state.ownerId=uid;persist();
 }
 try{
  const r=await call("me");
  state.entitled=!!r.licensed;state.legacy=!!r.legacy;state.shopClosed=!!r.shop_closed;state.closure=r.closure||null;state.paidThrough=r.paid_through;state.salesEnabled=!!r.sales_enabled;state.restartRequired=!!r.requires_new_shop;state.retentionDeadline=r.retention_deadline||null;state.retentionDays=Number(r.retention_days)||60;state.operations=r.operations||null;if(r.pricing)state.pricing=r.pricing;displayPricing();state.saved=r.shop||null;
  if(state.shopClosed){state.shop=blank();try{localStorage.removeItem(userKey(uid))}catch(e){}}
  if(!state.shopClosed&&state.saved?.shop_data){const local=read(userKey(uid));if(!local?.name||!local?.products?.length){state.shop={...blank(),...state.saved.shop_data};persist()}}
  window.RBA?.renderOwner?.();displayPlan();window.RBA?.refreshCleanup?.();window.RBA?.refreshClosure?.();window.RBA?.refreshPauseControls?.();notice(state.shopClosed?"This shop was permanently closed. The original URL cannot be reactivated.":state.entitled?"Your online shop access is active. Edit and republish for current prices.":"Free shop preview available. Your data stays on this account for renewal.",state.entitled);
 }catch(e){state.entitled=false;state.salesEnabled=false;displayPlan();notice("Cannot check plan: "+e.message)}
}
async function auth(kind){
 if(!client)throw Error("Cloud sign-in unavailable");
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||password.length<8)throw Error("Enter a valid email and password of at least 8 characters");
 if(kind==="signup"){
  const r=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
  if(r.error){
   if(r.error.code==="user_already_exists"||/already registered/i.test(r.error.message||""))throw Error("This email already has a Vibe account. Choose Sign in, Continue with Google (if used before), or Forgot password.");
   throw r.error;
  }
  await refreshAccount();
  if(r.data?.session)notice("Account created and signed in. You can now build your shop.",true);
  else notice("Account created. Check your email for a confirmation link, then return and sign in. If no email arrives, check spam or contact support.",true);
  return;
 }
 const r=await client.auth.signInWithPassword({email,password});
 if(r.error){
  if(r.error.code==="invalid_credentials"||/invalid login credentials/i.test(r.error.message||""))throw Error("Email or password not recognized. If you previously used Google, choose Continue with Google. Otherwise use Forgot password.");
  if(/email not confirmed/i.test(r.error.message||""))throw Error("Please confirm your email from the signup message before signing in.");
  throw r.error;
 }
 await refreshAccount();
 notice("Signed in. Your saved shop and monthly access have been loaded.",true);
}
function showPasswordRecovery(show){
 const panel=$("passwordRecoveryPanel");
 if(panel)panel.hidden=!show;
 if(show)panel?.scrollIntoView({block:"center",behavior:"smooth"});
}
function authHandlers(){
 $("loginBtn").onclick=()=>auth("signin").catch(e=>notice(e.message));
 $("signupBtn").onclick=()=>auth("signup").catch(e=>notice(e.message));
 $("googleBtn").onclick=async()=>{if(!client)return notice("Google sign-in unavailable");const r=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(r.error)notice(r.error.message)};
 $("resetPasswordBtn").onclick=async()=>{
  if(!client)return notice("Password recovery is unavailable");
  const email=$("email").value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return notice("Enter your account email in the Email field, then choose Forgot password.");
  const btn=$("resetPasswordBtn");btn.disabled=true;
  try{
   const r=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+"?password_recovery=1"});
   if(r.error)throw r.error;
   notice("If this email has a password account, a recovery link has been requested. Check your inbox and spam folder. Google-only customers can use Continue with Google.",true);
  }catch(e){notice("Password recovery could not be sent: "+(e.message||"Please retry"))}finally{btn.disabled=false}
 };
 $("saveNewPassword").onclick=async()=>{
  if(!client)return notice("Password recovery is unavailable");
  const password=$("newPassword").value,confirmation=$("confirmNewPassword").value;
  if(password.length<8)return notice("Your new password must contain at least 8 characters.");
  if(password!==confirmation)return notice("The two new passwords do not match.");
  const btn=$("saveNewPassword");btn.disabled=true;
  try{
   const session=(await client.auth.getSession()).data.session;
   if(!session)throw Error("Recovery link expired or has not been verified. Request another password reset email.");
   const result=await client.auth.updateUser({password});
   if(result.error)throw result.error;
   $("newPassword").value="";$("confirmNewPassword").value="";
   showPasswordRecovery(false);
   try{const url=new URL(location.href);url.searchParams.delete("password_recovery");history.replaceState(history.state,"",url.pathname+url.search+url.hash)}catch{}
   await refreshAccount();
   notice("Password updated successfully. Your saved shop is available in this account.",true);
  }catch(e){notice("Password update failed: "+(e.message||"Try requesting a new reset link."))}finally{btn.disabled=false}
 };
 client?.auth.onAuthStateChange((event)=>{
  if(event==="PASSWORD_RECOVERY"){showPasswordRecovery(true);notice("Recovery link verified. Enter and save your new password.",true)}
 });
 if(new URLSearchParams(location.search).get("password_recovery")==="1"||location.hash.includes("type=recovery")){
  client.auth.getSession().then(({data})=>{if(data.session){showPasswordRecovery(true);notice("Enter a new password to finish account recovery.",true)}});
 }
 $("logoutBtn").onclick=async()=>{persist();try{localStorage.removeItem(guestKey)}catch(e){}await client.auth.signOut();state.ownerId=null;state.shop=blank();showPasswordRecovery(false);await refreshAccount();notice("Signed out; private shop data is no longer shown.",true)};
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
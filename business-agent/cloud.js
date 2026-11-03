/* Racharla Business Agent cloud integration. Independent of legacy Vibe checkout. */
(()=>{"use strict";
const cfg=window.RG_CONFIG||{};
const base=String(cfg.SUPABASE_URL||"").replace(/\/$/,"");
const key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY||"";
const $=id=>document.getElementById(id);
if(!window.supabase||!base||!key){$("accountStatus").textContent="Cloud services unavailable. You can still try the local preview.";return}
const client=window.supabase.createClient(base,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const API=base+"/functions/v1/business-agent-api";
let session=null,licensed=false,saved=null,processing=false;
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
licensed=false;saved=null;
$("agentBuy").disabled=true;$("agentPublish").disabled=true;
if(!loggedIn()){status("Try a free preview. Sign in to purchase or publish a permanent shop.");$("agentShare").textContent="A public shop URL requires a verified Business Agent license.";return}
status("Checking your purchases for "+(session.user.email||"your account")+"…");
try{const r=await call("me");licensed=!!r.licensed;saved=r.shop;
status(licensed?"✓ Business Agent licensed — "+session.user.email:"Signed in as "+session.user.email+" · free preview");
$("agentBuy").hidden=licensed;
$("agentBuy").disabled=!loggedIn()||licensed; // Server independently blocks checkout until launch gate is enabled.
$("agentPublish").disabled=!licensed;
if(saved){$("agentSlug").value=saved.slug;$("agentVisibility").value=String(!!saved.published);$("agentShare").textContent=saved.published?"Your shop: "+location.origin+location.pathname+"?shop="+encodeURIComponent(saved.slug):"Shop saved privately. Publish when ready.";
const local=window.RA_exportShop?.();if(!local?.products?.length&&saved.shop_data)window.RA_importShop?.(saved.shop_data);
}else if(licensed){$("agentShare").textContent="Enter a unique shop address and press Save & publish."}
warn(licensed?"You own your Business Agent license. Publish your shop or edit your catalog.":"Free preview available. ₹999 purchase is subject to final launch verification.")
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
$("agentSignOut").onclick=async()=>{await client.auth.signOut();await refresh()};
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
try{let shop=window.RA_exportShop?.();if(!shop)throw Error("Missing shop data");const slug=$("agentSlug").value.trim().toLowerCase(),published=$("agentVisibility").value==="true";if(!/^[a-z0-9-]{3,70}$/.test(slug))throw Error("Use 3–70 lowercase letters, numbers or hyphens for your shop URL.");const result=await call("save",{shop,slug,published});$("agentShare").textContent=published?"Your shop is live: "+location.origin+location.pathname+"?shop="+encodeURIComponent(result.slug):"Private draft saved successfully.";warn(published?"Shop published. Copy the displayed URL and open it in another browser to verify.":"Your shop draft is saved.");await refresh();
}catch(e){warn("Cannot save shop: "+e.message)}
finally{processing=false;$("agentPublish").disabled=!licensed}
};
async function publicShop(){
const url=new URL(location.href),slug=url.searchParams.get("shop");if(!slug)return false;
document.title="Shop on Racharla Business Agent";
try{let r=await call("public",{slug},false);$("accountPanel").hidden=true;window.RA_openPublicShop?.(r.shop);return true}
catch(e){$("studio").hidden=false;status("Could not open this shop: "+e.message);warn("This shop may be private, unpublished or unavailable.");return true}
}
(async()=>{if(await publicShop())return;await refresh();client.auth.onAuthStateChange(()=>{setTimeout(()=>refresh(),0)})})();
})();
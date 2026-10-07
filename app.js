/* RacharlaGPT Studio — production-oriented no-build browser app
   Safe demo fallback is enabled only when backend credentials are missing.
   Payments are never simulated. */
(() => {
  'use strict';
  const C = window.RG_CONFIG || {};
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const prices = { 10: 9, 20: 19, 30: 29, 50: 49, 100: 89 };
  const businessPrices = { 1: 9, 5: 29, 10: 49 };
  function templateSvg(category,label,index){
    const palettes={
      Wedding:['#f7d28a','#7a1f43','#fff8e8'],Couple:['#f59ab5','#4b1538','#fff1f6'],TempleWedding:['#e9b44c','#5b2c06','#fff5d6'],
      IndiaTemples:['#f2a33a','#6b2108','#fff4dc'],WorldTemples:['#7ec8e3','#18385d','#eefaff'],Birthday:['#ff7ab6','#5a2b9a','#fff0fa'],
      Family:['#77c6a8','#174c42','#f0fff9'],Travel:['#65b9d8','#153f68','#effaff'],Festival:['#ff9f43','#8f1732','#fff1df'],Business:['#6ea8ff','#172d61','#eef5ff'],
      Anniversary:['#f3b7d0','#4d1635','#fff1f7'],Invitation:['#d7b26d','#3b2710','#fff8e7'],Food:['#f08b47','#4a1a0c','#fff0df'],Salon:['#d58de7','#351443','#fff0ff'],Jewellery:['#e9c46a','#3a2404','#fff7d8'],
      Education:['#64c7f0','#0d3154','#eefaff'],RealEstate:['#83b6e8','#163b64','#eff7ff'],Thumbnail:['#ffd34d','#151515','#fff8d5'],Poster:['#ff6464','#4a1010','#fff1f1'],Kids:['#7fe2cf','#154f48','#effffb'],
      PreWedding:['#e7a7c2','#3e2036','#fff3f8'],FestivalOffer:['#ffb347','#702000','#fff2dd']
    };
    const p=palettes[category]||palettes.Wedding;
    const scenes={
      Wedding:`<circle cx="220" cy="430" r="115" fill="${p[0]}" opacity=".18"/><circle cx="860" cy="430" r="145" fill="${p[0]}" opacity=".16"/><path d="M190 820 Q540 570 890 820" fill="none" stroke="${p[0]}" stroke-width="16" opacity=".35"/>`,
      Couple:`<circle cx="370" cy="520" r="110" fill="${p[0]}" opacity=".22"/><circle cx="710" cy="520" r="110" fill="${p[0]}" opacity=".18"/><path d="M250 850 Q540 680 830 850" fill="none" stroke="${p[0]}" stroke-width="18" opacity=".4"/>`,
      Family:`<circle cx="300" cy="500" r="95" fill="${p[0]}" opacity=".2"/><circle cx="540" cy="420" r="125" fill="${p[0]}" opacity=".18"/><circle cx="780" cy="500" r="95" fill="${p[0]}" opacity=".2"/><path d="M180 880 Q540 620 900 880" fill="none" stroke="${p[0]}" stroke-width="18" opacity=".35"/>`,
      TempleWedding:`<path d="M180 760 L540 360 L900 760Z" fill="${p[0]}" opacity=".16"/><path d="M310 760 V570 H770 V760" fill="none" stroke="${p[0]}" stroke-width="16" opacity=".45"/><circle cx="540" cy="430" r="52" fill="${p[0]}" opacity=".3"/>`,
      IndiaTemples:`<path d="M160 800 L540 300 L920 800Z" fill="${p[0]}" opacity=".18"/><path d="M300 800 V560 H780 V800 M370 560 V480 M540 560 V410 M710 560 V480" fill="none" stroke="${p[0]}" stroke-width="15" opacity=".5"/>`,
      WorldTemples:`<circle cx="540" cy="610" r="270" fill="none" stroke="${p[0]}" stroke-width="10" opacity=".35"/><path d="M250 760 Q540 380 830 760" fill="none" stroke="${p[0]}" stroke-width="22" opacity=".35"/>`,
      Birthday:`<circle cx="260" cy="480" r="80" fill="${p[0]}" opacity=".3"/><circle cx="820" cy="430" r="100" fill="${p[0]}" opacity=".24"/><path d="M270 790 L810 790 L740 600 L340 600Z" fill="${p[0]}" opacity=".18"/>`,
      Travel:`<path d="M120 850 Q300 610 450 760 T900 650" fill="none" stroke="${p[0]}" stroke-width="30" opacity=".4"/><path d="M160 900 L390 520 L520 900 L700 470 L940 900" fill="none" stroke="${p[0]}" stroke-width="16" opacity=".35"/>`,
      Business:`<rect x="170" y="430" width="740" height="390" rx="40" fill="${p[0]}" opacity=".13"/><path d="M240 760 L380 620 L500 700 L680 500 L840 650" fill="none" stroke="${p[0]}" stroke-width="24" opacity=".55"/>`,
      Food:`<circle cx="540" cy="620" r="230" fill="${p[0]}" opacity=".16"/><circle cx="540" cy="620" r="145" fill="none" stroke="${p[0]}" stroke-width="18" opacity=".45"/><path d="M360 410 V830 M720 410 V830" stroke="${p[0]}" stroke-width="12" opacity=".25"/>`,
      Jewellery:`<polygon points="540,330 760,560 540,840 320,560" fill="${p[0]}" opacity=".16"/><polygon points="540,410 680,560 540,740 400,560" fill="none" stroke="${p[0]}" stroke-width="18" opacity=".55"/>`,
      Education:`<rect x="210" y="430" width="720" height="380" rx="35" fill="${p[0]}" opacity=".12"/><path d="M300 690 L430 570 L540 650 L700 490 L850 610" fill="none" stroke="${p[0]}" stroke-width="22" opacity=".55"/>`,
      RealEstate:`<path d="M220 800 V520 L540 300 L860 520 V800" fill="${p[0]}" opacity=".14"/><path d="M220 800 H860 M540 300 V800" stroke="${p[0]}" stroke-width="18" opacity=".5"/>`,
      Thumbnail:`<rect x="100" y="350" width="880" height="560" rx="42" fill="${p[0]}" opacity=".18"/><circle cx="790" cy="560" r="150" fill="${p[0]}" opacity=".3"/><path d="M170 820 L390 610 L540 740 L710 500 L910 820" fill="none" stroke="${p[0]}" stroke-width="24" opacity=".55"/>`,
      Poster:`<rect x="110" y="280" width="860" height="720" rx="50" fill="${p[0]}" opacity=".14"/><path d="M180 840 H900" stroke="${p[0]}" stroke-width="20" opacity=".55"/>`,
      Kids:`<circle cx="300" cy="520" r="95" fill="${p[0]}" opacity=".25"/><circle cx="780" cy="520" r="95" fill="${p[0]}" opacity=".22"/><path d="M180 800 Q540 620 900 800" fill="none" stroke="${p[0]}" stroke-width="24" opacity=".4"/>`,
      Invitation:`<rect x="150" y="300" width="780" height="760" rx="48" fill="${p[0]}" opacity=".12" stroke="${p[0]}" stroke-width="4"/><circle cx="540" cy="600" r="190" fill="none" stroke="${p[0]}" stroke-width="10" opacity=".45"/>`,
      Anniversary:`<path d="M540 850 C250 660 230 470 350 410 C430 370 500 430 540 500 C580 430 650 370 730 410 C850 470 830 660 540 850Z" fill="${p[0]}" opacity=".18" stroke="${p[0]}" stroke-width="10"/>`,
      Salon:`<circle cx="540" cy="600" r="230" fill="${p[0]}" opacity=".14"/><path d="M380 820 Q540 470 700 820" fill="none" stroke="${p[0]}" stroke-width="18" opacity=".5"/>`,
      PreWedding:`<circle cx="380" cy="560" r="110" fill="${p[0]}" opacity=".18"/><circle cx="700" cy="560" r="110" fill="${p[0]}" opacity=".16"/><path d="M260 850 Q540 660 820 850" fill="none" stroke="${p[0]}" stroke-width="18" opacity=".45"/>`,
      FestivalOffer:`<path d="M160 760 Q540 360 920 760" fill="none" stroke="${p[0]}" stroke-width="35" opacity=".35"/><circle cx="540" cy="520" r="150" fill="${p[0]}" opacity=".18"/>`
    };
    const text=String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const cat=String(category).replace(/&/g,'&amp;');
    const scene=scenes[category]||scenes.Wedding;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p[1]}"/><stop offset="1" stop-color="#080b18"/></linearGradient><radialGradient id="r"><stop stop-color="${p[0]}" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><rect width="1080" height="1350" fill="url(#r)"/>${scene}<rect x="72" y="70" width="936" height="1210" rx="56" fill="none" stroke="${p[0]}" stroke-width="4" opacity=".45"/><rect x="112" y="270" width="856" height="620" rx="40" fill="#fff" opacity=".055" stroke="${p[0]}" stroke-opacity=".55" stroke-width="3"/><text x="540" y="150" text-anchor="middle" fill="${p[0]}" font-family="Arial" font-size="23" font-weight="800" letter-spacing="6">RACHARLAGPT • ${cat.toUpperCase()}</text><text x="540" y="1010" text-anchor="middle" fill="white" font-family="Georgia,serif" font-size="56" font-weight="700">${text}</text><text x="540" y="1075" text-anchor="middle" fill="${p[2]}" font-family="Arial" font-size="20" letter-spacing="2">YOUR PHOTOS • YOUR STORY • YOUR DESIGN</text><rect x="250" y="1130" width="580" height="2" fill="${p[0]}" opacity=".55"/><text x="540" y="1190" text-anchor="middle" fill="${p[2]}" opacity=".85" font-family="Arial" font-size="17" letter-spacing="3">PREVIEW • PERSONALIZE • SHARE</text><text x="540" y="1260" text-anchor="middle" fill="${p[0]}" font-family="Arial" font-size="14" font-weight="700" letter-spacing="3">RACHARLAGPT PHOTO STUDIO</text></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }
  const templateLabels={
    Wedding:['Royal Wedding','Golden Ceremony','Elegant Vows','Classic Celebration','Modern Wedding','Wedding Memories'],
    Couple:['Forever Together','Romantic Portrait','Love Story','Golden Couple','Together Always','Couple Celebration'],
    TempleWedding:['Temple Wedding','Sacred Vows','South Indian Wedding','Heritage Ceremony','Traditional Blessings','Temple Celebration'],
    IndiaTemples:['Indian Temple','South India','Heritage Shrine','Golden Temple','Sacred Journey','Temple Memories'],
    WorldTemples:['World Temple','Thailand Heritage','Bali Temple','Angkor Journey','Sacred Travel','Temple Explorer'],
    Birthday:['Birthday Glow','Party Time','Birthday Joy','Cake & Candles','Color Celebration','Birthday Memories'],
    Family:['Family Day','Happy Family','Together','Family Memories','Home & Heart','Family Celebration'],
    Travel:['Mountain Escape','Beach Story','Road Trip','World Adventure','Travel Memories','City Explorer'],
    Festival:['Festival Night','Celebration','Cultural Fest','Music & Lights','Festival Crowd','Special Day'],
    Business:['Business Story','Modern Brand','Offer Design','Shop Promotion','Retail Showcase','Business Growth'],
    Anniversary:['Forever Us','Anniversary Love','Golden Years','Together Always','Memory Lane','Celebration Night'],
    Invitation:['Elegant Invite','Classic Invitation','Modern Invite','Family Function','Grand Celebration','Minimal Invite'],
    Food:['Restaurant Special','Food Festival','New Menu','Weekend Offer','Chef Special','Cafe Story'],
    Salon:['Salon Glow','Beauty Offer','Bridal Beauty','Hair Studio','Spa Day','Style Story'],
    Jewellery:['Gold Collection','Bridal Jewellery','Diamond Story','Festive Gold','New Arrivals','Jewellery Offer'],
    Education:['Study Smart','Exam Focus','Course Launch','Coaching Offer','Learning Tips','Student Success'],
    RealEstate:['New Property','Dream Home','Open House','Plot Offer','Luxury Home','Property Showcase'],
    Thumbnail:['Study Smarter','Grow Online','How To Guide','Business Tips','AI Tools','Motivation'],
    Poster:['Grand Opening','Festival Poster','Mega Offer','Event Poster','Special Announcement','Launch Day'],
    Kids:['Kids Birthday','Little Star','School Memories','Play Day','Cute Celebration','Kids Party'],
    PreWedding:['Golden Hour','Romantic Escape','Before Forever','Couple Portrait','Dreamy Pre Wedding','Love In The Air'],
    FestivalOffer:['Festival Sale','Special Discount','Diwali Offer','Wedding Season Offer','Weekend Sale','Mega Celebration']
  };
  const templateMeta={
    Wedding:'💍',Couple:'❤️',TempleWedding:'🛕',IndiaTemples:'🇮🇳',WorldTemples:'🌏',Birthday:'🎂',Family:'👨‍👩‍👧',Travel:'✈️',Festival:'🎉',Business:'🏢',
    Anniversary:'💖',Invitation:'✉️',Food:'🍽️',Salon:'💇',Jewellery:'💎',Education:'📚',RealEstate:'🏠',Thumbnail:'▶️',Poster:'🖼️',Kids:'🧸',PreWedding:'📸',FestivalOffer:'🏷️'
  };
  const templates=Object.fromEntries(Object.entries(templateLabels).map(([cat,labels])=>[cat,labels.map((label,i)=>[templateSvg(cat,label,i),label])]));
  const imageCategories=['All',...Object.keys(templateLabels)];

  let selectedTemplate = null;
  let uploadedPhotos = [];
  let lastBookItem = null;

  function toast(msg, type = 'info') {
    const el = $('#toast'); if (!el) return;
    el.textContent = msg;
    el.dataset.type = type;
    el.classList.add('show');
    clearTimeout(window.__rgToast);
    window.__rgToast = setTimeout(() => el.classList.remove('show'), 3400);
  }

  function backendReady() {
    return !!(C.SUPABASE_URL && (C.SUPABASE_ANON_KEY || C.SUPABASE_PUBLISHABLE_KEY) && !String(C.SUPABASE_URL).includes('YOUR-PROJECT'));
  }
  function paymentReady() {
    return !!(backendReady() && C.RAZORPAY_KEY_ID && !String(C.RAZORPAY_KEY_ID).includes('YOUR_'));
  }
  async function fn(name, body) {
    if (!backendReady()) throw new Error('Studio backend is not configured yet. Preview works in demo mode; connect Supabase before accepting payments.');
    if (name === 'create-order' || name === 'customer-orders' || name === 'complete-order' || name === 'retry-order' || name === 'publish-site' || name === 'upload-site-assets') {
      const client = supa();
      const { data: { session } } = client ? await client.auth.getSession() : { data: { session: null } };
      if (!session) { await openAuthModal('purchase'); throw new Error('Please sign up or log in before continuing.'); }
    }
    const client = supa();
    const { data: { session } } = client ? await client.auth.getSession() : { data: { session: null } };
    const headers = { 'Content-Type': 'application/json', 'apikey': C.SUPABASE_ANON_KEY || C.SUPABASE_PUBLISHABLE_KEY };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const r = await fetch(`${C.SUPABASE_URL}/functions/v1/${name}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || data.message || `Function ${name} failed`);
    return data;
  }

  let authClient = null;
  let authListenerReady = false;
  function supa() {
    if (!backendReady() || !window.supabase) return null;
    if (!authClient) {
      authClient = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY || C.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      if (!authListenerReady) {
        authListenerReady = true;
        authClient.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setTimeout(() => openPasswordUpdateModal(), 0);
          }
          if (event === 'SIGNED_IN') {
            const next = sessionStorage.getItem('rg_auth_next');
            sessionStorage.removeItem('rg_auth_next');
            if (next === 'orders') location.hash = '#orders';
          }
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') updateAccountUI();
        });
      }
    }
    return authClient;
  }

  async function currentUser() { const c=supa(); if(!c) return null; const {data:{user}}=await c.auth.getUser(); return user||null; }
  function authRedirectUrl(kind='') {
    const base = String(C.APP_URL || window.location.origin).replace(/\/$/, '');
    return `${base}/${kind ? '?auth=' + encodeURIComponent(kind) : ''}`;
  }
  async function openAuthModal(next='account') {
    const c=supa();
    if(!c) return toast('Supabase Auth is not configured.','error');
    openModal(`<span class="eyebrow">CUSTOMER ACCOUNT</span><h2 id="authTitle">Sign in to continue</h2><p id="authHint">Browse freely. Sign in only when you purchase or open My Orders.</p><button class="btn google-btn" id="googleAuthBtn" type="button"><span class="google-g">G</span> Continue with Google</button><div class="auth-divider"><span>OR</span></div><label>Email<input id="authEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="authPassword" type="password" autocomplete="current-password" placeholder="At least 6 characters"></label><button class="text-btn auth-forgot" id="authForgot" type="button">Forgot password?</button><div class="modal-actions"><button class="btn btn-primary" id="authSubmit">Sign in</button><button class="btn btn-ghost" id="authSwitch">Create account</button></div><p class="small-note">Your account links purchases, delivery status and My Orders. Google sign-in uses Supabase Auth.</p>`);
    let signup=false;
    const submit=async()=>{
      const email=$('#authEmail').value.trim(),password=$('#authPassword').value;
      if(!email||password.length<6)return toast('Enter a valid email and a password of at least 6 characters.','error');
      $('#authSubmit').disabled=true;
      try {
        if(signup){
          const {error}=await c.auth.signUp({email,password,options:{data:{full_name:''},emailRedirectTo:authRedirectUrl('account')}});
          if(error)throw error;
          toast('Account created. Check your email if verification is enabled.');
          closeModal();
        } else {
          const {error}=await c.auth.signInWithPassword({email,password});
          if(error)throw error;
          toast('Signed in successfully.');
          closeModal();
        }
        await updateAccountUI();
        if(next==='orders') location.hash='#orders';
      } catch(e) { toast(e.message||'Authentication failed.','error'); }
      finally { $('#authSubmit').disabled=false; }
    };
    $('#authSubmit').onclick=submit;
    $('#authPassword').addEventListener('keydown',e=>{if(e.key==='Enter')submit();});
    $('#authSwitch').onclick=()=>{
      signup=!signup;
      $('#authTitle').textContent=signup?'Create your account':'Sign in to continue';
      $('#authHint').textContent=signup?'Create an account once and keep every purchase in My Orders.':'Browse freely. Sign in only when you purchase or open My Orders.';
      $('#authSubmit').textContent=signup?'Create account':'Sign in';
      $('#authSwitch').textContent=signup?'I already have an account':'Create account';
      $('#authForgot').style.display=signup?'none':'inline-flex';
      $('#authPassword').setAttribute('autocomplete',signup?'new-password':'current-password');
    };
    $('#googleAuthBtn').onclick=async()=>{
      $('#googleAuthBtn').disabled=true;
      try {
        sessionStorage.setItem('rg_auth_next', next || 'account');
        const {error}=await c.auth.signInWithOAuth({provider:'google',options:{redirectTo:authRedirectUrl('oauth')}});
        if(error)throw error;
      } catch(e) { $('#googleAuthBtn').disabled=false; toast(e.message||'Google sign-in failed.','error'); }
    };
    $('#authForgot').onclick=()=>openForgotPasswordModal();
  }
  async function openForgotPasswordModal() {
    const c=supa();
    if(!c)return toast('Supabase Auth is not configured.','error');
    openModal(`<span class="eyebrow">PASSWORD RECOVERY</span><h2>Forgot your password?</h2><p>Enter your account email. We will send a secure password-reset link.</p><label>Email<input id="resetEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><div class="modal-actions"><button class="btn btn-primary" id="sendReset">Send reset link</button><button class="btn btn-ghost" id="backToLogin">Back to login</button></div><p class="small-note">For security, this screen does not reveal whether an email is registered.</p>`);
    $('#sendReset').onclick=async()=>{
      const email=$('#resetEmail').value.trim();
      if(!email)return toast('Enter your email address.','error');
      $('#sendReset').disabled=true;
      try {
        const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl('reset-password')});
        if(error)throw error;
        toast('If an account exists for that email, a reset link has been sent.');
        closeModal();
      } catch(e) { toast(e.message||'Could not send reset link.','error'); }
      finally { $('#sendReset').disabled=false; }
    };
    $('#backToLogin').onclick=()=>openAuthModal('account');
  }
  function openPasswordUpdateModal() {
    const c=supa();
    if(!c)return;
    openModal(`<span class="eyebrow">PASSWORD RECOVERY</span><h2>Set a new password</h2><p>Your reset link is valid. Choose a new password for your RacharlaGPT account.</p><label>New password<input id="newPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters"></label><label>Confirm password<input id="newPassword2" type="password" autocomplete="new-password" placeholder="Repeat your password"></label><button class="btn btn-primary btn-lg" id="updatePasswordBtn">Update password</button>`);
    $('#updatePasswordBtn').onclick=async()=>{
      const a=$('#newPassword').value,b=$('#newPassword2').value;
      if(a.length<6)return toast('Password must be at least 6 characters.','error');
      if(a!==b)return toast('Passwords do not match.','error');
      $('#updatePasswordBtn').disabled=true;
      try { const {error}=await c.auth.updateUser({password:a}); if(error)throw error; toast('Password updated successfully.'); closeModal(); await updateAccountUI(); }
      catch(e){toast(e.message||'Could not update password.','error');}
      finally{$('#updatePasswordBtn').disabled=false;}
    };
  }
  function handleAuthUrlErrors(){
    const hash=window.location.hash||'';
    if(!hash.includes('error_code=') && !hash.includes('error_description='))return;
    const params=new URLSearchParams(hash.replace(/^#/,''));
    const description=params.get('error_description')||params.get('error')||'Authentication was not completed.';
    let message=description.replace(/\+/g,' ');
    try { message=decodeURIComponent(message); } catch {}
    toast(message,'error');
    history.replaceState(null,'',window.location.pathname+window.location.search);
  }
  async function updateAccountUI(){ const u=await currentUser(); const b=$('#loginBtn'); if(b){b.textContent=u?(u.user_metadata?.full_name||u.email?.split('@')[0]||'Account'):'Login';} }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  function safeExternalUrl(value){ try { const u=new URL(String(value||'')); return ['http:','https:'].includes(u.protocol)?u.href:''; } catch { return ''; } }
  function safeName(s) {
    return String(s || '').replace(/[^a-z0-9\-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'racharlagpt-book';
  }
  function pageKey() { return (location.hash || '#home').slice(1).split('?')[0] || 'home'; }
  function siteSlugFromHash() { const raw=(location.hash||'').slice(1).split('?')[0]; return raw.startsWith('site/') ? decodeURIComponent(raw.slice(5)) : ''; }

  function route() {
    const siteSlug=siteSlugFromHash();
    const key = siteSlug ? 'site' : pageKey();
    document.body.classList.toggle('public-site-mode', !!siteSlug);
    if(!siteSlug) document.title='RacharlaGPT Studio — Create • Personalize • Sell • Share';
    $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${key}`));
    if(siteSlug) loadPublicSite(siteSlug);
    $$('#desktopNav a, #mobileMenu a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${key}`));
    if (key === 'images' && !selectedTemplate) renderTemplates('Wedding');
    if (key === 'orders') { loadCustomerOrders();
      const params = new URLSearchParams((location.hash.split('?')[1] || ''));
      const token = params.get('token');
      if (token) $('#orderToken').value = token;
    }
    if (key === 'admin') loadAdmin();
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  window.addEventListener('hashchange', route);

  function openModal(html) {
    $('#modalBody').innerHTML = html;
    $('#modal').classList.add('open');
    $('#modal').setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    $('#modal').classList.remove('open');
    $('#modal').setAttribute('aria-hidden', 'true');
  }
  function simpleModal(title, body, actions = '') {
    openModal(`<span class="eyebrow">RACHARLAGPT STUDIO</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>${actions}`);
  }

  function closeMobileMenu() {
    const m = $('#mobileMenu'); if (!m) return;
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
    $('#menuBtn')?.setAttribute('aria-expanded', 'false');
  }
  function toggleMobileMenu() {
    const m = $('#mobileMenu'); if (!m) return;
    const open = m.classList.toggle('open');
    m.setAttribute('aria-hidden', String(!open));
    $('#menuBtn')?.setAttribute('aria-expanded', String(open));
  }

  async function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  async function uploadSourceFiles() {
    const input = $('#sourceFiles');
    if (!input?.files?.length || !backendReady()) return [];
    const out = [];
    for (const file of [...input.files].slice(0, 6)) {
      if (file.size > 4 * 1024 * 1024) throw new Error(`${file.name} is larger than 4 MB. Please compress it first.`);
      const data = (await readAsDataUrl(file)).split(',')[1];
      const result = await fn('upload-source', { name: file.name, mime: file.type || 'application/octet-stream', data });
      if (result.path) out.push(result.path);
    }
    return out;
  }

  function setupAnalytics() {
    if (!C.GA4_MEASUREMENT_ID) return;
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(C.GA4_MEASUREMENT_ID)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args) => window.dataLayer.push(args);
    gtag('js', new Date()); gtag('config', C.GA4_MEASUREMENT_ID);
  }
  const ga = (name, params = {}) => { if (window.gtag) window.gtag('event', name, params); };

  function setupMonetag() {
    if (!C.MONETAG_SCRIPT_URL) return;
    try {
      const url = new URL(C.MONETAG_SCRIPT_URL, location.href);
      if (!/^https?:$/.test(url.protocol)) return;
      const script = document.createElement('script'); script.async = true; script.src = url.href;
      document.body.appendChild(script);
    } catch {}
  }

  function setupAds() {
    if (!C.ADSENSE_CLIENT_ID || !C.ADSENSE_HOME_SLOT) return;
    const slot = $('#homeAdSlot'); if (!slot) return;
    const script = document.createElement('script'); script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(C.ADSENSE_CLIENT_ID)}`;
    script.crossOrigin = 'anonymous'; document.head.appendChild(script);
    slot.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${escapeHtml(C.ADSENSE_CLIENT_ID)}" data-ad-slot="${escapeHtml(C.ADSENSE_HOME_SLOT)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }

  function chooseBookTheme(type, selected='auto') {
    if(selected && selected!=='auto') return selected;
    const t=String(type||'').toLowerCase();
    if(t.includes('children')) return 'children'; if(t.includes('study')) return 'education'; if(t.includes('business')) return 'business';
    if(t.includes('biography')) return 'biography'; if(t.includes('history')) return 'heritage'; if(t.includes('romance')||t.includes('poetry')) return 'romance';
    return 'luxury';
  }
  function setupBookPreview() {
    $('#bookIdea')?.addEventListener('input', e => {
      const title = e.target.value.trim().split(/[.!?]/)[0].slice(0, 70) || 'Your Book Title';
      $('#previewTitle').textContent = title;
      $('#previewChapter').textContent = title;
    });
    $('#bookType')?.addEventListener('change', e => { const theme=$('#bookTheme'); if(theme && theme.value==='auto') applyBookTheme(chooseBookTheme(e.target.value,'auto')); });
    $('#bookTheme')?.addEventListener('change', e => applyBookTheme(chooseBookTheme($('#bookType')?.value,e.target.value)));
    $('#publisherName')?.addEventListener('input', e => $('#previewPublisher').textContent = e.target.value.trim() || 'Your Name');
    $('#bookSubtitle')?.addEventListener('input', e => $('#previewSubtitle').textContent = e.target.value.trim() || 'A personalized digital book');
    $$('input[name="pages"]').forEach(x => x.addEventListener('change', updateBookTotal));
    ['bioAddon','coverAddon','illustrationAddon'].forEach(id => $(`#${id}`)?.addEventListener('change', updateBookTotal));
  }
  function applyBookTheme(theme){ const root=$('.book-preview'); if(root) root.dataset.theme=theme; }

  function updateBookTotal() {
    let p = prices[$('input[name="pages"]:checked')?.value || 10] || 9;
    if ($('#bioAddon')?.checked) p += 49;
    if ($('#coverAddon')?.checked) p += 19;
    if ($('#illustrationAddon')?.checked) p += 29;
    $('#bookTotal').textContent = money(p);
    return p;
  }

  function demoBook(item) {
    const title = item.idea.split(/[.!?]/)[0].trim().slice(0, 70) || 'My RacharlaGPT Book';
    const samples = {
      English: 'This sample is a polished preview. Your final book can expand the idea into structured chapters with a consistent voice, clear headings and a RacharlaGPT watermark on every page.',
      Telugu: 'ఇది మీ పుస్తకానికి నమూనా ప్రివ్యూ. మీ ఆలోచనను స్పష్టమైన అధ్యాయాలు, సహజమైన భాష, అందమైన పేజీ రూపకల్పనతో విస్తరించవచ్చు.',
      Hindi: 'यह आपके पुस्तक विचार का एक सुंदर नमूना है। अंतिम पुस्तक में अध्याय, स्पष्ट शीर्षक और हर पृष्ठ पर RacharlaGPT ब्रांडिंग शामिल की जा सकती है.'
    };
    return { title, subtitle: item.subtitle || 'A personalized digital book', publisherName: item.publisherName || 'Your Name', pages: [{ title: 'Chapter 01', body: samples[item.language] || samples.English }], demo: true };
  }

  $('#bookForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const idea = $('#bookIdea').value.trim();
    if (!idea) return toast('Please enter your book idea.', 'error');
    const item = {
      mode: 'preview', idea, bookType: $('#bookType').value, language: $('#bookLanguage').value,
      publisherName: $('#publisherName').value.trim(), subtitle: $('#bookSubtitle').value.trim(),
      pages: Number($('input[name="pages"]:checked').value), price: updateBookTotal()
    };
    $('#previewChapter').textContent = 'Preparing preview…';
    $('#previewBody').textContent = 'Your preview is being prepared.';
    try {
      const out = demoBook(item);
      item.bookTheme = chooseBookTheme(item.bookType, $('#bookTheme')?.value || 'auto');
      item.bookLayout = $('#bookLayout')?.value || 'auto';
      applyBookTheme(item.bookTheme);
      lastBookItem = { ...item, preview: out };
      $('#previewTitle').textContent = out.title || item.idea.split(/[.!?]/)[0];
      $('#previewSubtitle').textContent = out.subtitle || item.subtitle || 'A personalized digital book';
      $('#previewPublisher').textContent = out.publisherName || item.publisherName || 'Your Name';
      $('#previewChapter').textContent = out.pages?.[0]?.title || 'Chapter 01';
      $('#previewBody').textContent = out.pages?.[0]?.body || 'Preview generated.';
      ga('book_preview_start', { book_type: item.bookType, language: item.language, pages: item.pages });
      if (out.demo) {
        showDemoPaymentNotice({ ...item, preview: out });
      } else {
        showPaymentModal(item);
      }
    } catch (err) {
      $('#previewChapter').textContent = 'Preview unavailable';
      $('#previewBody').textContent = err.message;
      toast(err.message, 'error');
    }
  });

  function showDemoPaymentNotice(item) {
    openModal(`<span class="eyebrow">PREVIEW READY</span><h2>${escapeHtml(item.preview?.title || item.idea || 'Your RacharlaGPT Book')}</h2><p>${item.pages} pages • ${escapeHtml(item.language)} • Publisher: ${escapeHtml(item.publisherName || 'Not set')}</p><div class="notice notice-info"><b>Demo preview mode</b><span>Connect Supabase + Razorpay in <code>config.js</code> to accept real payments and generate the full paid book.</span></div><div class="modal-actions"><button class="btn btn-primary" id="demoPreviewDownload">Download Demo Preview</button><button class="btn btn-ghost" id="demoGoConfig">How to connect</button></div>`);
    $('#demoPreviewDownload').onclick = () => downloadBookHtml({ ...item.preview, publisherName: item.publisherName });
    $('#demoGoConfig').onclick = () => simpleModal('Connect production services', 'Add your Supabase URL/anon key and Razorpay public key to config.js. Keep Razorpay secret, Gemini keys and Supabase service role only in Supabase Edge Function secrets.');
  }

  function showPaymentModal(item) {
    openModal(`<span class="eyebrow">READY TO CREATE</span><h2>${escapeHtml(item.preview?.title || 'Your book')}</h2><p>${item.pages} pages • ${escapeHtml(item.language)} • Publisher: ${escapeHtml(item.publisherName || 'Not set')}</p><div class="payment-summary"><div><span>Total</span><strong>${money(item.price)}</strong></div><small>Secure Razorpay checkout. Full generation starts after captured payment.</small></div><button class="btn btn-primary btn-lg" id="payNow">Pay securely with Razorpay →</button>`);
    $('#payNow').onclick = () => startPayment(item);
  }

  async function startPayment(item) {
    if (!paymentReady()) return showDemoPaymentNotice({ ...item, preview: item.preview });
    if (!window.Razorpay) return toast('Razorpay checkout did not load. Check your internet connection.', 'error');
    const payButton = $('#payNow');
    try {
      payButton.disabled = true; payButton.textContent = 'Creating secure order…';
      item.sourcePaths = item.sourcePaths?.length ? item.sourcePaths : await uploadSourceFiles();
      const metadata = {
        pages: item.pages, language: item.language, bookType: item.bookType, publisherName: item.publisherName,
        idea: item.idea, subtitle: item.subtitle, sourcePaths: item.sourcePaths || [],
        addons: { bio: $('#bioAddon')?.checked, cover: $('#coverAddon')?.checked, illustration: $('#illustrationAddon')?.checked }, bookTheme: item.bookTheme || chooseBookTheme(item.bookType, $('#bookTheme')?.value || 'auto'), bookLayout: item.bookLayout || $('#bookLayout')?.value || 'auto'
      };
      const order = await fn('create-order', { currency: 'INR', product_type: 'book', product_name: item.preview?.title || 'RacharlaGPT Book', metadata });
      const rzp = new Razorpay({
        key: C.RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency, order_id: order.id,
        name: 'RacharlaGPT Studio', description: item.preview?.title || 'Digital Book', theme: { color: '#ffbd2e' },
        prefill: { name: item.publisherName || '' },
        handler: async response => {
          try {
            toast('Payment received. Verifying…');
            const verified = await fn('verify-payment', { ...response, order_id: order.id, product_type: 'book' });
            openModal(`<span class="eyebrow">PAYMENT VERIFIED</span><h2>Your book is being created.</h2><p id="generationStatus">Payment captured. Generation is running securely in the background.</p><div class="progress-bar"><span id="generationProgress" style="width:8%"></span></div><p class="small-note">You can close this page. Your order will remain in My Orders and you will receive an email when the book is ready.</p><div class="modal-actions"><a class="btn btn-primary" href="#orders">Open My Orders</a></div>`);
            let checks=0;
            const poll=async()=>{
              checks++;
              try {
                const out=await fn('customer-orders',{});
                const found=(out.orders||[]).find(x=>x.razorpay_order_id===order.id);
                if(found?.status==='ready'||found?.delivery_status==='ready'){
                  $('#generationStatus').textContent='Your book is ready. Open My Orders to download it.';
                  $('#generationProgress').style.width='100%';
                  return;
                }
                if(found?.delivery_status==='failed'){
                  $('#generationStatus').textContent='Generation needs attention. Your payment is safe; use Retry delivery in My Orders.';
                  $('#generationProgress').style.width='100%';
                  return;
                }
              } catch {}
              if(checks<60) setTimeout(poll,5000);
            };
            setTimeout(poll,2500);
          } catch (err) {
            openModal(`<span class="eyebrow">DELIVERY PENDING</span><h2>Payment verified, generation needs attention.</h2><p>${escapeHtml(err.message)}</p><div class="notice notice-warning"><b>Payment is safe. No second payment is needed.</b><span>Order ID: ${escapeHtml(order.id)}<br>Recovery code: ${escapeHtml(order.download_token||verified?.download_token||'saved in your account')}</span></div><div class="modal-actions"><a class="btn btn-primary" href="#orders">Open My Orders</a></div>`);
            toast(err.message, 'error');
          }
        },
        modal: { ondismiss: () => { if ($('#payNow')) { $('#payNow').disabled = false; $('#payNow').textContent = 'Pay securely with Razorpay →'; } } }
      });
      rzp.open();
    } catch (err) {
      toast(err.message, 'error');
      if (payButton) { payButton.disabled = false; payButton.textContent = 'Pay securely with Razorpay →'; }
    }
  }

  function bookHtml(book) {
    const pages = book.pages || []; const theme=book.bookTheme||'luxury';
    const themes={luxury:['#5a3a9b','#0e1530','#ffd34f'],modern:['#163c72','#07111f','#66d7ff'],classic:['#6e5130','#f4ead6','#7b4d22'],romance:['#8b2f62','#2b1026','#ffd0e5'],children:['#1f7aa8','#f8d65b','#fff6c7'],education:['#175f66','#eef8f4','#56e6c8'],business:['#173d62','#07121f','#8ed8ff'],biography:['#513f31','#f2e7d7','#c59a5b'],heritage:['#713c1f','#21130e','#e7b55b']};
    const [a,b,c]=themes[theme]||themes.luxury;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(book.title || 'RacharlaGPT Book')}</title><style>@page{size:A5;margin:14mm}*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#1d2230;margin:0}.bookpage{min-height:170mm;page-break-after:always;position:relative;padding:10mm 0 15mm}.cover{display:grid;place-items:center;text-align:center;background:radial-gradient(circle at 30% 20%,${a},${b} 68%);color:#fff;min-height:170mm;padding:25mm}.cover h1{font-size:32px;color:${c}}.cover small{color:${c};letter-spacing:2px}.content{padding-left:4mm;padding-right:4mm}.content h2{font-size:22px;color:${a}}.content p{font-size:12pt;line-height:1.65;white-space:pre-wrap}.content:nth-of-type(3n) h2{font-size:26px}.content:nth-of-type(4n) p{font-size:13pt;line-height:1.8}.wm{position:absolute;bottom:3mm;left:0;right:0;text-align:center;font:700 8pt Arial;color:#18233b;opacity:.34}.num{position:absolute;bottom:0;right:0;font:8pt Arial;color:#555}.brand{position:absolute;bottom:3mm;left:0;font:700 7pt Arial;color:${a}}</style></head><body><section class="bookpage cover"><div><small>RACHARLAGPT DIGITAL STUDIO</small><h1>${escapeHtml(book.title || 'Untitled')}</h1><p>${escapeHtml(book.subtitle || '')}</p><p>Published by <b>${escapeHtml(book.publisherName || 'RacharlaGPT')}</b></p></div></section>${pages.map((p,i)=>`<section class="bookpage content"><small>CHAPTER ${String(i+1).padStart(2,'0')}</small><h2>${escapeHtml(p.title || '')}</h2><p>${escapeHtml(p.body || '')}</p><div class="wm">RacharlaGPT • Digital Studio</div><div class="brand">RacharlaGPT</div><div class="num">${i+1}</div></section>`).join('')}</body></html>`;
  }
  function downloadBookHtml(book) {
    const blob = new Blob([bookHtml(book)], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = safeName(book.title) + '.html'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 800); toast('Book file downloaded. Open it and Print → Save as PDF.');
  }
  function printBook(book) {
    const w = window.open('', '_blank');
    if (!w) return toast('Allow pop-ups to print your book.', 'error');
    w.document.open(); w.document.write(bookHtml(book)); w.document.close();
    setTimeout(() => w.print(), 900);
  }
  async function shareBook(orderId, token) {
    const url = `${C.APP_URL || location.origin}/#orders?token=${encodeURIComponent(token)}`;
    if (navigator.share) { try { await navigator.share({ title: 'My RacharlaGPT Book', text: 'I created a book with RacharlaGPT Studio.', url }); } catch {} }
    else { await navigator.clipboard?.writeText(url); toast('Share link copied.'); }
  }
  function showDownloadModal(orderId, full) {
    const token = full.download_token || '';
    if (token) localStorage.setItem('rg_last_download_token', token);
    openModal(`<span class="eyebrow">YOUR BOOK IS READY</span><h2>${escapeHtml(full.title || 'Your RacharlaGPT Book')}</h2><p>Order: ${escapeHtml(orderId)}</p><div class="notice notice-success"><b>Private download token saved on this device.</b><span>You can retrieve this order again from My Orders.</span></div><div class="modal-actions"><button class="btn btn-primary" id="downloadHtml">Download Book</button><button class="btn btn-ghost" id="printBook">Print / Save as PDF</button><button class="btn btn-ghost" id="shareBook">Share</button></div><div class="share-row"><button class="btn btn-ghost" id="shareWa">WhatsApp</button><button class="btn btn-ghost" id="shareLi">LinkedIn</button><button class="btn btn-ghost" id="shareX">X</button><button class="btn btn-ghost" id="shareIg">Instagram</button></div><p class="small-note">Browser print is used for multilingual PDF output without installing an external PDF package.</p>`);
    $('#downloadHtml').onclick = () => downloadBookHtml(full);
    $('#printBook').onclick = () => printBook(full);
    $('#shareBook').onclick = () => shareBook(orderId, token);
    const shareUrl = `${C.APP_URL || location.origin}/#orders?token=${encodeURIComponent(token)}`;
    $('#shareWa').onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent('I created a book with RacharlaGPT Studio: ' + shareUrl)}`, '_blank', 'noopener');
    $('#shareLi').onclick = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');
    $('#shareX').onclick = () => window.open(`https://x.com/intent/post?text=${encodeURIComponent('My new RacharlaGPT book')}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');
    $('#shareIg').onclick = async () => { try { await navigator.clipboard?.writeText(shareUrl); } catch {} window.open('https://www.instagram.com/', '_blank', 'noopener'); toast('Share link copied. Paste it into Instagram.'); };
    ga('book_delivered', { order_id: orderId, pages: full.pages?.length || 0 });
  }

  async function lookupOrder() { await loadCustomerOrders(); }
  async function loadCustomerOrders(){
    const state=$('#accountState'), result=$('#orderResult'); if(!state||!result)return; const u=await currentUser();
    if(!u){ state.innerHTML=`<div class="notice notice-info"><b>Login required for My Orders</b><span>Browse freely, then sign in to see purchases, downloads and delivery status.</span><button class="btn btn-primary" id="ordersLogin">Login / Create account</button></div>`; result.innerHTML=''; $('#ordersLogin').onclick=()=>openAuthModal('orders'); return; }
    state.innerHTML=`<div class="account-head"><div><span class="eyebrow">SIGNED IN</span><h2>${escapeHtml(u.email||'Customer')}</h2></div><button class="btn btn-ghost" id="logoutBtn">Log out</button></div><div class="notice notice-success">Your orders are linked to this account. Paid orders can be retried without paying again.</div><div class="notice notice-info">Refunds are handled by RacharlaGPT support/admin under the published refund policy. There is no self-service refund button.</div>`;
    $('#logoutBtn').onclick=async()=>{await supa().auth.signOut();await updateAccountUI();route();};
    try{
      const out=await fn('customer-orders',{}),orders=out.orders||[];
      if(!orders.length){result.innerHTML='<div class="empty-state"><h3>No orders yet</h3><p>Choose any studio and purchase when you are ready.</p></div>';return;}
      result.innerHTML=orders.map(o=>{
        const ready=o.status==='ready'||o.delivery_status==='ready';
        const paid=o.payment_status==='captured'||o.status==='paid'||o.status==='processing'||o.status==='ready';
        const pending=paid&&!ready&&o.delivery_status!=='failed';
        const failed=o.delivery_status==='failed';
        const media=o.product_type==='website'?'Website':o.product_type==='website_renewal'?'Website Renewal':o.product_type==='book'?'Book':o.product_type==='photo_story'?'Photo Story':'Business Creative';
        const site=o.site;
        const paymentLabel=o.payment_status==='captured'?'Payment captured':o.payment_status==='failed'?'Payment failed':o.status==='created'?'Awaiting payment':paid?'Payment captured':'Payment pending';
        const deliveryLabel=ready?'✓ Ready':failed?'Delivery needs retry':pending?'Preparing your product':'Waiting';
        const siteInfo=(o.product_type==='website'&&site)?`<div class="order-site-meta"><span>Plan: ${escapeHtml(site.plan==='pro'?'Vibe Pro':'Vibe Normal')}</span><span>Expires: ${escapeHtml(new Date(site.expires_at).toLocaleDateString('en-IN'))}</span><span class="site-key-line">Private key: <code>${escapeHtml(site.management_token||'Available by email')}</code>${site.management_token?` <button class="btn btn-ghost btn-sm" type="button" data-copy-site-key="${escapeHtml(site.management_token)}">Copy key</button>`:''}</span></div>`:'';
        return `<div class="result-card order-card"><div><b>${escapeHtml(o.product_name||media)}</b><span>${media} • ${money(Number(o.amount||0)/100)}</span><span>Order ${escapeHtml(o.razorpay_order_id)}</span><span class="order-status ${ready?'ready':failed?'failed':'pending'}">${escapeHtml(paymentLabel)} • ${escapeHtml(deliveryLabel)}</span>${siteInfo}</div><div class="order-actions">${ready&&o.product_type==='book'?`<button class="btn btn-primary" data-book-order="${escapeHtml(o.razorpay_order_id)}" data-token="${escapeHtml(o.download_token)}">Download</button>`:''}${ready&&o.product_type==='photo_story'?`<button class="btn btn-primary" data-photo-order="${escapeHtml(o.razorpay_order_id)}">Download</button>`:''}${ready&&o.product_type==='business_creative'?`<button class="btn btn-primary" data-creative-order="${escapeHtml(o.razorpay_order_id)}">Download</button>`:''}${o.product_type==='website'&&ready&&site?`<button class="btn btn-primary" data-site-order="${escapeHtml(o.razorpay_order_id)}">Open website</button><button class="btn btn-ghost" data-site-renew="${escapeHtml(o.razorpay_order_id)}">Renew</button>`:''}${failed?`<button class="btn btn-primary" data-retry-order="${escapeHtml(o.razorpay_order_id)}">Retry delivery</button>`:''}</div></div>`;
      }).join('');
      $$('[data-book-order]').forEach(b=>b.onclick=async()=>{try{const o=await fn('download-book',{token:b.dataset.token});showDownloadModal(o.order_id,o);}catch(e){toast(e.message,'error');}});
      $$('[data-photo-order]').forEach(async b=>{ const o=orders.find(x=>x.razorpay_order_id===b.dataset.photoOrder); if(!o)return; b.onclick=async()=>{try{const m=o.metadata||{};const urls=await getPrivateAssetUrls(m.photoPaths||[]);await buildPhotoStoryDownload({title:m.title||'Photo Story',category:m.category||'Wedding',label:m.label||'Memory',image:m.image,photos:urls});}catch(e){toast(e.message||'Could not build the photo story.','error');}}; });
      $$('[data-creative-order]').forEach(b=>{ const o=orders.find(x=>x.razorpay_order_id===b.dataset.creativeOrder); if(!o)return; b.onclick=()=>downloadBusinessCreative(o.metadata||{}); });
      $$('[data-retry-order]').forEach(b=>b.onclick=async()=>{try{await fn('retry-order',{order_id:b.dataset.retryOrder});toast('Retry queued. You do not need to pay again.');setTimeout(loadCustomerOrders,1200);}catch(e){toast(e.message||'Delivery needs retry.','error');}});
      $$('[data-copy-site-key]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard?.writeText(b.dataset.copySiteKey);toast('Private website key copied.');}catch{toast('Could not copy key; select it from My Orders.','error');}});
      $$('[data-site-order]').forEach(b=>b.onclick=async()=>{const o=orders.find(x=>x.razorpay_order_id===b.dataset.siteOrder);const slug=o?.site?.slug||o?.metadata?.slug;if(slug)location.hash=`site/${encodeURIComponent(slug)}`;else toast('Website link is not available yet.','error');});
      $$('[data-site-renew]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.razorpay_order_id===b.dataset.siteRenew);if(o?.site?.management_token){$('#vibeManageKey').value=o.site.management_token;location.hash='#websites';}else toast('Website renewal key is not available.','error');});
    }catch(e){result.innerHTML=`<div class="notice notice-warning">${escapeHtml(e.message)}</div>`;}
  }

  let imageCatalogCategory='All';
  let imageCatalogSearch='';
  let imageCatalogSort='featured';

  function allTemplateRecords(){
    return Object.entries(templates).flatMap(([category,list])=>list.map(([image,label],index)=>({image,label,category,index,premium:(index===1||index===4),icon:templateMeta[category]||'✨'})));
  }

  function renderImageCategories(){
    const box=$('#imageCategoryTabs'); if(!box)return;
    box.innerHTML=imageCategories.map(c=>`<button type="button" class="image-category-pill ${c===imageCatalogCategory?'active':''}" data-image-category="${escapeHtml(c)}">${c==='All'?'✨':(templateMeta[c]||'✨')} ${escapeHtml(c.replace(/([A-Z])/g,' $1').trim())}</button>`).join('');
    $$('.image-category-pill',box).forEach(b=>b.onclick=()=>{imageCatalogCategory=b.dataset.imageCategory;renderImageCategories();renderTemplates(imageCatalogCategory);});
  }

  function renderTemplates(category='All') {
    const grid=$('#templateGrid'); if(!grid)return;
    imageCatalogCategory=category||'All';
    let list=allTemplateRecords();
    if(imageCatalogCategory!=='All') list=list.filter(x=>x.category===imageCatalogCategory);
    const q=imageCatalogSearch.trim().toLowerCase();
    if(q) list=list.filter(x=>`${x.label} ${x.category}`.toLowerCase().includes(q));
    if(imageCatalogSort==='name') list.sort((a,b)=>a.label.localeCompare(b.label));
    else if(imageCatalogSort==='category') list.sort((a,b)=>a.category.localeCompare(b.category)||a.label.localeCompare(b.label));
    else if(imageCatalogSort==='premium') list.sort((a,b)=>Number(b.premium)-Number(a.premium));
    grid.innerHTML=list.map((t,i)=>`<article class="image-template-card ${selectedTemplate?.label===t.label&&selectedTemplate?.category===t.category?'selected':''}" data-template-card><button type="button" class="template-tile" data-img="${escapeHtml(t.image)}" data-label="${escapeHtml(t.label)}" data-category="${escapeHtml(t.category)}" aria-label="Use ${escapeHtml(t.label)} template"><img src="${escapeHtml(t.image)}" alt="${escapeHtml(t.label)}" loading="lazy"><span class="template-badge">${t.premium?'₹19 • Premium':'₹19 • Ready'}</span><span class="template-card-shade"></span></button><div class="image-card-info"><div><b>${escapeHtml(t.label)}</b><small>${escapeHtml(t.icon)} ${escapeHtml(t.category.replace(/([A-Z])/g,' $1').trim())}</small></div><button type="button" class="share-template-btn" data-share-template="${escapeHtml(t.label)}" title="Share this design">↗</button></div></article>`).join('')||`<div class="image-empty-catalog"><strong>No designs found</strong><span>Try another category or search term.</span></div>`;
    $$('.template-tile',grid).forEach(tile=>tile.addEventListener('click',()=>{
      $$('.image-template-card',grid).forEach(x=>x.classList.remove('selected')); tile.closest('.image-template-card')?.classList.add('selected');
      selectedTemplate={image:tile.dataset.img,category:tile.dataset.category,label:tile.dataset.label};
      showImagePreview(selectedTemplate);
      $('#imageEditor')?.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    $$('[data-share-template]',grid).forEach(btn=>btn.onclick=async()=>shareDesign({title:btn.dataset.shareTemplate,category:btn.closest('.image-template-card')?.querySelector('small')?.textContent||'RacharlaGPT Photo Studio'}));
    renderImageCategories();
    if(!selectedTemplate || (imageCatalogCategory!=='All' && selectedTemplate.category!==imageCatalogCategory)){
      const first=list[0]; if(first) { selectedTemplate={image:first.image,category:first.category,label:first.label}; showImagePreview(selectedTemplate); }
    }
  }

  function shareWhatsApp(item){
    const title=item.title||item.label||'RacharlaGPT Design';
    const text=encodeURIComponent(`${title} — created with RacharlaGPT Photo Studio ${location.href.split('#')[0]}#images`);
    window.open(`https://wa.me/?text=${text}`,'_blank','noopener,noreferrer');
  }

  async function shareDesign(item){
    const title=item.title||item.label||'RacharlaGPT Design';
    const text=`${title} — created with RacharlaGPT Photo Studio`;
    const url=location.href.split('#')[0]+'#images';
    try{
      if(navigator.share){await navigator.share({title,text,url});toast('Share sheet opened.');return;}
      await navigator.clipboard.writeText(`${text} ${url}`);toast('Share text copied.');
    }catch(e){ if(e?.name!=='AbortError') toast('Sharing is not available in this browser.','error'); }
  }

  function showImagePreview(t) {
    if($('#selectedTemplateName')) $('#selectedTemplateName').textContent=`${t.label} • ${t.category}`;
    const title=$('#photoTitle')?.value.trim()||`Our ${t.category} Story`;
    const photos=uploadedPhotos.slice(0,4);
    const heroPhoto=photos[0]||'';
    const extraPhotos=photos.slice(1,4);
    const photoFrames=extraPhotos.map((src,i)=>`<div class="photo-side-frame"><img src="${src}" alt="Uploaded photo ${i+2}"><span>${i+2}</span></div>`).join('');
    const mainPhoto=heroPhoto?`<div class="photo-main-frame"><img src="${heroPhoto}" alt="Your uploaded photo"><span class="photo-frame-label">YOUR PHOTO</span></div>`:`<div class="photo-main-placeholder"><span>＋</span><b>Add your photo</b><small>Your selected photo will appear here</small></div>`;
    $('#imagePreview').innerHTML=`<div class="photo-design-preview"><div class="photo-design-art" style="background-image:url('${t.image}')"><div class="photo-design-overlay"></div><div class="photo-design-top"><span>RACHARLAGPT PHOTO STUDIO</span><b>${escapeHtml(t.category)}</b></div><div class="photo-design-photo-area">${mainPhoto}<div class="photo-side-stack">${photoFrames}</div></div><div class="photo-design-copy"><small>${escapeHtml(t.label)}</small><h2>${escapeHtml(title)}</h2><p>Personalized with your photos • Ready to share</p></div><div class="photo-design-footer">RacharlaGPT • Create • Personalize • Sell • Share</div></div><div class="photo-preview-caption"><div><b>Live preview</b><span>${photos.length?`${photos.length} uploaded photo${photos.length>1?'s':''} placed in the design`:'Upload photos to see them placed in the design'}</span></div><div class="photo-preview-actions"><button class="btn btn-ghost btn-sm" type="button" id="sharePhotoPreview">↗ Share</button><button class="btn btn-ghost btn-sm" type="button" id="sharePhotoWhatsApp">WhatsApp</button><button class="btn btn-primary btn-sm" type="button" id="previewPhotoCheckout">Preview & Continue →</button></div></div></div>`;
    $('#sharePhotoPreview')?.addEventListener('click',()=>shareDesign({title,category:t.category}));
    $('#sharePhotoWhatsApp')?.addEventListener('click',()=>shareWhatsApp({title,category:t.category}));
    $('#previewPhotoCheckout')?.addEventListener('click',()=>openPhotoStoryCheckout());
  }

  $$('#imageCategoryTabs button').forEach(b=>b.addEventListener('click',()=>{}));
  $('#imageSearch')?.addEventListener('input',e=>{imageCatalogSearch=e.target.value;renderTemplates(imageCatalogCategory);});
  $('#imageSort')?.addEventListener('change',e=>{imageCatalogSort=e.target.value;renderTemplates(imageCatalogCategory);});
  $('#photoTitle')?.addEventListener('input',()=>selectedTemplate&&showImagePreview(selectedTemplate));
  $('#photoFiles')?.addEventListener('change',async e=>{
    uploadedPhotos=[];
    for(const file of [...e.target.files].slice(0,6)){ if(file.size>4*1024*1024){toast(`${file.name} is larger than 4 MB.`,'error');continue;} uploadedPhotos.push(await readAsDataUrl(file)); }
    renderPhotoUploadPreview(); selectedTemplate&&showImagePreview(selectedTemplate);
  });
  function renderPhotoUploadPreview(){
    const box=$('#photoUploadPreview'); if(!box)return;
    box.innerHTML=uploadedPhotos.length?uploadedPhotos.map((src,i)=>`<div><img src="${src}" alt="Selected photo ${i+1}"><button type="button" data-remove-photo="${i}" aria-label="Remove photo">×</button></div>`).join(''):`<span class="upload-preview-empty">Your selected photos will appear here and in the live design.</span>`;
    $$('[data-remove-photo]').forEach(btn=>btn.addEventListener('click',()=>{uploadedPhotos.splice(Number(btn.dataset.removePhoto),1);renderPhotoUploadPreview();selectedTemplate&&showImagePreview(selectedTemplate);}));
  }

  async function uploadPhotoFiles(){
    const input=$('#photoFiles'); if(!input?.files?.length)return [];
    const out=[]; for(const file of [...input.files].slice(0,6)){if(file.size>4*1024*1024)throw new Error(`${file.name} is larger than 4 MB.`);const data=(await readAsDataUrl(file)).split(',')[1];const r=await fn('upload-source',{name:file.name,mime:file.type||'application/octet-stream',data});if(r.path)out.push(r.path);} return out;
  }
  async function getPrivateAssetUrls(paths=[]){if(!paths.length)return [];const r=await fn('asset-urls',{paths});return r.urls||[];}
  async function buildPhotoStoryDownload(item){
    const photoBlocks=(item.photos||[]).map(src=>`<img src="${src}" alt="Memory">`).join('');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(item.title)}</title><style>@page{size:A4;margin:10mm}body{margin:0;background:#090b18;color:#fff;font-family:Arial}.sheet{min-height:260mm;box-sizing:border-box;padding:35mm 20mm 20mm;border-radius:24px;background:linear-gradient(180deg,#0002,#12051ddd),url('${item.image}') center/cover;display:flex;flex-direction:column;justify-content:end}.sheet h1{font:800 48px Georgia,serif;margin:0 0 8px}.wm{margin-top:25px;font-size:11px;letter-spacing:2px;color:#ffd34f}.photos{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}.photos img{width:31%;aspect-ratio:1;object-fit:cover;border-radius:12px}.brand{margin-top:18px;color:#ffd34f;font-weight:800}</style></head><body><div class="sheet"><small>RACHARLAGPT PHOTO STORY • ${escapeHtml(item.category)}</small><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.label)} • Personalized with your photos</p><div class="photos">${photoBlocks}</div><div class="wm">RacharlaGPT • Create • Personalize • Sell • Share</div><div class="brand">RacharlaGPT</div></div></body></html>`;
    const blob=new Blob([html],{type:'text/html'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=safeName(item.title)+'-photo-story.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800);toast('Preview file downloaded. Print it to PDF if needed.');
  }

  async function openPhotoStoryCheckout(){
    const t=selectedTemplate||{image:templates.Wedding[0][0],category:'Wedding',label:'Royal Wedding'};
    const item={product_type:'photo_story',product_name:`${$('#photoTitle').value.trim()||'Photo Story'} — ${t.category}`,price:19,currency:'INR',title:$('#photoTitle').value.trim()||'My Photo Story',category:t.category,label:t.label,image:t.image,photos:uploadedPhotos.slice(0,6),photoPaths:[]};
    if(!item.photos.length){toast('Upload at least one photo before continuing.','error');return;}
    openModal(`<span class="eyebrow">PHOTO STORY PREVIEW</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.category)} • ${item.photos.length} uploaded photo${item.photos.length===1?'':'s'}</p><div class="modal-photo-preview"><div class="photo-design-art modal-photo-art" style="background-image:url('${item.image}')"><div class="photo-design-overlay"></div><div class="photo-design-photo-area"><div class="photo-main-frame"><img src="${item.photos[0]}" alt="Your uploaded photo"></div><div class="photo-side-stack">${item.photos.slice(1,4).map((src,i)=>`<div class="photo-side-frame"><img src="${src}" alt="Uploaded photo ${i+2}"></div>`).join('')}</div></div><div class="photo-design-copy"><small>${escapeHtml(item.label)}</small><h2>${escapeHtml(item.title)}</h2></div></div></div><div class="modal-actions"><button class="btn btn-ghost" id="modalSharePhoto">↗ Share</button><button class="btn btn-ghost" id="modalShareWhatsApp">WhatsApp</button><button class="btn btn-ghost" id="modalPhotoDownload">Save preview</button><button class="btn btn-primary" id="modalPhotoPay">Continue to payment ₹19 →</button></div>`);
    $('#modalSharePhoto').onclick=()=>shareDesign({title:item.title,category:item.category});
    $('#modalShareWhatsApp').onclick=()=>shareWhatsApp({title:item.title,category:item.category});
    $('#modalPhotoDownload').onclick=()=>buildPhotoStoryDownload(item);
    $('#modalPhotoPay').onclick=()=>startPhotoStoryPayment(item);
  }

  async function startPhotoStoryPayment(item){
    if(!backendReady()){closeModal();openModal(`<span class="eyebrow">DEMO PREVIEW</span><h2>${escapeHtml(item.title)}</h2><p>Your design is ready. No payment is taken in demo mode.</p><button class="btn btn-primary btn-lg" id="demoPhotoDownload">Download Demo Photo Story</button>`);$('#demoPhotoDownload').onclick=()=>buildPhotoStoryDownload(item);return;}
    try{
      item.photoPaths=await uploadPhotoFiles();
      const order=await fn('create-order',{currency:'INR',product_type:'photo_story',product_name:item.product_name,metadata:{title:item.title,category:item.category,label:item.label,image:item.image,photoPaths:item.photoPaths}});
      closeModal();
      const rzp=new Razorpay({key:C.RAZORPAY_KEY_ID,amount:order.amount,currency:order.currency,order_id:order.id,name:'RacharlaGPT Studio',description:item.product_name,theme:{color:'#ff3e9e'},handler:async response=>{try{await fn('verify-payment',{...response,order_id:order.id,product_type:'photo_story'});toast('Payment captured. Your photo story is being prepared in My Orders. You can close this page.');location.hash='#orders';}catch(e){toast(e.message||'Payment verification failed.','error');}},modal:{ondismiss:()=>{}}});
      rzp.open();
    }catch(e){toast(e.message||'Could not start payment.','error');}
  }

  $('#photoCheckout')?.addEventListener('click',openPhotoStoryCheckout);

  const bizStyles={luxury:['#ffbe28','#641f0a','#ffd45d'],modern:['#32a8ff','#0a2450','#bcecff'],restaurant:['#d85a1c','#3a1209','#ffd1a8'],fashion:['#d81b75','#3a0823','#ffd1ea'],jewellery:['#8e6b1f','#1b1407','#ffeaa3'],education:['#138b78','#062f2a','#a8fff0'],realestate:['#2463b5','#071c39','#c8e2ff'],festival:['#b62f28','#3c0710','#ffe58a']};
  function applyBusinessStyle(){ const k=$('#bizStyle')?.value||'luxury',v=bizStyles[k]||bizStyles.luxury,box=$('#bizAdFrame'); if(box){box.style.background=`radial-gradient(circle at 80% 20%,${v[0]},${v[1]} 45%,#080b16 85%)`;box.style.borderColor=v[2]+'88';} }

  function selectedBusinessPack() { return Number($('input[name="bizpack"]:checked')?.value || 1); }
  function updateBusinessPrice() {
    const p = businessPrices[selectedBusinessPack()];
    const btn = $('#businessDownload'); if (btn) btn.textContent = `Buy & Download ${selectedBusinessPack()} Creative${selectedBusinessPack() > 1 ? 's' : ''} — ${money(p)}`;
    return p;
  }
  $$('input[name="bizpack"]').forEach(x => x.addEventListener('change', updateBusinessPrice));
  $('#bizStyle')?.addEventListener('change', applyBusinessStyle);
  applyBusinessStyle();
  ['bizName','bizOffer','bizContact'].forEach(id => $(`#${id}`)?.addEventListener('input', () => {
    $('#bizPreviewName').textContent = $('#bizName').value.trim() || 'Your Business';
    $('#bizPreviewOffer').textContent = $('#bizOffer').value.trim() || 'Your offer goes here';
    $('#bizPreviewContact').textContent = $('#bizContact').value.trim() || 'Contact details';
  }));

  $('#businessForm')?.addEventListener('submit', e => {
    e.preventDefault();
    $('#bizPreviewName').textContent = $('#bizName').value.trim() || 'Your Business';
    $('#bizPreviewOffer').textContent = $('#bizOffer').value.trim() || 'Your offer goes here';
    $('#bizPreviewContact').textContent = $('#bizContact').value.trim() || 'Contact details';
    const box = $('.ad-preview .ad-frame');
    let button = $('#businessDownload');
    if (!button) {
      button = document.createElement('button'); button.id = 'businessDownload'; button.className = 'btn btn-primary'; button.style.marginTop = '18px'; box.appendChild(button);
      button.onclick = async () => {
        const pack = selectedBusinessPack(); const price = businessPrices[pack];
        const data = { name:$('#bizName').value.trim(), offer:$('#bizOffer').value.trim(), contact:$('#bizContact').value.trim(), category:$('#bizCategory').value.trim(), brief:$('#bizBrief').value.trim(), pack, style:$('#bizStyle')?.value||'luxury' };
        if (!backendReady()) {
          downloadBusinessCreative(data); return;
        }
        try {
          const order = await fn('create-order', { currency:'INR', product_type:'business_creative', product_name:data.name || 'Business Creative', metadata:data });
          const rzp = new Razorpay({ key:C.RAZORPAY_KEY_ID, amount:order.amount, currency:order.currency, order_id:order.id, name:'RacharlaGPT Studio', description:`Business Creative Pack — ${pack}`, theme:{color:'#ff7b1c'}, handler:async response=>{ try{await fn('verify-payment',{...response,order_id:order.id,product_type:'business_creative'}); toast('Payment captured. Your creative pack is being prepared in My Orders. You can close this page.'); location.hash='#orders';}catch(e){toast(e.message||'Payment verification failed.','error');} } });
          rzp.open();
        } catch (err) { toast(err.message, 'error'); }
      };
    }
    updateBusinessPrice();
    toast('Creative preview updated.');
    ga('business_preview', { category:$('#bizCategory').value || 'unknown' });
  });
  function downloadBusinessCreative(d) {
    const palette={luxury:['#ffbe28','#641f0a','#ffd45d'],modern:['#32a8ff','#0a2450','#bcecff'],restaurant:['#d85a1c','#3a1209','#ffd1a8'],fashion:['#d81b75','#3a0823','#ffd1ea'],jewellery:['#8e6b1f','#1b1407','#ffeaa3'],education:['#138b78','#062f2a','#a8fff0'],realestate:['#2463b5','#071c39','#c8e2ff'],festival:['#b62f28','#3c0710','#ffe58a']};
    const base=palette[d.style]||palette.luxury, pack=Number(d.pack||1);
    const styles=Object.keys(palette); const count=pack===10?10:pack===5?5:1;
    const pages=Array.from({length:count},(_,i)=>{const k=styles[i%styles.length],v=palette[k];return `<section class="creative" style="background:radial-gradient(circle at 80% 20%,${v[0]},${v[1]} 45%,#080b16 88%);border-color:${v[2]}88"><span class="eyebrow">RACHARLAGPT • ${escapeHtml((d.category||'BUSINESS').toUpperCase())}</span><h1>${escapeHtml(d.name||'Your Business')}</h1><h2>${escapeHtml(d.offer||['Special Offer','New Collection','Weekend Deal','Limited Time','Best Seller'][i%5])}</h2><p>${escapeHtml(d.brief||'Beautiful products and services for your customers.')}</p><div class="contact">${escapeHtml(d.contact||'Contact us today')}</div><div class="wm">RacharlaGPT • Create • Personalize • Sell • Share</div></section>`}).join('');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(d.name||'RacharlaGPT Creative')}</title><style>@page{size:1080px 1080px;margin:0}body{margin:0;background:#050816;font-family:Arial;color:#fff}.creative{width:1080px;height:1080px;box-sizing:border-box;padding:100px;display:flex;flex-direction:column;justify-content:center;border:10px solid transparent;page-break-after:always}.eyebrow{letter-spacing:5px;color:#fff;font-weight:900}.creative h1{font-size:88px;line-height:.95;margin:30px 0}.creative h2{font-size:52px;color:#fff}.creative p{font-size:28px;line-height:1.5;color:#f5f7ff;max-width:820px}.contact{font-size:25px;margin-top:20px}.wm{margin-top:auto;letter-spacing:3px;color:#ffe07a;font-size:14px}</style></head><body>${pages}</body></html>`;
    const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=safeName(d.name)+'-'+count+'-creatives.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800);toast(`${count} business creative${count>1?'s':''} downloaded.`);
  }

  const VIBE_PLANS={
    normal_1m:{plan:'normal',duration:'1m',amount:199,label:'Vibe Normal • 1 month',months:1},
    normal_6m:{plan:'normal',duration:'6m',amount:499,label:'Vibe Normal • 6 months',months:6},
    normal_1y:{plan:'normal',duration:'1y',amount:1500,label:'Vibe Normal • 1 year',months:12},
    pro_1m:{plan:'pro',duration:'1m',amount:399,label:'Vibe Pro • 1 month',months:1},
    pro_6m:{plan:'pro',duration:'6m',amount:999,label:'Vibe Pro • 6 months',months:6},
    pro_1y:{plan:'pro',duration:'1y',amount:2000,label:'Vibe Pro • 1 year',months:12}
  };
  async function uploadWebsiteImages(){
    const out={logoUrl:'',showcaseImages:[]};
    const logo=$('#siteLogo')?.files?.[0];
    const showcase=[...($('#siteShowcase')?.files||[])].slice(0,3);
    const files=[]; if(logo)files.push(['logo',logo]); showcase.forEach(f=>files.push(['showcase',f]));
    for(const [kind,file] of files){ if(file.size>6*1024*1024) throw new Error(`${file.name} is larger than 6 MB.`); const data=(await readAsDataUrl(file)).split(',')[1]; const r=await fn('upload-site-assets',{name:file.name,mime:file.type,data}); if(kind==='logo')out.logoUrl=r.url; else out.showcaseImages.push(r.url); }
    return out;
  }
  function siteFormData(){
    const pricingKey=$('input[name="siteplan"]:checked')?.value||'normal_1m';
    const p=VIBE_PLANS[pricingKey]||VIBE_PLANS.normal_1m;
    return {businessName:$('#siteBusiness')?.value.trim()||'',category:$('#siteCategory')?.value.trim()||'Business',headline:$('#siteHeadline')?.value.trim()||'Beautiful products. Personal service.',about:$('#siteAbout')?.value.trim()||'',phone:$('#sitePhone')?.value.trim()||'',location:$('#siteLocation')?.value.trim()||'',services:$('#siteServices')?.value.trim()||'',instagram:$('#siteInstagram')?.value.trim()||'',pricingKey,plan:p.plan,duration:p.duration,amount:p.amount,theme:'luxury',logoUrl:'',showcaseImages:[]};
  }
  function updateSitePreview(){
    const d=siteFormData();
    $('#sitePreviewName').textContent=d.businessName||'Your Business';
    $('#sitePreviewHeadline').textContent=d.headline;
    $('#sitePreviewAbout').textContent=d.about||'Your business story will appear here.';
    $('#sitePreviewServices').textContent=d.services||'Your products and services';
  }
  $('#siteLogo')?.addEventListener('change',updateSitePreview);
  $('#siteShowcase')?.addEventListener('change',updateSitePreview);
  ['siteBusiness','siteHeadline','siteAbout','sitePhone','siteLocation','siteServices','siteInstagram'].forEach(id=>$(`#${id}`)?.addEventListener('input',updateSitePreview));
  $$('input[name="siteplan"]').forEach(x=>x.addEventListener('change',updateSitePreview)); updateSitePreview();

  $('#siteForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    let d=siteFormData();
    if(!d.businessName)return toast('Enter your business name.','error');
    try{ d={...d,...await uploadWebsiteImages()}; }catch(e){ return toast(e.message||'Website image upload failed.','error'); }
    const p=VIBE_PLANS[d.pricingKey];
    openModal(`<span class="eyebrow">VIBE WEBSITE PREVIEW</span><h2>${escapeHtml(d.businessName)}</h2><p>${escapeHtml(p.label)} • ₹${p.amount.toLocaleString('en-IN')}</p><div class="notice notice-info"><b>Validity: ${p.months} month${p.months>1?'s':''}</b><span>Your logo/shop photo and up to 3 showcase images will appear on the public website. Your public Vibe URL pauses at expiry, while your content stays stored.</span></div><button class="btn btn-primary btn-lg" id="buyVibe">Pay & Publish My Vibe Website →</button>`);
    $('#buyVibe').onclick=()=>startVibePayment(d);
  });

  async function startVibePayment(d){
    if(!paymentReady())return simpleModal('Vibe Website ready','Connect Supabase + Razorpay to publish paid websites. The preview is working in demo mode.');
    try{
      const order=await fn('create-order',{currency:'INR',product_type:'website',product_name:`Vibe Website — ${d.businessName}`,metadata:{...d}});
      const rzp=new Razorpay({key:C.RAZORPAY_KEY_ID,amount:order.amount,currency:order.currency,order_id:order.id,name:'RacharlaGPT Vibe',description:`${d.businessName} — ${VIBE_PLANS[d.pricingKey].label}`,theme:{color:'#ffd34f'},prefill:{name:d.businessName},
        handler:async response=>{
          try{
            const verified=await fn('verify-payment',{...response,order_id:order.id,product_type:'website'});
            const out=await fn('publish-site',{order_id:order.id,expected_amount:order.amount,site:d});
            if(out.management_token) localStorage.setItem('vibe_management_token',out.management_token);
            openModal(`<span class="eyebrow">VIBE WEBSITE LIVE</span><h2>Your website is published.</h2><p>Share this link with customers:</p><div class="payment-summary"><strong style="font-size:16px;word-break:break-all">${escapeHtml(out.url)}</strong></div><div class="notice notice-success"><b>Keep your private website key safe.</b><span>You need it to renew your website later. Your current expiry is ${escapeHtml(new Date(out.expires_at).toLocaleDateString('en-IN'))}.</span></div><div class="modal-actions"><a class="btn btn-primary" href="${escapeHtml(out.url)}" target="_blank" rel="noopener">Open Website</a><button class="btn btn-ghost" id="copyVibe">Copy Link</button></div>`);
            $('#copyVibe').onclick=async()=>{await navigator.clipboard?.writeText(out.url);toast('Vibe website link copied.');};
          }catch(err){toast(err.message,'error');}
        },modal:{ondismiss:()=>{}}
      });
      rzp.open();
    }catch(err){toast(err.message,'error');}
  }

  $('#renewVibeBtn')?.addEventListener('click',async()=>{
    const token=$('#vibeManageKey')?.value.trim()||localStorage.getItem('vibe_management_token')||'';
    const pricingKey=$('#vibeRenewPlan')?.value||'normal_1m';
    if(!token)return toast('Enter your private website key.','error');
    if(!paymentReady())return simpleModal('Renewal ready','Connect Supabase + Razorpay to process renewals.');
    try{
      const p=VIBE_PLANS[pricingKey];
      const order=await fn('create-order',{currency:'INR',product_type:'website_renewal',product_name:`Vibe Website Renewal — ${p.label}`,metadata:{pricingKey,managementToken:token}});
      const rzp=new Razorpay({key:C.RAZORPAY_KEY_ID,amount:order.amount,currency:order.currency,order_id:order.id,name:'RacharlaGPT Vibe',description:`Website renewal — ${p.label}`,theme:{color:'#ffd34f'},
        handler:async response=>{
          try{
            await fn('verify-payment',{...response,order_id:order.id,product_type:'website_renewal'});
            const out=await fn('renew-site',{order_id:order.id,management_token:token,expected_amount:order.amount});
            if(out.management_token)localStorage.setItem('vibe_management_token',out.management_token);
            $('#vibeManageResult').innerHTML=`<div class="notice notice-success"><b>Renewal successful.</b><span>Website active until ${escapeHtml(new Date(out.expires_at).toLocaleDateString('en-IN'))}. <a href="${escapeHtml(out.url)}" target="_blank" rel="noopener">Open website</a></span></div>`;
          }catch(err){toast(err.message,'error');}
        }
      });
      rzp.open();
    }catch(err){toast(err.message,'error');}
  });

  async function loadPublicSite(slug){const mount=$('#publicSiteMount');if(!mount)return;mount.innerHTML='<div class="panel"><p>Loading Vibe website…</p></div>';if(!backendReady()){mount.innerHTML='<div class="panel"><h2>Vibe website</h2><p>Connect Supabase to load published business pages.</p></div>';return;}try{const r=await fetch(`${C.SUPABASE_URL}/rest/v1/sites?slug=eq.${encodeURIComponent(slug)}&published=eq.true&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=*`,{headers:{apikey:C.SUPABASE_ANON_KEY||C.SUPABASE_PUBLISHABLE_KEY}});const rows=await r.json();if(!rows?.length)throw new Error('Website not found');const d=rows[0]; document.title=`${d.business_name||'Business'} — Vibe`; const instagram=safeExternalUrl(d.instagram); const gallery=Array.isArray(d.showcase_images)?d.showcase_images.slice(0,3):[];const services=String(d.services||'').split(/[,•|;\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,12);const media=`${d.logo_url?`<img class="vibe-logo" src="${escapeHtml(d.logo_url)}" alt="${escapeHtml(d.business_name)} logo">`:''}`;const galleryHtml=gallery.length?`<div class="vibe-gallery">${gallery.map((u,i)=>`<img src="${escapeHtml(u)}" alt="${escapeHtml(d.business_name)} showcase ${i+1}">`).join('')}</div>`:'';const serviceHtml=services.length?`<div class="vibe-service-grid">${services.map(s=>`<div class="vibe-service-card"><span>✦</span><b>${escapeHtml(s)}</b></div>`).join('')}</div>`:`<p class="vibe-empty-copy">Contact us to learn about our products and services.</p>`;const planClass=d.plan==='pro'?' vibe-pro':'';mount.innerHTML=`<div class="vibe-public${planClass}"><section class="vibe-public-hero"><div class="vibe-public-copy">${media}<span class="eyebrow">${escapeHtml(d.category||'BUSINESS')}</span><h1>${escapeHtml(d.business_name)}</h1><h2>${escapeHtml(d.headline||'Welcome')}</h2><p>${escapeHtml(d.about||'Welcome to our business.')}</p><div class="vibe-actions"><a href="https://wa.me/${encodeURIComponent(String(d.phone||'').replace(/[^0-9]/g,''))}" target="_blank" rel="noopener">WhatsApp</a><a href="tel:${escapeHtml(d.phone||'')}">Call</a><span>${escapeHtml(d.location||'')}</span></div></div>${galleryHtml}</section><section class="vibe-public-section"><span class="eyebrow">WHAT WE OFFER</span><h2>Products & Services</h2>${serviceHtml}</section><section class="vibe-public-contact"><div><span class="eyebrow">VISIT / CONTACT</span><h2>Let's connect.</h2><p>${escapeHtml(d.phone||'')}<br>${escapeHtml(d.location||'')}</p></div>${instagram?`<a class="vibe-instagram" href="${escapeHtml(instagram)}" target="_blank" rel="noopener">Instagram →</a>`:''}</section><div class="vibe-brand">RacharlaGPT Vibe • Create • Personalize • Sell • Share</div></div>`;}catch(e){mount.innerHTML=`<div class="panel"><h2>Vibe website unavailable</h2><p>${escapeHtml(e.message)}</p></div>`;}}

  $('#lookupOrder')?.addEventListener('click', lookupOrder);
  $('#loginBtn')?.addEventListener('click',async()=>{const u=await currentUser();if(u)location.hash='#orders';else openAuthModal('account');});
  $('#searchBtn')?.addEventListener('click', () => openModal(`<span class="eyebrow">STUDIO SEARCH</span><h2>What would you like to create?</h2><div class="search-grid"><a href="#books">📚 Books</a><a href="#images">💍 Wedding images</a><a href="#images">🎂 Birthday</a><a href="#images">✈️ Travel</a><a href="#business">📣 Business ads</a><a href="#websites">🌐 Vibe websites</a><a href="#prompts">✨ Prompts</a><a href="#creator">💰 Creator packs</a><a href="#songs">🎵 Songs</a></div>`));
  $('#menuBtn')?.addEventListener('click', toggleMobileMenu);
  $('#modalClose')?.addEventListener('click', closeModal);
  $('#modal')?.addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); const link=e.target.closest?.('a[href^="#"]'); if(link){closeModal();} });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeMobileMenu(); } });
  $('#fullPreviewBtn')?.addEventListener('click', async () => {
    const target = $('#page-books .live-preview');
    try { if (!document.fullscreenElement) await target.requestFullscreen(); else await document.exitFullscreen(); } catch { toast('Full screen is not available in this browser.'); }
  });

  let adminToken = '';
  async function adminApi(action, extra={}) {
    if(!adminToken) throw new Error('Admin authentication required.');
    let r; try { r=await fetch(`${C.SUPABASE_URL}/functions/v1/admin-api`,{method:'POST',headers:{'Content-Type':'application/json','apikey':C.SUPABASE_ANON_KEY||C.SUPABASE_PUBLISHABLE_KEY,'x-admin-token':adminToken},body:JSON.stringify({action,...extra})}); } catch(e) { throw new Error('Admin API could not be reached. Deploy the replacement admin-api function and confirm the migration has completed.'); }
    const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error||`Admin API returned HTTP ${r.status}`); return d;
  }
  async function loadAdmin() {
    const login=$('#adminLoginPanel'),dash=$('#adminDashboard'); if(!login||!dash)return;
    if(!backendReady()){login.innerHTML='<div class="notice notice-warning">Supabase is not configured.</div>';return;}
    if(!adminToken){login.hidden=false;dash.hidden=true;const btn=$('#adminLoginBtn'); if(btn&&!btn.dataset.bound){btn.dataset.bound='1';btn.onclick=async()=>{const v=$('#adminTokenInput')?.value||'';if(!v)return toast('Enter your Admin Token.','error');adminToken=v;try{await refreshAdmin();login.hidden=true;dash.hidden=false;toast('Admin access granted.');}catch(e){adminToken='';$('#adminLoginMsg').innerHTML=`<div class="notice notice-warning">${escapeHtml(e.message)}</div>`;}};}return;}
    login.hidden=true;dash.hidden=false;await refreshAdmin();
  }
  async function refreshAdmin(){
    const d=await adminApi('summary');
    $('#aOrders').textContent=d.stats?.orders??0;$('#aRevenue').textContent=money(Number(d.stats?.captured_paise||0)/100);$('#aPending').textContent=d.stats?.pending??0;$('#aRefunds').textContent=d.stats?.refunds??0;
    const orders=d.orders||[], refunds=d.refunds||[];
    $('#adminOrdersBody').innerHTML=orders.map(o=>`<tr><td>${escapeHtml(o.customer_email||o.customer_name||'—')}</td><td>${escapeHtml(o.product_name||o.product_type||'—')}</td><td>${money(Number(o.amount||0)/100)}</td><td class="admin-status">${escapeHtml(o.payment_status||o.status||'—')}</td><td>${escapeHtml(o.delivery_status||'—')}</td><td><div>${escapeHtml(o.razorpay_order_id||'—')}</div><small>${escapeHtml(o.razorpay_payment_id||'')}</small></td><td>${escapeHtml(new Date(o.created_at).toLocaleString('en-IN'))}</td><td><div class="admin-action-row"><button class="btn btn-ghost btn-sm" data-admin-review-order="${escapeHtml(o.razorpay_order_id)}">Create refund review</button><button class="btn btn-ghost btn-sm" data-admin-reconcile="${escapeHtml(o.razorpay_order_id)}">Reconcile payment</button></div></td></tr>`).join('')||'<tr><td colspan="8">No orders.</td></tr>';
    $('#adminRefundsBody').innerHTML=refunds.map(r=>`<tr><td>${escapeHtml((orders.find(o=>o.id===r.order_id)?.customer_email)||'—')}</td><td>${escapeHtml((orders.find(o=>o.id===r.order_id)?.razorpay_order_id)||r.order_id)}</td><td>${money(Number(r.amount||0)/100)}</td><td>${escapeHtml(r.reason||'—')}</td><td>${escapeHtml(r.status)}</td><td><div class="admin-action-row">${r.status==='requested'?`<button class="btn btn-primary btn-sm" data-admin-approve="${escapeHtml(r.id)}">Approve refund</button><button class="btn btn-ghost btn-sm" data-admin-reject="${escapeHtml(r.id)}">Reject</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6">No refund reviews.</td></tr>';
    $$('[data-admin-review-order]').forEach(b=>b.onclick=async()=>{const reason=prompt('Customer support reason for refund review?')||'';if(!reason)return;try{await adminApi('create_refund_request',{order_id:b.dataset.adminReviewOrder,reason});toast('Refund review created.');await refreshAdmin();}catch(e){toast(e.message,'error');}});
    $$('[data-admin-reconcile]').forEach(b=>b.onclick=async()=>{try{const r=await adminApi('reconcile',{order_id:b.dataset.adminReconcile});toast(`Razorpay payment status: ${r.payment?.status||'unknown'}`);await refreshAdmin();}catch(e){toast(e.message,'error');}});
    $$('[data-admin-approve]').forEach(b=>b.onclick=async()=>{if(!confirm('Approve and issue the Razorpay refund?'))return;try{await adminApi('approve_refund',{refund_id:b.dataset.adminApprove});toast('Refund processed.');await refreshAdmin();}catch(e){toast(e.message,'error');}});
    $$('[data-admin-reject]').forEach(b=>b.onclick=async()=>{const note=prompt('Reason for rejecting this refund review?')||'';try{await adminApi('reject_refund',{refund_id:b.dataset.adminReject,note});toast('Refund review rejected.');await refreshAdmin();}catch(e){toast(e.message,'error');}});
  }
  $('#adminRefresh')?.addEventListener('click',()=>refreshAdmin().catch(e=>toast(e.message,'error')));

  // Basic image error fallback so cards never become unreadable blank blocks.
  document.addEventListener('error', e => {
    const el = e.target;
    if (el?.tagName === 'IMG' && el.closest('.template-tile')) el.closest('.template-tile').style.backgroundImage = 'linear-gradient(135deg,#2b1c54,#071d3d)';
  }, true);

  setupBookPreview();
  updateBookTotal();
  applyBookTheme(chooseBookTheme($('#bookType')?.value,'auto'));
  setupAnalytics();
  setupAds();
  setupMonetag();
  if (backendReady()) { supa(); handleAuthUrlErrors(); }
  route();
  updateAccountUI();
  window.RG = { fn, toast, route, prices, templates };
})();

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type,x-admin-token","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const U=Deno.env.get("SUPABASE_URL")!,S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,ADMIN=Deno.env.get("ADMIN_TOKEN")||"";
async function db(p:string,o:RequestInit={}){const r=await fetch(`${U}/rest/v1/${p}`,{...o,headers:{apikey:S,...(S.startsWith("sb_")?{}:{Authorization:`Bearer ${S}`}),"Content-Type":"application/json",...(o.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;}
async function sendEmail(to:string|undefined,subject:string,html:string,id:string){const k=Deno.env.get("RESEND_API_KEY");if(!k||!to)return;const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${k}`,"Content-Type":"application/json","Idempotency-Key":`admin-${id}`},body:JSON.stringify({from:Deno.env.get("RESEND_FROM_EMAIL")||"RacharlaGPT <noreply@vibe.racharlagpt.in>",to:[to],subject,html})});if(!r.ok)throw new Error(await r.text());}
function esc(s:string){return String(s||"").replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]||c));}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 if(!ADMIN||req.headers.get("x-admin-token")!==ADMIN)return json({error:"Admin authorization required"},401);
 const b=await req.json(),action=String(b.action||"summary");
 if(action==="business_agent_close"||action==="business_agent_purge"){
   // These are platform-administrator actions, after the server's ADMIN_TOKEN check.
   const uid=String(b.user_id||""),expectedSlug=String(b.slug||"").trim();
   if(!/^[0-9a-f-]{36}$/i.test(uid)||!/^[a-z0-9-]{3,70}$/.test(expectedSlug))return json({error:"Select a valid shop from the admin list."},400);
   const rows=await db("business_agent_shops?user_id=eq."+encodeURIComponent(uid)+"&select=id,user_id,slug,published&limit=1");
   if(!rows?.length||rows[0].slug!==expectedSlug)return json({error:"Shop no longer matches the selected owner or URL."},409);
   if(action==="business_agent_close"){
     if(b.confirm_phrase!=="PERMANENTLY CLOSE SHOP")return json({error:"Exact administrator confirmation required."},400);
     const result=await db("rpc/business_agent_close_shop",{method:"POST",body:JSON.stringify({p_user_id:uid,p_slug:expectedSlug,p_actor:"administrator"})});
     return json({ok:true,shop_closed:true,shop_slug:expectedSlug,purge_pending:true,refund_issued:false});
   }
   if(b.confirm_phrase!=="ERASE SHOP CUSTOMER DATA")return json({error:"Exact erase confirmation required."},400);
   const closures=await db("business_agent_shop_closures?user_id=eq."+encodeURIComponent(uid)+"&shop_id=eq."+encodeURIComponent(rows[0].id)+"&slug=eq."+encodeURIComponent(expectedSlug)+"&select=user_id,shop_id,purge_status&limit=1");
   if(!closures?.length)return json({error:"Shop must be closed before erasing customer data."},409);
   if(closures[0].purge_status==="completed")return json({ok:true,purge_status:"completed",already_completed:true});
   try{
     const bucket="business-agent-images";
     let removed=0;
     for(let batch=0;batch<50;batch++){
       const listResponse=await fetch(U+"/storage/v1/object/list/"+bucket,{method:"POST",headers:{apikey:S,...(S.startsWith("sb_")?{}:{Authorization:"Bearer "+S}),"Content-Type":"application/json"},body:JSON.stringify({prefix:uid+"/",limit:100,offset:0})});
       if(!listResponse.ok)throw Error("Could not list the owner's photos: HTTP "+listResponse.status);
       const listed=await listResponse.json();
       if(!Array.isArray(listed))throw Error("Unexpected photo listing");
       const paths=listed.filter((item:any)=>typeof item.name==="string"&&item.name!=="."&&item.name!==".."&&item.name.length<400).map((item:any)=>uid+"/"+item.name);
       if(paths.length===0)break;
       const deletion=await fetch(U+"/storage/v1/object/"+bucket,{method:"DELETE",headers:{apikey:S,...(S.startsWith("sb_")?{}:{Authorization:"Bearer "+S}),"Content-Type":"application/json"},body:JSON.stringify({prefixes:paths})});
       if(!deletion.ok)throw Error("Could not delete owner photos: HTTP "+deletion.status);
       removed+=paths.length;
       if(batch===49)throw Error("Too many image batches. Retry the purge.");
     }
     // Order event history cascades with the customer's orders.
     await db("business_agent_customer_orders?shop_id=eq."+encodeURIComponent(rows[0].id),{method:"DELETE",headers:{Prefer:"return=minimal"}});
     await db("business_agent_shop_closures?user_id=eq."+encodeURIComponent(uid),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({purge_status:"completed",purged_at:new Date().toISOString(),photos_removed:removed,last_error:null})});
     return json({ok:true,purge_status:"completed",photos_removed:removed,customer_orders_erased:true,hosted_catalog_erased:true,original_slug_reserved:true,payment_receipts_retained:true,auth_account_retained:true});
   }catch(e){
     await db("business_agent_shop_closures?user_id=eq."+encodeURIComponent(uid),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({purge_status:"failed",last_error:String(e).slice(0,190)})}).catch(()=>{});
     return json({error:"Shop closed, but erasure needs an administrator retry: "+String(e).slice(0,120)},503);
   }
 }
 if(action==="business_agent_summary"){
   const [shops,purchases,accounts,customerOrders,closures]=await Promise.all([
     db("business_agent_shops?select=id,user_id,slug,shop_data,published,created_at&order=created_at.desc&limit=1000"),
     db("business_agent_monthly_purchases?select=id,user_id,amount_paise,currency,status,captured_at,created_at&order=created_at.desc&limit=1000"),
     db("business_agent_monthly_accounts?select=user_id,paid_through&limit=1000"),
     db("business_agent_customer_orders?select=id,shop_id,order_number,customer_name,items,amount_paise,status,payment_status,created_at&order=created_at.desc&limit=1000"),
     db("business_agent_shop_closures?select=user_id,shop_id,slug,closed_at,purge_status,purged_at&limit=1000")
   ]);
   const paid=(purchases||[]).filter((p:any)=>p.status==="captured");
   const active=(accounts||[]).filter((a:any)=>a.paid_through&&Date.parse(a.paid_through)>Date.now());
   const enriched=(shops||[]).map((shop:any)=>({
     id:shop.id,user_id:shop.user_id,slug:shop.slug,shop_name:String(shop.shop_data?.name||shop.slug||"Unnamed shop").slice(0,140),published:shop.published,created_at:shop.created_at,closure:(closures||[]).find((c:any)=>c.user_id===shop.user_id)||null,
     paid_through:(accounts||[]).find((a:any)=>a.user_id===shop.user_id)?.paid_through||null,
     captured_purchases:paid.filter((p:any)=>p.user_id===shop.user_id).length,
     customer_order_count:(customerOrders||[]).filter((c:any)=>c.shop_id===shop.id).length
   }));
   return json({stats:{shops:(shops||[]).length,published:(shops||[]).filter((x:any)=>x.published).length,
     monthly_accounts:(accounts||[]).length,active_monthly_accounts:active.length,
     captured_purchases:paid.length,hosting_revenue_paise:paid.reduce((n:number,x:any)=>n+Number(x.amount_paise||0),0),
     shop_customer_orders:(customerOrders||[]).length},
     shops:enriched,hosting_purchases:(purchases||[]).map((x:any)=>({id:x.id,shop:enriched.find((y:any)=>y.id===(shops||[]).find((z:any)=>z.user_id===x.user_id)?.id)?.shop_name||"Shop owner",amount_paise:x.amount_paise,currency:x.currency,status:x.status,captured_at:x.captured_at,created_at:x.created_at})),
     shop_customer_orders:(customerOrders||[]).map((x:any)=>({id:x.id,order_number:x.order_number,shop:enriched.find((y:any)=>y.id===x.shop_id)?.shop_name||"Shop",customer_name:x.customer_name,items:x.items,amount_paise:x.amount_paise,status:x.status,payment_status:x.payment_status,created_at:x.created_at})),
     list_limit:1000});
 }
 if(action==="summary"){
   const [orders,refunds,sites]=await Promise.all([
     db("orders?select=id,razorpay_order_id,razorpay_payment_id,amount,currency,status,payment_status,payment_error,product_type,product_name,customer_email,customer_name,delivery_status,delivery_attempts,last_delivery_error,refund_status,refund_requested_at,refund_processed_at,paid_at,created_at&order=created_at.desc&limit=200"),
     db("refunds?select=id,order_id,razorpay_payment_id,amount,reason,status,created_at,reviewed_at,processed_at,admin_note&order=created_at.desc&limit=200"),
     db("sites?select=id,slug,business_name,plan,pricing_key,duration_months,expires_at,published,customer_email,order_id,created_at&order=created_at.desc&limit=200")
   ]);
   const captured=(orders||[]).filter((o:any)=>o.payment_status==="captured").reduce((n:number,o:any)=>n+Number(o.amount||0),0);
   return json({orders:orders||[],refunds:refunds||[],sites:sites||[],stats:{orders:(orders||[]).length,captured_paise:captured,pending:(orders||[]).filter((o:any)=>o.payment_status==="captured"&&o.delivery_status!=="ready"&&o.status!=="refunded").length,refunds:(refunds||[]).filter((r:any)=>r.status==="requested").length}});
 }
 if(action==="reject_refund"){
   const r=await db(`refunds?id=eq.${encodeURIComponent(b.refund_id)}&status=eq.requested&select=id,order_id`);if(!r?.length)return json({error:"Refund request not found or already reviewed"},404);
   await db(`refunds?id=eq.${encodeURIComponent(b.refund_id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"rejected",reviewed_at:new Date().toISOString(),admin_note:String(b.note||"")})});
   await db(`orders?id=eq.${encodeURIComponent(r[0].order_id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({refund_status:"rejected"})});
   return json({ok:true});
 }
 if(action==="create_refund_request"){
   const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,status,refund_status,customer_email`);if(!rows?.length)return json({error:"Order not found"},404);const o=rows[0];
   if(!['paid','ready','processing'].includes(o.status))return json({error:"Order is not eligible"},400);
   const active=await db(`refunds?order_id=eq.${encodeURIComponent(o.id)}&status=in.(requested,approved,processing,processed)&select=id`);if(active?.length)return json({error:"A refund record already exists"},409);
   await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({refund_status:"requested",refund_requested_at:new Date().toISOString()})});
   const rr=await db("refunds",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({order_id:o.id,razorpay_payment_id:o.razorpay_payment_id,amount:o.amount,reason:String(b.reason||"Support refund review"),status:"requested"})});
   return json({ok:true,refund:rr?.[0]||null});
 }
 if(action==="approve_refund"){
   const rows=await db(`refunds?id=eq.${encodeURIComponent(b.refund_id)}&status=eq.requested&select=id,order_id,amount,reason`);if(!rows?.length)return json({error:"Refund request not found or already reviewed"},404);const r=rows[0];
   const orders=await db(`orders?id=eq.${encodeURIComponent(r.order_id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,status,customer_email,customer_name`);if(!orders?.length)return json({error:"Order not found"},404);const o=orders[0];
   if(!o.razorpay_payment_id)return json({error:"No captured Razorpay payment is attached to this order"},400);
   await db(`refunds?id=eq.${encodeURIComponent(r.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"processing",reviewed_at:new Date().toISOString()})});
   const auth=btoa(`${Deno.env.get("RAZORPAY_KEY_ID")!}:${Deno.env.get("RAZORPAY_KEY_SECRET")!}`);
   const rr=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(o.razorpay_payment_id)}/refund`,{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/json"},body:JSON.stringify({amount:Number(r.amount),notes:{reason:String(r.reason||"Admin approved refund")}})});
   const refund=await rr.json();if(!rr.ok){await db(`refunds?id=eq.${encodeURIComponent(r.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"requested",admin_note:String(refund?.error?.description||"Razorpay refund failed")})});return json({error:refund?.error?.description||"Razorpay refund failed"},502);}
   await db(`refunds?id=eq.${encodeURIComponent(r.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"processed",processed_at:new Date().toISOString(),razorpay_refund_id:refund.id})});
   await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"refunded",payment_status:"refunded",refund_status:"processed",refund_processed_at:new Date().toISOString(),delivery_status:"refunded"})});
   try{await sendEmail(o.customer_email,"RacharlaGPT — Refund processed",`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>Refund processed</h2><p>Your refund for <b>${esc(o.razorpay_order_id)}</b> has been submitted to Razorpay.</p><p>Refund ID: ${esc(refund.id)}</p><p>Please allow the payment provider/bank's normal processing time.</p></div>`,String(refund.id));}catch{}
   return json({ok:true,refund_id:refund.id,status:"processed"});
 }
 if(action==="reconcile"){
   const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}&select=id,razorpay_order_id,razorpay_payment_id,amount,status,payment_status`);if(!rows?.length)return json({error:"Order not found"},404);const o=rows[0];
   if(!o.razorpay_payment_id)return json({error:"No Razorpay payment ID stored yet"},400);
   const auth=btoa(`${Deno.env.get("RAZORPAY_KEY_ID")!}:${Deno.env.get("RAZORPAY_KEY_SECRET")!}`);const rr=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(o.razorpay_payment_id)}`,{headers:{Authorization:`Basic ${auth}`}});const p=await rr.json();if(!rr.ok)return json({error:p?.error?.description||"Razorpay lookup failed"},502);
   const captured=p.status==="captured";await db(`orders?id=eq.${encodeURIComponent(o.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({payment_status:captured?"captured":(p.status==="failed"?"failed":"created"),razorpay_payment_id:p.id,payment_captured_at:captured?(o.payment_status==="captured"?undefined:new Date().toISOString()):null,status:captured?(o.status==="created"?"paid":o.status):o.status})});
   return json({ok:true,payment:{id:p.id,status:p.status,amount:p.amount,method:p.method,created_at:p.created_at},order:o});
 }
 return json({error:"Unknown admin action"},400);
}catch(e){return json({error:e instanceof Error?e.message:"Admin operation failed"},500)}});
export {};

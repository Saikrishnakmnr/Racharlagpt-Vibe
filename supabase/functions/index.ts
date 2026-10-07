const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!, SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const keys=[Deno.env.get("GEMINI_API_KEY_1"),Deno.env.get("GEMINI_API_KEY_2")].filter(Boolean) as string[];
const models=[...new Set([Deno.env.get("GEMINI_MODEL"),"gemini-2.5-flash","gemini-2.0-flash"].filter(Boolean))] as string[];

async function db(path:string,options:RequestInit={}){
 const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SERVICE,...(SERVICE.startsWith("sb_")?{}:{Authorization:`Bearer ${SERVICE}`}),"Content-Type":"application/json",...(options.headers||{})}});
 const t=await r.text();if(!r.ok)throw new Error(t||"DB error");return t?JSON.parse(t):null;
}
async function getSourceParts(paths:string[]=[]){
 const parts:any[]=[];
 for(const path of paths.slice(0,6)){
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/user-assets/${path}`,{headers:{...(SERVICE.startsWith("sb_")?{}:{Authorization:`Bearer ${SERVICE}`}),apikey:SERVICE}});
  if(!r.ok)continue;
  const bytes=new Uint8Array(await r.arrayBuffer());let bin="";
  for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  const mime=r.headers.get("content-type")||"application/octet-stream";
  if(mime==="text/plain")parts.push({text:new TextDecoder().decode(bytes).slice(0,100000)});
  else if(["application/pdf","image/png","image/jpeg","image/webp"].includes(mime))parts.push({inlineData:{mimeType:mime,data:btoa(bin)}});
 }
 return parts;
}
async function callGemini(prompt:string,sourceParts:any[]=[]){
 if(!keys.length)throw new Error("No Gemini API keys configured in Supabase secrets.");
 let last="Gemini unavailable";
 for(const model of models)for(const key of keys){
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
   method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},
   body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt},...sourceParts]}],generationConfig:{responseMimeType:"application/json"}})
  });
  const d=await r.json();
  if(r.ok){
   const text=d?.candidates?.[0]?.content?.parts?.map((x:any)=>x.text||"").join("")||"";
   try{return JSON.parse(text.replace(/^```json|```$/g,"").trim())}catch{return {pages:[{title:"Generated content",body:text}]}};
  }
  last=`${model}: ${d?.error?.message||"Gemini request failed"}`;
 }
 throw new Error(last);
}

async function readyEmail(to:string|undefined,product:string,order:string){
 const key=Deno.env.get("RESEND_API_KEY");
 if(!key||!to)return;
 const from=Deno.env.get("RESEND_FROM_EMAIL")||"RacharlaGPT <noreply@racharlagpt.in>";
 const safeProduct=String(product||"RacharlaGPT product").replace(/[<>&]/g,"");
 const r=await fetch("https://api.resend.com/emails",{
  method:"POST",
  headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json","Idempotency-Key":`rg-book-${order}`},
  body:JSON.stringify({
   from,
   to:[to],
   subject:"RacharlaGPT — Your book is ready",
   html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>Your book is ready ✓</h2><p>${safeProduct} has been generated.</p><p><b>Order:</b> ${order}</p><p><a href="https://vibe.racharlagpt.in/#orders">Open My Orders</a></p></div>`
  })
 });
 if(!r.ok)throw new Error(await r.text());
}

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 let requestBody:any={};
 try{
  const b=await req.json(); requestBody=b;
  if(b.mode==="chunk"){
   if(!b.order_id||!b.download_token) return json({error:"Order ID and delivery token are required"},400);
   const rows=await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}&download_token=eq.${encodeURIComponent(b.download_token)}&select=razorpay_order_id,status,metadata,content,download_token,customer_email,product_name`);
   if(!rows?.length||rows[0].status!=="paid")return json({error:"Payment not verified or delivery token invalid"},403);
   const o=rows[0],m=o.metadata||{},old=o.content||{};
   const total=Number(m.pages||b.pages||10),start=Number(b.startPage||1),count=Math.min(20,Number(b.chunkSize||20),total-start+1);
   const parts=await getSourceParts(m.sourcePaths||b.sourcePaths||[]);
   const prompt=`You are the production editor for a paid RacharlaGPT book.
Book title: ${old.title||""}
Idea: ${m.idea||""}
Book type: ${m.bookType||"general"}
Language: ${m.language||"English"}
Publisher: ${m.publisherName||"RacharlaGPT"}
Total requested pages: ${total}
Generate exactly ${count} new content pages numbered ${start} to ${start+count-1}.
Previous pages may already exist. Do not repeat them. Continue the narrative/lesson logically.
Write naturally for native readers in the requested language. Do not invent unsupported biographical facts. For study/history/biography, prefer cautious factual phrasing based on supplied sources.
Return JSON only: {"pages":[{"title":"...","body":"..."}]}.
Each page should be about 90–140 words unless the language normally requires different density.`;
   const out=await callGemini(prompt,parts);
   const rawPages=Array.isArray(out?.pages)?out.pages:[];
   const safePages=rawPages.map((p:any,i:number)=>({title:String(p?.title||`Chapter ${String(start+i).padStart(2,"0")}`),body:String(p?.body||"")})).filter((p:any)=>p.body.trim());
   if(!safePages.length) throw new Error("Book generation returned no valid pages. Please retry the paid order.");
   const mergedPages=[...(Array.isArray(old.pages)?old.pages:[]),...safePages].slice(0,total);
   const content={title:String(old.title||m.idea?.split(/[.!?]/)[0]?.slice(0,80)||"RacharlaGPT Book"),subtitle:String(m.subtitle||old.subtitle||""),publisherName:String(m.publisherName||old.publisherName||"RacharlaGPT"),pages:mergedPages,requested_pages:total};
   const status=mergedPages.length>=total?"ready":"paid";
   await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({content,status,delivery_status:status==="ready"?"ready":"processing",delivered_at:status==="ready"?new Date().toISOString():null})});
   if(status==="ready" && o.customer_email){try{await readyEmail(o.customer_email,o.product_name||content.title,b.order_id);await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({email_ready_sent_at:new Date().toISOString()})});}catch(e){}}
   return json({...content,order_id:b.order_id,download_token:o.download_token});
  }

  const pages=Math.min(100,Math.max(1,Number(b.pages||10)));
  const parts=await getSourceParts(b.sourcePaths||[]);
  const prompt=`You are the RacharlaGPT Studio book editor. Create a strong preview for a ${b.bookType||"general"} book in ${b.language||"English"}.
Idea: ${b.idea||""}
Subtitle: ${b.subtitle||""}
Publisher name: ${b.publisherName||"RacharlaGPT"}
Requested final page count: ${pages}
Return JSON only: {"title":"...","subtitle":"...","publisherName":"...","pages":[{"title":"...","body":"..."}]}
Return exactly one representative page of 120–180 words. Write naturally for native readers. Do not invent private facts.`;
  const out=await callGemini(prompt,parts);
  out.publisherName=b.publisherName||out.publisherName||"RacharlaGPT";out.subtitle=b.subtitle||out.subtitle||"";out.requested_pages=pages;
  return json(out);
 }catch(e){
  try{const b=requestBody; if(b?.order_id){await db(`orders?razorpay_order_id=eq.${encodeURIComponent(b.order_id)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({status:"paid",delivery_status:"failed",last_delivery_error:e instanceof Error?e.message:"Generation failed",delivery_attempts:1})});}}catch{}
  return json({error:e instanceof Error?e.message:"Generation failed"},500)
}});

export {};

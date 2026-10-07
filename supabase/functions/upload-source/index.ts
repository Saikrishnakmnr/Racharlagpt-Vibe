const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!, SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function me(req:Request){const t=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");if(!t)throw new Error("AUTH");const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:Deno.env.get("SUPABASE_ANON_KEY")||SERVICE,Authorization:`Bearer ${t}`}});if(!r.ok)throw new Error("AUTH");return await r.json();}
const allowed=new Set(["application/pdf","text/plain","image/png","image/jpeg","image/webp"]);
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  try{
    const u=await me(req),b=await req.json();
    if(!b.data||!b.name)return json({error:"Missing file"},400);
    const mime=String(b.mime||"application/octet-stream").toLowerCase();
    if(!allowed.has(mime))return json({error:"Unsupported file type. Use PDF, TXT, PNG, JPG or WEBP."},415);
    if(String(b.data).length>6_000_000)return json({error:"File is too large"},413);
    const safe=String(b.name).replace(/[^a-zA-Z0-9._-]/g,"_").slice(-120);
    const path=`${u.id}/${crypto.randomUUID()}-${safe}`;
    const bytes=Uint8Array.from(atob(String(b.data)),c=>c.charCodeAt(0));
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/user-assets/${path}`,{
      method:"POST",headers:{...(SERVICE.startsWith("sb_")?{}:{Authorization:`Bearer ${SERVICE}`}),apikey:SERVICE,"Content-Type":mime,"x-upsert":"false"},body:bytes
    });
    if(!r.ok)return json({error:await r.text()},502);
    return json({path});
  }catch(e){return json({error:e instanceof Error&&e.message==="AUTH"?"Please log in before uploading files.":e instanceof Error?e.message:"Upload failed"},401)}
});

export {};

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!,SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,RZP_ID=Deno.env.get("RAZORPAY_KEY_ID")!,RZP_SECRET=Deno.env.get("RAZORPAY_KEY_SECRET")!;
const VIBE_PRICES:Record<string,number>={normal_1m:199,normal_6m:499,normal_1y:1500,pro_1m:399,pro_6m:999,pro_1y:2000};
async function db(path:string,options:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SERVICE,...(SERVICE.startsWith("sb_")?{}:{Authorization:`Bearer ${SERVICE}`}),"Content-Type":"application/json",...(options.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t||"Database error");return t?JSON.parse(t):null;}
async function authUser(req:Request){const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");if(!token)throw new Error("ACCOUNT_REQUIRED");const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||SERVICE,Authorization:`Bearer ${token}`}});if(!r.ok)throw new Error("ACCOUNT_REQUIRED");return await r.json();}
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const user=await authUser(req),body=await req.json(),m=body.metadata||{}; let amount=0;
 if(body.product_type==="book"){const p:any={10:9,20:19,30:29,50:49,100:89},pages=Number(m.pages);if(!p[pages])return json({error:"Invalid book plan"},400);amount=p[pages];if(m.addons?.bio)amount+=49;if(m.addons?.cover)amount+=19;if(m.addons?.illustration)amount+=29;}
 else if(body.product_type==="photo_story")amount=9;
 else if(body.product_type==="business_creative"){const pack=Number(m.pack||1);amount=pack===10?49:pack===5?29:9;}
 else if(body.product_type==="website"||body.product_type==="website_renewal"){const key=String(m.pricingKey||"");if(!(key in VIBE_PRICES))return json({error:"Invalid Vibe website plan"},400);amount=VIBE_PRICES[key];}
 else return json({error:"Unsupported paid product"},400);
 const paise=Math.round(amount*100);if(!Number.isInteger(paise)||paise<900||paise>1000000)return json({error:"Invalid amount"},400);
 const receipt=`rg_${crypto.randomUUID().replaceAll("-","").slice(0,30)}`,auth=btoa(`${RZP_ID}:${RZP_SECRET}`);
 const rr=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/json"},body:JSON.stringify({amount:paise,currency:body.currency||"INR",receipt,notes:{product_type:String(body.product_type),product_name:String(body.product_name||"RacharlaGPT")}})});
 const order=await rr.json();if(!rr.ok)return json({error:order?.error?.description||"Razorpay order creation failed"},502);
 const recoveryToken=crypto.randomUUID()+crypto.randomUUID();
 const customerEmail=user.email||null,customerName=user.user_metadata?.full_name||user.user_metadata?.name||null;
 await db("orders",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({razorpay_order_id:order.id,amount:order.amount,currency:order.currency,status:"created",payment_status:"created",delivery_status:"pending",product_type:body.product_type,product_name:body.product_name||"RacharlaGPT",metadata:body.metadata||{},download_token:recoveryToken,user_id:user.id,customer_email:customerEmail,customer_name:customerName,customer_phone:user.user_metadata?.phone||null})});
 return json({id:order.id,amount:order.amount,currency:order.currency,key_id:RZP_ID,download_token:recoveryToken,customer_email:customerEmail});
}catch(e){return json({error:e instanceof Error&&e.message==="ACCOUNT_REQUIRED"?"Please sign up or log in before purchasing.":e instanceof Error?e.message:"Unexpected error"},400)}});

export {};

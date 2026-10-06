const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(()=>new Response(JSON.stringify({ok:true,service:"RacharlaGPT Studio",time:new Date().toISOString()}),{headers:{...cors,"Content-Type":"application/json"}}));

export {};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async (req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return reply({error:"POST required"},405);
  try{
    const body=await req.json();
    const category=String(body.category||"Personalized design").slice(0,80);
    const style=String(body.style||"premium editorial").slice(0,100);
    const title=String(body.title||"").slice(0,160);
    const language=String(body.language||"English").slice(0,40);
    const photos=Array.isArray(body.photos)?body.photos.slice(0,1):[];
    if(!photos.length || typeof photos[0]!=="string" || !photos[0].startsWith("data:image/"))
      return reply({error:"Upload one photo to generate a personalized design."},400);
    const match=photos[0].match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if(!match) return reply({error:"Use a JPG, PNG or WebP image."},400);
    if(match[2].length>7_000_000) return reply({error:"Image is too large. Please use an image under 4 MB."},413);
    const keys=[Deno.env.get("GEMINI_API_KEY"),Deno.env.get("GEMINI_API_KEY_2"),Deno.env.get("GEMINI_API_KEY_3"),Deno.env.get("GEMINI_API_KEY_4")].filter(Boolean) as string[];
    if(!keys.length) return reply({error:"AI image service is not configured. Add GEMINI_API_KEY through GEMINI_API_KEY_4 as Supabase secrets."},503);
    const prompt=`Create a finished, high-quality, personalized ${category} graphic in the style ${style}. Main headline: "${title}". Text language: ${language}. Use the uploaded person's real appearance faithfully; do not change identity, skin tone, facial structure or age. Make a premium editorial composition with tasteful typography, harmonious colors, clear text hierarchy, professional lighting and deliberate spacing. The result must be a complete designed poster/thumbnail, not a mockup on a wall, not a phone screenshot, no watermarks, no extra faces, no repeated portraits, no gibberish text. If text rendering is uncertain, prioritize elegant visual composition and keep text minimal.`;
    let lastError="Model unavailable";
    for(const key of keys){
      for(const model of ["gemini-2.5-flash-image","gemini-2.0-flash-preview-image-generation"]){
        try{
          const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
            method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},
            body:JSON.stringify({contents:[{parts:[{text:prompt},{inline_data:{mime_type:match[1],data:match[2]}}]}],generationConfig:{responseModalities:["TEXT","IMAGE"]}})
          });
          const data=await response.json();
          if(!response.ok){lastError=data?.error?.message||`Gemini returned ${response.status}`;continue;}
          const parts=data?.candidates?.[0]?.content?.parts||[];
          const imagePart=parts.find((p:any)=>p.inlineData?.data||p.inline_data?.data);
          const image=imagePart?.inlineData||imagePart?.inline_data;
          if(image?.data){
            const mime=image.mimeType||image.mime_type||"image/png";
            return reply({imageDataUrl:`data:${mime};base64,${image.data}`,model});
          }
          lastError="The selected model returned text but no image";
        }catch(e){lastError=String(e);}
      }
    }
    return reply({error:`AI image generation could not complete: ${lastError}. No payment was taken.`},502);
  }catch(e){return reply({error:String(e)},400);}
});

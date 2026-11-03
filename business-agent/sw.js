/* Offline shell only. Orders and merchant data MUST be fetched live. */
const CACHE="rba-shell-20261103-v1";
const ROOT="/business-agent/";
const ASSETS=[ROOT+"index.html",ROOT+"cloud.js",ROOT+"shop-export-template.html",ROOT+"manifest.webmanifest",ROOT+"icons/icon-192.png",ROOT+"icons/icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("rba-shell-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin||!url.pathname.startsWith(ROOT))return;
 if(req.mode==="navigate"){
  event.respondWith(fetch(req,{cache:"no-store"}).then(resp=>{if(resp.ok){const copy=resp.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(ROOT+"index.html",copy)))}return resp}).catch(()=>caches.match(ROOT+"index.html").then(x=>x||Response.error())));
  return;
 }
 if(!ASSETS.includes(url.pathname))return;
 event.respondWith(fetch(req,{cache:"no-store"}).then(resp=>{if(resp.ok){const copy=resp.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(url.pathname,copy)))}return resp}).catch(()=>caches.match(url.pathname).then(x=>x||Response.error())));
});

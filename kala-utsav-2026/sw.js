const CACHE="kala-utsav-2026-v16";
const FILES=["./","./index.html","./style.css","./app.js","./manifest.json"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("kala-utsav-2026-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET") return;
 const url=new URL(event.request.url);
 const sameOrigin=url.origin===self.location.origin;
 const isAppAsset=sameOrigin&&["/index.html","/app.js","/style.css","/manifest.json"].some(path=>url.pathname.endsWith(path));
 const isNavigation=event.request.mode==="navigate";
 if(isNavigation||isAppAsset){
  event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
   return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html"))));
 } else {
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
   return response;
  })));
 }
});
const CACHE='tm-prework-v12';
const CORE=['./','./index.html','./course-data.js','./manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
);});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // NEVER intercept backend / cross-origin calls (Apps Script, YouTube, CDNs) — let them hit the network directly.
  if(url.origin!==self.location.origin) return;
  if(url.hostname.indexOf('script.google')>-1 || url.hostname.indexOf('googleusercontent')>-1) return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return res;
  }).catch(()=>caches.match('./index.html'))));
});

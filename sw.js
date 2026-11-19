const CACHE='tm-prework-v23';
const CORE=['./','./index.html','./course-data.js','./course-data-u02.js','./manifest.json'];
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
  const put=(req,res)=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return res; };
  // Pictures rarely change: cache first (fast + saves data).
  if(/\/assets\//.test(url.pathname)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>put(e.request,res))));
    return;
  }
  // App page + course content: network first, so new content reaches phones without a cache bump;
  // fall back to the saved copy when offline.
  e.respondWith(fetch(e.request).then(res=>put(e.request,res))
    .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});

const CACHE='ariana-study-hub-v2-1-content-20260808';
const CORE=[
  './','./index.html','./css/app.css','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
  './data/meta.js','./data/subjects.js','./data/curriculum.js','./data/concepts.js','./data/lesson-content.js','./data/questions.js','./data/sources.js',
  './js/app.js','./js/router.js','./js/store.js','./js/data-contracts.js','./js/utils.js','./js/diagnostic.js','./js/mastery.js','./js/scheduler.js','./js/answer-checker.js','./js/math-engine.js','./js/mimi.js','./js/content.js','./js/lesson-player.js','./js/progress.js','./js/search.js'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res;}).catch(()=>caches.match('./index.html')));return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return res;}).catch(()=>caches.match('./index.html'))));
});

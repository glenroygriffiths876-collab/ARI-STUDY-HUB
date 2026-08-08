const CACHE = 'ariana-study-v5-20260808';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});

// Small IndexedDB helper so reminder settings are available to the service worker.
const DB_NAME = 'ariana-pwa-db';
const STORE = 'settings';
function dbOpen(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}
async function dbSet(key,value){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(value,key);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}
async function dbGet(key){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const r=tx.objectStore(STORE).get(key);
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}

self.addEventListener('message', event => {
  const msg=event.data||{};
  if(msg.type==='SAVE_REMINDER'){
    event.waitUntil(dbSet('reminder',msg.payload));
  }
  if(msg.type==='CHECK_REMINDER'){
    event.waitUntil(maybeNotify(true));
  }
});

function localDateKey(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function maybeNotify(force=false){
  const s=await dbGet('reminder');
  if(!s || !s.enabled) return;
  const now=new Date();
  const [hh,mm]=(s.time||'18:00').split(':').map(Number);
  const nowMin=now.getHours()*60+now.getMinutes();
  const target=hh*60+mm;
  const today=localDateKey(now);
  if(!force && nowMin < target) return;
  if(s.lastNotified===today) return;

  await self.registration.showNotification(`Ariana, it’s study time 💜`,{
    body:'A short 20-minute study session is enough. Open your Study Buddy when you’re ready.',
    icon:'./icons/icon-192.png',
    badge:'./icons/icon-192.png',
    tag:'ariana-daily-study',
    renotify:false,
    data:{url:'./index.html#study'}
  });
  s.lastNotified=today;
  await dbSet('reminder',s);
}

self.addEventListener('periodicsync', event => {
  if(event.tag==='ariana-daily-study'){
    event.waitUntil(maybeNotify(false));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './index.html#study', self.location.origin).href;
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){
        if('focus' in c){ c.navigate(target); return c.focus(); }
      }
      return clients.openWindow(target);
    })
  );
});

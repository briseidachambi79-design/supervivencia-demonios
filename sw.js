const CACHE='inferno-v3';
const ASSETS=['./','./index.html','./styles.css','./game.js','./manifest.json','./icon.svg'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e=>{ if(e.request.method!=='GET') return; e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const cp=r.clone(); caches.open(CACHE).then(cc=>cc.put(e.request,cp)).catch(()=>{}); return r; }).catch(()=>c))); });

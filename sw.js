// Dress Up : fonctionne hors ligne. Seuls la météo (Open-Meteo) et les modèles d'IA passent par le réseau.
const C='dressup-v13';
const SHELL=['./','./index.html','./css/app.css','./js/base.js','./js/eco.js','./js/meteo-tenues.js','./js/vues.js','./js/ia.js','./js/actions.js','./js/achats.js','./js/empreinte.js','./js/circulaire.js','./js/valise.js','./js/planning.js','./js/assistant.js','./js/scanner.js','./js/style.js','./js/main.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./favicon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Réseau d'abord (pour avoir toujours la dernière version), cache si hors ligne.
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const cl=r.clone();caches.open(C).then(c=>c.put(e.request,cl));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});

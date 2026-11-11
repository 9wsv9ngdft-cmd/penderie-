// Dress Up : fonctionne hors ligne. Seuls la météo (Open-Meteo) et les modèles d'IA passent par le réseau.
// À chaque envoi : augmenter ce numéro (et APP_VERSION dans js/base.js), et tenir la liste SHELL à jour avec index.html.
const C='dressup-v23';
const SHELL=['./','./index.html','./css/app.css','./js/base.js','./js/lessive.js','./js/cout.js','./js/saisons.js','./js/meteo-tenues.js','./js/vues.js','./js/ia.js','./js/actions.js','./js/achats.js','./js/empreinte.js','./js/accueil.js','./js/circulaire.js','./js/valise.js','./js/dessous.js','./js/planning.js','./js/reparation.js','./js/badges.js','./js/assistant.js','./js/scanner.js','./js/style.js','./js/main.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./favicon.png','./fonts/inter.woff','./fonts/unbounded.woff'];
// cache:'reload' : à l'installation, chaque fichier est redemandé au serveur, jamais repris de la mémoire du navigateur
// (GitHub Pages autorise le navigateur à garder un fichier 10 minutes : sans ça, une nouvelle version pouvait s'installer avec d'anciens fichiers).
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
// On ne supprime que nos anciens caches : celui des modèles d'IA (transformers-cache) doit rester.
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('dressup-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Réseau d'abord (pour avoir la dernière version), mais sans attendre plus de 2,5 s : sinon le cache répond.
const WAIT=2500;
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const nav=e.request.mode==='navigate';
  // cache:'no-cache' : le navigateur vérifie auprès du serveur que sa copie est à jour (rien n'est retéléchargé si elle l'est)
  // seules les réponses correctes entrent dans le cache (jamais une page d'erreur 404 ou 500)
  const net=fetch(e.request.url,{cache:'no-cache',credentials:'same-origin'}).then(r=>{if(r.ok){const cl=r.clone();caches.open(C).then(c=>c.put(e.request,cl))}return r});
  // index.html ne remplace qu'une page, jamais un fichier JS ou une image manquants
  const cached=()=>caches.match(e.request).then(r=>r||(nav?caches.match('./index.html'):undefined));
  e.respondWith(new Promise((res,rej)=>{
    let done=false;const give=r=>{if(!done&&r){done=true;res(r)}};
    const t=setTimeout(()=>cached().then(give),WAIT);
    net.then(r=>{clearTimeout(t);if(r.ok)give(r);else cached().then(c=>give(c||r))},
             ()=>{clearTimeout(t);cached().then(c=>{if(c)give(c);else if(!done){done=true;rej(new TypeError('hors ligne'))}})});
  }));
  e.waitUntil(net.catch(()=>{}));
});

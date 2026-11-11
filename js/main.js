// Dress Up — Routage et démarrage
"use strict";
/* ---------- routage ---------- */
function render(){
 const app=$('#app');app.innerHTML=VIEWS[VIEW]();
 document.querySelectorAll('#tabs a').forEach(a=>a.classList.toggle('on',a.dataset.v===VIEW));
 if(typeof botBadge==='function')botBadge();
 if(typeof checkBadges==='function')checkBadges();
}
function route(){
 const h=location.hash.slice(1);const v=VIEWS[h]?h:'matin';
 if(v!=='ajout'&&VIEW==='ajout'&&!EDIT)DR=DR; // garde le brouillon
 if(v!=='ajout'&&EDIT){EDIT=null;DR=null}
 VIEW=v;closeSheet();render();window.scrollTo({top:0});
}
window.addEventListener('hashchange',route);

(async function init(){
 await DB.open();
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
 const st=await DB.get('state');if(st)S=Object.assign(S,st);
 // anciennes fiches : « acheté d’occasion » devient la provenance « seconde main »
 S.items.forEach(i=>{if(!i.origin&&i.secondHand)i.origin='occasion'});
 for(const k of await DB.keys()){const ks=String(k);if(ks.startsWith('photo:')){const p=await DB.get(k);if(p)photos.set(ks.slice(6),p)}else if(ks.startsWith('sq:')){const p=await DB.get(k);if(p)squares.set(ks.slice(3),p)}}
 route();
 if(!S.onboarded&&!S.items.length){ONB=0;onbSheet()}
 if(S.ai)aiLoad().catch(()=>{});
 if(S.cut)cutLoad().catch(()=>{});
 if(!IN_PREVIEW&&'serviceWorker' in navigator){try{navigator.serviceWorker.register('sw.js')}catch(e){}}
})();

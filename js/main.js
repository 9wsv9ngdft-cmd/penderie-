// Dress Up — Affichage, routage, retour au premier plan, démarrage
"use strict";
/* ---------- routage ---------- */
function render(){
 const app=$('#app');let html;
 try{html=VIEWS[VIEW]()}catch(e){console.error(e);html=`<h1>Oups</h1><div class="card"><p>Cet écran n’a pas pu s’afficher. Tes données ne sont pas touchées.</p><p class="tiny">${esc(e&&e.message||e)}</p><div class="row">${IN_PREVIEW?'':`<button class="btn sm soft" data-a="export">Sauvegarder (fichier)</button>`}<a class="btn sm ghost" href="#penderie">Voir la penderie</a></div></div>`}
 app.innerHTML=storageBanner()+html;
 document.querySelectorAll('#tabs a').forEach(a=>{const on=a.dataset.v===VIEW;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 a11y(app);
 if(typeof botBadge==='function')botBadge();
 if(typeof checkBadges==='function')checkBadges();
}
function route(){
 const h=location.hash.slice(1);const v=VIEWS[h]?h:'matin';
 if(v!=='ajout'&&EDIT){EDIT=null;DR=null}
 // le scanner ne survit pas à un changement d'écran : on coupe la caméra
 if($('#scan')){const m=SCAN&&SCAN.mode;scanClose();if(m==='batch'&&BATCH){if(!BATCH.total)BATCH=null;else BATCH.busy=SCAN.pending>0}}
 const prev=VIEW;VIEW=v;closeSheet();render();window.scrollTo({top:0});
 // les modèles d'IA ne restent en mémoire que sur l'écran « Ajouter »
 if(v==='ajout')warmModels();else if(prev==='ajout')releaseModels();
}
// retour au premier plan : si on a changé de jour, l'écran du matin repart de zéro (météo, idées, tenue du jour)
let DAY=todayKey();
function wake(){
 if(document.hidden)return;const t=todayKey();if(t===DAY)return;
 DAY=t;OUTS=null;if(VIEW!=='ajout'&&$('#sheet').hidden)render();
}
document.addEventListener('visibilitychange',wake);window.addEventListener('pageshow',wake);
window.addEventListener('hashchange',route);

(async function init(){
 await DB.open();
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
 const st=await DB.get('state');if(st)S=Object.assign(S,st);
 tidy(); // anciennes fiches remises d'aplomb (valeurs manquantes ou inconnues)
 // on affiche d'abord, les photos arrivent ensuite (lues toutes ensemble)
 route();
 if(!S.onboarded&&!S.items.length){ONB=0;onbSheet()}
 const ks=(await DB.keys()).map(String).filter(k=>/^(photo|sq|look):/.test(k));
 const vals=await Promise.all(ks.map(k=>DB.get(k)));
 ks.forEach((k,n)=>{const p=vals[n];if(!p)return;const c=k.indexOf(':'),id=k.slice(c+1),t=k.slice(0,c);(t==='photo'?photos:t==='sq'?squares:lookPhotos).set(id,p)});
 if(ks.length&&VIEW!=='ajout'&&$('#sheet').hidden)render();
 if(!IN_PREVIEW&&'serviceWorker' in navigator){try{navigator.serviceWorker.register('sw.js')}catch(e){}}
})();

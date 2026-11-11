// Dress Up — Utilitaires, référentiels, stockage local, adresses des photos, vignettes
"use strict";
/* ---------- utilitaires ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const z=n=>String(n).padStart(2,'0');
// La journée de l'app commence à 4 h du matin : une tenue notée à 0 h 30 compte encore pour la veille.
const DAY_START=4,now=()=>new Date(Date.now()-DAY_START*36e5);
const todayKey=(d=now())=>d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
const daysSince=k=>k?Math.round((Date.parse(todayKey())-Date.parse(k))/864e5):null;
const IN_PREVIEW=(()=>{try{return window.self!==window.top}catch(e){return true}})();
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)}

/* ---------- référentiels ---------- */
const CATS=[
 {id:'haut',plural:'Hauts',label:'Haut',hint:'t-shirt, chemise, top',max:1},
 {id:'pull',plural:'Pulls',label:'Pull',hint:'pull, sweat, gilet',max:3},
 {id:'bas',plural:'Bas',label:'Bas',hint:'pantalon, jean, jupe, short',max:5},
 {id:'robe',plural:'Robes',label:'Robe',hint:'robe, combinaison',max:2},
 {id:'veste',plural:'Vestes',label:'Veste',hint:'veste, manteau, imper',max:20},
 {id:'chaussures',plural:'Chaussures',label:'Chaussures',hint:'',max:0},
];
const cat=id=>CATS.find(c=>c.id===id)||CATS[0];
const COLORS=[['noir','#1d1d1b'],['blanc','#f7f5f0'],['gris','#9a9a96'],['beige','#d9c7a6'],['marron','#7a5232'],['marine','#1f2f4f'],['bleu','#4a77b4'],['vert','#4f7a4a'],['kaki','#7b7a4a'],['rouge','#b7392e'],['bordeaux','#6e1f2b'],['rose','#e3a3ae'],['jaune','#e3be4a'],['orange','#d9783a'],['violet','#6b4f8c'],['motif','repeating-linear-gradient(45deg,#d9c7a6 0 8px,#2E5A3A 8px 16px)']];
const colorVal=n=>(COLORS.find(c=>c[0]===n)||COLORS[3])[1];
const WARMTH={1:'Léger',2:'Moyen',3:'Chaud'};
const STATES={propre:'Propre',porte:'Déjà porté',sale:'Au sale',reparer:'À réparer'};
const REASONS=[['donne','Donné à quelqu’un'],['vendu','Vendu (seconde main)'],['recyclerie','Déposé en recyclerie / ressourcerie'],['collecte','Borne textile (recyclage)'],['transforme','Transformé / upcyclé'],['jete','Jeté'],['perdu','Perdu']];
const BANDS={froid:{l:'Froid',r:'< 8°',f:4},frais:{l:'Frais',r:'8–15°',f:11},doux:{l:'Doux',r:'15–22°',f:18},chaud:{l:'Chaud',r:'≥ 22°',f:25}};
const bandOf=f=>f>=22?'chaud':f>=15?'doux':f>=8?'frais':'froid';
const WMO=c=>c===0?'Ciel clair':c<=2?'Éclaircies':c===3?'Couvert':c<=48?'Brouillard':c<=57?'Bruine':c<=67?'Pluie':c<=77?'Neige':c<=82?'Averses':c<=86?'Averses de neige':'Orage';
const REPAIRS=[
 ['Bouton décousu','Fil doublé, 6 à 8 passages dans les trous, puis enroule le fil sous le bouton pour former une petite tige avant le nœud au dos : il tiendra bien plus longtemps.'],
 ['Ourlet défait','Épingle à la bonne hauteur et reprends au point invisible (point de côté). En dépannage, une bande thermocollante au fer tient plusieurs lavages.'],
 ['Petit trou dans un pull','Point de reprise : tisse le fil en damier par-dessus le trou, ou assume une réparation visible avec une laine contrastée — c’est joli et ça se voit qu’on prend soin.'],
 ['Maille tirée / accroc','Ne coupe pas le fil ! Repousse-le à l’intérieur avec une aiguille à laine ou un petit crochet, puis détends doucement la maille autour.'],
 ['Fermeture éclair qui s’ouvre','Le curseur s’est souvent écarté : resserre-le très légèrement à la pince, des deux côtés. Si une dent manque, direction retoucheur.'],
 ['Bouloches','Un rasoir anti-bouloches ou un peigne à pull rend une seconde jeunesse au tricot. Lave ensuite sur l’envers, en cycle doux.'],
];

/* ---------- stockage local (IndexedDB, repli mémoire) ---------- */
const DB=(()=>{let db=null;const mem=new Map();
 // ouverture avec délai : si IndexedDB ne répond pas en 3 s (ça arrive sur Safari), on démarre quand même, en mémoire
 async function open(){try{db=await new Promise((res,rej)=>{const to=setTimeout(()=>rej(new Error('délai')),3000);const r=indexedDB.open('penderie',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{clearTimeout(to);res(r.result)};r.onerror=()=>{clearTimeout(to);rej(r.error)};r.onblocked=()=>{clearTimeout(to);rej(new Error('bloqué'))}})}catch(e){db=null}}
 // une écriture qui échoue (stockage plein, transaction annulée) est signalée au lieu d'être avalée
 let failed=false;const fail=e=>{console.warn('stockage',e);if(failed)return;failed=true;if(typeof storageFail==='function')storageFail()};
 function write(fn){if(!db)return;try{const t=db.transaction('kv','readwrite');fn(t.objectStore('kv'));t.onerror=t.onabort=()=>fail(t.error)}catch(e){fail(e)}}
 const st=m=>db.transaction('kv',m).objectStore('kv');
 function get(k){if(!db)return Promise.resolve(mem.get(k));return new Promise(res=>{try{const r=st('readonly').get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>res(mem.get(k))}catch(e){res(mem.get(k))}})}
 function keys(){if(!db)return Promise.resolve([...mem.keys()]);return new Promise(res=>{try{const r=st('readonly').getAllKeys();r.onsuccess=()=>res(r.result);r.onerror=()=>res([])}catch(e){res([])}})}
 function set(k,v){mem.set(k,v);write(s=>s.put(v,k))}
 function del(k){mem.delete(k);write(s=>s.delete(k))}
 return{open,get,set,del,keys,get ok(){return!!db},get failed(){return failed}}})();
function storageFail(){toast('Pas enregistré : stockage plein ou indisponible');if(typeof render==='function')render()}
// bandeau affiché en haut de chaque écran tant que les données ne sont pas en sécurité
function storageBanner(){
 if(DB.failed)return `<div class="notice" role="alert"><b>Le dernier enregistrement a échoué.</b> Le stockage du téléphone est peut-être plein. Fais une sauvegarde maintenant pour ne rien perdre.${IN_PREVIEW?'':`<div class="row" style="margin-top:8px"><button class="btn sm" data-a="export">Sauvegarder (fichier)</button></div>`}</div>`;
 if(!DB.ok&&!IN_PREVIEW)return `<div class="notice" role="alert"><b>Stockage temporaire.</b> Ce navigateur ne garde rien (navigation privée ?) : tout sera perdu à la fermeture. Ouvre Dress Up dans une fenêtre normale.</div>`;
 return'';
}

let S={v:1,items:[],log:[],pins:[],city:null,wx:null,manual:null,undo:null};
const photos=new Map();
const save=()=>DB.set('state',S);
const item=id=>S.items.find(i=>i.id===id);
const active=()=>S.items.filter(i=>!i.removed);
const maxOf=i=>i.max??cat(i.cat).max;

/* ---------- photos : adresse courte ----------
   Les photos sont stockées en texte (data:…). Les recopier dans le HTML à chaque affichage coûte ~80 Ko par vêtement :
   on fabrique une fois une adresse courte (blob:) par photo. Tout ce qui n'est pas une vraie image est refusé. */
const URLS=new Map();
function U(p){
 if(typeof p!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(p))return'';
 let u=URLS.get(p);if(u)return u;
 try{const bin=atob(p.slice(p.indexOf(',')+1)),a=new Uint8Array(bin.length);for(let k=0;k<bin.length;k++)a[k]=bin.charCodeAt(k);
  if(URLS.size>3000){URLS.forEach(x=>URL.revokeObjectURL(x));URLS.clear()}
  u=URL.createObjectURL(new Blob([a],{type:p.slice(5,p.indexOf(';'))}));URLS.set(p,u);return u}catch(e){return''}
}

/* ---------- petites icônes au trait ---------- */
const ICONS={x:'<path d="M6 6l12 12M18 6 6 18"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 cloud:'<path d="M7 18a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17.5 18Z"/>',rain:'<path d="M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17.5 15Z"/><path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
const HANGER='<svg viewBox="0 0 60 34" aria-hidden="true"><path d="M30 2c-3 0-5 2-5 4.5s2 3.5 5 3.5V14"/><path d="M30 14 4 30h52Z"/></svg>';

/* ---------- vignette ---------- */
function thumb(i,cls='ph',badge=false){
 const p=(!/big/.test(cls)&&typeof squares!=='undefined'&&squares.get(i.id))||photos.get(i.id);const tag=i.sale?'En vente':i.loan?'Prêté':i.swap?'À échanger':null;const b=badge?`<span class="badge b-${tag?'porte':i.state}">${tag||STATES[i.state]}</span>`:'';
 const al=`role="img" aria-label="${esc(i.name)}"`;
 if(p&&U(p))return `<div class="${cls}" ${al} style="background-image:url('${U(p)}')">${b}</div>`;
 return `<div class="${cls} sw" ${al} style="background:${colorVal(i.color)}">${b}<span>${photos.get(i.id)||i.color?'':'📷 '}${esc(cat(i.cat).label)}</span></div>`;
}

// Dress Up — Utilitaires, référentiels, stockage local, vignettes
"use strict";
/* ---------- utilitaires ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const z=n=>String(n).padStart(2,'0');
const todayKey=(d=new Date())=>d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
const daysSince=k=>k?Math.round((Date.parse(todayKey())-Date.parse(k))/864e5):null;
const IN_PREVIEW=(()=>{try{return window.self!==window.top}catch(e){return true}})();
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)}

/* ---------- référentiels ---------- */
const CATS=[
 {id:'haut',label:'Haut',hint:'t-shirt, chemise, top',max:1},
 {id:'pull',label:'Pull',hint:'pull, sweat, gilet',max:3},
 {id:'bas',label:'Bas',hint:'pantalon, jean, jupe, short',max:5},
 {id:'robe',label:'Robe',hint:'robe, combinaison',max:2},
 {id:'veste',label:'Veste',hint:'veste, manteau, imper',max:20},
 {id:'chaussures',label:'Chaussures',hint:'',max:0},
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
 async function open(){try{db=await new Promise((res,rej)=>{const r=indexedDB.open('penderie',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}catch(e){db=null}}
 const st=m=>db.transaction('kv',m).objectStore('kv');
 function get(k){if(!db)return Promise.resolve(mem.get(k));return new Promise(res=>{try{const r=st('readonly').get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>res(mem.get(k))}catch(e){res(mem.get(k))}})}
 function keys(){if(!db)return Promise.resolve([...mem.keys()]);return new Promise(res=>{try{const r=st('readonly').getAllKeys();r.onsuccess=()=>res(r.result);r.onerror=()=>res([])}catch(e){res([])}})}
 function set(k,v){mem.set(k,v);if(!db)return;try{st('readwrite').put(v,k)}catch(e){}}
 function del(k){mem.delete(k);if(!db)return;try{st('readwrite').delete(k)}catch(e){}}
 return{open,get,set,del,keys,get ok(){return!!db}}})();

let S={v:1,items:[],log:[],pins:[],city:null,wx:null,manual:null,undo:null};
const photos=new Map();
const save=()=>DB.set('state',S);
const item=id=>S.items.find(i=>i.id===id);
const active=()=>S.items.filter(i=>!i.removed);
const maxOf=i=>i.max??cat(i.cat).max;

/* ---------- vignette ---------- */
function thumb(i,cls='ph',badge=false){
 const p=(!/big/.test(cls)&&typeof squares!=='undefined'&&squares.get(i.id))||photos.get(i.id);const tag=i.sale?'En vente':i.loan?'Prêté':i.swap?'À échanger':null;const b=badge?`<span class="badge b-${tag?'porte':i.state}">${tag||STATES[i.state]}</span>`:'';
 if(p)return `<div class="${cls}" style="background-image:url('${p}')">${b}</div>`;
 return `<div class="${cls} sw" style="background:${colorVal(i.color)}">${b}<span>${photos.get(i.id)||i.color?'':'📷 '}${esc(cat(i.cat).label)}</span></div>`;
}

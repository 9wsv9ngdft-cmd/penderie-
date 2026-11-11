// Dress Up — Lot 3 : empreinte carbone, équivalences, accueil
"use strict";

/* ---------- empreinte carbone par vêtement ----------
   Ordres de grandeur ADEME (Impact CO2 et étude ACV ADEME 2018), en kg CO2e sur toute la vie du vêtement :
   t-shirt coton 6,43 · chemise coton 13,2 · polo 10 · t-shirt polyester 6 · pull acrylique 28 · polaire 26 ·
   sweat coton 31 · pull laine 56,7 · jean 25,1 · robe 56 (viscose 51) · manteau 101 · veste imper 39 ·
   veste simili cuir 25 · chaussures cuir 15 · chaussures tissu 19 · chaussures de sport 20.
   La fabrication représente l'essentiel (81 à 96 %) : on retient ~85 % pour la part évitée en seconde main. */
const MATIERES={coton:'Coton',laine:'Laine',lin:'Lin',polyester:'Polyester / synthétique',cuir:'Cuir',soie:'Soie',viscose:'Viscose',melange:'Mélange'};
const FAB_SHARE=.85;
function co2Of(i){
 const n=(i.name||'')+' '+(i.noun||''),m=i.mat,R=(kg,l,approx)=>({kg,l,approx:!!approx});
 switch(i.cat){
  case 'haut':
   if(/chemise|blouse/i.test(n))return R(13.2,'une chemise en coton');
   if(/polo/i.test(n))return R(10,'un polo');
   if(m==='polyester')return R(6,'un t-shirt en polyester');
   return R(6.43,'un t-shirt en coton',!/t-?shirt|tee|débardeur/i.test(n));
  case 'pull':
   if(m==='laine'||/laine/i.test(n))return R(56.7,'un pull en laine');
   if(/polaire/i.test(n))return R(26,'une polaire');
   if(m==='coton'||/sweat/i.test(n))return R(31,'un sweat en coton');
   return R(28,'un pull (acrylique, valeur moyenne)',true);
  case 'bas':return R(25.1,'un jean',!/jean/i.test(n));
  case 'robe':return m==='viscose'?R(51,'une robe en viscose'):R(56,'une robe');
  case 'veste':
   if(/manteau|doudoune|trench|parka/i.test(n)||i.warmth>=3)return R(101,'un manteau');
   if(/cuir/i.test(n)||m==='cuir')return R(25,'une veste simili cuir');
   return R(39,'une veste imperméable (anorak)',!/imper|anorak|k-?way/i.test(n));
  case 'chaussures':
   if(m==='cuir'||/ville|mocassin|derby|derbies|bottine|escarpin|cuir/i.test(n))return R(15,'des chaussures en cuir');
   if(/sandale|toile|espadrille/i.test(n))return R(19,'des chaussures en tissu');
   return R(20,'des chaussures de sport');
 }
 return R(20,'un vêtement',true);
}
const isSecondHand=i=>originOf(i)==='occasion';
// part de l'empreinte attribuée à toi : en seconde main, la fabrication est déjà « payée »
const myCo2=i=>{const c=co2Of(i).kg;return isSecondHand(i)?c*(1-FAB_SHARE):c};

/* ---------- équivalences parlantes (Impact CO2 / ADEME) ---------- */
const INTERESTS={avion:'Voyages en avion',train:'Train',cuisine:'Cuisine',tech:'Tech',voiture:'Voiture'};
const EQ={
 voiture:{per:.142,f:n=>`${fmtN(n)} km en voiture`},          // 142 g CO2e / km (voiture thermique moyenne)
 train:{per:.00293,f:n=>`${fmtN(n)} km en TGV`},               // 2,93 g CO2e / km
 avion:{per:.225,f:n=>`${fmtN(n)} km en avion`},               // 22,5 kg / 100 km (trajet court)
 cuisine:{per:7,f:n=>`${fmtN(n)} repas avec du bœuf`},          // 7 kg CO2e / repas
 tech:{per:32,f:n=>`la fabrication de ${fmtN(n)} smartphone${n>=1.5?'s':''}`}, // ~32 kg CO2e
};
function fmtN(n){if(n>=100)return (Math.round(n/10)*10).toLocaleString('fr-FR');if(n>=3)return Math.round(n);if(n>=1)return String(Math.round(n*10)/10).replace('.',',');return 'moins d’1'}
const fmtKg=kg=>kg<1?`${Math.round(kg*1000)} g`:`${String(Math.round(kg*(kg<10?10:1))/(kg<10?10:1)).replace('.',',')} kg`;
function eq(kg,seed=0){
 const list=(S.interests&&S.interests.length?S.interests:['voiture']).filter(k=>EQ[k]);
 const ok=list.filter(k=>kg/EQ[k].per>=1);
 const pool=ok.length?ok:['voiture'];const k=pool[Math.abs(seed)%pool.length];
 return '≈ '+EQ[k].f(kg/EQ[k].per);
}
const seedOf=s=>[...String(s)].reduce((a,c)=>a+c.charCodeAt(0),0);

function co2Card(i){
 const c=co2Of(i),tw=totalWears(i),sh=isSecondHand(i),mine=myCo2(i);
 return `<div class="card"><h3>Empreinte carbone</h3>
 <p><b style="font-size:22px;font-family:ui-serif,Georgia,serif">~${fmtKg(c.kg)} CO₂e</b> <span class="tiny">${eq(c.kg,seedOf(i.id))}</span></p>
 <p class="tiny">Moyenne ADEME pour ${c.l}${c.approx?' (valeur la plus proche disponible)':''}, de la fabrication à la fin de vie.${i.madeIn?` Fabriqué en ${esc(i.madeIn)}.`:''}</p>
 ${sh?`<p class="tiny"><b>Acheté d’occasion</b> : tu as évité ~${fmtKg(c.kg*FAB_SHARE)} de fabrication neuve, ${eq(c.kg*FAB_SHARE,seedOf(i.id)+1)} 🌱</p>`:''}
 ${tw?`<p class="tiny">Par port : <b>${fmtKg(mine/tw)}</b>${pastWears(i)===null?' (ports d’avant en construction)':''}. Plus tu le portes, plus ça baisse.</p>`:''}
 ${i.ecoScore?`<p class="tiny">Coût environnemental officiel (étiquette) : <b>${i.ecoScore} points d’impact</b>.</p>`:''}
 </div>`;
}
function co2Bilan(){
 const act=active(),gone=S.items.filter(i=>i.removed);
 const ward=act.reduce((s,i)=>s+myCo2(i),0);
 const avoidSH=S.items.filter(isSecondHand).reduce((s,i)=>s+co2Of(i).kg*FAB_SHARE,0);
 const avoidWish=(S.wishes||[]).filter(w=>w.decided&&w.decided.choice==='renonce').reduce((s,w)=>s+co2Of(w).kg,0);
 const avoided=avoidSH+avoidWish;
 const life=gone.filter(i=>['donne','vendu','recyclerie','transforme','collecte'].includes(i.removed.reason));
 const kgTex=life.reduce((s,i)=>s+(kgOf(i)||.3),0);
 const resale=S.items.reduce((s,i)=>s+(i.resale||0),0);
 const wears=act.reduce((s,i)=>s+totalWears(i),0);
 return `<h2>Empreinte</h2><div class="stats">
  <div class="stat"><b>${fmtKg(avoided)}</b><span>CO₂e évités (seconde main, envies passées)</span></div>
  <div class="stat"><b>${fmtKg(kgTex)}</b><span>de vêtements avec une seconde vie</span></div>
  <div class="stat"><b>${fmtKg(ward)}</b><span>CO₂e : l’empreinte de ta penderie</span></div>
  <div class="stat"><b>${eur(resale)}</b><span>récupérés en revendant</span></div></div>
  <div class="card" style="margin-top:12px">${avoided>=1?`<p>Ce que tu as évité, c’est ${eq(avoided,7).replace('≈ ','environ ')} 🌱</p>`:''}
  ${wears?`<p class="tiny">En moyenne, chaque port de ta penderie pèse ${fmtKg(ward/wears)} CO₂e. Porter plus longtemps fait baisser ce chiffre.</p>`:''}
  <p class="tiny">Ordres de grandeur ADEME (Impact CO2), moyennes par type de vêtement : ils ne mesurent pas précisément chacun de tes vêtements.</p></div>`;
}

/* ---------- accueil au premier lancement ---------- */
let ONB=0;
function onbSheet(){
 const steps=[
  ()=>`<h2 style="margin-top:0">Bienvenue dans Dress Up 🌱</h2><p>Ta penderie dans ton téléphone, des tenues selon la météo, et des vêtements qui durent plus longtemps.</p>
   <p class="tiny">Tout reste sur ton téléphone : pas de compte, pas de cloud. Tes photos ne sortent jamais.</p>`,
  ()=>`<h2 style="margin-top:0">Qu’est-ce qui te parle ?</h2><p class="tiny">Pour traduire les kilos de CO₂ en choses concrètes. Plusieurs choix possibles.</p>
   <div class="chips">${Object.entries(INTERESTS).map(([k,l])=>`<button class="chip ${(S.interests||[]).includes(k)?'on':''}" data-a="interest" data-v="${k}">${l}</button>`).join('')}</div>
   <p class="tiny" style="margin-top:12px">Exemple : un jean neuf, c’est ${eq(25.1,1)}.</p>`,
  ()=>`<h2 style="margin-top:0">Deux réglages</h2>
   ${IN_PREVIEW?'':`<p class="label">Ta ville, pour la météo</p><form class="row" data-f="city" style="flex-wrap:nowrap"><input type="search" name="city" placeholder="${S.city?esc(S.city.name):'ex. Lyon'}" autocomplete="off"><button class="btn sm">OK</button></form>`}
   <p class="label">Ta machine à laver</p><div class="chips">${[5,6,7,8,9,10].map(k=>`<button class="chip ${capKg()===k?'on':''}" data-a="onbKg" data-v="${k}">${k} kg</button>`).join('')}</div>`,
  ()=>`<h2 style="margin-top:0">Scanner ta penderie</h2><ul style="padding-left:18px;margin:0 0 12px">
   <li>Pose chaque vêtement à plat sur un fond uni (lit, parquet).</li><li>Une pièce par photo, bien éclairée.</li>
   <li>Le plus rapide : « Scanner plusieurs vêtements d’un coup » depuis ta galerie.</li></ul>
   <p class="tiny">Tu peux commencer par 10 pièces : ça suffit pour les premières tenues.</p>`];
 const last=ONB===steps.length-1;
 sheet(`<p class="tiny" style="margin:0 0 8px">${ONB+1} / ${steps.length}</p>${steps[ONB]()}
  <div class="spacer"></div><div class="row between">${ONB?`<button class="btn sm ghost" data-a="onbPrev">Retour</button>`:'<span></span>'}
  ${last?`<button class="btn" data-a="onbEnd" data-v="ajout">Scanner ma penderie</button>`:`<button class="btn" data-a="onbNext">Suivant</button>`}</div>
  <div class="spacer"></div><button class="btn sm ghost block" data-a="onbEnd">${last?'Plus tard':'Passer'}</button>`);
}
Object.assign(A,{
 onbNext(){ONB++;onbSheet()},onbPrev(){ONB=Math.max(0,ONB-1);onbSheet()},
 onbKg(el){S.machineKg=+el.dataset.v;save();onbSheet()},
 onbEnd(el){S.onboarded=true;save();closeSheet();if(el.dataset.v)location.hash=el.dataset.v;else render()},
 onbOpen(){ONB=0;onbSheet()},
 interest(el){const s=new Set(S.interests||[]),v=el.dataset.v;s.has(v)?s.delete(v):s.add(v);S.interests=[...s];save();
  if(!$('#sheet').hidden&&ONB===1)onbSheet();else render()},
});

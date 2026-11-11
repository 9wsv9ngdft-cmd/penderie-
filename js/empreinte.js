// Dress Up — Empreinte carbone par vêtement et équivalences parlantes (valeurs ADEME / Impact CO2)
"use strict";

/* ---------- empreinte carbone par vêtement ----------
   Valeurs relues sur impactco2.fr le 11/11/2026 : t-shirt coton 6,43 · chemise 13,2 · jean 25,1 · pull laine 56,7 · manteau 101 · chaussures cuir 15 ;
   voiture thermique 142 g/km · avion trajet court 225 g/km · TGV 2,9 g/km · repas avec bœuf 7 kg. Smartphone (32 kg) : à revérifier, les sources varient.
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
// Total « évité », le même dans Bilan et chez l'assistant : seconde main + envies passées.
// C'est un maximum : on suppose qu'un vêtement neuf aurait été acheté à la place, d'où le « jusqu'à » à l'affichage.
function avoidedCo2(){
 return S.items.filter(isSecondHand).reduce((s,i)=>s+co2Of(i).kg*FAB_SHARE,0)
  +(S.wishes||[]).filter(w=>w.decided&&w.decided.choice==='renonce').reduce((s,w)=>s+co2Of(w).kg,0);
}
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
 <p><b style="font-size:22px;font-family:var(--head)">~${fmtKg(c.kg)} CO₂e</b> <span class="tiny">${eq(c.kg,seedOf(i.id))}</span></p>
 <p class="tiny">Moyenne ADEME pour ${c.l}${c.approx?' (valeur la plus proche disponible)':''}, de la fabrication à la fin de vie.${i.madeIn?` Fabriqué en ${esc(i.madeIn)}.`:''}</p>
 ${sh?`<p class="tiny"><b>Acheté d’occasion</b> : jusqu’à ~${fmtKg(c.kg*FAB_SHARE)} de fabrication neuve évités, ${eq(c.kg*FAB_SHARE,seedOf(i.id)+1)} 🌱</p>`:''}
 ${tw?`<p class="tiny">Par port : <b>${fmtKg(mine/tw)}</b>${pastWears(i)===null?' (ports d’avant en construction)':''}. Plus tu le portes, plus ça baisse.</p>`:''}
 ${i.ecoScore?`<p class="tiny">Coût environnemental officiel (étiquette) : <b>${i.ecoScore} points d’impact</b>.</p>`:''}
 </div>`;
}
function co2Hero(){
 const act=active(),ward=act.reduce((s,i)=>s+myCo2(i),0),avoided=avoidedCo2();
 const gone=S.items.filter(i=>i.removed&&['donne','vendu','recyclerie','transforme','collecte'].includes(i.removed.reason));
 const kgTex=gone.reduce((s,i)=>s+(kgOf(i)||.3),0);
 return `<div class="hero-co2"><p class="hc-k">🌱 CO₂e évités, au mieux</p><p class="hc-big">${fmtKg(avoided)}</p>
  ${avoided>=1?`<p class="hc-eq">C’est jusqu’à ${eq(avoided,7).replace('≈ ','')}</p>`:`<p class="hc-eq">Seconde main, envies passées, dons : chaque geste compte ici.</p>`}
  <div class="hc-row"><div><b>${fmtKg(ward)}</b><span>empreinte de ta penderie</span></div><div><b>${fmtKg(kgTex)}</b><span>de vêtements avec une seconde vie</span></div></div></div>`;
}
function co2Bilan(){
 const act=active(),gone=S.items.filter(i=>i.removed);
 const ward=act.reduce((s,i)=>s+myCo2(i),0);
 const avoided=avoidedCo2();
 const life=gone.filter(i=>['donne','vendu','recyclerie','transforme','collecte'].includes(i.removed.reason));
 const kgTex=life.reduce((s,i)=>s+(kgOf(i)||.3),0);
 const resale=S.items.reduce((s,i)=>s+(i.resale||0),0);
 const wears=act.reduce((s,i)=>s+totalWears(i),0);
 return `${resale?`<div class="stats" style="margin-top:12px"><div class="stat"><b>${eur(resale)}</b><span>récupérés en revendant</span></div></div>`:''}
  <div style="margin-top:10px">
  ${wears>=act.length*3&&wears>=20?`<p class="tiny">En moyenne, chaque port de ta penderie pèse ${fmtKg(ward/wears)} CO₂e. Porter plus longtemps fait baisser ce chiffre.</p>`:''}
  <p class="tiny">Ordres de grandeur ADEME, en moyenne par type de vêtement.</p></div>`;
}

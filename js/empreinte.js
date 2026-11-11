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
const INTERESTS={vetements:'Vêtements neufs',avion:'Voyages en avion',train:'Train',cuisine:'Cuisine',tech:'Tech',voiture:'Voiture'};
const EQ={
 vetements:{per:6.43,f:n=>n*6.43>=50?`${fmtN(n*6.43/25.1)} jean${n*6.43>=37?'s':''} neuf${n*6.43>=37?'s':''}`:`${fmtN(n)} t-shirt${n>=1.5?'s':''} en coton neuf${n>=1.5?'s':''}`}, // t-shirt 6,43 kg · jean 25,1 kg (ADEME)
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
 <p><b style="font-size:22px;font-family:var(--head)">~${fmtKg(c.kg)} CO₂</b> <span class="tiny">${eq(c.kg,seedOf(i.id))}</span></p>
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
 return `<div class="hero-co2"><button class="hc-main" data-a="statInfo" data-v="evites"><p class="hc-k">🌱 CO₂ évités, au mieux <span class="more">›</span></p><p class="hc-big">${fmtKg(avoided)}</p>
  ${avoided>=1?`<p class="hc-eq">C’est jusqu’à ${eq(avoided,7).replace('≈ ','')}</p>`:`<p class="hc-eq">Seconde main, envies passées, dons : chaque geste compte ici.</p>`}</button>
  <div class="hc-row"><button data-a="statInfo" data-v="empreinte"><b>${fmtKg(ward)} <span class="more">›</span></b><span>empreinte de ta penderie</span></button><button data-a="statInfo" data-v="secondevie"><b>${fmtKg(kgTex)} <span class="more">›</span></b><span>de vêtements avec une seconde vie</span></button></div></div>`;
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
  ${wears>=act.length*3&&wears>=20?`<p class="tiny">En moyenne, chaque port de ta penderie pèse ${fmtKg(ward/wears)} CO₂. Porter plus longtemps fait baisser ce chiffre.</p>`:''}
  <p class="tiny">Ordres de grandeur ADEME, en moyenne par type de vêtement.</p></div>`;
}

/* ---------- Bilan : le détail derrière chaque chiffre ---------- */
function statSheet(v){
 const act=active(),li=(arr,f)=>arr.length?`<div class="dlist">${arr.map(f).join('')}</div>`:'',
  row=(i,r)=>`<button class="drow" data-a="open" data-id="${i.id}">${thumb(i)}<span>${esc(i.name)}</span><b>${r}</b></button>`,
  bar=(l,n,max,r)=>`<div class="dbar"><span>${l}</span><div class="bar"><i style="width:${max?n/max*100:0}%"></i></div><b>${r}</b></div>`;
 const byCat=f=>CATS.map(c=>[c,act.filter(i=>i.cat===c.id)]).filter(x=>x[1].length).map(([c,its])=>[c.plural,f(its),its.length]);
 let t='',h='';
 if(v==='evites'){const sh=S.items.filter(isSecondHand),dr=(S.wishes||[]).filter(w=>w.decided&&w.decided.choice==='renonce'),tot=avoidedCo2();
  t='CO₂ évités';
  h=`<p class="dbig">${fmtKg(tot)}</p><p>${tot>=1?`C’est jusqu’à ${['voiture','vetements','train','cuisine'].map(k=>EQ[k].f(tot/EQ[k].per)).join(', ou ')}.`:'Rien encore : achète d’occasion ou laisse passer une envie, et ce chiffre grimpe.'}</p>
  <h3>Seconde main · ${fmtKg(sh.reduce((s,i)=>s+co2Of(i).kg*FAB_SHARE,0))}</h3>${li(sh,i=>row(i,fmtKg(co2Of(i).kg*FAB_SHARE)))||'<p class="tiny">Aucun vêtement d’occasion pour l’instant.</p>'}
  <h3>Envies passées · ${fmtKg(dr.reduce((s,w)=>s+co2Of(w).kg,0))}</h3>${dr.length?`<div class="dlist">${dr.map(w=>`<div class="drow">${wishThumb(w)}<span>${esc(w.name)}</span><b>${fmtKg(co2Of(w).kg)}</b></div>`).join('')}</div>`:'<p class="tiny">Aucune envie abandonnée pour l’instant.</p>'}
  <p class="tiny">« Au mieux » : on suppose que, sans ce geste, tu aurais acheté neuf. Un vêtement d’occasion évite la fabrication (~85 % de son empreinte).</p>`}
 if(v==='empreinte'){const tot=act.reduce((s,i)=>s+myCo2(i),0),cats=byCat(its=>its.reduce((s,i)=>s+myCo2(i),0)).sort((a,b)=>b[1]-a[1]),mx=cats.length?cats[0][1]:0,top=[...act].sort((a,b)=>myCo2(b)-myCo2(a)).slice(0,5),w=act.reduce((s,i)=>s+totalWears(i),0);
  t='Empreinte de ta penderie';
  h=`<p class="dbig">${fmtKg(tot)}</p><p>Le CO₂ émis pour fabriquer, transporter et un jour jeter tes ${act.length} vêtements. ${tot>=1?`C’est ${eq(tot,3).replace('≈ ','environ ')}.`:''}</p>
  <h3>Par catégorie</h3>${cats.map(([l,kg])=>bar(l,kg,mx,fmtKg(kg))).join('')}
  <h3>Ceux qui pèsent le plus</h3>${li(top,i=>row(i,fmtKg(myCo2(i))))}
  ${w?`<div class="dtip">Chaque port pèse en moyenne <b>${fmtKg(tot/w)}</b>. Plus tu portes tes vêtements, plus ce chiffre baisse : c’est le geste le plus efficace.</div>`:''}
  <p class="tiny">Moyennes ADEME par type de vêtement. En seconde main, on ne compte que 15 % (la fabrication est déjà faite).</p>`}
 if(v==='secondevie'){const g=S.items.filter(i=>i.removed&&['donne','vendu','recyclerie','transforme','collecte'].includes(i.removed.reason));
  t='Seconde vie';
  h=`<p class="dbig">${fmtKg(g.reduce((s,i)=>s+(kgOf(i)||.3),0))}</p><p>Le poids des vêtements que tu as donnés, vendus, déposés ou transformés au lieu de les jeter.</p>
  ${li(g,i=>`<div class="drow">${thumb(i)}<span>${esc(i.name)}<br><small>${(REASONS.find(r=>r[0]===i.removed.reason)||['',''])[1]}</small></span><b>${fmtKg(kgOf(i)||.3)}</b></div>`)||'<p class="tiny">Rien pour l’instant. Depuis une fiche : « ♻︎ Seconde vie ».</p>'}`}
 if(v==='pieces'){const cats=byCat(its=>its.length),mx=Math.max(0,...cats.map(c=>c[1])),st=act.filter(stored).length;
  t='Ta penderie';
  h=`<p class="dbig">${act.length} pièces</p>${cats.map(([l,n])=>bar(l,n,mx,n)).join('')}${st?`<p class="tiny">Dont ${st} rangée${st>1?'s':''} pour la saison.</p>`:''}`}
 if(v==='ports'){const w=act.reduce((s,i)=>s+totalWears(i),0),top=[...act].sort((a,b)=>totalWears(b)-totalWears(a)).slice(0,5),low=[...act].filter(i=>!stored(i)).sort((a,b)=>totalWears(a)-totalWears(b)).slice(0,5);
  t='Tes ports';
  h=`<p class="dbig">${w} ports</p><p>Chaque fois que tu enregistres une tenue, chaque pièce compte un port.</p><h3>Tes chouchous</h3>${li(top,i=>row(i,portsLabel(i)))}<h3>Les moins portés</h3>${li(low,i=>row(i,portsLabel(i)))}`}
 if(v==='moyenne'){const w=act.reduce((s,i)=>s+totalWears(i),0),avg=act.length?w/act.length:0,buck=[['0',i=>totalWears(i)===0],['1 à 9',i=>totalWears(i)>0&&totalWears(i)<10],['10 à 29',i=>totalWears(i)>=10&&totalWears(i)<30],['30 et +',i=>totalWears(i)>=30]].map(([l,f])=>[l,act.filter(f).length]),mx=Math.max(0,...buck.map(b=>b[1]));
  t='Ports par pièce';
  h=`<p class="dbig">${avg.toFixed(1).replace('.',',')}</p><p>En moyenne, chaque pièce a été portée ${avg.toFixed(1).replace('.',',')} fois. L’objectif : 30 ports au moins par vêtement.</p><h3>Répartition</h3>${buck.map(([l,n])=>bar(l+' ports',n,mx,n)).join('')}`}
 if(v==='secondemain'){const sh=act.filter(isSecondHand);
  t='Seconde main';
  h=`<p class="dbig">${act.length?Math.round(sh.length/act.length*100):0} %</p><p>${sh.length} pièce${sh.length>1?'s':''} sur ${act.length} achetée${sh.length>1?'s':''} d’occasion. Indique l’origine dans chaque fiche pour que ce chiffre soit juste.</p>${li(sh,i=>row(i,fmtKg(co2Of(i).kg*FAB_SHARE)+' évités'))}`}
 sheet(`<h2 style="margin-top:0">${t}</h2>${h}`);
}

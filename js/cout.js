// Dress Up — Coût par port : ports estimés, durée de vie, comparaison neuf / seconde main
"use strict";

/* ---------- coût par port ---------- */
const ORIGINS={neuf:'Neuf',fast:'Fast-fashion',occasion:'Seconde main',cadeau:'Cadeau / donné'};
const originOf=i=>i.origin||(i.secondHand?'occasion':null);
// Hypothèses de départ, réglables dans Bilan. ratio = prix comparé au neuf de marque ; vie = nombre de ports avant d'être usé.
const HYP0={neuf:{ratio:1,vie:100},fast:{ratio:.3,vie:30},occasion:{ratio:.35,vie:60}};
const hyp=()=>{const h=S.hyp||{};const o={};for(const k in HYP0)o[k]={...HYP0[k],...(h[k]||{})};return o};
// Tes vrais chiffres : moyenne des ports des vêtements arrivés en fin de vie (jetés, borne textile, transformés), dès 3 vêtements.
// Ceux qui sont donnés ou vendus continuent leur vie ailleurs : ils ne disent rien de l'usure.
const END_OF_LIFE=['jete','collecte','transforme'];
function realLife(o){
 const g=S.items.filter(i=>i.removed&&END_OF_LIFE.includes(i.removed.reason)&&originOf(i)===o);
 return g.length>=3?{avg:Math.round(g.reduce((s,i)=>s+totalWears(i),0)/g.length),n:g.length}:null;
}
const lifeOf=o=>Math.max(1,(realLife(o)||{}).avg||hyp()[o].vie);
// Ports d'avant l'app : déduits du rythme réel mesuré depuis l'ajout, appliqué à l'âge du vêtement.
const RATE_MAX=100; // plafond du rythme estimé, en ports par an
const AGES={an0:['Cette année',.5],an1:['1 à 2 ans',1.5],an3:['3 à 5 ans',4],an5:['Plus de 5 ans',7]};
function pastWears(i){
 if(!i.age||!AGES[i.age])return 0;
 const d=daysSince(i.added),w=i.wears||0;
 if(d<28||w<2)return null; // pas encore assez de recul : estimation en construction
 let perYear=Math.min(RATE_MAX,w/d*365);                       // le rythme des premières semaines ne tient pas toute l'année
 if(i.season==='ete'||i.season==='hiver')perYear/=2;            // vêtement de saison : porté la moitié de l'année
 return Math.round(perYear*AGES[i.age][1]);
}
// libellé unique partout : « 12 ports », ou « ~250 ports » quand une partie est estimée (avant l'app)
function portsLabel(i){const tw=totalWears(i);return `${pastWears(i)>0?'~':''}${tw} port${tw>1?'s':''}`}
const totalWears=i=>(i.wears||0)+(pastWears(i)||0);
// coût net : prix d'achat moins ce que tu as récupéré en le revendant
const cpp=i=>i.price>0&&pastWears(i)!==null?Math.max(0,i.price-(i.resale||0))/Math.max(1,totalWears(i)):null;
function projection(i){
 const w=i.wears||0,age=daysSince(i.added);
 if(!(i.price>0)||w<2||age<14||pastWears(i)===null)return null;
 const future=totalWears(i)+w/age*730;return{wears:Math.round(future),cpp:i.price/future};
}
function compare(i){
 const o=originOf(i);if(!(i.price>0)||!o||o==='cadeau'||pastWears(i)===null)return null;
 const H=hyp(),neufPrice=i.price/H[o].ratio,N=Math.max(totalWears(i),lifeOf(o));
 return{N,rows:['neuf','fast','occasion'].map(a=>{const p=neufPrice*H[a].ratio,buys=Math.ceil(N/lifeOf(a));return{a,price:p,buys,cpp:p*buys/N,mine:a===o}}).sort((x,y)=>x.cpp-y.cpp)};
}
function costCard(i){
 if(!(i.price>0))return `<div class="card"><h3>Coût par port</h3><p class="tiny">Ajoute son prix d’achat (dans Modifier) pour savoir combien te coûte chaque port, et comparer avec la seconde main ou la fast-fashion.</p></div>`;
 const pw=pastWears(i);
 if(pw===null)return `<div class="card"><h3>Coût par port</h3><p><b>Estimation en construction…</b></p><p class="tiny">Acheté ${i.age==='an0'?'cette année':'il y a '+AGES[i.age][0].toLowerCase()} : l’app apprend ton rythme de port sur quelques semaines pour estimer combien de fois tu l’as porté avant. Prix : ${eur(i.price)}.</p></div>`;
 const c=cpp(i),p=projection(i),cmp=compare(i),real=['neuf','fast','occasion'].some(o=>realLife(o)),tw=totalWears(i);
 return `<div class="card"><h3>Coût par port</h3>
 <p><b style="font-size:22px;font-family:var(--head)">${eur(c)}</b> <span class="tiny">par port — ${eur(Math.max(0,i.price-(i.resale||0)))}${i.resale?' (revente déduite)':''} ÷ ${Math.max(1,tw)} port${tw>1?'s':''}${!tw?' (pas encore porté)':''}</span></p>
 ${pw?`<p class="tiny">~${pw} ports estimés avant l’app + ${i.wears||0} comptés depuis.</p>`:''}
 ${p?`<p class="tiny">Au rythme actuel, dans 2 ans : ~${p.wears} ports, soit <b>${eur(p.cpp)}</b> le port.</p>`:''}
 ${cmp?`<p class="label" style="margin-top:14px">Et si tu l’avais acheté…</p>
 ${cmp.rows.map(r=>`<div class="row between" style="padding:5px 0;border-top:1px solid var(--line)"><span>${ORIGINS[r.a]}${r.mine?' <span class="pill">le tien</span>':''}<br><span class="tiny">~${eur(r.price)}${r.buys>1?` × ${r.buys} achats`:''}</span></span><b>${eur(r.cpp)}</b></div>`).join('')}
 <p class="tiny" style="margin-top:8px">Pour ~${cmp.N} ports. ${real?'Calculé en partie avec tes propres chiffres.':'Estimation avec des hypothèses de départ, réglables dans Bilan.'}</p>`:''}
 </div>`;
}
function costBilan(){
 const act=active(),priced=S.items.filter(i=>i.price>0);
 const H=hyp();
 let h=`<h2>Coût par port</h2>`;
 if(!priced.length)h+=`<p class="muted">Ajoute le prix d’achat de quelques vêtements pour voir ce qu’ils te coûtent vraiment à chaque port.</p>`;
 else{
  const best=act.filter(i=>cpp(i)!==null&&totalWears(i)>=5).sort((a,b)=>cpp(a)-cpp(b))[0];
  const byO=Object.keys(ORIGINS).filter(o=>o!=='cadeau').map(o=>{const g=priced.filter(i=>originOf(i)===o&&cpp(i)!==null&&totalWears(i)>0);if(!g.length)return null;
   return[o,g.reduce((s,i)=>s+i.price,0)/g.reduce((s,i)=>s+totalWears(i),0)]}).filter(Boolean);
  h+=`<div class="card">${best?`<p>Ta pièce la plus rentable : <b>${esc(best.name)}</b>, ${eur(cpp(best))} le port.</p>`:''}
  ${byO.length?`<p class="label" style="margin-top:6px">Coût moyen d’un port, selon la provenance</p>${byO.map(([o,v])=>`<div class="row between tiny" style="padding:3px 0"><span>${ORIGINS[o]}</span><b>${eur(v)}</b></div>`).join('')}`:''}</div>`;
 }
 h+=`<div class="card"><h3>Durée de vie</h3><p class="tiny">Nombre de ports avant qu’un vêtement soit usé. Ce sont d’abord des hypothèses ; dès que 3 vêtements d’une provenance arrivent en fin de vie (jetés, recyclés ou transformés), tes vrais chiffres prennent le relais.</p>
 ${['neuf','fast','occasion'].map(o=>{const r=realLife(o);return `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${ORIGINS[o]}<br><span class="tiny">${r?`tes chiffres : ${r.avg} ports (${r.n} vêtements)`:`hypothèse · prix ~${Math.round(H[o].ratio*100)} % du neuf`}</span></span><b>${r?r.avg:H[o].vie} ports</b></div>`}).join('')}
 <div class="spacer"></div><button class="btn sm ghost" data-a="hypOpen">Régler les hypothèses</button></div>`;
 return h;
}
function hypSheet(){
 const H=hyp();
 sheet(`<h2 style="margin-top:0">Hypothèses</h2><p class="tiny">Pour comparer, l’app estime combien de ports tient un vêtement selon sa provenance, et son prix par rapport au neuf de marque. Ajuste selon ton expérience.</p>
 ${['neuf','fast','occasion'].map(o=>`<div class="card"><b>${ORIGINS[o]}</b>
  <div class="row between" style="margin-top:8px"><span class="tiny">Durée de vie</span><div class="stepper"><button data-a="hyp" data-o="${o}" data-f="vie" data-d="-10">−</button><b>${H[o].vie} ports</b><button data-a="hyp" data-o="${o}" data-f="vie" data-d="10">+</button></div></div>
  ${o==='neuf'?'':`<div class="row between" style="margin-top:8px"><span class="tiny">Prix / neuf</span><div class="stepper"><button data-a="hyp" data-o="${o}" data-f="ratio" data-d="-0.05">−</button><b>${Math.round(H[o].ratio*100)} %</b><button data-a="hyp" data-o="${o}" data-f="ratio" data-d="0.05">+</button></div></div>`}</div>`).join('')}
 <button class="btn sm ghost" data-a="hypReset">Revenir aux valeurs de départ</button>`);
}

// Dress Up — Lot 1 : lessive pleine, coût par port, saisons
"use strict";

/* ---------- format ---------- */
const eur=n=>(Math.round(n*100)/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:(n<10||Math.round(n*100)%100)?2:0,maximumFractionDigits:2});

/* ---------- lessive pleine ---------- */
const WASH={clair:'Clair',fonce:'Foncé',couleur:'Couleurs'};
const WASH_OF_COLOR={blanc:'clair',beige:'clair',noir:'fonce',marine:'fonce',marron:'fonce',bordeaux:'fonce',kaki:'fonce',gris:'fonce',violet:'fonce',vert:'fonce'};
const washOf=i=>i.wash||WASH_OF_COLOR[i.color]||'couleur';
// poids moyens approximatifs d'un vêtement sec (kg) : sert juste à estimer le remplissage du tambour
const KG={haut:.2,pull:.5,bas:.6,robe:.35,veste:1.1,chaussures:0};
const kgOf=i=>KG[i.cat]??.3;
const capKg=()=>S.machineKg||7;
const FULL=.8; // « pleine » = environ 80 % de la capacité : tambour bien rempli sans être tassé
function laundry(){
 const g={};for(const k in WASH)g[k]={items:[],kg:0};
 active().filter(i=>i.state==='sale'&&maxOf(i)>0).forEach(i=>{const k=washOf(i);g[k].items.push(i);g[k].kg+=kgOf(i)});
 return g;
}
const fullGroups=()=>{const g=laundry();return Object.keys(g).filter(k=>g[k].kg>=capKg()*FULL)};
function laundryCard(){
 const g=laundry();if(!Object.values(g).some(x=>x.items.length))return'';
 return `<div class="card"><div class="row between"><h3 style="margin:0">Panier à linge</h3><span class="tiny">machine de ${capKg()} kg</span></div>
 ${Object.entries(WASH).map(([k,l])=>{const x=g[k];if(!x.items.length)return'';
  const pct=Math.min(100,x.kg/(capKg()*FULL)*100),full=pct>=100;
  return `<div style="margin-top:12px"><div class="row between"><span><b>${l}</b> <span class="tiny">${x.items.length} pièce${x.items.length>1?'s':''} · ~${x.kg.toFixed(1).replace('.',',')} kg</span></span>${full?`<button class="btn sm" data-a="washOpen" data-v="${k}">Machine pleine</button>`:`<span class="tiny">${Math.round(pct)} %</span>`}</div><div class="bar"><i style="width:${pct}%;${full?'':'background:var(--sun)'}"></i></div></div>`}).join('')}
 <div class="spacer"></div><button class="btn sm ghost" data-a="washOpen">Lessive faite</button>
 <p class="tiny" style="margin-top:8px">On attend la machine pleine : moins d’eau et d’énergie par vêtement. Remplissage estimé au poids moyen des vêtements.</p></div>`;
}
function laundryNotice(){
 const f=fullGroups();if(!f.length)return'';
 return `<div class="notice">Machine pleine : <b>${f.map(k=>WASH[k].toLowerCase()).join(', ')}</b>. Un lavage à 30 °C ce soir ? <a href="#penderie">Voir le panier</a></div>`;
}

/* ---------- coût par port ---------- */
const ORIGINS={neuf:'Neuf',fast:'Fast-fashion',occasion:'Seconde main',cadeau:'Cadeau / donné'};
const originOf=i=>i.origin||(i.secondHand?'occasion':null);
// Hypothèses de départ, réglables dans Bilan. ratio = prix comparé au neuf de marque ; vie = nombre de ports avant d'être usé.
const HYP0={neuf:{ratio:1,vie:100},fast:{ratio:.3,vie:30},occasion:{ratio:.35,vie:60}};
const hyp=()=>{const h=S.hyp||{};const o={};for(const k in HYP0)o[k]={...HYP0[k],...(h[k]||{})};return o};
// Tes vrais chiffres : moyenne des ports des vêtements sortis de la penderie (usés, donnés, vendus…), dès 3 vêtements.
function realLife(o){
 const g=S.items.filter(i=>i.removed&&i.removed.reason!=='perdu'&&originOf(i)===o);
 return g.length>=3?{avg:Math.round(g.reduce((s,i)=>s+totalWears(i),0)/g.length),n:g.length}:null;
}
const lifeOf=o=>Math.max(1,(realLife(o)||{}).avg||hyp()[o].vie);
// Ports d'avant l'app : déduits du rythme réel mesuré depuis l'ajout, appliqué à l'âge du vêtement.
const AGES={an0:['Cette année',.5],an1:['1 à 2 ans',1.5],an3:['3 à 5 ans',4],an5:['Plus de 5 ans',7]};
function pastWears(i){
 if(!i.age||!AGES[i.age])return 0;
 const d=daysSince(i.added),w=i.wears||0;
 if(d<28||w<2)return null; // pas encore assez de recul : estimation en construction
 return Math.round(w/d*365*AGES[i.age][1]);
}
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
 <p><b style="font-size:22px;font-family:ui-serif,Georgia,serif">${eur(c)}</b> <span class="tiny">par port — ${eur(i.price)} ÷ ${Math.max(1,tw)} port${tw>1?'s':''}${!tw?' (pas encore porté)':''}</span></p>
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
 h+=`<div class="card"><h3>Durée de vie</h3><p class="tiny">Nombre de ports avant qu’un vêtement soit usé. Ce sont d’abord des hypothèses ; dès que 3 vêtements d’une provenance quittent ta penderie, tes vrais chiffres prennent le relais.</p>
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

/* ---------- saisons ---------- */
const SEASONS={toutes:'Toutes saisons',ete:'Été',hiver:'Hiver'};
const seasonByDate=(d=new Date())=>{const m=d.getMonth()+1;return m>=4&&m<=9?'ete':'hiver'};
const curSeason=()=>S.season||seasonByDate();
const stored=i=>!!i.season&&i.season!=='toutes'&&i.season!==curSeason();
const inUse=()=>active().filter(i=>!stored(i)&&!paused(i)&&!outOfCircuit(i));
const seasonGuess=n=>/short|sandale|débardeur|en lin/i.test(n||'')?'ete':/doudoune|manteau|polaire|en laine|bottine/i.test(n||'')?'hiver':'toutes';
function seasonNotice(){
 const next=seasonByDate();if(next===curSeason())return'';
 if(S.seasonSnooze&&daysSince(S.seasonSnooze)<14)return'';
 const out=active().filter(i=>i.season===curSeason()).length,back=active().filter(i=>i.season===next).length;
 if(!out&&!back){S.season=next;save();return''}
 return `<div class="notice"><b>Changement de saison ?</b> On passe la penderie en mode ${SEASONS[next].toLowerCase()} : ${out} vêtement${out>1?'s':''} à ranger, ${back} à ressortir.
 <div class="row" style="margin-top:10px"><button class="btn sm" data-a="seasonSwitch" data-v="${next}">Faire le changement</button><button class="btn sm ghost" data-a="seasonSnooze">Plus tard</button></div></div>`;
}
function seasonSheet(prev,next){
 const out=active().filter(i=>i.season===prev),back=active().filter(i=>i.season===next);
 const unworn=out.filter(i=>!i.lastWorn||daysSince(i.lastWorn)>=180);
 sheet(`<h2 style="margin-top:0">Mode ${SEASONS[next].toLowerCase()} activé</h2>
 ${out.length?`<p class="label">Rangés (${out.length})</p><div class="hlist">${out.map(i=>`<div class="it">${thumb(i)}<div class="nm">${esc(i.name)}</div></div>`).join('')}</div>`:''}
 ${back.length?`<p class="label">Ressortis (${back.length})</p><div class="hlist">${back.map(i=>`<div class="it">${thumb(i)}<div class="nm">${esc(i.name)}</div></div>`).join('')}</div>`:''}
 <div class="card" style="margin-top:14px"><h3>Avant de ranger</h3><p class="tiny">Lave ce qui est sale (ranger sale attire les mites), mets de côté ce qui est à réparer : c’est le bon moment pour le faire.</p>
 ${unworn.length?`<p class="tiny"><b>${unworn.length} pas porté${unworn.length>1?'s':''} de la saison</b> : ${unworn.map(i=>esc(i.name)).join(', ')}. Les garder, ou leur offrir une seconde vie ?</p>`:''}</div>
 <button class="btn block" data-a="close">C’est noté</button>`);
}

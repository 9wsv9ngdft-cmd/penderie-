// Dress Up — Lot 4 : dessous, inventaire express, photo du jour, planning de la semaine, session réparation, badges
"use strict";

/* ---------- dessous : de simples compteurs ---------- */
const UNDER=[['chaussettes','Paires de chaussettes'],['culottes','Culottes'],['boxers','Boxers'],['slips','Slips'],['sg','Soutiens-gorge'],['collants','Collants']];
const POOL=['culottes','boxers','slips'];
const under=()=>S.under||(S.under={});
const uTot=k=>(under()[k]||{}).total||0,uClean=k=>Math.min(uTot(k),(under()[k]||{}).clean??uTot(k));
const poolClean=()=>POOL.reduce((s,k)=>s+uClean(k),0),poolTot=()=>POOL.reduce((s,k)=>s+uTot(k),0);
function underUse(u,ids){ // consommation d'une journée (sur un objet de compteurs, réel ou simulé)
 const dec=k=>{if(u[k]&&u[k].total)u[k].clean=Math.max(0,(u[k].clean??u[k].total)-1)};
 dec('chaussettes');
 const p=POOL.filter(k=>u[k]&&u[k].total).sort((a,b)=>(u[b].clean??u[b].total)-(u[a].clean??u[a].total))[0];if(p)dec(p);
 if(u.sg&&u.sg.total){u.sg.uses=(u.sg.uses||0)+1;if(u.sg.uses%3===0)dec('sg')} // un soutien-gorge se porte ~3 jours
 const w=effWeather();if(ids&&ids.some(id=>{const i=item(id);return i&&(i.cat==='robe'||/jupe/i.test(i.name))})&&w&&(w.band==='froid'||w.band==='frais'))dec('collants');
}
function onWear(ids){if(Object.keys(under()).length){S.undo.under=JSON.parse(JSON.stringify(under()));underUse(under(),ids)}}
function underLine(){
 const ks=UNDER.filter(([k])=>uTot(k));if(!ks.length)return `<button class="btn sm ghost" data-a="underOpen">🧦 Compter mes dessous</button>`;
 const low=uTot('chaussettes')&&uClean('chaussettes')<=2||poolTot()&&poolClean()<=2;
 return `<button class="opt" data-a="underOpen" style="margin:0">🧦 <b>Dessous</b> <span class="tiny">${uTot('chaussettes')?`chaussettes ${uClean('chaussettes')}/${uTot('chaussettes')}`:''}${poolTot()?` · culottes/boxers/slips ${poolClean()}/${poolTot()}`:''}${uTot('sg')?` · soutiens-gorge ${uClean('sg')}/${uTot('sg')}`:''}</span>${low?'<br><span class="tiny" style="color:var(--clay)"><b>Bientôt plus rien de propre : lessive à prévoir</b></span>':''}</button>`;
}
function underSheet(){
 sheet(`<h2 style="margin-top:0">Mes dessous</h2><p class="tiny">Pas de photo, juste des nombres : ça suffit pour le planning et la lessive. Les compteurs baissent chaque jour où tu enregistres une tenue.</p>
 ${UNDER.map(([k,l])=>`<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><span>${l}<br><span class="tiny">${uTot(k)?uClean(k)+' propres':'—'}</span></span><div class="stepper"><button data-a="uStep" data-k="${k}" data-d="-1">−</button><b>${uTot(k)}</b><button data-a="uStep" data-k="${k}" data-d="1">+</button></div></div>`).join('')}
 <div class="spacer"></div><button class="btn block" data-a="uWash">Tout est propre</button>`);
}

/* ---------- inventaire express ---------- */
const INV=[['T-shirts','haut','T-shirt',1],['Chemises','haut','Chemise',1],['Tops / polos','haut','Top',1],['Pulls','pull','Pull',2],['Sweats','pull','Sweat',2],['Gilets','pull','Gilet',2],
 ['Jeans','bas','Jean',2],['Pantalons','bas','Pantalon',2],['Shorts','bas','Short',1],['Jupes','bas','Jupe',1],['Joggings / leggings','bas','Jogging',2],['Robes','robe','Robe',1],
 ['Vestes','veste','Veste',2],['Manteaux','veste','Manteau',3],['Baskets','chaussures','Baskets',2],['Chaussures de ville','chaussures','Chaussures de ville',2],['Bottines / bottes','chaussures','Bottines',3],['Sandales','chaussures','Sandales',1]];
let INVD=null;
function invSheet(){
 if(!INVD)INVD={};
 const n=Object.values(INVD).reduce((a,b)=>a+b,0);
 sheet(`<h2 style="margin-top:0">Inventaire express</h2><p class="tiny">Compte, c’est tout : ta penderie existe en 2 minutes. Tu ajouteras les photos petit à petit.</p>
 ${INV.map(([l],k)=>`<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${l}</span><div class="stepper"><button data-a="invStep" data-k="${k}" data-d="-1">−</button><b>${INVD[k]||0}</b><button data-a="invStep" data-k="${k}" data-d="1">+</button></div></div>`).join('')}
 <p class="label">Dessous</p>${UNDER.map(([k,l])=>`<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${l}</span><div class="stepper"><button data-a="uStep" data-k="${k}" data-d="-1" data-inv="1">−</button><b>${uTot(k)}</b><button data-a="uStep" data-k="${k}" data-d="1" data-inv="1">+</button></div></div>`).join('')}
 <div class="spacer"></div><button class="btn block" data-a="invSave" ${n?'':'disabled'}>Ajouter ${n} vêtement${n>1?'s':''}</button>`);
}
const noPhoto=()=>active().filter(i=>!photos.get(i.id));
function photoOfDay(){
 const list=noPhoto().filter(i=>!outOfCircuit(i));if(!list.length||S.photoSkip===todayKey())return'';
 const i=list[seedOf(todayKey())%list.length];
 return `<div class="notice">📷 <b>Photo du jour</b> : ${esc(i.name)} ? <span class="tiny">(${list.length} à photographier)</span>
 <div class="row" style="margin-top:8px"><button class="btn sm" data-a="edit" data-id="${i.id}">Le prendre en photo</button><button class="btn sm ghost" data-a="photoSkip">Pas aujourd’hui</button></div></div>`;
}
function collectionBar(){
 const all=active().length,np=noPhoto().length;if(!np||!all)return'';
 return `<div class="card" style="padding:12px 16px"><div class="row between"><b>📷 Collection</b><span class="tiny">${all-np}/${all} photographiés</span></div><div class="bar"><i style="width:${(all-np)/all*100}%"></i></div></div>`;
}
const COLOR_Q=COLORS.filter(c=>c[0]!=='motif');
const colorPick=i=>i.color?'':`<p class="label">Sa couleur ?</p><div class="chips">${COLORS.map(([n,v])=>`<button class="chip" data-a="setColor" data-id="${i.id}" data-v="${n}"><span class="dot" style="background:${v}"></span>${n}</button>`).join('')}</div>`;

/* ---------- planning de la semaine ---------- */
const DAYS=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],DAYS_LONG=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const agenda=()=>S.agenda||(S.agenda={1:'boulot',2:'boulot',3:'boulot',4:'boulot',5:'boulot'});
const OCC_CYCLE=['quotidien','boulot','sport','soiree'];
async function wx7(){
 if(S.wx7&&S.wx7.date===todayKey())return S.wx7.days;
 if(!S.city||IN_PREVIEW)return null;
 try{const j=await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${S.city.lat}&longitude=${S.city.lon}&daily=apparent_temperature_max,apparent_temperature_min,precipitation_probability_max&timezone=auto&forecast_days=7`)).json();
  const d=j.daily;const days=d.time.map((t,k)=>({date:t,feels:Math.round(d.apparent_temperature_max[k]*.6+d.apparent_temperature_min[k]*.4),rain:(d.precipitation_probability_max[k]||0)>=50}));
  S.wx7={date:todayKey(),days};save();return days}catch(e){return null}
}
function planWeek(days){
 const sim={};inUse().forEach(i=>sim[i.id]={state:i.state,sw:i.sinceWash||0,last:daysSince(i.lastWorn)});
 const u=JSON.parse(JSON.stringify(under()));const alerts=[],out=[],missFirst={};let underOut=null;
 days.forEach((d,k)=>{
  const wd=new Date(d.date+'T12:00').getDay(),ov=dayOverride(d.date)||{},occ=ov.occ||agenda()[wd]||'quotidien',mood=ov.mood||null,b=bandOf(d.feels);
  const ok=i=>sim[i.id]&&(sim[i.id].state==='propre'||sim[i.id].state==='porte');
  let bestTry=null;
  for(let t=0;t<6;t++){
  const used=new Set();let tot=0;
  const pick=(c,want)=>{let list=inUse().filter(i=>i.cat===c&&ok(i)&&!used.has(i.id));
   if(occ==='sport'){const t=list.filter(i=>occsOf(i).includes('sport'));if(t.length)list=t}
   let best=null,bs=-1e9;for(const i of list){let s=Math.random()*1.5;if(sim[i.id].state==='porte')s+=1.5;s-=Math.abs((i.warmth||2)-want)*1.3;s+=occScore(i,occ)+moodScore(i,mood,occ);
    if(d.rain&&i.waterproof)s+=3;const l=sim[i.id].last;if(l!==null&&l<2)s-=2;if(s>bs){bs=s;best=i}}
   if(best){used.add(best.id);tot+=bs}return best};
  const o=[],miss=[];const need=(c,w)=>{const x=pick(c,w);x?o.push(x):miss.push(cat(c).label.toLowerCase())};
  const robe=inUse().some(i=>i.cat==='robe'&&ok(i))&&(b==='chaud'||b==='doux'||occ==='soiree')&&(t%3===1);
  if(robe)need('robe',b==='chaud'?1:2);else{need('haut',b==='chaud'?1:b==='froid'?2:1.5);need('bas',b==='froid'?3:2)}
  if(b==='frais'||b==='froid')need('pull',b==='froid'?3:2);
  if(b==='frais'||b==='froid'||d.rain)need('veste',b==='froid'?3:2);
  need('chaussures',2);
  const sc=(o.length?tot/o.length:0)*3+harmony(o,mood).s*1.5-miss.length*5;
  if(!bestTry||sc>bestTry.sc)bestTry={o,miss,sc};
  }
  const {o,miss}=bestTry;
  o.forEach(i=>{const s=sim[i.id];s.sw++;s.last=0;const m=maxOf(i);s.state=m===0?'propre':s.sw>=m?'sale':'porte'});
  Object.values(sim).forEach(s=>{if(s.last!==null)s.last++});
  miss.forEach(m=>{if(!(m in missFirst))missFirst[m]=k?DAYS_LONG[wd]:'aujourd’hui'});
  if(Object.keys(u).length){underUse(u,o.map(i=>i.id));
   if(!underOut&&((u.chaussettes&&u.chaussettes.total&&!u.chaussettes.clean)||(POOL.some(p=>u[p]&&u[p].total)&&!POOL.reduce((s,p)=>s+((u[p]||{}).clean||0),0))))underOut=DAYS[wd]}
  out.push({date:d.date,wd,b,rain:d.rain,occ,mood,ov:!!dayOverride(d.date),ids:o.map(i=>i.id)});
 });
 Object.entries(missFirst).forEach(([m,d])=>alerts.push(`Plus de ${m} propre à partir de ${d} : une lessive la veille ?`));
 if(underOut)alerts.unshift(`🧦 Pas assez de dessous propres : plus rien de propre à partir de ${DAYS_LONG[DAYS.indexOf(underOut)]}. Lessive à prévoir avant !`);
 S.plan={start:todayKey(),days:out,alerts};save();return S.plan;
}
async function weekSheet(fresh){
 sheet(`<h2 style="margin-top:0">Ma semaine</h2><p class="muted">Je regarde la météo…</p>`);
 let days=await wx7(),manual=false;
 if(!days){const w=effWeather()||{feels:15,rain:false};manual=true;days=Array.from({length:7},(_,k)=>{const d=new Date();d.setDate(d.getDate()+k);return{date:todayKey(d),feels:w.feels,rain:!!w.rain}})}
 const P=(!fresh&&S.plan&&S.plan.start===todayKey())?S.plan:planWeek(days);
 sheet(`<h2 style="margin-top:0">Ma semaine</h2>
 <p class="label" style="margin-top:4px">Ma semaine type <span style="text-transform:none;font-weight:400">(touche un jour pour changer)</span></p>
 <div class="row" style="gap:6px;flex-wrap:nowrap">${[1,2,3,4,5,6,0].map(d=>`<button class="chip" style="flex:1;padding:6px 0;text-align:center;font-size:12px" data-a="agendaTap" data-v="${d}">${DAYS[d]}<br><b>${{quotidien:'Libre',boulot:'Boulot',sport:'Sport',soiree:'Soirée'}[agenda()[d]||'quotidien']}</b></button>`).join('')}</div>
 ${manual?`<p class="tiny" style="margin-top:10px">Météo de la semaine indisponible ici : j’ai pris celle d’aujourd’hui pour chaque jour.</p>`:''}
 ${P.alerts.map(a=>`<div class="notice" style="margin-top:10px">${esc(a)}</div>`).join('')}
 ${P.days.map(d=>{const its=d.ids.map(item).filter(Boolean);return `<div class="card outfit" style="margin-top:10px"><div class="row between"><b>${DAYS[d.wd]} ${new Date(d.date+'T12:00').getDate()}</b><span class="tiny">${BANDS[d.b].l}${d.rain?' ☂':''} · ${d.ov?'<b>':''}${OCCS[d.occ]}${d.mood?', '+MOODS[d.mood].toLowerCase():''}${d.ov?'</b>':''} <button class="btn sm ghost" style="padding:2px 9px;margin-left:4px" data-a="dayEdit" data-d="${d.date}">✎</button></span></div>
  <div class="strip" style="margin:8px 0 4px">${its.map(i=>thumb(i)).join('')}</div><p class="tiny" style="margin:0">${esc(its.map(i=>i.name).join(' · '))}</p></div>`}).join('')}
 <div class="spacer"></div><button class="btn soft block" data-a="weekRedo">Remélanger la semaine</button>`);
}
function plannedToday(){
 const d=S.plan&&S.plan.days.find(x=>x.date===todayKey());if(!d||!d.ids.length)return null;
 const ok=d.ids.every(id=>{const i=item(id);return i&&!i.removed&&!outOfCircuit(i)&&(i.state==='propre'||i.state==='porte')});
 if(!ok)return null;const a=[...d.ids];a.plan=true;return a;
}

/* ---------- session réparation ---------- */
const KINDS={bouton:'Bouton',ourlet:'Ourlet',trou:'Trou',maille:'Maille tirée',fermeture:'Fermeture',bouloches:'Bouloches',autre:'Autre'};
const MATOS={bouton:['fil assorti','aiguille','bouton de rechange'],ourlet:['épingles','fil','aiguille','fer à repasser (ou bande thermocollante)'],trou:['fil ou laine assortis','aiguille à repriser','un œuf à repriser (ou une ampoule)'],
 maille:['crochet fin ou aiguille à laine'],fermeture:['pince plate'],bouloches:['rasoir anti-bouloches ou peigne'],autre:['kit couture de base']};
function sessionSheet(){
 const rep=active().filter(i=>i.state==='reparer');
 const kinds=[...new Set(rep.map(i=>i.repairKind||'autre'))];const matos=[...new Set(kinds.flatMap(k=>MATOS[k]))];
 sheet(`<h2 style="margin-top:0">🧵 Session réparation</h2>
 ${rep.length?`<div class="card"><b>Matériel à sortir</b><p class="tiny" style="margin:6px 0 0">${matos.join(' · ')}</p></div>
 ${rep.map(i=>`<div class="card"><div class="row" style="flex-wrap:nowrap;gap:12px">${thumb(i,'ph mini')}<div style="flex:1;min-width:0"><b>${esc(i.name)}</b>
  <div class="chips" style="margin-top:6px">${Object.entries(KINDS).map(([k,l])=>`<button class="chip ${(i.repairKind||'autre')===k?'on':''}" style="padding:4px 9px;font-size:12px" data-a="repKind" data-id="${i.id}" data-v="${k}">${l}</button>`).join('')}</div></div></div>
  ${(()=>{const r=REPAIRS.find(([t])=>t.toLowerCase().includes((KINDS[i.repairKind]||'').toLowerCase().split(' ')[0])&&i.repairKind&&i.repairKind!=='autre');return r?`<details><summary>Comment faire</summary><p>${r[1]}</p></details>`:''})()}
  <div class="row" style="margin-top:8px"><button class="btn sm" data-a="repDone" data-id="${i.id}">Réparé ✓</button><a class="btn sm ghost" href="https://maps.apple.com/?q=retoucherie" target="_blank" rel="noopener">Confier à un retoucheur</a></div></div>`).join('')}`
 :'<p class="muted">Rien à réparer pour l’instant. Bravo !</p>'}
 ${(S.stats&&S.stats.repairs)?`<p class="tiny">Déjà ${S.stats.repairs} réparation${S.stats.repairs>1?'s':''} au compteur 🌱</p>`:''}`);
}

/* ---------- badges ---------- */
const streak=()=>{let n=0;const set=new Set(S.log.map(l=>l.date));const d=new Date();if(!set.has(todayKey(d)))d.setDate(d.getDate()-1);while(set.has(todayKey(d))){n++;d.setDate(d.getDate()-1)}return n};
const BADGES=[
 ['debut','👕','Premier pas','10 vêtements dans ta penderie',()=>active().length>=10],
 ['collection','📷','Collection complète','Toute ta penderie en photo',()=>active().length>=10&&!noPhoto().length],
 ['regulier','📅','Régulier','7 jours de suite avec ta tenue enregistrée',()=>streak()>=7],
 ['trente','🔁','30 ports','Un vêtement porté 30 fois',()=>S.items.some(i=>totalWears(i)>=30)],
 ['cent','💯','Centenaire','Un vêtement porté 100 fois',()=>S.items.some(i=>totalWears(i)>=100)],
 ['occasion','🌱','Main verte','Un achat de seconde main',()=>S.items.some(isSecondHand)],
 ['reparateur','🧵','Réparateur·rice','Ta première réparation',()=>(S.stats||{}).repairs>=1],
 ['secondevie','♻️','Seconde vie','Un vêtement vendu, donné ou déposé',()=>S.items.some(i=>i.removed&&['donne','vendu','recyclerie','transforme','collecte'].includes(i.removed.reason))],
 ['zen','🧘','Zen des envies','Une envie passée sans achat',()=>(S.wishes||[]).some(w=>w.decided&&w.decided.choice==='renonce')],
 ['defi','🏆','Défi relevé','Un défi réussi',()=>(S.chals||[]).some(c=>c.status==='reussi')],
 ['machine','🫧','Lessive maline','Une machine lancée bien pleine',()=>(S.stats||{}).fullWash>=1],
 ['valise','🧳','Valise légère','Une valise préparée avec Dress Up',()=>!!S.trip],
];
function checkBadges(){
 const got=S.badges||(S.badges={});let news=[];
 BADGES.forEach(([id,e,t,d,f])=>{try{if(!got[id]&&f()){got[id]=todayKey();news.push([e,t])}}catch(err){}});
 if(news.length){save();news.forEach(([e,t])=>{toast(`${e} Badge débloqué : ${t}`);if(typeof botPush==='function')botPush('badge',{t:`${e} ${t}`})})}
}
function badgesBilan(){
 const got=S.badges||{};const n=Object.keys(got).length;
 return `<h2>Badges <span class="tiny">${n}/${BADGES.length}</span></h2><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">${BADGES.map(([id,e,t,d])=>`<div class="stat" style="text-align:center;padding:10px;${got[id]?'':'opacity:.4;filter:grayscale(1)'}"><div style="font-size:28px">${e}</div><b style="font-size:13px;font-family:inherit">${t}</b><span style="font-size:11px">${d}</span></div>`).join('')}</div>`;
}

/* ---------- actions ---------- */
Object.assign(A,{
 underOpen:underSheet,
 uStep(el){const k=el.dataset.k,u=under();const t=Math.max(0,uTot(k)+(+el.dataset.d));const c=Math.min(t,uClean(k)+(+el.dataset.d>0?1:0));u[k]={...(u[k]||{}),total:t,clean:c};save();el.dataset.inv?invSheet():underSheet();render()},
 uWash(){Object.values(under()).forEach(x=>{x.clean=x.total});save();underSheet();render();toast('Dessous tout propres')},
 invOpen(){INVD=null;invSheet()},
 invStep(el){const k=+el.dataset.k;INVD[k]=Math.max(0,(INVD[k]||0)+(+el.dataset.d));invSheet()},
 invSave(){let n=0;Object.entries(INVD).forEach(([k,c])=>{const [l,ca,noun,w]=INV[+k];const have=S.items.filter(i=>new RegExp('^'+noun+' \\d+$').test(i.name)).length;
  for(let j=1;j<=c;j++){S.items.push({id:uid(),name:`${noun} ${have+j}`,cat:ca,color:'',warmth:w,waterproof:false,origin:null,price:null,season:seasonGuess(noun),wash:'',occ:[],state:'propre',max:null,added:todayKey(),wears:0,sinceWash:0,lastWorn:null,express:true});n++}});
  INVD=null;OUTS=null;save();closeSheet();location.hash='penderie';render();toast(`${n} vêtements ajoutés. Les photos, petit à petit 📷`)},
 photoSkip(){S.photoSkip=todayKey();save();render()},
 setColor(el){const i=item(el.dataset.id);i.color=el.dataset.v;save();itemSheet(i.id);render()},
 weekOpen(){weekSheet(false)},
 weekRedo(){S.plan=null;weekSheet(true)},
 agendaTap(el){const d=+el.dataset.v,cur=agenda()[d]||'quotidien';agenda()[d]=OCC_CYCLE[(OCC_CYCLE.indexOf(cur)+1)%OCC_CYCLE.length];S.plan=null;save();weekSheet(true)},
 sessionOpen:sessionSheet,
 repKind(el){item(el.dataset.id).repairKind=el.dataset.v;save();sessionSheet()},
 repDone(el){const i=item(el.dataset.id);i.state='propre';i.sinceWash=0;i.repaired=(i.repaired||0)+1;const st=S.stats||(S.stats={});st.repairs=(st.repairs||0)+1;st.repairCo2=(st.repairCo2||0)+co2Of(i).kg*FAB_SHARE;
  OUTS=null;save();sessionSheet();render();toast('Réparé ! Il repart pour un tour 🧵')},
});

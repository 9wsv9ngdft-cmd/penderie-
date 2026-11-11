// Dress Up — Ma semaine : planning des 7 prochains jours selon la météo et la semaine type
"use strict";

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
  // aujourd'hui : si la tenue est déjà enregistrée, c'est elle qui compte (elle est déjà dans les compteurs)
  const logged=!k&&d.date===todayKey()&&S.log.find(l=>l.date===d.date);
  if(logged){Object.values(sim).forEach(s=>{if(s.last!==null)s.last++});out.push({date:d.date,wd,b,rain:d.rain,occ,mood,ov:!!dayOverride(d.date),ids:logged.ids.filter(id=>item(id)),done:true});return}
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
  if(Object.keys(u).length){underUse(u,o.map(i=>i.id),b);
   if(!underOut&&((u.chaussettes&&u.chaussettes.total&&!u.chaussettes.clean)||(POOL.some(p=>u[p]&&u[p].total)&&!POOL.reduce((s,p)=>s+((u[p]||{}).clean||0),0))))underOut=DAYS[(wd+1)%7]} // le dernier propre part ce jour-là : il n'y en a plus à partir du lendemain
  out.push({date:d.date,wd,b,rain:d.rain,occ,mood,ov:!!dayOverride(d.date),ids:o.map(i=>i.id)});
 });
 Object.entries(missFirst).forEach(([m,d])=>alerts.push(`Plus de ${m} propre à partir de ${d} : une lessive la veille ?`));
 if(underOut)alerts.unshift(`🧦 Pas assez de dessous propres : plus rien de propre à partir de ${DAYS_LONG[DAYS.indexOf(underOut)]}. Lessive à prévoir avant !`);
 S.plan={start:todayKey(),days:out,alerts};save();return S.plan;
}
async function weekSheet(fresh){
 sheet(`<h2 style="margin-top:0">Ma semaine</h2><p class="muted">Je regarde la météo…</p>`);
 let days=await wx7(),manual=false;
 if(!days){const w=effWeather()||{feels:15,rain:false};manual=true;days=Array.from({length:7},(_,k)=>{const d=now();d.setDate(d.getDate()+k);return{date:todayKey(d),feels:w.feels,rain:!!w.rain}})}
 const P=(!fresh&&S.plan&&S.plan.start===todayKey())?S.plan:planWeek(days);
 sheet(`<h2 style="margin-top:0">Ma semaine</h2>
 <p class="label" style="margin-top:4px">Ma semaine type <span style="text-transform:none;font-weight:400">(touche un jour pour changer)</span></p>
 <div class="row" style="gap:6px;flex-wrap:nowrap">${[1,2,3,4,5,6,0].map(d=>`<button class="chip" style="flex:1;padding:6px 0;text-align:center;font-size:12px" data-a="agendaTap" data-v="${d}">${DAYS[d]}<br><b>${{quotidien:'Libre',boulot:'Boulot',sport:'Sport',soiree:'Soirée'}[agenda()[d]||'quotidien']}</b></button>`).join('')}</div>
 ${manual?`<p class="tiny" style="margin-top:10px">Météo de la semaine indisponible ici : j’ai pris celle d’aujourd’hui pour chaque jour.</p>`:''}
 ${P.alerts.map(a=>`<div class="notice" style="margin-top:10px">${esc(a)}</div>`).join('')}
 ${P.days.map(d=>{const its=d.ids.map(item).filter(Boolean);return `<div class="card outfit" style="margin-top:10px"><div class="row between"><b>${DAYS[d.wd]} ${new Date(d.date+'T12:00').getDate()}${d.done?' · tenue enregistrée':''}</b><span class="tiny">${BANDS[d.b].l}${d.rain?' ☂':''} · ${d.ov?'<b>':''}${OCCS[d.occ]}${d.mood?', '+MOODS[d.mood].toLowerCase():''}${d.ov?'</b>':''} <button class="btn sm ghost" style="margin-left:4px" data-a="dayEdit" data-d="${d.date}" aria-label="Modifier ce jour" style="min-width:44px">✎</button></span></div>
  <div class="strip" style="margin:8px 0 4px">${its.map(i=>thumb(i)).join('')}</div><p class="tiny" style="margin:0">${esc(its.map(i=>i.name).join(' · '))}</p></div>`}).join('')}
 <div class="spacer"></div><button class="btn soft block" data-a="weekRedo">Remélanger la semaine</button>`);
}
function plannedToday(){
 const d=S.plan&&S.plan.days.find(x=>x.date===todayKey());if(!d||!d.ids.length)return null;
 const ok=d.ids.every(id=>{const i=item(id);return i&&!i.removed&&!outOfCircuit(i)&&(i.state==='propre'||i.state==='porte')});
 if(!ok)return null;const a=[...d.ids];a.plan=true;return a;
}


/* ---------- actions ---------- */
Object.assign(A,{
 weekOpen(){weekSheet(false)},
 weekRedo(){S.plan=null;weekSheet(true)},
 agendaTap(el){const d=+el.dataset.v,cur=agenda()[d]||'quotidien';agenda()[d]=OCC_CYCLE[(OCC_CYCLE.indexOf(cur)+1)%OCC_CYCLE.length];S.plan=null;save();weekSheet(true)},
});

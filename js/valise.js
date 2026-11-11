// Dress Up — Lot 3 : valise selon la météo de la destination
"use strict";

let TRIPD=null; // brouillon du formulaire
const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return todayKey(d)};
const addDays=(k,n)=>{const d=new Date(k+'T12:00');d.setDate(d.getDate()+n);return todayKey(d)};

function tripSheet(){
 const t=S.trip;
 if(t&&!TRIPD){
  const done=t.list.filter(x=>x.ok).length;
  sheet(`<h2 style="margin-top:0">Valise : ${esc(t.dest)}</h2>
  <p class="tiny">${new Date(t.start+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} · ${t.days} jour${t.days>1?'s':''} · ${esc(t.wx)}</p>
  <div class="bar"><i style="width:${t.list.length?done/t.list.length*100:0}%"></i></div><p class="tiny">${done}/${t.list.length} dans la valise</p>
  ${t.list.map((x,k)=>{const i=x.id&&item(x.id);return `<label class="chk"><input type="checkbox" data-trip="${k}" ${x.ok?'checked':''}>${i?thumb(i,'ph mini'):''}<span>${esc(i?i.name:x.label)}${i&&i.state==='sale'?' <span class="tiny" style="color:var(--clay)">à laver avant</span>':''}${i&&stored(i)?' <span class="tiny">(rangé)</span>':''}</span></label>`}).join('')}
  <p class="tiny" style="margin-top:10px">${esc(t.tip)}</p>
  <div class="row"><button class="btn sm soft" data-a="tripNew">Nouvelle valise</button><button class="btn sm ghost" data-a="tripClear">Vider</button></div>`);
  return;
 }
 if(!TRIPD)TRIPD={dest:'',start:tomorrow(),days:3,occ:[],band:null,rain:false,needWx:false};
 const D=TRIPD;
 sheet(`<h2 style="margin-top:0">Préparer une valise</h2><p class="tiny">Le minimum qui se combine, selon la météo là-bas.</p>
 <p class="label">Destination</p><input type="search" id="tDest" value="${esc(D.dest)}" placeholder="ex. Marseille" autocomplete="off">
 <p class="label">Départ</p><input type="date" id="tStart" value="${D.start}" style="font:inherit;padding:10px 12px;border-radius:12px;border:1.5px solid var(--line);background:#fff">
 <p class="label">Durée</p><div class="stepper"><button data-a="tDays" data-d="-1">−</button><b>${D.days} jour${D.days>1?'s':''}</b><button data-a="tDays" data-d="1">+</button></div>
 <p class="label">Au programme</p><div class="chips">${['sport','soiree','boulot'].map(k=>`<button class="chip ${D.occ.includes(k)?'on':''}" data-a="tOcc" data-v="${k}">${OCCS[k]}</button>`).join('')}</div>
 ${D.needWx?`<p class="label">Quel temps là-bas ?</p><p class="tiny">${esc(D.needWx)}</p><div class="chips">${Object.entries(BANDS).map(([k,b])=>`<button class="chip ${D.band===k?'on':''}" data-a="tBand" data-v="${k}">${b.l} <span class="tiny">${b.r}</span></button>`).join('')}<button class="chip ${D.rain?'on':''}" data-a="tRain">☂ Pluie</button></div>`:''}
 <div class="spacer"></div><button class="btn block" data-a="tripGo">Préparer la liste</button>`);
}
const keepTrip=()=>{if(!TRIPD)return;const d=$('#tDest'),s=$('#tStart');if(d)TRIPD.dest=d.value.trim();if(s&&s.value)TRIPD.start=s.value};

async function tripWeather(D){
 // météo jour par jour (Open-Meteo prévoit jusqu'à 16 jours)
 const ahead=daysSince(D.start)*-1;
 if(ahead+D.days>16)throw new Error('loin');
 const g=await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(D.dest)}&count=1&language=fr&format=json`)).json();
 const c=g.results&&g.results[0];if(!c)throw new Error('ville');
 const end=addDays(D.start,D.days-1);
 const j=await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.latitude.toFixed(2)}&longitude=${c.longitude.toFixed(2)}&daily=apparent_temperature_max,apparent_temperature_min,precipitation_probability_max&timezone=auto&start_date=${D.start}&end_date=${end}`)).json();
 const d=j.daily;
 return{name:c.name,days:d.time.map((t,k)=>({feels:Math.round(d.apparent_temperature_max[k]*.6+d.apparent_temperature_min[k]*.4),rain:(d.precipitation_probability_max[k]||0)>=50}))};
}
function buildTrip(D,days,name){
 const bands=days.map(x=>bandOf(x.feels)),order=['froid','frais','doux','chaud'];
 const cold=bands.reduce((a,b)=>order.indexOf(b)<order.indexOf(a)?b:a,'chaud'),warm=bands.reduce((a,b)=>order.indexOf(b)>order.indexOf(a)?b:a,'froid');
 const rain=days.some(x=>x.rain),n=D.days;
 const pool=active().filter(i=>!outOfCircuit(i)&&!paused(i)&&i.state!=='reparer');
 const neutral=['noir','blanc','gris','beige','marine'];
 const used=new Set();
 const pick=(cat,count,want,occ)=>{
  const list=pool.filter(i=>i.cat===cat&&!used.has(i.id)).map(i=>{
   let s=Math.random()*.5;s-=Math.abs((i.warmth||2)-want)*1.3;
   if(neutral.includes(i.color))s+=1;                         // se combine avec tout
   if(i.state==='sale')s-=2.5;
   if(occ)s+=occsOf(i).includes(occ)?4:-3;else if(!occsOf(i).includes('quotidien'))s-=2;
   if(rain&&i.waterproof)s+=3;
   if(i.season==='ete'&&(cold==='froid'||cold==='frais'))s-=2;if(i.season==='hiver'&&warm==='chaud')s-=2;
   return[s,i]}).sort((a,b)=>b[0]-a[0]).slice(0,count).map(x=>x[1]);
  list.forEach(i=>used.add(i.id));return list};
 const wantTop=warm==='chaud'?1:cold==='froid'?2:1.5;
 const tops=Math.min(n>7?4:Math.ceil(n/2),Math.max(1,Math.ceil(n/2)));
 const bottoms=Math.min(n>7?3:2,Math.max(1,Math.ceil(n/4)));
 const its=[...pick('haut',tops,wantTop),...pick('bas',bottoms,cold==='froid'?3:2)];
 if(cold!=='chaud')its.push(...pick('pull',cold==='froid'||cold==='frais'?Math.min(2,Math.ceil(n/5)):1,cold==='froid'?3:2));
 if(cold==='froid'||cold==='frais'||rain)its.push(...pick('veste',1,cold==='froid'?3:2));
 its.push(...pick('chaussures',1,2));
 if(D.occ.includes('soiree')){const r=pick('robe',1,2,'soiree');its.push(...(r.length?r:pick('haut',1,2,'soiree')))}
 if(D.occ.includes('boulot'))its.push(...pick('haut',1,2,'boulot'),...pick('chaussures',1,2,'boulot'));
 if(D.occ.includes('sport'))its.push(...pick('haut',1,1,'sport'),...pick('bas',1,2,'sport'),...pick('chaussures',1,2,'sport'));
 const extra=['Sous-vêtements et chaussettes ('+n+')','Trousse de toilette'];
 if(rain)extra.push('Parapluie');
 const wx=`${BANDS[cold].l}${cold!==warm?' à '+BANDS[warm].l.toLowerCase():''}${rain?', pluie possible':''}`;
 const tip=n>7?'Plus d’une semaine : prévois une petite lessive sur place plutôt que de tout emporter.':'Peu de pièces, qui vont toutes ensemble : chaque haut se porte avec chaque bas.';
 S.trip={dest:name,start:D.start,days:n,wx,tip,list:[...its.map(i=>({id:i.id,ok:false})),...extra.map(l=>({label:l,ok:false}))]};
 TRIPD=null;save();tripSheet();
}
Object.assign(A,{
 tripOpen(){TRIPD=null;tripSheet()},
 tripNew(){TRIPD={dest:'',start:tomorrow(),days:3,occ:[],band:null,rain:false,needWx:false};tripSheet()},
 tripClear(){S.trip=null;TRIPD=null;save();tripSheet()},
 tDays(el){keepTrip();TRIPD.days=Math.max(1,Math.min(21,TRIPD.days+(+el.dataset.d)));tripSheet()},
 tOcc(el){keepTrip();const s=new Set(TRIPD.occ);s.has(el.dataset.v)?s.delete(el.dataset.v):s.add(el.dataset.v);TRIPD.occ=[...s];tripSheet()},
 tBand(el){keepTrip();TRIPD.band=el.dataset.v;tripSheet()},
 tRain(){keepTrip();TRIPD.rain=!TRIPD.rain;tripSheet()},
 async tripGo(){
  keepTrip();const D=TRIPD;if(!D.dest){toast('Où vas-tu ?');return}
  if(D.needWx){if(!D.band){toast('Choisis le temps là-bas');return}
   buildTrip(D,Array.from({length:D.days},()=>({feels:BANDS[D.band].f,rain:D.rain})),D.dest);return}
  toast('Météo de '+D.dest+'…');
  try{const r=await tripWeather(D);buildTrip(D,r.days,r.name)}
  catch(e){D.needWx=e.message==='loin'?'Trop loin pour les prévisions (16 jours max) : dis-moi à quoi t’attendre.':e.message==='ville'?'Ville introuvable : choisis le temps à la main.':'Météo indisponible ici : choisis le temps à la main.';tripSheet()}
 },
});
document.addEventListener('change',e=>{
 const k=e.target.dataset&&e.target.dataset.trip;if(k===undefined||!S.trip)return;
 S.trip.list[+k].ok=e.target.checked;save();
});

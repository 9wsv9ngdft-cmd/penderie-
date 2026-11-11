// Dress Up — Météo, proposition de tenues, porter / laver
"use strict";
/* ---------- météo ---------- */
let WX_LOADING=false,WX_FAIL=false;
function effWeather(){const t=todayKey();
 if(S.manual&&S.manual.date===t)return{band:S.manual.band,rain:S.manual.rain,feels:BANDS[S.manual.band].f,src:'manual'};
 if(S.wx&&S.wx.date===t)return{...S.wx,band:bandOf(S.wx.feels),src:'auto'};
 return null}
async function loadWeather(){
 if(!S.city||WX_LOADING)return;WX_LOADING=true;
 try{
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${S.city.lat}&longitude=${S.city.lon}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=1`;
  const j=await (await fetch(u)).json();const d=j.daily;
  const code=d.weather_code[0],rainP=d.precipitation_probability_max[0]??0;
  const feels=Math.round(d.apparent_temperature_max[0]*0.6+d.apparent_temperature_min[0]*0.4);
  S.wx={date:todayKey(),tmin:Math.round(d.temperature_2m_min[0]),tmax:Math.round(d.temperature_2m_max[0]),feels,rainP,code,rain:rainP>=50||(code>=51&&code<=67)||(code>=80&&code<=82)||code>=95};
  WX_FAIL=false;OUTS=null;save();
 }catch(e){WX_FAIL=true}
 WX_LOADING=false;if(VIEW==='matin')render();
}
async function setCity(name){
 if(!name.trim())return;
 try{const j=await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=fr&format=json`)).json();
  const c=j.results&&j.results[0];if(!c){toast('Ville introuvable');return}
  // coordonnées arrondies (~1 km) : suffisant pour la météo, plus discret
  S.city={name:c.name,lat:+c.latitude.toFixed(2),lon:+c.longitude.toFixed(2)};S.wx=null;save();toast('Ville enregistrée : '+c.name);loadWeather();
 }catch(e){WX_FAIL=true;toast('Météo auto indisponible ici — choisis à la main.');render()}
}

/* ---------- proposition de tenues ---------- */
let OUTS=null;
function genOutfits(w){
 const avail=inUse().filter(i=>i.state==='propre'||i.state==='porte');
 const by=c=>avail.filter(i=>i.cat===c);
 const b=w.band,rain=!!w.rain,used=new Map(),occ=todayOcc(),mood=todayMood();
 const pick=(c,want)=>{let list=by(c);if(!list.length)return null;
  if(occ==='sport'){const t=list.filter(i=>occsOf(i).includes('sport'));if(t.length)list=t}
  const pin=list.find(i=>S.pins.includes(i.id));if(pin)return pin;
  let best=null,bs=-1e9;
  for(const i of list){
   let s=Math.random()*1.6;
   if(i.state==='porte')s+=1.5;                 // reporter avant de laver = moins de lessives
   if(i.boost)s+=4;                             // vêtement à remettre en avant
   const d=daysSince(i.lastWorn);
   if(d===null||d>45)s+=1.2;                    // faire vivre les oubliés
   if(d!==null&&d<2&&i.state!=='porte')s-=1;
   s-=Math.abs((i.warmth||2)-want)*1.3;
   if(rain&&i.waterproof&&(c==='veste'||c==='chaussures'))s+=3;
   s+=occScore(i,occ);                          // boulot, sport, soirée…
   s+=moodScore(i,mood,occ);                    // décontracté, chic, cosy…
   s-=(used.get(i.id)||0)*1.2;                  // varier les candidates
   if(s>bs){bs=s;best=i}}
  return best?{i:best,s:bs}:null};
 // on fabrique une douzaine de tenues candidates, puis on garde les meilleures (harmonie comprise)
 const cands=[],robes=by('robe');
 for(let k=0;k<12;k++){
  const o=[];
  const useRobe=robes.length&&(b==='chaud'||b==='doux'||occ==='soiree')&&(k%3===1||!by('bas').length);
  if(useRobe)o.push(pick('robe',b==='chaud'?1:2));
  else{o.push(pick('haut',b==='chaud'?1:b==='froid'?2:1.5));o.push(pick('bas',b==='chaud'?1:b==='froid'?3:2))}
  if(b==='frais'||b==='froid'||(b==='doux'&&(w.feels||18)<18)||(mood==='cosy'&&b!=='chaud'))o.push(pick('pull',b==='froid'?3:b==='doux'?1:2));
  if(b==='frais'||b==='froid'||rain||(occ==='soiree'&&b!=='chaud'))o.push(pick('veste',b==='froid'?3:b==='frais'?2:1));
  o.push(pick('chaussures',2));
  const got=o.filter(Boolean);if(!got.length)continue;
  got.forEach(x=>used.set(x.i.id,(used.get(x.i.id)||0)+1));
  const items=got.map(x=>x.i),h=harmony(items,mood);
  cands.push({ids:items.map(i=>i.id),score:got.reduce((a,x)=>a+x.s,0)/got.length*3+h.s*1.5});
 }
 cands.sort((x,y)=>y.score-x.score);
 const seen=new Set(),outs=[];
 for(const c of cands){const key=[...c.ids].sort().join();if(seen.has(key))continue;
  // éviter trois tenues presque identiques : au moins 2 pièces différentes
  if(outs.some(o=>c.ids.filter(id=>o.includes(id)).length>c.ids.length-2))continue;
  seen.add(key);outs.push(c.ids);if(outs.length===3)break}
 // petite penderie : on complète sans la contrainte de diversité
 for(const c of cands){if(outs.length>=3)break;const key=[...c.ids].sort().join();if(!seen.has(key)){seen.add(key);outs.push(c.ids)}}
 if(outs[0])outs[0].perfect=true;
 // de temps en temps, une tenue favorite revient parmi les idées
 const fc=favCandidates(avail,w,occ);
 if(fc.length&&Math.random()<.5){const f=fc[Math.floor(Math.random()*fc.length)],a=[...f.ids];a.fav=true;outs.splice(1,0,a);outs.length=Math.min(outs.length,3)}
 return outs;
}

/* ---------- porter / laver ---------- */
function wear(ids){
 const t=todayKey();
 S.undo={date:t,prev:ids.map(id=>JSON.parse(JSON.stringify(item(id)))),pins:[...S.pins]};
 ids.forEach(id=>{const i=item(id);i.wears=(i.wears||0)+1;i.sinceWash=(i.sinceWash||0)+1;i.lastWorn=t;i.boost=false;
  const m=maxOf(i);i.state=m===0?'propre':(i.sinceWash>=m?'sale':'porte')});
 S.log=S.log.filter(l=>l.date!==t);S.log.push({date:t,ids,occ:todayOcc()});S.pins=[];OUTS=null;
 if(typeof onWear==='function')onWear(ids);
 save();
}
function undoToday(){
 const t=todayKey();if(!S.undo||S.undo.date!==t)return;
 S.undo.prev.forEach(p=>{const k=S.items.findIndex(i=>i.id===p.id);if(k>=0)S.items[k]=p});
 S.pins=S.undo.pins||[];if(S.undo.under)S.under=S.undo.under;S.log=S.log.filter(l=>l.date!==t);S.undo=null;OUTS=null;save();
}

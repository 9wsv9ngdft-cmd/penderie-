// Dress Up — Tenue parfaite : humeur, styles, harmonie des couleurs, photo miroir, lookbook
"use strict";

/* ---------- humeur et styles ---------- */
const MOODS={decontracte:'Décontracté',chic:'Chic',cosy:'Cosy',couleur:'Envie de couleur',discret:'Discret'};
const STYLES={casual:'Casual',chic:'Chic',sport:'Sport',cosy:'Cosy'};
const NEUTRES=['noir','blanc','gris','beige','marine','marron','kaki',''];
// style déduit du nom quand il n'a pas été choisi
function styleGuess(i){
 const n=(i.name||'').toLowerCase();
 if(/jogging|legging|brassi|sport|running/.test(n)||(i.occ||[]).includes('sport'))return['sport'];
 if(/chemise|blazer|tailleur|escarpin|derb|ville|mocassin|robe|blouse|costume|smoking/.test(n)||(i.occ||[]).includes('soiree'))return['chic'];
 if(/gilet|cachemire|laine|maille|col roul/.test(n))return['cosy','chic']; // une belle maille s'habille
 if(/sweat|hoodie|polaire|plaid|doudoune/.test(n))return['cosy','casual'];
 return['casual'];
}
const styleOf=i=>i.style&&i.style.length?i.style:styleGuess(i);
const dayOverride=(k=todayKey())=>(S.dayPlan||{})[k]||null;
const todayMood=()=>S.moodDay&&S.moodDay.date===todayKey()?S.moodDay.v:(dayOverride()||{}).mood||null;
function moodScore(i,mood,occ){
 const st=styleOf(i);let s=0;
 const want={decontracte:['casual'],chic:['chic'],cosy:['cosy','casual']}[mood];
 if(want)s+=st.some(x=>want.includes(x))?2.5:(mood==='chic'?(st.includes('sport')?-3:st.includes('cosy')?-1.8:-1):-.8);
 if(occ==='soiree')s+=st.includes('chic')?2:st.includes('sport')?-3:st.includes('cosy')?-1.2:0;
 if(occ==='boulot'&&st.includes('sport'))s-=2;
 if(mood==='cosy')s+=(i.warmth||2)>=2?.8:0;
 if(mood==='couleur'&&!NEUTRES.includes(i.color)&&i.color!=='motif')s+=1.5;
 if(mood==='discret'&&(!NEUTRES.includes(i.color)))s-=2;
 return s;
}
// harmonie : neutres + une couleur forte au maximum, un seul motif, avec des nuances selon l'humeur
function harmony(items,mood){
 const cols=items.filter(i=>i.cat!=='chaussures').map(i=>i.color||'');
 const strong=[...new Set(cols.filter(c=>!NEUTRES.includes(c)&&c!=='motif'))],motifs=cols.filter(c=>c==='motif').length;
 let s=0,ph;
 if(strong.length>1)s-=2.5*(strong.length-1);
 if(motifs>1)s-=3;
 if(motifs===1&&strong.length)s-=1;
 // cohérence de style : pas de jogging avec un blazer et des derbies
 const sts=items.map(styleOf);const has=x=>sts.some(a=>a.includes(x)&&a.length===1);
 if(has('sport')&&has('chic'))s-=3.5;
 if(mood==='couleur')s+=strong.length===1?2:strong.length?0:-1.5;
 if(mood==='discret')s+=!strong.length&&!motifs?2:-2;
 const navy=cols.includes('marine'),beige=cols.includes('beige');
 if(navy&&beige)s+=1;                                 // classique qui marche toujours
 if(cols.includes('noir')&&navy)s-=.5;
 if(motifs===1&&!strong.length)ph='un motif avec des unis';
 else if(strong.length===1)ph=`le ${strong[0]} réveille les neutres`;
 else if(!strong.length&&navy&&beige)ph='marine et beige, un classique';
 else if(!strong.length)ph='tout en neutres, facile à porter';
 else ph='des couleurs qui osent';
 return{s,ph};
}
// après un choix, on montre la tenue proposée (petit rebond pour qu'on voie qu'elle a changé)
function showOutfit(){const c=document.querySelector('.ocard');if(!c)return;const r=c.getBoundingClientRect();if(r.top>innerHeight*.55)scrollBy({top:r.top-innerHeight*.35,behavior:'smooth'});c.classList.add('fresh')}
const moodChips=()=>{const m=todayMood();return `<div class="chips scroll" style="margin-bottom:12px">${Object.entries(MOODS).map(([k,l])=>`<button class="chip ${m===k?'on':''}" data-a="setMood" data-v="${k}">${l}</button>`).join('')}</div>`};
function perfectWhy(o,w){
 const its=o.map(item).filter(Boolean),occ=todayOcc(),m=todayMood();
 return [`${w.feels??BANDS[w.band].f}°${w.rain?' et pluie':''}`,occ!=='quotidien'?OCCS[occ].toLowerCase():'',m?MOODS[m].toLowerCase():'',harmony(its,m).ph].filter(Boolean).join(' · ');
}

/* ---------- photo miroir et lookbook ---------- */
const lookPhotos=new Map(); // lookId -> photo
const looks=()=>S.looks||(S.looks=[]);
const lookFor=ids=>{const k=favKey(ids);return [...looks()].reverse().find(l=>favKey(l.ids)===k&&lookPhotos.get(l.id))||null};
let LOOKSHOW=new Set();
function lookToggle(ids){const l=lookFor(ids);if(!l)return'';const k=favKey(ids),on=LOOKSHOW.has(k);
 return `<button class="btn sm ghost" style="margin:0 0 10px" data-a="lookShow" data-k="${esc(k)}">${on?'Masquer':'📸 Voir portée'}</button>${on?`<div class="look" style="background-image:url('${U(lookPhotos.get(l.id))}')"></div>`:''}`}
function lookbookSheet(){
 const ls=[...looks()].reverse().filter(l=>lookPhotos.get(l.id));
 sheet(`<h2 style="margin-top:0">📸 Lookbook</h2>${ls.length?'':'<p class="muted">Pas encore de photo. Après avoir enregistré ta tenue du jour, touche « 📸 Photo miroir ».</p>'}
 <div class="grid">${ls.map(l=>`<div><div class="look" style="background-image:url('${U(lookPhotos.get(l.id))}');margin:0"></div><p class="tiny" style="margin:4px 2px 0">${new Date(l.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}${isFav(l.ids)?' · ♥':''}</p>
  <button class="btn sm ghost" style="margin-top:4px" data-a="lookDel" data-id="${l.id}">Supprimer</button></div>`).join('')}</div>`);
}
async function saveLook(file){
 const l=S.log.find(x=>x.date===todayKey());if(!l){toast('Enregistre d’abord ta tenue du jour');return}
 const {canvas}=await (async()=>{const img=new Image(),url=URL.createObjectURL(file);await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src=url});
  const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);return{canvas:c}})();
 const p=canvas.toDataURL('image/jpeg',.75),old=looks().find(x=>x.date===todayKey());
 const id=old?old.id:uid();if(!old)looks().push({id,date:todayKey(),ids:[...l.ids]});
 lookPhotos.set(id,p);DB.set('look:'+id,p);save();LOOKSHOW.add(favKey(l.ids));render();
 toast(isFav(l.ids)?'Photo enregistrée 📸':'Photo enregistrée 📸 Tu l’ajoutes aux favorites ?');
}

/* ---------- exceptions datées (Ma semaine) ---------- */
function dayEditSheet(date){
 const o=dayOverride(date)||{},d=new Date(date+'T12:00');
 sheet(`<h2 style="margin-top:0">${d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</h2><p class="tiny">Ce jour-là seulement, à la place de ta semaine type.</p>
 <p class="label">Pour quoi ?</p><div class="chips">${Object.entries(OCCS).map(([k,l])=>`<button class="chip ${o.occ===k?'on':''}" data-a="dayOcc" data-d="${date}" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Humeur</p><div class="chips">${Object.entries(MOODS).map(([k,l])=>`<button class="chip ${o.mood===k?'on':''}" data-a="dayMood" data-d="${date}" data-v="${k}">${l}</button>`).join('')}</div>
 <div class="spacer"></div><div class="row"><button class="btn" data-a="dayOk">Valider</button>${dayOverride(date)?`<button class="btn ghost" data-a="dayClear" data-d="${date}">Revenir à la semaine type</button>`:''}</div>`);
}
// la veille d'un jour prévu : prévenir si un vêtement de la tenue est au sale
function eveNotice(){
 const t=now();t.setDate(t.getDate()+1);const k=todayKey(t);
 const d=S.plan&&S.plan.days.find(x=>x.date===k);if(!d)return'';
 const dirty=d.ids.map(item).filter(i=>i&&i.state==='sale');const ov=dayOverride(k);
 if(!dirty.length)return'';
 return `<div class="notice">Demain${ov?` : ${OCCS[ov.occ||'quotidien'].toLowerCase()}${ov.mood?', '+MOODS[ov.mood].toLowerCase():''}`:''}. ${dirty.map(i=>`<b>${esc(i.name)}</b>`).join(', ')} ${dirty.length>1?'sont':'est'} au sale : une machine ce soir ?</div>`;
}

Object.assign(A,{
 setMood(el){const v=el.dataset.v;S.moodDay={date:todayKey(),v:todayMood()===v?null:v};OUTS=null;save();render();showOutfit()},
 drStyle(el){const v=el.dataset.v;const s=new Set(DR.style&&DR.style.length?DR.style:styleGuess(DR));s.has(v)?s.delete(v):s.add(v);DR.style=[...s];
  el.parentElement.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',DR.style.includes(c.dataset.v)))},
 lookShow(el){const k=el.dataset.k;LOOKSHOW.has(k)?LOOKSHOW.delete(k):LOOKSHOW.add(k);render()},
 lookbookOpen:lookbookSheet,
 lookDel(el){const id=el.dataset.id;S.looks=looks().filter(l=>l.id!==id);lookPhotos.delete(id);DB.del('look:'+id);save();lookbookSheet();render()},
 dayEdit(el){dayEditSheet(el.dataset.d)},
 dayOcc(el){const dp=S.dayPlan||(S.dayPlan={});dp[el.dataset.d]={...(dp[el.dataset.d]||{}),occ:el.dataset.v};save();dayEditSheet(el.dataset.d)},
 dayMood(el){const dp=S.dayPlan||(S.dayPlan={});const cur=dp[el.dataset.d]||{};dp[el.dataset.d]={...cur,mood:cur.mood===el.dataset.v?null:el.dataset.v};save();dayEditSheet(el.dataset.d)},
 dayClear(el){delete (S.dayPlan||{})[el.dataset.d];S.plan=null;save();weekSheet(true)},
 dayOk(){S.plan=null;OUTS=null;save();weekSheet(true)},
});
document.addEventListener('change',e=>{if(e.target.id==='mirrorPic'&&e.target.files[0])saveLook(e.target.files[0]).catch(()=>toast('Photo illisible'))});

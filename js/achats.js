// Dress Up — Lot 2 : liste d'envies, défis, tenues favorites, occasions
"use strict";

/* ---------- occasions ---------- */
const OCCS={quotidien:'Quotidien',boulot:'Boulot',sport:'Sport',soiree:'Soirée'};
const occsOf=i=>(i.occ&&i.occ.length)?i.occ:['quotidien'];
const todayOcc=()=>S.occDay&&S.occDay.date===todayKey()?S.occDay.v:((typeof dayOverride==='function'&&dayOverride()||{}).occ||(typeof agenda==='function'&&agenda()[new Date().getDay()])||'quotidien');
// bonus si le vêtement va avec l'occasion du jour, malus s'il est réservé à une autre
const occScore=(i,occ)=>occsOf(i).includes(occ)?(occ==='quotidien'?0:3.5):-3.5;
const occChips=()=>`<div class="chips scroll" style="margin-bottom:12px">${Object.entries(OCCS).map(([k,l])=>`<button class="chip ${todayOcc()===k?'on':''}" data-a="setOcc" data-v="${k}">${l}</button>`).join('')}</div>`;

/* ---------- tenues favorites ---------- */
const favKey=ids=>[...ids].sort().join(',');
const favs=()=>S.favs||(S.favs=[]);
const isFav=ids=>favs().some(f=>favKey(f.ids)===favKey(ids));
function favCandidates(avail,w,occ){
 const ok=new Set(avail.map(i=>i.id));
 return favs().filter(f=>{
  if(!f.ids.every(id=>ok.has(id)))return false;
  if((f.occ||'quotidien')!==occ)return false;
  if(f.last&&daysSince(f.last)<7)return false;
  const its=f.ids.map(item),cats=its.map(i=>i.cat);
  if(w.band==='chaud'&&its.some(i=>(i.cat==='pull'||i.cat==='veste')&&i.warmth>=2))return false;
  if((w.band==='froid'||w.band==='frais')&&!cats.includes('pull')&&!cats.includes('veste'))return false;
  return true});
}
function favsSheet(){
 const today=S.log.some(l=>l.date===todayKey());
 sheet(`<h2 style="margin-top:0">Tenues favorites</h2>${favs().length?'':'<p class="muted">Aucune pour l’instant. Le matin, touche ♥ sur la tenue du jour pour la garder.</p>'}
 ${favs().map(f=>{const its=f.ids.map(item).filter(Boolean);const ko=its.filter(i=>i.removed||stored(i)||!(i.state==='propre'||i.state==='porte'));
  return `<div class="card outfit"><div class="strip">${its.map(i=>thumb(i)).join('')}</div><p class="tiny">${esc(its.map(i=>i.name).join(' · '))}${f.occ&&f.occ!=='quotidien'?' · '+OCCS[f.occ].toLowerCase():''}</p>
  ${ko.length?`<p class="tiny">Indisponible : ${esc(ko.map(i=>i.name).join(', '))}</p>`:''}
  <div class="row">${!ko.length&&!today?`<button class="btn sm" data-a="wearFav" data-id="${f.id}">Je porte ça</button>`:''}<button class="btn sm ghost" data-a="favDel" data-id="${f.id}">Retirer</button></div></div>`}).join('')}`);
}

/* ---------- liste d'envies ---------- */
const WISH_DAYS=5;
const wishes=()=>S.wishes||(S.wishes=[]);
const wishDue=w=>!w.decided&&daysSince(w.from||w.added)>=WISH_DAYS;
const wishLeft=w=>Math.max(0,WISH_DAYS-daysSince(w.from||w.added));
function similar(w){
 const same=active().filter(i=>i.cat===w.cat);
 return{all:same,col:same.filter(i=>i.color===w.color)};
}
function wishThumb(w,cls='ph',st=''){const p=photos.get(w.id);return p?`<div class="${cls}" style="background-image:url('${p}');${st}"></div>`:`<div class="${cls} sw" style="background:${colorVal(w.color)};${st}"><span>${esc(cat(w.cat).label)}</span></div>`}
function wishCard(w){
 const s=similar(w),due=wishDue(w),lbl=cat(w.cat).label.toLowerCase();
 return `<div class="card"><div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px">${wishThumb(w,'ph mini','width:74px')}
 <div style="flex:1;min-width:0"><b>${esc(w.name)}</b>${w.price>0?` · ${eur(w.price)}`:''}<br>
 <span class="tiny">${due?'<b style="color:var(--clay)">À décider</b>':`En réflexion : encore ${wishLeft(w)} jour${wishLeft(w)>1?'s':''}`}</span>
 ${w.ref&&/^https?:\/\//i.test(w.ref)?`<br><a class="tiny" href="${esc(w.ref)}" target="_blank" rel="noopener">Voir le produit</a>`:''}</div></div>
 ${s.all.length?`<p class="tiny" style="margin:10px 0 6px">Tu as déjà <b>${s.all.length} ${lbl}${s.all.length>1&&!/s$/.test(lbl)?'s':''}</b>${s.col.length?`, dont ${s.col.length} ${esc(w.color)}`:''} :</p><div class="hlist">${s.all.slice(0,8).map(i=>`<button class="it" style="width:70px" data-a="open" data-id="${i.id}">${thumb(i)}</button>`).join('')}</div>`:`<p class="tiny" style="margin-top:10px">Tu n’as rien de ce type dans ta penderie.</p>`}
 ${/mariage|soir[ée]e|c[ée]r[ée]monie|costume|smoking|gala/i.test(w.name)||(w.cat==='robe'&&w.price>=80)?`<p class="tiny" style="margin-top:10px">💡 Pour une occasion ponctuelle, et si tu la louais ou l’empruntais ? Les sites de location de vêtements et tes proches peuvent dépanner.</p>`:''}
 ${due?`<div class="row" style="margin-top:12px"><button class="btn sm" data-a="wishBuy" data-id="${w.id}">Je l’achète</button><button class="btn sm soft" data-a="wishDrop" data-id="${w.id}">J’y renonce</button><button class="btn sm ghost" data-a="wishSnooze" data-id="${w.id}">Encore ${WISH_DAYS} jours</button></div>`
 :`<div class="row" style="margin-top:10px"><button class="btn sm ghost" data-a="wishDrop" data-id="${w.id}">J’y renonce déjà</button></div>`}</div>`;
}
let WD=null;
function wishSheet(){
 if(!WD)WD={name:'',cat:'haut',color:'noir',price:null,ref:'',photo:null};
 sheet(`<h2 style="margin-top:0">Noter une envie</h2><p class="tiny">Tu la retrouveras dans ${WISH_DAYS} jours. Souvent, l’envie passe toute seule.</p>
 <label class="photo-drop" style="padding:10px">${WD.photo?`<div class="ph" style="background-image:url('${WD.photo}');max-width:140px"></div>`:''}<input type="file" accept="image/*" id="wpic"><span class="btn sm soft" style="margin-top:${WD.photo?8:0}px">${WD.photo?'Changer l’image':'Ajouter une image (facultatif)'}</span></label>
 <p class="label">Quoi ?</p><input type="text" id="wnm" value="${esc(WD.name)}" placeholder="ex. Pull en laine vert" autocomplete="off">
 <p class="label">Catégorie</p><div class="chips">${CATS.map(c=>`<button class="chip ${WD.cat===c.id?'on':''}" data-a="wd" data-k="cat" data-v="${c.id}">${c.label}</button>`).join('')}</div>
 <p class="label">Couleur</p><div class="chips">${COLORS.map(([n,v])=>`<button class="chip ${WD.color===n?'on':''}" data-a="wd" data-k="color" data-v="${n}"><span class="dot" style="background:${v}"></span>${n}</button>`).join('')}</div>
 <p class="label">Prix</p><div class="row" style="flex-wrap:nowrap"><input type="text" inputmode="decimal" id="wpr" value="${WD.price>0?String(WD.price).replace('.',','):''}" placeholder="ex. 49" style="max-width:140px"><span class="muted">€</span></div>
 <p class="label">Lien <span style="text-transform:none;font-weight:400">(facultatif)</span></p><input type="text" id="wref" value="${esc(WD.ref)}" placeholder="lien du produit" autocomplete="off">
 <div class="spacer"></div><button class="btn block" data-a="wishSave">Noter</button>`);
}
const keepWish=()=>{if(!WD)return;const n=$('#wnm'),p=$('#wpr'),r=$('#wref');if(n)WD.name=n.value;if(p)WD.price=parsePrice(p.value);if(r)WD.ref=r.value.trim()};
function wishNotice(){const n=wishes().filter(wishDue).length;return n?`<div class="notice">${n} envie${n>1?'s':''} attend${n>1?'ent':''} ta décision. <a href="#envies">Voir</a></div>`:''}

/* ---------- défis ---------- */
const chals=()=>S.chals||(S.chals=[]);
const activeChal=t=>chals().find(c=>c.type===t&&c.status==='encours');
const CHAL={nobuy:{t:'30 jours sans achat neuf',d:30,txt:'La seconde main reste permise.'},p333:{t:'Project 333',d:90,txt:'33 pièces (chaussures comprises) pendant 3 mois. Le reste est mis en pause.'}};
const newBuys=since=>S.items.filter(i=>i.boughtAt&&i.boughtAt>=since&&!['occasion','cadeau'].includes(originOf(i)));
const paused=i=>{const c=activeChal('p333');return!!c&&!c.items.includes(i.id)};
function refreshChals(){
 let ch=false;
 chals().filter(c=>c.status==='encours').forEach(c=>{
  if(c.type==='nobuy'){const b=newBuys(c.start);if(b.length){c.status='rate';c.end=b[0].boughtAt;ch=true}}
  if(c.status==='encours'&&daysSince(c.start)>=c.days){c.status='reussi';c.end=todayKey();ch=true}});
 if(ch)save();
}
function chalCards(){
 refreshChals();
 let h='';
 for(const t of ['nobuy','p333']){
  const c=activeChal(t),C=CHAL[t];
  if(c){const d=Math.min(c.days,daysSince(c.start)),np=t==='p333'?active().filter(i=>!c.items.includes(i.id)).length:0;
   h+=`<div class="card"><div class="row between"><h3 style="margin:0">${C.t}</h3><span class="tiny">jour ${d}/${c.days}</span></div><div class="bar"><i style="width:${d/c.days*100}%"></i></div>
   <p class="tiny">${t==='nobuy'?C.txt:`${c.items.length} pièces choisies, ${np} en pause.`}</p>
   <div class="row">${t==='p333'?`<button class="btn sm soft" data-a="p333Open">Voir mes pièces</button>`:''}<button class="btn sm ghost" data-a="chalStop" data-id="${c.id}">Abandonner</button></div></div>`}
  else h+=`<div class="card"><h3>${C.t}</h3><p class="tiny">${C.txt}</p><button class="btn sm" data-a="${t==='nobuy'?'chalStart':'p333Open'}" data-v="${t}">Relever le défi</button></div>`;
 }
 const done=chals().filter(c=>c.status!=='encours'&&c.status!=='abandon');
 if(done.length)h+=`<div class="card"><p class="label" style="margin-top:0">Historique</p>${done.map(c=>`<div class="row between tiny" style="padding:3px 0"><span>${CHAL[c.type].t} · ${new Date(c.start+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span><b>${c.status==='reussi'?'Réussi ✓':'Raté de peu'}</b></div>`).join('')}</div>`;
 return h;
}
let P333=null;
function p333Sheet(){
 const c=activeChal('p333');
 if(!P333)P333=new Set(c?c.items:inUse().slice().sort((a,b)=>(b.wears||0)-(a.wears||0)).slice(0,33).map(i=>i.id));
 const list=c?active():inUse();
 sheet(`<h2 style="margin-top:0">Project 333</h2><p class="tiny">${c?'Tes pièces du défi. Tu peux ajuster ta sélection.':'Choisis 33 pièces pour les 3 prochains mois. Je t’ai présélectionné les plus portées.'}</p>
 <p><b id="p333n">${P333.size}</b> / 33</p>
 <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:8px">${list.map(i=>`<button class="it" data-a="p333Tog" data-id="${i.id}" style="opacity:${P333.has(i.id)?1:.4}">${thumb(i)}<div class="nm" style="font-size:11.5px">${P333.has(i.id)?'✓ ':''}${esc(i.name)}</div></button>`).join('')}</div>
 <div class="spacer"></div><button class="btn block" data-a="p333Save">${c?'Enregistrer':'Démarrer le défi'}</button>`);
}

/* ---------- écran Envies ---------- */
function vEnvies(){
 const ws=wishes(),open=ws.filter(w=>!w.decided),due=open.filter(wishDue),wait=open.filter(w=>!wishDue(w));
 const dropped=ws.filter(w=>w.decided&&w.decided.choice==='renonce'),bought=ws.filter(w=>w.decided&&w.decided.choice==='achete');
 const saved=dropped.reduce((s,w)=>s+(w.price||0),0);
 let h=`<p class="eyebrow">Moins acheter</p><h1>Envies</h1>
 <p class="tiny" style="margin-top:-8px">Une envie d’achat ? Note-la et attends ${WISH_DAYS} jours avant de décider.</p>
 <button class="btn block" data-a="wishNew" style="margin:12px 0 4px">+ Noter une envie</button>`;
 if(dropped.length||bought.length)h+=`<div class="stats" style="margin-top:12px"><div class="stat"><b>${eur(saved)}</b><span>économisés (${dropped.length} envie${dropped.length>1?'s':''} passée${dropped.length>1?'s':''})</span></div><div class="stat"><b>${bought.length}</b><span>achat${bought.length>1?'s':''} réfléchi${bought.length>1?'s':''}</span></div></div>`;
 if(due.length)h+=`<h2>À décider</h2>`+due.map(wishCard).join('');
 if(wait.length)h+=`<h2>En réflexion</h2>`+wait.map(wishCard).join('');
 if(!open.length)h+=`<p class="muted" style="margin-top:16px">Aucune envie en cours.</p>`;
 h+=`<h2>Défis</h2>`+chalCards();
 return h;
}
VIEWS.envies=vEnvies;

/* ---------- actions du lot 2 ---------- */
Object.assign(A,{
 setOcc(el){S.occDay={date:todayKey(),v:el.dataset.v};OUTS=null;save();render()},
 favToggle(){const l=S.log.find(x=>x.date===todayKey());if(!l)return;
  if(isFav(l.ids)){S.favs=favs().filter(f=>favKey(f.ids)!==favKey(l.ids));toast('Retirée des favorites')}
  else{favs().push({id:uid(),ids:[...l.ids],occ:l.occ||'quotidien',added:todayKey(),last:todayKey()});toast('Tenue favorite ♥')}
  save();render()},
 favsOpen:favsSheet,
 favDel(el){S.favs=favs().filter(f=>f.id!==el.dataset.id);save();favsSheet()},
 wearFav(el){const f=favs().find(x=>x.id===el.dataset.id);if(!f)return;wear(f.ids);f.last=todayKey();save();closeSheet();location.hash='matin';render();toast('Tenue enregistrée 🌿')},
 drOcc(el){const v=el.dataset.v;const o=new Set(DR.occ&&DR.occ.length?DR.occ:['quotidien']);o.has(v)?o.delete(v):o.add(v);DR.occ=[...o];
  const cur=DR.occ.length?DR.occ:['quotidien'];el.parentElement.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',cur.includes(c.dataset.v)))},
 wishNew(){WD=null;wishSheet()},
 wd(el){keepWish();WD[el.dataset.k]=el.dataset.v;WD.touched={...(WD.touched||{}),[el.dataset.k]:1};wishSheet()},
 wishSave(){keepWish();if(!WD.name.trim())WD.name=`${cat(WD.cat).label} ${WD.color}`;
  const id=uid(),{photo,touched,...w}=WD;wishes().push({...w,id,added:todayKey(),decided:null});
  if(photo){photos.set(id,photo);DB.set('photo:'+id,photo)}
  WD=null;save();closeSheet();render();toast(`Noté. Rendez-vous dans ${WISH_DAYS} jours`)},
 wishDrop(el){const w=wishes().find(x=>x.id===el.dataset.id);w.decided={date:todayKey(),choice:'renonce'};save();render();toast(w.price>0?`${eur(w.price)} économisés 🌱`:'Envie passée 🌱')},
 wishSnooze(el){const w=wishes().find(x=>x.id===el.dataset.id);w.from=todayKey();save();render()},
 wishBuy(el){const w=wishes().find(x=>x.id===el.dataset.id);
  const nb=activeChal('nobuy');
  EDIT=null;DR={...newDraft(),name:w.name,cat:w.cat,color:w.color,price:w.price,ref:w.ref||'',photo:photos.get(w.id)||null,boughtAt:todayKey(),fromWish:w.id};
  location.hash='ajout';if(VIEW==='ajout')render();
  toast(nb?'Attention : un achat neuf arrête ton défi « 30 jours sans achat neuf »':'Complète la fiche (provenance !) et enregistre')},
 chalStart(el){chals().push({id:uid(),type:el.dataset.v,start:todayKey(),days:CHAL[el.dataset.v].d,status:'encours'});save();render();toast('C’est parti !')},
 chalStop(el){const c=chals().find(x=>x.id===el.dataset.id);c.status='abandon';c.end=todayKey();OUTS=null;save();render()},
 p333Open(){P333=null;p333Sheet()},
 p333Tog(el){const id=el.dataset.id;if(P333.has(id))P333.delete(id);else if(P333.size<33)P333.add(id);else{toast('33 pièces maximum');return}
  el.style.opacity=P333.has(id)?1:.4;el.querySelector('.nm').textContent=(P333.has(id)?'✓ ':'')+item(id).name;$('#p333n').textContent=P333.size},
 p333Save(){const c=activeChal('p333');if(c)c.items=[...P333];else chals().push({id:uid(),type:'p333',start:todayKey(),days:90,status:'encours',items:[...P333]});
  P333=null;OUTS=null;save();closeSheet();render();toast(c?'Sélection enregistrée':'Défi lancé : 3 mois avec 33 pièces')},
});
document.addEventListener('change',async e=>{
 if(e.target.id!=='wpic'||!e.target.files[0])return;keepWish();
 try{const {canvas}=await compress(e.target.files[0]);WD.photo=canvas.toDataURL('image/jpeg',.72);if(!(WD.touched||{}).color)WD.color=detectColor(canvas);wishSheet()}catch(err){toast('Image illisible')}
});

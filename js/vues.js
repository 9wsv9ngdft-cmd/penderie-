// Dress Up — Écrans et fenêtres
"use strict";
/* ---------- vues ---------- */
let VIEW='matin',F={cat:'all',state:'all'},EDIT=null,DR=null,BATCH=null,OIDX=0;
const VIEWS={matin:vMatin,penderie:vPenderie,ajout:vAjout,bilan:vBilan};

function greet(){const h=new Date().getHours();return h<12?'Bonjour.':h<18?'Bon après-midi.':'Bonsoir.'}

function weatherCard(w){
 let h='<div class="card">';
 if(w){
  if(w.src==='auto'){
   h+=`<div class="wx"><div class="t">${w.tmax}°</div><div class="d"><b>${WMO(w.code)} · ${esc(S.city.name)}</b><span class="muted">min ${w.tmin}° · ressenti ~${w.feels}°</span><div style="margin-top:6px">${w.rain?`<span class="pill rain">Pluie ${w.rainP}%</span>`:`<span class="pill">${BANDS[w.band].l}</span>`}</div></div></div>`;
  }else{
   h+=`<div class="wx"><div class="t">${BANDS[w.band].r.replace(/[^0-9<≥–]/g,'')||'·'}°</div><div class="d"><b>${BANDS[w.band].l}${w.rain?' et pluvieux':''}</b><span class="muted">Météo choisie à la main</span></div></div>`;
  }
  if(w.src==='auto'&&w.hours&&w.hours.length)h+=`<div class="hours" role="list" aria-label="Météo heure par heure">${w.hours.map(x=>`<div role="listitem" class="${x.wet?'wet':''}"><span>${x.h} h</span>${icon(x.wet?'rain':x.cloud?'cloud':'sun')}${x.t}°<span class="sr">${x.wet?', pluie':''}</span></div>`).join('')}</div>`;
  h+=`<div class="spacer"></div><button class="btn sm ghost" data-a="wxManualOpen">Ajuster</button>`;
 }else{
  if(S.city&&!WX_FAIL){h+=`<p class="muted">Météo de ${esc(S.city.name)}…</p>`;loadWeather()}
  else{
   if(!S.city&&!IN_PREVIEW)h+=`<p><b>Ta ville</b> <span class="tiny">(une seule fois, pour la météo)</span></p><form class="row" data-f="city" style="flex-wrap:nowrap"><input type="search" name="city" placeholder="ex. Lyon" autocomplete="off"><button class="btn sm">OK</button></form><p class="tiny" style="margin-top:8px">Ou choisis à la main :</p>`;
   else h+=`<p><b>Quel temps fait-il ?</b>${IN_PREVIEW?' <span class="tiny">(météo auto désactivée dans l’aperçu)</span>':''}</p>`;
   h+=manualChips();
  }
 }
 return h+'</div>';
}
function manualChips(){
 const m=S.manual&&S.manual.date===todayKey()?S.manual:{};
 return `<div class="chips">${Object.entries(BANDS).map(([k,b])=>`<button class="chip ${m.band===k?'on':''}" data-a="wxBand" data-v="${k}">${b.l} <span class="tiny">${b.r}</span></button>`).join('')}<button class="chip ${m.rain?'on':''}" data-a="wxRain">☂ Pluie</button></div>`;
}

function yesterdayCard(){
 const last=[...S.log].reverse().find(l=>l.date<todayKey());
 if(!last||daysSince(last.date)>7)return'';
 const its=last.ids.map(item).filter(i=>i&&!i.removed&&maxOf(i)>0);
 if(!its.length)return'';
 const when=daysSince(last.date)===1?'Hier':'Le '+new Date(last.date+'T12:00').toLocaleDateString('fr-FR',{weekday:'long'});
 return `<h2>${when}, tu portais…</h2><div class="card">${its.map(i=>{
  const pinned=S.pins.includes(i.id),m=maxOf(i);
  let act;
  if(pinned)act=`<button class="btn sm soft" data-a="unpin" data-id="${i.id}">Prévu ✓</button>`;
  else if(i.state==='sale')act=`<button class="btn sm ghost" data-a="stillOk" data-id="${i.id}">Encore mettable</button>`;
  else act=`<button class="btn sm" data-a="pin" data-id="${i.id}">Je remets</button><button class="btn sm ghost" data-a="toWash" data-id="${i.id}">Au sale</button>`;
  return `<div class="yl">${thumb(i,'ph mini')}<div class="tx"><b>${esc(i.name)}</b><span class="tiny">${i.state==='sale'?'Parti au sale':`Porté ${i.sinceWash||0}/${m} avant lavage`}</span></div><div class="row" style="gap:6px;flex-wrap:nowrap">${act}</div></div>`}).join('')}</div>`;
}

function vMatin(){
 const d=now();
 let h=`<p class="eyebrow"><b style="color:var(--moss)">Dress Up</b> · ${d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</p><h1>${greet()}</h1>`;
 if(!active().length)return h+`<div class="card empty"><div class="serif">Ta penderie est vide</div><p class="muted">Commence par photographier quelques vêtements : un haut, un bas, des chaussures suffisent pour une première tenue.</p><a class="btn" href="#ajout">Ajouter un vêtement</a></div>`;
 const w=effWeather();
 h+=weatherCard(w);
 h+=safetyNotice()+seasonNotice()+laundryNotice()+eveNotice()+wishNotice()+circularNotice()+photoOfDay();
 const todayLog=S.log.find(l=>l.date===todayKey());
 if(todayLog){
  const its=todayLog.ids.map(item).filter(Boolean),act=active(),m=todayKey().slice(0,7),worn=act.filter(i=>i.lastWorn&&i.lastWorn.slice(0,7)===m).length;
  const next=its.filter(i=>totalWears(i)<30).sort((a,b)=>totalWears(b)-totalWears(a))[0];
  h+=`<section class="done"><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#CDE1BD"/><path d="M19 33l9 9 17-19" fill="none" stroke="#2E5A3A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <h2>C’est noté,<br>belle journée !</h2>
  <div class="strip">${its.map(i=>thumb(i)).join('')}</div>
  <p>${esc(its.map(i=>i.name).join(' · '))}</p>${lookToggle(todayLog.ids)}
  <div class="box"><p style="margin:0;color:#fff;font-weight:600">Ce mois-ci</p><p style="margin:2px 0 0;color:#fff"><b>${worn} / ${act.length}</b> pièces portées</p><div class="bar"><i style="width:${act.length?worn/act.length*100:0}%"></i></div></div>
  ${next?`<p>${esc(next.name)} : ${portsLabel(next)}. Encore ${30-totalWears(next)} pour l’objectif 30.</p>`:''}
  <div class="row"><label class="btn sm">Photo miroir<input type="file" accept="image/*" capture="environment" id="mirrorPic" class="sr"></label><button class="btn sm line" data-a="favToggle" aria-pressed="${isFav(todayLog.ids)}">${isFav(todayLog.ids)?'♥ Favorite':'♡ Tenue favorite'}</button><button class="btn sm line" data-a="undo">Changer</button></div></section>`;
  return h;
 }
 h+=yesterdayCard();
 if(!w)return h+`<p class="muted" style="margin-top:20px">Indique la météo pour recevoir des idées de tenues.</p>`;
 if(!OUTS){OUTS=genOutfits(w);const pt=plannedToday();if(pt)OUTS=[pt,...OUTS.filter(o=>favKey(o)!==favKey(pt))].slice(0,3);OIDX=0}
 if(!OUTS.length)return h+`<div class="card"><p>Rien de propre à proposer… C’est peut-être le jour de la lessive ?</p><a class="btn sm" href="#penderie">Voir la penderie</a></div>`;
 const tip={froid:'Superpose : trois couches fines tiennent plus chaud qu’une épaisse.',frais:'Prévois une couche que tu peux enlever à midi.',doux:'Une petite maille suffira.',chaud:'Matières légères et respirantes.'}[w.band];
 h+=`<div class="row between" style="margin-top:26px"><h2 style="margin:0">Idées du jour</h2><button class="btn sm ghost" data-a="weekOpen">Ma semaine</button></div><div class="spacer"></div>${occChips()}${moodChips()}`;
 // une tenue à la fois, comme une carte : ✕ passe à la suivante, « Je porte ça » l'enregistre
 OIDX=Math.min(OIDX,OUTS.length-1);const k=OIDX,o=OUTS[k],its=o.map(item).filter(Boolean),cats=its.map(i=>i.cat),miss=[];
 if(!cats.includes('robe')&&!cats.includes('bas'))miss.push('bas');
 if((w.band==='froid'||w.band==='frais')&&!cats.includes('pull'))miss.push('pull');
 const note=i=>i.state==='porte'?'déjà porté':i.boost?'mis en avant':i.lastWorn?(daysSince(i.lastWorn)>45?'à faire revivre':''):(daysSince(i.added)>=30?'jamais porté':'');
 const occ=todayOcc(),md=todayMood(),title=harmony(its,md).ph;
 const why=[`${w.feels??BANDS[w.band].f}°${w.rain?' et pluie':''}`,occ!=='quotidien'?OCCS[occ].toLowerCase():'',md?MOODS[md].toLowerCase():''].filter(Boolean).join(' · ');
 h+=`<div class="deck ${OUTS.length<2?'single':''}"><section class="ocard c${k%3}" aria-live="polite">
 <div class="top"><span class="tag">${o.plan?'Prévue dans ta semaine':o.fav?'♥ Une de tes favorites':o.perfect?'Tenue parfaite':'Idée '+(k+1)}</span><span>${k+1} / ${OUTS.length}</span></div>
 <h2>${esc(title[0].toUpperCase()+title.slice(1))}</h2><p class="why">${esc(why)}</p>
 <div class="pieces ${its.length>4?'many':''}">${its.map(i=>`<div class="piece">${thumb(i)}${esc(i.name)}${note(i)?`<small>${note(i)}</small>`:''}</div>`).join('')}</div>
 ${lookToggle(o)}${miss.length?`<p class="tiny">Pas de ${miss.join(' ni de ')} propre dispo.</p>`:''}</section></div>
 <div class="deck-actions">${OUTS.length>1?`<button class="round" data-a="nextOutfit" aria-label="Tenue suivante">${icon('x')}</button>`:''}<button class="btn big" data-a="wearOutfit" data-k="${k}">Je porte ça</button></div>
 <p class="tiny" style="text-align:center">${tip} On privilégie ce qui est déjà porté et ce que tu as un peu oublié.</p>
 <button class="btn soft block" data-a="reroll">Autres idées</button>`;
 return h;
}

function vPenderie(){
 const all=active(),nStored=all.filter(stored).length,act=F.stored?all.filter(stored):all.filter(i=>!stored(i));
 let list=act.filter(i=>(F.cat==='all'||i.cat===F.cat)&&(F.state==='all'||i.state===F.state));
 list.sort((a,b)=>(a.cat>b.cat?1:a.cat<b.cat?-1:0)||a.name.localeCompare(b.name));
 let h=`<p class="eyebrow">${all.length-nStored} pièce${all.length-nStored>1?'s':''} · mode ${SEASONS[curSeason()].toLowerCase()}</p><h1>Mon portant</h1><div class="row" style="margin:-4px 0 14px;flex-wrap:nowrap"><button class="btn" data-a="go" data-v="ajout" style="flex:1">＋ Ajouter des vêtements</button><button class="btn ghost" data-a="toolsOpen" aria-label="Outils de la penderie">Outils</button></div>`;
 const toCut=cutPending().length;
 h+=seasonNotice()+(toCut?`<button class="opt" data-a="cutNow" style="margin:0 0 12px">✂︎ <b>Détourer maintenant</b> <span class="tiny">${toCut} photo${toCut>1?'s':''} en attente</span></button>`:'')+laundryCard()+collectionBar()+(underLow()?`<div style="margin-bottom:12px">${underLine()}</div>`:'');
 h+=`<div class="chips scroll" role="group" aria-label="État">${[['all','Tout'],...Object.entries(STATES)].filter(([v])=>v==='all'||F.state===v||act.some(i=>i.state===v)).map(([v,l])=>`<button class="chip ${F.state===v?'on':''}" data-a="fState" data-v="${v}">${l}${v!=='all'?` · ${act.filter(i=>i.state===v).length}`:''}</button>`).join('')}${nStored||F.stored?`<button class="chip ${F.stored?'on':''}" data-a="fStored">Rangés · ${nStored}</button>`:''}</div>`;
 if(!list.length)h+=`<div class="empty"><p class="muted">${act.length?'Rien ici avec ce filtre.':'Aucun vêtement pour l’instant.'}</p></div>`;
 // un portant par catégorie : les vêtements pendent à leur cintre et défilent sur le côté
 else h+=CATS.map(c=>{const its=list.filter(i=>i.cat===c.id);if(!its.length)return'';
  return `<section class="rail"><div class="rail-head"><h2>${c.plural}</h2><span class="tiny">${its.length}</span></div><div class="rail-row">${its.map(hangCard).join('')}</div></section>`}).join('');
 return h;
}

// un vêtement sur son cintre, avec une petite étiquette quand il y a quelque chose à savoir
function hangCard(i){
 const d=daysSince(i.lastWorn),hold=i.sale?'En vente':i.loan?'Prêté':i.swap?'À échanger':null;
 const tag=hold?[hold,'']:i.state==='sale'?['au sale','sale']:i.state==='reparer'?['à réparer','reparer']:i.state==='porte'?['porté','']:(i.lastWorn?d>45:daysSince(i.added)>=30)?['à revivre','revive']:null;
 const c=cpp(i);
 return `<button class="hang ${i.state==='sale'||hold?'dim':''}" data-a="open" data-id="${i.id}">${HANGER}${tag?`<span class="tagx ${tag[1]}">${tag[0]}</span>`:''}${thumb(i)}<span class="nm">${esc(i.name)}</span><span class="mt">${stored(i)?'rangé · ':''}${portsLabel(i)}${c!==null&&totalWears(i)?' · '+eur(c):''}</span></button>`;
}
function newDraft(){return{name:'',cat:'haut',color:'noir',warmth:2,waterproof:false,origin:null,price:null,season:'toutes',wash:'',occ:[],state:'propre',max:null,photo:null}}
function vBatch(){
 const n=BATCH.items.length,wait=BATCH.items.filter(b=>b.pending).length;
 return `<p class="eyebrow">Vérifie et corrige</p><h1>${n} vêtement${n>1?'s':''}</h1>
 <p class="tiny" style="margin-top:-8px">${wait?`Reconnaissance en cours (${n-wait}/${n})… Tu peux déjà corriger ou tout ajouter : la suite se complète toute seule.`:S.ai?'J’ai deviné ce que j’ai pu. Touche un champ pour corriger.':'Choisis le type de chaque vêtement. La reconnaissance automatique s’active dans Réglages.'}</p>
 ${BATCH.items.map((b,k)=>`<div class="card row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px">${b.photo?`<div class="ph mini" role="img" aria-label="Photo ${k+1}" style="width:74px;background-image:url('${U(b.sq||b.photo)}')"></div>`:''}<div style="flex:1;min-width:0;display:grid;grid-template-columns:minmax(0,1fr);gap:6px">
  <input type="text" data-bi="${k}" data-bf="name" value="${esc(b.name)}" aria-label="Nom du vêtement ${k+1}">
  <div class="row" style="gap:6px;flex-wrap:nowrap"><select data-bi="${k}" data-bf="cat" aria-label="Catégorie">${CATS.map(c=>`<option value="${c.id}" ${b.cat===c.id?'selected':''}>${c.label}</option>`).join('')}</select>
  <select data-bi="${k}" data-bf="color" aria-label="Couleur">${COLORS.map(([c])=>`<option ${b.color===c?'selected':''}>${c}</option>`).join('')}</select></div>
  ${b.dup?`<div class="dup"><p><b>Déjà dans ta penderie ?</b> Ça ressemble à ${b.dup.id?`« ${esc(b.dup.name)} »`:esc(b.dup.name)}.</p><div class="dup-pair"><figure><img src="${U(b.photo)}" alt="Nouvelle photo"><figcaption>Nouvelle</figcaption></figure><figure>${b.dup.photo&&U(b.dup.photo)?`<img src="${U(b.dup.photo)}" alt="${esc(b.dup.name)}">`:'<div class="dup-none">photo détourée</div>'}<figcaption>${b.dup.id?'Dans ta penderie':'Déjà prise'}</figcaption></figure></div><div class="row" style="flex-wrap:nowrap"><button class="btn sm" style="flex:1" data-a="batchDrop" data-k="${k}">Retirer</button><button class="btn sm ghost" style="flex:1" data-a="dupBatchKeep" data-k="${k}">C’est un autre</button></div></div>`:''}
  ${b.pending?`<span class="tiny">Reconnaissance…</span>`:b.guessed||!S.ai?'':`<span class="tiny">Type non reconnu : à choisir</span>`}</div>
  <button class="btn sm ghost" data-a="batchDrop" data-k="${k}" aria-label="Retirer la photo ${k+1}">✕</button></div>`).join('')}
 <button class="btn block" data-a="batchSave">Tout ajouter (${n})</button><div class="spacer"></div>
 <div class="row"><button class="btn soft" style="flex:1" data-a="scanOpen">Encore des photos</button><button class="btn ghost" style="flex:1" data-a="batchCancel">Annuler</button></div>`;
}
// « Ajouter » sans rien en cours : la caméra s'ouvre d'elle-même ; si on la ferme, voici les autres façons d'ajouter
function vAjoutStart(){
 return `<p class="eyebrow">Nouveau vêtement</p><h1>Ajouter</h1>
 <button class="btn big block" data-a="scanOpen" style="margin-bottom:10px">📷 Prendre des photos</button>
 <label class="btn soft block" style="margin-bottom:10px">Choisir dans la galerie<input type="file" accept="image/*" multiple id="galStart" class="sr"></label>
 <div class="row" style="flex-wrap:nowrap"><button class="btn ghost" style="flex:1" data-a="manualAdd">Sans photo</button><button class="btn ghost" style="flex:1" data-a="invOpen">⚡ Inventaire express</button></div>
 <p class="tiny" style="margin-top:14px">Une photo ou plusieurs d’affilée : appuie sur OK quand tu as fini. La reconnaissance du type et le détourage se règlent dans <a href="#reglages">Réglages</a>${S.cut?' ; le fond est retiré plus tard, quand tu ne te sers pas de l’app':''}.</p>`;
}
function vAjout(){
 if(BATCH)return vBatch();
 if(!DR&&!EDIT)return vAjoutStart();
 if(!DR){const i=item(EDIT);DR={...i,photo:photos.get(i.id)||null}}
 const m=DR.max??cat(DR.cat).max;
 return `<p class="eyebrow">${EDIT?'Modifier':'Nouveau vêtement'}</p><h1>${EDIT?esc(DR.name):'Ajouter'}</h1>
 ${DR.dup&&!EDIT?`<div class="dup"><p><b>Déjà dans ta penderie ?</b> Ça ressemble à ${DR.dup.id?`« ${esc(DR.dup.name)} »`:esc(DR.dup.name)}.</p><div class="dup-pair"><figure><img src="${U(DR.photo)}" alt="Nouvelle photo"><figcaption>Nouvelle</figcaption></figure><figure>${DR.dup.photo&&U(DR.dup.photo)?`<img src="${U(DR.dup.photo)}" alt="${esc(DR.dup.name)}">`:'<div class="dup-none">photo détourée</div>'}<figcaption>${DR.dup.id?'Dans ta penderie':'Déjà prise'}</figcaption></figure></div><div class="row" style="flex-wrap:nowrap"><button class="btn sm" style="flex:1" data-a="dupDraft">Ne pas l’ajouter</button><button class="btn sm ghost" style="flex:1" data-a="dupDraftKeep">C’est un autre</button></div></div>`:''}
 <label class="photo-drop"><div class="ph" id="prev" ${DR.photo?`style="background-image:url('${U(DR.photo)}')"`:''}></div><input type="file" accept="image/*" capture="environment" id="pic"><span class="btn sm soft" style="margin-top:${DR.photo?10:0}px">${DR.photo?'Changer la photo':'📷 Prendre une photo'}</span>
 <div class="tiny" style="margin-top:8px" aria-live="polite">${DR.detected==='reconnaissance…'?'Reconnaissance du type en cours…':DR.detected?`<b>Détecté : ${esc(DR.detected)}</b> · vérifie ci-dessous.`:'Reste sur ton téléphone, compressée à ~60 Ko.'}${DR.photo&&S.cut&&!DR.cut?' Le fond sera retiré plus tard, quand tu ne te sers pas de l’app.':''}</div></label>
 ${EDIT?'':`<div class="row" style="margin-top:8px;flex-wrap:nowrap"><button class="btn sm ghost" style="flex:1" data-a="pasteImg">Coller une image</button></div>`}
 <p class="label">Nom</p><input type="text" id="nm" value="${esc(DR.name)}" placeholder="ex. Pull marin rayé" autocomplete="off">
 <p class="label">Catégorie</p><div class="chips">${CATS.map(c=>`<button class="chip ${DR.cat===c.id?'on':''}" data-a="dr" data-k="cat" data-v="${c.id}">${c.label}</button>`).join('')}</div>
 <p class="label">Couleur dominante</p><div class="chips">${COLORS.map(([n,v])=>`<button class="chip ${DR.color===n?'on':''}" data-a="dr" data-k="color" data-v="${n}"><span class="dot" style="background:${v}"></span>${n}</button>`).join('')}</div>
 <p class="label">Chaleur</p><div class="chips">${Object.entries(WARMTH).map(([k,l])=>`<button class="chip ${+DR.warmth===+k?'on':''}" data-a="dr" data-k="warmth" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Occasions <span style="text-transform:none;font-weight:400">(plusieurs possibles)</span></p><div class="chips">${Object.entries(OCCS).map(([k,l])=>`<button class="chip ${(DR.occ&&DR.occ.length?DR.occ:['quotidien']).includes(k)?'on':''}" data-a="drOcc" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Style</p><div class="chips">${Object.entries(STYLES).map(([k,l])=>`<button class="chip ${styleOf(DR).includes(k)?'on':''}" data-a="drStyle" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Saison</p><div class="chips">${Object.entries(SEASONS).map(([k,l])=>`<button class="chip ${(DR.season||'toutes')===k?'on':''}" data-a="dr" data-k="season" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Lessive</p><div class="chips">${[['','Auto ('+WASH[WASH_OF_COLOR[DR.color]||'couleur'].toLowerCase()+')'],...Object.entries(WASH)].map(([k,l])=>`<button class="chip ${(DR.wash||'')===k?'on':''}" data-a="dr" data-k="wash" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Provenance</p><div class="chips">${Object.entries(ORIGINS).map(([k,l])=>`<button class="chip ${originOf(DR)===k?'on':''}" data-a="dr" data-k="origin" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Prix d’achat <span style="text-transform:none;font-weight:400">(facultatif)</span></p><div class="row" style="flex-wrap:nowrap"><input type="text" inputmode="decimal" id="price" value="${DR.price>0?String(DR.price).replace('.',','):''}" placeholder="ex. 35" autocomplete="off" style="max-width:140px"><span class="muted">€</span></div><p class="tiny" style="margin-top:6px">Pour calculer ce que te coûte chaque port.</p>
 ${EDIT&&DR.boughtAt?'':`<p class="label">Acheté il y a… <span style="text-transform:none;font-weight:400">(facultatif)</span></p><div class="chips">${Object.entries(AGES).map(([k,[l]])=>`<button class="chip ${DR.age===k?'on':''}" data-a="dr" data-k="age" data-v="${k}">${l}</button>`).join('')}</div><p class="tiny" style="margin-top:6px">Pour estimer combien de fois tu l’as porté avant l’app.</p>`}
 <p class="label">Matière principale <span style="text-transform:none;font-weight:400">(facultatif)</span></p><div class="chips">${Object.entries(MATIERES).map(([k,l])=>`<button class="chip ${DR.mat===k?'on':''}" data-a="dr" data-k="mat" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Fabriqué en <span style="text-transform:none;font-weight:400">(voir l’étiquette)</span></p><input type="text" id="madeIn" list="pays" value="${esc(DR.madeIn||'')}" placeholder="ex. Portugal" autocomplete="off"><datalist id="pays">${['France','Portugal','Italie','Espagne','Turquie','Maroc','Tunisie','Roumanie','Chine','Bangladesh','Inde','Pakistan','Vietnam','Cambodge','Indonésie','Sri Lanka','Myanmar'].map(p=>`<option value="${p}">`).join('')}</datalist>
 <p class="label">Coût environnemental <span style="text-transform:none;font-weight:400">(s’il est sur l’étiquette)</span></p><div class="row" style="flex-wrap:nowrap"><input type="text" inputmode="numeric" id="ecoScore" value="${DR.ecoScore||''}" placeholder="ex. 850" style="max-width:140px"><span class="muted">points</span></div>
 <p class="label">Marque, référence ou lien <span style="text-transform:none;font-weight:400">(facultatif)</span></p><input type="text" id="ref" value="${esc(DR.ref||'')}" placeholder="ex. Uniqlo 455123, ou lien du produit" autocomplete="off"><p class="tiny" style="margin-top:6px">Utile le jour où tu le revends ou le donnes.</p>
 <p class="label">Ports avant lavage</p><div class="stepper"><button data-a="maxDec">−</button><b id="maxv">${m===0?'jamais sale':m}</b><button data-a="maxInc">+</button></div><p class="tiny" style="margin-top:6px">Laver moins souvent = moins d’eau, d’énergie et d’usure. Aérer un pull entre deux ports suffit souvent.</p>
 <div class="spacer"></div>
 <label class="toggle"><span>Imperméable</span><input type="checkbox" id="wp" ${DR.waterproof?'checked':''}></label>
 ${EDIT?'':`<label class="toggle"><span>Je viens de l’acheter<br><span class="tiny">Compte pour les défis « sans achat »</span></span><input type="checkbox" id="bought" ${DR.boughtAt?'checked':''}></label>`}
  ${EDIT?'':`<p class="label">État actuel</p><div class="chips">${Object.entries(STATES).map(([k,l])=>`<button class="chip ${DR.state===k?'on':''}" data-a="dr" data-k="state" data-v="${k}">${l}</button>`).join('')}</div>`}
 <div class="spacer"></div><div class="spacer"></div>
 <button class="btn block" data-a="saveItem">Enregistrer</button><div class="spacer"></div>
 ${EDIT?`<button class="btn ghost block" data-a="cancelEdit">Annuler</button>`:`<button class="btn soft block" data-a="saveItem" data-more="1">Enregistrer et en ajouter un autre</button>`}`;
}

function vBilan(){
 const act=active(),gone=S.items.filter(i=>i.removed);
 const wears=act.reduce((s,i)=>s+(i.wears||0),0);
 const avg=act.length?(wears/act.length):0;
 const thirty=act.filter(i=>totalWears(i)>=30).length;
 const sh=act.filter(i=>originOf(i)==='occasion').length;
 const dormant=act.filter(i=>!stored(i)).filter(i=>{const d=daysSince(i.lastWorn);return i.lastWorn?d>=90:daysSince(i.added)>=30}).sort((a,b)=>(daysSince(b.lastWorn)??999)-(daysSince(a.lastWorn)??999));
 const rep=act.filter(i=>i.state==='reparer');
 const second=gone.filter(i=>['donne','vendu','recyclerie','transforme'].includes(i.removed.reason)).length;
 let h=`<p class="eyebrow">Ton empreinte</p><h1>Bilan</h1>${co2Hero()}${co2Bilan()}
 <h2>Ta penderie</h2><div class="stats">
  <div class="stat"><b>${act.length}</b><span>pièces dans la penderie</span></div>
  <div class="stat"><b>${wears}</b><span>ports enregistrés</span></div>
  <div class="stat"><b>${avg.toFixed(1).replace(".",",")}</b><span>ports en moyenne par pièce</span></div>
  <div class="stat"><b>${act.length?Math.round(sh/act.length*100):0}%</b><span>de seconde main</span></div>
 </div>
 <h2>Objectif 30 ports</h2><div class="card"><p>${thirty} pièce${thirty>1?'s':''} sur ${act.length} ont atteint 30 ports.</p><div class="bar"><i style="width:${act.length?thirty/act.length*100:0}%"></i></div><p class="tiny">Porter un vêtement plus longtemps est le geste qui réduit le plus son impact : l’essentiel de l’empreinte vient de la fabrication.</p></div>`;
 h+=`<h2>Défis</h2>`+chalCards()+badgesBilan();
 const fold=(t,n,body)=>`<details class="fold"><summary><h2>${t}</h2>${n?`<span class="tiny">${n}</span>`:''}</summary>${body}</details>`;
 h+=fold('Coût par port','',costBilan().replace('<h2>Coût par port</h2>',''));
 let b='';
 if(dormant.length)b+=`<p class="tiny" style="margin-top:-4px">Pas portés depuis 3 mois (ou jamais depuis leur ajout). Remets-les en avant… ou offre-leur une seconde vie.</p><div class="hlist">${dormant.map(i=>`<button class="it" data-a="open" data-id="${i.id}">${thumb(i)}<div class="nm">${esc(i.name)}</div><div class="mt">${i.lastWorn?daysSince(i.lastWorn)+' j':'jamais porté'}${i.boost?' · en avant':''}</div></button>`).join('')}</div>`;
 else b+=`<p class="muted">Rien qui dort. Toute ta penderie vit !</p>`;
 h+=fold('Un peu oubliés',dormant.length||'',b);b='';
 if(rep.length)b+=`<button class="btn block" data-a="sessionOpen" style="margin-bottom:12px">🧵 Lancer une session réparation (${rep.length})</button>`;
 if(rep.length)b+=`<div class="hlist">${rep.map(i=>`<button class="it" data-a="open" data-id="${i.id}">${thumb(i)}<div class="nm">${esc(i.name)}</div></button>`).join('')}</div><div class="spacer"></div>`;
 b+=`<div class="card">${REPAIRS.map(([t,p])=>`<details><summary>${t}</summary><p>${p}</p></details>`).join('')}</div>
 <div class="card"><h3>Ailleurs que dans la poubelle</h3><p class="tiny">Retoucheurs labellisés « bonus réparation » (une partie de la réparation est prise en charge), points de collecte textile, recycleries :</p>
 <p><a href="https://www.refashion.fr" target="_blank" rel="noopener">refashion.fr</a> · <a href="https://longuevieauxobjets.gouv.fr" target="_blank" rel="noopener">longuevieauxobjets.gouv.fr</a></p></div>`;
 h+=fold('À réparer',rep.length||'',b);
 if(gone.length)h+=fold('Partis de la penderie',gone.length,`<div class="card"><p><b>${second}</b> sur ${gone.length} ont eu une seconde vie.</p>${REASONS.map(([k,l])=>{const n=gone.filter(i=>i.removed.reason===k).length;return n?`<div class="row between tiny"><span>${l}</span><b>${n}</b></div>`:''}).join('')}</div>`);
 return h;
}

function aiCards(){return `<div class="card"><label class="toggle" style="border:0;padding:0;gap:12px"><span><b>Reconnaissance auto du type</b><br><span class="tiny">Reconnaît le type, la matière et le motif. Modèle téléchargé <b>une seule fois</b> (~150 Mo, en Wi-Fi de préférence), puis tout est analysé sur ton téléphone : aucune photo ne sort. La couleur, elle, est toujours détectée.</span><br><span class="tiny" id="aistat" style="color:var(--moss);font-weight:600">${esc(AI_MSG)}</span></span><input type="checkbox" id="aitog" ${S.ai?'checked':''}></label></div>
 <div class="card"><label class="toggle" style="border:0;padding:0;gap:12px"><span><b>Détourage automatique</b><br><span class="tiny">Retire le fond (lit, parquet…) et pose le vêtement sur un fond uni, façon catalogue. Il se fait quand l’app est ouverte et que tu n’y touches pas, ou d’un coup avec « Détourer maintenant » ; la photo d’origine reste disponible dans chaque fiche. Modèle téléchargé une fois (~45 Mo).</span></span><input type="checkbox" id="cuttog" ${S.cut?'checked':''}></label>${S.cut?`<button class="btn sm soft" data-a="cutNow" style="margin-top:10px">✂︎ Détourer maintenant${cutPending().length?` (${cutPending().length})`:''}</button><br>`:''}<span class="tiny" id="cutstat" style="color:var(--moss);font-weight:600">${esc(CUT_MSG)}</span></div>
`}
function vReglages(){
 let h=`<p class="eyebrow">Dress Up</p><h1>Réglages</h1>`;
 if(IN_PREVIEW)h+=`<div class="notice">Tu es dans l’<b>aperçu</b> : les données restent dans ce navigateur, mais la météo auto et l’export de sauvegarde sont désactivés. Pour la vraie app, installe la version complète (voir mon message).</div>`;
 h+=`<h2>Photos</h2>${aiCards()}`;
 h+=`<h2>Mon assistant</h2><div class="card">${botSettings(false)}<div class="spacer"></div><button class="btn sm" data-a="botSave">Enregistrer</button></div>
 <h2>Préférences</h2><div class="card"><p class="label" style="margin-top:0">Saison en cours</p><div class="chips">${['ete','hiver'].map(k=>`<button class="chip ${curSeason()===k?'on':''}" data-a="seasonSwitch" data-v="${k}">${SEASONS[k]}</button>`).join('')}</div>
  <p class="label">Ce qui te parle (pour les équivalences CO₂)</p><div class="chips">${Object.entries(INTERESTS).map(([k,l])=>`<button class="chip ${(S.interests||[]).includes(k)?'on':''}" data-a="interest" data-v="${k}">${l}</button>`).join('')}</div>
  <p class="label">Ta machine à laver</p><div class="chips">${[5,6,7,8,9,10].map(k=>`<button class="chip ${capKg()===k?'on':''}" data-a="setKg" data-v="${k}">${k} kg</button>`).join('')}</div></div>
 <h2>Météo</h2><div class="card">
  ${IN_PREVIEW?'':`<p><b>Ville météo :</b> ${S.city?esc(S.city.name):'—'}</p><form class="row" data-f="city" style="flex-wrap:nowrap;margin-bottom:12px"><input type="search" name="city" placeholder="Changer de ville" autocomplete="off"><button class="btn sm">OK</button></form>`}
</div><h2>Mes données</h2><div class="card">
  <p class="tiny">Stockage : ${DB.ok?'sur cet appareil (IndexedDB)':'temporaire — sera perdu à la fermeture'}. Tes vêtements et tes photos ne sortent jamais du téléphone.${IN_PREVIEW?'':' Deux choses passent par Internet : le nom de ta ville et sa position arrondie (Open-Meteo, pour la météo), et le téléchargement des modèles de reconnaissance si tu les actives (jsDelivr et Hugging Face).'}</p>
  <div class="row">${IN_PREVIEW?'':`<button class="btn sm soft" data-a="export">Sauvegarder (fichier)</button>`}<label class="btn sm ghost">Restaurer<input type="file" accept="application/json" id="imp" hidden></label></div>
  <label class="toggle" style="margin-top:8px"><span>Inclure mes photos miroir dans la sauvegarde</span><input type="checkbox" id="expLooks" ${S.exportLooks?'checked':''}></label>
  <div class="spacer"></div><button class="btn sm ghost" data-a="onbOpen">Revoir l’accueil</button><p class="tiny" style="margin:12px 0 0">Dress Up, version ${APP_VERSION}</p></div>
 <h2>Réinitialiser</h2><div class="card"><p class="tiny">Efface vêtements, photos, envies, défis et réglages de cet appareil. Pense à sauvegarder avant.</p><button class="btn danger block" data-a="wipeAsk">Tout effacer et recommencer</button>
 </div>
 ${IN_PREVIEW?'':`<div class="card"><h3>Raccourci du matin</h3><p class="tiny">App Raccourcis → Automatisation → Heure de la journée (ex. 7 h 30) → action « Ouvrir les URL » :</p><p><code>${esc(location.origin+location.pathname)}#matin</code></p><p class="tiny">Utilise toujours le même navigateur (ou toujours l’icône de l’écran d’accueil) : sur iPhone, les deux ont des stockages séparés.</p></div>`}`;
 return h;
}
VIEWS.reglages=vReglages;

/* ---------- menu ---------- */
function toolsSheet(){
 const o=(a,t,d)=>`<button class="opt" data-a="${a}"><b>${t}</b>${d?`<br><span class="tiny">${d}</span>`:''}</button>`;
 sheet(`<h2 style="margin-top:0">Outils de la penderie</h2>
 ${o('underOpen','🧦 Mes dessous',UNDER.some(([k])=>uTot(k))?underStatus():'Compter chaussettes, culottes, boxers…')}
 ${o('invOpen','⚡ Inventaire express','Compter vêtements et dessous en 2 minutes')}
 ${o('tripOpen',S.trip?'🧳 Ma valise':'🧳 Préparer une valise','Selon la météo là-bas')}`);
}
function menuSheet(){
 const o=(a,t,d,attrs='')=>`<button class="opt" data-a="${a}" ${attrs}><b>${t}</b>${d?`<br><span class="tiny">${d}</span>`:''}</button>`;
 sheet(`<h2 style="margin-top:0">Menu</h2>
 ${o('go','📷 Ajouter des vêtements','Photo ou galerie','data-v="ajout"')}
 ${o('weekOpen','📅 Ma semaine','Tenues des 7 prochains jours')}
 ${o('sessionOpen','🧵 Session réparation','')}
 ${o('favsOpen','♥ Tenues favorites','')}
 ${o('lookbookOpen','📸 Lookbook','Tes tenues en photo miroir')}
 ${o('go','⚙️ Réglages','Photos, assistant, ville, machine, saison, sauvegarde','data-v="reglages"')}`);
}

/* ---------- feuilles (modales) ---------- */
let SHEET_FROM=null;
function sheet(html){const o=$('#sheet');const was=!o.hidden,prev=o.querySelector('.sheet-card'),st=prev?prev.scrollTop:0;
 if(!was)SHEET_FROM=document.activeElement; // pour rendre le focus au bouton d'origine à la fermeture
 o.innerHTML=`<div class="sheet-bg" data-a="close" aria-hidden="true"></div><div class="sheet-card" role="dialog" aria-modal="true" tabindex="-1"${was?' style="animation:none"':''}><button class="sheet-x" data-a="close" aria-label="Fermer">${icon('x')}</button>${html}</div>`;o.hidden=false;
 {const card=o.querySelector('.sheet-card'),t=card&&card.querySelector('h2');if(card&&t&&card.setAttribute){t.id='sheetTitle';card.setAttribute('aria-labelledby','sheetTitle')}if(!was&&card&&card.focus)card.focus({preventScroll:true})}
 if(typeof a11y==='function')a11y(o);
 if(was){const c=o.querySelector('.sheet-card');c.scrollTop=st} // mise à jour sur place : pas d'animation, on garde la position
 // glisser vers le bas pour fermer
 const c=o.querySelector('.sheet-card');let y0=null,dy=0;
 c.addEventListener('touchstart',e=>{y0=c.scrollTop<=0?e.touches[0].clientY:null;dy=0},{passive:true});
 c.addEventListener('touchmove',e=>{if(y0===null)return;dy=e.touches[0].clientY-y0;if(dy>0)c.style.transform=`translateY(${dy}px)`},{passive:true});
 c.addEventListener('touchend',()=>{if(y0!==null&&dy>90)closeSheet();else c.style.transform='';y0=null})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheet').hidden)closeSheet()});
function closeSheet(){const o=$('#sheet'),was=!o.hidden;o.hidden=true;o.innerHTML='';
 if(was&&SHEET_FROM&&SHEET_FROM.focus&&document.contains&&document.contains(SHEET_FROM))SHEET_FROM.focus({preventScroll:true});SHEET_FROM=null}
// la touche Tab reste dans la fenêtre ouverte
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||$('#sheet').hidden)return;
 const f=[...$('#sheet').querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary,[tabindex="0"]')].filter(x=>!x.disabled&&x.offsetParent!==null);if(!f.length)return;
 const first=f[0],last=f[f.length-1],cur=document.activeElement;
 if(e.shiftKey&&(cur===first||!$('#sheet').contains(cur))){e.preventDefault();last.focus()}else if(!e.shiftKey&&cur===last){e.preventDefault();first.focus()}});

/* ---------- accessibilité : complète ce que les écrans n'écrivent pas eux-mêmes ---------- */
function a11y(root=document){
 if(!root||!root.querySelectorAll)return;
 // une puce dit si elle est sélectionnée
 root.querySelectorAll('button.chip').forEach(c=>c.setAttribute('aria-pressed',c.classList.contains('on')?'true':'false'));
 // un champ porte le nom du petit titre placé au-dessus de lui
 root.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=file]),select,textarea').forEach(f=>{
  if(f.getAttribute('aria-label')||f.closest('label'))return;
  let n=f.previousElementSibling||f.parentElement&&f.parentElement.previousElementSibling,lab='';
  for(let k=0;n&&k<3&&!lab;k++,n=n.previousElementSibling)if(n.classList&&n.classList.contains('label'))lab=n.textContent.replace(/\s+/g,' ').trim();
  f.setAttribute('aria-label',lab||f.getAttribute('placeholder')||f.name||'Champ')});
 // les boutons − et + disent ce qu'ils règlent
 root.querySelectorAll('.stepper').forEach(st=>{const b=st.querySelectorAll('button'),v=st.querySelector('b');if(b.length<2)return;
  const row=st.closest('.row'),what=((row&&row.firstElementChild!==st&&row.firstElementChild.textContent)||(st.previousElementSibling&&st.previousElementSibling.textContent)||'').replace(/\s+/g,' ').trim().slice(0,40);
  b[0].setAttribute('aria-label',`Moins${what?' : '+what:''}`);b[b.length-1].setAttribute('aria-label',`Plus${what?' : '+what:''}`);if(v)v.setAttribute('aria-live','polite')});
}
function itemSheet(id){
 const i=item(id);if(!i)return;const m=maxOf(i),d=daysSince(i.lastWorn),w=totalWears(i),est=pastWears(i)>0;
 const o=originOf(i),when=k=>new Date(k+'T12:00').toLocaleDateString('fr-FR',{month:'short',year:'numeric'});
 const life=[[i.boughtAt?when(i.boughtAt):i.age?AGES[i.age][0]:when(i.added),o==='occasion'?'Acheté d’occasion':o==='cadeau'?'Reçu en cadeau':o?'Acheté neuf':'Arrivé chez toi','ok'],
  ...(i.repaired?[['Réparé',i.repaired>1?i.repaired+' fois':'une fois','ok']]:[]),['Aujourd’hui',portsLabel(i),'ok now'],['Objectif','30 ports',w>=30?'ok':''],[i.sale?'En cours':'Un jour',i.sale?'En vente':'Seconde vie','']];
 sheet(`<div class="passport">${HANGER}${thumb(i,'ph big')}</div><p class="tiny" style="margin:14px 0 0">Le passeport de</p><h2 style="margin:0 0 4px;font-size:24px">${esc(i.name)}</h2>
 <div class="card" style="margin-top:12px;padding:16px 6px 14px"><ol class="life" aria-label="Sa vie jusqu’ici">${life.map(([d,l,c])=>`<li class="${c}"><span>${esc(d)}</span>${esc(l)}</li>`).join('')}</ol></div>
 ${i.ref?`<p class="tiny" style="margin:0 0 4px">${/^https?:\/\//i.test(i.ref)?`<a href="${esc(i.ref)}" target="_blank" rel="noopener">Voir la fiche produit</a>`:'Réf. '+esc(i.ref)}</p>`:''}
 <p class="tiny">${cat(i.cat).label} · ${esc(i.color)} · ${WARMTH[i.warmth]||''}${i.waterproof?' · imperméable':''}${originOf(i)?' · '+ORIGINS[originOf(i)].toLowerCase():''}${i.season&&i.season!=='toutes'?' · '+SEASONS[i.season].toLowerCase():''}${i.occ&&i.occ.length?' · '+i.occ.map(o=>OCCS[o].toLowerCase()).join(', '):''} · ${styleOf(i).map(s=>STYLES[s].toLowerCase()).join(', ')} · lessive ${WASH[washOf(i)].toLowerCase()}</p>
 ${colorPick(i)}
 ${paused(i)?`<p class="notice" style="margin:8px 0">En pause pendant le Project 333.</p>`:''}
 ${stored(i)?`<p class="notice" style="margin:8px 0">Rangé jusqu’à la saison ${i.season==='ete'?'d’été':'d’hiver'} : il n’est pas proposé dans les tenues.</p>`:''}
 <div class="stats3"><div><b>${est?'~':''}${w}</b><span>ports</span></div><div><b>${m?`${i.sinceWash||0}/${m}`:'—'}</b><span>depuis lavage</span></div><div><b>${d===null?'jamais':d===0?'auj.':d+' j'}</b><span>dernier port</span></div></div>
 <div class="bar"><i style="width:${Math.min(100,w/30*100)}%"></i></div><p class="tiny">${w>=30?'Objectif 30 ports atteint 🌱':`Encore ${30-w} port${30-w>1?'s':''} pour l’objectif 30.`}${est?` <span>(${i.wears||0} comptés ici + ~${pastWears(i)} estimés avant l’app)</span>`:''}</p>
 <p class="label">État</p><div class="chips">${Object.entries(STATES).map(([k,l])=>`<button class="chip ${i.state===k?'on':''}" data-a="setState" data-id="${i.id}" data-v="${k}">${l}</button>`).join('')}</div>
 ${i.sale?`<p class="notice" style="margin:8px 0">En vente${i.sale.price?' à '+eur(i.sale.price):''} : il n’est plus proposé dans les tenues.</p>`:''}${i.loan?`<p class="notice" style="margin:8px 0">Prêté à ${esc(i.loan.to)} depuis le ${new Date(i.loan.since+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}.</p>`:''}${i.swap?`<p class="notice" style="margin:8px 0">Mis de côté pour un troc.</p>`:''}
 <div class="spacer"></div>${costCard(i)}${co2Card(i)}${careTip(i)?`<p class="tiny" style="margin:0 0 12px">🧺 ${careTip(i)}</p>`:''}
 ${i.state==='reparer'?`<p class="tiny" style="margin-top:10px">Il ne sera plus proposé dans les tenues. Des astuces de réparation t’attendent dans Bilan.</p>`:''}
 <div class="spacer"></div>
 ${!i.boost&&(i.lastWorn?d>=30:true)?`<button class="btn soft block" data-a="boost" data-id="${i.id}">Me le proposer bientôt</button><div class="spacer"></div>`:''}
 ${photos.get(i.id)&&!i.cut?`<button class="btn sm soft block" data-a="cutItem" data-id="${i.id}" style="margin-bottom:10px">Retirer le fond de la photo</button>`:''}${i.cut&&ORIG.has(i.id)?`<button class="btn sm ghost block" data-a="origBack" data-id="${i.id}" style="margin-bottom:10px">Remettre la photo d’origine</button>`:''}
 <button class="btn sm ghost block" data-a="edit" data-id="${i.id}" style="margin-bottom:10px">Modifier</button>
 <button class="btn block" data-a="secondLife" data-id="${i.id}">♻︎ Seconde vie : vendre, donner…</button>`);
}
function removeSheet(id){const i=item(id);
 sheet(`<h2 style="margin-top:0">Où part « ${esc(i.name)} » ?</h2><p class="tiny">Il reste dans ton historique pour le bilan.</p>${REASONS.map(([k,l])=>`<button class="btn ${['jete','perdu'].includes(k)?'ghost':'soft'} block" style="margin-bottom:8px" data-a="removeDo" data-id="${id}" data-v="${k}">${l}</button>`).join('')}<div class="spacer"></div><button class="btn sm danger" data-a="deleteDo" data-id="${id}">Supprimer définitivement (erreur de saisie)</button>`);
}
function washSheet(g){const s=active().filter(i=>i.state==='sale'&&(!g||washOf(i)===g));
 sheet(`<h2 style="margin-top:0">${g?'Machine '+WASH[g].toLowerCase():'Sortis de la machine'}</h2>${g?'<p class="tiny">Décoche ce qui n’est pas passé dans cette machine.</p>':''}${s.map(i=>`<label class="chk"><input type="checkbox" checked value="${i.id}">${thumb(i,'ph mini')}<span>${esc(i.name)}</span></label>`).join('')}${Object.keys(under()).length?`<label class="chk"><input type="checkbox" id="washUnder" checked><span>🧦 Les dessous aussi</span></label>`:''}<div class="spacer"></div><button class="btn block" data-a="washDo" data-g="${g||''}">C’est propre</button><p class="tiny" style="margin-top:10px">Astuce : lavage à 30 °C et séchage à l’air, c’est moins d’énergie et des vêtements qui durent plus.</p>`);
}

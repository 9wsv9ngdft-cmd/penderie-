// Dress Up — Écrans et fenêtres
"use strict";
/* ---------- vues ---------- */
let VIEW='matin',F={cat:'all',state:'all'},EDIT=null,DR=null,BATCH=null;
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
 const d=new Date();
 let h=`<p class="eyebrow"><b style="color:var(--moss)">Dress Up</b> · ${d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</p><h1>${greet()}</h1>`;
 if(!active().length)return h+`<div class="card empty"><div class="serif">Ta penderie est vide</div><p class="muted">Commence par photographier quelques vêtements : un haut, un bas, des chaussures suffisent pour une première tenue.</p><a class="btn" href="#ajout">Ajouter un vêtement</a></div>`;
 const w=effWeather();
 h+=weatherCard(w);
 h+=seasonNotice()+laundryNotice()+wishNotice()+circularNotice()+photoOfDay();
 const todayLog=S.log.find(l=>l.date===todayKey());
 if(todayLog){
  const its=todayLog.ids.map(item).filter(Boolean);
  h+=`<h2>Aujourd’hui</h2><div class="card outfit"><div class="strip">${its.map(i=>thumb(i)).join('')}</div><ul>${its.map(i=>`<li><span>${esc(i.name)}</span><span>${i.wears} ports</span></li>`).join('')}</ul><p class="tiny">Tenue enregistrée. Bonne journée !</p><div class="row"><button class="btn sm ${isFav(todayLog.ids)?'clay':'soft'}" data-a="favToggle">${isFav(todayLog.ids)?'♥ Favorite':'♡ Tenue favorite'}</button><button class="btn sm ghost" data-a="undo">Changer de tenue</button></div></div>`;
  return h;
 }
 h+=yesterdayCard();
 if(!w)return h+`<p class="muted" style="margin-top:20px">Indique la météo pour recevoir des idées de tenues.</p>`;
 if(!OUTS){OUTS=genOutfits(w);const pt=plannedToday();if(pt)OUTS=[pt,...OUTS.filter(o=>favKey(o)!==favKey(pt))].slice(0,3)}
 if(!OUTS.length)return h+`<div class="card"><p>Rien de propre à proposer… C’est peut-être le jour de la lessive ?</p><a class="btn sm" href="#penderie">Voir la penderie</a></div>`;
 const tip={froid:'Superpose : trois couches fines tiennent plus chaud qu’une épaisse.',frais:'Prévois une couche que tu peux enlever à midi.',doux:'Une petite maille suffira.',chaud:'Matières légères et respirantes.'}[w.band];
 h+=`<div class="row between" style="margin-top:30px"><h2 style="margin:0">Idées du jour</h2><button class="btn sm ghost" data-a="weekOpen">📅 Ma semaine</button></div><div class="spacer"></div>${occChips()}<p class="tiny" style="margin-top:-4px">${tip} On privilégie ce qui est déjà porté et ce que tu as un peu oublié.</p>`;
 h+=OUTS.map((o,k)=>{const its=o.map(item).filter(Boolean);
  const miss=[];const cats=its.map(i=>i.cat);
  if(!cats.includes('robe')&&!cats.includes('bas'))miss.push('bas');
  if((w.band==='froid'||w.band==='frais')&&!cats.includes('pull'))miss.push('pull');
  return `<div class="card outfit"><div class="num">${o.plan?'📅 Prévue dans ta semaine':o.fav?'♥ Une de tes favorites':'Tenue '+(k+1)}</div><div class="strip">${its.map(i=>thumb(i)).join('')}</div><ul>${its.map(i=>`<li><span>${esc(i.name)}</span><span>${i.state==='porte'?'déjà porté':i.boost?'mis en avant':i.lastWorn?(daysSince(i.lastWorn)>45?'à faire revivre':''):(daysSince(i.added)>=30?'jamais porté':'')}</span></li>`).join('')}</ul>${miss.length?`<p class="tiny">Pas de ${miss.join(' ni de ')} propre dispo.</p>`:''}<button class="btn block" data-a="wearOutfit" data-k="${k}">Je porte ça</button></div>`}).join('');
 h+=`<button class="btn soft block" data-a="reroll">Autres idées</button>`;
 return h;
}

function vPenderie(){
 const all=active(),nStored=all.filter(stored).length,act=F.stored?all.filter(stored):all.filter(i=>!stored(i));
 let list=act.filter(i=>(F.cat==='all'||i.cat===F.cat)&&(F.state==='all'||i.state===F.state));
 list.sort((a,b)=>(a.cat>b.cat?1:a.cat<b.cat?-1:0)||a.name.localeCompare(b.name));
 let h=`<p class="eyebrow">${all.length-nStored} pièce${all.length-nStored>1?'s':''} · mode ${SEASONS[curSeason()].toLowerCase()}</p><h1>Penderie</h1>`;
 h+=seasonNotice()+laundryCard()+collectionBar()+`<div style="margin-bottom:12px">${underLine()}</div>`;
 h+=`<div class="row" style="margin-bottom:12px">${favs().length?`<button class="btn sm ghost" data-a="favsOpen">♥ Tenues favorites (${favs().length})</button>`:''}<button class="btn sm ghost" data-a="invOpen">⚡ Inventaire express</button><button class="btn sm ghost" data-a="tripOpen">${S.trip?'🧳 Ma valise':'🧳 Préparer une valise'}</button></div>`;
 h+=`<div class="chips scroll">${[['all','Tout'],...CATS.map(c=>[c.id,c.label])].map(([v,l])=>`<button class="chip ${F.cat===v?'on':''}" data-a="fCat" data-v="${v}">${l}</button>`).join('')}</div><div class="spacer"></div>`;
 h+=`<div class="chips scroll">${[['all','Tous états'],...Object.entries(STATES)].map(([v,l])=>`<button class="chip ${F.state===v?'on':''}" data-a="fState" data-v="${v}">${l}${v!=='all'?` · ${act.filter(i=>i.state===v).length}`:''}</button>`).join('')}${nStored||F.stored?`<button class="chip ${F.stored?'on':''}" data-a="fStored">Rangés · ${nStored}</button>`:''}</div><div class="spacer"></div>`;
 if(!list.length)h+=`<div class="empty"><p class="muted">${act.length?'Rien ici avec ces filtres.':'Aucun vêtement pour l’instant.'}</p></div>`;
 else h+=`<div class="grid">${list.map(i=>`<button class="it" data-a="open" data-id="${i.id}">${thumb(i,'ph',true)}<div class="nm">${esc(i.name)}</div><div class="mt">${stored(i)?'rangé · ':''}${i.wears||0} port${(i.wears||0)>1?'s':''}${cpp(i)!==null&&totalWears(i)?' · '+eur(cpp(i))+'/port':''}</div></button>`).join('')}</div>`;
 h+=`<a class="fab" href="#ajout" aria-label="Ajouter">+</a>`;
 return h;
}

function newDraft(){return{name:'',cat:'haut',color:'noir',warmth:2,waterproof:false,origin:null,price:null,season:'toutes',wash:'',occ:[],state:'propre',max:null,photo:null}}
function vBatch(){
 if(BATCH.busy)return `<p class="eyebrow">Analyse en cours</p><h1>${BATCH.done}/${BATCH.total}</h1><div class="bar"><i style="width:${BATCH.done/BATCH.total*100}%"></i></div><p class="tiny">Tout se passe sur ton téléphone.</p>`;
 return `<p class="eyebrow">Vérifie et corrige</p><h1>${BATCH.items.length} vêtement${BATCH.items.length>1?'s':''}</h1><p class="tiny" style="margin-top:-8px">J’ai deviné ce que j’ai pu. Touche un champ pour corriger.</p>
 ${BATCH.items.map((b,k)=>`<div class="card row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px"><div class="ph mini" style="width:74px;background-image:url('${b.photo}')"></div><div style="flex:1;min-width:0;display:grid;grid-template-columns:minmax(0,1fr);gap:6px">
  <input type="text" data-bi="${k}" data-bf="name" value="${esc(b.name)}">
  <div class="row" style="gap:6px;flex-wrap:nowrap"><select data-bi="${k}" data-bf="cat">${CATS.map(c=>`<option value="${c.id}" ${b.cat===c.id?'selected':''}>${c.label}</option>`).join('')}</select>
  <select data-bi="${k}" data-bf="color">${COLORS.map(([n])=>`<option ${b.color===n?'selected':''}>${n}</option>`).join('')}</select></div>
  ${b.guessed?'':`<span class="tiny">Type non reconnu : à choisir</span>`}</div>
  <button class="btn sm ghost" style="padding:6px 11px" data-a="batchDrop" data-k="${k}" aria-label="Retirer">✕</button></div>`).join('')}
 <button class="btn block" data-a="batchSave">Tout ajouter (${BATCH.items.length})</button><div class="spacer"></div><button class="btn ghost block" data-a="batchCancel">Annuler</button>`;
}
function vAjout(){
 if(BATCH)return vBatch();
 if(!DR){if(EDIT){const i=item(EDIT);DR={...i,photo:photos.get(i.id)||null}}else DR=newDraft()}
 const m=DR.max??cat(DR.cat).max;
 return `<p class="eyebrow">${EDIT?'Modifier':'Nouveau vêtement'}</p><h1>${EDIT?esc(DR.name):'Ajouter'}</h1>
 ${EDIT?'':`<div class="card"><label class="toggle" style="border:0;padding:0;gap:12px"><span><b>Reconnaissance auto du type</b><br><span class="tiny">Reconnaît le type, la matière et le motif. Modèle téléchargé <b>une seule fois</b> (~150 Mo, en Wi-Fi de préférence), puis tout est analysé sur ton téléphone : aucune photo ne sort. La couleur, elle, est toujours détectée.</span><br><span class="tiny" id="aistat" style="color:var(--moss);font-weight:600">${esc(AI_MSG)}</span></span><input type="checkbox" id="aitog" ${S.ai?'checked':''}></label></div>
 <div class="card"><label class="toggle" style="border:0;padding:0;gap:12px"><span><b>Détourage automatique</b><br><span class="tiny">Retire le fond (lit, parquet…) et pose le vêtement sur un fond uni, façon catalogue. Modèle téléchargé une fois (~45 Mo), traitement sur ton téléphone, quelques secondes par photo.</span></span><input type="checkbox" id="cuttog" ${S.cut?'checked':''}></label><span class="tiny" id="cutstat" style="color:var(--moss);font-weight:600">${esc(CUT_MSG)}</span></div>
 <button class="btn block" data-a="invOpen" style="margin-bottom:10px">⚡ Inventaire express (2 min, sans photo)</button>
 <label class="btn soft block" style="margin-bottom:14px">Scanner plusieurs vêtements d’un coup<input type="file" accept="image/*" multiple id="multi" hidden></label>`}
 <label class="photo-drop"><div class="ph" id="prev" ${DR.photo?`style="background-image:url('${DR.photo}')"`:''}></div><input type="file" accept="image/*" capture="environment" id="pic"><span class="btn sm soft" style="margin-top:${DR.photo?10:0}px">${DR.photo?'Changer la photo':'📷 Prendre une photo'}</span>${DR.orig?`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm ghost" data-a="swapPhoto">${DR.cutOn===false?'Retirer le fond':'Garder le fond d’origine'}</button></div>`:''}
 <div class="tiny" style="margin-top:8px">${DR.detected?`<b>Détecté : ${esc(DR.detected)}</b> · vérifie ci-dessous`:'Reste sur ton téléphone, compressée à ~60 Ko.'}</div></label>
 <button class="btn sm ghost block" data-a="pasteImg" style="margin-top:8px">Coller une image (photo du produit…)</button>
 <p class="label">Nom</p><input type="text" id="nm" value="${esc(DR.name)}" placeholder="ex. Pull marin rayé" autocomplete="off">
 <p class="label">Catégorie</p><div class="chips">${CATS.map(c=>`<button class="chip ${DR.cat===c.id?'on':''}" data-a="dr" data-k="cat" data-v="${c.id}">${c.label}</button>`).join('')}</div>
 <p class="label">Couleur dominante</p><div class="chips">${COLORS.map(([n,v])=>`<button class="chip ${DR.color===n?'on':''}" data-a="dr" data-k="color" data-v="${n}"><span class="dot" style="background:${v}"></span>${n}</button>`).join('')}</div>
 <p class="label">Chaleur</p><div class="chips">${Object.entries(WARMTH).map(([k,l])=>`<button class="chip ${+DR.warmth===+k?'on':''}" data-a="dr" data-k="warmth" data-v="${k}">${l}</button>`).join('')}</div>
 <p class="label">Occasions <span style="text-transform:none;font-weight:400">(plusieurs possibles)</span></p><div class="chips">${Object.entries(OCCS).map(([k,l])=>`<button class="chip ${(DR.occ&&DR.occ.length?DR.occ:['quotidien']).includes(k)?'on':''}" data-a="drOcc" data-v="${k}">${l}</button>`).join('')}</div>
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
 const thirty=act.filter(i=>(i.wears||0)>=30).length;
 const sh=act.filter(i=>originOf(i)==='occasion').length;
 const dormant=act.filter(i=>!stored(i)).filter(i=>{const d=daysSince(i.lastWorn);return i.lastWorn?d>=90:daysSince(i.added)>=30}).sort((a,b)=>(daysSince(b.lastWorn)??999)-(daysSince(a.lastWorn)??999));
 const rep=act.filter(i=>i.state==='reparer');
 const second=gone.filter(i=>['donne','vendu','recyclerie','transforme'].includes(i.removed.reason)).length;
 let h=`<p class="eyebrow">Ton empreinte</p><h1>Bilan</h1>
 <div class="stats">
  <div class="stat"><b>${act.length}</b><span>pièces dans la penderie</span></div>
  <div class="stat"><b>${wears}</b><span>ports enregistrés</span></div>
  <div class="stat"><b>${avg.toFixed(1).replace(".",",")}</b><span>ports en moyenne par pièce</span></div>
  <div class="stat"><b>${act.length?Math.round(sh/act.length*100):0}%</b><span>de seconde main</span></div>
 </div>
 <h2>Objectif 30 ports</h2><div class="card"><p>${thirty} pièce${thirty>1?'s':''} sur ${act.length} ont atteint 30 ports.</p><div class="bar"><i style="width:${act.length?thirty/act.length*100:0}%"></i></div><p class="tiny">Porter un vêtement plus longtemps est le geste qui réduit le plus son impact : l’essentiel de l’empreinte vient de la fabrication.</p></div>`;
 h+=badgesBilan()+costBilan()+co2Bilan();
 h+=`<h2>Un peu oubliés</h2>`;
 if(dormant.length)h+=`<p class="tiny" style="margin-top:-4px">Pas portés depuis 3 mois (ou jamais depuis leur ajout). Remets-les en avant… ou offre-leur une seconde vie.</p><div class="hlist">${dormant.map(i=>`<button class="it" data-a="open" data-id="${i.id}">${thumb(i)}<div class="nm">${esc(i.name)}</div><div class="mt">${i.lastWorn?daysSince(i.lastWorn)+' j':'jamais porté'}${i.boost?' · en avant':''}</div></button>`).join('')}</div>`;
 else h+=`<p class="muted">Rien qui dort. Toute ta penderie vit !</p>`;
 h+=`<h2>À réparer</h2>`;
 if(rep.length)h+=`<button class="btn block" data-a="sessionOpen" style="margin-bottom:12px">🧵 Lancer une session réparation (${rep.length})</button>`;
 if(rep.length)h+=`<div class="hlist">${rep.map(i=>`<button class="it" data-a="open" data-id="${i.id}">${thumb(i)}<div class="nm">${esc(i.name)}</div></button>`).join('')}</div><div class="spacer"></div>`;
 h+=`<div class="card">${REPAIRS.map(([t,p])=>`<details><summary>${t}</summary><p>${p}</p></details>`).join('')}</div>
 <div class="card"><h3>Ailleurs que dans la poubelle</h3><p class="tiny">Retoucheurs labellisés « bonus réparation » (une partie de la réparation est prise en charge), points de collecte textile, recycleries :</p>
 <p><a href="https://www.refashion.fr" target="_blank" rel="noopener">refashion.fr</a> · <a href="https://longuevieauxobjets.gouv.fr" target="_blank" rel="noopener">longuevieauxobjets.gouv.fr</a></p></div>`;
 if(gone.length)h+=`<h2>Partis de la penderie</h2><div class="card"><p><b>${second}</b> sur ${gone.length} ont eu une seconde vie.</p>${REASONS.map(([k,l])=>{const n=gone.filter(i=>i.removed.reason===k).length;return n?`<div class="row between tiny"><span>${l}</span><b>${n}</b></div>`:''}).join('')}</div>`;
 return h;
}

function vReglages(){
 let h=`<p class="eyebrow">Dress Up</p><h1>Réglages</h1>`;
 if(IN_PREVIEW)h+=`<div class="notice">Tu es dans l’<b>aperçu</b> : les données restent dans ce navigateur, mais la météo auto et l’export de sauvegarde sont désactivés. Pour la vraie app, installe la version complète (voir mon message).</div>`;
 h+=`<h2>Mon assistant</h2><div class="card">${botSettings(false)}<div class="spacer"></div><button class="btn sm" data-a="botSave">Enregistrer</button></div>
 <h2>Préférences</h2><div class="card"><p class="label" style="margin-top:0">Saison en cours</p><div class="chips">${['ete','hiver'].map(k=>`<button class="chip ${curSeason()===k?'on':''}" data-a="seasonSwitch" data-v="${k}">${SEASONS[k]}</button>`).join('')}</div>
  <p class="label">Ce qui te parle (pour les équivalences CO₂)</p><div class="chips">${Object.entries(INTERESTS).map(([k,l])=>`<button class="chip ${(S.interests||[]).includes(k)?'on':''}" data-a="interest" data-v="${k}">${l}</button>`).join('')}</div>
  <p class="label">Ta machine à laver</p><div class="chips">${[5,6,7,8,9,10].map(k=>`<button class="chip ${capKg()===k?'on':''}" data-a="setKg" data-v="${k}">${k} kg</button>`).join('')}</div></div>
 <h2>Météo</h2><div class="card">
  ${IN_PREVIEW?'':`<p><b>Ville météo :</b> ${S.city?esc(S.city.name):'—'}</p><form class="row" data-f="city" style="flex-wrap:nowrap;margin-bottom:12px"><input type="search" name="city" placeholder="Changer de ville" autocomplete="off"><button class="btn sm">OK</button></form>`}
</div><h2>Mes données</h2><div class="card">
  <p class="tiny">Stockage : ${DB.ok?'sur cet appareil (IndexedDB)':'temporaire — sera perdu à la fermeture'}. Aucune donnée n’est envoyée ailleurs${IN_PREVIEW?'':' (seule la position arrondie de ta ville part vers Open-Meteo pour la météo)'}.</p>
  <div class="row">${IN_PREVIEW?'':`<button class="btn sm soft" data-a="export">Sauvegarder (fichier)</button>`}<label class="btn sm ghost">Restaurer<input type="file" accept="application/json" id="imp" hidden></label></div>
  <div class="spacer"></div><button class="btn sm ghost" data-a="onbOpen">Revoir l’accueil</button></div>
 <h2>Réinitialiser</h2><div class="card"><p class="tiny">Efface vêtements, photos, envies, défis et réglages de cet appareil. Pense à sauvegarder avant.</p><button class="btn danger block" data-a="wipeAsk">Tout effacer et recommencer</button>
 </div>
 ${IN_PREVIEW?'':`<div class="card"><h3>Raccourci du matin</h3><p class="tiny">App Raccourcis → Automatisation → Heure de la journée (ex. 7 h 30) → action « Ouvrir les URL » :</p><p><code>${esc(location.origin+location.pathname)}#matin</code></p><p class="tiny">Utilise toujours le même navigateur (ou toujours l’icône de l’écran d’accueil) : sur iPhone, les deux ont des stockages séparés.</p></div>`}`;
 return h;
}
VIEWS.reglages=vReglages;

/* ---------- menu ---------- */
function menuSheet(){
 const o=(a,t,d,attrs='')=>`<button class="opt" data-a="${a}" ${attrs}><b>${t}</b>${d?`<br><span class="tiny">${d}</span>`:''}</button>`;
 sheet(`<h2 style="margin-top:0">Menu</h2>
 ${o('chatOpen','💬 '+esc(botName()[0].toUpperCase()+botName().slice(1)),'Ton assistant shopper')}
 ${o('weekOpen','📅 Ma semaine','Tenues des 7 prochains jours')}
 ${o('invOpen','⚡ Inventaire express','Compter vêtements et dessous')}
 ${o('underOpen','🧦 Mes dessous','')}
 ${o('tripOpen','🧳 Valise','')}
 ${o('sessionOpen','🧵 Session réparation','')}
 ${o('favsOpen','♥ Tenues favorites','')}
 ${o('go','⚙️ Réglages','Assistant, ville, machine, saison, sauvegarde, réinitialiser','data-v="reglages"')}`);
}

/* ---------- feuilles (modales) ---------- */
function sheet(html){const o=$('#sheet');const was=!o.hidden,prev=o.querySelector('.sheet-card'),st=prev?prev.scrollTop:0;
 o.innerHTML=`<div class="sheet-bg" data-a="close"></div><div class="sheet-card"${was?' style="animation:none"':''}>${html}</div>`;o.hidden=false;
 if(was){const c=o.querySelector('.sheet-card');c.scrollTop=st} // mise à jour sur place : pas d'animation, on garde la position
 // glisser vers le bas pour fermer
 const c=o.querySelector('.sheet-card');let y0=null,dy=0;
 c.addEventListener('touchstart',e=>{y0=c.scrollTop<=0?e.touches[0].clientY:null;dy=0},{passive:true});
 c.addEventListener('touchmove',e=>{if(y0===null)return;dy=e.touches[0].clientY-y0;if(dy>0)c.style.transform=`translateY(${dy}px)`},{passive:true});
 c.addEventListener('touchend',()=>{if(y0!==null&&dy>90)closeSheet();else c.style.transform='';y0=null})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheet').hidden)closeSheet()});
function closeSheet(){const o=$('#sheet');o.hidden=true;o.innerHTML=''}
function itemSheet(id){
 const i=item(id);if(!i)return;const m=maxOf(i),d=daysSince(i.lastWorn),w=i.wears||0;
 sheet(`${thumb(i,'ph big')}<h2 style="margin-top:4px">${esc(i.name)}</h2>
 ${i.ref?`<p class="tiny" style="margin:0 0 4px">${/^https?:\/\//i.test(i.ref)?`<a href="${esc(i.ref)}" target="_blank" rel="noopener">Voir la fiche produit</a>`:'Réf. '+esc(i.ref)}</p>`:''}
 <p class="tiny">${cat(i.cat).label} · ${esc(i.color)} · ${WARMTH[i.warmth]||''}${i.waterproof?' · imperméable':''}${originOf(i)?' · '+ORIGINS[originOf(i)].toLowerCase():''}${i.season&&i.season!=='toutes'?' · '+SEASONS[i.season].toLowerCase():''}${i.occ&&i.occ.length?' · '+i.occ.map(o=>OCCS[o].toLowerCase()).join(', '):''} · lessive ${WASH[washOf(i)].toLowerCase()}</p>
 ${colorPick(i)}
 ${paused(i)?`<p class="notice" style="margin:8px 0">En pause pendant le Project 333.</p>`:''}
 ${stored(i)?`<p class="notice" style="margin:8px 0">Rangé jusqu’à la saison ${i.season==='ete'?'d’été':'d’hiver'} : il n’est pas proposé dans les tenues.</p>`:''}
 <div class="stats3"><div><b>${w}</b><span>ports</span></div><div><b>${m?`${i.sinceWash||0}/${m}`:'—'}</b><span>depuis lavage</span></div><div><b>${d===null?'jamais':d===0?'auj.':d+' j'}</b><span>dernier port</span></div></div>
 <div class="bar"><i style="width:${Math.min(100,w/30*100)}%"></i></div><p class="tiny">${w>=30?'Objectif 30 ports atteint 🌱':`Encore ${30-w} ports pour l’objectif 30.`}</p>
 <p class="label">État</p><div class="chips">${Object.entries(STATES).map(([k,l])=>`<button class="chip ${i.state===k?'on':''}" data-a="setState" data-id="${i.id}" data-v="${k}">${l}</button>`).join('')}</div>
 ${i.sale?`<p class="notice" style="margin:8px 0">En vente${i.sale.price?' à '+eur(i.sale.price):''} : il n’est plus proposé dans les tenues.</p>`:''}${i.loan?`<p class="notice" style="margin:8px 0">Prêté à ${esc(i.loan.to)} depuis le ${new Date(i.loan.since+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}.</p>`:''}${i.swap?`<p class="notice" style="margin:8px 0">Mis de côté pour un troc.</p>`:''}
 <div class="spacer"></div>${costCard(i)}${co2Card(i)}${careTip(i)?`<p class="tiny" style="margin:0 0 12px">🧺 ${careTip(i)}</p>`:''}
 ${i.state==='reparer'?`<p class="tiny" style="margin-top:10px">Il ne sera plus proposé dans les tenues. Des astuces de réparation t’attendent dans Bilan.</p>`:''}
 <div class="spacer"></div>
 ${!i.boost&&(i.lastWorn?d>=30:true)?`<button class="btn soft block" data-a="boost" data-id="${i.id}">Me le proposer bientôt</button><div class="spacer"></div>`:''}
 ${photos.get(i.id)&&!i.cut?`<button class="btn sm soft block" data-a="cutItem" data-id="${i.id}" style="margin-bottom:10px">Retirer le fond de la photo</button>`:''}
 <button class="btn sm ghost block" data-a="edit" data-id="${i.id}" style="margin-bottom:10px">Modifier</button>
 <button class="btn block" data-a="secondLife" data-id="${i.id}">♻︎ Seconde vie : vendre, donner…</button>`);
}
function removeSheet(id){const i=item(id);
 sheet(`<h2 style="margin-top:0">Où part « ${esc(i.name)} » ?</h2><p class="tiny">Il reste dans ton historique pour le bilan.</p>${REASONS.map(([k,l])=>`<button class="btn ${['jete','perdu'].includes(k)?'ghost':'soft'} block" style="margin-bottom:8px" data-a="removeDo" data-id="${id}" data-v="${k}">${l}</button>`).join('')}<div class="spacer"></div><button class="btn sm danger" data-a="deleteDo" data-id="${id}">Supprimer définitivement (erreur de saisie)</button>`);
}
function washSheet(g){const s=active().filter(i=>i.state==='sale'&&(!g||washOf(i)===g));
 sheet(`<h2 style="margin-top:0">${g?'Machine '+WASH[g].toLowerCase():'Sortis de la machine'}</h2>${g?'<p class="tiny">Décoche ce qui n’est pas passé dans cette machine.</p>':''}${s.map(i=>`<label class="chk"><input type="checkbox" checked value="${i.id}">${thumb(i,'ph mini')}<span>${esc(i.name)}</span></label>`).join('')}${Object.keys(under()).length?`<label class="chk"><input type="checkbox" id="washUnder" checked><span>🧦 Les dessous aussi</span></label>`:''}<div class="spacer"></div><button class="btn block" data-a="washDo" data-g="${g||''}">C’est propre</button><p class="tiny" style="margin-top:10px">Astuce : lavage à 30 °C et séchage à l’air, c’est moins d’énergie et des vêtements qui durent plus.</p>`);
}

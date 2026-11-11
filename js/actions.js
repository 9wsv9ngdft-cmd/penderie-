// Dress Up — Actions des boutons, formulaire, sauvegarde et restauration, rappels de sécurité des données
"use strict";
/* ---------- actions ---------- */
const A={
 close:closeSheet,
 wxManualOpen(){sheet(`<h2 style="margin-top:0">Quel temps ce matin ?</h2>${manualChips()}<div class="spacer"></div>${S.wx&&S.wx.date===todayKey()?`<button class="btn sm ghost" data-a="wxAuto">Revenir à la météo auto</button>`:''}`)},
 wxBand(el){const t=todayKey();const m=S.manual&&S.manual.date===t?S.manual:{date:t,rain:false};m.band=el.dataset.v;S.manual=m;OUTS=null;save();closeSheet();render()},
 wxRain(){const t=todayKey();const m=S.manual&&S.manual.date===t?S.manual:{date:t,band:effWeather()?.band||'doux'};m.rain=!m.rain;if(!m.band)m.band='doux';S.manual=m;OUTS=null;save();closeSheet();render()},
 wxAuto(){S.manual=null;OUTS=null;save();closeSheet();render()},
 nextOutfit(){flipOutfit(1)},
 goOutfit(el){const n=+el.dataset.k;if(n!==OIDX){SLIDE=n>OIDX?'r':'l';OIDX=n;render()}},
 reroll(){OUTS=null;render();window.scrollTo({top:document.querySelector('h2:last-of-type')?.offsetTop-80||0,behavior:'smooth'})},
 wearOutfit(el){const o=OUTS&&OUTS[+el.dataset.k];if(!o)return;wear(o);render();window.scrollTo({top:0,behavior:'smooth'});toast('Tenue enregistrée 🌿')},
 undo(){undoToday();render()},
 pin(el){const i=item(el.dataset.id);if(i.state==='sale')i.state='porte';if(!S.pins.includes(i.id))S.pins.push(i.id);OUTS=null;save();render()},
 unpin(el){S.pins=S.pins.filter(x=>x!==el.dataset.id);OUTS=null;save();render()},
 toWash(el){const i=item(el.dataset.id);i.state='sale';S.pins=S.pins.filter(x=>x!==i.id);OUTS=null;save();render()},
 stillOk(el){const i=item(el.dataset.id);i.state='porte';OUTS=null;save();render()},
 fCat(el){F.cat=el.dataset.v;render()},
 fState(el){F.state=el.dataset.v;render()},
 open(el){itemSheet(el.dataset.id)},
 setState(el){const i=item(el.dataset.id);i.state=el.dataset.v;if(i.state==='propre')i.sinceWash=0;if(i.state==='sale'||i.state==='reparer')S.pins=S.pins.filter(x=>x!==i.id);OUTS=null;save();itemSheet(i.id);if(VIEW!=='ajout')render()},
 boost(el){const i=item(el.dataset.id);i.boost=true;OUTS=null;save();closeSheet();render();toast('Il sera proposé en priorité')},
 edit(el){EDIT=el.dataset.id;DR=null;closeSheet();if(location.hash==='#ajout')render();else location.hash='ajout'},
 cancelEdit(){EDIT=null;DR=null;location.hash='penderie'},
 removeAsk(el){removeSheet(el.dataset.id)},
 removeDo(el){const i=item(el.dataset.id);i.removed={date:todayKey(),reason:el.dataset.v};S.pins=S.pins.filter(x=>x!==i.id);OUTS=null;save();closeSheet();render();toast(['jete','perdu'].includes(el.dataset.v)?'Retiré de la penderie':'Merci pour sa seconde vie ♻︎')},
 deleteDo(el){const id=el.dataset.id,without=a=>(a||[]).filter(x=>x!==id);
  S.items=S.items.filter(i=>i.id!==id);S.log.forEach(l=>l.ids=without(l.ids));S.pins=without(S.pins);
  S.favs=(S.favs||[]).filter(f=>!f.ids.includes(id));(S.looks||[]).forEach(l=>l.ids=without(l.ids));(S.chals||[]).forEach(c=>{if(c.items)c.items=without(c.items)});
  if(S.trip)S.trip.list=S.trip.list.filter(x=>x.id!==id);S.plan=null;
  photos.delete(id);DB.del('photo:'+id);DB.del('orig:'+id);ORIG.delete(id);squares.delete(id);DB.del('sq:'+id);OUTS=null;save();closeSheet();render()},
 menuOpen(){menuSheet()},
 statInfo(el){statSheet(el.dataset.v)},
 matinMove(el){const o=matinOrder(),i=o.indexOf(el.dataset.v),j=i+(+el.dataset.d);if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];S.matin={...(S.matin||{}),order:o};save();render()},
 matinHide(el){const m=S.matin||(S.matin={}),h=new Set(m.hide||[]),k=el.dataset.v;h.has(k)?h.delete(k):h.add(k);m.hide=[...h];save();render()},
 toolsOpen(){toolsSheet()},
 washOpen(el){washSheet(el&&el.dataset.v)},
 fStored(){F.stored=!F.stored;render()},
 setKg(el){S.machineKg=+el.dataset.v;save();render()},
 hypOpen:hypSheet,
 hyp(el){const H=S.hyp||(S.hyp={});const o=el.dataset.o,f=el.dataset.f,d=+el.dataset.d;const cur=hyp()[o][f];
  H[o]={...(H[o]||{}),[f]:f==='vie'?Math.max(10,Math.min(500,cur+d)):Math.max(.05,Math.min(1.5,Math.round((cur+d)*100)/100))};save();hypSheet();if(VIEW==='bilan')render()},
 hypReset(){S.hyp=null;save();hypSheet();if(VIEW==='bilan')render()},
 seasonSwitch(el){const prev=curSeason(),next=el.dataset.v;if(prev===next)return;S.season=next;S.seasonSnooze=null;OUTS=null;save();render();seasonSheet(prev,next)},
 seasonSnooze(){S.seasonSnooze=todayKey();save();render()},
 swapPhoto(){keepDraftInputs();[DR.photo,DR.orig]=[DR.orig,DR.photo];DR.cutOn=DR.cutOn===false;render()},
 async pasteImg(){
  try{const items=await navigator.clipboard.read();
   for(const it of items){const t=it.types.find(x=>x.startsWith('image/'));if(t){await handleImage(await it.getType(t));return}}
   toast('Pas d’image dans le presse-papiers')}
  catch(e){toast('Collage refusé : enregistre l’image dans Photos puis choisis-la avec « Prendre une photo »')}},
 async cutItem(el){
  const i=item(el.dataset.id),p=photos.get(i.id);if(!p)return;
  if(!S.cut){S.cut=true;save()}
  toast('Détourage en cours…');
  try{const img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=p});
   const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);
   const r=await queued(()=>cutout(c));if(!r){toast('Vêtement pas assez net pour le détourer');return}
   DB.set('orig:'+i.id,p);ORIG.add(i.id);photos.set(i.id,r.url);DB.set('photo:'+i.id,r.url);i.cut=true;i.cutTodo=false;i.cutKeep=false;save();itemSheet(i.id);if(VIEW!=='ajout')render();toast('Fond retiré')}
  catch(e){toast(IN_PREVIEW?'Indisponible dans l’aperçu : marche dans la version en ligne':'Détourage impossible (connexion ?)')}},
 async origBack(el){const id=el.dataset.id,i=item(id),p=await DB.get('orig:'+id);if(!i||!p){toast('Photo d’origine introuvable');return}
  photos.set(id,p);DB.set('photo:'+id,p);DB.del('orig:'+id);ORIG.delete(id);i.cut=false;i.cutTodo=false;i.cutKeep=true;save(); /* on ne la redétourera pas toute seule */itemSheet(id);render();toast('Photo d’origine remise')},
 batchDrop(el){BATCH.items.splice(+el.dataset.k,1);if(!BATCH.items.length)BATCH=null;render()},
 batchCancel(){BATCH=null;render()},
 batchSave(){
  keepBatchInputs();const ids=[];
  for(const b of BATCH.items){const id=uid();b.savedId=id;ids.push(id);
   S.items.push({id,sig:SIG_OK(b.sig)?b.sig:undefined,name:b.name.trim()||`${cat(b.cat).label} ${b.color}`,cat:b.cat,color:b.color,warmth:b.warmth||2,waterproof:!!b.waterproof,origin:null,price:null,mat:b.mat||null,style:b.style||null,season:b.season||seasonGuess(b.name),state:'propre',max:null,added:todayKey(),wears:0,sinceWash:0,lastWorn:null});
   photos.set(id,b.photo);DB.set('photo:'+id,b.photo);saveSquare(id,b.sq)}
  const n=BATCH.items.length,wait=BATCH.items.some(b=>b.pending);BATCH=null;OUTS=null;save();ids.forEach(markCut);save();
  toast(n+' vêtement'+(n>1?'s':'')+' ajouté'+(n>1?'s':'')+(wait?' · reconnaissance en cours':'')+(S.cut?' · fonds retirés plus tard, quand tu ne te sers pas de l’app':''));location.hash='penderie'},
 washDo(el){const g=el&&el.dataset.g;if(g&&fullGroups().includes(g)){const st=S.stats||(S.stats={});st.fullWash=(st.fullWash||0)+1}
  const wu=$('#washUnder');if(wu&&wu.checked)Object.values(under()).forEach(x=>{x.clean=x.total});
  document.querySelectorAll('#sheet input[type=checkbox][value]:checked').forEach(c=>{const i=item(c.value);if(i){i.state='propre';i.sinceWash=0}});OUTS=null;save();closeSheet();render();toast('Tout beau tout propre')},
 dr(el){DR.touched={...(DR.touched||{}),[el.dataset.k]:true};DR[el.dataset.k]=el.dataset.k==='warmth'?+el.dataset.v:el.dataset.v;el.parentElement.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c===el));if(el.dataset.k==='cat'){DR.max=null;$('#maxv').textContent=fmtMax()}},
 maxDec(){const m=DR.max??cat(DR.cat).max;DR.max=Math.max(0,m-1);$('#maxv').textContent=fmtMax()},
 maxInc(){const m=DR.max??cat(DR.cat).max;DR.max=Math.min(30,m+1);$('#maxv').textContent=fmtMax()},
 saveItem(el){
  DR.name=$('#nm').value.trim()||`${cat(DR.cat).label} ${DR.color}`;DR.ref=$('#ref').value.trim();DR.waterproof=$('#wp').checked;DR.price=parsePrice($('#price').value);DR.madeIn=$('#madeIn').value.trim();DR.ecoScore=parseInt($('#ecoScore').value)||null;const bt=$('#bought');if(bt)DR.boughtAt=bt.checked?(DR.boughtAt||todayKey()):null;if(DR.boughtAt&&!EDIT)DR.age=null;
  const {photo,sq,touched,detected,orig,cutOn,fromWish,autoName,dup,...data}=DR;if(orig)data.cut=cutOn!==false;
  if(EDIT){const k=S.items.findIndex(i=>i.id===EDIT);S.items[k]={...S.items[k],...data}}
  else{data.id=uid();data.added=todayKey();data.wears=0;data.sinceWash=data.state==='porte'?1:0;data.lastWorn=null;S.items.push(data)}
  const id=EDIT||data.id;
  if(fromWish&&!EDIT){const w=(S.wishes||[]).find(x=>x.id===fromWish);if(w)w.decided={date:todayKey(),choice:'achete',itemId:id}}
  const newPhoto=!!photo&&photos.get(id)!==photo;
  if(photo){photos.set(id,photo);DB.set('photo:'+id,photo)}
  if(newPhoto){const i=item(id);if(i&&i.cut){i.cut=false;DB.del('orig:'+id);ORIG.delete(id)}}
  saveSquare(id,sq);
  if(newPhoto)markCut(id);OUTS=null;save();
  const name=DR.name,wasEdit=!!EDIT;EDIT=null;DR=null;
  const p3=!wasEdit&&activeChal('p333');
  if(el.dataset.more){render();window.scrollTo({top:0});toast('« '+name+' » ajouté')}
  else{toast(p3?'Enregistré. Il est en pause pendant ton Project 333 : ajoute-le à ta sélection dans Envies si tu veux le porter':'Enregistré');location.hash='penderie'}
 },
 async export(){
  const name=`dressup-${todayKey()}.json`;
  const data=JSON.stringify({app:'penderie',v:1,date:todayKey(),state:S,photos:Object.fromEntries(photos),squares:Object.fromEntries(squares),looks:S.exportLooks?Object.fromEntries(lookPhotos):{}});
  const done=()=>{S.lastExport=todayKey();S.backupSnooze=null;save();toast('Sauvegarde enregistrée');if(VIEW==='matin')render()};
  // iPhone : le lien de téléchargement est peu fiable depuis l'icône de l'écran d'accueil, on passe par « Partager → Enregistrer dans Fichiers »
  if(IS_IOS&&navigator.canShare){
   try{const f=new File([data],name,{type:'application/json'});
    if(navigator.canShare({files:[f]})){await navigator.share({files:[f]});done();return}}
   catch(e){if(e&&e.name==='AbortError'){toast('Sauvegarde annulée');return}}
  }
  try{const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);done()}catch(e){toast('Export impossible ici')}
 },
 wipeAsk(){sheet(`<h2 style="margin-top:0">Tout effacer ?</h2><p>Vêtements, photos et historique seront supprimés de cet appareil. Pense à sauvegarder avant.</p><button class="btn clay block" data-a="wipeDo">Oui, tout effacer</button><div class="spacer"></div><button class="btn ghost block" data-a="close">Annuler</button>`)},
 async wipeDo(){for(const k of await DB.keys())DB.del(k);
  photos.clear();squares.clear();lookPhotos.clear();LOOKSHOW.clear();ORIG.clear();OUTS=null;OIDX=0;EDIT=null;DR=null;BATCH=null;WD=null;INVD=null;TRIPD=null;P333=null;IMPORT=null;F={cat:'all',state:'all'};
  S={v:1,items:[],log:[],pins:[],city:null,wx:null,manual:null,undo:null};save();closeSheet();location.hash='matin';render()},
};
/* ---------- restaurer une sauvegarde : vérifier, confirmer, puis seulement remplacer ---------- */
let IMPORT=null;
// renvoie un message d'erreur, ou null si le fichier est utilisable
function checkBackup(j){
 if(!j||typeof j!=='object'||j.app!=='penderie')return 'Ce fichier n’est pas une sauvegarde Dress Up';
 const st=j.state;
 if(!st||typeof st!=='object'||!Array.isArray(st.items))return 'Sauvegarde incomplète : rien n’a été modifié';
 if(st.items.some(i=>!i||typeof i!=='object'||typeof i.id!=='string'||!i.id))return 'Sauvegarde abîmée : rien n’a été modifié';
 for(const k of ['log','pins'])if(st[k]!=null&&!Array.isArray(st[k]))return 'Sauvegarde abîmée : rien n’a été modifié';
 for(const k of ['photos','squares','looks'])if(j[k]!=null&&(typeof j[k]!=='object'||Array.isArray(j[k])))return 'Sauvegarde abîmée : rien n’a été modifié';
 return null;
}
/* ---------- contrôle complet d'une sauvegarde ----------
   Rien de ce qui vient du fichier n'est repris tel quel : chaque valeur est vérifiée (identifiant, date, nombre,
   choix dans une liste, vraie image) et l'état est reconstruit champ par champ. Ce qui est inconnu est ignoré. */
const ID_RE=/^[A-Za-z0-9_-]{1,64}$/,DATE_RE=/^\d{4}-\d{2}-\d{2}$/,IMG_RE=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const cs={
 id:v=>typeof v==='string'&&ID_RE.test(v)?v:null,
 date:v=>typeof v==='string'&&DATE_RE.test(v)&&!isNaN(Date.parse(v))?v:null,
 str:(v,n=120)=>typeof v==='string'?v.slice(0,n):'',
 num:(v,min=0,max=1e6)=>{const n=typeof v==='number'||typeof v==='string'&&v.trim()?Number(v):NaN;return Number.isFinite(n)?Math.min(max,Math.max(min,n)):null},
 int:(v,min=0,max=1e6)=>{const n=cs.num(v,min,max);return n===null?null:Math.round(n)},
 key:(v,o)=>typeof v==='string'&&has(o,v)?v:null,
 keys:(v,o)=>Array.isArray(v)?[...new Set(v.filter(x=>cs.key(x,o)))]:[],
 obj:v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},
 arr:v=>Array.isArray(v)?v:[],
 img:v=>typeof v==='string'&&v.length<4e6&&IMG_RE.test(v)?v:null,
};
const setOf=list=>Object.fromEntries(list.map(x=>[Array.isArray(x)?x[0]:x.id||x,1]));
function cleanItem(raw){
 const i=cs.obj(raw),id=cs.id(i.id);if(!id)return null;
 const c=cs.key(i.cat,setOf(CATS))||'haut';
 const o={id,name:cs.str(i.name,80).trim()||cat(c).label,cat:c,color:cs.key(i.color,setOf(COLORS))||'',warmth:cs.int(i.warmth,1,3)||2,waterproof:!!i.waterproof,
  origin:cs.key(i.origin,ORIGINS)||(i.secondHand?'occasion':null),price:cs.num(i.price,0,1e5)||null,season:cs.key(i.season,SEASONS)||'toutes',wash:cs.key(i.wash,WASH)||'',
  occ:cs.keys(i.occ,OCCS),state:cs.key(i.state,STATES)||'propre',max:i.max==null?null:cs.int(i.max,0,30),
  added:cs.date(i.added)||todayKey(),wears:cs.int(i.wears,0,1e5)||0,sinceWash:cs.int(i.sinceWash,0,1e3)||0,lastWorn:cs.date(i.lastWorn)};
 const st=cs.keys(i.style,STYLES);if(st.length)o.style=st;
 const put=(k,v)=>{if(v!==null&&v!==''&&v!==false&&v!==undefined)o[k]=v};
 put('mat',cs.key(i.mat,MATIERES));put('age',cs.key(i.age,AGES));put('boughtAt',cs.date(i.boughtAt));
 put('madeIn',cs.str(i.madeIn,40));put('ref',cs.str(i.ref,300));put('size',cs.str(i.size,20));put('etat',ETATS.includes(i.etat)?i.etat:null);
 if(SIG_OK(i.sig))o.sig={h:i.sig.h,c:i.sig.c.map(v=>cs.int(v,0,255)||0)};
 put('ecoScore',cs.int(i.ecoScore,0,1e5));put('resale',cs.num(i.resale,0,1e5));put('askPrice',cs.num(i.askPrice,0,1e5));
 put('repairKind',cs.key(i.repairKind,KINDS));put('repaired',cs.int(i.repaired,0,1e3));
 for(const k of ['boost','swap','cut','express','cutTodo','cutKeep','cutFail'])put(k,i[k]===true);
 const rm=cs.obj(i.removed),rr=cs.key(rm.reason,setOf(REASONS));if(rr)o.removed={date:cs.date(rm.date)||todayKey(),reason:rr};
 const sale=cs.obj(i.sale),ss=cs.date(sale.since);if(ss)o.sale={since:ss,price:cs.num(sale.price,0,1e5)||null};
 const loan=cs.obj(i.loan),ls=cs.date(loan.since);if(ls&&cs.str(loan.to,40).trim())o.loan={to:cs.str(loan.to,40).trim(),since:ls};
 return o;
}
function cleanState(raw){
 const s=cs.obj(raw),seen=new Set();
 const items=cs.arr(s.items).map(cleanItem).filter(i=>i&&!seen.has(i.id)&&seen.add(i.id));
 const kid=v=>cs.arr(v).map(cs.id).filter(x=>x&&seen.has(x));
 const o={v:1,items,pins:kid(s.pins),city:null,wx:null,manual:null,undo:null,onboarded:!!s.onboarded||items.length>0,seenVer:cs.int(s.seenVer)||0,matin:(()=>{const m=cs.obj(s.matin);return{order:cs.keys(m.order,MATIN),hide:cs.keys(m.hide,MATIN)}})(),
  log:cs.arr(s.log).map(l=>{l=cs.obj(l);const d=cs.date(l.date);return d?{date:d,ids:kid(l.ids),occ:cs.key(l.occ,OCCS)||'quotidien'}:null}).filter(Boolean)};
 const put=(k,v)=>{if(v!==null&&v!==undefined)o[k]=v};
 const c=cs.obj(s.city),lat=cs.num(c.lat,-90,90),lon=cs.num(c.lon,-180,180);if(cs.str(c.name,60).trim()&&lat!==null&&lon!==null)o.city={name:cs.str(c.name,60).trim(),lat,lon};
 put('machineKg',cs.int(s.machineKg,5,10));put('season',cs.key(s.season,{ete:1,hiver:1}));put('seasonSnooze',cs.date(s.seasonSnooze));put('photoSkip',cs.date(s.photoSkip));
 const ints=cs.keys(s.interests,INTERESTS);if(ints.length)o.interests=ints;
 for(const k of ['ai','cut','exportLooks'])if(s[k]===true)o[k]=true;
 if(s.hyp){o.hyp={};for(const k in HYP0){const h=cs.obj(cs.obj(s.hyp)[k]),e={};const v=cs.int(h.vie,10,500),r=cs.num(h.ratio,.05,1.5);if(v)e.vie=v;if(r)e.ratio=r;o.hyp[k]=e}}
 if(s.under){o.under={};for(const [k] of UNDER){const u=cs.obj(cs.obj(s.under)[k]),t=cs.int(u.total,0,200);if(t)o.under[k]={total:t,clean:Math.min(t,cs.int(u.clean,0,200)??t),uses:cs.int(u.uses,0,1e5)||0}}}
 if(s.agenda){o.agenda={};for(let d=0;d<7;d++){const v=cs.key(cs.obj(s.agenda)[d],OCCS);if(v)o.agenda[d]=v}}
 if(s.dayPlan){o.dayPlan={};for(const [k,v] of Object.entries(cs.obj(s.dayPlan))){if(!cs.date(k))continue;const e=cs.obj(v),d={};const oc=cs.key(e.occ,OCCS),mo=cs.key(e.mood,MOODS);if(oc)d.occ=oc;if(mo)d.mood=mo;o.dayPlan[k]=d}}
 if(s.bot){const b=cs.obj(s.bot),f=cs.obj(b.fb);o.bot={name:cs.str(b.name,30).trim(),tone:cs.key(b.tone,TONES)||'complice',budget:cs.num(b.budget,0,1e5)||null,fb:{up:cs.int(f.up)||0,down:cs.int(f.down)||0,streak:cs.int(f.streak)||0}};const pr=cs.obj(b.prefs);o.bot.prefs={styles:cs.arr(pr.styles).filter(k=>k in STYLES||k==='crea'),goal:cs.key(pr.goal,GOALS)||null,colors:cs.arr(pr.colors).filter(n=>COLORS.some(c=>c[0]===n))}}
 const list=(k,fn)=>{const out=cs.arr(s[k]).map(x=>fn(cs.obj(x))).filter(Boolean);if(out.length)o[k]=out};
 list('favs',f=>{const id=cs.id(f.id),ids=kid(f.ids);return id&&ids.length?{id,ids,occ:cs.key(f.occ,OCCS)||'quotidien',added:cs.date(f.added)||todayKey(),last:cs.date(f.last)}:null});
 list('looks',l=>{const id=cs.id(l.id),d=cs.date(l.date);return id&&d?{id,date:d,ids:kid(l.ids)}:null});
 list('wishes',w=>{const id=cs.id(w.id);if(!id)return null;const c=cs.key(w.cat,setOf(CATS))||'haut',dc=cs.obj(w.decided),ch=cs.key(dc.choice,{achete:1,renonce:1});
  const x={id,name:cs.str(w.name,80).trim()||cat(c).label,cat:c,color:cs.key(w.color,setOf(COLORS))||'noir',price:cs.num(w.price,0,1e5)||null,ref:cs.str(w.ref,300),added:cs.date(w.added)||todayKey(),decided:ch?{date:cs.date(dc.date)||todayKey(),choice:ch}:null};
  if(cs.date(w.from))x.from=w.from;if(x.decided&&cs.id(dc.itemId))x.decided.itemId=dc.itemId;return x});
 list('chals',c=>{const id=cs.id(c.id),t=cs.key(c.type,CHAL),st=cs.date(c.start);if(!id||!t||!st)return null;
  const x={id,type:t,start:st,days:cs.int(c.days,1,365)||CHAL[t].d,status:cs.key(c.status,{encours:1,reussi:1,rate:1,abandon:1})||'abandon'};if(cs.date(c.end))x.end=c.end;if(t==='p333')x.items=kid(c.items);return x});
 if(s.stats){const t=cs.obj(s.stats);o.stats={};for(const k of ['fullWash','repairs','botDrops']){const v=cs.int(t[k]);if(v)o.stats[k]=v}const rc=cs.num(t.repairCo2,0,1e6);if(rc)o.stats.repairCo2=rc}
 if(s.badges){o.badges={};for(const [id] of BADGES){const d=cs.date(cs.obj(s.badges)[id]);if(d)o.badges[id]=d}}
 const t=cs.obj(s.trip),ts=cs.date(t.start);
 if(ts&&cs.str(t.dest,60).trim())o.trip={dest:cs.str(t.dest,60).trim(),start:ts,days:cs.int(t.days,1,21)||1,wx:cs.str(t.wx,80),tip:cs.str(t.tip,200),
  list:cs.arr(t.list).slice(0,60).map(x=>{x=cs.obj(x);const id=cs.id(x.id);return id&&seen.has(id)?{id,ok:!!x.ok}:cs.str(x.label,80)?{label:cs.str(x.label,80),ok:!!x.ok}:null}).filter(Boolean)};
 return o; // la discussion avec l'assistant, la météo et le planning ne sont pas repris : ils se refont tout seuls
}
function cleanBackup(j){
 const state=cleanState(j.state),ids=new Set([...state.items.map(i=>i.id),...(state.wishes||[]).map(w=>w.id)]),lk=new Set((state.looks||[]).map(l=>l.id));
 const pics=(o,ok)=>Object.fromEntries(Object.entries(cs.obj(o)).filter(([id,p])=>cs.id(id)&&ok.has(id)&&cs.img(p)));
 const raw=cs.arr(cs.obj(j.state).items).length;
 return{app:'penderie',date:cs.date(j.date),state,photos:pics(j.photos,ids),squares:pics(j.squares,ids),looks:pics(j.looks,lk),dropped:raw-state.items.length};
}
// Au démarrage : on répare ce qui ferait planter un écran, sans jamais retirer une information.
function tidy(){
 for(const k of ['items','log','pins'])if(!Array.isArray(S[k]))S[k]=[];
 S.items=S.items.filter(i=>i&&typeof i==='object'&&i.id);
 S.items.forEach(i=>{
  if(!CATS.some(c=>c.id===i.cat))i.cat='haut';
  if(typeof i.name!=='string'||!i.name.trim())i.name=cat(i.cat).label;
  if(!STATES[i.state])i.state='propre';
  if(i.occ)i.occ=cs.keys(i.occ,OCCS);if(i.style)i.style=cs.keys(i.style,STYLES);
  if(i.mat&&!MATIERES[i.mat])i.mat=null;if(i.season&&!SEASONS[i.season])i.season='toutes';if(i.wash&&!WASH[i.wash])i.wash='';if(i.age&&!AGES[i.age])i.age=null;
  if(typeof i.color!=='string')i.color='';if(!cs.date(i.added))i.added=todayKey();if(i.lastWorn&&!cs.date(i.lastWorn))i.lastWorn=null;
  i.wears=cs.int(i.wears,0,1e5)||0;i.sinceWash=cs.int(i.sinceWash,0,1e3)||0;
  if(!i.origin&&i.secondHand)i.origin='occasion';
 });
 S.log=S.log.filter(l=>l&&cs.date(l.date)&&Array.isArray(l.ids));
 // les exceptions de « Ma semaine » passées ne servent plus
 if(S.dayPlan)for(const k of Object.keys(S.dayPlan))if(k<todayKey())delete S.dayPlan[k];
}
function importAsk(){
 const j=IMPORT;if(!j)return;const n=j.state.items.filter(i=>!i.removed).length,p=Object.keys(j.photos||{}).length,cur=active().length;
 const d=/^\d{4}-\d{2}-\d{2}$/.test(j.date||'')?new Date(j.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):null;
 sheet(`<h2 style="margin-top:0">Remplacer ta penderie ?</h2>
 <p>Sauvegarde${d?' du '+d:''} : <b>${n} vêtement${n>1?'s':''}</b>, ${p} photo${p>1?'s':''}.</p>
 ${j.dropped?`<p class="tiny">${j.dropped} fiche${j.dropped>1?'s':''} illisible${j.dropped>1?'s':''} dans le fichier : ignorée${j.dropped>1?'s':''}.</p>`:''}
 <p>${cur?`Ta penderie actuelle (<b>${cur} vêtement${cur>1?'s':''}</b>) sera remplacée, photos et historique compris.`:'Ta penderie actuelle est vide.'}</p>
 <button class="btn ${cur?'clay':''} block" data-a="importDo">${cur?'Oui, remplacer':'Restaurer'}</button><div class="spacer"></div><button class="btn ghost block" data-a="importCancel">Annuler</button>`);
}
async function importDo(){
 const j=IMPORT;IMPORT=null;if(!j||!j.state||!Array.isArray(j.state.items)){closeSheet();return}
 // on garde les étiquettes du modèle d'IA : elles ne font pas partie de la sauvegarde
 for(const k of await DB.keys())if(!String(k).startsWith('clip-'))DB.del(k);
 photos.clear();squares.clear();lookPhotos.clear();ORIG.clear();
 S=j.state; // déjà contrôlé et reconstruit par cleanBackup
 Object.entries(j.photos).forEach(([id,p])=>{photos.set(id,p);DB.set('photo:'+id,p)});
 Object.entries(j.squares).forEach(([id,p])=>saveSquare(id,p));
 Object.entries(j.looks).forEach(([id,p])=>{lookPhotos.set(id,p);DB.set('look:'+id,p)});
 S.lastExport=todayKey();save();OUTS=null;EDIT=null;DR=null;BATCH=null;closeSheet();render();toast('Penderie restaurée');
}
Object.assign(A,{importDo,importCancel(){IMPORT=null;closeSheet()},
 installSnooze(){S.installSnooze=todayKey();save();render()},
 backupSnooze(){S.backupSnooze=todayKey();save();render()}});

/* ---------- garder ses données à l'abri : écran d'accueil sur iPhone, sauvegarde régulière ---------- */
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const STANDALONE=navigator.standalone===true||(typeof matchMedia==='function'&&matchMedia('(display-mode: standalone)').matches);
function safetyNotice(){
 if(IN_PREVIEW||!active().length)return'';
 // Safari (hors icône de l'écran d'accueil) efface les données d'un site après 7 jours sans visite
 if(IS_IOS&&!STANDALONE&&!(S.installSnooze&&daysSince(S.installSnooze)<14))
  return `<div class="notice"><b>Mets ta penderie à l’abri.</b> Dans Safari, les données d’un site peuvent être effacées après 7 jours sans visite. Avec l’icône sur l’écran d’accueil, elles restent.
  <br><span class="tiny">1. Sauvegarde ci-dessous. 2. Partager → « Sur l’écran d’accueil ». 3. Ouvre l’icône, puis Réglages → Restaurer (l’icône démarre avec une penderie vide).</span>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-a="export">Sauvegarder (fichier)</button><button class="btn sm ghost" data-a="installSnooze">Plus tard</button></div></div>`;
 const since=S.lastExport?daysSince(S.lastExport):null,old=Math.min(...active().map(i=>Date.parse(i.added)||Date.now()));
 const due=since===null?(Date.now()-old)/864e5>=7&&active().length>=5:since>=30;
 if(due&&!(S.backupSnooze&&daysSince(S.backupSnooze)<7))
  return `<div class="notice">${since===null?'Pas encore de sauvegarde':`Dernière sauvegarde il y a ${since} jours`} : un fichier de côté, et ta penderie ne craint plus rien.
  <div class="row" style="margin-top:8px"><button class="btn sm" data-a="export">Sauvegarder (fichier)</button><button class="btn sm ghost" data-a="backupSnooze">Plus tard</button></div></div>`;
 return'';
}
const fmtMax=()=>{const m=DR.max??cat(DR.cat).max;return m===0?'jamais sale':m};

document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const f=A[el.dataset.a];if(f){e.preventDefault();f(el);a11y(document)}}); // a11y : les puces cochées sur place gardent leur état annoncé
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-f=city]');if(!f)return;e.preventDefault();setCity(f.city.value)});
function parsePrice(v){
 let t=String(v??'').replace(/[^0-9.,]/g,'');
 if(t.includes(',')&&t.includes('.'))t=t.replace(/\./g,''); // le point sépare les milliers : « 1.200,50 »
 const n=parseFloat(t.replace(',','.'));return n>0?Math.round(n*100)/100:null;
}
function keepDraftInputs(){if(!DR)return;const mi=$('#madeIn'),es=$('#ecoScore');if(mi)DR.madeIn=mi.value;if(es)DR.ecoScore=parseInt(es.value)||null;const n=$('#nm'),r=$('#ref'),wp=$('#wp'),pr=$('#price');if(n)DR.name=n.value;if(r)DR.ref=r.value;if(wp)DR.waterproof=wp.checked;if(pr)DR.price=parsePrice(pr.value)}
async function handleImage(blob){
 try{const {shot}=await shotFromFile(blob);takeShots([shot])}catch(err){toast('Image illisible')}
}
document.addEventListener('paste',e=>{if(VIEW!=='ajout'||BATCH)return;const f=[...((e.clipboardData&&e.clipboardData.items)||[])].find(i=>i.type.startsWith('image/'));if(f){e.preventDefault();handleImage(f.getAsFile())}});
document.addEventListener('change',e=>{if(e.target.id==='expLooks'){S.exportLooks=e.target.checked;save()}});
document.addEventListener('change',async e=>{
 if(e.target.id==='pic'&&e.target.files[0])handleImage(e.target.files[0]);
 if(e.target.id==='cuttog'){S.cut=e.target.checked;save();
  if(S.cut){S.items.forEach(i=>markCut(i.id));save();cutMsg('Chargement…');cutLoad().then(()=>{toast('Détourage prêt : tes photos seront détourées quand tu ne te sers pas de l’app')}).catch(()=>{S.cut=false;save();toast(IN_PREVIEW?'Indisponible dans l’aperçu : marche dans la version en ligne':'Téléchargement impossible (connexion ?)');render()})}}
 if(e.target.id==='aitog'){S.ai=e.target.checked;save();
  if(S.ai){aiMsg('Chargement…');aiLoad().then(()=>{toast('Reconnaissance prête');GUESS_FAIL=false}).catch(()=>{S.ai=false;save();toast(IN_PREVIEW?'Indisponible dans l’aperçu : marche dans la version complète':'Téléchargement impossible (connexion ?)');render()})}}
 if(e.target.id==='imp'&&e.target.files[0]){const f=e.target.files[0];e.target.value='';
  try{const j=JSON.parse(await f.text());const err=checkBackup(j);if(err)throw err;IMPORT=cleanBackup(j);importAsk()}catch(err){IMPORT=null;toast(typeof err==='string'?err:'Fichier non reconnu')}}
});

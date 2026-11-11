// Dress Up — Actions et événements
"use strict";
/* ---------- actions ---------- */
const A={
 close:closeSheet,
 wxManualOpen(){sheet(`<h2 style="margin-top:0">Quel temps ce matin ?</h2>${manualChips()}<div class="spacer"></div>${S.wx&&S.wx.date===todayKey()?`<button class="btn sm ghost" data-a="wxAuto">Revenir à la météo auto</button>`:''}`)},
 wxBand(el){const t=todayKey();const m=S.manual&&S.manual.date===t?S.manual:{date:t,rain:false};m.band=el.dataset.v;S.manual=m;OUTS=null;save();closeSheet();render()},
 wxRain(){const t=todayKey();const m=S.manual&&S.manual.date===t?S.manual:{date:t,band:effWeather()?.band||'doux'};m.rain=!m.rain;if(!m.band)m.band='doux';S.manual=m;OUTS=null;save();closeSheet();render()},
 wxAuto(){S.manual=null;OUTS=null;save();closeSheet();render()},
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
 deleteDo(el){const id=el.dataset.id;S.items=S.items.filter(i=>i.id!==id);S.log.forEach(l=>l.ids=l.ids.filter(x=>x!==id));photos.delete(id);DB.del('photo:'+id);OUTS=null;save();closeSheet();render()},
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
   const r=await cutout(c);if(!r){toast('Vêtement pas assez net pour le détourer');return}
   photos.set(i.id,r.url);DB.set('photo:'+i.id,r.url);i.cut=true;save();itemSheet(i.id);if(VIEW!=='ajout')render();toast('Fond retiré')}
  catch(e){toast(IN_PREVIEW?'Indisponible dans l’aperçu : marche dans la version en ligne':'Détourage impossible (connexion ?)')}},
 batchDrop(el){BATCH.items.splice(+el.dataset.k,1);if(!BATCH.items.length)BATCH=null;render()},
 batchCancel(){BATCH=null;render()},
 batchSave(){
  document.querySelectorAll('[data-bi]').forEach(f=>{const b=BATCH.items[+f.dataset.bi];if(b)b[f.dataset.bf]=f.value});
  for(const b of BATCH.items){const id=uid();
   S.items.push({id,name:b.name.trim()||`${cat(b.cat).label} ${b.color}`,cat:b.cat,color:b.color,warmth:b.warmth||2,waterproof:!!b.waterproof,origin:null,price:null,season:seasonGuess(b.name),state:'propre',max:null,added:todayKey(),wears:0,sinceWash:0,lastWorn:null});
   photos.set(id,b.photo);DB.set('photo:'+id,b.photo)}
  const n=BATCH.items.length;BATCH=null;OUTS=null;save();toast(n+' vêtements ajoutés');location.hash='penderie'},
 washDo(){document.querySelectorAll('#sheet input[type=checkbox]:checked').forEach(c=>{const i=item(c.value);i.state='propre';i.sinceWash=0});OUTS=null;save();closeSheet();render();toast('Tout beau tout propre')},
 dr(el){DR.touched={...(DR.touched||{}),[el.dataset.k]:true};DR[el.dataset.k]=el.dataset.k==='warmth'?+el.dataset.v:el.dataset.v;el.parentElement.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c===el));if(el.dataset.k==='cat'){DR.max=null;$('#maxv').textContent=fmtMax()}},
 maxDec(){const m=DR.max??cat(DR.cat).max;DR.max=Math.max(0,m-1);$('#maxv').textContent=fmtMax()},
 maxInc(){const m=DR.max??cat(DR.cat).max;DR.max=Math.min(30,m+1);$('#maxv').textContent=fmtMax()},
 saveItem(el){
  DR.name=$('#nm').value.trim()||`${cat(DR.cat).label} ${DR.color}`;DR.ref=$('#ref').value.trim();DR.waterproof=$('#wp').checked;DR.price=parsePrice($('#price').value);const bt=$('#bought');if(bt)DR.boughtAt=bt.checked?(DR.boughtAt||todayKey()):null;if(DR.boughtAt&&!EDIT)DR.age=null;
  const {photo,touched,detected,orig,cutOn,fromWish,...data}=DR;if(orig)data.cut=cutOn!==false;
  if(EDIT){const k=S.items.findIndex(i=>i.id===EDIT);S.items[k]={...S.items[k],...data}}
  else{data.id=uid();data.added=todayKey();data.wears=0;data.sinceWash=data.state==='porte'?1:0;data.lastWorn=null;S.items.push(data)}
  const id=EDIT||data.id;
  if(fromWish&&!EDIT){const w=(S.wishes||[]).find(x=>x.id===fromWish);if(w)w.decided={date:todayKey(),choice:'achete',itemId:id}}
  if(photo){photos.set(id,photo);DB.set('photo:'+id,photo)}
  OUTS=null;save();
  const name=DR.name;EDIT=null;DR=null;
  if(el.dataset.more){render();window.scrollTo({top:0});toast('« '+name+' » ajouté')}
  else{toast('Enregistré');location.hash='penderie'}
 },
 export(){
  const data=JSON.stringify({app:'penderie',v:1,date:todayKey(),state:S,photos:Object.fromEntries(photos)});
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=`dressup-${todayKey()}.json`;document.body.appendChild(a);a.click();a.remove();toast('Sauvegarde téléchargée')}catch(e){toast('Export impossible ici')}
 },
 wipeAsk(){sheet(`<h2 style="margin-top:0">Tout effacer ?</h2><p>Vêtements, photos et historique seront supprimés de cet appareil. Pense à sauvegarder avant.</p><button class="btn clay block" data-a="wipeDo">Oui, tout effacer</button><div class="spacer"></div><button class="btn ghost block" data-a="close">Annuler</button>`)},
 async wipeDo(){for(const k of await DB.keys())DB.del(k);photos.clear();S={v:1,items:[],log:[],pins:[],city:null,wx:null,manual:null,undo:null};save();closeSheet();location.hash='matin';render()},
};
const fmtMax=()=>{const m=DR.max??cat(DR.cat).max;return m===0?'jamais sale':m};

document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const f=A[el.dataset.a];if(f){e.preventDefault();f(el)}});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-f=city]');if(!f)return;e.preventDefault();setCity(f.city.value)});
const parsePrice=v=>{const n=parseFloat(String(v||'').replace(',','.').replace(/[^0-9.]/g,''));return n>0?Math.round(n*100)/100:null};
function keepDraftInputs(){if(!DR)return;const n=$('#nm'),r=$('#ref'),wp=$('#wp'),pr=$('#price');if(n)DR.name=n.value;if(r)DR.ref=r.value;if(wp)DR.waterproof=wp.checked;if(pr)DR.price=parsePrice(pr.value)}
async function handleImage(blob){
 if(!DR)DR=newDraft();keepDraftInputs();
 if((S.ai&&!AI)||(S.cut&&!CUT))toast('Analyse…');else if(S.cut)toast('Détourage…');
 try{const {canvas}=await compress(blob);const r=await analyzeCanvas(canvas);const t=DR.touched||{};
  DR.photo=r.photo;DR.orig=r.orig||null;DR.cutOn=r.orig?true:undefined;
  if(!t.color)DR.color=r.color;
  if(r.cat&&!t.cat&&!EDIT){DR.cat=r.cat;DR.max=null;if(!t.warmth)DR.warmth=r.warmth;if(r.waterproof)DR.waterproof=true;if(!t.season)DR.season=seasonGuess(r.noun)}
  if(!DR.name.trim()&&!EDIT)DR.name=r.motif?r.noun:`${r.noun||cat(DR.cat).label} ${DR.color==='motif'?'à motif':DR.color}`;
  DR.detected=[r.noun||(r.cat?cat(r.cat).label:null),DR.color].filter(Boolean).join(' · ');
  if(r.aiErr||r.cutErr)toast(IN_PREVIEW?'IA indisponible dans l’aperçu':'Une partie de l’analyse a échoué (connexion ?)');
  render()}catch(err){toast('Image illisible')}
}
document.addEventListener('paste',e=>{if(VIEW!=='ajout'||BATCH)return;const f=[...((e.clipboardData&&e.clipboardData.items)||[])].find(i=>i.type.startsWith('image/'));if(f){e.preventDefault();handleImage(f.getAsFile())}});
document.addEventListener('change',async e=>{
 if(e.target.id==='pic'&&e.target.files[0])handleImage(e.target.files[0]);
 if(e.target.id==='multi'&&e.target.files.length){
  const files=[...e.target.files];BATCH={busy:true,done:0,total:files.length,items:[]};render();
  for(const f of files){try{const r=await analyze(f);
    BATCH.items.push({photo:r.photo,color:r.color,cat:r.cat||'haut',guessed:!!r.cat,warmth:r.warmth||2,waterproof:!!r.waterproof,name:r.motif?r.noun:`${r.noun||(r.cat?cat(r.cat).label:'Vêtement')} ${r.color==='motif'?'à motif':r.color}`})}catch(err){}
   BATCH.done++;render()}
  BATCH.busy=false;if(!BATCH.items.length){BATCH=null;toast('Photos illisibles')}render()}
 if(e.target.id==='cuttog'){S.cut=e.target.checked;save();
  if(S.cut){cutMsg('Chargement…');cutLoad().then(()=>{toast('Détourage prêt')}).catch(()=>{S.cut=false;save();toast(IN_PREVIEW?'Indisponible dans l’aperçu : marche dans la version en ligne':'Téléchargement impossible (connexion ?)');if(VIEW==='ajout')render()})}}
 if(e.target.id==='aitog'){S.ai=e.target.checked;save();
  if(S.ai){aiMsg('Chargement…');aiLoad().then(()=>{toast('Reconnaissance prête');if(VIEW==='ajout')render()}).catch(()=>{S.ai=false;save();toast(IN_PREVIEW?'Indisponible dans l’aperçu : marche dans la version complète':'Téléchargement impossible (connexion ?)');if(VIEW==='ajout')render()})}}
 if(e.target.id==='imp'&&e.target.files[0]){try{const j=JSON.parse(await e.target.files[0].text());if(j.app!=='penderie')throw 0;
   for(const k of await DB.keys())DB.del(k);photos.clear();S=Object.assign({v:1,items:[],log:[],pins:[]},j.state);
   Object.entries(j.photos||{}).forEach(([id,p])=>{photos.set(id,p);DB.set('photo:'+id,p)});save();OUTS=null;render();toast('Penderie restaurée')}catch(err){toast('Fichier non reconnu')}}
});

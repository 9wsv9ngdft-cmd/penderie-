// Dress Up — Scanner : caméra plein écran avec un carré, en rafale.
// L'image entière sert à reconnaître le vêtement (et au détourage), le carré donne la vignette « tissu ».
"use strict";

const squares=new Map(); // id -> vignette carrée (gros plan sur la matière)
const SQ=400;
let SCAN=null; // {mode:'batch'|'single', stream, pending, n}

function cropSquare(src,x,y,s){const c=document.createElement('canvas');c.width=c.height=SQ;c.getContext('2d').drawImage(src,x,y,s,s,0,0,SQ,SQ);return c}
function downscale(src,w,h,max=640){const k=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(src,0,0,c.width,c.height);return c}
const sqColor=c=>colorFromPixels(c.getContext('2d').getImageData(0,0,c.width,c.height));

// analyse complète d'une prise : vêtement entier + carré
async function processShot(full,sq){
 const r=await analyzeCanvas(full);
 r.sq=sq.toDataURL('image/jpeg',.8);
 if(!r.motif)r.color=sqColor(sq); // la couleur est lue dans le carré, sans le fond
 return r;
}
function resultToBatch(r){
 return{photo:r.photo,sq:r.sq,color:r.color,cat:r.cat||'haut',guessed:!!r.cat,warmth:r.warmth||2,waterproof:!!r.waterproof,mat:r.mat||null,style:r.style||null,season:r.noun?seasonGuess(r.noun):'toutes',
  name:r.motif?r.noun:`${r.noun||(r.cat?cat(r.cat).label:'Vêtement')} ${r.color==='motif'?'à motif':r.color}`};
}

/* ---------- interface ---------- */
function scanUI(){
 const el=document.createElement('div');el.id='scan';
 el.innerHTML=`<video playsinline autoplay muted></video><div class="scan-frame"><span class="scan-ok">✓ Suivant !</span></div>
 <div class="scan-top"><button class="scan-x" data-a="scanClose" aria-label="Fermer">✕</button><span id="scanHint">Place le vêtement dans le carré</span></div>
 <div class="scan-strip" id="scanStrip"></div>
 <div class="scan-bar"><label class="scan-side">Galerie<input type="file" accept="image/*" ${SCAN.mode==='batch'?'multiple':''} id="scanGal" hidden></label>
 <button class="scan-shot" data-a="scanShot" aria-label="Prendre"></button>
 <button class="scan-side" data-a="scanDone" id="scanDone">${SCAN.mode==='batch'?'Terminer':'Annuler'}</button></div>`;
 document.body.appendChild(el);return el;
}
async function scanOpen(mode){
 if($('#scan'))return; // déjà ouvert (double appui)
 SCAN={mode,stream:null,pending:0,n:0};
 if(mode==='batch')BATCH={busy:false,done:0,total:0,items:[]};
 scanUI();warmModels();await scanCam();
}
// (re)démarre la caméra : à l'ouverture, au retour d'arrière-plan, ou si iOS a coupé le flux
async function scanCam(){
 const el=$('#scan');if(!el||!SCAN||SCAN.stream||SCAN.starting)return;SCAN.starting=true;const mine=SCAN;
 try{
  const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1920}},audio:false});
  if(SCAN!==mine||!$('#scan')||document.hidden){st.getTracks().forEach(t=>t.stop());return} // fermé entre-temps
  SCAN.stream=st;st.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(SCAN===mine&&SCAN.stream===st){SCAN.stream=null;if(!document.hidden)scanCam()}}));
  const v=el.querySelector('video');v.srcObject=st;await v.play().catch(()=>{});
  el.classList.remove('nocam');scanHint();
 }catch(e){
  $('#scanHint').textContent=IN_PREVIEW?'Caméra indisponible dans l’aperçu : utilise « Galerie ».':'Caméra refusée : utilise « Galerie », ou autorise la caméra dans les réglages du navigateur.';
  el.classList.add('nocam');
 }finally{mine.starting=false}
}
function scanPause(){if(SCAN&&SCAN.stream){const st=SCAN.stream;SCAN.stream=null;st.getTracks().forEach(t=>t.stop())}}
document.addEventListener('visibilitychange',()=>{if(!$('#scan'))return;if(document.hidden)scanPause();else scanCam()});
function scanHint(){const h=$('#scanHint');if(h&&SCAN&&!$('#scan').classList.contains('nocam'))h.textContent=SCAN.pending>1?`Continue : ${SCAN.pending} photos en attente d’analyse`:'Place le vêtement dans le carré'}
function scanClose(){
 scanPause();
 const el=$('#scan');if(el)el.remove();
}
function scanCount(){
 const d=$('#scanDone');if(d&&SCAN.mode==='batch')d.textContent=SCAN.n?`Terminer (${SCAN.n})`:'Terminer';
}
function addStrip(sq){const s=$('#scanStrip');if(!s)return;const i=document.createElement('div');i.style.backgroundImage=`url('${sq.toDataURL('image/jpeg',.6)}')`;s.prepend(i)}

async function handleShot(full,sq){
 if(SCAN.mode==='single'){
  scanClose();toast(S.cut||S.ai?'Analyse…':'Photo prise');
  try{const r=await processShot(full,sq);applyDraftResult(r)}catch(e){toast('Image illisible')}
  return;
 }
 const scan=SCAN,batch=BATCH; // l'analyse attend son tour : la rafale ne lance plus tout en même temps
 scan.n++;scan.pending++;batch.total++;scanCount();addStrip(sq);scanHint();
 try{const r=await processShot(full,sq);batch.items.push(resultToBatch(r))}catch(e){}
 scan.pending--;batch.done++;scanHint();
 if(BATCH!==batch)return; // rafale annulée entre-temps
 if(!$('#scan')&&VIEW==='ajout'){BATCH.busy=SCAN.pending>0;render()}
}
// prise de vue : le carré affiché à l'écran est converti en coordonnées de l'image vidéo
function shoot(){
 const v=$('#scan video'),f=$('#scan .scan-frame');if(!v||!v.videoWidth){toast('Caméra pas prête');return}
 const VW=v.videoWidth,VH=v.videoHeight,vr=v.getBoundingClientRect(),fr=f.getBoundingClientRect();
 const s=Math.max(vr.width/VW,vr.height/VH),ox=vr.left+(vr.width-VW*s)/2,oy=vr.top+(vr.height-VH*s)/2;
 const sx=(fr.left-ox)/s,sy=(fr.top-oy)/s,ss=fr.width/s;
 const raw=document.createElement('canvas');raw.width=VW;raw.height=VH;raw.getContext('2d').drawImage(v,0,0);
 const sq=cropSquare(raw,Math.max(0,sx),Math.max(0,sy),Math.min(ss,VW,VH));
 const full=downscale(raw,VW,VH);
 snap();
 handleShot(full,sq);
}
async function fromFile(file){
 const {canvas}=await compress(file);const m=Math.min(canvas.width,canvas.height)*.6;
 const sq=cropSquare(canvas,(canvas.width-m)/2,(canvas.height-m)/2,m);
 await handleShot(canvas,sq);
}

// effet « obturateur » dans le carré : voile blanc, petit rebond, coche « suivant »
function snap(){
 const f=$('#scan .scan-frame');if(!f)return;
 f.classList.remove('snap');void f.offsetWidth;f.classList.add('snap');
 try{navigator.vibrate&&navigator.vibrate(25)}catch(e){}
 setTimeout(()=>f.classList.remove('snap'),900);
}
/* ---------- le formulaire récupère le résultat ---------- */
function applyDraftResult(r){
 if(!DR)DR=newDraft();keepDraftInputs();const t=DR.touched||{};
 DR.photo=r.photo;DR.sq=r.sq||null;DR.orig=r.orig||null;DR.cutOn=r.orig?true:undefined;
 if(!t.color)DR.color=r.color;
 if(r.cat&&!t.cat&&!EDIT){DR.cat=r.cat;DR.max=null;if(!t.warmth)DR.warmth=r.warmth;if(r.waterproof)DR.waterproof=true;if(!t.season)DR.season=seasonGuess(r.noun)}
 if(r.mat&&!t.mat)DR.mat=r.mat;
 if(r.style&&!(DR.style&&DR.style.length))DR.style=r.style;
 if(!DR.name.trim()&&!EDIT)DR.name=r.motif?r.noun:`${r.noun||cat(DR.cat).label} ${DR.color==='motif'?'à motif':DR.color}`;
 DR.detected=[r.noun||(r.cat?cat(r.cat).label:null),DR.color].filter(Boolean).join(' · ');
 if(r.aiErr||r.cutErr)toast(IN_PREVIEW?'IA indisponible dans l’aperçu':'Une partie de l’analyse a échoué (connexion ?)');
 if(location.hash!=='#ajout')location.hash='ajout';else render();
}
const saveSquare=(id,sq)=>{if(sq){squares.set(id,sq);DB.set('sq:'+id,sq)}};

Object.assign(A,{
 scanOpen(el){scanOpen(el&&el.dataset.v==='single'?'single':'batch')},
 scanClose(){const m=SCAN&&SCAN.mode;scanClose();if(m==='batch'&&BATCH){if(!BATCH.total)BATCH=null;else{BATCH.busy=SCAN.pending>0;location.hash='ajout';render()}}},
 scanShot:shoot,
 scanDone(){A.scanClose()},
});
document.addEventListener('change',async e=>{
 if(e.target.id!=='scanGal'||!e.target.files.length)return;
 const files=[...e.target.files];if(SCAN.mode==='batch'){$('#scanHint').textContent=`${files.length} photo${files.length>1?'s':''} ajoutée${files.length>1?'s':''}`}
 for(const f of files){try{await fromFile(f)}catch(err){toast('Image illisible')}if(SCAN.mode==='single')break}
});

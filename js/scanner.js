// Dress Up — Appareil photo : caméra plein écran avec un cadre carré, une ou plusieurs photos.
// L'image entière sert à reconnaître le vêtement (et au détourage), le carré donne la vignette « tissu ».
"use strict";

const squares=new Map(); // id -> vignette carrée (gros plan sur la matière)
const SQ=400;
let SCAN=null; // {stream, shots:[…]}

function cropSquare(src,x,y,s){const c=document.createElement('canvas');c.width=c.height=SQ;c.getContext('2d').drawImage(src,x,y,s,s,0,0,SQ,SQ);return c}
const sqColor=c=>colorFromPixels(c.getContext('2d').getImageData(0,0,c.width,c.height));

// Une prise = l'image entière (pour reconnaître le vêtement) + le carré du cadre (vignette « tissu », couleur).
// Rien n'est analysé pendant que la caméra est ouverte : elle reste fluide, même après 15 photos.
const shotOf=(full,sq)=>({photo:full.toDataURL('image/jpeg',.72),sq:sq.toDataURL('image/jpeg',.8),full,color:sqColor(sq),sig:sigOf(full)});

/* ---------- doublons : une petite empreinte visuelle par photo ----------
   L'image est réduite à 9×8 pixels gris : on note si chaque pixel est plus clair que son voisin (64 bits), plus la couleur moyenne.
   Deux photos du même vêtement, prises de la même façon, donnent des empreintes presque identiques. Calcul : une fraction de milliseconde. */
function sigOf(src){
 const m=document.createElement('canvas');m.width=72;m.height=64;const mx=m.getContext('2d');mx.imageSmoothingQuality='high';mx.drawImage(src,0,0,72,64);
 const c=document.createElement('canvas');c.width=9;c.height=8;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingQuality='high';x.drawImage(m,0,0,9,8);
 const d=x.getImageData(0,0,9,8).data,L=[];let r=0,g=0,b=0;
 for(let i=0;i<72;i++){L.push(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11);r+=d[i*4];g+=d[i*4+1];b+=d[i*4+2]}
 let h='';for(let y=0;y<8;y++){let n=0;for(let k=0;k<8;k++)n=n*2+(L[y*9+k]>L[y*9+k+1]?1:0);h+=n.toString(16).padStart(2,'0')}
 return{h,c:[Math.round(r/72),Math.round(g/72),Math.round(b/72)]};
}
const SIG_OK=s=>s&&typeof s.h==='string'&&/^[0-9a-f]{16}$/.test(s.h)&&Array.isArray(s.c)&&s.c.length===3;
function sigDist(a,b){let n=0;for(let k=0;k<16;k++){let v=parseInt(a.h[k],16)^parseInt(b.h[k],16);while(v){n+=v&1;v>>=1}}return n}
const colDist=(a,b)=>Math.hypot(a.c[0]-b.c[0],a.c[1]-b.c[1],a.c[2]-b.c[2]);
// le vêtement (déjà dans la penderie) ou la photo (déjà prise dans la série) qui ressemble le plus, s'il ressemble assez
function findDup(sig,shots=[]){
 if(!SIG_OK(sig))return null;let best=null,bd=1e9;
 const look=(s,o)=>{if(!SIG_OK(s))return;const d=sigDist(sig,s);if(d<=12&&colDist(sig,s)<=45&&d<bd){bd=d;best=o}};
 active().forEach(i=>look(i.sig,{name:i.name,photo:ORIG.has(i.id)?null:photos.get(i.id),id:i.id}));
 shots.forEach((s,k)=>look(s.sig,{name:`ta photo n° ${k+1} de cette série`,photo:s.photo}));
 return best;
}
// vêtements déjà enregistrés sans empreinte : on la calcule une fois, tranquillement (photo d'origine si elle a été détourée)
async function ensureSigs(){
 for(const i of S.items){if(SIG_OK(i.sig)||!photos.get(i.id)||i.removed)continue;
  try{const p=ORIG.has(i.id)?await DB.get('orig:'+i.id):photos.get(i.id);if(!p)continue;
   const img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=p});i.sig=sigOf(img)}catch(e){}
  await new Promise(r=>setTimeout(r,20))}
 save();
}
// encadré de comparaison dans la caméra
function dupBox(n,old){
 const b=$('#scanDup');if(!b)return;const shot=SCAN.shots[n];
 b.innerHTML=`<p><b>Déjà photographié ?</b> Ça ressemble à ${old.id?`« ${esc(old.name)} »`:esc(old.name)}.</p>
  <div class="dup-pair"><figure><img src="${U(shot.photo)}" alt="Nouvelle photo"><figcaption>Nouvelle</figcaption></figure><figure>${old.photo&&U(old.photo)?`<img src="${U(old.photo)}" alt="${esc(old.name)}">`:'<div class="dup-none">photo détourée</div>'}<figcaption>${old.id?'Dans ta penderie':'Déjà prise'}</figcaption></figure></div>
  <div class="row" style="flex-wrap:nowrap"><button class="btn sm" style="flex:1" data-a="dupDrop" data-k="${n}">Retirer la nouvelle</button><button class="btn sm line" style="flex:1" data-a="dupKeep" data-k="${n}">C’est un autre</button></div>`;
 b.hidden=false;
}

/* ---------- interface ---------- */
function scanUI(){
 const el=document.createElement('div');el.id='scan';el.setAttribute('role','dialog');el.setAttribute('aria-label','Appareil photo');
 el.innerHTML=`<video playsinline autoplay muted></video><div class="scan-frame"><span class="scan-label">Le vêtement entier</span><span class="scan-ok">✓ Prise !</span></div>
 <div class="scan-top"><button class="scan-x" data-a="scanClose" aria-label="Fermer">✕</button><span id="scanHint" aria-live="polite">Une ou plusieurs photos à la suite, puis OK</span></div>
 <div class="scan-dup" id="scanDup" role="alert" hidden></div><div class="scan-strip" id="scanStrip"></div>
 <div class="scan-bar"><label class="scan-side">Galerie<input type="file" accept="image/*" multiple id="scanGal" class="sr"></label>
 <button class="scan-shot" data-a="scanShot" aria-label="Prendre la photo"></button>
 <button class="scan-side scan-ok-btn" data-a="scanDone" id="scanDone" hidden>OK</button></div>`;
 document.body.appendChild(el);return el;
}
async function scanOpen(){
 if($('#scan'))return; // déjà ouvert (double appui)
 SCAN={stream:null,shots:[]};
 scanUI();await scanCam();
}
// (re)démarre la caméra : à l'ouverture, au retour d'arrière-plan, ou si iOS a coupé le flux
async function scanCam(retry=true){
 const el=$('#scan');if(!el||!SCAN||SCAN.stream||SCAN.starting)return;SCAN.starting=true;const mine=SCAN;
 try{
  const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1920}},audio:false});
  if(SCAN!==mine||!$('#scan')||document.hidden){st.getTracks().forEach(t=>t.stop());return} // fermé entre-temps
  SCAN.stream=st;st.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(SCAN===mine&&SCAN.stream===st){SCAN.stream=null;if(!document.hidden)scanCam()}}));
  const v=el.querySelector('video');v.onloadedmetadata=placeFrame;v.srcObject=st;await v.play().catch(()=>{});
  el.classList.remove('nocam');placeFrame();scanCount();
  // garde-fou : si l'image reste noire, on relance une fois, puis on le dit
  setTimeout(()=>{if(SCAN!==mine||SCAN.stream!==st||!$('#scan')||document.hidden||v.videoWidth)return;
   scanPause();if(retry)scanCam(false);else{$('#scanHint').textContent='La caméra ne répond pas : touche ✕ et rouvre-la. Tes photos sont gardées.';el.classList.add('nocam')}},2500);
 }catch(e){
  $('#scanHint').textContent=IN_PREVIEW?'Caméra indisponible dans l’aperçu : utilise « Galerie ».':'Caméra refusée : utilise « Galerie », ou autorise la caméra dans les réglages du navigateur.';
  el.classList.add('nocam');
 }finally{mine.starting=false}
}
// La caméra est affichée en entier (rien n'est rogné : c'était l'effet « zoom » qui obligeait à reculer).
// Le cadre se pose sur l'image réellement visible et en couvre presque toute la largeur.
function placeFrame(){
 const v=$('#scan video'),f=$('#scan .scan-frame');if(!v||!f||!v.videoWidth)return;
 const vr=v.getBoundingClientRect(),s=Math.min(vr.width/v.videoWidth,vr.height/v.videoHeight),dw=v.videoWidth*s,dh=v.videoHeight*s;
 const w=Math.min(dw*.94,dh*.9*4/5),h=w*5/4;
 f.style.width=w+'px';f.style.height=h+'px';f.style.aspectRatio='auto';
 f.style.left=(vr.left+vr.width/2)+'px';f.style.top=(vr.top+vr.height/2)+'px';
}
window.addEventListener('resize',()=>{if($('#scan'))placeFrame()});
function scanPause(){if(SCAN&&SCAN.stream){const st=SCAN.stream;SCAN.stream=null;st.getTracks().forEach(t=>t.stop())}}
document.addEventListener('visibilitychange',()=>{if(!$('#scan'))return;if(document.hidden)scanPause();else scanCam()});
function scanClose(){
 scanPause();
 const el=$('#scan');if(el)el.remove();
}
// le bouton OK n'apparaît qu'après la première photo, avec le nombre de photos
function scanCount(){
 const n=SCAN?SCAN.shots.length:0,d=$('#scanDone'),h=$('#scanHint');
 if(d){d.hidden=!n;d.textContent=`OK (${n})`}
 if(h&&!$('#scan').classList.contains('nocam'))h.textContent=n?`${n} photo${n>1?'s':''} · continue, ou appuie sur OK`:'Une ou plusieurs photos à la suite, puis OK';
}
function addStrip(sq){const s=$('#scanStrip');if(!s)return;const i=document.createElement('div');i.dataset.k=SCAN?SCAN.shots.length-1:0;i.style.backgroundImage=`url('${sq.toDataURL('image/jpeg',.6)}')`;s.prepend(i)}

// prise de vue : le cadre affiché à l'écran est converti en coordonnées de l'image vidéo
function cropRect(src,x,y,w,h,max=640){
 x=Math.max(0,x);y=Math.max(0,y);w=Math.min(w,src.width-x);h=Math.min(h,src.height-y);
 const k=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);
 c.getContext('2d').drawImage(src,x,y,w,h,0,0,c.width,c.height);return c;
}
function shoot(){
 const v=$('#scan video'),f=$('#scan .scan-frame');if(!v||!v.videoWidth){toast('Caméra pas prête');return}
 const VW=v.videoWidth,VH=v.videoHeight,vr=v.getBoundingClientRect(),fr=f.getBoundingClientRect();
 const s=Math.min(vr.width/VW,vr.height/VH),ox=vr.left+(vr.width-VW*s)/2,oy=vr.top+(vr.height-VH*s)/2;
 const fx=(fr.left-ox)/s,fy=(fr.top-oy)/s,fw=fr.width/s,fh=fr.height/s;
 const raw=document.createElement('canvas');raw.width=VW;raw.height=VH;raw.getContext('2d').drawImage(v,0,0);
 const full=cropRect(raw,fx,fy,fw,fh);
 const m=Math.min(fw,fh)*.55,sq=cropSquare(raw,Math.max(0,fx+(fw-m)/2),Math.max(0,fy+(fh-m)/2),m);
 const shot=shotOf(full,sq),dup=findDup(shot.sig,SCAN.shots);shot.dup=dup;SCAN.shots.push(shot);
 snap();addStrip(sq);scanCount();
 const box=$('#scanDup');if(dup)dupBox(SCAN.shots.length-1,dup);else if(box)box.hidden=true;
}
async function shotFromFile(file){
 const {canvas}=await compress(file);const m=Math.min(canvas.width,canvas.height)*.6;
 const sq=cropSquare(canvas,(canvas.width-m)/2,(canvas.height-m)/2,m);
 return{shot:shotOf(canvas,sq),sq};
}

// effet « obturateur » dans le carré : voile blanc, petit rebond, coche
function snap(){
 const f=$('#scan .scan-frame');if(!f)return;
 f.classList.remove('snap');void f.offsetWidth;f.classList.add('snap');
 try{navigator.vibrate&&navigator.vibrate(25)}catch(e){}
 setTimeout(()=>f.classList.remove('snap'),900);
}

/* ---------- après la prise : une photo = la fiche complète, plusieurs = la liste à vérifier ---------- */
function takeShots(shots){
 if(!shots.length)return;
 if(shots.length===1&&!BATCH){ // une seule photo : directement la fiche complète
  if(!DR)DR=newDraft();keepDraftInputs();const s=shots[0],t=DR.touched||{};
  DR.photo=s.photo;DR.sq=s.sq;DR.sig=s.sig;DR.dup=s.dupOk?null:(s.dup||findDup(s.sig));DR.orig=null;DR.cutOn=undefined;if(!t.color)DR.color=s.color;
  if(!DR.name.trim()||DR.name===DR.autoName){DR.name=DR.autoName=`${cat(DR.cat).label} ${DR.color}`}
  DR.detected=S.ai&&!EDIT?'reconnaissance…':null;
  goAjout();
  if(S.ai&&!EDIT){const tok=DR;guess(s.full).then(g=>{if(DR!==tok)return;applyGuess(DR,g);DR.detected=g?[g.noun,DR.color].filter(Boolean).join(' · '):null;refreshAjout()})}
  return;
 }
 if(!BATCH)BATCH={items:[]};
 const add=shots.map((s,k)=>({photo:s.photo,sq:s.sq,sig:s.sig,dup:s.dupOk?null:(s.dup||findDup(s.sig,shots.slice(0,k))),color:s.color,cat:'haut',guessed:false,warmth:2,season:'toutes',touched:{},pending:!!S.ai,name:`Vêtement ${s.color}`,autoName:`Vêtement ${s.color}`}));
 BATCH.items.push(...add);goAjout();
 if(S.ai)add.forEach((b,k)=>guess(shots[k].full).then(g=>{
  const was=b.autoName;b.pending=false;applyGuess(b,g);
  // déjà enregistré : on complète la fiche, et son nom seulement s'il est encore le nom provisoire
  if(b.savedId){const i=item(b.savedId);if(i){i.autoName=was;applyGuess(i,g,b.touched);delete i.autoName;save();if(VIEW!=='ajout'&&$('#sheet').hidden)render()}}
  else refreshAjout()}));
}
function goAjout(){if(location.hash!=='#ajout'){NOSCAN=true;location.hash='ajout'}else render()}
// complète une fiche (brouillon, ligne de la liste ou vêtement déjà enregistré) avec ce que la reconnaissance a trouvé,
// sans jamais écraser ce que tu as choisi toi-même
function applyGuess(D,g,touched){
 const t=touched||D.touched||{};if(!g)return;
 if(g.cat&&!t.cat){D.cat=g.cat;D.max=null;D.guessed=true;if(!t.warmth)D.warmth=g.warmth;if(g.waterproof)D.waterproof=true;if(!t.season)D.season=seasonGuess(g.noun)}
 if(g.mat&&!t.mat)D.mat=g.mat;
 if(g.style&&!t.style&&!(D.style&&D.style.length))D.style=g.style;
 if(g.motif&&!t.color)D.color='motif';
 const auto=!t.name&&(!D.name||!D.name.trim()||D.name===D.autoName);
 // si tu as choisi un autre type que celui reconnu, le nom suit ton choix
 const noun=g.cat&&g.cat!==D.cat?cat(D.cat).label:g.noun;
 if(auto){D.name=g.motif&&noun===g.noun?noun:`${noun||cat(D.cat).label} ${D.color==='motif'?'à motif':D.color}`;D.autoName=D.name}
}
// redessine l'écran Ajouter sans faire perdre la saisie en cours (valeurs, champ actif, curseur)
function refreshAjout(){
 if(VIEW!=='ajout'||$('#scan'))return;
 const a=document.activeElement,sel=a&&a.closest&&a.closest('#app')&&(a.id?'#'+a.id:a.dataset&&a.dataset.bi!=null?`[data-bi="${a.dataset.bi}"][data-bf="${a.dataset.bf}"]`:null);
 const pos=sel&&typeof a.selectionStart==='number'?[a.selectionStart,a.selectionEnd]:null,y=window.scrollY;
 keepDraftInputs();keepBatchInputs();render();window.scrollTo(0,y);
 if(sel){const b=$(sel);if(b){b.focus({preventScroll:true});if(pos&&b.setSelectionRange)try{b.setSelectionRange(pos[0],pos[1])}catch(e){}}}
}
// ne recopie que ce que tu as modifié toi-même : le reste peut avoir été complété par la reconnaissance entre-temps
function keepBatchInputs(){if(!BATCH)return;document.querySelectorAll('[data-bi]').forEach(f=>{const b=BATCH.items[+f.dataset.bi];if(b&&b.touched&&b.touched[f.dataset.bf])b[f.dataset.bf]=f.value})}
document.addEventListener('input',e=>{const f=e.target;if(!f.dataset||f.dataset.bi==null||!BATCH)return;const b=BATCH.items[+f.dataset.bi];if(b){b[f.dataset.bf]=f.value;b.touched[f.dataset.bf]=true}});
document.addEventListener('change',e=>{const f=e.target;if(!f.dataset||f.dataset.bi==null||!BATCH)return;const b=BATCH.items[+f.dataset.bi];if(b){b[f.dataset.bf]=f.value;b.touched[f.dataset.bf]=true}});

const saveSquare=(id,sq)=>{if(sq){squares.set(id,sq);DB.set('sq:'+id,sq)}};
let NOSCAN=false; // évite de rouvrir la caméra quand on arrive sur « Ajouter » en venant d'elle
// déjà sur « Ajouter » : toucher l'onglet rouvre la caméra (1 photo = nouvelle photo de la fiche en cours, plusieurs = dans la liste)
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#tabs a[data-v=ajout]');if(!a||VIEW!=='ajout')return;e.preventDefault();scanOpen()});

Object.assign(A,{
 scanOpen(){scanOpen()},
 scanClose(){const n=SCAN?SCAN.shots.length:0;
  if(n&&!confirm(`Abandonner ${n>1?`les ${n} photos prises`:'la photo prise'} ?`))return;
  scanClose();SCAN=null},
 scanShot:shoot,
 scanDone(){const shots=SCAN?SCAN.shots:[];scanClose();SCAN=null;takeShots(shots)},
 manualAdd(){DR=newDraft();render();window.scrollTo({top:0})},
 // doublons
 dupDrop(el){const k=+el.dataset.k;if(!SCAN||!SCAN.shots[k])return;SCAN.shots.splice(k,1);const s=$('#scanStrip');
  if(s){[...s.children].forEach(d=>{const n=+d.dataset.k;if(n===k)d.remove();else if(n>k)d.dataset.k=n-1})}
  $('#scanDup').hidden=true;scanCount();toast('Photo retirée')},
 dupKeep(el){const s=SCAN&&SCAN.shots[+el.dataset.k];if(s){s.dup=null;s.dupOk=true}$('#scanDup').hidden=true},
 dupDraft(){DR=null;render();window.scrollTo({top:0});toast('Pas ajouté')},
 dupDraftKeep(){if(DR)DR.dup=null;refreshAjout()},
 dupBatchKeep(el){const b=BATCH&&BATCH.items[+el.dataset.k];if(b)b.dup=null;refreshAjout()},
 // détourage à la demande (fonctions dans ia.js)
 cutNow:cutNowSheet,cutGo,cutStop(){if(CUT_RUN&&CUT_RUN.manual){CUT_RUN.stop=true;cutNowSheet()}},
});
document.addEventListener('change',async e=>{
 if((e.target.id!=='scanGal'&&e.target.id!=='galStart')||!e.target.files.length)return;
 const files=[...e.target.files],inCam=e.target.id==='scanGal';e.target.value='';const out=[];
 for(const f of files){try{const {shot,sq}=await shotFromFile(f);if(inCam&&SCAN){SCAN.shots.push(shot);addStrip(sq);scanCount()}else out.push(shot)}catch(err){toast('Image illisible')}}
 if(out.length)takeShots(out);
});

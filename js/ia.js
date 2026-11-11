// Dress Up — Photo, couleur, reconnaissance et détourage (sur l’appareil)
"use strict";
/* ---------- photo ---------- */
function compress(file){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(file);
 img.onload=()=>{const M=640,s=Math.min(1,M/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res({url:c.toDataURL('image/jpeg',.72),canvas:c})};
 img.onerror=()=>{URL.revokeObjectURL(url);rej()};img.src=url})}

/* ---------- reconnaissance automatique (100 % sur l'appareil) ---------- */
// Couleur : simple calcul sur les pixels du centre de la photo, aucune IA.
const PAL=COLORS.filter(c=>c[0]!=='motif').map(([n,h])=>[n,[1,3,5].map(k=>parseInt(h.slice(k,k+2),16))]);
function detectColor(src){
 const N=40,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d',{willReadFrequently:true});
 x.drawImage(src,src.width*.25,src.height*.2,src.width*.5,src.height*.6,0,0,N,N);
 const d=x.getImageData(0,0,N,N).data,votes={};
 for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];let best=null,bd=1e12;
  for(const [n,[R,G,B]] of PAL){const rm=(r+R)/2;const dd=(2+rm/256)*(r-R)**2+4*(g-G)**2+(2+(255-rm)/256)*(b-B)**2;if(dd<bd){bd=dd;best=n}}
  votes[best]=(votes[best]||0)+1}
 const top=Object.entries(votes).sort((a,b)=>b[1]-a[1]);
 // deux couleurs très présentes et contrastées -> probablement un motif (rayures, carreaux)
 if(top[1]&&top[0][1]<N*N*.62&&top[1][1]>N*N*.22){const A=PAL.find(p=>p[0]===top[0][0])[1],B=PAL.find(p=>p[0]===top[1][0])[1];
  const lum=v=>.3*v[0]+.59*v[1]+.11*v[2];if(Math.abs(lum(A)-lum(B))>110)return 'motif'}
 return top[0][0];
}
// Type, matière, motif : modèle CLIP (vision + texte) qui tourne dans le navigateur, sur l'appareil.
// Téléchargé une seule fois depuis Hugging Face, puis gardé en cache. Aucune photo n'est envoyée.
const CLIP_ID='Xenova/clip-vit-base-patch32',TF_URL='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';
const TYPES=[ // [anglais pour le modèle, catégorie, nom français, chaleur, imperméable]
 ['t-shirt','haut','T-shirt',1],['button-up shirt','haut','Chemise',1],['blouse','haut','Blouse',1],['tank top','haut','Débardeur',1],['polo shirt','haut','Polo',1],['long sleeve top','haut','Haut manches longues',2],
 ['knitted sweater','pull','Pull',2],['hoodie','pull','Sweat à capuche',2],['sweatshirt','pull','Sweat',2],['cardigan','pull','Gilet',2],['fleece jacket','pull','Polaire',3],
 ['jeans','bas','Jean',2],['trousers','bas','Pantalon',2],['shorts','bas','Short',1],['skirt','bas','Jupe',1],['leggings','bas','Legging',2],['sweatpants','bas','Jogging',2],
 ['dress','robe','Robe',1],['jumpsuit','robe','Combinaison',2],
 ['wool coat','veste','Manteau',3],['jacket','veste','Veste',2],['denim jacket','veste','Veste en jean',2],['blazer','veste','Blazer',2],['raincoat','veste','Imper',2,true],['puffer jacket','veste','Doudoune',3],['leather jacket','veste','Blouson cuir',2],['trench coat','veste','Trench',2,true],
 ['sneakers','chaussures','Baskets',2],['boots','chaussures','Bottines',3],['sandals','chaussures','Sandales',1],['dress shoes','chaussures','Chaussures de ville',2],['high heels','chaussures','Escarpins',1],['rain boots','chaussures','Bottes de pluie',2,true],
];
const MATS=[['wool','en laine',1],['cotton','en coton',0],['linen','en lin',-1],['denim','en jean',0],['leather','en cuir',0],['fleece','polaire',1],['silk','en soie',-1],['synthetic polyester','synthétique',0]];
const PATS=[['plain solid color',''],['striped','rayé'],['plaid checkered','à carreaux'],['floral print','fleuri'],['polka dot','à pois'],['graphic print','imprimé']];
let AI=null,AI_LOADING=null,AI_MSG='',TMOD=null;
async function getT(){if(!TMOD){TMOD=await import(TF_URL);TMOD.env.allowLocalModels=false}return TMOD}
function progressCb(setMsg,label){const files={};let last=0;return p=>{if(p.status==='progress'&&p.total){files[p.file]=[p.loaded,p.total];
 const L=Object.values(files).reduce((a,b)=>a+b[0],0),Tt=Object.values(files).reduce((a,b)=>a+b[1],0);const now=Date.now();
 if(now-last>400){last=now;setMsg(`${label} : ${Math.round(L/1048576)} / ${Math.round(Tt/1048576)} Mo`)}}}}
function aiMsg(m){AI_MSG=m;const el=$('#aistat');if(el)el.textContent=m}
const norm=v=>{let n=0;for(const x of v)n+=x*x;n=Math.sqrt(n)||1;return Float32Array.from(v,x=>x/n)};
const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s};
function aiLoad(){
 if(AI)return Promise.resolve(AI);
 if(!AI_LOADING)AI_LOADING=(async()=>{
  const T=await getT();
  const files={};let last=0;
  const progress_callback=p=>{if(p.status==='progress'&&p.total){files[p.file]=[p.loaded,p.total];const L=Object.values(files).reduce((a,b)=>a+b[0],0),Tt=Object.values(files).reduce((a,b)=>a+b[1],0);
   const now=Date.now();if(now-last>400){last=now;aiMsg(`Téléchargement du modèle : ${Math.round(L/1048576)} / ${Math.round(Tt/1048576)} Mo`)}}};
  // Les « étiquettes » texte ne se calculent qu'une fois, puis sont gardées sur l'appareil.
  let txt=await DB.get('clip-text-v2');
  if(!txt){
   aiMsg('Préparation du modèle…');
   const tok=await T.AutoTokenizer.from_pretrained(CLIP_ID,{progress_callback});
   const tm=await T.CLIPTextModelWithProjection.from_pretrained(CLIP_ID,{dtype:'q8',progress_callback});
   const enc=async list=>{const {text_embeds}=await tm(tok(list,{padding:true,truncation:true}));const d=text_embeds.dims[1];return list.map((_,i)=>Array.from(norm(text_embeds.data.slice(i*d,(i+1)*d))))};
   txt={types:await enc(TYPES.map(t=>`a photo of a ${t[0]}, a piece of clothing`)),mats:await enc(MATS.map(m=>`a close-up photo of clothing made of ${m[0]}`)),pats:await enc(PATS.map(p=>`a photo of a ${p[0]} piece of clothing`)),styles:await enc(['casual everyday','elegant formal','sporty athletic','cozy soft comfortable'].map(s=>`a photo of a ${s} piece of clothing`))};
   txt.types=txt.types.map(a=>Float32Array.from(a));DB.set('clip-text-v2',{types:txt.types.map(a=>Array.from(a)),mats:txt.mats,pats:txt.pats,styles:txt.styles});
   try{await tm.dispose()}catch(e){}
  }
  const conv=a=>a.map(v=>v instanceof Float32Array?v:Float32Array.from(v));
  const proc=await T.AutoProcessor.from_pretrained(CLIP_ID,{progress_callback});
  const vm=await T.CLIPVisionModelWithProjection.from_pretrained(CLIP_ID,{dtype:'q8',progress_callback});
  AI={T,proc,vm,txt:{types:conv(txt.types),mats:conv(txt.mats),pats:conv(txt.pats),styles:conv(txt.styles||[])}};aiMsg('Modèle prêt — tout se passe sur ton téléphone.');return AI})()
  .catch(e=>{AI_LOADING=null;aiMsg('');throw e});
 return AI_LOADING}
function softmax(sims){const m=Math.max(...sims);const ex=sims.map(s=>Math.exp(100*(s-m)));const t=ex.reduce((a,b)=>a+b,0);return ex.map(e=>e/t)}
const best=p=>p.reduce((b,v,i)=>v>p[b]?i:b,0);
async function aiGuess(canvas){
 const ai=await aiLoad();
 const img=await ai.T.RawImage.fromURL(canvas.toDataURL('image/jpeg',.9));
 const {image_embeds}=await ai.vm(await ai.proc(img));const v=norm(image_embeds.data);
 const ps=ai.txt.styles.length?softmax(ai.txt.styles.map(t=>dot(v,t))):[],pt=softmax(ai.txt.types.map(t=>dot(v,t))),pm=softmax(ai.txt.mats.map(t=>dot(v,t))),pp=softmax(ai.txt.pats.map(t=>dot(v,t)));
 // on regroupe les probabilités par catégorie pour décider du type
 const byCat={};TYPES.forEach((t,i)=>byCat[t[1]]=(byCat[t[1]]||0)+pt[i]);
 const c=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];if(c[1]<.35)return null;
 let ti=-1,tv=-1;TYPES.forEach((t,i)=>{if(t[1]===c[0]&&pt[i]>tv){tv=pt[i];ti=i}});
 const t=TYPES[ti],mi=best(pm),pi=best(pp);
 const mat=pm[mi]>.5?MATS[mi]:null,pat=pi>0&&pp[pi]>.5?PATS[pi]:null;
 let noun=t[2];if(mat&&!noun.toLowerCase().includes(mat[1].replace(/^en /,'')))noun+=' '+mat[1];if(pat)noun+=' '+pat[1];
 const si=ps.length?best(ps):-1;
 return{style:si>=0&&ps[si]>.45?[['casual','chic','sport','cosy'][si]]:null,mat:mat?{wool:'laine',cotton:'coton',linen:'lin',denim:'coton',leather:'cuir',fleece:'polyester',silk:'soie','synthetic polyester':'polyester'}[mat[0]]:null,cat:t[1],noun,warmth:Math.max(1,Math.min(3,t[3]+(mat?mat[2]:0))),waterproof:!!t[4],motif:!!pat,conf:c[1]};
}
/* Détourage : modèle RMBG-1.4 (BRIA) sur l'appareil, ~45 Mo téléchargés une fois. */
const RMBG_ID='briaai/RMBG-1.4',BG_COLOR='#EFE9DD';
let CUT=null,CUT_LOADING=null,CUT_MSG='';
function cutMsg(m){CUT_MSG=m;const el=$('#cutstat');if(el)el.textContent=m}
function cutLoad(){
 if(CUT)return Promise.resolve(CUT);
 if(!CUT_LOADING)CUT_LOADING=(async()=>{
  const T=await getT();const pc=progressCb(cutMsg,'Téléchargement du détourage');
  const model=await T.AutoModel.from_pretrained(RMBG_ID,{config:{model_type:'custom'},dtype:'q8',progress_callback:pc});
  const proc=await T.AutoProcessor.from_pretrained(RMBG_ID,{config:{do_normalize:true,do_pad:false,do_rescale:true,do_resize:true,image_mean:[0.5,0.5,0.5],feature_extractor_type:'ImageFeatureExtractor',image_std:[1,1,1],resample:2,rescale_factor:0.00392156862745098,size:{width:1024,height:1024}},progress_callback:pc});
  CUT={T,model,proc};cutMsg('Détourage prêt — tout se passe sur ton téléphone.');return CUT})().catch(e=>{CUT_LOADING=null;cutMsg('');throw e});
 return CUT_LOADING}
async function cutout(canvas){
 const c=await cutLoad();const W=canvas.width,H=canvas.height;
 const img=await c.T.RawImage.fromURL(canvas.toDataURL('image/jpeg',.92));
 const {pixel_values}=await c.proc(img);const {output}=await c.model({input:pixel_values});
 const mask=await c.T.RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(W,H);
 const id=canvas.getContext('2d').getImageData(0,0,W,H);let x0=W,y0=H,x1=0,y1=0,cnt=0;
 for(let i=0;i<W*H;i++){const a=mask.data[i*mask.channels]??mask.data[i];id.data[i*4+3]=a;
  if(a>128){cnt++;const x=i%W,y=(i/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
 if(cnt<W*H*.03)return null; // rien de net trouvé : on garde la photo telle quelle
 const fg=document.createElement('canvas');fg.width=W;fg.height=H;fg.getContext('2d').putImageData(id,0,0);
 const bw=x1-x0+1,bh=y1-y0+1,OW=640,OH=800,out=document.createElement('canvas');out.width=OW;out.height=OH;
 const o=out.getContext('2d');o.fillStyle=BG_COLOR;o.fillRect(0,0,OW,OH);
 const sc=Math.min(OW*.84/bw,OH*.84/bh),dw=bw*sc,dh=bh*sc;
 o.save();o.shadowColor='rgba(40,40,30,.22)';o.shadowBlur=26;o.shadowOffsetY=12;o.drawImage(fg,x0,y0,bw,bh,(OW-dw)/2,(OH-dh)/2,dw,dh);o.restore();
 return{url:out.toDataURL('image/jpeg',.8),canvas:out,pixels:id};
}
// couleur dominante calculée uniquement sur les pixels du vêtement
function colorFromPixels(id){
 const d=id.data,votes={};const n=d.length/4,step=Math.max(1,Math.floor(n/2500));let tot=0;
 for(let i=0;i<n;i+=step){const k=i*4;if(d[k+3]<200)continue;tot++;const r=d[k],g=d[k+1],b=d[k+2];let best=null,bd=1e12;
  for(const [nm,[R,G,B]] of PAL){const rm=(r+R)/2;const dd=(2+rm/256)*(r-R)**2+4*(g-G)**2+(2+(255-rm)/256)*(b-B)**2;if(dd<bd){bd=dd;best=nm}}
  votes[best]=(votes[best]||0)+1}
 const top=Object.entries(votes).sort((a,b)=>b[1]-a[1]);if(!top.length)return 'noir';
 if(top[1]&&top[0][1]<tot*.62&&top[1][1]>tot*.22){const A=PAL.find(p=>p[0]===top[0][0])[1],B=PAL.find(p=>p[0]===top[1][0])[1];
  const lum=v=>.3*v[0]+.59*v[1]+.11*v[2];if(Math.abs(lum(A)-lum(B))>110)return 'motif'}
 return top[0][0];
}
async function analyzeCanvas(canvas){
 const r={};let base=canvas,cut=null;
 if(S.cut){try{cut=await cutout(canvas)}catch(e){console.warn(e);r.cutErr=true}}
 if(cut){r.photo=cut.url;r.orig=canvas.toDataURL('image/jpeg',.72);r.color=colorFromPixels(cut.pixels);base=cut.canvas}
 else{r.photo=canvas.toDataURL('image/jpeg',.72);r.color=detectColor(canvas)}
 if(S.ai){try{const g=await aiGuess(base);if(g){Object.assign(r,g);if(g.motif)r.color='motif'}}catch(e){console.warn(e);r.aiErr=true}}
 return r;
}
async function analyze(file){const {canvas}=await compress(file);return analyzeCanvas(canvas)}

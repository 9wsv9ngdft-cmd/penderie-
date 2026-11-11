// Dress Up — Dessous (simples compteurs), inventaire express, photo du jour
"use strict";

/* ---------- dessous : de simples compteurs ---------- */
const UNDER=[['chaussettes','Paires de chaussettes'],['culottes','Culottes'],['boxers','Boxers'],['slips','Slips'],['sg','Soutiens-gorge'],['collants','Collants']];
const POOL=['culottes','boxers','slips'];
const under=()=>S.under||(S.under={});
const uTot=k=>(under()[k]||{}).total||0,uClean=k=>Math.min(uTot(k),(under()[k]||{}).clean??uTot(k));
const poolClean=()=>POOL.reduce((s,k)=>s+uClean(k),0),poolTot=()=>POOL.reduce((s,k)=>s+uTot(k),0);
function underUse(u,ids,band){ // consommation d'une journée (compteurs réels ou simulés) ; band = météo du jour concerné
 const dec=k=>{if(u[k]&&u[k].total)u[k].clean=Math.max(0,(u[k].clean??u[k].total)-1)};
 dec('chaussettes');
 const p=POOL.filter(k=>u[k]&&u[k].total).sort((a,b)=>(u[b].clean??u[b].total)-(u[a].clean??u[a].total))[0];if(p)dec(p);
 if(u.sg&&u.sg.total){u.sg.uses=(u.sg.uses||0)+1;if(u.sg.uses%3===0)dec('sg')} // un soutien-gorge se porte ~3 jours
 const b=band||(effWeather()||{}).band;if(ids&&ids.some(id=>{const i=item(id);return i&&(i.cat==='robe'||/jupe/i.test(i.name))})&&(b==='froid'||b==='frais'))dec('collants');
}
function onWear(ids){if(Object.keys(under()).length){S.undo.under=JSON.parse(JSON.stringify(under()));underUse(under(),ids)}}
function underLine(){
 const ks=UNDER.filter(([k])=>uTot(k));if(!ks.length)return `<button class="btn sm ghost" data-a="underOpen">🧦 Compter mes dessous</button>`;
 const low=uTot('chaussettes')&&uClean('chaussettes')<=2||poolTot()&&poolClean()<=2;
 return `<button class="opt" data-a="underOpen" style="margin:0">🧦 <b>Dessous</b> <span class="tiny">${uTot('chaussettes')?`chaussettes ${uClean('chaussettes')}/${uTot('chaussettes')}`:''}${poolTot()?` · culottes/boxers/slips ${poolClean()}/${poolTot()}`:''}${uTot('sg')?` · soutiens-gorge ${uClean('sg')}/${uTot('sg')}`:''}</span>${low?'<br><span class="tiny" style="color:var(--clay)"><b>Bientôt plus rien de propre : lessive à prévoir</b></span>':''}</button>`;
}
function underSheet(){
 sheet(`<h2 style="margin-top:0">Mes dessous</h2><p class="tiny">Pas de photo, juste des nombres : ça suffit pour le planning et la lessive. Les compteurs baissent chaque jour où tu enregistres une tenue.</p>
 ${UNDER.map(([k,l])=>`<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><span>${l}<br><span class="tiny">${uTot(k)?uClean(k)+' propres':'—'}</span></span><div class="stepper"><button data-a="uStep" data-k="${k}" data-d="-1">−</button><b>${uTot(k)}</b><button data-a="uStep" data-k="${k}" data-d="1">+</button></div></div>`).join('')}
 <div class="spacer"></div><button class="btn block" data-a="uWash">Tout est propre</button>`);
}

/* ---------- inventaire express ---------- */
const INV=[['T-shirts','haut','T-shirt',1],['Chemises','haut','Chemise',1],['Tops / polos','haut','Top',1],['Pulls','pull','Pull',2],['Sweats','pull','Sweat',2],['Gilets','pull','Gilet',2],
 ['Jeans','bas','Jean',2],['Pantalons','bas','Pantalon',2],['Shorts','bas','Short',1],['Jupes','bas','Jupe',1],['Joggings / leggings','bas','Jogging',2],['Robes','robe','Robe',1],
 ['Vestes','veste','Veste',2],['Manteaux','veste','Manteau',3],['Baskets','chaussures','Baskets',2],['Chaussures de ville','chaussures','Chaussures de ville',2],['Bottines / bottes','chaussures','Bottines',3],['Sandales','chaussures','Sandales',1]];
let INVD=null;
function invSheet(){
 if(!INVD)INVD={};
 const n=Object.values(INVD).reduce((a,b)=>a+b,0);
 sheet(`<h2 style="margin-top:0">Inventaire express</h2><p class="tiny">Compte, c’est tout : ta penderie existe en 2 minutes. Tu ajouteras les photos petit à petit.</p>
 ${INV.map(([l],k)=>`<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${l}</span><div class="stepper"><button data-a="invStep" data-k="${k}" data-d="-1">−</button><b>${INVD[k]||0}</b><button data-a="invStep" data-k="${k}" data-d="1">+</button></div></div>`).join('')}
 <p class="label">Dessous</p>${UNDER.map(([k,l])=>`<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${l}</span><div class="stepper"><button data-a="uStep" data-k="${k}" data-d="-1" data-inv="1">−</button><b>${uTot(k)}</b><button data-a="uStep" data-k="${k}" data-d="1" data-inv="1">+</button></div></div>`).join('')}
 <div class="spacer"></div><button class="btn block" data-a="invSave" ${n?'':'disabled'}>Ajouter ${n} vêtement${n>1?'s':''}</button>`);
}
const noPhoto=()=>active().filter(i=>!photos.get(i.id));
function photoOfDay(){
 const list=noPhoto().filter(i=>!outOfCircuit(i));if(!list.length||S.photoSkip===todayKey())return'';
 const i=list[seedOf(todayKey())%list.length];
 return `<div class="notice">📷 <b>Photo du jour</b> : ${esc(i.name)} ? <span class="tiny">(${list.length} à photographier)</span>
 <div class="row" style="margin-top:8px"><button class="btn sm" data-a="edit" data-id="${i.id}">Le prendre en photo</button><button class="btn sm ghost" data-a="photoSkip">Pas aujourd’hui</button></div></div>`;
}
function collectionBar(){
 const all=active().length,np=noPhoto().length;if(!np||!all)return'';
 return `<div class="card" style="padding:12px 16px"><div class="row between"><b>📷 Collection</b><span class="tiny">${all-np}/${all} photographiés</span></div><div class="bar"><i style="width:${(all-np)/all*100}%"></i></div></div>`;
}
const colorPick=i=>i.color?'':`<p class="label">Sa couleur ?</p><div class="chips">${COLORS.map(([n,v])=>`<button class="chip" data-a="setColor" data-id="${i.id}" data-v="${n}"><span class="dot" style="background:${v}"></span>${n}</button>`).join('')}</div>`;


/* ---------- actions ---------- */
Object.assign(A,{
 underOpen:underSheet,
 uStep(el){const k=el.dataset.k,u=under();const t=Math.max(0,uTot(k)+(+el.dataset.d));const c=Math.min(t,uClean(k)+(+el.dataset.d>0?1:0));u[k]={...(u[k]||{}),total:t,clean:c};save();el.dataset.inv?invSheet():underSheet();render()},
 uWash(){Object.values(under()).forEach(x=>{x.clean=x.total});save();underSheet();render();toast('Dessous tout propres')},
 invOpen(){INVD=null;invSheet()},
 invStep(el){const k=+el.dataset.k;INVD[k]=Math.max(0,(INVD[k]||0)+(+el.dataset.d));invSheet()},
 invSave(){let n=0;Object.entries(INVD).forEach(([k,c])=>{const [l,ca,noun,w]=INV[+k];const have=S.items.filter(i=>new RegExp('^'+noun+' \\d+$').test(i.name)).length;
  for(let j=1;j<=c;j++){S.items.push({id:uid(),name:`${noun} ${have+j}`,cat:ca,color:'',warmth:w,waterproof:false,origin:null,price:null,season:seasonGuess(noun),wash:'',occ:[],state:'propre',max:null,added:todayKey(),wears:0,sinceWash:0,lastWorn:null,express:true});n++}});
  INVD=null;OUTS=null;save();closeSheet();location.hash='penderie';render();toast(`${n} vêtements ajoutés. Les photos, petit à petit 📷`)},
 photoSkip(){S.photoSkip=todayKey();save();render()},
 setColor(el){const i=item(el.dataset.id);i.color=el.dataset.v;save();itemSheet(i.id);render()},
});

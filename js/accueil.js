// Dress Up — Accueil au premier lancement (5 étapes)
"use strict";

/* ---------- accueil au premier lancement ---------- */
let ONB=0;
function onbSheet(){
 const navIco=v=>{const a=document.querySelector(v==='shopper'?'#botTab svg':`#tabs a[data-v=${v}] svg`);return a?a.outerHTML:''};
 const tour=[['matin','Ce matin','Des idées de tenues selon la météo et ta journée.'],['penderie','Penderie','Tous tes vêtements, la lessive, la valise.'],['shopper','ReLook','Ton personal shopper : achats, tenues, budget.'],['envies','Envies','Une envie d’achat ? Prends-la en photo, et décide dans 5 jours.'],['bilan','Bilan','Ton empreinte, tes défis, tes badges.']];
 const p=prefs();
 const steps=[
  ()=>`<h2 style="margin-top:0">Bienvenue dans Dress Up 🌱</h2><p>Ta penderie dans ton téléphone, des tenues selon la météo, et des vêtements qui durent plus longtemps.</p>
   <div class="priv"><b>🔒 Tout reste sur ton téléphone</b><br>Pas de compte, pas de cloud, pas de pub. Tes photos ne sortent jamais. Même l’IA tourne sur ton téléphone.</div>`,
  ()=>`<h2 style="margin-top:0">L’app en 5 onglets</h2><div class="tour">${tour.map(([v,t,d])=>`<div class="tour-row"><span class="tour-ico">${navIco(v)}</span><span><b>${t}</b><br><span class="tiny">${d}</span></span></div>`).join('')}</div>
   <p class="tiny">Le menu ☰ en haut à droite : ta semaine, tes tenues favorites, les réglages.</p>`,
  ()=>`<h2 style="margin-top:0">ReLook, ton personal shopper</h2><p class="tiny">Il connaît ta penderie et ton budget, et t’aide à acheter moins mais mieux. Donne-lui un nom et un caractère :</p>${botSettings(true)}`,
  ()=>`<h2 style="margin-top:0" class="onb">Fais connaissance</h2><p class="tiny">3 questions pour que ses conseils te ressemblent. Tout est facultatif.</p>
   <p class="label">Ton style</p><div class="chips">${Object.entries(STYLES).map(([k,l])=>`<button class="chip ${p.styles.includes(k)?'on':''}" data-a="prefTog" data-k="styles" data-v="${k}">${l}</button>`).join('')}<button class="chip ${p.styles.includes('crea')?'on':''}" data-a="prefTog" data-k="styles" data-v="crea">Créatif</button></div>
   <p class="label">Ton objectif</p><div class="chips">${Object.entries(GOALS).map(([k,l])=>`<button class="chip ${p.goal===k?'on':''}" data-a="prefGoal" data-v="${k}">${l}</button>`).join('')}</div>
   <p class="label">Tes couleurs préférées</p><div class="chips">${COLORS.map(([n,v])=>`<button class="chip ${p.colors.includes(n)?'on':''}" data-a="prefTog" data-k="colors" data-v="${n}"><span class="dot" style="background:${v}"></span>${n}</button>`).join('')}</div>`,
  ()=>`<h2 style="margin-top:0">Photos et IA</h2><p class="tiny">Deux options pour aller plus vite. Les modèles se téléchargent <b>une seule fois</b> (Wi-Fi conseillé), puis tout se passe sur ton téléphone. Tu peux les activer plus tard dans Réglages.</p>${aiCards()}`,
  ()=>`<h2 style="margin-top:0" class="onb">Deux réglages</h2>
   ${IN_PREVIEW?'':`<p class="label">Ta ville, pour la météo</p><form class="row" data-f="city" style="flex-wrap:nowrap"><input type="search" name="city" placeholder="${S.city?esc(S.city.name):'ex. Lyon'}" autocomplete="off"><button class="btn sm">OK</button></form>`}
   <p class="label">Ta machine à laver</p><div class="chips">${[5,6,7,8,9,10].map(k=>`<button class="chip ${capKg()===k?'on':''}" data-a="onbKg" data-v="${k}">${k} kg</button>`).join('')}</div>
   <p class="label">Pour parler CO₂, ce qui te parle</p><div class="chips">${Object.entries(INTERESTS).map(([k,l])=>`<button class="chip ${(S.interests||[]).includes(k)?'on':''}" data-a="interest" data-v="${k}">${l}</button>`).join('')}</div>`,
  ()=>`<h2 style="margin-top:0">C’est parti !</h2><p>Commence par ta penderie. Le plus simple : pose chaque vêtement à plat sur un fond uni, enchaîne les photos, puis OK.</p>
   <button class="btn block" data-a="onbEnd" data-v="ajout">📷 Prendre mes vêtements en photo</button><div class="spacer"></div>
   <button class="btn ghost block" data-a="onbInv">⚡ Inventaire express : juste compter, en 2 minutes</button>
   <p class="tiny" style="margin-top:12px">10 pièces suffisent pour les premières tenues.</p>`];
 const last=ONB===steps.length-1;
 sheet(`<div class="onb-dots">${steps.map((_,k)=>`<i class="${k===ONB?'on':k<ONB?'past':''}"></i>`).join('')}</div>${steps[ONB]()}
  <div class="spacer grow"></div><div class="row between">${ONB?`<button class="btn sm ghost" data-a="onbPrev">Retour</button>`:'<span></span>'}
  ${last?'<span></span>':`<button class="btn" data-a="onbNext">Suivant</button>`}</div>
  <div class="spacer"></div><button class="btn sm ghost block" data-a="onbEnd">${last?'Plus tard':'Passer'}</button>`);
 const c=$('.sheet-card');if(c){c.classList.add('full');c.scrollTop=0}
}
Object.assign(A,{
 onbNext(){if(typeof keepBot==='function'&&$('#botName'))keepBot();ONB++;onbSheet()},onbPrev(){if(typeof keepBot==='function'&&$('#botName'))keepBot();ONB=Math.max(0,ONB-1);onbSheet()},
 onbInv(){if(typeof keepBot==='function'&&$('#botName'))keepBot();S.onboarded=true;S.seenVer=APP_VERSION;save();INVD=null;invSheet()},
 onbKg(el){S.machineKg=+el.dataset.v;save();onbSheet()},
 onbEnd(el){if(typeof keepBot==='function'&&$('#botName'))keepBot();S.onboarded=true;S.seenVer=APP_VERSION;save();closeSheet();if(el.dataset.v)location.hash=el.dataset.v;else render()},
 onbOpen(){ONB=0;onbSheet()},
 prefTog(el){const p=prefs(),k=el.dataset.k,v=el.dataset.v;p[k]=p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v];save();onbSheet()},
 prefGoal(el){const p=prefs();p.goal=p.goal===el.dataset.v?null:el.dataset.v;save();onbSheet()},
 newsOk(){S.seenVer=APP_VERSION;save();closeSheet()},
 newsReplay(){S.seenVer=APP_VERSION;save();ONB=0;onbSheet()},
 interest(el){const s=new Set(S.interests||[]),v=el.dataset.v;s.has(v)?s.delete(v):s.add(v);S.interests=[...s];save();
  if(!$('#sheet').hidden&&$('.tour,.onb'))onbSheet();else render()},
});

/* ---------- préférences du shopper ---------- */
const GOALS={moins:'Acheter moins',mieux:'Mieux m’habiller',place:'Faire de la place',eco:'Économiser'};
function prefs(){const b=bot();if(!b.prefs)b.prefs={styles:[],goal:null,colors:[]};return b.prefs}

/* ---------- après une mise à jour : quoi de neuf ---------- */
const NEWS={
 22:['🛍️ Ton shopper s’appelle ReLook, dans une vraie fenêtre de discussion',
     '☀️ Ce matin : la météo, la tenue du jour, puis ta semaine en petit (ordre réglable dans Réglages)',
     '🌱 Bilan : touche un chiffre pour voir le détail',
     '💸 Envies : « Je craque ou pas ? »',
     '🎬 L’intro en plein écran, à rejouer depuis le menu'],
 21:['🎬 Un nouvel accueil : visite de l’app, ton shopper, l’IA',
     '🛍️ Ton shopper te pose 3 questions pour des conseils à ton goût',
     '📷 Envies : prends en photo le pull qui te fait de l’œil',
     '🔔 Cette fenêtre, à chaque mise à jour'],
};
function newsSheet(){
 const l=NEWS[APP_VERSION]||[];
 sheet(`<h2 style="margin-top:0">Nouveau dans la version ${APP_VERSION}</h2>${l.length?`<ul class="news">${l.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>Petites corrections et améliorations.</p>'}
  <p class="tiny">Ta penderie et tes photos restent telles quelles.</p>
  <button class="btn block" data-a="newsOk">OK</button><div class="spacer"></div>
  <button class="btn ghost block" data-a="newsReplay">🎬 Rejouer l’accueil</button>`);
}

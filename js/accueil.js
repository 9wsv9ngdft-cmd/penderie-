// Dress Up — Accueil au premier lancement (5 étapes)
"use strict";

/* ---------- accueil au premier lancement ---------- */
let ONB=0;
function onbSheet(){
 const p=prefs();
 // v27 : trois étapes seulement. Notifications, IA, ville, machine et ReLook se règlent plus tard dans ☰ › Réglages.
 const steps=[
  ()=>`<p class="eyebrow">Bienvenue</p><h1 style="margin-top:6px">Dress Up</h1><p>Ta penderie dans ton téléphone, des tenues selon la météo, et des vêtements qui durent plus longtemps.</p>
   <div class="priv"><b>Tout reste sur ton téléphone</b><br>Pas de compte, pas de cloud, pas de pub. Tes photos ne sortent jamais. Même l’IA tourne sur ton téléphone.</div>`,
  ()=>`<h2 style="margin-top:0" class="onb">Fais connaissance</h2><p class="tiny">3 questions pour que les tenues te ressemblent. Tout est facultatif.</p>
   <p class="label">Ton style</p><div class="chips">${Object.entries(STYLES).map(([k,l])=>`<button class="chip ${p.styles.includes(k)?'on':''}" data-a="prefTog" data-k="styles" data-v="${k}">${l}</button>`).join('')}<button class="chip ${p.styles.includes('crea')?'on':''}" data-a="prefTog" data-k="styles" data-v="crea">Créatif</button></div>
   <p class="label">Ton objectif</p><div class="chips">${Object.entries(GOALS).map(([k,l])=>`<button class="chip ${p.goal===k?'on':''}" data-a="prefGoal" data-v="${k}">${l}</button>`).join('')}</div>
   <p class="label">Tes couleurs préférées</p><div class="chips">${COLORS.map(([n,v])=>`<button class="chip ${p.colors.includes(n)?'on':''}" data-a="prefTog" data-k="colors" data-v="${n}"><span class="dot" style="background:${v}"></span>${n}</button>`).join('')}</div>`,
  ()=>`<h2 style="margin-top:0">Commence par 10 pièces</h2><p class="tiny">Pas besoin de toute ta penderie aujourd’hui. Tes basiques suffisent pour les premières tenues ; le reste viendra au fil des jours.</p>${base10Card(true)}
   <p class="tiny" style="margin-top:12px">Notifications, ville, IA et ton personal shopper se règlent quand tu veux dans ☰ › Réglages.</p>`];
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
 28:['La pastille rouge de ReLook s’éteint dès que tu as vu son message : il s’affiche maintenant sur l’accueil'],
 27:['Nouveau style noir et or, façon maison de couture','Démarrage plus simple : commence par 10 pièces, le reste au fil des jours','« Trouver la photo » : retrouve l’image du produit à partir de sa marque et de sa référence, puis colle-la','Accueil allégé : « Ta semaine » et « Photo du jour » se réaffichent dans Réglages'],
 26:['✨ Nouvelle icône Dress Up, noir et or'],
 25:['🧥 ReLook devient ton accueil : il te dit bonjour, la météo, et te propose ta tenue dans ton style',
     '🫧 Il te prévient quand la machine est pleine',
     '🌙 Le soir, il te demande ce que tu as porté',
     '🔔 Notifications du matin et du soir, aux heures que tu choisis (Réglages → Notifications)',
     '💬 Réponds-lui en un toucher : « Plus chic », « C’est pour le sport »…',
     '☀️ La météo se range dans une petite pastille : touche-la pour le détail',
     '📱 4 onglets : ReLook, Penderie, Envies, Bilan'],
 24:['👆 Ce matin : glisse la carte de la tenue pour voir les 3 idées (ou touche les petits points)'],
 23:['✨ Ce matin : choisis l’occasion et ton style du jour, et la tenue proposée change tout de suite',
     '📅 La tenue « prévue dans ta semaine » passe après ton choix du jour'],
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

/* ---------- notifications de ReLook (matin et soir) ----------
   Le serveur (worker/, sur Cloudflare) ne reçoit que l'adresse de notification du téléphone, les deux heures et le fuseau horaire. */
const notif=()=>S.notif||(S.notif={am:'07:30',pm:'20:00',amOn:true,pmOn:true,on:false});
let PUSH_URL=null,NOTIF_MSG='';
async function pushUrl(){if(PUSH_URL)return PUSH_URL;const r=await fetch('push-config.json',{cache:'no-cache'});if(!r.ok)throw new Error('config');const j=await r.json();if(!/^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(j.url||''))throw new Error('config');return PUSH_URL=j.url}
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const pushOk=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function notifCard(inOnb){
 const n=notif(),ios=/iP(hone|ad|od)/.test(navigator.userAgent);
 const row=(k,lab,emoji)=>`<div class="nrow"><label class="toggle" style="border:0;padding:0;flex:1"><span>${emoji} <b>${lab}</b></span><input type="checkbox" data-n="${k}On" ${n[k+'On']?'checked':''}></label><input type="time" class="ntime" data-n="${k}" value="${n[k]}" ${n[k+'On']?'':'disabled'}></div>`;
 let foot='';
 if(!pushOk()||(ios&&!standalone()))foot=`<p class="tiny" style="margin:10px 0 0">${ios?'Pour recevoir les notifications, ajoute d’abord Dress Up à ton écran d’accueil (bouton Partager → « Sur l’écran d’accueil »), puis ouvre-la depuis l’icône.':'Ce navigateur ne gère pas les notifications.'}</p>`;
 else if(!n.on)foot=`<button class="btn block" data-a="notifOn" style="margin-top:12px">🔔 Activer les notifications</button>`;
 else foot=`<p class="tiny" style="margin:10px 0 6px;color:var(--moss);font-weight:600">🔔 Notifications activées</p><div class="row"><button class="btn sm soft" data-a="notifTest">Envoyer un test</button><button class="btn sm ghost" data-a="notifOff">Couper</button></div>`;
 return `<div class="card">${row('am','Le matin','☀️')}${row('pm','Le soir','🌙')}${foot}<p class="tiny" id="notifstat" style="margin:8px 0 0;color:var(--moss);font-weight:600">${esc(NOTIF_MSG)}</p>
 ${inOnb?'':'<p class="tiny" style="margin:6px 0 0">Le serveur de notifications ne connaît que tes deux heures et l’adresse de notification de ton téléphone : rien sur tes vêtements.</p>'}</div>`;
}
function notifMsg(m){NOTIF_MSG=m;const e=$('#notifstat');if(e)e.textContent=m}
async function notifSync(){ // envoie les heures au serveur
 const n=notif();if(!n.on)return;
 const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(!sub){n.on=false;save();return}
 const r=await fetch((await pushUrl())+'/sub',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sub:sub.toJSON(),am:n.amOn?n.am:null,pm:n.pmOn?n.pm:null,tz:Intl.DateTimeFormat().resolvedOptions().timeZone})});
 if(!r.ok)throw new Error('serveur');
}
const refreshNotif=()=>{if(!$('#sheet').hidden&&$('.onb-dots'))onbSheet();else render()};
Object.assign(A,{
 async notifOn(){
  try{
   const p=await Notification.requestPermission();
   if(p!=='granted'){notifMsg('Notifications refusées. Tu peux les autoriser dans les réglages de l’iPhone → Notifications → Dress Up.');return}
   notifMsg('Connexion…');
   const url=await pushUrl(),k=(await (await fetch(url+'/vapid')).json()).key;
   const key=Uint8Array.from(atob(k.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((k.length+3)%4)),c=>c.charCodeAt(0));
   const reg=await navigator.serviceWorker.ready;
   let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   notif().on=true;save();await notifSync();notifMsg('C’est réglé ! ReLook te fera signe aux heures choisies.');refreshNotif();
  }catch(e){notif().on=false;save();notifMsg(e.message==='config'?'Le serveur de notifications n’est pas encore installé.':'Activation impossible pour l’instant (connexion ?).')}
 },
 async notifOff(){const n=notif();n.on=false;save();
  try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(sub){await fetch((await pushUrl())+'/unsub',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:sub.endpoint})}).catch(()=>{});await sub.unsubscribe()}}catch(e){}
  notifMsg('Notifications coupées.');refreshNotif()},
 async notifTest(){try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();notifMsg('Envoi…');
  const r=await (await fetch((await pushUrl())+'/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:sub&&sub.endpoint})})).json();
  notifMsg(r.ok?'Envoyé ! Elle arrive dans quelques secondes.':'Le test n’est pas passé. Réessaie de couper puis réactiver.')}catch(e){notifMsg('Test impossible (connexion ?).')}},
});
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.n;if(!k)return;const n=notif();
 if(e.target.type==='checkbox'){n[k]=e.target.checked;const t=document.querySelector(`.ntime[data-n=${k.slice(0,2)}]`);if(t)t.disabled=!e.target.checked}else if(/^\d\d:\d\d$/.test(e.target.value))n[k]=e.target.value;
 save();if(n.on)notifSync().then(()=>notifMsg('Heures enregistrées.')).catch(()=>notifMsg('Heures gardées sur le téléphone ; envoi au serveur impossible pour l’instant.'))});

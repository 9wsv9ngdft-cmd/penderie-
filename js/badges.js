// Dress Up — Badges : série de jours et petites victoires
"use strict";

/* ---------- badges ---------- */
const streak=()=>{let n=0;const set=new Set(S.log.map(l=>l.date));const d=now();if(!set.has(todayKey(d)))d.setDate(d.getDate()-1);while(set.has(todayKey(d))){n++;d.setDate(d.getDate()-1)}return n};
const BADGES=[
 ['debut','👕','Premier pas','10 vêtements dans ta penderie',()=>active().length>=10],
 ['collection','📷','Collection complète','Toute ta penderie en photo',()=>active().length>=10&&!noPhoto().length],
 ['regulier','📅','Régulier','7 jours de suite avec ta tenue enregistrée',()=>streak()>=7],
 ['trente','🔁','30 ports','Un vêtement porté 30 fois',()=>S.items.some(i=>totalWears(i)>=30)],
 ['cent','💯','Centenaire','Un vêtement porté 100 fois',()=>S.items.some(i=>totalWears(i)>=100)],
 ['occasion','🌱','Main verte','Un achat de seconde main',()=>S.items.some(isSecondHand)],
 ['reparateur','🧵','Réparateur·rice','Ta première réparation',()=>(S.stats||{}).repairs>=1],
 ['secondevie','♻️','Seconde vie','Un vêtement vendu, donné ou déposé',()=>S.items.some(i=>i.removed&&['donne','vendu','recyclerie','transforme','collecte'].includes(i.removed.reason))],
 ['zen','🧘','Zen des envies','Une envie passée sans achat',()=>(S.wishes||[]).some(w=>w.decided&&w.decided.choice==='renonce')],
 ['defi','🏆','Défi relevé','Un défi réussi',()=>(S.chals||[]).some(c=>c.status==='reussi')],
 ['machine','🫧','Lessive maline','Une machine lancée bien pleine',()=>(S.stats||{}).fullWash>=1],
 ['valise','🧳','Valise légère','Une valise préparée avec Dress Up',()=>!!S.trip],
];
function checkBadges(){
 const got=S.badges||(S.badges={});let news=[];
 BADGES.forEach(([id,e,t,d,f])=>{try{if(!got[id]&&f()){got[id]=todayKey();news.push([e,t])}}catch(err){}});
 if(news.length){save();news.forEach(([e,t])=>{toast(`${e} Badge débloqué : ${t}`);if(typeof botPush==='function')botPush('badge',{t:`${e} ${t}`})})}
}
function badgesBilan(){
 const got=S.badges||{};const n=Object.keys(got).length;
 return `<h2>Badges <span class="tiny">${n}/${BADGES.length}</span></h2><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">${BADGES.map(([id,e,t,d])=>`<div class="stat" style="text-align:center;padding:10px;${got[id]?'':'opacity:.4;filter:grayscale(1)'}"><div style="font-size:28px">${e}</div><b style="font-size:13px;font-family:inherit">${t}</b><span style="font-size:11px">${d}</span></div>`).join('')}</div>`;
}

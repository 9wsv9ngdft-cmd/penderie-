// Dress Up — Accueil au premier lancement (5 étapes)
"use strict";

/* ---------- accueil au premier lancement ---------- */
let ONB=0;
function onbSheet(){
 const steps=[
  ()=>`<h2 style="margin-top:0">Bienvenue dans Dress Up 🌱</h2><p>Ta penderie dans ton téléphone, des tenues selon la météo, et des vêtements qui durent plus longtemps.</p>
   <p class="tiny">Tout reste sur ton téléphone : pas de compte, pas de cloud. Tes photos ne sortent jamais.</p>`,
  ()=>`<h2 style="margin-top:0">Qu’est-ce qui te parle ?</h2><p class="tiny">Pour traduire les kilos de CO₂ en choses concrètes. Plusieurs choix possibles.</p>
   <div class="chips">${Object.entries(INTERESTS).map(([k,l])=>`<button class="chip ${(S.interests||[]).includes(k)?'on':''}" data-a="interest" data-v="${k}">${l}</button>`).join('')}</div>
   <p class="tiny" style="margin-top:12px">Exemple : un jean neuf, c’est ${eq(25.1,1)}.</p>`,
  ()=>`<h2 style="margin-top:0">Deux réglages</h2>
   ${IN_PREVIEW?'':`<p class="label">Ta ville, pour la météo</p><form class="row" data-f="city" style="flex-wrap:nowrap"><input type="search" name="city" placeholder="${S.city?esc(S.city.name):'ex. Lyon'}" autocomplete="off"><button class="btn sm">OK</button></form>`}
   <p class="label">Ta machine à laver</p><div class="chips">${[5,6,7,8,9,10].map(k=>`<button class="chip ${capKg()===k?'on':''}" data-a="onbKg" data-v="${k}">${k} kg</button>`).join('')}</div>`,
  ()=>`<h2 style="margin-top:0">Ton assistant shopper</h2><p class="tiny">Il connaît ta penderie, ton budget et tes intentions, et il t’aide à acheter moins mais mieux. Tout reste sur ton téléphone. Donne-lui un nom et un caractère :</p>${botSettings(true)}`,
  ()=>`<h2 style="margin-top:0">Ta penderie</h2><p>Le plus rapide : <b>l’inventaire express</b>. Tu comptes tes vêtements et tes dessous en 2 minutes, et tu ajoutes les photos petit à petit.</p>
   <button class="btn block" data-a="onbInv">⚡ Inventaire express</button><p class="label">Ou en photos, quand tu veux</p><ul style="padding-left:18px;margin:0 0 12px">
   <li>Pose chaque vêtement à plat sur un fond uni (lit, parquet).</li><li>Une pièce par photo, bien éclairée.</li>
   <li>Enchaîne les photos, puis appuie sur OK : tu vérifies tout d’un coup.</li></ul>
   <p class="tiny">Tu peux commencer par 10 pièces : ça suffit pour les premières tenues.</p>`];
 const last=ONB===steps.length-1;
 sheet(`<p class="tiny" style="margin:0 0 8px">${ONB+1} / ${steps.length}</p>${steps[ONB]()}
  <div class="spacer"></div><div class="row between">${ONB?`<button class="btn sm ghost" data-a="onbPrev">Retour</button>`:'<span></span>'}
  ${last?`<button class="btn" data-a="onbEnd" data-v="ajout">Scanner ma penderie</button>`:`<button class="btn" data-a="onbNext">Suivant</button>`}</div>
  <div class="spacer"></div><button class="btn sm ghost block" data-a="onbEnd">${last?'Plus tard':'Passer'}</button>`);
}
Object.assign(A,{
 onbNext(){if(typeof keepBot==='function'&&$('#botName'))keepBot();ONB++;onbSheet()},onbPrev(){if(typeof keepBot==='function'&&$('#botName'))keepBot();ONB=Math.max(0,ONB-1);onbSheet()},
 onbInv(){S.onboarded=true;save();INVD=null;invSheet()},
 onbKg(el){S.machineKg=+el.dataset.v;save();onbSheet()},
 onbEnd(el){if(typeof keepBot==='function'&&$('#botName'))keepBot();S.onboarded=true;save();closeSheet();if(el.dataset.v)location.hash=el.dataset.v;else render()},
 onbOpen(){ONB=0;onbSheet()},
 interest(el){const s=new Set(S.interests||[]),v=el.dataset.v;s.has(v)?s.delete(v):s.add(v);S.interests=[...s];save();
  if(!$('#sheet').hidden&&ONB===1)onbSheet();else render()},
});

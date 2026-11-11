// Dress Up — Lot 3 : seconde vie (vendre, donner, déposer, réparer, transformer, échanger, prêter), entretien
"use strict";

const ETATS=['Neuf avec étiquette','Très bon état','Bon état','Satisfaisant'];
// vêtement temporairement hors circuit : en vente, à échanger ou prêté
const outOfCircuit=i=>!!(i.sale||i.swap||i.loan);
const mapsLinks=q=>`<div class="row" style="margin-top:6px"><a class="btn sm soft" href="https://maps.apple.com/?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">Plans</a><a class="btn sm ghost" href="https://www.google.com/maps/search/${encodeURIComponent(q)}" target="_blank" rel="noopener">Google Maps</a></div>`;

function secondLifeSheet(id){
 const i=item(id);
 const opt=(a,t,d)=>`<button class="opt" data-a="${a}" data-id="${id}"><b>${t}</b><br><span class="tiny">${d}</span></button>`;
 sheet(`<h2 style="margin-top:0">Seconde vie</h2><p class="tiny">${esc(i.name)} : qu’est-ce que tu veux en faire ?</p>
 ${i.sale?`<div class="notice">En vente depuis ${daysSince(i.sale.since)} jour${daysSince(i.sale.since)>1?'s':''}${i.sale.price?` à ${eur(i.sale.price)}`:''}.<div class="row" style="margin-top:8px"><button class="btn sm" data-a="soldAsk" data-id="${id}">Vendu !</button><button class="btn sm ghost" data-a="saleStop" data-id="${id}">Retirer de la vente</button></div></div>`:''}
 ${i.loan?`<div class="notice">Prêté à ${esc(i.loan.to)} depuis ${daysSince(i.loan.since)} jour${daysSince(i.loan.since)>1?'s':''}.<div class="row" style="margin-top:8px"><button class="btn sm" data-a="loanBack" data-id="${id}">Il est revenu</button></div></div>`:''}
 ${opt('slSell','Vendre','Annonce prête pour Vinted ou Le Bon Coin')}
 ${opt('slGive','Donner','À un proche, sur Le Bon Coin ou à une association')}
 ${opt('slDrop','Déposer ou recycler','Recyclerie, Emmaüs, borne textile près de chez toi')}
 ${opt('slRepair','Réparer','Le faire toi-même ou trouver un retoucheur')}
 ${opt('slTransform','Transformer','Des idées pour lui donner une autre vie')}
 ${opt('slSwap',i.swap?'Ne plus échanger':'Échanger (troc)','Le mettre de côté pour un vide-dressing ou une soirée troc')}
 ${i.loan?'':opt('slLend','Prêter','Noter à qui, pour penser à le récupérer')}
 <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-a="removeDo" data-id="${id}" data-v="jete">Il est fichu (jeté)</button><button class="btn sm ghost" data-a="removeDo" data-id="${id}" data-v="perdu">Perdu</button></div>
 <div class="spacer"></div><button class="btn sm danger" data-a="deleteDo" data-id="${id}">Supprimer (erreur de saisie)</button>`);
}

/* ---------- annonces ---------- */
function adText(i,kind){
 const parts=[i.name,i.ref&&!/^https?:/i.test(i.ref)?i.ref:'',i.size?'taille '+i.size:''].filter(Boolean);
 const title=(kind==='don'?'À donner : ':'')+parts.join(' – ');
 const tw=totalWears(i);
 const lines=[
  `${i.name}${i.color&&i.color!=='motif'?`, couleur ${i.color}`:''}.`,
  i.size?`Taille : ${i.size}`:'',
  `État : ${i.etat||'Bon état'}`,
  i.mat?`Matière : ${MATIERES[i.mat].toLowerCase()}`:'',
  i.madeIn?`Fabriqué en ${i.madeIn}`:'',
  tw&&tw<15?'Très peu porté.':'',
  'Lavé à 30 °C, séché à l’air, entretenu avec soin.',
  kind==='don'?'À venir chercher, gratuit. Il mérite une seconde vie !':'Envoi soigné, emballage réutilisé.'];
 return{title,body:lines.filter(Boolean).join('\n')};
}
function adSheet(id,kind){
 const i=item(id),t=adText(i,kind);
 sheet(`<h2 style="margin-top:0">${kind==='don'?'Donner':'Vendre'}</h2>
 <p class="label">Taille</p><input type="text" id="adSize" value="${esc(i.size||'')}" placeholder="ex. M, 38, 42" autocomplete="off">
 <p class="label">État</p><div class="chips">${ETATS.map(e=>`<button class="chip ${(i.etat||'Bon état')===e?'on':''}" data-a="adEtat" data-id="${id}" data-k="${kind}" data-v="${e}">${e}</button>`).join('')}</div>
 ${kind==='don'?'':`<p class="label">Prix demandé</p><div class="row" style="flex-wrap:nowrap"><input type="text" inputmode="decimal" id="adPrice" value="${i.askPrice||(i.sale&&i.sale.price)?String(i.askPrice||i.sale.price).replace('.',','):''}" placeholder="ex. 15" style="max-width:140px"><span class="muted">€</span></div>${i.price>0?`<p class="tiny" style="margin-top:6px">Acheté ${eur(i.price)}.</p>`:''}`}
 <p class="label">Annonce</p><div class="card" style="white-space:pre-line"><b id="adT">${esc(t.title)}</b>\n<span id="adB">${esc(t.body)}</span></div>
 <div class="row"><button class="btn sm" data-a="adShare" data-id="${id}" data-k="${kind}">Partager (photo + texte)</button><button class="btn sm soft" data-a="adCopy" data-id="${id}" data-k="${kind}">Copier le texte</button></div>
 <p class="tiny" style="margin-top:8px">« Partager » envoie la photo et le texte vers l’app de ton choix. Sinon, copie le texte et ouvre :</p>
 <div class="row">${kind==='don'?'':`<a class="btn sm ghost" href="https://www.vinted.fr/items/new" target="_blank" rel="noopener">Vinted</a>`}<a class="btn sm ghost" href="https://www.leboncoin.fr/deposer-une-annonce" target="_blank" rel="noopener">Le Bon Coin</a></div>
 ${kind==='don'?`<p class="label">Ou une association</p><p class="tiny">Emmaüs, Secours populaire, Croix-Rouge… près de chez toi :</p>${mapsLinks('Emmaüs')}${mapsLinks('association dons vêtements')}`:''}
 <div class="spacer"></div>
 ${kind==='don'?`<button class="btn block" data-a="removeDo" data-id="${id}" data-v="donne">C’est donné ✓</button>`
  :`<button class="btn block" data-a="saleStart" data-id="${id}">${i.sale?'Mettre à jour':'Mettre en vente'}</button><p class="tiny" style="margin-top:6px">Il ne sera plus proposé dans les tenues pendant la vente.</p>`}`);
}
function keepAd(i){const s=$('#adSize'),p=$('#adPrice');if(s)i.size=s.value.trim();if(p){i.askPrice=parsePrice(p.value);if(i.sale)i.sale.price=i.askPrice}return i.askPrice||null}
async function adShare(i,kind){
 const t=adText(i,kind),text=`${t.title}\n\n${t.body}`;
 try{
  const p=photos.get(i.id);let files=[];
  if(p){const b=await (await fetch(p)).blob();files=[new File([b],'photo.jpg',{type:'image/jpeg'})]}
  if(navigator.canShare&&files.length&&navigator.canShare({files})){await navigator.share({files,text});return}
  if(navigator.share){await navigator.share({text});return}
 }catch(e){if(e&&e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(text);toast('Texte copié')}catch(e){toast('Copie impossible ici')}
}

/* ---------- déposer, réparer, transformer ---------- */
function dropSheet(id){
 sheet(`<h2 style="margin-top:0">Déposer ou recycler</h2><p class="tiny">Encore portable : recyclerie, ressourcerie ou Emmaüs. Trop usé : borne textile, il sera recyclé (même troué ou taché, du moment qu’il est propre et sec).</p>
 <p class="label">Recyclerie / ressourcerie</p>${mapsLinks('recyclerie')}
 <p class="label">Emmaüs</p>${mapsLinks('Emmaüs')}
 <p class="label">Borne textile</p>${mapsLinks('borne textile Le Relais')}
 <p class="tiny" style="margin-top:8px">Plans ou Google Maps cherchent autour de toi : Dress Up ne connaît pas ta position.</p>
 <div class="spacer"></div><div class="row"><button class="btn sm" data-a="removeDo" data-id="${id}" data-v="recyclerie">Déposé en recyclerie</button><button class="btn sm soft" data-a="removeDo" data-id="${id}" data-v="collecte">Mis en borne textile</button></div>`);
}
function repairSheet(id){
 const i=item(id);
 sheet(`<h2 style="margin-top:0">Réparer</h2>
 ${i.state==='reparer'?'':`<button class="btn soft block" data-a="setState" data-id="${id}" data-v="reparer">Le marquer « à réparer »</button><div class="spacer"></div>`}
 <div class="card">${REPAIRS.map(([t,p])=>`<details><summary>${t}</summary><p>${p}</p></details>`).join('')}</div>
 <p class="label">Retoucheur près de chez toi</p>${mapsLinks('retoucherie')}
 <p class="tiny" style="margin-top:8px">Chez les retoucheurs labellisés « bonus réparation », une partie du prix est prise en charge : <a href="https://www.refashion.fr" target="_blank" rel="noopener">refashion.fr</a></p>`);
}
const TRANSFO={
 haut:['Chiffons de ménage (adieu l’essuie-tout)','Tote bag sans couture (couper les manches et le col, nouer le bas)','Fil de t-shirt pour crocheter un panier'],
 pull:['Coussin ou housse de bouillotte','Mitaines ou bonnet dans les manches','Laine détricotée pour un autre projet'],
 bas:['Short ou jupe en coupant les jambes','Sac ou trousse en jean','Patchs pour réparer d’autres vêtements'],
 robe:['Jupe ou haut en la coupant à la taille','Tissu pour des pochettes ou des chouchous','Déguisement pour les enfants'],
 veste:['Doublure ou rembourrage d’un coussin de sol','Pièces pour réparer une autre veste','Sac de voyage si le tissu est solide'],
 chaussures:['Pot de fleurs pour le balcon','Chaussures de jardin ou de bricolage','Semelles en bon état : cordonnier pour les ressemeler'],
};
function transformSheet(id){
 const i=item(id);
 sheet(`<h2 style="margin-top:0">Transformer</h2><p class="tiny">Quelques idées pour ${esc(i.name.toLowerCase())} :</p>
 <div class="card">${(TRANSFO[i.cat]||TRANSFO.haut).map(t=>`<p style="margin:6px 0">• ${t}</p>`).join('')}</div>
 <p class="tiny">Une couturière ou un repair café près de chez toi peut aussi t’aider :</p>${mapsLinks('repair café')}
 <div class="spacer"></div><button class="btn block" data-a="removeDo" data-id="${id}" data-v="transforme">C’est transformé ✓</button>`);
}
function lendSheet(id){
 sheet(`<h2 style="margin-top:0">Prêter</h2><p class="label">À qui ?</p><input type="text" id="lendTo" placeholder="ex. Léa" autocomplete="off">
 <div class="spacer"></div><button class="btn block" data-a="lendDo" data-id="${id}">Prêter</button><p class="tiny" style="margin-top:8px">Il sera mis de côté jusqu’à son retour. Au bout de 3 semaines, l’app te rappellera de le récupérer.</p>`);
}

/* ---------- entretien selon la matière ---------- */
const CARE={
 laine:'Laine : aère-la plutôt que de la laver, elle se nettoie presque seule. Lavage à la main à froid, séchage à plat.',
 coton:'Coton : 30 °C suffit, séchage à l’air. Sur l’envers pour garder les couleurs.',
 lin:'Lin : séchage à l’air, repassage encore humide. Il se bonifie avec les lavages.',
 polyester:'Synthétique : lave-le dans un sac anti-microfibres, à 30 °C, pour limiter le plastique relâché dans l’eau.',
 cuir:'Cuir : jamais en machine. Un chiffon humide et un peu de baume nourrissant de temps en temps.',
 soie:'Soie : à la main, à froid, sans essorer. Séchage à l’ombre.',
 viscose:'Viscose : à la main ou cycle délicat à froid, elle se déforme à chaud.',
};
const careTip=i=>i.cat==='bas'&&/jean/i.test(i.name)?'Jean : lave-le rarement, sur l’envers, à 30 °C. Entre deux, aère-le : il garde sa couleur et sa forme.':CARE[i.mat]||'';

/* ---------- rappels ---------- */
function circularNotice(){
 const late=active().filter(i=>i.loan&&daysSince(i.loan.since)>=21);
 const stale=active().filter(i=>i.sale&&daysSince(i.sale.since)>=30);
 let h='';
 if(late.length)h+=`<div class="notice">Prêté depuis plus de 3 semaines : ${late.map(i=>`<b>${esc(i.name)}</b> (${esc(i.loan.to)})`).join(', ')}. Pense à le récupérer !</div>`;
 if(stale.length)h+=`<div class="notice">En vente depuis plus d’un mois : ${stale.map(i=>`<b>${esc(i.name)}</b>`).join(', ')}. Baisser le prix, ou le donner ? <a href="#penderie">Voir</a></div>`;
 return h;
}

Object.assign(A,{
 secondLife(el){secondLifeSheet(el.dataset.id)},
 slSell(el){adSheet(el.dataset.id,'vente')},
 slGive(el){adSheet(el.dataset.id,'don')},
 slDrop(el){dropSheet(el.dataset.id)},
 slRepair(el){repairSheet(el.dataset.id)},
 slTransform(el){transformSheet(el.dataset.id)},
 slLend(el){lendSheet(el.dataset.id)},
 slSwap(el){const i=item(el.dataset.id);i.swap=!i.swap;OUTS=null;save();closeSheet();render();toast(i.swap?'Mis de côté pour un troc':'Retour dans la penderie')},
 adEtat(el){const i=item(el.dataset.id);keepAd(i);i.etat=el.dataset.v;save();adSheet(i.id,el.dataset.k)},
 adCopy(el){const i=item(el.dataset.id);keepAd(i);const t=adText(i,el.dataset.k);
  navigator.clipboard.writeText(`${t.title}\n\n${t.body}`).then(()=>toast('Annonce copiée')).catch(()=>toast('Copie impossible ici'))},
 adShare(el){const i=item(el.dataset.id);keepAd(i);save();adShare(i,el.dataset.k)},
 saleStart(el){const i=item(el.dataset.id);const p=keepAd(i);i.sale={since:(i.sale&&i.sale.since)||todayKey(),price:p};OUTS=null;save();closeSheet();render();toast('En vente : bonne chance !')},
 saleStop(el){const i=item(el.dataset.id);i.sale=null;OUTS=null;save();secondLifeSheet(i.id);render()},
 soldAsk(el){const i=item(el.dataset.id);
  sheet(`<h2 style="margin-top:0">Vendu ! 🎉</h2><p class="label">Prix de vente</p><div class="row" style="flex-wrap:nowrap"><input type="text" inputmode="decimal" id="soldP" value="${i.sale&&i.sale.price?String(i.sale.price).replace('.',','):''}" style="max-width:140px"><span class="muted">€</span></div>
  <p class="tiny" style="margin-top:6px">Il sera déduit de son coût par port.</p><div class="spacer"></div><button class="btn block" data-a="soldDo" data-id="${i.id}">Valider</button>`)},
 soldDo(el){const i=item(el.dataset.id);i.resale=parsePrice($('#soldP').value)||0;i.sale=null;i.removed={date:todayKey(),reason:'vendu'};OUTS=null;save();closeSheet();render();toast(i.resale?`${eur(i.resale)} récupérés ♻︎`:'Vendu ♻︎')},
 lendDo(el){const i=item(el.dataset.id),to=$('#lendTo').value.trim();if(!to){toast('À qui ?');return}i.loan={to,since:todayKey()};OUTS=null;save();closeSheet();render();toast('Prêté à '+to)},
 loanBack(el){const i=item(el.dataset.id);i.loan=null;OUTS=null;save();closeSheet();render();toast('De retour dans la penderie')},
});

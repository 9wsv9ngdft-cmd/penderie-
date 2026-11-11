// Dress Up — Lot 4 : assistant shopper local (aucune donnée ne sort du téléphone)
"use strict";

const TONES={complice:'Complice et taquin',doux:'Doux et bienveillant',sobre:'Sobre et efficace',pep:'Plein d’énergie'};
const bot=()=>S.bot||(S.bot={name:'',tone:'complice',budget:null,fb:{up:0,down:0,streak:0}});
const botName=()=>bot().name||'ton assistant';
const pickR=a=>a[Math.floor(Math.random()*a.length)];
const T=(o)=>{const v=o[bot().tone]||o.complice;return Array.isArray(v)?pickR(v):v};
const SAMPLE={complice:'Encore un pull gris ? Tu en as déjà 4… 😏',doux:'Tu as déjà de jolis pulls, peut-être que l’un d’eux ferait l’affaire ?',sobre:'Tu possèdes déjà 4 pulls gris.',pep:'Attends attends : 4 pulls gris déjà ! On fouille d’abord ta penderie ? 🙌'};

/* ---------- compréhension : intention + détails ---------- */
const normTxt=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,' ');
const INTENTS=[
 ['bonjour',/^(bonjour|salut|coucou|hello|hey|yo|bonsoir)\b/],
 ['merci',/\b(merci|top|super|genial|parfait|cool)\b/],
 ['nom',/(comment tu t appelles|ton nom|qui es tu|t es qui)/],
 ['achat',/(achet|craqu|envie d|je veux (un|une|des)|j ai vu|commander|shopping|soldes|ca vaut le coup|je prends|tentee?|tente par)/],
 ['budget',/(budget|depense|combien.*(reste|depens)|argent|thune|sous\b|fric)/],
 ['manque',/(manque|besoin de quoi|qu est ce qu il me faut|il me faut quoi|trou dans ma (penderie|garde)|complete)/],
 ['semaine',/(semaine|planning|prochains jours|demain)/],
 ['tenue',/(mettre|porter|tenue|habiller|rien a me mettre|quoi mettre|look|aujourd hui)/],
 ['vendre',/(vend|vinted|leboncoin|bon coin|donner|debarrass|trop de (fringues|vetements|trucs)|trier|tri\b|place)/],
 ['reparer',/(repar|trou\b|bouton|ourlet|couture|dechir|accroc|recoudre)/],
 ['valise',/(valise|voyage|vacances|week ?end|partir)/],
 ['lessive',/(lessive|machine|laver|linge|sale\b|chaussettes|dessous)/],
 ['bilan',/(bilan|stat|co2|carbone|empreinte|ecolo|planete)/],
];
const KW=[['veste','veste'],['blouson','veste'],['manteau','veste'],['doudoune','veste'],['trench','veste'],['parka','veste'],['blazer','veste'],
 ['pull','pull'],['sweat','pull'],['gilet','pull'],['hoodie','pull'],['polaire','pull'],
 ['jean','bas'],['pantalon','bas'],['jupe','bas'],['short','bas'],['jogging','bas'],['legging','bas'],['chino','bas'],
 ['robe','robe'],['combinaison','robe'],
 ['t-shirt','haut'],['tshirt','haut'],['tee','haut'],['chemise','haut'],['top','haut'],['polo','haut'],['debardeur','haut'],['blouse','haut'],['haut','haut'],
 ['basket','chaussures'],['sneaker','chaussures'],['chaussure','chaussures'],['botte','chaussures'],['bottine','chaussures'],['sandale','chaussures'],['mocassin','chaussures'],['escarpin','chaussures']];
function detect(text){
 const n=normTxt(text);
 const it=(INTENTS.find(([,r])=>r.test(n))||[null])[0];
 const pm=n.match(/(\d+(?:[.,]\d+)?)\s*(€|e\b|eur|euros?|balles|boules)/)||n.match(/(?:a|pour)\s+(\d+(?:[.,]\d+)?)\b/);
 const price=pm?parseFloat(pm[1].replace(',','.')):null;
 const kw=KW.find(([k])=>n.includes(k));
 const col=COLORS.map(c=>c[0]).find(c=>new RegExp('\\b'+normTxt(c)).test(n));
 const noun=kw?kw[0].replace('tshirt','t-shirt'):null;
 return{it:it||(kw?'achat':null),price,cat:kw?kw[1]:null,noun,col};
}

/* ---------- réponses ---------- */
const plural=(n,w)=>`${n} ${w}${n>1&&!/[sx]$/.test(w)?'s':''}`;
function monthSpent(){const m=todayKey().slice(0,7);return S.items.filter(i=>i.boughtAt&&i.boughtAt.slice(0,7)===m).reduce((s,i)=>s+(i.price||0),0)}
function budgetLine(price){
 const b=bot().budget;if(!b)return '';const left=b-monthSpent();
 if(price)return price>left?`💸 ${eur(price)}, ça dépasse ce qu’il te reste ce mois-ci (${eur(Math.max(0,left))} sur ${eur(b)}).`:`💶 ${eur(price)}, c’est ${Math.round(price/b*100)} % de ton budget du mois. Il t’en resterait ${eur(left-price)}.`;
 return `💶 Il te reste ${eur(Math.max(0,left))} sur ${eur(b)} ce mois-ci.`;
}
function replyAchat(d,text){
 if(!d.cat)return{t:T({complice:'Raconte : tu as craqué sur quoi ? Un pull, une veste, des baskets ?',doux:'Dis-moi ce qui te fait envie, je regarde ce que tu as déjà.',sobre:'Quel type de vêtement ?',pep:'Ooh, un achat ! C’est quoi ? Dis-moi tout !'}),
  acts:['pull','veste','bas','chaussures'].map(c=>[cat(c).label,'botAsk',{v:`j'ai envie d'un ${cat(c).label.toLowerCase()}`}])};
 const same=active().filter(i=>i.cat===d.cat),sameCol=d.col?same.filter(i=>i.color===d.col):[];
 const sleep=same.filter(i=>!i.lastWorn||daysSince(i.lastWorn)>60);
 const what=d.noun||cat(d.cat).label.toLowerCase();
 const L=[];
 if(same.length){
  const n=sameCol.length||same.length,w=sameCol.length?`${what} ${d.col}`:cat(d.cat).label.toLowerCase();
  L.push(T({complice:[`Encore ? Tu as déjà ${plural(n,w)}… 😏`,`Hmm, ${plural(n,w)} dans ta penderie, et tu en veux encore ?`],doux:`Tu as déjà ${plural(n,w)}, peut-être que l’un d’eux ferait l’affaire ?`,sobre:`Tu possèdes déjà ${plural(n,w)}.`,pep:`Attends attends : tu as déjà ${plural(n,w)} ! 🙌`}));
  if(sleep.length)L.push(`Et ${sleep.length>1?`${sleep.length} d’entre eux dorment`:'l’un d’eux dort'} depuis plus de 2 mois${sleep.length===1?` (${esc(sleep[0].name)})`:''}.`);
 }else L.push(T({complice:'Tiens, tu n’as rien de ce genre. Ça peut être un vrai manque, pour une fois 😄',doux:'Tu n’as rien de ce type : ça peut combler un vrai manque.',sobre:'Aucun équivalent dans ta penderie.',pep:'Rien de pareil chez toi : ça pourrait être un vrai plus !'}));
 const bl=budgetLine(d.price);if(bl)L.push(bl);
 const co=co2Of({cat:d.cat,name:what});L.push(`🌱 En seconde main, tu éviterais ~${fmtKg(co.kg*FAB_SHARE)} CO₂e (${eq(co.kg*FAB_SHARE,seedOf(what))}).`);
 L.push(T({complice:'Je te le note dans tes envies et on en reparle dans 5 jours ?',doux:'On le note dans tes envies, et tu décides dans 5 jours ?',sobre:'Proposition : l’ajouter aux envies (5 jours de réflexion).',pep:'Je le mets dans tes envies ? Rendez-vous dans 5 jours !'}));
 const name=(what[0].toUpperCase()+what.slice(1))+(d.col?' '+d.col:'');
 return{t:L.join('<br>'),acts:[['Noter l’envie','botWish',{n:name,c:d.cat,col:d.col||'',p:d.price||''}],['Chercher en seconde main','link',{href:`https://www.vinted.fr/catalog?search_text=${encodeURIComponent(name)}`}],['Laisse tomber 👍','botDrop',{}]]};
}
function gaps(){
 const a=inUse(),g=[];const cnt=c=>a.filter(i=>i.cat===c).length;
 if(curSeason()==='hiver'&&!a.some(i=>i.cat==='veste'&&i.warmth>=3))g.push('un manteau chaud pour l’hiver');
 if(!a.some(i=>i.cat==='veste'&&i.waterproof))g.push('une veste imperméable pour les jours de pluie');
 if(cnt('haut')<5)g.push('quelques hauts (tu en as '+cnt('haut')+')');
 if(cnt('bas')+cnt('robe')<2)g.push('un bas de plus');
 if(!cnt('chaussures'))g.push('une paire de chaussures');
 const ag=Object.values(agenda());['boulot','sport'].forEach(o=>{if(ag.includes(o)&&!a.some(i=>occsOf(i).includes(o)))g.push(`des vêtements pour le ${OCCS[o].toLowerCase()} (ou tague ceux que tu as)`)});
 return g;
}
function reply(text){
 const d=detect(text),open=T({complice:['','Alors… ','Voyons voir. '],doux:['','Je regarde. '],sobre:[''],pep:['Yes ! ','Allez, ']});
 switch(d.it){
  case 'bonjour':return{t:`${T({complice:'Salut ! Qu’est-ce qu’on manigance aujourd’hui ?',doux:'Bonjour 🌿 Comment je peux t’aider ?',sobre:'Bonjour. Que veux-tu savoir ?',pep:'Hello ! Prêt·e pour une journée stylée et écolo ?'})}`,acts:quick()};
  case 'merci':return{t:T({complice:'Avec plaisir. Je reste dans le coin 😉',doux:'Avec plaisir 🌱',sobre:'De rien.',pep:'Toujours là pour toi ! 💚'})};
  case 'nom':return{t:bot().name?`Je m’appelle ${esc(bot().name)}. C’est toi qui as choisi 😊`:'Je n’ai pas encore de nom. Tu m’en donnes un dans Bilan → Réglages ?'};
  case 'achat':return replyAchat(d,text);
  case 'budget':{if(!bot().budget)return{t:'Tu n’as pas encore de budget. On en fixe un par mois ?',acts:[30,50,80,120].map(v=>[eur(v),'botBudget',{v}])};
   return{t:open+budgetLine(null)+`<br>Dépensé ce mois-ci : ${eur(monthSpent())}.`}}
  case 'manque':{const g=gaps();
   return{t:g.length?open+`Ce qui pourrait vraiment manquer :<br>• ${g.slice(0,3).join('<br>• ')}<br>${T({complice:'Et pour le reste, ta penderie tient la route 👌',doux:'Pour le reste, tu es bien équipé·e.',sobre:'Le reste est complet.',pep:'Le reste ? Nickel ! ✨'})}`
    :T({complice:'Franchement ? Rien. Ta penderie est complète. Ton portefeuille te remercie 😏',doux:'Rien ne manque vraiment : ta penderie est complète 🌿',sobre:'Rien ne manque.',pep:'Rien ne manque, bravo ! 🎉'})}}
  case 'tenue':{const w=effWeather();if(!w)return{t:'Dis-moi d’abord le temps qu’il fait, sur l’écran du matin.',acts:[['Ce matin','go',{v:'matin'}]]};
   const o=(OUTS||genOutfits(w))[0];if(!o)return{t:'Plus rien de propre… C’est le jour de la lessive 🫧'};
   return{t:open+`Avec ce temps (${BANDS[w.band].l.toLowerCase()}${w.rain?', pluie':''}), je verrais bien : <b>${esc(o.map(id=>item(id).name).join(' + '))}</b>.`,acts:[['Voir les idées','go',{v:'matin'}]]}}
  case 'semaine':return{t:open+'Je te prépare ta semaine, avec la météo et ton agenda type.',acts:[['Ouvrir ma semaine','weekOpen',{}]]};
  case 'vendre':{const s=active().filter(i=>!outOfCircuit(i)&&(i.lastWorn?daysSince(i.lastWorn)>=90:daysSince(i.added)>=60)).slice(0,3);
   return{t:s.length?open+`Ces pièces dorment depuis un moment : ${s.map(i=>`<b>${esc(i.name)}</b>`).join(', ')}. Une seconde vie ?`:'Tout ce que tu as sert en ce moment. Rien à trier !',acts:s.map(i=>[i.name,'open',{id:i.id}])}}
  case 'reparer':{const n=active().filter(i=>i.state==='reparer').length;
   return{t:n?`${plural(n,'vêtement')} attend${n>1?'ent':''} une réparation. On sort le kit couture ?`:'Rien à réparer pour l’instant. Marque un vêtement « à réparer » depuis sa fiche.',acts:n?[['Session réparation','sessionOpen',{}]]:[]}}
  case 'valise':return{t:open+'Dis-moi où tu pars, je regarde la météo là-bas et je te fais une valise légère.',acts:[['Préparer une valise','tripOpen',{}]]};
  case 'lessive':{const g=laundry(),f=fullGroups();const parts=Object.entries(WASH).filter(([k])=>g[k].items.length).map(([k,l])=>`${l.toLowerCase()} ${Math.round(Math.min(100,g[k].kg/(capKg()*FULL)*100))} %`);
   return{t:(f.length?`Machine pleine : ${f.map(k=>WASH[k].toLowerCase()).join(', ')} ! `:parts.length?`Panier : ${parts.join(', ')}. Pas encore de quoi faire une machine pleine. `:'Rien au sale. ')+(poolTot()||uTot('chaussettes')?`Dessous propres : ${uClean('chaussettes')} paires de chaussettes, ${poolClean()} culottes/boxers/slips.`:'')}}
  case 'bilan':{const av=S.items.filter(isSecondHand).reduce((s,i)=>s+co2Of(i).kg*FAB_SHARE,0)+((S.stats||{}).repairCo2||0);
   return{t:open+`Grâce à toi : ~${fmtKg(av)} CO₂e évités (${eq(av,3)}), ${Object.keys(S.badges||{}).length} badge${Object.keys(S.badges||{}).length>1?'s':''}.`,acts:[['Voir le bilan','go',{v:'bilan'}]]}}
 }
 return{t:T({complice:'Je ne suis pas sûr de te suivre 🤔 Tu voulais parler de…',doux:'Je ne suis pas sûr de comprendre. Tu voulais parler de…',sobre:'Pas compris. Sujet ?',pep:'Oups, je n’ai pas tout capté ! C’était à propos de…'}),acts:quick()};
}
const quick=()=>[['Je veux acheter un truc','botAsk',{v:'j’ai envie d’acheter un truc'}],['Je mets quoi ?','botAsk',{v:'je mets quoi aujourd’hui'}],['Qu’est-ce qui me manque ?','botAsk',{v:'qu’est-ce qui me manque'}],['Mon budget','botAsk',{v:'où j’en suis de mon budget'}],['Ma semaine','botAsk',{v:'prépare ma semaine'}],['Trier ma penderie','botAsk',{v:'je veux vendre ou donner'}]];

/* ---------- fenêtre de discussion ---------- */
const chat=()=>S.chat||(S.chat=[]);
function msgPush(m){chat().push({id:uid(),...m});if(chat().length>40)S.chat=chat().slice(-40);save()}
function botPush(kind,v){
 const t=kind==='badge'?T({complice:`Pas mal du tout : badge ${esc(v.t)} débloqué 😎`,doux:`Bravo, tu as débloqué le badge ${esc(v.t)} 🌱`,sobre:`Badge débloqué : ${esc(v.t)}.`,pep:`WOUHOU ! Badge ${esc(v.t)} ! 🎉`}):v.t;
 msgPush({from:'bot',t});S.chatUnread=true;save();botBadge();
}
function botBadge(){const b=$('#botBtn');if(b){b.classList.toggle('unread',!!S.chatUnread);b.hidden=VIEW==='ajout'}}
function actBtn([l,a,attrs]){
 if(a==='link')return `<a class="chip" href="${esc(attrs.href)}" target="_blank" rel="noopener">${esc(l)}</a>`;
 return `<button class="chip" data-a="${a}" ${Object.entries(attrs).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')}>${esc(l)}</button>`;
}
function chatSheet(){
 S.chatUnread=false;save();botBadge();
 if(!chat().length)msgPush({from:'bot',t:`${T({complice:'Salut ! Moi c’est',doux:'Bonjour, je suis',sobre:'Je suis',pep:'Hello ! Moi c’est'})} ${esc(botName())}. ${T({complice:'Je connais ta penderie par cœur (et tes petites faiblesses 😏).',doux:'Je connais ta penderie et je suis là pour t’aider à faire de bons choix.',sobre:'Je connais ta penderie et ton budget.',pep:'Je connais ta penderie et on va faire des merveilles ensemble ! ✨'})} Écris-moi ou utilise le micro du clavier.`,acts:quick()});
 const last=chat()[chat().length-1];
 sheet(`<div class="row between" style="margin-bottom:6px"><h2 style="margin:0">💬 ${esc(botName())}</h2><span class="tiny">reste sur ton téléphone</span></div>
 <div id="chatLog">${chat().map(m=>`<div class="msg ${m.from}">${m.t}${m.from==='bot'&&m.acts&&m.acts.length&&m===last?`<div class="chips" style="margin-top:8px">${m.acts.map(actBtn).join('')}</div>`:''}
  ${m.from==='bot'&&m!==chat()[0]?`<div class="fb">${m.fb?(m.fb>0?'👍':'👎'):`<button data-a="botFb" data-id="${m.id}" data-v="1">👍</button><button data-a="botFb" data-id="${m.id}" data-v="-1">👎</button>`}</div>`:''}</div>`).join('')}</div>
 <form class="row chatbar" data-f="chat" style="flex-wrap:nowrap"><input type="text" name="q" placeholder="Écris ou dicte avec 🎤" autocomplete="off"><button class="btn sm">Envoyer</button></form>`);
 const c=$('.sheet-card');if(c)c.scrollTop=c.scrollHeight;
}
function botSay(text){
 msgPush({from:'me',t:esc(text)});
 const r=reply(text);msgPush({from:'bot',t:r.t,acts:r.acts||[]});chatSheet();
}
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-f=chat]');if(!f)return;e.preventDefault();const v=f.q.value.trim();if(v)botSay(v)});

/* ---------- réglages de l'assistant (accueil + Bilan) ---------- */
function botSettings(inOnb){
 return `${inOnb?'':'<p class="label" style="margin-top:0">Ton assistant</p>'}<input type="text" id="botName" value="${esc(bot().name)}" placeholder="Son nom (ex. Fripe, Léon…)" autocomplete="off">
 <p class="label">Son caractère</p><div class="chips">${Object.entries(TONES).map(([k,l])=>`<button class="chip ${bot().tone===k?'on':''}" data-a="botTone" data-v="${k}" ${inOnb?'data-onb="1"':''}>${l}</button>`).join('')}</div>
 <p class="tiny" style="margin-top:8px">« ${SAMPLE[bot().tone]} »</p>
 <p class="label">Budget vêtements par mois <span style="text-transform:none;font-weight:400">(facultatif)</span></p><div class="row" style="flex-wrap:nowrap"><input type="text" inputmode="decimal" id="botBudget" value="${bot().budget||''}" placeholder="ex. 50" style="max-width:140px"><span class="muted">€</span></div>`;
}
const keepBot=()=>{const n=$('#botName'),b=$('#botBudget');if(n)bot().name=n.value.trim();if(b)bot().budget=parsePrice(b.value);save()};

Object.assign(A,{
 chatOpen:chatSheet,
 botAsk(el){botSay(el.dataset.v)},
 botWish(el){const p=parseFloat(el.dataset.p)||null;wishes().push({id:uid(),name:el.dataset.n,cat:el.dataset.c,color:el.dataset.col||'noir',price:p,ref:'',added:todayKey(),decided:null});save();
  msgPush({from:'bot',t:T({complice:'C’est noté. On en reparle dans 5 jours, et on verra si l’envie a tenu 😉',doux:'C’est noté dans tes envies. Prends le temps d’y réfléchir 🌿',sobre:'Ajouté aux envies.',pep:'Noté ! Rendez-vous dans 5 jours ! ⏳'})});chatSheet()},
 botDrop(){const st=S.stats||(S.stats={});st.botDrops=(st.botDrops||0)+1;msgPush({from:'bot',t:T({complice:'Sage décision. Ta penderie et la planète te disent merci 😌',doux:'Belle décision 🌱',sobre:'Noté.',pep:'Bravo ! Un achat évité, c’est ça la vraie mode 💚'})});chatSheet()},
 botBudget(el){bot().budget=+el.dataset.v;save();msgPush({from:'bot',t:`Budget fixé à ${eur(+el.dataset.v)} par mois. ${budgetLine(null)}`});chatSheet()},
 go(el){closeSheet();location.hash=el.dataset.v},
 botFb(el){const m=chat().find(x=>x.id===el.dataset.id);if(!m)return;m.fb=+el.dataset.v;const f=bot().fb||(bot().fb={up:0,down:0,streak:0});
  if(m.fb>0){f.up++;f.streak=0}else{f.down++;f.streak=(f.streak||0)+1}
  save();
  if(f.streak>=2){f.streak=0;msgPush({from:'bot',t:'Je sens que je ne tombe pas juste… Tu préfères que je sois plutôt :',acts:Object.entries(TONES).filter(([k])=>k!==bot().tone).map(([k,l])=>[l,'botTone',{v:k}])})}
  chatSheet()},
 botTone(el){keepBot();bot().tone=el.dataset.v;save();
  if(el.dataset.onb)onbSheet();else if(!$('#sheet').hidden&&$('#chatLog')){msgPush({from:'bot',t:T({complice:'Ok, je reste moi-même, mais en mieux 😏',doux:'D’accord, je serai plus doux 🌿',sobre:'Compris.',pep:'Super, on y va avec plein d’énergie ! ⚡'})});chatSheet()}else render()},
 botSave(){keepBot();render();toast('Assistant enregistré')},
});

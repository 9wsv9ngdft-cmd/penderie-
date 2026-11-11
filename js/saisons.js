// Dress Up — Saisons : vêtements rangés, changement été / hiver
"use strict";

/* ---------- saisons ---------- */
const SEASONS={toutes:'Toutes saisons',ete:'Été',hiver:'Hiver'};
const seasonByDate=(d=new Date())=>{const m=d.getMonth()+1;return m>=4&&m<=9?'ete':'hiver'};
const curSeason=()=>S.season||seasonByDate();
const stored=i=>!!i.season&&i.season!=='toutes'&&i.season!==curSeason();
const inUse=()=>active().filter(i=>!stored(i)&&!paused(i)&&!outOfCircuit(i));
const seasonGuess=n=>/short|sandale|débardeur|en lin/i.test(n||'')?'ete':/doudoune|manteau|polaire|en laine|bottine/i.test(n||'')?'hiver':'toutes';
function seasonNotice(){
 const next=seasonByDate();if(next===curSeason())return'';
 if(S.seasonSnooze&&daysSince(S.seasonSnooze)<14)return'';
 const out=active().filter(i=>i.season===curSeason()).length,back=active().filter(i=>i.season===next).length;
 if(!out&&!back){S.season=next;save();return''}
 return `<div class="notice"><b>Changement de saison ?</b> On passe la penderie en mode ${SEASONS[next].toLowerCase()} : ${out} vêtement${out>1?'s':''} à ranger, ${back} à ressortir.
 <div class="row" style="margin-top:10px"><button class="btn sm" data-a="seasonSwitch" data-v="${next}">Faire le changement</button><button class="btn sm ghost" data-a="seasonSnooze">Plus tard</button></div></div>`;
}
function seasonSheet(prev,next){
 const out=active().filter(i=>i.season===prev),back=active().filter(i=>i.season===next);
 const unworn=out.filter(i=>!i.lastWorn||daysSince(i.lastWorn)>=180);
 sheet(`<h2 style="margin-top:0">Mode ${SEASONS[next].toLowerCase()} activé</h2>
 ${out.length?`<p class="label">Rangés (${out.length})</p><div class="hlist">${out.map(i=>`<div class="it">${thumb(i)}<div class="nm">${esc(i.name)}</div></div>`).join('')}</div>`:''}
 ${back.length?`<p class="label">Ressortis (${back.length})</p><div class="hlist">${back.map(i=>`<div class="it">${thumb(i)}<div class="nm">${esc(i.name)}</div></div>`).join('')}</div>`:''}
 <div class="card" style="margin-top:14px"><h3>Avant de ranger</h3><p class="tiny">Lave ce qui est sale (ranger sale attire les mites), mets de côté ce qui est à réparer : c’est le bon moment pour le faire.</p>
 ${unworn.length?`<p class="tiny"><b>${unworn.length} pas porté${unworn.length>1?'s':''} de la saison</b> : ${unworn.map(i=>esc(i.name)).join(', ')}. Les garder, ou leur offrir une seconde vie ?</p>`:''}</div>
 <button class="btn block" data-a="close">C’est noté</button>`);
}

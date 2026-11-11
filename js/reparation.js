// Dress Up — Session réparation : matériel à sortir, pas-à-pas, retoucheurs
"use strict";

/* ---------- session réparation ---------- */
const KINDS={bouton:'Bouton',ourlet:'Ourlet',trou:'Trou',maille:'Maille tirée',fermeture:'Fermeture',bouloches:'Bouloches',autre:'Autre'};
const MATOS={bouton:['fil assorti','aiguille','bouton de rechange'],ourlet:['épingles','fil','aiguille','fer à repasser (ou bande thermocollante)'],trou:['fil ou laine assortis','aiguille à repriser','un œuf à repriser (ou une ampoule)'],
 maille:['crochet fin ou aiguille à laine'],fermeture:['pince plate'],bouloches:['rasoir anti-bouloches ou peigne'],autre:['kit couture de base']};
function sessionSheet(){
 const rep=active().filter(i=>i.state==='reparer');
 const kinds=[...new Set(rep.map(i=>i.repairKind||'autre'))];const matos=[...new Set(kinds.flatMap(k=>MATOS[k]))];
 sheet(`<h2 style="margin-top:0">🧵 Session réparation</h2>
 ${rep.length?`<div class="card"><b>Matériel à sortir</b><p class="tiny" style="margin:6px 0 0">${matos.join(' · ')}</p></div>
 ${rep.map(i=>`<div class="card"><div class="row" style="flex-wrap:nowrap;gap:12px">${thumb(i,'ph mini')}<div style="flex:1;min-width:0"><b>${esc(i.name)}</b>
  <div class="chips" style="margin-top:6px">${Object.entries(KINDS).map(([k,l])=>`<button class="chip ${(i.repairKind||'autre')===k?'on':''}" style="padding:4px 9px;font-size:12px" data-a="repKind" data-id="${i.id}" data-v="${k}">${l}</button>`).join('')}</div></div></div>
  ${(()=>{const r=REPAIRS.find(([t])=>t.toLowerCase().includes((KINDS[i.repairKind]||'').toLowerCase().split(' ')[0])&&i.repairKind&&i.repairKind!=='autre');return r?`<details><summary>Comment faire</summary><p>${r[1]}</p></details>`:''})()}
  <div class="row" style="margin-top:8px"><button class="btn sm" data-a="repDone" data-id="${i.id}">Réparé ✓</button></div><p class="tiny" style="margin:8px 0 0">Ou confie-le à un retoucheur près de chez toi :</p>${mapsLinks('retoucherie')}</div>`).join('')}`
 :'<p class="muted">Rien à réparer pour l’instant. Bravo !</p>'}
 ${(S.stats&&S.stats.repairs)?`<p class="tiny">Déjà ${S.stats.repairs} réparation${S.stats.repairs>1?'s':''} au compteur 🌱</p>`:''}`);
}


/* ---------- actions ---------- */
Object.assign(A,{
 sessionOpen:sessionSheet,
 repKind(el){item(el.dataset.id).repairKind=el.dataset.v;save();sessionSheet()},
 repDone(el){const i=item(el.dataset.id);i.state='propre';i.sinceWash=0;i.repaired=(i.repaired||0)+1;const st=S.stats||(S.stats={});st.repairs=(st.repairs||0)+1;st.repairCo2=(st.repairCo2||0)+co2Of(i).kg*FAB_SHARE;
  OUTS=null;save();sessionSheet();render();toast('Réparé ! Il repart pour un tour 🧵')},
});

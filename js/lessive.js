// Dress Up — Format des prix, panier à linge et lessive pleine
"use strict";

/* ---------- format ---------- */
const eur=n=>(Math.round(n*100)/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:(n<10||Math.round(n*100)%100)?2:0,maximumFractionDigits:2});

/* ---------- lessive pleine ---------- */
const WASH={clair:'Clair',fonce:'Foncé',couleur:'Couleurs'};
const WASH_OF_COLOR={blanc:'clair',beige:'clair',noir:'fonce',marine:'fonce',marron:'fonce',bordeaux:'fonce',kaki:'fonce',gris:'fonce',violet:'fonce',vert:'fonce'};
const washOf=i=>i.wash||WASH_OF_COLOR[i.color]||'couleur';
// poids moyens approximatifs d'un vêtement sec (kg) : sert juste à estimer le remplissage du tambour
const KG={haut:.2,pull:.5,bas:.6,robe:.35,veste:1.1,chaussures:0};
const kgOf=i=>KG[i.cat]??.3;
const capKg=()=>S.machineKg||7;
const FULL=.8; // « pleine » = environ 80 % de la capacité : tambour bien rempli sans être tassé
function laundry(){
 const g={};for(const k in WASH)g[k]={items:[],kg:0};
 active().filter(i=>i.state==='sale'&&maxOf(i)>0).forEach(i=>{const k=washOf(i);g[k].items.push(i);g[k].kg+=kgOf(i)});
 return g;
}
const fullGroups=()=>{const g=laundry();return Object.keys(g).filter(k=>g[k].kg>=capKg()*FULL)};
function laundryCard(){
 const g=laundry();if(!Object.values(g).some(x=>x.items.length))return'';
 return `<div class="card"><div class="row between"><h3 style="margin:0">Panier à linge</h3><span class="tiny">machine de ${capKg()} kg</span></div>
 ${Object.entries(WASH).map(([k,l])=>{const x=g[k];if(!x.items.length)return'';
  const pct=Math.min(100,x.kg/(capKg()*FULL)*100),full=pct>=100;
  return `<div style="margin-top:12px"><div class="row between"><span><b>${l}</b> <span class="tiny">${x.items.length} pièce${x.items.length>1?'s':''} · ~${x.kg.toFixed(1).replace('.',',')} kg</span></span>${full?`<button class="btn sm" data-a="washOpen" data-v="${k}">Machine pleine</button>`:`<span class="tiny">${Math.round(pct)} %</span>`}</div><div class="bar"><i class="${full?'':'wait'}" style="width:${pct}%"></i></div></div>`}).join('')}
 <div class="spacer"></div><button class="btn sm ghost" data-a="washOpen">Lessive faite</button>
 <p class="tiny" style="margin-top:8px">On attend la machine pleine : moins d’eau et d’énergie par vêtement. Remplissage estimé au poids moyen des vêtements.</p></div>`;
}
function laundryNotice(){
 const f=fullGroups();if(!f.length)return'';
 return `<div class="notice">Machine pleine : <b>${f.map(k=>WASH[k].toLowerCase()).join(', ')}</b>. Un lavage à 30 °C ce soir ? <a href="#penderie">Voir le panier</a></div>`;
}

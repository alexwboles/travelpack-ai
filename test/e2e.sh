#!/usr/bin/env bash
# TravelPack AI e2e tests — 6 flows exercising real logic in Node. Exit non-zero on failure.
set -u
cd "$(dirname "$0")/.."
pass=0; fail=0
flow() { # $1 = description, $2 = node script
  if node -e "$2" >/dev/null 2>&1; then echo "PASS: $1"; pass=$((pass+1));
  else echo "FAIL: $1"; fail=$((fail+1)); fi
}

flow "beach+hot includes swimsuit and sunscreen, not warm coat" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'beach',days:5,weather:'hot'});
  const names=Object.values(g).flat().map(i=>i.n).join('|');
  if(!names.includes('Swimsuit')) throw new Error('missing swimsuit');
  if(!names.includes('Sunscreen')) throw new Error('missing sunscreen');
  if(names.includes('Warm coat')) throw new Error('warm coat leaked into beach/hot');"

flow "business trip includes blazer, not hiking boots" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'business',days:3,weather:'cool'});
  const names=Object.values(g).flat().map(i=>i.n).join('|');
  if(!names.includes('Blazer / suit jacket')) throw new Error('missing blazer');
  if(names.includes('Hiking boots')) throw new Error('hiking boots leaked into business');"

flow "hiking trip includes boots and first-aid kit" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'hiking',days:4,weather:'cool'});
  const names=Object.values(g).flat().map(i=>i.n).join('|');
  if(!names.includes('Hiking boots')) throw new Error('missing boots');
  if(!names.includes('First-aid kit')) throw new Error('missing first-aid');"

flow "rainy weather adds rain jacket and umbrella" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'city',days:2,weather:'rainy'});
  const names=Object.values(g).flat().map(i=>i.n).join('|');
  if(!names.includes('Rain jacket')) throw new Error('missing rain jacket');
  if(!names.includes('Umbrella')) throw new Error('missing umbrella');"

flow "essentials surface in don't-forget strip" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'city',days:2,weather:'warm'});
  const miss=L.essentialItems(g).map(i=>i.n).join('|');
  if(!miss.includes('Passport / photo ID')) throw new Error('passport not essential: '+miss);
  const c=L.countItems(g);
  if(c.essential<5) throw new Error('too few essentials: '+c.essential);"

flow "packingTip returns a relevant tip per trip type" "
  const L=require('./js/logic.js');
  const t1=L.packingTip('hiking','cool',4), t2=L.packingTip('cruise','warm',7);
  if(!t1.length||!t2.length) throw new Error('empty tips');
  if(t1===t2) throw new Error('tips not differentiated');"

flow "custom item joins a generated list and survives in its category" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'city',days:2,weather:'warm'});
  const items=[...Object.values(g).flat(), L.makeCustomItem({n:'Pillow spray',cat:'extras',qty:1})];
  const c=L.countItems({extras:items.filter(i=>i.cat==='extras')});
  if(c.total<1) throw new Error('custom item lost');
  const csv=L.tripToCSV({items});
  if(!csv.includes('Pillow spray')) throw new Error('custom item missing from CSV');"

flow "search narrows a full packing list to matching items" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'beach',days:5,weather:'hot'});
  const all=Object.values(g).flat();
  const hit=L.filterItems(all,'pass');
  if(!hit.some(i=>i.n.includes('Passport'))) throw new Error('passport not found by search');
  if(hit.length>=all.length) throw new Error('search did not narrow');"

flow "duplicate trip keeps type/days/weather, resets packed, renames" "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'hiking',days:4,weather:'cool'});
  const trip={name:'Alps',tripType:'hiking',days:4,weather:'cool',items:Object.values(g).flat().map(i=>({...i,packed:true}))};
  const d=L.duplicateTrip(trip,'Alps 2027');
  if(d.name!=='Alps 2027') throw new Error('rename failed');
  if(d.tripType!=='hiking'||d.days!==4||d.weather!=='cool') throw new Error('trip attrs lost');
  if(d.items.some(i=>i.packed)) throw new Error('packed not reset');
  if(d.items.length!==trip.items.length) throw new Error('item count changed');
  if(trip.items.some(i=>!i.packed)) throw new Error('original mutated');"

flow "resetPacked clears progress without touching the original list" "
  const L=require('./js/logic.js');
  const items=[{n:'a',packed:true},{n:'b',packed:false}];
  const r=L.resetPacked(items);
  if(r.some(i=>i.packed)) throw new Error('not all reset');
  if(!items[0].packed) throw new Error('original mutated');"

flow "CSV export covers every item with correct packed flags" "
  const L=require('./js/logic.js');
  const items=[{n:'Passport',cat:'documents',qty:1,essential:true,packed:true},{n:'Socks',cat:'clothes',qty:5,essential:false,packed:false}];
  const lines=L.tripToCSV({items}).split('\n');
  if(lines.length!==3) throw new Error('line count '+lines.length);
  if(!lines[1].endsWith(',yes,yes')||!lines[2].endsWith(',no,no')) throw new Error('flags wrong: '+lines[1]+' / '+lines[2]);"

echo "--- e2e: $pass passed, $fail failed ---"
exit $((fail>0))

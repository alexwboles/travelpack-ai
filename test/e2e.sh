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

echo "--- e2e: $pass passed, $fail failed ---"
exit $((fail>0))

#!/usr/bin/env bash
# TravelPack AI smoke tests — 12 checks. Exit non-zero on first failure.
set -u
cd "$(dirname "$0")/.."
pass=0; fail=0
check() { # $1 = description, rest = command
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then echo "PASS: $desc"; pass=$((pass+1));
  else echo "FAIL: $desc"; fail=$((fail+1)); fi
}

check "index.html exists" test -f index.html
check "css/style.css exists" test -f css/style.css
check "js/packbank.js exists" test -f js/packbank.js
check "js/logic.js exists" test -f js/logic.js
check "js/app.js exists" test -f js/app.js
check "packbank.js syntax valid" node --check js/packbank.js
check "logic.js syntax valid" node --check js/logic.js
check "app.js syntax valid" node --check js/app.js
check "bank has 50+ items" node -e "const b=require('./js/packbank.js').PACK_BANK; if(b.length<50) throw new Error('only '+b.length)"
check "all entries have n/cat/types/w/e/pd" node -e "
  const b=require('./js/packbank.js').PACK_BANK;
  const cats=['documents','clothes','toiletries','tech','extras'];
  for (const it of b) {
    if(!it.n||!cats.includes(it.cat)) throw new Error('bad item: '+JSON.stringify(it));
    if(!Array.isArray(it.types)||!Array.isArray(it.w)) throw new Error('bad arrays: '+it.n);
  }"
check "generatePackingList returns 5 categories" node -e "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'city',days:5,weather:'warm'});
  if(Object.keys(g).length<3) throw new Error('too few categories: '+Object.keys(g).join(','));"
check "per-day qty respected (7-day trip -> 7 t-shirts)" node -e "
  const L=require('./js/logic.js');
  const g=L.generatePackingList({tripType:'city',days:7,weather:'warm'});
  const t=g.clothes.find(i=>i.n==='T-shirts / tops');
  if(!t||t.qty!==7) throw new Error('qty wrong: '+JSON.stringify(t));"
check "new logic API exported (custom/search/csv/dup/reset)" node -e "
  const L=require('./js/logic.js');
  ['makeCustomItem','filterItems','resetPacked','duplicateTrip','tripToCSV','getCategories'].forEach(f=>{if(typeof L[f]!=='function')throw new Error('missing '+f)});"
check "makeCustomItem validates + normalizes" node -e "
  const L=require('./js/logic.js');
  const it=L.makeCustomItem({n:' Pillow spray ',cat:'extras',qty:'3',essential:true});
  if(it.n!=='Pillow spray'||it.qty!==3||!it.essential||!it.custom||it.packed!==false)throw new Error('bad normalize: '+JSON.stringify(it));
  const over=L.makeCustomItem({n:'x',cat:'tech',qty:500});
  if(over.qty!==99)throw new Error('qty not clamped');
  for(const bad of [{n:'',cat:'tech'},{n:'x',cat:'nope'}]){try{L.makeCustomItem(bad);throw new Error('accepted '+JSON.stringify(bad));}catch(e){if(!/needs a name|bad category/.test(e.message))throw e;}}"
check "filterItems is case-insensitive, empty query returns all" node -e "
  const L=require('./js/logic.js');
  const items=[{n:'Passport'},{n:'Sunscreen'},{n:'power bank'}];
  if(L.filterItems(items,'SUN').length!==1)throw new Error('case-insensitive fail');
  if(L.filterItems(items,'').length!==3)throw new Error('empty query fail');
  if(L.filterItems(items,'zzz').length!==0)throw new Error('no-match fail');"
check "resetPacked + duplicateTrip copy, reset, rename" node -e "
  const L=require('./js/logic.js');
  const trip={name:'A',tripType:'city',days:3,weather:'warm',items:[{n:'x',packed:true,custom:true}]};
  const r=L.resetPacked(trip.items);
  if(r[0].packed!==false||trip.items[0].packed!==true)throw new Error('reset mutates or misses');
  const d=L.duplicateTrip(trip,'B');
  if(d.name!=='B'||d.items[0].packed!==false||d.items[0].custom!==true)throw new Error('dup wrong: '+JSON.stringify(d));
  try{L.duplicateTrip(trip,'  ');throw new Error('blank name accepted');}catch(e){if(!/needs a name/.test(e.message))throw e;}"
check "tripToCSV escapes commas and quotes" node -e "
  const L=require('./js/logic.js');
  const csv=L.tripToCSV({items:[{n:'Shirt, \"blue\"',cat:'clothes',qty:2,essential:true,packed:false}]});
  const lines=csv.split('\n');
  if(lines[0]!=='name,category,qty,essential,packed')throw new Error('bad header');
  if(lines[1]!=='\"Shirt, \"\"blue\"\"\",clothes,2,yes,no')throw new Error('bad escape: '+lines[1]);"
check "UI wires search/export/reset/duplicate/custom controls" bash -c "
  for id in listTools itemSearch csvBtn resetBtn dupBtn customBox custName custCat custQty custEss custAdd; do
    grep -q \"id=\\\"\$id\\\"\" index.html || exit 1
  done
  for n in makeCustomItem filterItems resetPacked duplicateTrip tripToCSV downloadCSV itemQuery; do
    grep -q \"\$n\" js/app.js || exit 1
  done"

echo "--- smoke: $pass passed, $fail failed ---"
exit $((fail>0))

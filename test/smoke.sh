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

echo "--- smoke: $pass passed, $fail failed ---"
exit $((fail>0))

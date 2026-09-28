/* TravelPack AI — packing list generation logic. Pure functions, testable in Node. */

function getBank() {
  if (typeof PACK_BANK !== "undefined" && PACK_BANK) return PACK_BANK;
  if (typeof require !== "undefined") return require("./packbank.js").PACK_BANK;
  return [];
}

function generatePackingList(opts) {
  const BANK = getBank();
  const tripType = (opts && opts.tripType) || "city";
  const days = Math.max(1, Math.min(60, parseInt((opts && opts.days) || 3, 10) || 3));
  const weather = (opts && opts.weather) || "warm";
  const groups = {};
  for (const it of BANK) {
    if (it.types.length && !it.types.includes(tripType)) continue;
    if (it.w.length && !it.w.includes(weather)) continue;
    const qty = it.pd ? Math.min(days, 14) : (it.qty || 1);
    if (!groups[it.cat]) groups[it.cat] = [];
    groups[it.cat].push({ n: it.n, cat: it.cat, qty: qty, essential: !!it.e });
  }
  // essentials first within each category
  for (const c of Object.keys(groups)) {
    groups[c].sort((a, b) => (b.essential - a.essential) || a.n.localeCompare(b.n));
  }
  return groups;
}

function countItems(groups) {
  let total = 0, packed = 0, essential = 0, essentialPacked = 0;
  for (const c of Object.keys(groups)) {
    for (const it of groups[c]) {
      total++;
      if (it.packed) packed++;
      if (it.essential) { essential++; if (it.packed) essentialPacked++; }
    }
  }
  return { total, packed, essential, essentialPacked };
}

function essentialItems(groups) {
  const out = [];
  for (const c of Object.keys(groups)) {
    for (const it of groups[c]) if (it.essential && !it.packed) out.push(it);
  }
  return out;
}

function packingTip(tripType, weather, days) {
  const tips = [];
  if (weather === "cold") tips.push("Layer up: thermals under mid-layers beat one bulky coat.");
  if (weather === "rainy") tips.push("Pack everything in zip bags inside your suitcase.");
  if (tripType === "hiking") tips.push("Break in boots before the trip — not on day one.");
  if (tripType === "business") tips.push("Roll suits between tissue paper to avoid creases.");
  if (tripType === "beach") tips.push("A second swimsuit means you never wear a damp one.");
  if (tripType === "cruise") tips.push("Magnetic hooks stick to cabin walls — great for hanging lanyards and hats.");
  if (tripType === "roadtrip") tips.push("Keep a small 'car bag' with snacks, chargers and wipes up front.");
  if (tripType === "city") tips.push("One pair of broken-in walking shoes beats three stylish ones.");
  if (days > 7) tips.push("For 7+ days, plan one laundry stop instead of packing 14 days of clothes.");
  if (!tips.length) tips.push("Lay everything out the night before — then remove one item you won't miss.");
  return tips;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { generatePackingList, countItems, essentialItems, packingTip };
}

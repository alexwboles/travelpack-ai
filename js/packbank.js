/* TravelPack AI — packing item bank.
   Item shape: { n, cat, types, w, e, pd, qty }
   n   : item name
   cat : documents | clothes | toiletries | tech | extras
   types: trip types this applies to ([] = all types)
   w   : weather tags this applies to ([] = all weather)
   e   : essential (shown in the "don't forget" strip)
   pd  : per-day quantity (qty = trip days, capped at 14)
   qty : fixed quantity when not per-day
*/
const TRIP_TYPES = ["beach", "city", "hiking", "business", "cruise", "roadtrip"];
const TRIP_LABELS = {
  beach: "Beach vacation", city: "City break", hiking: "Hiking / outdoors",
  business: "Business trip", cruise: "Cruise", roadtrip: "Road trip"
};
const WEATHERS = ["hot", "warm", "cool", "cold", "rainy"];
const WEATHER_LABELS = { hot: "Hot (30C+)", warm: "Warm (20-29C)", cool: "Cool (10-19C)", cold: "Cold (under 10C)", rainy: "Rainy" };
const CATEGORIES = ["documents", "clothes", "toiletries", "tech", "extras"];
const CATEGORY_LABELS = {
  documents: "Documents & money", clothes: "Clothes", toiletries: "Toiletries & health",
  tech: "Tech", extras: "Extras"
};

const PACK_BANK = [
  // ---- documents ----
  { n: "Passport / photo ID", cat: "documents", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "Boarding passes / tickets", cat: "documents", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "Hotel / booking confirmations", cat: "documents", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "Driver's license", cat: "documents", types: ["roadtrip", "hiking", "city"], w: [], e: true, pd: false, qty: 1 },
  { n: "Credit / debit cards", cat: "documents", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "Cash (local currency)", cat: "documents", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "Travel insurance documents", cat: "documents", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Emergency contacts list", cat: "documents", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Cruise boarding documents", cat: "documents", types: ["cruise"], w: [], e: true, pd: false, qty: 1 },
  // ---- clothes ----
  { n: "T-shirts / tops", cat: "clothes", types: [], w: [], e: false, pd: true },
  { n: "Underwear", cat: "clothes", types: [], w: [], e: true, pd: true },
  { n: "Socks", cat: "clothes", types: [], w: [], e: false, pd: true },
  { n: "Shorts", cat: "clothes", types: [], w: ["hot", "warm"], e: false, pd: false, qty: 2 },
  { n: "Jeans / trousers", cat: "clothes", types: [], w: [], e: false, pd: false, qty: 2 },
  { n: "Light jacket", cat: "clothes", types: [], w: ["cool", "rainy"], e: false, pd: false, qty: 1 },
  { n: "Warm coat", cat: "clothes", types: [], w: ["cold"], e: true, pd: false, qty: 1 },
  { n: "Rain jacket", cat: "clothes", types: [], w: ["rainy"], e: true, pd: false, qty: 1 },
  { n: "Swimsuit", cat: "clothes", types: ["beach", "cruise"], w: [], e: true, pd: false, qty: 2 },
  { n: "Flip-flops", cat: "clothes", types: ["beach", "cruise"], w: [], e: false, pd: false, qty: 1 },
  { n: "Walking shoes", cat: "clothes", types: ["city", "roadtrip"], w: [], e: true, pd: false, qty: 1 },
  { n: "Dress shoes", cat: "clothes", types: ["business", "cruise"], w: [], e: false, pd: false, qty: 1 },
  { n: "Hiking boots", cat: "clothes", types: ["hiking"], w: [], e: true, pd: false, qty: 1 },
  { n: "Sleepwear", cat: "clothes", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Hat / cap", cat: "clothes", types: [], w: ["hot", "warm"], e: false, pd: false, qty: 1 },
  { n: "Sunglasses", cat: "clothes", types: [], w: ["hot", "warm"], e: false, pd: false, qty: 1 },
  { n: "Scarf, gloves & beanie", cat: "clothes", types: [], w: ["cold"], e: true, pd: false, qty: 1 },
  { n: "Dress shirt / blouse", cat: "clothes", types: ["business", "cruise", "city"], w: [], e: false, pd: false, qty: 2 },
  { n: "Blazer / suit jacket", cat: "clothes", types: ["business"], w: [], e: true, pd: false, qty: 1 },
  { n: "Tie / accessories", cat: "clothes", types: ["business"], w: [], e: false, pd: false, qty: 1 },
  { n: "Quick-dry hiking socks", cat: "clothes", types: ["hiking"], w: [], e: false, pd: true },
  { n: "Cover-up / sarong", cat: "clothes", types: ["beach"], w: [], e: false, pd: false, qty: 1 },
  { n: "Formal evening outfit", cat: "clothes", types: ["cruise"], w: [], e: false, pd: false, qty: 1 },
  // ---- toiletries ----
  { n: "Toothbrush & toothpaste", cat: "toiletries", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "Deodorant", cat: "toiletries", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Shampoo & conditioner", cat: "toiletries", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Soap / body wash", cat: "toiletries", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Razor / shaving kit", cat: "toiletries", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Sunscreen", cat: "toiletries", types: [], w: ["hot", "warm"], e: true, pd: false, qty: 1 },
  { n: "Lip balm", cat: "toiletries", types: [], w: ["cold", "hot"], e: false, pd: false, qty: 1 },
  { n: "Prescription medications", cat: "toiletries", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "First-aid kit", cat: "toiletries", types: ["hiking", "roadtrip"], w: [], e: true, pd: false, qty: 1 },
  { n: "Glasses / contact lenses", cat: "toiletries", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Hairbrush / comb", cat: "toiletries", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Insect repellent", cat: "toiletries", types: ["hiking", "beach"], w: ["hot", "warm"], e: false, pd: false, qty: 1 },
  { n: "Aloe vera gel", cat: "toiletries", types: ["beach"], w: ["hot"], e: false, pd: false, qty: 1 },
  // ---- tech ----
  { n: "Phone charger", cat: "tech", types: [], w: [], e: true, pd: false, qty: 1 },
  { n: "Power bank", cat: "tech", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Headphones / earbuds", cat: "tech", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Laptop + charger", cat: "tech", types: ["business", "city"], w: [], e: false, pd: false, qty: 1 },
  { n: "Universal power adapter", cat: "tech", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Camera", cat: "tech", types: ["beach", "hiking", "cruise", "roadtrip"], w: [], e: false, pd: false, qty: 1 },
  { n: "E-reader / book", cat: "tech", types: ["beach", "cruise", "roadtrip"], w: [], e: false, pd: false, qty: 1 },
  { n: "Car phone mount", cat: "tech", types: ["roadtrip"], w: [], e: false, pd: false, qty: 1 },
  // ---- extras ----
  { n: "Backpack / daypack", cat: "extras", types: ["hiking", "city", "roadtrip"], w: [], e: false, pd: false, qty: 1 },
  { n: "Laundry bag", cat: "extras", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Travel pillow", cat: "extras", types: [], w: [], e: false, pd: false, qty: 1 },
  { n: "Snacks", cat: "extras", types: ["roadtrip", "hiking"], w: [], e: false, pd: false, qty: 1 },
  { n: "Reusable water bottle", cat: "extras", types: ["hiking", "roadtrip", "beach"], w: [], e: false, pd: false, qty: 1 },
  { n: "Umbrella", cat: "extras", types: [], w: ["rainy"], e: true, pd: false, qty: 1 },
  { n: "Quick-dry towel", cat: "extras", types: ["beach", "hiking"], w: [], e: false, pd: false, qty: 1 },
  { n: "Cooler", cat: "extras", types: ["roadtrip", "beach"], w: [], e: false, pd: false, qty: 1 },
  { n: "Binoculars", cat: "extras", types: ["hiking", "cruise"], w: [], e: false, pd: false, qty: 1 },
  { n: "Trekking poles", cat: "extras", types: ["hiking"], w: [], e: false, pd: false, qty: 1 },
  { n: "Laptop lock", cat: "extras", types: ["business"], w: [], e: false, pd: false, qty: 1 },
  { n: "Seasickness tablets", cat: "extras", types: ["cruise"], w: [], e: false, pd: false, qty: 1 }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TRIP_TYPES, TRIP_LABELS, WEATHERS, WEATHER_LABELS, CATEGORIES, CATEGORY_LABELS, PACK_BANK };
}

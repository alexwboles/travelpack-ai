/* TravelPack AI — UI wiring. Runs in the browser. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const LS_KEY = "travelpack.trips.v1";
  let current = null; // {name, tripType, days, weather, items:[{n,cat,qty,essential,packed}]}

  function loadTrips() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveTrips(t) { localStorage.setItem(LS_KEY, JSON.stringify(t)); }

  function flatten(groups) {
    const items = [];
    for (const c of CATEGORIES) {
      for (const it of (groups[c] || [])) items.push(Object.assign({ packed: false }, it));
    }
    return items;
  }

  function renderList() {
    const wrap = $("listWrap");
    if (!current) { wrap.innerHTML = ""; $("progressWrap").style.display = "none"; return; }
    const groups = {};
    for (const it of current.items) { (groups[it.cat] = groups[it.cat] || []).push(it); }
    const counts = countItems(groups);
    const pct = counts.total ? Math.round((counts.packed / counts.total) * 100) : 0;
    $("progressWrap").style.display = "block";
    $("progressBar").style.width = pct + "%";
    $("progressText").textContent = counts.packed + " of " + counts.total + " packed (" + pct + "%)";

    // don't-forget strip
    const missing = essentialItems(groups);
    const strip = $("forgetStrip");
    if (missing.length) {
      strip.style.display = "block";
      strip.innerHTML = "<strong>Don't forget:</strong> " + missing.map((m) => escapeHtml(m.n)).join(" · ");
    } else { strip.style.display = "none"; strip.innerHTML = ""; }

    let html = "";
    for (const c of CATEGORIES) {
      const items = groups[c] || [];
      if (!items.length) continue;
      html += "<section class='cat'><h3>" + CATEGORY_LABELS[c] + " <span class='count'>" +
        items.filter((i) => i.packed).length + "/" + items.length + "</span></h3><ul>";
      items.forEach((it, gi) => {
        const idx = current.items.indexOf(it);
        html += "<li class='" + (it.packed ? "done" : "") + "'>" +
          "<label><input type='checkbox' data-idx='" + idx + "'" + (it.packed ? " checked" : "") + ">" +
          "<span class='nm'>" + escapeHtml(it.n) + "</span>" +
          (it.qty > 1 ? " <span class='qty'>×" + it.qty + "</span>" : "") +
          (it.essential ? " <span class='ess'>essential</span>" : "") +
          "</span></label></li>";
      });
      html += "</ul></section>";
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        current.items[parseInt(cb.getAttribute("data-idx"), 10)].packed = cb.checked;
        persistCurrent();
        renderList();
      });
    });
  }

  const TYPE_CODES = { beach: "BCH", city: "CTY", hiking: "TRK", business: "BIZ", cruise: "CRS", roadtrip: "RDE" };

  function renderTypeCards() {
    const box = $("typeCards");
    if (!box) return;
    box.innerHTML = "";
    for (const t of TRIP_TYPES) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "type-card";
      b.setAttribute("role", "radio");
      b.dataset.type = t;
      b.innerHTML = "<span class='tc-code'>" + TYPE_CODES[t] + "</span>" +
        "<span class='tc-label'>" + escapeHtml(TRIP_LABELS[t]) + "</span>";
      b.addEventListener("click", () => {
        $("tripType").value = t;
        syncTypeCards();
        updateStub();
      });
      box.appendChild(b);
    }
    syncTypeCards();
  }

  function syncTypeCards() {
    const box = $("typeCards");
    if (!box) return;
    const cur = $("tripType").value;
    box.querySelectorAll(".type-card").forEach((b) => {
      b.setAttribute("aria-checked", b.dataset.type === cur ? "true" : "false");
    });
  }

  function updateStub() {
    const dest = $("stubDest"), dd = $("stubDays"), wx = $("stubWx");
    if (!dest) return;
    const name = $("tripName").value.trim();
    const tt = $("tripType").value, days = $("days").value, w = $("weather").value;
    dest.textContent = name || TRIP_LABELS[tt] || "—";
    dd.textContent = (parseInt(days, 10) || 5) + " days";
    wx.textContent = WEATHER_LABELS[w] || "—";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function persistCurrent() {
    if (!current || !current.name) return;
    const trips = loadTrips();
    const i = trips.findIndex((t) => t.name === current.name);
    if (i >= 0) trips[i] = current; else trips.push(current);
    saveTrips(trips);
    renderSaved();
  }

  function renderSaved() {
    const trips = loadTrips();
    const el = $("savedList");
    if (!trips.length) { el.innerHTML = "<p class='muted'>No saved trips yet.</p>"; return; }
    el.innerHTML = trips.map((t) =>
      "<div class='trip-row'><button class='link' data-load='" + escapeHtml(t.name) + "'>" + escapeHtml(t.name) + "</button>" +
      "<span class='muted'>" + TRIP_LABELS[t.tripType] + " · " + t.days + "d</span>" +
      "<button class='danger' data-del='" + escapeHtml(t.name) + "'>Delete</button></div>"
    ).join("");
    el.querySelectorAll("[data-load]").forEach((b) => b.addEventListener("click", () => {
      const t = loadTrips().find((x) => x.name === b.getAttribute("data-load"));
      if (t) { current = t; $("tripName").value = t.name; $("tripType").value = t.tripType; $("days").value = t.days; $("weather").value = t.weather; syncTypeCards(); updateStub(); renderList(); }
    }));
    el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
      saveTrips(loadTrips().filter((x) => x.name !== b.getAttribute("data-del")));
      if (current && current.name === b.getAttribute("data-del")) current = null;
      renderSaved(); renderList();
    }));
  }

  function generate() {
    const name = $("tripName").value.trim() || "My trip";
    const tripType = $("tripType").value, days = $("days").value, weather = $("weather").value;
    const groups = generatePackingList({ tripType, days, weather });
    current = { name, tripType, days: parseInt(days, 10) || 3, weather, items: flatten(groups) };
    $("tipBox").textContent = "Tip: " + packingTip(tripType, weather, current.days);
    $("tipBox").style.display = "block";
    persistCurrent();
    renderList();
    window.scrollTo({ top: $("progressWrap").offsetTop - 20, behavior: "smooth" });
  }

  function printList() {
    if (!current) return;
    const w = window.open("", "_blank");
    const groups = {};
    for (const it of current.items) { (groups[it.cat] = groups[it.cat] || []).push(it); }
    let html = "<h1>Packing list — " + escapeHtml(current.name) + "</h1><p>" +
      TRIP_LABELS[current.tripType] + " · " + current.days + " days · " + WEATHER_LABELS[current.weather] + "</p>";
    for (const c of CATEGORIES) {
      if (!(groups[c] || []).length) continue;
      html += "<h2>" + CATEGORY_LABELS[c] + "</h2><ul>";
      for (const it of groups[c]) html += "<li>☐ " + escapeHtml(it.n) + (it.qty > 1 ? " ×" + it.qty : "") + "</li>";
      html += "</ul>";
    }
    w.document.write("<html><head><title>Packing list</title></head><body>" + html + "</body></html>");
    w.document.close(); w.print();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tt = $("tripType"), wx = $("weather");
    for (const t of TRIP_TYPES) { const o = document.createElement("option"); o.value = t; o.textContent = TRIP_LABELS[t]; tt.appendChild(o); }
    for (const wthr of WEATHERS) { const o = document.createElement("option"); o.value = wthr; o.textContent = WEATHER_LABELS[wthr]; wx.appendChild(o); }
    renderTypeCards();
    updateStub();
    ["tripName", "days"].forEach((id) => $(id).addEventListener("input", updateStub));
    ["weather"].forEach((id) => $(id).addEventListener("change", updateStub));
    tt.addEventListener("change", () => { syncTypeCards(); updateStub(); });
    $("genBtn").addEventListener("click", generate);
    $("printBtn").addEventListener("click", printList);
    renderSaved();
  });
})();

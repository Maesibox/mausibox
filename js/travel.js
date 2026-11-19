/*
 * Reise-Spickzettel pro Land: alles auf einer Seite – Gold-Regeln, Regeln pro Bundesstaat/Kanton,
 * Erlebnisse (Kurse, Touren, Schaubergwerke, Verleih), Goldplätze und Clubs in diesem Land.
 * Daten kommen aus config.js (countryRules, usStateRules …) und aus den Dateien der "spots"-Ebenen.
 * Öffnen: Menü → Reise-Spickzettel, oder im Popup eines Landes / Goldplatzes auf „Reise-Spickzettel“ tippen.
 */
var Travel = (function () {
  var C = APP_CONFIG;
  var t = App.t, tr = App.tr, esc = App.esc, el = App.el;
  var cache = null;   // alle Einträge der spots-Dateien, je mit Ebene (cfg)

  // Bundesstaaten / Kantone pro Land
  var STATE_RULES = { US: "usStateRules", AU: "auStateRules", CA: "caStateRules", CH: "chCantonRules" };
  // Welche Arten als "Erlebnis" gelten (alles, wo man hingehen und etwas erleben/mieten/lernen kann)
  var EXPERIENCE_KINDS = { site: 1, show: 1, mine: 1, hire: 1, tour: 1, course: 1 };

  function lang() { return App.lang; }
  function txt(a, base) { return lang() === "de" ? (a[base + "_de"] || a[base + "_en"]) : (a[base + "_en"] || a[base + "_de"]); }

  function loadAll() {
    if (cache) return Promise.resolve(cache);
    var layers = C.overlays.filter(function (o) { return o.type === "spots" && o.file; });
    return Promise.all(layers.map(function (cfg) {
      return App.cachedFetch(cfg.file, "json").then(function (d) {
        return (d.features || []).map(function (f) { return { f: f, cfg: cfg }; });
      }).catch(function () { return []; });
    })).then(function (lists) {
      var all = [], seen = {};
      lists.forEach(function (l) { l.forEach(function (x) {
        // dieselben Orte kommen in "Erlebnisse" und in der Länder-Ebene vor → nur einmal zeigen
        var c = x.f.geometry && x.f.geometry.coordinates, key = x.f.properties.name + "|" + (c ? c.join(",") : "");
        if (seen[key]) return; seen[key] = true; all.push(x);
      }); });
      cache = all;
      return all;
    });
  }

  function countryName(code) {
    var r = (C.countryRules || {})[code];
    return r ? tr(r.name) : code;
  }

  function codeOfRule(rule) {
    var rules = C.countryRules || {};
    for (var k in rules) if (rules[k] === rule) return k;
    return null;
  }

  // Link, der in Popups eingebaut wird (Klick wird unten zentral abgefangen)
  function linkHtml(code) {
    if (!code || !(C.countryRules || {})[code]) return "";
    return "<a href='#' class='travel-link' data-cc='" + esc(code) + "'>🧭 " + esc(t("travel")) + " · " + esc(countryName(code)) + "</a><br>";
  }

  // ---------- Liste aller Länder ----------
  function openList() {
    var rules = C.countryRules || {};
    var codes = Object.keys(rules).filter(function (k) { return rules[k] && rules[k].rule; })
      .sort(function (a, b) { return countryName(a).localeCompare(countryName(b)); });
    var groups = { open: [], limited: [], closed: [] };
    codes.forEach(function (k) { (groups[rules[k].level] || groups.limited).push(k); });
    function btns(list) {
      return list.map(function (k) {
        return "<button class='travel-country' data-cc='" + esc(k) + "'>" + esc(countryName(k)) + "</button>";
      }).join("");
    }
    var body = el("<div class='travel'>" +
      "<p class='hint'>" + esc(t("travelIntro")) + "</p>" +
      (groups.open.length ? "<h3 class='verdict open'>" + esc(t("travelOpen")) + "</h3><div class='travel-grid'>" + btns(groups.open) + "</div>" : "") +
      (groups.limited.length ? "<h3 class='verdict limited'>" + esc(t("travelLimited")) + "</h3><div class='travel-grid'>" + btns(groups.limited) + "</div>" : "") +
      (groups.closed.length ? "<h3 class='verdict closed'>" + esc(t("travelClosed")) + "</h3><div class='travel-grid'>" + btns(groups.closed) + "</div>" : "") +
      "</div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest(".travel-country");
      if (b) open(b.dataset.cc);
    });
    App.openSheet("🧭 " + t("travel"), body);
  }

  // ---------- Spickzettel für ein Land ----------
  function open(code) {
    var rule = (C.countryRules || {})[code];
    if (!rule) return;
    var body = el("<div class='travel'><p class='hint'>" + esc(t("loading")) + "</p></div>");
    App.openSheet("🧭 " + countryName(code), body);
    Promise.all([loadAll(), window.ClubPages ? ClubPages.forCountry(code) : []]).then(function (res) {
      var all = res[0], pages = res[1] || [];
      var here = all.filter(function (x) { return x.f.properties && x.f.properties.country === code; });
      var exp = here.filter(function (x) { return EXPERIENCE_KINDS[x.f.properties.kind] && x.cfg.id !== "clubs"; });
      var clubs = here.filter(function (x) { return x.cfg.id === "clubs"; });
      var spots = here.filter(function (x) { return exp.indexOf(x) < 0 && clubs.indexOf(x) < 0; });
      body.innerHTML = rulesHtml(rule) + statesHtml(code) +
        section("🎟", t("travelExperiences"), exp, t("travelNoExperiences")) +
        section("📍", t("travelSpots"), spots, t("travelNoSpots")) +
        (pages.length ? "<div class='pop-sec'><h3>🏕 " + esc(t("cpLayer")) + " <small>(" + pages.length + ")</small></h3>" +
          pages.map(function (p) { return "<details class='travel-item'><summary>" + esc(p.club_name) + (p.place ? " <small>(" + esc(p.place) + ")</small>" : "") + "</summary>" + ClubPages.pageHtml(p, false) + "</details>"; }).join("") + "</div>" : "") +
        section("🤝", t("travelClubs"), clubs, t("travelNoClubs")) +
        "<p class='hint'>" + esc(t("landHint")) + "</p>" +
        "<div class='row'><button class='travel-back'>← " + esc(t("travelAll")) + "</button></div>";
    });
    body.onclick = function (e) {
      var s = e.target.closest(".travel-show");
      if (s) { App.closeSheet(); App.map.flyTo([+s.dataset.lat, +s.dataset.lon], 12, { duration: 1.2 }); App.toast(s.dataset.name); }
      if (e.target.closest(".travel-back")) openList();
    };
  }

  function rulesHtml(rule) {
    return "<div class='pop-sec' style='border-left:4px solid #888;padding-left:8px'>" +
      "<h3>⚖️ " + esc(t("goldRules")) + "</h3>" +
      "<p class='verdict " + esc(rule.level || "limited") + "'>" + esc(tr(rule.rule)) + "</p>" +
      (rule.details ? "<p class='note-text'>" + esc(tr(rule.details)) + "</p>" : "") +
      (rule.source ? "<div class='src'>" + esc(t("rulesSource")) + ": " + esc(rule.source) + "</div>" : "") +
      (rule.link ? "<a href='" + esc(rule.link) + "' target='_blank' rel='noopener'>" + esc(t("moreInfo").replace(/\s*\(.*\)/, "")) + " ↗</a>" : "") +
      "</div>";
  }

  function statesHtml(code) {
    var key = STATE_RULES[code], rules = key && C[key];
    if (!rules) return "";
    var names = Object.keys(rules).filter(function (k) { return rules[k] && typeof rules[k] === "object" && rules[k].rule; }).sort();
    if (!names.length) return "";
    var items = names.map(function (k) {
      var r = rules[k];
      return "<details><summary>" + esc(r.name ? tr(r.name) : k) + "</summary>" +
        "<p class='note-text'>" + esc(tr(r.rule)) + "</p>" +
        (r.details ? "<p class='note-text'>" + esc(tr(r.details)) + "</p>" : "") +
        (r.closed ? "<p class='note-text'>⛔ " + esc(tr(r.closed)) + "</p>" : "") +
        (r.link ? "<a href='" + esc(r.link) + "' target='_blank' rel='noopener'>" + esc(t("moreInfo").replace(/\s*\(.*\)/, "")) + " ↗</a>" : "") +
        "</details>";
    }).join("");
    return "<div class='pop-sec'><h3>🗺 " + esc(t(code === "CH" ? "travelCantons" : "travelStates")) + "</h3>" + items +
      (rules.source ? "<div class='src'>" + esc(t("rulesSource")) + ": " + esc(rules.source) + "</div>" : "") + "</div>";
  }

  function section(icon, title, list, emptyText) {
    if (!list.length) return "<div class='pop-sec'><h3>" + icon + " " + esc(title) + "</h3><p class='hint'>" + esc(emptyText) + "</p></div>";
    list = list.slice().sort(function (a, b) { return String(a.f.properties.name).localeCompare(String(b.f.properties.name)); });
    var items = list.map(function (x) {
      var a = x.f.properties, c = x.f.geometry && x.f.geometry.coordinates, k = (x.cfg.kinds || {})[a.kind] || {};
      var desc = lang() === "de" ? a.de : (a.en || a.de);
      var permit = a.permit_de ? txt(a, "permit") : "";
      var link = a.join || a.link || a.permit_link;
      return "<details class='travel-item'><summary><span class='dot' style='background:" + esc(k.color || "#ffd700") + "'></span>" +
          esc(a.name) + (a.state ? " <small>(" + esc(a.state) + ")</small>" : "") + "</summary>" +
        (k.label ? "<p class='verdict " + esc(k.level || "limited") + "'>" + esc(tr(k.label)) + "</p>" : "") +
        (desc ? "<p class='note-text'>" + esc(desc) + "</p>" : "") +
        (permit ? "<p class='note-text'><b>📋 " + esc(t("spotPermit")) + ":</b> " + esc(permit) + "</p>" : "") +
        "<div class='row'>" +
          (c ? "<button class='travel-show' data-lat='" + c[1] + "' data-lon='" + c[0] + "' data-name='" + esc(a.name) + "'>🗺 " + esc(t("travelShow")) + "</button>" : "") +
          (link ? "<a class='btn-like' href='" + esc(link) + "' target='_blank' rel='noopener'>🌐 " + esc(t("travelWebsite")) + "</a>" : "") +
        "</div></details>";
    }).join("");
    return "<div class='pop-sec'><h3>" + icon + " " + esc(title) + " <small>(" + list.length + ")</small></h3>" + items + "</div>";
  }

  // Klicks auf „Reise-Spickzettel“ in Karten-Popups
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".travel-link");
    if (!a) return;
    e.preventDefault();
    if (App.map) App.map.closePopup();
    open(a.dataset.cc);
  });

  return { open: open, openList: openList, linkHtml: linkHtml, codeOfRule: codeOfRule };
})();

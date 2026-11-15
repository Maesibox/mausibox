/*
 * BLM-Änderungen: welche Claims sind im beobachteten Gebiet neu dazugekommen, welche sind abgelaufen?
 * Das BLM liefert kein Schliessungsdatum. Darum vergleicht die App (höchstens einmal pro Tag, bei irgendeinem
 * angemeldeten Mitglied) die aktiven Claims mit dem letzten Stand auf dem Server (Tabellen blm_active,
 * blm_changes, blm_checks) und merkt sich jede Änderung mit Datum.
 * Gebiete und Zeitraum: config.js → blmWatch.
 */
var BlmWatch = (function () {
  var C = APP_CONFIG, W = C.blmWatch || { days: 30, areas: [] };
  var ACTIVE_URL = "https://nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer/1/query";
  var CLOSED_URL = "https://nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer/2/query";
  var changes = [];           // [{ cse_nr, change, name, loc_dt, acres, lat, lon, seen_at, area }]
  var recent = { "new": {}, closed: {} };

  var t = function (k) { return App.t(k); };
  var esc = function (s) { return App.esc(s); };

  function ready() { return window.Auth && Auth.enabled() && Auth.account && navigator.onLine; }
  function db() { return Auth.client; }
  function check(res) { if (res.error) throw res.error; return res.data; }
  function since() { return new Date(Date.now() - (W.days || 30) * 86400000); }

  function blmQuery(url, params) {
    var q = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(url + "?" + q).then(function (r) { return r.json(); }).then(function (d) {
      if (d.error) throw new Error(d.error.message || "BLM");
      return d.features || [];
    });
  }

  function center(f) {
    var r = f.geometry && f.geometry.rings && f.geometry.rings[0];
    if (!r || !r.length) return [null, null];
    var x = 0, y = 0;
    r.forEach(function (p) { x += p[0]; y += p[1]; });
    return [y / r.length, x / r.length];
  }

  function rowFrom(f, change, area) {
    var a = f.attributes, c = center(f);
    return { cse_nr: a.CSE_NR, change: change, area: area.id, name: a.CSE_NAME || null,
      loc_dt: a.LOC_DT ? new Date(a.LOC_DT).toISOString().slice(0, 10) : null,
      acres: a.RCRD_ACRS, lat: c[0], lon: c[1] };
  }

  // ---------- Änderungen laden ----------

  function load() {
    return db().from("blm_changes").select("*").gte("seen_at", since().toISOString()).order("seen_at", { ascending: false })
      .then(check).then(function (rows) {
        changes = rows;
        recent = { "new": {}, closed: {} };
        rows.forEach(function (r) { recent[r.change][r.cse_nr] = r; });
        return rows;
      });
  }

  // Für die Kartenfilter: neu bzw. abgelaufen in den letzten Tagen?
  function isRecent(cseNr, change, locDt) {
    if (recent[change] && recent[change][cseNr]) return true;
    return change === "new" && locDt && locDt >= since().getTime();
  }

  // ---------- Vergleich mit dem BLM (einmal pro Tag und Gebiet) ----------

  function checkArea(area) {
    var b = area.bbox.join(",");
    return db().from("blm_checks").select("checked_at").eq("area", area.id).maybeSingle().then(check).then(function (last) {
      if (last && Date.now() - Date.parse(last.checked_at) < 20 * 3600000) return 0;
      return Promise.all([
        blmQuery(ACTIVE_URL, { geometry: b, geometryType: "esriGeometryEnvelope", inSR: 4326, spatialRel: "esriSpatialRelIntersects",
          outFields: "CSE_NR,CSE_NAME,LOC_DT,RCRD_ACRS", returnGeometry: true, outSR: 4326, maxAllowableOffset: 0.0005, f: "json" }),
        db().from("blm_active").select("cse_nr").eq("area", area.id).then(check)
      ]).then(function (r) {
        var blm = r[0], known = {}, now = {}, first = !r[1].length;
        r[1].forEach(function (x) { known[x.cse_nr] = true; });
        blm.forEach(function (f) { now[f.attributes.CSE_NR] = f; });
        var added = blm.filter(function (f) { return !known[f.attributes.CSE_NR]; });
        var gone = Object.keys(known).filter(function (id) { return !now[id]; });
        var jobs = [];
        if (added.length) {
          jobs.push(db().from("blm_active").upsert(added.map(function (f) {
            var x = rowFrom(f, "new", area);
            return { cse_nr: x.cse_nr, area: area.id, name: x.name, lat: x.lat, lon: x.lon };
          })).then(check));
          // beim allerersten Vergleich nur Claims mit frischem Location Date als "neu" melden
          var cut = since().getTime();
          var news = added.filter(function (f) { return !first || (f.attributes.LOC_DT && f.attributes.LOC_DT >= cut); });
          if (news.length) jobs.push(db().from("blm_changes").upsert(news.map(function (f) { return rowFrom(f, "new", area); }),
            { onConflict: "cse_nr,change", ignoreDuplicates: true }).then(check));
        }
        if (gone.length) {
          // nicht mehr aktiv: steht er jetzt bei den geschlossenen Claims?
          jobs.push(blmQuery(CLOSED_URL, { where: "CSE_NR IN ('" + gone.join("','") + "')", outFields: "CSE_NR,CSE_NAME,LOC_DT,RCRD_ACRS",
            returnGeometry: true, outSR: 4326, maxAllowableOffset: 0.0005, f: "json" }).then(function (closed) {
            var j = [db().from("blm_active").delete().in("cse_nr", gone).then(check)];
            if (closed.length) j.push(db().from("blm_changes").upsert(closed.map(function (f) { return rowFrom(f, "closed", area); }),
              { onConflict: "cse_nr,change", ignoreDuplicates: true }).then(check));
            return Promise.all(j);
          }));
        }
        return Promise.all(jobs).then(function () {
          return db().from("blm_checks").upsert({ area: area.id, checked_at: new Date().toISOString() }).then(check);
        }).then(function () { return added.length + gone.length; });
      });
    });
  }

  // ---------- Meldung beim Öffnen ----------

  function unseen() {
    var seen = App.pref("blmSeenAt", null);
    return changes.filter(function (c) { return !seen || c.seen_at > seen; });
  }

  function notify() {
    var n = unseen().length;
    document.body.classList.toggle("has-blm-news", n > 0);
    if (n) App.toast(t("blmNews").replace("{n}", n));
  }

  function run() {
    if (!ready() || !W.areas || !W.areas.length) return Promise.resolve();
    return W.areas.reduce(function (chain, area) {
      return chain.then(function () { return checkArea(area).catch(function (e) { console.warn("blm watch", area.id, e); }); });
    }, Promise.resolve()).then(load).then(function () {
      notify();
      App.refreshBlmFilters();
    }).catch(function (e) { console.warn("blm watch", e); });
  }

  // ---------- Seite "BLM-Änderungen" ----------

  function itemHtml(c) {
    return "<button class='item' data-ll='" + esc(c.lat + "," + c.lon) + "' data-kind='" + esc(c.change) + "'>" +
      "<span class='post small' style='border-color:" + esc(c.change === "new" ? "#e02020" : "#ffffff") + "'>" + (c.change === "new" ? "＋" : "✕") + "</span>" +
      "<span class='item-text'><b>" + esc(c.name || c.cse_nr) + "</b><small>" + esc(c.cse_nr) +
      (c.acres ? " · " + esc(c.acres) + " ac" : "") + (c.loc_dt ? " · " + esc(t("locationDate")) + " " + esc(c.loc_dt) : "") +
      " · " + esc(t("blmSeen")) + " " + esc(String(c.seen_at).slice(0, 10)) + "</small></span></button>";
  }

  function open() {
    var news = changes.filter(function (c) { return c.change === "new"; });
    var closed = changes.filter(function (c) { return c.change === "closed"; });
    var areas = (W.areas || []).map(function (a) { return a.name; }).join(", ");
    var body = App.el("<div class='plist'>" +
      "<p class='hint'>" + esc(t("blmChangesIntro").replace("{days}", W.days || 30).replace("{areas}", areas)) + "</p>" +
      "<section class='folder'><h4 style='border-left-color:#e02020'>" + esc(t("blmNew")) + " <small>" + news.length + "</small></h4>" +
      (news.length ? news.map(itemHtml).join("") : "<p class='hint'>–</p>") + "</section>" +
      "<section class='folder'><h4 style='border-left-color:#ffffff'>" + esc(t("blmClosedRecent")) + " <small>" + closed.length + "</small></h4>" +
      (closed.length ? closed.map(itemHtml).join("") : "<p class='hint'>–</p>") + "</section></div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-ll]");
      if (!b) return;
      var ll = b.dataset.ll.split(",").map(Number);
      App.closeSheet();
      App.showBlmLayer(b.dataset.kind === "new" ? "blm" : "blmClosed");
      if (!isNaN(ll[0])) App.map.setView(ll, 15);
    });
    App.setPref("blmSeenAt", new Date().toISOString());
    document.body.classList.remove("has-blm-news");
    App.openSheet(t("blmChanges"), body);
  }

  function init() {
    setTimeout(run, 4000);
  }

  return { init: init, run: run, open: open, isRecent: isRecent, get changes() { return changes; } };
})();

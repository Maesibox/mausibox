/*
 * Wege aufzeichnen: Fahrt, Gehen, Metalldetektor (Arten in config.js unter "tracks").
 * Gespeichert auf dem Gerät. Während der Aufnahme bleibt der Bildschirm wach (falls das Gerät es erlaubt).
 * Ein Punkt: [Breite, Länge, Höhe in m oder null, Zeit in ms, Genauigkeit in m]
 */
var Tracks = (function () {
  var C = APP_CONFIG;
  var TC = C.tracks;
  var layer = L.featureGroup();
  var renderer = L.canvas({ tolerance: 8 });
  var cache = {};        // id -> Strecke
  var shapes = {};       // id -> { all: [Layer], bands: [Layer], line: Layer, band: Layer }
  var map = null;
  var rec = null;        // laufende Aufnahme: { track, watch, paused, saveCount }
  var wakeLock = null;
  var visible = true;
  var tick = null;

  var t = function (k) { return App.t(k); };
  var esc = function (s) { return App.esc(s); };

  // ---------- Hilfen ----------

  function typeCfg(id) { return TC.types.filter(function (x) { return x.id === id; })[0] || TC.types[0]; }
  function typeName(id) { var c = typeCfg(id); return c.icon + " " + App.tr(c.name); }

  function newTrack(type) {
    var now = new Date();
    return {
      id: Store.uuid(), schema: 1, type: type,
      name: App.tr(typeCfg(type).name) + " " + now.toLocaleDateString() + " " + now.toTimeString().slice(0, 5),
      note: "", segments: [[]], coilWidth: type === "detect" ? TC.coilWidth : null,
      hidden: false, recording: true,
      startedAt: now.toISOString(), endedAt: null, createdAt: now.toISOString(), updatedAt: now.toISOString(), deleted: false
    };
  }

  function stats(tr) {
    var dist = 0, dur = 0, n = 0;
    tr.segments.forEach(function (seg) {
      n += seg.length;
      for (var i = 1; i < seg.length; i++) dist += App.distance(seg[i - 1][0], seg[i - 1][1], seg[i][0], seg[i][1]);
      if (seg.length > 1) dur += seg[seg.length - 1][3] - seg[0][3];
    });
    return { distance: dist, duration: dur, points: n, area: tr.coilWidth ? dist * tr.coilWidth : null };
  }

  function durationText(ms) {
    var m = Math.round(ms / 60000), h = Math.floor(m / 60);
    return h ? h + " h " + String(m % 60).padStart(2, "0") + " min" : m + " min";
  }
  function areaText(m2) {
    return Math.round(m2).toLocaleString() + " m² (" + (m2 / 4046.86).toFixed(2) + " " + t("acresShort") + ")";
  }
  function summary(tr) {
    var s = stats(tr);
    return App.formatDistance(s.distance) + " · " + durationText(s.duration) + (s.area ? " · " + areaText(s.area) : "");
  }

  // ---------- Karte ----------

  // Spulenbreite in Bildschirmpunkten (damit das Band die abgesuchte Fläche zeigt)
  function bandWeight(tr, lat) {
    var mpp = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, map.getZoom());
    return Math.max(3, (tr.coilWidth || TC.coilWidth) / mpp);
  }

  function undraw(id) {
    if (!shapes[id]) return;
    shapes[id].all.forEach(function (l) { layer.removeLayer(l); });
    delete shapes[id];
  }

  function draw(tr) {
    undraw(tr.id);
    if (tr.deleted || (tr.hidden && !tr.recording)) return;
    var tc = typeCfg(tr.type), sh = { all: [], bands: [], line: null, band: null };
    tr.segments.forEach(function (seg) {
      var ll = seg.map(function (p) { return [p[0], p[1]]; });
      if (tr.type === "detect") {
        var band = L.polyline(ll, { renderer: renderer, color: tc.color, weight: bandWeight(tr, ll.length ? ll[0][0] : 35),
          opacity: 0.4, lineCap: "round", lineJoin: "round", interactive: false });
        layer.addLayer(band); sh.all.push(band); sh.bands.push(band); sh.band = band;
      }
      var line = L.polyline(ll, { renderer: renderer, color: tc.color, weight: tr.type === "detect" ? 2 : 4, opacity: 0.95,
        dashArray: tr.type === "drive" ? "10 6" : null, bubblingMouseEvents: false });
      line.bindPopup(function () { return popupHtml(cache[tr.id]); }, { maxWidth: 280 });
      layer.addLayer(line); sh.all.push(line); sh.line = line;
    });
    var first = tr.segments[0] && tr.segments[0][0];
    if (first) {
      var dot = L.circleMarker([first[0], first[1]], { renderer: renderer, radius: 5, color: "#fff", weight: 2, fillColor: tc.color, fillOpacity: 1, interactive: false });
      layer.addLayer(dot); sh.all.push(dot);
    }
    shapes[tr.id] = sh;
  }

  function updateBands() {
    Object.keys(shapes).forEach(function (id) {
      var tr = cache[id];
      shapes[id].bands.forEach(function (b) {
        var ll = b.getLatLngs();
        b.setStyle({ weight: bandWeight(tr, ll.length ? ll[0].lat : 35) });
      });
    });
  }

  function popupHtml(tr) {
    return "<div class='pop'><h3>" + esc(tr.name) + "</h3><div class='pop-sub'>" + esc(typeName(tr.type)) + "</div>" +
      "<p>" + esc(summary(tr)) + "</p><div class='src'>" + esc(new Date(tr.startedAt).toLocaleString()) + "</div>" +
      (tr.note ? "<p class='note-text'>" + esc(tr.note) + "</p>" : "") +
      "<div class='pop-actions'><button data-track-edit='" + esc(tr.id) + "'>" + esc(t("edit")) + "</button></div></div>";
  }

  function setVisible(on) {
    visible = on;
    App.setPref("tracksVisible", on);
    if (on) layer.addTo(map); else map.removeLayer(layer);
  }

  function fit(tr) {
    var pts = [];
    tr.segments.forEach(function (seg) { seg.forEach(function (p) { pts.push([p[0], p[1]]); }); });
    if (!pts.length) return;
    if (!visible) setVisible(true);
    if (tr.hidden) { tr.hidden = false; save(tr); draw(tr); }
    if (pts.length === 1) map.setView(pts[0], 17); else map.fitBounds(pts, { padding: [40, 40], maxZoom: 18 });
  }

  function save(tr) {
    tr.updatedAt = new Date().toISOString();
    return Store.putTrack(tr);
  }

  // ---------- Aufnahme ----------

  function keepAwake(on) {
    if (!on) {
      if (wakeLock) wakeLock.release().catch(function () {});
      wakeLock = null;
      return;
    }
    if (!navigator.wakeLock || wakeLock || document.visibilityState !== "visible") return;
    navigator.wakeLock.request("screen").then(function (l) {
      wakeLock = l;
      l.addEventListener("release", function () { wakeLock = null; });
    }).catch(function () {});
  }

  function start(type) {
    if (!navigator.geolocation) { App.toast(t("gpsError")); return; }
    var tr = newTrack(type);
    cache[tr.id] = tr;
    rec = { track: tr, watch: null, paused: false, saveCount: 0, weak: false };
    if (!visible) setVisible(true);
    draw(tr);
    save(tr);
    beginWatch();
    App.closeSheet();
    App.toast(t("recording") + ": " + typeName(type));
  }

  function beginWatch() {
    keepAwake(true);
    rec.watch = navigator.geolocation.watchPosition(onPosition, function (err) {
      if (err.code === 1) { App.toast(t("gpsError")); pause(); }
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
    startTick();
  }

  function onPosition(pos) {
    if (!rec || rec.paused) return;
    var c = pos.coords, tr = rec.track, tc = typeCfg(tr.type);
    rec.weak = c.accuracy > tc.maxAccuracy;
    if (rec.weak) { updateBadge(); return; }
    var seg = tr.segments[tr.segments.length - 1];
    var last = seg[seg.length - 1];
    var p = [+c.latitude.toFixed(7), +c.longitude.toFixed(7), c.altitude != null ? +c.altitude.toFixed(1) : null, pos.timestamp, Math.round(c.accuracy)];
    if (last && App.distance(last[0], last[1], p[0], p[1]) < Math.max(tc.minDistance, c.accuracy * 0.4)) return;
    seg.push(p);
    var sh = shapes[tr.id];
    if (sh && sh.line && seg.length > 1) {
      sh.line.addLatLng([p[0], p[1]]);
      if (sh.band) sh.band.addLatLng([p[0], p[1]]);
    } else {
      draw(tr);
    }
    if (++rec.saveCount % 10 === 0) save(tr);
    updateBadge();
  }

  function pause() {
    if (!rec) return;
    rec.paused = true;
    if (rec.watch !== null) navigator.geolocation.clearWatch(rec.watch);
    rec.watch = null;
    keepAwake(false);
    save(rec.track);
    updateBadge();
  }

  function resume() {
    if (!rec || !rec.paused) return;
    rec.paused = false;
    var segs = rec.track.segments;
    if (segs[segs.length - 1].length) segs.push([]);
    draw(rec.track);
    beginWatch();
    updateBadge();
  }

  function finish(keep, fields) {
    if (!rec) return Promise.resolve();
    var tr = rec.track;
    if (rec.watch !== null) navigator.geolocation.clearWatch(rec.watch);
    keepAwake(false);
    rec = null;
    stopTick();
    updateBadge();
    if (!keep) {
      delete cache[tr.id];
      undraw(tr.id);
      return Store.removeTrack(tr.id);
    }
    tr.segments = tr.segments.filter(function (s) { return s.length; });
    if (!tr.segments.length) tr.segments = [[]];
    Object.assign(tr, fields || {});
    tr.recording = false;
    tr.endedAt = new Date().toISOString();
    return save(tr).then(function () { draw(tr); App.toast(t("trackSaved")); });
  }

  // Anzeige oben: ● Aufnahme · Strecke · Dauer
  function updateBadge() {
    var box = document.getElementById("rec");
    var btn = document.getElementById("btn-track");
    if (!rec) { box.classList.remove("show"); btn.classList.remove("recording", "paused"); return; }
    var s = stats(rec.track);
    var since = Date.now() - Date.parse(rec.track.startedAt);
    box.textContent = (rec.paused ? "❚❚ " + t("paused") : "● " + typeCfg(rec.track.type).icon) + "  " +
      App.formatDistance(s.distance).split(" (")[0] + "  " + durationText(since) + (rec.weak && !rec.paused ? "  · " + t("weakGps") : "");
    box.classList.add("show");
    box.classList.toggle("paused", rec.paused);
    btn.classList.toggle("recording", !rec.paused);
    btn.classList.toggle("paused", rec.paused);
  }
  function startTick() { stopTick(); tick = setInterval(updateBadge, 15000); }
  function stopTick() { if (tick) clearInterval(tick); tick = null; }

  // ---------- Fenster ----------

  function onButton() {
    if (rec) openRecording(); else openChooser();
  }

  function openChooser() {
    var body = App.el("<div class='menu track-choose'><p>" + esc(t("chooseTrack")) + "</p>" +
      TC.types.map(function (tc) {
        return "<button class='track-type' data-type='" + esc(tc.id) + "' style='border-left:6px solid " + esc(tc.color) + "'>" +
          esc(tc.icon) + " " + esc(App.tr(tc.name)) + "</button>";
      }).join("") +
      "<p class='hint'>" + esc(t("screenOnHint")) + "</p>" +
      "<button data-a='list'>〰 " + esc(t("allRoutes")) + "</button></div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.type) start(b.dataset.type);
      if (b.dataset.a === "list") openList();
    });
    App.openSheet(t("track"), body);
  }

  function openRecording() {
    var tr = rec.track;
    var body = App.el("<form class='editor'>" +
      "<p><b>" + esc(typeName(tr.type)) + "</b> · " + esc(rec.paused ? t("paused") : t("recording")) + "<br>" +
      "<span class='hint'>" + esc(summary(tr)) + "</span></p>" +
      "<label>" + esc(t("trackName")) + "<input name='name' value='" + esc(tr.name) + "'></label>" +
      (tr.type === "detect" ? "<label>" + esc(t("coilWidth")) + "<input name='coil' type='number' step='0.1' min='0.2' max='5' value='" + esc(tr.coilWidth) + "'></label>" : "") +
      "<label>" + esc(t("note")) + "<textarea name='note' rows='2'>" + esc(tr.note) + "</textarea></label>" +
      "<p class='hint'>" + esc(t("screenOnHint")) + "</p>" +
      "<div class='row actions'>" +
        "<button type='button' class='danger' data-a='discard'>" + esc(t("discard")) + "</button>" +
        (rec.paused ? "<button type='button' data-a='resume'>▶ " + esc(t("resume")) + "</button>"
          : "<button type='button' data-a='pause'>❚❚ " + esc(t("pause")) + "</button>") +
        "<button type='submit' class='primary'>■ " + esc(t("stopSave")) + "</button></div></form>");
    function fields() {
      var f = body.elements, out = { name: f["name"].value.trim() || tr.name, note: f["note"].value.trim() };
      if (f["coil"]) out.coilWidth = parseFloat(f["coil"].value) || TC.coilWidth;
      return out;
    }
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]");
      if (!b) return;
      if (b.dataset.a === "pause") { Object.assign(tr, fields()); pause(); App.closeSheet(); }
      if (b.dataset.a === "resume") { Object.assign(tr, fields()); resume(); App.closeSheet(); }
      if (b.dataset.a === "discard" && confirm(t("confirmDiscard"))) { finish(false); App.closeSheet(); }
    });
    body.onsubmit = function (e) {
      e.preventDefault();
      finish(true, fields()).then(function () { App.closeSheet(); });
    };
    App.openSheet(t("track"), body);
  }

  function openEditor(id) {
    var tr = cache[id];
    if (!tr) return;
    if (rec && rec.track.id === id) { openRecording(); return; }
    var s = stats(tr);
    var body = App.el("<form class='editor'>" +
      "<p><b>" + esc(typeName(tr.type)) + "</b></p><table class='facts'>" +
      "<tr><th>" + esc(t("distance")) + "</th><td>" + esc(App.formatDistance(s.distance)) + "</td></tr>" +
      "<tr><th>" + esc(t("duration")) + "</th><td>" + esc(durationText(s.duration)) + "</td></tr>" +
      (s.area ? "<tr><th>" + esc(t("areaCovered")) + "</th><td>≈ " + esc(areaText(s.area)) + "</td></tr>" : "") +
      "<tr><th>" + esc(t("started")) + "</th><td>" + esc(new Date(tr.startedAt).toLocaleString()) + "</td></tr>" +
      "<tr><th>" + esc(t("pointsCount")) + "</th><td>" + s.points + "</td></tr></table>" +
      "<label>" + esc(t("trackName")) + "<input name='name' value='" + esc(tr.name) + "'></label>" +
      (tr.type === "detect" ? "<label>" + esc(t("coilWidth")) + "<input name='coil' type='number' step='0.1' min='0.2' max='5' value='" + esc(tr.coilWidth || TC.coilWidth) + "'></label>" : "") +
      "<label>" + esc(t("note")) + "<textarea name='note' rows='3'>" + esc(tr.note) + "</textarea></label>" +
      "<div class='row'><button type='button' data-a='show'>" + esc(t("goTo")) + "</button>" +
        "<button type='button' data-a='gpx'>GPX</button></div>" +
      "<div class='row actions'><button type='button' class='danger' data-a='del'>" + esc(t("delete")) + "</button>" +
        "<button type='button' data-a='cancel'>" + esc(t("cancel")) + "</button>" +
        "<button type='submit' class='primary'>" + esc(t("save")) + "</button></div></form>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]");
      if (!b) return;
      if (b.dataset.a === "show") { App.closeSheet(); fit(tr); }
      if (b.dataset.a === "gpx") exportGpx([tr], tr.name);
      if (b.dataset.a === "cancel") App.closeSheet();
      if (b.dataset.a === "del" && confirm(t("confirmDeleteTrack"))) {
        tr.deleted = true;
        save(tr).then(function () { undraw(tr.id); App.closeSheet(); });
      }
    });
    body.onsubmit = function (e) {
      e.preventDefault();
      var f = body.elements;
      tr.name = f["name"].value.trim() || tr.name;
      tr.note = f["note"].value.trim();
      if (f["coil"]) tr.coilWidth = parseFloat(f["coil"].value) || TC.coilWidth;
      save(tr).then(function () { draw(tr); App.closeSheet(); App.toast(t("saved")); });
    };
    App.openSheet(t("trackDetails"), body);
  }

  function openList() {
    var all = live().sort(function (a, b) { return b.startedAt.localeCompare(a.startedAt); });
    var html = "<div class='plist tracks-list'>" + (rec ? "" : "<button class='primary wide' data-a='new'>● " + esc(t("track")) + "</button>");
    TC.types.forEach(function (tc) {
      var list = all.filter(function (tr) { return tr.type === tc.id; });
      var total = list.reduce(function (sum, tr) { return sum + stats(tr).distance; }, 0);
      html += "<section class='folder'><h4 style='border-left-color:" + esc(tc.color) + "'>" + esc(tc.icon + " " + App.tr(tc.name)) +
        " <small>" + list.length + (list.length ? " · " + esc(App.formatDistance(total).split(" (")[0]) : "") + "</small></h4>" +
        (list.length ? list.map(function (tr) {
          return "<div class='item-row'><button class='item' data-id='" + esc(tr.id) + "'><span class='item-text'><b>" + esc(tr.name) +
            (tr.recording ? " ●" : "") + "</b><small>" + esc(summary(tr)) + "</small></span></button>" +
            "<button class='eye" + (tr.hidden ? " off" : "") + "' data-eye='" + esc(tr.id) + "' title='" + esc(t("showFolder")) + "'>👁</button>" +
            "<button class='eye' data-edit='" + esc(tr.id) + "'>⋯</button></div>";
        }).join("") + "<button class='mini' data-gpx='" + esc(tc.id) + "'>" + esc(t("exportTypeGpx")) + "</button>"
          : "<p class='hint'>" + esc(t("noTracks")) + "</p>") + "</section>";
    });
    var body = App.el(html + "</div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.a === "new") openChooser();
      if (b.dataset.id) { App.closeSheet(); fit(cache[b.dataset.id]); }
      if (b.dataset.edit) openEditor(b.dataset.edit);
      if (b.dataset.eye) {
        var tr = cache[b.dataset.eye];
        tr.hidden = !tr.hidden;
        b.classList.toggle("off", tr.hidden);
        save(tr); draw(tr);
      }
      if (b.dataset.gpx) {
        var tc = typeCfg(b.dataset.gpx);
        exportGpx(all.filter(function (tr) { return tr.type === tc.id; }), App.tr(tc.name));
      }
    });
    App.openSheet(t("tracks"), body);
  }

  function live() {
    return Object.keys(cache).map(function (k) { return cache[k]; }).filter(function (tr) { return !tr.deleted; });
  }

  // ---------- GPX ----------

  function xmlEsc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c];
    });
  }

  function toGpx(list) {
    var trks = list.map(function (tr) {
      return "  <trk>\n    <name>" + xmlEsc(tr.name) + "</name>\n" + (tr.note ? "    <desc>" + xmlEsc(tr.note) + "</desc>\n" : "") +
        "    <type>" + xmlEsc(App.tr(typeCfg(tr.type).name)) + "</type>\n" +
        "    <extensions><gc:id>" + xmlEsc(tr.id) + "</gc:id><gc:type>" + xmlEsc(tr.type) + "</gc:type>" +
        (tr.coilWidth ? "<gc:coil>" + tr.coilWidth + "</gc:coil>" : "") + "<gc:updated>" + xmlEsc(tr.updatedAt) + "</gc:updated></extensions>\n" +
        tr.segments.filter(function (s) { return s.length; }).map(function (seg) {
          return "    <trkseg>\n" + seg.map(function (p) {
            return '      <trkpt lat="' + p[0] + '" lon="' + p[1] + '">' + (p[2] != null ? "<ele>" + p[2] + "</ele>" : "") +
              "<time>" + new Date(p[3]).toISOString() + "</time></trkpt>";
          }).join("\n") + "\n    </trkseg>\n";
        }).join("") + "  </trk>";
    }).join("\n");
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx version="1.1" creator="' + xmlEsc(C.clubName) + '" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gc="https://goldclub.local/gpx">\n' +
      trks + "\n</gpx>\n";
  }

  function exportGpx(list, name) {
    var file = String(name || "routes").replace(/[^\w\-äöüÄÖÜ ]+/g, "").trim().replace(/\s+/g, "-") || "routes";
    ExportImport.download(file + ".gpx", toGpx(list), "application/gpx+xml");
  }

  // Strecken aus einer GPX-Datei (z. B. von einem anderen GPS-Gerät)
  function parseGpx(xml) {
    var doc = new DOMParser().parseFromString(xml, "application/xml");
    var trks = doc.getElementsByTagNameNS("*", "trk"), out = [];
    function txt(node, name) { var n = node.getElementsByTagNameNS("*", name)[0]; return n ? n.textContent.trim() : ""; }
    for (var i = 0; i < trks.length; i++) {
      var trk = trks[i], segs = [];
      var segNodes = trk.getElementsByTagNameNS("*", "trkseg");
      for (var s = 0; s < segNodes.length; s++) {
        var pts = segNodes[s].getElementsByTagNameNS("*", "trkpt"), seg = [];
        for (var k = 0; k < pts.length; k++) {
          var ele = txt(pts[k], "ele"), time = txt(pts[k], "time");
          seg.push([parseFloat(pts[k].getAttribute("lat")), parseFloat(pts[k].getAttribute("lon")),
            ele ? parseFloat(ele) : null, time ? Date.parse(time) : 0, null]);
        }
        if (seg.length) segs.push(seg);
      }
      if (!segs.length) continue;
      // Art: zuerst aus unserer eigenen Erweiterung (gc:type), sonst aus <type>, sonst "Gehen"
      var ext = trk.getElementsByTagNameNS("https://goldclub.local/gpx", "type")[0];
      var typeText = ext ? ext.textContent.trim() : txt(trk, "type");
      var type = TC.types.filter(function (tc) { return typeText === tc.id || typeText === tc.name.en || typeText === tc.name.de; })[0];
      var tr = newTrack(type ? type.id : "walk");
      var start = segs[0][0][3] ? new Date(segs[0][0][3]).toISOString() : tr.startedAt;
      Object.assign(tr, {
        id: txt(trk, "id") || tr.id, name: txt(trk, "name") || tr.name, note: txt(trk, "desc"),
        segments: segs, recording: false, startedAt: start, createdAt: start,
        updatedAt: txt(trk, "updated") || tr.updatedAt, endedAt: start
      });
      var coil = trk.getElementsByTagNameNS("https://goldclub.local/gpx", "coil")[0];
      tr.coilWidth = tr.type === "detect" ? (coil ? parseFloat(coil.textContent) : TC.coilWidth) : null;
      out.push(tr);
    }
    return out;
  }

  // Zusammenführen (Sicherung, GPX): gleiche ID -> neuere Version gewinnt
  function mergeMany(list) {
    var n = 0;
    return (list || []).reduce(function (chain, inc) {
      return chain.then(function () {
        var old = cache[inc.id];
        if (old && Date.parse(old.updatedAt) >= Date.parse(inc.updatedAt)) return;
        var tr = Object.assign(newTrack(inc.type || "walk"), inc, { recording: false });
        n++;
        return Store.putTrack(tr).then(function () { cache[tr.id] = tr; draw(tr); });
      });
    }, Promise.resolve()).then(function () { return n; });
  }

  // ---------- Start ----------

  function init(m) {
    map = m;
    visible = App.pref("tracksVisible", true);
    if (visible) layer.addTo(map);
    map.on("zoomend", updateBands);
    document.getElementById("btn-track").onclick = onButton;
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-track-edit]");
      if (!b) return;
      map.closePopup();
      openEditor(b.dataset.trackEdit);
    });
    // Bildschirm-Sperre geht beim Wechsel in den Hintergrund verloren: beim Zurückkommen neu anfordern
    document.addEventListener("visibilitychange", function () {
      if (!rec) return;
      if (document.visibilityState === "visible" && !rec.paused) keepAwake(true);
      if (document.visibilityState === "hidden") save(rec.track);   // nichts verlieren, falls das iPhone die App beendet
    });
    return Store.allTracks().then(function (list) {
      list.forEach(function (tr) {
        cache[tr.id] = tr;
        // Unfertige Aufnahme (App wurde geschlossen): als pausiert weiterführen
        if (tr.recording && !tr.deleted && !rec) {
          rec = { track: tr, watch: null, paused: true, saveCount: 0, weak: false };
          App.toast(t("trackResumeFound"));
        } else if (tr.recording) {
          tr.recording = false;
        }
        draw(tr);
      });
      updateBadge();
    });
  }

  return {
    init: init, openList: openList, mergeMany: mergeMany, parseGpx: parseGpx, setVisible: setVisible,
    get visible() { return visible; },
    all: function () { return Object.keys(cache).map(function (k) { return cache[k]; }); }
  };
})();

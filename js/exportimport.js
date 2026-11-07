/*
 * Dateiformate (KML, GPX, Sicherung) und das Export/Import-Fenster.
 */
var Formats = (function () {
  function xmlEsc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c];
    });
  }
  function first(node, name) {
    var list = node.getElementsByTagNameNS("*", name);
    return list.length ? list[0] : null;
  }
  function text(node, name) {
    var n = first(node, name);
    return n ? n.textContent.trim() : "";
  }
  function parseCoords(str) {
    return str.trim().split(/\s+/).map(function (t) {
      var a = t.split(",").map(Number);
      return [a[0], a[1]];
    }).filter(function (c) { return !isNaN(c[0]) && !isNaN(c[1]); });
  }

  // KML -> GeoJSON (Punkte, Linien, Flächen, auch in MultiGeometry)
  function kmlToGeoJSON(xml) {
    var doc = new DOMParser().parseFromString(xml, "application/xml");
    var out = { type: "FeatureCollection", features: [] };
    var placemarks = doc.getElementsByTagNameNS("*", "Placemark");
    for (var i = 0; i < placemarks.length; i++) {
      var pm = placemarks[i];
      var props = { name: text(pm, "name"), description: text(pm, "description").replace(/<[^>]*>/g, " ").trim() };
      var data = pm.getElementsByTagNameNS("*", "Data");
      for (var d = 0; d < data.length; d++) props[data[d].getAttribute("name")] = text(data[d], "value");
      var geoms = [];
      ["Point", "LineString", "Polygon"].forEach(function (type) {
        var nodes = pm.getElementsByTagNameNS("*", type);
        for (var k = 0; k < nodes.length; k++) {
          var g = nodes[k];
          if (type === "Point") {
            var c = parseCoords(text(g, "coordinates"));
            if (c.length) geoms.push({ type: "Point", coordinates: c[0] });
          } else if (type === "LineString") {
            geoms.push({ type: "LineString", coordinates: parseCoords(text(g, "coordinates")) });
          } else {
            var rings = [];
            var outer = first(g, "outerBoundaryIs");
            if (outer) rings.push(parseCoords(text(outer, "coordinates")));
            var inner = g.getElementsByTagNameNS("*", "innerBoundaryIs");
            for (var r = 0; r < inner.length; r++) rings.push(parseCoords(text(inner[r], "coordinates")));
            if (rings.length && rings[0].length > 2) geoms.push({ type: "Polygon", coordinates: rings });
          }
        }
      });
      geoms.forEach(function (g) { out.features.push({ type: "Feature", properties: props, geometry: g }); });
    }
    return out;
  }

  function catName(id) { return App.tr(Points.category(id).name); }

  function toGpx(points) {
    var wpts = points.map(function (p) {
      return '  <wpt lat="' + p.lat.toFixed(7) + '" lon="' + p.lon.toFixed(7) + '">\n' +
        (p.elevation != null ? "    <ele>" + p.elevation.toFixed(1) + "</ele>\n" : "") +
        "    <time>" + xmlEsc(p.createdAt) + "</time>\n" +
        "    <name>" + xmlEsc(p.name) + "</name>\n" +
        (p.note ? "    <desc>" + xmlEsc(p.note) + "</desc>\n" : "") +
        "    <type>" + xmlEsc(catName(p.category)) + "</type>\n" +
        "    <extensions><gc:id>" + xmlEsc(p.id) + "</gc:id><gc:category>" + xmlEsc(p.category) + "</gc:category>" +
        "<gc:updated>" + xmlEsc(p.updatedAt) + "</gc:updated></extensions>\n" +
        "  </wpt>";
    }).join("\n");
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx version="1.1" creator="' + xmlEsc(APP_CONFIG.clubName) + '" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gc="https://goldclub.local/gpx">\n' +
      wpts + "\n</gpx>\n";
  }

  function toKml(points) {
    var styles = APP_CONFIG.categories.map(function (c) {
      // KML-Farben sind aabbggrr
      var hex = c.color.replace("#", "");
      var kc = "ff" + hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
      return '  <Style id="' + xmlEsc(c.id) + '"><IconStyle><color>' + kc + "</color></IconStyle></Style>";
    }).join("\n");
    var pms = points.map(function (p) {
      return "  <Placemark>\n    <name>" + xmlEsc(p.name) + "</name>\n" +
        (p.note ? "    <description>" + xmlEsc(p.note) + "</description>\n" : "") +
        '    <styleUrl>#' + xmlEsc(p.category) + "</styleUrl>\n" +
        "    <TimeStamp><when>" + xmlEsc(p.createdAt) + "</when></TimeStamp>\n" +
        '    <ExtendedData><Data name="gc_id"><value>' + xmlEsc(p.id) + '</value></Data>' +
        '<Data name="category"><value>' + xmlEsc(p.category) + '</value></Data>' +
        '<Data name="category_name"><value>' + xmlEsc(catName(p.category)) + '</value></Data>' +
        '<Data name="updated"><value>' + xmlEsc(p.updatedAt) + "</value></Data></ExtendedData>\n" +
        "    <Point><coordinates>" + p.lon.toFixed(7) + "," + p.lat.toFixed(7) + (p.elevation != null ? "," + p.elevation.toFixed(1) : "") + "</coordinates></Point>\n" +
        "  </Placemark>";
    }).join("\n");
    return '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n  <name>' +
      xmlEsc(APP_CONFIG.clubName) + "</name>\n" + styles + "\n" + pms + "\n</Document>\n</kml>\n";
  }

  // Kategorie aus Text erraten (bei Dateien aus anderen Apps)
  function guessCategory(id, name) {
    var cats = APP_CONFIG.categories;
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      if (id === c.id || (name && (name === c.name.en || name === c.name.de))) return c.id;
    }
    return cats[cats.length - 1].id;
  }

  // GPX/KML -> Liste von Punkt-Feldern
  function parsePoints(xml) {
    var doc = new DOMParser().parseFromString(xml, "application/xml");
    if (first(doc, "parsererror")) throw new Error("XML");
    var out = [];
    var wpts = doc.getElementsByTagNameNS("*", "wpt");
    for (var i = 0; i < wpts.length; i++) {
      var w = wpts[i];
      var ele = text(w, "ele");
      out.push({
        id: text(w, "id") || null,
        name: text(w, "name"), note: text(w, "desc") || text(w, "cmt"),
        category: guessCategory(text(w, "category"), text(w, "type")),
        lat: parseFloat(w.getAttribute("lat")), lon: parseFloat(w.getAttribute("lon")),
        elevation: ele ? parseFloat(ele) : null,
        createdAt: text(w, "time") || null, updatedAt: text(w, "updated") || null
      });
    }
    if (!wpts.length) {
      kmlToGeoJSON(xml).features.forEach(function (f) {
        if (f.geometry.type !== "Point") return;
        var p = f.properties;
        out.push({
          id: p.gc_id || null, name: p.name, note: p.description,
          category: guessCategory(p.category, p.category_name),
          lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], elevation: null,
          createdAt: null, updatedAt: p.updated || null
        });
      });
    }
    return out.filter(function (p) { return !isNaN(p.lat) && !isNaN(p.lon); });
  }

  return { kmlToGeoJSON: kmlToGeoJSON, toGpx: toGpx, toKml: toKml, parsePoints: parsePoints };
})();

var ExportImport = (function () {
  function stamp() { return new Date().toISOString().slice(0, 10); }

  function download(name, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  function livePoints() { return Points.all().filter(function (p) { return !p.deleted; }); }

  function blobToBase64(blob) {
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1]); };
      r.readAsDataURL(blob);
    });
  }
  function base64ToBlob(b64, mime) {
    var bin = atob(b64), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  // Sicherung: alle Punkte (auch gelöschte, für Version 2) und Fotos in einer JSON-Datei
  function backup() {
    var pts = Points.all();
    var ids = [];
    pts.concat(Claims.all()).forEach(function (p) { ids = ids.concat(p.photos || []); });
    return Promise.all(ids.map(Store.getPhoto)).then(function (photos) {
      return Promise.all(photos.filter(Boolean).map(function (ph) {
        return blobToBase64(ph.blob).then(function (b64) {
          return { id: ph.id, pointId: ph.pointId, mime: ph.mime, createdAt: ph.createdAt, data: b64 };
        });
      }));
    }).then(function (photos) {
      var data = { format: "goldclub-backup", version: 1, exportedAt: new Date().toISOString(), points: pts, photos: photos,
        claims: Claims.all(), tracks: Tracks.all() };
      download("goldclub-backup-" + stamp() + ".json", JSON.stringify(data), "application/json");
      App.setPref("lastBackup", new Date().toISOString());
    });
  }

  // Zusammenführen: gleicher Punkt (gleiche ID) -> neuere Version gewinnt
  function merge(incoming) {
    var count = 0;
    var existing = {};
    Points.all().forEach(function (p) { existing[p.id] = p; });
    return incoming.reduce(function (chain, fields) {
      return chain.then(function () {
        var old = fields.id ? existing[fields.id] : null;
        if (old && old.updatedAt && fields.updatedAt && old.updatedAt >= fields.updatedAt) return;
        var base = old || Store.newPoint();
        var p = Object.assign({}, base);
        Object.keys(fields).forEach(function (k) { if (fields[k] != null) p[k] = fields[k]; });
        if (!p.id) p.id = Store.uuid();
        if (!p.updatedAt) p.updatedAt = new Date().toISOString();
        if (!p.createdAt) p.createdAt = p.updatedAt;
        if (!p.photos) p.photos = old ? old.photos : [];
        if (!p.sync) p.sync = { status: "local", remoteId: null, syncedAt: null };
        count++;
        return Store.putPoint(p).then(function () { Points.show(p); });
      });
    }, Promise.resolve()).then(function () { return count; });
  }

  function importFile(file) {
    return file.text().then(function (txt) {
      var trimmed = txt.trim();
      if (trimmed.charAt(0) === "{") {
        var data = JSON.parse(trimmed);
        if (data.format !== "goldclub-backup") throw new Error("format");
        var photos = data.photos || [];
        return Promise.all(photos.map(function (ph) {
          return Store.putPhoto({ id: ph.id, pointId: ph.pointId, mime: ph.mime, createdAt: ph.createdAt, blob: base64ToBlob(ph.data, ph.mime) });
        })).then(function () { return merge(data.points || []); })
          .then(function (n) { return Claims.mergeMany(data.claims || []).then(function (m) { return n + m; }); })
          .then(function (n) { return Tracks.mergeMany(data.tracks || []).then(function (m) { return n + m; }); });
      }
      // GPX/KML: Punkte, und aus GPX zusätzlich die Strecken
      var points = Formats.parsePoints(txt);
      var tracks = /<trk[\s>]/.test(txt) ? Tracks.parseGpx(txt) : [];
      return merge(points).then(function (n) { return Tracks.mergeMany(tracks).then(function (m) { return n + m; }); });
    });
  }

  function openPanel() {
    var t = App.t, esc = App.esc;
    var last = App.pref("lastBackup", null);
    var body = App.el(
      "<div class='menu'>" +
      "<button data-a='gpx'>" + esc(t("exportGpx")) + "</button>" +
      "<button data-a='kml'>" + esc(t("exportKml")) + "</button>" +
      "<p class='hint'>" + esc(t("exportNoPhotos")) + "</p>" +
      "<button data-a='backup'>" + esc(t("backup")) + "</button>" +
      "<p class='hint'>" + esc(t("lastBackup")) + ": " + esc(last ? last.slice(0, 10) : t("never")) + "<br>" + esc(t("persistHint")) + "</p>" +
      "<label class='btn-like'>" + esc(t("import")) + "<input type='file' accept='.gpx,.kml,.json,application/gpx+xml,application/vnd.google-earth.kml+xml,application/json' hidden></label>" +
      "</div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.a === "gpx") download("goldclub-points-" + stamp() + ".gpx", Formats.toGpx(livePoints()), "application/gpx+xml");
      if (b.dataset.a === "kml") download("goldclub-points-" + stamp() + ".kml", Formats.toKml(livePoints()), "application/vnd.google-earth.kml+xml");
      if (b.dataset.a === "backup") backup().catch(function (err) { alert(err); });
    });
    body.querySelector("input[type=file]").onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      importFile(f).then(function (n) {
        App.toast(t("imported") + ": " + n);
        App.closeSheet();
      }).catch(function (err) { alert(t("loadError") + ": " + err.message); });
    };
    App.openSheet(t("exportImport"), body);
  }

  return { openPanel: openPanel, importFile: importFile, download: download };
})();

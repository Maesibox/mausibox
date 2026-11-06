/*
 * Hauptprogramm: Karte, Grundkarten, Ebenen, GPS, Info beim Antippen.
 * Einstellungen kommen aus config.js (APP_CONFIG).
 */
var App = (function () {
  var C = APP_CONFIG;
  var CELL_Z = 12;                 // Daten (Claims, Minen) werden in Kacheln dieser Zoomstufe geladen
  var DATA_CACHE = "gc-data";
  var TILE_CACHE = "gc-tiles";

  // ---------- Hilfen ----------

  function pref(key, fallback) {
    try {
      var v = localStorage.getItem("gc." + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }
  function setPref(key, value) {
    try { localStorage.setItem("gc." + key, JSON.stringify(value)); } catch (e) {}
  }

  var lang = pref("lang", C.defaultLanguage);
  if (!C.text[lang]) lang = "en";

  function t(key) { return C.text[lang][key] || C.text.en[key] || key; }
  function tr(obj) { return obj == null ? "" : (typeof obj === "string" ? obj : (obj[lang] || obj.en || "")); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function formatCoord(lat, lon) {
    if (C.coordinateFormat === "dms") {
      var f = function (v, pos, neg) {
        var a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.round(((a - d) * 60 - m) * 60);
        if (s === 60) { s = 0; m++; } if (m === 60) { m = 0; d++; }
        return d + "°" + String(m).padStart(2, "0") + "'" + String(s).padStart(2, "0") + '"' + (v >= 0 ? pos : neg);
      };
      return f(lat, "N", "S") + " " + f(lon, "E", "W");
    }
    return lat.toFixed(5) + ", " + lon.toFixed(5);
  }

  var toastTimer = null;
  function toast(msg) {
    var box = document.getElementById("toast");
    box.textContent = msg;
    box.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove("show"); }, 3000);
  }

  // Unteres Fenster ("Sheet") für Formulare und Listen
  var sheetCloseCb = null;
  function runSheetClose() {
    var cb = sheetCloseCb;
    sheetCloseCb = null;
    if (cb) cb();
  }
  function onSheetClose(fn) { sheetCloseCb = fn; }

  function openSheet(title, bodyEl) {
    runSheetClose();
    var sheet = document.getElementById("sheet");
    sheet.querySelector(".sheet-title").textContent = title;
    var body = sheet.querySelector(".sheet-body");
    body.innerHTML = "";
    body.appendChild(bodyEl);
    sheet.classList.add("open");
    body.scrollTop = 0;
  }
  function closeSheet() {
    runSheetClose();
    document.getElementById("sheet").classList.remove("open");
  }

  // Netzwerk mit Zeitlimit; bei Erfolg im Cache ablegen, ohne Netz aus dem Cache lesen
  function cachedFetch(url, type) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 15000);
    return fetch(url, controller ? { signal: controller.signal } : {})
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        var copy = res.clone();
        if (window.caches) caches.open(DATA_CACHE).then(function (c) { c.put(url, copy); }).catch(function () {});
        return type === "json" ? res.json() : res.text();
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (!window.caches) throw err;
        return caches.open(DATA_CACHE)
          .then(function (c) { return c.match(url, { ignoreVary: true }); })
          .then(function (hit) {
            if (!hit) throw err;
            return type === "json" ? hit.json() : hit.text();
          });
      });
  }

  // ---------- Kachel-Raster für Daten ----------

  function lon2x(lon, z) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)); }
  function lat2y(lat, z) {
    var r = lat * Math.PI / 180;
    return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
  }
  function x2lon(x, z) { return x / Math.pow(2, z) * 360 - 180; }
  function y2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  function tileRange(bounds, z) {
    return {
      x0: lon2x(bounds.getWest(), z), x1: lon2x(bounds.getEast(), z),
      y0: lat2y(bounds.getNorth(), z), y1: lat2y(bounds.getSouth(), z)
    };
  }

  function cellsFor(bounds) {
    var r = tileRange(bounds, CELL_Z), out = [];
    for (var x = r.x0; x <= r.x1; x++) for (var y = r.y0; y <= r.y1; y++) out.push({ x: x, y: y });
    return out;
  }

  function cellBox(x, y) {
    return {
      w: x2lon(x, CELL_Z).toFixed(6), e: x2lon(x + 1, CELL_Z).toFixed(6),
      n: y2lat(y, CELL_Z).toFixed(6), s: y2lat(y + 1, CELL_Z).toFixed(6)
    };
  }

  // ---------- Daten laden: BLM Claims ----------

  function blmUrl(cfg, b, offset) {
    return cfg.url +
      "?where=1%3D1" +
      "&geometry=" + b.w + "," + b.s + "," + b.e + "," + b.n +
      "&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326" +
      "&outFields=CSE_NR,LEG_CSE_NR,CSE_DISP,CSE_NAME,BLM_PROD,RCRD_ACRS,SF_ID,LOC_DT" +
      "&geometryPrecision=6&orderByFields=OBJECTID" +
      "&resultOffset=" + offset + "&resultRecordCount=2000&f=geojson";
  }

  function fetchBlmCell(cfg, x, y) {
    var b = cellBox(x, y), all = [];
    function page(offset) {
      return cachedFetch(blmUrl(cfg, b, offset), "json").then(function (data) {
        var feats = data.features || [];
        all = all.concat(feats);
        var more = data.exceededTransferLimit || (data.properties && data.properties.exceededTransferLimit);
        if (more && feats.length && offset < 20000) return page(offset + feats.length);
        return all;
      });
    }
    return page(0);
  }

  // ---------- Daten laden: USGS WFS-Punkte (GML) ----------

  function wfsUrl(cfg, b) {
    return cfg.url + "?service=WFS&version=1.1.0&request=GetFeature&typename=" + cfg.typeName +
      "&bbox=" + b.s + "," + b.w + "," + b.n + "," + b.e + ",EPSG:4326&maxFeatures=5000";
  }

  function parseGmlPoints(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, "application/xml");
    var members = doc.getElementsByTagNameNS("*", "featureMember");
    var out = [];
    for (var i = 0; i < members.length; i++) {
      var f = members[i].firstElementChild;
      if (!f) continue;
      var pos = f.getElementsByTagNameNS("*", "pos")[0];
      if (!pos) continue;
      var ll = pos.textContent.trim().split(/\s+/).map(Number);
      var props = { _id: f.getAttribute("gml:id") || f.getAttribute("id") };
      for (var j = 0; j < f.children.length; j++) {
        var c = f.children[j];
        if (c.localName !== "geometry" && c.localName !== "boundedBy") props[c.localName] = c.textContent.trim();
      }
      out.push({ lat: ll[0], lon: ll[1], props: props });
    }
    return out;
  }

  function fetchWfsCell(cfg, x, y) {
    return cachedFetch(wfsUrl(cfg, cellBox(x, y)), "text").then(parseGmlPoints);
  }

  // Wird auch vom Offline-Modus benutzt
  function fetchCell(cfg, x, y) {
    if (cfg.type === "blmClaims") return fetchBlmCell(cfg, x, y);
    if (cfg.type === "wfsPoints") return fetchWfsCell(cfg, x, y);
    return Promise.resolve([]);
  }

  // ---------- Karte ----------

  var map, currentBase = null, baseLayers = {}, overlayState = {}, overlayObjs = {};
  var blmFeatures = [], clubFeatures = [];

  function makeTileLayer(cfg, extra) {
    return L.tileLayer(cfg.url, Object.assign({
      attribution: cfg.attribution,
      maxNativeZoom: cfg.maxNativeZoom || 18,
      maxZoom: 20,
      crossOrigin: true,
      opacity: cfg.opacity == null ? 1 : cfg.opacity
    }, extra || {}));
  }

  // Ebene, die Daten zellenweise beim Verschieben der Karte nachlädt
  function makeCellLayer(cfg, render) {
    var group = L.featureGroup();
    var loaded = {}, seen = {};
    var pending = 0;
    function update() {
      if (!map.hasLayer(group)) return;
      if (map.getZoom() < cfg.minZoom) { setLayerNote(cfg.id, t("zoomInFor") + " (≥ " + cfg.minZoom + ")"); return; }
      if (pending === 0) setLayerNote(cfg.id, "");
      var cells = cellsFor(map.getBounds());
      if (cells.length > 40) return;
      cells.forEach(function (c) {
        var key = c.x + "/" + c.y;
        if (loaded[key]) return;
        loaded[key] = true;
        pending++;
        setLayerNote(cfg.id, t("loading"));
        fetchCell(cfg, c.x, c.y).then(function (items) {
          items.forEach(function (it) {
            var id = it.properties ? (it.properties.CSE_NR || it.id) : it.props._id;
            if (id && seen[id]) return;
            if (id) seen[id] = true;
            render(group, it);
          });
        }).catch(function () {
          // Server hatte einen Aussetzer: Bereich später nochmals versuchen
          loaded[key] = false;
          setLayerNote(cfg.id, t("loadError"));
          setTimeout(update, 8000);
        }).then(function () {
          pending--;
          if (pending === 0) setLayerNote(cfg.id, "");
        });
      });
    }
    group.on("add", function () { setTimeout(update, 0); });
    group._gcUpdate = update;
    return group;
  }

  function buildOverlay(cfg) {
    if (cfg.type === "tiles") return makeTileLayer(cfg, { zIndex: 10 });
    if (cfg.type === "userClaims") return Claims.layer;

    if (cfg.type === "blmClaims") {
      return makeCellLayer(cfg, function (group, f) {
        var layer = L.geoJSON(f, {
          interactive: false,
          style: { color: cfg.color, weight: 2, fillColor: cfg.color, fillOpacity: cfg.fillOpacity }
        });
        group.addLayer(layer);
        blmFeatures.push(f);
      });
    }

    if (cfg.type === "wfsPoints") {
      return makeCellLayer(cfg, function (group, p) {
        var isGold = cfg.goldColor && /\bAU\b/.test(p.props.code_list || "");
        var m = L.circleMarker([p.lat, p.lon], {
          radius: isGold ? 7 : 5,
          color: "#000", weight: 1,
          fillColor: isGold ? cfg.goldColor : cfg.color, fillOpacity: 0.9,
          bubblingMouseEvents: false
        });
        m.bindPopup(function () { return wfsPopup(cfg, p); }, { maxWidth: 280 });
        group.addLayer(m);
      });
    }

    if (cfg.type === "file") {
      var group = L.featureGroup();
      var addGeoJSON = function (gj, clubName) {
        L.geoJSON(gj, {
          style: { color: cfg.color, weight: 2, fillColor: cfg.color, fillOpacity: cfg.fillOpacity },
          interactive: false,
          pointToLayer: function (f, ll) {
            return L.circleMarker(ll, { radius: 6, color: "#000", weight: 1, fillColor: cfg.color, fillOpacity: 1, interactive: false });
          },
          onEachFeature: function (f) {
            f.properties = f.properties || {};
            if (clubName) f.properties._club = clubName;
            clubFeatures.push(f);
          }
        }).addTo(group);
      };
      if (Auth.enabled()) {
        // Mit Login: Club-Claims kommen vom Server, nur für Mitglieder
        Auth.clubFiles().then(function (files) {
          files.forEach(function (f) { addGeoJSON(f.geojson, f.club); });
        });
        return group;
      }
      (cfg.files || []).forEach(function (path) {
        fetch(path).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        }).then(function (txt) {
          addGeoJSON(/\.kml$/i.test(path) ? Formats.kmlToGeoJSON(txt) : JSON.parse(txt));
        }).catch(function () {
          console.warn("Club file not loaded:", path);
        });
      });
      return group;
    }
    return null;
  }

  // ---------- Popups ----------

  var COMMODITIES = {
    AU: "Gold", AG: "Silver", CU: "Copper", PB: "Lead", ZN: "Zinc", MN: "Manganese", FE: "Iron",
    W: "Tungsten", MO: "Molybdenum", U: "Uranium", BA: "Barite", F: "Fluorite", QTZ: "Quartz",
    SDG: "Sand & gravel", PER: "Perlite", PUM: "Pumice", VOL: "Volcanic materials", CLY: "Clay",
    GEM: "Gemstones", GEM_SP: "Gemstones (semi-precious)", STN: "Stone", GYP: "Gypsum", HG: "Mercury",
    SB: "Antimony", BI: "Bismuth", V: "Vanadium", BE: "Beryllium", LI: "Lithium", REE: "Rare earths"
  };

  function row(label, value) {
    if (value == null || value === "") return "";
    return "<tr><th>" + esc(label) + "</th><td>" + esc(value) + "</td></tr>";
  }

  function wfsPopup(cfg, p) {
    var a = p.props;
    if (cfg.typeName.indexOf("mrds") === 0) {
      var codes = (a.code_list || "").trim().split(/\s+/).filter(Boolean)
        .map(function (c) { return COMMODITIES[c] ? COMMODITIES[c] + " (" + c + ")" : c; }).join(", ");
      return "<div class='pop'><h3>" + esc(a.site_name || t("mine")) + "</h3><div class='pop-sub'>" + esc(t("mine")) + "</div><table>" +
        row(t("devStatus"), a.dev_stat) + row(t("commodities"), codes) +
        row("", formatCoord(p.lat, p.lon)) + "</table>" +
        (a.url ? "<a href='" + esc(a.url) + "' target='_blank' rel='noopener'>" + esc(t("moreInfo")) + "</a>" : "") + "</div>";
    }
    return "<div class='pop'><h3>" + esc(a.ftr_type || t("mineFeature")) + "</h3><div class='pop-sub'>" + esc(t("mineFeature")) + "</div><table>" +
      row(t("name"), a.ftr_name) + row(t("topoMap"), a.topo_name ? a.topo_name + " (" + a.topo_date + ")" : "") +
      row("", formatCoord(p.lat, p.lon)) + "</table></div>";
  }

  // Liegt ein Punkt in einem (Multi-)Polygon?
  function inRing(lon, lat, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function inPolygon(lon, lat, rings) {
    if (!inRing(lon, lat, rings[0])) return false;
    for (var k = 1; k < rings.length; k++) if (inRing(lon, lat, rings[k])) return false;
    return true;
  }
  function hit(feature, lon, lat) {
    var g = feature.geometry;
    if (!g) return false;
    if (g.type === "Polygon") return inPolygon(lon, lat, g.coordinates);
    if (g.type === "MultiPolygon") return g.coordinates.some(function (p) { return inPolygon(lon, lat, p); });
    return false;
  }

  function claimHtml(f) {
    var a = f.properties, cfg = overlayCfg("blm");
    var date = a.LOC_DT ? new Date(a.LOC_DT).toISOString().slice(0, 10) : "";
    var link = a.SF_ID ? cfg.detailsLink.replace("{SF_ID}", encodeURIComponent(a.SF_ID)) : "";
    return "<div class='pop-sec claim'><h3>" + esc(a.CSE_NAME || a.CSE_NR) + "</h3><div class='pop-sub'>" + esc(t("claim")) + "</div><table>" +
      row(t("serial"), a.CSE_NR) + row(t("legacySerial"), a.LEG_CSE_NR) + row(t("status"), a.CSE_DISP) +
      row(t("claimType"), a.BLM_PROD) + row(t("acres"), a.RCRD_ACRS) + row("Location date", date) + "</table>" +
      (link ? "<a href='" + esc(link) + "' target='_blank' rel='noopener'>" + esc(t("ownerLink")) + " ↗</a>" : "") +
      "<p class='hint'>" + esc(t("claimApprox")) + "</p>" +
      "<button class='mini-btn' data-newclaim='" + esc(JSON.stringify({ serial: a.CSE_NR, name: a.CSE_NAME || "",
        kind: /placer/i.test(a.BLM_PROD) ? "placer" : /mill/i.test(a.BLM_PROD) ? "millsite" : /lode/i.test(a.BLM_PROD) ? "lode" : "other" })) + "'>" +
        esc(t("fromBlm")) + "</button></div>";
  }

  function clubHtml(f) {
    var p = f.properties || {};
    return "<div class='pop-sec club'><h3>" + esc(p.name || t("clubClaim")) + "</h3><div class='pop-sub'>" + esc(t("clubClaim")) + "</div>" +
      (p.description ? "<p>" + esc(p.description) + "</p>" : "") + "</div>";
  }

  function geologyHtml(d) {
    var b = (d.burwell || [])[0];
    var line = d.lines && d.lines.type ? d.lines : null;
    if (!b && !line) return "<div class='pop-sec'><p class='hint'>" + esc(t("noGeology")) + "</p></div>";
    var html = "<div class='pop-sec geo'>";
    if (b) {
      var age = b.b_int_name && b.t_int_name && b.b_int_name !== b.t_int_name ? b.b_int_name + " – " + b.t_int_name : (b.b_int_name || "");
      if (b.b_int_age != null) age += " (" + b.b_int_age + (b.t_int_age != null && b.t_int_age !== b.b_int_age ? "–" + b.t_int_age : "") + " Ma)";
      html += "<h3><span class='swatch' style='background:" + esc(b.color || "#ccc") + "'></span>" + esc(b.name) + "</h3>" +
        "<div class='pop-sub'>" + esc(t("geology")) + "</div><table>" +
        row(t("lithology"), String(b.lith || "").replace(/^Major:\{|\}$/g, "").replace(/[{}]/g, "")) +
        row(t("age"), age) + "</table>" +
        (b.descrip ? "<details><summary>…</summary><p>" + esc(b.descrip) + "</p></details>" : "");
    }
    if (line) {
      html += "<table>" + row(t("faults"), [line.name, line.descrip || line.type, line.direction].filter(Boolean).join(" · ")) + "</table>";
    }
    var ref = (b && b.ref) || (line && line.ref);
    if (ref) html += "<div class='src'>" + esc(t("source")) + ": " + esc(ref.name || "") + (ref.ref_year ? " (" + esc(ref.ref_year) + ")" : "") + "</div>";
    return html + "</div>";
  }

  function onMapClick(e) {
    var lat = e.latlng.lat, lon = e.latlng.lng;
    var parts = [];
    if (overlayState.blm) blmFeatures.filter(function (f) { return hit(f, lon, lat); }).forEach(function (f) { parts.push(claimHtml(f)); });
    if (overlayState.club) clubFeatures.filter(function (f) { return hit(f, lon, lat); }).forEach(function (f) { parts.push(clubHtml(f)); });
    C.overlays.forEach(function (o) {
      if (o.type === "userClaims" && overlayState[o.id]) parts = parts.concat(Claims.hitHtml(lon, lat));
    });

    var wantGeo = C.overlays.some(function (o) { return o.geologyInfo && overlayState[o.id]; });
    var head = "<div class='pop'><div class='coords'>" + esc(formatCoord(lat, lon)) + "</div>";
    var popup = L.popup({ maxWidth: 300, maxHeight: 360 }).setLatLng(e.latlng)
      .setContent(head + parts.join("") + (wantGeo ? "<div class='pop-sec geo-slot'><p class='hint'>" + esc(t("loading")) + "</p></div>" : "") + "</div>")
      .openOn(map);

    if (wantGeo) {
      var url = C.geologyInfoUrl + "?lat=" + lat.toFixed(5) + "&lng=" + lon.toFixed(5) + "&z=" + Math.min(map.getZoom(), 16);
      cachedFetch(url, "json").then(function (res) {
        return geologyHtml(res.success.data);
      }).catch(function () {
        return "<div class='pop-sec'><p class='hint'>" + esc(navigator.onLine ? t("loadError") : t("geologyOffline")) + "</p></div>";
      }).then(function (html) {
        popup.setContent(head + parts.join("") + html + "</div>");
      });
    }
  }

  // ---------- Ebenen-Menü ----------

  function overlayCfg(id) {
    for (var i = 0; i < C.overlays.length; i++) if (C.overlays[i].id === id) return C.overlays[i];
    return null;
  }

  function setLayerNote(id, text) {
    var n = document.querySelector("[data-note='" + id + "']");
    if (n) n.textContent = text;
  }

  function setBase(id) {
    var cfg = C.basemaps.filter(function (b) { return b.id === id; })[0] || C.basemaps[0];
    if (currentBase) map.removeLayer(currentBase);
    if (!baseLayers[cfg.id]) baseLayers[cfg.id] = makeTileLayer(cfg, { zIndex: 1 });
    currentBase = baseLayers[cfg.id];
    currentBase.addTo(map);
    setPref("base", cfg.id);
  }

  function setOverlay(id, on) {
    var cfg = overlayCfg(id);
    if (!overlayObjs[id]) overlayObjs[id] = buildOverlay(cfg);
    var layer = overlayObjs[id];
    overlayState[id] = on;
    if (on) layer.addTo(map); else { map.removeLayer(layer); setLayerNote(id, ""); }
    savedOverlays[id] = on;
    setPref("overlays", savedOverlays);
  }

  function setOpacity(id, value) {
    var layer = overlayObjs[id];
    if (layer && layer.setOpacity) layer.setOpacity(value);
    savedOpacity[id] = value;
    setPref("opacity", savedOpacity);
  }

  // Privatpersonen (ohne Club) sehen die Ebene Club-Claims gar nicht
  function visibleInPanel(o) {
    return !(o.type === "file" && Auth.enabled() && Auth.account && !Auth.account.clubs.length);
  }

  function openLayersPanel() {
    var baseId = pref("base", null);
    var html = "<div class='layers'><h4>" + esc(t("basemap")) + "</h4>";
    C.basemaps.forEach(function (b) {
      html += "<label class='opt'><input type='radio' name='base' value='" + esc(b.id) + "'" + (b.id === baseId ? " checked" : "") + "> " + esc(tr(b.name)) + "</label>";
    });
    html += "<h4>" + esc(t("overlays")) + "</h4>";
    C.overlays.filter(visibleInPanel).forEach(function (o) {
      html += "<div class='opt-row'><label class='opt'><input type='checkbox' value='" + esc(o.id) + "'" + (overlayState[o.id] ? " checked" : "") + "> " +
        (o.color ? "<span class='swatch' style='background:" + esc(o.color) + "'></span>" : "") + esc(tr(o.name)) + "</label>" +
        "<div class='note' data-note='" + esc(o.id) + "'></div>";
      if (o.type === "tiles") {
        var op = savedOpacity[o.id] != null ? savedOpacity[o.id] : o.opacity;
        html += "<input class='opacity' type='range' min='0.1' max='1' step='0.1' data-op='" + esc(o.id) + "' value='" + op + "'>";
      }
      html += "</div>";
    });
    html += "<label class='opt'><input type='checkbox' value='__points'" + (pointsVisible ? " checked" : "") + "> " + esc(t("points")) + "</label></div>";

    var body = el(html);
    body.addEventListener("change", function (e) {
      var inp = e.target;
      if (inp.name === "base") setBase(inp.value);
      else if (inp.value === "__points") setPointsVisible(inp.checked);
      else if (inp.type === "checkbox") setOverlay(inp.value, inp.checked);
    });
    body.addEventListener("input", function (e) {
      if (e.target.dataset.op) setOpacity(e.target.dataset.op, parseFloat(e.target.value));
    });
    openSheet(t("layers"), body);
    C.overlays.forEach(function (o) {
      if (overlayState[o.id] && overlayObjs[o.id] && overlayObjs[o.id]._gcUpdate) overlayObjs[o.id]._gcUpdate();
    });
  }

  // ---------- Eigene Punkte ein/aus ----------

  var pointsVisible = pref("pointsVisible", true);
  function setPointsVisible(on) {
    pointsVisible = on;
    setPref("pointsVisible", on);
    if (on) Points.layer.addTo(map); else map.removeLayer(Points.layer);
  }

  // ---------- GPS ----------

  var gps = { watch: null, marker: null, circle: null, last: null, follow: false };

  function startGps(centerOnFix) {
    if (!navigator.geolocation) { toast(t("gpsError")); return; }
    gps.follow = !!centerOnFix;
    if (gps.last && centerOnFix) map.setView([gps.last.lat, gps.last.lon], Math.max(map.getZoom(), 15));
    if (gps.watch !== null) return;
    setStatus(t("gpsWaiting"));
    document.getElementById("btn-gps").classList.add("active");
    gps.watch = navigator.geolocation.watchPosition(function (pos) {
      var c = pos.coords;
      gps.last = { lat: c.latitude, lon: c.longitude, accuracy: c.accuracy, elevation: c.altitude, time: pos.timestamp };
      var ll = [c.latitude, c.longitude];
      if (!gps.marker) {
        gps.circle = L.circle(ll, { radius: c.accuracy, color: "#2f80ed", weight: 1, fillOpacity: 0.1, interactive: false }).addTo(map);
        gps.marker = L.circleMarker(ll, { radius: 8, color: "#fff", weight: 3, fillColor: "#2f80ed", fillOpacity: 1, interactive: false }).addTo(map);
      } else {
        gps.marker.setLatLng(ll);
        gps.circle.setLatLng(ll).setRadius(c.accuracy);
      }
      if (gps.follow) { map.setView(ll, Math.max(map.getZoom(), 15)); gps.follow = false; }
      setStatus("GPS " + formatCoord(c.latitude, c.longitude) + "  ±" + Math.round(c.accuracy) + " m" +
        (c.altitude != null ? "  ↑" + Math.round(c.altitude * 3.28084) + " ft" : ""));
    }, function () {
      setStatus(t("gpsError"));
      document.getElementById("btn-gps").classList.remove("active");
      navigator.geolocation.clearWatch(gps.watch);
      gps.watch = null;
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
  }

  function setStatus(text) { document.getElementById("status").textContent = text; }

  // ---------- Menü ----------

  function openMenu() {
    var body = el(
      "<div class='menu'>" +
      (Auth.enabled() && Auth.account ? "<button data-a='account'>👤 " + esc(Auth.account.username) + "</button>" : "") +
      "<button data-a='points'>" + esc(t("points")) + "</button>" +
      "<button data-a='claims'>" + esc(t("claims")) + "</button>" +
      "<button data-a='export'>" + esc(t("exportImport")) + "</button>" +
      "<button data-a='offline'>" + esc(t("offline")) + "</button>" +
      "<div class='lang'>" + esc(t("language")) + ": " +
        "<button data-lang='en'" + (lang === "en" ? " class='on'" : "") + ">English</button>" +
        "<button data-lang='de'" + (lang === "de" ? " class='on'" : "") + ">Deutsch</button></div>" +
      "<button data-a='about'>" + esc(t("about")) + "</button>" +
      "</div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.lang) { setPref("lang", b.dataset.lang); location.reload(); return; }
      if (b.dataset.a === "points") Points.openList();
      if (b.dataset.a === "export") ExportImport.openPanel();
      if (b.dataset.a === "offline") Offline.openPanel();
      if (b.dataset.a === "about") openAbout();
      if (b.dataset.a === "account") Auth.openAccount();
      if (b.dataset.a === "claims") Claims.openList();
    });
    openSheet(t("menu"), body);
  }

  function openAbout() {
    var items = C.basemaps.concat(C.overlays).filter(function (x) { return x.attribution; })
      .map(function (x) { return "<li><b>" + esc(tr(x.name)) + "</b><br>" + esc(x.attribution) + "</li>"; }).join("");
    openSheet(t("about"), el("<div class='about'><p><b>" + esc(C.clubName) + "</b> · v" + esc(C.appVersion) + "</p><ul>" + items +
      "<li>Geology info: Macrostrat API (CC-BY 4.0)</li></ul><p class='hint'>" + esc(t("claimApprox")) + "</p></div>"));
  }

  // Lange drücken (Handy) oder Rechtsklick (Computer) = neuen Punkt an dieser Stelle setzen
  function setupLongPress() {
    var timer = null, start = null, last = 0;
    function fire(latlng) {
      if (Date.now() - last < 1000) return;
      last = Date.now();
      Points.openEditor(null, { lat: latlng.lat, lon: latlng.lng });
    }
    var box = map.getContainer();
    box.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { clearTimeout(timer); return; }
      var touch = e.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
      clearTimeout(timer);
      timer = setTimeout(function () { fire(map.mouseEventToLatLng(touch)); }, 650);
    }, { passive: true });
    box.addEventListener("touchmove", function (e) {
      var touch = e.touches[0];
      if (!start || Math.abs(touch.clientX - start.x) > 10 || Math.abs(touch.clientY - start.y) > 10) clearTimeout(timer);
    }, { passive: true });
    box.addEventListener("touchend", function () { clearTimeout(timer); });
    map.on("contextmenu", function (e) { fire(e.latlng); });
  }

  // ---------- Start ----------

  var savedOverlays = pref("overlays", {});
  var savedOpacity = pref("opacity", {});

  function init() {
    document.title = C.clubName;
    document.getElementById("app-title").textContent = C.clubName;
    ["layers", "gps", "addPoint", "points", "menu"].forEach(function (k) {
      var b = document.querySelector("[data-label='" + k + "']");
      if (b) { b.title = t(k); b.setAttribute("aria-label", t(k)); }
    });
    document.querySelector("#sheet .sheet-close").textContent = "✕";

    var view = pref("view", null);
    var club = Auth.account && Auth.account.clubs.filter(function (c) { return c.start_lat != null; })[0];
    if (!view && club) view = { lat: club.start_lat, lon: club.start_lon, zoom: club.start_zoom || C.start.zoom };
    map = L.map("map", {
      zoomControl: false,
      preferCanvas: true
    }).setView(view ? [view.lat, view.lon] : [C.start.lat, C.start.lon], view ? view.zoom : C.start.zoom);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(map);

    var baseId = pref("base", null) || (C.basemaps.filter(function (b) { return b.default; })[0] || C.basemaps[0]).id;
    setBase(baseId);

    C.overlays.forEach(function (o) {
      if (savedOpacity[o.id] != null) o.opacity = savedOpacity[o.id];
      var on = savedOverlays[o.id] != null ? savedOverlays[o.id] : !!o.visible;
      if (on) setOverlay(o.id, true); else overlayState[o.id] = false;
    });

    map.on("moveend", function () {
      var c = map.getCenter();
      setPref("view", { lat: c.lat, lon: c.lng, zoom: map.getZoom() });
      Object.keys(overlayObjs).forEach(function (id) {
        if (overlayState[id] && overlayObjs[id]._gcUpdate) overlayObjs[id]._gcUpdate();
      });
    });
    map.on("click", onMapClick);
    setupLongPress();

    document.getElementById("btn-layers").onclick = openLayersPanel;
    document.getElementById("btn-gps").onclick = function () { startGps(true); };
    document.getElementById("btn-add").onclick = function () { Points.openEditor(null, null); };
    document.getElementById("btn-list").onclick = function () { Points.openList(); };
    document.getElementById("btn-menu").onclick = openMenu;
    document.querySelector("#sheet .sheet-close").onclick = closeSheet;

    function onlineState() { document.body.classList.toggle("is-offline", !navigator.onLine); if (!navigator.onLine) toast(t("offlineNow")); }
    window.addEventListener("online", onlineState);
    window.addEventListener("offline", onlineState);
    onlineState();

    Store.requestPersistence();
    Points.init(map);
    if (pointsVisible) Points.layer.addTo(map);
    Claims.init(map);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("SW", e); });
    }
    startGps(false);
  }

  return {
    init: init, t: t, tr: tr, esc: esc, el: el, toast: toast, formatCoord: formatCoord,
    openSheet: openSheet, closeSheet: closeSheet, onSheetClose: onSheetClose, pref: pref, setPref: setPref,
    get map() { return map; }, get gps() { return gps.last; }, get lang() { return lang; },
    tileRange: tileRange, cellsFor: cellsFor, fetchCell: fetchCell,
    TILE_CACHE: TILE_CACHE, DATA_CACHE: DATA_CACHE, CELL_Z: CELL_Z
  };
})();

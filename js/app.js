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

  // Entfernung in Metern und Himmelsrichtung zwischen zwei Punkten
  function distance(lat1, lon1, lat2, lon2) {
    var r = Math.PI / 180, a = Math.sin((lat2 - lat1) * r / 2), b = Math.sin((lon2 - lon1) * r / 2);
    var h = a * a + Math.cos(lat1 * r) * Math.cos(lat2 * r) * b * b;
    return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function direction(lat1, lon1, lat2, lon2) {
    var r = Math.PI / 180;
    var y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
    var x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
    var deg = (Math.atan2(y, x) / r + 360) % 360;
    return t("dirs").split(",")[Math.round(deg / 45) % 8];
  }
  function formatDistance(m) {
    if (m < 1000) return Math.round(m) + " m (" + Math.round(m * 3.28084) + " ft)";
    return (m / 1000).toFixed(m < 10000 ? 2 : 1) + " km (" + (m / 1609.34).toFixed(m < 16000 ? 2 : 1) + " mi)";
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

  function cellsFor(bounds, z) {
    var r = tileRange(bounds, z || CELL_Z), out = [];
    for (var x = r.x0; x <= r.x1; x++) for (var y = r.y0; y <= r.y1; y++) out.push({ x: x, y: y });
    return out;
  }

  function cellBox(x, y, z) {
    z = z || CELL_Z;
    return {
      w: x2lon(x, z).toFixed(6), e: x2lon(x + 1, z).toFixed(6),
      n: y2lat(y, z).toFixed(6), s: y2lat(y + 1, z).toFixed(6)
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

  // ---------- Daten laden: Schutzgebiete (Flächen von einem ArcGIS-Server) ----------

  // Für Server ohne CORS (z. B. Neuseeland): Daten per JSONP holen (ArcGIS kennt den Parameter callback)
  var jsonpCount = 0;
  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var name = "__gcJsonp" + (++jsonpCount), sc = document.createElement("script");
      var timer = setTimeout(function () { done(); reject(new Error("timeout")); }, 20000);
      function done() { clearTimeout(timer); delete window[name]; sc.remove(); }
      window[name] = function (data) { done(); resolve(data); };
      sc.onerror = function () { done(); reject(new Error("load")); };
      sc.src = url + "&callback=" + name;
      document.head.appendChild(sc);
    });
  }
  // ArcGIS-JSON (rings) in GeoJSON umwandeln
  function esriToGeoJSON(data) {
    return (data.features || []).filter(function (f) { return f.geometry && f.geometry.rings; }).map(function (f) {
      return { type: "Feature", properties: f.attributes, geometry: { type: "Polygon", coordinates: f.geometry.rings } };
    });
  }

  function fetchAreaCell(cfg, x, y) {
    var b = cellBox(x, y, cfg.cellZ), all = [];
    if (cfg.jsonp) {
      var pageJ = function (offset) {
        var url = cfg.url + "?where=" + encodeURIComponent(cfg.where || "1=1") +
          "&geometry=" + b.w + "," + b.s + "," + b.e + "," + b.n +
          "&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326" +
          "&outFields=" + encodeURIComponent(cfg.outFields || "*") + "&maxAllowableOffset=" + (cfg.simplify || 0.0005) +
          "&geometryPrecision=5&resultOffset=" + offset + "&f=json";
        return jsonp(url).then(function (data) {
          if (data.error) throw new Error(data.error.message || "server");
          var feats = esriToGeoJSON(data);
          all = all.concat(feats);
          if (data.exceededTransferLimit && feats.length && offset < 10000) return pageJ(offset + feats.length);
          return all;
        });
      };
      return pageJ(0);
    }
    function page(offset) {
      var url = cfg.url + "?where=" + encodeURIComponent(cfg.where || "1=1") +
        "&geometry=" + b.w + "," + b.s + "," + b.e + "," + b.n +
        "&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326" +
        "&outFields=" + (cfg.outFields || "OBJECTID,Unit_Nm,Des_Tp,Mang_Name,GAP_Sts") + "&maxAllowableOffset=" + (cfg.simplify || 0.0005) +
        "&geometryPrecision=5&orderByFields=OBJECTID&resultOffset=" + offset + "&f=geojson";
      return cachedFetch(url, "json").then(function (data) {
        var feats = data.features || [];
        all = all.concat(feats);
        var more = data.exceededTransferLimit || (data.properties && data.properties.exceededTransferLimit);
        if (more && feats.length && offset < 10000) return page(offset + feats.length);
        return all;
      });
    }
    return page(0);
  }

  // Wird auch vom Offline-Modus benutzt
  function fetchCell(cfg, x, y) {
    if (cfg.type === "blmClaims") return fetchBlmCell(cfg, x, y);
    if (cfg.type === "wfsPoints") return fetchWfsCell(cfg, x, y);
    if (cfg.type === "areaPolygons") return fetchAreaCell(cfg, x, y);
    return Promise.resolve([]);
  }

  // ---------- Karte ----------

  var map, currentBase = null, baseLayers = {}, overlayState = {}, overlayObjs = {};
  var hitFeatures = {};          // Ebenen-ID -> Flächen, die beim Antippen gefunden werden (BLM, Schutzgebiete)
  var clubFiles = [];            // [{ clubId, club, name, layer, features }]

  // ---------- Club-Umschalter ----------

  function myClubs() { return Auth.enabled() && Auth.account ? Auth.account.clubs : []; }
  function activeClub() {
    var id = pref("activeClub", "all");
    return id !== "all" && myClubs().some(function (c) { return c.id === id; }) ? id : "all";
  }
  function clubVisible(clubId) {
    var a = activeClub();
    return !clubId || a === "all" || a === clubId;
  }
  function setActiveClub(id) {
    setPref("activeClub", id);
    applyClubFilter();
    Claims.redrawAll();
    updateTitle();
    updateClubDots();
  }
  function applyClubFilter() {
    var group = overlayObjs.club;
    clubFiles.forEach(function (f) {
      var show = clubVisible(f.clubId);
      if (group) { if (show) group.addLayer(f.layer); else group.removeLayer(f.layer); }
    });
  }
  // Farbe eines Clubs: aus config.js (clubColors nach Name), sonst fest aus der Palette
  function clubColor(clubId) {
    var club = myClubs().filter(function (c) { return c.id === clubId; })[0];
    if (club && C.clubColors && C.clubColors[club.name]) return C.clubColors[club.name];
    var pal = C.clubPalette || ["#18c018"], h = 0, key = String(clubId || "");
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return clubId ? pal[h % pal.length] : (overlayCfg("club") || {}).color || "#18c018";
  }

  // Knopf "Hinführen": öffnet die Navigation (Apple Karten) zu dieser Stelle
  function navLink(lat, lon) {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return "";
    return "<div class='pop-actions'><a class='btn-like nav-btn' target='_blank' rel='noopener' href='" +
      esc(C.parking.navigateUrl.replace("{lat}", (+lat).toFixed(6)).replace("{lon}", (+lon).toFixed(6))) + "'>➜ " + esc(t("navigate")) + "</a></div>";
  }

  // ---------- Sammelpunkte: beim Herauszoomen sieht man, wo Club-Claims liegen ----------

  var clubDots = L.layerGroup();
  function centerOf(f) {
    var g = f.geometry;
    if (!g) return null;
    if (g.type === "Point") return [g.coordinates[1], g.coordinates[0]];
    var b = L.geoJSON(f).getBounds();
    return b.isValid() ? [b.getCenter().lat, b.getCenter().lng] : null;
  }
  function updateClubDots() {
    clubDots.clearLayers();
    if (!map || !overlayState.club || map.getZoom() > (C.clubDotsMaxZoom || 13)) return;
    var items = [];
    clubFiles.forEach(function (file) {
      if (!clubVisible(file.clubId)) return;
      file.features.forEach(function (f) {
        if (f.geometry && f.geometry.type === "Point") return;   // Zusatzpunkte (Zufahrt, Basecamp) nicht mitzählen
        var c = centerOf(f);
        if (c) items.push({ ll: c, clubId: file.clubId, club: file.club });
      });
    });
    Claims.all().forEach(function (c) {
      if (c.deleted || c.visibility !== "club" || !clubVisible(c.clubId) || !(c.posts || []).length) return;
      var lat = 0, lon = 0;
      c.posts.forEach(function (p) { lat += p.lat; lon += p.lon; });
      var club = myClubs().filter(function (x) { return x.id === c.clubId; })[0];
      items.push({ ll: [lat / c.posts.length, lon / c.posts.length], clubId: c.clubId, club: club ? club.name : "" });
    });
    // pro Club in ein Raster von 60 Bildschirmpunkten zusammenfassen
    var cells = {};
    items.forEach(function (it) {
      var pt = map.project(it.ll);
      var key = it.clubId + ":" + Math.floor(pt.x / 60) + ":" + Math.floor(pt.y / 60);
      (cells[key] = cells[key] || { clubId: it.clubId, club: it.club, pts: [] }).pts.push(it.ll);
    });
    Object.keys(cells).forEach(function (k) {
      var cell = cells[k], n = cell.pts.length, lat = 0, lon = 0;
      cell.pts.forEach(function (p) { lat += p[0]; lon += p[1]; });
      var s = n > 9 ? 34 : 28;
      var m = L.marker([lat / n, lon / n], {
        icon: L.divIcon({ className: "club-dot-icon", iconSize: [s, s], iconAnchor: [s / 2, s / 2],
          html: "<div class='club-dot' style='background:" + esc(clubColor(cell.clubId)) + "'>" + n + "</div>" }),
        zIndexOffset: 800
      });
      m.bindTooltip(esc(cell.club) + " · " + n + " " + t("clubDotClaims") + " – " + t("clubDotHint"));
      m.on("click", function () {
        if (n === 1) map.setView(cell.pts[0], (C.clubDotsMaxZoom || 13) + 2);
        else map.fitBounds(cell.pts, { padding: [60, 60], maxZoom: (C.clubDotsMaxZoom || 13) + 2 });
      });
      clubDots.addLayer(m);
    });
  }

  function clubFeatures() {
    return clubFiles.filter(function (f) { return clubVisible(f.clubId); })
      .reduce(function (all, f) { return all.concat(f.features); }, []);
  }
  function updateTitle() {
    var a = activeClub(), club = myClubs().filter(function (c) { return c.id === a; })[0];
    document.getElementById("app-title").textContent = C.clubName + (club ? " · " + club.name : "");
  }

  function makeTileLayer(cfg, extra) {
    return L.tileLayer(cfg.url, Object.assign({
      attribution: cfg.attribution,
      maxNativeZoom: cfg.maxNativeZoom || 18,
      maxZoom: 20,
      crossOrigin: true,
      opacity: cfg.opacity == null ? 1 : cfg.opacity
    }, extra || {}));
  }

  // Kacheln, die ein ArcGIS-Bildserver für jeden Ausschnitt berechnet (z. B. LiDAR-Schummerung)
  var ExportImageLayer = L.TileLayer.extend({
    getTileUrl: function (coords) {
      var b = this._tileCoordsToBounds(coords);
      var sw = L.CRS.EPSG3857.project(b.getSouthWest()), ne = L.CRS.EPSG3857.project(b.getNorthEast());
      var mode = this.options.mode || {};
      var bbox = [sw.x, sw.y, ne.x, ne.y].map(function (v) { return v.toFixed(2); }).join(",");
      if (this.options.mapServer) {
        return this.options.baseUrl + "/export?bbox=" + bbox + "&bboxSR=3857&imageSR=3857&size=256,256&dpi=96&format=png32&transparent=true" +
          (this.options.show ? "&layers=show:" + this.options.show : "") + "&f=image";
      }
      var rule = mode.rule !== undefined ? mode.rule : mode.id;
      return (mode.url || this.options.baseUrl) + "?bbox=" + bbox +
        "&bboxSR=3857&imageSR=3857&size=256,256&format=" + (mode.format || "jpgpng") +
        (rule ? "&renderingRule=" + encodeURIComponent(JSON.stringify({ rasterFunction: rule })) : "") + "&f=image";
    }
  });
  // gewählte Ansicht einer Ebene mit mehreren Darstellungen (modes in config.js)
  function lidarMode(cfg) {
    var id = pref("mode." + cfg.id, null);
    return cfg.modes.filter(function (m) { return m.id === id; })[0] || cfg.modes[0];
  }

  // Ebene, die Daten zellenweise beim Verschieben der Karte nachlädt
  function makeCellLayer(cfg, render) {
    var group = L.featureGroup();
    var loaded = {}, seen = {};
    var pending = 0, failed = 0;
    function update() {
      if (!map.hasLayer(group)) return;
      if (map.getZoom() < cfg.minZoom) { setLayerNote(cfg.id, t("zoomInFor") + " (≥ " + cfg.minZoom + ")"); return; }
      if (pending === 0) setLayerNote(cfg.id, "");
      var cells = cellsFor(map.getBounds(), cfg.cellZ);
      if (cells.length > 40) { setLayerNote(cfg.id, t("zoomInMore")); return; }
      cells.forEach(function (c) {
        var key = c.x + "/" + c.y;
        if (loaded[key]) return;
        loaded[key] = true;
        pending++;
        setLayerNote(cfg.id, t("loading"));
        fetchCell(cfg, c.x, c.y).then(function (items) {
          items.forEach(function (it) {
            var id = it.properties ? (it.properties.CSE_NR || it.properties.OBJECTID || it.id) : it.props._id;
            if (id && seen[id]) return;
            if (id) seen[id] = true;
            render(group, it);
          });
        }).catch(function () {
          // Server hatte einen Aussetzer: Bereich später nochmals versuchen
          loaded[key] = false;
          failed++;
          setTimeout(update, 8000);
        }).then(function () {
          pending--;
          if (pending === 0) { setLayerNote(cfg.id, failed ? t("loadError") : ""); failed = 0; }
        });
      });
    }
    group.on("add", function () { setTimeout(update, 0); });
    group._gcUpdate = update;
    return group;
  }

  function buildOverlay(cfg) {
    if (cfg.type === "tiles") return makeTileLayer(cfg, { zIndex: 10 });
    if (cfg.type === "arcgisExport") {
      return new ExportImageLayer("", { mapServer: true, baseUrl: cfg.url, show: cfg.show, attribution: cfg.attribution, maxZoom: 20,
        crossOrigin: true, zIndex: 10, opacity: savedOpacity[cfg.id] != null ? savedOpacity[cfg.id] : cfg.opacity });
    }
    if (cfg.type === "wms" && cfg.points) {
      var wmsLayer = L.tileLayer.wms(cfg.url, { layers: cfg.layers, format: "image/png", transparent: true, version: "1.3.0",
        attribution: cfg.attribution, maxZoom: 20, zIndex: 10 });
      var pts = L.featureGroup(), grp = L.featureGroup([wmsLayer, pts]);
      // gut sichtbare Punkte (z. B. Gold) zusätzlich zum Kartenbild
      cachedFetch(cfg.points.url, "json").then(function (d) {
        (d.results || []).forEach(function (f) {
          if (!f.geometry || f.geometry.type !== "Point") return;
          var a = f.properties || f.attributes || {}, c = f.geometry.coordinates;
          var m = L.circleMarker([c[1], c[0]], { radius: cfg.points.radius || 8, color: "#000", weight: 1.5,
            fillColor: cfg.points.color || "#ffd700", fillOpacity: 1, bubblingMouseEvents: false });
          m.bindPopup("<div class='pop'><div class='pop-sec'><h3>" + esc(a.label || a.obname || "") + "</h3><div class='pop-sub'>" + esc(tr(cfg.name)) +
            "</div><table>" + row(t("commodities"), a.grkind_de || a.grkind_en) + "</table>" +
            (a.purl ? "<a href='" + esc(a.purl) + "' target='_blank' rel='noopener'>" + esc(tr(cfg.points.linkText)) + " ↗</a>" : "") +
            navLink(c[1], c[0]) + "</div></div>", { maxWidth: 280 });
          pts.addLayer(m);
        });
      }).catch(function () { setLayerNote(cfg.id, t("loadError")); });
      return grp;
    }
    if (cfg.type === "wms") {
      return L.tileLayer.wms(cfg.url, { layers: cfg.modes ? lidarMode(cfg).layers : cfg.layers, format: "image/png", transparent: true, version: "1.3.0",
        attribution: cfg.attribution, maxZoom: 20, zIndex: 10, opacity: savedOpacity[cfg.id] != null ? savedOpacity[cfg.id] : cfg.opacity });
    }
    if (cfg.type === "exportImage") {
      return new ExportImageLayer("", { baseUrl: cfg.url, mode: cfg.modes ? lidarMode(cfg) : { rule: "" }, attribution: cfg.attribution, maxZoom: 20, maxNativeZoom: 18,
        crossOrigin: true, zIndex: 9, opacity: savedOpacity[cfg.id] != null ? savedOpacity[cfg.id] : cfg.opacity });
    }
    if (cfg.type === "userClaims") return Claims.layer;

    if (cfg.type === "blmClaims") {
      hitFeatures[cfg.id] = [];
      var onlyRecent = cfg.recentFilter && pref("blmFilter." + cfg.id, "all") === "recent";
      return makeCellLayer(cfg, function (group, f) {
        if (onlyRecent && !BlmWatch.isRecent(f.properties.CSE_NR, cfg.recentFilter, f.properties.LOC_DT)) return;
        var layer = L.geoJSON(f, {
          interactive: false,
          style: { color: cfg.color, weight: 2, dashArray: cfg.dashArray || null, fillColor: cfg.color, fillOpacity: cfg.fillOpacity }
        });
        group.addLayer(layer);
        hitFeatures[cfg.id].push(f);
      });
    }

    if (cfg.type === "areaPolygons") {
      hitFeatures[cfg.id] = [];
      var renderArea = function (group, f) {
        var col = cfg.color || (areaClass(cfg, f.properties) === "closed" ? cfg.closedColor : cfg.limitedColor);
        group.addLayer(L.geoJSON(f, {
          renderer: cfg._renderer,       // eigene Zeichenfläche (SVG) für Ebenen aus Dateien – zuverlässiger auf dem iPhone
          interactive: false,
          style: { color: col, weight: 2, fillColor: col, fillOpacity: cfg.fillOpacity || 0.18 }
        }));
        // kleine Flächen (z. B. Fossicking-Gebiete) zusätzlich als Punkt, damit man sie auch weit herausgezoomt findet
        if (cfg.centerDot) {
          var c = centerOf(f);
          if (c) {
            var dot = L.circleMarker(c, { renderer: cfg._renderer, radius: 7, color: "#000", weight: 1, fillColor: col, fillOpacity: 1, bubblingMouseEvents: false });
            dot.on("click", function () { onMapClick({ latlng: L.latLng(c[0], c[1]), forceHit: f }); });
            group.addLayer(dot);
          }
        }
        hitFeatures[cfg.id].push(f);
      };
      if (cfg.file) {
        cfg._renderer = L.svg({ padding: 0.3 });
        var fg = L.featureGroup();
        cfg._fg = fg;
        setLayerNote(cfg.id, t("loading"));
        Promise.all([cachedFetch(cfg.file, "json"), cfg.metaFile ? cachedFetch(cfg.metaFile, "json").catch(function () { return {}; }) : {}])
          .then(function (r) {
            cfg._updated = r[1] && r[1].updated;
            var feats = r[0].features || [];
            feats.forEach(function (f) { renderArea(fg, f); });
            cfg._note = "✓ " + feats.length + (cfg._updated ? " · " + t("dataDate") + " " + cfg._updated : "");
            setLayerNote(cfg.id, cfg._note);
          }).catch(function (err) { cfg._note = t("loadError") + " (" + (err && err.message || err) + ")"; setLayerNote(cfg.id, cfg._note); });
        return fg;
      }
      return makeCellLayer(cfg, renderArea);
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
      var addGeoJSON = function (gj, file) {
        var features = [];
        var col = file.clubId ? clubColor(file.clubId) : cfg.color;
        var layer = L.geoJSON(gj, {
          style: { color: col, weight: 2, fillColor: col, fillOpacity: cfg.fillOpacity },
          interactive: false,
          pointToLayer: function (f, ll) {
            return L.circleMarker(ll, { radius: 6, color: "#000", weight: 1, fillColor: col, fillOpacity: 1, interactive: false });
          },
          onEachFeature: function (f) {
            f.properties = f.properties || {};
            if (file.club) f.properties._club = file.club;
            features.push(f);
          }
        });
        var entry = { clubId: file.clubId || null, club: file.club || "", name: file.name || "", layer: layer, features: features };
        clubFiles.push(entry);
        if (clubVisible(entry.clubId)) group.addLayer(layer);
      };
      if (Auth.enabled()) {
        // Mit Login: Club-Claims kommen vom Server, nur für Mitglieder
        Auth.clubFiles().then(function (files) {
          files.forEach(function (f) { addGeoJSON(f.geojson, f); });
          updateClubDots();
        });
        return group;
      }
      (cfg.files || []).forEach(function (path) {
        fetch(path).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        }).then(function (txt) {
          addGeoJSON(/\.kml$/i.test(path) ? Formats.kmlToGeoJSON(txt) : JSON.parse(txt), { name: path.split("/").pop() });
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
    if (g.type === "Point") {
      // Punkt gilt als getroffen, wenn man ihn auf ca. 20 Bildschirmpunkte genau antippt
      var mpp = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, map.getZoom());
      return distance(lat, lon, g.coordinates[1], g.coordinates[0]) < 20 * mpp;
    }
    return false;
  }

  function claimHtml(f, cfg) {
    var a = f.properties;
    var active = a.CSE_DISP === "Active";
    var date = a.LOC_DT ? new Date(a.LOC_DT).toISOString().slice(0, 10) : "";
    var link = a.SF_ID ? cfg.detailsLink.replace("{SF_ID}", encodeURIComponent(a.SF_ID)) : "";
    return "<div class='pop-sec claim' style='border-left-color:" + esc(cfg.color) + "'><h3>" + esc(a.CSE_NAME || a.CSE_NR) + "</h3>" +
      "<div class='pop-sub'>" + esc(t("claim")) + " · " + esc(a.CSE_DISP || "") + "</div><table>" +
      row(t("serial"), a.CSE_NR) + row(t("legacySerial"), a.LEG_CSE_NR) + row(t("status"), a.CSE_DISP) +
      row(t("claimType"), a.BLM_PROD) + row(t("acres"), a.RCRD_ACRS) + row("Location date", date) + "</table>" +
      (link ? "<a href='" + esc(link) + "' target='_blank' rel='noopener'>" + esc(t("ownerLink")) + " ↗</a>" : "") +
      (active ? "" : "<p class='hint'>" + esc(t("closedClaimHint")) + "</p>") +
      (function () { var c = centerOf(f); return c ? navLink(c[0], c[1]) : ""; })() +
      "<p class='hint'>" + esc(t("claimApprox")) + "</p>" +
      (active ? "<button class='mini-btn' data-newclaim='" + esc(JSON.stringify({ serial: a.CSE_NR, name: a.CSE_NAME || "", folder: "foreign",
        kind: /placer/i.test(a.BLM_PROD) ? "placer" : /mill/i.test(a.BLM_PROD) ? "millsite" : /lode/i.test(a.BLM_PROD) ? "lode" : "other" })) + "'>" +
        esc(t("fromBlm")) + "</button>" : "") + "</div>";
  }

  // Schutzgebiete: "closed" = meist verboten, sonst eingeschränkt
  function areaClass(cfg, p) {
    if ((cfg.closedManagers || []).indexOf(p.Mang_Name) >= 0) return "closed";
    if ((cfg.closedDesignations || []).indexOf(p.Des_Tp) >= 0) return "closed";
    return p.GAP_Sts === "1" ? "closed" : "limited";
  }
  function landName(code) { return C.landNames[code] ? tr(C.landNames[code]) : (code || ""); }

  function areaHtml(f, cfg) {
    var p = f.properties, closed = areaClass(cfg, p) === "closed";
    return "<div class='pop-sec' style='border-left:4px solid " + esc(closed ? cfg.closedColor : cfg.limitedColor) + ";padding-left:8px'>" +
      "<h3>" + esc(p.Unit_Nm || t("protectedArea")) + "</h3><div class='pop-sub'>" + esc(t("protectedArea")) + "</div>" +
      "<p class='verdict " + (closed ? "closed" : "limited") + "'>" + esc(closed ? t("levelClosed") : t("levelLimited")) + "</p><table>" +
      row(t("designation"), landName(p.Des_Tp)) + row(t("manager"), landName(p.Mang_Name)) + "</table>" +
      "<p class='hint'>" + esc(t("landHint")) + "</p></div>";
  }

  // Popup für Flächen mit eigener Beschreibung in config.js (popup: title, level, verdict, fields, link)
  function infoAreaHtml(f, cfg) {
    var p = f.properties || {}, pc = cfg.popup;
    var lvl = typeof pc.level === "function" ? pc.level(p) : pc.level;
    var fill = function (tpl) { return String(tpl).replace(/\{(\w+)\}/g, function (m, k) { return p[k] == null ? "" : encodeURIComponent(p[k]); }); };
    var val = function (fd) {
      var v = p[fd.field];
      if (v == null || v === "") return "";
      if (fd.date) return new Date(v).toISOString().slice(0, 10);
      return String(v) + (fd.unit ? " " + fd.unit : "");
    };
    return "<div class='pop-sec' style='border-left:4px solid " + esc(cfg.color) + ";padding-left:8px'>" +
      "<h3>" + esc(p[pc.title] || tr(cfg.name)) + "</h3><div class='pop-sub'>" + esc(tr(cfg.name)) + "</div>" +
      (pc.verdict ? "<p class='verdict " + esc(lvl || "limited") + "'>" + esc(tr(pc.verdict)) + "</p>" : "") +
      "<table>" + (pc.fields || []).map(function (fd) { return row(tr(fd.label), val(fd)); }).join("") + "</table>" +
      (pc.link ? "<a href='" + esc(fill(pc.link.url)) + "' target='_blank' rel='noopener'>" + esc(tr(pc.link.text)) + " ↗</a>" : "") +
      (function () { var c = centerOf(f); return c ? navLink(c[0], c[1]) : ""; })() +
      "<p class='hint'>" + esc(tr(pc.hint || { en: t("landHint"), de: t("landHint") })) +
      (cfg._updated ? " " + esc(t("dataDate")) + ": " + esc(cfg._updated) : "") + "</p></div>";
  }

  // Ergebnis einer ArcGIS-MapServer-Abfrage (z. B. GNS Neuseeland)
  function arcIdentifyHtml(cfg, results) {
    var ai = cfg.arcIdentify, skip = /^(OBJECTID|Shape|SHAPE.*|FID|EAST_|NORTH_|.*_NZTM|ACN|RL_DEM.*|Literature references)$/i;
    return results.slice(0, ai.max || 3).map(function (res) {
      var a = res.attributes || {};
      var title = (ai.title && a[ai.title]) || a.Name || a.NAME || a.name || res.layerName;
      var rows = ai.fields ? ai.fields.map(function (fd) { return row(tr(fd.label), a[fd.field]); }).join("")
        : Object.keys(a).filter(function (k) { return !skip.test(k) && a[k] !== "" && a[k] !== "Null" && a[k] != null && k !== ai.title; })
          .slice(0, 8).map(function (k) { return row(k, a[k]); }).join("");
      return "<div class='pop-sec' style='border-left:4px solid #888;padding-left:8px'><h3>" + esc(title) + "</h3>" +
        "<div class='pop-sub'>" + esc(res.layerName || tr(cfg.name)) + "</div><table>" + rows + "</table></div>";
    }).join("");
  }

  // Ergebnis einer geo.admin-Abfrage (Schweiz) als Popup-Abschnitt
  function identifyHtml(cfg, results) {
    var id = cfg.identify;
    if (!results.length) return "";
    if (id.cantonRules) {
      var a = results[0].attributes || {}, r = (C.chCantonRules || {})[a.ak];
      if (!r) return "";
      var closed = /verboten/i.test(r.rule) ? "closed" : /bewilligungspflichtig/i.test(r.rule) && !/ohne bewilligung/i.test(r.rule) ? "limited" : "open";
      return "<div class='pop-sec' style='border-left:4px solid #888;padding-left:8px'><h3>" + esc(t("cantonRules")) + " · " + esc(a.name || a.ak) + "</h3>" +
        "<p class='verdict " + closed + "'>" + esc(r.rule) + "</p>" +
        (r.closed ? "<table>" + row(t("fishClosed"), r.closed) + "</table>" : "") +
        "<div class='src'>" + esc(t("rulesSource")) + ": " + esc(C.chCantonRules.source) + "</div>" +
        "<a href='" + esc(C.chCantonRules.link) + "' target='_blank' rel='noopener'>" + esc(t("moreInfo").replace(/\s*\(.*\)/, "")) + " ↗</a>" +
        "<p class='hint'>" + esc(t("landHint")) + "</p></div>";
    }
    return results.slice(0, 5).map(function (res) {
      var a = res.attributes || {};
      return "<div class='pop-sec' style='border-left:4px solid #888;padding-left:8px'><h3>" + esc(a[id.title] || a.name || a.label || res.layerName || "") + "</h3>" +
        "<div class='pop-sub'>" + esc(id.subField ? res[id.subField] : tr(id.sub)) + "</div>" +
        (id.verdict ? "<p class='verdict " + esc(id.level || "limited") + "'>" + esc(tr(id.verdict)) + "</p>" : "") +
        "<table>" + (id.fields || []).map(function (fd) { return row(tr(fd.label), a[fd.field]); }).join("") + "</table>" +
        (id.link && a[id.link.field] && a[id.link.field] !== "-" ? "<a href='" + esc(a[id.link.field]) + "' target='_blank' rel='noopener'>" + esc(tr(id.link.text)) + " ↗</a>" : "") +
        "</div>";
    }).join("");
  }

  function landHtml(attrs) {
    if (!attrs) return "<div class='pop-sec'><p class='hint'>" + esc(t("landUnknown")) + "</p></div>";
    var code = attrs.ADMIN_AGENCY_CODE, info = C.landAgencies[code] || C.landAgencies[attrs.ADMIN_DEPT_CODE];
    var level = info ? info.level : "limited";
    var name = info ? tr(info.name) : (attrs.ADMIN_UNIT_NAME || code);
    return "<div class='pop-sec land'><h3>" + esc(name) + "</h3><div class='pop-sub'>" + esc(t("landManager")) + "</div>" +
      "<p class='verdict " + level + "'>" + esc(t(level === "open" ? "levelOpen" : level === "closed" ? "levelClosed" : "levelLimited")) + "</p>" +
      (info ? "<p>" + esc(tr(info.rule)) + "</p>" : "") +
      (attrs.ADMIN_UNIT_NAME && info ? "<div class='src'>" + esc(attrs.ADMIN_UNIT_NAME) + "</div>" : "") +
      "<p class='hint'>" + esc(t("landHint")) + "</p></div>";
  }

  function clubHtml(f) {
    var p = f.properties || {};
    var long = p.description && p.description.length > 400;
    var isInfo = f.geometry && f.geometry.type === "Point";
    return "<div class='pop-sec club'><h3>" + esc(p.name || t("clubClaim")) + "</h3><div class='pop-sub'>" + esc(isInfo ? t("club") : t("clubClaim")) +
      (p._club ? " · " + esc(p._club) : "") + "</div>" +
      (p.description ? (long ? "<details><summary>" + esc(p.description.slice(0, 160)) + "…</summary><p class='note-text'>" + esc(p.description) + "</p></details>"
        : "<p class='note-text'>" + esc(p.description) + "</p>") : "") +
      (p.url ? "<a href='" + esc(p.url) + "' target='_blank' rel='noopener'>" + esc(t("moreInfo").replace(/\s*\(.*\)/, "")) + " ↗</a>" : "") +
      // Zusatz für Infopunkte (z. B. Basecamp): Bild (Lageplan), Abschnitte zum Aufklappen, Links, Navigation
      (p.image ? "<a href='" + esc(p.image) + "' target='_blank' rel='noopener'><img class='pop-img' src='" + esc(p.image) + "' alt=''></a>" : "") +
      (p.sections || []).map(function (s) {
        return "<details><summary>" + esc(s.title) + "</summary><p class='note-text'>" + esc(s.text) + "</p></details>";
      }).join("") +
      (p.links || []).map(function (l) {
        return "<div><a href='" + esc(l.url) + "' target='_blank' rel='noopener'>" + esc(l.text) + " ↗</a></div>";
      }).join("") +
      (function () { var c = centerOf(f); return c ? navLink(c[0], c[1]) : ""; })() + "</div>";
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
    C.overlays.forEach(function (o) {
      if (!overlayState[o.id]) return;
      var hits = (hitFeatures[o.id] || []).filter(function (f) { return f === e.forceHit || hit(f, lon, lat); });
      if (o.type === "blmClaims") hits.forEach(function (f) { parts.push(claimHtml(f, o)); });
      if (o.type === "areaPolygons") hits.forEach(function (f) { parts.push(o.popup ? infoAreaHtml(f, o) : areaHtml(f, o)); });
      if (o.type === "file") clubFeatures().filter(function (f) { return hit(f, lon, lat); }).forEach(function (f) { parts.push(clubHtml(f)); });
      if (o.type === "userClaims") parts = parts.concat(Claims.hitHtml(lon, lat));
    });

    // Angaben, die erst vom Server geholt werden (Landbesitz, Geologie)
    var slow = [];
    var landCfg = C.overlays.filter(function (o) { return o.landInfoUrl && overlayState[o.id]; })[0];
    if (landCfg) {
      slow.push(cachedFetch(landCfg.landInfoUrl + "?geometry=" + lon.toFixed(5) + "," + lat.toFixed(5) +
        "&geometryType=esriGeometryPoint&inSR=4326&outFields=ADMIN_AGENCY_CODE,ADMIN_DEPT_CODE,ADMIN_UNIT_NAME&returnGeometry=false&f=json", "json")
        .then(function (res) { return landHtml(res.features && res.features[0] ? res.features[0].attributes : null); }));
    }
    if (C.overlays.some(function (o) { return o.geologyInfo && overlayState[o.id]; })) {
      var url = C.geologyInfoUrl + "?lat=" + lat.toFixed(5) + "&lng=" + lon.toFixed(5) + "&z=" + Math.min(map.getZoom(), 16);
      slow.push(cachedFetch(url, "json").then(function (res) { return geologyHtml(res.success.data); }, function (err) {
        err.geology = true; throw err;
      }));
    }

    C.overlays.forEach(function (o) {
      if (!o.arcIdentify || !overlayState[o.id]) return;
      var b = map.getBounds(), sz = map.getSize(), ai = o.arcIdentify;
      var url = o.url + "/identify?geometry=" + lon.toFixed(6) + "," + lat.toFixed(6) + "&geometryType=esriGeometryPoint&sr=4326" +
        "&layers=" + encodeURIComponent(ai.layers || "visible") + "&tolerance=" + (ai.tolerance || 0) +
        "&mapExtent=" + [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map(function (v) { return v.toFixed(5); }).join(",") +
        "&imageDisplay=" + sz.x + "," + sz.y + ",96&returnGeometry=false&f=json";
      slow.push(cachedFetch(url, "json").then(function (res) { return arcIdentifyHtml(o, res.results || []); }));
    });
    C.overlays.forEach(function (o) {
      var oid = o.modes && lidarMode(o).identify ? lidarMode(o).identify : o.identify;
      if (!oid || !overlayState[o.id]) return;
      o = Object.assign({}, o, { identify: oid });
      var b = map.getBounds(), sz = map.getSize();
      var url = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometry=" + lon.toFixed(6) + "," + lat.toFixed(6) +
        "&geometryType=esriGeometryPoint&sr=4326&imageDisplay=" + sz.x + "," + sz.y + ",96&mapExtent=" +
        [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map(function (v) { return v.toFixed(5); }).join(",") +
        "&tolerance=" + (o.identify.tolerance || 0) + "&layers=" + encodeURIComponent(o.identify.layers) +
        "&returnGeometry=false&lang=" + (lang === "de" ? "de" : "en");
      slow.push(cachedFetch(url, "json").then(function (res) { return identifyHtml(o, res.results || []); }));
    });

    var head = "<div class='pop'><div class='coords'>" + esc(formatCoord(lat, lon)) + "</div>";
    var results = slow.map(function () { return "<div class='pop-sec'><p class='hint'>" + esc(t("loading")) + "</p></div>"; });
    function render() { return head + parts.join("") + results.join("") + "</div>"; }
    var popup = L.popup({ maxWidth: 300, maxHeight: 360 }).setLatLng(e.latlng).setContent(render()).openOn(map);

    slow.forEach(function (p, i) {
      p.catch(function (err) {
        var msg = !navigator.onLine ? (err && err.geology ? t("geologyOffline") : t("offlineNow")) : t("loadError");
        return "<div class='pop-sec'><p class='hint'>" + esc(msg) + "</p></div>";
      }).then(function (html) {
        results[i] = html;
        popup.setContent(render());
      });
    });
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
    if (id === "club") updateClubDots();
    savedOverlays[id] = on;
    setPref("overlays", savedOverlays);
  }

  function rebuildOverlay(id, on) {
    if (overlayObjs[id]) { map.removeLayer(overlayObjs[id]); delete overlayObjs[id]; }
    setOverlay(id, on == null ? !!overlayState[id] : on);
  }
  // nach dem BLM-Vergleich: Ebenen mit Filter "nur neue/abgelaufene" neu zeichnen
  function refreshBlmFilters() {
    C.overlays.forEach(function (o) {
      if (o.recentFilter && overlayState[o.id] && pref("blmFilter." + o.id, "all") === "recent") rebuildOverlay(o.id);
    });
  }
  function showBlmLayer(id) {
    if (!overlayState[id]) setOverlay(id, true);
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

  function clubSelectHtml() {
    var clubs = myClubs();
    if (!clubs.length) return "";
    var a = activeClub();
    return "<label class='club-switch'>" + esc(t("activeClub")) + "<select data-club-switch>" +
      "<option value='all'>" + esc(t("allClubs")) + "</option>" + clubs.map(function (c) {
        return "<option value='" + esc(c.id) + "'" + (c.id === a ? " selected" : "") + ">" + esc(c.name) + "</option>";
      }).join("") + "</select></label>";
  }

  function openLayersPanel() {
    var baseId = pref("base", null);
    var html = "<div class='layers'>" + clubSelectHtml() + "<h4>" + esc(t("basemap")) + "</h4>";
    C.basemaps.forEach(function (b) {
      html += "<label class='opt'><input type='radio' name='base' value='" + esc(b.id) + "'" + (b.id === baseId ? " checked" : "") + "> " + esc(tr(b.name)) + "</label>";
    });
    html += "<h4>" + esc(t("overlays")) + "</h4>";
    var groups = C.overlayGroups || [{ id: "general", name: "" }];
    var openGroups = pref("layerGroupsOpen", {});
    var rows = {};
    C.overlays.filter(visibleInPanel).forEach(function (o) {
      var g = o.group || groups[0].id;
      rows[g] = rows[g] || [];
      rows[g].push(o);
    });
    groups.forEach(function (g) {
      var list = rows[g.id] || [];
      if (!list.length) return;
      var on = list.filter(function (o) { return overlayState[o.id]; }).length;
      var isOpen = openGroups[g.id] != null ? openGroups[g.id] : !!g.open;
      html += "<details class='layer-group' data-group='" + esc(g.id) + "'" + (isOpen ? " open" : "") + "><summary>" + esc(tr(g.name)) +
        " <small>" + (on ? on + " " + esc(t("layerGroupActive")) : "") + "</small></summary>";
      list.forEach(function (o) { html += overlayRowHtml(o); });
      html += "</details>";
    });
    function overlayRowHtml(o) {
      var html = "";
      html += "<div class='opt-row'><label class='opt'><input type='checkbox' value='" + esc(o.id) + "'" + (overlayState[o.id] ? " checked" : "") + "> " +
        (o.color ? "<span class='swatch' style='background:" + esc(o.color) + "'></span>" : "") + esc(tr(o.name)) + "</label>" +
        "<div class='note' data-note='" + esc(o.id) + "'>" + esc((o._note || "") + diagText(o)) + "</div>";
      if (o.recentFilter) {
        var fv = pref("blmFilter." + o.id, "all");
        html += "<label class='mode'><select data-blmfilter='" + esc(o.id) + "'>" +
          "<option value='all'" + (fv === "all" ? " selected" : "") + ">" + esc(t("blmFilterAll")) + "</option>" +
          "<option value='recent'" + (fv === "recent" ? " selected" : "") + ">" + esc(t(o.recentFilter === "new" ? "blmFilterNew" : "blmFilterClosed")) + "</option>" +
          "</select></label>";
      }
      if (o.modes) {
        var cur = lidarMode(o);
        html += "<label class='mode'>" + esc(t("lidarMode")) + " <select data-mode='" + esc(o.id) + "'>" + o.modes.map(function (m) {
          return "<option value='" + esc(m.id) + "'" + (m.id === cur.id ? " selected" : "") + ">" + esc(tr(m.name)) + "</option>";
        }).join("") + "</select></label>";
      }
      if (o.type === "file" && myClubs().length) {
        html += "<div class='legend'>" + myClubs().map(function (c) {
          return "<span><i style='background:" + esc(clubColor(c.id)) + "'></i>" + esc(c.name) + "</span>";
        }).join("") + "</div>";
      }
      if (o.type === "tiles" || o.type === "exportImage") {
        var op = savedOpacity[o.id] != null ? savedOpacity[o.id] : o.opacity;
        html += "<input class='opacity' type='range' min='0.1' max='1' step='0.1' data-op='" + esc(o.id) + "' value='" + op + "'>";
      }
      if (o.type === "wms" || o.type === "arcgisExport") {
        var op2 = savedOpacity[o.id] != null ? savedOpacity[o.id] : o.opacity;
        html += "<input class='opacity' type='range' min='0.1' max='1' step='0.1' data-op='" + esc(o.id) + "' value='" + op2 + "'>";
      }
      if (o.legend) {
        html += "<div class='legend'>" + o.legend.map(function (l) {
          return "<span><i style='background:" + esc(l.color) + "'></i>" + esc(tr(l.text)) + "</span>";
        }).join("") + "</div>";
      }
      html += "</div>";
      return html;
    }
    html += "<label class='opt'><input type='checkbox' value='__points'" + (pointsVisible ? " checked" : "") + "> " + esc(t("points")) + "</label>" +
      "<label class='opt'><input type='checkbox' value='__tracks'" + (Tracks.visible ? " checked" : "") + "> " + esc(t("tracks")) + "</label>" +
      "<p class='hint'>Version " + esc(C.appVersion) + " · " + esc((navigator.userAgent.match(/OS [\d_]+|Chrome\/\d+|Version\/[\d.]+/g) || []).join(" ")) +
      " · zoom " + map.getZoom() + "</p></div>";

    var body = el(html);
    // aufgeklappte Gruppen merken
    body.addEventListener("toggle", function (e) {
      var d = e.target;
      if (!d.dataset || !d.dataset.group) return;
      var og = pref("layerGroupsOpen", {});
      og[d.dataset.group] = d.open;
      setPref("layerGroupsOpen", og);
    }, true);
    body.addEventListener("change", function (e) {
      var inp = e.target;
      if (inp.hasAttribute("data-club-switch")) { setActiveClub(inp.value); return; }
      if (inp.dataset.blmfilter) {
        setPref("blmFilter." + inp.dataset.blmfilter, inp.value);
        rebuildOverlay(inp.dataset.blmfilter, true);
        var cb2 = body.querySelector("input[type=checkbox][value='" + inp.dataset.blmfilter + "']"); if (cb2) cb2.checked = true;
        return;
      }
      if (inp.dataset.mode) {
        var oc = overlayCfg(inp.dataset.mode);
        setPref("mode." + oc.id, inp.value);
        if (overlayObjs[oc.id]) {
          if (oc.type === "wms") overlayObjs[oc.id].setParams({ layers: lidarMode(oc).layers });
          else { overlayObjs[oc.id].options.mode = lidarMode(oc); overlayObjs[oc.id].redraw(); }
        }
        if (!overlayState[oc.id]) { setOverlay(oc.id, true); var cb = body.querySelector("input[type=checkbox][value='" + oc.id + "']"); if (cb) cb.checked = true; }
        return;
      }
      if (inp.value === "__tracks") { Tracks.setVisible(inp.checked); return; }
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
      "<button data-a='points'>📍 " + esc(t("points")) + "</button>" +
      "<button data-a='tracks'>〰 " + esc(t("tracks")) + "</button>" +
      "<button data-a='claims'>▣ " + esc(t("claims")) + "</button>" +
      (Auth.enabled() && Auth.account ? "<button data-a='blmchanges' class='badge-blm'>🔔 " + esc(t("blmChanges")) + "</button>" : "") +
      (Auth.enabled() && Auth.account && Auth.account.clubs.length ? "<button data-a='chat' class='badge-chat'>💬 " + esc(t("chat")) + "</button>" : "") +
      "<button data-a='parking'>🅿 " + esc(t("parking")) + "</button>" +
      "<button data-a='export'>⇅ " + esc(t("exportImport")) + "</button>" +
      "<button data-a='offline'>⬇ " + esc(t("offline")) + "</button>" +
      "<button data-a='help'>❓ " + esc(t("help")) + "</button>" +
      "<div class='lang'>" + esc(t("language")) + ": " +
        "<button data-lang='en'" + (lang === "en" ? " class='on'" : "") + ">English</button>" +
        "<button data-lang='de'" + (lang === "de" ? " class='on'" : "") + ">Deutsch</button></div>" +
      "<button data-a='about'>" + esc(t("about")) + "</button>" +
      "</div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.lang) { setPref("lang", b.dataset.lang); location.reload(); return; }
      if (b.dataset.a === "tracks") Tracks.openList();
      if (b.dataset.a === "parking") Parking.show();
      if (b.dataset.a === "help") Help.open();
      if (b.dataset.a === "points") Points.openList();
      if (b.dataset.a === "export") ExportImport.openPanel();
      if (b.dataset.a === "offline") Offline.openPanel();
      if (b.dataset.a === "about") openAbout();
      if (b.dataset.a === "account") Auth.openAccount();
      if (b.dataset.a === "claims") Claims.openList();
      if (b.dataset.a === "blmchanges") BlmWatch.open();
      if (b.dataset.a === "chat") Chat.open();
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
    updateTitle();
    ["layers", "gps", "addPoint", "track", "parking", "points", "menu"].forEach(function (k) {
      var b = document.querySelector("[data-label='" + k + "']");
      if (b) { b.title = t(k); b.setAttribute("aria-label", t(k)); }
    });
    document.querySelector("#sheet .sheet-close").textContent = "✕";

    var view = pref("view", null);
    // gespeicherte Position in die "echte" Welt zurückholen (Längengrad -180 … 180)
    if (view && view.lon != null) view.lon = ((view.lon + 180) % 360 + 360) % 360 - 180;
    var club = Auth.account && Auth.account.clubs.filter(function (c) { return c.start_lat != null; })[0];
    if (!view && club) view = { lat: club.start_lat, lon: club.start_lon, zoom: club.start_zoom || C.start.zoom };
    map = L.map("map", {
      zoomControl: false,
      preferCanvas: true,
      // Wer z. B. von Arizona nach Westen über den Pazifik nach Neuseeland schiebt, landet in einer "Kopie" der Welt
      // (Längengrad unter -180). Dort wären Flächen und Punkte unsichtbar – darum zurück in die echte Welt springen.
      worldCopyJump: true
    }).setView(view ? [view.lat, view.lon] : [C.start.lat, C.start.lon], view ? view.zoom : C.start.zoom);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(map);

    var baseId = pref("base", null) || (C.basemaps.filter(function (b) { return b.default; })[0] || C.basemaps[0]).id;
    setBase(baseId);
    clubDots.addTo(map);
    map.on("zoomend moveend", updateClubDots);

    C.overlays.forEach(function (o) {
      if (savedOpacity[o.id] != null) o.opacity = savedOpacity[o.id];
      var on = savedOverlays[o.id] != null ? savedOverlays[o.id] : !!o.visible;
      if (on) setOverlay(o.id, true); else overlayState[o.id] = false;
      // Club-Claims immer laden (auch ausgeblendet), damit die Claims-Liste sie zeigen kann
      if (o.type === "file" && !overlayObjs[o.id]) overlayObjs[o.id] = buildOverlay(o);
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
    Tracks.init(map);
    Parking.init(map);
    Sync.init();
    BlmWatch.init();
    Chat.init();
    setTimeout(updateClubDots, 3000);   // nachdem die Claims geladen sind

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("SW", e); });
      checkForUpdate();
    }
    startGps(false);
  }

  // Diagnose für Ebenen aus Dateien: ist die Ebene auf der Karte, wie viele Flächen liegen im Ausschnitt?
  function diagText(o) {
    if (!o._fg || !map) return "";
    var b = map.getBounds(), n = 0, all = 0;
    o._fg.eachLayer(function (l) {
      all++;
      var lb = l.getBounds ? l.getBounds() : l.getLatLng && L.latLngBounds([l.getLatLng(), l.getLatLng()]);
      if (lb && lb.isValid() && b.intersects(lb)) n++;
    });
    var svg = o._renderer && o._renderer._container;
    return " · map:" + (map.hasLayer(o._fg) ? "yes" : "NO") + " · view:" + n + "/" + all +
      " · svg:" + (svg ? (svg.getAttribute("width") || "?") + "x" + (svg.getAttribute("height") || "?") + (svg.parentNode ? "" : " (detached)") : "none");
  }

  var shownErrors = {};
  window.addEventListener("error", function (e) {
    var msg = (e && e.message) || "error";
    if (shownErrors[msg] || !document.getElementById("toast")) return;
    shownErrors[msg] = true;
    toast("⚠ " + msg.slice(0, 120));
  });

  // Gibt es auf dem Server eine neuere Version? Dann alten Speicher leeren und neu laden (höchstens einmal pro Sitzung)
  function checkForUpdate() {
    if (!navigator.onLine) return;
    fetch("config.js?check=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (txt) {
      var m = txt.match(/appVersion:\s*(\d+)/), latest = m ? parseInt(m[1], 10) : 0;
      if (latest <= C.appVersion) return;
      var key = "gc.updatedTo";
      try { if (sessionStorage.getItem(key) === String(latest)) return; sessionStorage.setItem(key, String(latest)); } catch (e) {}
      var clear = window.caches ? caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf("gc-app-") === 0; }).map(function (k) { return caches.delete(k); }));
      }) : Promise.resolve();
      clear.then(function () {
        return navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(function (regs) {
          return Promise.all(regs.map(function (r) { return r.update().catch(function () {}); }));
        }) : null;
      }).then(function () { toast(t("updating")); setTimeout(function () { location.reload(); }, 800); });
    }).catch(function () {});
  }

  return {
    init: init, clubColor: clubColor, updateClubDots: updateClubDots, navLink: navLink, refreshBlmFilters: refreshBlmFilters, showBlmLayer: showBlmLayer, t: t, tr: tr, esc: esc, el: el, toast: toast, formatCoord: formatCoord,
    openSheet: openSheet, closeSheet: closeSheet, onSheetClose: onSheetClose, pref: pref, setPref: setPref,
    get map() { return map; }, get gps() { return gps.last; }, get lang() { return lang; },
    startGps: startGps, distance: distance, direction: direction, formatDistance: formatDistance,
    activeClub: activeClub, clubVisible: clubVisible, setActiveClub: setActiveClub, clubSelectHtml: clubSelectHtml,
    clubFiles: function () { return clubFiles; },
    tileRange: tileRange, cellsFor: cellsFor, fetchCell: fetchCell,
    TILE_CACHE: TILE_CACHE, DATA_CACHE: DATA_CACHE, CELL_Z: CELL_Z
  };
})();

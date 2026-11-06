/*
 * Eigene Claims: Location Monument, Eck- und andere Pfosten, daraus gezeichnete Claim-Fläche.
 * Gespeichert auf dem Gerät; mit Server zusätzlich privat oder für den Club geteilt.
 */
var Claims = (function () {
  var C = APP_CONFIG;
  var cfg = C.overlays.filter(function (o) { return o.type === "userClaims"; })[0] || { privateColor: "#ff8c00", clubColor: "#00c8e0", postsMinZoom: 15 };
  var layer = L.featureGroup();
  var postsLayer = L.featureGroup();
  var cache = {};       // id -> Claim
  var shapes = {};      // id -> { all: [Layer], ring: [[lat, lon]] }
  var map = null;
  var syncing = false;

  var t = function (k) { return App.t(k); };
  var esc = function (s) { return App.esc(s); };

  // ---------- Hilfen ----------

  function myId() { return window.Auth && Auth.account ? Auth.account.id : null; }

  function isMine(c) {
    return !c.owner || !c.owner.userId || !myId() || c.owner.userId === myId();
  }
  function canEdit(c) {
    if (isMine(c)) return true;
    return c.visibility === "club" && Auth.account && Auth.account.clubs.some(function (cl) {
      return cl.id === c.clubId && cl.role === "admin";
    });
  }

  function postType(id) {
    return C.postTypes.filter(function (p) { return p.id === id; })[0] || C.postTypes[C.postTypes.length - 1];
  }

  function newClaim(fields) {
    var now = new Date().toISOString();
    return Object.assign({
      id: Store.uuid(), schema: 1,
      name: "", serial: "", kind: "lode", locationDate: "", note: "",
      visibility: "private", clubId: null,
      monument: null,        // { lat, lon, accuracy }
      posts: [],             // [{ id, type, lat, lon, accuracy }]
      photos: [],
      owner: { userId: myId(), name: window.Auth && Auth.account ? Auth.account.username : "" },
      createdAt: now, updatedAt: now, deleted: false,
      sync: { status: "local", syncedAt: null }
    }, fields || {});
  }

  // Grenzpfosten (ohne Zeugenpfosten) im Uhrzeigersinn um die Mitte sortiert
  function ring(c) {
    var pts = (c.posts || []).filter(function (p) { return p.type !== "witness"; });
    if (pts.length < 3) return null;
    var cy = 0, cx = 0;
    pts.forEach(function (p) { cy += p.lat; cx += p.lon; });
    cy /= pts.length; cx /= pts.length;
    var k = Math.cos(cy * Math.PI / 180);
    return pts.slice().sort(function (a, b) {
      return Math.atan2(a.lat - cy, (a.lon - cx) * k) - Math.atan2(b.lat - cy, (b.lon - cx) * k);
    }).map(function (p) { return [p.lat, p.lon]; });
  }

  function acres(r) {
    if (!r) return null;
    var lat0 = r[0][0] * Math.PI / 180, sum = 0;
    for (var i = 0; i < r.length; i++) {
      var a = r[i], b = r[(i + 1) % r.length];
      var x1 = a[1] * 111320 * Math.cos(lat0), y1 = a[0] * 110540;
      var x2 = b[1] * 111320 * Math.cos(lat0), y2 = b[0] * 110540;
      sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum) / 2 / 4046.86;
  }

  function inRing(lat, lon, r) {
    var inside = false;
    for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
      var yi = r[i][0], xi = r[i][1], yj = r[j][0], xj = r[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  function color(c) { return c.visibility === "club" ? cfg.clubColor : cfg.privateColor; }

  function visibilityText(c) {
    if (c.visibility !== "club") return t("onlyMe");
    var club = window.Auth && Auth.account && Auth.account.clubs.filter(function (cl) { return cl.id === c.clubId; })[0];
    return t("clubPrefix") + (club ? ": " + club.name : "");
  }

  function kindText(k) { return { lode: t("lode"), placer: t("placer"), millsite: t("millsite") }[k] || t("otherKind"); }

  function coordText(p) {
    return App.formatCoord(p.lat, p.lon) + (p.accuracy ? " ±" + Math.round(p.accuracy) + " m" : "");
  }

  // ---------- Karte ----------

  function boxIcon(text, col, big) {
    var s = big ? 30 : 22;
    return L.divIcon({
      className: "post-icon",
      html: "<div class='post" + (big ? " lm" : "") + "' style='border-color:" + esc(col) + "'>" + esc(text) + "</div>",
      iconSize: [s, s], iconAnchor: [s / 2, s / 2], popupAnchor: [0, -s / 2]
    });
  }

  function undraw(id) {
    if (!shapes[id]) return;
    shapes[id].all.forEach(function (l) { layer.removeLayer(l); postsLayer.removeLayer(l); });
    delete shapes[id];
  }

  function draw(c) {
    undraw(c.id);
    if (c.deleted) return;
    var col = color(c), r = ring(c), all = [];
    if (r) {
      var poly = L.polygon(r, { color: col, weight: 3, dashArray: "8 6", fillColor: col, fillOpacity: 0.12, interactive: false });
      layer.addLayer(poly); all.push(poly);
    }
    if (c.monument) {
      var m = L.marker([c.monument.lat, c.monument.lon], { icon: boxIcon("LM", col, true), zIndexOffset: 500 });
      m.bindPopup(function () { return popupHtml(cache[c.id], true); }, { maxWidth: 300 });
      m.on("popupopen", function (e) { fillPhotos(e.popup.getElement(), c.id); });
      layer.addLayer(m); all.push(m);
    }
    (c.posts || []).forEach(function (p) {
      var pt = postType(p.type);
      var mk = L.marker([p.lat, p.lon], { icon: boxIcon(pt.short, col, false) });
      mk.bindPopup("<div class='pop'><h3>" + esc(App.tr(pt.name)) + "</h3><div class='pop-sub'>" + esc(c.name || t("ownClaim")) + "</div>" +
        "<div class='coords'>" + esc(coordText(p)) + "<br>" + esc(Coords.utmText(p.lat, p.lon)) + "</div>" +
        (canEdit(c) ? "<div class='pop-actions'><button data-claim-edit='" + esc(c.id) + "'>" + esc(t("edit")) + "</button></div>" : "") + "</div>");
      postsLayer.addLayer(mk); all.push(mk);
    });
    shapes[c.id] = { all: all, ring: r };
  }

  function updatePostsVisibility() {
    if (!map) return;
    var show = map.getZoom() >= (cfg.postsMinZoom || 15);
    if (show && !layer.hasLayer(postsLayer)) layer.addLayer(postsLayer);
    if (!show && layer.hasLayer(postsLayer)) layer.removeLayer(postsLayer);
  }

  function popupHtml(c, withPhotos) {
    var r = ring(c), a = acres(r);
    return "<div class='pop'><div class='pop-sec own' style='border-left-color:" + esc(color(c)) + "'>" +
      "<h3>" + esc(c.name || t("ownClaim")) + "</h3>" +
      "<div class='pop-sub'>" + esc(t("ownClaim")) + " · " + esc(visibilityText(c)) + "</div><table>" +
      row(t("blmSerial"), c.serial) + row(t("claimKind"), kindText(c.kind)) + row(t("locationDate"), c.locationDate) +
      row(t("area"), a ? "≈ " + a.toFixed(2) + " " + t("acresShort") : "") +
      row(t("monument"), c.monument ? coordText(c.monument) : t("notSet")) +
      row(t("posts"), String((c.posts || []).length)) +
      row(t("createdBy"), c.owner && c.owner.name) + "</table>" +
      (c.note ? "<p class='note-text'>" + esc(c.note) + "</p>" : "") +
      (withPhotos ? "<div class='thumbs'></div>" : "") +
      (canEdit(c) ? "<div class='pop-actions'><button data-claim-edit='" + esc(c.id) + "'>" + esc(t("edit")) + "</button></div>"
        : "<p class='hint'>" + esc(t("readOnly")) + "</p>") +
      "</div></div>";
  }

  function row(label, value) {
    if (value == null || value === "") return "";
    return "<tr><th>" + esc(label) + "</th><td>" + esc(value) + "</td></tr>";
  }

  function fillPhotos(el, id) {
    var box = el && el.querySelector(".thumbs");
    if (box) Points.fillThumbs(box, cache[id].photos);
  }

  // Für das Antippen der Karte: Abschnitte für alle eigenen Claim-Flächen an dieser Stelle
  function hitHtml(lon, lat) {
    return Object.keys(shapes).filter(function (id) {
      return shapes[id].ring && inRing(lat, lon, shapes[id].ring);
    }).map(function (id) {
      return popupHtml(cache[id], false).replace(/^<div class='pop'>|<\/div>$/g, "");
    });
  }

  // ---------- Editor ----------

  var preview = null;
  function clearPreview() { if (preview) { map.removeLayer(preview); preview = null; } }

  function openEditor(id, prefill) {
    var existing = id ? cache[id] : null;
    var w = existing ? JSON.parse(JSON.stringify(existing)) : newClaim(prefill);
    var newPhotos = [], removedPhotos = [];
    var clubs = window.Auth && Auth.enabled() && Auth.account ? Auth.account.clubs : [];

    var kinds = ["lode", "placer", "millsite", "other"].map(function (k) {
      return "<option value='" + k + "'" + (w.kind === k ? " selected" : "") + ">" + esc(kindText(k)) + "</option>";
    }).join("");
    var vis = "<option value='private'>" + esc(t("onlyMe")) + "</option>" + clubs.map(function (cl) {
      var sel = w.visibility === "club" && w.clubId === cl.id ? " selected" : "";
      return "<option value='" + esc(cl.id) + "'" + sel + ">" + esc(t("clubPrefix") + ": " + cl.name) + "</option>";
    }).join("");
    var postOpts = C.postTypes.map(function (p) {
      return "<option value='" + esc(p.id) + "'>" + esc(p.short + " – " + App.tr(p.name)) + "</option>";
    }).join("");

    function placeTools(kind) {
      return "<div class='row place' data-place='" + kind + "'>" +
        "<button type='button' data-src='gps'>📡 " + esc(t("hereGps")) + "</button>" +
        "<button type='button' data-src='center'>✛ " + esc(t("mapCenter")) + "</button>" +
        "<button type='button' data-src='type'>⌨ " + esc(t("typeCoords")) + "</button></div>" +
        "<div class='typed' data-typed='" + kind + "' hidden><input placeholder='" + esc(t("coordsPlaceholder")) + "' autocomplete='off'>" +
        "<button type='button' data-ok='" + kind + "'>OK</button><p class='hint parsed'></p></div>";
    }

    var form = App.el(
      "<form class='editor claim-editor'>" +
      "<label>" + esc(t("claimNameField")) + "<input name='name' value='" + esc(w.name) + "' autocomplete='off'></label>" +
      "<div class='row two'><label>" + esc(t("blmSerial")) + "<input name='serial' value='" + esc(w.serial) + "' placeholder='AZ101…' autocapitalize='characters'></label>" +
        "<label>" + esc(t("claimKind")) + "<select name='kind'>" + kinds + "</select></label></div>" +
      "<label>" + esc(t("locationDate")) + "<input name='locdate' type='date' value='" + esc(w.locationDate) + "'></label>" +
      (clubs.length ? "<label>" + esc(t("visibility")) + "<select name='vis'>" + vis + "</select></label>" : "") +

      "<h4>" + esc(t("monument")) + "</h4><p class='hint'>" + esc(t("monumentHint")) + "</p>" +
      "<div class='mon-pos coordline'></div>" + placeTools("mon") +

      "<h4>" + esc(t("posts")) + "</h4><div class='post-list'></div>" +
      "<div class='add-post'><label>" + esc(t("addPost")) + "<select name='ptype'>" + postOpts + "</select></label>" + placeTools("post") + "</div>" +
      "<p class='hint area'></p><p class='hint'>" + esc(t("nad27Hint")) + "</p>" +

      "<label>" + esc(t("note")) + "<textarea name='note' rows='3'>" + esc(w.note) + "</textarea></label>" +
      "<div class='field'>" + esc(t("photos")) + " <small class='hint'>(" + esc(t("photosLocalOnly")) + ")</small><div class='thumbs edit-thumbs'></div>" +
        "<label class='btn-like'>＋ " + esc(t("addPhoto")) + "<input type='file' accept='image/*' multiple hidden></label></div>" +

      "<div class='row actions'>" +
        (existing ? "<button type='button' class='danger' data-del>" + esc(t("delete")) + "</button>" : "") +
        "<button type='button' data-cancel>" + esc(t("cancel")) + "</button>" +
        "<button type='submit' class='primary'>" + esc(t("save")) + "</button></div></form>");

    // nächste sinnvolle Pfosten-Art vorschlagen
    function suggestPostType() {
      var used = w.posts.map(function (p) { return p.type; });
      var next = ["nw", "ne", "se", "sw"].filter(function (x) { return used.indexOf(x) < 0; })[0] || "other";
      form.elements["ptype"].value = next;
    }

    function refresh() {
      form.querySelector(".mon-pos").innerHTML = w.monument
        ? "<b>LM</b> " + esc(coordText(w.monument)) + " <button type='button' class='mini' data-clear-mon>✕</button>"
        : "<span class='hint'>" + esc(t("notSet")) + "</span>";
      form.querySelector(".post-list").innerHTML = w.posts.map(function (p, i) {
        return "<div class='post-row'><select data-ptype='" + i + "'>" + C.postTypes.map(function (pt) {
          return "<option value='" + esc(pt.id) + "'" + (pt.id === p.type ? " selected" : "") + ">" + esc(pt.short) + "</option>";
        }).join("") + "</select><span class='coordline'>" + esc(coordText(p)) + "</span>" +
          "<button type='button' class='mini' data-del-post='" + i + "'>✕</button></div>";
      }).join("");
      var r = ring(w), a = acres(r);
      form.querySelector(".area").textContent = r ? t("area") + ": ≈ " + a.toFixed(2) + " " + t("acresShort") : t("needThree");
      // Vorschau auf der Karte
      clearPreview();
      var items = [];
      if (r) items.push(L.polygon(r, { color: "#fff", weight: 2, dashArray: "4 4", fill: false, interactive: false }));
      if (w.monument) items.push(L.circleMarker([w.monument.lat, w.monument.lon], { radius: 9, color: "#fff", weight: 3, fill: false, interactive: false }));
      w.posts.forEach(function (p) { items.push(L.circleMarker([p.lat, p.lon], { radius: 5, color: "#fff", weight: 2, fillOpacity: 0.6, interactive: false })); });
      if (items.length) preview = L.featureGroup(items).addTo(map);
      suggestPostType();
    }

    function setPos(kind, pos) {
      if (kind === "mon") w.monument = pos;
      else w.posts.push(Object.assign({ id: Store.uuid(), type: form.elements["ptype"].value }, pos));
      refresh();
    }

    form.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var place = b.closest("[data-place]");
      if (place && b.dataset.src) {
        var kind = place.dataset.place;
        if (b.dataset.src === "gps") {
          var g = App.gps;
          if (!g) { App.toast(t("gpsWaiting")); return; }
          setPos(kind, { lat: g.lat, lon: g.lon, accuracy: Math.round(g.accuracy) });
        }
        if (b.dataset.src === "center") {
          var c = map.getCenter();
          setPos(kind, { lat: c.lat, lon: c.lng, accuracy: null });
        }
        if (b.dataset.src === "type") {
          var box = form.querySelector("[data-typed='" + kind + "']");
          box.hidden = !box.hidden;
          if (!box.hidden) box.querySelector("input").focus();
        }
      }
      if (b.dataset.ok) {
        var tb = form.querySelector("[data-typed='" + b.dataset.ok + "']");
        var res = Coords.parse(tb.querySelector("input").value);
        var out = tb.querySelector(".parsed");
        if (!res) { out.textContent = t("coordsInvalid"); out.className = "hint parsed bad"; return; }
        out.textContent = "→ " + App.formatCoord(res.lat, res.lon) + (res.assumedWest ? " (" + t("assumedWest") + ")" : "");
        out.className = "hint parsed ok";
        setPos(b.dataset.ok, { lat: res.lat, lon: res.lon, accuracy: null });
        tb.querySelector("input").value = "";
        map.setView([res.lat, res.lon], Math.max(map.getZoom(), 15));
      }
      if (b.hasAttribute("data-clear-mon")) { w.monument = null; refresh(); }
      if (b.dataset.delPost != null) { w.posts.splice(parseInt(b.dataset.delPost, 10), 1); refresh(); }
      if (b.hasAttribute("data-cancel")) App.closeSheet();
      if (b.hasAttribute("data-del") && confirm(t("confirmDeleteClaim"))) {
        remove(w.id).then(function () { App.closeSheet(); });
      }
    });
    form.addEventListener("change", function (e) {
      if (e.target.dataset.ptype != null) { w.posts[parseInt(e.target.dataset.ptype, 10)].type = e.target.value; refresh(); }
    });

    // Fotos
    var thumbs = form.querySelector(".edit-thumbs");
    function onDeletePhoto(pid, wrap) {
      wrap.remove();
      var i = newPhotos.findIndex(function (n) { return n.id === pid; });
      if (i >= 0) newPhotos.splice(i, 1); else removedPhotos.push(pid);
    }
    Points.fillThumbs(thumbs, w.photos, onDeletePhoto);
    form.querySelector("input[type=file]").onchange = function (e) {
      Array.prototype.forEach.call(e.target.files, function (file) {
        Points.resizePhoto(file).then(function (blob) {
          var ph = { id: Store.uuid(), pointId: w.id, blob: blob, mime: "image/jpeg", createdAt: new Date().toISOString() };
          newPhotos.push(ph);
          var wrap = App.el("<div class='thumb'><img src='" + URL.createObjectURL(blob) + "'><button type='button'>✕</button></div>");
          wrap.querySelector("button").onclick = function () { onDeletePhoto(ph.id, wrap); };
          thumbs.appendChild(wrap);
        });
      });
      e.target.value = "";
    };

    form.onsubmit = function (e) {
      e.preventDefault();
      var f = form.elements;
      w.name = f["name"].value.trim();
      w.serial = f["serial"].value.trim().toUpperCase();
      w.kind = f["kind"].value;
      w.locationDate = f["locdate"].value;
      w.note = f["note"].value.trim();
      if (f["vis"]) {
        w.visibility = f["vis"].value === "private" ? "private" : "club";
        w.clubId = w.visibility === "club" ? f["vis"].value : null;
      }
      w.photos = w.photos.filter(function (pid) { return removedPhotos.indexOf(pid) < 0; })
        .concat(newPhotos.map(function (n) { return n.id; }));
      w.updatedAt = new Date().toISOString();
      w.sync.status = "pending";
      Promise.all(newPhotos.map(Store.putPhoto).concat(removedPhotos.map(Store.deletePhoto)))
        .then(function () { return Store.putClaim(w); })
        .then(function () {
          cache[w.id] = w; draw(w);
          App.closeSheet(); App.toast(t("saved"));
          sync();
        }).catch(function (err) { alert(t("error") + ": " + err); });
    };

    App.openSheet(existing ? t("editClaim") : t("newClaim"), form);
    App.onSheetClose(clearPreview);
    refresh();
  }

  function remove(id) {
    var c = cache[id];
    if (!c) return Promise.resolve();
    var photos = c.photos || [];
    c.deleted = true; c.photos = [];
    c.updatedAt = new Date().toISOString();
    c.sync.status = "pending";
    return Promise.all(photos.map(Store.deletePhoto)).then(function () { return Store.putClaim(c); })
      .then(function () { draw(c); sync(); });
  }

  // ---------- Liste ----------

  function openList() {
    var items = Object.keys(cache).map(function (k) { return cache[k]; })
      .filter(function (c) { return !c.deleted; })
      .sort(function (a, b) { return (a.name || "").localeCompare(b.name || ""); });
    var body = App.el("<div class='plist'>" +
      "<button class='primary wide' data-a='new'>＋ " + esc(t("newClaim")) + "</button>" +
      "<div class='items'>" + (items.length ? items.map(function (c) {
        var r = ring(c), a = acres(r);
        return "<button class='item' data-id='" + esc(c.id) + "'><span class='post small' style='border-color:" + esc(color(c)) + "'>LM</span>" +
          "<span class='item-text'><b>" + esc(c.name || t("ownClaim")) + "</b><small>" + esc(kindText(c.kind)) +
          (c.serial ? " · " + esc(c.serial) : "") + " · " + esc(visibilityText(c)) + " · " + (c.posts || []).length + " " + esc(t("postType")) +
          (a ? " · ≈ " + a.toFixed(1) + " ac" : "") + "</small></span></button>";
      }).join("") : "<p class='hint'>" + esc(t("noClaims")) + "</p>") + "</div>" +
      "<div class='row'><button data-a='export'>" + esc(t("exportClaimsKml")) + "</button>" +
      "<label class='btn-like'>" + esc(t("importClaims")) + "<input type='file' accept='.kml' hidden></label></div>" +
      "<p class='hint sync-state'></p></div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.a === "new") openEditor(null);
      if (b.dataset.a === "export") exportKml();
      if (b.dataset.id) { App.closeSheet(); goTo(cache[b.dataset.id]); }
    });
    body.querySelector("input[type=file]").onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      f.text().then(importKml).then(function (n) { App.toast(t("imported") + ": " + n); App.closeSheet(); })
        .catch(function (err) { alert(t("error") + ": " + err.message); });
    };
    var last = App.pref("claimsSyncedAt", null);
    if (window.Auth && Auth.enabled() && last) body.querySelector(".sync-state").textContent = t("lastSync") + ": " + new Date(last).toLocaleString();
    App.openSheet(t("claims"), body);
  }

  function goTo(c) {
    var pts = (c.posts || []).map(function (p) { return [p.lat, p.lon]; });
    if (c.monument) pts.push([c.monument.lat, c.monument.lon]);
    if (!map.hasLayer(layer)) layer.addTo(map);
    if (!pts.length) { openEditor(c.id); return; }
    if (pts.length === 1) map.setView(pts[0], 17); else map.fitBounds(pts, { padding: [40, 40], maxZoom: 18 });
    setTimeout(function () {
      L.popup({ maxWidth: 300 }).setLatLng(c.monument ? [c.monument.lat, c.monument.lon] : pts[0]).setContent(popupHtml(c, false)).openOn(map);
    }, 400);
  }

  // ---------- KML ----------

  function xmlEsc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[ch];
    });
  }

  function portable(c) {
    var copy = JSON.parse(JSON.stringify(c));
    delete copy.photos; delete copy.sync;
    return copy;
  }

  function exportKml() {
    var list = Object.keys(cache).map(function (k) { return cache[k]; }).filter(function (c) { return !c.deleted; });
    var folders = list.map(function (c) {
      var data = "<ExtendedData><Data name='gc_claim'><value>" + xmlEsc(JSON.stringify(portable(c))) + "</value></Data></ExtendedData>";
      var marks = [], r = ring(c);
      if (r) marks.push("<Placemark><name>" + xmlEsc(c.name) + "</name><styleUrl>#claim</styleUrl>" +
        "<Polygon><outerBoundaryIs><LinearRing><coordinates>" +
        r.concat([r[0]]).map(function (p) { return p[1].toFixed(7) + "," + p[0].toFixed(7); }).join(" ") +
        "</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>");
      if (c.monument) marks.push("<Placemark><name>LM " + xmlEsc(c.name) + "</name><styleUrl>#lm</styleUrl><Point><coordinates>" +
        c.monument.lon.toFixed(7) + "," + c.monument.lat.toFixed(7) + "</coordinates></Point></Placemark>");
      (c.posts || []).forEach(function (p) {
        marks.push("<Placemark><name>" + xmlEsc(postType(p.type).short) + "</name><styleUrl>#post</styleUrl><Point><coordinates>" +
          p.lon.toFixed(7) + "," + p.lat.toFixed(7) + "</coordinates></Point></Placemark>");
      });
      if (!marks.length) return "";
      marks[0] = marks[0].replace("<Placemark>", "<Placemark>" + data);
      return "<Folder><name>" + xmlEsc(c.name || t("ownClaim")) + "</name>" + marks.join("") + "</Folder>";
    }).join("\n");
    var kml = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>' + xmlEsc(C.clubName) + " – Claims</name>" +
      "<Style id='claim'><LineStyle><color>ff008cff</color><width>3</width></LineStyle><PolyStyle><color>33008cff</color></PolyStyle></Style>" +
      "<Style id='lm'><IconStyle><color>ff008cff</color><scale>1.2</scale></IconStyle></Style>" +
      "<Style id='post'><IconStyle><color>ffffffff</color><scale>0.7</scale></IconStyle></Style>\n" + folders + "\n</Document></kml>\n";
    ExportImport.download("claims-" + new Date().toISOString().slice(0, 10) + ".kml", kml, "application/vnd.google-earth.kml+xml");
  }

  // Eigene KML (mit gc_claim) vollständig; fremde KML: jede Fläche wird ein Claim, Eckpunkte werden Pfosten
  function importKml(txt) {
    var gj = Formats.kmlToGeoJSON(txt), incoming = [], seen = {};
    gj.features.forEach(function (f) {
      var p = f.properties || {};
      if (p.gc_claim) {
        try {
          var c = JSON.parse(p.gc_claim);
          if (!seen[c.id]) { seen[c.id] = true; incoming.push(c); }
        } catch (e) {}
        return;
      }
      if (f.geometry.type === "Polygon") {
        var coords = f.geometry.coordinates[0].slice();
        var first = coords[0], last = coords[coords.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) coords.pop();
        incoming.push(newClaim({
          name: p.name || "", note: p.description || "",
          posts: coords.map(function (xy) { return { id: Store.uuid(), type: "other", lat: xy[1], lon: xy[0], accuracy: null }; })
        }));
      }
    });
    return mergeMany(incoming);
  }

  function mergeMany(list) {
    var n = 0;
    return list.reduce(function (chain, inc) {
      return chain.then(function () {
        var old = cache[inc.id];
        if (old && Date.parse(old.updatedAt) >= Date.parse(inc.updatedAt)) return;
        var c = Object.assign(newClaim(), inc);
        c.photos = old ? old.photos : (inc.photos || []);
        c.sync = { status: "pending", syncedAt: null };
        n++;
        return Store.putClaim(c).then(function () { cache[c.id] = c; draw(c); });
      });
    }, Promise.resolve()).then(function () { sync(); return n; });
  }

  // ---------- Abgleich mit dem Server ----------

  function sync() {
    if (!window.Auth || !Auth.enabled() || !Auth.account || !navigator.onLine || syncing) return Promise.resolve();
    syncing = true;
    var db = Auth.client, uid = Auth.account.id, now = new Date().toISOString();
    var dirty = Object.keys(cache).map(function (k) { return cache[k]; })
      .filter(function (c) { return c.sync.status !== "synced" && canEdit(c); });

    var pushes = dirty.map(function (c) {
      if (!c.owner || !c.owner.userId) c.owner = { userId: uid, name: Auth.account.username };
      var row = {
        id: c.id, club_id: c.visibility === "club" ? c.clubId : null, visibility: c.visibility,
        data: portable(c), deleted: !!c.deleted, updated_at: c.updatedAt
      };
      var q = c.owner.userId === uid
        ? db.from("claims").upsert(Object.assign({ owner: uid }, row))
        : db.from("claims").update(row).eq("id", c.id);
      return q.then(function (res) {
        if (res.error) throw res.error;
        c.sync = { status: "synced", syncedAt: now };
        return Store.putClaim(c);
      }).catch(function (err) { console.warn("claim push", c.id, err); });
    });

    return Promise.all(pushes).then(function () {
      return db.from("claims").select("id, owner, club_id, visibility, data, deleted, updated_at");
    }).then(function (res) {
      if (res.error) throw res.error;
      var seen = {};
      var work = res.data.map(function (r) {
        seen[r.id] = true;
        var local = cache[r.id];
        if (local && local.sync.status !== "synced") return null;              // eigene, noch nicht hochgeladene Änderung
        if (local && Date.parse(local.updatedAt) >= Date.parse(r.updated_at)) return null;
        var c = Object.assign(newClaim(), r.data, {
          id: r.id, visibility: r.visibility, clubId: r.club_id, deleted: r.deleted,
          updatedAt: r.data.updatedAt || r.updated_at,
          owner: r.data.owner && r.data.owner.userId ? r.data.owner : { userId: r.owner, name: "" },
          photos: local ? local.photos : [],
          sync: { status: "synced", syncedAt: now }
        });
        return Store.putClaim(c).then(function () { cache[c.id] = c; draw(c); });
      });
      // Fremde Claims, die man nicht mehr sehen darf (z. B. aus Club entfernt), lokal entfernen.
      // Eigene Claims, die auf dem Server fehlen, nie löschen, sondern beim nächsten Mal wieder hochladen.
      Object.keys(cache).forEach(function (id) {
        var c = cache[id];
        if (c.sync.status !== "synced" || seen[id]) return;
        if (c.owner && c.owner.userId === uid) {
          c.sync.status = "pending";
          work.push(Store.putClaim(c));
        } else {
          work.push(Store.removeClaim(id).then(function () { undraw(id); delete cache[id]; }));
        }
      });
      return Promise.all(work);
    }).then(function () {
      App.setPref("claimsSyncedAt", now);
    }).catch(function (err) {
      console.warn("claims sync", err);
    }).then(function () { syncing = false; });
  }

  // ---------- Start ----------

  function init(m) {
    map = m;
    map.on("zoomend", updatePostsVisibility);
    updatePostsVisibility();
    window.addEventListener("online", function () { sync(); });

    // Knöpfe in Popups (Bearbeiten, aus BLM-Claim erfassen)
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-claim-edit], [data-newclaim]");
      if (!b) return;
      map.closePopup();
      if (b.dataset.claimEdit) openEditor(b.dataset.claimEdit);
      else openEditor(null, JSON.parse(b.dataset.newclaim));
    });

    return Store.allClaims().then(function (list) {
      list.forEach(function (c) { cache[c.id] = c; draw(c); });
      return sync();
    });
  }

  return {
    layer: layer, init: init, openEditor: openEditor, openList: openList, hitHtml: hitHtml,
    all: function () { return Object.keys(cache).map(function (k) { return cache[k]; }); },
    mergeMany: mergeMany, sync: sync, ring: ring, acres: acres
  };
})();

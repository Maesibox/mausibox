/*
 * Eigene Punkte: setzen, bearbeiten, Fotos, Liste.
 */
var Points = (function () {
  var C = APP_CONFIG;
  var layer = L.featureGroup();
  var markers = {};          // id -> Marker
  var cache = {};            // id -> Punkt
  var map;

  function cat(id) {
    return C.categories.filter(function (c) { return c.id === id; })[0] || C.categories[C.categories.length - 1];
  }

  function icon(p) {
    var c = cat(p.category);
    return L.divIcon({
      className: "pt-icon",
      html: "<div class='pt' style='background:" + App.esc(c.color) + "'>" + App.esc(c.symbol || "") + "</div>",
      iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14]
    });
  }

  function popupHtml(p) {
    var c = cat(p.category);
    var html = "<div class='pop'><h3>" + App.esc(p.name || App.t("untitled")) + "</h3>" +
      "<div class='pop-sub'>" + App.esc(App.tr(c.name)) + " · " + App.esc(p.createdAt.slice(0, 10)) + "</div>" +
      (p.note ? "<p class='note-text'>" + App.esc(p.note) + "</p>" : "") +
      "<div class='thumbs' data-photos='" + App.esc(p.id) + "'></div>" +
      "<div class='coords'>" + App.esc(App.formatCoord(p.lat, p.lon)) + (p.accuracy ? " ±" + Math.round(p.accuracy) + " m" : "") + "</div>" +
      "<div class='pop-actions'><button data-edit='" + App.esc(p.id) + "'>" + App.esc(App.t("edit")) + "</button></div></div>";
    return html;
  }

  function fillThumbs(container, photoIds, onDelete) {
    container.innerHTML = "";
    (photoIds || []).forEach(function (pid) {
      Store.getPhoto(pid).then(function (ph) {
        if (!ph) return;
        var url = URL.createObjectURL(ph.blob);
        var wrap = document.createElement("div");
        wrap.className = "thumb";
        var img = document.createElement("img");
        img.src = url;
        img.onclick = function () { window.open(url, "_blank"); };
        wrap.appendChild(img);
        if (onDelete) {
          var x = document.createElement("button");
          x.type = "button";
          x.textContent = "✕";
          x.onclick = function () { onDelete(pid, wrap); };
          wrap.appendChild(x);
        }
        container.appendChild(wrap);
      });
    });
  }

  function show(p) {
    cache[p.id] = p;
    if (markers[p.id]) { layer.removeLayer(markers[p.id]); delete markers[p.id]; }
    if (p.deleted) return;
    var m = L.marker([p.lat, p.lon], { icon: icon(p) });
    m.bindPopup(function () { return popupHtml(cache[p.id]); }, { maxWidth: 280 });
    m.on("popupopen", function (e) {
      var box = e.popup.getElement();
      fillThumbs(box.querySelector(".thumbs"), cache[p.id].photos);
      box.querySelector("[data-edit]").onclick = function () { map.closePopup(); openEditor(p.id); };
    });
    markers[p.id] = m;
    layer.addLayer(m);
  }

  // Foto verkleinern und als JPEG speichern
  function resizePhoto(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = C.photos.maxSize, w = img.naturalWidth, h = img.naturalHeight;
        var s = Math.min(1, max / Math.max(w, h));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(w * s);
        canvas.height = Math.round(h * s);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error("photo")); }, "image/jpeg", C.photos.quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("photo")); };
      img.src = url;
    });
  }

  // Formular zum Setzen / Bearbeiten
  function openEditor(id, position) {
    var t = App.t, esc = App.esc;
    var existing = id ? cache[id] : null;
    var p = existing ? JSON.parse(JSON.stringify(existing)) : Store.newPoint({ category: C.categories[0].id });
    if (!existing && window.Auth && Auth.account) {
      p.author.name = Auth.account.username;
      p.author.userId = Auth.account.id;
    }
    var gps = App.gps;
    if (!existing) {
      var pos = position || (gps ? gps : { lat: App.map.getCenter().lat, lon: App.map.getCenter().lng });
      p.lat = pos.lat; p.lon = pos.lon;
      p.accuracy = position ? null : (gps ? gps.accuracy : null);
      p.elevation = position ? null : (gps ? gps.elevation : null);
    }
    var newPhotos = [];        // noch nicht gespeicherte Fotos
    var removedPhotos = [];

    var opts = C.categories.map(function (c) {
      return "<option value='" + esc(c.id) + "'" + (c.id === p.category ? " selected" : "") + ">" + esc(c.symbol + " " + App.tr(c.name)) + "</option>";
    }).join("");

    var form = App.el(
      "<form class='editor'>" +
      "<label>" + esc(t("name")) + "<input name='name' value='" + esc(p.name) + "' autocomplete='off'></label>" +
      "<label>" + esc(t("category")) + "<select name='category'>" + opts + "</select></label>" +
      "<label>" + esc(t("note")) + "<textarea name='note' rows='3'>" + esc(p.note) + "</textarea></label>" +
      "<div class='field'>" + esc(t("photos")) + "<div class='thumbs edit-thumbs'></div>" +
        "<label class='btn-like'>＋ " + esc(t("addPhoto")) + "<input type='file' accept='image/*' multiple hidden></label></div>" +
      "<div class='field'>" + esc(t("position")) + ": <span class='pos'></span>" +
        "<div class='row'><button type='button' data-pos='gps'>" + esc(t("useGps")) + "</button>" +
        "<button type='button' data-pos='center'>" + esc(t("useCenter")) + "</button></div></div>" +
      (C.features.publishSwitch ? "<label class='check'><input type='checkbox' name='publish'" + (p.publish ? " checked" : "") + "> " + esc(t("publish")) + "</label>" : "") +
      "<div class='row actions'>" +
        (existing ? "<button type='button' class='danger' data-del>" + esc(t("delete")) + "</button>" : "") +
        "<button type='button' data-cancel>" + esc(t("cancel")) + "</button>" +
        "<button type='submit' class='primary'>" + esc(t("save")) + "</button></div>" +
      "</form>");

    var posEl = form.querySelector(".pos");
    function showPos() { posEl.textContent = App.formatCoord(p.lat, p.lon) + (p.accuracy ? " ±" + Math.round(p.accuracy) + " m" : ""); }
    showPos();

    var thumbs = form.querySelector(".edit-thumbs");
    function onDelete(pid, wrap) {
      wrap.remove();
      var i = newPhotos.findIndex(function (n) { return n.id === pid; });
      if (i >= 0) newPhotos.splice(i, 1); else removedPhotos.push(pid);
    }
    fillThumbs(thumbs, p.photos, onDelete);

    form.querySelector("input[type=file]").onchange = function (e) {
      Array.prototype.forEach.call(e.target.files, function (file) {
        resizePhoto(file).then(function (blob) {
          var ph = { id: Store.uuid(), pointId: p.id, blob: blob, mime: "image/jpeg", createdAt: new Date().toISOString() };
          newPhotos.push(ph);
          var url = URL.createObjectURL(blob);
          var wrap = App.el("<div class='thumb'><img src='" + url + "'><button type='button'>✕</button></div>");
          wrap.querySelector("button").onclick = function () { onDelete(ph.id, wrap); };
          thumbs.appendChild(wrap);
        }).catch(function () { App.toast(App.t("loadError")); });
      });
      e.target.value = "";
    };

    form.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.pos === "gps") {
        var g = App.gps;
        if (!g) { App.toast(t("gpsWaiting")); return; }
        p.lat = g.lat; p.lon = g.lon; p.accuracy = g.accuracy; p.elevation = g.elevation; showPos();
      }
      if (b.dataset.pos === "center") {
        var c = App.map.getCenter();
        p.lat = c.lat; p.lon = c.lng; p.accuracy = null; p.elevation = null; showPos();
      }
      if (b.hasAttribute("data-cancel")) App.closeSheet();
      if (b.hasAttribute("data-del") && confirm(t("confirmDelete"))) {
        remove(p.id).then(function () { App.closeSheet(); });
      }
    });

    form.onsubmit = function (e) {
      e.preventDefault();
      p.name = form.elements["name"].value.trim();
      p.note = form.elements["note"].value.trim();
      p.category = form.elements["category"].value;
      if (form.elements["publish"]) p.publish = form.elements["publish"].checked;
      p.photos = p.photos.filter(function (pid) { return removedPhotos.indexOf(pid) < 0; })
        .concat(newPhotos.map(function (n) { return n.id; }));
      p.updatedAt = new Date().toISOString();
      if (p.sync.status === "synced") p.sync.status = "pending";
      Promise.all(newPhotos.map(Store.putPhoto).concat(removedPhotos.map(Store.deletePhoto)))
        .then(function () { return Store.putPoint(p); })
        .then(function () { show(p); App.closeSheet(); App.toast(t("saved")); })
        .catch(function (err) { alert(App.t("loadError") + ": " + err); });
    };

    App.openSheet(existing ? t("edit") : t("addPoint"), form);
  }

  // Weiche Löschung: Punkt bleibt als "gelöscht" markiert (wichtig für Version 2), Fotos werden entfernt
  function remove(id) {
    var p = cache[id];
    if (!p) return Promise.resolve();
    var photos = p.photos || [];
    p.deleted = true;
    p.photos = [];
    p.updatedAt = new Date().toISOString();
    if (p.sync.status === "synced") p.sync.status = "pending";
    return Promise.all(photos.map(Store.deletePhoto)).then(function () { return Store.putPoint(p); }).then(function () { show(p); });
  }

  function openList() {
    var t = App.t, esc = App.esc;
    var filter = App.pref("listFilter", "all");
    var body = App.el("<div class='plist'><select class='filter'><option value='all'>" + esc(t("all")) + "</option>" +
      C.categories.map(function (c) { return "<option value='" + esc(c.id) + "'>" + esc(App.tr(c.name)) + "</option>"; }).join("") +
      "</select><div class='items'></div></div>");
    var sel = body.querySelector(".filter");
    sel.value = filter;
    function render() {
      var items = Object.keys(cache).map(function (k) { return cache[k]; })
        .filter(function (p) { return !p.deleted && (sel.value === "all" || p.category === sel.value); })
        .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
      var box = body.querySelector(".items");
      if (!items.length) { box.innerHTML = "<p class='hint'>" + esc(t("noPoints")) + "</p>"; return; }
      box.innerHTML = items.map(function (p) {
        var c = cat(p.category);
        return "<button class='item' data-id='" + esc(p.id) + "'><span class='pt small' style='background:" + esc(c.color) + "'>" + esc(c.symbol) + "</span>" +
          "<span class='item-text'><b>" + esc(p.name || t("untitled")) + "</b><small>" + esc(App.tr(c.name)) + " · " + esc(p.createdAt.slice(0, 10)) +
          (p.photos.length ? " · 📷 " + p.photos.length : "") + "</small></span></button>";
      }).join("");
    }
    sel.onchange = function () { App.setPref("listFilter", sel.value); render(); };
    body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-id]");
      if (!b) return;
      var p = cache[b.dataset.id];
      App.closeSheet();
      if (!App.map.hasLayer(layer)) layer.addTo(App.map);
      App.map.setView([p.lat, p.lon], Math.max(App.map.getZoom(), 16));
      setTimeout(function () { markers[p.id].openPopup(); }, 300);
    });
    render();
    App.openSheet(t("points"), body);
  }

  function init(m) {
    map = m;
    return Store.allPoints().then(function (list) { list.forEach(show); });
  }

  return {
    layer: layer, init: init, openEditor: openEditor, openList: openList, show: show,
    fillThumbs: fillThumbs, resizePhoto: resizePhoto,
    all: function () { return Object.keys(cache).map(function (k) { return cache[k]; }); },
    category: cat
  };
})();

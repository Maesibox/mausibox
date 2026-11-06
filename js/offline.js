/*
 * Offline-Modus: das sichtbare Kartengebiet herunterladen.
 * Kacheln und Daten landen im Browser-Cache; der Service Worker (sw.js) liefert sie ohne Empfang aus.
 */
var Offline = (function () {
  var C = APP_CONFIG;
  var running = null;

  function tileUrl(template, z, x, y) {
    return template.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  }

  // Welche Kachel-Ebenen dürfen offline gespeichert werden?
  function tileSources() {
    return C.basemaps.concat(C.overlays).filter(function (s) { return s.offline && (s.type === "tiles" || !s.type); });
  }
  function dataSources() {
    return C.overlays.filter(function (s) { return s.offline && (s.type === "blmClaims" || s.type === "wfsPoints"); });
  }

  function plan(bounds, maxZoom, chosen) {
    var jobs = [];
    var minZoom = Math.max(8, Math.min(App.map.getZoom() - 2, maxZoom));
    tileSources().filter(function (s) { return chosen[s.id]; }).forEach(function (s) {
      var top = Math.min(maxZoom, s.maxNativeZoom || maxZoom);
      for (var z = minZoom; z <= top; z++) {
        var r = App.tileRange(bounds, z);
        for (var x = r.x0; x <= r.x1; x++) for (var y = r.y0; y <= r.y1; y++) jobs.push({ url: tileUrl(s.url, z, x, y) });
      }
    });
    var cells = App.cellsFor(bounds);
    dataSources().filter(function (s) { return chosen[s.id]; }).forEach(function (s) {
      cells.forEach(function (c) { jobs.push({ cell: c, cfg: s }); });
    });
    return jobs;
  }

  function runJobs(jobs, onProgress) {
    var state = { stop: false, done: 0, failed: 0 };
    running = state;
    return caches.open(App.TILE_CACHE).then(function (cache) {
      var i = 0;
      function worker() {
        if (state.stop || i >= jobs.length) return Promise.resolve();
        var job = jobs[i++];
        var p;
        if (job.url) {
          p = cache.match(job.url).then(function (hit) {
            if (hit) return;
            return fetch(job.url, { mode: "cors" }).then(function (res) {
              if (!res.ok) throw new Error(res.status);
              return cache.put(job.url, res);
            });
          });
        } else {
          p = App.fetchCell(job.cfg, job.cell.x, job.cell.y);    // legt Antworten selbst im Daten-Cache ab
        }
        return p.catch(function () { state.failed++; }).then(function () {
          state.done++;
          onProgress(state);
          return worker();
        });
      }
      var workers = [];
      for (var k = 0; k < 6; k++) workers.push(worker());
      return Promise.all(workers).then(function () { running = null; return state; });
    });
  }

  function areas() { return App.pref("offlineAreas", []); }

  function storageText(box) {
    if (!navigator.storage || !navigator.storage.estimate) return;
    navigator.storage.estimate().then(function (e) {
      box.textContent = App.t("storageUsed") + ": " + (e.usage / 1048576).toFixed(0) + " MB";
    });
  }

  var shown = null;
  function showAreas() {
    if (shown) App.map.removeLayer(shown);
    shown = L.featureGroup(areas().map(function (a) {
      return L.rectangle([[a.s, a.w], [a.n, a.e]], { color: "#2f80ed", weight: 2, fill: false, dashArray: "6 4", interactive: false });
    })).addTo(App.map);
    setTimeout(function () { if (shown) { App.map.removeLayer(shown); shown = null; } }, 15000);
  }

  function openPanel() {
    var t = App.t, esc = App.esc;
    if (!window.caches) { App.openSheet(t("offline"), App.el("<p class='hint'>Offline storage not supported in this browser.</p>")); return; }
    var bounds = App.map.getBounds();
    var zooms = [13, 14, 15, 16].map(function (z) {
      return "<option value='" + z + "'" + (z === C.offline.defaultMaxZoom ? " selected" : "") + ">" + z + "</option>";
    }).join("");
    var checks = tileSources().concat(dataSources()).map(function (s) {
      return "<label class='opt'><input type='checkbox' data-src='" + esc(s.id) + "' checked> " + esc(App.tr(s.name)) + "</label>";
    }).join("");
    var list = areas().map(function (a) { return "<li>" + esc(a.name) + " · " + esc(a.date.slice(0, 10)) + " · z" + a.maxZoom + "</li>"; }).join("");

    var body = App.el(
      "<div class='offline'>" +
      "<p>" + esc(t("offlineIntro")) + "</p>" +
      "<label>" + esc(t("areaName")) + "<input name='area' value='" + esc(t("offline") + " " + (areas().length + 1)) + "'></label>" +
      "<label>" + esc(t("maxZoom")) + " <select name='zoom'>" + zooms + "</select></label>" +
      checks +
      "<p class='estimate'></p>" +
      "<div class='progress'><div class='bar'></div></div>" +
      "<div class='row'><button class='primary' data-a='go'>" + esc(t("download")) + "</button><button data-a='stop' hidden>" + esc(t("stop")) + "</button></div>" +
      "<h4>" + esc(t("areas")) + "</h4><ul>" + (list || "<li class='hint'>–</li>") + "</ul>" +
      "<div class='row'><button data-a='show'>" + esc(t("showOnMap")) + "</button><button class='danger' data-a='clear'>" + esc(t("deleteOffline")) + "</button></div>" +
      "<p class='hint storage'></p></div>");

    var est = body.querySelector(".estimate"), bar = body.querySelector(".bar");
    var goBtn = body.querySelector("[data-a=go]"), stopBtn = body.querySelector("[data-a=stop]");
    function chosen() {
      var c = {};
      body.querySelectorAll("[data-src]").forEach(function (i) { c[i.dataset.src] = i.checked; });
      return c;
    }
    function currentJobs() { return plan(bounds, parseInt(body.querySelector("[name=zoom]").value, 10), chosen()); }
    function updateEstimate() {
      var jobs = currentJobs();
      var tiles = jobs.filter(function (j) { return j.url; }).length;
      var mb = tiles * C.offline.estimatedKbPerTile / 1024;
      est.textContent = tiles + " " + t("tiles") + " · " + t("estimate") + " ≈ " + mb.toFixed(0) + " MB";
      var tooMany = tiles > C.offline.maxTiles;
      if (tooMany) est.textContent += " – " + t("tooMany");
      goBtn.disabled = tooMany || !jobs.length || !!running;
    }
    body.addEventListener("change", updateEstimate);
    updateEstimate();
    storageText(body.querySelector(".storage"));

    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.a === "go") {
        var jobs = currentJobs();
        var maxZoom = parseInt(body.querySelector("[name=zoom]").value, 10);
        var name = body.querySelector("[name=area]").value.trim() || t("offline");
        goBtn.disabled = true; stopBtn.hidden = false;
        est.textContent = t("downloading");
        runJobs(jobs, function (s) {
          bar.style.width = (100 * s.done / jobs.length).toFixed(1) + "%";
          est.textContent = t("downloading") + " " + s.done + " / " + jobs.length;
        }).then(function (s) {
          stopBtn.hidden = true;
          var list = areas();
          list.push({ name: name, date: new Date().toISOString(), maxZoom: maxZoom,
            w: bounds.getWest(), e: bounds.getEast(), s: bounds.getSouth(), n: bounds.getNorth() });
          App.setPref("offlineAreas", list);
          est.textContent = t("done") + ": " + (s.done - s.failed) + " / " + jobs.length + (s.failed ? " (" + s.failed + " ✕)" : "");
          storageText(body.querySelector(".storage"));
          App.toast(t("done"));
        });
      }
      if (b.dataset.a === "stop" && running) running.stop = true;
      if (b.dataset.a === "show") { App.closeSheet(); showAreas(); }
      if (b.dataset.a === "clear" && confirm(t("deleteOffline") + "?")) {
        Promise.all([caches.delete(App.TILE_CACHE), caches.delete(App.DATA_CACHE)]).then(function () {
          App.setPref("offlineAreas", []);
          App.closeSheet();
          App.toast(t("done"));
        });
      }
    });

    App.openSheet(t("offline"), body);
  }

  return { openPanel: openPanel };
})();

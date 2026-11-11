/*
 * Abgleich zwischen Geräten (nur mit Login): eigene Punkte, Strecken und Fotos.
 * Was auf dem Handy erfasst wird, erscheint auch am Computer – und umgekehrt.
 * Alles bleibt privat: jede Person sieht nur ihre eigenen Daten (Server-Tabellen user_points, user_tracks,
 * Fotos im privaten Speicher "photos" unter <Benutzer-ID>/<Foto-ID>.jpg).
 * Claims haben ihren eigenen Abgleich (claims.js); hier werden nur ihre Fotos mitgenommen.
 */
var Sync = (function () {
  var busy = false, again = false, timer = null;
  var BUCKET = "photos";
  var EVERY = 60000;                       // alle 60 s, solange die App offen ist

  function ready() {
    return window.Auth && Auth.enabled() && Auth.account && navigator.onLine;
  }

  function kv(key, fallback) {
    return Store.getKV(key).then(function (v) { return v || fallback; }).catch(function () { return fallback; });
  }

  function chunks(list, n) {
    var out = [];
    for (var i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
    return out;
  }

  function check(res) { if (res.error) throw res.error; return res.data; }

  // ---------- Punkte und Strecken ----------

  // kind: { table, all(), put(rec), show(rec), skip(rec) }
  function syncKind(kind, pushed) {
    var db = Auth.client, uid = Auth.account.id, got = 0;
    var done = pushed[kind.table] = pushed[kind.table] || {};   // id -> updatedAt, das zuletzt abgeglichen wurde
    return Promise.all([kind.all(), db.from(kind.table).select("id, updated_at").then(check)]).then(function (r) {
      var local = {}, remote = {};
      r[0].forEach(function (x) { local[x.id] = x; });
      r[1].forEach(function (x) { remote[x.id] = Date.parse(x.updated_at); });

      // 1. Hochladen: geändert seit dem letzten Abgleich und auf dem Server nicht neuer
      var up = r[0].filter(function (x) {
        if (kind.skip && kind.skip(x)) return false;
        if (done[x.id] === x.updatedAt) return false;
        return !(remote[x.id] > Date.parse(x.updatedAt));
      });
      var push = chunks(up, 50).reduce(function (chain, part) {
        return chain.then(function () {
          var rows = part.map(function (x) {
            var data = JSON.parse(JSON.stringify(x));
            delete data.sync;
            return { id: x.id, owner: uid, data: data, deleted: !!x.deleted, updated_at: x.updatedAt };
          });
          return db.from(kind.table).upsert(rows).then(check).then(function () {
            part.forEach(function (x) { done[x.id] = x.updatedAt; remote[x.id] = Date.parse(x.updatedAt); });
          });
        });
      }, Promise.resolve());

      // 2. Herunterladen: auf dem Server neuer als hier (oder hier noch gar nicht vorhanden)
      var down = Object.keys(remote).filter(function (id) {
        var l = local[id];
        return !l || remote[id] > Date.parse(l.updatedAt);
      });
      return push.then(function () {
        return chunks(down, 50).reduce(function (chain, ids) {
          return chain.then(function () {
            return db.from(kind.table).select("id, data, deleted").in("id", ids).then(check).then(function (rows) {
              return Promise.all(rows.map(function (row) {
                var rec = Object.assign({}, row.data, { id: row.id, deleted: row.deleted });
                if (kind.table === "user_points") rec.sync = { status: "synced", remoteId: row.id, syncedAt: new Date().toISOString() };
                done[rec.id] = rec.updatedAt;
                got++;
                return kind.put(rec).then(function () { kind.show(rec); });
              }));
            });
          });
        }, Promise.resolve());
      });
    }).then(function () { return got; });
  }

  // ---------- Fotos ----------

  function photoPath(id) { return Auth.account.id + "/" + id + ".jpg"; }

  function blobOf(ph) {
    if (ph.blob) return Promise.resolve(ph.blob);
    if (ph.data) return fetch("data:" + (ph.mime || "image/jpeg") + ";base64," + ph.data).then(function (r) { return r.blob(); });
    return Promise.resolve(null);
  }

  // alle Foto-Kennungen meiner Punkte und meiner eigenen Claims: { fotoId: Besitzer-Datensatz-ID }
  function myPhotoIds() {
    var uid = Auth.account.id, ids = {};
    return Store.allPoints().then(function (pts) {
      pts.forEach(function (p) { if (!p.deleted) (p.photos || []).forEach(function (id) { ids[id] = p.id; }); });
      Claims.all().forEach(function (c) {
        if (!c.deleted && c.owner && c.owner.userId === uid) (c.photos || []).forEach(function (id) { ids[id] = c.id; });
      });
      return ids;
    });
  }

  function syncPhotos(known) {
    var store = Auth.client.storage.from(BUCKET), now = Date.now(), got = 0;
    return myPhotoIds().then(function (ids) {
      return Object.keys(ids).reduce(function (chain, id) {
        return chain.then(function () {
          var k = known[id];
          if (k === "up") return;                               // schon auf dem Server
          if (typeof k === "number" && now - k < 3600000) return; // vor kurzem vergeblich gesucht
          return Store.getPhoto(id).then(function (ph) {
            if (ph) {
              // hier vorhanden -> hochladen
              return blobOf(ph).then(function (blob) {
                if (!blob) return;
                return store.upload(photoPath(id), blob, { contentType: "image/jpeg", upsert: true }).then(function (res) {
                  if (res.error) throw res.error;
                  known[id] = "up";
                });
              });
            }
            // hier nicht vorhanden -> vom Server holen (falls ein anderes Gerät es hochgeladen hat)
            return store.download(photoPath(id)).then(function (res) {
              if (res.error || !res.data) { known[id] = now; return; }
              known[id] = "up";
              got++;
              return Store.putPhoto({ id: id, pointId: ids[id], blob: res.data, mime: "image/jpeg", createdAt: new Date().toISOString() });
            });
          }).catch(function (err) { console.warn("photo sync", id, err); });
        });
      }, Promise.resolve());
    }).then(function () { return got; });
  }

  // ---------- Ablauf ----------

  function run() {
    if (!ready()) return Promise.resolve();
    if (busy) { again = true; return Promise.resolve(); }
    busy = true;
    var got = 0;
    return Promise.all([kv("sync.pushed", {}), kv("sync.photos", {})]).then(function (r) {
      var pushed = r[0], known = r[1];
      return syncKind({ table: "user_points", all: Store.allPoints, put: Store.putPoint, show: Points.show }, pushed)
        .then(function (n) { got += n; })
        .then(function () {
          return syncKind({
            table: "user_tracks", all: Store.allTracks, put: Store.putTrack,
            show: function (tr) { Tracks.mergeMany([tr]); },
            skip: function (tr) { return tr.recording; }          // laufende Aufnahme erst nach dem Speichern
          }, pushed);
        })
        .then(function (n) { got += n; return Store.setKV("sync.pushed", pushed); })
        .then(function () { return Claims.sync(); })
        .then(function () { return syncPhotos(known); })
        .then(function (n) { got += n; return Store.setKV("sync.photos", known); })
        .then(function () {
          App.setPref("syncedAt", new Date().toISOString());
          if (got) App.toast(App.t("syncGot") + ": " + got);
        });
    }).catch(function (err) {
      console.warn("sync", err);
    }).then(function () {
      busy = false;
      if (again) { again = false; return run(); }
    });
  }

  function init() {
    window.addEventListener("online", run);
    // beim Wechsel in den Hintergrund sofort hochladen, beim Zurückkommen holen
    document.addEventListener("visibilitychange", run);
    if (timer) clearInterval(timer);
    timer = setInterval(function () { if (document.visibilityState === "visible") run(); }, EVERY);
    setTimeout(run, 2000);
  }

  return { init: init, run: run };
})();

/*
 * Speicher auf dem Gerät (IndexedDB).
 * Tabellen: "points" (Punkte), "photos" (Fotos als Bilddateien),
 * "kv" (Zwischenspeicher, z. B. Club-Claims vom Server für offline),
 * "claims" (eigene Claims mit Location Monument und Pfosten),
 * "tracks" (aufgezeichnete Wege).
 */
var Store = (function () {
  var DB_NAME = "goldclub";
  var DB_VERSION = 4;
  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("points")) {
          db.createObjectStore("points", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("photos")) {
          var photos = db.createObjectStore("photos", { keyPath: "id" });
          photos.createIndex("pointId", "pointId");
        }
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
        if (!db.objectStoreNames.contains("claims")) {
          db.createObjectStore("claims", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("tracks")) {
          db.createObjectStore("tracks", { keyPath: "id" });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function run(storeName, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, mode);
        var result = fn(tx.objectStore(storeName));
        tx.oncomplete = function () { resolve(result instanceof IDBRequest ? result.result : result); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
      return (c === "x" ? r : (r & 3) | 8).toString(16);
    });
  }

  // Eine Kennung pro Gerät – für Version 2 (wer hat den Punkt erstellt)
  function deviceId() {
    var id = null;
    try { id = localStorage.getItem("gc.deviceId"); } catch (e) {}
    if (!id) {
      id = uuid();
      try { localStorage.setItem("gc.deviceId", id); } catch (e) {}
    }
    return id;
  }

  /*
   * Aufbau eines Punktes (schema 1). Für Version 2 sind publish, author und sync schon da.
   */
  function newPoint(fields) {
    var now = new Date().toISOString();
    return Object.assign({
      id: uuid(),
      schema: 1,
      name: "",
      note: "",
      category: "other",
      lat: 0,
      lon: 0,
      accuracy: null,
      elevation: null,
      photos: [],
      createdAt: now,
      updatedAt: now,
      deleted: false,
      publish: false,
      author: { deviceId: deviceId(), name: "" },
      sync: { status: "local", remoteId: null, syncedAt: null }
    }, fields || {});
  }

  return {
    uuid: uuid,
    newPoint: newPoint,

    allPoints: function () {
      return run("points", "readonly", function (s) { return s.getAll(); });
    },
    getPoint: function (id) {
      return run("points", "readonly", function (s) { return s.get(id); });
    },
    putPoint: function (p) {
      return run("points", "readwrite", function (s) { s.put(p); }).then(function () { return p; });
    },

    getPhoto: function (id) {
      return run("photos", "readonly", function (s) { return s.get(id); });
    },
    putPhoto: function (photo) {
      return run("photos", "readwrite", function (s) { s.put(photo); }).then(function () { return photo; });
    },
    deletePhoto: function (id) {
      return run("photos", "readwrite", function (s) { s.delete(id); });
    },

    allClaims: function () {
      return run("claims", "readonly", function (s) { return s.getAll(); });
    },
    putClaim: function (c) {
      return run("claims", "readwrite", function (s) { s.put(c); }).then(function () { return c; });
    },
    removeClaim: function (id) {
      return run("claims", "readwrite", function (s) { s.delete(id); });
    },

    allTracks: function () {
      return run("tracks", "readonly", function (s) { return s.getAll(); });
    },
    putTrack: function (tr) {
      return run("tracks", "readwrite", function (s) { s.put(tr); }).then(function () { return tr; });
    },
    removeTrack: function (id) {
      return run("tracks", "readwrite", function (s) { s.delete(id); });
    },

    getKV: function (key) {
      return run("kv", "readonly", function (s) { return s.get(key); });
    },
    setKV: function (key, value) {
      return run("kv", "readwrite", function (s) { s.put(value, key); });
    },
    clearKV: function () {
      return run("kv", "readwrite", function (s) { s.clear(); });
    },

    // Browser bitten, die Daten nicht automatisch zu löschen
    requestPersistence: function () {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(function () {});
      }
    }
  };
})();

/*
 * ============================================================
 *  KONFIGURATION – die einzige Datei, die du normalerweise änderst
 * ============================================================
 *
 *  Regeln beim Bearbeiten:
 *  - Texte stehen immer in "Anführungszeichen".
 *  - Nach jedem Eintrag kommt ein Komma , (ausser manchmal beim letzten – das ist egal).
 *  - Zweisprachige Texte haben die Form  { en: "English", de: "Deutsch" }.
 *  - true = ein, false = aus.
 *  - Nach einer Änderung: Seite im Browser neu laden.
 *    Wenn sich nichts ändert: appVersion unten um 1 erhöhen.
 */

var APP_CONFIG = {

  // Erhöhen, wenn du eine neue Version veröffentlichst (zwingt Handys, neu zu laden)
  appVersion: 8,

  // ----------------------------------------------------------
  //  SERVER (Supabase) für Login, Einladungscodes und Club-Claims
  //  Leer lassen = App läuft ohne Login (Club-Claims dann aus data/club-claims).
  //  Beide Werte findest du in Supabase unter: Project Settings → API.
  //  Der "anon"/"publishable" Schlüssel ist öffentlich gedacht – er darf hier stehen.
  //  Den "service_role"/"secret" Schlüssel NIE hier eintragen!
  // ----------------------------------------------------------
  server: {
    supabaseUrl: "https://xqobznuioioblymvrxpl.supabase.co",  // z. B. "https://abcdefgh.supabase.co"
    supabaseAnonKey: "sb_publishable_Z9hPYqSrft4kTLYVGSEilw_6ryb1Ci_",  // langer Text, beginnt mit "eyJ…" oder "sb_publishable_…"
    publicUrl: "https://maesibox.github.io/mausibox/",  // Adresse der App für Einladungslinks, z. B. "https://name.github.io/goldclub-map/"
                              // (leer = aktuelle Adresse)
  },

  clubName: "MAUSIBOX App",          // Name der App (oben links, im Browser-Tab, in Exporten)

  // Sprache beim ersten Start: "en" oder "de" (umschaltbar im Menü)
  defaultLanguage: "en",

  // Startposition der Karte (Franconia-Gebiet, Mohave County, AZ)
  start: { lat: 34.80, lon: -114.40, zoom: 12 },

  // Koordinaten-Anzeige: "dd" = 34.80123, -114.40123   "dms" = 34°48'04"N 114°24'04"W
  coordinateFormat: "dd",

  // ----------------------------------------------------------
  //  GRUNDKARTEN (immer genau eine sichtbar)
  //  offline: true  = darf für den Offline-Modus heruntergeladen werden
  //  offline: false = nur online (Lizenz erlaubt keinen Massen-Download)
  // ----------------------------------------------------------
  basemaps: [
    {
      id: "esri-sat",
      name: { en: "Satellite (Esri, online only)", de: "Satellit (Esri, nur online)" },
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      maxNativeZoom: 19,
      offline: false,
      default: true
    },
    {
      id: "usgs-sat",
      name: { en: "Satellite (USGS, offline OK)", de: "Satellit (USGS, offline-fähig)" },
      url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
      attribution: "USGS The National Map",
      maxNativeZoom: 16,
      offline: true
    },
    {
      id: "usgs-topo",
      name: { en: "Topo map (USGS, offline OK)", de: "Topokarte (USGS, offline-fähig)" },
      url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
      attribution: "USGS The National Map",
      maxNativeZoom: 16,
      offline: true
    },
    {
      id: "osm",
      name: { en: "Street map (OSM, online only)", de: "Strassenkarte (OSM, nur online)" },
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "© OpenStreetMap contributors",
      maxNativeZoom: 19,
      offline: false
    }
  ],

  // ----------------------------------------------------------
  //  EBENEN (beliebig viele gleichzeitig)
  //  visible: beim allerersten Start eingeschaltet?
  //  opacity: 0 = unsichtbar … 1 = deckend (im Ebenen-Menü per Regler änderbar)
  //  type:
  //    "tiles"     = Bildkacheln
  //    "blmClaims" = BLM Mining Claims live vom BLM-Server
  //    "wfsPoints" = Punkte (Minen) live vom USGS-Server
  //    "file"      = eigene Dateien (KML oder GeoJSON) aus dem Projektordner
  //    "areaPolygons" = Flächen (Schutzgebiete) live von einem ArcGIS-Server
  // ----------------------------------------------------------
  overlays: [
    {
      id: "geology",
      type: "tiles",
      name: { en: "Geology (rock units)", de: "Geologie (Gesteinseinheiten)" },
      url: "https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png",
      attribution: "Geology: Macrostrat (CC-BY 4.0), Arizona Geological Survey",
      maxNativeZoom: 14,
      opacity: 0.5,
      visible: false,
      offline: true,
      geologyInfo: true          // beim Antippen Gesteinsinfo anzeigen
    },
    {
      id: "faults",
      type: "tiles",
      name: { en: "Faults & contacts (USGS)", de: "Störungen & Kontakte (USGS)" },
      url: "https://mrdata.usgs.gov/mapcache/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=sgmc2structure&style=default&tilematrixset=GoogleMapsCompatible&tilematrix={z}&tilerow={y}&tilecol={x}&format=image/png",
      attribution: "Faults: USGS SGMC",
      maxNativeZoom: 14,
      opacity: 1,
      visible: false,
      offline: true,
      geologyInfo: true
    },
    {
      id: "aeromag",
      type: "tiles",
      name: { en: "Aeromagnetics (USGS)", de: "Aeromagnetik (USGS)" },
      url: "https://mrdata.usgs.gov/mapcache/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=magnetic&style=default&tilematrixset=GoogleMapsCompatible&tilematrix={z}&tilerow={y}&tilecol={x}&format=image/png",
      attribution: "Magnetic anomaly: USGS",
      maxNativeZoom: 12,           // Daten sind grob (~1 km), mehr Detail gibt es nicht
      opacity: 0.5,
      visible: false,
      offline: true
    },
    {
      id: "landStatus",
      type: "tiles",
      name: { en: "Land manager (BLM, state, private …)", de: "Landbesitz (BLM, Staat, privat …)" },
      url: "https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/tile/{z}/{y}/{x}",
      attribution: "Surface management agency: BLM",
      maxNativeZoom: 16,
      opacity: 0.4,
      visible: false,
      offline: true,
      // beim Antippen: wem gehört das Land, was ist erlaubt (Texte unten bei landAgencies)
      landInfoUrl: "https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/1/query",
      legend: [
        { color: "#fee679", text: { en: "BLM", de: "BLM" } },
        { color: "#ccebc5", text: { en: "Forest Service", de: "Forest Service" } },
        { color: "#b3e3ee", text: { en: "State trust land", de: "Staatsland (State Trust)" } },
        { color: "#cabddc", text: { en: "National Park", de: "Nationalpark" } },
        { color: "#7fcca7", text: { en: "Wildlife refuge", de: "Wildschutzgebiet" } },
        { color: "#fdb46c", text: { en: "Tribal", de: "Reservat" } },
        { color: "#fbb4ce", text: { en: "Military", de: "Militär" } },
        { color: "#ffffff", text: { en: "Private / other (no color)", de: "Privat / andere (ohne Farbe)" } }
      ]
    },
    {
      id: "restricted",
      type: "areaPolygons",
      name: { en: "Protected & closed areas (PAD-US)", de: "Schutzgebiete & Sperrzonen (PAD-US)" },
      url: "https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/Manager_Name/FeatureServer/0/query",
      // nur Gebiete mit Einschränkungen laden (normales BLM-Land wird weggelassen)
      where: "Mang_Name IN ('NPS','FWS','TRIB','DOD','DOE','SPR') OR Des_Tp IN ('WA','WSA','NM','NCA','NRA','NP','ACEC') OR GAP_Sts IN ('1','2')",
      attribution: "Protected areas: USGS PAD-US",
      minZoom: 9,
      cellZ: 10,                   // grössere Kacheln, weil Schutzgebiete gross sind
      simplify: 0.0005,            // Grenzen auf ca. 50 m vereinfacht (spart Daten)
      closedColor: "#d0021b",      // meist verboten
      limitedColor: "#f5a623",     // eingeschränkt / Regeln prüfen
      closedManagers: ["NPS", "FWS", "TRIB", "DOD", "DOE"],
      closedDesignations: ["WA", "NP", "NM", "NWR", "TRIBL", "MIL"],
      visible: false,
      offline: true,
      legend: [
        { color: "#d0021b", text: { en: "Usually closed (park, refuge, wilderness, tribal, military)", de: "Meist verboten (Park, Schutzgebiet, Wilderness, Reservat, Militär)" } },
        { color: "#f5a623", text: { en: "Restricted – check rules", de: "Eingeschränkt – Regeln prüfen" } }
      ]
    },
    {
      id: "blm",
      type: "blmClaims",
      name: { en: "BLM mining claims (active)", de: "BLM Mining Claims (aktiv)" },
      url: "https://nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer/1/query",
      attribution: "Mining claims: BLM MLRS",
      minZoom: 12,                 // BLM liefert Claims erst ab dieser Zoomstufe
      color: "#e02020",
      fillOpacity: 0.15,
      // Link zur offiziellen BLM-Fallseite (Inhaber, Gebühren). {SF_ID} wird ersetzt.
      detailsLink: "https://mlrs.blm.gov/s/blm-case/{SF_ID}",
      visible: true,
      offline: true
    },
    {
      id: "blmClosed",
      type: "blmClaims",
      name: { en: "BLM mining claims (closed)", de: "BLM Mining Claims (geschlossen)" },
      url: "https://nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer/2/query",
      attribution: "Mining claims: BLM MLRS",
      minZoom: 12,
      color: "#8c8c8c",
      fillOpacity: 0.06,
      dashArray: "4 4",            // gestrichelt
      detailsLink: "https://mlrs.blm.gov/s/blm-case/{SF_ID}",
      visible: false,
      offline: false
    },
    {
      id: "club",
      type: "file",
      name: { en: "Club claims", de: "Club-Claims" },
      // Dateien im Ordner data/club-claims – KML (.kml) oder GeoJSON (.geojson)
      files: [
        "data/club-claims/club-claims.kml"
      ],
      color: "#18c018",
      fillOpacity: 0.25,
      visible: true
    },
    {
      id: "myclaims",
      type: "userClaims",
      name: { en: "Claims & posts (own / club)", de: "Claims & Pfosten (eigene / Club)" },
      privateColor: "#ff8c00",     // eigene, private Claims
      foreignColor: "#c03cc0",     // fremde Claims, die man für sich festhält
      clubColor: "#00c8e0",        // mit dem Club geteilte Claims
      clubForeignColor: "#ff4fa0", // fremde Claims, die mit dem Club geteilt sind
      postsMinZoom: 15,            // Pfosten erst ab dieser Zoomstufe zeigen
      visible: true
    },
    {
      id: "mrds",
      type: "wfsPoints",
      name: { en: "Old mines & deposits (USGS MRDS)", de: "Alte Minen & Fundstellen (USGS MRDS)" },
      url: "https://mrdata.usgs.gov/services/mrds",
      typeName: "mrds-high",
      minZoom: 10,
      color: "#8a5a2b",
      goldColor: "#ffc400",        // Fundstellen mit Gold (AU) in dieser Farbe
      visible: true,
      offline: true
    },
    {
      id: "usmin",
      type: "wfsPoints",
      name: { en: "Mine symbols from topo maps (USGS USMIN)", de: "Minensymbole aus Topokarten (USGS USMIN)" },
      url: "https://mrdata.usgs.gov/services/usmin",
      typeName: "points-high",
      minZoom: 12,
      color: "#222222",
      visible: false,
      offline: true
    }
  ],

  // Koordinaten-Eingabe: positive Länge ohne W/E als West verstehen (USA)
  assumeWestLongitude: true,

  // Pfosten-Arten für eigene Claims (Kürzel erscheint auf der Karte)
  postTypes: [
    { id: "nw", short: "NW", name: { en: "NW corner", de: "NW-Ecke" } },
    { id: "ne", short: "NE", name: { en: "NE corner", de: "NE-Ecke" } },
    { id: "se", short: "SE", name: { en: "SE corner", de: "SE-Ecke" } },
    { id: "sw", short: "SW", name: { en: "SW corner", de: "SW-Ecke" } },
    { id: "nend", short: "N", name: { en: "North end center", de: "Mitte Nord-Ende" } },
    { id: "send", short: "S", name: { en: "South end center", de: "Mitte Süd-Ende" } },
    { id: "eend", short: "E", name: { en: "East end center", de: "Mitte Ost-Ende" } },
    { id: "wend", short: "W", name: { en: "West end center", de: "Mitte West-Ende" } },
    { id: "side", short: "SC", name: { en: "Side center", de: "Seitenmitte" } },
    { id: "witness", short: "WC", name: { en: "Witness corner", de: "Zeugenpfosten" } },
    { id: "other", short: "P", name: { en: "Other post", de: "Anderer Pfosten" } }
  ],

  // Gesteinsinfo beim Antippen der Karte (Macrostrat)
  geologyInfoUrl: "https://macrostrat.org/api/v2/mobile/map_query",

  // ----------------------------------------------------------
  //  KATEGORIEN für eigene Punkte
  //  id: kurz, ohne Leerzeichen – NICHT mehr ändern, wenn schon Punkte existieren
  // ----------------------------------------------------------
  categories: [
    { id: "quartz",  name: { en: "Quartz vein", de: "Quarzgang" },    color: "#f2f2f2", symbol: "Q" },
    { id: "find",    name: { en: "Find / nugget", de: "Fund / Nugget" }, color: "#ffc400", symbol: "★" },
    { id: "sample",  name: { en: "Sample", de: "Probe" },             color: "#2f80ed", symbol: "S" },
    { id: "mine",    name: { en: "Old working", de: "Alte Grube" },   color: "#8a5a2b", symbol: "⚒" },
    { id: "camp",    name: { en: "Camp / access", de: "Lager / Zufahrt" }, color: "#27ae60", symbol: "⛺" },
    { id: "other",   name: { en: "Other", de: "Sonstiges" },          color: "#9b51e0", symbol: "•" }
  ],

  // ----------------------------------------------------------
  //  WEGE AUFZEICHNEN (Tracking-Knopf)
  //  minDistance: neuer Punkt erst nach so vielen Metern
  //  maxAccuracy: GPS-Punkte ungenauer als so viele Meter werden ignoriert
  //  maxSpeed:    schnellere Sprünge (m/s) sind GPS-Fehler und werden ignoriert
  //  gapSeconds:  kam so lange kein GPS-Punkt (z. B. Bildschirm aus), wird die Linie unterbrochen statt quer verbunden
  //  smooth:      Glättung (Kalman-Filter): Zittern des GPS wird herausgerechnet; Zahl = erwartete Gehgeschwindigkeit in m/s
  // ----------------------------------------------------------
  tracks: {
    types: [
      { id: "drive",  icon: "🚙", name: { en: "Drive", de: "Fahrt" },           color: "#2f80ed", minDistance: 15, maxAccuracy: 60, maxSpeed: 60,  gapSeconds: 120, smooth: 0 },
      { id: "walk",   icon: "🚶", name: { en: "Walk / hike", de: "Gehen / Laufen" }, color: "#9b51e0", minDistance: 4,  maxAccuracy: 30, maxSpeed: 4,   gapSeconds: 45,  smooth: 1.5 },
      { id: "detect", icon: "🔍", name: { en: "Metal detecting", de: "Metalldetektor" }, color: "#ffc400", minDistance: 1,  maxAccuracy: 12, maxSpeed: 2.5, gapSeconds: 20,  smooth: 0.7 }
    ],
    coilWidth: 1.0                 // Suchbreite beim Detektor in Metern (wie breit man schwenkt) – zeigt die abgesuchte Fläche
  },

  // Parkplatz: Link zur Navigation ({lat}, {lon} werden ersetzt)
  parking: {
    navigateUrl: "https://maps.apple.com/?daddr={lat},{lon}"
  },

  // ----------------------------------------------------------
  //  LANDBESITZ: was bedeutet das fürs Goldsuchen? (Antippen der Ebene "Landbesitz")
  //  level: "open" = meist erlaubt, "limited" = Regeln/Genehmigung, "closed" = meist verboten
  // ----------------------------------------------------------
  landAgencies: {
    BLM:  { level: "open",    name: { en: "Bureau of Land Management (BLM)", de: "Bureau of Land Management (BLM)" },
            rule: { en: "Public land – prospecting usually allowed, but not on active claims (check the claim layer).", de: "Öffentliches Land – Suchen meist erlaubt, aber nicht auf aktiven Claims (Claim-Ebene prüfen)." } },
    USFS: { level: "open",    name: { en: "US Forest Service", de: "US Forest Service" },
            rule: { en: "Usually allowed with rules; not on active claims. Check with the ranger district.", de: "Meist erlaubt mit Regeln; nicht auf aktiven Claims. Beim Ranger District nachfragen." } },
    ST:   { level: "limited", name: { en: "State trust land", de: "Staatsland (State Trust Land)" },
            rule: { en: "Arizona State Trust land: a state permit is needed. No claims under federal law.", de: "Arizona State Trust Land: Es braucht eine Genehmigung des Staates. Keine Claims nach Bundesrecht." } },
    PVT:  { level: "closed",  name: { en: "Private land", de: "Privatland" },
            rule: { en: "Only with the owner's permission.", de: "Nur mit Erlaubnis des Besitzers." } },
    NPS:  { level: "closed",  name: { en: "National Park Service", de: "National Park Service" },
            rule: { en: "Prospecting and collecting are forbidden.", de: "Goldsuchen und Sammeln verboten." } },
    FWS:  { level: "closed",  name: { en: "US Fish & Wildlife (refuge)", de: "US Fish & Wildlife (Schutzgebiet)" },
            rule: { en: "Wildlife refuge – prospecting forbidden.", de: "Wildschutzgebiet – Goldsuchen verboten." } },
    BIA:  { level: "closed",  name: { en: "Tribal land", de: "Reservat (Tribal Land)" },
            rule: { en: "Forbidden without tribal permission.", de: "Ohne Erlaubnis des Stammes verboten." } },
    DOD:  { level: "closed",  name: { en: "Military", de: "Militär" },
            rule: { en: "No access.", de: "Kein Zutritt." } },
    BOR:  { level: "limited", name: { en: "Bureau of Reclamation", de: "Bureau of Reclamation" },
            rule: { en: "Depends on the area – ask the local office.", de: "Je nach Gebiet – bei der Behörde nachfragen." } },
    LG:   { level: "limited", name: { en: "City / county", de: "Stadt / County" },
            rule: { en: "Usually not allowed in parks; ask the city/county.", de: "In Parks meist nicht erlaubt; bei Stadt/County nachfragen." } }
  },

  // Abkürzungen in den Schutzgebieten (PAD-US) in Klartext
  landNames: {
    WA: { en: "Wilderness area", de: "Wilderness (Wildnisgebiet)" }, WSA: { en: "Wilderness study area", de: "Wilderness-Studiengebiet" },
    NP: { en: "National park", de: "Nationalpark" }, NM: { en: "National monument", de: "National Monument" },
    NWR: { en: "National wildlife refuge", de: "Nationales Wildschutzgebiet" }, NRA: { en: "National recreation area", de: "National Recreation Area" },
    NCA: { en: "Conservation area", de: "Schutzgebiet (Conservation Area)" }, ACEC: { en: "Area of critical environmental concern", de: "Besonders schützenswertes Gebiet (ACEC)" },
    TRIBL: { en: "Tribal land", de: "Reservat" }, SP: { en: "State park", de: "State Park" }, MIL: { en: "Military land", de: "Militärgebiet" },
    NPS: { en: "National Park Service", de: "National Park Service" }, FWS: { en: "US Fish & Wildlife", de: "US Fish & Wildlife" },
    BLM: { en: "BLM", de: "BLM" }, USFS: { en: "US Forest Service", de: "US Forest Service" }, TRIB: { en: "Tribe", de: "Stamm" },
    DOD: { en: "Military", de: "Militär" }, DOE: { en: "Dept. of Energy", de: "Energieministerium" }, SPR: { en: "State parks", de: "State Parks" },
    SFW: { en: "State fish & wildlife", de: "Staatliche Wildbehörde" }, SDOL: { en: "State land department", de: "Staatliche Landbehörde" },
    CITY: { en: "City", de: "Stadt" }, CNTY: { en: "County", de: "County" }, USBR: { en: "Bureau of Reclamation", de: "Bureau of Reclamation" }
  },

  // Fotos werden vor dem Speichern verkleinert (spart Speicher auf dem Handy)
  photos: { maxSize: 1600, quality: 0.8 },

  // Offline-Modus
  offline: {
    maxTiles: 25000,               // Sicherheitsgrenze pro Download
    defaultMaxZoom: 15,            // vorgeschlagene höchste Zoomstufe
    estimatedKbPerTile: 20         // nur für die Grössenschätzung
  },

  // ----------------------------------------------------------
  //  VERSION 2 (noch nicht aktiv)
  // ----------------------------------------------------------
  features: {
    publishSwitch: false,          // Schalter "veröffentlichen" pro Punkt anzeigen
    clubPointsServer: null         // später: Adresse des Club-Servers
  },

  // ----------------------------------------------------------
  //  TEXTE der Bedienoberfläche
  // ----------------------------------------------------------
  text: {
    en: {
      layers: "Layers", basemap: "Base map", overlays: "Layers",
      gps: "My location", addPoint: "Add point", points: "My points", menu: "Menu",
      zoomInFor: "Zoom in to see", loading: "Loading…", loadError: "Could not load",
      gpsWaiting: "Waiting for GPS…", gpsError: "GPS not available", accuracy: "accuracy",
      name: "Name", note: "Note", category: "Category", photos: "Photos", addPhoto: "Add photo",
      position: "Position", useGps: "Use GPS", useCenter: "Use map center",
      publish: "Publish to club", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit",
      close: "Close", confirmDelete: "Delete this point?", noPoints: "No points yet. Long-press the map or use +.",
      all: "All", untitled: "Untitled",
      claim: "BLM mining claim", serial: "Serial number", legacySerial: "Legacy serial", status: "Status",
      claimType: "Type", claimName: "Name", acres: "Acres", owner: "Owner",
      ownerLink: "Owner & details at BLM MLRS", claimApprox: "Boundary is approximate (derived from survey quarter-quarter sections), not a surveyed line.",
      clubClaim: "Club claim", geology: "Geology", lithology: "Rock type", age: "Age",
      faults: "Fault / line", source: "Source", noGeology: "No geology info here",
      geologyOffline: "Geology info needs internet",
      mine: "Old mine / deposit", devStatus: "Status", commodities: "Commodities", moreInfo: "More info (USGS)",
      mineFeature: "Mine feature (topo map)", topoMap: "Topo map",
      exportImport: "Export / Import", exportGpx: "Export GPX", exportKml: "Export KML",
      backup: "Full backup (with photos)", import: "Import file (GPX, KML, backup)",
      imported: "Imported", exportNoPhotos: "GPX and KML contain no photos. Use the full backup to keep photos.",
      lastBackup: "Last backup", never: "never",
      offline: "Offline maps", offlineIntro: "Downloads the area currently visible on the map.",
      maxZoom: "Highest zoom level", tiles: "tiles", estimate: "Estimated size",
      download: "Download", downloading: "Downloading…", done: "Done", stop: "Stop",
      tooMany: "Too many tiles – zoom in or lower the zoom level.",
      areas: "Downloaded areas", showOnMap: "Show", deleteOffline: "Delete all offline data",
      storageUsed: "Storage used", areaName: "Area name",
      language: "Language", about: "About & data sources",
      saved: "Saved", offlineNow: "Offline – showing saved data",
      persistHint: "Tip: make a full backup now and then. If the browser data is cleared, local points are lost.",

      // Login & Konto
      login: "Sign in", logout: "Sign out", register: "Create account", forgot: "Forgot password?",
      userOrEmail: "Username or email", username: "Username", email: "Email", password: "Password",
      password2: "Repeat password", inviteCode: "Invitation code", haveCode: "I have an invitation code",
      haveAccount: "I already have an account", backToLogin: "Back to sign in",
      usernameRule: "3–30 characters: letters, digits, . _ -", passwordRule: "At least 8 characters",
      passwordMismatch: "Passwords do not match", codeValid: "Valid code", codeClub: "Club", codePrivate: "Private user (no club)",
      codeInvalid: "This code is not valid (wrong, used up, expired or deactivated).",
      usernameTaken: "This username is already taken.", wrongLogin: "Username or password wrong.",
      tooManyAttempts: "Too many attempts. Please wait 15 minutes.",
      checkEmail: "Almost done: we sent you an email. Open the link in it, then sign in.",
      resetSent: "If this email belongs to an account, a reset link was sent.",
      sendReset: "Send reset link", newPassword: "New password", setPassword: "Save new password",
      passwordChanged: "Password changed.", accountDisabled: "This account is disabled. Contact the club admin.",
      account: "Account", myClubs: "My clubs", noClubs: "No club (private user)", role_admin: "Admin", role_member: "Member",
      redeem: "Redeem another code", redeemOk: "Code redeemed.", superadmin: "Super admin",
      offlineLogin: "Offline – using the last signed-in account",

      // Admin
      admin: "Administration", club: "Club", clubs: "Clubs", newClub: "New club", clubName: "Club name",
      deleteClub: "Delete club", confirmDeleteClub: "Delete this club with all its codes, members and claim files?",
      startHere: "Use current map view as club start", startSaved: "Start position saved",
      codes: "Invitation codes", newCode: "New code", codeType: "Type", codeSingle: "Single code (1 person)",
      codeMulti: "Club code (several people)", maxUses: "Max. uses", validUntil: "Valid until (optional)",
      roleForCode: "Role", createCode: "Create code", used: "used", expires: "expires", inactive: "inactive",
      deactivate: "Deactivate", activate: "Activate", showQr: "QR / link", copyLink: "Copy link", share: "Share",
      saveQr: "Save QR image", copied: "Copied", privateCodes: "Private users (no club)",
      members: "Members", makeAdmin: "Make admin", makeMember: "Make member", removeMember: "Remove",
      confirmRemove: "Remove this person from the club?",
      claimFiles: "Club claim files", uploadClaims: "Upload KML / GeoJSON", features: "features",
      confirmDeleteFile: "Delete this file?", users: "All users", disable: "Disable", enable: "Enable",
      back: "Back", error: "Error",

      // Eigene Claims
      claims: "Claims & posts", newClaim: "New claim", editClaim: "Edit claim", ownClaim: "Own claim",
      claimNameField: "Claim name", blmSerial: "BLM serial number", claimKind: "Type", lode: "Lode", placer: "Placer",
      millsite: "Mill site", otherKind: "Other", locationDate: "Location date", visibility: "Visible for",
      onlyMe: "Only me (private)", clubPrefix: "Club", monument: "Location monument",
      monumentHint: "Post with the location notice (name, locator, date).",
      posts: "Corner & other posts", addPost: "Add post", postType: "Post",
      hereGps: "GPS here", mapCenter: "Map center", typeCoords: "Type coordinates",
      coordsPlaceholder: "34.80123, -114.40123 · 34°48'04\"N 114°24'04\"W · 11S 736512 3854320",
      coordsInvalid: "Could not read these coordinates.", assumedWest: "longitude taken as West",
      nad27Hint: "Coordinates on old notices are often NAD27 – they can be off by up to ~100 m. Check in the field.",
      notSet: "not set", area: "Area", needThree: "At least 3 boundary posts are needed to draw the claim.",
      confirmDeleteClaim: "Delete this claim?", noClaims: "None yet.",
      fromBlm: "＋ Record this claim with posts", createdBy: "Recorded by", exportClaimsKml: "Export claims (KML)",
      importClaims: "Import claims (KML)", photosLocalOnly: "Photos stay on this device.",
      syncing: "Syncing claims…", lastSync: "Synced", readOnly: "Read only (recorded by someone else)",
      goTo: "Show on map", acresShort: "acres",
      folderMine: "My claims", folderForeign: "Others' claims (for me)", entryKind: "Whose claim?",
      kindMine: "My claim", kindForeign: "Someone else's claim", showFolder: "show on map",
      clubFileClaims: "Club claim files", clubOthers: "other claims",

      // BLM, Land, Schutzgebiete
      closedClaimHint: "Closed claim – the land may be open again. Check the current status at BLM before you dig.",
      landManager: "Land manager", landUnknown: "No land manager data here.", landHint: "Guide only – rules can change. Check with the agency.",
      protectedArea: "Protected / restricted area", designation: "Type", manager: "Managed by",
      levelOpen: "Usually allowed", levelLimited: "Restricted – check rules / permit", levelClosed: "Usually forbidden",

      // Wege
      track: "Record route", tracks: "Routes", chooseTrack: "What do you want to record?",
      recording: "Recording", paused: "Paused", pause: "Pause", resume: "Continue", stopSave: "Stop & save",
      discard: "Discard", confirmDiscard: "Throw this recording away?", trackName: "Name", distance: "Distance",
      duration: "Duration", noTracks: "No routes yet.", trackSaved: "Route saved", trackResumeFound: "Unfinished recording found – tap the route button to continue or save it.",
      screenOnHint: "Keep the screen on and the app open while recording. iPhone stops GPS when the screen is off.",
      coilWidth: "Search width (m) – how wide you swing", areaCovered: "Area searched", started: "Started", pointsCount: "GPS points",
      confirmDeleteTrack: "Delete this route?", weakGps: "GPS too inaccurate – waiting…", gpsGap: "No GPS – keep screen on!", exportTypeGpx: "Export these routes (GPX)",
      allRoutes: "All routes", trackDetails: "Route",

      // Parkplatz
      parking: "Parking spot", parkSaved: "Parking spot saved", parkHint: "Long-press the P button to save where you are as parking spot.",
      parkNoGps: "No current GPS position yet – please wait a moment and try again.", parkFromYou: "from you",
      parkSavedAt: "Saved", navigate: "Navigate (Apple Maps)", deletePark: "Delete parking spot", parkDeleted: "Parking spot deleted",

      // Club-Umschalter, Hilfe, Verwaltung
      activeClub: "Show club", allClubs: "All my clubs", help: "Help – how it works",
      addMember: "Add person", addMemberHint: "Username of an existing account", userNotFound: "No account with this username.",
      memberAdded: "Added to club", userClubs: "Clubs", assignClub: "Add to club",
      dirs: "N,NE,E,SE,S,SW,W,NW"
    },
    de: {
      layers: "Ebenen", basemap: "Grundkarte", overlays: "Ebenen",
      gps: "Mein Standort", addPoint: "Punkt setzen", points: "Meine Punkte", menu: "Menü",
      zoomInFor: "Hineinzoomen für", loading: "Lade…", loadError: "Laden fehlgeschlagen",
      gpsWaiting: "Warte auf GPS…", gpsError: "GPS nicht verfügbar", accuracy: "Genauigkeit",
      name: "Name", note: "Notiz", category: "Kategorie", photos: "Fotos", addPhoto: "Foto hinzufügen",
      position: "Position", useGps: "GPS verwenden", useCenter: "Kartenmitte verwenden",
      publish: "Im Club veröffentlichen", save: "Speichern", cancel: "Abbrechen", delete: "Löschen", edit: "Bearbeiten",
      close: "Schliessen", confirmDelete: "Diesen Punkt löschen?", noPoints: "Noch keine Punkte. Lange auf die Karte drücken oder + verwenden.",
      all: "Alle", untitled: "Ohne Namen",
      claim: "BLM Mining Claim", serial: "Seriennummer", legacySerial: "Alte Seriennummer", status: "Status",
      claimType: "Art", claimName: "Name", acres: "Acres", owner: "Inhaber",
      ownerLink: "Inhaber & Details im BLM MLRS", claimApprox: "Grenze ist nur ungefähr (aus Viertel-Viertel-Sektionen abgeleitet), keine vermessene Linie.",
      clubClaim: "Club-Claim", geology: "Geologie", lithology: "Gestein", age: "Alter",
      faults: "Störung / Linie", source: "Quelle", noGeology: "Keine Geologie-Info hier",
      geologyOffline: "Geologie-Info braucht Internet",
      mine: "Alte Mine / Fundstelle", devStatus: "Status", commodities: "Rohstoffe", moreInfo: "Mehr Info (USGS)",
      mineFeature: "Minensymbol (Topokarte)", topoMap: "Topokarte",
      exportImport: "Export / Import", exportGpx: "GPX exportieren", exportKml: "KML exportieren",
      backup: "Vollständige Sicherung (mit Fotos)", import: "Datei importieren (GPX, KML, Sicherung)",
      imported: "Importiert", exportNoPhotos: "GPX und KML enthalten keine Fotos. Für Fotos die vollständige Sicherung verwenden.",
      lastBackup: "Letzte Sicherung", never: "nie",
      offline: "Offline-Karten", offlineIntro: "Lädt das Gebiet herunter, das gerade auf der Karte sichtbar ist.",
      maxZoom: "Höchste Zoomstufe", tiles: "Kacheln", estimate: "Geschätzte Grösse",
      download: "Herunterladen", downloading: "Lade herunter…", done: "Fertig", stop: "Stopp",
      tooMany: "Zu viele Kacheln – näher hineinzoomen oder Zoomstufe senken.",
      areas: "Heruntergeladene Gebiete", showOnMap: "Zeigen", deleteOffline: "Alle Offline-Daten löschen",
      storageUsed: "Belegter Speicher", areaName: "Name des Gebiets",
      language: "Sprache", about: "Über die App & Datenquellen",
      saved: "Gespeichert", offlineNow: "Offline – zeige gespeicherte Daten",
      persistHint: "Tipp: ab und zu eine vollständige Sicherung machen. Wenn die Browserdaten gelöscht werden, sind lokale Punkte weg.",

      // Login & Konto
      login: "Anmelden", logout: "Abmelden", register: "Konto erstellen", forgot: "Passwort vergessen?",
      userOrEmail: "Benutzername oder E-Mail", username: "Benutzername", email: "E-Mail", password: "Passwort",
      password2: "Passwort wiederholen", inviteCode: "Einladungscode", haveCode: "Ich habe einen Einladungscode",
      haveAccount: "Ich habe schon ein Konto", backToLogin: "Zurück zur Anmeldung",
      usernameRule: "3–30 Zeichen: Buchstaben, Ziffern, . _ -", passwordRule: "Mindestens 8 Zeichen",
      passwordMismatch: "Passwörter stimmen nicht überein", codeValid: "Gültiger Code", codeClub: "Club", codePrivate: "Privatperson (ohne Club)",
      codeInvalid: "Dieser Code ist nicht gültig (falsch, aufgebraucht, abgelaufen oder gesperrt).",
      usernameTaken: "Dieser Benutzername ist schon vergeben.", wrongLogin: "Benutzername oder Passwort falsch.",
      tooManyAttempts: "Zu viele Versuche. Bitte 15 Minuten warten.",
      checkEmail: "Fast fertig: Wir haben dir eine E-Mail geschickt. Link darin öffnen, dann anmelden.",
      resetSent: "Falls die E-Mail zu einem Konto gehört, wurde ein Link zum Zurücksetzen geschickt.",
      sendReset: "Link schicken", newPassword: "Neues Passwort", setPassword: "Neues Passwort speichern",
      passwordChanged: "Passwort geändert.", accountDisabled: "Dieses Konto ist gesperrt. Bitte den Club-Admin kontaktieren.",
      account: "Konto", myClubs: "Meine Clubs", noClubs: "Kein Club (Privatperson)", role_admin: "Admin", role_member: "Mitglied",
      redeem: "Weiteren Code einlösen", redeemOk: "Code eingelöst.", superadmin: "Superadmin",
      offlineLogin: "Offline – verwende das zuletzt angemeldete Konto",

      // Admin
      admin: "Verwaltung", club: "Club", clubs: "Clubs", newClub: "Neuer Club", clubName: "Name des Clubs",
      deleteClub: "Club löschen", confirmDeleteClub: "Diesen Club mit allen Codes, Mitgliedern und Claim-Dateien löschen?",
      startHere: "Aktuellen Kartenausschnitt als Club-Start verwenden", startSaved: "Startposition gespeichert",
      codes: "Einladungscodes", newCode: "Neuer Code", codeType: "Art", codeSingle: "Einzelcode (1 Person)",
      codeMulti: "Club-Code (mehrere Personen)", maxUses: "Max. Anzahl", validUntil: "Gültig bis (freiwillig)",
      roleForCode: "Rolle", createCode: "Code erstellen", used: "benutzt", expires: "läuft ab", inactive: "gesperrt",
      deactivate: "Sperren", activate: "Entsperren", showQr: "QR / Link", copyLink: "Link kopieren", share: "Teilen",
      saveQr: "QR-Bild speichern", copied: "Kopiert", privateCodes: "Privatpersonen (ohne Club)",
      members: "Mitglieder", makeAdmin: "Zum Admin machen", makeMember: "Zum Mitglied machen", removeMember: "Entfernen",
      confirmRemove: "Diese Person aus dem Club entfernen?",
      claimFiles: "Club-Claim-Dateien", uploadClaims: "KML / GeoJSON hochladen", features: "Objekte",
      confirmDeleteFile: "Diese Datei löschen?", users: "Alle Benutzer", disable: "Sperren", enable: "Entsperren",
      back: "Zurück", error: "Fehler",

      // Eigene Claims
      claims: "Claims & Pfosten", newClaim: "Neuer Claim", editClaim: "Claim bearbeiten", ownClaim: "Eigener Claim",
      claimNameField: "Name des Claims", blmSerial: "BLM-Seriennummer", claimKind: "Art", lode: "Lode", placer: "Placer",
      millsite: "Mill Site", otherKind: "Andere", locationDate: "Datum der Location", visibility: "Sichtbar für",
      onlyMe: "Nur mich (privat)", clubPrefix: "Club", monument: "Location Monument",
      monumentHint: "Pfosten mit der Location Notice (Name, Locator, Datum).",
      posts: "Eck- und andere Pfosten", addPost: "Pfosten hinzufügen", postType: "Pfosten",
      hereGps: "GPS hier", mapCenter: "Kartenmitte", typeCoords: "Koordinaten eintippen",
      coordsPlaceholder: "34.80123, -114.40123 · 34°48'04\"N 114°24'04\"W · 11S 736512 3854320",
      coordsInvalid: "Diese Koordinaten konnte ich nicht lesen.", assumedWest: "Länge als West verstanden",
      nad27Hint: "Koordinaten auf alten Notices sind oft NAD27 – sie können bis ca. 100 m abweichen. Im Feld prüfen.",
      notSet: "nicht gesetzt", area: "Fläche", needThree: "Für die Claim-Fläche braucht es mindestens 3 Grenzpfosten.",
      confirmDeleteClaim: "Diesen Claim löschen?", noClaims: "Noch keine.",
      fromBlm: "＋ Diesen Claim mit Pfosten erfassen", createdBy: "Erfasst von", exportClaimsKml: "Claims exportieren (KML)",
      importClaims: "Claims importieren (KML)", photosLocalOnly: "Fotos bleiben auf diesem Gerät.",
      syncing: "Claims werden abgeglichen…", lastSync: "Abgeglichen", readOnly: "Nur lesen (von jemand anderem erfasst)",
      goTo: "Auf Karte zeigen", acresShort: "Acres",
      folderMine: "Meine Claims", folderForeign: "Fremde Claims (für mich)", entryKind: "Wessen Claim?",
      kindMine: "Mein Claim", kindForeign: "Fremder Claim", showFolder: "auf Karte zeigen",
      clubFileClaims: "Club-Claim-Dateien", clubOthers: "andere Claims",

      // BLM, Land, Schutzgebiete
      closedClaimHint: "Geschlossener Claim – das Land ist vielleicht wieder frei. Vor dem Graben den aktuellen Stand beim BLM prüfen.",
      landManager: "Landbesitz", landUnknown: "Keine Angaben zum Landbesitz hier.", landHint: "Nur zur Orientierung – Regeln können ändern. Bei der Behörde nachfragen.",
      protectedArea: "Schutzgebiet / Sperrzone", designation: "Art", manager: "Verwaltet von",
      levelOpen: "Meist erlaubt", levelLimited: "Eingeschränkt – Regeln / Genehmigung prüfen", levelClosed: "Meist verboten",

      // Wege
      track: "Weg aufzeichnen", tracks: "Strecken", chooseTrack: "Was möchtest du aufzeichnen?",
      recording: "Aufnahme läuft", paused: "Pausiert", pause: "Pause", resume: "Weiter", stopSave: "Beenden & speichern",
      discard: "Verwerfen", confirmDiscard: "Diese Aufnahme wegwerfen?", trackName: "Name", distance: "Strecke",
      duration: "Dauer", noTracks: "Noch keine Strecken.", trackSaved: "Strecke gespeichert", trackResumeFound: "Unfertige Aufnahme gefunden – Weg-Knopf antippen, um weiterzumachen oder zu speichern.",
      screenOnHint: "Während der Aufnahme Bildschirm an und App offen lassen. Das iPhone stoppt GPS, wenn der Bildschirm aus ist.",
      coilWidth: "Suchbreite (m) – wie breit du schwenkst", areaCovered: "Abgesuchte Fläche", started: "Start", pointsCount: "GPS-Punkte",
      confirmDeleteTrack: "Diese Strecke löschen?", weakGps: "GPS zu ungenau – warte…", gpsGap: "Kein GPS – Bildschirm an lassen!", exportTypeGpx: "Diese Strecken exportieren (GPX)",
      allRoutes: "Alle Strecken", trackDetails: "Strecke",

      // Parkplatz
      parking: "Parkplatz", parkSaved: "Parkplatz gespeichert", parkHint: "P-Knopf lange drücken, um den jetzigen Standort als Parkplatz zu speichern.",
      parkNoGps: "Noch keine aktuelle GPS-Position – bitte kurz warten und nochmals versuchen.", parkFromYou: "von dir",
      parkSavedAt: "Gespeichert", navigate: "Hinführen (Apple Karten)", deletePark: "Parkplatz löschen", parkDeleted: "Parkplatz gelöscht",

      // Club-Umschalter, Hilfe, Verwaltung
      activeClub: "Club anzeigen", allClubs: "Alle meine Clubs", help: "Hilfe – so funktioniert's",
      addMember: "Person hinzufügen", addMemberHint: "Benutzername eines bestehenden Kontos", userNotFound: "Kein Konto mit diesem Benutzernamen.",
      memberAdded: "Zum Club hinzugefügt", userClubs: "Clubs", assignClub: "Zu Club hinzufügen",
      dirs: "N,NO,O,SO,S,SW,W,NW"
    }
  }
};

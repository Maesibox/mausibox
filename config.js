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
  appVersion: 3,

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
    publicUrl: ""             // Adresse der App für Einladungslinks, z. B. "https://name.github.io/goldclub-map/"
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
      clubColor: "#00c8e0",        // mit dem Club geteilte Claims
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
      confirmDeleteClaim: "Delete this claim?", noClaims: "No own claims yet.",
      fromBlm: "＋ Record as own claim (posts)", createdBy: "Recorded by", exportClaimsKml: "Export claims (KML)",
      importClaims: "Import claims (KML)", photosLocalOnly: "Photos stay on this device.",
      syncing: "Syncing claims…", lastSync: "Synced", readOnly: "Read only (recorded by someone else)",
      goTo: "Show on map", acresShort: "acres"
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
      confirmDeleteClaim: "Diesen Claim löschen?", noClaims: "Noch keine eigenen Claims.",
      fromBlm: "＋ Als eigenen Claim erfassen (Pfosten)", createdBy: "Erfasst von", exportClaimsKml: "Claims exportieren (KML)",
      importClaims: "Claims importieren (KML)", photosLocalOnly: "Fotos bleiben auf diesem Gerät.",
      syncing: "Claims werden abgeglichen…", lastSync: "Abgeglichen", readOnly: "Nur lesen (von jemand anderem erfasst)",
      goTo: "Auf Karte zeigen", acresShort: "Acres"
    }
  }
};

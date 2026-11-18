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
  appVersion: 42,

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

  clubName: "MAUSIBOX App",
  // Farbe pro Club (Club-Claims und Club-Dateien). Clubs ohne Eintrag bekommen eine Farbe aus clubPalette.
  clubColors: { "Havasu Gold Seekers": "#00c8e0", "AMRA": "#3d5afe", "GPAA": "#2ecc40", "49ers": "#ffd600" },
  clubPalette: ["#00bfa5", "#ff6d00", "#aa00ff", "#c6ff00", "#ff1744", "#795548"],
  clubDotsMaxZoom: 13,
  // BLM-Änderungen: in diesen Gebieten merkt sich die App neue und abgelaufene Claims (bbox = West, Süd, Ost, Nord)
  blmWatch: {
    days: 30,
    areas: [ { id: "franconia", name: "Franconia / HGS", bbox: [-114.40, 34.45, -113.95, 34.80] } ]
  },               // weiter herausgezoomt: Club-Claims als Sammelpunkte mit Anzahl          // Name der App (oben links, im Browser-Tab, in Exporten)

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
      id: "swisstopo",
      name: { en: "Swiss national map (swisstopo, Switzerland only)", de: "Landeskarte Schweiz (swisstopo, nur Schweiz)" },
      url: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
      attribution: "© swisstopo",
      maxNativeZoom: 18,
      offline: true
    },
    {
      id: "basemapat",
      name: { en: "Austria map (basemap.at, Austria only)", de: "Österreich-Karte (basemap.at, nur Österreich)" },
      url: "https://maps.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png",
      attribution: "© basemap.at",
      maxNativeZoom: 19,
      offline: true
    },
    {
      id: "orthoat",
      name: { en: "Austria aerial photos 30 cm (basemap.at, Austria only)", de: "Österreich-Luftbild 30 cm (basemap.at, nur Österreich)" },
      url: "https://maps.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg",
      attribution: "© basemap.at",
      maxNativeZoom: 19,
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
  // Goldwasch-Regeln pro Kanton (Kürzel wie bei swisstopo). closed = Fisch-Schonzeit (dann meist nicht waschen)
  chCantonRules: {
    source: "Schweizerische Goldwäschervereinigung, Übersicht kantonale Bestimmungen (Stand Nov. 2026)",
    link: "https://www.goldwaschen.ch/gold-in-der-schweiz/kantonale-bestimmungen/",
    AG: { rule: "Ohne Bewilligung nur von Hand mit Schaufel und Pfanne, kleine mobile Rinnen ohne feste Installation. Grössere Geräte und Gruppenanlässe nur mit Bewilligung.", closed: "1. Okt. – 30. April" },
    AI: { rule: "Pfanne und Schaufel, bis 4 Personen erlaubt (Merkblatt des Kantons).", closed: "Ende Sept. – 1. März und an Ruhe-/Feiertagen" },
    AR: { rule: "Keine besonderen Vorgaben bekannt. Keine Motorgeräte.", closed: "16. Sept. – 31. März" },
    BE: { rule: "Pfanne und Schaufel, max. 3 Personen, 1. Mai – 30. Sept. bewilligungsfrei. Rinnen, Schleusen, Handpumpen oder Gruppen ab 6 Personen: fischereirechtliche Bewilligung. Natur- und Wildruhegebiete beachten.", closed: "siehe Merkblatt" },
    BL: { rule: "Gemeingebrauch: nur mit Pfanne, keine Rinne, keine Gruppen, nicht gewerblich. Wegen Fisch-/Krebskrankheiten Ausrüstung nicht zwischen Gewässern wechseln.", closed: "§ 8 Fischereiverordnung" },
    BS: { rule: "Meldepflichtig, je nach Nutzung bewilligungspflichtig (Amt für Umwelt und Energie).", closed: "1. Okt. – 31. Mai (je nach Gewässer)" },
    FR: { rule: "Ohne Bewilligung 1. Juni – 30. Sept. mit Schaufel, Pfanne und Rinne bis 1 m × 20 cm, nur kleine Gruppen (Familie).", closed: "" },
    GE: { rule: "Bewilligungspflichtig (Règlement L 4 05.01, Art. 21).", closed: "1. Okt. – 25. Mai" },
    GL: { rule: "Keine Vorgaben bekannt. Keine Motorgeräte.", closed: "1. Okt. – 30. April" },
    GR: { rule: "Bergregal bei den Gemeinden: vorher bei der Gemeinde fragen. Bewilligung u. a. in Medel/Lucmagn, Disentis/Mustér, Tujetsch, Obersaxen Mundaun, Sumvitg. Gemeinde Rheinwald: Goldwaschen verboten. Werkzeuge/Maschinen: fischereirechtliche Bewilligung.", closed: "16. Sept. – 30. April" },
    JU: { rule: "Bewilligungspflichtig.", closed: "" },
    LU: { rule: "Keine besonderen Vorgaben bekannt. Keine Motorgeräte.", closed: "§ 12 Fischereiverordnung (Forellen-Laichzeit gilt auch für die Fontanne)" },
    NE: { rule: "Im ganzen Kanton verboten.", closed: "" },
    NW: { rule: "Einzelpersonen mit Schaufel und Pfanne, Anfang Mai – Ende Sept. ohne Bewilligung. Rinnen, Schleusen, Gruppen über 4 Personen: Bewilligung.", closed: "1. Okt. – 30. April" },
    OW: { rule: "Keine Vorgaben bekannt. Keine Motorgeräte.", closed: "1. Okt. – 30. April" },
    SH: { rule: "Je nach Intensität kantonale Bewilligung/Konzession nötig (Tiefbauamt).", closed: "1. Okt. – 30. April" },
    SO: { rule: "Ohne Bewilligung mit Pfanne, Schüssel, Schaufel 1. Juni – 30. Sept., in der Aare ganzjährig. Rinnen, Schleusen, Pumpen oder 1. Okt. – 31. Mai: fischereirechtliche Bewilligung. Professionell: nicht bewilligt.", closed: "" },
    SZ: { rule: "Einzelpersonen mit Pfanne und Rinne ohne Bewilligung. Werkzeug/Maschinen: fischereirechtliche Bewilligung.", closed: "1. Okt. – 30. April" },
    SG: { rule: "Nur Pfanne und Schaufel. Rinnen, Schleusen, Pumpen, Gruppenanlässe: Bewilligung.", closed: "1. Okt. – 30. April" },
    TI: { rule: "Bewilligungspflichtig (Museo cantonale di storia naturale).", closed: "" },
    TG: { rule: "Mit einfachen Handgeräten ohne Bewilligung (wenn kein örtliches/zeitliches Verbot). Gruppen, Rinnen, Schleusen, Pumpen: Bewilligung.", closed: "1. Okt. – 30. April" },
    UR: { rule: "In Kantonsgewässern privat mit Pfanne und Schaufel erlaubt, Rinne bewilligungspflichtig. Auf Gebiet der Korporationen Uri und Urseren: deren Bewilligung nötig.", closed: "1. Okt. – 14. April" },
    VD: { rule: "Bewilligungspflichtig. Freizeit in Kleingruppen 1. Juni – 30. Sept. mit Schaufel, Pfanne, Sieb und Rinne bis 1 m × 20 cm; Löcher wieder füllen.", closed: "" },
    VS: { rule: "Hobbymässig erlaubt. Detektoren an Gewässern bewilligungspflichtig. Natur- und Fischschutz beachten.", closed: "Art. 21–23 Fischereiverordnung" },
    ZG: { rule: "Nur Handarbeit, max. 2 Personen pro Ort (ab 3: Bewilligung). Keine Motorgeräte, keine Ufer abgraben. In Naturschutzgebieten und im Moosrusenbach verboten. Ausrüstung vorher waschen.", closed: "1. Okt. – 30. April" },
    ZH: { rule: "Nur in freigegebenen Gewässerabschnitten (kantonales Merkblatt, Übersicht Region Winterthur). Pfanne und Schaufel erlaubt; Schleusen und Pumpen nur mit Bewilligung (Amt für Landschaft und Natur).", closed: "1. Okt. – 30. April; Thur und Rhein bis 15. Juni" },
  },

  // Gruppen im Ebenen-Fenster (aufklappbar), damit es nicht zu viele Ebenen auf einmal sind
  overlayGroups: [
    { id: "general", name: { en: "General", de: "Allgemein" }, open: true },
    { id: "us", name: { en: "🇺🇸 USA (BLM, USGS …)", de: "🇺🇸 USA (BLM, USGS …)" }, open: true },
    { id: "nz", name: { en: "🇳🇿 New Zealand", de: "🇳🇿 Neuseeland" } },
    { id: "au", name: { en: "🇦🇺 Australia – all states", de: "🇦🇺 Australien – alle Staaten" } },
    { id: "auwa", name: { en: "🇦🇺 Western Australia – claims, drill holes, geology", de: "🇦🇺 Western Australia – Claims, Bohrlöcher, Geologie" } },
    { id: "auqld", name: { en: "🇦🇺 Queensland – claims, old workings, geology", de: "🇦🇺 Queensland – Claims, alte Schächte, Geologie" } },
    { id: "ausouth", name: { en: "🇦🇺 NSW, Victoria, SA, Tasmania", de: "🇦🇺 NSW, Victoria, South Australia, Tasmanien" } },
    // Europa: zuerst alles, was überall gilt; danach nur noch, was es pro Land zusätzlich gibt
    { id: "eu", name: { en: "🇪🇺 Europe – all countries", de: "🇪🇺 Europa – alle Länder" } },
    { id: "ch", name: { en: "🇨🇭 Switzerland – details", de: "🇨🇭 Schweiz – Details" } },
    { id: "eux", name: { en: "🇦🇹 🇩🇪 🇪🇸 More country details", de: "🇦🇹 🇩🇪 🇪🇸 Weitere Länder-Details" } }
  ],

  // Gold-Regeln pro Land (Ebene "Gold-Regeln pro Land", Karte antippen). Schlüssel = Ländercode (EU-Landesgrenzen GISCO)
  countryRules: {
    AT: {
      name: { en: "Austria", de: "Österreich" }, level: "limited",
      rule: { en: "Gold is a 'free' mineral (MinroG): searching must be reported to the mining authority, and the landowner must agree beforehand.",
              de: "Gold ist ein bergfreier Rohstoff (MinroG): Die Suche muss der Montanbehörde angezeigt werden, vorher braucht es die Zustimmung des Grundeigentümers." },
      details: { en: "In practice per federal state: Carinthia – a permit is needed to pan outside supervised sites (user experience 2026; ask the district authority/municipality). Salzburg – official panning sites in Rauris; elsewhere report + landowner + fishing rights holder. National parks (Hohe Tauern) – only guided panning. Everywhere: state nature-protection laws (some tools forbidden), fishing and water law, no motorised gear. Easiest legal start: official sites and show mines (Rauris, Heiligenblut, Hainzenberg).",
                 de: "In der Praxis je Bundesland: Kärnten – ausserhalb betreuter Plätze braucht es eine Bewilligung (Erfahrung 2026; bei Bezirkshauptmannschaft/Gemeinde fragen). Salzburg – offizielle Waschplätze in Rauris; sonst Anzeige + Grundeigentümer + Fischereiberechtigter. Nationalparks (Hohe Tauern) – nur geführtes Goldwaschen. Überall: Naturschutzgesetze der Länder (teils Verbot bestimmter Hilfsmittel), Fischerei- und Wasserrecht, keine Motorgeräte. Einfachster legaler Einstieg: offizielle Plätze und Schaubergwerke (Rauris, Heiligenblut, Hainzenberg)." },
      source: "Bundesministerium für Finanzen, Montanbehörde (Stand Nov. 2026)",
      link: "https://www.bmf.gv.at/themen/bergbau/rechtsangelegenheiten-im-bergbau/goldsuche-und-sammeln-von-mineralien-in-oesterreich.html"
    },
    DE: {
      name: { en: "Germany", de: "Deutschland" }, level: "limited",
      rule: { en: "Hobby gold panning (pan, no machines) is usually tolerated on the known gold rivers (e.g. Rhine, Isar, Eder, Schwarza). Bank access, nature protection and fishing rules still apply; commercial mining falls under mining law.",
              de: "Hobby-Goldwaschen (Pfanne, keine Maschinen) ist an den bekannten Goldflüssen meist geduldet (z. B. Rhein, Isar, Eder, Schwarza). Uferbetretung, Naturschutz und Fischereiregeln gelten trotzdem; gewerbliche Gewinnung ist Bergrecht." },
      details: { en: "Metal detector: monument protection is a state matter – targeted searching almost everywhere needs a permit from the state heritage office (NFG); all states have a 'treasure law'. Strictest: Schleswig-Holstein. Nature reserves and national parks: no collecting.",
                 de: "Metalldetektor: Denkmalrecht ist Ländersache – gezielte Suche braucht fast überall eine Nachforschungsgenehmigung (NFG) des Landesdenkmalamts; alle Länder haben ein Schatzregal. Am strengsten: Schleswig-Holstein. Naturschutzgebiete und Nationalparks: tabu." },
      source: "orecast.app – Kurzlage Recht (Stand Sept. 2026), keine Rechtsberatung", link: "https://orecast.app/recht"
    },
    FR: {
      name: { en: "France", de: "Frankreich" }, level: "limited",
      rule: { en: "Hobby gold panning ('orpaillage de loisir') needs a permit from the département's DDT(M) (water police). Apply early – processing often takes 1–2 months. Valid for one département and one year; hand tools only (pan, shovel, sieve). Seasons e.g. Ariège 1 May – 31 Oct, Gard 16 May – 30 Nov (Gard: online form). Currently no permits in Brittany (Côtes-d'Armor, Morbihan, Finistère), Jura, Landes, Tarn-et-Garonne.",
              de: "Hobby-Goldwaschen („orpaillage de loisir“) braucht eine Bewilligung der DDT(M) des Départements (Police de l'eau). Früh beantragen – die Bearbeitung dauert oft 1–2 Monate. Gilt für ein Département und ein Jahr; nur Handwerkzeug (Pfanne, Schaufel, Sieb). Saisons z. B. Ariège 1. Mai – 31. Okt., Gard 16. Mai – 30. Nov. (Gard: Online-Formular). Zurzeit keine Bewilligungen in der Bretagne (Côtes-d'Armor, Morbihan, Finistère), im Jura, in den Landes und im Tarn-et-Garonne." },
      details: { en: "Off public rivers you also need the bank owner's consent. Metal detector: searching for objects of historical interest without an official permit is forbidden (Code du patrimoine) and enforced.",
                 de: "Ausserhalb öffentlicher Flüsse zusätzlich Zustimmung des Ufer-Eigentümers. Metalldetektor: Suche nach Objekten von historischem Interesse ohne behördliche Genehmigung verboten (Code du patrimoine) – wird ernst genommen." },
      source: "Präfekturen Ariège und Gard, prospection-de-loisir.fr (Nov. 2026), keine Rechtsberatung", link: "https://www.goldlineorpaillage.fr/adresse-faire-autorisations-orpaillage/"
    },
    IT: {
      name: { en: "Italy", de: "Italien" }, level: "limited",
      rule: { en: "Rules are regional. Piedmont (Elvo, Orba, Ticino, Dora Baltea): register in writing with the Region (Registro raccoglitori, L.R. 51/1995) – the certificate is your permit; hand tools only, no motors; max. 5 g gold per person and day; landowner's consent; forbidden in protected areas. Lombardy (L.R. 2/1989) and Aosta Valley (L.R. 10/2008): similar collector rules; Trentino: annual permit from the province.",
              de: "Regeln sind regional. Piemont (Elvo, Orba, Ticino, Dora Baltea): schriftliche Anmeldung bei der Region (Registro raccoglitori, L.R. 51/1995) – die Bestätigung ist die Erlaubnis; nur Handwerkzeug, keine Motoren; max. 5 g Gold pro Person und Tag; Zustimmung des Grundeigentümers; in Schutzgebieten verboten. Lombardei (L.R. 2/1989) und Aostatal (L.R. 10/2008): ähnliche Sammler-Regeln; Trentino: Jahresbewilligung der Provinz." },
      details: { en: "Strict country: cultural goods belong to the state; many regions also restrict taking minerals and fossils (Elba!). Metal detecting for antiquities is practically forbidden.",
                 de: "Strenges Land: Kulturgüter gehören dem Staat; viele Regionen beschränken auch Mineralien- und Fossilentnahme (Elba!). Detektorsuche nach Antiken praktisch verboten." },
      source: "Regionalgesetze (L.R. Piemonte 51/1995 u. a., via cercatorioroitalia.it) und orecast.app (Stand Nov. 2026)", link: "https://www.regione.piemonte.it/web/temi/sviluppo/attivita-estrattive/raccoglitori-ricercatori-minerali-scopo-collezionistico"
    },
    ES: {
      name: { en: "Spain", de: "Spanien" }, level: "limited",
      rule: { en: "Gold panning ('bateo') needs permission: rivers are public water domain, so ask the water authority of the basin (Confederación Hidrográfica, e.g. Miño-Sil, Cantábrico) and the region's mining authority; also fishing rules. Forbidden in protected areas. Navelgas (Asturias): ask the Museo del Oro first – they know the current rules; free panning zone during the national championship (end of July). Las Médulas: UNESCO – no digging.",
              de: "Goldwaschen („bateo“) braucht eine Erlaubnis: Flüsse sind öffentliches Wassergut – zuständig sind die Wasserbehörde des Flussgebiets (Confederación Hidrográfica, z. B. Miño-Sil, Cantábrico) und die Bergbaubehörde der Region; dazu Fischereiregeln. In Schutzgebieten verboten. Navelgas (Asturien): zuerst beim Museo del Oro fragen – die wissen, was aktuell gilt; freie Waschzone während der Meisterschaft (Ende Juli). Las Médulas: UNESCO – nicht graben." },
      details: { en: "Not an official source: please check with the Confederación Hidrográfica and the regional government before panning. Metal detecting is regulated by the regions (heritage law) and often needs a permit.",
                 de: "Keine amtliche Quelle: vor dem Waschen bei der Confederación Hidrográfica und der Regionalregierung nachfragen. Metalldetektor: von den Regionen geregelt (Denkmalrecht), meist genehmigungspflichtig." },
      source: "eigene Zusammenfassung (Nov. 2026), nicht amtlich geprüft"
    },
    UK: {
      name: { en: "United Kingdom", de: "Grossbritannien" }, level: "limited",
      rule: { en: "Gold belongs to the Crown; there is no national hobby licence. You need the landowner's permission or a local permit (Wanlockhead: Museum of Lead Mining; Kildonan: Suisgill Estate; Tyndrum: Strathfillan Community Development Trust). Wales: no panning on Natural Resources Wales land.",
              de: "Gold gehört der Krone; eine landesweite Hobby-Lizenz gibt es nicht. Man braucht die Erlaubnis des Grundbesitzers oder eine lokale Lizenz (Wanlockhead: Museum of Lead Mining; Kildonan: Suisgill Estate; Tyndrum: Strathfillan Community Development Trust). Wales: auf Land von Natural Resources Wales kein Goldwaschen." },
      details: { en: "Respect salmon spawning seasons and SSSI protected sites. Hand tools only.", de: "Lachs-Laichzeiten und Schutzgebiete (SSSI) beachten. Nur Handwerkzeug." },
      source: "ukgoldprospector.co.uk (2026), nicht amtlich", link: "https://ukgoldprospector.co.uk/news/gold-panning-laws-uk.html"
    },
    IE: {
      name: { en: "Ireland", de: "Irland" }, level: "limited",
      rule: { en: "Minerals belong to the state, but small hobby finds are tolerated. No motorised gear in waters; ask the landowner.",
              de: "Bodenschätze gehören dem Staat, kleine Hobby-Funde werden aber toleriert. Keine Motorgeräte in Gewässern; Grundeigentümer fragen." },
      source: "eigene Zusammenfassung (Nov. 2026), nicht amtlich geprüft"
    },
    FI: {
      name: { en: "Finland", de: "Finnland" }, level: "limited",
      rule: { en: "On state land a gold panning permit from Tukes is required (online, up to 10 years, annual report). On private land the owner's consent is enough. Lemmenjoki National Park: only designated areas with a permit. Easiest: tourist sites like Tankavaara.",
              de: "Auf Staatsland braucht es eine Goldwasch-Erlaubnis von Tukes (online, bis 10 Jahre, jährlicher Bericht). Auf Privatland reicht die Zustimmung des Eigentümers. Lemmenjoki-Nationalpark: nur in ausgewiesenen Gebieten mit Erlaubnis. Am einfachsten: Touristen-Waschplätze wie Tankavaara." },
      source: "Tukes, Metsähallitus (Nov. 2026)", link: "https://tukes.fi/en/mining-ore-prospecting-and-gold-panning/gold-panning"
    },
    SE: {
      name: { en: "Sweden", de: "Schweden" }, level: "limited",
      rule: { en: "Small-scale hobby panning normally needs no permit under the Minerals Act (SGU); refill holes and ask the landowner. Forbidden in nature reserves and national parks; motorised gear needs a permit.",
              de: "Kleines Hobby-Waschen braucht laut SGU normalerweise keine Bewilligung nach dem Mineralgesetz; Löcher wieder füllen und Grundeigentümer fragen. In Naturreservaten und Nationalparks verboten; Motorgeräte nur mit Bewilligung." },
      source: "detektorist.se, SGU-Auskunft (nicht amtlich geprüft)", link: "https://www.detektorist.se/vaska-guld-sverige-regler/"
    },
    CZ: {
      name: { en: "Czechia", de: "Tschechien" }, level: "limited",
      rule: { en: "Panning as a light hobby is tolerated: hand tools only, don't alter the riverbed, don't sell the gold. Forbidden in national parks, protected landscape areas (CHKO) and reserves.",
              de: "Waschen als einfaches Hobby ist geduldet: nur Handwerkzeug, Flussbett nicht verändern, Gold nicht verkaufen. In Nationalparks, Landschaftsschutzgebieten (CHKO) und Reservaten verboten." },
      source: "rawgold.eu (2025), nicht amtlich", link: "https://www.rawgold.eu/blog/50681-ryzovani-zlata-a-zakon-co-je-legalni-a-co-uz-je-tezba-2025"
    },
    SK: {
      name: { en: "Slovakia", de: "Slowakei" }, level: "limited",
      rule: { en: "Unclear – sources disagree whether hobby panning is free or needs a permit. Forbidden in national parks. Ask the municipality or river authority first.",
              de: "Unklar – die Quellen widersprechen sich, ob Hobby-Waschen frei ist oder eine Bewilligung braucht. In Nationalparks verboten. Vorher Gemeinde oder Gewässerverwalter fragen." },
      source: "rawgold.sk (2026), nicht amtlich", link: "https://www.rawgold.sk/post/60935-kde-ryzovat-zlato-na-slovensku"
    },
    PL: {
      name: { en: "Poland", de: "Polen" }, level: "limited",
      rule: { en: "Commonly described as allowed without permit in public waters (free access); landowner's consent on private land. Water law is not fully clear. Złotoryja offers courses and the Polish championship (end of May).",
              de: "Gilt meist als ohne Bewilligung erlaubt in öffentlichen Gewässern (freier Zugang); auf Privatgrund Zustimmung des Eigentümers. Wasserrecht nicht ganz eindeutig. In Złotoryja gibt es Kurse und die polnische Meisterschaft (Ende Mai)." },
      source: "eska.pl, polsatnews.pl (2025), nicht amtlich"
    },
    CH: {
      name: { en: "Switzerland", de: "Schweiz" }, level: "limited",
      rule: { en: "Rules differ per canton – switch on 'Gold panning rules per canton' (group Switzerland) and tap the map.",
              de: "Regeln je Kanton verschieden – Ebene „Goldwasch-Regeln pro Kanton“ (Gruppe Schweiz) einschalten und Karte antippen." },
      link: "https://www.goldwaschen.ch/gold-in-der-schweiz/kantonale-bestimmungen/"
    },
    PT: {
      name: { en: "Portugal", de: "Portugal" }, level: "limited",
      rule: { en: "Rules not checked – please ask locally (municipality, landowner, fishing authority) before panning. Avoid protected areas; hand tools only.", de: "Regeln nicht geprüft – vor dem Waschen bitte selbst vor Ort informieren (Gemeinde, Grundeigentümer, Fischerei-Aufsicht). Schutzgebiete meiden, nur Handwerkzeug." },
      source: "noch nicht recherchiert (Nov. 2026)"
    },
    RO: {
      name: { en: "Romania", de: "Rumänien" }, level: "limited",
      rule: { en: "Rules not checked – please ask locally (municipality, landowner, fishing authority) before panning. Avoid protected areas; hand tools only.", de: "Regeln nicht geprüft – vor dem Waschen bitte selbst vor Ort informieren (Gemeinde, Grundeigentümer, Fischerei-Aufsicht). Schutzgebiete meiden, nur Handwerkzeug." },
      source: "noch nicht recherchiert (Nov. 2026)"
    },
    SI: {
      name: { en: "Slovenia", de: "Slowenien" }, level: "limited",
      rule: { en: "Rules not checked – please ask locally (municipality, landowner, fishing authority) before panning. Avoid protected areas; hand tools only.", de: "Regeln nicht geprüft – vor dem Waschen bitte selbst vor Ort informieren (Gemeinde, Grundeigentümer, Fischerei-Aufsicht). Schutzgebiete meiden, nur Handwerkzeug." },
      source: "noch nicht recherchiert (Nov. 2026)"
    },
    HR: {
      name: { en: "Croatia", de: "Kroatien" }, level: "limited",
      rule: { en: "Rules not checked – please ask locally (municipality, landowner, fishing authority) before panning. Avoid protected areas; hand tools only.", de: "Regeln nicht geprüft – vor dem Waschen bitte selbst vor Ort informieren (Gemeinde, Grundeigentümer, Fischerei-Aufsicht). Schutzgebiete meiden, nur Handwerkzeug." },
      source: "noch nicht recherchiert (Nov. 2026)"
    },
    NO: {
      name: { en: "Norway", de: "Norwegen" }, level: "limited",
      rule: { en: "Rules not checked – please ask locally (municipality, landowner, fishing authority) before panning. Avoid protected areas; hand tools only.", de: "Regeln nicht geprüft – vor dem Waschen bitte selbst vor Ort informieren (Gemeinde, Grundeigentümer, Fischerei-Aufsicht). Schutzgebiete meiden, nur Handwerkzeug." },
      source: "noch nicht recherchiert (Nov. 2026)"
    },
    US: {
      name: { en: "USA (federal land)", de: "USA (Bundesland)" }, level: "open",
      rule: { en: "Same everywhere on federal land (BLM, National Forests): panning with pan, shovel and small hand tools is 'casual use' and usually needs no permit – but only on land without a mining claim. On a claim the minerals belong to the claimant: only with permission. Check claims with the 'BLM claims' layer.", de: "Auf Bundesland (BLM, National Forests) überall gleich: Waschen mit Pfanne, Schaufel und kleinem Handwerkzeug gilt als «casual use» und braucht meist keine Erlaubnis – aber nur auf Land ohne Mining Claim. Auf einem Claim gehören die Mineralien dem Claim-Besitzer: nur mit seiner Erlaubnis. Claims mit der Ebene «BLM-Claims» prüfen." },
      details: { en: "Closed: national parks (except special permits, e.g. Whiskeytown), wilderness areas, national monuments (often), Native American reservations, withdrawn areas. Never take artifacts (ARPA). Motorised gear (dredge, highbanker) needs state and sometimes federal permits; some eastern National Forests want a letter of authorisation even for panning. State land, state parks and private land: own rules – see the state.", de: "Gesperrt: Nationalparks (ausser mit Spezial-Erlaubnis, z. B. Whiskeytown), Wilderness-Gebiete, oft National Monuments, Indianerreservate, gesperrte (withdrawn) Gebiete. Nie Artefakte mitnehmen (ARPA). Motorgeräte (Dredge, Highbanker) brauchen Bewilligungen des Staats, teils auch des Bundes; einige National Forests im Osten wollen sogar fürs Waschen eine schriftliche Erlaubnis. Staatsland, State Parks und Privatland: eigene Regeln – siehe Bundesstaat." },
      source: "BLM, US Forest Service, NPS (Nov. 2026), keine Rechtsberatung", link: "https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals"
    },
    AU: {
      name: { en: "Australia", de: "Australien" }, level: "limited",
      rule: { en: "Every state has its own licence: Western Australia and Victoria – Miner's Right; Queensland – fossicking licence; NSW – landholder consent, permit for state forests; Northern Territory – fossicking permit; Tasmania – free in fossicking areas, else prospecting licence; South Australia – mostly no permit. Tenements (claims) only with the holder's consent.", de: "Jeder Bundesstaat hat seine eigene Lizenz: Western Australia und Victoria – Miner's Right; Queensland – Fossicking Licence; NSW – Zustimmung des Landbesitzers, Permit für State Forests; Northern Territory – Fossicking Permit; Tasmanien – in Fossicking Areas frei, sonst Prospecting Licence; South Australia – meist keine Erlaubnis. Tenements (Claims) nur mit Erlaubnis des Halters." },
      details: { en: "Forbidden almost everywhere: national parks, conservation parks, nature reserves; Aboriginal and exclusive native-title land only with permission. Hobby finds may be kept; selling or motorised mining needs a mining title.", de: "Fast überall verboten: Nationalparks, Conservation Parks, Naturreservate; Aboriginal Land und Native-Title-Gebiete mit exklusivem Besitz nur mit Erlaubnis. Hobby-Funde darf man behalten; Verkauf im grossen Stil oder Abbau mit Maschinen braucht einen Mining Title." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://detectormaps.com/au/fossicking-laws/"
    },
  },

  // Gold-Regeln pro US-Bundesstaat (Ebene «Gold-Regeln USA», Karte antippen). Schlüssel = Name in data/us/states.json
  usStateRules: {
    "Arizona": {
      name: { en: "Arizona", de: "Arizona" }, level: "limited",
      rule: { en: "Mostly BLM and National Forest land: panning and metal detecting are casual use, but almost every good area is claimed – check the 'BLM claims' layer. State Trust land (blue on land maps) is not public for prospecting: you need a permit from the Arizona State Land Department. Public panning area: Lynx Creek (Prescott NF).", de: "Meist BLM- und National-Forest-Land: Waschen und Detektor sind «casual use», aber fast jedes gute Gebiet ist geclaimt – Ebene «BLM-Claims» prüfen. State Trust Land ist zum Goldsuchen nicht öffentlich: Erlaubnis des Arizona State Land Department nötig. Öffentliches Waschgebiet: Lynx Creek (Prescott NF)." },
      details: { en: "Summer heat: detect in the cool season. Clubs (GPAA, local clubs like HGS) hold claims open to members.", de: "Sommerhitze: Detektor-Saison ist der Winter. Clubs (GPAA, lokale Clubs wie HGS) haben Claims für Mitglieder." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung", link: "https://land.az.gov/"
    },
    "California": {
      name: { en: "California", de: "California" }, level: "limited",
      rule: { en: "Hands and pans are allowed on most open federal land. Suction dredging is banned statewide. State parks: the gold pan is the only tool allowed (e.g. Auburn SRA). Many rivers are claimed – check first. Sluices or highbankers in a stream: ask the California Department of Fish and Wildlife first.", de: "Pfanne und Hände sind auf dem meisten offenen Bundesland erlaubt. Saugbagger (suction dredge) im ganzen Staat verboten. State Parks: nur die Goldpfanne als Werkzeug (z. B. Auburn SRA). Viele Flüsse sind geclaimt – vorher prüfen. Rinne oder Highbanker im Bach: vorher beim California Department of Fish and Wildlife nachfragen." },
      details: { en: "Public panning areas: Keyesville (Kern River), Merced River at Briceburg, Whiskeytown NRA ($1 permit).", de: "Öffentliche Waschgebiete: Keyesville (Kern River), Merced River bei Briceburg, Whiskeytown NRA (Erlaubnis 1 Dollar)." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung", link: "https://wildlife.ca.gov/Conservation/Environmental-Review/Suction-Dredge-Permitting"
    },
    "Nevada": {
      name: { en: "Nevada", de: "Nevada" }, level: "open",
      rule: { en: "Mostly BLM land: panning and detecting are casual use. Very many claims (Rye Patch, Winnemucca area) – check the 'BLM claims' layer.", de: "Fast nur BLM-Land: Waschen und Detektor sind «casual use». Sehr viele Claims (Rye Patch, Gegend Winnemucca) – Ebene «BLM-Claims» prüfen." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "Oregon": {
      name: { en: "Oregon", de: "Oregon" }, level: "limited",
      rule: { en: "Hand panning is allowed on open federal land and in four designated recreational areas (e.g. Butte Falls, Little Applegate). Claims on federal land are not open. No mining while salmon spawn. Motorised in-stream mining is heavily restricted in salmon habitat; suction dredges need a DEQ permit.", de: "Waschen von Hand auf offenem Bundesland und in vier ausgeschiedenen Hobby-Gebieten erlaubt (z. B. Butte Falls, Little Applegate). Claims auf Bundesland sind nicht offen. Nicht waschen, wenn Lachse laichen. Motorisiertes Goldwaschen im Bach ist in Lachs-Gewässern stark eingeschränkt; Saugbagger brauchen eine Bewilligung der DEQ." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung", link: "https://www.oregon.gov/dogami/milo/archive/HistoricalSociety/Josephine/OregonsHeritageRecreationalGoldPanning.pdf"
    },
    "Washington": {
      name: { en: "Washington", de: "Washington" }, level: "limited",
      rule: { en: "Follow the 'Gold and Fish' rules of the Washington Department of Fish and Wildlife: it sets which rivers are open, when (work windows) and which equipment is allowed. Hand panning outside the wetted stream is least restricted.", de: "Die Broschüre «Gold and Fish» des Washington Department of Fish and Wildlife ist massgebend: welche Flüsse offen sind, wann (Arbeitsfenster) und welches Gerät erlaubt ist. Waschen von Hand ausserhalb des Wassers ist am wenigsten eingeschränkt." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "Idaho": {
      name: { en: "Idaho", de: "Idaho" }, level: "open",
      rule: { en: "Hand panning on open federal land is casual use. Suction dredging needs a recreational dredge permit from the Idaho Department of Water Resources and an EPA permit.", de: "Waschen von Hand auf offenem Bundesland ist «casual use». Saugbagger brauchen eine Freizeit-Dredge-Bewilligung des Idaho Department of Water Resources und eine Bewilligung der EPA." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "Montana": {
      name: { en: "Montana", de: "Montana" }, level: "open",
      rule: { en: "Hand panning on open federal land is casual use; public panning areas e.g. Libby Creek (Kootenai NF). Motorised equipment needs state permits.", de: "Waschen von Hand auf offenem Bundesland ist «casual use»; öffentliche Waschgebiete z. B. Libby Creek (Kootenai NF). Motorgeräte brauchen Bewilligungen des Staats." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "Colorado": {
      name: { en: "Colorado", de: "Colorado" }, level: "open",
      rule: { en: "Hand panning and small sluices on open federal land are allowed (e.g. Cache Creek BLM area near Granite). Suction dredges with a nozzle over 4 inches need a permit.", de: "Waschen von Hand und kleine Rinnen auf offenem Bundesland erlaubt (z. B. BLM-Gebiet Cache Creek bei Granite). Saugbagger mit Düse über 4 Zoll brauchen eine Bewilligung." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "New Mexico": {
      name: { en: "New Mexico", de: "New Mexico" }, level: "limited",
      rule: { en: "Casual use on open BLM land. State Trust land needs a permit from the State Land Office.", de: "«Casual use» auf offenem BLM-Land. State Trust Land braucht eine Erlaubnis des State Land Office." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "Utah": {
      name: { en: "Utah", de: "Utah" }, level: "limited",
      rule: { en: "Casual use on open BLM land. State trust lands (SITLA) need a permit.", de: "«Casual use» auf offenem BLM-Land. Staatliches Trust Land (SITLA) braucht eine Erlaubnis." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "Wyoming": {
      name: { en: "Wyoming", de: "Wyoming" }, level: "open",
      rule: { en: "Casual use on open BLM and Forest Service land.", de: "«Casual use» auf offenem BLM- und Forest-Service-Land." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "Alaska": {
      name: { en: "Alaska", de: "Alaska" }, level: "limited",
      rule: { en: "Recreational panning is allowed with restrictions on some public land (e.g. Nome beach, Resurrection Creek, Dalton Highway creeks). Claims are everywhere – only with the owner's permission. The Trans-Alaska Pipeline corridor is closed.", de: "Hobby-Goldwaschen ist auf manchem öffentlichen Land mit Einschränkungen erlaubt (z. B. Strand von Nome, Resurrection Creek, Bäche am Dalton Highway). Überall Claims – nur mit Erlaubnis des Besitzers. Der Korridor der Alaska-Pipeline ist gesperrt." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung", link: "https://www.nps.gov/anch/planyourvisit/gold-panning.htm"
    },
    "South Dakota": {
      name: { en: "South Dakota", de: "South Dakota" }, level: "open",
      rule: { en: "Black Hills National Forest: hand panning needs no permit; motorised equipment or dredging needs a permit and bond.", de: "Black Hills National Forest: Waschen von Hand ohne Erlaubnis; Motorgeräte oder Saugbagger brauchen Erlaubnis und Kaution." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung", link: "https://www.fs.usda.gov/r02/blackhills/recreation/gold-panning-rockhounding-metal-detecting"
    },
    "Georgia": {
      name: { en: "Georgia", de: "Georgia" }, level: "limited",
      rule: { en: "Gold belt around Dahlonega. In the Chattahoochee National Forest ask the ranger district whether recreational panning is allowed (eastern forests may require a letter of authorisation). Easiest: commercial mines with panning.", de: "Goldgürtel um Dahlonega. Im Chattahoochee National Forest beim Ranger District fragen, ob Hobby-Waschen erlaubt ist (Wälder im Osten verlangen teils eine schriftliche Erlaubnis). Am einfachsten: Besucherminen mit Goldwaschen." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    },
    "North Carolina": {
      name: { en: "North Carolina", de: "North Carolina" }, level: "limited",
      rule: { en: "Mostly private land: ask the owner or use commercial panning sites (Reed Gold Mine, Cotton Patch …). In National Forests ask the ranger district first.", de: "Meist Privatland: Eigentümer fragen oder Bezahl-Waschplätze nutzen (Reed Gold Mine u. a.). In National Forests vorher beim Ranger District fragen." },
      source: "eigene Zusammenfassung aus BLM/USFS/Staats-Seiten (Nov. 2026), keine Rechtsberatung"
    }
  },

  // Gold-Regeln pro australischem Bundesstaat (Ebene «Gold-Regeln Australien», Karte antippen). Schlüssel = Name in data/au/states.json
  auStateRules: {
    "Western Australia": {
      name: { en: "Western Australia", de: "Western Australia" }, level: "limited",
      rule: { en: "Miner's Right required for all prospecting incl. metal detecting – apply online (about A$30). Covers Crown land incl. pastoral leases (inform the pastoralist). On tenements only with the holder's written consent; on an exploration licence a Section 40E permit (hand tools). Reserves closed. Check the 'WA tenements' layer before you go.", de: "Miner's Right für jede Suche nötig, auch mit dem Metalldetektor – online beantragen (ca. A$30 ≈ CHF 16). Gilt auf Crown Land inkl. Pastoral Leases (Pastoralisten informieren). Auf Tenements nur mit schriftlicher Erlaubnis des Halters; auf einer Exploration Licence mit Section-40E-Permit (Handwerkzeug). Reserven gesperrt. Vorher die Ebene «WA – Tenements» prüfen." },
      details: { en: "Miner's Right and 40E permit: Department of Mines (DEMIRS), online. Tours and hire in Kalgoorlie, Leonora, Coolgardie and Perth – see layer 'Hire & guided tours'.", de: "Miner's Right und 40E-Permit: Bergbaubehörde (DEMIRS), online. Touren und Verleih in Kalgoorlie, Leonora, Coolgardie und Perth – siehe Ebene «Verleih & geführte Touren»." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://www.wa.gov.au/service/natural-resources/mineral-resources/getting-miners-right"
    },
    "Victoria": {
      name: { en: "Victoria", de: "Victoria" }, level: "limited",
      rule: { en: "Miner's Right required (valid 10 years, about A$29, individuals only). Allowed on much Crown land and in many state forests; mostly not in national parks; some creeks closed (e.g. Creswick Creek). Private land only with consent.", de: "Miner's Right nötig (10 Jahre gültig, ca. A$29, nur für Personen). Erlaubt auf vielen Crown-Land-Flächen und in vielen State Forests; in Nationalparks meist nicht; einzelne Bäche gesperrt (z. B. Creswick Creek). Privatland nur mit Zustimmung." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://detectormaps.com/au/fossicking-laws/"
    },
    "Queensland": {
      name: { en: "Queensland", de: "Queensland" }, level: "limited",
      rule: { en: "Fossicking licence required (1 month, 6 months or 1 year). Without further permission only in designated fossicking areas and general permission areas; elsewhere written landholder consent.", de: "Fossicking Licence nötig (1 Monat, 6 Monate oder 1 Jahr). Ohne weitere Erlaubnis nur in Designated Fossicking Areas und General Permission Areas; sonst schriftliche Zustimmung des Landbesitzers." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://www.qld.gov.au/recreation/activities/areas-facilities/fossicking"
    },
    "New South Wales": {
      name: { en: "New South Wales", de: "New South Wales" }, level: "limited",
      rule: { en: "No general licence, but landholder consent. State forests: fossicking permit from Forestry Corporation (12 months, about A$27.50). National parks closed (incl. Hill End Historic Site). Fossicking districts are shown on MinView.", de: "Keine allgemeine Lizenz, aber Zustimmung des Landbesitzers. State Forests: Fossicking Permit der Forestry Corporation (12 Monate, ca. A$27.50). Nationalparks gesperrt (auch Hill End Historic Site). Fossicking Districts sind im MinView eingezeichnet." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://www.regional.nsw.gov.au/meg/exploration/fossicking"
    },
    "Northern Territory": {
      name: { en: "Northern Territory", de: "Northern Territory" }, level: "limited",
      rule: { en: "Fossicking permit required (sources disagree whether everywhere); declared fossicking areas such as Warrego near Tennant Creek. Aboriginal land only with permission.", de: "Fossicking Permit nötig (Quellen widersprechen sich, ob überall); ausgewiesene Fossicking Areas wie Warrego bei Tennant Creek. Aboriginal Land nur mit Erlaubnis." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://detectormaps.com/au/fossicking-laws/"
    },
    "South Australia": {
      name: { en: "South Australia", de: "South Australia" }, level: "open",
      rule: { en: "Recreational fossicking without intent to sell usually needs no permit. Ask the landholder; parks and reserves closed.", de: "Hobby-Fossicking ohne Verkaufsabsicht braucht meist keine Erlaubnis. Landbesitzer fragen; Parks und Reserven gesperrt." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://detectormaps.com/au/fossicking-laws/"
    },
    "Tasmania": {
      name: { en: "Tasmania", de: "Tasmania" }, level: "limited",
      rule: { en: "No licence inside the 11 declared fossicking areas (all of them gem areas); for gold elsewhere a prospecting licence from Mineral Resources Tasmania.", de: "In den ausgewiesenen Fossicking Areas ohne Lizenz; anderswo Prospecting Licence von Mineral Resources Tasmania." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung", link: "https://www.mrt.tas.gov.au/prospecting_and_fossicking/fossicking_areas"
    },
    "Australian Capital Territory": {
      name: { en: "Australian Capital Territory", de: "Australian Capital Territory" }, level: "closed",
      rule: { en: "No public fossicking areas.", de: "Keine öffentlichen Fossicking-Gebiete." },
      source: "Behörden WA/QLD/NSW und detectormaps.com (Nov. 2026), keine Rechtsberatung"
    }
  },

  overlays: [
    {
      id: "geology",
      group: "general",
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
      group: "us",
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
      group: "us",
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
      id: "lidar",
      group: "us",
      type: "exportImage",           // Bild wird für jede Kachel vom ArcGIS-Bildserver berechnet
      name: { en: "LiDAR / terrain (USGS 3DEP)", de: "LiDAR / Gelände (USGS 3DEP)" },
      url: "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage",
      attribution: "Elevation: USGS 3DEP",
      opacity: 0.7,
      visible: false,
      offline: false,
      // Ansichten (Auswahl im Ebenen-Fenster); id = Name der Darstellung auf dem USGS-Server
      modes: [
        { id: "Hillshade Multidirectional", name: { en: "Shaded relief (all directions) – best for old workings", de: "Schummerung (alle Richtungen) – am besten für alte Schürfungen" } },
        { id: "Hillshade Gray", name: { en: "Shaded relief (light from NW)", de: "Schummerung (Licht von Nordwest)" } },
        { id: "Hillshade Elevation Tinted", name: { en: "Shaded relief with height colors", de: "Schummerung mit Höhenfarben" } },
        { id: "Slope Map", name: { en: "Slope (steepness)", de: "Hangneigung (Steilheit)" } },
        { id: "Aspect Map", name: { en: "Aspect (facing direction)", de: "Hangrichtung" } },
        { id: "Contour Smoothed 25", name: { en: "Contour lines (25 ft)", de: "Höhenlinien (25 ft)" }, format: "png32" }
      ]
    },
    {
      id: "usSpots",
      group: "us",
      type: "spots",
      name: { en: "Known gold places & public panning areas (USA)", de: "Bekannte Goldplätze & öffentliche Waschgebiete (USA)" },
      // Liste ergänzen: tools/make_goldspots.py (US_SPOTS)
      file: "data/goldspots-us.geojson",
      attribution: "Gold places: MAUSIBOX collection",
      visible: false, offline: true,
      kinds: {
        free:   { color: "#2ecc40", level: "open",    label: { en: "Public land / panning area – no claim, casual use", de: "Öffentliches Land / Waschgebiet – ohne Claim, «casual use»" } },
        permit: { color: "#ff9800", level: "limited", label: { en: "Permit needed", de: "Erlaubnis nötig" } },
        club:   { color: "#00bfa5", level: "limited", label: { en: "Club claims – members only", de: "Club-Claims – nur für Mitglieder" } },
        site:   { color: "#2f80ed", level: "open",    label: { en: "Fee panning / visitor mine", de: "Bezahl-Waschplatz / Besuchermine" } },
        show:   { color: "#9b51e0", level: "limited", label: { en: "Museum / historic site", de: "Museum / historische Stätte" } },
        unclear: { color: "#9e9e9e", level: "limited", label: { en: "Access not confirmed – check locally", de: "Zugang nicht bestätigt – vor Ort prüfen" } }
      },
      legend: [
        { color: "#2ecc40", text: { en: "public area", de: "öffentlich" } },
        { color: "#ff9800", text: { en: "permit", de: "Erlaubnis" } },
        { color: "#00bfa5", text: { en: "club claims", de: "Club-Claims" } },
        { color: "#2f80ed", text: { en: "fee site", de: "Bezahl-Platz" } },
        { color: "#9b51e0", text: { en: "museum", de: "Museum" } },
        { color: "#9e9e9e", text: { en: "not confirmed", de: "nicht bestätigt" } }
      ]
    },
    {
      id: "usRules",
      group: "us",
      type: "countryRules",
      name: { en: "Gold rules USA & per state (tap the map)", de: "Gold-Regeln USA & pro Bundesstaat (Karte antippen)" },
      bordersUrl: "data/us/states.json",
      codeProp: "name", rulesKey: "usStateRules", alsoCountry: "US",
      visible: false, offline: true
    },
    {
      id: "landStatus",
      group: "us",
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
      group: "us",
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
    // ---------- NEUSEELAND (live von NZ Petroleum & Minerals – Änderungen erscheinen automatisch) ----------
    {
      id: "nzFossick",
      group: "nz",
      type: "areaPolygons",
      // tägliche Kopie der NZP&M-Daten (tools/update_nz.py) – lädt auf jedem Gerät und offline
      file: "data/nz/fossick.geojson", metaFile: "data/nz/meta.json",
      name: { en: "NZ – Gold fossicking areas (public)", de: "NZ – Gold-Fossicking-Gebiete (öffentlich)" },
      url: "https://gis.nzpam.govt.nz/server/rest/services/Public/Permits_Minerals_Layers/MapServer/1/query",
      where: "Permit_Type_Code='Gold Fossicking Area'",
      outFields: "OBJECTID,Operation_Name,Permit_Number,Permit_Location,Permit_Area,Permit_Expiry_Date",
      attribution: "NZ Petroleum & Minerals",
      minZoom: 4, cellZ: 4, simplify: 0.00005,
      color: "#00e676", fillOpacity: 0.3,
      centerDot: true,             // die Gebiete sind klein: zusätzlich ein Punkt, damit man sie findet
      visible: false, offline: false,
      popup: {
        title: "Operation_Name", level: "open",
        verdict: { en: "Public: gold fossicking without a permit (hand tools, pans, sluice boxes – check the rules)", de: "Öffentlich: Gold suchen ohne Genehmigung (Handwerkzeug, Pfanne, Sluice – Regeln beachten)" },
        fields: [
          { field: "Permit_Location", label: { en: "Region", de: "Region" } },
          { field: "Permit_Area", label: { en: "Area", de: "Fläche" }, unit: "ha" },
          { field: "Permit_Expiry_Date", label: { en: "Valid until", de: "Gültig bis" }, date: true }
        ],
        link: { url: "https://gis.nzpam.govt.nz/PermitWebmaps/Content/GFA/GFA{Permit_Number}.pdf", text: { en: "Official map & rules (PDF)", de: "Offizielle Karte & Regeln (PDF)" } },
        hint: { en: "Official data from NZ Petroleum & Minerals. Read the rules in the PDF before you go.", de: "Offizielle Daten von NZ Petroleum & Minerals. Vor dem Besuch die Regeln im PDF lesen." }
      }
    },
    {
      id: "nzPermits",
      group: "nz",
      type: "areaPolygons",
      // tägliche Kopie der NZP&M-Daten (tools/update_nz.py) – lädt auf jedem Gerät und offline
      file: "data/nz/permits.geojson", metaFile: "data/nz/meta.json",
      name: { en: "NZ – Mining permits (\"claims\")", de: "NZ – Bergbau-Genehmigungen („Claims“)" },
      url: "https://gis.nzpam.govt.nz/server/rest/services/Public/Permits_Minerals_Layers/MapServer/1/query",
      where: "Permit_Type_Code<>'Gold Fossicking Area'",
      outFields: "OBJECTID,Permit_Number,Permit_Type_Description,Minerals,Owners,Operator,Operation_Name,Permit_Location,Permit_Area,Permit_Grant_Date,Permit_Expiry_Date",
      attribution: "NZ Petroleum & Minerals",
      minZoom: 7, cellZ: 7, simplify: 0.0003,
      color: "#e02020", fillOpacity: 0.15,
      visible: false, offline: false,
      popup: {
        title: "Operation_Name", level: "closed",
        verdict: { en: "Permit area – no fossicking without the permit holder's OK", de: "Genehmigungsgebiet – nicht suchen ohne Erlaubnis des Inhabers" },
        fields: [
          { field: "Permit_Type_Description", label: { en: "Type", de: "Art" } },
          { field: "Permit_Number", label: { en: "Permit no.", de: "Nummer" } },
          { field: "Minerals", label: { en: "Minerals", de: "Rohstoffe" } },
          { field: "Owners", label: { en: "Holder", de: "Inhaber" } },
          { field: "Operator", label: { en: "Operator", de: "Betreiber" } },
          { field: "Permit_Area", label: { en: "Area", de: "Fläche" }, unit: "ha" },
          { field: "Permit_Grant_Date", label: { en: "Granted", de: "Erteilt" }, date: true },
          { field: "Permit_Expiry_Date", label: { en: "Expires", de: "Läuft ab" }, date: true }
        ],
        link: { url: "https://www.nzpam.govt.nz/maps-geoscience/minerals-webmaps", text: { en: "NZP&M permit map", de: "Karte der Genehmigungen (NZP&M)" } }
      }
    },
    {
      id: "nzApplications",
      group: "nz",
      type: "areaPolygons",
      // tägliche Kopie der NZP&M-Daten (tools/update_nz.py) – lädt auf jedem Gerät und offline
      file: "data/nz/applications.geojson", metaFile: "data/nz/meta.json",
      name: { en: "NZ – Permit applications", de: "NZ – Anträge für Genehmigungen" },
      url: "https://gis.nzpam.govt.nz/server/rest/services/Public/Permits_Minerals_Layers/MapServer/0/query",
      outFields: "*",
      attribution: "NZ Petroleum & Minerals",
      minZoom: 7, cellZ: 7, simplify: 0.0003,
      color: "#f5a623", fillOpacity: 0.12,
      visible: false, offline: false,
      popup: {
        title: "Application_ID", level: "limited",
        verdict: { en: "Application pending – may soon become a permit area", de: "Antrag läuft – wird evtl. bald Genehmigungsgebiet" },
        fields: [
          { field: "Permit_Type_Description", label: { en: "Type", de: "Art" } },
          { field: "Minerals", label: { en: "Minerals", de: "Rohstoffe" } },
          { field: "Owners", label: { en: "Applicant", de: "Antragsteller" } },
          { field: "Submitted_Date", label: { en: "Submitted", de: "Eingereicht" }, date: true },
          { field: "Permit_Location", label: { en: "Region", de: "Region" } }
        ]
      }
    },
    {
      id: "nzSchedule4",
      group: "nz",
      type: "areaPolygons",
      // tägliche Kopie der NZP&M-Daten (tools/update_nz.py) – lädt auf jedem Gerät und offline
      file: "data/nz/schedule4.geojson", metaFile: "data/nz/meta.json",
      name: { en: "NZ – Schedule 4 land (mining restricted)", de: "NZ – Schedule-4-Land (Bergbau eingeschränkt)" },
      url: "https://gis.nzpam.govt.nz/server/rest/services/Public/CMA_Schedule_4_Land/MapServer/0/query",
      outFields: "OBJECTID,name",
      attribution: "NZ Petroleum & Minerals",
      minZoom: 5, cellZ: 5, simplify: 0.002,
      color: "#8e24aa", fillOpacity: 0.15,
      visible: false, offline: false,
      popup: {
        title: "name", level: "closed",
        verdict: { en: "National parks, reserves, sanctuaries …: mining access restricted – fossicking usually not allowed", de: "Nationalparks, Reservate, Schutzgebiete …: Bergbau-Zugang eingeschränkt – Gold suchen meist nicht erlaubt" },
        fields: []
      }
    },
    {
      id: "nzGold",
      group: "nz",
      type: "arcgisExport",          // Kartenbild direkt vom ArcGIS-Server (GNS erlaubt den Abruf)
      name: { en: "NZ – Gold occurrences (GNS, 1400+ sites)", de: "NZ – Goldvorkommen (GNS, über 1400 Fundstellen)" },
      url: "https://gis.gns.cri.nz/server/rest/services/NZL_CriticalMinerals/Critical_minerals_in_Geological_Resource_Map_of_NZ__GERM_/MapServer",
      show: "9",
      attribution: "GNS Science (GERM)",
      opacity: 1, visible: false, offline: false,
      arcIdentify: {
        layers: "visible:9", tolerance: 10, title: "site_name",
        fields: [
          { field: "site_type_name", label: { en: "Type", de: "Art" } },
          { field: "commodities", label: { en: "Minerals", de: "Rohstoffe" } },
          { field: "e_number", label: { en: "Map ref.", de: "Kartenblatt" } }
        ]
      }
    },
    {
      id: "nzLidar",
      group: "nz",
      type: "exportImage",           // Schummerung des 8-m-Höhenmodells, ganz Neuseeland
      name: { en: "NZ – Terrain shaded relief (GNS, 8 m)", de: "NZ – Gelände-Schummerung (GNS, 8 m)" },
      url: "https://gis.gns.cri.nz/server/rest/services/topography/nz_dtm_shade/ImageServer/exportImage",
      attribution: "GNS Science, LINZ",
      opacity: 0.7, visible: false, offline: false
    },
    {
      id: "nzFaults",
      group: "nz",
      type: "arcgisExport",
      name: { en: "NZ – Active faults (GNS)", de: "NZ – Aktive Störungen (GNS)" },
      url: "https://gis.gns.cri.nz/server/rest/services/Active_Faults/WebNZActiveFaultsDatasets/MapServer",
      show: "0,6",
      attribution: "GNS Science – NZ Active Faults Database",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:0,6", tolerance: 6, max: 2 }
    },
    {
      id: "nzGeology",
      group: "nz",
      type: "arcgisExport",
      name: { en: "NZ – Geological map 1:250 000 (GNS)", de: "NZ – Geologische Karte 1:250 000 (GNS)" },
      url: "https://gis.gns.cri.nz/server/rest/services/NZL_GNS_250K_Geology_2023/NZL_GNS_250K_geology_WMS/MapServer",
      attribution: "GNS Science – QMAP",
      opacity: 0.55, visible: false, offline: false,
      arcIdentify: { layers: "top", tolerance: 2, max: 2 }
    },
    // ---------- EUROPA (EU-weit) ----------
    {
      id: "auSpots",
      group: "au",
      type: "spots",
      name: { en: "Gold areas Australia (Golden Triangle, Goldfields …)", de: "Goldgebiete Australien (Goldenes Dreieck, Goldfields …)" },
      // Liste ergänzen: tools/make_goldspots.py (AU_SPOTS)
      file: "data/goldspots-au.geojson",
      attribution: "Gold areas: MAUSIBOX collection",
      visible: false, offline: true,
      kinds: {
        crown:   { color: "#2ecc40", level: "open",    label: { en: "Crown land with state licence – check tenements", de: "Crown Land mit Lizenz des Staats – Tenements prüfen" } },
        fossick: { color: "#2f80ed", level: "open",    label: { en: "Declared fossicking area", de: "Ausgewiesene Fossicking Area" } },
        licence: { color: "#ff9800", level: "limited", label: { en: "Prospecting licence needed", de: "Prospecting Licence nötig" } },
        show:    { color: "#9b51e0", level: "limited", label: { en: "Museum / historic site", de: "Museum / historische Stätte" } },
        closed:  { color: "#e02020", level: "closed",  label: { en: "Prospecting not allowed", de: "Suchen nicht erlaubt" } }
      },
      legend: [
        { color: "#2ecc40", text: { en: "Crown land + licence", de: "Crown Land + Lizenz" } },
        { color: "#2f80ed", text: { en: "fossicking area", de: "Fossicking Area" } },
        { color: "#ff9800", text: { en: "licence needed", de: "Lizenz nötig" } },
        { color: "#9b51e0", text: { en: "museum", de: "Museum" } },
        { color: "#e02020", text: { en: "closed", de: "gesperrt" } }
      ]
    },
    {
      id: "auServices",
      group: "au",
      type: "spots",
      name: { en: "Detector hire, shops & guided tours (Australia)", de: "Detektor-Verleih, Läden & geführte Touren (Australien)" },
      file: "data/services-au.geojson",
      hint: "serviceHint",
      attribution: "Services: MAUSIBOX collection",
      visible: false, offline: true,
      kinds: {
        hire: { color: "#ff9800", level: "open", label: { en: "Detector hire / prospecting shop", de: "Detektor-Verleih / Prospecting-Laden" } },
        tour: { color: "#00bfa5", level: "open", label: { en: "Guided tours / courses", de: "Geführte Touren / Kurse" } }
      },
      legend: [
        { color: "#ff9800", text: { en: "hire / shop", de: "Verleih / Laden" } },
        { color: "#00bfa5", text: { en: "tours", de: "Touren" } }
      ]
    },
    {
      id: "auRules",
      group: "au",
      type: "countryRules",
      name: { en: "Gold rules & licences per state (tap the map)", de: "Gold-Regeln & Lizenzen pro Bundesstaat (Karte antippen)" },
      bordersUrl: "data/au/states.json",
      codeProp: "name", rulesKey: "auStateRules", alsoCountry: "AU",
      visible: false, offline: true
    },
    {
      id: "auTenements",
      group: "auwa",
      type: "arcgisExport",
      name: { en: "WA – Tenements (claims, live & pending, DEMIRS)", de: "WA – Tenements (Claims, aktiv & beantragt, DEMIRS)" },
      url: "https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer",
      show: "3",
      attribution: "Mining tenements: DEMIRS / SLIP (WA)",
      opacity: 0.8, visible: false, offline: false,
      arcIdentify: { layers: "visible:3", tolerance: 2, max: 3, title: "fmt_tenid",
        fields: [ { field: "type", label: { en: "Type", de: "Art" } }, { field: "tenstatus", label: { en: "Status", de: "Status" } },
                  { field: "holder1", label: { en: "Holder", de: "Halter" } }, { field: "holder2", label: { en: "Holder 2", de: "Halter 2" } },
                  { field: "grantdate", label: { en: "Granted", de: "Erteilt" } }, { field: "enddate", label: { en: "Expires", de: "Läuft ab" } } ] }
    },
    {
      id: "auTenDead",
      group: "auwa",
      type: "arcgisExport",
      name: { en: "WA – Dead tenements (ground may be open again – check live ones)", de: "WA – Erloschene Tenements (evtl. wieder frei – aktive prüfen)" },
      url: "https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer",
      show: "15",
      attribution: "Mining tenements: DEMIRS / SLIP (WA)",
      opacity: 0.6, visible: false, offline: false,
      arcIdentify: { layers: "visible:15", tolerance: 2, max: 3, title: "fmt_tenid",
        fields: [ { field: "type", label: { en: "Type", de: "Art" } }, { field: "tenstatus", label: { en: "Status", de: "Status" } },
                  { field: "deathreason", label: { en: "Reason", de: "Grund" } }, { field: "enddate", label: { en: "Ended", de: "Beendet" } } ] }
    },
    {
      id: "auMinedex",
      group: "auwa",
      type: "arcgisExport",
      name: { en: "WA – Mines & deposits (MINEDEX)", de: "WA – Minen & Lagerstätten (MINEDEX)" },
      url: "https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer",
      show: "0",
      attribution: "MINEDEX: DEMIRS / SLIP (WA)",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:0", tolerance: 8, max: 3, title: "site_title",
        fields: [ { field: "site_commo", label: { en: "Commodities", de: "Rohstoffe" } }, { field: "site_type_", label: { en: "Type", de: "Art" } },
                  { field: "site_stage", label: { en: "Stage", de: "Stand" } }, { field: "proj_title", label: { en: "Project", de: "Projekt" } } ] }
    },
    {
      id: "auDrill",
      group: "auwa",
      type: "arcgisExport",
      name: { en: "WA – Drill holes & old exploration (WAMEX, zoom in)", de: "WA – Bohrlöcher & alte Exploration (WAMEX, hineinzoomen)" },
      url: "https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer",
      show: "28,35",
      attribution: "WAMEX: DEMIRS / SLIP (WA)",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:28,35", tolerance: 6, max: 3, title: "HOLEID",
        fields: [ { field: "HOLETYPE", label: { en: "Hole type", de: "Bohrart" } }, { field: "MAXDEPTH", label: { en: "Depth (m)", de: "Tiefe (m)" } },
                  { field: "TARGET_COMMODITY", label: { en: "Target", de: "Ziel" } }, { field: "OPERATOR", label: { en: "Company", de: "Firma" } },
                  { field: "PROJECT", label: { en: "Project", de: "Projekt" } }, { field: "PERIOD_TO", label: { en: "Drilled until", de: "Gebohrt bis" } },
                  { field: "ANUMBER", label: { en: "Report (A-no.)", de: "Bericht (A-Nr.)" } },
                  { field: "ACTIVITYTY", label: { en: "Activity", de: "Tätigkeit" } }, { field: "ELEMENTS", label: { en: "Elements", de: "Elemente" } },
                  { field: "WAMEX_A_NO", label: { en: "Report (A-no.)", de: "Bericht (A-Nr.)" } } ] }
    },
    {
      id: "auGeology",
      group: "auwa",
      type: "arcgisExport",
      name: { en: "WA – Bedrock geology 1:500k / 1:100k (GSWA)", de: "WA – Gesteinsgeologie 1:500 000 / 1:100 000 (GSWA)" },
      url: "https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Geology_and_Soils_Map/MapServer",
      show: "21,4",
      attribution: "Geology: GSWA / DEMIRS",
      opacity: 0.55, visible: false, offline: false,
      arcIdentify: { layers: "visible:21,4", tolerance: 0, max: 1, title: "unitname",
        fields: [ { field: "descriptn", label: { en: "Description", de: "Beschreibung" } }, { field: "code", label: { en: "Code", de: "Code" } },
                  { field: "greenstone", label: { en: "Greenstone belt", de: "Grünsteingürtel" } } ] }
    },
    {
      id: "auFaults",
      group: "auwa",
      type: "arcgisExport",
      name: { en: "WA – Faults & linear structures (GSWA)", de: "WA – Störungen & Strukturlinien (GSWA)" },
      url: "https://services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Geology_and_Soils_Map/MapServer",
      show: "1,23",
      attribution: "Structures: GSWA / DEMIRS",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:1,23", tolerance: 5, max: 2, title: "feature",
        fields: [ { field: "type", label: { en: "Type", de: "Art" } }, { field: "name", label: { en: "Name", de: "Name" } } ] }
    },
    {
      id: "auGold",
      group: "au",
      type: "wms",
      name: { en: "Gold deposits & occurrences, all Australia (Geoscience Australia)", de: "Goldlagerstätten & -vorkommen ganz Australien (Geoscience Australia)" },
      url: "https://services.ga.gov.au/gis/earthresource/wms",
      layers: "ama:MineralDeposits,ama:MineralOccurrences",
      params: { CQL_FILTER: "COMMODITY_CODES LIKE '%Au%';COMMODITY_CODES LIKE '%Au%'" },
      attribution: "Mineral deposits: Geoscience Australia (CC BY 4.0)",
      opacity: 1, visible: false, offline: false,
      wmsInfo: { layers: "ama:MineralDeposits,ama:MineralOccurrences", max: 3, titles: ["DEPOSIT_NAME", "OCCURRENCE_NAME"],
        fields: [ { field: "OPERATING_STATUS", label: { en: "Status", de: "Status" } }, { field: "COMMODITY_NAMES", label: { en: "Commodities", de: "Rohstoffe" } },
                  { field: "PROVINCES", label: { en: "Province", de: "Provinz" } }, { field: "ACCURACY_M", label: { en: "Accuracy (m)", de: "Genauigkeit (m)" } } ] }
    },
    {
      id: "auMag",
      group: "au",
      type: "wms",
      name: { en: "Magnetics Australia (Geoscience Australia)", de: "Magnetik Australien (Geoscience Australia)" },
      url: "https://services.ga.gov.au/gis/geophysical-grids/wms",
      attribution: "Magnetic Anomaly Map of Australia: Geoscience Australia (CC BY 4.0)",
      opacity: 0.6, visible: false, offline: false,
      modes: [
        { id: "tmi", layers: "geophys:tmi_hsi_v2_white", name: { en: "Total magnetic intensity (colour)", de: "Magnetische Totalintensität (farbig)" } },
        { id: "1vd", layers: "geophys:magmap_v7_2019_1VD", name: { en: "First vertical derivative – shows structures and greenstone lines", de: "1. Ableitung – zeigt Strukturen und Grünsteinzüge" } },
        { id: "rtp", layers: "geophys:magmap_v7_2019_RTP", name: { en: "Reduced to pole", de: "Polreduziert" } }
      ]
    },
    {
      id: "qldTenements",
      group: "auqld",
      type: "arcgisExport",
      name: { en: "QLD – Claims, mining leases & exploration permits", de: "QLD – Claims, Mining Leases & Explorationsgebiete" },
      url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Economy/MinesPermitsCurrent/MapServer",
      show: "31,38,1",
      attribution: "Resource authorities: State of Queensland",
      opacity: 0.8, visible: false, offline: false,
      arcIdentify: { layers: "visible:31,38,1", tolerance: 2, max: 3, title: "Permit number",
        fields: [ { field: "Permit type", label: { en: "Type", de: "Art" } }, { field: "Permit status", label: { en: "Status", de: "Status" } },
                  { field: "Authorised holder name", label: { en: "Holder", de: "Halter" } }, { field: "Expiry date", label: { en: "Expires", de: "Läuft ab" } } ] }
    },
    {
      id: "qldMines",
      group: "auqld",
      type: "arcgisExport",
      name: { en: "QLD – Mines, old workings & mineral occurrences (MINOCC)", de: "QLD – Minen, alte Abbaue & Vorkommen (MINOCC)" },
      url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/GeoscientificInformation/MiningResources/MapServer",
      show: "14,15,16,17",
      attribution: "MINOCC: State of Queensland",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:14,15,16,17", tolerance: 8, max: 3, title: "Occurrence name",
        fields: [ { field: "Main commodity", label: { en: "Commodity", de: "Rohstoff" } }, { field: "Mine status", label: { en: "Status", de: "Status" } },
                  { field: "Work extent", label: { en: "Workings", de: "Abbau" } }, { field: "site locality", label: { en: "Location", de: "Lage" } } ] }
    },
    {
      id: "qldShafts",
      group: "auqld",
      type: "arcgisExport",
      name: { en: "QLD – Old shafts, pits & shallow workings (abandoned mines)", de: "QLD – Alte Schächte, Gruben & Schürfstellen (verlassene Minen)" },
      url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/GeoscientificInformation/AbandonedMines/MapServer",
      show: "45,65,75,85,105,110",
      attribution: "Abandoned mines: State of Queensland",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:45,65,75,85,105,110", tolerance: 6, max: 3, title: "Mine Name",
        fields: [ { field: "Type", label: { en: "Type", de: "Art" } }, { field: "Commodity", label: { en: "Commodity", de: "Rohstoff" } },
                  { field: "Remediation Status", label: { en: "Made safe", de: "Gesichert" } } ] }
    },
    {
      id: "qldDrill",
      group: "auqld",
      type: "arcgisExport",
      name: { en: "QLD – Mineral drill holes", de: "QLD – Mineral-Bohrlöcher" },
      url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/GeoscientificInformation/Boreholes/MapServer",
      show: "6",
      attribution: "Boreholes: State of Queensland",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:6", tolerance: 6, max: 3, title: "Bore Name",
        fields: [ { field: "Operator", label: { en: "Company", de: "Firma" } }, { field: "Total Depth Driller (m)", label: { en: "Depth (m)", de: "Tiefe (m)" } },
                  { field: "Subtype", label: { en: "Type", de: "Art" } }, { field: "Data Link", label: { en: "Data", de: "Daten" } } ] }
    },
    {
      id: "qldGeology",
      group: "auqld",
      type: "arcgisExport",
      name: { en: "QLD – Detailed geology 1:100k", de: "QLD – Detaillierte Geologie 1:100 000" },
      url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/GeoscientificInformation/GeologyDetailed/MapServer",
      show: "17",
      attribution: "Geology: State of Queensland",
      opacity: 0.55, visible: false, offline: false,
      arcIdentify: { layers: "visible:17", tolerance: 0, max: 1, title: "Rock Unit Name",
        fields: [ { field: "Lithological Summary", label: { en: "Rock", de: "Gestein" } }, { field: "Age", label: { en: "Age", de: "Alter" } },
                  { field: "Dominant Rock", label: { en: "Main rock", de: "Hauptgestein" } } ] }
    },
    {
      id: "qldFaults",
      group: "auqld",
      type: "arcgisExport",
      name: { en: "QLD – Faults & shear zones", de: "QLD – Störungen & Scherzonen" },
      url: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/GeoscientificInformation/GeologyDetailed/MapServer",
      show: "4",
      attribution: "Geology: State of Queensland",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:4", tolerance: 5, max: 2 }
    },
    {
      id: "nswTenements",
      group: "ausouth",
      type: "wms",
      name: { en: "NSW – Mining & exploration titles", de: "NSW – Bergbau- & Explorationstitel (Claims)" },
      url: "https://gs.geoscience.nsw.gov.au/geoserver/ows",
      layers: "mt:MineralTenement",
      attribution: "Titles: NSW Resources (Geological Survey of NSW)",
      opacity: 0.7, visible: false, offline: false,
      wmsInfo: { layers: "mt:MineralTenement", max: 3, buffer: 2, title: "name",
        fields: [ { field: "tenementType", label: { en: "Type", de: "Art" } }, { field: "status", label: { en: "Status", de: "Status" } },
                  { field: "owner", label: { en: "Holder", de: "Halter" } }, { field: "commodity", label: { en: "Commodity", de: "Rohstoff" } },
                  { field: "expireDate", label: { en: "Expires", de: "Läuft ab" } } ] }
    },
    {
      id: "nswDrill",
      group: "ausouth",
      type: "wms",
      name: { en: "NSW – Drill holes", de: "NSW – Bohrlöcher" },
      url: "https://gs.geoscience.nsw.gov.au/geoserver/ows",
      layers: "gsmlp:BoreholeView",
      attribution: "Boreholes: Geological Survey of NSW",
      opacity: 1, visible: false, offline: false
    },
    {
      id: "vicTenements",
      group: "ausouth",
      type: "wms",
      name: { en: "Victoria – Mineral tenements (picture only, no tap info)", de: "Victoria – Tenements/Claims (nur Bild, Antippen ohne Angaben)" },
      url: "https://geology.data.vic.gov.au/nvcl/ows",
      layers: "mt:MineralTenement",
      attribution: "Tenements: Geological Survey of Victoria",
      opacity: 0.7, visible: false, offline: false
    },
    {
      id: "vicMinOcc",
      group: "ausouth",
      type: "wms",
      name: { en: "Victoria – Mineral occurrences & drill holes", de: "Victoria – Vorkommen & Bohrlöcher" },
      url: "https://geology.data.vic.gov.au/nvcl/ows",
      layers: "mo:MinOccView,gsmlp:BoreholeView",
      attribution: "Geological Survey of Victoria",
      opacity: 1, visible: false, offline: false
    },
    {
      id: "saTenements",
      group: "ausouth",
      type: "wms",
      name: { en: "SA – Mineral claims, leases & exploration licences", de: "SA – Mineral Claims, Leases & Explorationslizenzen" },
      url: "https://services.sarig.sa.gov.au/vector/wms",
      layers: "mineral_tenements:mineral_and_or_opal_exploration_licence,mineral_tenements:mineral_leases,mineral_tenements:mineral_claims,mineral_tenements:private_mines",
      attribution: "SARIG: Government of South Australia",
      opacity: 0.7, visible: false, offline: false
    },
    {
      id: "saGold",
      group: "ausouth",
      type: "wms",
      name: { en: "SA – Gold mines & occurrences, old diggings", de: "SA – Gold-Minen & -Vorkommen, alte Schürfstellen" },
      url: "https://services.sarig.sa.gov.au/vector/wms",
      layers: "mines_and_mineral_deposits:all_diggings,mines_and_mineral_deposits:gold",
      attribution: "SARIG: Government of South Australia",
      opacity: 1, visible: false, offline: false
    },
    {
      id: "tasGeology",
      group: "ausouth",
      type: "arcgisExport",
      name: { en: "Tasmania – Geology 1:250k / 1:25k", de: "Tasmanien – Geologie 1:250 000 / 1:25 000" },
      url: "https://services.thelist.tas.gov.au/arcgis/rest/services/Public/GeologicalAndSoils/MapServer",
      show: "14,13,16,15",
      attribution: "Geology: Mineral Resources Tasmania (theLIST)",
      opacity: 0.55, visible: false, offline: false,
      arcIdentify: { layers: "visible:14,16", tolerance: 0, max: 1, title: "DESCRIPTION",
        fields: [ { field: "PERIOD", label: { en: "Period", de: "Zeitalter" } }, { field: "REGION", label: { en: "Region", de: "Region" } } ] }
    },
    {
      id: "euSpots",
      group: "eu",
      type: "spots",
      name: { en: "Known gold panning places (Europe)", de: "Bekannte Goldwaschplätze (Europa)" },
      // Liste ergänzen: tools/make_goldspots.py
      file: "data/goldspots.geojson",
      attribution: "Gold panning places: MAUSIBOX collection",
      visible: false, offline: true,
      kinds: {
        free:   { color: "#2ecc40", level: "open",    label: { en: "Usually tolerated – rules still apply", de: "Meist geduldet – Regeln trotzdem beachten" } },
        permit: { color: "#ff9800", level: "limited", label: { en: "Permit / registration needed", de: "Bewilligung / Anmeldung nötig" } },
        site:   { color: "#2f80ed", level: "open",    label: { en: "Official panning site / guided – easiest legal start", de: "Offizieller Waschplatz / geführt – einfachster legaler Einstieg" } },
        show:   { color: "#9b51e0", level: "limited", label: { en: "Show mine / museum – panning on your own: check rules", de: "Schaubergwerk / Museum – selbst waschen: Regeln klären" } },
        closed: { color: "#e02020", level: "closed",  label: { en: "Look only – no digging", de: "Nur ansehen – nicht graben" } },
        unclear: { color: "#9e9e9e", level: "limited", label: { en: "Rules not checked – ask locally", de: "Regeln nicht geprüft – selbst vor Ort informieren" } }
      },
      legend: [
        { color: "#2ecc40", text: { en: "usually tolerated", de: "meist geduldet" } },
        { color: "#ff9800", text: { en: "permit needed", de: "Bewilligung nötig" } },
        { color: "#2f80ed", text: { en: "official site", de: "offizieller Waschplatz" } },
        { color: "#9b51e0", text: { en: "show mine", de: "Schaubergwerk" } },
        { color: "#e02020", text: { en: "no digging", de: "nicht graben" } },
        { color: "#9e9e9e", text: { en: "rules not checked", de: "Regeln nicht geprüft" } }
      ]
    },
    {
      id: "euRules",
      group: "eu",
      type: "countryRules",
      name: { en: "Gold rules per country (tap the map)", de: "Gold-Regeln pro Land (Karte antippen)" },
      bordersUrl: "https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_RG_60M_2020_4326.geojson",
      attribution: "Borders: © EuroGeographics (GISCO)",
      visible: false, offline: false
    },
    {
      id: "euPrecious",
      group: "eu",
      type: "wms",
      name: { en: "Precious metal occurrences Europe (EGDI) – France, Italy …", de: "Edelmetall-Vorkommen Europa (EGDI) – Frankreich, Italien …" },
      url: "https://maps.europe-geology.eu/wms/", layers: "egdi_mineraloccurr_precious_metals",
      attribution: "EuroGeoSurveys – EGDI",
      opacity: 1, visible: false, offline: false
    },
    {
      id: "euMines",
      group: "eu",
      type: "wms",
      name: { en: "Mines with raw materials Europe (EGDI)", de: "Bergwerke mit Rohstoffen Europa (EGDI)" },
      url: "https://maps.europe-geology.eu/wms/", layers: "egdi_mines_with_commodities",
      attribution: "EuroGeoSurveys – EGDI",
      opacity: 1, visible: false, offline: false
    },
    {
      id: "euNatura2000",
      group: "eu",
      type: "arcgisExport",
      name: { en: "Natura 2000 protected sites (EU)", de: "Natura-2000-Schutzgebiete (EU)" },
      url: "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer",
      attribution: "EEA – Natura 2000",
      opacity: 0.6, visible: false, offline: false,
      arcIdentify: { layers: "visible", tolerance: 0, max: 1, title: "SITENAME",
        fields: [ { field: "SITECODE", label: { en: "Site code", de: "Gebietsnummer" } }, { field: "MS", label: { en: "Country", de: "Land" } },
                  { field: "Area_km2", label: { en: "Area (km²)", de: "Fläche (km²)" } } ] }
    },
    {
      id: "euNatDA",
      group: "eu",
      type: "arcgisExport",
      name: { en: "National parks & nature reserves (EU, national lists)", de: "Nationalparks & Naturschutzgebiete (EU, nationale Listen)" },
      url: "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/NatDAv24_Dyna_WM/MapServer",
      attribution: "EEA – Nationally designated areas",
      opacity: 0.6, visible: false, offline: false,
      arcIdentify: { layers: "visible", tolerance: 0, max: 2 }
    },
    {
      id: "euGeology",
      group: "eu",
      type: "wms",
      name: { en: "Geology Europe 1:1 million (EGDI)", de: "Geologie Europa 1:1 Mio. (EGDI)" },
      url: "https://maps.europe-geology.eu/wms/", layers: "geologicunitview",
      attribution: "EuroGeoSurveys – EGDI",
      opacity: 0.55, visible: false, offline: false
    },
    // ---------- DEUTSCHLAND (BGR) ----------
    {
      id: "deGeology",
      group: "eux",
      type: "wms",
      name: { en: "🇩🇪 Geology Germany 1:250 000 (BGR, zoom in)", de: "🇩🇪 Geologie Deutschland 1:250 000 (BGR, hineinzoomen)" },
      url: "https://services.bgr.de/wms/geologie/guek250/",
      attribution: "© BGR",
      opacity: 0.6, visible: false, offline: false,
      modes: [
        { id: "strat", layers: "7,8", name: { en: "Age of rocks (stratigraphy)", de: "Alter der Gesteine (Stratigrafie)" } },
        { id: "petro", layers: "4,5", name: { en: "Rock types (petrography)", de: "Gesteinsarten (Petrografie)" } },
        { id: "genese", layers: "1,2", name: { en: "Origin (genesis)", de: "Entstehung (Genese)" } },
        { id: "quartz", layers: "10", name: { en: "Quartz veins – gold indicator", de: "Quarzgänge – Hinweis auf Gold" } },
        { id: "tekt", layers: "11", name: { en: "Faults & tectonics", de: "Störungen & Tektonik" } }
      ]
    },
    // ---------- SPANIEN (IGME) ----------
    {
      id: "esGold",
      group: "eux",
      type: "arcgisPoints",
      name: { en: "🇪🇸 Gold occurrences Spain (IGME, ~880)", de: "🇪🇸 Goldvorkommen Spanien (IGME, ca. 880)" },
      url: "https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0",
      where: "Sustancia LIKE '%Oro%'",
      outFields: "Nombre_mina,Sustancia,Provincia,Municipio,Morfologia,Asociacion_mineral",
      color: "#ffd700", radius: 7,
      attribution: "IGME – BDMIN",
      visible: false, offline: false,
      popup: { title: "Nombre_mina", fields: [
        { field: "Sustancia", label: { en: "Minerals", de: "Rohstoffe" } },
        { field: "Morfologia", label: { en: "Form", de: "Form" } },
        { field: "Municipio", label: { en: "Municipality", de: "Gemeinde" } },
        { field: "Provincia", label: { en: "Province", de: "Provinz" } } ] }
    },
    {
      id: "esGeology",
      group: "eux",
      type: "arcgisExport",
      name: { en: "🇪🇸 Geology Spain 1:50 000 (IGME MAGNA)", de: "🇪🇸 Geologie Spanien 1:50 000 (IGME MAGNA)" },
      url: "https://mapas.igme.es/gis/rest/services/Cartografia_Geologica/IGME_MAGNA_50/MapServer",
      attribution: "IGME – MAGNA 50",
      opacity: 0.6, visible: false, offline: false,
      arcIdentify: { layers: "top", tolerance: 2, max: 2 }
    },
    // ---------- ÖSTERREICH (GeoSphere Austria) ----------
    {
      id: "atGold",
      group: "eux",
      type: "arcgisPoints",
      name: { en: "🇦🇹 Gold occurrences Austria (GeoSphere IRIS, ~400)", de: "🇦🇹 Goldvorkommen Österreich (GeoSphere IRIS, ca. 400)" },
      url: "https://gis.geosphere.at/maps/rest/services/IRIS/Lagerstaetten/MapServer/0",
      where: "HAUPTROHSTOFF LIKE '%Gold%' OR WERTSTOFFE LIKE '%Gold%'",
      outFields: "VORK_NAME,HAUPTROHSTOFF,WERTSTOFFE,MINERALIEN,STATUS_TXT,GBA_BETR_DAUER,ART_TXT",
      color: "#ffd700", radius: 8,
      attribution: "GeoSphere Austria – IRIS",
      visible: false, offline: false,
      popup: { title: "VORK_NAME", fields: [
        { field: "HAUPTROHSTOFF", label: { en: "Main raw material", de: "Hauptrohstoff" } },
        { field: "WERTSTOFFE", label: { en: "Valuable minerals", de: "Wertstoffe" } },
        { field: "MINERALIEN", label: { en: "Minerals", de: "Mineralien" } },
        { field: "STATUS_TXT", label: { en: "Status", de: "Status" } },
        { field: "GBA_BETR_DAUER", label: { en: "Mined", de: "Betrieb" } } ] }
    },
    {
      id: "atDeposits",
      group: "eux",
      type: "arcgisExport",
      name: { en: "🇦🇹 All deposits & old mines Austria (IRIS)", de: "🇦🇹 Alle Lagerstätten & alten Bergbaue Österreich (IRIS)" },
      url: "https://gis.geosphere.at/maps/rest/services/IRIS/Lagerstaetten/MapServer",
      show: "0",
      attribution: "GeoSphere Austria – IRIS",
      opacity: 1, visible: false, offline: false,
      arcIdentify: { layers: "visible:0", tolerance: 8, max: 3, title: "VORK_NAME",
        fields: [ { field: "HAUPTROHSTOFF", label: { en: "Main raw material", de: "Hauptrohstoff" } }, { field: "WERTSTOFFE", label: { en: "Valuable minerals", de: "Wertstoffe" } },
                  { field: "STATUS_TXT", label: { en: "Status", de: "Status" } } ] }
    },
    {
      id: "atGeology",
      group: "eux",
      type: "arcgisExport",
      name: { en: "🇦🇹 Geology & tectonics Austria 1:500 000 (GeoSphere)", de: "🇦🇹 Geologie & Tektonik Österreich 1:500 000 (GeoSphere)" },
      url: "https://gis.geosphere.at/maps/rest/services/geologie/karte_500/MapServer",
      attribution: "GeoSphere Austria",
      opacity: 0.55, visible: false, offline: false,
      arcIdentify: { layers: "visible", tolerance: 3, max: 2, title: "LEGTEXT_DE",
        fields: [ { field: "ALTER_DE", label: { en: "Age", de: "Alter" } }, { field: "LITHOL_DE", label: { en: "Rock", de: "Gestein" } } ] }
    },
    // ---------- SCHWEIZ (Bundesdaten geo.admin.ch – live) ----------
    {
      id: "chRelief",
      group: "ch",
      type: "wms",
      name: { en: "LiDAR relief swissALTI3D (swisstopo)", de: "LiDAR-Relief swissALTI3D (swisstopo)" },
      url: "https://wms.geo.admin.ch/",
      attribution: "© swisstopo",
      opacity: 0.7, visible: false, offline: false,
      modes: [
        { id: "multi", layers: "ch.swisstopo.swissalti3d-reliefschattierung", name: { en: "Ground, light from all directions – best for old workings", de: "Boden, Licht von allen Seiten – am besten für alte Schürfungen" } },
        { id: "mono", layers: "ch.swisstopo.swissalti3d-reliefschattierung_monodirektional", name: { en: "Ground, light from NW", de: "Boden, Licht von Nordwest" } },
        { id: "surface", layers: "ch.swisstopo.swisssurface3d-reliefschattierung-multidirektional", name: { en: "Surface with trees and buildings", de: "Oberfläche mit Bäumen und Gebäuden" } }
      ]
    },
    {
      id: "chGeology",
      group: "ch",
      type: "wms",
      name: { en: "Geology (swisstopo)", de: "Geologie (swisstopo)" },
      url: "https://wms.geo.admin.ch/",
      attribution: "© swisstopo",
      opacity: 0.6, visible: false, offline: false,
      modes: [
        { id: "geocover", layers: "ch.swisstopo.geologie-geocover", name: { en: "Detailed geology 1:25 000 (GeoCover)", de: "Geologie genau 1:25 000 (GeoCover)" },
          identify: { layers: "all:ch.swisstopo.geologie-geocover", tolerance: 0, title: "litho_de", sub: { en: "Geology (GeoCover)", de: "Geologie (GeoCover)" },
            fields: [ { field: "chrono_de", label: { en: "Age", de: "Alter" } }, { field: "orig_description_de", label: { en: "Description", de: "Beschreibung" } } ],
            link: { field: "erl_num", text: { en: "Explanations (PDF)", de: "Erläuterungen (PDF)" } } } },
        { id: "gk500", layers: "ch.swisstopo.geologie-geologische_karte", name: { en: "Geological map 1:500 000", de: "Geologische Karte 1:500 000" } },
        { id: "tecto", layers: "ch.swisstopo.geologie-tektonische_karte", name: { en: "Tectonics 1:500 000", de: "Tektonik 1:500 000" } },
        { id: "tectolines", layers: "ch.swisstopo.geologie-swissgeocover2d_tecto_lines", name: { en: "Faults & tectonic lines (detailed)", de: "Störungen & tektonische Linien (genau)" } }
      ]
    },
    {
      id: "chAeromag",
      group: "ch",
      type: "wms",
      name: { en: "Aeromagnetics Switzerland (swisstopo)", de: "Aeromagnetik Schweiz (swisstopo)" },
      url: "https://wms.geo.admin.ch/",
      layers: "ch.swisstopo.geologie-geophysik-aeromagnetische_karte_schweiz,ch.swisstopo.geologie-geophysik-aeromagnetische_karte_jura",
      attribution: "© swisstopo",
      opacity: 0.6, visible: false, offline: false
    },
    {
      id: "chGold",
      group: "ch",
      type: "wms",
      name: { en: "Gold & ore occurrences (swisstopo) – gold = big yellow dots", de: "Gold- & Erzvorkommen (swisstopo) – Gold = grosse gelbe Punkte" },
      url: "https://wms.geo.admin.ch/",
      layers: "ch.swisstopo.geologie-rohstoffe-vererzungen",
      attribution: "© swisstopo / ETH Georessourcen",
      opacity: 1,
      visible: false, offline: false,
      // Goldfundstellen zusätzlich als grosse gelbe Punkte
      points: {
        url: "https://api3.geo.admin.ch/rest/services/api/MapServer/find?layer=ch.swisstopo.geologie-rohstoffe-vererzungen&searchText=Gold&searchField=grkind_de&contains=true&returnGeometry=true&geometryFormat=geojson&sr=4326",
        radius: 9, color: "#ffd700",
        linkText: { en: "Details (ETH georesources)", de: "Details (ETH Georessourcen)" }
      },
      identify: {
        layers: "all:ch.swisstopo.geologie-rohstoffe-vererzungen", tolerance: 12,
        title: "label", sub: { en: "Ore occurrence", de: "Erzvorkommen" },
        fields: [ { field: "grkind_de", label: { en: "Raw material", de: "Rohstoff" } } ],
        link: { field: "purl", text: { en: "Details (ETH georesources)", de: "Details (ETH Georessourcen)" } }
      }
    },
    {
      id: "chProtected",
      group: "ch",
      type: "wms",
      name: { en: "Protected areas (floodplains, nature reserves, national park …)", de: "Schutzgebiete (Auen, Naturschutz, Nationalpark …)" },
      url: "https://wms.geo.admin.ch/",
      layers: "ch.bafu.bundesinventare-auen,ch.pronatura.naturschutzgebiete,ch.bafu.bundesinventare-jagdbanngebiete,ch.bafu.bundesinventare-vogelreservate,ch.bafu.schutzgebiete-schweizerischer_nationalpark",
      attribution: "© BAFU, Pro Natura",
      opacity: 0.6,
      visible: false, offline: false,
      identify: {
        // der Nationalpark lässt sich nicht abfragen (nur anzeigen)
        layers: "all:ch.bafu.bundesinventare-auen,ch.pronatura.naturschutzgebiete,ch.bafu.bundesinventare-jagdbanngebiete,ch.bafu.bundesinventare-vogelreservate",
        tolerance: 0, title: "label", subField: "layerName", level: "closed",
        verdict: { en: "Protected area – gold panning usually not allowed", de: "Schutzgebiet – Goldwaschen meist nicht erlaubt" }
      }
    },
    {
      id: "chCantons",
      group: "ch",
      type: "wms",
      name: { en: "Gold panning rules per canton (tap the map)", de: "Goldwasch-Regeln pro Kanton (Karte antippen)" },
      url: "https://wms.geo.admin.ch/",
      layers: "ch.swisstopo.swissboundaries3d-kanton-flaeche.fill",
      attribution: "© swisstopo",
      opacity: 0.35,
      visible: false, offline: false,
      identify: { layers: "all:ch.swisstopo.swissboundaries3d-kanton-flaeche.fill", tolerance: 0, cantonRules: true }
    },
    {
      id: "blm",
      group: "us",
      type: "blmClaims",
      name: { en: "BLM mining claims (active)", de: "BLM Mining Claims (aktiv)" },
      url: "https://nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer/1/query",
      attribution: "Mining claims: BLM MLRS",
      minZoom: 12,                 // BLM liefert Claims erst ab dieser Zoomstufe
      color: "#e02020",
      fillOpacity: 0.15,
      recentFilter: "new",         // Auswahl im Ebenen-Fenster: alle / nur neue der letzten Tage (blmWatch)
      // Link zur offiziellen BLM-Fallseite (Inhaber, Gebühren). {SF_ID} wird ersetzt.
      detailsLink: "https://mlrs.blm.gov/s/blm-case/{SF_ID}",
      visible: true,
      offline: true
    },
    {
      id: "blmClosed",
      group: "us",
      type: "blmClaims",
      name: { en: "BLM mining claims (closed)", de: "BLM Mining Claims (geschlossen)" },
      url: "https://nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer/2/query",
      attribution: "Mining claims: BLM MLRS",
      minZoom: 12,
      color: "#ffffff",            // weiss gestrichelt – gut sichtbar auf Satellit und Karte
      fillOpacity: 0.08,
      recentFilter: "closed",      // Auswahl: alle / nur in den letzten Tagen abgelaufene
      dashArray: "4 4",            // gestrichelt
      detailsLink: "https://mlrs.blm.gov/s/blm-case/{SF_ID}",
      visible: false,
      offline: false
    },
    {
      id: "club",
      group: "general",
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
      id: "clubs",
      group: "general",
      type: "spots",
      name: { en: "Prospecting clubs & associations (join for claims)", de: "Goldsucher-Clubs & Vereine (Mitglied werden für Claims)" },
      // Liste ergänzen: tools/make_goldspots.py (CLUBS)
      file: "data/clubs.geojson",
      hint: "clubHint",
      attribution: "Clubs: MAUSIBOX collection",
      visible: false, offline: true,
      kinds: {
        national: { color: "#d500f9", level: "open",    label: { en: "Nationwide club / association", de: "Landesweiter Club / Verband" } },
        claims:   { color: "#00bfa5", level: "open",    label: { en: "Club with its own claims", de: "Club mit eigenen Claims" } },
        club:     { color: "#80cbc4", level: "limited", label: { en: "Club / chapter – ask about claims", de: "Club / Chapter – nach Claims fragen" } }
      },
      legend: [
        { color: "#d500f9", text: { en: "nationwide", de: "landesweit" } },
        { color: "#00bfa5", text: { en: "own claims", de: "eigene Claims" } },
        { color: "#80cbc4", text: { en: "club", de: "Club" } }
      ]
    },
    {
      id: "myclaims",
      group: "general",
      type: "userClaims",
      name: { en: "Claims & posts (own / club)", de: "Claims & Pfosten (eigene / Club)" },
      privateColor: "#ff8c00",     // eigene, private Claims
      foreignColor: "#c03cc0",     // fremde Claims, die man für sich festhält
      clubColor: "#00c8e0",        // mit dem Club geteilte Claims (wenn der Club unten keine eigene Farbe hat)
      clubForeignColor: "#ff4fa0", // fremde Claims, die mit dem Club geteilt sind
      postsMinZoom: 15,            // Pfosten erst ab dieser Zoomstufe zeigen
      visible: true
    },
    {
      id: "mrds",
      group: "us",
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
      group: "us",
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
      layers: "Layers", basemap: "Base map", overlays: "Layers", search: "Search", searchPlaceholder: "Place, town, country or coordinates", searchGo: "Search", searchHint: "Examples: Kalgoorlie · Napf · Switzerland · -30.75, 121.47 · 34°48'N 114°24'W · 11S 736512 3854320", searchNone: "Nothing found.", searchWest: "West (e.g. USA)", searchEast: "East (e.g. Australia, Europe)", flyingTo: "Flying to", coordinates: "Coordinates",
      gps: "My location", addPoint: "Add point", points: "My points", menu: "Menu",
      zoomInFor: "Zoom in to see", zoomInMore: "Zoom in closer to see this layer", dataDate: "Data as of", updating: "New version – loading…", goldRules: "Gold rules", spotFind: "What you find", spotPermit: "Permit / where to ask", spotPermitLink: "Permit: form / office", spotLocalLink: "Local contact (museum / panning site)", spotHint: "Approximate location (town / river section). Ask locally before panning.", clubJoin: "Website / join", serviceHint: "Location = town; exact address on the website.", clubHint: "Location = club seat (town), not the claims. Fees and claims change – check the club website.", loading: "Loading…", loadError: "Could not load",
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
      usernameRule: "3–30 characters: letters A–Z, digits, . _ - (no spaces, no accents)", usernameInvalid: "Username not valid: use 3–30 letters A–Z, digits or . _ - only (no spaces, no accents). Example: harvey_m", passwordRule: "At least 8 characters",
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
      confirmDeleteTrack: "Delete this route?", weakGps: "GPS too inaccurate – waiting…", gpsGap: "No GPS – keep screen on!", syncGot: "Synced from your other devices", exportTypeGpx: "Export these routes (GPX)",
      allRoutes: "All routes", trackDetails: "Route",

      // Parkplatz
      parking: "Parking spot", parkSaved: "Parking spot saved", parkHint: "Long-press the P button to save where you are as parking spot.",
      parkNoGps: "No current GPS position yet – please wait a moment and try again.", parkFromYou: "from you",
      parkSavedAt: "Saved", navigate: "Navigate (Apple Maps)", deletePark: "Delete parking spot", parkDeleted: "Parking spot deleted",

      // Club-Umschalter, Hilfe, Verwaltung
      activeClub: "Show club", allClubs: "All my clubs", chat: "Club chat", chatEmpty: "No messages yet – write the first one!", chatPlaceholder: "Message to all club members…", chatSend: "Send", blmChanges: "BLM changes (new / closed)", blmNews: "{n} BLM change(s) in your area – menu → BLM changes", blmNew: "New claims", blmClosedRecent: "Closed claims", blmSeen: "noticed", blmChangesIntro: "Changes of the last {days} days in: {areas}. The app compares the active BLM claims once a day.", blmFilterAll: "show all", blmFilterNew: "only new (last 30 days)", blmFilterClosed: "only closed in the last 30 days", extraClubs: "Also join these clubs", layerGroupActive: "on", cantonRules: "Gold panning rules", fishClosed: "Fish closed season", rulesSource: "Source", clubDotHint: "Tap to zoom in", clubDotClaims: "claims", lidarMode: "View", help: "Help – how it works",
      addMember: "Add person", addMemberHint: "Username of an existing account", userNotFound: "No account with this username.",
      memberAdded: "Added to club", userClubs: "Clubs", assignClub: "Add to club",
      dirs: "N,NE,E,SE,S,SW,W,NW"
    },
    de: {
      layers: "Ebenen", basemap: "Grundkarte", overlays: "Ebenen", search: "Suchen", searchPlaceholder: "Ort, Stadt, Land oder Koordinaten", searchGo: "Suchen", searchHint: "Beispiele: Kalgoorlie · Napf · Schweiz · -30.75, 121.47 · 34°48'N 114°24'W · 11S 736512 3854320", searchNone: "Nichts gefunden.", searchWest: "West (z. B. USA)", searchEast: "Ost (z. B. Australien, Europa)", flyingTo: "Fliege nach", coordinates: "Koordinaten",
      gps: "Mein Standort", addPoint: "Punkt setzen", points: "Meine Punkte", menu: "Menü",
      zoomInFor: "Hineinzoomen für", zoomInMore: "Näher hineinzoomen, um diese Ebene zu sehen", dataDate: "Datenstand", updating: "Neue Version – wird geladen…", goldRules: "Gold-Regeln", spotFind: "Was man findet", spotPermit: "Bewilligung / wo fragen", spotPermitLink: "Bewilligung: Formular / Stelle", spotLocalLink: "Anlaufstelle vor Ort (Museum / Waschplatz)", spotHint: "Ungefähre Lage (Ort / Flussabschnitt). Vor dem Waschen vor Ort nachfragen.", clubJoin: "Website / Mitglied werden", serviceHint: "Lage = Ort; genaue Adresse auf der Website.", clubHint: "Lage = Sitz des Clubs (Ort), nicht die Claims. Beiträge und Claims ändern sich – auf der Club-Website nachsehen.", loading: "Lade…", loadError: "Laden fehlgeschlagen",
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
      usernameRule: "3–30 Zeichen: Buchstaben A–Z, Ziffern, . _ - (keine Leerzeichen, keine Umlaute)", usernameInvalid: "Benutzername ungültig: nur 3–30 Buchstaben A–Z, Ziffern oder . _ - (keine Leerzeichen, keine Umlaute). Beispiel: harvey_m", passwordRule: "Mindestens 8 Zeichen",
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
      confirmDeleteTrack: "Diese Strecke löschen?", weakGps: "GPS zu ungenau – warte…", gpsGap: "Kein GPS – Bildschirm an lassen!", syncGot: "Von deinen anderen Geräten geholt", exportTypeGpx: "Diese Strecken exportieren (GPX)",
      allRoutes: "Alle Strecken", trackDetails: "Strecke",

      // Parkplatz
      parking: "Parkplatz", parkSaved: "Parkplatz gespeichert", parkHint: "P-Knopf lange drücken, um den jetzigen Standort als Parkplatz zu speichern.",
      parkNoGps: "Noch keine aktuelle GPS-Position – bitte kurz warten und nochmals versuchen.", parkFromYou: "von dir",
      parkSavedAt: "Gespeichert", navigate: "Hinführen (Apple Karten)", deletePark: "Parkplatz löschen", parkDeleted: "Parkplatz gelöscht",

      // Club-Umschalter, Hilfe, Verwaltung
      activeClub: "Club anzeigen", allClubs: "Alle meine Clubs", chat: "Club-Chat", chatEmpty: "Noch keine Nachrichten – schreib die erste!", chatPlaceholder: "Nachricht an alle Club-Mitglieder…", chatSend: "Senden", blmChanges: "BLM-Änderungen (neu / abgelaufen)", blmNews: "{n} BLM-Änderung(en) in deinem Gebiet – Menü → BLM-Änderungen", blmNew: "Neue Claims", blmClosedRecent: "Abgelaufene Claims", blmSeen: "bemerkt", blmChangesIntro: "Änderungen der letzten {days} Tage in: {areas}. Die App vergleicht einmal täglich die aktiven BLM-Claims.", blmFilterAll: "alle zeigen", blmFilterNew: "nur neue (letzte 30 Tage)", blmFilterClosed: "nur in den letzten 30 Tagen abgelaufene", extraClubs: "Zusätzlich diesen Clubs beitreten", layerGroupActive: "an", cantonRules: "Goldwasch-Regeln", fishClosed: "Fisch-Schonzeit", rulesSource: "Quelle", clubDotHint: "Antippen zum Hineinzoomen", clubDotClaims: "Claims", lidarMode: "Ansicht", help: "Hilfe – so funktioniert's",
      addMember: "Person hinzufügen", addMemberHint: "Benutzername eines bestehenden Kontos", userNotFound: "Kein Konto mit diesem Benutzernamen.",
      memberAdded: "Zum Club hinzugefügt", userClubs: "Clubs", assignClub: "Zu Club hinzufügen",
      dirs: "N,NO,O,SO,S,SW,W,NW"
    }
  }
};

/*
 * Hilfe im Menü: kurze Beschreibung aller Funktionen (Deutsch und Englisch).
 * Jeder Abschnitt: [Titel, Text]. Text darf einfache HTML-Zeichen wie <b> und <br> enthalten.
 */
var Help = (function () {
  var TEXT = {
    de: [
      ["Die Knöpfe rechts", "<b>Ebenen</b> (oben): Grundkarte wählen, Ebenen ein/aus, Transparenz mit dem Regler, Club wählen.<br>" +
        "<b>Fadenkreuz</b>: zu deinem Standort springen (blauer Punkt).<br>" +
        "<b>＋ (gelb)</b>: Punkt an deinem Standort setzen.<br>" +
        "<b>Weg</b> (Wellenlinie): Weg aufzeichnen.<br>" +
        "<b>P</b>: Parkplatz – lange drücken speichert, kurz tippen zeigt ihn.<br>" +
        "<b>Stecknadel</b>: Liste deiner Punkte.<br><b>☰</b>: Menü."],
      ["Karte antippen", "Zeigt die Koordinaten und alles, was an dieser Stelle liegt: BLM-Claims, Club-Claims, deine Claims, " +
        "Landbesitz, Schutzgebiete und – wenn eingeschaltet – Gestein und Störungen. Lange auf die Karte drücken setzt einen Punkt genau dort."],
      ["BLM-Claims: aktiv und geschlossen", "Im Ebenen-Fenster zwei Schalter: <b>aktiv</b> (rot) und <b>geschlossen</b> (grau gestrichelt). " +
        "Claims erscheinen erst, wenn man nahe genug hineinzoomt. Die Flächen sind nur ungefähr (Viertel-Viertel-Sektionen), keine vermessenen Grenzen. " +
        "Der Link im Popup führt zur offiziellen BLM-Seite mit dem Inhaber. Bei geschlossenen Claims ist das Land vielleicht wieder frei – vor dem Graben prüfen."],
      ["Wo darf ich suchen?", "<b>Landbesitz</b> färbt das Land nach Besitzer (gelb = BLM, blau = Staatsland, grün = Forest Service …). " +
        "Antippen zeigt, was dort meistens gilt.<br><b>Schutzgebiete & Sperrzonen</b>: rot = meist verboten (Nationalpark, Wildschutzgebiet, Wilderness, Reservat, Militär), " +
        "orange = eingeschränkt.<br>Das ist eine Orientierung, keine Rechtsauskunft. Im Zweifel bei der Behörde nachfragen."],
      ["Wege aufzeichnen", "Weg-Knopf antippen und wählen: <b>Fahrt</b>, <b>Gehen</b> oder <b>Metalldetektor</b>. Oben läuft die Anzeige mit Strecke und Zeit. " +
        "Nochmals antippen: Pause, Weiter oder <b>Beenden & speichern</b>.<br>Metalldetektor-Wege werden als breites Band in Suchbreite (Schwenkbreite) gezeichnet – " +
        "so siehst du, welche Fläche schon abgesucht ist (Suchbreite im Speichern-Fenster einstellbar, Standard 1 m).<br>" +
        "<b>Wichtig:</b> Bildschirm an und App offen lassen – das iPhone stoppt GPS, wenn der Bildschirm aus ist. Powerbank mitnehmen. " +
        "Kommt kein GPS mehr, wird die Anzeige oben schwarz („Kein GPS“); die Linie wird dann unterbrochen statt quer verbunden. " +
        "GPS-Zittern und Sprünge werden herausgefiltert; Handy-GPS ist trotzdem nur auf ca. 2–5 m genau.<br>" +
        "Alle Strecken: Menü → <b>Strecken</b>, getrennt nach Art; ein-/ausblenden (👁), umbenennen (⋯), als GPX exportieren."],
      ["Parkplatz", "Beim Auto den <b>P-Knopf lange drücken</b> – der jetzige GPS-Standort wird gespeichert (ein neuer ersetzt den alten). " +
        "<b>Kurz tippen</b> zeigt den Parkplatz mit Entfernung und Richtung und einem Knopf zur Navigation mit Apple Karten."],
      ["Eigene Punkte", "Gelber ＋-Knopf oder lange auf die Karte drücken. Name, Notiz, Kategorie und Fotos. Liste mit dem Stecknadel-Knopf."],
      ["Claims & Pfosten", "Menü → <b>Claims & Pfosten</b>. Drei Ordner: <b>Meine Claims</b>, <b>Fremde Claims</b> (andere Claims, die du für dich festhältst) " +
        "und pro Club die Club-Claims und Claim-Dateien – fremde Claims, die mit dem Club geteilt sind, stehen dort in einem eigenen Ordner „andere Claims“ (rosa). Mit „auf Karte zeigen“ blendest du einen Ordner ein oder aus.<br>" +
        "Im Popup eines roten BLM-Claims: „Diesen Claim mit Pfosten erfassen“. Location Monument und Pfosten per GPS, Kartenmitte oder " +
        "eingetippten Koordinaten (auch UTM). Ab 3 Eckpfosten wird die Fläche gezeichnet und in Acres berechnet.<br>" +
        "„Sichtbar für“: nur ich oder ein Club. Koordinaten alter Notices sind oft NAD27 (bis ca. 100 m daneben)."],
      ["Mehrere Clubs", "Bist du in mehreren Clubs, wählst du oben im Ebenen-Fenster (oder in der Claims-Liste) den Club, dessen Claims du sehen willst – " +
        "oder alle. Der gewählte Club steht oben links neben dem App-Namen.<br>Admins teilen in der Verwaltung bestehende Konten einem Club zu " +
        "(Mitglieder → Person hinzufügen, oder bei „Alle Benutzer“)."],
      ["Offline im Gelände", "Menü → <b>Offline-Karten</b>: Gebiet auf der Karte einstellen, Zoomstufe wählen, herunterladen – am besten zu Hause im WLAN. " +
        "Offline gehen USGS-Satellit, USGS-Topo, Geologie, Claims, Minen, Landbesitz und Schutzgebiete. Esri-Satellit und OSM brauchen Internet."],
      ["Sichern & Abgleich", "Mit Login werden deine Punkte, Strecken, Claims und Fotos automatisch über den Server abgeglichen (privat, nur für dich): " +
        "was du im Gelände mit dem Handy erfasst, siehst du zu Hause am Computer – sobald beide Geräte online sind und die App offen ist. " +
        "Eine laufende Aufnahme kommt erst nach dem Speichern dazu. Trotzdem ab und zu Menü → Export / Import → <b>vollständige Sicherung</b> machen. " +
        "GPX-Dateien anderer Geräte (Punkte und Strecken) lassen sich dort importieren."],
      ["Konto & Einladungen", "Menü → dein Name: Clubs, weiteren Code einlösen, Verwaltung (für Admins), Abmelden. " +
        "In der Verwaltung: Clubs, Einladungscodes mit QR-Code, Mitglieder und Club-Claim-Dateien (KML/GeoJSON)."]
    ],
    en: [
      ["Buttons on the right", "<b>Layers</b> (top): base map, layers on/off, transparency slider, choose club.<br>" +
        "<b>Crosshair</b>: go to your position (blue dot).<br><b>＋ (gold)</b>: add a point at your position.<br>" +
        "<b>Route</b> (wavy line): record a route.<br><b>P</b>: parking spot – long-press saves, tap shows it.<br>" +
        "<b>Pin</b>: list of your points.<br><b>☰</b>: menu."],
      ["Tap the map", "Shows coordinates and everything at that spot: BLM claims, club claims, your claims, land manager, protected areas and – " +
        "if switched on – rock units and faults. Long-press the map to add a point exactly there."],
      ["BLM claims: active and closed", "Two switches in the layers panel: <b>active</b> (red) and <b>closed</b> (grey, dashed). Claims appear when you zoom in far enough. " +
        "Shapes are approximate (quarter-quarter sections), not surveyed lines. The popup link opens the official BLM case page with the owner. " +
        "Closed claims may be open ground again – check before you dig."],
      ["Where may I prospect?", "<b>Land manager</b> colors land by owner (yellow = BLM, blue = state, green = Forest Service …); tap to see the usual rule.<br>" +
        "<b>Protected & closed areas</b>: red = usually forbidden (national park, refuge, wilderness, tribal, military), orange = restricted.<br>" +
        "This is guidance, not legal advice. When in doubt, ask the agency."],
      ["Record routes", "Tap the route button and choose <b>Drive</b>, <b>Walk</b> or <b>Metal detecting</b>. A badge at the top shows distance and time. " +
        "Tap again for pause, continue or <b>Stop & save</b>.<br>Metal-detecting routes are drawn as a band as wide as your swing, so you see which ground is covered " +
        "(search width can be set when saving, default 1 m).<br><b>Important:</b> keep the screen on and the app open – iPhone stops GPS when the screen is off. Bring a power bank. " +
        "If GPS stops, the badge turns black (“No GPS”) and the line is broken instead of joined straight across. " +
        "GPS jitter and jumps are filtered out; phone GPS is still only good to about 2–5 m.<br>" +
        "All routes: menu → <b>Routes</b>, grouped by type; show/hide (👁), rename (⋯), export as GPX."],
      ["Parking spot", "At the car, <b>long-press the P button</b> – your current GPS position is saved (a new one replaces the old). " +
        "<b>Tap</b> to see it with distance, direction and a button to navigate with Apple Maps."],
      ["Own points", "Gold ＋ button or long-press the map. Name, note, category and photos. List via the pin button."],
      ["Claims & posts", "Menu → <b>Claims & posts</b>. Folders: <b>My claims</b>, <b>Others' claims</b> (claims of others you keep for yourself) and, per club, " +
        "club claims and claim files – others' claims shared with the club have their own folder “other claims” (pink). “show on map” switches a folder on or off.<br>In the popup of a red BLM claim: “Record this claim with posts”. " +
        "Set the location monument and posts by GPS, map center or typed coordinates (also UTM). With 3 corner posts the shape is drawn and acres are computed.<br>" +
        "“Visible for”: only me or a club. Coordinates on old notices are often NAD27 (up to ~100 m off)."],
      ["Several clubs", "If you are in several clubs, choose at the top of the layers panel (or in the claims list) which club's claims to show – or all. " +
        "The chosen club appears next to the app name.<br>Admins add existing accounts to a club in Administration (Members → Add person, or under All users)."],
      ["Offline in the field", "Menu → <b>Offline maps</b>: set the area on the map, choose the zoom level, download – best at home on Wi-Fi. " +
        "Offline works for USGS satellite, USGS topo, geology, claims, mines, land manager and protected areas. Esri satellite and OSM need internet."],
      ["Backup & sync", "When signed in, your points, routes, claims and photos sync automatically through the server (private, only you): " +
        "what you record in the field on the phone shows up at home on the computer once both are online with the app open. " +
        "A running recording is added after you save it. Still make a <b>full backup</b> now and then (menu → Export / Import). " +
        "GPX files from other devices (points and routes) can be imported there."],
      ["Account & invitations", "Menu → your name: clubs, redeem another code, administration (admins), sign out. " +
        "Administration: clubs, invitation codes with QR code, members and club claim files (KML/GeoJSON)."]
    ]
  };

  function open() {
    var list = TEXT[App.lang] || TEXT.en;
    var body = App.el("<div class='help'>" + list.map(function (s, i) {
      return "<details" + (i === 0 ? " open" : "") + "><summary>" + App.esc(s[0]) + "</summary><p>" + s[1] + "</p></details>";
    }).join("") + "</div>");
    App.openSheet(App.t("help"), body);
  }

  return { open: open };
})();

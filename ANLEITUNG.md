# MAUSIBOX App – Anleitung

Web-App für das Handy: Karte mit BLM-Claims, Club-Claims, Geologie, Störungen,
Aeromagnetik, alten Minen, eigenen Punkten mit Fotos, GPX/KML-Export und Offline-Karten.

## Ordner

| Datei / Ordner | Was ist das? |
|---|---|
| `config.js` | **Die einzige Datei, die du normalerweise änderst.** Clubname, Startposition, Ebenen, Farben, Kategorien, Texte (Englisch/Deutsch). |
| `data/club-claims/` | Hier kommen eure Club-Claims hinein (KML oder GeoJSON). |
| `index.html`, `style.css` | Seite und Aussehen |
| `js/` | Programm (Karte, Punkte, Export, Offline) |
| `sw.js` | Service Worker – macht die App offline-fähig |
| `lib/` | Kartenbibliothek Leaflet (lokal, damit sie offline läuft) |
| `icons/`, `manifest.webmanifest` | App-Symbol für den Startbildschirm |

## Login, Einladungscodes, mehrere Clubs
Die App kann mit Benutzerkonten laufen: Registrierung nur mit Einladungscode (einzeln oder
für einen ganzen Club, auch als QR-Code), Clubs mit eigenen Admins und geschützten Club-Claims,
Privatpersonen ohne Club. Einrichtung: siehe **`server/EINRICHTUNG-SERVER.md`**.
Solange in `config.js` unter `server` nichts eingetragen ist, läuft die App ohne Login wie bisher.

## Eigene Claims mit Location Monument und Pfosten
Menü → **Claims & Pfosten** → **＋ Neuer Claim**, oder im Popup eines roten BLM-Claims
**„Als eigenen Claim erfassen“** (übernimmt Name, Seriennummer und Art).

- **Location Monument:** der Pfosten mit der Location Notice. Im Feld **📡 GPS hier** antippen,
  am Computer **✛ Kartenmitte**, oder **⌨ Koordinaten eintippen** – z. B. von der Notice:
  `34.80123, -114.40123` · `34°48'04"N 114°24'04"W` · `34 48.073 N, 114 24.073 W` · `11S 736512 3854320` (UTM).
  Unter dem Feld steht, wie die App die Eingabe verstanden hat.
- **Pfosten:** Art wählen (NW-Ecke, Mitte Nord-Ende usw.), dann wie oben setzen. Ab 3 Grenzpfosten
  zeichnet die App die Claim-Fläche und zeigt die Grösse in Acres (Lode-Claim max. ca. 20,66 Acres –
  gute Kontrolle, ob die Pfosten stimmen). Zeugenpfosten zählen nicht zur Fläche.
- **Sichtbar für:** *Nur mich* (privat) oder einen deiner Clubs (nur mit Server). Private Claims sind orange,
  geteilte türkis. Club-Admins dürfen die geteilten Claims ihres Clubs bearbeiten.
- Pfosten erscheinen ab Zoomstufe 15 (in `config.js` einstellbar: `postsMinZoom`).
- **KML:** Export/Import im Claims-Fenster. Eigene KML-Dateien kommen vollständig zurück; aus fremden
  KML-Dateien wird jede Fläche ein Claim, die Eckpunkte werden Pfosten.
- Die **vollständige Sicherung** enthält auch alle Claims. Fotos von Claims bleiben auf dem Gerät.
- ⚠️ Koordinaten auf alten Notices sind oft im Datum **NAD27** und können bis ca. 100 m abweichen.

## Neu in Version 5
- **BLM-Claims aktiv / geschlossen:** zwei Schalter im Ebenen-Fenster (rot / grau gestrichelt).
- **Landbesitz** (BLM, Staat, Forest Service, privat …) und **Schutzgebiete & Sperrzonen** (USGS PAD-US) als Ebenen;
  Antippen zeigt, was dort meistens gilt. Nur Orientierung, keine Rechtsauskunft.
- **Wege aufzeichnen** (Weg-Knopf): Fahrt, Gehen, Metalldetektor. Liste unter Menü → Strecken, GPX-Export.
  Auf dem iPhone muss der Bildschirm dabei an bleiben. Suchbreite des Detektors: `tracks.coilWidth` in `config.js`.
- **Parkplatz-Knopf (P):** lange drücken = speichern, kurz tippen = anzeigen mit Entfernung und Navigation.
- **Claims-Ordner:** Meine Claims, Fremde Claims, und pro Club.
- **Club-Umschalter** im Ebenen-Fenster; in der Verwaltung bestehende Konten einem Club zuteilen.
- **Hilfe** im Menü.

## Neu in Version 49 (Reisen, Erlebnisse, Club-Seiten)
- **Reise-Spickzettel** (Menü → 🧭): pro Land die Gold-Regeln, Regeln pro Bundesstaat/Kanton, Erlebnisse, Goldplätze, Clubs und Club-Seiten.
  Auch aus jedem Länder- und Goldplatz-Popup erreichbar.
- **Erlebnisse** (Ebene unter „Allgemein“): offizielle Waschplätze, Schaubergwerke, Touren, Kurse, Verleih – weltweit.
  Neue Einträge in `tools/make_experiences.py` (Liste `EXTRA`), danach `python3 tools/make_experiences.py`.
  Das Skript übernimmt automatisch alle passenden Orte aus den Goldplatz-Dateien – nach Änderungen an `make_goldspots.py` erneut laufen lassen.
- **Club-Seiten für Gäste:** Club-Admins: Verwaltung → Club → „🏕 Gäste-Seite“ ausfüllen, Position setzen, veröffentlichen.
  Gäste tippen auf der Karte auf „Als Gast anfragen“ (nur mit Konto). Antworten: Verwaltung → „📨 Gast-Anfragen“.
  Eigene Anfragen: Konto → „Meine Gast-Anfragen“.
  **Einmalig nötig:** `server/v49-clubpages.sql` im Supabase SQL Editor ausführen.

## Neu in Version 48
- **Impressum, Datenschutz, AGB** in `legal.html` (Entwurf). Link im Menü und auf der Anmeldeseite.
  Vor dem Verkauf alle Stellen in [eckigen Klammern] ausfüllen und prüfen lassen.

## Neu in Version 47 (Lizenzen für den Verkauf)
- **Esri-Satellit entfernt** (keine kommerzielle Nutzung ohne ArcGIS-Lizenz). Standard ist jetzt der USGS-Satellit.
- **NZ – Aktive Störungen entfernt** (GNS erlaubt keine kommerzielle Nutzung).
- **Ländergrenzen** für „Gold-Regeln pro Land“ jetzt von Natural Earth (gemeinfrei) statt GISCO/EuroGeographics.
- **Noch offen:** OSM-Strassenkarte vor dem Verkauf auf einen Kachel-Anbieter mit kommerzieller Lizenz umstellen (Hinweis in `config.js`).

## Neu in Version 31
- **Bekannte Goldwaschplätze (Europa):** 39 Orte in DE, AT, CH, IT, ES, FR – farbig nach Art (geduldet, Bewilligung, offizieller Platz, Schaubergwerk, nicht graben). Liste ergänzen in `tools/make_goldspots.py`.
- Genauere Regeln für Österreich (je Bundesland, Kärnten Bewilligung), Italien (Piemont: Anmeldung, max. 5 g/Tag) und Spanien.

## Neu in Version 30
- **Europa:** Edelmetall-Vorkommen, Bergwerke und Geologie 1:1 Mio. (EGDI) – deckt auch Frankreich und Italien ab.
- **Deutschland:** Geologie 1:250 000 (BGR) mit Quarzgängen und Tektonik. **Spanien:** ca. 880 Goldvorkommen und Geologie 1:50 000 (IGME).
- Gold-Regeln für Deutschland, Frankreich, Italien, Spanien (Ebene „Gold-Regeln pro Land“).

## Neu in Version 29
- **Europa:** Natura-2000-Gebiete, Nationalparks & Naturschutzgebiete (EU-Umweltagentur), **Gold-Regeln pro Land** beim Antippen (`countryRules` in `config.js`).
- **Österreich:** ca. 400 Goldvorkommen (GeoSphere IRIS) als gelbe Punkte, alle Lagerstätten, Geologie & Tektonik 1:500 000, Grundkarten basemap.at und Luftbild 30 cm.
- Karte springt beim Verschieben über die Datumsgrenze in die echte Welt zurück (NZ-Flächen waren sonst unsichtbar).

## Neu in Version 20
- **Neuseeland:** Goldvorkommen (GNS, über 1400 Fundstellen), Gelände-Schummerung 8 m (ganz NZ), aktive Störungen, geologische Karte 1:250 000.
- **Schweiz:** LiDAR-Relief swissALTI3D (3 Ansichten), Geologie (GeoCover 1:25 000, 1:500 000, Tektonik, Störungen), Aeromagnetik.
- Die USGS-Ebenen (LiDAR, Aeromagnetik, Störungen) gelten nur für die USA und stehen deshalb in der Gruppe USA.

## Neu in Version 17
- **Ebenen-Gruppen** im Ebenen-Fenster (Allgemein, USA, Neuseeland, Schweiz) zum Aufklappen – `overlayGroups` in `config.js`.
- **Schweiz:** Landeskarte (swisstopo), Gold- & Erzvorkommen, Schutzgebiete, Goldwasch-Regeln pro Kanton beim Antippen
  (Texte in `config.js` → `chCantonRules`, Quelle: Schweizerische Goldwäschervereinigung, Stand Nov. 2026).

## Neu in Version 15
- **Neuseeland:** Gold-Fossicking-Gebiete (öffentlich), Bergbau-Genehmigungen („Claims“), Anträge und Schedule-4-Land als Ebenen –
  live vom Server von NZ Petroleum & Minerals, Änderungen erscheinen automatisch.

## Neu in Version 13
- Hinführen-Knopf (Apple Karten) bei Punkten, Claims, Club-Claims, Basecamp, BLM-Claims.
- BLM-Änderungen: täglicher Vergleich (config.js → blmWatch), Filter „nur neue / nur abgelaufene (30 Tage)“, Meldung + Menü-Seite.
- Einladungscodes für mehrere Clubs, Club-Chat, alte BLM-Claims weiss gestrichelt.

## Neu in Version 10
- **Farbe pro Club** (in `config.js` unter `clubColors`), Legende im Ebenen-Fenster.
- **Sammelpunkte:** weiter herausgezoomt zeigt ein farbiger Punkt mit Zahl, wo Club-Claims liegen; antippen zoomt hinein.
- **LiDAR / Gelände (USGS 3DEP)** als Ebene mit Auswahl der Ansicht: Schummerung, Hangneigung, Hangrichtung, Höhenlinien.
  Das erste Laden eines Gebiets dauert einige Sekunden; nur online.

## Neu in Version 9
- **Abgleich zwischen Geräten** (mit Login): Punkte, Strecken, Claims und Fotos erscheinen automatisch auf allen Geräten,
  auf denen du angemeldet bist – privat, nur für dich. Server-Einrichtung: `server/sync-setup.sql` (einmalig im Supabase SQL Editor).
  Fotos liegen im Supabase-Speicher (gratis bis 1 GB, reicht für einige tausend Fotos).

## Neu in Version 7
- **Genauere Wege:** GPS-Zittern wird geglättet, Sprünge werden herausgefiltert, und wo lange kein GPS kam (Bildschirm aus),
  wird die Linie unterbrochen statt quer verbunden. Oben erscheint dann schwarz „Kein GPS – Bildschirm an lassen!“.
  Einstellungen pro Art in `config.js` unter `tracks` (`maxAccuracy`, `maxSpeed`, `gapSeconds`, `smooth`).

## Neu in Version 6
- Fremde Claims können mit einem Club geteilt werden (Claim bearbeiten → „Wessen Claim?“ = Fremder Claim, „Sichtbar für“ = Club).
  Sie stehen beim Club in einem eigenen Ordner **„andere Claims“** und sind rosa; die Club-Claims bleiben türkis.

## Club-Claims eintragen (nur ohne Server)

1. Die KML-Datei der Club-Claims in den Ordner `data/club-claims/` kopieren.
2. Entweder die Beispieldatei `club-claims.kml` damit **ersetzen** (gleicher Name),
   oder in `config.js` beim Eintrag `club` unter `files:` den Dateinamen ergänzen, z. B.:
   ```js
   files: [
     "data/club-claims/club-claims.kml",
     "data/club-claims/claims-2025.kml"
   ],
   ```
3. Hast du nur Koordinaten (z. B. Eckpunkte in Excel)? Schick sie mir, dann mache ich eine KML daraus.

> Die mitgelieferte `club-claims.kml` ist **nur ein Beispiel** (erfundene Fläche, Name „EXAMPLE“).

## Lokal am Mac ausprobieren

Im Terminal:

```bash
cd ~/goldclub-map
```
→ wechselt in den Projektordner (`cd` = „change directory“, `~` = dein Benutzerordner).

```bash
python3 -m http.server 8000
```
→ startet einen kleinen Webserver, der den Ordner unter `http://localhost:8000` anbietet.
Dann im Browser (Chrome oder Safari) `http://localhost:8000` öffnen.
Beenden mit **Ctrl + C** im Terminal.

Hinweis: GPS und Offline-Modus funktionieren auf dem Handy nur über **https** –
also erst nach dem Veröffentlichen auf GitHub Pages (siehe unten), nicht über das Heimnetz.

## Veröffentlichen auf GitHub Pages (gratis)

### Einmalig vorbereiten
1. Auf <https://github.com> ein Konto anlegen (falls noch nicht vorhanden).
2. Oben rechts **+ → New repository**: Name z. B. `goldclub-map`, **Public**, ohne README → *Create repository*.

### Variante A – ohne Terminal (am einfachsten)
1. Im neuen Repository auf **„uploading an existing file“** klicken.
2. Den **Inhalt** des Ordners `goldclub-map` (alle Dateien und Unterordner, ausser `.claude`) ins Browserfenster ziehen → *Commit changes*.
3. **Settings → Pages**: bei *Source* „Deploy from a branch“, Branch `main`, Ordner `/ (root)` → *Save*.
4. Nach 1–2 Minuten ist die App unter `https://DEIN-NAME.github.io/goldclub-map/` erreichbar.

### Variante B – mit Terminal (für spätere Änderungen bequemer)
Einmalig:
```bash
cd ~/goldclub-map
```
→ in den Projektordner wechseln.

```bash
git init -b main
```
→ macht den Ordner zu einem Git-Projekt (Git merkt sich alle Versionen deiner Dateien).

```bash
git add .
```
→ markiert alle Dateien für die nächste gespeicherte Version.

```bash
git commit -m "Erste Version"
```
→ speichert diese Version mit einer kurzen Beschreibung.

```bash
git remote add origin https://github.com/DEIN-NAME/goldclub-map.git
```
→ sagt Git, wohin hochgeladen wird (DEIN-NAME ersetzen).

```bash
git push -u origin main
```
→ lädt alles zu GitHub hoch. Beim ersten Mal fragt der Mac nach der GitHub-Anmeldung.

Danach wie oben Schritt 3 (Settings → Pages) einschalten.

**Bei jeder späteren Änderung** reichen drei Befehle:
```bash
git add .
```
```bash
git commit -m "Was ich geändert habe"
```
```bash
git push
```
Und in `config.js` die Zahl bei `appVersion` um 1 erhöhen, damit die Handys die neue Version sicher laden.

## Auf dem Handy installieren
- **iPhone (Safari):** Seite öffnen → Teilen-Symbol → „Zum Home-Bildschirm“.
- **Android (Chrome):** Seite öffnen → ⋮-Menü → „App installieren“ / „Zum Startbildschirm hinzufügen“.
- Beim ersten Start den Standortzugriff erlauben.

## Bedienung
- **Ebenen-Knopf** (oben): Grundkarte wählen, Ebenen ein/aus, Transparenz per Regler.
- **Karte antippen:** Koordinaten, BLM-Claim(s) an dieser Stelle, Club-Claim und – wenn Geologie oder Störungen eingeschaltet sind – Gesteinseinheit/Störung.
- **Minen-Punkte antippen:** Name, Status, Rohstoffe, Link zum USGS-Datenblatt. Gold-Fundstellen sind gelb.
- **Punkt setzen:** grosser **+**-Knopf (GPS-Position oder Kartenmitte) oder **lange auf die Karte drücken**.
- **Menü → Export / Import:** GPX, KML (ohne Fotos) und *vollständige Sicherung* (JSON mit Fotos).
- **Menü → Offline-Karten:** Gebiet auf der Karte einstellen, Zoomstufe wählen, *Herunterladen*. Danach funktioniert das Gebiet ohne Empfang.

## Wichtig zu wissen
- **Claim-Inhaber:** Der BLM-Kartendienst enthält keine Namen. Im Claim-Popup führt der Link „Owner & details at BLM MLRS“ zur offiziellen Fallseite.
- **Claim-Grenzen** aus dem BLM-Dienst sind Näherungen (aus Viertel-Viertel-Sektionen), keine vermessenen Linien.
- **Esri-Satellit und OSM-Strassenkarte** sind nur online (Lizenz). Offline: USGS-Satellit und USGS-Topo.
- **Aeromagnetik** ist die landesweite USGS-Zusammenstellung (grob, ca. 1 km).
- **Geologie-Info beim Antippen** braucht Internet; die Geologie-*Karte* selbst geht offline.
- **Punkte liegen nur auf dem Gerät.** Regelmässig eine vollständige Sicherung machen.

## Datenquellen (Stand geprüft: 5.11.2026)
- BLM MLRS Mining Claims: `nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer` (Ebene 1 = aktiv)
- USGS MRData (MRDS, USMIN, SGMC-Störungen, Magnetik): `mrdata.usgs.gov`
- Geologie: Macrostrat (CC-BY 4.0), basierend auf der Geologic Map of Arizona (AZGS)
- Grundkarten: Esri World Imagery, USGS The National Map, OpenStreetMap

Ändert eine Behörde eine Adresse, muss nur die passende `url` in `config.js` angepasst werden.

## Vorbereitet für Version 2
Jeder Punkt hat schon die Felder `publish` (veröffentlichen), `author` und `sync`, eine weltweit
eindeutige ID und eine „weiche“ Löschung. In `config.js` unter `features` lässt sich der
Schalter „veröffentlichen“ später einschalten; dazu kommt dann ein kleiner Server für die
gemeinsame Ebene „Club-Punkte“.

## Version 52 – Esri-Karten statt OpenStreetMap

- Neue Grundkarten: **Satellit weltweit (Esri)** mit Ortsnamen (Standard) und **Outdoor-Karte weltweit (Esri)**.
- Die OpenStreetMap-Strassenkarte ist entfernt (für verkaufte Apps nicht erlaubt).
- Der Esri-Schlüssel steht in `config.js` unter `esriApiKey`. Er gilt nur für maesibox.github.io und nuggetcompass.com und nur für Grundkarten.
- **Läuft ab am 18.11.2027.** Vorher im Esri-Konto (location.arcgis.com, Element „Nugget Compass Karten") einen neuen Schlüssel erzeugen und in `config.js` ersetzen.
- Kosten: 2 Mio. Kacheln pro Monat gratis. „Pay-as-you-go" ist ausgeschaltet, also entstehen keine Kosten; bei Überschreitung zeigt Esri einfach keine Kacheln mehr bis zum Monatsende.
- Esri-Karten werden nicht offline gespeichert (Bedingungen). Offline weiterhin: USGS, swisstopo, basemap.at.

## Version 53 – Ortssuche über Esri, Blickrichtung

- Die Ortssuche (🔍) läuft jetzt über Esri statt OpenStreetMap/Nominatim. 20'000 Suchen pro Monat gratis.
- Der Esri-Schlüssel darf jetzt Grundkarten **und** Ortssuche. Achtung: Ändert man im Esri-Konto Berechtigungen oder Referrer, wird der Schlüssel ungültig. Dann „API-Schlüssel generieren“ und den neuen Schlüssel in `config.js` bei `esriApiKey` eintragen.
- Blickrichtung: Nach Tipp auf den GPS-Knopf zeigt ein blauer Lichtkegel am eigenen Punkt, wohin das Telefon zeigt (iPhone fragt einmal nach Erlaubnis für „Bewegung und Ausrichtung“). Die Karte bleibt nach Norden ausgerichtet.

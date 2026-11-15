#!/usr/bin/env python3
"""
Erzeugt data/goldspots.geojson: bekannte Goldwasch-Orte in Europa (ungefähre Lage = Ort / Flussabschnitt).
Arten (kind): free = meist geduldet/frei (Regeln beachten), permit = Bewilligung/Anmeldung nötig,
site = offizieller/bezahlter Goldwaschplatz oder Kurs, show = Schaubergwerk/Museum (nur ansehen), closed = Graben verboten.
Ergänzen: einfach eine Zeile in SPOTS anfügen und das Skript laufen lassen:  python3 tools/make_goldspots.py
"""
import json, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "goldspots.geojson")

# (Land, Name, Fluss, Breite, Länge, Art, Beschreibung DE, Beschreibung EN)
SPOTS = [
 # Deutschland
 ("DE", "Rhein bei Neuburgweier", "Rhein", 48.9705, 8.2664, "free", "Klassisches Rheingold auf Kiesbänken (Oberrhein). Hobby mit Pfanne meist geduldet; Naturschutzgebiete und Rheinauen beachten.", "Classic Rhine gold on gravel bars (Upper Rhine). Hobby panning usually tolerated; respect nature reserves."),
 ("DE", "Rhein bei Rheinau (Ortenau)", "Rhein", 48.6611, 7.9383, "free", "Rheingold-Gebiet am Oberrhein. Hobby mit Pfanne meist geduldet; Schutzgebiete beachten.", "Rhine gold area on the Upper Rhine. Hobby panning usually tolerated; respect protected areas."),
 ("DE", "Rhein bei Breisach", "Rhein", 48.0291, 7.5806, "free", "Historisches Rheingold-Gebiet. Hobby mit Pfanne meist geduldet; Schutzgebiete beachten.", "Historic Rhine gold area. Hobby panning usually tolerated."),
 ("DE", "Isar zwischen Bad Tölz und Wolfratshausen", "Isar", 47.8357, 11.4931, "free", "Isargold, feine Flitter. Grosse Teile der Isarauen sind Naturschutzgebiet (z. B. Pupplinger Au) – dort nicht waschen.", "Isar gold, fine flakes. Large parts of the floodplain are nature reserves (e.g. Pupplinger Au) – no panning there."),
 ("DE", "Eder bei Affoldern (Edertal)", "Eder", 51.1667, 9.0855, "free", "Edergold – bekanntestes Goldwaschgebiet Hessens. Hobby mit Pfanne meist geduldet.", "Eder gold – Hesse's best-known panning area. Hobby panning usually tolerated."),
 ("DE", "Eder bei Frankenberg / Goldberg Eisenberg (Korbach)", "Eder", 51.0772, 8.7908, "free", "Edergold; in der Nähe das historische Goldbergwerk Eisenberg bei Korbach (Besucherbergwerk).", "Eder gold; nearby the historic Eisenberg gold mine near Korbach (visitor mine)."),
 ("DE", "Schwarza bei Schwarzburg", "Schwarza", 50.6421, 11.1957, "free", "Thüringer Waschgold aus dem Schwarzatal. Hobby mit Pfanne meist geduldet.", "Thuringian placer gold of the Schwarza valley. Hobby panning usually tolerated."),
 ("DE", "Schwarza bei Goldisthal", "Schwarza", 50.5187, 11.0045, "free", "Oberlauf der Schwarza, historisches Goldwaschgebiet (der Ortsname sagt es).", "Upper Schwarza, historic gold panning area."),
 ("DE", "Goldkronach (Fichtelgebirge)", "Bäche um Goldkronach", 49.9996, 11.6954, "free", "Historischer Goldbergbau mit Besucherbergwerk und Goldbergbaumuseum; Waschgold in den Bächen.", "Historic gold mining with visitor mine and museum; placer gold in the creeks."),
 # Österreich
 ("AT", "Rauris – Goldwaschplatz Bodenhaus", "Hüttwinklache", 47.1052, 12.9917, "site", "Offizieller Goldwaschplatz im Hüttwinkltal (Tauerngold). Ausrüstung vor Ort; gegen Gebühr.", "Official gold panning site in the Hüttwinkl valley (Tauern gold). Equipment available; fee."),
 ("AT", "Rauris – Hochalm", "Hochalm", 47.2246, 12.9950, "site", "Goldwaschen auf der Hochalm (Bergbahn Rauris), betreuter Waschplatz.", "Gold panning at the Hochalm (Rauris cable car), supervised site."),
 ("AT", "Böckstein / Gasteinertal", "Gasteiner Ache", 47.0908, 13.1185, "show", "Altes Tauerngold-Revier, Montanmuseum Altböckstein. Ausserhalb betreuter Plätze: Anzeige bei der Montanbehörde, Grundeigentümer und Fischereiberechtigten fragen.", "Old Tauern gold district, mining museum Altböckstein. Outside supervised sites: report to the mining authority, ask landowner and fishing rights holder."),
 ("AT", "Heiligenblut (Kärnten)", "Möll / Gößnitz", 47.0385, 12.8408, "site", "Geführtes Goldwaschen im Nationalpark Hohe Tauern. Eigenständig im Nationalpark nicht erlaubt; in Kärnten braucht es ausserhalb betreuter Plätze eine Bewilligung.", "Guided gold panning in the Hohe Tauern National Park. Not allowed on your own inside the park; in Carinthia a permit is needed outside supervised sites."),
 ("AT", "Hainzenberg / Zell am Ziller", "Ziller", 47.2182, 11.9000, "show", "Goldschaubergwerk Hainzenberg (Tirol), mit Goldwaschen für Besucher.", "Show gold mine Hainzenberg (Tyrol), panning for visitors."),
 ("AT", "Salzach bei Lend", "Salzach", 47.2985, 13.0440, "permit", "Tauerngold wird von den Zubringern in die Salzach getragen. Selbständig: Anzeige bei der Montanbehörde, Zustimmung von Grundeigentümer und Fischereiberechtigtem.", "Tauern gold carried into the Salzach. On your own: report to mining authority, consent of landowner and fishing rights holder."),
 # Schweiz
 ("CH", "Grosse Fontanne bei Doppleschwand (Napf)", "Grosse Fontanne", 47.0181, 8.0553, "free", "Bekanntestes Napfgold-Gewässer. Kanton Luzern: keine besonderen Vorgaben bekannt, keine Motorgeräte, Fisch-Schonzeit beachten.", "Best-known Napf gold stream. Canton Lucerne: no special rules known, no motorised gear, respect fish closed season."),
 ("CH", "Kleine Emme bei Wolhusen (Napf)", "Kleine Emme", 47.0580, 8.0726, "free", "Napfgold in der Kleinen Emme. Kanton Luzern: keine Motorgeräte, Schonzeit beachten.", "Napf gold in the Kleine Emme. Canton Lucerne: no motorised gear."),
 ("CH", "Luthern (Napf)", "Luthern", 47.0590, 7.9169, "free", "Napfgold-Gewässer, auch in der swisstopo-Rohstoffkarte als Goldvorkommen. Kanton Luzern.", "Napf gold stream, listed as gold occurrence by swisstopo. Canton Lucerne."),
 ("CH", "Ilfis / Emme bei Trubschachen (Napf)", "Ilfis", 46.9229, 7.8467, "free", "Napfgold im Emmental. Kanton Bern: Pfanne und Schaufel, max. 3 Personen, 1. Mai – 30. Sept. bewilligungsfrei.", "Napf gold in the Emmental. Canton Bern: pan and shovel, max. 3 people, 1 May – 30 Sept. without permit."),
 ("CH", "Vorderrhein bei Disentis", "Vorderrhein", 46.7426, 8.8530, "permit", "Rheingold in der Surselva. Gemeinde Disentis/Mustér: Bewilligung nötig.", "Rhine gold in the Surselva. Municipality Disentis/Mustér: permit needed."),
 ("CH", "Medelser Rhein bei Curaglia (Medel)", "Rein da Medel", 46.6733, 8.8568, "permit", "Klassisches Bündner Goldwaschgebiet. Gemeinde Medel/Lucmagn: jegliches Goldwaschen bewilligungspflichtig (Gemeindeverwaltung).", "Classic Grisons gold area. Medel/Lucmagn: all gold panning needs a permit from the municipality."),
 ("CH", "Malcantone bei Astano (Tessin)", "Magliasina / Tresa", 46.0126, 8.8159, "permit", "Ehemalige Goldminen im Malcantone (Sessa, Astano). Kanton Tessin: bewilligungspflichtig.", "Former gold mines of the Malcantone. Canton Ticino: permit required."),
 ("CH", "Allondon bei Dardagny (Genf)", "Allondon", 46.1992, 5.9838, "permit", "Bekanntes Genfer Goldgewässer. Kanton Genf: bewilligungspflichtig; Teile sind Naturschutzgebiet.", "Known Geneva gold stream. Canton Geneva: permit required; parts are nature reserve."),
 # Italien
 ("IT", "Elvo bei Vermogno (Biella)", "Elvo", 45.4825, 8.0248, "permit", "„Mekka“ der italienischen Goldsucher, neben der römischen Goldmine Bessa (Naturreservat – dort nicht graben). Piemont: Anmeldung bei der Region (Registro raccoglitori), nur Handwerkzeug, max. 5 g Gold pro Tag und Person, Grundeigentümer fragen. Goldmuseum in Vermogno.", "'Mecca' of Italian gold hunters, next to the Roman Bessa gold mine (nature reserve – no digging). Piedmont: register with the region, hand tools only, max. 5 g gold per day and person."),
 ("IT", "Orba bei Silvano d'Orba", "Orba", 44.6869, 8.6750, "permit", "Klassisches Goldwaschgebiet Orba/Piota (Ovadese). Piemont: Anmeldung bei der Region, nur Handwerkzeug, max. 5 g pro Tag.", "Classic Orba/Piota gold area. Piedmont: register with the region, hand tools, max. 5 g per day."),
 ("IT", "Piota / Orba bei Casaleggio Boiro", "Piota", 44.6129, 8.7397, "permit", "Goldführende Bäche im Alto Monferrato (römische Goldwäschen). Piemont-Regeln.", "Gold-bearing streams of the Alto Monferrato. Piedmont rules."),
 ("IT", "Ticino bei Oleggio", "Ticino", 45.5972, 8.6371, "permit", "Ticino-Gold (Grenze Piemont/Lombardei). Grosse Teile liegen im Naturpark Valle del Ticino – dort ist Sammeln verboten. Piemont-/Lombardei-Regeln.", "Ticino gold. Large parts lie in the Valle del Ticino park – collecting forbidden there."),
 ("IT", "Dora Baltea bei Mazzè", "Dora Baltea", 45.3003, 7.9327, "permit", "Goldführende Dora Baltea (Canavese). Piemont: Anmeldung bei der Region, Handwerkzeug, max. 5 g pro Tag.", "Gold-bearing Dora Baltea. Piedmont rules."),
 ("IT", "Macugnaga – Goldmine Guia", "Anza", 45.9684, 7.9673, "show", "Besucher-Goldmine Guia im Monte-Rosa-Gebiet (Valle Anzasca).", "Guia visitor gold mine in the Monte Rosa area."),
 # Spanien
 ("ES", "Navelgas (Tineo, Asturien)", "Río Navelgas / Bárcena", 43.4105, -6.5687, "site", "„Valle del Oro“ mit Goldwasch-Museum; jedes Jahr Ende Juli Goldwasch-Meisterschaft mit freier Waschzone. Ausserhalb: Erlaubnis nötig (Wasserbehörde Cantábrico, Region).", "'Valle del Oro' with gold museum; national panning championship end of July with a free panning zone. Otherwise a permit is needed."),
 ("ES", "Sil bei Ponferrada", "Sil", 42.4984, -6.5663, "permit", "Goldfluss Sil (El Bierzo). Erlaubnis der Confederación Hidrográfica Miño-Sil und der Region nötig.", "Gold river Sil. Permit from the Miño-Sil water authority and the region needed."),
 ("ES", "Sil bei Puente de Domingo Flórez", "Sil", 42.4203, -6.7722, "permit", "Römische Goldgebiete am Sil. Erlaubnis Confederación Hidrográfica Miño-Sil nötig.", "Roman gold area on the Sil. Permit needed."),
 ("ES", "Sil bei O Barco de Valdeorras", "Sil", 42.4301, -6.9801, "permit", "Goldführender Sil in Galicien. Erlaubnis Confederación Hidrográfica Miño-Sil und Xunta nötig.", "Gold-bearing Sil in Galicia. Permit needed."),
 ("ES", "Las Médulas (Carucedo)", "–", 42.4851, -6.7915, "closed", "Grösste römische Goldmine, UNESCO-Welterbe – nur ansehen, nicht graben.", "Largest Roman gold mine, UNESCO World Heritage – look only, no digging."),
 # Frankreich
 ("FR", "Ariège bei Varilhes", "Ariège", 43.0424, 1.6273, "permit", "Die Ariège ist Frankreichs bekanntester Goldfluss („Orpaillage“). Je nach Département Anmeldung/Erlaubnis; Vereine helfen.", "The Ariège is France's best-known gold river. Declaration/permit depending on the département."),
 ("FR", "Gardon bei Anduze (Cevennen)", "Gardon", 44.0546, 3.9857, "permit", "Klassischer Goldfluss der Cevennen. Département Gard: Regeln vorher klären.", "Classic gold river of the Cévennes. Check the Gard rules."),
 ("FR", "Cèze bei Saint-Ambroix", "Cèze", 44.2600, 4.1998, "permit", "Goldführende Cèze (Cevennen). Regeln des Départements klären.", "Gold-bearing Cèze. Check département rules."),
 ("FR", "Garonne bei Saint-Gaudens", "Garonne", 43.1078, 0.7247, "permit", "Garonne-Gold aus den Pyrenäen. Regeln des Départements klären.", "Garonne gold from the Pyrenees. Check département rules."),
 ("FR", "Rhein bei Rhinau (Elsass)", "Rhin", 48.3181, 7.7055, "permit", "Rheingold auf französischer Seite. Teile sind Naturschutzgebiet (Réserve naturelle).", "Rhine gold on the French side. Parts are nature reserves."),
]

feats = []
for c, name, river, lat, lon, kind, de, en in SPOTS:
    feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
                  "properties": {"name": name, "country": c, "river": river, "kind": kind, "de": de, "en": en}})
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"type": "FeatureCollection", "features": feats}, open(OUT, "w"), ensure_ascii=False, indent=0)
print(len(feats), "Orte ->", OUT)

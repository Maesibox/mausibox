#!/usr/bin/env python3
"""
Erzeugt data/goldspots.geojson: bekannte Goldwasch-Orte in Europa (ungefähre Lage = Ort / Flussabschnitt).
Arten (kind): free = meist geduldet/frei (Regeln beachten), permit = Bewilligung/Anmeldung nötig,
site = offizieller/bezahlter Goldwaschplatz oder Kurs, show = Schaubergwerk/Museum (nur ansehen), closed = Graben verboten.
Jeder Ort bekommt: Beschreibung, "Was man findet" (FIND) und "Bewilligung / wo fragen" (PERMIT, sonst das Land).
Ergänzen: einfach eine Zeile in SPOTS anfügen und das Skript laufen lassen:  python3 tools/make_goldspots.py
"""
import json, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "goldspots.geojson")

# Was man findet (DE, EN)
FIND = {
 "rhein": ("Sehr feines Flittergold (meist unter 0,5 mm) mit viel Schwarzsand. Kleine Ausbeute, dafür auf vielen Kiesbänken.",
           "Very fine flake gold (mostly under 0.5 mm) with lots of black sand. Small yields, but on many gravel bars."),
 "isar": ("Feine Flitter, selten etwas gröber; dazu Granat und Schwarzsand.", "Fine flakes, rarely coarser; garnet and black sand."),
 "eder": ("Flitter bis kleine Körner – für Deutschland eher grobes Gold.", "Flakes to small grains – fairly coarse for Germany."),
 "thuer": ("Flitter und kleine Körner; historisch wurden an der Schwarza auch grössere Stücke gefunden.", "Flakes and small grains; historically larger pieces too."),
 "fichtel": ("Feine Flitter in den Bächen des alten Bergbaureviers.", "Fine flakes in the creeks of the old mining district."),
 "tauern": ("Tauerngold: Flitter und kleine Körner, schön gelb; dazu Granat und Magnetit.", "Tauern gold: flakes and small grains, bright yellow; garnet and magnetite."),
 "napf": ("Napfgold: Flitter bis 1–2 mm, selten kleine Nuggets; sehr reines Gold.", "Napf gold: flakes up to 1–2 mm, rarely small nuggets; very pure gold."),
 "graub": ("Flitter und ab und zu kleine Nuggets – oft gröber als Napfgold.", "Flakes and occasional small nuggets – often coarser than Napf gold."),
 "tessin": ("Feine Flitter; Pyrit und Arsenkies aus den alten Minen.", "Fine flakes; pyrite and arsenopyrite from the old mines."),
 "genf": ("Feine Flitter im Kies.", "Fine flakes in the gravel."),
 "elvo": ("Flitter und kleine Nuggets, viel Granat – einer der ergiebigsten Bäche Italiens.", "Flakes and small nuggets, lots of garnet – one of Italy's richest streams."),
 "orba": ("Vergleichsweise grosse Flitter und kleine Nuggets.", "Comparatively large flakes and small nuggets."),
 "ticino": ("Feine bis mittlere Flitter, viel Schwarzsand.", "Fine to medium flakes, lots of black sand."),
 "dora": ("Feine bis mittlere Flitter.", "Fine to medium flakes."),
 "mine": ("Besucherbergwerk: Goldquarz ansehen, Goldwaschen für Besucher.", "Visitor mine: see gold quartz, panning for visitors."),
 "asturien": ("Flitter und kleine Körner, teils recht grob; römische Abbauspuren in der ganzen Gegend.", "Flakes and small grains, partly quite coarse; Roman workings all around."),
 "sil": ("Feine Flitter, angereichert an Innenkurven, Kiesbänken und alten Hochwasserterrassen (Transportgold aus Las Médulas / Cabrera).", "Fine flakes, concentrated on inside bends, gravel bars and old flood terraces."),
 "cabrera": ("Flitter in Seitenrinnen und altem Schwemmmaterial; römische Kanäle und Abbauterrassen.", "Flakes in side gullies and old alluvium; Roman channels and terraces."),
 "medulas": ("Nichts mitnehmen – Welterbe. Sehenswert: rote Abbauwände und römische Stollen.", "Take nothing – World Heritage. Worth seeing: red mining cliffs and Roman tunnels."),
 "pyr": ("Pyrenäengold: Flitter, selten kleine Nuggets – vor allem in Sandbänken und Innenkurven.", "Pyrenees gold: flakes, rarely small nuggets – mainly in sand bars and inside bends."),
 "cevennen": ("Feine Flitter, oft im Moos und Wurzelwerk an der Hochwasserlinie.", "Fine flakes, often in moss and roots at the flood line."),
 "allier": ("Feines Waschgold in Schwemmlandablagerungen.", "Fine placer gold in alluvial deposits."),
 "limousin": ("Flitter in den Bächen rund um das alte Goldbergbaurevier (Mine du Bourneix).", "Flakes in the creeks around the old gold mining district."),
 "bretagne": ("Flitter und kleine Körner; goldführende Quarzgänge in der Umgebung.", "Flakes and small grains; gold-bearing quartz veins nearby."),
}

# Bewilligung / wo fragen (DE, EN) – Standard pro Land, einzelne Orte können einen eigenen Eintrag haben
PERMIT = {
 "DE": ("Hobby mit Pfanne und Schaufel ist in den meisten Bundesländern ohne Bewilligung geduldet (nicht gewerblich). Fragen: Untere Naturschutzbehörde (Landratsamt) für Schutzgebiete, Fischereiberechtigter wegen Laichzeiten, Grundeigentümer für den Zugang. Keine Motorpumpen.",
        "Hobby panning with pan and shovel is tolerated without permit in most states (non-commercial). Ask: district nature-protection office for reserves, fishing rights holder for spawning seasons, landowner for access. No motor pumps."),
 "AT": ("Anzeige bei der Montanbehörde (Bundesministerium für Finanzen) und vorher Zustimmung von Grundeigentümer und Fischereiberechtigtem. In Kärnten braucht es ausserhalb betreuter Plätze eine Bewilligung (Bezirkshauptmannschaft / Gemeinde). Einfachster legaler Weg: offizielle Waschplätze.",
        "Report to the mining authority (Federal Ministry of Finance) and get consent of landowner and fishing rights holder first. Carinthia: permit needed outside supervised sites (district authority / municipality). Easiest legal way: official panning sites."),
 "CH": ("Je nach Kanton und Gemeinde – Details in der Ebene «Goldwaschen-Regeln pro Kanton». Meist Gemeinde- oder Kantonsverwaltung (Fischerei / Umwelt). Fisch-Schonzeiten beachten, keine Motorgeräte.",
        "Depends on canton and municipality – see the layer 'Gold panning rules per canton'. Usually municipality or canton (fisheries / environment). Respect fish closed seasons, no motorised gear."),
 "IT": ("Piemont: Eintrag ins Register der Goldsucher der Region Piemont (Bergbau-Aufsicht), nur Handwerkzeug, max. 5 g Gold pro Tag. Vereine (z. B. in Biella) helfen bei der Anmeldung. Grundeigentümer fragen, Naturparks sind tabu.",
        "Piedmont: register as gold collector with the Piedmont region (mining supervision), hand tools only, max. 5 g gold per day. Local clubs (e.g. in Biella) help. Ask the landowner; nature parks are off limits."),
 "IT-LOM": ("Im Parco del Ticino ist Sammeln verboten. Ausserhalb: Piemont-Ufer → Register der Region Piemont; Lombardei-Ufer → Region Lombardei fragen.",
            "Collecting is forbidden in the Ticino park. Outside: Piedmont bank → Piedmont register; Lombardy bank → ask the Lombardy region."),
 "ES": ("Erlaubnis der zuständigen Wasserbehörde (Confederación Hidrográfica) für die Nutzung des Flussbetts, dazu Info bei der Bergbau-Abteilung der Region. Fischerei-Schonzeiten beachten.",
        "Permit from the river basin authority (Confederación Hidrográfica) for using the riverbed, plus check with the region's mining office. Respect fishing closed seasons."),
 "ES-AST": ("Asturien: Erlaubnis der Confederación Hidrográfica del Cantábrico (Nutzung des Flussbetts), Info beim Principado de Asturias (Minas). Während der Meisterschaft in Navelgas (Ende Juli) gibt es eine freie Waschzone.",
            "Asturias: permit from the Confederación Hidrográfica del Cantábrico, info from the Principado de Asturias (mines). During the Navelgas championship (end of July) there is a free panning zone."),
 "ES-MS": ("Kastilien-León / Galicien: Erlaubnis der Confederación Hidrográfica Miño-Sil (Nutzung des Flussbetts) und der Region (Junta de Castilla y León bzw. Xunta de Galicia – Bergbau). Schutzgebiete wie Las Médulas sind tabu.",
           "Castile-León / Galicia: permit from the Confederación Hidrográfica Miño-Sil and the region (mining office). Protected areas like Las Médulas are off limits."),
 "FR": ("Hobby-Goldwaschen (orpaillage de loisir) mit Pfanne, Schaufel und Sieb ist grundsätzlich geduldet. Vorher bei der Mairie und der DDT(M) des Départements fragen (Erlasse der Präfektur, Laichzonen). Ufer sind oft Privatgrund – Eigentümer fragen. Keine Motorpumpen.",
        "Hobby gold panning (orpaillage de loisir) with pan, shovel and sieve is generally tolerated. Ask the town hall and the département's DDT(M) first (prefecture orders, spawning zones). Banks are often private – ask the owner. No motor pumps."),
}

# (Land, Name, Fluss, Breite, Länge, Art, Fund-Schlüssel, Bewilligungs-Schlüssel oder None = Land, Beschreibung DE, Beschreibung EN)
SPOTS = [
 # Deutschland
 ("DE", "Rhein bei Neuburgweier", "Rhein", 48.9705, 8.2664, "free", "rhein", None, "Klassisches Rheingold auf Kiesbänken am Oberrhein. Am besten nach Hochwasser an frisch umgelagerten Kiesbankköpfen. Naturschutzgebiete und Rheinauen beachten.", "Classic Rhine gold on gravel bars of the Upper Rhine. Best after floods on freshly reworked bar heads. Respect nature reserves."),
 ("DE", "Rhein bei Rheinau (Ortenau)", "Rhein", 48.6611, 7.9383, "free", "rhein", None, "Rheingold-Gebiet am Oberrhein; früher wurde hier gewerbsmässig Gold gewaschen. Schutzgebiete beachten.", "Rhine gold area on the Upper Rhine, historically washed commercially. Respect protected areas."),
 ("DE", "Rhein bei Breisach", "Rhein", 48.0291, 7.5806, "free", "rhein", None, "Historisches Rheingold-Gebiet am Kaiserstuhl. Schutzgebiete beachten.", "Historic Rhine gold area near the Kaiserstuhl."),
 ("DE", "Isar zwischen Bad Tölz und Wolfratshausen", "Isar", 47.8357, 11.4931, "free", "isar", None, "Isargold auf den Kiesbänken. Grosse Teile der Isarauen sind Naturschutzgebiet (z. B. Pupplinger Au) – dort nicht waschen.", "Isar gold on gravel bars. Large parts are nature reserves (e.g. Pupplinger Au) – no panning there."),
 ("DE", "Eder bei Affoldern (Edertal)", "Eder", 51.1667, 9.0855, "free", "eder", None, "Edergold – bekanntestes Goldwaschgebiet Hessens, unterhalb des Edersees.", "Eder gold – Hesse's best-known panning area, below the Edersee."),
 ("DE", "Eder bei Frankenberg / Goldberg Eisenberg (Korbach)", "Eder", 51.0772, 8.7908, "free", "eder", None, "Edergold; in der Nähe das historische Goldbergwerk Eisenberg bei Korbach (Besucherbergwerk) – die Quelle des Edergolds.", "Eder gold; nearby the historic Eisenberg gold mine near Korbach (visitor mine)."),
 ("DE", "Schwarza bei Schwarzburg", "Schwarza", 50.6421, 11.1957, "free", "thuer", None, "Thüringer Waschgold aus dem Schwarzatal, seit dem Mittelalter gewaschen.", "Thuringian placer gold of the Schwarza valley, washed since medieval times."),
 ("DE", "Schwarza bei Goldisthal", "Schwarza", 50.5187, 11.0045, "free", "thuer", None, "Oberlauf der Schwarza, historisches Goldwaschgebiet (der Ortsname sagt es).", "Upper Schwarza, historic gold panning area."),
 ("DE", "Goldkronach (Fichtelgebirge)", "Bäche um Goldkronach", 49.9996, 11.6954, "free", "fichtel", None, "Historischer Goldbergbau mit Besucherbergwerk und Goldbergbaumuseum; Waschgold in den Bächen.", "Historic gold mining with visitor mine and museum; placer gold in the creeks."),
 # Österreich
 ("AT", "Rauris – Goldwaschplatz Bodenhaus", "Hüttwinklache", 47.1052, 12.9917, "site", "tauern", None, "Offizieller Goldwaschplatz im Hüttwinkltal (Tauerngold). Pfannen vor Ort, gegen Gebühr – ohne Formalitäten.", "Official gold panning site in the Hüttwinkl valley. Pans available; fee – no paperwork."),
 ("AT", "Rauris – Hochalm", "Hochalm", 47.2246, 12.9950, "site", "tauern", None, "Goldwaschen auf der Hochalm (Bergbahn Rauris), betreuter Waschplatz.", "Gold panning at the Hochalm (Rauris cable car), supervised site."),
 ("AT", "Böckstein / Gasteinertal", "Gasteiner Ache", 47.0908, 13.1185, "show", "tauern", None, "Altes Tauerngold-Revier mit Montanmuseum Altböckstein.", "Old Tauern gold district with mining museum Altböckstein."),
 ("AT", "Heiligenblut (Kärnten)", "Möll / Gößnitz", 47.0385, 12.8408, "site", "tauern", None, "Geführtes Goldwaschen im Nationalpark Hohe Tauern. Selbständig im Nationalpark nicht erlaubt.", "Guided gold panning in the Hohe Tauern National Park. Not allowed on your own inside the park."),
 ("AT", "Hainzenberg / Zell am Ziller", "Ziller", 47.2182, 11.9000, "show", "mine", None, "Goldschaubergwerk Hainzenberg (Tirol), mit Goldwaschen für Besucher.", "Show gold mine Hainzenberg (Tyrol), panning for visitors."),
 ("AT", "Salzach bei Lend", "Salzach", 47.2985, 13.0440, "permit", "tauern", None, "Die Zubringer aus den Tauern tragen das Gold in die Salzach.", "Tauern gold carried into the Salzach by its tributaries."),
 # Schweiz
 ("CH", "Grosse Fontanne bei Doppleschwand (Napf)", "Grosse Fontanne", 47.0181, 8.0553, "free", "napf", None, "Bekanntestes Napfgold-Gewässer. Kanton Luzern: keine besonderen Vorgaben bekannt.", "Best-known Napf gold stream. Canton Lucerne: no special rules known."),
 ("CH", "Kleine Emme bei Wolhusen (Napf)", "Kleine Emme", 47.0580, 8.0726, "free", "napf", None, "Napfgold in der Kleinen Emme, viele Kiesbänke. Kanton Luzern.", "Napf gold in the Kleine Emme, many gravel bars. Canton Lucerne."),
 ("CH", "Luthern (Napf)", "Luthern", 47.0590, 7.9169, "free", "napf", None, "Napfgold-Gewässer, auch in der swisstopo-Rohstoffkarte als Goldvorkommen. Kanton Luzern.", "Napf gold stream, listed as gold occurrence by swisstopo. Canton Lucerne."),
 ("CH", "Ilfis / Emme bei Trubschachen (Napf)", "Ilfis", 46.9229, 7.8467, "free", "napf", None, "Napfgold im Emmental. Kanton Bern: Pfanne und Schaufel, max. 3 Personen, 1. Mai – 30. Sept. bewilligungsfrei.", "Napf gold in the Emmental. Canton Bern: pan and shovel, max. 3 people, 1 May – 30 Sept. without permit."),
 ("CH", "Vorderrhein bei Disentis", "Vorderrhein", 46.7426, 8.8530, "permit", "graub", None, "Rheingold in der Surselva. Gemeinde Disentis/Mustér: Bewilligung nötig.", "Rhine gold in the Surselva. Disentis/Mustér: permit needed."),
 ("CH", "Medelser Rhein bei Curaglia (Medel)", "Rein da Medel", 46.6733, 8.8568, "permit", "graub", None, "Klassisches Bündner Goldwaschgebiet. Gemeinde Medel/Lucmagn: jegliches Goldwaschen bewilligungspflichtig (Gemeindeverwaltung).", "Classic Grisons gold area. Medel/Lucmagn: all panning needs a municipal permit."),
 ("CH", "Malcantone bei Astano (Tessin)", "Magliasina / Tresa", 46.0126, 8.8159, "permit", "tessin", None, "Ehemalige Goldminen im Malcantone (Sessa, Astano). Kanton Tessin: bewilligungspflichtig.", "Former gold mines of the Malcantone. Canton Ticino: permit required."),
 ("CH", "Allondon bei Dardagny (Genf)", "Allondon", 46.1992, 5.9838, "permit", "genf", None, "Bekanntes Genfer Goldgewässer. Kanton Genf: bewilligungspflichtig; Teile sind Naturschutzgebiet.", "Known Geneva gold stream. Permit required; parts are nature reserve."),
 # Italien
 ("IT", "Elvo bei Vermogno (Biella)", "Elvo", 45.4825, 8.0248, "permit", "elvo", None, "„Mekka“ der italienischen Goldsucher, neben der römischen Goldmine Bessa (Naturreservat – dort nicht graben). Goldmuseum in Vermogno.", "'Mecca' of Italian gold hunters, next to the Roman Bessa gold mine (nature reserve – no digging). Gold museum in Vermogno."),
 ("IT", "Orba bei Silvano d'Orba", "Orba", 44.6869, 8.6750, "permit", "orba", None, "Klassisches Goldwaschgebiet Orba/Piota (Ovadese).", "Classic Orba/Piota gold area."),
 ("IT", "Piota / Orba bei Casaleggio Boiro", "Piota", 44.6129, 8.7397, "permit", "orba", None, "Goldführende Bäche im Alto Monferrato mit römischen Goldwäschen.", "Gold-bearing streams of the Alto Monferrato with Roman workings."),
 ("IT", "Ticino bei Oleggio", "Ticino", 45.5972, 8.6371, "permit", "ticino", "IT-LOM", "Ticino-Gold an der Grenze Piemont/Lombardei. Grosse Teile liegen im Naturpark Valle del Ticino.", "Ticino gold on the Piedmont/Lombardy border. Large parts lie in the Valle del Ticino park."),
 ("IT", "Dora Baltea bei Mazzè", "Dora Baltea", 45.3003, 7.9327, "permit", "dora", None, "Goldführende Dora Baltea im Canavese.", "Gold-bearing Dora Baltea in the Canavese."),
 ("IT", "Macugnaga – Goldmine Guia", "Anza", 45.9684, 7.9673, "show", "mine", None, "Besucher-Goldmine Guia im Monte-Rosa-Gebiet (Valle Anzasca).", "Guia visitor gold mine in the Monte Rosa area."),
 # Spanien – Asturien
 ("ES", "Navelgas (Tineo, Asturien)", "Río Navelgas / Bárcena", 43.4105, -6.5687, "site", "asturien", "ES-AST", "„Valle del Oro“ mit Goldwasch-Museum; jedes Jahr Ende Juli Goldwasch-Meisterschaft mit freier Waschzone.", "'Valle del Oro' with gold museum; panning championship end of July with a free panning zone."),
 ("ES", "Río Navelgas – Seitenzonen", "Río Navelgas", 43.4080, -6.5460, "permit", "asturien", "ES-AST", "Nicht direkt im Dorf, sondern Nebenarme, alte Hochwasserlinien, Kies- und Sandbänke. Navelgas ist offiziell als Goldgebiet mit römischer Goldgewinnung dokumentiert (IGME).", "Not in the village itself but side channels, old flood lines, gravel and sand bars. Officially documented gold area with Roman workings."),
 ("ES", "Naraval / Río Naraval", "Río Naraval", 43.3970, -6.5750, "permit", "asturien", "ES-AST", "Besser als der Hauptbach: kleine Seitenrinnen, flache Sedimentzonen, alte Kurven neben dem Bach, kleine Terrassen.", "Better than the main creek: side gullies, flat sediment zones, old bends, small terraces."),
 ("ES", "Yerbo / kleine Zuflüsse", "Zuflüsse Río Navelgas", 43.3840, -6.5360, "permit", "asturien", "ES-AST", "Ruhiger und weniger offensichtlich – gut für Testpfannen.", "Quieter and less obvious – good for test pans."),
 ("ES", "San Feliz (NE von Navelgas)", "Bäche um San Feliz", 43.4550, -6.4200, "permit", "asturien", "ES-AST", "Goldhinweise in Eluvionen über der Vegadeo-Formation beschrieben (Fachliteratur).", "Gold reported in eluvium above the Vegadeo formation (literature)."),
 # Spanien – El Bierzo / Sil
 ("ES", "Sil bei Ponferrada", "Sil", 42.4984, -6.5663, "permit", "sil", "ES-MS", "Goldfluss Sil im Bierzo.", "Gold river Sil in El Bierzo."),
 ("ES", "Puente de Domingo Flórez / Río Sil", "Sil", 42.4160, -6.8180, "permit", "sil", "ES-MS", "Guter Startpunkt für tiefer liegende Umlagerungen unterhalb von Las Médulas. Nicht in geschützten Bereichen graben.", "Good start for reworked gravels below Las Médulas. No digging in protected areas."),
 ("ES", "Sobradelo / Río Sil", "Sil", 42.4140, -6.9820, "permit", "sil", "ES-MS", "Breitere Talbereiche, Kies- und Sandbänke, alte Hochwasserterrassen mit Transportgold. Parkplatz als Start, dann 0,5–2 km die Seitenzonen ablaufen.", "Wider valley, gravel and sand bars, old flood terraces with transported gold."),
 ("ES", "Sil bei O Barco de Valdeorras", "Sil", 42.4301, -6.9801, "permit", "sil", "ES-MS", "Goldführender Sil in Galicien.", "Gold-bearing Sil in Galicia."),
 ("ES", "La Baña / Río Cabrera", "Río Cabrera", 42.3030, -6.7590, "permit", "cabrera", "ES-MS", "Seitentäler, trockene Rinnen und altes Schwemmmaterial; viele römische Abbaustellen und Terrassen entlang Sil/Cabrera. Gute Kombination aus Geologie und wenig besuchten Zonen.", "Side valleys, dry gullies and old alluvium; many Roman workings along Sil/Cabrera. Little visited."),
 ("ES", "Las Médulas (Carucedo)", "–", 42.4851, -6.7915, "closed", "medulas", "ES-MS", "Grösste römische Goldmine, UNESCO-Welterbe – nur ansehen, nicht graben.", "Largest Roman gold mine, UNESCO World Heritage – look only, no digging."),
 # Frankreich
 ("FR", "Ariège bei Varilhes", "Ariège", 43.0424, 1.6273, "permit", "pyr", None, "Die Ariège ist Frankreichs bekanntester Goldfluss. Besonders Sandbänke und Innenkurven sind beliebt; Vereine helfen.", "The Ariège is France's best-known gold river. Sand bars and inside bends are popular."),
 ("FR", "Gave de Pau bei Nay", "Gave de Pau", 43.1770, -0.2640, "permit", "pyr", None, "Der Gave de Pau bringt Gold aus den zentralen Pyrenäen.", "The Gave de Pau carries gold from the central Pyrenees."),
 ("FR", "Garonne bei Saint-Gaudens", "Garonne", 43.1078, 0.7247, "permit", "pyr", None, "Garonne-Gold aus den Pyrenäen.", "Garonne gold from the Pyrenees."),
 ("FR", "Gardon bei Anduze (Cevennen)", "Gardon", 44.0546, 3.9857, "permit", "cevennen", None, "Einer der bekanntesten Goldflüsse Frankreichs. In Anduze gibt es Goldwasch-Kurse.", "One of France's best-known gold rivers. Panning courses in Anduze."),
 ("FR", "Gardon bei Alès", "Gardon d'Alès", 44.1250, 4.0810, "permit", "cevennen", None, "Gardon d'Alès, feine Goldflitter.", "Gardon d'Alès, fine gold flakes."),
 ("FR", "Cèze bei Saint-Ambroix", "Cèze", 44.2600, 4.1998, "permit", "cevennen", None, "Goldführende Cèze in den Cevennen.", "Gold-bearing Cèze in the Cévennes."),
 ("FR", "Allier bei Brioude (Auvergne)", "Allier", 45.2940, 3.3840, "permit", "allier", None, "Zentralmassiv: der Allier ist bekannt für Schwemmland mit feinem Waschgold. In der Auvergne gibt es touristische Goldwasch-Angebote.", "Massif Central: the Allier is known for alluvium with fine gold. Tourist panning offers in the Auvergne."),
 ("FR", "Pays de Saint-Yrieix (Haute-Vienne)", "Bäche um Saint-Yrieix-la-Perche", 45.5150, 1.2050, "site", "limousin", None, "Historisch bekanntes Goldgebiet im Limousin. Der Naturpark Périgord-Limousin bietet geführte Goldwasch-Kurse – gut für Anfänger.", "Historic gold area in the Limousin. The Périgord-Limousin nature park offers guided courses – good for beginners."),
 ("FR", "Mûr-de-Bretagne (Goldenes Dreieck)", "Bäche um Guerlédan", 48.1990, -2.9890, "permit", "bretagne", None, "„Goldenes Dreieck der Bretagne“ zwischen Mûr-de-Bretagne, Loudéac und Pontivy – Quarzvorkommen und goldführende Bäche.", "'Golden triangle of Brittany' between Mûr-de-Bretagne, Loudéac and Pontivy."),
 ("FR", "Pontivy / Blavet (Goldenes Dreieck)", "Blavet", 48.0680, -2.9630, "permit", "bretagne", None, "Südecke des goldenen Dreiecks der Bretagne.", "Southern corner of Brittany's golden triangle."),
 ("FR", "Loudéac (Goldenes Dreieck)", "Bäche um Loudéac", 48.1780, -2.7540, "permit", "bretagne", None, "Ostecke des goldenen Dreiecks der Bretagne.", "Eastern corner of Brittany's golden triangle."),
 ("FR", "Rhein bei Rhinau (Elsass)", "Rhin", 48.3181, 7.7055, "permit", "rhein", None, "Rheingold auf französischer Seite. Teile sind Naturschutzgebiet (Réserve naturelle).", "Rhine gold on the French side. Parts are nature reserves."),
]

feats = []
for c, name, river, lat, lon, kind, find, permit, de, en in SPOTS:
    f, p = FIND[find], PERMIT[permit or c]
    feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
                  "properties": {"name": name, "country": c, "river": river, "kind": kind, "de": de, "en": en,
                                 "find_de": f[0], "find_en": f[1], "permit_de": p[0], "permit_en": p[1]}})
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"type": "FeatureCollection", "features": feats}, open(OUT, "w"), ensure_ascii=False, indent=0)
print(len(feats), "Orte ->", OUT)

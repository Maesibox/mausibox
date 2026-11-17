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
 "schottland": ("Flitter und kleine Nuggets – schottisches Gold ist oft recht grob.", "Flakes and small nuggets – Scottish gold is often fairly coarse."),
 "wales": ("Nur ansehen: römische Goldmine mit Führungen.", "Look only: Roman gold mine with tours."),
 "wicklow": ("Flitter und kleine Körner; 1795 gab es hier einen Goldrausch mit Nuggets bis über 600 g.", "Flakes and small grains; gold rush in 1795 with nuggets over 600 g."),
 "lappland": ("Lappland-Gold: Flitter und Nuggets, teils grob.", "Lapland gold: flakes and nuggets, partly coarse."),
 "smaland": ("Feine Flitter rund um das alte Goldbergwerk.", "Fine flakes around the old gold mine."),
 "otava": ("Feine Flitter, selten kleine Körner; viel Schwarzsand.", "Fine flakes, rarely small grains; lots of black sand."),
 "hron": ("Feine Flitter aus den Kremnitzer und Schemnitzer Bergen.", "Fine flakes from the Kremnica and Štiavnica mountains."),
 "kaczawa": ("Feine Flitter, selten kleine Körner.", "Fine flakes, rarely small grains."),
 "bretagne": ("Flitter und kleine Körner; goldführende Quarzgänge in der Umgebung.", "Flakes and small grains; gold-bearing quartz veins nearby."),
}

# Bewilligung / wo fragen (DE, EN, Link zum Formular / zur Stelle) – Standard pro Land, einzelne Orte können einen eigenen Eintrag haben
PERMIT = {
 "DE": ("Hobby mit Pfanne und Schaufel ist in den meisten Bundesländern ohne Bewilligung geduldet (nicht gewerblich). Fragen: Untere Naturschutzbehörde (Landratsamt) für Schutzgebiete, Fischereiberechtigter wegen Laichzeiten, Grundeigentümer für den Zugang. Keine Motorpumpen.",
        "Hobby panning with pan and shovel is tolerated without permit in most states (non-commercial). Ask: district nature-protection office for reserves, fishing rights holder for spawning seasons, landowner for access. No motor pumps.", None),
 "AT": ("Anzeige bei der Montanbehörde (Bundesministerium für Finanzen) und vorher Zustimmung von Grundeigentümer und Fischereiberechtigtem. In Kärnten braucht es ausserhalb betreuter Plätze eine Bewilligung (Bezirkshauptmannschaft / Gemeinde). Einfachster legaler Weg: offizielle Waschplätze.",
        "Report to the mining authority (Federal Ministry of Finance) and get consent of landowner and fishing rights holder first. Carinthia: permit needed outside supervised sites (district authority / municipality). Easiest legal way: official panning sites.", None),
 "CH": ("Je nach Kanton und Gemeinde – Details in der Ebene «Goldwaschen-Regeln pro Kanton». Meist Gemeinde- oder Kantonsverwaltung (Fischerei / Umwelt). Fisch-Schonzeiten beachten, keine Motorgeräte.",
        "Depends on canton and municipality – see the layer 'Gold panning rules per canton'. Usually municipality or canton (fisheries / environment). Respect fish closed seasons, no motorised gear.",
        "https://www.goldwaschen.ch/gold-in-der-schweiz/kantonale-bestimmungen/"),
 "IT": ("Piemont: kostenloser Ausweis (tesserino) der Region Piemont. Formular online ausfüllen, ausdrucken, unterschreiben und mit Ausweiskopie einsenden – der Ausweis kommt per Post, einige Wochen einplanen. Klappt das Online-Formular nicht: Mail an settore.estrattivo@regione.piemonte.it. Nur Handwerkzeug, max. 5 g Gold pro Tag (L.R. 51/1995). Grundeigentümer fragen; Schutzgebiete haben eigene Regeln.",
        "Piedmont: free collector card (tesserino) from the Piedmont region. Fill in the online form, print, sign and send it with a copy of your ID – the card comes by post, allow a few weeks. If the online form fails: e-mail settore.estrattivo@regione.piemonte.it. Hand tools only, max. 5 g gold per day. Ask the landowner; protected areas have their own rules.",
        "https://www.regione.piemonte.it/web/temi/sviluppo/attivita-estrattive/raccoglitori-ricercatori-minerali-scopo-collezionistico"),
 "IT-ORBA": ("Piemont-Ausweis (tesserino) nötig, siehe Link. Bei der Riserva naturale del Torrente Orba hat die Region eine Zone ausgeschieden, in der Goldsuchen als Hobby erlaubt ist – im übrigen Reservat nicht.",
             "Piedmont collector card needed (see link). Next to the Torrente Orba nature reserve the region has designated a zone where hobby gold panning is allowed – not in the rest of the reserve.",
             "https://www.regione.piemonte.it/web/temi/sviluppo/attivita-estrattive/raccoglitori-ricercatori-minerali-scopo-collezionistico"),
 "IT-LOM": ("Im Parco del Ticino ist Sammeln verboten. Ausserhalb: Piemont-Ufer → Ausweis der Region Piemont (Link); Lombardei-Ufer → Region Lombardei fragen.",
            "Collecting is forbidden in the Ticino park. Outside: Piedmont bank → Piedmont collector card (link); Lombardy bank → ask the Lombardy region.",
            "https://www.regione.piemonte.it/web/temi/sviluppo/attivita-estrattive/raccoglitori-ricercatori-minerali-scopo-collezionistico"),
 "ES-AST": ("Erste Anlaufstelle ist das Museo del Oro de Asturias in Navelgas (Tel. +34 985 806 018, info@museodeloro.es) – dort weiss man immer, was gerade gilt und wo man waschen darf. Waschkurs im Museum März–Dezember (reservieren). Formell zuständig für Arbeiten im Flussbett: Confederación Hidrográfica del Cantábrico; Fischerei: Principado de Asturias. Während der Meisterschaft (Ende Juli) gibt es eine freie Waschzone.",
            "First stop: the Museo del Oro de Asturias in Navelgas (tel. +34 985 806 018, info@museodeloro.es) – they always know the current rules and where panning is allowed. Panning course March–December (book ahead). Formally responsible for the riverbed: Confederación Hidrográfica del Cantábrico; fishing: Principado de Asturias. Free panning zone during the championship (end of July).",
            "https://museodeloro.es/"),
 "ES-MS": ("Kastilien-León / Galicien: Antrag bei der Confederación Hidrográfica Miño-Sil (Nutzung des Flussbetts), dazu die Region fragen (Junta de Castilla y León bzw. Xunta de Galicia – Bergbau). Schutzgebiete wie Las Médulas sind tabu.",
           "Castile-León / Galicia: apply to the Confederación Hidrográfica Miño-Sil (use of the riverbed) and check with the region's mining office. Protected areas like Las Médulas are off limits.",
           "https://www.chminosil.es/"),
 "FR": ("Bewilligung (autorisation d'orpaillage de loisir) bei der DDT(M) des Départements (Police de l'eau) beantragen – früh! Die Bearbeitung dauert oft 1–2 Monate. Angaben: Name, Flussabschnitte mit Karte, Zeitraum, Material (nur Pfanne, Schaufel, Sieb). Gilt nur für dieses eine Département und ein Jahr. Ausserhalb öffentlicher Flüsse zusätzlich Zustimmung des Ufer-Eigentümers. Der Link führt zur Adressliste aller Départements.",
        "Apply early for an 'autorisation d'orpaillage de loisir' at the département's DDT(M) (water police) – processing often takes 1–2 months. Give name, river sections with map, period and gear (pan, shovel, sieve only). Valid for that one département and one year. Outside public rivers you also need the bank owner's consent. The link lists the addresses of all départements.",
        "https://www.goldlineorpaillage.fr/adresse-faire-autorisations-orpaillage/"),
 "FR-30": ("Gard: Antrag bei der DDTM du Gard, am besten online (Link) – mindestens 2 Wochen vorher, auf Papier mindestens 2 Monate. Bearbeitung nach Eingang, kann bis 2 Monate dauern. Saison 16. Mai – 30. November, jedes Jahr neu, gilt nur im Gard. Nur Handwerkzeug.",
           "Gard: apply to the DDTM du Gard, preferably online (link) – at least 2 weeks ahead, on paper at least 2 months. Processed in order of arrival, up to 2 months. Season 16 May – 30 November, renew every year, valid in the Gard only. Hand tools only.",
           "https://demarche.numerique.gouv.fr/commencer/demande-d-orpaillage-de-loisir"),
 "FR-09": ("Ariège: Bewilligung der DDT de l'Ariège nach Präfekturerlass. Waschen nur vom 1. Mai bis 31. Oktober und nur in freigegebenen Abschnitten, jedes Jahr neu beantragen – früh einreichen, die Bearbeitung kann über einen Monat dauern. Hinweise und Formular im Link.",
           "Ariège: permit from the DDT de l'Ariège under a prefecture order. Panning only 1 May – 31 October and only in approved sections, renew every year – apply early, processing can take over a month. Notes and form in the link.",
           "https://www.ariege.gouv.fr/Actions-de-l-Etat/Environnement-biodiversite/EAU/Orpaillage-de-loisir"),
 "FR-87": ("Haute-Vienne: Antrag bei der DDT 87. Es gibt Berichte, dass Anträge in den letzten Jahren abgelehnt wurden – vorher anrufen. Sicherer Weg: geführte Kurse des Naturparks Périgord-Limousin.",
           "Haute-Vienne: apply to the DDT 87. There are reports of refusals in recent years – call first. Safe option: guided courses of the Périgord-Limousin nature park.",
           "https://www.goldlineorpaillage.fr/adresse-faire-autorisations-orpaillage/"),
 "FR-BZH": ("Bretagne: Die DDT(M) der Côtes-d'Armor und des Morbihan erteilen zurzeit keine Bewilligungen (Natura 2000, Gewässerschutz) – Goldwaschen ist dort faktisch verboten (Stand 2026). Ebenso Finistère, Jura, Landes und Tarn-et-Garonne.",
            "Brittany: the DDT(M) of Côtes-d'Armor and Morbihan currently grant no permits (Natura 2000, water protection) – panning is effectively forbidden there (2026). Same for Finistère, Jura, Landes and Tarn-et-Garonne.",
            "https://www.prospection-de-loisir.fr/departement-interdit-orpaillage/"),
 "UK": ("Gold gehört in Grossbritannien der Krone; Crown Estate Scotland gibt keine Hobby-Lizenzen. Man braucht die Erlaubnis des Grundbesitzers bzw. eine lokale Tageskarte (Wanlockhead, Kildonan, Tyndrum). Lachs-Laichzeiten beachten. Wales: Natural Resources Wales erlaubt Goldwaschen auf seinem Land nicht.",
        "In Britain gold belongs to the Crown; Crown Estate Scotland issues no hobby licences. You need the landowner's permission or a local day permit (Wanlockhead, Kildonan, Tyndrum). Respect salmon spawning seasons. Wales: Natural Resources Wales does not allow panning on its land.",
        "https://ukgoldprospector.co.uk/news/gold-panning-laws-uk.html"),
 "IE": ("Gold gehört dem Staat, kleine Hobby-Funde werden toleriert. Motorgeräte in Gewässern verboten. Grundeigentümer fragen.",
        "Gold belongs to the state; small hobby finds are tolerated. No motorised gear in waters. Ask the landowner.", None),
 "FI": ("Auf Staatsland braucht es eine Goldwasch-Erlaubnis der Bergbaubehörde Tukes (online, bis 10 Jahre, jährlicher Bericht über Gold und Erdmenge). Auf Privatland reicht die Zustimmung des Eigentümers. Lemmenjoki-Nationalpark: nur in ausgewiesenen Goldwasch-Gebieten und mit Erlaubnis; Infos beim Metsähallitus-Kundendienst in Ivalo. Ohne Papierkram: Touristen-Waschplätze (Tankavaara) und geführte Touren.",
        "On state land you need a gold panning permit from the mining authority Tukes (online, up to 10 years, annual report on gold and soil). On private land the owner's consent is enough. Lemmenjoki NP: only in designated panning areas with a permit; info at Metsähallitus customer service in Ivalo. No paperwork: tourist panning sites (Tankavaara) and guided tours.",
        "https://tukes.fi/en/mining-ore-prospecting-and-gold-panning/gold-panning"),
 "SE": ("Hobby-Waschen mit der Pfanne braucht laut SGU normalerweise keine Bewilligung nach dem Mineralgesetz; Löcher wieder zufüllen. Ob es vom Jedermannsrecht gedeckt ist, ist umstritten – Grundeigentümer fragen. In Naturreservaten und Nationalparks verboten, Motorgeräte nur mit Bewilligung. Vorher bei Bergsstaten prüfen, ob dort eine Konzession besteht.",
        "According to SGU, hobby panning with a pan normally needs no permit under the Minerals Act; refill holes. Whether it is covered by the right of public access is disputed – ask the landowner. Forbidden in nature reserves and national parks; motorised gear only with a permit. Check with Bergsstaten whether a concession exists there.",
        "https://www.detektorist.se/vaska-guld-sverige-regler/"),
 "CZ": ("Waschen mit Pfanne als Hobby ist geduldet: nur Handwerkzeug, Flussbett nicht verändern, Gold nicht verkaufen. In Nationalparks, Landschaftsschutzgebieten (CHKO) und Naturreservaten verboten. Grundeigentümer bzw. Gewässerverwalter (Povodí) fragen.",
        "Hobby panning is tolerated: hand tools only, don't alter the riverbed, don't sell the gold. Forbidden in national parks, protected landscape areas (CHKO) and reserves. Ask the landowner or river authority (Povodí).",
        "https://www.rawgold.eu/blog/50681-ryzovani-zlata-a-zakon-co-je-legalni-a-co-uz-je-tezba-2025"),
 "SK": ("Rechtslage unklar – Quellen widersprechen sich (teils «frei für den Eigenbedarf», teils «nur mit Bewilligung»). In Nationalparks verboten, Kiesgruben nur mit Erlaubnis des Besitzers. Vorher Gemeinde bzw. Gewässerverwalter (Slovenský vodohospodársky podnik) fragen.",
        "Legal situation unclear – sources disagree. Forbidden in national parks; gravel pits only with the owner's consent. Ask the municipality or the river authority first.",
        "https://www.rawgold.sk/post/60935-kde-ryzovat-zlato-na-slovensku"),
 "PL": ("Laut gängigen Quellen ohne Bewilligung geduldet (freier Zugang zu öffentlichen Gewässern); auf Privatgrund Zustimmung des Eigentümers. Rechtslage nicht ganz eindeutig (Wasserrecht). Keine Motorgeräte, Schutzgebiete meiden.",
        "According to common sources tolerated without permit (free access to public waters); on private land the owner's consent. Legal situation not entirely clear (water law). No motorised gear, avoid protected areas.", None),
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
 ("IT", "Orba bei Silvano d'Orba", "Orba", 44.6869, 8.6750, "permit", "orba", "IT-ORBA", "Klassisches Goldwaschgebiet Orba/Piota (Ovadese).", "Classic Orba/Piota gold area."),
 ("IT", "Piota / Orba bei Casaleggio Boiro", "Piota", 44.6129, 8.7397, "permit", "orba", "IT-ORBA", "Goldführende Bäche im Alto Monferrato mit römischen Goldwäschen.", "Gold-bearing streams of the Alto Monferrato with Roman workings."),
 ("IT", "Ticino bei Oleggio", "Ticino", 45.5972, 8.6371, "permit", "ticino", "IT-LOM", "Ticino-Gold an der Grenze Piemont/Lombardei. Grosse Teile liegen im Naturpark Valle del Ticino.", "Ticino gold on the Piedmont/Lombardy border. Large parts lie in the Valle del Ticino park."),
 ("IT", "Dora Baltea bei Mazzè", "Dora Baltea", 45.3003, 7.9327, "permit", "dora", None, "Goldführende Dora Baltea im Canavese.", "Gold-bearing Dora Baltea in the Canavese."),
 ("IT", "Macugnaga – Goldmine Guia", "Anza", 45.9684, 7.9673, "show", "mine", None, "Besucher-Goldmine Guia im Monte-Rosa-Gebiet (Valle Anzasca).", "Guia visitor gold mine in the Monte Rosa area."),
 # Spanien – Asturien
 ("ES", "Navelgas (Tineo, Asturien)", "Río Navelgas / Bárcena", 43.4105, -6.5687, "site", "asturien", "ES-AST", "„Valle del Oro“ mit dem Museo del Oro de Asturias – hier zuerst nachfragen, die wissen immer, was aktuell gilt. Waschkurs im Museum (März–Dezember, reservieren). Jedes Jahr Ende Juli Goldwasch-Meisterschaft mit freier Waschzone.", "'Valle del Oro' with the Museo del Oro de Asturias – ask here first, they always know the current rules. Panning course at the museum (March–December, book ahead). Championship end of July with a free panning zone.", "https://museodeloro.es/"),
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
 ("FR", "Ariège bei Varilhes", "Ariège", 43.0424, 1.6273, "permit", "pyr", "FR-09", "Die Ariège ist Frankreichs bekanntester Goldfluss. Besonders Sandbänke und Innenkurven sind beliebt; Vereine helfen.", "The Ariège is France's best-known gold river. Sand bars and inside bends are popular."),
 ("FR", "Gave de Pau bei Nay", "Gave de Pau", 43.1770, -0.2640, "permit", "pyr", None, "Der Gave de Pau bringt Gold aus den zentralen Pyrenäen.", "The Gave de Pau carries gold from the central Pyrenees."),
 ("FR", "Garonne bei Saint-Gaudens", "Garonne", 43.1078, 0.7247, "permit", "pyr", None, "Garonne-Gold aus den Pyrenäen.", "Garonne gold from the Pyrenees."),
 ("FR", "Gardon bei Anduze (Cevennen)", "Gardon", 44.0546, 3.9857, "permit", "cevennen", "FR-30", "Einer der bekanntesten Goldflüsse Frankreichs. In Anduze gibt es Goldwasch-Kurse.", "One of France's best-known gold rivers. Panning courses in Anduze."),
 ("FR", "Gardon bei Alès", "Gardon d'Alès", 44.1250, 4.0810, "permit", "cevennen", "FR-30", "Gardon d'Alès, feine Goldflitter.", "Gardon d'Alès, fine gold flakes."),
 ("FR", "Cèze bei Saint-Ambroix", "Cèze", 44.2600, 4.1998, "permit", "cevennen", "FR-30", "Goldführende Cèze in den Cevennen.", "Gold-bearing Cèze in the Cévennes."),
 ("FR", "Allier bei Brioude (Auvergne)", "Allier", 45.2940, 3.3840, "permit", "allier", None, "Zentralmassiv: der Allier ist bekannt für Schwemmland mit feinem Waschgold. In der Auvergne gibt es touristische Goldwasch-Angebote.", "Massif Central: the Allier is known for alluvium with fine gold. Tourist panning offers in the Auvergne."),
 ("FR", "Pays de Saint-Yrieix (Haute-Vienne)", "Bäche um Saint-Yrieix-la-Perche", 45.5150, 1.2050, "site", "limousin", "FR-87", "Historisch bekanntes Goldgebiet im Limousin. Der Naturpark Périgord-Limousin bietet geführte Goldwasch-Kurse – gut für Anfänger.", "Historic gold area in the Limousin. The Périgord-Limousin nature park offers guided courses – good for beginners."),
 ("FR", "Mûr-de-Bretagne (Goldenes Dreieck)", "Bäche um Guerlédan", 48.1990, -2.9890, "closed", "bretagne", "FR-BZH", "„Goldenes Dreieck der Bretagne“ zwischen Mûr-de-Bretagne, Loudéac und Pontivy – Quarzvorkommen und goldführende Bäche. Zurzeit keine Bewilligungen (DDT).", "'Golden triangle of Brittany' between Mûr-de-Bretagne, Loudéac and Pontivy."),
 ("FR", "Pontivy / Blavet (Goldenes Dreieck)", "Blavet", 48.0680, -2.9630, "closed", "bretagne", "FR-BZH", "Südecke des goldenen Dreiecks der Bretagne. Zurzeit keine Bewilligungen (DDT).", "Southern corner of Brittany's golden triangle."),
 ("FR", "Loudéac (Goldenes Dreieck)", "Bäche um Loudéac", 48.1780, -2.7540, "closed", "bretagne", "FR-BZH", "Ostecke des goldenen Dreiecks der Bretagne. Zurzeit keine Bewilligungen (DDT).", "Eastern corner of Brittany's golden triangle."),
 ("FR", "Rhein bei Rhinau (Elsass)", "Rhin", 48.3181, 7.7055, "permit", "rhein", None, "Rheingold auf französischer Seite. Teile sind Naturschutzgebiet (Réserve naturelle).", "Rhine gold on the French side. Parts are nature reserves."),
 # Grossbritannien
 ("UK", "Wanlockhead (Schottland)", "Wanlock Water", 55.3970, -3.7810, "site", "schottland", None, "Bekanntestes Goldgebiet Schottlands. Lizenz für Tag, Woche oder Jahr beim Museum of Lead Mining (für Buccleuch Estate). Dort werden auch die britischen Goldwasch-Meisterschaften ausgetragen.", "Scotland's best-known gold area. Day, week or annual licence from the Museum of Lead Mining (for Buccleuch Estate).", "https://www.leadminingmuseum.co.uk/"),
 ("UK", "Leadhills (Schottland)", "Glengonnar Water", 55.4180, -3.7600, "permit", "schottland", None, "Nachbarort von Wanlockhead. Eigene Erlaubnis des Leadhills Estate nötig (nicht die Wanlockhead-Lizenz).", "Next to Wanlockhead. Separate permission from the Leadhills Estate needed."),
 ("UK", "Kildonan Burn / Baile an Òr (Helmsdale)", "Kildonan Burn", 58.1650, -3.8650, "site", "schottland", None, "Ort des schottischen Goldrauschs von 1869. Tageskarte des Suisgill Estate nötig (ca. £15, vorher Bedingungen klären).", "Site of the 1869 Scottish gold rush. Suisgill Estate day permit needed (about £15, check terms)."),
 ("UK", "Tyndrum (Schottland)", "Bäche um Tyndrum", 56.4360, -4.7110, "permit", "schottland", None, "Goldgebiet um die Cononish-Mine. Erlaubnis für den Gemeindewald beim Strathfillan Community Development Trust.", "Gold area around the Cononish mine. Permit for the community woodland from the Strathfillan Community Development Trust."),
 ("UK", "Dolaucothi Gold Mines (Wales)", "Cothi", 52.0440, -3.9500, "show", "wales", None, "Römische Goldmine des National Trust mit Führungen. In Wales ist Goldwaschen auf NRW-Land nicht erlaubt.", "Roman gold mine of the National Trust with tours.", "https://www.nationaltrust.org.uk/visit/wales/dolaucothi"),
 # Irland
 ("IE", "Goldmines River bei Woodenbridge (Wicklow)", "Goldmines River", 52.8300, -6.2400, "permit", "wicklow", None, "Irlands bekanntester Goldbach am Croghan Kinshelagh. Grundeigentümer fragen.", "Ireland's best-known gold stream at Croghan Kinshelagh. Ask the landowner."),
 # Finnland
 ("FI", "Tankavaara – Goldmuseum und Goldwaschplatz", "Tankavaara", 68.1830, 27.1370, "site", "lappland", None, "Goldgräberdorf mit Goldmuseum und Waschplatz für Besucher; im Sommer finden hier oft Goldwasch-Meisterschaften statt.", "Gold prospectors' village with gold museum and panning for visitors.", "https://www.tankavaara.fi/"),
 ("FI", "Lemmenjoki-Nationalpark", "Lemmenjoki", 68.7760, 25.9800, "permit", "lappland", None, "Historisches Goldgräbergebiet mit noch aktiven Handwäschern. Waschen nur in ausgewiesenen Gebieten mit Erlaubnis; für Besucher geführte Bootstouren mit Goldwaschen.", "Historic gold-digging area with active hand miners. Panning only in designated areas with a permit; guided boat tours with panning for visitors.", "https://www.nationalparks.fi/lemmenjokinp/instructionsandrules"),
 # Schweden
 ("SE", "Ädelfors (Småland)", "Bäche um Ädelfors", 57.3170, 15.0670, "site", "smaland", None, "Schwedens ältestes Goldbergwerk mit Goldwaschen für Besucher.", "Sweden's oldest gold mine with panning for visitors.", "https://www.adelfors.nu/"),
 # Tschechien
 ("CZ", "Otava bei Písek", "Otava", 49.3000, 14.1300, "free", "otava", None, "Die Otava (Goldfluss Böhmens) ist das bekannteste Goldwaschgebiet Tschechiens. Schutzgebiete (CHKO Šumava flussaufwärts) meiden.", "The Otava is Czechia's best-known panning river. Avoid protected areas upstream (Šumava)."),
 ("CZ", "Jílové u Prahy – Goldbergbau-Museum", "Sázava", 49.8950, 14.4950, "show", "mine", None, "Regionalmuseum mit Besucherstollen im alten Goldrevier Jílové.", "Regional museum with visitor gallery in the old Jílové gold district.", "https://www.muzeumjilove.cz/"),
 # Slowakei
 ("SK", "Hron zwischen Banská Bystrica und Zvolen", "Hron", 48.6500, 19.0800, "permit", "hron", None, "Beliebter Abschnitt bei Hobby-Goldwäschern.", "Popular stretch with hobby panners."),
 ("SK", "Kremnica – Goldstadt", "–", 48.7050, 18.9180, "show", "mine", None, "Alte Goldbergbaustadt mit Münzstätte, Museum und Goldwaschen bei Veranstaltungen.", "Old gold mining town with mint and museum.", "https://www.kremnica.sk/"),
 # Polen
 ("PL", "Złotoryja / Kaczawa", "Kaczawa", 51.1260, 15.9200, "site", "kaczawa", None, "Polens Goldstadt: Goldwasch-Schule und jedes Jahr Ende Mai polnische Goldwasch-Meisterschaft. Goldwasch-Kurse auch in der Mühle Wielisław.", "Poland's gold town: panning school and Polish panning championship end of May.", "https://www.zlotoryja.pl/"),
]

feats = []
for spot in SPOTS:
    c, name, river, lat, lon, kind, find, permit, de, en = spot[:10]
    link = spot[10] if len(spot) > 10 else None     # eigene Anlaufstelle vor Ort (Museum, Waschplatz)
    f, p = FIND[find], PERMIT[permit or c]
    feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
                  "properties": {"name": name, "country": c, "river": river, "kind": kind, "de": de, "en": en,
                                 "find_de": f[0], "find_en": f[1], "permit_de": p[0], "permit_en": p[1],
                                 "permit_link": p[2], "link": link}})
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"type": "FeatureCollection", "features": feats}, open(OUT, "w"), ensure_ascii=False, indent=0)
print(len(feats), "Orte ->", OUT)

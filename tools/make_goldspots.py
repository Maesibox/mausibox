#!/usr/bin/env python3
"""
Erzeugt data/goldspots.geojson (Europa) und data/goldspots-us.geojson (USA): bekannte Goldwasch-Orte
(ungefähre Lage = Ort / Flussabschnitt).
Arten (kind): free = meist geduldet/frei (Regeln beachten), permit = Bewilligung/Anmeldung nötig,
site = offizieller/bezahlter Goldwaschplatz oder Kurs, show = Schaubergwerk/Museum (nur ansehen), closed = Graben verboten,
unclear = Regeln nicht geprüft (selbst vor Ort informieren), club = Club-Claims (nur für Mitglieder).
Jeder Ort bekommt: Beschreibung, "Was man findet" (FIND) und "Bewilligung / wo fragen" (PERMIT, sonst das Land).
Ergänzen: einfach eine Zeile in SPOTS anfügen und das Skript laufen lassen:  python3 tools/make_goldspots.py
"""
import json, os
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")

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
 "portugal": ("Feine Flitter; im Norden römische Goldminen mit Waschgold in den Bächen.", "Fine flakes; Roman gold mines in the north with placer gold in the creeks."),
 "siebenb": ("Siebenbürgisches Gold: Flitter im Arieș, der seit der Römerzeit gewaschen wird.", "Transylvanian gold: flakes in the Arieș, washed since Roman times."),
 "drau": ("Sehr feines Flittergold (Drau- und Murgold) mit Schwarzsand.", "Very fine flake gold (Drava and Mura gold) with black sand."),
 "finnmark": ("Flitter und kleine Körner – 1866 erster Goldfund Nordnorwegens bei Karasjok.", "Flakes and small grains – first gold find of northern Norway near Karasjok in 1866."),
 "az": ("Flitter und Nuggets im Wüstenschotter – oft mit dem Metalldetektor gesucht.", "Flakes and nuggets in desert gravels – often searched with a metal detector."),
 "az-creek": ("Feine Flitter und kleine Körner im Bachkies.", "Fine flakes and small grains in the creek gravel."),
 "motherlode": ("Mother-Lode-Gold: Flitter, ab und zu kleine Nuggets.", "Mother Lode gold: flakes, occasionally small nuggets."),
 "kern": ("Flitter und kleine Körner.", "Flakes and small grains."),
 "oregon": ("Flitter und kleine Körner aus den Klamath- und Kaskaden-Bergen.", "Flakes and small grains from the Klamath and Cascade mountains."),
 "alaska": ("Flitter bis grobe Nuggets – Alaska-Gold ist oft grob.", "Flakes to coarse nuggets – Alaska gold is often coarse."),
 "nome": ("Feines Strandgold im Sand der Beringsee.", "Fine beach gold in the Bering Sea sand."),
 "rockies": ("Flitter und kleine Körner.", "Flakes and small grains."),
 "east": ("Flitter und kleine Körner; im Osten oft in Bezahl-Waschplätzen mit Konzentrat.", "Flakes and small grains; in the east often at paid sites with concentrate."),
 "museum": ("Besuchermine / Museum mit Goldwaschen für Gäste.", "Visitor mine / museum with panning for guests."),
 "idaho": ("Flitter und kleine Körner – Idahos Goldrausch begann 1860 an der Orofino Creek.", "Flakes and small grains – Idaho's gold rush started in 1860 on Orofino Creek."),
 "wash": ("Flitter und für Washington eher grobes Gold (Liberty / Swauk).", "Flakes and fairly coarse gold for Washington (Liberty / Swauk)."),
 "wa-gf": ("Nuggets im Laterit und in alten Schürfstellen – Detektor-Land der Eastern Goldfields.", "Nuggets in laterite and old workings – detector country of the Eastern Goldfields."),
 "wa-mw": ("Nuggets in den Murchison-Goldfeldern, oft im flachen Schutt.", "Nuggets in the Murchison goldfields, often in shallow ground."),
 "pilbara": ("Grobe Nuggets im Pilbara-Schutt; sehr abgelegen und heiss.", "Coarse nuggets in Pilbara gravels; very remote and hot."),
 "vic": ("Nuggets und Flitter im «Goldenen Dreieck» – hier wurden die grössten Nuggets der Welt gefunden.", "Nuggets and flakes in the 'Golden Triangle' – where the world's largest nuggets were found."),
 "qld": ("Flitter und Nuggets in alten Goldfeldern.", "Flakes and nuggets in old goldfields."),
 "nsw": ("Flitter und kleine Nuggets in den alten Goldfeldern am Turon und um Hill End.", "Flakes and small nuggets in the old goldfields on the Turon and around Hill End."),
 "nt": ("Nuggets um Tennant Creek, sehr abgelegen.", "Nuggets around Tennant Creek, very remote."),
 "au-other": ("Flitter und kleine Nuggets.", "Flakes and small nuggets."),
 "tas": ("Alluviales Gold in Bächen und alten Goldfeldern – Tasmaniens Gold ist oft fein, aber es gibt Nuggets.", "Alluvial gold in creeks and old goldfields – Tasmanian gold is often fine, but nuggets occur."),
 "tas-gem": ("Kein Gold: Saphir (Korund), Zinnstein und andere Edelsteine im alten Zinn-Schwemmland.", "No gold: sapphire (corundum), cassiterite and other gems in old tin alluvium."),
 "bc": ("Feines Flittergold und kleine Nuggets im Kies – an Innenkurven und auf Kiesbänken.", "Fine flake gold and small nuggets in the gravel – on inside bends and gravel bars."),
 "klondike": ("Klondike-Gold: Flitter und Nuggets, berühmt seit 1896.", "Klondike gold: flakes and nuggets, famous since 1896."),
 "jp": ("Goldwaschen für Besucher, oft mit garantiertem Fund.", "Gold panning for visitors, often with a guaranteed find."),
 "za": ("Historische Goldfelder – nur Besucher-Goldwaschen.", "Historic goldfields – visitor panning only."),
 "service": ("Detektoren mieten oder kaufen, Ausrüstung und Tipps.", "Rent or buy detectors, gear and tips."),
 "tour": ("Geführte Touren auf Gebieten mit Erlaubnis – mit Training, oft mit Leih-Detektor.", "Guided tours on ground with permission – with training, often with hire detector."),
 "nevada": ("Nuggets im Wüstenschotter – Detektor-Gebiet.", "Nuggets in desert gravels – detecting area."),
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
 "UNK": ("Regeln für dieses Land habe ich nicht verlässlich gefunden – bitte selbst vor Ort informieren (Gemeinde, Grundeigentümer, Fischerei-Aufsicht). Schutzgebiete meiden, nur Handwerkzeug.",
         "I could not find reliable rules for this country – please ask locally (municipality, landowner, fishing authority). Avoid protected areas, hand tools only.", None),
 "US": ("Auf Bundesland (BLM, Forest Service): Pfanne, Schaufel und kleines Handwerkzeug meist ohne Erlaubnis (casual use) – aber nur, wo kein Claim liegt (Ebene «BLM-Claims» einschalten). Auf Claims nur mit Erlaubnis des Besitzers. Wilderness und Nationalparks meist verboten, State Parks haben eigene Regeln. Motorgeräte und Dredges brauchen Bewilligungen. Laichzeiten beachten. Vorher beim zuständigen BLM- bzw. Forest-Service-Büro nachfragen.",
        "On federal land (BLM, Forest Service): pan, shovel and small hand tools usually need no permit (casual use) – but only where there is no claim (turn on the 'BLM claims' layer). On claims only with the owner's permission. Wilderness and national parks are mostly closed; state parks have their own rules. Motorised gear and dredges need permits. Respect spawning seasons. Ask the local BLM or Forest Service office first.",
        "https://goldfever.app/post/gold-panning-laws-by-state/"),
 "US-CA": ("Kalifornien: Pfanne und Hände («hands and pans») meist erlaubt; Saugbagger (suction dredge) im ganzen Staat verboten. State Parks: nur die Goldpfanne als Werkzeug. Claims beachten.",
           "California: hands and pans usually allowed; suction dredging banned statewide. State parks: the gold pan is the only tool allowed. Watch for claims.", None),
 "US-AZ": ("Arizona: auf BLM-Land Pfanne und Detektor meist ohne Erlaubnis, aber fast alles Gute ist geclaimt – Ebene «BLM-Claims» einschalten. State Trust Land braucht eine Erlaubnis des Arizona State Land Department.",
           "Arizona: on BLM land panning and detecting usually need no permit, but most good ground is claimed – turn on the 'BLM claims' layer. State Trust land needs a permit from the Arizona State Land Department.", None),
 "US-OR": ("Oregon: Claims auf Bundesland sind nicht offen (nur mit Erlaubnis des Besitzers). In den ausgeschiedenen Hobby-Waschgebieten braucht es keine BLM-Erlaubnis; nicht waschen, wenn Lachse laichen oder Eier im Kies liegen.",
           "Oregon: claims on federal land are not open (only with the owner's permission). In the designated recreational panning areas no BLM permit is needed; no panning while salmon spawn or eggs are in the gravel.",
           "https://www.oregon.gov/dogami/milo/archive/HistoricalSociety/Josephine/OregonsHeritageRecreationalGoldPanning.pdf"),
 "US-AK": ("Alaska: auf manchem öffentlichen Land erlaubt, mit Einschränkungen. Auf Privatland und Claims nur mit Erlaubnis des Besitzers. Der Pipeline-Korridor (27 Fuss beidseitig) ist gesperrt.",
           "Alaska: allowed on some public land with restrictions. On private land and claims only with the owner's permission. The pipeline corridor (27 ft each side) is closed.",
           "https://www.nps.gov/anch/planyourvisit/gold-panning.htm"),
 "US-WHIS": ("Whiskeytown NRA: Goldwasch-Erlaubnis für 1 Dollar (1 Jahr gültig), ab 17 Jahren, dazu Eintrittspass. Erhältlich im Visitor Center oder online bei Recreation.gov.",
             "Whiskeytown NRA: gold panning permit for 1 dollar (valid 1 year), age 17+, plus entrance pass. Available at the visitor center or online at Recreation.gov.",
             "https://www.nps.gov/whis/planyourvisit/gold-panning.htm"),
 "US-SD": ("Black Hills National Forest: Waschen von Hand ohne Erlaubnis; mit Motorgeräten oder Saugbagger braucht es Erlaubnis und Kaution. Claims und Privatland beachten.",
           "Black Hills National Forest: hand panning needs no permit; motorised equipment or dredges need a permit and bond. Watch for claims and private land.",
           "https://www.fs.usda.gov/r02/blackhills/recreation/gold-panning-rockhounding-metal-detecting"),
 "US-WA": ("Washington: Regeln der Broschüre «Gold and Fish» des Washington Department of Fish and Wildlife (offene Flüsse, Arbeitsfenster, erlaubtes Gerät). Staatsland des DNR ist geschlossen, ausser mit Placer-Vertrag. Auf Bundesland ohne Claim: «casual use».",
           "Washington: follow the 'Gold and Fish' pamphlet of the Washington Department of Fish and Wildlife (open rivers, work windows, allowed gear). DNR state land is closed unless you hold a placer contract. On federal land without a claim: casual use.", None),
 "US-NC": ("Uwharrie National Forest: Goldwaschen auf dem grössten Teil des Waldes ohne Gebühr und Erlaubnis, solange nur Schaufel und Pfanne benutzt werden und der Bach nicht stark gestört wird.",
           "Uwharrie National Forest: panning on most of the forest without fee or permit as long as only shovel and pan are used and the stream is not significantly disturbed.",
           "https://www.montgomerycountync.gov/visit/what-to-do/pan-for-gold-in-the-uwharries"),
 "US-OR-HP": ("Oregon, «hands and pans only»: nur Hände und Pfanne – nicht einmal Schaufel oder Pickel. Keine Claims möglich. Nicht waschen, wenn Lachse laichen.",
              "Oregon, 'hands and pans only': hands and pan only – not even shovel or pick. No claims possible. No panning while salmon spawn.",
              "https://portlandgoldprospectors.org/wp-content/uploads/2025/03/PlaceToMineInOregonList.pdf"),
 "US-AK-BLM": ("Alaska, öffentliches BLM-Waschgebiet: Handwerkzeug und leichtes Gerät (Pfanne, Rinne, Rocker, Pickel, Schaufel). Nicht auf benachbarten Claims waschen. Aktuellen Stand beim BLM Alaska prüfen.",
               "Alaska, public BLM panning area: hand tools and light gear (pan, sluice, rocker, pick, shovel). Don't pan on adjacent claims. Check current status with BLM Alaska.",
               "https://www.blm.gov/programs/recreation/recreation-activities/alaska"),
 "AU-WA": ("Western Australia: Miner's Right nötig (auch für den Metalldetektor; online beantragen, ca. A$30 ≈ CHF 16) – gilt für Crown Land inkl. Pastoral Leases. Auf Tenements (Claims) nur mit Erlaubnis des Halters; auf einer Exploration Licence mit einem Section-40E-Permit (nur Handwerkzeug). Pastoralisten vorher informieren. Reserven und Native-Title-Gebiete mit exklusivem Besitz nur mit Erlaubnis. Ebene «WA – Tenements» prüfen!",
           "Western Australia: Miner's Right required (also for metal detecting; apply online, about A$30) – covers Crown land incl. pastoral leases. On tenements only with the holder's consent; on an exploration licence with a Section 40E permit (hand tools only). Inform pastoralists first. Reserves and exclusive native-title areas only with permission. Check the 'WA tenements' layer!",
           "https://www.wa.gov.au/service/natural-resources/mineral-resources/getting-miners-right"),
 "AU-VIC": ("Victoria: Miner's Right nötig (10 Jahre gültig, nur für Personen). Erlaubt auf vielen Crown-Land-Flächen und in State Forests; in Nationalparks meist verboten; einzelne Bäche gesperrt (z. B. Creswick Creek). Auf Privatland nur mit Zustimmung.",
            "Victoria: Miner's Right required (valid 10 years, individuals only). Allowed on much Crown land and in state forests; mostly closed in national parks; some creeks closed (e.g. Creswick Creek). Private land only with consent.",
            "https://detectormaps.com/au/fossicking-laws/"),
 "AU-QLD": ("Queensland: Fossicking Licence nötig (1 Monat, 6 Monate oder 1 Jahr). Ohne weitere Erlaubnis nur in Designated Fossicking Areas und General Permission Areas; sonst schriftliche Zustimmung des Landbesitzers.",
            "Queensland: fossicking licence required (1 month, 6 months or 1 year). Without further permission only in designated fossicking areas and general permission areas; otherwise written landholder consent.",
            "https://www.qld.gov.au/recreation/activities/areas-facilities/fossicking"),
 "AU-NSW": ("New South Wales: keine allgemeine Lizenz, aber Zustimmung des Landbesitzers nötig. In State Forests ein Fossicking Permit der Forestry Corporation (12 Monate, ca. A$27.50). In Nationalparks verboten (auch Hill End Historic Site).",
            "New South Wales: no general licence, but landholder consent needed. In state forests a fossicking permit from Forestry Corporation (12 months, about A$27.50). Forbidden in national parks (incl. Hill End Historic Site).",
            "https://www.regional.nsw.gov.au/meg/exploration/fossicking"),
 "AU-NT": ("Northern Territory: Fossicking Permit nötig (Quellen widersprechen sich, ob er überall gilt); in ausgewiesenen Fossicking Areas wie Warrego einfacher. Aboriginal Land nur mit Erlaubnis.",
           "Northern Territory: fossicking permit required (sources disagree whether everywhere); easier in declared fossicking areas such as Warrego. Aboriginal land only with permission.",
           "https://detectormaps.com/au/fossicking-laws/"),
 "AU-SA": ("South Australia: Hobby-Fossicking ohne Verkaufsabsicht braucht meist keine Erlaubnis; Landbesitzer fragen, Parks gesperrt.",
           "South Australia: hobby fossicking without intent to sell usually needs no permit; ask the landholder, parks are closed.",
           "https://detectormaps.com/au/fossicking-laws/"),
 "AU-TAS": ("Tasmanien: In den 11 ausgewiesenen Fossicking Areas ohne Lizenz (alles Edelstein-Gebiete); für Gold anderswo braucht es eine Prospecting Licence von Mineral Resources Tasmania.",
            "Tasmania: no licence inside the declared fossicking areas; elsewhere a prospecting licence from Mineral Resources Tasmania.",
            "https://detectormaps.com/au/fossicking-laws/"),
 "AU-SHOP": ("Für die Suche selbst braucht es trotzdem die Lizenz des Bundesstaats (in WA den Miner's Right) und Erlaubnis auf Tenements.",
             "You still need the state licence (in WA the Miner's Right) and permission on tenements to prospect.", None),
 "AU-TOUR": ("Seriöse Touren gehen auf Gebiete mit Erlaubnis (eigene oder gepachtete Leases). Miner's Right trotzdem vorher besorgen.",
             "Serious tours go to ground with permission (own or leased tenements). Still get your Miner's Right first.", None),
 "CA-BCRES": ("BC Recreational Panning Reserve: ohne Lizenz erlaubt, nur Pfanne und Schaufel – kein Metalldetektor, keine Rinne. Grenzen und GPS-Datei auf der Seite der Provinz.",
              "BC recreational panning reserve: allowed without licence, pan and shovel only – no metal detector, no sluice. Boundaries and GPS file on the province's page.",
              "https://www2.gov.bc.ca/gov/content/industry/mineral-exploration-mining/mineral-titles/recreational-hand-panning"),
 "CA-YT": ("Yukon: Hobby-Goldwaschen mit Pfanne und Schaufel auf freiem Staatsland ohne Claim erlaubt. Vorher beim Mining Recorder in Dawson (Front Street) oder im Besucherzentrum fragen, wo es erlaubt ist – fast alles am Klondike ist geclaimt.",
           "Yukon: hobby panning with pan and shovel allowed on vacant government land without claim. Ask the Dawson Mining Recorder or the visitor centre first where it is allowed – almost everything on the Klondike is claimed.",
           "https://yukon.ca/sites/default/files/emr/emr-recreational-gold-panning-visitors-guide.pdf"),
 "CA-SHOW": ("Museum / historische Stätte – Goldwaschen nur im Angebot vor Ort.", "Museum / historic site – panning only as offered on site.", None),
 "JP-T": ("Nur in Besucherminen und ausgewiesenen Waschplätzen; freies Goldsuchen gibt es in Japan nicht.", "Only at visitor mines and designated panning spots; free prospecting does not exist in Japan.", None),
 "ZA-T": ("Nur Besucher-Goldwaschen; Prospektieren braucht eine Bewilligung nach Bergrecht.", "Visitor panning only; prospecting needs a permit under mining law.", None),
 "NO": ("Norwegen: Alluviales Gold gehört dem Grundeigentümer – dessen Erlaubnis ist nötig. Bis 500 m³ Material mit Handwerkzeug ist keine Meldung nach dem Mineralgesetz nötig; mit Pumpen oder Maschinen schon. In Finnmark (FeFo-Land) braucht es eine Erlaubnis der Finnmarkseiendommen; Einheimische haben Vorrang. Gemeinde wegen Bauvorschriften fragen.",
        "Norway: alluvial gold belongs to the landowner – their permission is needed. Up to 500 m³ with hand tools needs no notification under the Minerals Act; with pumps or machines it does. In Finnmark (FeFo land) a permit from Finnmarkseiendommen is needed; locals have priority. Ask the municipality about planning rules.",
        "https://www.dirmin.no/faq"),
 "UK-WALES": ("Wales: Die Crown Estate erlaubt Goldwaschen als Hobby im Dolgellau-Goldgürtel nicht; es gab bereits Gerichtsfälle mit Bussen über 3000 Pfund.", "Wales: the Crown Estate does not allow hobby panning in the Dolgellau gold belt; there have been prosecutions with fines over £3000.", None),
 "US-CLUB": ("Club-Claims (z. B. GPAA): nur für Mitglieder, Mitgliederausweis und Claim-Regeln mitnehmen. Mitgliedschaft online.",
             "Club claims (e.g. GPAA): members only, carry your membership card and the claim rules. Membership online.",
             "https://www.goldprospectors.org/"),
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
 ("UK", "Kildonan Burn / Baile an Òr (Helmsdale)", "Kildonan Burn", 58.1650, -3.8650, "site", "schottland", None, "Ort des schottischen Goldrauschs von 1869 (Baile an Òr). Lizenz des Suisgill Estate nötig (in Helmsdale erhältlich, ca. £15); höchstens zwei Wochen pro Jahr, keine Rinnen.", "Site of the 1869 Scottish gold rush. Suisgill Estate day permit needed (about £15, check terms)."),
 ("UK", "Tyndrum (Schottland)", "Bäche um Tyndrum", 56.4360, -4.7110, "permit", "schottland", None, "Goldgebiet um die Cononish-Mine. Erlaubnis für den Gemeindewald beim Strathfillan Community Development Trust.", "Gold area around the Cononish mine. Permit for the community woodland from the Strathfillan Community Development Trust."),
 ("UK", "Mennock Water (Leadhills)", "Mennock Water", 55.3800, -3.8000, "permit", "schottland", None, "Goldwaschen mit Lizenz des Buccleuch Estate, erhältlich im Museum of Lead Mining in Wanlockhead.", "Panning with a Buccleuch Estate licence from the Museum of Lead Mining in Wanlockhead.", "https://www.leadminingmuseum.co.uk/"),
 ("UK", "Timespan Museum (Helmsdale)", "–", 58.1150, -3.6500, "site", "schottland", None, "Hier gibt es die Lizenz für den Kildonan Burn und Goldwasch-Ausrüstung zum Mieten. Regeln des Suisgill Estate: nur Hobby, höchstens zwei Wochen pro Jahr, keine Rinnen.", "Licence for the Kildonan Burn and panning kit hire. Suisgill Estate rules: hobby only, max. two weeks per year, no sluices.", "https://www.timespan.org.uk/"),
 ("UK", "Dolgellau-Goldgürtel / Afon Wen (Wales)", "Afon Wen / Mawddach", 52.8000, -3.8900, "closed", "wales", "UK-WALES", "Bekanntes walisisches Goldgebiet (Clogau, Gwynfynydd) – Hobby-Goldwaschen ist hier nicht erlaubt.", "Known Welsh gold area (Clogau, Gwynfynydd) – hobby panning is not allowed here."),
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
 # Portugal, Rumänien, Slowenien, Kroatien, Norwegen – Regeln nicht geprüft
 ("PT", "Jales – Goldminen-Museum (Vila Pouca de Aguiar)", "–", 41.4700, -7.6000, "show", "portugal", "UNK", "Ehemalige Goldmine (bis in die 1990er), heute Museum. In den Bachschottern um Jales gibt es Waschgold.", "Former gold mine (until the 1990s), now a museum. Placer gold in the creeks around Jales."),
 ("PT", "Tresminas – römische Goldminen", "–", 41.4800, -7.4700, "show", "portugal", "UNK", "Grosse römische Tagebaue und Stollen – ansehen, nicht graben.", "Large Roman open pits and galleries – look, don't dig."),
 ("PT", "Valongo – Parque Paleozoico", "Ferreira", 41.1900, -8.5000, "show", "portugal", "UNK", "Römische Goldbergbau-Spuren im Naturpark bei Porto – nur ansehen.", "Roman gold workings in the nature park near Porto – look only."),
 ("PT", "Castromil (Paredes)", "Bäche um Castromil", 41.1550, -8.3750, "unclear", "portugal", "UNK", "Römische Goldmine; Spuren von Gold im Bachkies.", "Roman gold mine; traces of gold in the creek gravel."),
 ("PT", "Rio Ceira", "Ceira", 40.1500, -8.1500, "unclear", "portugal", "UNK", "Fluss, in dem immer wieder Seifengold gewaschen wurde.", "River where placer gold has been washed on and off."),
 ("RO", "Roșia Montană – römische Goldstollen", "–", 46.3060, 23.1300, "show", "mine", "UNK", "UNESCO-Welterbe mit römischen Goldstollen und Museum – nur ansehen.", "UNESCO World Heritage with Roman gold galleries and museum – look only."),
 ("RO", "Arieș bei Baia de Arieș", "Arieș", 46.3700, 23.2800, "unclear", "siebenb", "UNK", "Der «Goldfluss» Siebenbürgens; Goldwäscher gab es hier bis ins 20. Jahrhundert.", "The 'gold river' of Transylvania; gold washers worked here into the 20th century."),
 ("RO", "Brad – Goldmuseum", "Crișul Alb", 46.1300, 22.7900, "show", "mine", "UNK", "Goldmuseum mit berühmten Goldstufen aus dem Siebenbürgischen Erzgebirge.", "Gold museum with famous gold specimens from the Apuseni Mountains."),
 ("SI", "Drau bei Ptuj", "Drava", 46.4200, 15.8700, "unclear", "drau", "UNK", "Drau-Gold, früher von Goldwäschern gewaschen.", "Drava gold, historically washed."),
 ("SI", "Mur bei Veržej", "Mura", 46.5800, 16.1600, "unclear", "drau", "UNK", "Mur-Gold – historisch bekannte Goldwäscherei an der Mur.", "Mura gold – historically known gold washing."),
 ("HR", "Drau bei Donji Vidovec", "Drava", 46.3300, 16.7900, "unclear", "drau", "UNK", "An der Drau wird hier häufig Gold gesucht.", "Gold is often searched for on the Drava here."),
 ("NO", "Karasjohka bei Karasjok", "Karasjohka", 69.4700, 25.5100, "permit", "finnmark", "NO", "Erster Seifengold-Fund Nordnorwegens (1866); Gold in den Flüssen des Tana-Systems. Der Anárjohka-Nationalpark ist tabu.", "First placer gold find in northern Norway (1866); gold in the Tana river system. Anárjohka National Park is off limits."),
]

# USA – öffentliche Waschgebiete, bekannte Goldgebiete, Bezahl-Waschplätze
US_SPOTS = [
 # Arizona
 ("US", "Lynx Creek Gold Pan Day Use Area (Prescott NF)", "Lynx Creek", 34.5600, -112.3500, "free", "az-creek", "US-AZ", "Öffentliches Waschgebiet des Forest Service in einer Mineral-Withdrawal-Zone (keine Claims). Nur Pfanne und Handwerkzeug.", "Forest Service public panning area in a mineral withdrawal (no claims). Pan and hand tools only.", "https://www.fs.usda.gov/r03/prescott/recreation/lynx-creek-gold-pan-day-use-area"),
 ("US", "Rich Hill / Stanton (GPAA)", "Weaver Gulch", 34.1650, -112.7350, "club", "az", "US-CLUB", "Berühmt für Nuggets; Teile sind GPAA-Club-Claims (nur für Mitglieder). Rundherum viele private Claims.", "Famous for nuggets; parts are GPAA club claims (members only). Many private claims around."),
 ("US", "Gold Basin (Mohave County)", "Wüstenschotter", 35.8700, -114.2700, "free", "az", "US-AZ", "Bekanntes Detektor-Gebiet auf BLM-Land; viele Claims – Ebene «BLM-Claims» einschalten.", "Known detecting area on BLM land; many claims – turn on the 'BLM claims' layer."),
 ("US", "Quartzsite / La Paz (BLM)", "Wüstenschotter", 33.6600, -114.2300, "free", "az", "US-AZ", "Winter-Treffpunkt der Goldsucher; Detektor-Gebiete auf BLM-Land, aber viele Claims.", "Winter meeting place for prospectors; detecting on BLM land, but many claims."),
 ("US", "Gold Road Mine (Oatman)", "–", 35.0450, -114.3690, "show", "museum", "US-AZ", "Besuchermine mit Führungen bei Oatman.", "Visitor mine with tours near Oatman.", "https://www.goldroadmine.com/"),
 # Kalifornien
 ("US", "Keyesville (BLM, Kern River)", "Kern River", 35.6450, -118.5000, "free", "kern", "US-CA", "Ca. 400 Acres BLM-Land auf 2 km am Kern River, für Hobby-Goldwaschen ausgeschieden.", "About 400 acres of BLM land along 1.25 miles of the Kern River set aside for recreational panning."),
 ("US", "Merced River bei Briceburg (BLM)", "Merced River", 37.6050, -119.9660, "free", "motherlode", "US-CA", "Mehrere Meilen des Merced River in der Merced River Recreation Area sind fürs Goldwaschen offen.", "Several miles of the Merced River in the Merced River Recreation Area are open to panning."),
 ("US", "Auburn State Recreation Area", "American River", 38.9150, -121.0400, "free", "motherlode", "US-CA", "Goldwaschen nach der «hands and pans»-Methode erlaubt – nur Pfanne, keine anderen Werkzeuge.", "Panning allowed by the 'hands and pans' method – pan only, no other tools.", "https://www.parks.ca.gov/?page_id=502"),
 ("US", "Whiskeytown NRA (Clear Creek)", "Clear Creek", 40.6200, -122.5500, "permit", "motherlode", "US-WHIS", "Beliebt: Tower House Historic District (Mill, Crystal und Clear Creek) und Clear Creek Picnic Area.", "Popular: Tower House Historic District and Clear Creek Picnic Area."),
 ("US", "Columbia State Historic Park", "–", 38.0350, -120.4010, "site", "museum", "US-CA", "Goldgräberstadt mit bezahltem Goldwaschen für Besucher.", "Gold rush town with paid panning for visitors.", "https://www.parks.ca.gov/?page_id=552"),
 ("US", "Marshall Gold Discovery SHP (Coloma)", "American River", 38.8000, -120.8900, "show", "museum", "US-CA", "Hier begann 1848 der kalifornische Goldrausch; Goldwasch-Programme für Besucher.", "Start of the 1848 California gold rush; panning programs for visitors.", "https://www.parks.ca.gov/?page_id=484"),
 # Oregon
 ("US", "Butte Falls Recreational Gold Panning Area (BLM)", "Big Butte Creek", 42.5430, -122.5660, "free", "oregon", "US-OR", "Eines der vier Hobby-Waschgebiete auf Bundesland in Oregon (BLM Medford).", "One of four recreational panning areas on federal land in Oregon (BLM Medford)."),
 ("US", "Little Applegate (BLM)", "Little Applegate River", 42.1880, -122.9860, "free", "oregon", "US-OR", "Hobby-Waschgebiet des BLM; keine BLM-Erlaubnis nötig.", "BLM recreational panning site; no BLM permit needed."),
 ("US", "Quartzville Recreation Corridor (BLM)", "Quartzville Creek", 44.5800, -122.3500, "free", "oregon", "US-OR", "Bekanntes Hobby-Goldgebiet bei Sweet Home; aktuellen Status beim BLM Salem prüfen.", "Known recreational gold area near Sweet Home; check current status with BLM Salem."),
 # Alaska
 ("US", "Nome – Goldstrand", "Beringsee", 64.4990, -165.4100, "free", "nome", "US-AK", "Die berühmten Goldstrände von Nome; Teile des Strands sind für Hobby-Goldsucher offen.", "The famous gold beaches of Nome; parts of the beach are open to recreational miners."),
 ("US", "Resurrection Creek bei Hope (Chugach NF)", "Resurrection Creek", 60.9000, -149.6300, "free", "alaska", "US-AK", "Beliebtes öffentliches Goldwaschgebiet auf der Kenai-Halbinsel (BLM-Broschüre im Link).", "Popular public panning area on the Kenai Peninsula.", "https://www.blm.gov/sites/blm.gov/files/documents/files/PublicRoom_Alaska_kenai-goldpanning-booklet-2018_FINAL.pdf"),
 ("US", "Dalton Highway – BLM-Waschbäche", "Bäche am Dalton Highway", 67.2500, -150.1700, "free", "alaska", "US-AK", "Das BLM gibt Bachabschnitte entlang des Dalton Highway fürs Goldwaschen frei (Karte im Link).", "BLM opens creek sections along the Dalton Highway to recreational panning (map in link).", "https://www.blm.gov/sites/default/files/docs/2022-04/Dalton-Highway_Gold-Panning_WEB.pdf"),
 ("US", "Crow Creek Mine (Girdwood)", "Crow Creek", 61.0000, -149.1100, "site", "alaska", "US-AK", "Historische Goldmine mit Goldwaschen gegen Gebühr.", "Historic gold mine with fee panning.", "https://www.crowcreekgoldmine.com/"),
 ("US", "Chicken (Alaska)", "Chicken Creek", 64.0700, -141.9400, "site", "alaska", "US-AK", "Goldgräberort am Taylor Highway mit Bezahl-Waschplätzen; rundherum Claims.", "Gold-rush village on the Taylor Highway with fee panning; claims all around."),
 # Rocky Mountains und Black Hills
 ("US", "Cache Creek bei Granite (BLM, Colorado)", "Cache Creek", 39.0600, -106.2700, "free", "rockies", "US", "BLM-Gebiet, offen für Hobby-Goldwaschen und kleine Rinnen.", "BLM area open to recreational panning and sluicing."),
 ("US", "Libby Creek Gold Panning Area (Kootenai NF, Montana)", "Libby Creek", 48.2700, -115.5600, "free", "rockies", "US", "Öffentliches Waschgebiet des Forest Service südlich von Libby.", "Forest Service public panning area south of Libby."),
 ("US", "Black Hills – Rapid Creek (South Dakota)", "Rapid Creek", 44.0800, -103.5800, "free", "rockies", "US-SD", "Im Black Hills National Forest ist Waschen von Hand ohne Erlaubnis erlaubt.", "Hand panning without permit in the Black Hills National Forest."),
 ("US", "Big Thunder Gold Mine (Keystone)", "–", 43.8940, -103.4200, "show", "museum", "US-SD", "Besuchermine mit Goldwaschen.", "Visitor mine with panning."),
 # Nevada
 ("US", "Rye Patch (Nevada)", "Wüstenschotter", 40.4800, -118.3000, "free", "nevada", "US", "Berühmtes Nugget-Detektor-Gebiet; sehr viele Claims – Ebene «BLM-Claims» einschalten.", "Famous nugget detecting area; very many claims – turn on the 'BLM claims' layer."),
 # Osten
 ("US", "Consolidated Gold Mine (Dahlonega, Georgia)", "–", 34.5500, -83.9700, "site", "east", "US", "Besuchermine mit Goldwaschen im ersten US-Goldrausch-Gebiet.", "Visitor mine with panning in the first US gold rush area.", "https://www.consolidatedgoldmine.com/"),
 ("US", "Reed Gold Mine (North Carolina)", "Little Meadow Creek", 35.2850, -80.4700, "site", "east", "US", "Ort des ersten belegten Goldfunds der USA (1799); staatliche historische Stätte mit Goldwaschen in der Saison.", "Site of the first documented US gold find (1799); state historic site with seasonal panning.", "https://historicsites.nc.gov/all-sites/reed-gold-mine"),
 # --- weitere Recherche (Nov. 2026) ---
 # Kalifornien
 ("US", "PiPi Campground (Eldorado NF)", "Middle Fork Cosumnes River", 38.5530, -120.4360, "free", "motherlode", "US-CA", "Vom Forest Service selbst vorgeschlagener Platz zum Goldwaschen. Teile des Waldes sind gesperrt – beim Ranger District fragen.", "Panning spot suggested by the Forest Service itself. Parts of the forest are closed – ask the ranger district.", "https://www.fs.usda.gov/media/122082"),
 ("US", "South Yuba River bei Washington (Tahoe NF)", "South Yuba River", 39.3600, -120.8000, "free", "motherlode", "US-CA", "Rund zwei Quadratmeilen am South Yuba, die fürs Goldwaschen ausgeschieden sind (laut Hobbyquellen).", "About two square miles on the South Yuba set aside for panning (hobby sources)."),
 ("US", "Union Flat Campground (Tahoe NF)", "North Yuba River", 39.5670, -120.7450, "free", "motherlode", "US-CA", "Goldwasch-Parzelle des Forest Service beim Campingplatz am North Yuba.", "Forest Service panning parcel at the campground on the North Yuba."),
 ("US", "East Fork San Gabriel River (Angeles NF)", "East Fork San Gabriel", 34.2370, -117.7660, "free", "motherlode", "US-CA", "Historisches Goldwaschgebiet nahe Los Angeles – Status vor Ort prüfen.", "Historic panning area near Los Angeles – check status locally."),
 # Oregon
 ("US", "Rogue River – Hellgate Recreation Area", "Rogue River", 42.5500, -123.5500, "free", "oregon", "US-OR-HP", "27 Meilen des Rogue zwischen Applegate River und Graves Creek, öffentlich – aber nur Hände und Pfanne.", "27 miles of the Rogue between the Applegate River and Graves Creek, public – hands and pans only.", "https://portlandgoldprospectors.org/wp-content/uploads/2025/03/PlaceToMineInOregonList.pdf"),
 ("US", "Gold Nugget Wayside (Rogue River)", "Rogue River", 42.4300, -123.0500, "free", "oregon", "US-OR-HP", "Kleine Zugänge zum Rogue ohne Claims, offen für alle.", "Small access points to the Rogue without claims, open to all."),
 ("US", "Sixes River Recreational Mining Site (BLM)", "Sixes River", 42.8300, -124.3800, "free", "oregon", "US-OR", "Rund eine Meile am Sixes River, nur Pfanne und Rinne (Lachs-Gewässer).", "About one mile of the Sixes River, pan and sluice only (salmon habitat)."),
 ("US", "Sumpter Valley Dredge (State Heritage Area)", "Powder River", 44.7500, -118.2000, "show", "oregon", "US-OR", "Riesiger Goldbagger als Museum; an Wochenenden (Mai–Oktober) Goldwasch-Vorführungen der Ranger.", "Huge gold dredge museum; ranger panning demonstrations on weekends (May–October).", "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=174"),
 ("US", "McCully Forks Campground (Sumpter)", "McCully Fork", 44.7700, -118.2400, "free", "oregon", "US-OR", "In Listen freier Goldwaschplätze bei Sumpter genannt.", "Listed among free panning sites near Sumpter."),
 # Washington, Idaho, Wyoming, Colorado, New Mexico
 ("US", "Liberty / Swauk Creek (Washington)", "Swauk Creek", 47.2500, -120.6700, "free", "wash", "US-WA", "Beliebter Hobby-Goldbach beim alten Goldgräberort Liberty (Blewett Pass).", "Popular hobby gold creek at the old mining town of Liberty (Blewett Pass)."),
 ("US", "Land of the Yankee Fork (Idaho)", "Yankee Fork", 44.4900, -114.2100, "site", "idaho", "US", "State Park mit Goldwasch-Station beim Besucherzentrum in Challis; im Yankee-Fork-Tal alte Goldbagger.", "State park with a panning station at the interpretive center in Challis; old gold dredges in the Yankee Fork valley."),
 ("US", "Orofino Creek bei Pierce (Idaho)", "Orofino Creek", 46.4900, -115.8000, "free", "idaho", "US", "Hier begann 1860 Idahos Goldrausch. Claims und Privatland beachten.", "Idaho's 1860 gold rush started here. Watch for claims and private land."),
 ("US", "Boise Basin bei Idaho City", "Mores Creek", 43.8300, -115.8300, "free", "idaho", "US", "Bäche im Boise National Forest rund um Idaho City, gut erreichbar.", "Accessible creeks in the Boise National Forest around Idaho City."),
 ("US", "South Pass City / Atlantic City (Wyoming)", "Willow Creek", 42.4700, -108.8000, "show", "rockies", "US", "Hier begann Wyomings Goldrausch; South Pass City ist eine staatliche historische Stätte. Zugang zum Waschen vor Ort klären.", "Wyoming's gold rush started here; South Pass City is a state historic site. Check panning access locally.", "https://wyoparks.wyo.gov/index.php/places-to-go/south-pass-city"),
 ("US", "Clear Creek bei Idaho Springs (Colorado)", "Clear Creek", 39.7400, -105.5500, "free", "rockies", "US", "Gut erreichbarer Goldbach westlich von Denver; viel Privatland – öffentliche Abschnitte suchen.", "Accessible gold creek west of Denver; much private land – look for public stretches."),
 ("US", "Elizabethtown / Moreno Creek (New Mexico)", "Moreno Creek", 36.6200, -105.2800, "unclear", "rockies", "US", "Goldgräber-Geisterstadt am Mount Baldy; Moreno Creek wird als öffentlich zugänglich genannt – vor Ort prüfen.", "Gold rush ghost town at Mount Baldy; Moreno Creek is named as public access – check locally."),
 ("US", "Vulture Mine (Wickenburg, Arizona)", "–", 33.8170, -112.8300, "show", "museum", "US-AZ", "Berühmteste Goldmine Arizonas, Führungen; rundherum Detektor-Gebiet mit vielen Claims.", "Arizona's most famous gold mine, tours; detecting area with many claims around.", "https://www.vultureminetours.com/"),
 # Alaska
 ("US", "Nome Creek (White Mountains, BLM)", "Nome Creek", 65.3600, -146.6000, "free", "alaska", "US-AK-BLM", "Mehrere Meilen von Nome Creek sind fürs Hobby-Goldwaschen ausgeschieden (Angaben 2–4 Meilen).", "Several miles of Nome Creek set aside for recreational panning (2–4 miles reported).", "https://www.blm.gov/programs/recreation/recreation-activities/alaska"),
 ("US", "Jack Wade Creek / Fortymile (Taylor Highway)", "Jack Wade Creek", 64.0800, -141.6300, "free", "alaska", "US-AK-BLM", "Öffentliches Waschgebiet vom Walker Fork Campground Richtung Meile 85 – ohne Motorgeräte.", "Public panning area from Walker Fork Campground toward mile 85 – non-motorised.", "https://www.blm.gov/programs/recreation/recreation-activities/alaska"),
 ("US", "Caribou Creek (Glenn Highway)", "Caribou Creek", 61.8100, -147.6700, "free", "alaska", "US-AK", "Öffentliches Hobby-Goldgebiet östlich von Palmer.", "Public recreational mining area east of Palmer."),
 ("US", "Petersville", "Peters Creek", 62.3700, -150.7500, "free", "alaska", "US-AK", "Abgelegenes, aber per Strasse erreichbares Hobby-Goldgebiet nördlich von Anchorage.", "Remote but road-accessible recreational mining area north of Anchorage."),
 ("US", "Hatcher Pass – Little Susitna River", "Little Susitna River", 61.7700, -149.3000, "free", "alaska", "US-AK", "Staatliches Public Use Area mit Goldwaschen am Little Susitna.", "State public use area with panning on the Little Susitna."),
 ("US", "Sixmile Creek (Hope Highway)", "Sixmile Creek", 60.8300, -149.4300, "free", "alaska", "US-AK", "Im Kenai-Goldwasch-Führer des BLM beschrieben.", "Described in the BLM Kenai gold panning guide.", "https://www.blm.gov/sites/blm.gov/files/documents/files/PublicRoom_Alaska_kenai-goldpanning-booklet-2018_FINAL.pdf"),
 ("US", "Bertha Creek (Chugach NF)", "Bertha Creek", 60.7500, -149.2500, "free", "alaska", "US-AK", "Rund eine Stunde südlich von Anchorage, im Kenai-Führer des BLM.", "About an hour south of Anchorage, in the BLM Kenai guide.", "https://www.blm.gov/sites/blm.gov/files/documents/files/PublicRoom_Alaska_kenai-goldpanning-booklet-2018_FINAL.pdf"),
 # Osten
 ("US", "Uwharrie National Forest (North Carolina)", "Bäche im Uwharrie NF", 35.4000, -80.0000, "free", "east", "US-NC", "Goldwaschen auf dem grössten Teil des Waldes erlaubt, ohne Gebühr und Erlaubnis.", "Panning allowed on most of the forest, no fee or permit.", "https://www.montgomerycountync.gov/visit/what-to-do/pan-for-gold-in-the-uwharries"),
]

# Bundesstaat eines US-Orts bestimmen (für die Regeln pro Staat)
STATE_FILES = {c: json.load(open(os.path.join(DATA, c.lower(), "states.json")))["features"] for c in ("US", "AU", "CA")}
def in_ring(x, y, ring):
    inside = False
    for i in range(len(ring)):
        x1, y1 = ring[i - 1]; x2, y2 = ring[i]
        if (y2 > y) != (y1 > y) and x < (x1 - x2) * (y - y2) / (y1 - y2) + x2: inside = not inside
    return inside
def state_of(lon, lat, country):
    STATES = STATE_FILES[country]
    for f in STATES:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        if any(in_ring(lon, lat, p[0]) for p in polys): return f["properties"]["name"]
    # Orte an der Küste liegen manchmal knapp ausserhalb der vereinfachten Grenze: nächster Staat
    best = min(((x - lon) ** 2 + (y - lat) ** 2, f["properties"]["name"]) for f in STATES
               for p in (f["geometry"]["coordinates"] if f["geometry"]["type"] == "MultiPolygon" else [f["geometry"]["coordinates"]])
               for x, y in p[0])
    return best[1]

# Goldsucher-Clubs und -Vereine (data/clubs.geojson). Lage = Sitz des Clubs (ungefähr, Stadt), nicht die Claims.
# Art: national = landesweit mit vielen Claims, claims = Club mit eigenen Claims, club = Club / GPAA-Chapter (Claims erfragen)
# Keine Namen oder Telefonnummern von Privatpersonen eintragen – nur Club-Name, Ort und Website.
CLAIMS_DE = "Mitglieder dürfen auf den Club-Claims suchen. Vorher Claim-Regeln und Karten beim Club holen."
CLAIMS_EN = "Members may prospect on the club claims. Get the claim rules and maps from the club first."
ASK_DE = "Ausflüge, Kurse und Treffen; ob der Club eigene Claims hat, bei der Anmeldung fragen."
ASK_EN = "Outings, classes and meetings; ask whether the club holds its own claims."
CLUBS = [
 # (Land, Name, Ort, Breite, Länge, Art, Beschreibung DE, Beschreibung EN, Website)
 ("US", "GPAA – Gold Prospectors Association of America", "Murrieta, CA (landesweit)", 33.5540, -117.2140, "national", "Grösster Goldsucher-Club der USA: über 200 Claim-Gebiete in vielen Bundesstaaten, dazu lokale Chapters. " + CLAIMS_DE, "Largest US prospecting club: 200+ claim areas in many states plus local chapters. " + CLAIMS_EN, "https://www.goldprospectors.org/"),
 ("US", "LDMA – Lost Dutchman's Mining Association", "Murrieta, CA (landesweit)", 33.5700, -117.1900, "national", "Camps mit Claims in Kalifornien, Arizona, Oregon, Georgia, North und South Carolina (z. B. Stanton AZ, Duisenburg CA). Mitgliedschaft auf Lebenszeit, inklusive GPAA.", "Camps with claims in California, Arizona, Oregon, Georgia, North and South Carolina (e.g. Stanton AZ, Duisenburg CA). Lifetime membership, includes GPAA.", "https://www.myldma.com/"),
 ("US", "The New 49ers", "Happy Camp, CA", 41.7920, -123.3800, "national", "Viele Meilen Claims am Klamath River und Nebenflüssen in Nordkalifornien. " + CLAIMS_DE, "Many miles of claims on the Klamath River and tributaries in northern California. " + CLAIMS_EN, "https://www.goldgold.com/"),
 ("US", "Alaska Miners Association", "Anchorage, AK", 61.1900, -149.8700, "club", "Bergbau-Verband Alaskas – Infos zu Regeln und Kontakten, keine Hobby-Claims.", "Alaska's mining association – rules and contacts, no hobby claims.", "https://www.alaskaminers.org/"),
 # Arizona
 ("US", "Havasu Gold Seekers", "Lake Havasu City, AZ", 34.4800, -114.3200, "claims", "Club seit 1991 mit eigenen Gold-Claims (laut Newsletter 2025: 4 Claims, über 80 Acres). " + CLAIMS_DE, "Club since 1991 with its own gold claims (2025 newsletter: 4 claims, 80+ acres). " + CLAIMS_EN, "https://www.havasugoldseekers.com/"),
 ("US", "Roadrunner Prospectors Club", "Phoenix, AZ", 33.4900, -112.1200, "claims", "Seit 1982; laut eigener Website über 280 Gold-Claims (mehr als 5500 Acres), vor allem in den Bradshaw Mountains. " + CLAIMS_DE, "Since 1982; 280+ gold claims (over 5,500 acres) per its website, mainly in the Bradshaw Mountains. " + CLAIMS_EN, "https://www.roadrunnergold.com/"),
 ("US", "Desert Gold Diggers", "Tucson, AZ", 32.2200, -110.9700, "claims", "Seit 1984, eigene Claims im Süden und Südosten Arizonas. " + CLAIMS_DE, "Since 1984, own claims in southern and south-eastern Arizona. " + CLAIMS_EN, "https://desertgolddiggers.com/"),
 ("US", "Arizona Association of Gold Prospectors", "Phoenix, AZ", 33.4500, -112.0700, "club", "Einer der bekanntesten Goldsucher-Clubs Arizonas. " + ASK_DE, "One of Arizona's best-known prospecting clubs. " + ASK_EN, "https://www.arizonagoldprospectors.org/"),
 # Kalifornien
 ("US", "Prospectors Club of Southern California", "Downey, CA", 33.9400, -118.1300, "claims", "Seit 1966, besitzt mehrere Gold-Claims in Kalifornien. " + CLAIMS_DE, "Since 1966, holds several gold claims in California. " + CLAIMS_EN, "https://www.prospectorsclub.org/"),
 ("US", "Mother Lode Goldhounds", "Forest Hill, CA", 39.0200, -120.8200, "club", "Club im Mother-Lode-Gebiet. " + ASK_DE, "Club in the Mother Lode. " + ASK_EN, "https://www.goldhounds.com/"),
 ("US", "Coarsegold Gold Prospectors", "Coarsegold, CA", 37.2600, -119.7000, "club", ASK_DE, ASK_EN, "https://www.coarsegoldprospectors.com/"),
 ("US", "Orange County 49ers", "Orange, CA", 33.7900, -117.8500, "club", ASK_DE, ASK_EN, "https://www.oc49ers.com/"),
 ("US", "Route 66 Gold Miners (GPAA)", "Brea, CA", 33.9200, -117.9000, "club", "GPAA-Chapter. " + ASK_DE, "GPAA chapter. " + ASK_EN, "https://www.route66goldminers.org/"),
 ("US", "Central Valley Prospectors", "Fresno, CA", 36.7400, -119.7900, "club", ASK_DE, ASK_EN, "https://www.cvprospectors.org/"),
 ("US", "Treasure Seekers of San Diego County", "San Diego, CA", 32.7200, -117.1600, "club", ASK_DE, ASK_EN, "https://www.treasureseekersofsandiego.org/"),
 ("US", "Delta Gold Diggers", "Stockton-Gegend, CA", 37.9600, -121.2900, "club", ASK_DE, ASK_EN, "https://www.deltagolddiggers.com/"),
 # weitere Staaten
 ("US", "Comstock Gold Prospectors", "Reno, NV", 39.5300, -119.8100, "club", ASK_DE, ASK_EN, "https://www.cgpgold.org/"),
 ("US", "Waldo Mining District", "Cave Junction, OR", 42.1600, -123.6500, "club", "Bergbau-Bezirk und Verein im Südwesten Oregons. " + ASK_DE, "Mining district and association in south-western Oregon. " + ASK_EN, "https://www.waldominingdistrict.com/"),
 ("US", "Portland Gold Prospectors (GPAA)", "Portland, OR", 45.5200, -122.6800, "club", "GPAA-Chapter; führt eine Liste öffentlicher Waschplätze in Oregon. " + ASK_DE, "GPAA chapter; keeps a list of public panning places in Oregon. " + ASK_EN, "https://www.portlandgoldprospectors.org/"),
 ("US", "Douglas County Prospectors Association", "Roseburg, OR", 43.2200, -123.3400, "club", ASK_DE, ASK_EN, "https://www.dcpagold.org/"),
 ("US", "Colorado Springs GPAA Chapter", "Colorado Springs, CO", 38.8300, -104.8200, "club", "GPAA-Chapter. " + ASK_DE, "GPAA chapter. " + ASK_EN, "https://www.cosgpaa.org/"),
 ("US", "Gold Prospectors Association of New Mexico", "Albuquerque, NM", 35.0800, -106.6500, "club", ASK_DE, ASK_EN, "https://www.gpanm.org/"),
 ("US", "Utah Gold Prospectors Club", "Salt Lake City, UT", 40.7600, -111.8900, "club", ASK_DE, ASK_EN, "https://www.ugpc.org/"),
 ("US", "Headwaters GPAA", "Harrison, MT", 45.7000, -111.7800, "club", "GPAA-Chapter im Südwesten Montanas. " + ASK_DE, "GPAA chapter in south-western Montana. " + ASK_EN, "https://www.headwatersgpaa.com/"),
 ("US", "Central Montana Prospectors", "Great Falls, MT", 47.5000, -111.3000, "club", ASK_DE, ASK_EN, "https://www.centralmontanaprospectors.org/"),
 ("US", "Casper GPAA Chapter", "Casper, WY", 42.8500, -106.3100, "club", "GPAA-Chapter. " + ASK_DE, "GPAA chapter. " + ASK_EN, "https://www.caspergpaa.org/"),
 ("US", "Weekend Gold Miners", "Dahlonega, GA", 34.5300, -83.9800, "club", ASK_DE, ASK_EN, "https://www.weekendgoldminers.com/"),
 ("US", "Central Virginia Gold Prospectors", "Zentral-Virginia", 37.9000, -78.0000, "club", ASK_DE, ASK_EN, "https://www.cvgp.net/"),
 ("US", "Ohio State Prospectors Association", "Ohio", 40.0000, -82.9000, "club", ASK_DE, ASK_EN, "https://www.ospagold.com/"),
 ("US", "Buckeye Chapter GPAA", "Belleville, OH", 40.6200, -82.5100, "club", "GPAA-Chapter. " + ASK_DE, "GPAA chapter. " + ASK_EN, "https://www.buckeyegold.com/"),
 # Kanada
 ("CA", "Alberta Gold Prospectors Association", "Edmonton, AB", 53.5500, -113.4900, "club", "Grösster Hobby-Goldsucher-Verein Westkanadas; organisiert Ausflüge und Wettbewerbe, auch in BC. " + ASK_DE, "Western Canada's largest hobby prospecting club; outings and competitions, also in BC. " + ASK_EN, "https://agpa.ca/"),
 ("CA", "Klondike Visitors Association", "Dawson City, YT", 64.0610, -139.4320, "claims", "Betreibt den Gratis-Touristen-Claim Free Claim #6 am Bonanza Creek.", "Runs the free tourist claim Free Claim #6 on Bonanza Creek.", "https://dawsoncity.ca/"),
 ("CA", "Klondike Placer Miners' Association", "Whitehorse, YT", 60.7200, -135.0500, "club", "Verband der Placer-Minen im Yukon – Infos zu Regeln und Kontakten, keine Hobby-Claims.", "Association of Yukon placer miners – rules and contacts, no hobby claims.", "https://www.kpma.ca/"),
 # Europa
 ("CH", "Schweizerische Goldwäschervereinigung (SGV)", "Schweiz (Napf)", 47.1200, 7.9900, "national", "Landesverband der Goldwäscher (ca. 400 Mitglieder); Kurse, Wettbewerbe und die Übersicht der kantonalen Bestimmungen.", "Swiss gold panners' association (about 400 members); courses, competitions and the overview of cantonal rules.", "https://www.goldwaschen.ch/"),
 ("IT", "Associazione Biellese Cercatori d'Oro", "Vermogno (Biella)", 45.4900, 8.0350, "club", "Verein seit 1985, betreibt das Goldmuseum in Vermogno und Wettbewerbe in der Bessa; hilft bei der Anmeldung im Piemont.", "Club since 1985, runs the gold museum in Vermogno and competitions in the Bessa; helps with the Piedmont registration.", "https://www.cercatoridoro.it/"),
]

# Australien – Goldgebiete (Lage = Ort, Gebiet ringsum)
AU_SPOTS = [
 # Western Australia – Eastern Goldfields
 ("AU", "Kalgoorlie-Boulder", "Eastern Goldfields", -30.7490, 121.4660, "crown", "wa-gf", "AU-WA", "Hauptstadt der Goldfields mit Super Pit, Läden, Verleih und Touren. Rundherum ist fast alles Tenement – Ebene «WA – Tenements» prüfen.", "Capital of the Goldfields with Super Pit, shops, hire and tours. Almost everything around is tenement – check the 'WA tenements' layer."),
 ("AU", "Coolgardie", "Eastern Goldfields", -30.9530, 121.1650, "crown", "wa-gf", "AU-WA", "Hier begann 1892 der Goldrausch im Westen. Viele alte Schürfstellen.", "The western gold rush started here in 1892. Many old workings."),
 ("AU", "Kanowna (Geisterstadt)", "Eastern Goldfields", -30.6000, 121.6000, "crown", "wa-gf", "AU-WA", "Verlassene Goldgräberstadt nordöstlich von Kalgoorlie.", "Abandoned gold-rush town north-east of Kalgoorlie."),
 ("AU", "Kurnalpi", "Eastern Goldfields", -30.5200, 122.2500, "crown", "wa-gf", "AU-WA", "Bekanntes Detektor-Gebiet östlich von Kalgoorlie.", "Known detecting area east of Kalgoorlie."),
 ("AU", "Menzies", "Eastern Goldfields", -29.6900, 121.0300, "crown", "wa-gf", "AU-WA", "Alte Goldgräberstadt am Golden Quest Discovery Trail.", "Old gold-rush town on the Golden Quest Discovery Trail."),
 ("AU", "Leonora / Gwalia", "Eastern Goldfields", -28.8800, 121.3300, "crown", "wa-gf", "AU-WA", "Goldgräberort mit historischer Gwalia-Mine; Ausgangspunkt für Touren und Kurse.", "Gold town with the historic Gwalia mine; base for tours and courses."),
 ("AU", "Laverton", "Eastern Goldfields", -28.6300, 122.4000, "crown", "wa-gf", "AU-WA", "Abgelegener Goldort am Rand der Wüste.", "Remote gold town at the edge of the desert."),
 ("AU", "Norseman", "Eastern Goldfields", -32.2000, 121.7800, "crown", "wa-gf", "AU-WA", "Südliches Ende der Goldfields.", "Southern end of the Goldfields."),
 # Murchison und Pilbara
 ("AU", "Mount Magnet", "Murchison", -28.0600, 117.8500, "crown", "wa-mw", "AU-WA", "Ältestes noch aktives Goldfeld in WA.", "Oldest still active goldfield in WA."),
 ("AU", "Cue", "Murchison", -27.4200, 117.9000, "crown", "wa-mw", "AU-WA", "Historischer Goldort im Murchison.", "Historic gold town in the Murchison."),
 ("AU", "Meekatharra", "Murchison", -26.5900, 118.4900, "crown", "wa-mw", "AU-WA", "Nördliches Murchison-Goldfeld.", "Northern Murchison goldfield."),
 ("AU", "Marble Bar", "Pilbara", -21.1700, 119.7500, "crown", "pilbara", "AU-WA", "Heissester Ort Australiens, grobes Pilbara-Gold. Nur im Winter.", "Australia's hottest town, coarse Pilbara gold. Winter only."),
 ("AU", "Nullagine", "Pilbara", -21.8900, 120.1100, "crown", "pilbara", "AU-WA", "Abgelegenes Pilbara-Goldfeld.", "Remote Pilbara goldfield."),
 # Victoria – Goldenes Dreieck
 ("AU", "Ballarat", "Golden Triangle", -37.5600, 143.8500, "crown", "vic", "AU-VIC", "Südecke des Goldenen Dreiecks; Sovereign Hill (Museum mit Goldwaschen).", "Southern corner of the Golden Triangle; Sovereign Hill (museum with panning)."),
 ("AU", "Bendigo", "Golden Triangle", -36.7600, 144.2800, "crown", "vic", "AU-VIC", "Ostecke des Goldenen Dreiecks, State Forests ringsum.", "Eastern corner of the Golden Triangle, state forests around."),
 ("AU", "St Arnaud", "Golden Triangle", -36.6200, 143.2600, "crown", "vic", "AU-VIC", "Westecke des Goldenen Dreiecks.", "Western corner of the Golden Triangle."),
 ("AU", "Dunolly", "Golden Triangle", -36.8600, 143.7300, "crown", "vic", "AU-VIC", "Mitten im Nugget-Gebiet; nahe Moliagul (Welcome Stranger, grösster Nugget der Welt).", "In the heart of nugget country; near Moliagul (Welcome Stranger, world's largest nugget)."),
 ("AU", "Moliagul – Welcome Stranger", "Golden Triangle", -36.7500, 143.6700, "show", "vic", "AU-VIC", "Fundort des Welcome Stranger (1869, 72 kg Gold) – Gedenkstein.", "Find site of the Welcome Stranger (1869, 72 kg of gold) – memorial."),
 ("AU", "Tarnagulla", "Golden Triangle", -36.7700, 143.8300, "crown", "vic", "AU-VIC", "Klassisches Detektor-Gebiet im Goldenen Dreieck.", "Classic detecting area in the Golden Triangle."),
 ("AU", "Wedderburn", "Golden Triangle", -36.4200, 143.6100, "crown", "vic", "AU-VIC", "Berühmt für Nuggets nahe der Oberfläche.", "Famous for near-surface nuggets."),
 ("AU", "Inglewood / Kingower", "Golden Triangle", -36.5700, 143.8700, "crown", "vic", "AU-VIC", "Nugget-Gebiet im Norden des Dreiecks.", "Nugget area in the north of the triangle."),
 ("AU", "Creswick Creek", "Creswick Creek", -37.4200, 143.8900, "closed", "vic", "AU-VIC", "Prospecting in diesem Bach ist nicht erlaubt.", "Prospecting is not permitted in this creek."),
 # Queensland
 ("AU", "Charters Towers", "Burdekin", -20.0800, 146.2600, "crown", "qld", "AU-QLD", "Historische Goldstadt; Fossicking Licence und Erlaubnis nötig.", "Historic gold town; fossicking licence and permission needed."),
 ("AU", "Clermont", "Central Queensland", -22.8200, 147.6400, "crown", "qld", "AU-QLD", "Bekanntes Detektor-Gebiet in Zentral-Queensland.", "Known detecting area in central Queensland."),
 ("AU", "Palmer River", "Palmer River", -16.1000, 144.1000, "crown", "qld", "AU-QLD", "Historisches Goldfeld im hohen Norden, sehr abgelegen und heiss.", "Historic goldfield in the far north, very remote and hot."),
 ("AU", "Gympie", "Mary River", -26.1900, 152.6700, "show", "qld", "AU-QLD", "Goldgräberstadt mit Bergbau-Museum.", "Gold town with mining museum."),
 # New South Wales
 ("AU", "Tambaroora Fossicking Area (Hill End)", "Tambaroora", -33.0000, 149.4300, "fossick", "nsw", "AU-NSW", "Ausgewiesene Crown-Land-Fossicking-Fläche bei Hill End. Die Hill End Historic Site selbst ist Nationalpark – dort verboten.", "Designated Crown-land fossicking area near Hill End. Hill End Historic Site itself is national park – forbidden there."),
 ("AU", "Sofala / Turon River", "Turon River", -33.0800, 149.6900, "crown", "nsw", "AU-NSW", "Ältestes Goldfeld von NSW am Turon.", "Oldest goldfield of NSW on the Turon."),
 ("AU", "Araluen", "Araluen Creek", -35.6500, 149.8100, "crown", "nsw", "AU-NSW", "Historisches Goldtal im Süden von NSW.", "Historic gold valley in southern NSW."),
 # Northern Territory, South Australia, Tasmanien
 ("AU", "Tennant Creek / Warrego Fossicking Area", "Tennant Creek", -19.6500, 134.1900, "fossick", "nt", "AU-NT", "Bekanntestes Goldgebiet im Northern Territory; Warrego Fossicking Area in der Nähe.", "Best-known gold area in the Northern Territory; Warrego Fossicking Area nearby."),
 ("AU", "Echunga Goldfield", "Adelaide Hills", -35.1000, 138.8000, "crown", "au-other", "AU-SA", "Erstes Goldfeld Südaustraliens (1852).", "South Australia's first goldfield (1852)."),
 ("AU", "Beaconsfield Mine & Heritage Centre", "Tamar", -41.2000, 146.8200, "show", "au-other", "AU-TAS", "Goldminen-Museum in Tasmanien.", "Gold mine museum in Tasmania."),
 # Tasmanien – Goldfelder (Prospecting Licence nötig) und ein Fossicking-Gebiet
 ("AU", "Lefroy Goldfield", "Nordtasmanien", -41.0800, 146.9800, "licence", "tas", "AU-TAS", "Einst eines der reichsten Goldfelder Tasmaniens, alte Schächte und Halden.", "Once one of Tasmania's richest goldfields, old shafts and dumps."),
 ("AU", "Lisle Goldfield", "Lisle Creek", -41.2400, 147.3300, "licence", "tas", "AU-TAS", "Alluviales Goldfeld nordöstlich von Launceston.", "Alluvial goldfield north-east of Launceston."),
 ("AU", "Mathinna / Mangana", "South Esk", -41.4700, 147.9000, "licence", "tas", "AU-TAS", "Goldfelder im Nordosten (Golden-Gate-Mine bei Mathinna).", "Goldfields in the north-east (Golden Gate mine at Mathinna)."),
 ("AU", "Pieman River / Corinna", "Pieman River", -41.6500, 145.0800, "licence", "tas", "AU-TAS", "Alter Goldgräberort an der Westküste; hier wurden grosse Nuggets gefunden.", "Old gold-rush village on the west coast; large nuggets were found here."),
 ("AU", "Lea River bei Moina", "Lea River", -41.4800, 146.0600, "licence", "tas", "AU-TAS", "Alluviale Goldwäschen 2,5 km westlich von Moina.", "Alluvial gold workings 2.5 km west of Moina."),
 ("AU", "Weld River Fossicking Area (Moorina)", "Weld River", -41.1300, 147.8700, "fossick", "tas-gem", "AU-TAS", "Offizielles Fossicking-Gebiet ohne Lizenz – aber für Edelsteine (Saphir), nicht für Gold. Alle 11 Fossicking-Gebiete Tasmaniens sind Edelstein-Gebiete.", "Official fossicking area, no licence – but for gems (sapphire), not gold. All 11 Tasmanian fossicking areas are gem areas.", "https://www.mrt.tas.gov.au/prospecting_and_fossicking/fossicking_areas"),
]

# Australien – Verleih, Läden, Touren (Lage = Ort, Adresse auf der Website)
AU_SERVICES = [
 ("AU", "Reeds Prospecting Supplies", "Perth", -31.9500, 115.8600, "hire", "service", "AU-SHOP", "Grösste Detektor-Mietflotte in Perth (ganze Minelab-Palette). Mindestens 2 Tage, Kaution je nach Gerät.", "Perth's largest detector hire fleet (full Minelab range). Minimum 2 days, deposit depends on model.", "https://reedsprospecting.com.au/pages/hire-detectors"),
 ("AU", "Miners Den", "Perth", -31.9300, 115.8300, "hire", "service", "AU-SHOP", "Prospecting-Laden; Detektoren auch zur Miete auf Kauf (6–36 Monate).", "Prospecting shop; detectors also rent-to-own (6–36 months).", "https://www.minersden.com.au/rental/"),
 ("AU", "Finders Keepers Gold Prospecting", "Kalgoorlie (Hannan St) und Perth", -30.7480, 121.4680, "hire", "service", "AU-SHOP", "Prospecting-Laden in Kalgoorlie und Perth.", "Prospecting shop in Kalgoorlie and Perth.", "https://finderskeepersgold.com/"),
 ("AU", "Prospectors Patch", "Kalgoorlie", -30.7520, 121.4630, "hire", "service", "AU-SHOP", "Detektor-Verleih in Kalgoorlie (Abholung im Laden).", "Detector hire in Kalgoorlie (collect in store).", "https://prospectorspatch.com.au/pages/hire"),
 ("AU", "Pirates Gold Prospecting Tours", "Leonora / Kalgoorlie", -28.8850, 121.3350, "tour", "tour", "AU-TOUR", "Tag-along-Touren April–August auf privaten Leases in den Eastern Goldfields mit Training; dazu Tagestouren ab Kalgoorlie. Seit 1984 am Detektieren.", "Tag-along tours April–August on private leases in the Eastern Goldfields with training; plus day tours from Kalgoorlie. Detecting since 1984.", "https://www.piratesgold.com.au/"),
 ("AU", "Gold Talk Leonora", "Leonora", -28.8780, 121.3250, "tour", "tour", "AU-TOUR", "Dreitägiger Anfänger-Kurs im Goldwaschen und Detektieren.", "Three-day beginner course in prospecting and detecting.", "https://www.goldtalkleonora.com.au/"),
 ("AU", "Coolgardie Gold Safaris", "Coolgardie", -30.9560, 121.1700, "tour", "tour", "AU-TOUR", "Touren über 3, 5 oder 10 Tage und Touren nach Mass.", "Tours over 3, 5 or 10 days and custom tours.", "https://www.coolgardiegoldsafaris.com.au/"),
 ("AU", "Gold Nugget Tours", "Kalgoorlie-Boulder", -30.7440, 121.4750, "tour", "tour", "AU-TOUR", "Tagestouren mit Einführung und Ausrüstung (Mai–Oktober).", "Day tours with introduction and gear (May–October).", "https://www.westernaustralia.com/en/tour/gold-nugget-tours/5e785a5f5cd6b7c075bdb33f"),
 ("AU", "Gold and Relics", "Kalgoorlie, Leinster, Leonora", -30.7600, 121.4550, "tour", "tour", "AU-TOUR", "Tag-along- und All-inclusive-Touren (auf Wunsch mit Flug ab Perth).", "Tag-along and all-inclusive tours (optionally with flights from Perth).", "https://goldandrelics.com.au/"),
 ("AU", "Metal Detector Hire (Hill End)", "Hill End, NSW", -33.0320, 149.4150, "hire", "service", "AU-SHOP", "Detektor-Miete ab A$50 pro Tag.", "Detector hire from A$50 per day.", "https://metaldetectorhire.com.au/"),
]

# Kanada – BC Recreational Panning Reserves (Mitte aus den GPS-Dateien der Provinz) und Yukon
CA_SPOTS = [
 ("CA", "Barnes Creek Panning Reserve", "Barnes Creek", 49.9079, -118.1285, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet am Barnes Creek (Monashee).", "Official recreational panning reserve on Barnes Creek."),
 ("CA", "Cayoosh Creek Panning Reserve", "Cayoosh Creek", 50.6809, -121.9320, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet bei Lillooet.", "Official recreational panning reserve near Lillooet."),
 ("CA", "Erickson Panning Reserve", "Goat River", 49.0995, -116.4524, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet bei Creston.", "Official recreational panning reserve near Creston."),
 ("CA", "Goldstream River Panning Reserve", "Goldstream River", 51.6723, -118.5570, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet nördlich von Revelstoke (nicht der Park bei Victoria).", "Official recreational panning reserve north of Revelstoke (not the park near Victoria)."),
 ("CA", "Hope Panning Reserve", "Fraser River", 49.3900, -121.4464, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet am Fraser bei Hope (31 ha).", "Official recreational panning reserve on the Fraser at Hope (31 ha)."),
 ("CA", "Kennedy River Panning Reserve", "Kennedy River", 49.1313, -125.4238, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet auf Vancouver Island.", "Official recreational panning reserve on Vancouver Island."),
 ("CA", "Kettle River Panning Reserve", "Kettle River", 50.0795, -118.4812, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet am Kettle River.", "Official recreational panning reserve on the Kettle River."),
 ("CA", "Lytton Panning Reserve (Site 1)", "Fraser River", 50.2793, -121.6186, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet am Fraser bei Lytton.", "Official recreational panning reserve on the Fraser at Lytton."),
 ("CA", "Lytton Panning Reserve (Site 2)", "Fraser River", 50.2337, -121.5860, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet am Fraser bei Lytton.", "Official recreational panning reserve on the Fraser at Lytton."),
 ("CA", "Princeton Panning Reserve", "Similkameen / Tulameen", 49.4597, -120.5038, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet bei Princeton (Similkameen-Gold).", "Official recreational panning reserve near Princeton."),
 ("CA", "Quesnel-Fraser River Junction Panning Reserve", "Fraser / Quesnel", 52.9794, -122.4933, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet am Zusammenfluss bei Quesnel (Cariboo).", "Official recreational panning reserve at the Quesnel junction (Cariboo)."),
 ("CA", "Spruce Creek Panning Reserve (Atlin)", "Spruce Creek", 59.5802, -133.6225, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet im Goldfeld von Atlin, ganz im Norden von BC.", "Official recreational panning reserve in the Atlin goldfield, far northern BC."),
 ("CA", "Wild Horse River Panning Reserve", "Wild Horse River", 49.6104, -115.6168, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet bei Fort Steele (Kootenay-Goldrausch 1864).", "Official recreational panning reserve near Fort Steele."),
 ("CA", "Yale Town Panning Reserve", "Fraser River", 49.5613, -121.4276, "free", "bc", "CA-BCRES", "Offizielles Hobby-Waschgebiet am Fraser bei Yale (Fraser-Goldrausch 1858).", "Official recreational panning reserve on the Fraser at Yale."),
 ("CA", "Barkerville Historic Town", "Williams Creek", 53.0700, -121.5150, "show", "bc", "CA-SHOW", "Goldgräberstadt des Cariboo-Goldrauschs als Museum, mit Goldwaschen für Besucher.", "Cariboo gold rush town as a museum, with panning for visitors."),
 # Yukon
 ("CA", "Free Claim #6 (Bonanza Creek)", "Bonanza Creek", 63.9300, -139.3200, "free", "klondike", "CA-YT", "Gratis-Touristen-Claim der Klondike Visitors Association – Pfanne und Schaufel, im Sommer. Lage ungefähr, Wegbeschreibung im Besucherzentrum.", "Free tourist claim of the Klondike Visitors Association – pan and shovel, in summer. Approximate location; directions at the visitor centre."),
 ("CA", "Discovery Claim (Bonanza Creek)", "Bonanza Creek", 63.9480, -139.3150, "show", "klondike", "CA-SHOW", "Hier begann 1896 der Klondike-Goldrausch (Parks Canada).", "Where the Klondike gold rush began in 1896 (Parks Canada)."),
 ("CA", "Dredge No. 4", "Bonanza Creek", 63.9700, -139.3350, "show", "klondike", "CA-SHOW", "Riesiger historischer Goldbagger (Parks Canada).", "Huge historic gold dredge (Parks Canada)."),
 ("CA", "Dawson City – Mining Recorder & Besucherzentrum", "Klondike", 64.0600, -139.4300, "show", "klondike", "CA-YT", "Hier erfährt man, wo man frei waschen darf; Touren und Bezahl-Claims in der Umgebung.", "Find out here where free panning is allowed; tours and fee claims nearby."),
]

# Weitere Länder – nur Touristen-Orte
WORLD_SPOTS = [
 ("JP", "Toi Kinzan (Izu)", "–", 34.9140, 138.7870, "site", "jp", "JP-T", "Alte Goldmine mit Museum und Goldwasch-Halle für Besucher.", "Old gold mine with museum and panning hall for visitors."),
 ("JP", "Sado Kinzan (Sado-Insel)", "–", 38.0430, 138.2580, "site", "jp", "JP-T", "UNESCO-Welterbe-Goldmine mit Goldwasch-Erlebnis.", "UNESCO World Heritage gold mine with panning experience."),
 ("JP", "Usotan – Goldwasch-Fluss (Nakatombetsu, Hokkaido)", "Usotan", 44.9700, 142.2900, "site", "jp", "JP-T", "Bekannter Goldwasch-Ort auf Hokkaido mit Waschplatz am Fluss; im Sommer Goldwasch-Meisterschaft. Lage ungefähr.", "Known panning place in Hokkaido with a river panning area; panning championship in summer. Approximate location."),
 ("ZA", "Pilgrim's Rest", "Blyde", -24.9080, 30.7570, "site", "za", "ZA-T", "Historische Goldgräberstadt (1873) mit Goldwasch-Vorführungen.", "Historic gold-rush town (1873) with panning demonstrations."),
 ("ZA", "Barberton", "–", -25.7870, 31.0530, "show", "za", "ZA-T", "Historisches Goldfeld mit Museen und Geo-Trail.", "Historic goldfield with museums and geo trail."),
 ("ZA", "Gold Reef City (Johannesburg)", "–", -26.2360, 28.0130, "site", "za", "ZA-T", "Freizeitpark auf einer alten Goldmine, mit Goldwaschen und Untertage-Tour.", "Theme park on an old gold mine, with panning and underground tour."),
]

def build(spots, name):
    feats = []
    for spot in spots:
        c, name_, river, lat, lon, kind, find, permit, de, en = spot[:10]
        link = spot[10] if len(spot) > 10 else None     # eigene Anlaufstelle vor Ort (Museum, Waschplatz)
        f, p = FIND[find], PERMIT[permit or c]
        feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
                      "properties": {"name": name_, "country": c, "river": river, "kind": kind, "de": de, "en": en,
                                     "find_de": f[0], "find_en": f[1], "permit_de": p[0], "permit_en": p[1],
                                     "permit_link": p[2], "link": link}})
        if c in STATE_FILES: feats[-1]["properties"]["state"] = state_of(lon, lat, c)
    out = os.path.join(DATA, name)
    os.makedirs(DATA, exist_ok=True)
    json.dump({"type": "FeatureCollection", "features": feats}, open(out, "w"), ensure_ascii=False, indent=0)
    print(len(feats), "Orte ->", out)

build(SPOTS, "goldspots.geojson")
build(US_SPOTS, "goldspots-us.geojson")
build(AU_SPOTS, "goldspots-au.geojson")
build(AU_SERVICES, "services-au.geojson")
build(CA_SPOTS, "goldspots-ca.geojson")
build(WORLD_SPOTS, "goldspots-world.geojson")

# Clubs
cf = [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
       "properties": {"name": n, "country": c, "river": town, "kind": kind, "de": de, "en": en, "join": url}}
      for c, n, town, lat, lon, kind, de, en, url in CLUBS]
json.dump({"type": "FeatureCollection", "features": cf}, open(os.path.join(DATA, "clubs.geojson"), "w"), ensure_ascii=False, indent=0)
print(len(cf), "Clubs ->", os.path.join(DATA, "clubs.geojson"))

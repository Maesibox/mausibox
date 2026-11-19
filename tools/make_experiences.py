#!/usr/bin/env python3
"""
Erzeugt data/experiences.geojson: alle "Erlebnisse" auf einer Ebene –
offizielle Waschplätze & geführtes Waschen, Schaubergwerke & Museen, Detektor-Verleih, Touren & Kurse.

Quelle 1: die bestehenden Goldplatz-Dateien (Einträge mit kind site / show / hire / tour).
Quelle 2: die Liste EXTRA unten – hier neue Erlebnisse eintragen (z. B. Kurse, Club-Ausflüge, Goldwasch-Camps).

Aufruf:  python3 tools/make_experiences.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = [
    "data/goldspots.geojson", "data/goldspots-us.geojson", "data/goldspots-ca.geojson",
    "data/goldspots-au.geojson", "data/goldspots-world.geojson", "data/services-au.geojson",
]
# Art in den Quell-Dateien  ->  Art auf der Erlebnis-Ebene
KIND_MAP = {"site": "site", "show": "mine", "hire": "hire", "tour": "tour"}

# Eigene Erlebnisse. Pflicht: name, country (2 Buchstaben), lon, lat, kind (site/mine/hire/tour/course), de, en.
# Optional: river (Ort/Region), state, link (Website/Buchung), price_de/price_en, season_de/season_en.
EXTRA = [
    # {
    #     "name": "Goldwasch-Kurs am Napf", "country": "CH", "lon": 7.94, "lat": 47.01, "kind": "course",
    #     "river": "Napfgebiet (LU/BE)",
    #     "de": "Halbtageskurs mit Pfanne und Rinne, Ausrüstung inklusive.",
    #     "en": "Half-day course with pan and sluice, gear included.",
    #     "price_de": "ca. CHF 60", "price_en": "about CHF 60",
    #     "link": "https://…",
    # },
]


def main():
    out, seen = [], set()
    for rel in SOURCES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        for f in json.load(open(path, encoding="utf-8"))["features"]:
            p = dict(f["properties"])
            kind = KIND_MAP.get(p.get("kind"))
            if not kind:
                continue
            key = (p.get("name"), tuple(f["geometry"]["coordinates"]))
            if key in seen:
                continue
            seen.add(key)
            p["kind"] = kind
            out.append({"type": "Feature", "geometry": f["geometry"], "properties": p})
    for e in EXTRA:
        e = dict(e)
        lon, lat = e.pop("lon"), e.pop("lat")
        out.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": e})
    out.sort(key=lambda f: (f["properties"].get("country", ""), f["properties"].get("name", "")))
    dst = os.path.join(ROOT, "data/experiences.geojson")
    with open(dst, "w", encoding="utf-8") as fh:
        json.dump({"type": "FeatureCollection", "features": out}, fh, ensure_ascii=False, separators=(",", ":"))
    kinds = {}
    for f in out:
        kinds[f["properties"]["kind"]] = kinds.get(f["properties"]["kind"], 0) + 1
    print(f"{len(out)} Erlebnisse -> data/experiences.geojson", kinds)


if __name__ == "__main__":
    main()

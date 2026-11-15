#!/usr/bin/env python3
"""
Holt die neuseeländischen Bergbau-Daten (NZ Petroleum & Minerals) und speichert sie als GeoJSON in data/nz/.
Läuft täglich automatisch auf GitHub (.github/workflows/nz-data.yml), kann aber auch von Hand gestartet werden:
    python3 tools/update_nz.py
Warum eine Kopie? Der NZ-Server erlaubt Web-Apps keinen direkten Abruf (CORS), und der Umweg (JSONP) klappt auf dem iPhone nicht.
"""
import json, os, sys, urllib.parse, urllib.request, datetime

BASE = "https://gis.nzpam.govt.nz/server/rest/services/Public/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "nz")
PERMIT_FIELDS = "OBJECTID,Permit_Number,Permit_Type_Code,Permit_Type_Description,Minerals,Owners,Operator,Operation_Name,Permit_Location,Permit_Area,Permit_Grant_Date,Permit_Expiry_Date"
LAYERS = {
    "fossick": ("Permits_Minerals_Layers/MapServer/1", "Permit_Type_Code='Gold Fossicking Area'", PERMIT_FIELDS, 0.00002),
    "permits": ("Permits_Minerals_Layers/MapServer/1", "Permit_Type_Code<>'Gold Fossicking Area'", PERMIT_FIELDS, 0.0002),
    "applications": ("Permits_Minerals_Layers/MapServer/0", "1=1",
                     "OBJECTID,Application_ID,Permit_Number,Permit_Type_Description,Minerals,Owners,Operator,Operation_Name,Permit_Location,Permit_Area,Submitted_Date", 0.0002),
    "schedule4": ("CMA_Schedule_4_Land/MapServer/0", "1=1", "OBJECTID,name", 0.001),
}


def fetch(path, where, fields, offset_deg):
    feats, start = [], 0
    while True:
        q = urllib.parse.urlencode({"where": where, "outFields": fields, "outSR": 4326, "maxAllowableOffset": offset_deg,
                                    "geometryPrecision": 5, "orderByFields": "OBJECTID", "resultOffset": start, "f": "geojson"})
        with urllib.request.urlopen(BASE + path + "/query?" + q, timeout=180) as r:
            d = json.load(r)
        page = d.get("features", [])
        feats += page
        more = d.get("exceededTransferLimit") or (d.get("properties") or {}).get("exceededTransferLimit")
        if not more or not page:
            return feats
        start += len(page)


def main():
    os.makedirs(OUT, exist_ok=True)
    counts = {}
    for name, (path, where, fields, off) in LAYERS.items():
        feats = fetch(path, where, fields, off)
        if not feats and name != "applications":
            sys.exit("Keine Daten für " + name + " – Datei wird nicht überschrieben")
        for f in feats:
            f.pop("id", None)
        feats.sort(key=lambda f: f["properties"].get("OBJECTID") or 0)
        with open(os.path.join(OUT, name + ".geojson"), "w") as fh:
            json.dump({"type": "FeatureCollection", "features": feats}, fh, separators=(",", ":"))
        counts[name] = len(feats)
    with open(os.path.join(OUT, "meta.json"), "w") as fh:
        json.dump({"updated": datetime.date.today().isoformat(), "source": "NZ Petroleum & Minerals", "counts": counts}, fh)
    print(counts)


if __name__ == "__main__":
    main()

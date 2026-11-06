/*
 * Koordinaten aus Text lesen – so, wie sie auf Location Notices stehen:
 *   34.80123, -114.40123          (Dezimalgrad)
 *   34.80123N 114.40123W
 *   34°48'04.4"N 114°24'04.4"W    (Grad/Minuten/Sekunden)
 *   34 48.073 N, 114 24.073 W     (Grad/Dezimalminuten)
 *   11S 736512 3854320            (UTM: Zone, Ost, Nord)
 * Fehlt bei der Länge W/E und ist sie positiv, wird in den USA "West" angenommen.
 */
var Coords = (function () {

  // UTM (WGS84/NAD83) -> Breite/Länge
  function utmToLatLon(zone, easting, northing, southern) {
    var a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
    var e2 = f * (2 - f), ep2 = e2 / (1 - e2);
    var x = easting - 500000, y = southern ? northing - 10000000 : northing;
    var lon0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
    var M = y / k0;
    var mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    var e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    var phi1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
      + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
      + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu)
      + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
    var sin1 = Math.sin(phi1), cos1 = Math.cos(phi1), tan1 = Math.tan(phi1);
    var N1 = a / Math.sqrt(1 - e2 * sin1 * sin1);
    var T1 = tan1 * tan1, C1 = ep2 * cos1 * cos1;
    var R1 = a * (1 - e2) / Math.pow(1 - e2 * sin1 * sin1, 1.5);
    var D = x / (N1 * k0);
    var lat = phi1 - (N1 * tan1 / R1) * (D * D / 2
      - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * Math.pow(D, 4) / 24
      + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * Math.pow(D, 6) / 720);
    var lon = lon0 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6
      + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * Math.pow(D, 5) / 120) / cos1;
    return { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI };
  }

  // Breite/Länge -> UTM (für die Anzeige)
  function latLonToUtm(lat, lon) {
    var a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
    var e2 = f * (2 - f), ep2 = e2 / (1 - e2);
    var zone = Math.floor((lon + 180) / 6) + 1;
    var lon0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
    var phi = lat * Math.PI / 180, lam = lon * Math.PI / 180;
    var N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    var T = Math.tan(phi) * Math.tan(phi), Cc = ep2 * Math.cos(phi) * Math.cos(phi);
    var A = Math.cos(phi) * (lam - lon0);
    var M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * Math.pow(e2, 3) / 256) * phi
      - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * Math.pow(e2, 3) / 1024) * Math.sin(2 * phi)
      + (15 * e2 * e2 / 256 + 45 * Math.pow(e2, 3) / 1024) * Math.sin(4 * phi)
      - (35 * Math.pow(e2, 3) / 3072) * Math.sin(6 * phi));
    var E = k0 * N * (A + (1 - T + Cc) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * Cc - 58 * ep2) * Math.pow(A, 5) / 120) + 500000;
    var Nn = k0 * (M + N * Math.tan(phi) * (A * A / 2 + (5 - T + 9 * Cc + 4 * Cc * Cc) * Math.pow(A, 4) / 24
      + (61 - 58 * T + T * T + 600 * Cc - 330 * ep2) * Math.pow(A, 6) / 720));
    if (lat < 0) Nn += 10000000;
    var band = "CDEFGHJKLMNPQRSTUVWX".charAt(Math.max(0, Math.min(19, Math.floor((lat + 80) / 8))));
    return { zone: zone, band: band, easting: Math.round(E), northing: Math.round(Nn) };
  }

  function parseUtm(s) {
    var m = s.trim().toUpperCase().match(/^(?:UTM\s*)?(?:ZONE\s*)?(\d{1,2})\s*([C-X])?[\s,;]+(\d{6}(?:\.\d+)?)\s*(?:M?\s*E)?[\s,;]+(\d{7}(?:\.\d+)?)\s*(?:M?\s*N)?$/);
    if (!m) return null;
    var zone = parseInt(m[1], 10);
    if (zone < 1 || zone > 60) return null;
    var southern = m[2] ? m[2] < "N" : false;
    var r = utmToLatLon(zone, parseFloat(m[3]), parseFloat(m[4]), southern);
    r.format = "utm";
    return r;
  }

  function groupValue(nums) {
    if (!nums.length || nums.length > 3) return NaN;
    var neg = nums[0] < 0 || Object.is(nums[0], -0);
    var v = Math.abs(nums[0]) + (nums[1] || 0) / 60 + (nums[2] || 0) / 3600;
    if ((nums[1] || 0) >= 60 || (nums[2] || 0) >= 60) return NaN;
    return neg ? -v : v;
  }

  function parseLatLon(s) {
    var txt = s.toUpperCase().replace(/[°º˚'′’"″”]/g, " ").replace(/[,;]/g, " , ");
    var tokens = txt.match(/[-+]?\d+(?:\.\d+)?|[NSEW]|,/g);
    if (!tokens) return null;
    var groups = [], cur = { nums: [], hemi: null };
    function close() { if (cur.nums.length || cur.hemi) groups.push(cur); cur = { nums: [], hemi: null }; }
    tokens.forEach(function (tk) {
      if (tk === ",") { close(); return; }
      if (/^[NSEW]$/.test(tk)) {
        if (!cur.nums.length) cur.hemi = tk;                          // vorangestellt: N 34 48 …
        else if (cur.hemi) { close(); cur.hemi = tk; }                // nächste Gruppe beginnt: … W 114 24
        else { cur.hemi = tk; close(); }                              // nachgestellt: 34 48 N
        return;
      }
      cur.nums.push(parseFloat(tk));
    });
    close();
    groups = groups.filter(function (g) { return g.nums.length; });
    if (groups.length === 1 && [2, 4, 6].indexOf(groups[0].nums.length) >= 0) {
      var n = groups[0].nums, h = n.length / 2;
      groups = [{ nums: n.slice(0, h), hemi: null }, { nums: n.slice(h), hemi: groups[0].hemi }];
    }
    if (groups.length !== 2) return null;

    var latG = groups[0], lonG = groups[1];
    if (latG.hemi === "E" || latG.hemi === "W" || lonG.hemi === "N" || lonG.hemi === "S") { latG = groups[1]; lonG = groups[0]; }
    var lat = groupValue(latG.nums), lon = groupValue(lonG.nums);
    if (latG.hemi === "S") lat = -Math.abs(lat);
    if (lonG.hemi === "W") lon = -Math.abs(lon);
    if (lonG.hemi === "E") lon = Math.abs(lon);
    var assumedWest = false;
    if (!lonG.hemi && lon > 0 && (APP_CONFIG.assumeWestLongitude !== false)) { lon = -lon; assumedWest = true; }
    if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat: lat, lon: lon, format: latG.nums.length === 1 ? "dd" : "dms", assumedWest: assumedWest };
  }

  function parse(text) {
    if (!text || !text.trim()) return null;
    return parseUtm(text) || parseLatLon(text);
  }

  function utmText(lat, lon) {
    var u = latLonToUtm(lat, lon);
    return "UTM " + u.zone + u.band + " " + u.easting + " E " + u.northing + " N";
  }

  return { parse: parse, utmToLatLon: utmToLatLon, latLonToUtm: latLonToUtm, utmText: utmText };
})();

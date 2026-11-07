/*
 * Parkplatz-Knopf: lange drücken = jetzigen GPS-Standort als Parkplatz speichern (ersetzt den alten),
 * kurz tippen = zum Parkplatz springen, Entfernung/Richtung zeigen, Navigation öffnen.
 */
var Parking = (function () {
  var C = APP_CONFIG;
  var map = null, marker = null;
  var t = function (k) { return App.t(k); };
  var esc = function (s) { return App.esc(s); };

  function get() { return App.pref("parking", null); }

  function draw() {
    var p = get();
    if (marker) { map.removeLayer(marker); marker = null; }
    if (!p) return;
    marker = L.marker([p.lat, p.lon], {
      icon: L.divIcon({ className: "park-icon", html: "<div class='park'>P</div>", iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15] }),
      zIndexOffset: 800
    }).addTo(map);
    marker.bindPopup(popupHtml, { maxWidth: 260 });
  }

  function popupHtml() {
    var p = get(), g = App.gps;
    if (!p) return "";
    var from = g ? App.formatDistance(App.distance(g.lat, g.lon, p.lat, p.lon)) + " " + App.direction(g.lat, g.lon, p.lat, p.lon) + " " + t("parkFromYou") : "";
    var nav = C.parking.navigateUrl.replace("{lat}", p.lat.toFixed(6)).replace("{lon}", p.lon.toFixed(6));
    return "<div class='pop'><h3>🅿 " + esc(t("parking")) + "</h3>" +
      (from ? "<p class='big-line'>" + esc(from) + "</p>" : "") +
      "<div class='coords'>" + esc(App.formatCoord(p.lat, p.lon)) + (p.accuracy ? " ±" + p.accuracy + " m" : "") + "</div>" +
      "<div class='src'>" + esc(t("parkSavedAt")) + ": " + esc(new Date(p.time).toLocaleString()) + "</div>" +
      "<div class='pop-actions'><a class='btn-like' href='" + esc(nav) + "' target='_blank' rel='noopener'>" + esc(t("navigate")) + "</a> " +
      "<button data-park-del>" + esc(t("deletePark")) + "</button></div></div>";
  }

  function save() {
    var g = App.gps;
    // nur eine frische Position verwenden (nicht älter als 2 Minuten)
    if (!g || Date.now() - g.time > 120000) {
      App.startGps(false);
      App.toast(t("parkNoGps"));
      return;
    }
    App.setPref("parking", { lat: g.lat, lon: g.lon, accuracy: Math.round(g.accuracy), time: new Date().toISOString() });
    draw();
    if (navigator.vibrate) navigator.vibrate(80);
    var btn = document.getElementById("btn-park");
    btn.classList.add("flash");
    setTimeout(function () { btn.classList.remove("flash"); }, 900);
    App.toast(t("parkSaved") + " (±" + Math.round(g.accuracy) + " m)");
  }

  function show() {
    var p = get();
    App.closeSheet();
    if (!p) { App.toast(t("parkHint")); return; }
    map.setView([p.lat, p.lon], Math.max(map.getZoom(), 16));
    setTimeout(function () { if (marker) marker.openPopup(); }, 300);
  }

  function remove() {
    App.setPref("parking", null);
    map.closePopup();
    draw();
    App.toast(t("parkDeleted"));
  }

  // Lange drücken erkennen (Finger und Maus); danach den normalen Klick unterdrücken
  function setupButton() {
    var btn = document.getElementById("btn-park");
    var timer = null, longDone = false, lastTouch = 0;
    function down(e) {
      if (e.type === "mousedown" && Date.now() - lastTouch < 1000) return;
      if (e.type === "touchstart") lastTouch = Date.now();
      longDone = false;
      clearTimeout(timer);
      timer = setTimeout(function () { longDone = true; save(); }, 600);
    }
    function up() { clearTimeout(timer); }
    btn.addEventListener("touchstart", down, { passive: true });
    btn.addEventListener("touchend", up);
    btn.addEventListener("touchcancel", up);
    btn.addEventListener("mousedown", down);
    btn.addEventListener("mouseup", up);
    btn.addEventListener("mouseleave", up);
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    btn.addEventListener("click", function () {
      if (longDone) { longDone = false; return; }
      show();
    });
  }

  function init(m) {
    map = m;
    draw();
    setupButton();
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-park-del]")) remove();
    });
  }

  return { init: init, show: show, save: save };
})();

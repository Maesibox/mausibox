/*
 * Club-Seiten für Gäste (Version 49)
 * - Jeder Club kann eine Gäste-Seite haben: Beschreibung, Gäste willkommen?, Preise, Camping, Termine, Regeln, Kontakt.
 * - Der Club-Admin bearbeitet sie in der Verwaltung und veröffentlicht sie.
 * - Veröffentlichte Seiten erscheinen auf der Karte (Ebene „Club-Seiten für Gäste“) und im Reise-Spickzettel.
 * - Gast-Anfragen gehen nur mit Konto; der Club-Admin sieht sie in der Verwaltung und antwortet.
 * Braucht auf dem Server: server/v49-clubpages.sql
 */
var ClubPages = (function () {
  var pages = [];          // veröffentlichte Seiten (für Karte und Spickzettel)
  var loaded = null;       // Promise
  var FIELDS = ["description", "place", "country", "languages", "guests", "guest_price", "camping", "events", "rules", "bring", "contact", "website"];

  function t(k) { return App.t(k); }
  function esc(s) { return App.esc(s == null ? "" : s); }
  function db() { return Auth.client; }
  function check(res) { if (res.error) throw res.error; return res.data; }
  function fail(err) { alert(t("error") + ": " + (err.message || err)); }
  function multiline(s) { return esc(s).replace(/\n/g, "<br>"); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? u : (u ? "https://" + u : ""); }

  function load() {
    if (!Auth.enabled() || !db()) return Promise.resolve([]);
    if (!loaded) {
      loaded = db().rpc("published_club_pages").then(check).then(function (rows) { pages = rows || []; return pages; })
        .catch(function () { loaded = null; return []; });
    }
    return loaded;
  }
  function reload() { loaded = null; return load(); }

  // ---------- Karten-Ebene ----------
  function layer(cfg) {
    var g = L.featureGroup();
    load().then(function (rows) {
      rows.forEach(function (p) {
        if (p.lat == null || p.lon == null) return;
        L.circleMarker([p.lat, p.lon], { radius: 10, color: "#000", weight: 2, fillColor: cfg.color || "#ffd600", fillOpacity: 1, bubblingMouseEvents: false })
          .bindPopup(function () { return "<div class='pop'>" + pageHtml(p, true) + "</div>"; }, { maxWidth: 320 })
          .addTo(g);
      });
    });
    return g;
  }

  function row(icon, label, val) {
    return val ? "<p class='note-text'><b>" + icon + " " + esc(t(label)) + ":</b><br>" + multiline(val) + "</p>" : "";
  }

  function pageHtml(p, withNav) {
    var site = safeUrl(p.website);
    return "<div class='pop-sec club' style='border-left:4px solid #ffd600'>" +
      "<h3>🏕 " + esc(p.club_name) + "</h3>" +
      (p.place ? "<div class='pop-sub'>" + esc(p.place) + "</div>" : "") +
      (p.description ? "<p class='note-text'>" + multiline(p.description) + "</p>" : "") +
      row("🙋", "cpGuests", p.guests) + row("💲", "cpPrice", p.guest_price) + row("⛺", "cpCamping", p.camping) +
      row("📅", "cpEvents", p.events) + row("⚖️", "cpRules", p.rules) + row("🎒", "cpBring", p.bring) +
      row("🗣", "cpLanguages", p.languages) + row("✉️", "cpContact", p.contact) +
      (site ? "<a href='" + esc(site) + "' target='_blank' rel='noopener'>🌐 " + esc(t("travelWebsite")) + " ↗</a><br>" : "") +
      "<div class='pop-actions'><button class='primary guest-req' data-club='" + esc(p.club_id) + "' data-name='" + esc(p.club_name) + "'>🙋 " + esc(t("cpAsk")) + "</button></div>" +
      (withNav && p.lat != null ? App.navLink(p.lat, p.lon) : "") +
      "<p class='hint'>" + esc(t("cpHint")) + "</p></div>";
  }

  // Für den Reise-Spickzettel
  function forCountry(code) {
    return load().then(function (rows) { return rows.filter(function (p) { return (p.country || "").toUpperCase() === code; }); });
  }

  // ---------- Gast-Anfrage ----------
  function openRequest(clubId, name) {
    if (!Auth.account) {
      App.openSheet(t("cpAsk"), App.el("<div><p>" + esc(t("cpNeedAccount")) + "</p></div>"));
      return;
    }
    var today = new Date().toISOString().slice(0, 10);
    var body = App.el("<form class='editor'>" +
      "<p><b>" + esc(name) + "</b></p>" +
      "<div class='row two'><label>" + esc(t("cpFrom")) + "<input type='date' name='from' min='" + today + "'></label>" +
      "<label>" + esc(t("cpTo")) + "<input type='date' name='to' min='" + today + "'></label></div>" +
      "<label>" + esc(t("cpPeople")) + "<input type='number' name='people' min='1' max='50' value='1'></label>" +
      "<label>" + esc(t("cpMessage")) + "<textarea name='msg' rows='5' maxlength='2000' required placeholder='" + esc(t("cpMessageHint")) + "'></textarea></label>" +
      "<div class='row actions'><button class='primary'>" + esc(t("cpSend")) + "</button></div></form>");
    body.onsubmit = function (e) {
      e.preventDefault();
      var f = body.elements;
      db().from("guest_requests").insert({
        club_id: clubId, date_from: f["from"].value || null, date_to: f["to"].value || null,
        people: Math.max(1, Math.min(50, parseInt(f["people"].value, 10) || 1)), message: f["msg"].value.trim()
      }).then(check).then(function () { App.closeSheet(); App.toast(t("cpSent")); }).catch(fail);
    };
    App.openSheet("🙋 " + t("cpAsk"), body);
  }

  function statusLabel(s) { return t("cpStatus_" + s); }
  function dates(r) {
    if (!r.date_from && !r.date_to) return "";
    return (r.date_from || "…") + " – " + (r.date_to || "…");
  }

  // Eigene Anfragen (im Konto-Fenster)
  function openMine() {
    var body = App.el("<div class='admin'><div class='list'>" + esc(t("loading")) + "</div></div>");
    App.openSheet("📨 " + t("cpMine"), body);
    db().from("guest_requests").select("*, clubs(name)").eq("user_id", Auth.account.id).order("created_at", { ascending: false })
      .then(check).then(function (rows) {
        var list = body.querySelector(".list");
        if (!rows.length) { list.innerHTML = "<p class='hint'>" + esc(t("cpNoMine")) + "</p>"; return; }
        list.innerHTML = rows.map(function (r) {
          return "<div class='pop-sec'><b>" + esc(r.clubs ? r.clubs.name : "") + "</b> · <span class='verdict " +
            (r.status === "accepted" ? "open" : r.status === "declined" ? "closed" : "limited") + "'>" + esc(statusLabel(r.status)) + "</span>" +
            "<div class='hint'>" + esc(dates(r)) + " · " + esc(r.people) + " " + esc(t("cpPersons")) + "</div>" +
            "<p class='note-text'>" + multiline(r.message) + "</p>" +
            (r.reply ? "<p class='note-text'><b>↩ " + esc(t("cpReply")) + ":</b> " + multiline(r.reply) + "</p>" : "") +
            "<button class='danger' data-del='" + esc(r.id) + "'>" + esc(t("cpWithdraw")) + "</button></div>";
        }).join("");
      }).catch(fail);
    body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-del]");
      if (!b || !confirm(t("cpWithdraw") + "?")) return;
      db().from("guest_requests").delete().eq("id", b.dataset.del).then(check).then(openMine).catch(fail);
    });
  }

  // ---------- Verwaltung (Club-Admin) ----------
  function openEditor(club, back) {
    db().from("club_pages").select("*").eq("club_id", club.id).maybeSingle().then(check).then(function (p) {
      p = p || { club_id: club.id, published: false };
      function input(name, label, ph) {
        return "<label>" + esc(t(label)) + "<input name='" + name + "' value='" + esc(p[name]) + "'" + (ph ? " placeholder='" + esc(ph) + "'" : "") + "></label>";
      }
      function area(name, label, rows) {
        return "<label>" + esc(t(label)) + "<textarea name='" + name + "' rows='" + (rows || 3) + "'>" + esc(p[name]) + "</textarea></label>";
      }
      var body = App.el("<form class='editor'>" +
        "<p class='hint'>" + esc(t("cpEditorHint")) + "</p>" +
        "<label class='row'><input type='checkbox' name='published'" + (p.published ? " checked" : "") + "> " + esc(t("cpPublished")) + "</label>" +
        area("description", "cpDescription", 4) +
        input("place", "cpPlace", "Lake Havasu City, Arizona") +
        input("country", "cpCountry", "US") +
        "<p class='hint'>" + esc(t("cpLocation")) + ": <span class='loc'>" + (p.lat != null ? (+p.lat).toFixed(4) + ", " + (+p.lon).toFixed(4) : "–") + "</span> " +
          "<button type='button' data-a='here'>📍 " + esc(t("cpLocationHere")) + "</button></p>" +
        area("guests", "cpGuests") + input("guest_price", "cpPrice") + area("camping", "cpCamping") +
        area("events", "cpEvents") + area("rules", "cpRules") + area("bring", "cpBring") +
        input("languages", "cpLanguages", "English, Deutsch") + input("contact", "cpContact") + input("website", "travelWebsite", "https://…") +
        "<div class='row actions'><button type='button' data-a='back'>" + esc(t("back")) + "</button>" +
        "<button class='primary'>" + esc(t("save")) + "</button></div></form>");
      var lat = p.lat, lon = p.lon;
      body.querySelector("[data-a=here]").onclick = function () {
        var c = App.map.getCenter(); lat = c.lat; lon = c.lng;
        body.querySelector(".loc").textContent = lat.toFixed(4) + ", " + lon.toFixed(4);
      };
      body.querySelector("[data-a=back]").onclick = back;
      body.onsubmit = function (e) {
        e.preventDefault();
        var rec = { club_id: club.id, published: body.elements["published"].checked, lat: lat, lon: lon, updated_at: new Date().toISOString() };
        FIELDS.forEach(function (k) { var v = body.elements[k].value.trim(); rec[k] = v || null; });
        if (rec.country) rec.country = rec.country.toUpperCase().slice(0, 2);
        if (rec.published && (lat == null || lon == null)) { alert(t("cpNeedLocation")); return; }
        db().from("club_pages").upsert(rec).then(check).then(function () { App.toast(t("saved")); reload(); back(); }).catch(fail);
      };
      App.openSheet("🏕 " + t("cpEdit") + " · " + club.name, body);
    }).catch(fail);
  }

  function openInbox(club, back) {
    var body = App.el("<div class='admin'><div class='list'>" + esc(t("loading")) + "</div>" +
      "<div class='row actions'><button data-a='back'>" + esc(t("back")) + "</button></div></div>");
    App.openSheet("📨 " + t("cpInbox") + " · " + club.name, body);
    function loadList() {
      db().from("guest_requests").select("*").eq("club_id", club.id).order("created_at", { ascending: false }).then(check).then(function (rows) {
        var list = body.querySelector(".list");
        if (!rows.length) { list.innerHTML = "<p class='hint'>" + esc(t("cpNoInbox")) + "</p>"; return; }
        list.innerHTML = rows.map(function (r) {
          return "<div class='pop-sec' data-id='" + esc(r.id) + "'><b>" + esc(r.username) + "</b> · <span class='verdict " +
            (r.status === "accepted" ? "open" : r.status === "declined" ? "closed" : "limited") + "'>" + esc(statusLabel(r.status)) + "</span>" +
            "<div class='hint'>" + esc(dates(r)) + " · " + esc(r.people) + " " + esc(t("cpPersons")) + " · " + esc(String(r.created_at).slice(0, 10)) + "</div>" +
            "<p class='note-text'>" + multiline(r.message) + "</p>" +
            "<label>" + esc(t("cpReply")) + "<textarea rows='2' class='reply'>" + esc(r.reply) + "</textarea></label>" +
            "<div class='row'><button data-s='accepted'>✅ " + esc(t("cpAccept")) + "</button>" +
            "<button data-s='declined'>✖ " + esc(t("cpDecline")) + "</button>" +
            "<button class='danger' data-s='delete'>🗑</button></div></div>";
        }).join("");
      }).catch(fail);
    }
    body.addEventListener("click", function (e) {
      if (e.target.closest("[data-a=back]")) { back(); return; }
      var b = e.target.closest("[data-s]");
      if (!b) return;
      var box = b.closest("[data-id]"), id = box.dataset.id;
      if (b.dataset.s === "delete") {
        if (confirm(t("cpDelete") + "?")) db().from("guest_requests").delete().eq("id", id).then(check).then(loadList).catch(fail);
        return;
      }
      db().from("guest_requests").update({ status: b.dataset.s, reply: box.querySelector(".reply").value.trim() || null }).eq("id", id)
        .then(check).then(function () { App.toast(t("saved")); loadList(); }).catch(fail);
    });
    loadList();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".guest-req");
    if (!b) return;
    e.preventDefault();
    if (App.map) App.map.closePopup();
    openRequest(b.dataset.club, b.dataset.name);
  });

  return { layer: layer, load: load, reload: reload, forCountry: forCountry, pageHtml: pageHtml,
           openRequest: openRequest, openMine: openMine, openEditor: openEditor, openInbox: openInbox };
})();

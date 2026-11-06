/*
 * Verwaltung für Superadmin und Club-Admins:
 * Clubs, Einladungscodes (mit QR), Mitglieder, Club-Claim-Dateien, alle Benutzer.
 */
var Admin = (function () {
  var t, esc;
  var state = { clubId: null, clubs: [] };   // clubId "" = Codes für Privatpersonen

  function db() { return Auth.client; }
  function acc() { return Auth.account; }
  function check(res) { if (res.error) throw res.error; return res.data; }
  function fail(err) { alert(t("error") + ": " + (err.message || err)); }

  // Gut lesbare Codes (ohne 0/O, 1/I)
  function randomCode(prefix) {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "";
    var bytes = crypto.getRandomValues(new Uint8Array(6));
    for (var i = 0; i < 6; i++) out += chars[bytes[i] % chars.length];
    return prefix + "-" + out;
  }
  function prefixFor(club) {
    if (!club) return "PRIV";
    var p = club.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return p.length >= 2 ? p : "CLUB";
  }
  function inviteLink(code) {
    return Auth.appUrl() + "#invite=" + encodeURIComponent(code);
  }

  function loadClubs() {
    var q = db().from("clubs").select("*").order("name");
    if (!acc().is_superadmin) {
      var ids = acc().clubs.filter(function (c) { return c.role === "admin"; }).map(function (c) { return c.id; });
      q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
    return q.then(check).then(function (rows) { state.clubs = rows; return rows; });
  }

  function open() {
    t = App.t; esc = App.esc;
    loadClubs().then(function () {
      if (state.clubId === null || (state.clubId && !state.clubs.some(function (c) { return c.id === state.clubId; }))) {
        state.clubId = state.clubs.length ? state.clubs[0].id : (acc().is_superadmin ? "" : null);
      }
      render();
    }).catch(fail);
  }

  function currentClub() {
    return state.clubs.filter(function (c) { return c.id === state.clubId; })[0] || null;
  }

  function render() {
    var su = acc().is_superadmin;
    var opts = state.clubs.map(function (c) {
      return "<option value='" + esc(c.id) + "'" + (c.id === state.clubId ? " selected" : "") + ">" + esc(c.name) + "</option>";
    }).join("");
    if (su) opts += "<option value=''" + (state.clubId === "" ? " selected" : "") + ">— " + esc(t("privateCodes")) + " —</option>";

    var club = currentClub();
    var body = App.el(
      "<div class='admin'>" +
      "<div class='row'><select class='club-select'>" + opts + "</select>" +
      (su ? "<button data-a='newclub'>＋ " + esc(t("newClub")) + "</button>" : "") + "</div>" +
      (club ? "<section><h4>" + esc(t("club")) + "</h4>" +
        "<form class='row clubform'><input name='name' value='" + esc(club.name) + "'><button>" + esc(t("save")) + "</button></form>" +
        "<button data-a='start'>📍 " + esc(t("startHere")) + "</button>" +
        (su ? " <button class='danger' data-a='delclub'>" + esc(t("deleteClub")) + "</button>" : "") + "</section>" : "") +
      "<section class='codes'><h4>" + esc(t("codes")) + "</h4><div class='list'>" + esc(t("loading")) + "</div>" + codeForm(club) + "</section>" +
      (club ? "<section class='members'><h4>" + esc(t("members")) + "</h4><div class='list'>" + esc(t("loading")) + "</div></section>" +
        "<section class='files'><h4>" + esc(t("claimFiles")) + "</h4><div class='list'>" + esc(t("loading")) + "</div>" +
        "<label class='btn-like'>⬆ " + esc(t("uploadClaims")) + "<input type='file' accept='.kml,.geojson,.json' hidden></label></section>" : "") +
      (su ? "<section class='users'><h4>" + esc(t("users")) + "</h4><button data-a='users'>" + esc(t("users")) + " …</button><div class='list'></div></section>" : "") +
      "</div>");

    body.querySelector(".club-select").onchange = function (e) { state.clubId = e.target.value; render(); };
    var cf = body.querySelector(".clubform");
    if (cf) cf.onsubmit = function (e) {
      e.preventDefault();
      db().from("clubs").update({ name: cf.elements["name"].value.trim() }).eq("id", club.id).then(check)
        .then(function () { App.toast(t("saved")); open(); }).catch(fail);
    };
    var codeF = body.querySelector(".codeform");
    codeF.elements["kind"].onchange = function () {
      codeF.elements["max"].value = codeF.elements["kind"].value === "single" ? 1 : 30;
      codeF.elements["max"].disabled = codeF.elements["kind"].value === "single";
    };
    codeF.onsubmit = function (e) { e.preventDefault(); createCode(codeF, club); };

    var up = body.querySelector(".files input[type=file]");
    if (up) up.onchange = function (e) { uploadFile(e.target.files[0], club); e.target.value = ""; };

    body.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]");
      if (!b) return;
      var a = b.dataset.a;
      if (a === "newclub") newClub();
      if (a === "delclub" && confirm(t("confirmDeleteClub"))) {
        db().from("clubs").delete().eq("id", club.id).then(check).then(function () { state.clubId = null; open(); }).catch(fail);
      }
      if (a === "start") {
        var c = App.map.getCenter();
        db().from("clubs").update({ start_lat: c.lat, start_lon: c.lng, start_zoom: App.map.getZoom() }).eq("id", club.id)
          .then(check).then(function () { App.toast(t("startSaved")); }).catch(fail);
      }
      if (a === "users") loadUsers(body.querySelector(".users .list"));
    });

    App.openSheet(t("admin"), body);
    loadCodes(body.querySelector(".codes .list"));
    if (club) {
      loadMembers(body.querySelector(".members .list"), club);
      loadFiles(body.querySelector(".files .list"), club);
    }
  }

  function newClub() {
    var name = prompt(t("clubName"));
    if (!name || !name.trim()) return;
    db().from("clubs").insert({ name: name.trim() }).select().then(check).then(function (rows) {
      state.clubId = rows[0].id;
      open();
    }).catch(fail);
  }

  // ---------- Codes ----------

  function codeForm(club) {
    return "<form class='codeform'><h5>" + esc(t("newCode")) + "</h5>" +
      "<label>" + esc(t("codeType")) + "<select name='kind'><option value='single'>" + esc(t("codeSingle")) + "</option>" +
        "<option value='multi'>" + esc(t("codeMulti")) + "</option></select></label>" +
      "<label>" + esc(t("maxUses")) + "<input name='max' type='number' min='1' max='10000' value='1' disabled></label>" +
      (club ? "<label>" + esc(t("roleForCode")) + "<select name='role'><option value='member'>" + esc(t("role_member")) + "</option>" +
        "<option value='admin'>" + esc(t("role_admin")) + "</option></select></label>" : "") +
      "<label>" + esc(t("validUntil")) + "<input name='until' type='date'></label>" +
      "<label>" + esc(t("note")) + "<input name='note' placeholder='z. B. Name der Person'></label>" +
      "<button class='primary'>" + esc(t("createCode")) + "</button></form>";
  }

  function createCode(form, club) {
    var f = form.elements;
    var row = {
      code: randomCode(prefixFor(club)),
      club_id: club ? club.id : null,
      role: f["role"] ? f["role"].value : "member",
      max_uses: f["kind"].value === "single" ? 1 : Math.max(1, parseInt(f["max"].value, 10) || 1),
      expires_at: f["until"].value ? new Date(f["until"].value + "T23:59:59").toISOString() : null,
      note: f["note"].value.trim() || null,
      created_by: acc().id
    };
    db().from("invite_codes").insert(row).then(check).then(function () {
      showQr(row.code);
    }).catch(fail);
  }

  function loadCodes(box) {
    var q = db().from("invite_codes").select("*").order("created_at", { ascending: false });
    q = state.clubId ? q.eq("club_id", state.clubId) : q.is("club_id", null);
    q.then(check).then(function (rows) {
      if (!rows.length) { box.innerHTML = "<p class='hint'>–</p>"; return; }
      box.innerHTML = rows.map(function (c) {
        var exp = c.expires_at ? " · " + t("expires") + " " + c.expires_at.slice(0, 10) : "";
        var off = !c.active || c.uses >= c.max_uses || (c.expires_at && c.expires_at < new Date().toISOString());
        return "<div class='arow" + (off ? " off" : "") + "'><div><b class='mono'>" + esc(c.code) + "</b>" +
          (c.role === "admin" ? " <span class='tag'>" + esc(t("role_admin")) + "</span>" : "") +
          "<small>" + c.uses + "/" + c.max_uses + " " + esc(t("used")) + exp + (c.active ? "" : " · " + esc(t("inactive"))) +
          (c.note ? " · " + esc(c.note) : "") + "</small></div>" +
          "<div class='abtn'><button data-qr='" + esc(c.code) + "'>" + esc(t("showQr")) + "</button>" +
          "<button data-toggle='" + esc(c.code) + "' data-on='" + (c.active ? 1 : 0) + "'>" + esc(c.active ? t("deactivate") : t("activate")) + "</button></div></div>";
      }).join("");
      box.onclick = function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.qr) showQr(b.dataset.qr);
        if (b.dataset.toggle) {
          db().from("invite_codes").update({ active: b.dataset.on !== "1" }).eq("code", b.dataset.toggle)
            .then(check).then(function () { loadCodes(box); }).catch(fail);
        }
      };
    }).catch(function (err) { box.textContent = t("error") + ": " + err.message; });
  }

  function showQr(code) {
    var link = inviteLink(code);
    var qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();
    var img = qr.createDataURL(8, 16);
    var body = App.el(
      "<div class='qr'><button data-a='back'>← " + esc(t("back")) + "</button>" +
      "<p class='mono big'>" + esc(code) + "</p>" +
      "<img src='" + img + "' alt='QR'>" +
      "<p class='hint link'>" + esc(link) + "</p>" +
      "<div class='row'><button data-a='copy'>" + esc(t("copyLink")) + "</button>" +
      (navigator.share ? "<button data-a='share'>" + esc(t("share")) + "</button>" : "") +
      "<a class='btn-like' download='invite-" + esc(code) + ".gif' href='" + img + "'>" + esc(t("saveQr")) + "</a></div></div>");
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]");
      if (!b) return;
      if (b.dataset.a === "back") render();
      if (b.dataset.a === "copy") {
        navigator.clipboard.writeText(link).then(function () { App.toast(t("copied")); }, function () { prompt("", link); });
      }
      if (b.dataset.a === "share") navigator.share({ title: APP_CONFIG.clubName, text: t("inviteCode") + ": " + code, url: link }).catch(function () {});
    });
    App.openSheet(t("inviteCode"), body);
  }

  // ---------- Mitglieder ----------

  function loadMembers(box, club) {
    db().rpc("club_members", { p_club: club.id }).then(check).then(function (rows) {
      if (!rows.length) { box.innerHTML = "<p class='hint'>–</p>"; return; }
      box.innerHTML = rows.map(function (m) {
        var me = m.user_id === acc().id;
        return "<div class='arow" + (m.disabled ? " off" : "") + "'><div><b>" + esc(m.username) + "</b>" +
          "<small>" + esc(t("role_" + m.role)) + " · " + esc(String(m.joined).slice(0, 10)) + "</small></div>" +
          (me ? "" : "<div class='abtn'><button data-role='" + esc(m.user_id) + "' data-to='" + (m.role === "admin" ? "member" : "admin") + "'>" +
            esc(m.role === "admin" ? t("makeMember") : t("makeAdmin")) + "</button>" +
            "<button class='danger' data-remove='" + esc(m.user_id) + "'>" + esc(t("removeMember")) + "</button></div>") + "</div>";
      }).join("");
      box.onclick = function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.role) {
          db().from("memberships").update({ role: b.dataset.to }).eq("user_id", b.dataset.role).eq("club_id", club.id)
            .then(check).then(function () { loadMembers(box, club); }).catch(fail);
        }
        if (b.dataset.remove && confirm(t("confirmRemove"))) {
          db().from("memberships").delete().eq("user_id", b.dataset.remove).eq("club_id", club.id)
            .then(check).then(function () { loadMembers(box, club); }).catch(fail);
        }
      };
    }).catch(function (err) { box.textContent = t("error") + ": " + err.message; });
  }

  // ---------- Club-Claim-Dateien ----------

  function loadFiles(box, club) {
    db().from("club_files").select("id, name, created_at, geojson").eq("club_id", club.id).order("created_at")
      .then(check).then(function (rows) {
        if (!rows.length) { box.innerHTML = "<p class='hint'>–</p>"; return; }
        box.innerHTML = rows.map(function (f) {
          var n = (f.geojson && f.geojson.features) ? f.geojson.features.length : 0;
          return "<div class='arow'><div><b>" + esc(f.name) + "</b><small>" + n + " " + esc(t("features")) + " · " + esc(f.created_at.slice(0, 10)) + "</small></div>" +
            "<div class='abtn'><button class='danger' data-del='" + esc(f.id) + "'>" + esc(t("delete")) + "</button></div></div>";
        }).join("");
        box.onclick = function (e) {
          var b = e.target.closest("button[data-del]");
          if (!b || !confirm(t("confirmDeleteFile"))) return;
          db().from("club_files").delete().eq("id", b.dataset.del).then(check)
            .then(function () { loadFiles(box, club); }).catch(fail);
        };
      }).catch(function (err) { box.textContent = t("error") + ": " + err.message; });
  }

  function uploadFile(file, club) {
    if (!file) return;
    file.text().then(function (txt) {
      var gj = /\.kml$/i.test(file.name) ? Formats.kmlToGeoJSON(txt) : JSON.parse(txt);
      if (!gj || !gj.features || !gj.features.length) throw new Error("0 " + t("features"));
      return db().from("club_files").insert({ club_id: club.id, name: file.name, geojson: gj, uploaded_by: acc().id }).then(check)
        .then(function () { App.toast(t("saved") + ": " + gj.features.length + " " + t("features")); render(); });
    }).catch(fail);
  }

  // ---------- Alle Benutzer (nur Superadmin) ----------

  function loadUsers(box) {
    db().from("profiles").select("id, username, is_superadmin, disabled, created_at").order("username").then(check).then(function (rows) {
      box.innerHTML = rows.map(function (u) {
        return "<div class='arow" + (u.disabled ? " off" : "") + "'><div><b>" + esc(u.username) + "</b><small>" +
          (u.is_superadmin ? esc(t("superadmin")) + " · " : "") + esc(u.created_at.slice(0, 10)) + "</small></div>" +
          (u.id === acc().id ? "" : "<div class='abtn'><button data-user='" + esc(u.id) + "' data-dis='" + (u.disabled ? 0 : 1) + "'>" +
            esc(u.disabled ? t("enable") : t("disable")) + "</button></div>") + "</div>";
      }).join("");
      box.onclick = function (e) {
        var b = e.target.closest("button[data-user]");
        if (!b) return;
        db().from("profiles").update({ disabled: b.dataset.dis === "1" }).eq("id", b.dataset.user)
          .then(check).then(function () { loadUsers(box); }).catch(fail);
      };
    }).catch(function (err) { box.textContent = t("error") + ": " + err.message; });
  }

  return { open: open };
})();

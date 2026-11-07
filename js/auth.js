/*
 * Login, Registrierung mit Einladungscode, Passwort vergessen, Konto.
 * Läuft nur, wenn in config.js unter "server" Supabase eingetragen ist.
 */
var Auth = (function () {
  var C = APP_CONFIG;
  var client = null;
  var account = null;        // { id, username, is_superadmin, clubs: [{id, name, role, …}] }
  var ACCOUNT_KEY = "account";

  function enabled() {
    return !!(C.server && C.server.supabaseUrl && C.server.supabaseAnonKey);
  }

  function appUrl() {
    return (C.server && C.server.publicUrl) || (location.origin + location.pathname);
  }

  function inviteFromUrl() {
    var m = location.hash.match(/invite=([A-Za-z0-9-]+)/);
    return m ? m[1].toUpperCase() : null;
  }
  function clearInviteFromUrl() {
    if (/invite=/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }

  // Konto vom Server laden; ohne Netz das zuletzt gespeicherte verwenden
  function loadAccount() {
    return client.rpc("my_account").then(function (res) {
      if (res.error) throw res.error;
      if (!res.data) throw new Error("no profile");
      account = res.data;
      App.setPref(ACCOUNT_KEY, account);
      return account;
    }).catch(function (err) {
      var cached = App.pref(ACCOUNT_KEY, null);
      if (cached && isNetworkError(err)) { account = cached; return account; }
      throw err;
    });
  }

  function isNetworkError(err) {
    var msg = String((err && (err.message || err.name)) || err);
    return !navigator.onLine || /fetch|network|Load failed|timeout/i.test(msg);
  }

  function init() {
    if (!enabled()) return Promise.resolve(null);
    client = supabase.createClient(C.server.supabaseUrl, C.server.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    return new Promise(function (resolve) {
      var recovering = /type=recovery/.test(location.hash);
      client.auth.onAuthStateChange(function (event) {
        if (event === "PASSWORD_RECOVERY") { recovering = true; showGate("newpw", null, resolve); }
      });

      client.auth.getSession().then(function (res) {
        if (recovering) return;
        var session = res.data && res.data.session;
        var cached = App.pref(ACCOUNT_KEY, null);
        var invite = inviteFromUrl();

        if (!session) {
          // Kein Netz, aber früher angemeldet: weiterarbeiten
          if (cached && (res.error || !navigator.onLine)) { account = cached; App.toast(App.t("offlineLogin")); resolve(account); return; }
          showGate(invite ? "register" : "login", invite, resolve);
          return;
        }
        loadAccount().then(function (acc) {
          if (acc.disabled) { alert(App.t("accountDisabled")); logout(); return; }
          if (invite) offerRedeem(invite);
          resolve(acc);
        }).catch(function () {
          // Session vorhanden, aber kein Profil: neu anmelden
          client.auth.signOut().finally(function () { showGate("login", invite, resolve); });
        });
      });
    });
  }

  // Angemeldeter Benutzer öffnet einen Einladungslink
  function offerRedeem(code) {
    clearInviteFromUrl();
    if (!confirm(App.t("redeem") + ": " + code + "?")) return;
    redeem(code);
  }

  function redeem(code) {
    return client.rpc("redeem_code", { p_code: code.trim().toUpperCase() }).then(function (res) {
      if (res.error) { alert(App.t("codeInvalid")); return; }
      return clearClubCache().then(loadAccount).then(function () {
        App.toast(App.t("redeemOk"));
        setTimeout(function () { location.reload(); }, 800);
      });
    });
  }

  function logout() {
    var done = function () {
      try { localStorage.removeItem("gc." + ACCOUNT_KEY); } catch (e) {}
      clearClubCache().finally(function () { location.href = location.pathname; });
    };
    client.auth.signOut().then(done, done);
  }

  // ---------- Club-Claims vom Server (mit Zwischenspeicher für offline) ----------

  function clubFiles() {
    if (!account || !account.clubs.length) return Promise.resolve([]);
    var names = {};
    account.clubs.forEach(function (c) { names[c.id] = c.name; });
    return client.from("club_files").select("id, club_id, name, geojson")
      .in("club_id", account.clubs.map(function (c) { return c.id; }))
      .then(function (res) {
        if (res.error) throw res.error;
        var files = res.data.map(function (f) { return { clubId: f.club_id, club: names[f.club_id], name: f.name, geojson: f.geojson }; });
        Store.setKV("clubFiles", files);
        return files;
      })
      .catch(function () {
        return Store.getKV("clubFiles").then(function (f) { return f || []; });
      });
  }

  function clearClubCache() {
    return Store.clearKV().catch(function () {});
  }

  // ---------- Anmeldebildschirm ----------

  var gateResolve = null;

  function showGate(mode, invite, resolve) {
    if (resolve) gateResolve = resolve;
    var t = App.t, esc = App.esc;
    var gate = document.getElementById("gate");
    gate.classList.add("open");
    var box = gate.querySelector(".gate-box");
    var html = "<h1>" + esc(C.clubName) + "</h1>";

    if (mode === "login") {
      html += "<form data-f='login'>" +
        "<label>" + esc(t("userOrEmail")) + "<input name='user' autocomplete='username' autocapitalize='none' required></label>" +
        "<label>" + esc(t("password")) + "<input name='pw' type='password' autocomplete='current-password' required></label>" +
        "<p class='msg'></p>" +
        "<button class='primary wide'>" + esc(t("login")) + "</button></form>" +
        "<div class='gate-links'><a href='#' data-go='register'>" + esc(t("haveCode")) + "</a>" +
        "<a href='#' data-go='forgot'>" + esc(t("forgot")) + "</a></div>";
    } else if (mode === "register") {
      html += "<form data-f='register'>" +
        "<label>" + esc(t("inviteCode")) + "<input name='code' value='" + esc(invite || "") + "' autocapitalize='characters' autocomplete='off' required></label>" +
        "<p class='code-info hint'></p>" +
        "<label>" + esc(t("username")) + "<input name='user' autocomplete='username' autocapitalize='none' pattern='[A-Za-z0-9_.\\-]{3,30}' required>" +
          "<small>" + esc(t("usernameRule")) + "</small></label>" +
        "<label>" + esc(t("email")) + "<input name='email' type='email' autocomplete='email' required></label>" +
        "<label>" + esc(t("password")) + "<input name='pw' type='password' autocomplete='new-password' minlength='8' required>" +
          "<small>" + esc(t("passwordRule")) + "</small></label>" +
        "<label>" + esc(t("password2")) + "<input name='pw2' type='password' autocomplete='new-password' minlength='8' required></label>" +
        "<p class='msg'></p>" +
        "<button class='primary wide'>" + esc(t("register")) + "</button></form>" +
        "<div class='gate-links'><a href='#' data-go='login'>" + esc(t("haveAccount")) + "</a></div>";
    } else if (mode === "forgot") {
      html += "<form data-f='forgot'>" +
        "<label>" + esc(t("email")) + "<input name='email' type='email' autocomplete='email' required></label>" +
        "<p class='msg'></p>" +
        "<button class='primary wide'>" + esc(t("sendReset")) + "</button></form>" +
        "<div class='gate-links'><a href='#' data-go='login'>" + esc(t("backToLogin")) + "</a></div>";
    } else if (mode === "newpw") {
      html += "<form data-f='newpw'>" +
        "<label>" + esc(t("newPassword")) + "<input name='pw' type='password' autocomplete='new-password' minlength='8' required>" +
          "<small>" + esc(t("passwordRule")) + "</small></label>" +
        "<p class='msg'></p>" +
        "<button class='primary wide'>" + esc(t("setPassword")) + "</button></form>";
    }
    html += "<div class='gate-lang'><a href='#' data-lang='en'>English</a> · <a href='#' data-lang='de'>Deutsch</a></div>";
    box.innerHTML = html;

    box.onclick = function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();
      if (a.dataset.go) showGate(a.dataset.go, invite);
      if (a.dataset.lang) { App.setPref("lang", a.dataset.lang); location.reload(); }
    };

    var form = box.querySelector("form");
    var msg = form.querySelector(".msg");
    function say(text, ok) { msg.textContent = text; msg.className = "msg" + (ok ? " ok" : ""); }
    function busy(on) { form.querySelector("button").disabled = on; }

    if (mode === "register") {
      var codeInput = form.elements["code"], info = form.querySelector(".code-info");
      var check = function () {
        var code = codeInput.value.trim().toUpperCase();
        codeInput.value = code;
        if (code.length < 4) { info.textContent = ""; return; }
        client.rpc("check_invite", { p_code: code }).then(function (res) {
          var d = res.data || {};
          info.textContent = d.valid ? "✓ " + t("codeValid") + " · " + (d.club ? t("codeClub") + ": " + d.club : t("codePrivate")) : "✕ " + t("codeInvalid");
          info.className = "code-info hint " + (d.valid ? "ok" : "bad");
        });
      };
      codeInput.addEventListener("change", check);
      if (invite) check();
    }

    form.onsubmit = function (e) {
      e.preventDefault();
      var f = form.elements;
      say("");
      busy(true);
      var done = function () { busy(false); };

      if (mode === "login") {
        signIn(f["user"].value.trim(), f["pw"].value).then(finish).catch(function (err) { say(err.message); }).then(done);
      }

      if (mode === "register") {
        var code = f["code"].value.trim().toUpperCase(), user = f["user"].value.trim();
        if (f["pw"].value !== f["pw2"].value) { say(t("passwordMismatch")); done(); return; }
        client.rpc("check_invite", { p_code: code }).then(function (res) {
          if (!res.data || !res.data.valid) throw new Error(t("codeInvalid"));
          return client.rpc("username_available", { p_username: user });
        }).then(function (res) {
          if (res.data === false) throw new Error(t("usernameTaken"));
          return client.auth.signUp({
            email: f["email"].value.trim(),
            password: f["pw"].value,
            options: { data: { username: user, invite_code: code }, emailRedirectTo: appUrl() }
          });
        }).then(function (res) {
          if (res.error) throw new Error(/database error/i.test(res.error.message) ? t("codeInvalid") + " / " + t("usernameTaken") : res.error.message);
          clearInviteFromUrl();
          if (!res.data.session) { say(t("checkEmail"), true); return; }
          return loadAccount().then(finish);
        }).catch(function (err) { say(err.message); }).then(done);
      }

      if (mode === "forgot") {
        client.auth.resetPasswordForEmail(f["email"].value.trim(), { redirectTo: appUrl() })
          .then(function (res) { if (res.error) throw res.error; say(t("resetSent"), true); })
          .catch(function (err) { say(err.message); }).then(done);
      }

      if (mode === "newpw") {
        client.auth.updateUser({ password: f["pw"].value }).then(function (res) {
          if (res.error) throw res.error;
          history.replaceState(null, "", location.pathname);
          App.toast(t("passwordChanged"));
          return loadAccount().then(finish);
        }).catch(function (err) { say(err.message); }).then(done);
      }
    };
  }

  // Anmelden mit Benutzername (oder E-Mail) und Passwort
  function signIn(user, pw) {
    var t = App.t;
    var emailP = user.indexOf("@") > 0 ? Promise.resolve(user) :
      client.rpc("login_email", { p_username: user, p_password: pw }).then(function (res) {
        if (res.error) throw new Error(/TOO_MANY/.test(res.error.message) ? t("tooManyAttempts") : res.error.message);
        if (!res.data) throw new Error(t("wrongLogin"));
        return res.data;
      });
    return emailP.then(function (email) {
      return client.auth.signInWithPassword({ email: email, password: pw });
    }).then(function (res) {
      if (res.error) throw new Error(/invalid/i.test(res.error.message) ? t("wrongLogin") : res.error.message);
      return loadAccount();
    });
  }

  function finish(acc) {
    if (!acc) return;
    if (acc.disabled) { alert(App.t("accountDisabled")); logout(); return; }
    document.getElementById("gate").classList.remove("open");
    var invite = inviteFromUrl();
    if (invite) clearInviteFromUrl();
    if (gateResolve) { var r = gateResolve; gateResolve = null; r(acc); }
    else location.reload();
  }

  // ---------- Konto-Fenster ----------

  function openAccount() {
    var t = App.t, esc = App.esc;
    var clubs = account.clubs.length ? account.clubs.map(function (c) {
      return "<li>" + esc(c.name) + " <small>(" + esc(t("role_" + c.role)) + ")</small></li>";
    }).join("") : "<li class='hint'>" + esc(t("noClubs")) + "</li>";
    var isAdmin = account.is_superadmin || account.clubs.some(function (c) { return c.role === "admin"; });
    var body = App.el(
      "<div class='menu'>" +
      "<p><b>" + esc(account.username) + "</b>" + (account.is_superadmin ? " · " + esc(t("superadmin")) : "") + "</p>" +
      "<h4>" + esc(t("myClubs")) + "</h4><ul>" + clubs + "</ul>" +
      "<form class='row redeem'><input name='code' placeholder='" + esc(t("inviteCode")) + "' autocapitalize='characters' required>" +
        "<button>" + esc(t("redeem")) + "</button></form>" +
      (isAdmin ? "<button data-a='admin' class='primary'>" + esc(t("admin")) + "</button>" : "") +
      "<button data-a='logout'>" + esc(t("logout")) + "</button></div>");
    body.querySelector(".redeem").onsubmit = function (e) {
      e.preventDefault();
      redeem(e.target.elements["code"].value);
    };
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]");
      if (!b) return;
      if (b.dataset.a === "logout") logout();
      if (b.dataset.a === "admin") Admin.open();
    });
    App.openSheet(t("account"), body);
  }

  return {
    enabled: enabled, init: init, clubFiles: clubFiles, openAccount: openAccount, appUrl: appUrl,
    get client() { return client; }, get account() { return account; },
    reloadAccount: loadAccount
  };
})();

/*
 * Club-Chat: Nachrichten pro Club (Tabelle club_messages). Neue Nachrichten erscheinen sofort
 * bei allen, die die App offen haben (Supabase Realtime). Nur Mitglieder des Clubs sehen und schreiben.
 */
var Chat = (function () {
  var channel = null;
  var openClub = null;       // Club, dessen Chat gerade offen ist
  var listEl = null;

  var t = function (k) { return App.t(k); };
  var esc = function (s) { return App.esc(s); };

  function ready() { return window.Auth && Auth.enabled() && Auth.account && Auth.account.clubs.length; }
  function db() { return Auth.client; }
  function lastRead() { return App.pref("chatRead", {}); }
  function markRead(clubId) {
    var r = lastRead();
    r[clubId] = new Date().toISOString();
    App.setPref("chatRead", r);
    updateBadge();
  }
  function clubName(id) {
    var c = Auth.account.clubs.filter(function (x) { return x.id === id; })[0];
    return c ? c.name : "";
  }

  function msgHtml(m) {
    var mine = m.user_id === Auth.account.id;
    var d = new Date(m.created_at);
    return "<div class='msg" + (mine ? " mine" : "") + "'><div class='msg-head'><b>" + esc(m.username) + "</b> <small>" +
      esc(d.toLocaleDateString() + " " + d.toTimeString().slice(0, 5)) + "</small></div><div class='msg-body'>" + esc(m.body) + "</div></div>";
  }

  function load(clubId) {
    return db().from("club_messages").select("*").eq("club_id", clubId).order("created_at", { ascending: false }).limit(100)
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data.reverse();
      });
  }

  function render(rows) {
    if (!listEl) return;
    listEl.innerHTML = rows.length ? rows.map(msgHtml).join("") : "<p class='hint'>" + esc(t("chatEmpty")) + "</p>";
    listEl.scrollTop = listEl.scrollHeight;
  }

  function open(clubId) {
    if (!ready()) return;
    var clubs = Auth.account.clubs;
    clubId = clubId || (App.activeClub() !== "all" ? App.activeClub() : App.pref("chatClub", clubs[0].id));
    if (!clubs.some(function (c) { return c.id === clubId; })) clubId = clubs[0].id;
    openClub = clubId;
    App.setPref("chatClub", clubId);
    var body = App.el("<div class='chat'>" +
      (clubs.length > 1 ? "<select class='chat-club'>" + clubs.map(function (c) {
        return "<option value='" + esc(c.id) + "'" + (c.id === clubId ? " selected" : "") + ">" + esc(c.name) + "</option>";
      }).join("") + "</select>" : "") +
      "<div class='chat-list'><p class='hint'>" + esc(t("loading")) + "</p></div>" +
      "<form class='chat-form'><textarea rows='2' maxlength='2000' placeholder='" + esc(t("chatPlaceholder")) + "'></textarea>" +
      "<button class='primary'>" + esc(t("chatSend")) + "</button></form></div>");
    listEl = body.querySelector(".chat-list");
    var sel = body.querySelector(".chat-club");
    if (sel) sel.onchange = function () { open(sel.value); };
    var form = body.querySelector("form"), ta = form.querySelector("textarea");
    form.onsubmit = function (e) {
      e.preventDefault();
      var text = ta.value.trim();
      if (!text) return;
      ta.disabled = true;
      db().from("club_messages").insert({ club_id: clubId, user_id: Auth.account.id, username: Auth.account.username, body: text })
        .then(function (res) {
          ta.disabled = false;
          if (res.error) { App.toast(t("error") + ": " + res.error.message); return; }
          ta.value = "";
          ta.focus();
        });
    };
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) { e.preventDefault(); form.requestSubmit(); }
    });
    App.openSheet("💬 " + t("chat") + " · " + clubName(clubId), body);
    App.onSheetClose(function () { openClub = null; listEl = null; });
    load(clubId).then(function (rows) { render(rows); markRead(clubId); })
      .catch(function (err) { listEl.innerHTML = "<p class='hint'>" + esc(t("error") + ": " + err.message) + "</p>"; });
  }

  // neue Nachricht von irgendwem (Realtime)
  function onInsert(payload) {
    var m = payload.new;
    if (!m) return;
    if (openClub === m.club_id && listEl) {
      var hint = listEl.querySelector(".hint");
      if (hint) hint.remove();
      listEl.insertAdjacentHTML("beforeend", msgHtml(m));
      listEl.scrollTop = listEl.scrollHeight;
      markRead(m.club_id);
    } else if (m.user_id !== Auth.account.id) {
      App.toast("💬 " + clubName(m.club_id) + " · " + m.username + ": " + m.body.slice(0, 60));
      updateBadge();
    }
  }

  // ungelesene Nachrichten: roter Punkt am Menü-Knopf
  function updateBadge() {
    if (!ready()) return;
    var r = lastRead();
    var jobs = Auth.account.clubs.map(function (c) {
      var q = db().from("club_messages").select("id", { count: "exact", head: true }).eq("club_id", c.id).neq("user_id", Auth.account.id);
      if (r[c.id]) q = q.gt("created_at", r[c.id]);
      return q.then(function (res) { return res.count || 0; });
    });
    Promise.all(jobs).then(function (counts) {
      var n = counts.reduce(function (a, b) { return a + b; }, 0);
      document.body.classList.toggle("has-chat-news", n > 0);
    }).catch(function () {});
  }

  function init() {
    if (!ready()) return;
    // wer den Chat noch nie geöffnet hat: alte Nachrichten gelten als gelesen
    var r = lastRead(), changed = false;
    Auth.account.clubs.forEach(function (c) { if (!r[c.id]) { r[c.id] = new Date().toISOString(); changed = true; } });
    if (changed) App.setPref("chatRead", r);
    channel = db().channel("club-chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "club_messages" }, onInsert).subscribe();
    updateBadge();
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") updateBadge(); });
  }

  return { init: init, open: open };
})();

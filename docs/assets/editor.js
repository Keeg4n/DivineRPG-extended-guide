/*
 * In-place editor of the guide for admins.
 * Open any page with ?edit once - a pencil appears in the corner. The password decrypts (in the browser) a GitHub key that can only
 * write to the guide repository; with it a click on a paragraph, list item, heading or table cell opens its source text, and saving
 * commits the change to the page's markdown file. GitHub then rebuilds the site in about a minute.
 */
(function () {
  "use strict";

  var OWNER = "Keeg4n", REPO = "DivineRPG-extended-guide", BRANCH = "main";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO;
  var SCRIPT = document.currentScript ? document.currentScript.src : "";
  var ROOT = SCRIPT ? new URL("..", SCRIPT) : new URL("/", location.href);
  var KEY_URL = SCRIPT ? new URL("editor-key.json", SCRIPT).href : "";
  var LS_TOKEN = "guideEditorToken", LS_SEEN = "guideEditorSeen";
  var EDITABLE = "p, li, h1, h2, h3, h4, h5, h6, td, th, div.note, div.new, div.sub, div.ver";

  var token = load(LS_TOKEN), on = false, busy = false, open = null, ui = null;

  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  // ---------------- base64 / crypto ----------------
  function b64bytes(s) { var b = atob(s.replace(/\s/g, "")), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function b64text(s) { return new TextDecoder().decode(b64bytes(s)); }
  function textb64(s) {
    var a = new TextEncoder().encode(s), out = "";
    for (var i = 0; i < a.length; i += 0x8000) out += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
    return btoa(out);
  }

  function decrypt(password) {
    return fetch(KEY_URL, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("Ключ редактора не найден на сайте");
      return r.json();
    }).then(function (k) {
      var enc = new TextEncoder();
      return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]).then(function (base) {
        return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64bytes(k.salt), iterations: k.iter, hash: "SHA-256" }, base,
          { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      }).then(function (key) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64bytes(k.iv) }, key, b64bytes(k.ct));
      }).then(function (pt) { return new TextDecoder().decode(pt); });
    });
  }

  // ---------------- GitHub ----------------
  function gh(path, opts) {
    opts = opts || {};
    opts.headers = { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" };
    if (opts.body) opts.headers["Content-Type"] = "application/json";
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || ("GitHub " + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  }

  function getFile(src) {
    return gh("/contents/" + encodeURI("docs/" + src) + "?ref=" + BRANCH + "&t=" + Date.now(), { cache: "no-store" }).then(function (j) {
      return { text: b64text(j.content), sha: j.sha };
    });
  }

  function putFile(src, text, sha, what) {
    return gh("/contents/" + encodeURI("docs/" + src), {
      method: "PUT",
      body: JSON.stringify({ message: "Guide: " + what + " " + src, content: textb64(text), sha: sha, branch: BRANCH })
    });
  }

  // ---------------- page source ----------------
  function srcPath() {
    var tag = document.getElementById("guide-src");
    if (tag && tag.getAttribute("data-src")) return tag.getAttribute("data-src");
    var rel = decodeURIComponent(location.pathname).slice(decodeURIComponent(ROOT.pathname).length).replace(/index\.html$/, "").replace(/\/+$/, "");
    if (!rel) return "index.md";
    return rel.indexOf("/") < 0 ? rel + "/index.md" : rel + ".md";
  }

  function article() { return document.querySelector("article.md-content__inner"); }

  function editable(el) {
    if (!el || !el.matches || !el.matches(EDITABLE)) return false;
    if (el.tagName === "LI" && el.querySelector("ul, ol")) return false;
    if (el.closest(".ge-box")) return false;
    var a = article();
    return !!(a && a.contains(el));
  }

  /** The element's source text as it is written in the page (without the heading link). */
  function sourceOf(el) {
    var c = el.cloneNode(true);
    c.querySelectorAll(".headerlink").forEach(function (h) { h.remove(); });
    return c.innerHTML.trim();
  }

  /** Which equal-looking element on the page it is (0 - the first). */
  function sameBefore(el, html) {
    var n = 0, list = article().querySelectorAll(EDITABLE);
    for (var i = 0; i < list.length && list[i] !== el; i++) if (editable(list[i]) && sourceOf(list[i]) === html) n++;
    return n;
  }

  function nth(text, part, k) {
    var at = -1;
    for (var i = 0; i <= k; i++) { at = text.indexOf(part, at + 1); if (at < 0) return -1; }
    return at;
  }

  function plain(s) {
    return s.replace(/<[^>]+>/g, "").replace(/\{[^}]*\}\s*$/, "").replace(/[*_`]/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
  }

  /**
   * Where the element is in the markdown: {at, len} of its text. First the exact text (the k-th of equal ones), otherwise a line whose
   * text without markup is the same (a heading, a list item or a paragraph written in markdown).
   */
  function locate(md, el) {
    var html = sourceOf(el);
    if (html) {
      var at = nth(md, html, sameBefore(el, html));
      if (at < 0) at = md.indexOf(html);
      if (at >= 0) return { at: at, len: html.length };
    }
    var want = plain(el.textContent.replace(/¶/g, "")), pos = 0, lines = md.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i], m = /^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+)?)(.*?)(\s*\{[^}]*\})?\s*$/.exec(line);
      if (want && m && plain(m[2]) === want) return { at: pos + m[1].length, len: m[2].length };
      pos += line.length + 1;
    }
    return null;
  }

  // ---------------- UI ----------------
  function toast(msg, bad) {
    var t = document.createElement("div");
    t.className = "ge-toast" + (bad ? " ge-bad" : "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, bad ? 7000 : 4000);
  }

  function button(text, cls, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ge-btn " + (cls || "");
    b.textContent = text;
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
    return b;
  }

  function bar() {
    if (ui) ui.remove();
    if (!token && !load(LS_SEEN)) { ui = null; return; }
    ui = document.createElement("div");
    ui.className = "ge-bar";
    if (!token) {
      ui.appendChild(button("✎", "ge-pen", login));
    } else {
      ui.appendChild(button(on ? "Правка: вкл" : "Правка: выкл", on ? "ge-on" : "", function () { on = !on; apply(); bar(); }));
      ui.appendChild(button("Вся страница", "", pageEditor));
      ui.appendChild(button("Выйти", "", function () { token = null; save(LS_TOKEN, null); on = false; apply(); bar(); toast("Вы вышли из режима правки"); }));
    }
    document.body.appendChild(ui);
  }

  function apply() { document.body.classList.toggle("ge-admin", !!(token && on)); }

  function modal(build) {
    var back = document.createElement("div");
    back.className = "ge-modal";
    var box = document.createElement("div");
    box.className = "ge-dialog";
    back.appendChild(box);
    document.body.appendChild(back);
    var close = function () { back.remove(); };
    build(box, close);
    return close;
  }

  function login() {
    modal(function (box, close) {
      box.innerHTML = "<h3>Вход для правки гайда</h3><p>Вставьте пароль администратора.</p>";
      var input = document.createElement("input");
      input.type = "password";
      input.className = "ge-input";
      input.autocomplete = "current-password";
      box.appendChild(input);
      var row = document.createElement("div");
      row.className = "ge-row";
      var go = function () {
        if (busy) return;
        busy = true;
        decrypt(input.value.trim()).then(function (t) {
          token = t;
          return gh("");
        }).then(function (repo) {
          if (!repo.permissions || !repo.permissions.push) throw new Error("у ключа нет права записи");
          save(LS_TOKEN, token);
          on = true;
          close();
          apply();
          bar();
          toast("Режим правки включён: щёлкните по тексту, чтобы изменить его");
        }).catch(function (e) {
          token = null;
          toast(e && e.name === "OperationError" ? "Неверный пароль" : "Не удалось войти: " + (e.message || e), true);
        }).then(function () { busy = false; });
      };
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); if (e.key === "Escape") close(); });
      row.appendChild(button("Войти", "ge-primary", go));
      row.appendChild(button("Отмена", "", close));
      box.appendChild(row);
      setTimeout(function () { input.focus(); }, 0);
    });
  }

  function cancelOpen() {
    if (!open) return;
    open.el.innerHTML = open.html;
    open = null;
  }

  function edit(el) {
    if (busy) return;
    cancelOpen();
    var src = srcPath();
    busy = true;
    getFile(src).then(function (f) {
      busy = false;
      var spot = locate(f.text, el);
      if (!spot) {
        toast("Этот текст не нашёлся в исходнике страницы - откройте \"Вся страница\"", true);
        return;
      }
      var before = f.text.substr(spot.at, spot.len);
      open = { el: el, html: el.innerHTML };
      el.innerHTML = "";
      var box = document.createElement("div");
      box.className = "ge-box";
      var ta = document.createElement("textarea");
      ta.className = "ge-text";
      ta.value = before;
      box.appendChild(ta);
      var hint = document.createElement("div");
      hint.className = "ge-hint";
      hint.textContent = "Ctrl+Enter - сохранить, Esc - отмена. Жирный: <b>текст</b>, ссылка: <a href=\"...\">текст</a>.";
      box.appendChild(hint);
      var row = document.createElement("div");
      row.className = "ge-row";
      var commit = function () { store(el, src, before, ta.value, spot); };
      row.appendChild(button("Сохранить", "ge-primary", commit));
      row.appendChild(button("Отмена", "", cancelOpen));
      box.appendChild(row);
      el.appendChild(box);
      var fit = function () { ta.style.height = "auto"; ta.style.height = Math.max(60, ta.scrollHeight + 4) + "px"; };
      ta.addEventListener("input", fit);
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); }
        if (e.key === "Escape") { e.preventDefault(); cancelOpen(); }
      });
      fit();
      ta.focus();
    }).catch(function (e) {
      busy = false;
      toast("Не удалось открыть исходник: " + e.message, true);
    });
  }

  function store(el, src, before, after, spot) {
    if (busy) return;
    after = after.replace(/\s*\n\s*/g, el.tagName === "P" || el.tagName === "LI" || /^H\d$/.test(el.tagName) ? " " : "\n").trim();
    if (after === before.trim()) { cancelOpen(); return; }
    busy = true;
    var attempt = function (left) {
      return getFile(src).then(function (f) {
        var at = f.text.substr(spot.at, before.length) === before ? spot.at : f.text.indexOf(before);
        if (at < 0) throw new Error("текст на странице изменился, обновите страницу");
        var text = f.text.slice(0, at) + after + f.text.slice(at + before.length);
        return putFile(src, text, f.sha, "edit");
      }).catch(function (e) {
        if (left > 0 && (e.status === 409 || e.status === 422)) return attempt(left - 1);
        throw e;
      });
    };
    attempt(2).then(function () {
      open = null;
      el.innerHTML = after;
      el.classList.add("ge-saved");
      toast("Сохранено. Сайт обновится примерно через минуту.");
    }).catch(function (e) {
      toast("Не сохранилось: " + e.message, true);
    }).then(function () { busy = false; });
  }

  function pageEditor() {
    var src = srcPath();
    getFile(src).then(function (f) {
      modal(function (box, close) {
        box.classList.add("ge-wide");
        box.innerHTML = "<h3></h3>";
        box.querySelector("h3").textContent = "Вся страница: " + src;
        var ta = document.createElement("textarea");
        ta.className = "ge-text ge-page";
        ta.value = f.text;
        box.appendChild(ta);
        var row = document.createElement("div");
        row.className = "ge-row";
        row.appendChild(button("Сохранить", "ge-primary", function () {
          if (busy) return;
          if (ta.value === f.text) { close(); return; }
          busy = true;
          putFile(src, ta.value, f.sha, "edit page").then(function () {
            close();
            toast("Страница сохранена. Сайт обновится примерно через минуту.");
          }).catch(function (e) {
            toast(e.status === 409 ? "Страницу успели изменить - закройте и откройте заново" : "Не сохранилось: " + e.message, true);
          }).then(function () { busy = false; });
        }));
        row.appendChild(button("Отмена", "", close));
        box.appendChild(row);
      });
    }).catch(function (e) { toast("Не удалось открыть исходник: " + e.message, true); });
  }

  // ---------------- hooks ----------------
  document.addEventListener("click", function (e) {
    if (!token || !on || busy) return;
    if (e.target.closest(".ge-box, .ge-bar, .ge-modal")) return;
    var el = e.target.closest(EDITABLE);
    while (el && !editable(el)) el = el.parentElement ? el.parentElement.closest(EDITABLE) : null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    edit(el);
  }, true);

  function init() {
    open = null;
    if (/[?&]edit\b/.test(location.search) || location.hash === "#edit") save(LS_SEEN, "1");
    apply();
    bar();
  }

  window.guideEditorCheck = { locate: locate, sourceOf: sourceOf, editable: editable, selector: EDITABLE }; // for the self-check page

  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

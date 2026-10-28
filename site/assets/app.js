// Mon Zoomcamp : le moteur du site.
// Tout tourne dans le navigateur : les leçons sont lues dans le fork, la progression est gardée en localStorage.
(function () {
  "use strict";

  const C = window.COURSE;
  const doc = document;
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const app = $("#app");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- le repo ---------- */

  // Sur <user>.github.io/<repo>/site/, le repo se déduit de l'adresse. Sinon, celui de course.js.
  function detectRepo() {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    const seg = location.pathname.split("/").filter(Boolean)[0];
    if (m && seg && seg !== "site") return { owner: m[1], name: seg, branch: C.repo.branch };
    return C.repo;
  }
  const REPO = detectRepo();
  const ROOT = new URL("../", location.href.split("#")[0]).href; // racine du fork telle que servie
  const GH = `https://github.com/${REPO.owner}/${REPO.name}`;

  /* ---------- la progression ---------- */

  const KEY = "mzc.v1";
  function blank() { return { done: {}, les: {}, notes: {}, hw: {}, video: {}, maj: {}, doneAt: {} }; }
  function load() {
    try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return blank(); }
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; /* navigation privée */ } }
  let saveTimer = 0;
  // Ce que tu tapes est enregistré tout seul : un petit « Enregistré » le confirme.
  function saveSoon(quiet) { clearTimeout(saveTimer); saveTimer = setTimeout(() => { const ok = save(); if (!quiet || !ok) savedToast(ok); }, 400); }
  let toastTimer = 0;
  function savedToast(ok) {
    let t = $("#savetoast");
    if (!t) {
      t = doc.createElement("div");
      t.id = "savetoast";
      t.className = "savetoast";
      t.setAttribute("role", "status");
      doc.body.appendChild(t);
    }
    t.textContent = ok ? "✓ Enregistré" : "Ce navigateur refuse d'enregistrer (navigation privée ?)";
    t.classList.toggle("ko", !ok);
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), ok ? 1400 : 5000);
  }

  const ITEMS = [];
  C.modules.forEach(m => m.items.forEach(it => ITEMS.push(it)));
  const byId = id => ITEMS.find(i => i.id === id);
  const idx = id => ITEMS.findIndex(i => i.id === id);
  const modOf = it => C.modules.find(m => m.id === it.module);
  const isDone = id => !!S.done[id];
  // Tout est ouvert : l'ordre du cours est conseillé, jamais imposé.
  const current = () => ITEMS.find(i => !isDone(i.id)) || null;
  const doneCount = (list = ITEMS) => list.filter(i => isDone(i.id)).length;
  function markDone(id) {
    S.done[id] = true; S.doneAt[id] = Date.now(); save();
    const cur = current(), href = cur ? "#/l/" + cur.id : "#/progression";
    $("#continue").href = href; $("#nav-seance").href = href;
  }

  function modStatus(m) {
    if (!m.items.length) return "soon";
    const d = doneCount(m.items);
    if (d === m.items.length) return "done";
    return d ? "progress" : "open";
  }
  function itemNumber(it) {
    const mod = modOf(it);
    const lessons = mod.items.filter(x => x.type === "lesson");
    return { pos: lessons.indexOf(it) + 1, total: lessons.length };
  }
  // Le nom d'un module tel qu'on l'écrit dans une phrase.
  function modName(m) { return m.id === "P" ? "Projet final" : m.id === "W1" ? "Workshop" : m.bonus ? "Bonus" : "Module " + Number(m.id); }
  function itemLabel(it) {
    if (it.type === "homework") return "Homework";
    if (it.type === "defi") return "Défi";
    return "Leçon " + itemNumber(it).pos;
  }
  // Durée indicative : pour savoir si une étape tient dans ta séance.
  function fmtMin(min) {
    if (!min) return "";
    if (min < 60) return min + " min";
    const h = Math.floor(min / 60), m = min % 60;
    return h + " h" + (m ? " " + String(m).padStart(2, "0") : "");
  }
  const dur = it => it.min ? "environ " + fmtMin(it.min) : "";
  const remaining = list => list.filter(i => !isDone(i.id)).reduce((a, i) => a + (i.min || 0), 0);

  /* ---------- fichiers et markdown ---------- */

  const cache = {};
  // Aperçu en un seul fichier : les textes sont embarqués dans window.EMBED, par chemin depuis la racine du fork.
  const EMBED = window.EMBED || null;
  function embedded(url) {
    if (!EMBED) return null;
    const key = url.startsWith(ROOT) ? url.slice(ROOT.length) : "site/" + url.split("?")[0];
    return EMBED[key] != null ? EMBED[key] : null;
  }
  async function getText(url) {
    if (cache[url] != null) return cache[url];
    const e = embedded(url);
    if (e != null) return (cache[url] = e);
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status + " " + url);
    return (cache[url] = (await r.text()).replace(/\r\n/g, "\n"));
  }

  // Un fichier d'exercices : le texte avant le premier « @@ », puis des sections « @@ nom ».
  function parseOverlay(txt) {
    const parts = txt.split(/^@@ +([a-z0-9-]+)[ \t]*$/m);
    const out = { body: parts[0].trim() };
    for (let i = 1; i < parts.length; i += 2) out[parts[i]] = parts[i + 1].trim();
    return out;
  }
  function listItems(src) {
    if (!src) return [];
    const items = [];
    let cur = null;
    src.split("\n").forEach(l => {
      if (/^- /.test(l)) { if (cur !== null) items.push(cur); cur = l.slice(2); }
      else if (cur !== null && l.trim()) cur += " " + l.trim();
    });
    if (cur !== null) items.push(cur);
    return items;
  }
  function frontMatter(raw) {
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) return { body: raw, meta: {} };
    const meta = {};
    m[1].split("\n").forEach(l => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
    return { body: raw.slice(m[0].length), meta };
  }

  const LANG = { sh: "bash", shell: "bash", console: "bash", zsh: "bash", yml: "yaml", py: "python", docker: "dockerfile", hcl: "", terraform: "", text: "", txt: "", "": "" };
  marked.use({
    gfm: true,
    renderer: {
      code(code, info) {
        const lang = (info || "").trim().split(/\s+/)[0].toLowerCase();
        if (lang === "mermaid") return `<pre class="mermaid">${esc(code)}</pre>`;
        const use = lang in LANG ? LANG[lang] : lang;
        const html = use && hljs.getLanguage(use) ? hljs.highlight(code, { language: use, ignoreIllegals: true }).value : esc(code);
        return `<pre class="code"><code class="hljs">${html}</code></pre>`;
      }
    }
  });

  function mdHtml(src) { return DOMPurify.sanitize(marked.parse(src || ""), { ADD_ATTR: ["target"] }); }
  function mdInline(src) { return DOMPurify.sanitize(marked.parseInline(src || "")); }

  // Rend un texte markdown dans un conteneur, en réécrivant les liens et images relatifs.
  function renderMd(el, src, base, opts = {}) {
    el.innerHTML = mdHtml(src);
    if (opts.dropTitle) { const h1 = el.querySelector("h1"); if (h1 && h1 === el.firstElementChild) h1.remove(); }
    $$("img", el).forEach(img => {
      const s = img.getAttribute("src");
      if (s && base && !/^[a-z]+:/i.test(s)) {
        const abs = new URL(s, base).href;
        const e = abs.startsWith(ROOT) && window.EMBED_IMG && EMBED_IMG[abs.slice(ROOT.length)];
        img.src = e || abs;
      }
      img.loading = "lazy";
    });
    $$("a", el).forEach(a => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#")) { a.removeAttribute("href"); return; }
      if (!/^[a-z]+:/i.test(href) && base) {
        const abs = new URL(href, base).href.split("#")[0];
        if (abs.startsWith(ROOT)) {
          const path = decodeURIComponent(abs.slice(ROOT.length));
          const lesson = ITEMS.find(i => i.src === path);
          if (lesson) { a.href = "#/l/" + lesson.id; return; }
          a.href = `${GH}/${/\.[a-z]+$/i.test(path) ? "blob" : "tree"}/${REPO.branch}/${path}`;
        } else a.href = abs;
      }
      a.target = "_blank";
      a.rel = "noopener";
    });
    $$("table", el).forEach(t => { const w = doc.createElement("div"); w.className = "tablewrap"; t.replaceWith(w); w.appendChild(t); });
    return el;
  }

  let mermaidP = null;
  function loadMermaid() {
    if (!mermaidP) mermaidP = new Promise((res, rej) => {
      const s = doc.createElement("script");
      s.src = "vendor/mermaid.min.js";
      s.onload = () => {
        const dark = matchMedia("(prefers-color-scheme: dark)").matches;
        window.mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "neutral", securityLevel: "strict", fontFamily: "Geist, Arial, sans-serif" });
        res(window.mermaid);
      };
      s.onerror = rej;
      doc.head.appendChild(s);
    });
    return mermaidP;
  }
  async function renderMermaid(root) {
    const nodes = $$("pre.mermaid:not([data-processed])", root).filter(n => n.offsetParent !== null);
    if (!nodes.length) return;
    try { await (await loadMermaid()).run({ nodes }); }
    catch (e) { nodes.forEach(n => n.classList.add("mermaid-fail")); }
  }

  async function sha256(text) {
    if (!(window.crypto && crypto.subtle)) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /* ---------- icônes ---------- */

  function icon(name, color) {
    const i = typeof ICONS !== "undefined" && ICONS[name];
    if (!i) return "";
    if (i.img) return `<img src="${i.img}" alt="${name}">`;
    if (i.raw) return `<svg viewBox="${i.vb}" role="img" aria-label="${name}">${i.raw}</svg>`;
    return `<svg viewBox="${i.vb}" role="img" aria-label="${name}"><path fill="${color || "currentColor"}" d="${i.d}"/></svg>`;
  }

  /* ---------- vidéos YouTube, avec reprise ---------- */

  let ytP = null;
  function loadYT() {
    if (!ytP) ytP = new Promise((res, rej) => {
      if (window.YT && window.YT.Player) return res(window.YT);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(window.YT); };
      const s = doc.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = () => rej(new Error("YouTube injoignable"));
      doc.head.appendChild(s);
      setTimeout(() => rej(new Error("YouTube ne répond pas")), 15000);
    });
    return ytP;
  }
  function fmtTime(sec) {
    sec = Math.floor(sec || 0);
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0");
  }
  function mountVideo(box, v) {
    const pos = S.video[v.yt] || 0;
    box.innerHTML = `<div class="player"><div class="yt"></div></div>
      <div class="vmeta"><b>${esc(v.label)}</b><span class="small" data-pos>${pos > 5 ? "Reprise à " + fmtTime(pos) : ""}</span></div>
      ${v.shared ? `<p class="small">${esc(v.shared)}</p>` : ""}`;
    let timer = 0, player = null;
    const store = () => { try { S.video[v.yt] = player.getCurrentTime(); saveSoon(true); } catch (e) { /* lecteur pas prêt */ } };
    loadYT().then(YT => {
      if (!box.isConnected) return;
      player = new YT.Player($(".yt", box), {
        videoId: v.yt,
        host: "https://www.youtube-nocookie.com",
        playerVars: { start: Math.floor(pos), rel: 0, playsinline: 1 },
        events: {
          onStateChange: e => {
            clearInterval(timer);
            if (e.data === YT.PlayerState.PLAYING) timer = setInterval(store, 5000);
            else store();
          }
        }
      });
    }).catch(() => {
      $(".player", box).innerHTML = `<a class="ytfallback" href="https://www.youtube.com/watch?v=${v.yt}&t=${Math.floor(pos)}s" target="_blank" rel="noopener"><span class="playbtn" aria-hidden="true"></span><span>Ouvrir la vidéo sur YouTube</span></a>`;
    });
    cleanups.push(() => { clearInterval(timer); if (player) store(); });
  }

  /* ---------- vérifications automatiques du module 0 ---------- */

  async function raw(path) {
    const r = await fetch(`https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}/${path}?t=${Date.now()}`, { cache: "no-store" });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("GitHub a répondu " + r.status);
    return r.text();
  }
  async function api(path) {
    const r = await fetch("https://api.github.com/" + path, { headers: { Accept: "application/vnd.github+json" } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(r.status === 403 ? "limite de l'API GitHub atteinte, réessaie dans une heure" : "l'API GitHub a répondu " + r.status);
    return r.json();
  }
  // devcontainer.json accepte les commentaires et les virgules finales.
  function parseJsonc(t) {
    let out = "", i = 0, str = false;
    while (i < t.length) {
      const c = t[i], n = t[i + 1];
      if (str) { out += c; if (c === "\\") { out += n; i += 2; continue; } if (c === '"') str = false; i++; continue; }
      if (c === '"') { str = true; out += c; i++; continue; }
      if (c === "/" && n === "/") { while (i < t.length && t[i] !== "\n") i++; continue; }
      if (c === "/" && n === "*") { i = t.indexOf("*/", i + 2); i = i < 0 ? t.length : i + 2; continue; }
      out += c; i++;
    }
    return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
  }
  const missing = p => ({ checks: [{ ok: false, text: `Je ne trouve pas ${p} sur la branche ${REPO.branch} de ton fork. As-tu poussé ? Le cache de GitHub peut aussi prendre quelques minutes.` }] });
  const VERIFY = {
    async gitignore() {
      const t = await raw("mon-travail/.gitignore");
      if (t === null) return missing("mon-travail/.gitignore");
      return { checks: [[".venv", ".venv/"], ["parquet", "*.parquet"], ["csv.gz", "*.csv.gz"], [".env", ".env"], ["keys", "keys/"]]
        .map(([k, label]) => ({ ok: t.includes(k), text: `Une règle pour ${label}` })) };
    },
    async mergedPR() {
      const prs = await api(`repos/${REPO.owner}/${REPO.name}/pulls?state=closed&per_page=50`) || [];
      // Les branches mon-zoomcamp/… sont celles où j'envoie les mises à jour du site : elles ne comptent pas.
      const merged = prs.filter(p => p.merged_at && !/^mon-zoomcamp\//.test(p.head && p.head.ref || ""));
      return { checks: [{ ok: merged.length > 0, text: merged.length ? `Une pull request fusionnée dans ton fork : « ${merged[0].title} »` : "Aucune pull request fusionnée dans ton fork pour l'instant" }] };
    },
    async moiJson() {
      let j = null, err = "";
      try { j = JSON.parse(embedded("moi.json") || await (await fetch("moi.json?t=" + Date.now(), { cache: "no-store" })).text()); } catch (e) { err = e.message; }
      if (!j) return { checks: [{ ok: false, text: "site/moi.json n'est pas un JSON valide : " + err }] };
      const online = /github\.io$/i.test(location.hostname);
      return { checks: [
        { ok: !!String(j.prenom || "").trim(), text: j.prenom ? `Le site connaît ton prénom : ${j.prenom}` : "Le champ prenom est vide" },
        { ok: true, warn: !online, text: online ? "Vérifié sur le site en ligne" : "Tu regardes une copie locale : vérifie aussi le site en ligne" }
      ] };
    },
    async syncWorkflow() {
      const t = await raw(".github/workflows/sync-fork.yml");
      if (t === null) return missing(".github/workflows/sync-fork.yml");
      const checks = [
        { ok: /schedule:/.test(t) && /cron:/.test(t), text: "Un lancement planifié (schedule et cron)" },
        { ok: /workflow_dispatch/.test(t), text: "Un bouton pour le lancer à la main (workflow_dispatch)" },
        { ok: /contents:\s*write/.test(t), text: "La permission contents: write" },
        { ok: /pages:\s*write/.test(t), text: "La permission pages: write, pour reconstruire le site" },
        { ok: true, warn: !/repo sync|merge-upstream/.test(t), text: /repo sync|merge-upstream/.test(t) ? "La synchro passe par gh repo sync ou l'API merge-upstream" : "Je ne reconnais pas ta méthode de synchro : je te fais confiance, vérifie les logs" }
      ];
      const runs = await api(`repos/${REPO.owner}/${REPO.name}/actions/workflows/sync-fork.yml/runs?per_page=10`);
      const ok = runs && runs.workflow_runs && runs.workflow_runs.some(r => r.conclusion === "success");
      checks.push({ ok: !!ok, text: ok ? "Au moins un passage vert dans l'onglet Actions" : "Pas encore de passage vert : lance-le à la main depuis l'onglet Actions" });
      return { checks };
    },
    async devcontainer() {
      const t = await raw(".devcontainer/devcontainer.json");
      if (t === null) return missing(".devcontainer/devcontainer.json");
      let j;
      try { j = parseJsonc(t); } catch (e) { return { checks: [{ ok: false, text: "Le fichier n'est pas un JSON valide : " + e.message }] }; }
      const f = Object.keys(j.features || {}).join(" ");
      const all = JSON.stringify(j);
      const ports = (j.forwardPorts || []).map(String);
      return { checks: [
        { ok: /python/.test(j.image || "") && /3\.13/.test(j.image || ""), text: "Une image de base Python 3.13" },
        { ok: /docker-(in|outside-of)-docker/.test(f), text: "Docker marche dans le Codespace" },
        { ok: /terraform/.test(f), text: "La feature Terraform" },
        { ok: /google-cloud|gcloud/.test(f), text: "La feature Google Cloud CLI" },
        { ok: /\buv\b/.test(all), text: "uv est installé" },
        { ok: ports.includes("5432") && ports.includes("8085"), text: "Les ports 5432 et 8085 sont déclarés" }
      ] };
    }
  };

  /* ---------- navigation ---------- */

  let cleanups = [];
  let routeToken = 0;
  function setNav(r) {
    $$(".navl a").forEach(a => a.classList.toggle("on", a.dataset.r === r));
    const cur = current();
    const cont = $("#continue");
    cont.href = cur ? "#/l/" + cur.id : "#/progression";
    $("#nav-seance").href = cont.href;
  }
  function onRoute() {
    cleanups.forEach(f => { try { f(); } catch (e) { /* rien */ } });
    cleanups = [];
    routeToken++;
    const [r, a, b] = location.hash.replace(/^#\/?/, "").split("/");
    setNav(r === "l" ? "seance" : r || "home");
    // Le titre de l'onglet suit la page : utile avec plusieurs onglets ou dans l'historique.
    const it = r === "l" && byId(a), mod = r === "m" && C.modules.find(m => m.id === a);
    const names = { methode: "Comment ça marche", progression: "Ma progression" };
    const pv = r === "v" && C.modules.find(m => m.id === a);
    const page = it ? it.title : mod ? "Module " + mod.id + " · " + mod.title : pv ? "Aperçu · " + pv.title : names[r];
    doc.title = page ? page + " · " + C.title : C.title;
    window.scrollTo(0, 0);
    if (r === "m") return viewModule(a);
    if (r === "l") return viewItem(a);
    if (r === "v") return viewPreview(a, b);
    if (r === "methode") return viewMethod();
    if (r === "progression") return viewProgress();
    return viewHome();
  }

  /* ---------- accueil ---------- */

  let ME = {};
  const CIRC = 131.95;

  function ring(pct, light) {
    const off = CIRC * (1 - pct / 100);
    return `<svg class="pring" width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r="21" fill="none" stroke="${light ? "rgba(255,255,255,.25)" : "var(--line)"}" stroke-width="5"/>
      <circle cx="26" cy="26" r="21" fill="none" stroke="${light ? "#fff" : "var(--blue)"}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 26 26)"/></svg>`;
  }

  function viewHome() {
    const cur = current();
    const pct = Math.round(doneCount() / ITEMS.length * 100);
    const hello = ME.prenom ? `<span class="hello">Bonjour ${esc(ME.prenom)}.</span>` : "";
    app.innerHTML = `
    <section class="hero gut"><div class="max in">
      <div>
        <h1>${hello}Deviens data engineer, une leçon à la fois.</h1>
        <p class="lead">Le Data Engineering Zoomcamp, dans un ordre précis. Tu regardes, tu prédis, tu écris le code toi-même, tu casses, tu répares.</p>
        <div class="ctas">
          <a class="btn white" href="${cur ? "#/l/" + cur.id : "#/progression"}">${doneCount() ? "Reprendre ma séance" : "Commencer le cours"} <span class="arr">→</span></a>
          <a class="btn ghost-w" href="#/methode">Comment ça marche</a>
        </div>
        ${cur ? `<a class="resume" href="#/l/${cur.id}">${ring(pct, true)}<div><b>Module ${cur.module} · ${esc(cur.title)}</b><small>${pct} % du cours · ${doneCount()} étapes sur ${ITEMS.length}</small></div></a>` : ""}
      </div>
      <div class="stage" id="stage" aria-label="Animation : les outils du cours en orbite autour d'un globe de données">
        <canvas id="globe"></canvas><div class="orbit" id="orbit"></div>
      </div>
    </div></section>

    <section class="section gut"><div class="max">
      ${welcome() || '<div class="today" id="today"></div>'}

      <div class="sh" style="margin-top:64px"><div><span class="eyebrow">À ton rythme, sans date limite</span><h2>Ton programme</h2></div></div>
      ${programList()}

      ${statRow()}
      <div class="sh"><div><span class="eyebrow">Contenu de la cohorte 2026</span><h2>Les modules</h2></div><span class="eyebrow">Tous les modules sont ouverts</span></div>
      <div class="mods">${C.modules.map(modCard).join("")}</div>
    </div></section>

    <section class="gut" style="padding-bottom:120px"><div class="max">${atelier()}</div></section>`;
    renderToday(cur);
    cleanups.push(startGlobe(), startMosaic());
  }

  // Avant la toute première leçon : comment s'installer, en trois gestes.
  function welcome() {
    if (doneCount() || Object.keys(S.les).length) return "";
    const first = ITEMS[0];
    return `<div class="welcome">
      <div class="wh"><span class="eyebrow">Avant ta première séance</span><h2>${ME.prenom ? "Bienvenue, " + esc(ME.prenom) + "." : "Bienvenue."}</h2>
        <p>Trois gestes, et c'est parti. Ta progression s'enregistre toute seule dans ce navigateur.</p></div>
      <ol class="wsteps">
        <li><b>Ouvre ton Codespace</b><span>Dans VS Code : Remote Explorer, puis GitHub Codespaces, puis ton Codespace.</span></li>
        <li><b>Mets ce site à côté</b><span>Le site d'un côté pour la leçon, VS Code de l'autre pour taper le code.</span></li>
        <li><b>Fais la leçon 1</b><span>${esc(first.title)} : ${esc(dur(first))}, rien à installer.</span></li>
      </ol>
      <div><a class="btn" href="#/l/${first.id}">Commencer la leçon 1 <span class="arr">→</span></a></div>
    </div>`;
  }

  async function renderToday(cur) {
    const box = $("#today");
    if (!box) return;
    if (!cur) {
      box.innerHTML = `<div class="today-h"><span class="eyebrow">Tout ce qui est prêt est fait</span><h2>Bravo.</h2><p>Les modules suivants n'ont pas encore leurs exercices guidés, mais leur cours officiel est déjà lisible, avec les vidéos.</p></div>`;
      return;
    }
    const mod = modOf(cur);
    box.innerHTML = `<div class="today-h">
        <span class="eyebrow">Module ${mod.id} · ${esc(mod.title)} · ${itemLabel(cur)}${cur.min ? " · " + esc(dur(cur)) : ""}</span>
        <h2>Ta séance du jour</h2>
        <p>${esc(cur.title)}. Suis les étapes dans l'ordre, c'est le plus efficace. Tu peux t'arrêter entre deux étapes, tout est enregistré.</p>
        <div><a class="btn" href="#/l/${cur.id}">Continuer <span class="arr">→</span></a></div>
      </div><ol class="seq" id="seq"><li><span class="st">…</span><div><b>Chargement</b></div></li></ol>`;
    const token = routeToken;
    let rows = [];
    if (cur.type === "lesson") {
      let ov = {};
      try { ov = parseOverlay(await getText(cur.overlay)); } catch (e) { /* hors ligne */ }
      const st = S.les[cur.id] || { step: 0 };
      rows = stepsOf(ov).map((k, i) => ({ k, state: i < st.step ? "ok" : i === st.step ? "now" : "lock", label: STEP_NAMES[k], hint: STEP_HINTS[k] }));
    } else if (cur.type === "homework") {
      rows = [{ state: "now", label: "Répondre aux questions", hint: "Une réponse et ton raisonnement pour chaque question" }, { state: "lock", label: "Terminer le homework", hint: "Quand toutes les questions sont faites" }];
    } else {
      rows = [{ state: "now", label: "Construire sans guide", hint: "Docker Compose, ingestion et vérification" }, { state: "lock", label: "Entrer ton code de réussite", hint: "Donné par le script quand tout est vert" }];
    }
    if (token !== routeToken) return;
    $("#seq").innerHTML = rows.map((r, i) => `<li class="${r.state}"><span class="st">${r.state === "ok" ? "✓" : i + 1}</span><div><b>${esc(r.label)}</b><small>${esc(r.hint)}</small></div>${r.state === "now" ? `<a class="btn sm" href="#/l/${cur.id}">Ouvrir</a>` : ""}</li>`).join("");
  }

  function programList() {
    return `<ol class="weeks">${C.modules.map(m => {
      const s = modStatus(m);
      const cls = s === "done" ? "ok" : s === "progress" || s === "open" ? "now" : "";
      const n = m.items.length;
      const total = m.items.reduce((a, i) => a + (i.min || 0), 0);
      const content = n ? `${m.items.filter(i => i.type === "lesson").length} leçons${m.items.some(i => i.type === "homework") ? ", homework" : ""}${m.items.some(i => i.type === "defi") ? ", défi" : ""}${total ? " · environ " + fmtMin(total) : ""}` : m.bonus ? `${m.planned} leçons officielles, facultatif` : `${m.planned} leçons, en préparation`;
      const gate = m.bonus ? "Facultatif" : s === "done" ? "✓ Validé" : s === "soon" ? "Bientôt" : "Pour valider : " + m.gate;
      return `<li class="${cls}"><span class="wk">${m.id}</span><div><b>${m.id === "P" ? "" : modName(m) + " · "}${esc(m.title)}</b><small>${content}${m.team || m.items.some(i => i.team) ? ' · <i class="team">Équipe</i>' : ""}</small></div><span class="gate">${esc(gate)}</span></li>`;
    }).join("")}</ol>`;
  }

  function statRow() {
    const lessons = ITEMS.filter(i => i.type === "lesson");
    const hws = ITEMS.filter(i => i.type === "homework");
    const expl = lessons.filter(i => isDone(i.id) && S.les[i.id] && S.les[i.id].explain).length;
    const maj = Object.keys(S.maj).filter(k => S.maj[k]).length;
    return `<div class="statrow" style="margin-top:56px">
      <div><strong>${doneCount(lessons)}<small> / ${lessons.length}</small></strong><span>leçons terminées</span></div>
      <div><strong>${doneCount(hws)}<small> / ${hws.length}</small></strong><span>homework faits</span></div>
      <div><strong>${expl}</strong><span>explications écrites</span></div>
      <div><strong>${maj}</strong><span>leçons modifiées par le cours</span></div>
    </div>`;
  }

  function modCard(m) {
    const s = modStatus(m);
    const n = m.items.length, d = doneCount(m.items);
    const pct = n ? Math.round(d / n * 100) : 0;
    const sats = m.sats.map((x, k) => {
      const a = k / m.sats.length * Math.PI * 2 - Math.PI / 2;
      return `<span class="sat" style="left:${(75 + 75 * Math.cos(a)).toFixed(1)}px;top:${(75 + 75 * Math.sin(a)).toFixed(1)}px">${icon(x[0], x[1])}</span>`;
    }).join("");
    const badge = s === "done" ? '<span class="badge">Validé</span>' : s === "progress" ? '<span class="badge">En cours</span>' : s === "open" ? '<span class="badge">À toi</span>'
      : m.bonus ? '<span class="lockb">Bonus</span>' : s === "soon" ? '<span class="lockb">Bientôt</span>' : '<span class="badge">Ouvert</span>';
    const open = s !== "soon";
    const tag = "a";
    const total = m.items.reduce((a, i) => a + (i.min || 0), 0);
    const count = n ? `${d} / ${n} étapes${total ? " · " + fmtMin(total) : ""}` : `${m.planned} leçons`;
    return `<${tag} class="mod${open ? "" : " locked"}" href="#/m/${m.id}"${open ? "" : m.bonus ? ' title="Bonus facultatif : le cours officiel avec Kestra"' : ' title="Bientôt : tu peux déjà lire le cours officiel"'}>
      <div class="cover" style="--c1:${m.cover[0]};--c2:${m.cover[1]}"><span class="ring">${sats}</span><span class="logo-main${m.wide ? " wide" : ""}">${icon(m.logo[0], m.logo[1])}</span><span class="num">${m.id}</span>${badge}<span class="big">${m.id}</span></div>
      <div class="b"><h3>${esc(m.title)}</h3><div class="chips">${m.chips.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>
        <div class="track"><b style="width:${pct}%"></b></div>
        <div class="foot"><span>${count}</span><span class="help" title="Niveau d'aide">Aide ${[1, 2, 3].map(k => `<i class="${k <= m.help ? "on" : ""}"></i>`).join("")}</span></div></div>
    </${tag}>`;
  }

  function atelier() {
    const rows = [
      ["00-02", "Travailler dans ton Codespace depuis VS Code"],
      ["00-05", "Mettre ton site en ligne et le personnaliser"],
      ["00-06", "Écrire la synchro automatique du fork (GitHub Actions)"],
      ["00-07", "Écrire ton fichier .devcontainer"]
    ];
    return `<article class="atelier">
      <div class="mosaic"><canvas id="mosaic"></canvas><div class="tag"><i></i>Module 0 · c'est toi qui le fais</div></div>
      <div class="txt">
        <span class="eyebrow">Ton atelier</span>
        <h2>Les réglages du métier, c'est toi qui les fais.</h2>
        <p>Le code ne tourne pas dans ce site : il tourne dans ton Codespace. Ce qui fait partie du métier de data engineer, tu le construis toi-même, guidé pas à pas.</p>
        <div class="todo">${rows.map(([id, t]) => `<div>${esc(t)} <span class="k ${isDone(id) ? "done" : "you"}">${isDone(id) ? "FAIT" : "EXERCICE"}</span></div>`).join("")}</div>
        <div><a class="btn white sm" href="#/m/00">Voir le module 0 <span class="arr">→</span></a></div>
      </div>
    </article>`;
  }

  /* ---------- animations ---------- */

  function startGlobe() {
    const stage = $("#stage"), gc = $("#globe"), orbitEl = $("#orbit");
    if (!stage) return () => {};
    const ORB = [["docker", "#2496ED", "Docker"], ["apacheairflow", "#017CEE", "Airflow"], ["googlebigquery", "#4285F4", "BigQuery"], ["dbt", "#FF694B", "dbt"], ["bruin", "", "Bruin"], ["apachespark", "#E25A1C", "Spark"], ["apachekafka", "#231F20", "Kafka"], ["terraform", "#844FBA", "Terraform"]];
    const chips = ORB.map(o => { const s = doc.createElement("span"); s.innerHTML = `<i class="oi">${icon(o[0], o[1])}</i>${o[2]}`; orbitEl.appendChild(s); return s; });
    const N = 520, pts = [], ACC = ["#ff6b2c", "#ee4fb6", "#c6f432", "#14c3c3"];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963, r = Math.random();
      pts.push([Math.cos(th) * rad, y, Math.sin(th) * rad, r < .08 ? ACC[i % 4] : null, Math.random() * 6.28]);
    }
    let W = 0, H = 0, ctx = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tilt = -.32;
    function size() {
      const r = stage.getBoundingClientRect(); if (!r.width) return;
      const d = devicePixelRatio || 1; W = r.width; H = r.height;
      gc.width = W * d; gc.height = H * d; ctx = gc.getContext("2d"); ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    const move = e => { const r = stage.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * .5; ty = ((e.clientY - r.top) / r.height - .5) * .4; };
    const leave = () => { tx = 0; ty = 0; };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    function frame(t) {
      if (!ctx) { size(); if (!reduce) raf = requestAnimationFrame(frame); return; }
      cx += (tx - cx) * .05; cy += (ty - cy) * .05;
      const a = t * .00018 + cx, b = tilt + cy, R = Math.min(W, H) * .3, X0 = W / 2, Y0 = H / 2;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(X0, Y0, R * .2, X0, Y0, R * 1.6);
      g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.ellipse(X0, Y0, R * (1.45 + k * .22), R * (1.45 + k * .22) * .28, -.18, 0, Math.PI * 2); ctx.setLineDash(k ? [2, 7] : []); ctx.stroke(); }
      ctx.setLineDash([]);
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const proj = pts.map(p => { const x = p[0] * ca - p[2] * sa; let z = p[0] * sa + p[2] * ca; const y = p[1] * cb - z * sb; z = p[1] * sb + z * cb; return [x, y, z, p[3], p[4]]; }).sort((u, v) => u[2] - v[2]);
      for (const [x, y, z, c, ph] of proj) {
        const s = (z + 1.6) / 2.6, sz = (2 + 3.4 * s) * (c ? 1.35 : 1), tw = c ? .75 + .25 * Math.sin(t * .003 + ph) : 1;
        ctx.globalAlpha = (.18 + .82 * s) * tw; ctx.fillStyle = c || "#ffffff";
        ctx.fillRect(X0 + x * R - sz / 2, Y0 + y * R - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
      for (let k = 0; k < 5; k++) {
        const u = (t * .00025 + k / 5) % 1 * Math.PI * 2, rx = R * 1.45, ry = rx * .28, xx = Math.cos(u) * rx, yy = Math.sin(u) * ry, rot = -.18;
        const px = X0 + xx * Math.cos(rot) - yy * Math.sin(rot), py = Y0 + xx * Math.sin(rot) + yy * Math.cos(rot);
        ctx.fillStyle = ACC[k % 4]; ctx.globalAlpha = Math.sin(u) > 0 ? 1 : .45; ctx.fillRect(px - 4, py - 4, 8, 8);
      }
      ctx.globalAlpha = 1;
      chips.forEach((el, i) => {
        const u = a * 1.4 + i / chips.length * Math.PI * 2, rx = Math.min(R * 1.72, W / 2 - 52), ry = R * .62, depth = Math.sin(u);
        const px = X0 + Math.cos(u) * rx, py = Y0 + depth * ry - R * .05 + Math.cos(u) * -R * .18;
        const sc = .72 + .32 * (depth + 1) / 2;
        el.style.transform = `translate(${px - el.offsetWidth / 2}px,${py - el.offsetHeight / 2}px) scale(${sc})`;
        el.style.opacity = (.35 + .65 * (depth + 1) / 2).toFixed(2);
        el.style.zIndex = depth > 0 ? 2 : 0;
        el.style.filter = depth < -.3 ? "blur(.6px)" : "none";
      });
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    const onResize = () => { size(); if (reduce) frame(4000); };
    addEventListener("resize", onResize);
    size();
    if (reduce) frame(4000); else raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); };
  }

  function startMosaic() {
    const mc = $("#mosaic");
    if (!mc) return () => {};
    let mx = null, MW = 0, MH = 0, cells = [], raf = 0;
    function size() {
      const r = mc.getBoundingClientRect(); if (!r.width) return;
      const d = devicePixelRatio || 1; MW = r.width; MH = r.height;
      mc.width = MW * d; mc.height = MH * d; mx = mc.getContext("2d"); mx.setTransform(d, 0, 0, d, 0, 0);
      cells = []; const c = 14, COLS = ["#146ef5", "#ff6b2c", "#ee4fb6", "#1fae5b", "#c6f432"];
      for (let x = 0; x < MW; x += c) for (let y = 0; y < MH; y += c) {
        const fx = x / MW, fy = y / MH, band = Math.abs(fy - (.55 + .18 * Math.sin(fx * 5.5))) < .13, r = Math.random();
        if ((band && r < .75) || r < .05) cells.push([x, y, band ? COLS[Math.floor(r * 40) % 5] : "#ffffff", Math.random() * 6.28, band ? .8 : .25]);
      }
    }
    function frame(t) {
      if (mx) {
        mx.fillStyle = "#0a0a0a"; mx.fillRect(0, 0, MW, MH);
        for (const [x, y, c, ph, base] of cells) {
          const w = (t * .0006 + x * .004) % (Math.PI * 2);
          mx.globalAlpha = base * (.35 + .65 * Math.max(0, Math.sin(w * 2 + ph))); mx.fillStyle = c; mx.fillRect(x + 1, y + 1, 12, 12);
        }
        mx.globalAlpha = 1;
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    const onResize = () => { size(); if (reduce) frame(0); };
    addEventListener("resize", onResize);
    size();
    if (reduce) frame(0); else raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); };
  }

  /* ---------- page d'un module ---------- */

  // « Ce que tu construis » : le schéma d'architecture du module (arch dans course.js).
  // Un nœud = [logo, couleur, nom, détail, texte de la flèche qui y mène].
  function archBlock(m) {
    const a = m.arch;
    if (!a) return "";
    const node = n => `<div class="anode"><span class="alogo">${icon(n[0], n[1])}</span><span class="atxt"><b>${esc(n[2])}</b>${n[3] ? `<small>${esc(n[3])}</small>` : ""}</span></div>`;
    const edge = t => `<span class="aedge"><i>${esc(t || "")}</i></span>`;
    const rows = a.rows.map((r, k) => `${k && r.link ? `<div class="alink"><i>${esc(r.link)}</i></div>` : ""}<div class="arow">${r.zone ? `<span class="azone">${esc(r.zone)}</span>` : ""}<div class="aflow">${r.nodes.map((n, j) => (j ? edge(n[4]) : "") + node(n)).join("")}</div></div>`).join("");
    const off = a.official ? (() => {
      const src = (window.EMBED_IMG && EMBED_IMG[a.official[0]]) || ROOT + a.official[0];
      return `<details class="aoff"><summary>Le schéma du cours officiel</summary><img src="${esc(src)}" alt="${esc(a.official[1])}" loading="lazy"><small>${esc(a.official[1])}</small></details>`;
    })() : "";
    return `<section class="arch"><span class="lab">Ce que tu construis</span>${a.intro ? `<p>${esc(a.intro)}</p>` : ""}<div class="arows">${rows}</div>${off}</section>`;
  }

  function viewModule(id) {
    const m = C.modules.find(x => x.id === id);
    if (!m) return viewHome();
    const s = modStatus(m);
    const rows = m.items.map(it => {
      const done = isDone(it.id), now = !done && it === current();
      return `<li class="${done ? "done" : now ? "cur" : ""}">
        <span class="c">${done ? "✓" : ""}</span>
        <div><a href="#/l/${it.id}">${esc(it.title)}</a>${S.maj[it.id] ? '<span class="maj">MAJ</span>' : ""}${it.team ? ' <i class="team">Équipe</i>' : ""}
        <small>${itemLabel(it)}${it.min ? " · " + esc(fmtMin(it.min)) : ""}${it.verify ? " · vérifié sur ton fork" : ""}</small></div>
        ${now ? `<a class="btn sm" href="#/l/${it.id}">${S.les[it.id] && S.les[it.id].step ? "Reprendre" : "Commencer"}</a>` : ""}</li>`;
    }).join("");
    app.innerHTML = `
    <section class="modhero gut" style="--c1:${m.cover[0]};--c2:${m.cover[1]}"><div class="max in">
      <nav class="crumbs light"><a href="#/">Accueil</a><span>/</span><span>${esc(modName(m))}</span></nav>
      <div class="modhead"><span class="logo-main${m.wide ? " wide" : ""}">${icon(m.logo[0], m.logo[1])}</span>
        <div><span class="eyebrow light">${m.id === "P" ? "Projet" : m.id === "W1" ? "Workshop" : m.bonus ? "Bonus facultatif" : "Module " + m.id}</span><h1>${esc(m.title)}</h1></div></div>
      <div class="chips">${m.chips.map(c => `<span class="chip light">${esc(c)}</span>`).join("")}</div>
    </div></section>
    <section class="gut" style="padding-block:36px 120px"><div class="max modbody">
      ${archBlock(m)}
      ${m.bonus ? `<div class="chal"><span class="lab">Bonus facultatif</span><p>${esc(m.intro)}</p></div><div id="plan"></div>` : s === "soon" ? `<div class="chal"><span class="lab">En préparation</span><p>Les exercices guidés de ce module (${m.planned} leçons) arrivent plus tard. Tu peux déjà le suivre avec le cours officiel ci-dessous : le texte et les vidéos de chaque leçon.</p></div><div id="plan"></div>` : ""}
      ${m.items.length ? `<div class="modmeta"><span><b>${doneCount(m.items)} / ${m.items.length}</b> étapes faites</span>${remaining(m.items) ? `<span>Reste environ <b>${esc(fmtMin(remaining(m.items)))}</b></span>` : ""}<span>Pour valider : ${esc(m.gate)}</span><span class="help">Niveau d'aide ${[1, 2, 3].map(k => `<i class="${k <= m.help ? "on" : ""}"></i>`).join("")}</span></div>
      <ol class="mlist">${rows}</ol>` : ""}
    </div></section>`;
    if (s === "soon") showPlan(m);
  }

  // Les modules pas encore écrits : leur plan officiel (module.yaml du repo), lisible en aperçu.
  async function loadPlan(m) {
    if (m.docs) return m.docs.map(([title, src]) => ({ title, src }));
    if (!m.dir) return [];
    const units = [];
    (await getText(ROOT + m.dir + "/module.yaml")).split("\n").forEach(l => {
      const t = l.match(/^\s+title:\s*"?(.*?)"?\s*$/), p = l.match(/^\s+path:\s*(\S+)/);
      if (t) units.push({ title: t[1] });
      else if (p && units.length) units[units.length - 1].src = m.dir + "/" + p[1];
    });
    return units.filter(u => u.src);
  }
  async function showPlan(m) {
    const token = routeToken;
    let units = [];
    try { units = await loadPlan(m); } catch (e) { /* plan indisponible */ }
    if (token !== routeToken || !units.length) return;
    $("#plan").innerHTML = `<div class="visit"><b>Aperçu</b><span>${m.bonus ? "Le cours officiel (en anglais), leçon par leçon, avec ses vidéos." : "En attendant, tu peux lire le cours officiel de ce module (en anglais) et regarder ses vidéos."}</span></div>
      <ol class="mlist">${units.map((u, i) => `<li><span class="c">·</span><div><a href="#/v/${m.id}/${i}">${esc(u.title)}</a><small>${m.bonus ? "Cours officiel" : "Aperçu du cours officiel"}</small></div></li>`).join("")}</ol>`;
  }
  async function viewPreview(id, i) {
    const token = routeToken;
    const m = C.modules.find(x => x.id === id);
    if (!m) return viewHome();
    let units = [];
    try { units = await loadPlan(m); } catch (e) { /* plan indisponible */ }
    if (token !== routeToken) return;
    const k = Math.min(Math.max(+i || 0, 0), units.length - 1), u = units[k];
    if (!u) return viewModule(id);
    const link = (j, label, cls) => `<a class="btn ${cls}" href="#/v/${m.id}/${j}">${label}</a>`;
    app.innerHTML = `<section class="gut"><div class="max lesson">
      <div class="lmain">
        <nav class="crumbs"><a href="#/">Accueil</a><span>/</span><a href="#/m/${m.id}">${esc(modName(m))} · ${esc(m.title)}</a><span>/</span><span>Aperçu</span></nav>
        <div class="ltitle"><div><span class="eyebrow">${esc(modName(m))} · Aperçu du cours officiel${units.length > 1 ? ` · ${k + 1} sur ${units.length}` : ""}</span><h1>${esc(u.title)}</h1></div></div>
        <div class="visit"><b>Aperçu</b><span>Le texte et la vidéo du cours officiel, en anglais. Les exercices viendront quand je construirai ce module, avec la même méthode.</span></div>
        <div class="panel" id="pvbox"><p class="small">Chargement…</p></div>
        <div class="lnav">${k > 0 ? link(k - 1, "← " + esc(units[k - 1].title), "ghost") : "<span></span>"}${k < units.length - 1 ? link(k + 1, esc(units[k + 1].title) + " →", "dark") : ""}</div>
      </div>
      <aside class="curr" aria-label="Plan officiel du module"><div class="h"><span class="eyebrow">Aperçu</span><h3>${esc(m.title)}</h3><span class="small">${units.length} ${units.length > 1 ? "leçons officielles" : "page officielle"}</span></div>
        <ol>${units.map((x, j) => `<li class="${j === k ? "cur" : ""}"><a href="#/v/${m.id}/${j}"><span class="c">·</span><span>${esc(x.title)}</span></a></li>`).join("")}</ol></aside>
    </div></section>`;
    let raw;
    try { raw = await getText(ROOT + u.src); }
    catch (e) { if (token === routeToken) $("#pvbox").innerHTML = `<div class="upd"><b>Erreur</b><span>Je n'arrive pas à charger cette leçon (${esc(e.message)}).</span></div>`; return; }
    if (token !== routeToken) return;
    const { body, meta } = frontMatter(raw);
    const box = $("#pvbox");
    box.innerHTML = "";
    // La vidéo : dans l'en-tête de la leçon, sinon le premier lien YouTube du texte.
    const yt = (/(?:v=|youtu\.be\/)([\w-]{11})/.exec(meta.video_url || body) || [])[1];
    if (yt) { const vb = doc.createElement("div"); vb.className = "video"; box.appendChild(vb); mountVideo(vb, { yt, label: u.title }); }
    const c = doc.createElement("div");
    c.className = "coursetext";
    c.innerHTML = `<div class="md"></div>`;
    renderMd($(".md", c), body, ROOT + u.src, { dropTitle: true });
    box.appendChild(c);
    renderMermaid(c);
  }

  /* ---------- une étape du cours ---------- */

  function viewItem(id) {
    const it = byId(id);
    if (!it) return viewHome();
    if (it.type === "homework") return viewHomework(it);
    if (it.type === "defi") return viewDefi(it);
    return viewLesson(it);
  }

  function curriculum(mod, active) {
    const rows = mod.items.map(it => {
      const done = isDone(it.id);
      const cls = it === active ? "cur" : done ? "done" : "";
      const inner = `<span class="c">${done ? "✓" : ""}</span><span>${esc(it.title)}${S.maj[it.id] ? '<span class="maj">MAJ</span>' : ""}<small>${itemLabel(it)}${it.min ? " · " + esc(fmtMin(it.min)) : ""}${it.team ? " · Équipe" : ""}</small></span>`;
      return `<li class="${cls}"><a href="#/l/${it.id}">${inner}</a></li>`;
    }).join("");
    const pct = Math.round(doneCount(mod.items) / mod.items.length * 100);
    return `<aside class="curr" aria-label="Programme du module">
      <div class="h"><span class="eyebrow">Module ${mod.id}</span><h3>${esc(mod.title)}</h3><div class="track"><b style="width:${pct}%"></b></div><span class="small">${doneCount(mod.items)} sur ${mod.items.length} terminées</span></div>
      <ol>${rows}</ol></aside>`;
  }

  function itemNav(it) {
    const i = idx(it.id), prev = ITEMS[i - 1], next = ITEMS[i + 1];
    const done = isDone(it.id);
    return `${prev ? `<a class="btn ghost" href="#/l/${prev.id}">← ${esc(prev.title)}</a>` : "<span></span>"}
      ${next ? (done ? `<a class="btn dark" href="#/l/${next.id}">${esc(next.title)} →</a>` : `<a class="btn dark" href="#/l/${next.id}">${esc(next.title)} →</a>`) : ""}`;
  }

  const STEP_NAMES = { discover: "Découvrir", predict: "Prédire", practice: "Pratiquer", breakfix: "Casser et réparer", explain: "Expliquer" };
  const STEP_HINTS = {
    discover: "La vidéo et le texte de la leçon, en tapant le code toi-même",
    predict: "Une question avant de lancer les commandes",
    practice: "Un objectif et des contraintes, la solution après ton essai",
    breakfix: "Une erreur à provoquer, comprendre et réparer",
    explain: "Quelques lignes avec tes mots"
  };
  const EXPLAIN_MIN = 100; // longueur conseillée, pas obligatoire
  function stepsOf(ov) { return ["discover", "predict", "practice", "breakfix", "explain"].filter(k => k === "discover" || ov[k]); }

  // Une ancienne prédiction revient de temps en temps : c'est la révision espacée.
  async function revisionCard(it) {
    const i = idx(it.id);
    const pool = ITEMS.slice(0, Math.max(0, i - 1)).filter(x => x.type === "lesson" && isDone(x.id));
    if (pool.length < 2) return null;
    const pick = pool[[...it.id].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length];
    try {
      const ov = parseOverlay(await getText(pick.overlay));
      if (!ov.predict) return null;
      const box = doc.createElement("div");
      box.className = "chal revision";
      box.innerHTML = `<span class="lab">Révision éclair · ${esc(pick.title)}</span><div class="md"></div>
        <details><summary>Réponds de tête, puis vérifie</summary><div class="md ans"></div></details>`;
      renderMd($(".md", box), ov.predict);
      renderMd($(".ans", box), ov["predict-answer"] || "");
      return box;
    } catch (e) { return null; }
  }

  async function viewLesson(it) {
    const token = routeToken;
    const mod = modOf(it);
    const n = itemNumber(it);
    const st = S.les[it.id] = Object.assign({ step: 0, hints: 0, bfHints: 0, checks: {} }, S.les[it.id]);
    app.innerHTML = `<section class="gut"><div class="max lesson">
      <div class="lmain">
        <nav class="crumbs"><a href="#/">Accueil</a><span>/</span><a href="#/m/${mod.id}">Module ${mod.id} · ${esc(mod.title)}</a><span>/</span><span>Leçon ${n.pos}</span></nav>
        <div class="ltitle"><div><span class="eyebrow">Module ${mod.id} · Leçon ${n.pos} sur ${n.total}${it.min ? " · " + esc(dur(it)) : ""}</span><h1>${esc(it.title)}</h1></div></div>
        <div id="majbox"></div>
        <ol class="fsteps" id="fsteps" aria-label="Déroulé de la leçon"></ol>
        <div class="tabs" role="tablist">
          <button role="tab" aria-selected="true" data-t="lecon">Ta leçon</button>
          <button role="tab" aria-selected="false" data-t="cours">Texte du cours</button>
          <button role="tab" aria-selected="false" data-t="res">Ressources</button>
          <button role="tab" aria-selected="false" data-t="notes">Mes notes</button>
        </div>
        <div class="panel" data-tp="lecon" id="stepbox"><p class="small">Chargement de la leçon…</p></div>
        <div class="panel" data-tp="cours" hidden><div class="md" id="coursbox"></div></div>
        <div class="panel links" data-tp="res" hidden id="resbox"></div>
        <div class="panel notes" data-tp="notes" hidden><textarea id="notes" placeholder="Tes notes sur cette leçon. Elles sont enregistrées toutes seules dans ton navigateur."></textarea></div>
        <div class="lnav" id="lnav">${itemNav(it)}</div>
      </div>
      ${curriculum(mod, it)}
    </div></section>`;

    $$(".tabs [data-t]").forEach(b => b.addEventListener("click", () => {
      $$(".tabs [data-t]").forEach(x => x.setAttribute("aria-selected", x === b));
      $$("[data-tp]").forEach(p => { p.hidden = p.dataset.tp !== b.dataset.t; });
      renderMermaid(app);
    }));
    const notes = $("#notes");
    notes.value = S.notes[it.id] || "";
    notes.addEventListener("input", () => { S.notes[it.id] = notes.value; saveSoon(); });

    let ov, course = "", base = null, meta = {};
    try { ov = parseOverlay(await getText(it.overlay)); }
    catch (e) {
      if (token === routeToken) $("#stepbox").innerHTML = `<div class="upd"><b>Erreur</b><span>Je n'arrive pas à charger les exercices de cette leçon (${esc(e.message)}). Recharge la page.</span></div>`;
      return;
    }
    if (it.src) {
      try {
        const rawText = await getText(ROOT + it.src);
        ({ body: course, meta } = frontMatter(rawText));
        base = ROOT + it.src;
        checkHash(it, rawText, token);
      } catch (e) { course = ""; }
    } else {
      course = ov.body;
      base = new URL(it.overlay, location.href).href;
    }
    if (token !== routeToken) return;

    if (course) renderMd($("#coursbox"), course, base, { dropTitle: true });
    else $("#coursbox").innerHTML = `<p>Le texte du cours n'a pas pu être chargé. Tu peux le lire <a href="${GH}/blob/${REPO.branch}/${it.src}" target="_blank" rel="noopener">sur GitHub</a>.</p>`;
    renderResources(it, ov, meta);

    const steps = stepsOf(ov);
    if (isDone(it.id) && st.step < steps.length) st.step = steps.length;
    let view = Math.min(st.step, steps.length);

    function go(i) { view = i; renderSteps(); renderStep(); $("#fsteps").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    function advance(from) {
      if (st.step <= from) st.step = from + 1;
      save();
      go(st.step);
    }
    function renderSteps() {
      $("#fsteps").innerHTML = steps.map((k, i) => {
        const cls = i === view ? "now" : i < st.step ? "ok" : "";
        const can = true;
        return `<li class="${cls}${can ? " can" : ""}">${can ? `<button data-step="${i}">` : "<span>"}<b>${String(i + 1).padStart(2, "0")}</b>${STEP_NAMES[k]}${can ? "</button>" : "</span>"}</li>`;
      }).join("");
      $$("#fsteps [data-step]").forEach(b => b.addEventListener("click", () => go(+b.dataset.step)));
    }

    function renderStep() {
      const box = $("#stepbox");
      box.innerHTML = "";
      const k = steps[view];
      if (view >= steps.length) return stepSummary(box);
      if (k === "discover") return stepDiscover(box);
      if (k === "predict") return stepPredict(box);
      if (k === "practice") return stepPractice(box);
      if (k === "breakfix") return stepBreakfix(box);
      if (k === "explain") return stepExplain(box);
    }

    function card(cls, html) { const d = doc.createElement("div"); d.className = cls; d.innerHTML = html; return d; }
    function mdCard(box, cls, label, src) {
      const c = card(cls, `<span class="lab">${label}</span><div class="md"></div>`);
      renderMd($(".md", c), src, base);
      box.appendChild(c);
      return c;
    }
    function nextBtn(label, from, enabled = true) {
      const b = doc.createElement("button");
      b.className = "btn";
      b.innerHTML = `${label} <span class="arr">→</span>`;
      b.disabled = !enabled;
      b.addEventListener("click", () => advance(from));
      return b;
    }
    function hintBox(list, key, btnLabel) {
      const wrap = card("hintwrap", `<div class="hints"></div><button class="btn ghost sm"></button>`);
      const btn = $("button", wrap), out = $(".hints", wrap);
      const show = () => {
        out.innerHTML = list.slice(0, st[key]).map((h, i) => `<div class="hintc"><b>${i + 1}/${list.length}</b><span>${mdInline(h)}</span></div>`).join("");
        btn.disabled = st[key] >= list.length;
        btn.textContent = st[key] >= list.length ? "Plus d'indice" : `${btnLabel} (${st[key]}/${list.length})`;
      };
      btn.addEventListener("click", () => { st[key] = Math.min(list.length, st[key] + 1); save(); show(); wrap.dispatchEvent(new Event("hint")); });
      show();
      if (!list.length) wrap.hidden = true;
      return wrap;
    }
    function area(key, cls, ph, min) {
      const t = doc.createElement("textarea");
      t.className = cls || "";
      t.placeholder = ph;
      t.value = st[key] || "";
      t.addEventListener("input", () => { st[key] = t.value; saveSoon(); t.dispatchEvent(new Event("change-len")); });
      t.dataset.min = min || 0;
      return t;
    }

    // Bloqué ? Les étapes pour se débloquer seul, puis un message tout prêt (Slack, forum, IA) avec l'objectif et ton essai.
    function stuckBox(stepName, objective, getAttempt) {
      const d = doc.createElement("details");
      d.className = "stuck";
      d.innerHTML = `<summary>Bloqué ? Voici quoi faire</summary>
        <div class="stuck-in">
          <ol class="small stucksteps">
            <li><b>Relis le message d'erreur en entier.</b> La dernière ligne dit presque toujours ce qui ne va pas.</li>
            <li><b>Ouvre la solution</b> avec le bouton « Comparer avec la solution » : chaque ligne y est expliquée. Compare-la avec la tienne, ligne par ligne.</li>
            <li><b>Cherche l'erreur</b> dans la <a href="${C.faq}" target="_blank" rel="noopener">FAQ du cours</a>, ou colle-la telle quelle dans Google : quelqu'un l'a presque toujours eue avant toi.</li>
            <li><b>Demande à la communauté</b>, gratuitement : le <a href="https://datatalks.club/slack.html" target="_blank" rel="noopener">Slack de DataTalksClub</a>, canal <code>#course-data-engineering</code> (en anglais). Le bouton prépare ton message, à coller sur le Slack, sur un forum ou dans une IA.</li>
          </ol>
          <div class="row"><button class="btn ghost sm" type="button">Préparer mon message d'aide</button></div>
          <textarea class="mono stuckmsg" readonly hidden aria-label="Ton message d'aide"></textarea>
        </div>`;
      const b = $("button", d), out = $("textarea", d);
      b.addEventListener("click", async () => {
        const tried = (getAttempt() || "").trim() || "(rien encore)";
        const text = `Je suis bloqué au module ${mod.id}, leçon « ${it.title} », étape « ${stepName} ».\n\nL'objectif :\n${(objective || "").trim()}\n\nCe que j'ai essayé :\n${tried}\n\nL'erreur exacte que je vois :\n(colle-la ici)\n\nMerci de me donner un indice plutôt que la solution complète.`;
        out.value = text;
        out.hidden = false;
        try { await navigator.clipboard.writeText(text); flash(b, "Copié ✓ Colle-le où tu demandes de l'aide"); }
        catch (e) { out.focus(); out.select(); flash(b, "Texte sélectionné : copie-le avec Ctrl + C"); }
      });
      return d;
    }

    // Un pont entre deux moments du cours. « [01-12] texte » vise une leçon, « [02] texte » un module :
    // le lien s'affiche quand la cible est ouverte, sinon seulement son nom.
    function bridgeCard(cls, label, src) {
      const m = /^\[([\w-]+)\]\s*/.exec(src);
      const target = m && (byId(m[1]) || C.modules.find(x => x.id === m[1]));
      let link = "";
      if (target && target.type) {
        const where = `${modName(modOf(target))} · ${itemLabel(target)} : ${target.title}`;
        link = `<a class="bridge" href="#/l/${target.id}">${esc(where)} →</a>`;
      } else if (target) {
        const nm = modName(target) === target.title ? target.title : modName(target) + " · " + target.title;
        link = `<span class="bridge small">Bientôt · ${esc(nm)}</span>`;
      }
      return card(cls, `<span class="lab">${label}</span><p>${mdInline(m ? src.slice(m[0].length) : src)}</p>${link}`);
    }

    async function stepDiscover(box) {
      const rev = await revisionCard(it);
      if (token !== routeToken) return;
      if (rev) box.appendChild(rev);
      if (ov.brief) mdCard(box, "chal brief", "L'essentiel en français", ov.brief);
      listItems(ov.declic).forEach(t => box.appendChild(bridgeCard("chal declic", "Ah, c'est donc ça !", t)));
      const vids = it.videos || [];
      vids.filter(v => !v.optional).forEach(v => { const vb = card("video", ""); box.appendChild(vb); mountVideo(vb, v); });
      listItems(ov.codespaces).forEach(t => box.appendChild(card("tip", `<b>Codespaces</b><span>${mdInline(t)}</span>`)));
      listItems(ov.verified).forEach(t => box.appendChild(card("upd", `<b>Vérifié</b><span>${mdInline(t)}</span>`)));
      if (course) {
        const c = card("coursetext", `<div class="ct-h"><span class="lab">${it.src ? "Le texte du cours (en anglais) · tape les commandes toi-même dans ton Codespace" : "La leçon"}</span>${it.src ? `<a class="small" href="${GH}/blob/${REPO.branch}/${it.src}" target="_blank" rel="noopener">Voir sur GitHub</a>` : ""}</div><div class="md"></div>`);
        renderMd($(".md", c), course, base, { dropTitle: true });
        box.appendChild(c);
        renderMermaid(c);
      }
      listItems(ov.teaser).forEach(t => box.appendChild(bridgeCard("chal teaser", "Tu le reverras", t)));
      vids.filter(v => v.optional).forEach(v => {
        const d = doc.createElement("details");
        d.className = "optvideo";
        d.innerHTML = `<summary>Pour aller plus loin, si tu as le temps : ${esc(v.label)}</summary><div class="video"></div>`;
        box.appendChild(d);
        d.addEventListener("toggle", () => { if (d.open && !$(".player", d)) mountVideo($(".video", d), v); });
      });
      box.appendChild(nextBtn(steps.length > 1 ? "J'ai regardé et lu, je passe à la suite" : "Terminer", 0));
    }

    function stepPredict(box) {
      const c = mdCard(box, "chal", "Prédis d'abord", ov.predict);
      const t = area("predict", "", "Ta prédiction en une ou deux phrases, et pourquoi. Pas de mauvaise réponse ici : c'est l'effort qui compte.", 15);
      c.appendChild(t);
      const ok = doc.createElement("button");
      ok.className = "btn";
      ok.textContent = "Valider ma prédiction";
      c.appendChild(ok);
      const ans = card("reveal", `<span class="lab">La réponse</span><div class="md"></div>
        <p class="small">Si tu peux, vérifie dans ton terminal avant de continuer.</p>
        <div class="selfrate"><span>Tu avais vu juste ?</span><button class="btn ghost sm" data-ok="1">Oui</button><button class="btn ghost sm" data-ok="0">Pas vraiment</button></div>`);
      renderMd($(".md", ans), ov["predict-answer"] || "", base);
      ans.hidden = !st.predictShown;
      box.appendChild(ans);
      ok.addEventListener("click", () => {
        st.predictShown = true; save(); ans.hidden = false;
        ans.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      });
      $$("[data-ok]", ans).forEach(b => b.addEventListener("click", () => { st.predictOk = b.dataset.ok === "1"; advance(steps.indexOf("predict")); }));
    }

    function stepPractice(box) {
      const c = mdCard(box, "chal", "À toi de jouer", ov.practice);
      const cons = listItems(ov.constraints);
      if (cons.length) c.insertAdjacentHTML("beforeend", `<p class="small">Ton résultat doit respecter :</p><ul class="checks">${cons.map(x => `<li><span>${mdInline(x)}</span></li>`).join("")}</ul>`);
      if (ov.team) box.appendChild(card("teamc", `<b>Travail en équipe</b><span>${mdInline(ov.team)}</span>`));
      // Le chemin, étape par étape : ce qu'on fait, pourquoi, un exemple, puis ta commande.
      if (ov.guide) mdCard(c, "guide", "Pas à pas", ov.guide);
      const t = it.prose ? area("attempt", "", "Ton texte, ici ou dans ton Codespace puis collé ici.", 25)
        : area("attempt", "mono", "Ton essai : les commandes, le code ou le fichier que tu as écrits dans ton Codespace.", 25);
      c.appendChild(t);
      const hb = hintBox(listItems(ov.hints), "hints", "Un indice");
      c.appendChild(hb);
      c.appendChild(stuckBox("Pratiquer", ov.practice, () => st.attempt));
      const reveal = doc.createElement("button");
      reveal.className = "btn";
      reveal.textContent = "J'ai essayé : comparer avec la solution";
      c.appendChild(reveal);
      c.insertAdjacentHTML("beforeend", `<p class="small">Essaie d'abord : tu retiens beaucoup mieux ce que tu as cherché toi-même.</p>`);
      // Un geste Git appris au moment où l'exercice en a besoin.
      if (ov.git) {
        const g = mdCard(box, "chal gitsit", "Git en situation", ov.git);
        st.githints = st.githints || 0;
        g.appendChild(hintBox(listItems(ov["git-hints"]), "githints", "Un indice"));
      }

      const sol = doc.createElement("div");
      sol.className = "solwrap";
      sol.hidden = !st.revealed;
      box.appendChild(sol);
      if (ov.solution) mdCard(sol, "chal sol", "Une solution possible · compare-la avec la tienne, ligne par ligne", ov.solution);

      let verifyOk = !it.verify || st.verifyOk || st.verifyErr;
      if (it.verify) {
        const v = card("chal verify", `<span class="lab">Vérification sur ton fork</span><p>Le site va lire ton fork <a href="${GH}" target="_blank" rel="noopener">${REPO.owner}/${REPO.name}</a> pour vérifier ton travail.</p><ul class="vres"></ul><div><button class="btn dark sm">Vérifier</button></div>`);
        const out = $(".vres", v), vb = $("button", v);
        vb.addEventListener("click", async () => {
          vb.disabled = true; vb.textContent = "Vérification…";
          try {
            const r = await VERIFY[it.verify]();
            out.innerHTML = r.checks.map(x => `<li class="${x.ok ? (x.warn ? "warn" : "ok") : "ko"}">${x.ok ? (x.warn ? "⚠️" : "✅") : "❌"} ${esc(x.text)}</li>`).join("");
            st.verifyOk = r.checks.every(x => x.ok);
            if (!st.verifyOk) out.insertAdjacentHTML("beforeend", `<li class="small">Corrige, pousse, puis revérifie. GitHub peut mettre quelques minutes à servir la nouvelle version.</li>`);
          } catch (e) {
            st.verifyErr = true;
            out.innerHTML = `<li class="warn">⚠️ Je n'ai pas pu vérifier (${esc(e.message)}). Fais la vérification à la main avec la liste ci-dessous.</li>`;
          }
          save();
          verifyOk = st.verifyOk || st.verifyErr;
          vb.disabled = false; vb.textContent = "Revérifier";
          update();
        });
        sol.appendChild(v);
      }
      const checks = listItems(ov.selfcheck);
      const sc = card("chal", `<span class="lab">Ça marche si…</span><div class="scl">${checks.map((x, i) => `<label class="opt sc"><input type="checkbox" data-i="${i}" ${st.checks[i] ? "checked" : ""}><span>${mdInline(x)}</span></label>`).join("")}</div>`);
      sol.appendChild(sc);
      const done = nextBtn("Exercice terminé, je passe à la suite", steps.indexOf("practice"));
      sol.appendChild(done);
      function update() {
        const all = checks.every((_, i) => st.checks[i]);
        done.title = all && verifyOk ? "" : "Conseil : coche chaque point et lance la vérification avant de passer à la suite";
      }
      $$("input[type=checkbox]", sc).forEach(cb => cb.addEventListener("change", () => { st.checks[cb.dataset.i] = cb.checked; save(); update(); }));
      update();

      reveal.addEventListener("click", () => {
        st.revealed = true; save(); sol.hidden = false;
        sol.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    }

    function stepBreakfix(box) {
      const c = mdCard(box, "chal", "Casse et répare", ov.breakfix);
      c.appendChild(hintBox(listItems(ov["breakfix-hints"]), "bfHints", "Un indice"));
      const t = area("bf", "", "Ce qui s'est passé, la cause, et comment tu as réparé.", 40);
      c.appendChild(t);
      c.appendChild(stuckBox("Casser et réparer", ov.breakfix, () => st.bf));
      const ok = doc.createElement("button");
      ok.className = "btn";
      ok.textContent = "Voir l'explication";
      c.appendChild(ok);
      const ans = card("reveal", `<span class="lab">L'explication</span><div class="md"></div>`);
      renderMd($(".md", ans), ov["breakfix-answer"] || "", base);
      ans.hidden = !st.bfShown;
      ans.appendChild(nextBtn("Continuer", steps.indexOf("breakfix")));
      box.appendChild(ans);
      ok.addEventListener("click", () => {
        st.bfShown = true; save(); ans.hidden = false;
        ans.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      });
    }

    function stepExplain(box) {
      const c = mdCard(box, "chal", "Explique avec tes mots", ov.explain);
      const t = area("explain", "big", "Deux ou trois phrases, sans relire le cours. Si tu bloques, c'est le signe qu'il faut revoir un passage.", EXPLAIN_MIN);
      c.appendChild(t);
      const count = doc.createElement("p");
      count.className = "small";
      c.appendChild(count);
      const fin = doc.createElement("button");
      fin.className = "btn";
      fin.textContent = "Terminer la leçon ✓";
      c.appendChild(fin);
      const upd = () => { const n = (t.value || "").trim().length; count.textContent = n >= EXPLAIN_MIN ? `${n} caractères · c'est bon` : `${n} caractères · deux ou trois phrases, c'est l'idéal`; };
      t.addEventListener("change-len", upd);
      upd();
      fin.addEventListener("click", () => {
        markDone(it.id);
        st.step = steps.length;
        st.justDone = true;
        save();
        $("#lnav").innerHTML = itemNav(it);
        $(".curr").outerHTML = curriculum(mod, it);
        go(steps.length);
        celebrate(doneCount(mod.items) === mod.items.length);
      });
    }

    function stepSummary(box) {
      const next = ITEMS[idx(it.id) + 1];
      const md = doneCount(mod.items), all = doneCount();
      const modDone = md === mod.items.length;
      const fresh = st.justDone;
      if (fresh) { delete st.justDone; save(); }
      const nextLabel = next && next.type === "lesson" ? `${itemLabel(next)} suivante` : next ? `Ensuite, ${itemLabel(next).toLowerCase()}` : "";
      const title = fresh && modDone ? `Module ${mod.id} validé.` : fresh ? "Bien joué." : "Leçon déjà terminée.";
      const c = card("donec", `<span class="lab">Leçon terminée</span><h2>${title}</h2>
        ${fresh && modDone && next ? `<p>Tout le module ${mod.id} est fait. Place au module suivant.</p>` : ""}
        <div class="donestats">
          <div><strong>${md}<small> / ${mod.items.length}</small></strong><span>étapes du module ${mod.id}</span></div>
          <div><strong>${Math.round(all / ITEMS.length * 100)}<small> %</small></strong><span>du cours prêt</span></div>
          ${remaining(mod.items) ? `<div><strong>${esc(fmtMin(remaining(mod.items)))}</strong><span>environ, pour finir le module</span></div>` : ""}
        </div>
        ${st.explain ? `<p class="small">Ton explication :</p><blockquote>${esc(st.explain)}</blockquote>
        <div class="row"><button class="btn ghost sm" id="copy-exp">Copier mon explication, pour la partager ou la faire relire</button></div>` : ""}
        ${all % 5 === 0 && fresh ? `<div class="tip"><b>Sauvegarde</b><span>${all} étapes faites : c'est le bon moment pour <a href="#/progression">exporter ta progression</a> dans un fichier. Elle n'est gardée que dans ce navigateur.</span></div>` : ""}
        ${next ? `<p>${next.min ? `La suite prend ${esc(dur(next))}. ` : ""}Tu peux enchaîner, ou t'arrêter ici : le bouton Continuer, en haut, te ramènera au bon endroit.</p>
          <div><a class="btn" href="#/l/${next.id}">${nextLabel} : ${esc(next.title)} <span class="arr">→</span></a></div>`
          : `<p>C'est la dernière étape guidée pour l'instant. Les modules suivants sont déjà lisibles : leur cours officiel, avec les vidéos, est sur la page de chaque module.</p>`}
        <p class="small">Tu peux revenir sur chaque étape avec la barre du haut.</p>`);
      box.appendChild(c);
      const cp = $("#copy-exp", c);
      if (cp) cp.addEventListener("click", async () => {
        const text = `Leçon « ${it.title} » (module ${mod.id}). Voici mon explication, pose-moi des questions dessus :\n\n${st.explain}`;
        try { await navigator.clipboard.writeText(text); flash(cp, "Copié ✓"); } catch (e) { flash(cp, "Copie impossible : sélectionne le texte"); }
      });
    }

    renderSteps();
    renderStep();
  }

  function renderResources(it, ov, meta) {
    const links = listItems(ov.resources).map(l => {
      const m = l.match(/^\[(.+?)\]\((.+?)\)/);
      return m ? { t: m[1], u: m[2], s: new URL(m[2]).hostname.replace(/^www\./, "") } : null;
    }).filter(Boolean);
    if (it.src) links.unshift({ t: "La leçon dans ton fork", u: `${GH}/blob/${REPO.branch}/${it.src}`, s: "GitHub" });
    (it.videos || []).forEach(v => links.push({ t: "Vidéo : " + v.label, u: "https://www.youtube.com/watch?v=" + v.yt, s: "YouTube" }));
    links.push({ t: "La FAQ du cours", u: C.faq, s: "erreurs fréquentes" });
    if (it.src) links.push({ t: "Les notes de la communauté", u: `${GH}/tree/${REPO.branch}/${it.src.split("/")[0]}#community-notes`, s: "README du module" });
    $("#resbox").innerHTML = links.map(l => `<a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)} <span>${esc(l.s)}</span></a>`).join("");
  }

  async function checkHash(it, rawText, token) {
    if (!it.hash) return;
    const h = await sha256(rawText);
    if (!h) return;
    const changed = h.slice(0, 8) !== it.hash;
    if (changed !== !!S.maj[it.id]) { if (changed) S.maj[it.id] = true; else delete S.maj[it.id]; save(); }
    if (changed && token === routeToken) {
      $("#majbox").innerHTML = `<div class="upd"><b>Leçon modifiée</b><span>Le cours officiel a changé cette leçon depuis que j'ai écrit ses exercices. Le texte affiché est la nouvelle version, mais les exercices peuvent ne plus correspondre exactement. Dis-le-moi dans ton projet Claude et je les mets à jour.</span></div>`;
    }
  }

  // Une pluie de petits carrés aux couleurs du site, à la fin d'une leçon. Rien si tu as réduit les animations.
  function celebrate(big) {
    if (reduce) return;
    const cv = doc.createElement("canvas");
    cv.className = "confetti";
    cv.setAttribute("aria-hidden", "true");
    doc.body.appendChild(cv);
    const d = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    const x = cv.getContext("2d");
    x.scale(d, d);
    const COLS = ["#146ef5", "#ff6b2c", "#ee4fb6", "#c6f432", "#1fae5b"];
    const ps = Array.from({ length: big ? 170 : 90 }, () => ({
      x: W / 2 + (Math.random() - .5) * W * .35, y: H * .4,
      vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 5,
      s: 5 + Math.random() * 6, c: COLS[Math.floor(Math.random() * COLS.length)]
    }));
    const t0 = performance.now(), LIFE = big ? 2.4 : 1.7;
    (function frame(t) {
      const k = (t - t0) / 1000;
      x.clearRect(0, 0, W, H);
      x.globalAlpha = Math.max(0, 1 - k / LIFE);
      ps.forEach(p => { p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.s, p.s); });
      if (k < LIFE) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  function flash(btn, msg) {
    const old = btn.innerHTML;
    btn.textContent = msg;
    setTimeout(() => { if (btn.isConnected) btn.innerHTML = old; }, 1800);
  }

  /* ---------- homework ---------- */

  function parseHomework(src) {
    const sections = [];
    let cur = { title: "", lines: [] }, fence = false;
    src.split("\n").forEach(l => {
      if (/^(```|~~~)/.test(l)) fence = !fence;
      if (!fence && /^## /.test(l)) { sections.push(cur); cur = { title: l.slice(3).trim(), lines: [] }; }
      else cur.lines.push(l);
    });
    sections.push(cur);
    const intro = sections.shift();
    const questions = [];
    let ctx = []; // les sections entre deux questions servent de contexte à la suivante
    sections.forEach(s => {
      const m = s.title.match(/^Question\s+(\d+)\.?\s*(.*)$/i);
      if (!m) { ctx.push(s); return; }
      const opts = [], text = [];
      let f = false;
      s.lines.forEach(l => {
        if (/^(```|~~~)/.test(l)) f = !f;
        if (!f && /^- /.test(l)) opts.push(l.slice(2).trim());
        else text.push(l);
      });
      questions.push({ n: +m[1], title: m[2], text: text.join("\n").trim(), opts, ctx });
      ctx = [];
    });
    return { intro: intro.lines.join("\n"), questions, outro: ctx };
  }

  async function viewHomework(it) {
    const token = routeToken;
    const mod = modOf(it);
    const H = S.hw[it.id] = Object.assign({ cur: 1, q: {} }, S.hw[it.id]);
    app.innerHTML = `<section class="gut"><div class="max">
      <div class="hwtop"><nav class="crumbs"><a href="#/">Accueil</a><span>/</span><a href="#/m/${mod.id}">Module ${mod.id} · ${esc(mod.title)}</a><span>/</span><span>Homework</span></nav>
      <span class="eyebrow">Module ${mod.id} · Homework de la cohorte 2026</span><h1>${esc(it.title.replace(/^Homework \d+ : /, ""))}</h1><div class="md lead2" id="hwintro"></div><div id="majbox"></div></div>
      <div class="hw"><article class="q" id="qcard"><p class="small">Chargement…</p></article><aside><div class="qlist" id="qlist"></div><div id="hwend"></div></aside></div>
      <div class="lnav" id="lnav">${itemNav(it)}</div>
    </div></section>`;
    let ov, hw, base = ROOT + it.src;
    try {
      ov = parseOverlay(await getText(it.overlay));
      const rawText = await getText(base);
      hw = parseHomework(frontMatter(rawText).body);
      checkHash(it, rawText, token);
    } catch (e) {
      if (token === routeToken) $("#qcard").innerHTML = `<div class="upd"><b>Erreur</b><span>Je n'arrive pas à charger le homework (${esc(e.message)}).</span></div>`;
      return;
    }
    if (token !== routeToken) return;
    renderMd($("#hwintro"), ov.intro || "", base);
    const Q = hw.questions;
    const qs = n => H.q[n] = Object.assign({ choice: null, other: "", how: "", hints: 0 }, H.q[n]);
    const isQDone = n => { const q = H.q[n]; return q && (q.choice != null || q.other.trim()) && q.how.trim().length >= 30; };

    function renderList() {
      $("#qlist").innerHTML = Q.map(q => `<button class="${q.n === H.cur ? "on" : ""}" data-q="${q.n}">${q.n}. ${esc(shortTitle(q.title))} <span class="s">${isQDone(q.n) ? "✓ fait" : "à faire"}</span></button>`).join("");
      $$("#qlist [data-q]").forEach(b => b.addEventListener("click", () => { H.cur = +b.dataset.q; save(); renderQ(); renderList(); }));
      const all = Q.every(q => isQDone(q.n));
      const end = $("#hwend");
      if (isDone(it.id)) {
        end.innerHTML = `<div class="donec small-card"><span class="lab">Homework terminé</span><div class="md" id="hwsubmit"></div></div>`;
        renderMd($("#hwsubmit"), ov.submit || "", base);
      } else {
        end.innerHTML = `<button class="btn" id="hwdone">Terminer le homework ✓</button><p class="small">${all ? "Toutes les questions sont faites." : "Conseil : pour chaque question, une réponse et ton raisonnement."}</p>`;
        $("#hwdone").addEventListener("click", () => { markDone(it.id); $("#lnav").innerHTML = itemNav(it); renderList(); renderOutro(); celebrate(false); });
      }
    }
    function shortTitle(t) { return t.replace(/^Understanding /i, "").replace(/ and docker-compose/i, ""); }
    function renderOutro() {
      if (!isDone(it.id) || !hw.outro.length) return;
      const box = doc.createElement("div");
      box.className = "chal";
      box.innerHTML = `<span class="lab">Apprendre en public</span><div class="md"></div>`;
      renderMd($(".md", box), hw.outro.filter(s => !/Submitting/i.test(s.title)).map(s => "## " + s.title + "\n" + s.lines.join("\n")).join("\n\n"), base);
      $("#qcard").appendChild(box);
    }
    function renderQ() {
      const q = Q.find(x => x.n === H.cur) || Q[0];
      const s = qs(q.n);
      const hints = listItems(ov["q" + q.n]);
      const card = $("#qcard");
      card.innerHTML = `<span class="eyebrow">Question ${q.n} sur ${Q.length}</span><h2>${esc(q.title)}</h2>
        <div class="ctxs"></div>
        <div class="md qtext"></div>
        <div class="opts">${q.opts.map((o, i) => `<label class="opt"><input type="radio" name="q${q.n}" value="${i}" ${s.choice === i ? "checked" : ""}><span>${mdInline(o)}</span></label>`).join("")}
          <label class="opt other"><span>Autre réponse :</span><input type="text" class="otherin" value="${esc(s.other)}" placeholder="si ta valeur n'est dans aucun choix"></label></div>
        <label class="howl"><span class="lab">Comment tu as trouvé</span><textarea class="mono how" placeholder="Ta commande, ta requête SQL ou ton raisonnement. C'est la partie la plus importante.">${esc(s.how)}</textarea></label>
        <div class="hints"></div>
        <div class="row"><button class="btn ghost sm hintbtn"></button><button class="btn dark nextq">Question suivante <span class="arr">→</span></button></div>
        <p class="small">Jamais de réponse ici, seulement des indices de plus en plus précis.</p>`;
      q.ctx.forEach(cx => {
        const c = doc.createElement("details");
        c.className = "ctx";
        c.open = !isQDone(q.n);
        c.innerHTML = `<summary>Avant cette question : ${esc(cx.title)}</summary><div class="md"></div>`;
        renderMd($(".md", c), cx.lines.join("\n"), base);
        const extra = /prepare/i.test(cx.title) ? listItems(ov.data) : [];
        if (extra.length) c.insertAdjacentHTML("beforeend", `<div class="hintlist">${extra.map(h => `<div class="hintc"><b>Aide</b><span>${mdInline(h)}</span></div>`).join("")}</div>`);
        $(".ctxs", card).appendChild(c);
      });
      renderMd($(".qtext", card), q.text, base);
      const hb = $(".hintbtn", card), hout = $(".hints", card);
      const showH = () => {
        hout.innerHTML = hints.slice(0, s.hints).map((h, i) => `<div class="hintc"><b>${i + 1}/${hints.length}</b><span>${mdInline(h)}</span></div>`).join("");
        hb.disabled = s.hints >= hints.length;
        hb.textContent = s.hints >= hints.length ? "Plus d'indice" : `Un indice (${s.hints}/${hints.length})`;
        hb.hidden = !hints.length;
      };
      hb.addEventListener("click", () => { s.hints++; save(); showH(); });
      showH();
      $$("input[type=radio]", card).forEach(r => r.addEventListener("change", () => { s.choice = +r.value; save(); renderList(); }));
      $(".otherin", card).addEventListener("input", e => { s.other = e.target.value; saveSoon(); renderList(); });
      $(".how", card).addEventListener("input", e => { s.how = e.target.value; saveSoon(); renderList(); });
      const nq = $(".nextq", card);
      const after = Q[Q.indexOf(q) + 1];
      if (!after) nq.hidden = true;
      nq.addEventListener("click", () => {
        if (!isQDone(q.n)) { flash(nq, "Il manque ta réponse ou ton raisonnement"); return; }
        H.cur = after.n; save(); renderQ(); renderList(); window.scrollTo(0, 0);
      });
      renderMermaid(card);
      renderOutro();
    }
    renderQ();
    renderList();
  }

  /* ---------- défi ---------- */

  async function viewDefi(it) {
    const token = routeToken;
    const mod = modOf(it);
    const st = S.les[it.id] = Object.assign({ hints: 0 }, S.les[it.id]);
    app.innerHTML = `<section class="gut"><div class="max lesson">
      <div class="lmain">
        <nav class="crumbs"><a href="#/">Accueil</a><span>/</span><a href="#/m/${mod.id}">Module ${mod.id} · ${esc(mod.title)}</a><span>/</span><span>Défi</span></nav>
        <div class="defihero"><span class="lab light">Défi sans guide · niveau d'aide minimal</span><div class="md" id="defibody"></div></div>
        <div id="defimore"></div>
        <div class="lnav" id="lnav">${itemNav(it)}</div>
      </div>
      ${curriculum(mod, it)}
    </div></section>`;
    let ov;
    try { ov = parseOverlay(await getText(it.overlay)); }
    catch (e) { return; }
    if (token !== routeToken) return;
    const base = new URL(it.overlay, location.href).href;
    renderMd($("#defibody"), ov.body, base);
    const more = $("#defimore");
    more.innerHTML = `
      ${ov.team ? `<div class="teamc"><b>Travail en équipe</b><span>${mdInline(ov.team)}</span></div>` : ""}
      <div class="chal"><span class="lab">Le script de vérification</span><p>Il est dans ton fork : <a href="${GH}/blob/${REPO.branch}/${it.script}" target="_blank" rel="noopener">${esc(it.script)}</a>. Lis-le avant de le lancer : c'est une bonne habitude avec n'importe quel script.</p></div>
      <div class="chal" id="hintsbox"><span class="lab">Si tu es vraiment bloqué</span></div>
      <div class="chal codebox"><span class="lab">Ton code de réussite</span>
        ${isDone(it.id) ? `<p class="okmsg">✅ Défi validé. Bravo : tu l'as fait sans guide.</p>` : `<div class="row"><input type="text" id="code" placeholder="8 caractères" maxlength="16" autocomplete="off" spellcheck="false"><button class="btn" id="codeok">Valider le défi</button></div><p class="small" id="codemsg"></p><button class="btn ghost sm" id="skipdefi">Marquer comme fait sans le code</button>`}
      </div>`;
    const hints = listItems(ov.hints);
    const hw = doc.createElement("div");
    hw.innerHTML = `<div class="hints"></div><button class="btn ghost sm"></button>`;
    const hb = $("button", hw), out = $(".hints", hw);
    const show = () => {
      out.innerHTML = hints.slice(0, st.hints).map((h, i) => `<div class="hintc"><b>${i + 1}/${hints.length}</b><span>${mdInline(h)}</span></div>`).join("");
      hb.disabled = st.hints >= hints.length;
      hb.textContent = st.hints >= hints.length ? "Plus d'indice" : `Un indice (${st.hints}/${hints.length})`;
    };
    hb.addEventListener("click", () => { st.hints++; save(); show(); });
    show();
    $("#hintsbox").appendChild(hw);
    const ok = $("#codeok");
    if (ok) ok.addEventListener("click", async () => {
      const v = $("#code").value.trim().toLowerCase();
      const h = await sha256(v);
      if (h && h === it.codeHash) {
        markDone(it.id);
        viewDefi(it);
        celebrate(doneCount(mod.items) === mod.items.length);
      } else {
        $("#codemsg").textContent = "Ce n'est pas le bon code. Relance le script : il n'affiche le code que quand toutes les vérifications sont vertes.";
      }
    });
    const skip = $("#skipdefi");
    if (skip) skip.addEventListener("click", () => { markDone(it.id); viewDefi(it); });
  }

  /* ---------- comment ça marche ---------- */

  function viewMethod() {
    app.innerHTML = `
    <section class="howhero gut"><div class="max in">
      <span class="mono-tag">Comment ça marche</span>
      <h1>Le cours dans ton navigateur. Le code dans ton Codespace.</h1>
      <p>Je construis le site de cours. Toi, tu construis tout ce qui fait partie du métier, avec des exercices guidés puis de moins en moins guidés.</p>
    </div></section>
    <section class="gut" style="padding-block:40px 120px"><div class="max" style="display:grid;gap:28px">
      <div class="flow" aria-label="Schéma">
        <svg viewBox="0 0 980 250" role="img" aria-label="Le repo officiel alimente ton fork chaque nuit ; ton fork alimente ton site de cours et ton Codespace">
          <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>
          <g font-family="Geist, Arial, sans-serif" font-size="15">
            <rect x="10" y="80" width="190" height="90" rx="12" fill="var(--bg-2)" stroke="var(--line)"/>
            <text x="105" y="118" text-anchor="middle" font-weight="700" fill="var(--ink)">Repo officiel</text>
            <text x="105" y="142" text-anchor="middle" font-size="13" fill="var(--muted)">DataTalksClub</text>
            <rect x="290" y="80" width="190" height="90" rx="12" fill="var(--blue)"/>
            <text x="385" y="118" text-anchor="middle" font-weight="700" fill="#fff">Ton fork</text>
            <text x="385" y="142" text-anchor="middle" font-size="13" fill="rgba(255,255,255,.85)">${esc(REPO.owner)}</text>
            <rect x="580" y="14" width="390" height="96" rx="12" fill="var(--bg)" stroke="var(--line)"/>
            <text x="600" y="50" font-weight="700" fill="var(--ink)">Ton site de cours (GitHub Pages)</text>
            <text x="600" y="74" font-size="13" fill="var(--muted)">${esc(REPO.owner)}.github.io/${esc(REPO.name)}</text>
            <text x="600" y="94" font-size="13" fill="var(--muted)">leçons, vidéos, exercices, progression</text>
            <rect x="580" y="140" width="390" height="96" rx="12" fill="#0a0a0a"/>
            <text x="600" y="176" font-weight="700" fill="#fff">VS Code sur ton PC + Codespace</text>
            <text x="600" y="200" font-size="13" fill="#bdbdbd">la machine de GitHub fait tourner Docker</text>
            <text x="600" y="220" font-size="13" fill="#bdbdbd">ton code va dans mon-travail/</text>
            <path d="M200 125H286" stroke="var(--muted)" stroke-width="2" fill="none" marker-end="url(#ar)"/>
            <text x="243" y="112" text-anchor="middle" font-size="12" fill="var(--muted)">chaque nuit</text>
            <path d="M480 112 C 530 80, 540 62, 576 62" stroke="var(--muted)" stroke-width="2" fill="none" marker-end="url(#ar)"/>
            <text x="520" y="70" text-anchor="middle" font-size="12" fill="var(--muted)">publie</text>
            <path d="M480 138 C 530 170, 540 188, 576 188" stroke="var(--muted)" stroke-width="2" fill="none" marker-end="url(#ar)"/>
            <text x="520" y="196" text-anchor="middle" font-size="12" fill="var(--muted)">git pull</text>
          </g>
        </svg>
      </div>

      <div class="phase">
        <div class="ph"><span class="who you">TOI · COMMENT TU APPRENDS</span><h2>Pas de copier-coller</h2><p>Tu réfléchis, tu te trompes, tu cherches. L'aide diminue au fil des modules, comme au travail.</p></div>
        <div style="display:grid;gap:12px">
          <div class="principles">
            <div class="pr-c"><b>1. Découvrir</b><span>La vidéo et le texte de la leçon. Tu tapes le code en même temps que le formateur, c'est la méthode du Zoomcamp.</span></div>
            <div class="pr-c"><b>2. Prédire</b><span>Une question avant les commandes clés. Tu vérifies ensuite dans ton terminal.</span></div>
            <div class="pr-c"><b>3. Pratiquer</b><span>Un objectif et des contraintes, différents de la leçon. La solution s'affiche après ton essai.</span></div>
            <div class="pr-c"><b>4. Casser et réparer</b><span>Une vraie erreur à provoquer et à comprendre. Plusieurs viennent de vrais défauts du cours.</span></div>
            <div class="pr-c"><b>5. Expliquer</b><span>Quelques lignes avec tes mots. Envoie-les-moi : je te questionne jusqu'à ce que ce soit solide.</span></div>
            <div class="pr-c"><b>Révisions et défis</b><span>D'anciennes questions reviennent, et des encadrés « Ah, c'est donc ça ! » relient une leçon à ce que tu as vu avant. À la fin de chaque module, un défi sans guide sur d'autres données, vérifié par un script.</span></div>
          </div>
          <div class="fade"><b>Le niveau d'aide au fil du cours</b><div class="bar"></div><div class="lbls"><span>Modules 0 à 2 : indices partout</span><span>Modules 3 à 5 : objectifs et indices sur demande</span><span>6, 7, projet : objectifs seulement</span></div></div>
        </div>
      </div>

      <div class="phase">
        <div class="ph"><span class="who you">TOI · L'ORDRE</span><h2>Tout est ouvert</h2><p>Un ordre conseillé, aucune porte fermée. Pas de date limite : tu avances à ton rythme.</p></div>
        <ol class="steps">
          <li><div><h4>Un ordre conseillé</h4><p>Le bouton Continuer te mène à la prochaine étape non faite. Tu peux aussi ouvrir n'importe quel module pour te faire une idée de la suite.</p></div></li>
          <li><div><h4>Valider un module</h4><p>Toutes ses leçons, son homework et son défi. Personne ne t'y oblige : c'est ton tableau de bord.</p></div></li>
          <li><div><h4>Ta progression est dans ton navigateur</h4><p>Sur la page Ma progression, tu peux l'exporter dans un fichier et la reprendre sur un autre ordinateur.</p></div></li>
        </ol>
      </div>

      <div class="phase">
        <div class="ph"><span class="who you">TOI · CHAQUE SÉANCE</span><h2>Ta routine</h2><p>Environ une minute de mise en route.</p></div>
        <ol class="steps">
          <li><div><h4>Ouvre le site et ton Codespace</h4><p>Dans VS Code : Remote Explorer, puis GitHub Codespaces, puis ton Codespace.</p><div class="split"><div class="mini"><b>Un écran</b>Le site : vidéo, leçon, exercices</div><div class="mini"><b>L'autre écran</b>VS Code : terminal et code</div></div></div></li>
          <li><div><h4>Récupère les nouveautés</h4><p><code>git pull</code> dans le terminal. Le site signale les leçons modifiées par le cours avec un badge MAJ.</p></div></li>
          <li><div><h4>Une leçon, dans l'ordre</h4><p>Regarde, prédis, écris le code toi-même, casse, répare, explique.</p></div></li>
          <li><div><h4>Pousse ton travail et arrête le Codespace</h4><p>Ton code dans <code>mon-travail/</code>, puis <code>git push</code>. Arrête le Codespace pour garder tes heures gratuites.</p></div></li>
        </ol>
      </div>

      <div class="phase">
        <div class="ph"><span class="who me">TOI ET MOI · TRAVAIL EN ÉQUIPE</span><h2>Comme dans une vraie équipe</h2><p>Pour ton PFE : Git à plusieurs, les revues de code, l'intégration et le déploiement continus.</p></div>
        <ol class="steps">
          <li><div><h4>Branches, pull requests et conflits <span class="lvl">MODULE 0</span></h4><p>Chaque tâche sur sa branche, fusionnée par une pull request. Tu provoques et tu résous un vrai conflit.</p></div></li>
          <li><div><h4>Je relis tes pull requests <span class="lvl">MODULE 0, 1 ET SUIVANTS</span></h4><p>Tu m'envoies le lien : je fais une revue avec des commentaires sur des lignes précises, comme un collègue.</p></div></li>
          <li><div><h4>Issues et automatisation <span class="lvl">MODULES 0 ET 1</span></h4><p>Une issue fermée par ta PR, un workflow GitHub Actions qui synchronise ton fork et redéploie ton site.</p></div></li>
          <li><div><h4>Intégration continue <span class="lvl">MODULE 4</span></h4><p>Tes tests dbt tournent tout seuls à chaque pull request.</p></div></li>
          <li><div><h4>Déploiement continu <span class="lvl">PROJET</span></h4><p>Terraform appliqué par GitHub Actions, un Makefile, et un README propre.</p></div></li>
        </ol>
      </div>
    </div></section>`;
  }

  /* ---------- ma progression ---------- */

  function viewProgress() {
    const journal = ITEMS.filter(i => i.type === "lesson" && isDone(i.id) && S.les[i.id] && S.les[i.id].explain)
      .sort((a, b) => (S.doneAt[b.id] || 0) - (S.doneAt[a.id] || 0));
    app.innerHTML = `<section class="gut"><div class="max progpage">
      <div class="hwtop"><span class="eyebrow">Ta progression est gardée dans ce navigateur</span><h1>Ma progression</h1></div>
      ${statRow()}
      <div class="progmods">${C.modules.map(m => {
        const n = m.items.length, d = doneCount(m.items);
        return `<div class="pm"><span class="num">${m.id}</span><div><b>${esc(m.title)}</b><div class="track"><b style="width:${n ? Math.round(d / n * 100) : 0}%"></b></div></div><span class="small">${n ? d + " / " + n : "bientôt"}</span></div>`;
      }).join("")}</div>
      <div class="sh"><div><span class="eyebrow">Tes explications, de la plus récente à la plus ancienne</span><h2>Mon journal</h2></div></div>
      ${journal.length ? `<div class="journal">${journal.map(i => `<article><span class="eyebrow">Module ${i.module} · ${esc(i.title)}</span><p>${esc(S.les[i.id].explain)}</p></article>`).join("")}</div>`
        : `<p class="small">Tes explications de fin de leçon apparaîtront ici. C'est une bonne base pour tes posts « learning in public ».</p>`}
      <div class="sh" style="margin-top:48px"><div><span class="eyebrow">Pour changer d'ordinateur ou de navigateur</span><h2>Sauvegarde</h2></div></div>
      <div class="row">
        <button class="btn" id="exp">Exporter ma progression</button>
        <label class="btn ghost" for="imp">Importer une sauvegarde</label><input type="file" id="imp" accept="application/json" hidden>
        <button class="btn ghost" id="reset">Tout recommencer</button>
      </div>
      <p class="small" id="savemsg"></p>
    </div></section>`;
    $("#exp").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      const a = doc.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mon-zoomcamp-progression.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $("#imp").addEventListener("change", async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data.done) throw new Error("ce fichier ne ressemble pas à une sauvegarde");
        askInline($("#savemsg"), "Remplacer ta progression actuelle par celle du fichier ?", "Remplacer", () => {
          S = Object.assign(blank(), data); save(); viewProgress();
          $("#savemsg").textContent = "Progression importée.";
        });
      } catch (err) { $("#savemsg").textContent = "Import impossible : " + err.message; }
      e.target.value = "";
    });
    $("#reset").addEventListener("click", () => {
      askInline($("#savemsg"), "Effacer toute ta progression dans ce navigateur ? Exporte-la d'abord si tu veux la garder.", "Tout effacer", () => {
        S = blank(); save(); viewProgress();
        $("#savemsg").textContent = "Progression effacée.";
      });
    });
  }

  // Confirmation dans la page : certains navigateurs intégrés bloquent confirm().
  function askInline(box, text, yesLabel, onYes) {
    box.innerHTML = `${esc(text)} <button class="btn sm" data-a="yes">${esc(yesLabel)}</button> <button class="btn sm ghost" data-a="no">Annuler</button>`;
    box.querySelector('[data-a="yes"]').addEventListener("click", onYes);
    box.querySelector('[data-a="no"]').addEventListener("click", () => { box.textContent = ""; });
  }

  /* ---------- au démarrage ---------- */

  async function loadMe() {
    try {
      let t = embedded("moi.json");
      if (t == null) {
        const r = await fetch("moi.json", { cache: "no-cache" });
        if (!r.ok) return;
        t = await r.text();
      }
      try { ME = JSON.parse(t) || {}; }
      catch (e) {
        console.error("site/moi.json n'est pas un JSON valide :", e.message);
        $("#banner").innerHTML = `<div class="gut"><div class="max"><b>site/moi.json est invalide.</b> Ouvre la console du navigateur (F12) pour voir l'erreur.</div></div>`;
        $("#banner").hidden = false;
      }
    } catch (e) { /* pas de moi.json */ }
  }

  async function syncStatus() {
    const pill = $("#syncp");
    const key = "mzc.sync";
    let data = null;
    try { data = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (e) { /* rien */ }
    if (!data || Date.now() - data.t > 15 * 60 * 1000) {
      try {
        const u = C.upstream;
        const r = await api(`repos/${u.owner}/${u.name}/compare/${u.branch}...${REPO.owner}:${REPO.name}:${REPO.branch}`);
        if (!r) return;
        data = { t: Date.now(), behind: r.behind_by };
        try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* rien */ }
      } catch (e) { return; }
    }
    pill.hidden = false;
    pill.href = GH;
    if (data.behind > 0) { pill.classList.add("late"); pill.innerHTML = `<i></i>Fork en retard de ${data.behind} commit${data.behind > 1 ? "s" : ""}`; pill.title = "Synchronise ton fork (module 0, leçon 6)"; }
    else { pill.innerHTML = "<i></i>Fork à jour"; pill.title = "Ton fork a tous les commits du repo officiel"; }
  }

  addEventListener("hashchange", onRoute);
  loadMe().then(onRoute);
  syncStatus();
})();

// Bouton FR ⇄ EN : inverse la langue de chaque morceau de texte affiché.
// Un paragraphe en français passe en anglais, un paragraphe en anglais passe en français.
// Le code (pre, code, kbd), les diagrammes et les champs où tu écris ne sont jamais touchés.
// Rien n'est modifié dans les fichiers du site : les nœuds d'origine sont gardés de côté
// et remis tels quels quand tu rappuies sur le bouton.
// Traducteur : Google Traduction, sinon celui intégré au navigateur (Chrome, Edge) s'il existe.
(function () {
  "use strict";
  const KEY = "mzc.lang";
  const SKIP = "pre,script,style,svg,textarea,input,select,iframe,canvas,video,.mermaid,.yt,.player,[data-notr],#langbtn";
  const KEEP = "code,kbd,samp,img,br,i.oi,.ico";  // gardés tels quels au milieu d'une phrase
  const INLINE = new Set("B STRONG EM I U MARK SUB SUP CODE KBD SAMP ABBR SMALL SPAN A IMG BR S DEL INS Q CITE VAR".split(" "));
  const BLOCKY = "div,p,ul,ol,li,table,pre,section,article,header,footer,h1,h2,h3,h4,h5,h6,blockquote,details,summary,figure,nav,form,button";
  const FR = new Set("le la les un une des du de au aux et est sont pour dans que qui pas ne avec sur tu te ton ta tes toi vous votre ce cette ces il elle on nous mais ou donc car quand comme plus très tout tous fait faire être avoir ma mon mes je leçon voici puis si alors aussi encore déjà après avant chaque".split(" "));
  const EN = new Set("the a an and is are to of in for you your with this that it on be as by from at or not can will we our they their what which when if then there these those has have was were how use using into each run all also more than here its so do does".split(" "));

  let active = false, observer = null, timer = 0, busy = false, again = false, btn;
  const swapped = new Map();   // élément parent -> [{ orig: [nœuds], repl: [nœuds] }]
  const done = new WeakSet();  // nœuds créés par la traduction (à ne pas retraduire)
  const cache = new Map();     // "fr>en|texte" -> traduction

  function guess(text) {
    const words = text.toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœ']+/g) || [];
    let fr = 0, en = 0;
    for (const w0 of words) {
      const w = w0.replace(/^[a-z]+'/, "");
      if (FR.has(w)) fr++;
      if (EN.has(w)) en++;
      if (/[àâçéèêëîïôùûœ]/.test(w)) fr += 0.5;
      if (/^(l|d|j|n|qu|c|s|t)'/.test(w0)) fr++;
    }
    if (fr === en) return null;
    return fr > en ? "fr" : "en";
  }

  const isText = n => n.nodeType === 3;
  const hasWords = s => /[A-Za-zÀ-ÿ]{2,}/.test(s);
  const skipEl = el => el.matches(SKIP);
  const inlineEl = el => INLINE.has(el.tagName) && !el.matches(SKIP) && !el.querySelector(BLOCKY);

  // Découpe la page en « unités » : une suite de texte et d'éléments en ligne (gras, lien, code…)
  // qui forme une phrase ou un paragraphe, traduite d'un seul coup pour garder le sens.
  function collect() {
    const units = [];
    const roots = [document.querySelector("header.top"), document.getElementById("banner"), document.getElementById("app")].filter(Boolean);
    const flush = (parent, run) => {
      if (!run.length) return;
      const own = run.some(n => isText(n) && hasWords(n.nodeValue));
      const els = run.filter(n => !isText(n));
      if (!own && els.length > 1) { els.forEach(e => !e.matches(KEEP) && walk(e)); return; }   // ex. une barre de liens
      if (!own && els.length === 1) { if (!els[0].matches(KEEP)) walk(els[0]); return; }
      const txt = run.map(n => isText(n) ? n.nodeValue : n.matches(KEEP) ? "" : n.textContent).join(" ");
      if (!hasWords(txt)) return;
      units.push({ parent, nodes: run.slice(), text: txt });
    };
    const walk = el => {
      if (done.has(el)) return;
      let run = [];
      for (const c of [...el.childNodes]) {
        if (done.has(c)) { flush(el, run); run = []; continue; }
        if (isText(c)) { run.push(c); continue; }
        if (c.nodeType !== 1) continue;
        if (skipEl(c)) { flush(el, run); run = []; continue; }
        if (c.matches(KEEP) || inlineEl(c)) { run.push(c); continue; }
        flush(el, run); run = [];
        walk(c);
      }
      flush(el, run);
    };
    roots.forEach(walk);
    // Langue de chaque unité. Une unité trop courte pour deviner prend la langue de la précédente.
    let fr = 0, en = 0, last = null;
    for (const u of units) { u.lang = guess(u.text); if (u.lang === "fr") fr++; else if (u.lang === "en") en++; }
    const major = fr >= en ? "fr" : "en";
    for (const u of units) { if (u.lang) last = u.lang; else u.lang = last || major; u.to = u.lang === "fr" ? "en" : "fr"; }
    return units;
  }

  // Unité -> texte avec balises numérotées : <x0/> pour un bout de code, <a1>…</a1> pour du gras ou un lien.
  function encode(u) {
    const parts = [];
    const ser = nodes => nodes.map(n => {
      if (isText(n)) return n.nodeValue.replace(/[<>]/g, " ").replace(/\s+/g, " ");
      const k = parts.length; parts.push(n);
      if (n.matches(KEEP)) return "<x" + k + "/>";
      return "<a" + k + ">" + ser([...n.childNodes]) + "</a" + k + ">";
    }).join("");
    u.src = ser(u.nodes).trim();
    u.parts = parts;
  }

  // Texte traduit -> nouveaux nœuds. null si une balise s'est perdue en route.
  function decode(u, tr) {
    const used = new Set();
    const build = (s) => {
      const out = [];
      const re = /<\s*x\s*(\d+)\s*\/?\s*>|<\s*a\s*(\d+)\s*>([\s\S]*?)<\s*\/\s*a\s*\2\s*>/g;
      let i = 0, m;
      while ((m = re.exec(s))) {
        if (m.index > i) out.push(document.createTextNode(s.slice(i, m.index)));
        const k = +(m[1] || m[2]), src = u.parts[k];
        if (!src || used.has(k)) return null;
        used.add(k);
        if (m[1] !== undefined) out.push(src.cloneNode(true));
        else {
          const e = src.cloneNode(false);
          const kids = build(m[3]);
          if (!kids) return null;
          kids.forEach(x => e.appendChild(x));
          out.push(e);
        }
        i = re.lastIndex;
      }
      if (i < s.length) out.push(document.createTextNode(s.slice(i)));
      return out;
    };
    const out = build(tr.replace(/\s+/g, " "));
    if (!out || used.size !== u.parts.length) return null;
    if (out.some(n => isText(n) && /<\s*\/?\s*[ax]\s*\d/.test(n.nodeValue))) return null;
    // garde les espaces au début et à la fin, pour ne pas coller les mots voisins
    const first = u.nodes[0], last = u.nodes[u.nodes.length - 1];
    if (isText(first) && /^\s/.test(first.nodeValue)) out.unshift(document.createTextNode(" "));
    if (isText(last) && /\s$/.test(last.nodeValue)) out.push(document.createTextNode(" "));
    return out;
  }

  // --- Traducteurs ---
  const browserTr = {};
  async function viaBrowser(from, to, texts) {
    if (!("Translator" in self)) return null;
    const d = from + ">" + to;
    try {
      if (!browserTr[d]) {
        const ok = await self.Translator.availability({ sourceLanguage: from, targetLanguage: to });
        if (ok === "unavailable") return null;
        browserTr[d] = self.Translator.create({ sourceLanguage: from, targetLanguage: to });
      }
      const t = await browserTr[d];
      const out = [];
      for (const s of texts) out.push(await t.translate(s));
      return out;
    } catch (e) { browserTr[d] = null; return null; }
  }
  async function viaGoogle(from, to, texts) {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + from + "&tl=" + to + "&q=" + encodeURIComponent(texts.join("\n"));
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const lines = (j[0] || []).map(s => s[0] || "").join("").split("\n");
    if (lines.length === texts.length) return lines;
    if (texts.length === 1) return [lines.join(" ")];
    const res = [];   // découpage différent : une ligne à la fois
    for (const t of texts) res.push((await viaGoogle(from, to, [t]))[0]);
    return res;
  }
  const timeout = (ms, pr) => Promise.race([pr, new Promise(r => setTimeout(() => r(null), ms))]);
  async function translateAll(from, to, texts) {
    try { return await viaGoogle(from, to, texts); }
    catch (e) {
      const r = await timeout(20000, viaBrowser(from, to, texts));   // plan B : traducteur du navigateur
      if (r) return r;
      throw e;
    }
  }

  async function fill(units) {
    const todo = new Map();
    for (const u of units) {
      encode(u);
      u.key = u.lang + ">" + u.to + "|" + u.src;
      if (!cache.has(u.key)) {
        const d = u.lang + ">" + u.to;
        if (!todo.has(d)) todo.set(d, new Set());
        todo.get(d).add(u.src);
      }
    }
    for (const [d, set] of todo) {
      const [from, to] = d.split(">");
      let batch = [], size = 0;
      const flush = async () => {
        if (!batch.length) return;
        const res = await translateAll(from, to, batch);
        batch.forEach((t, i) => cache.set(d + "|" + t, res[i] || t));
        batch = []; size = 0;
      };
      for (const t of set) {
        if (size + t.length > 1500) await flush();
        batch.push(t); size += t.length + 1;
      }
      await flush();
    }
  }

  // Une balise perdue : on retombe sur une traduction morceau par morceau (le code reste intact).
  async function fallbackNodes(u) {
    const texts = [];
    const walkT = n => { if (isText(n)) { if (hasWords(n.nodeValue)) texts.push(n); } else if (!n.matches(KEEP)) n.childNodes.forEach(walkT); };
    u.nodes.forEach(walkT);
    const srcs = texts.map(n => n.nodeValue.replace(/\s+/g, " ").trim());
    const res = await translateAll(u.lang, u.to, srcs);
    const map = new Map(texts.map((n, i) => [n, res[i] || srcs[i]]));
    const clone = n => {
      if (isText(n)) {
        if (!map.has(n)) return n.cloneNode();
        const v = n.nodeValue;
        return document.createTextNode(v.match(/^\s*/)[0] + map.get(n) + v.match(/\s*$/)[0]);
      }
      if (n.matches(KEEP)) return n.cloneNode(true);
      const e = n.cloneNode(false);
      n.childNodes.forEach(c => e.appendChild(clone(c)));
      return e;
    };
    return u.nodes.map(clone);
  }

  async function apply(units) {
    const ready = [];
    for (const u of units) {
      let repl = decode(u, cache.get(u.key) || u.src);
      if (!repl) { try { repl = await fallbackNodes(u); } catch (e) { continue; } }
      ready.push([u, repl]);
    }
    if (!active) return;
    observer && observer.disconnect();
    for (const [u, repl] of ready) {
      if (!u.nodes.every(n => n.parentNode === u.parent)) continue;   // la page a changé entre-temps
      const ph = document.createComment("lang");
      u.parent.insertBefore(ph, u.nodes[0]);
      u.nodes.forEach(n => n.remove());
      repl.forEach(n => { done.add(n); u.parent.insertBefore(n, ph); });
      ph.remove();
      if (!swapped.has(u.parent)) swapped.set(u.parent, []);
      swapped.get(u.parent).push({ orig: u.nodes, repl });
    }
    watch();
  }

  async function pass() {
    if (!active) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      for (const p of [...swapped.keys()]) if (!p.isConnected) swapped.delete(p);
      const units = collect();
      if (units.length) { await fill(units); await apply(units); }
      setBtn();
    } catch (e) {
      setBtn("Traduction impossible");
      console.warn("Traduction :", e);
    } finally {
      busy = false;
      if (again && active) { again = false; pass(); }
    }
  }

  function watch() {
    if (!observer) observer = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(pass, 120); });
    for (const el of [document.querySelector("header.top"), document.getElementById("banner"), document.getElementById("app")])
      if (el) observer.observe(el, { childList: true, subtree: true, characterData: true });
  }

  function restore() {
    observer && observer.disconnect();
    clearTimeout(timer);
    for (const [parent, list] of swapped) {
      for (const { orig, repl } of list.reverse()) {
        if (!repl.length || !repl.every(n => n.parentNode === parent)) continue;
        parent.insertBefore(document.createComment(""), repl[0]);
        const ph = repl[0].previousSibling;
        repl.forEach(n => n.remove());
        orig.forEach(n => parent.insertBefore(n, ph));
        ph.remove();
      }
    }
    swapped.clear();
  }

  function setBtn(msg) {
    if (!btn) return;
    const label = msg || (active ? "↺ Original" : "FR ⇄ EN");
    if (btn.textContent === label && btn.classList.contains("on") === active) return;
    btn.classList.toggle("on", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.textContent = label;
    btn.title = active ? "Revenir au texte d'origine" : "Passer chaque texte dans l'autre langue (français ⇄ anglais)";
  }

  function set(on) {
    active = on;
    try { on ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch (e) {}
    if (on) { setBtn("Traduction…"); pass(); watch(); }
    else { restore(); setBtn(); }
  }

  function init() {
    const box = document.querySelector("header.top .in");
    if (!box) return;
    btn = document.createElement("button");
    btn.id = "langbtn";
    btn.type = "button";
    btn.className = "langbtn";
    btn.addEventListener("click", () => { if (!busy || active) set(!active); });
    // Sur téléphone, le bouton flotte en bas à droite pour ne pas décaler l'en-tête.
    const mq = matchMedia("(max-width:520px)");
    const place = () => mq.matches ? document.body.appendChild(btn) : box.insertBefore(btn, document.getElementById("continue"));
    place();
    mq.addEventListener ? mq.addEventListener("change", place) : mq.addListener(place);
    setBtn();
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === "1") setTimeout(() => set(true), 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

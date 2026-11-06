// Labo Git : un vrai petit Git simulé dans la page. Tu tapes les commandes, le dessin se construit à côté.
// L'idée du graphe et des niveaux vient de Learn Git Branching (Peter Cottle, licence MIT).
// Le moteur est écrit pour ce cours : il montre aussi les fichiers, la zone de préparation,
// GitHub, l'ordinateur d'un collègue et les pull requests, que Learn Git Branching ne montre pas.
// Une leçon le déclare dans sa section « @@ labo » : du JSON { niveaux: [ { titre, intro, postes, depart, buts, indices, solution } ] }.
// Un niveau marqué « bonus: true » est facultatif : il se range après les niveaux essentiels.
(function () {
  "use strict";

  /* ================= le moteur (aucun accès à la page) ================= */

  const WHO = {
    moi: { name: "Toi", user: "toi", mail: "toi@exemple.com", title: "Ton ordinateur" },
    collegue: { name: "Sam", user: "sam", mail: "sam@exemple.com", title: "L'ordinateur de Sam, ton collègue" }
  };
  const URL_GH = "https://github.com/toi/projet.git";
  const SHORT_GH = "github.com/toi/projet";

  function hash40(s) {
    let out = "";
    for (let k = 0; k < 5; k++) {
      let h = 0x811c9dc5 ^ (k * 0x9e3779b1);
      const t = k + "|" + s;
      for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); }
      h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
      out += (h >>> 0).toString(16).padStart(8, "0");
    }
    return out;
  }
  const short = id => id ? id.slice(0, 7) : "";
  const lines = t => !t ? [] : t.replace(/\n$/, "").split("\n");
  const unlines = a => a.length ? a.join("\n") + "\n" : "";
  const clone = o => JSON.parse(JSON.stringify(o));
  const keys = o => Object.keys(o || {});
  const union = (...os) => [...new Set(os.flatMap(keys))].sort();

  function newState(postes) {
    const S = { commits: {}, n: 0, cur: "moi", m: {}, gh: null, typed: [], log: [] };
    S.m.moi = newMachine("moi");
    if (postes.includes("collegue")) S.m.collegue = newMachine("collegue");
    if (postes.includes("github")) S.gh = { branches: {}, prs: [], protect: false };
    return S;
  }
  function newMachine(k) { return { k, files: {}, dirs: [], repo: null, cfg: { "user.name": WHO[k].name, "user.email": WHO[k].mail } }; }
  function newRepo(branch) { return { index: {}, branches: {}, head: { b: branch || "main" }, remotes: {}, track: {}, up: {}, merge: null, prev: null }; }

  const headId = r => r.head.b ? (r.branches[r.head.b] || null) : r.head.d;
  const treeOf = (S, id) => id ? S.commits[id].t : {};

  function ancestors(S, id) {
    const seen = new Set(), st = id ? [id] : [];
    while (st.length) { const c = st.pop(); if (seen.has(c)) continue; seen.add(c); S.commits[c].p.forEach(p => st.push(p)); }
    return seen;
  }
  const isAnc = (S, a, b) => !a || (!!b && ancestors(S, b).has(a));
  function mergeBase(S, a, b) {
    const A = ancestors(S, a);
    let best = null;
    ancestors(S, b).forEach(c => { if (A.has(c) && (!best || S.commits[c].n > S.commits[best].n)) best = c; });
    return best;
  }

  // Une référence : HEAD, HEAD~2, main, main^, origin/main, ou le début d'un identifiant de commit.
  function resolve(S, mc, ref, gh) {
    if (!ref) return null;
    const m = /^(.*?)((?:[~^]\d*)*)$/.exec(ref);
    let base = m[1], id = null;
    const r = mc && mc.repo;
    if (gh) id = S.gh.branches[base] || null;
    else if (base === "HEAD" || base === "@") id = r && headId(r);
    else if (r && r.branches[base]) id = r.branches[base];
    else if (r && r.track[base]) id = r.track[base];
    else if (r && /^remotes\//.test(base) && r.track[base.slice(8)]) id = r.track[base.slice(8)];
    if (!id && /^[0-9a-f]{4,40}$/.test(base)) {
      const hits = keys(S.commits).filter(c => c.startsWith(base));
      if (hits.length === 1) id = hits[0];
    }
    if (!id) return null;
    const ops = m[2].match(/[~^]\d*/g) || [];
    for (const op of ops) {
      const n = op.length > 1 ? +op.slice(1) : 1;
      if (op[0] === "~") { for (let i = 0; i < n; i++) { id = S.commits[id].p[0]; if (!id) return null; } }
      else { id = S.commits[id].p[n - 1]; if (!id) return null; }
    }
    return id;
  }

  /* ---- .gitignore ---- */
  function ignoreRules(files) {
    const t = files[".gitignore"];
    return t ? lines(t).map(l => l.trim()).filter(l => l && !l.startsWith("#")) : [];
  }
  function globRe(g) { return g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]").replace(/\u0000/g, ".*"); }
  function isIgnored(path, rules) {
    let ign = false;
    for (let rule of rules) {
      const neg = rule.startsWith("!");
      if (neg) rule = rule.slice(1);
      let hit;
      if (rule.endsWith("/")) {
        const d = rule.slice(0, -1).replace(/^\//, "");
        const re = new RegExp("(^|/)" + globRe(d) + "/");
        hit = re.test(path);
      } else if (rule.replace(/^\//, "").includes("/")) {
        hit = new RegExp("^" + globRe(rule.replace(/^\//, "")) + "(/|$)").test(path);
      } else {
        hit = new RegExp("(^|/)" + globRe(rule) + "(/|$)").test(path);
      }
      if (hit) ign = !neg;
    }
    return ign;
  }

  function status(S, mc) {
    const r = mc.repo, H = treeOf(S, headId(r)), I = r.index, W = mc.files, rules = ignoreRules(W);
    const conflicts = r.merge ? r.merge.conflicts : [];
    const staged = [], unstaged = [], untracked = [], ignored = [];
    union(H, I).forEach(p => {
      if (conflicts.includes(p) || H[p] === I[p]) return;
      staged.push({ p, k: !(p in H) ? "new" : !(p in I) ? "deleted" : "modified" });
    });
    keys(I).sort().forEach(p => {
      if (conflicts.includes(p)) return;
      if (!(p in W)) unstaged.push({ p, k: "deleted" });
      else if (W[p] !== I[p]) unstaged.push({ p, k: "modified" });
    });
    keys(W).sort().forEach(p => {
      if (p in I || conflicts.includes(p)) return;
      (isIgnored(p, rules) ? ignored : untracked).push(p);
    });
    return { staged, unstaged, untracked, ignored, conflicts, rules };
  }

  /* ---- diff et fusion ligne à ligne ---- */
  function diffOps(a, b) {
    const n = a.length, m = b.length, dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { ops.push({ o: "=", a: i, b: j }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ o: "-", a: i }); i++; }
      else { ops.push({ o: "+", b: j }); j++; }
    }
    while (i < n) ops.push({ o: "-", a: i++ });
    while (j < m) ops.push({ o: "+", b: j++ });
    return ops;
  }
  function hunks(a, b) {
    const out = [];
    let i = 0, cur = null;
    diffOps(a, b).forEach(op => {
      if (op.o === "=") { if (cur) { out.push(cur); cur = null; } i++; return; }
      if (!cur) cur = { s: i, e: i, add: [] };
      if (op.o === "-") { i++; cur.e = i; } else cur.add.push(b[op.b]);
    });
    if (cur) out.push(cur);
    return out;
  }
  function merge3(base, ours, theirs, lo, lt) {
    const B = lines(base), O = lines(ours), T = lines(theirs);
    const all = [...hunks(B, O).map(h => ({ ...h, side: "o" })), ...hunks(B, T).map(h => ({ ...h, side: "t" }))].sort((x, y) => x.s - y.s || x.e - y.e);
    const groups = [];
    all.forEach(h => {
      const g = groups[groups.length - 1];
      if (g && h.s <= g.e) { g.hs.push(h); g.e = Math.max(g.e, h.e); g.sides.add(h.side); }
      else groups.push({ s: h.s, e: h.e, hs: [h], sides: new Set([h.side]) });
    });
    const apply = (g, side) => {
      const out = [];
      let i = g.s;
      g.hs.filter(h => h.side === side).forEach(h => { out.push(...B.slice(i, h.s), ...h.add); i = h.e; });
      out.push(...B.slice(i, g.e));
      return out;
    };
    const res = [];
    let i = 0, conflict = false;
    groups.forEach(g => {
      res.push(...B.slice(i, g.s));
      if (g.sides.size === 1) res.push(...apply(g, g.hs[0].side));
      else {
        const o = apply(g, "o"), t = apply(g, "t");
        if (o.join("\n") === t.join("\n")) res.push(...o);
        else { conflict = true; res.push("<<<<<<< " + lo, ...o, "=======", ...t, ">>>>>>> " + lt); }
      }
      i = g.e;
    });
    res.push(...B.slice(i));
    return { text: unlines(res), conflict };
  }
  function mergeTrees(bT, oT, tT, lo, lt) {
    const tree = {}, conflicts = [], notes = [];
    union(bT, oT, tT).forEach(p => {
      const b = bT[p], o = oT[p], t = tT[p];
      if (o === t) { if (o !== undefined) tree[p] = o; return; }
      if (o === b) { if (t !== undefined) tree[p] = t; return; }
      if (t === b) { if (o !== undefined) tree[p] = o; return; }
      if (o === undefined || t === undefined) {
        tree[p] = o === undefined ? t : o;
        conflicts.push(p);
        notes.push(`CONFLICT (modify/delete): ${p} deleted in ${o === undefined ? "HEAD" : lt} and modified in ${o === undefined ? lt : "HEAD"}.`);
        return;
      }
      const m = merge3(b || "", o, t, lo, lt);
      tree[p] = m.text;
      notes.push("Auto-merging " + p);
      if (m.conflict) { conflicts.push(p); notes.push("CONFLICT (content): Merge conflict in " + p); }
    });
    return { tree, conflicts, notes };
  }
  function statLines(S, fromT, toT) {
    let files = 0, ins = 0, del = 0;
    const extra = [];
    union(fromT, toT).forEach(p => {
      if (fromT[p] === toT[p]) return;
      files++;
      diffOps(lines(fromT[p]), lines(toT[p])).forEach(o => { if (o.o === "+") ins++; if (o.o === "-") del++; });
      if (!(p in fromT)) extra.push(" create mode 100644 " + p);
      if (!(p in toT)) extra.push(" delete mode 100644 " + p);
    });
    const parts = [` ${files} file${files > 1 ? "s" : ""} changed`];
    if (ins) parts.push(`${ins} insertion${ins > 1 ? "s" : ""}(+)`);
    if (del) parts.push(`${del} deletion${del > 1 ? "s" : ""}(-)`);
    return [parts.join(", "), ...extra];
  }
  function diffText(p, a, b, out) {
    if (a === b) return;
    out(`diff --git a/${p} b/${p}`, "dim");
    if (a === undefined) out("new file mode 100644", "dim");
    if (b === undefined) out("deleted file mode 100644", "dim");
    out(`--- ${a === undefined ? "/dev/null" : "a/" + p}`, "dim");
    out(`+++ ${b === undefined ? "/dev/null" : "b/" + p}`, "dim");
    const A = lines(a), B = lines(b);
    out(`@@ -1,${A.length} +1,${B.length} @@`, "hash");
    diffOps(A, B).forEach(o => { if (o.o === "=") out(" " + A[o.a]); else if (o.o === "-") out("-" + A[o.a], "del"); else out("+" + B[o.b], "add"); });
  }

  /* ---- les commandes ---- */
  function tokenize(line) {
    const out = [];
    let cur = "", q = null, has = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === q) q = null;
        else if (c === "\\" && q === '"' && i + 1 < line.length) cur += line[++i];
        else cur += c;
        continue;
      }
      if (c === "'" || c === '"') { q = c; has = true; continue; }
      if (/\s/.test(c)) { if (cur || has) out.push(cur); cur = ""; has = false; continue; }
      if (c === ">") { if (cur || has) out.push(cur); cur = ""; has = false; if (line[i + 1] === ">") { out.push(">>"); i++; } else out.push(">"); continue; }
      cur += c;
    }
    if (cur || has) out.push(cur);
    return out;
  }
  function splitChain(line) {
    const parts = [];
    let cur = "", q = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === q) q = null; cur += c; continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === ";" || (c === "&" && line[i + 1] === "&")) { parts.push(cur); cur = ""; if (c === "&") i++; continue; }
      cur += c;
    }
    parts.push(cur);
    return parts.map(s => s.trim()).filter(Boolean);
  }

  const FR = "fr";
  const KNOWN = "ls, cat, echo … > fichier, touch, rm, mv, mkdir, clear, git init, status, add, commit, log, diff, show, restore, rm, reset, revert, branch, switch, checkout, merge, clone, remote, push, fetch, pull, config, gh pr create / list / review / merge";

  function makeCommit(S, mc, msg, parents) {
    const r = mc.repo;
    const id = hash40([S.n, msg, parents.join(","), mc.cfg["user.name"], JSON.stringify(r.index)].join("|"));
    S.commits[id] = { id, p: parents, t: clone(r.index), msg, au: mc.cfg["user.name"], n: ++S.n };
    if (r.head.b) r.branches[r.head.b] = id; else r.head.d = id;
    return id;
  }

  function setWork(mc, fromT, toT) {
    const r = mc.repo;
    union(fromT, toT).forEach(p => {
      if (fromT[p] === toT[p]) return;
      if (p in toT) { mc.files[p] = toT[p]; r.index[p] = toT[p]; }
      else { delete mc.files[p]; delete r.index[p]; }
    });
  }
  function dirtyPaths(S, mc) {
    const st = status(S, mc);
    return new Set([...st.staged, ...st.unstaged].map(x => x.p));
  }

  function run(S, raw, out, opts = {}) {
    const mc = S.m[S.cur];
    const tok = tokenize(raw);
    if (!tok.length) return;
    let [cmd, ...a] = tok;
    if (cmd === "git" && a[0] && mc.cfg["alias." + a[0]]) a = [...tokenize(mc.cfg["alias." + a[0]]), ...a.slice(1)];
    const need = () => { if (!mc.repo) { out("fatal: not a git repository (or any of the parent directories): .git", "err"); out("↳ Ce dossier n'est pas (encore) un dépôt Git : commence par git init (ou git clone).", FR); return false; } return true; };
    const flag = (...f) => { const i = a.findIndex(x => f.includes(x)); if (i < 0) return false; a.splice(i, 1); return true; };
    const opt = (...f) => {
      for (let i = 0; i < a.length; i++) {
        for (const x of f) {
          if (a[i] === x && i + 1 < a.length) { const v = a[i + 1]; a.splice(i, 2); return v; }
          if (a[i].startsWith(x + "=")) { const v = a[i].slice(x.length + 1); a.splice(i, 1); return v; }
        }
      }
      return null;
    };

    switch (cmd) {
      case "clear": S.log = []; return;
      case "pwd": out(`/home/${WHO[mc.k].user}/projet`); return;
      case "aide": case "help": out("Le labo connaît : " + KNOWN, FR); return;
      case "cd": out("↳ Dans le labo, tu restes dans le dossier du projet. Pour l'autre ordinateur, clique sur l'onglet de son terminal.", FR); return;
      case "nano": case "vim": case "vi": case "code":
        out("↳ Pas d'éditeur dans le labo : écris avec echo 'texte' > fichier (remplace) ou echo 'texte' >> fichier (ajoute une ligne).", FR); return;
      case "ls": return cmdLs(S, mc, a, out);
      case "cat": return cmdCat(S, mc, a, out);
      case "echo": return cmdEcho(S, mc, a, out);
      case "touch": a.forEach(p => { if (!(p in mc.files)) mc.files[p] = ""; }); return;
      case "mkdir": a.filter(x => !x.startsWith("-")).forEach(d => { if (!mc.dirs.includes(d)) mc.dirs.push(d); }); return;
      case "mv": {
        const [x, y] = a;
        if (!(x in mc.files)) { out(`mv: cannot stat '${x}': No such file or directory`, "err"); return; }
        mc.files[y] = mc.files[x]; delete mc.files[x]; return;
      }
      case "rm": {
        const rec = flag("-r", "-rf", "-fr", "-R");
        flag("-f");
        a.forEach(p => {
          const pp = p.replace(/\/$/, "");
          if (pp === ".git") { if (!rec) { out("rm: cannot remove '.git': Is a directory", "err"); return; } mc.repo = null; out("↳ Le dossier .git est supprimé : tout l'historique a disparu. Tes fichiers, eux, sont toujours là.", FR); return; }
          if (pp in mc.files) { delete mc.files[pp]; return; }
          const under = keys(mc.files).filter(f => f.startsWith(pp + "/"));
          if (under.length || mc.dirs.includes(pp)) {
            if (!rec) { out(`rm: cannot remove '${p}': Is a directory`, "err"); return; }
            under.forEach(f => delete mc.files[f]); mc.dirs = mc.dirs.filter(d => d !== pp); return;
          }
          out(`rm: cannot remove '${p}': No such file or directory`, "err");
        });
        return;
      }
      case "gh": return cmdGh(S, mc, a, out, flag, opt);
      case "git": break;
      default:
        out(`${cmd}: command not found`, "err");
        out("↳ Le labo connaît : " + KNOWN, FR);
        return;
    }

    const sub = a.shift();
    switch (sub) {
      case undefined: out("usage: git <command> [<args>]"); return;
      case "init": {
        const b = opt("-b", "--initial-branch") || mc.cfg["init.defaultBranch"] || "main";
        if (mc.repo) { out(`Reinitialized existing Git repository in /home/${WHO[mc.k].user}/projet/.git/`); return; }
        mc.repo = newRepo(b);
        out(`Initialized empty Git repository in /home/${WHO[mc.k].user}/projet/.git/`);
        out("↳ Un dossier caché .git vient d'apparaître : c'est lui, le dépôt. Il est vide pour l'instant : aucun commit.", FR);
        return;
      }
      case "config": {
        flag("--global", "--local");
        if (flag("--list", "-l")) { keys(mc.cfg).sort().forEach(k => out(`${k}=${mc.cfg[k]}`)); return; }
        const [k, ...v] = a;
        if (!k) { out("usage: git config <name> [<value>]", "err"); return; }
        if (!v.length) { if (mc.cfg[k] !== undefined) out(mc.cfg[k]); return; }
        mc.cfg[k] = v.join(" ");
        return;
      }
      case "clone": return cmdClone(S, mc, a, out);
      case "help": out("Le labo connaît : " + KNOWN, FR); return;
    }
    if (!need()) return;
    const r = mc.repo;

    switch (sub) {
      case "status": return cmdStatus(S, mc, out);
      case "add": {
        const force = flag("-f", "--force");
        const all = flag("-A", "--all") || a.includes(".");
        const st = status(S, mc);
        const targets = all ? [...new Set([...keys(mc.files), ...keys(r.index)])] : [];
        if (!all) {
          if (!a.length) { out("Nothing specified, nothing added.", "err"); out("↳ Dis à Git quel fichier préparer : git add nom-du-fichier (ou git add . pour tout).", FR); return; }
          for (const p of a) {
            const pp = p.replace(/\/$/, "");
            const re = pp.includes("*") ? new RegExp("^" + globRe(pp) + "$") : null;
            const hit = [...new Set([...keys(mc.files), ...keys(r.index)])].filter(f => re ? re.test(f) : f === pp || f.startsWith(pp + "/"));
            if (!hit.length) { out(`fatal: pathspec '${p}' did not match any files`, "err"); return; }
            const ign = hit.filter(f => !(f in r.index) && isIgnored(f, st.rules));
            if (ign.length && !force && hit.length === ign.length) {
              out("The following paths are ignored by one of your .gitignore files:", "err"); ign.forEach(f => out(f, "err"));
              out("hint: Use -f if you really want to add them.", "dim");
              out("↳ Ton .gitignore protège ce fichier : Git refuse de le préparer. C'est voulu.", FR); return;
            }
            targets.push(...hit.filter(f => force || f in r.index || !isIgnored(f, st.rules)));
          }
        }
        targets.forEach(p => {
          if (p in mc.files) { if (p in r.index || force || !isIgnored(p, st.rules)) r.index[p] = mc.files[p]; }
          else delete r.index[p];
          if (r.merge) r.merge.conflicts = r.merge.conflicts.filter(c => c !== p);
        });
        return;
      }
      case "rm": {
        const cached = flag("--cached");
        flag("-r", "-f");
        for (const p of a) {
          if (!(p in r.index)) { out(`fatal: pathspec '${p}' did not match any files`, "err"); return; }
          delete r.index[p];
          if (!cached) delete mc.files[p];
          out(`rm '${p}'`);
        }
        return;
      }
      case "commit": {
        const amend = flag("--amend"), noEdit = flag("--no-edit");
        let all = flag("-a", "--all");
        let msg = opt("-m", "--message");
        const am = a.findIndex(x => x === "-am");
        if (am >= 0) { all = true; msg = a[am + 1]; a.splice(am, 2); }
        if (all) keys(r.index).forEach(p => { if (p in mc.files) r.index[p] = mc.files[p]; else delete r.index[p]; });
        const st = status(S, mc);
        if (r.merge && r.merge.conflicts.length) {
          out("error: Committing is not possible because you have unmerged files.", "err");
          out("hint: Fix them up in the work tree, and then use 'git add/rm <file>'", "dim");
          out("↳ Il reste un conflit : corrige le fichier (enlève les <<<<<<< ======= >>>>>>>), puis git add, puis git commit.", FR); return;
        }
        if (!msg && !noEdit && !(r.merge && !amend)) {
          out("↳ Dans le labo, écris toujours ton message avec -m : git commit -m \"ce que fait ce commit\". Dans ton Codespace, sans -m, Git ouvrirait un éditeur.", FR); return;
        }
        if (amend) {
          const h = headId(r);
          if (!h) { out("fatal: You have nothing to amend.", "err"); return; }
          const old = S.commits[h];
          const id = makeCommit(S, mc, msg || old.msg, old.p.slice());
          out(`[${r.head.b || "detached HEAD"} ${short(id)}] ${S.commits[id].msg}`);
          out("↳ Le dernier commit est remplacé par un nouveau (nouvel identifiant). L'ancien n'est plus sur ta branche.", FR);
          return;
        }
        if (!st.staged.length && !r.merge) {
          const b = r.head.b || "HEAD";
          out(`On branch ${b}`);
          if (st.unstaged.length) { out("Changes not staged for commit:"); st.unstaged.forEach(x => out(`\t${x.k}:   ${x.p}`, "del")); out('no changes added to commit (use "git add" and/or "git commit -a")'); out("↳ Rien n'est préparé : fais d'abord git add sur le fichier.", FR); }
          else if (st.untracked.length) { out("Untracked files:"); st.untracked.forEach(p => out("\t" + p, "del")); out('nothing added to commit but untracked files present (use "git add" to track)'); out("↳ Rien n'est préparé : fais d'abord git add sur le fichier.", FR); }
          else out("nothing to commit, working tree clean");
          return;
        }
        const before = treeOf(S, headId(r)), parents = headId(r) ? [headId(r)] : [];
        let m = msg;
        if (r.merge) { if (r.merge.kind === "merge") parents.push(r.merge.theirs); m = msg || r.merge.msg; }
        const root = !parents.length;
        const id = makeCommit(S, mc, m, parents);
        const wasMerge = r.merge && r.merge.kind === "merge";
        r.merge = null;
        out(`[${r.head.b || "detached HEAD"}${root ? " (root-commit)" : ""} ${short(id)}] ${m}`);
        statLines(S, before, S.commits[id].t).forEach(l => out(l));
        if (root) out("↳ Ton premier commit : un premier rond dans le dessin. La branche main pointe dessus.", FR);
        else if (wasMerge) out("↳ Le commit de fusion est créé : il a deux parents. Le conflit est réglé.", FR);
        return;
      }
      case "log": return cmdLog(S, mc, a, out, flag, opt);
      case "diff": {
        const staged = flag("--staged", "--cached");
        const W = mc.files, I = r.index, H = treeOf(S, headId(r));
        if (a.length >= 1) {
          let x, y;
          if (a.length === 1 && a[0].includes("..")) [x, y] = a[0].split("..");
          else [x, y] = a;
          const A = resolve(S, mc, x), B = y ? resolve(S, mc, y) : null;
          if (!A || (y && !B)) { out(`fatal: ambiguous argument '${a.join(" ")}': unknown revision`, "err"); return; }
          const tA = treeOf(S, A), tB = y ? treeOf(S, B) : W;
          union(tA, tB).forEach(p => diffText(p, tA[p], tB[p], out));
          return;
        }
        if (staged) union(H, I).forEach(p => diffText(p, H[p], I[p], out));
        else keys(I).sort().forEach(p => { if (p in W) diffText(p, I[p], W[p], out); else diffText(p, I[p], undefined, out); });
        return;
      }
      case "show": {
        const id = resolve(S, mc, a[0] || "HEAD");
        if (!id) { out(`fatal: ambiguous argument '${a[0]}': unknown revision`, "err"); return; }
        const c = S.commits[id];
        out(`commit ${id}${decorate(S, mc, id)}`, "hash");
        if (c.p.length > 1) out(`Merge: ${c.p.map(short).join(" ")}`);
        out(`Author: ${c.au}`); out(""); out("    " + c.msg); out("");
        const pt = treeOf(S, c.p[0]);
        if (!flag("--stat")) union(pt, c.t).forEach(p => diffText(p, pt[p], c.t[p], out));
        else statLines(S, pt, c.t).forEach(l => out(l));
        return;
      }
      case "restore": case "checkout": {
        if (sub === "checkout") {
          const dd = a.indexOf("--");
          const fileOnly = a.length === 1 && a[0] in r.index && !r.branches[a[0]] && !r.track["origin/" + a[0]] && !resolve(S, mc, a[0]);
          if (dd < 0 && !fileOnly) return cmdSwitch(S, mc, a, out, true, flag, opt);
          if (dd >= 0) a.splice(dd, 1);
        }
        const stagedOnly = flag("--staged", "-S");
        const src = opt("--source", "-s");
        const H = treeOf(S, headId(r));
        let paths = a.filter(x => x !== "--");
        if (paths.includes(".")) paths = union(mc.files, r.index);
        if (!paths.length) { out("fatal: you must specify path(s) to restore", "err"); return; }
        const srcT = src ? treeOf(S, resolve(S, mc, src)) : null;
        if (src && !resolve(S, mc, src)) { out(`fatal: could not resolve ${src}`, "err"); return; }
        for (const p of paths) {
          if (stagedOnly) { if (p in H) r.index[p] = H[p]; else delete r.index[p]; continue; }
          const from = srcT || r.index;
          if (!(p in from) && !(p in mc.files)) { out(`error: pathspec '${p}' did not match any file(s) known to git`, "err"); return; }
          if (p in from) mc.files[p] = from[p];
          else if (!(p in r.index)) continue;
          else delete mc.files[p];
        }
        return;
      }
      case "reset": {
        const mode = flag("--hard") ? "hard" : flag("--soft") ? "soft" : (flag("--mixed"), "mixed");
        const ref = a[0] && resolve(S, mc, a[0]);
        if (a[0] && !ref && mode === "mixed") {
          const H = treeOf(S, headId(r));
          a.forEach(p => { if (p in H) r.index[p] = H[p]; else delete r.index[p]; });
          return;
        }
        if (a[0] && !ref) { out(`fatal: ambiguous argument '${a[0]}': unknown revision`, "err"); return; }
        const target = ref || headId(r);
        const before = treeOf(S, headId(r)), T = treeOf(S, target), oldIndex = clone(r.index);
        if (r.head.b) r.branches[r.head.b] = target; else r.head.d = target;
        if (mode !== "soft") r.index = clone(T);
        if (mode === "hard") {
          union(before, T).forEach(p => { if (p in T) mc.files[p] = T[p]; else delete mc.files[p]; });
          keys(oldIndex).forEach(p => { if (!(p in T)) delete mc.files[p]; else mc.files[p] = T[p]; });
          r.merge = null;
          if (target) out(`HEAD is now at ${short(target)} ${S.commits[target].msg}`);
        } else if (mode === "mixed" && a[0]) out("Unstaged changes after reset:");
        return;
      }
      case "revert": {
        if (flag("--abort")) { if (!r.merge) { out("error: no revert in progress", "err"); return; } abortMerge(S, mc); return; }
        if (flag("--continue")) { run(S, "git commit --no-edit", out); return; }
        flag("--no-edit");
        const id = resolve(S, mc, a[0]);
        if (!id) { out(`fatal: bad revision '${a[0] || ""}'`, "err"); return; }
        if (dirtyPaths(S, mc).size) { out("error: your local changes would be overwritten by revert.", "err"); out("↳ Enregistre (commit) ou annule tes changements en cours avant.", FR); return; }
        const c = S.commits[id];
        if (c.p.length > 1) { out(`error: commit ${short(id)} is a merge but no -m option was given.`, "err"); return; }
        const res = mergeTrees(c.t, treeOf(S, headId(r)), treeOf(S, c.p[0]), "HEAD", `parent of ${short(id)} (${c.msg})`);
        const before = treeOf(S, headId(r));
        setWork(mc, before, res.tree);
        const m = `Revert "${c.msg}"`;
        if (res.conflicts.length) {
          res.conflicts.forEach(p => { if (p in before) r.index[p] = before[p]; else delete r.index[p]; });
          r.merge = { kind: "revert", conflicts: res.conflicts, msg: m };
          out(`error: could not revert ${short(id)}... ${c.msg}`, "err");
          out("hint: After resolving the conflicts, mark them with \"git add/rm <pathspec>\", then run \"git revert --continue\".", "dim");
          return;
        }
        const nid = makeCommit(S, mc, m, [headId(r)]);
        out(`[${r.head.b || "detached HEAD"} ${short(nid)}] ${m}`);
        statLines(S, before, res.tree).forEach(l => out(l));
        out("↳ Un NOUVEAU commit annule l'ancien. L'historique garde les deux : rien n'est effacé.", FR);
        return;
      }
      case "branch": {
        const del = flag("-d", "--delete") ? "d" : flag("-D") ? "D" : null;
        const mv = flag("-m", "-M");
        const all = flag("-a", "--all"), rem = flag("-r", "--remotes");
        flag("-v", "-vv");
        if (del) {
          for (const b of a) {
            if (!r.branches[b]) { out(`error: branch '${b}' not found`, "err"); return; }
            if (r.head.b === b) { out(`error: Cannot delete branch '${b}' checked out at '/home/${WHO[mc.k].user}/projet'`, "err"); return; }
            const upId = r.up[b] && r.track[r.up[b]];
            if (del === "d" && !isAnc(S, r.branches[b], headId(r)) && !(upId && isAnc(S, r.branches[b], upId))) {
              out(`error: The branch '${b}' is not fully merged.`, "err");
              out(`hint: If you are sure you want to delete it, run 'git branch -D ${b}'`, "dim");
              out("↳ Cette branche a des commits qui ne sont nulle part ailleurs : Git refuse de les perdre.", FR); return;
            }
            out(`Deleted branch ${b} (was ${short(r.branches[b])}).`);
            delete r.branches[b]; delete r.up[b];
          }
          return;
        }
        if (mv) {
          const [x, y] = a.length > 1 ? a : [r.head.b, a[0]];
          if (!y) { out("fatal: branch name required", "err"); return; }
          if (r.head.b === x) r.head.b = y;
          if (r.branches[x]) { r.branches[y] = r.branches[x]; delete r.branches[x]; }
          if (r.up[x]) { r.up[y] = r.up[x]; delete r.up[x]; }
          return;
        }
        if (!a.length) {
          const names = rem ? [] : keys(r.branches).sort();
          if (!rem && r.head.b && !r.branches[r.head.b] && !names.length) return;
          if (!r.head.b && !rem) out(`* (HEAD detached at ${short(r.head.d)})`, "ok");
          names.forEach(b => out((b === r.head.b ? "* " : "  ") + b, b === r.head.b ? "ok" : ""));
          if (all || rem) keys(r.track).sort().forEach(t => out("  " + (all ? "remotes/" : "") + t, "del"));
          return;
        }
        const [name, start] = a;
        if (!headId(r) && !start) { out(`fatal: not a valid object name: '${r.head.b}'`, "err"); out("↳ Il faut au moins un commit avant de créer une branche : une branche est une étiquette posée sur un commit.", FR); return; }
        if (r.branches[name]) { out(`fatal: a branch named '${name}' already exists`, "err"); return; }
        if (!validName(name)) { out(`fatal: '${name}' is not a valid branch name`, "err"); return; }
        const at = start ? resolve(S, mc, start) : headId(r);
        if (!at) { out(`fatal: not a valid object name: '${start}'`, "err"); return; }
        r.branches[name] = at;
        out(`↳ Nouvelle étiquette « ${name} » posée sur le commit ${short(at)}. Tu es toujours sur ${r.head.b || "HEAD"} : git switch ${name} pour y aller.`, FR);
        return;
      }
      case "switch": return cmdSwitch(S, mc, a, out, false, flag, opt);
      case "merge": {
        if (flag("--abort")) { if (!r.merge) { out("fatal: There is no merge to abort (MERGE_HEAD missing).", "err"); return; } abortMerge(S, mc); out("↳ Fusion annulée : tout est revenu comme avant le git merge.", FR); return; }
        if (flag("--continue")) { run(S, "git commit --no-edit", out); return; }
        const noff = flag("--no-ff");
        const m = opt("-m");
        flag("--no-edit");
        if (!a[0]) { out("fatal: No remote for the current branch.", "err"); return; }
        const id = resolve(S, mc, a[0]);
        if (!id) { out(`merge: ${a[0]} - not something we can merge`, "err"); return; }
        return doMerge(S, mc, id, a[0], out, { noff, msg: m });
      }
      case "remote": {
        if (a[0] === "add") {
          const [, name, url] = a;
          if (!name || !url) { out("usage: git remote add <name> <url>", "err"); return; }
          if (r.remotes[name]) { out(`error: remote ${name} already exists.`, "err"); return; }
          r.remotes[name] = url;
          out(`↳ Ton dépôt connaît maintenant GitHub sous le surnom « ${name} ». Rien n'est encore envoyé : c'est git push qui envoie.`, FR);
          return;
        }
        if (a[0] === "remove" || a[0] === "rm") { delete r.remotes[a[1]]; return; }
        const v = flag("-v");
        keys(r.remotes).forEach(n => { if (v) { out(`${n}\t${r.remotes[n]} (fetch)`); out(`${n}\t${r.remotes[n]} (push)`); } else out(n); });
        return;
      }
      case "push": return cmdPush(S, mc, a, out, flag);
      case "fetch": return cmdFetch(S, mc, a, out, flag);
      case "pull": return cmdPull(S, mc, a, out, flag);
      case "stash": out("↳ git stash existe, et tu le verras au module 1. Le labo ne le simule pas : fais un commit ou git restore.", FR); return;
      case "rebase": out("↳ git rebase existe (tu le verras plus tard). Dans ce labo, on fusionne avec git merge ou git pull.", FR); return;
      case "tag": out("↳ Les tags arrivent au défi du module 1. Le labo ne les simule pas.", FR); return;
      default:
        out(`git: '${sub}' is not a git command. See 'git --help'.`, "err");
        out("↳ Le labo connaît : " + KNOWN, FR);
    }
  }

  const validName = n => /^[A-Za-z0-9._\/-]+$/.test(n) && !/^[-/.]|\.\.|\/$|\.lock$/.test(n);

  function cmdLs(S, mc, a, out) {
    const all = a.some(x => /^-[a-zA-Z]*a/.test(x));
    const dir = (a.find(x => !x.startsWith("-")) || "").replace(/\/$/, "");
    if (dir === ".git" || dir.startsWith(".git/")) {
      if (!mc.repo) { out(`ls: cannot access '${dir}': No such file or directory`, "err"); return; }
      if (dir === ".git") { out("HEAD  config  index  objects/  refs/"); out("↳ Tout Git vit ici : l'historique (objects), les branches (refs) et la position actuelle (HEAD).", FR); }
      else if (dir === ".git/refs") out("heads/  remotes/  tags/");
      else if (dir === ".git/refs/heads") out(keys(mc.repo.branches).sort().join("  "));
      else if (dir === ".git/objects") out(`(${keys(mc.repo.index).length + Object.keys(S.commits).length} objets compressés)`);
      else out("");
      return;
    }
    const pre = dir ? dir + "/" : "";
    if (dir && !keys(mc.files).some(f => f.startsWith(pre)) && !mc.dirs.includes(dir)) { out(`ls: cannot access '${dir}': No such file or directory`, "err"); return; }
    const names = new Set();
    keys(mc.files).forEach(f => { if (!f.startsWith(pre)) return; const rest = f.slice(pre.length); names.add(rest.includes("/") ? rest.split("/")[0] + "/" : rest); });
    mc.dirs.forEach(d => { if (d.startsWith(pre) && d !== dir) names.add(d.slice(pre.length).split("/")[0] + "/"); });
    let list = [...names].sort();
    if (!all) list = list.filter(n => !n.startsWith("."));
    else { if (!dir && mc.repo) list.unshift(".git/"); list.unshift("./", "../"); }
    if (list.length) out(list.join("  "));
  }
  function cmdCat(S, mc, a, out) {
    for (const p of a) {
      if (p === ".git/HEAD" && mc.repo) { const r = mc.repo; out(r.head.b ? `ref: refs/heads/${r.head.b}` : r.head.d); out(r.head.b ? `↳ HEAD dit « je suis sur la branche ${r.head.b} ».` : "↳ HEAD pointe directement un commit : tu es en « detached HEAD ».", FR); continue; }
      const mm = /^\.git\/refs\/heads\/(.+)$/.exec(p);
      if (mm && mc.repo) { const id = mc.repo.branches[mm[1]]; if (id) { out(id); out(`↳ Une branche n'est qu'un fichier qui contient l'identifiant d'un commit. Ici : ${short(id)}.`, FR); } else out(`cat: ${p}: No such file or directory`, "err"); continue; }
      if (!(p in mc.files)) { out(`cat: ${p}: No such file or directory`, "err"); continue; }
      lines(mc.files[p]).forEach(l => out(l, /^(<<<<<<<|=======|>>>>>>>)/.test(l) ? "warnl" : ""));
    }
  }
  function cmdEcho(S, mc, a, out) {
    const i = a.findIndex(x => x === ">" || x === ">>");
    if (i < 0) { out(a.join(" ")); return; }
    const text = a.slice(0, i).filter(x => x !== "-e").join(" ").replace(/\\n/g, "\n"), p = a[i + 1];
    if (!p) { out("bash: syntax error near unexpected token `newline'", "err"); return; }
    if (p === ".git" || p.startsWith(".git/")) { out("↳ On ne touche jamais à .git à la main : c'est Git qui le gère.", FR); return; }
    if (a[i] === ">") mc.files[p] = text + "\n";
    else mc.files[p] = (mc.files[p] || "") + text + "\n";
  }

  function decorate(S, mc, id, gh) {
    const d = [];
    if (gh) { keys(S.gh.branches).sort().forEach(b => { if (S.gh.branches[b] === id) d.push(b); }); }
    else {
      const r = mc.repo;
      if (!r.head.b && r.head.d === id) d.push("HEAD");
      if (r.head.b && r.branches[r.head.b] === id) d.push("HEAD -> " + r.head.b);
      keys(r.branches).sort().forEach(b => { if (b !== r.head.b && r.branches[b] === id) d.push(b); });
      keys(r.track).sort().forEach(t => { if (r.track[t] === id) d.push(t); });
    }
    return d.length ? ` (${d.join(", ")})` : "";
  }

  // Les couloirs du graphe. Les commits sont rangés du plus récent (en haut) au plus ancien.
  // main d'abord, puis la branche courante, puis les autres : chacune suit la chaîne de ses premiers parents,
  // et prend le premier couloir libre sur sa hauteur. main reste donc toujours droite, à gauche.
  function layout(S, ids, prio) {
    const list = [...ids].map(i => S.commits[i]).sort((x, y) => y.n - x.n);
    const row = {}; list.forEach((c, i) => { row[c.id] = i; });
    const lane = {}, chains = [];
    const walk = tip => {
      const ch = [];
      let c = tip;
      while (c && ids.has(c) && lane[c] === undefined) { ch.push(c); lane[c] = -1; c = S.commits[c].p[0]; }
      return { ids: ch, fork: c && ids.has(c) ? c : null };
    };
    (prio || []).forEach(t => { if (t && ids.has(t) && lane[t] === undefined) chains.push(walk(t)); });
    list.forEach(c => { if (lane[c.id] === undefined) chains.push(walk(c.id)); });
    const busy = [];
    chains.forEach(ch => {
      let top = Math.min(...ch.ids.map(i => row[i]));
      const tip = ch.ids[0];
      list.forEach(c => { if (c.p.indexOf(tip) > 0) top = Math.min(top, row[c.id]); });
      const bottom = ch.fork ? row[ch.fork] : Math.max(...ch.ids.map(i => row[i]));
      let l = 0;
      while ((busy[l] || []).some(([a, b]) => top < b && bottom > a)) l++;
      (busy[l] = busy[l] || []).push([top, bottom]);
      ch.ids.forEach(i => { lane[i] = l; });
    });
    return { list, row, lane, lanes: Math.max(1, busy.length) };
  }
  function prioRefs(S, mc, gh) {
    if (gh) return [S.gh.branches.main, ...keys(S.gh.branches).sort().map(b => S.gh.branches[b])];
    const r = mc.repo;
    return [r.branches.main, r.track["origin/main"], headId(r), ...keys(r.branches).sort().map(b => r.branches[b]), ...keys(r.track).sort().map(t => r.track[t])];
  }

  function cmdLog(S, mc, a, out, flag, opt) {
    const r = mc.repo;
    const one = flag("--oneline"), graph = flag("--graph"), all = flag("--all");
    flag("--decorate");
    let n = +(opt("-n", "--max-count") || 0);
    const k = a.findIndex(x => /^-\d+$/.test(x));
    if (k >= 0) { n = +a[k].slice(1); a.splice(k, 1); }
    let starts;
    if (all) starts = [...Object.values(r.branches), ...Object.values(r.track), headId(r)].filter(Boolean);
    else if (a[0]) { const id = resolve(S, mc, a[0]); if (!id) { out(`fatal: ambiguous argument '${a[0]}': unknown revision`, "err"); return; } starts = [id]; }
    else starts = [headId(r)].filter(Boolean);
    if (!starts.length) { out(`fatal: your current branch '${r.head.b}' does not have any commits yet`, "err"); out("↳ Pas encore de commit : l'historique est vide.", FR); return; }
    const ids = new Set(); starts.forEach(s => ancestors(S, s).forEach(x => ids.add(x)));
    const L = layout(S, ids, prioRefs(S, mc, false));
    let list = L.list;
    if (n) list = list.slice(0, n);
    list.forEach(c => {
      const pre = graph ? "| ".repeat(L.lane[c.id]) + "* " : "";
      if (one) out(`${pre}${short(c.id)}${decorate(S, mc, c.id)} ${c.msg}`, "logl");
      else {
        out(`${pre}commit ${c.id}${decorate(S, mc, c.id)}`, "hash");
        if (c.p.length > 1) out(`Merge: ${c.p.map(short).join(" ")}`);
        out(`Author: ${c.au} <${c.au.toLowerCase().replace(/\W+/g, "")}@exemple.com>`);
        out(""); out("    " + c.msg); out("");
      }
    });
  }

  function cmdStatus(S, mc, out) {
    const r = mc.repo, st = status(S, mc);
    out(r.head.b ? `On branch ${r.head.b}` : `HEAD detached at ${short(r.head.d)}`);
    const up = r.head.b && r.up[r.head.b], upId = up && r.track[up], h = headId(r);
    if (up) {
      if (!upId) out(`Your branch is based on '${up}', but the upstream is gone.`);
      else if (upId === h) out(`Your branch is up to date with '${up}'.`);
      else {
        const ah = [...ancestors(S, h)].filter(x => !ancestors(S, upId).has(x)).length;
        const be = [...ancestors(S, upId)].filter(x => !ancestors(S, h).has(x)).length;
        if (ah && be) { out(`Your branch and '${up}' have diverged,`); out(`and have ${ah} and ${be} different commits each, respectively.`); out(`↳ Toi et GitHub avez chacun des commits que l'autre n'a pas (selon ton dernier fetch).`, FR); }
        else if (ah) { out(`Your branch is ahead of '${up}' by ${ah} commit${ah > 1 ? "s" : ""}.`); out('  (use "git push" to publish your local commits)', "dim"); out(`↳ ${ah} commit${ah > 1 ? "s" : ""} pas encore envoyé${ah > 1 ? "s" : ""} sur GitHub.`, FR); }
        else { out(`Your branch is behind '${up}' by ${be} commit${be > 1 ? "s" : ""}, and can be fast-forwarded.`); out('  (use "git pull" to update your local branch)', "dim"); }
      }
    }
    if (!h) { out(""); out("No commits yet"); }
    if (r.merge) {
      out("");
      if (st.conflicts.length) {
        out("You have unmerged paths.");
        out(`  (fix conflicts and run "git commit")`, "dim");
        out(`  (use "git ${r.merge.kind} --abort" to abort the ${r.merge.kind})`, "dim");
        out(""); out("Unmerged paths:");
        out('  (use "git add <file>..." to mark resolution)', "dim");
        st.conflicts.forEach(p => out(`\tboth modified:   ${p}`, "del"));
        out(`↳ Conflit dans ${st.conflicts.join(", ")} : ouvre le fichier (cat), garde la bonne version, enlève les marqueurs, puis git add.`, FR);
      } else { out("All conflicts fixed but you are still merging."); out('  (use "git commit" to conclude merge)', "dim"); }
    }
    if (st.staged.length) {
      out(""); out("Changes to be committed:");
      out(`  (use "git restore --staged <file>..." to unstage)`, "dim");
      st.staged.forEach(x => out(`\t${x.k === "new" ? "new file" : x.k}:   ${x.p}`, "add"));
    }
    if (st.unstaged.length) {
      out(""); out("Changes not staged for commit:");
      out('  (use "git add <file>..." to update what will be committed)', "dim");
      out('  (use "git restore <file>..." to discard changes in working directory)', "dim");
      st.unstaged.forEach(x => out(`\t${x.k}:   ${x.p}`, "del"));
    }
    if (st.untracked.length) {
      out(""); out("Untracked files:");
      out('  (use "git add <file>..." to include in what will be committed)', "dim");
      st.untracked.forEach(p => out("\t" + p, "del"));
    }
    if (!st.staged.length && !st.unstaged.length && !st.untracked.length && !r.merge) {
      out("");
      if (!h) out('nothing to commit (create/copy files and use "git add" to track)');
      else out("nothing to commit, working tree clean");
    }
    const parts = [];
    if (st.staged.length) parts.push(`en vert, ${st.staged.length} prêt${st.staged.length > 1 ? "s" : ""} pour le prochain commit`);
    if (st.unstaged.length) parts.push(`en rouge, ${st.unstaged.length} modifié${st.unstaged.length > 1 ? "s" : ""} pas encore préparé${st.unstaged.length > 1 ? "s" : ""}`);
    if (st.untracked.length) parts.push(`${st.untracked.length} nouveau${st.untracked.length > 1 ? "x" : ""} que Git ne suit pas encore`);
    if (parts.length) out("↳ En clair : " + parts.join(" ; ") + ".", FR);
  }

  function cmdSwitch(S, mc, a, out, isCheckout, flag, opt) {
    const r = mc.repo;
    if (r.merge) { out("error: you need to resolve your current index first", "err"); out("↳ Termine (ou annule) la fusion en cours avant de changer de branche.", FR); return; }
    const create = isCheckout ? opt("-b", "-B") : opt("-c", "-C", "--create");
    const detach = flag("--detach", "-d");
    if (create) {
      if (r.branches[create]) { out(`fatal: a branch named '${create}' already exists`, "err"); return; }
      if (!validName(create)) { out(`fatal: '${create}' is not a valid branch name`, "err"); return; }
      const at = a[0] ? resolve(S, mc, a[0]) : headId(r);
      if (a[0] && !at) { out(`fatal: invalid reference: ${a[0]}`, "err"); return; }
      if (!at) { r.head = { b: create }; out(`Switched to a new branch '${create}'`); return; }
      if (!moveTo(S, mc, at, out)) return;
      r.branches[create] = at;
      if (a[0] && r.track[a[0]]) { r.up[create] = a[0]; out(`branch '${create}' set up to track '${a[0]}'.`); }
      r.prev = r.head.b || null; r.head = { b: create };
      out(`Switched to a new branch '${create}'`);
      out(`↳ Nouvelle branche « ${create} », et HEAD est maintenant dessus : tes prochains commits iront sur elle.`, FR);
      return;
    }
    let name = a[0];
    if (!name) { out("fatal: missing branch or commit argument", "err"); return; }
    if (name === "-") { name = r.prev; if (!name) { out("fatal: no previous branch", "err"); return; } }
    if (r.branches[name] && !detach) {
      if (r.head.b === name) { out(`Already on '${name}'`); return; }
      if (!moveTo(S, mc, r.branches[name], out)) return;
      r.prev = r.head.b || null; r.head = { b: name };
      out(`Switched to branch '${name}'`);
      const up = r.up[name];
      if (up && r.track[up] && r.track[up] !== r.branches[name] && isAnc(S, r.branches[name], r.track[up])) out(`Your branch is behind '${up}', and can be fast-forwarded.`);
      return;
    }
    if (!detach && r.track["origin/" + name]) {
      const at = r.track["origin/" + name];
      if (!moveTo(S, mc, at, out)) return;
      r.branches[name] = at; r.up[name] = "origin/" + name; r.prev = r.head.b || null; r.head = { b: name };
      out(`branch '${name}' set up to track 'origin/${name}'.`);
      out(`Switched to a new branch '${name}'`);
      out(`↳ Git a créé ta branche locale « ${name} » à partir de celle de GitHub (origin/${name}).`, FR);
      return;
    }
    const id = resolve(S, mc, name);
    if (!id) { out(isCheckout ? `error: pathspec '${name}' did not match any file(s) known to git` : `fatal: invalid reference: ${name}`, "err"); return; }
    if (!isCheckout && !detach) { out("fatal: a branch is expected, got commit '" + name + "'", "err"); out("hint: If you want to detach HEAD at the commit, try again with the --detach option.", "dim"); return; }
    if (!moveTo(S, mc, id, out)) return;
    r.prev = r.head.b || null; r.head = { d: id };
    out(`HEAD is now at ${short(id)} ${S.commits[id].msg}`);
    out("↳ « Detached HEAD » : tu regardes un ancien commit, sans être sur une branche. Pour revenir : git switch main.", FR);
  }
  function moveTo(S, mc, id, out) {
    const r = mc.repo, cur = treeOf(S, headId(r)), tgt = treeOf(S, id);
    const dirty = dirtyPaths(S, mc);
    const changed = union(cur, tgt).filter(p => cur[p] !== tgt[p]);
    const block = changed.filter(p => dirty.has(p) || (!(p in cur) && p in mc.files && !(p in r.index) && mc.files[p] !== tgt[p]));
    if (block.length) {
      out("error: Your local changes to the following files would be overwritten by checkout:", "err");
      block.forEach(p => out("\t" + p, "err"));
      out("Please commit your changes or stash them before you switch branches.", "err"); out("Aborting", "err");
      out("↳ Tu as des changements pas enregistrés sur ce fichier : fais un commit (ou git restore) avant de changer de branche.", FR);
      return false;
    }
    changed.forEach(p => { if (p in tgt) { mc.files[p] = tgt[p]; r.index[p] = tgt[p]; } else { delete mc.files[p]; delete r.index[p]; } });
    return true;
  }

  function abortMerge(S, mc) {
    const r = mc.repo, H = treeOf(S, headId(r));
    union(H, r.index).concat(r.merge ? r.merge.conflicts : []).forEach(p => { if (p in H) { mc.files[p] = H[p]; r.index[p] = H[p]; } else { delete mc.files[p]; delete r.index[p]; } });
    r.merge = null;
  }

  function doMerge(S, mc, theirs, label, out, o = {}) {
    const r = mc.repo, ours = headId(r);
    if (!ours) { if (!moveTo(S, mc, theirs, out)) return; r.branches[r.head.b] = theirs; out("Fast-forward"); return; }
    if (isAnc(S, theirs, ours)) { out("Already up to date."); return; }
    if (dirtyPaths(S, mc).size) {
      out("error: Your local changes to the following files would be overwritten by merge:", "err");
      [...dirtyPaths(S, mc)].forEach(p => out("\t" + p, "err"));
      out("Please commit your changes or stash them before you merge.", "err"); out("Aborting", "err");
      out("↳ Enregistre d'abord ton travail en cours (commit), puis relance la fusion.", FR); return;
    }
    const before = treeOf(S, ours);
    if (isAnc(S, ours, theirs) && !o.noff) {
      moveTo(S, mc, theirs, out);
      if (r.head.b) r.branches[r.head.b] = theirs; else r.head.d = theirs;
      out(`Updating ${short(ours)}..${short(theirs)}`); out("Fast-forward");
      statLines(S, before, treeOf(S, theirs)).forEach(l => out(l));
      out(`↳ « Fast-forward » : ta branche n'avait rien de nouveau, Git a juste avancé l'étiquette jusqu'à ${label}. Aucun commit de fusion.`, FR);
      return;
    }
    const base = mergeBase(S, ours, theirs);
    const res = mergeTrees(treeOf(S, base), before, treeOf(S, theirs), "HEAD", label);
    setWork(mc, before, res.tree);
    const into = r.head.b && r.head.b !== "main" && r.head.b !== "master" ? ` into ${r.head.b}` : "";
    const msg = o.msg || (/^origin\//.test(label) && o.pull ? `Merge branch '${label.slice(7)}' of ${SHORT_GH}${into}` : `Merge branch '${label}'${into}`);
    res.notes.forEach(n => out(n, /^CONFLICT/.test(n) ? "err" : ""));
    if (res.conflicts.length) {
      res.conflicts.forEach(p => { if (p in before) r.index[p] = before[p]; else delete r.index[p]; });
      r.merge = { kind: "merge", theirs, conflicts: res.conflicts, msg };
      out("Automatic merge failed; fix conflicts and then commit the result.", "err");
      out(`↳ Conflit : les deux côtés ont changé les mêmes lignes de ${res.conflicts.join(", ")}. Git a écrit les deux versions dans le fichier, entre <<<<<<< et >>>>>>>. À toi de choisir.`, FR);
      return;
    }
    const id = makeCommit(S, mc, msg, [ours, theirs]);
    out("Merge made by the 'ort' strategy.");
    statLines(S, before, res.tree).forEach(l => out(l));
    out(`↳ Un commit de fusion (${short(id)}) relie les deux histoires : il a deux parents.`, FR);
  }

  function cmdClone(S, mc, a, out) {
    const url = a.find(x => !x.startsWith("-"));
    if (!url) { out("fatal: You must specify a repository to clone.", "err"); return; }
    if (!S.gh || !/github/.test(url)) { out(`fatal: repository '${url}' not found`, "err"); out(`↳ Dans ce labo, le dépôt GitHub s'appelle ${URL_GH}`, FR); return; }
    if (mc.repo) { out("fatal: destination path 'projet' already exists and is not an empty directory.", "err"); out("↳ Ce dossier est déjà un dépôt : pas besoin de cloner.", FR); return; }
    out("Cloning into 'projet'...");
    const def = S.gh.branches.main ? "main" : keys(S.gh.branches)[0];
    mc.repo = newRepo("main");
    const r = mc.repo;
    r.remotes.origin = URL_GH;
    keys(S.gh.branches).forEach(b => { r.track["origin/" + b] = S.gh.branches[b]; });
    if (!def) { out("warning: You appear to have cloned an empty repository.", "dim"); r.up.main = "origin/main"; return; }
    r.head = { b: def }; r.branches[def] = S.gh.branches[def]; r.up[def] = "origin/" + def;
    const T = treeOf(S, S.gh.branches[def]);
    r.index = clone(T);
    keys(T).forEach(p => { mc.files[p] = T[p]; });
    out("↳ Tu as maintenant une copie complète du dépôt GitHub, avec tout son historique. Le labo t'a placé directement dans le dossier projet (dans ton Codespace, fais cd projet).", FR);
  }

  function remoteOf(r) { return keys(r.remotes)[0] || null; }

  function cmdPush(S, mc, a, out, flag) {
    const r = mc.repo;
    const setUp = flag("-u", "--set-upstream"), force = flag("-f", "--force", "--force-with-lease"), del = flag("--delete", "-d");
    let [remote, ref] = a;
    if (!remote) remote = r.head.b && r.up[r.head.b] ? r.up[r.head.b].split("/")[0] : remoteOf(r);
    if (!remote || !r.remotes[remote]) {
      if (!remoteOf(r)) { out("fatal: No configured push destination.", "err"); out("↳ Ton dépôt ne connaît pas encore GitHub : git remote add origin <adresse>, ou bien git clone au départ.", FR); }
      else out(`fatal: '${remote}' does not appear to be a git repository`, "err");
      return;
    }
    if (!S.gh) { out("fatal: unable to access the remote", "err"); return; }
    if (del) {
      if (!S.gh.branches[ref]) { out(`error: unable to delete '${ref}': remote ref does not exist`, "err"); return; }
      delete S.gh.branches[ref]; delete r.track["origin/" + ref];
      out(`To ${SHORT_GH}.git`); out(` - [deleted]         ${ref}`); return;
    }
    if (!ref) {
      if (!r.head.b) { out("fatal: You are not currently on a branch.", "err"); return; }
      ref = r.head.b;
      if (!r.up[ref] && !setUp && !a[0]) {
        out(`fatal: The current branch ${ref} has no upstream branch.`, "err");
        out("To push the current branch and set the remote as upstream, use", "err"); out(""); out(`    git push --set-upstream origin ${ref}`, "err"); out("");
        out(`↳ GitHub ne connaît pas encore ta branche « ${ref} ». La première fois : git push -u origin ${ref}. Ensuite, git push suffit.`, FR); return;
      }
    }
    const src = r.branches[ref];
    if (!src) { out(`error: src refspec ${ref} does not match any`, "err"); out(`↳ Tu n'as pas de branche « ${ref} » avec au moins un commit.`, FR); return; }
    const dst = S.gh.branches[ref];
    if (S.gh.protect && ref === "main" && dst) {
      out(`To ${SHORT_GH}.git`);
      out("remote: error: GH006: Protected branch update failed for refs/heads/main.", "err");
      out("remote: - Changes must be made through a pull request.", "err");
      out(" ! [remote rejected] main -> main (protected branch hook declined)", "err");
      out("↳ main est protégée : en équipe, personne ne pousse directement dessus. Passe par une branche et une pull request.", FR); return;
    }
    if (dst === src) { out("Everything up-to-date"); if (setUp) r.up[ref] = remote + "/" + ref; return; }
    if (dst && !isAnc(S, dst, src) && !force) {
      const known = Object.values(r.track).some(t => isAnc(S, dst, t));
      out(`To ${SHORT_GH}.git`);
      out(` ! [rejected]        ${ref} -> ${ref} (${known ? "non-fast-forward" : "fetch first"})`, "err");
      out(`error: failed to push some refs to '${SHORT_GH}.git'`, "err");
      if (known) out("hint: Updates were rejected because the tip of your current branch is behind its remote counterpart.", "dim");
      else out("hint: Updates were rejected because the remote contains work that you do not have locally.", "dim");
      out("hint: You may want to first integrate the remote changes (e.g., 'git pull ...') before pushing again.", "dim");
      out("↳ Refusé : GitHub a des commits que tu n'as pas (quelqu'un a poussé avant toi). Fais git pull, puis git push.", FR); return;
    }
    S.gh.branches[ref] = src; r.track[remote + "/" + ref] = src;
    out(`To ${SHORT_GH}.git`);
    if (!dst) {
      out(` * [new branch]      ${ref} -> ${ref}`, "ok");
      if (ref !== "main") { out("remote:", "dim"); out(`remote: Create a pull request for '${ref}' on GitHub by visiting:`, "dim"); out(`remote:      https://${SHORT_GH}/pull/new/${ref}`, "dim"); }
    } else out(`   ${short(dst)}..${short(src)}  ${ref} -> ${ref}${force && !isAnc(S, dst, src) ? " (forced update)" : ""}`, "ok");
    if (setUp) { r.up[ref] = remote + "/" + ref; out(`branch '${ref}' set up to track '${remote}/${ref}'.`); }
    if (force && dst && !isAnc(S, dst, src)) out("↳ ⚠ Push forcé : les commits qui étaient sur GitHub ont été écrasés. Jamais sur une branche partagée.", FR);
    else out("↳ Envoyé : GitHub a maintenant tes commits. Regarde le panneau GitHub.", FR);
  }

  function cmdFetch(S, mc, a, out, flag, quiet) {
    const r = mc.repo, prune = flag("--prune", "-p");
    flag("--all");
    if (!remoteOf(r)) { out("fatal: No remote repository specified.", "err"); return; }
    const lines0 = [];
    keys(S.gh.branches).sort().forEach(b => {
      const old = r.track["origin/" + b], now = S.gh.branches[b];
      if (old === now) return;
      if (!old) lines0.push(` * [new branch]      ${b.padEnd(10)} -> origin/${b}`);
      else lines0.push(`   ${short(old)}..${short(now)}  ${b.padEnd(10)} -> origin/${b}`);
      r.track["origin/" + b] = now;
    });
    if (prune) keys(r.track).forEach(t => { const b = t.slice(7); if (!S.gh.branches[b]) { lines0.push(` - [deleted]         (none)     -> ${t}`); delete r.track[t]; } });
    if (lines0.length) { out(`From ${SHORT_GH}`); lines0.forEach(l => out(l)); if (!quiet) out("↳ Les étiquettes origin/… sont à jour. Tes branches à toi n'ont pas bougé : fetch ne fusionne rien.", FR); }
    return lines0.length;
  }

  function cmdPull(S, mc, a, out, flag) {
    const r = mc.repo;
    const noRebase = flag("--no-rebase"), rebase = flag("--rebase", "-r");
    flag("--no-edit"); flag("--ff");
    if (rebase) { out("↳ git pull --rebase existe, tu le verras plus tard. Dans ce labo : git pull (fusion).", FR); return; }
    if (!r.head.b) { out("You are not currently on a branch.", "err"); return; }
    let [remote, br] = a;
    const up = br ? (remote || "origin") + "/" + br : r.up[r.head.b];
    if (!remoteOf(r)) { out("fatal: No remote repository specified.", "err"); return; }
    if (!up) {
      out("There is no tracking information for the current branch.", "err");
      out("Please specify which branch you want to merge with.", "err");
      out(`    git branch --set-upstream-to=origin/<branch> ${r.head.b}`, "dim");
      out(`↳ Ta branche n'est pas reliée à GitHub. La première fois, envoie-la avec git push -u origin ${r.head.b}, ou précise : git pull origin main.`, FR); return;
    }
    cmdFetch(S, mc, [], out, () => false, true);
    const theirs = r.track[up];
    if (!theirs) { out(`fatal: couldn't find remote ref ${up.split("/").slice(1).join("/")}`, "err"); return; }
    const ours = headId(r);
    if (ours && !isAnc(S, theirs, ours) && !isAnc(S, ours, theirs) && !noRebase && mc.cfg["pull.rebase"] === undefined && mc.cfg["pull.ff"] === undefined) {
      out("hint: You have divergent branches and need to specify how to reconcile them.", "dim");
      out("hint: You can do so by running one of the following commands sometime before", "dim");
      out("hint: your next pull:", "dim");
      out("hint:   git config pull.rebase false  # merge", "dim");
      out("hint:   git config pull.rebase true   # rebase", "dim");
      out("fatal: Need to specify how to reconcile divergent branches.", "err");
      out("↳ Toi et GitHub avez chacun des commits nouveaux. Dis une fois pour toutes à Git de fusionner : git config --global pull.rebase false, puis relance git pull.", FR);
      return;
    }
    if (mc.cfg["pull.rebase"] === "true" && !noRebase && ours && !isAnc(S, ours, theirs)) { out("↳ Dans ce labo, règle plutôt git config pull.rebase false (fusion).", FR); return; }
    doMerge(S, mc, theirs, up, out, { pull: true });
  }

  /* ---- GitHub : les pull requests ---- */
  function prMergeable(S, pr) {
    const h = S.gh.branches[pr.head], b = S.gh.branches[pr.base];
    if (!h || !b) return { ok: false, why: "La branche n'existe plus sur GitHub." };
    if (isAnc(S, h, b)) return { ok: false, why: "Rien à fusionner : tout est déjà dans " + pr.base + ".", empty: true };
    if (isAnc(S, b, h)) return { ok: true };
    const base = mergeBase(S, h, b);
    const res = mergeTrees(treeOf(S, base), treeOf(S, b), treeOf(S, h), pr.base, pr.head);
    return res.conflicts.length ? { ok: false, conflict: res.conflicts, why: "Conflit dans " + res.conflicts.join(", ") + " : à résoudre en local." } : { ok: true };
  }
  function prApproved(pr) { return pr.reviews.some(v => v.state === "APPROVED" && v.by !== pr.author); }
  function prBlockedBy(S, pr) {
    const m = prMergeable(S, pr);
    if (!m.ok) return m.why;
    if (S.gh.protect && pr.base === "main" && !prApproved(pr)) return "main est protégée : il faut l'approbation d'un collègue avant de fusionner.";
    if (pr.reviews.length && pr.reviews[pr.reviews.length - 1].state === "CHANGES_REQUESTED" && !prApproved(pr)) return "Des changements sont demandés dans la revue.";
    return null;
  }
  function ghMerge(S, mc, pr, how, delBranch, out) {
    const why = prBlockedBy(S, pr);
    if (why) { out(`X Pull request #${pr.n} is not mergeable.`, "err"); out("↳ " + why, FR); return false; }
    const h = S.gh.branches[pr.head], b = S.gh.branches[pr.base];
    const base = mergeBase(S, h, b);
    const res = mergeTrees(treeOf(S, base), treeOf(S, b), treeOf(S, h), pr.base, pr.head);
    const name = mc.cfg["user.name"];
    const msg = how === "squash" ? `${pr.title} (#${pr.n})` : `Merge pull request #${pr.n} from toi/${pr.head}`;
    const id = hash40([S.n, msg, b, h, name].join("|"));
    S.commits[id] = { id, p: how === "squash" ? [b] : [b, h], t: res.tree, msg, au: name, n: ++S.n };
    S.gh.branches[pr.base] = id;
    pr.state = "MERGED";
    out(`✓ ${how === "squash" ? "Squashed and merged" : "Merged"} pull request #${pr.n} (${pr.title})`, "ok");
    if (delBranch) { delete S.gh.branches[pr.head]; out(`✓ Deleted branch ${pr.head} on GitHub`, "ok"); }
    out(`↳ La PR est fusionnée dans ${pr.base} sur GitHub. Les ordinateurs ne l'ont pas encore : chacun devra faire git switch ${pr.base} puis git pull.`, FR);
    return true;
  }
  function cmdGh(S, mc, a, out, flag, opt) {
    if (!S.gh) { out("↳ Pas de GitHub dans ce niveau.", FR); return; }
    if (a[0] !== "pr") { out("↳ Le labo connaît : gh pr create, gh pr list, gh pr review, gh pr merge.", FR); return; }
    const sub = a[1]; a.splice(0, 2);
    const r = mc.repo;
    if (sub === "create") {
      const title = opt("--title", "-t"), base = opt("--base", "-B") || "main";
      opt("--body", "-b");
      const head = opt("--head", "-H") || (r && r.head.b);
      if (!head || !S.gh.branches[head]) { out(`could not find any commits between origin/${base} and ${head || "?"}`, "err"); out(`↳ Envoie d'abord ta branche sur GitHub : git push -u origin ${head || "ta-branche"}.`, FR); return; }
      if (head === base) { out("↳ Une pull request part d'une branche de travail vers main, pas de main vers main.", FR); return; }
      if (S.gh.prs.some(p => p.head === head && p.base === base && p.state === "OPEN")) { out(`a pull request for branch "${head}" into branch "${base}" already exists`, "err"); return; }
      const pr = { n: S.gh.prs.length + 1, title: title || head, head, base, author: mc.cfg["user.name"], state: "OPEN", reviews: [] };
      S.gh.prs.push(pr);
      out(`https://${SHORT_GH}/pull/${pr.n}`, "ok");
      out(`↳ Pull request #${pr.n} ouverte : « ${pr.title} », ${head} → ${base}. Regarde le panneau GitHub.`, FR);
      return;
    }
    if (sub === "list") {
      const open = S.gh.prs.filter(p => p.state === "OPEN");
      if (!open.length) { out("no open pull requests in toi/projet"); return; }
      open.forEach(p => out(`#${p.n}\t${p.title}\t${p.head}\tOPEN`));
      return;
    }
    const pr = S.gh.prs.find(p => String(p.n) === String(a.find(x => /^#?\d+$/.test(x)) || "").replace("#", "")) || (r && S.gh.prs.find(p => p.head === r.head.b && p.state === "OPEN"));
    if (!pr) { out("no pull requests found", "err"); return; }
    if (pr.state !== "OPEN") { out(`Pull request #${pr.n} is already ${pr.state.toLowerCase()}`, "err"); return; }
    if (sub === "review") {
      const body = opt("--body", "-b") || "";
      const state = flag("--approve", "-a") ? "APPROVED" : flag("--request-changes", "-r") ? "CHANGES_REQUESTED" : (flag("--comment", "-c"), "COMMENTED");
      const by = mc.cfg["user.name"];
      if (state !== "COMMENTED" && by === pr.author) { out(`failed to create review: Can not ${state === "APPROVED" ? "approve" : "request changes on"} your own pull request`, "err"); out(`↳ On ne s'approuve pas soi-même : c'est ${pr.author === "Toi" ? "Sam" : "toi"} qui doit relire. Change de terminal (onglet au-dessus).`, FR); return; }
      pr.reviews.push({ by, state, body });
      out(`✓ ${state === "APPROVED" ? "Approved" : state === "CHANGES_REQUESTED" ? "Requested changes to" : "Reviewed"} pull request #${pr.n}`, "ok");
      return;
    }
    if (sub === "merge") {
      const how = flag("--squash", "-s") ? "squash" : (flag("--merge", "-m"), "merge");
      const del = flag("--delete-branch", "-d");
      ghMerge(S, mc, pr, how, del, out);
      return;
    }
    if (sub === "close") { pr.state = "CLOSED"; out(`✓ Closed pull request #${pr.n}`, "ok"); return; }
    out("↳ Le labo connaît : gh pr create, gh pr list, gh pr review, gh pr merge.", FR);
  }

  /* ---- les buts d'un niveau ---- */
  function check(S, expr) {
    if (/ or /.test(expr)) return expr.split(/ or /).some(e => check(S, e));
    const m = /^(?:(moi|collegue|github)\.)?([a-z]+)(?::(.*?))?(?:(>=|<=|=)(\d+))?$/.exec(expr.trim());
    if (!m) return false;
    const [, who = "moi", key, arg = "", op, num] = m;
    const cmp = v => op === ">=" ? v >= +num : op === "<=" ? v <= +num : op === "=" ? v === +num : v > 0;
    if (key === "cmd") return S.typed.some(t => t.replace(/\s+/g, " ").startsWith(arg));
    if (who === "github") {
      const g = S.gh;
      if (!g) return false;
      if (key === "branch") return !!g.branches[arg];
      if (key === "nobranch") return !g.branches[arg];
      if (key === "commits") return cmp(g.branches.main ? ancestors(S, g.branches.main).size : 0);
      if (key === "contains") { const [x, y] = arg.split(","); return !!g.branches[x] && !!g.branches[y] && isAnc(S, g.branches[x], g.branches[y]); }
      if (key === "file") { const [p, t] = arg.split("~"); const T = treeOf(S, g.branches.main); return p in T && T[p].includes(t || ""); }
      if (key === "nomarkers") { const T = treeOf(S, g.branches.main); return arg in T && !/^(<<<<<<<|>>>>>>>)/m.test(T[arg]); }
      if (key === "merges") return cmp([...ancestors(S, g.branches.main)].filter(c => S.commits[c].p.length > 1).length);
      return false;
    }
    if (key === "pr") {
      const g = S.gh; if (!g) return false;
      if (arg === "open") return g.prs.some(p => p.state === "OPEN");
      if (arg === "merged") return g.prs.some(p => p.state === "MERGED");
      if (arg === "approved") return g.prs.some(p => prApproved(p));
      if (arg === "changes") return g.prs.some(p => p.reviews.some(v => v.state === "CHANGES_REQUESTED"));
      if (arg === "commented") return g.prs.some(p => p.reviews.length > 0);
      return false;
    }
    if (key === "prs") return cmp(S.gh ? S.gh.prs.length : 0);
    if (key === "prmerged") return cmp(S.gh ? S.gh.prs.filter(p => p.state === "MERGED").length : 0);
    const mc = S.m[who];
    if (!mc) return false;
    const r = mc.repo;
    if (key === "repo") return !!r;
    if (key === "norepo") return !r;
    if (key === "file") { const [p, t] = arg.split("~"); return p in mc.files && mc.files[p].includes(t || ""); }
    if (key === "nofile") return !(arg in mc.files);
    if (key === "nofilecontent") { const [p, t] = arg.split("~"); return !(p in mc.files) || !mc.files[p].includes(t); }
    if (!r) return false;
    const h = headId(r), H = treeOf(S, h);
    if (key === "commits") return cmp(h ? ancestors(S, h).size : 0);
    if (key === "tracked") return arg in H;
    if (key === "untracked") return arg in mc.files && !(arg in r.index);
    if (key === "staged") return status(S, mc).staged.some(x => x.p === arg);
    if (key === "nostaged") return !status(S, mc).staged.length;
    if (key === "clean") { const st = status(S, mc); return !st.staged.length && !st.unstaged.length && !st.untracked.length && !r.merge; }
    if (key === "ignored") return arg in mc.files && !(arg in r.index) && isIgnored(arg, ignoreRules(mc.files));
    if (key === "committed") { const [p, t] = arg.split("~"); return p in H && H[p].includes(t || ""); }
    if (key === "notcommitted") return !(arg in H);
    if (key === "nomarkers") return arg in mc.files && !/^(<<<<<<<|=======|>>>>>>>)/m.test(mc.files[arg]) && !(arg in H && /^(<<<<<<<|>>>>>>>)/m.test(H[arg]));
    if (key === "branch") return !!r.branches[arg];
    if (key === "nobranch") return !r.branches[arg];
    if (key === "on") return r.head.b === arg;
    if (key === "detached") return !r.head.b;
    if (key === "contains") { const [x, y] = arg.split(","); const X = resolve(S, mc, x), Y = resolve(S, mc, y); return !!X && !!Y && isAnc(S, X, Y); }
    if (key === "merges") return cmp(h ? [...ancestors(S, h)].filter(c => S.commits[c].p.length > 1).length : 0);
    if (key === "nomerge") return !r.merge;
    if (key === "conflict") return !!(r.merge && r.merge.conflicts.length);
    if (key === "msg") return h ? [...ancestors(S, h)].some(c => S.commits[c].msg.toLowerCase().includes(arg.toLowerCase())) : false;
    if (key === "revert") return h ? [...ancestors(S, h)].some(c => /^Revert "/.test(S.commits[c].msg)) : false;
    if (key === "upstream") return !!r.up[arg];
    if (key === "synced") return !!S.gh && !!r.branches[arg] && r.branches[arg] === S.gh.branches[arg];
    if (key === "has") return !!S.gh && !!S.gh.branches[arg] && !!r.branches[arg] && isAnc(S, S.gh.branches[arg], r.branches[arg]);
    if (key === "remote") return !!r.remotes[arg || "origin"];
    return false;
  }

  // Exécute une liste de commandes (départ d'un niveau, solution). « collegue: git pull » vise l'autre ordinateur.
  function runScript(S, list, out, typed) {
    (list || []).forEach(line => {
      let l = line.trim();
      const m = /^(moi|collegue):\s*(.*)$/.exec(l);
      if (m) { if (S.m[m[1]]) S.cur = m[1]; l = m[2]; }
      if (l === "@protect") { if (S.gh) S.gh.protect = true; return; }
      if (!l) return;
      splitChain(l).forEach(part => { if (typed) S.typed.push(part); run(S, part, out); });
    });
  }

  const ENGINE = { newState, run, runScript, check, status, resolve, headId, treeOf, ancestors, isAnc, layout, decorate, prMergeable, prBlockedBy, prApproved, ghMerge, splitChain, tokenize, merge3, short, WHO, SHORT_GH };

  /* ================= l'affichage ================= */

  const doc = typeof document !== "undefined" ? document : null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PAL = ["#146ef5", "#ff6b2c", "#1fae5b", "#ee4fb6", "#8b5cf6", "#0ea5a4", "#c45a00"];
  const STORE = "mzc.labo.v1";
  const loadDone = () => { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } };
  const saveDone = d => { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) { /* stockage indisponible */ } };
  const ICON_GH = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
  const ICON_PC = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 5h18v11H3zM8 20h8M12 16v4"/></svg>';

  function mount(el, cfg, helpers = {}) {
    if (typeof cfg === "string") {
      try { cfg = JSON.parse(cfg); } catch (e) { el.innerHTML = `<p class="small">Labo Git : la configuration de ce niveau est illisible (${esc(e.message)}).</p>`; return; }
    }
    const levels = (cfg.niveaux || [cfg]).slice().sort((a, b) => (a.bonus ? 1 : 0) - (b.bonus ? 1 : 0));
    const nMain = levels.filter(lv => !lv.bonus).length;
    const lvName = i => levels[i].bonus ? `Bonus ${i - nMain + 1} sur ${levels.length - nMain} · facultatif` : `Niveau ${i + 1} sur ${nMain}`;
    const lid = cfg.id || "labo";
    const md = helpers.md || ((node, src) => { node.textContent = src; });
    const inline = helpers.inline || esc;
    let done = loadDone();
    let L = 0, S = null, hist = [], hpos = 0, undo = [], seen = {}, playing = false, hintN = 0, won = false;

    el.classList.add("labo");
    // Le terminal est sous le dessin ; à côté, la consigne et les buts.
    const TERM = `<div class="lb-term">
            <div class="lb-tabs"></div>
            <div class="lb-out" tabindex="0"></div>
            <form class="lb-in" autocomplete="off"><span class="lb-ps"></span><input type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Tape une commande" placeholder="tape une commande, puis Entrée"></form>
          </div>
          <div class="lb-actions">
            <button type="button" class="btn ghost sm" data-a="undo">↶ Annuler la dernière commande</button>
            <button type="button" class="btn ghost sm" data-a="reset">Recommencer le niveau</button>
            <button type="button" class="btn ghost sm" data-a="hint">Un indice</button>
            <button type="button" class="btn ghost sm" data-a="sol">Voir la solution</button>
          </div>`;
    el.innerHTML = `
      <div class="lb-top"><span class="lab">Labo Git · essaie ici, le dessin se construit à chaque commande</span><div class="lb-levels" role="tablist"></div></div>
      <div class="lb-grid">
        <div class="lb-main"><div class="lb-world" aria-live="polite"></div>${TERM}</div>
        <div class="lb-side"><div class="lb-brief"></div><div class="lb-help"></div></div>
      </div>`;
    const $ = s => el.querySelector(s);
    const world = $(".lb-world"), brief = $(".lb-brief"), outEl = $(".lb-out"), input = $(".lb-in input"), ps = $(".lb-ps"), tabs = $(".lb-tabs"), help = $(".lb-help");

    function lvKey(i) { return lid + ":" + (i + 1); }
    function renderLevels() {
      $(".lb-levels").innerHTML = levels.length > 1 ? levels.map((lv, i) => `${i === nMain && i ? '<span class="lb-bsep">bonus</span>' : ""}<button type="button" role="tab" aria-selected="${i === L}" class="${i === L ? "on" : ""} ${done[lvKey(i)] ? "ok" : ""} ${lv.bonus ? "bonus" : ""}" data-l="${i}" title="${esc(lvName(i) + " : " + (lv.titre || ""))}">${done[lvKey(i)] ? "✓" : lv.bonus ? "B" + (i - nMain + 1) : i + 1}</button>`).join("") : "";
      el.querySelectorAll(".lb-levels [data-l]").forEach(b => b.addEventListener("click", () => load(+b.dataset.l)));
    }

    function load(i) {
      L = i; playing = false; hintN = 0; won = false; undo = []; seen = {};
      const lv = levels[L];
      S = newState(lv.postes || ["moi"]);
      runScript(S, lv.depart, () => {}, false);
      S.cur = lv.poste || "moi";
      S.log = [];
      if (lv.accueil !== false) S.log.push({ t: lv.accueil || "Tape ta première commande ci-dessous, puis Entrée. Tape aide pour la liste des commandes.", c: "fr", w: S.cur });
      keys(S.commits).forEach(c => { seen[c] = true; });
      renderLevels();
      brief.innerHTML = `<h4>${levels.length > 1 ? `<span class="lb-n${lv.bonus ? " bonus" : ""}">${lvName(L)}</span>` : ""}${esc(lv.titre || "Labo Git")}</h4><div class="md lb-intro"></div><ul class="lb-goals"></ul>`;
      md($(".lb-intro"), lv.intro || "");
      help.innerHTML = "";
      draw();
    }

    function out(t, c, w) { S.log.push({ t, c: c || "", w: w || S.cur }); }

    function exec(line, typedByUser) {
      const lv = levels[L];
      undo.push(JSON.stringify(S));
      if (undo.length > 60) undo.shift();
      let l = line.trim();
      const m = /^(moi|collegue):\s*(.*)$/.exec(l);
      if (m && S.m[m[1]]) { S.cur = m[1]; l = m[2]; }
      out("$ " + l, "cmd");
      if (l === "undo" || l === "annuler") { undo.pop(); doUndo(); return; }
      if (l === "reset" || l === "recommencer") { load(L); return; }
      splitChain(l).forEach(part => {
        if (typedByUser) S.typed.push(part);
        try { run(S, part, (t, c) => out(t, c)); }
        catch (e) { out("↳ Le labo n'a pas su simuler cette commande (" + e.message + "). Essaie autrement, ou clique sur « Annuler ».", "fr"); }
      });
      draw();
      if (!won && goalsDone(lv)) win();
    }
    function doUndo() {
      if (!undo.length) return;
      S = JSON.parse(undo.pop());
      out("↶ Dernière commande annulée.", "fr");
      draw();
    }
    function goalsDone(lv) { return (lv.buts || []).length > 0 && lv.buts.every(g => check(S, g.split("|")[0])); }
    function win() {
      won = true;
      done[lvKey(L)] = true; saveDone(done);
      renderLevels();
      const last = L === levels.length - 1, lastMain = L === nMain - 1;
      const tail = last ? "Tu as fini le labo de cette leçon. Passe maintenant à la suite de la leçon, puis refais-le pour de vrai dans ton Codespace."
        : lastMain ? "Tu as l'essentiel ✓ Passe à la suite de la leçon. Les niveaux bonus sont là si tu veux t'entraîner encore."
        : "Bien joué. Le niveau suivant t'attend.";
      const bravo = levels[L].bravo ? levels[L].bravo + " " + (lastMain && !last ? tail : "") : tail;
      help.innerHTML = `<div class="lb-win"><b>🎉 Niveau réussi !</b><span>${esc(bravo.trim())}</span>${last ? "" : `<button type="button" class="btn sm${lastMain ? " ghost" : ""}" data-a="next">${lastMain ? "Niveau bonus (facultatif) →" : "Niveau suivant →"}</button>`}</div>`;
      const nb = help.querySelector('[data-a="next"]');
      if (nb) nb.addEventListener("click", () => load(L + 1));
    }

    function draw() {
      const lv = levels[L];
      // les buts
      $(".lb-goals").innerHTML = (lv.buts || []).map(g => { const [e, label] = g.split("|"); const ok = check(S, e); return `<li class="${ok ? "ok" : ""}"><span class="lb-ck">${ok ? "✓" : ""}</span><span>${inline((label || e).trim())}</span></li>`; }).join("");
      // les terminaux
      const ms = keys(S.m);
      tabs.innerHTML = ms.length > 1 ? ms.map(k => `<button type="button" class="${k === S.cur ? "on" : ""}" data-m="${k}">Terminal de ${esc(WHO[k].name)}</button>`).join("") : `<span class="lb-tab1">Terminal · ${esc(WHO.moi.title.toLowerCase())}</span>`;
      tabs.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { S.cur = b.dataset.m; draw(); input.focus(); }));
      const mc = S.m[S.cur];
      const br = mc.repo ? (mc.repo.head.b ? ` (${mc.repo.head.b})` : ` (${short(mc.repo.head.d)}…)`) : "";
      ps.innerHTML = `<b>${esc(WHO[S.cur].user)}</b>:~/projet<i>${esc(br)}</i>$`;
      outEl.innerHTML = S.log.filter(x => x.w === S.cur || ms.length === 1).slice(-160).map(x => `<div class="lb-l ${x.c}">${esc(x.t) || "&nbsp;"}</div>`).join("");
      outEl.scrollTop = outEl.scrollHeight;
      // le monde
      const parts = [];
      if (S.gh) parts.push(ghPanel());
      if (S.gh) parts.push(`<div class="lb-wire"><span>↑ git push</span><span>↓ git clone · git fetch · git pull</span></div>`);
      parts.push(`<div class="lb-machines ${ms.length > 1 ? "two" : ""}">${ms.map(k => machinePanel(S.m[k])).join("")}</div>`);
      world.innerHTML = parts.join("");
      world.querySelectorAll("[data-m]").forEach(p => p.addEventListener("click", ev => { if (ev.target.closest("button,summary,details")) return; if (S.cur !== p.dataset.m) { S.cur = p.dataset.m; draw(); } }));
      world.querySelectorAll(".lb-f").forEach(b => b.addEventListener("click", () => {
        const box = b.closest(".lb-z").querySelector(".lb-peek");
        if (box.dataset.f === b.dataset.f && !box.hidden) { box.hidden = true; return; }
        box.dataset.f = b.dataset.f; box.hidden = false;
        box.innerHTML = `<b>${esc(b.dataset.f)}</b><pre>${esc(b.dataset.c || "(fichier vide)")}</pre>`;
      }));
      world.querySelectorAll("[data-pr]").forEach(b => b.addEventListener("click", () => prAction(b.dataset.pr, +b.dataset.n)));
      const nf = world.querySelector(".lb-newpr");
      if (nf) nf.addEventListener("submit", ev => { ev.preventDefault(); const h = nf.querySelector("select").value, t = nf.querySelector("input").value.trim(); if (h) ghCmd(`gh pr create --head ${h} --title "${(t || h).replace(/"/g, "'")}"`, `Sur github.com : nouvelle pull request ${h} → main`); });
      keys(S.commits).forEach(c => { seen[c] = true; });
    }

    function ghCmd(cmd, label) {
      undo.push(JSON.stringify(S));
      out("# " + label + " (en tant que " + S.m[S.cur].cfg["user.name"] + ")", "dim");
      run(S, cmd, (t, c) => out(t, c));
      draw();
      if (!won && goalsDone(levels[L])) win();
    }
    function prAction(kind, n) {
      if (kind === "approve") ghCmd(`gh pr review ${n} --approve`, `Sur github.com : Review changes → Approve sur la PR #${n}`);
      if (kind === "changes") ghCmd(`gh pr review ${n} --request-changes -b "à corriger"`, `Sur github.com : Review changes → Request changes sur la PR #${n}`);
      if (kind === "comment") ghCmd(`gh pr review ${n} --comment -b "relu"`, `Sur github.com : un commentaire de revue sur la PR #${n}`);
      if (kind === "merge") ghCmd(`gh pr merge ${n} --merge`, `Sur github.com : Merge pull request #${n}`);
      if (kind === "delete") { const pr = S.gh.prs.find(p => p.n === n); if (pr && S.gh.branches[pr.head]) { undo.push(JSON.stringify(S)); delete S.gh.branches[pr.head]; out(`# Sur github.com : Delete branch ${pr.head}`, "dim"); draw(); if (!won && goalsDone(levels[L])) win(); } }
    }

    function fileChip(p, cls, tag, content) {
      return `<button type="button" class="lb-f ${cls}" data-f="${esc(p)}" data-c="${esc(content === undefined ? "" : content)}" title="Clique pour voir le contenu">${esc(p)}${tag ? `<i>${esc(tag)}</i>` : ""}</button>`;
    }

    function machinePanel(mc) {
      const r = mc.repo, cur = mc.k === S.cur;
      const head = r ? (r.head.b ? `branche ${r.head.b}` : `HEAD détachée sur ${short(r.head.d)}`) : "pas encore un dépôt Git";
      let work, stage, repo, extra = "";
      if (!r) {
        const fs = keys(mc.files).sort();
        work = fs.length ? fs.map(p => fileChip(p, "plain", "", mc.files[p])).join("") : `<span class="lb-empty">dossier vide</span>`;
        stage = `<span class="lb-empty">—</span>`;
        repo = `<div class="lb-norepo"><b>Pas de dépôt ici.</b><span>Ce dossier est un dossier normal : Git ne regarde rien. Tape <code>git init</code> pour le transformer en dépôt.</span></div>`;
      } else {
        const st = status(S, mc), H = treeOf(S, headId(r));
        const un = {}; st.unstaged.forEach(x => { un[x.p] = x.k; });
        const chips = [];
        union(mc.files, r.index, H).forEach(p => {
          if (st.conflicts.includes(p)) chips.push(fileChip(p, "conf", "conflit", mc.files[p]));
          else if (!(p in mc.files)) { if (p in r.index) chips.push(fileChip(p, "del", "supprimé", "")); }
          else if (!(p in r.index)) chips.push(isIgnored(p, st.rules) ? fileChip(p, "ign", "ignoré", mc.files[p]) : fileChip(p, "new", "nouveau", mc.files[p]));
          else if (un[p]) chips.push(fileChip(p, "mod", "modifié", mc.files[p]));
          else chips.push(fileChip(p, "ok", "", mc.files[p]));
        });
        work = `<span class="lb-git">.git</span>` + (chips.join("") || `<span class="lb-empty">dossier vide</span>`);
        stage = st.staged.length ? st.staged.map(x => fileChip(x.p, "stg", x.k === "new" ? "nouveau" : x.k === "deleted" ? "supprimé" : "modifié", r.index[x.p])).join("") : `<span class="lb-empty">vide : rien de prêt pour le prochain commit</span>`;
        repo = graph(S, mc, false);
        if (r.merge) extra = `<div class="lb-merge">${r.merge.conflicts.length ? `⚠ Fusion en cours : conflit dans <b>${esc(r.merge.conflicts.join(", "))}</b>. Corrige, puis <code>git add</code> et <code>git commit</code> (ou <code>git ${r.merge.kind} --abort</code>).` : `Conflit réglé : termine avec <code>git commit</code>.`}</div>`;
        const up = r.head.b && r.up[r.head.b], upId = up && r.track[up], h = headId(r);
        if (upId && h && upId !== h) {
          const ah = [...ancestors(S, h)].filter(x => !ancestors(S, upId).has(x)).length, be = [...ancestors(S, upId)].filter(x => !ancestors(S, h).has(x)).length;
          extra += `<div class="lb-sync">${ah ? `↑ ${ah} commit${ah > 1 ? "s" : ""} pas encore envoyé${ah > 1 ? "s" : ""} (git push)` : ""}${ah && be ? " · " : ""}${be ? `↓ ${be} commit${be > 1 ? "s" : ""} de GitHub pas encore fusionné${be > 1 ? "s" : ""} (git pull)` : ""}</div>`;
        }
      }
      return `<section class="lb-m ${cur ? "cur" : ""}" data-m="${mc.k}">
        <header>${ICON_PC}<b>${esc(WHO[mc.k].title)}</b><small>~/projet · ${esc(head)}</small>${keys(S.m).length > 1 ? (cur ? '<span class="lb-you">tu tapes ici</span>' : '<span class="lb-sw">clique pour taper ici</span>') : ""}</header>
        ${extra}
        <div class="lb-zones">
          <div class="lb-z"><span class="lb-zt">Dossier de travail<small>tes fichiers</small></span><div class="lb-chips">${work}</div><div class="lb-peek" hidden></div></div>
          <div class="lb-arr">git add</div>
          <div class="lb-z"><span class="lb-zt">Zone de préparation<small>le prochain commit</small></span><div class="lb-chips">${stage}</div><div class="lb-peek" hidden></div></div>
          <div class="lb-arr">git commit</div>
          <div class="lb-z lb-zr"><span class="lb-zt">Dépôt (.git)<small>l'historique</small></span>${repo}</div>
        </div>
      </section>`;
    }

    function ghPanel() {
      const g = S.gh;
      const prs = g.prs.slice().reverse().map(pr => {
        const why = pr.state === "OPEN" ? prBlockedBy(S, pr) : null, m = pr.state === "OPEN" ? prMergeable(S, pr) : null;
        const revs = pr.reviews.map(v => `<span class="lb-rev ${v.state.toLowerCase()}">${esc(v.by)} : ${v.state === "APPROVED" ? "✓ approuvé" : v.state === "CHANGES_REQUESTED" ? "✗ changements demandés" : "💬 commentaire"}</span>`).join("");
        const meCanReview = S.m[S.cur].cfg["user.name"] !== pr.author;
        return `<div class="lb-pr ${pr.state.toLowerCase()}">
          <div class="lb-prh"><b>#${pr.n} ${esc(pr.title)}</b><span class="lb-st">${pr.state === "OPEN" ? "Ouverte" : pr.state === "MERGED" ? "Fusionnée" : "Fermée"}</span></div>
          <small><code>${esc(pr.head)}</code> → <code>${esc(pr.base)}</code> · par ${esc(pr.author)}</small>
          ${revs ? `<div class="lb-revs">${revs}</div>` : ""}
          ${pr.state === "OPEN" ? `<div class="lb-chk ${why ? (m && m.conflict ? "bad" : "wait") : "good"}">${why ? esc(why) : "✓ Prête à fusionner : aucun conflit."}</div>
          <div class="lb-prb">${meCanReview ? `<button type="button" class="btn ghost sm" data-pr="approve" data-n="${pr.n}">Approuver (en tant que ${esc(S.m[S.cur].cfg["user.name"])})</button><button type="button" class="btn ghost sm" data-pr="changes" data-n="${pr.n}">Demander des changements</button>` : `<span class="small">Pour relire, passe sur le terminal de l'autre personne.</span>`}
          <button type="button" class="btn sm" data-pr="merge" data-n="${pr.n}" ${why ? "disabled" : ""}>Merge pull request</button></div>` : pr.state === "MERGED" && g.branches[pr.head] ? `<div class="lb-prb"><button type="button" class="btn ghost sm" data-pr="delete" data-n="${pr.n}">Delete branch</button></div>` : ""}
        </div>`;
      }).join("");
      const cand = keys(g.branches).filter(b => b !== "main" && !g.prs.some(p => p.head === b && p.state === "OPEN"));
      const form = cand.length ? `<form class="lb-newpr"><select aria-label="Branche">${cand.map(b => `<option>${esc(b)}</option>`).join("")}</select><input type="text" placeholder="Titre de la pull request"><button class="btn sm" type="submit">Ouvrir une pull request</button></form>` : "";
      return `<section class="lb-gh"><header>${ICON_GH}<b>GitHub</b><small>${esc(SHORT_GH)}</small>${g.protect ? '<span class="lb-prot">🔒 main protégée</span>' : ""}</header>
        <div class="lb-ghg"><div class="lb-z lb-zr"><span class="lb-zt">Le dépôt sur GitHub<small>ce que tout le monde voit</small></span>${keys(g.branches).length ? graph(S, null, true) : '<span class="lb-empty">dépôt vide : personne n\'a encore poussé</span>'}</div>
        <div class="lb-z"><span class="lb-zt">Pull requests<small>${g.prs.filter(p => p.state === "OPEN").length} ouverte(s)</small></span>${prs || '<span class="lb-empty">aucune pour l\'instant</span>'}${form}</div></div>
      </section>`;
    }

    function graph(S, mc, gh) {
      const r = mc && mc.repo;
      const refs = gh ? Object.values(S.gh.branches) : [...Object.values(r.branches), ...Object.values(r.track), headId(r)].filter(Boolean);
      if (!refs.length) return !gh && r.head.b ? `<div class="lb-row"><span class="lb-pill on" style="--c:${PAL[0]}"><em>HEAD →</em> ${esc(r.head.b)}</span><span class="lb-msg">pas encore de commit : la branche attend sa première photo</span></div>` : `<span class="lb-empty">aucun commit pour l'instant</span>`;
      const ids = new Set(); refs.forEach(x => ancestors(S, x).forEach(c => ids.add(c)));
      const Lo = layout(S, ids, prioRefs(S, mc, gh));
      const RH = 34, LW = 20, X0 = 14;
      const row = Lo.row;
      const W = X0 + Lo.lanes * LW, Hh = Lo.list.length * RH;
      const cx = c => X0 + Lo.lane[c] * LW, cy = c => row[c] * RH + RH / 2;
      const colorOf = c => PAL[Lo.lane[c] % PAL.length];
      let edges = "", dots = "";
      Lo.list.forEach(c => {
        c.p.forEach((p, k) => {
          if (row[p] === undefined) return;
          const x1 = cx(c.id), y1 = cy(c.id), x2 = cx(p), y2 = cy(p);
          if (x1 === x2) { edges += `<path d="M${x1} ${y1}V${y2}" stroke="${colorOf(c.id)}"/>`; return; }
          if (k === 0) {
            // début d'une branche : on descend dans son couloir, puis on rejoint le commit de départ
            const yb = Math.max(y1, y2 - RH);
            edges += `<path d="M${x1} ${y1}V${yb} C${x1} ${yb + RH * 0.55} ${x2} ${y2 - RH * 0.45} ${x2} ${y2}" stroke="${colorOf(c.id)}"/>`;
          } else {
            // commit de fusion : on part tout de suite vers le couloir de la branche fusionnée
            const ya = Math.min(y2, y1 + RH);
            edges += `<path d="M${x1} ${y1} C${x1} ${y1 + RH * 0.55} ${x2} ${ya - RH * 0.45} ${x2} ${ya}V${y2}" stroke="${colorOf(p)}"/>`;
          }
        });
        const isNew = !seen[c.id];
        const merge = c.p.length > 1;
        dots += `<circle class="${isNew ? "pop" : ""}" cx="${cx(c.id)}" cy="${cy(c.id)}" r="${merge ? 7 : 8}" fill="${merge ? "var(--bg)" : colorOf(c.id)}" stroke="${colorOf(c.id)}" stroke-width="${merge ? 3.5 : 2}"/>`;
      });
      const pills = id => {
        const out = [], branchColor = () => colorOf(id);
        if (gh) keys(S.gh.branches).sort().forEach(b => { if (S.gh.branches[b] === id) out.push(`<span class="lb-pill" style="--c:${branchColor(b)}">${esc(b)}</span>`); });
        else {
          if (!r.head.b && r.head.d === id) out.push(`<span class="lb-pill head">HEAD</span>`);
          keys(r.branches).sort((x, y) => (y === r.head.b) - (x === r.head.b)).forEach(b => { if (r.branches[b] === id) out.push(`<span class="lb-pill ${b === r.head.b ? "on" : ""}" style="--c:${branchColor(b)}">${b === r.head.b ? "<em>HEAD →</em> " : ""}${esc(b)}</span>`); });
          keys(r.track).sort().forEach(t => { if (r.track[t] === id) out.push(`<span class="lb-pill trk" style="--c:${branchColor(t)}" title="Où était cette branche sur GitHub à ton dernier fetch, push ou pull">${esc(t)}</span>`); });
        }
        return out.join("");
      };
      const rows = Lo.list.map(c => `<div class="lb-row ${seen[c.id] ? "" : "new"}" style="height:${RH}px"><span class="lb-gut" style="width:${W + 6}px"></span><code>${short(c.id)}</code>${pills(c.id)}<span class="lb-msg" title="${esc(c.msg)} · ${esc(c.au)}">${esc(c.msg)}</span>${c.p.length > 1 ? '<span class="lb-mtag">fusion</span>' : ""}</div>`).join("");
      const unborn = !gh && r.head.b && !r.branches[r.head.b] ? `<div class="lb-row"><span class="lb-pill on" style="--c:${PAL[0]}"><em>HEAD →</em> ${esc(r.head.b)}</span><span class="lb-msg">(pas encore de commit)</span></div>` : "";
      return `${unborn}<div class="lb-graph"><svg class="lb-svg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" aria-hidden="true"><g fill="none" stroke-width="2.5">${edges}</g>${dots}</svg>${rows}</div>`;
    }

    // les commandes tapées
    $(".lb-in").addEventListener("submit", ev => {
      ev.preventDefault();
      if (playing) return;
      const v = input.value;
      input.value = "";
      if (!v.trim()) return;
      hist.push(v); hpos = hist.length;
      exec(v, true);
    });
    input.addEventListener("keydown", ev => {
      if (ev.key === "ArrowUp" && hist.length) { hpos = Math.max(0, hpos - 1); input.value = hist[hpos]; ev.preventDefault(); }
      if (ev.key === "ArrowDown" && hist.length) { hpos = Math.min(hist.length, hpos + 1); input.value = hist[hpos] || ""; ev.preventDefault(); }
      if (ev.key === "l" && ev.ctrlKey) { S.log = []; draw(); ev.preventDefault(); }
    });
    outEl.addEventListener("click", () => { if (!getSelection().toString()) input.focus(); });

    el.querySelectorAll(".lb-actions [data-a]").forEach(b => b.addEventListener("click", () => {
      const lv = levels[L], k = b.dataset.a;
      if (k === "undo") doUndo();
      if (k === "reset") load(L);
      if (k === "hint") {
        const hs = lv.indices || [];
        if (!hs.length) { help.innerHTML = `<div class="lb-hint">Pas d'indice pour ce niveau : relis les buts, et tape <code>git status</code>.</div>`; return; }
        hintN = Math.min(hintN + 1, hs.length);
        help.innerHTML = hs.slice(0, hintN).map((h, i) => `<div class="lb-hint"><b>${i + 1}/${hs.length}</b><span>${inline(h)}</span></div>`).join("");
      }
      if (k === "sol") {
        const sol = lv.solution || [];
        help.innerHTML = `<div class="lb-sol"><b>Une solution</b><pre>${esc(sol.join("\n"))}</pre><button type="button" class="btn sm" data-a="play">▶ La regarder se jouer, pas à pas</button></div>`;
        help.querySelector('[data-a="play"]').addEventListener("click", () => play(sol));
      }
    }));

    function play(sol) {
      load(L);
      playing = true;
      input.disabled = true;
      let i = 0;
      const tick = () => {
        if (!playing || i >= sol.length) { playing = false; input.disabled = false; return; }
        exec(sol[i++], false);
        setTimeout(tick, 1100);
      };
      setTimeout(tick, 500);
    }

    load(0);
  }

  const api = { mount, engine: ENGINE };
  if (typeof window !== "undefined") window.LaboGit = api;
  if (typeof module !== "undefined") module.exports = api;
})();

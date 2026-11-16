/**
 * Rappels Mon Zoomcamp
 *
 * Ce script tourne dans TON compte Google (Google Apps Script) : gratuit, et il marche même
 * quand ton PC, le site ou Claude sont éteints.
 *
 * Chaque jour, dans ton Google Agenda :
 *  - 7 h : « À quelle heure aujourd'hui ? », avec un lien pour choisir ton créneau du jour.
 *  - à ton créneau : ta séance, avec une notification 10 minutes avant et une à l'heure.
 *  - ensuite, toutes les heures jusqu'à 22 h : une relance, tant que ce n'est pas fait.
 *  - « C'est fait » arrête les relances du jour : le lien dans l'agenda, ou tout seul
 *    quand tu termines une leçon sur le site (s'il est relié).
 * Pas dispo ? Tu n'as rien à faire : la relance suivante arrive une heure plus tard.
 * Tu peux aussi déplacer la séance dans Google Agenda : les relances suivent.
 *
 * Installation : page « Mes rappels » du site (#/agenda).
 */

var CONFIG = {
  LIEN: "",               // Étape 5 : colle ici l'URL de ton application Web (elle finit par /exec)
  SITE: "https://gitabdelhub.github.io/data-engineering-zoomcamp/site/",
  HEURE_MATIN: "07:00",   // la question « à quelle heure aujourd'hui ? »
  HEURE_DEFAUT: "19:00",  // ta séance si tu ne choisis rien
  DUREE: 30,              // durée de la séance, en minutes
  ECART: 60,              // minutes entre deux relances
  FIN: "22:00"            // pas de relance après cette heure
};

/* ---------- installation ---------- */

function installer() {
  var lien = String(CONFIG.LIEN || "").trim();
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(lien)) {
    throw new Error("Colle d'abord l'URL de ton application Web entre les guillemets de LIEN, tout en haut " +
      "(elle commence par https://script.google.com/ et finit par /exec). Enregistre, puis relance installer.");
  }
  var p = props_();
  p.setProperty("lien", lien);
  if (!p.getProperty("cle")) p.setProperty("cle", Utilities.getUuid().replace(/-/g, ""));
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("preparerDemain").timeBased().atHour(20).everyDays(1).inTimezone(tz_()).create();
  ScriptApp.newTrigger("synchroniser").timeBased().everyMinutes(30).create();
  var j = jour_();
  if (a_(j, CONFIG.FIN) > new Date()) preparer_(j);
  preparer_(plusJours_(j, 1));
  Logger.log("C'est installé.\n\n" +
    "1) Ton lien perso, à mettre en favori sur ton téléphone :\n" + lien_() + "\n\n" +
    "2) Relier le site : ouvre ce lien sur ton PC, dans ton navigateur habituel :\n" +
    CONFIG.SITE + "#/agenda?lien=" + encodeURIComponent(lien_()));
}

// Tout arrêter : plus de déclencheurs, et les rendez-vous à venir sont effacés.
function desinstaller() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  var p = props_(), now = new Date();
  p.getKeys().forEach(function (k) {
    if (k.indexOf("j:") !== 0) return;
    var s = JSON.parse(p.getProperty(k));
    [s.choix, s.seance].concat(s.relances || []).forEach(function (id) { effacerSiAVenir_(id, now); });
  });
  p.deleteAllProperties();
  Logger.log("Désinstallé. Tu peux supprimer le projet.");
}

/* ---------- déclencheurs ---------- */

// Chaque soir vers 20 h : prépare le lendemain (sauf si tu l'as déjà choisi).
function preparerDemain() {
  avecVerrou_(function () {
    preparer_(plusJours_(jour_(), 1));
    var limite = plusJours_(jour_(), -14), p = props_();
    p.getKeys().forEach(function (k) { if (k.indexOf("j:") === 0 && k.slice(2) < limite) p.deleteProperty(k); });
  });
}

// Toutes les 30 minutes : si tu as déplacé ou supprimé ta séance dans l'agenda, les relances suivent.
function synchroniser() {
  avecVerrou_(function () {
    var j = jour_(), s = etat_(j);
    if (!s || s.fait || s.joker || !s.seance) return;
    var e = present_(j, s.seance);
    if (!e) { joker_(j); return; }          // séance supprimée : pas de séance aujourd'hui
    var h = hm_(e.getStartTime());
    if (h === s.creneau) return;
    s.relances.forEach(effacer_);
    s.creneau = h;
    s.relances = relancer_(j, e.getStartTime());
    garder_(j, s);
  });
}

/* ---------- les liens : ta page, « c'est fait », le site ---------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!cle_() || p.k !== cle_()) {
    return HtmlService.createHtmlOutput("<p style='font-family:sans-serif'>Lien invalide. Utilise le lien donné par installer.</p>");
  }
  var today = jour_(), demain = plusJours_(today, 1);
  var j = p.j === demain ? demain : today, msg = "";
  avecVerrou_(function () {
    if (p.a === "fait") { fait_(j); msg = "C'est noté : plus de relance aujourd'hui. Bravo !"; }
    else if (p.a === "joker") { joker_(j); msg = "Pas de séance " + (j === today ? "aujourd'hui" : "demain") + " : c'est ton joker."; }
    else if (p.a === "creneau" && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.h || "")) {
      var s = etat_(j) || nouveau_(CONFIG.HEURE_DEFAUT);
      effacer_(s.choix); s.choix = "";
      planifier_(j, s, p.h);
      msg = "Séance " + (j === today ? "aujourd'hui" : "demain") + " à " + p.h + " : c'est dans ton agenda.";
    }
  });
  if (p.ping) return ContentService.createTextOutput("ok");
  return page_(msg);
}

/* ---------- le cœur ---------- */

function nouveau_(creneau) {
  return { creneau: creneau, choix: "", seance: "", relances: [], fait: false, joker: false };
}

function preparer_(j) {
  var s = etat_(j);
  if (s) return s;                          // déjà prêt, ou choisi à l'avance
  s = nouveau_(CONFIG.HEURE_DEFAUT);
  var matin = a_(j, CONFIG.HEURE_MATIN);
  if (matin > new Date()) {
    s.choix = evenement_("Mon Zoomcamp : à quelle heure aujourd'hui ?", matin, 5,
      "Ta séance est prévue à " + s.creneau + ". Une autre heure, ou pas de séance aujourd'hui ?\n" +
      "Choisis ici : " + lien_(j), [0]);
  }
  planifier_(j, s, s.creneau);
  return s;
}

function planifier_(j, s, creneau) {
  effacer_(s.seance);
  s.relances.forEach(effacer_);
  var debut = a_(j, creneau);
  s.creneau = creneau;
  s.fait = false;
  s.joker = false;
  s.seance = evenement_("Mon Zoomcamp : ta séance", debut, CONFIG.DUREE, texte_(j), [10, 0]);
  s.relances = relancer_(j, debut);
  garder_(j, s);
}

function relancer_(j, debut) {
  var ids = [], fin = a_(j, CONFIG.FIN), now = new Date(), pas = CONFIG.ECART * 60000;
  for (var t = debut.getTime() + pas; t <= fin.getTime(); t += pas) {
    if (t <= now.getTime()) continue;
    ids.push(evenement_("Mon Zoomcamp : pas encore fait ? Lance-toi", new Date(t), 10,
      "Une leçon terminée sur le site arrête les relances du jour.\n\n" + texte_(j), [0]));
  }
  return ids;
}

function fait_(j) {
  var s = etat_(j) || nouveau_(""), now = new Date();
  s.relances.forEach(effacer_);
  s.relances = [];
  if (effacerSiAVenir_(s.seance, now)) s.seance = "";
  if (effacerSiAVenir_(s.choix, now)) s.choix = "";
  s.fait = true;
  s.joker = false;
  garder_(j, s);
}

function joker_(j) {
  var s = etat_(j) || nouveau_(""), now = new Date();
  s.relances.forEach(effacer_);
  s.relances = [];
  effacer_(s.seance);
  s.seance = "";
  if (effacerSiAVenir_(s.choix, now)) s.choix = "";
  s.joker = true;
  s.fait = false;
  garder_(j, s);
}

function texte_(j) {
  return "Commence par le rappel (2 min), puis ta leçon du jour.\n\n" +
    "Ouvrir le site : " + CONFIG.SITE + "\n" +
    "C'est fait, arrête les relances : " + lien_(j, "fait") + "\n" +
    "Changer l'heure ou prendre ton joker : " + lien_(j);
}

/* ---------- ta page ---------- */

function page_(msg) {
  var today = jour_(), demain = plusJours_(today, 1);
  var html = "<style>" +
    "body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7f9;color:#0b0d12}" +
    "main{max-width:560px;margin:0 auto;padding:20px 16px 40px}h1{font-size:26px;margin:4px 0 16px}" +
    "section{background:#fff;border:1px solid #e3e6eb;border-radius:14px;padding:16px;margin:0 0 14px}" +
    "h2{font-size:18px;margin:0 0 4px}.st{color:#555;margin:0 0 12px}.ok{background:#e9f7ee;border:1px solid #b6e2c4;border-radius:10px;padding:10px 12px}" +
    ".g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px}" +
    "a.b{display:block;text-align:center;padding:9px 0;border:1px solid #d6dae1;border-radius:8px;color:#0b0d12;text-decoration:none;font-weight:600}" +
    "a.b.on{background:#146ef5;border-color:#146ef5;color:#fff}.row{display:flex;gap:8px;flex-wrap:wrap}" +
    "a.w{padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:600;background:#0b0d12;color:#fff}a.l{background:#fff;color:#0b0d12;border:1px solid #d6dae1}" +
    "small{color:#666}</style><main><h1>Mes rappels Mon Zoomcamp</h1>" +
    (msg ? "<p class='ok'>" + msg + "</p>" : "") +
    bloc_(today, "Aujourd'hui") + bloc_(demain, "Demain") +
    "<p><small>Tu peux aussi déplacer ta séance directement dans Google Agenda : les relances suivent dans la demi-heure.</small></p>" +
    "<p><a target='_top' class='w l' href='" + CONFIG.SITE + "'>Ouvrir le site</a></p></main>";
  return HtmlService.createHtmlOutput(html)
    .setTitle("Mes rappels Mon Zoomcamp")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function bloc_(j, nom) {
  var s = etat_(j), now = new Date(), today = j === jour_();
  var etat = !s ? "Rien de prévu pour l'instant : séance à " + CONFIG.HEURE_DEFAUT + " si tu ne choisis rien."
    : s.fait ? "Fait ✓ Plus de relance."
    : s.joker ? "Pas de séance : joker."
    : "Séance à " + s.creneau + ", puis une relance par heure jusqu'à " + CONFIG.FIN + " si ce n'est pas fait.";
  var b = "";
  for (var m = 7 * 60; m <= 22 * 60; m += 30) {
    var hm = ("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + m % 60).slice(-2);
    if ((today && a_(j, hm) <= now) || (s && s.fait)) continue;
    var on = s && !s.fait && !s.joker && s.creneau === hm;
    b += "<a target='_top' class='b" + (on ? " on" : "") + "' href='" + lien_(j, "creneau", hm) + "'>" + hm + "</a>";
  }
  var actions = "";
  if (today && !(s && s.fait)) actions += "<a target='_top' class='w' href='" + lien_(j, "fait") + "'>C'est fait ✓</a>";
  if (!(s && (s.joker || s.fait))) actions += "<a target='_top' class='w l' href='" + lien_(j, "joker") + "'>Pas de séance " + (today ? "aujourd'hui" : "demain") + "</a>";
  return "<section><h2>" + nom + "</h2><p class='st'>" + etat + "</p>" +
    (b ? "<p class='st'>Choisis ton heure :</p><div class='g'>" + b + "</div>" : "") +
    "<div class='row'>" + actions + "</div></section>";
}

/* ---------- outils ---------- */

function props_() { return PropertiesService.getScriptProperties(); }
function cal_() { return CalendarApp.getDefaultCalendar(); }
function tz_() { return cal_().getTimeZone(); }
function cle_() { return props_().getProperty("cle"); }
function jour_(d) { return Utilities.formatDate(d || new Date(), tz_(), "yyyy-MM-dd"); }
function hm_(d) { return Utilities.formatDate(d, tz_(), "HH:mm"); }
function a_(j, hm) { return Utilities.parseDate(j + " " + hm, tz_(), "yyyy-MM-dd HH:mm"); }
function plusJours_(j, n) { return jour_(new Date(a_(j, "12:00").getTime() + n * 864e5)); }
function etat_(j) { var v = props_().getProperty("j:" + j); return v ? JSON.parse(v) : null; }
function garder_(j, s) { props_().setProperty("j:" + j, JSON.stringify(s)); }

function lien_(j, a, h) {
  return props_().getProperty("lien") + "?k=" + cle_() + (j ? "&j=" + j : "") + (a ? "&a=" + a : "") + (h ? "&h=" + h : "");
}

function evenement_(titre, debut, minutes, texte, notifs) {
  var e = cal_().createEvent(titre, debut, new Date(debut.getTime() + minutes * 60000), { description: texte });
  e.removeAllReminders();
  notifs.forEach(function (m) { e.addPopupReminder(m); });
  return e.getId();
}

function trouver_(id) {
  if (!id) return null;
  try { return cal_().getEventById(id); } catch (err) { return null; }
}

function effacer_(id) {
  var e = trouver_(id);
  if (!e) return;
  try { e.deleteEvent(); } catch (err) { /* déjà effacé */ }
}

function effacerSiAVenir_(id, now) {
  var e = trouver_(id);
  if (!e || e.getStartTime() <= now) return false;
  try { e.deleteEvent(); } catch (err) { /* déjà effacé */ }
  return true;
}

// La séance est-elle encore dans l'agenda ce jour-là ? (getEventById peut renvoyer un rendez-vous supprimé)
function present_(j, id) {
  var evs = cal_().getEvents(a_(j, "00:00"), a_(plusJours_(j, 1), "00:00"));
  for (var i = 0; i < evs.length; i++) if (evs[i].getId() === id) return evs[i];
  return null;
}

function avecVerrou_(f) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { f(); } finally { lock.releaseLock(); }
}

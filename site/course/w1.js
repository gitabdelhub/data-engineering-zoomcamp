// Workshop dlt : charger une API dans DuckDB. Le cours officiel 2026 fait écrire le pipeline par une IA :
// ici, AB l'écrit lui-même (course/w1/*.md, testés avec dlt 1.31.0), et l'IA arrive en bonus à la leçon 5.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const VIDEO = { yt: "5eMytPBgmVs", label: "Le workshop officiel 2026, par dltHub (en anglais)" };
  COURSE.fill("W1", [
    { type: "lesson", id: "W1-01", title: "Ce que fait dlt", overlay: "course/w1/01.md", min: 50,
      videos: [Object.assign({ optional: true }, VIDEO, { label: VIDEO.label + " : regarde-le une fois en entier pour voir où va le workshop" })], team: true },
    { type: "lesson", id: "W1-02", title: "Une vraie API, page par page", overlay: "course/w1/02.md", min: 60 },
    { type: "lesson", id: "W1-03", title: "Explorer ce que dlt a chargé", overlay: "course/w1/03.md", min: 45 },
    { type: "lesson", id: "W1-04", title: "Recharger sans doublons : merge et incrémental", overlay: "course/w1/04.md", min: 60 },
    { type: "lesson", id: "W1-05", title: "Bonus : l'IA et le serveur MCP de dlt (facultatif)", min: 45,
      src: "cohorts/2026/workshops/dlt/README.md", hash: "ba3c0e47", overlay: "course/w1/05.md", videos: [VIDEO] },
    { type: "homework", id: "W1-hw", title: "Homework du workshop : l'API des taxis", min: 90,
      src: "cohorts/2026/workshops/dlt/dlt_homework.md", hash: "adbb3bc0", overlay: "course/w1/hw.md",
      eyebrow: "Homework de la cohorte 2026, pipeline écrit par toi" },
    { type: "defi", id: "W1-defi", title: "Défi : l'API des zones de taxi", min: 90, overlay: "course/w1/defi.md",
      script: "site/checks/defi-w1.py", codeHash: "75c8be1bf763cf75aca0b1ddc9e953dc2cec3f3682fbc61f757044fd3f12e591", team: true,
      seq: "Deux flux, une table à jour, puis la vérification" }
  ]);
})();

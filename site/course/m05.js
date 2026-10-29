// Module 5 : une plateforme de données avec Bruin. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m05/*.md : AB construit son pipeline dans mon-travail/module-05, sur DuckDB, dans son Codespace.
// hash = 8 premiers caractères du SHA-256 de la leçon quand j'ai écrit les exercices.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const dir = "05-data-platforms/";
  COURSE.fill("05", [
    { type: "lesson", id: "05-01", title: "Une plateforme au lieu de cinq outils", min: 35, src: dir + "01-introduction.md", hash: "dd6227fe", overlay: "course/m05/01.md", prose: true,
      videos: [{ yt: "f6vg7lGqZx0", label: "Introduction à Bruin" }] },
    { type: "lesson", id: "05-02", title: "Installer Bruin, premier pipeline", min: 50, src: dir + "02-getting-started.md", hash: "f6ec6614", overlay: "course/m05/02.md",
      videos: [{ yt: "JJwHKSidX_c", label: "Bien démarrer avec Bruin" }] },
    { type: "lesson", id: "05-03", title: "Le projet, les environnements et les secrets", min: 45, src: dir + "06-core-concepts-projects.md", hash: "e6417bb6", overlay: "course/m05/03.md",
      videos: [{ yt: "YWDjnSxbBtY", label: "Les projets Bruin" }] },
    { type: "lesson", id: "05-04", title: "Le pipeline et ses variables", min: 45, src: dir + "07-core-concepts-pipelines.md", hash: "6950b4df", overlay: "course/m05/04.md",
      videos: [{ yt: "uzp_DiR4Sok", label: "Les pipelines Bruin" }, { yt: "XCx0nDmhhxA", label: "Les variables", optional: true }] },
    { type: "lesson", id: "05-05", title: "L'ingestion : un asset Python et un seed", min: 60, src: dir + "03-nyc-taxi-pipeline.md", hash: "96127193", overlay: "course/m05/05.md",
      videos: [{ yt: "q0k_iz9kWsI", label: "Le pipeline des taxis de bout en bout" }] },
    { type: "lesson", id: "05-06", title: "Le staging, time_interval et les contrôles", min: 60, src: dir + "08-core-concepts-assets.md", hash: "b33a45ae", overlay: "course/m05/06.md",
      videos: [{ yt: "ZElY5SoqrwI", label: "Les assets Bruin" }] },
    { type: "lesson", id: "05-07", title: "Le rapport, les fenêtres et les commandes", min: 60, src: dir + "10-core-concepts-commands.md", hash: "7704ed4e", overlay: "course/m05/07.md",
      videos: [{ yt: "3nykPEs_V7E", label: "Les commandes Bruin" }] },
    { type: "lesson", id: "05-08", title: "Un agent IA et Bruin Cloud", min: 40, src: dir + "04-bruin-mcp.md", hash: "5fa337d3", overlay: "course/m05/08.md",
      videos: [{ yt: "224xH7h8OaQ", label: "Bruin MCP avec un agent IA" }, { yt: "uBqjLEwF8rc", label: "Déployer sur Bruin Cloud", optional: true }], team: true },
    { type: "homework", id: "05-hw", title: "Homework 5 : data platforms", min: 60, src: "cohorts/2026/05-data-platforms/homework.md", hash: "c581fc52", overlay: "course/m05/hw.md" },
    { type: "defi", id: "05-defi", title: "Défi : les pourboires du trimestre", min: 90, overlay: "course/m05/defi.md",
      script: "site/checks/defi-05.py", codeHash: "71a0dfde7ab669a5a3855678c74727aef74a5e3e4456f10ba04aa021d720202d", team: true,
      seq: "Un deuxième pipeline, deux runs, puis la vérification" }
  ]);
})();

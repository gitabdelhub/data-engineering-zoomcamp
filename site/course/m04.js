// Module 4 : l'analytics engineering avec dbt. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m04/*.md : AB construit son propre projet mon_taxi, sur DuckDB, dans son Codespace.
// hash = 8 premiers caractères du SHA-256 de la leçon quand j'ai écrit les exercices.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const dir = "04-analytics-engineering/";
  COURSE.fill("04", [
    { type: "lesson", id: "04-01", title: "L'analytics engineering", min: 45, src: dir + "01-analytics-engineering-basics.md", hash: "3ca97093", overlay: "course/m04/01.md", prose: true,
      videos: [{ yt: "uF76d5EmdtU", label: "Les bases de l'analytics engineering" }] },
    { type: "lesson", id: "04-02", title: "dbt, les données et ton projet", min: 75, src: dir + "02-what-is-dbt.md", hash: "23b4e8e9", overlay: "course/m04/02.md",
      videos: [{ yt: "gsKuETFJr54", label: "Qu'est-ce que dbt ?" }], team: true },
    { type: "lesson", id: "04-03", title: "Les sources et le premier modèle", min: 50, src: dir + "05-dbt-sources.md", hash: "5fedb74e", overlay: "course/m04/03.md",
      videos: [{ yt: "7CrrXazV_8k", label: "Les sources dans dbt" }] },
    { type: "lesson", id: "04-04", title: "ref(), Jinja et la couche intermediate", min: 60, src: dir + "06-dbt-models.md", hash: "6f02a29a", overlay: "course/m04/04.md",
      videos: [{ yt: "JQYz-8sl1aQ", label: "Les modèles dbt" }] },
    { type: "lesson", id: "04-05", title: "Seeds, macros et packages", min: 60, src: dir + "07-dbt-seeds-and-macros.md", hash: "178256b2", overlay: "course/m04/05.md",
      videos: [{ yt: "lT4fmTDEqVk", label: "Seeds et macros" }, { yt: "KfhUA9Kfp8Y", label: "Les packages dbt", optional: true }] },
    { type: "lesson", id: "04-06", title: "Le schéma en étoile et l'incrémental", min: 60, src: dir + "04-dbt-project-structure.md", hash: "18404f44", overlay: "course/m04/06.md",
      videos: [{ yt: "2dYDS4OQbT0", label: "La structure d'un projet dbt" }] },
    { type: "lesson", id: "04-07", title: "Les tests", min: 60, src: dir + "09-dbt-tests.md", hash: "2466f41a", overlay: "course/m04/07.md",
      videos: [{ yt: "bvZ-rJm7uMU", label: "Les tests dbt" }] },
    { type: "lesson", id: "04-08", title: "La documentation", min: 40, src: dir + "08-documentation.md", hash: "744df8ad", overlay: "course/m04/08.md",
      videos: [{ yt: "UqoWyMjcqrA", label: "La documentation dbt" }] },
    { type: "lesson", id: "04-09", title: "Les commandes et la prod", min: 60, src: dir + "11-dbt-commands.md", hash: "f4c40fc4", overlay: "course/m04/09.md",
      videos: [{ yt: "t4OeWHW3SsA", label: "Les commandes dbt" }], team: true },
    { type: "homework", id: "04-hw", title: "Homework 4 : analytics engineering", min: 150, src: "cohorts/2026/04-analytics-engineering/homework.md", hash: "f9211fe6", overlay: "course/m04/hw.md" },
    { type: "defi", id: "04-defi", title: "Défi : le rapport des aéroports", min: 90, overlay: "course/m04/defi.md",
      script: "site/checks/defi-04.py", codeHash: "9c7d55a785c3c5f28b2ddd34764b74684be0150daa95991ccfa471353f2297a9", team: true,
      seq: "Un modèle, ses tests, sa documentation, puis la vérification" }
  ]);
})();

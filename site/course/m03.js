// Module 3 : le data warehouse avec BigQuery. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m03/*.md, sur les taxis verts 2019-2020 de ton propre bucket.
// hash = 8 premiers caractères du SHA-256 de la leçon quand j'ai écrit les exercices.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const dir = "03-data-warehouse/";
  COURSE.fill("03", [
    { type: "lesson", id: "03-01", title: "Data warehouse et BigQuery", min: 90, src: dir + "01-data-warehouse-and-bigquery.md", hash: "60d9a459", overlay: "course/m03/01.md",
      videos: [{ yt: "jrHljAoD6nM", label: "Data warehouse et BigQuery" }], team: true },
    { type: "lesson", id: "03-02", title: "Partitionnement et clustering", min: 60, src: dir + "02-partitioning-vs-clustering.md", hash: "ad1cdd8d", overlay: "course/m03/02.md",
      videos: [{ yt: "-CqXf7vhhDs", label: "Partitionnement et clustering" }] },
    { type: "lesson", id: "03-03", title: "Les bonnes pratiques de BigQuery", min: 45, src: dir + "03-bigquery-best-practices.md", hash: "c033d314", overlay: "course/m03/03.md",
      videos: [{ yt: "k81mLJVX08w", label: "Les bonnes pratiques de BigQuery" }] },
    { type: "lesson", id: "03-04", title: "Dans les coulisses de BigQuery", min: 45, src: dir + "04-internals-of-bigquery.md", hash: "026ffee4", overlay: "course/m03/04.md",
      videos: [{ yt: "eduHi1inM4s", label: "Dans les coulisses de BigQuery" }] },
    { type: "lesson", id: "03-05", title: "Le machine learning dans BigQuery", min: 75, src: dir + "05-machine-learning-in-bigquery.md", hash: "b99b371d", overlay: "course/m03/05.md",
      videos: [{ yt: "B-WtpB0PuG4", label: "Le machine learning dans BigQuery" }] },
    { type: "lesson", id: "03-06", title: "Servir le modèle avec Docker (facultatif)", min: 60, src: dir + "06-deploying-a-machine-learning-model.md", hash: "5d7a3f31", overlay: "course/m03/06.md",
      videos: [{ yt: "BjARzEWaznU", label: "Déployer un modèle BigQuery ML" }] },
    { type: "homework", id: "03-hw", title: "Homework 3 : data warehouse", min: 150, src: "cohorts/2026/03-data-warehouse/homework.md", hash: "c302c31c", overlay: "course/m03/hw.md" },
    { type: "defi", id: "03-defi", title: "Défi : le tableau de bord des bases VTC", min: 120, overlay: "course/m03/defi.md",
      script: "site/checks/defi-03.py", codeHash: "803eae1aae50a8ed31a423813d9e1c8cbf7f996b03e932b8458dd0e1ab973d8e", team: true,
      seq: "Charger, nettoyer, partitionner, puis la vérification" }
  ]);
})();

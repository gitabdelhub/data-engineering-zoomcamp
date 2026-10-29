// Projet final : AB construit son propre pipeline, dans son propre dépôt. Le texte vient du repo officiel (src),
// mes jalons sont dans course/mp/*.md : guides et exemples sur un autre jeu de données, jamais le projet d'AB à sa place.
// hash = 8 premiers caractères du SHA-256 du texte officiel quand j'ai écrit les jalons.
// min = durée indicative en minutes : un projet prend des semaines, c'est le temps de la première séance.
(function () {
  const readme = "projects/README.md";
  COURSE.fill("P", [
    { type: "lesson", id: "P-01", title: "Ton problème, tes données, ton dépôt", min: 90, src: "projects/datasets.md", hash: "3b0080fe", overlay: "course/mp/01.md",
      videos: [{ yt: "BL0E8xO8OnE", label: "Comment réussir son projet" }] },
    { type: "lesson", id: "P-02", title: "L'infrastructure en code, déployée par une Action", min: 120, src: readme, hash: "f31d4b70", overlay: "course/mp/02.md", team: true },
    { type: "lesson", id: "P-03", title: "L'ingestion jusqu'au data lake", min: 120, src: readme, hash: "f31d4b70", overlay: "course/mp/03.md" },
    { type: "lesson", id: "P-04", title: "Le warehouse et les transformations", min: 120, src: readme, hash: "f31d4b70", overlay: "course/mp/04.md" },
    { type: "lesson", id: "P-05", title: "Le tableau de bord", min: 90, src: readme, hash: "f31d4b70", overlay: "course/mp/05.md" },
    { type: "lesson", id: "P-06", title: "Reproductible, relu, rendu", min: 90, src: "cohorts/2026/project.md", hash: "73cefa77", overlay: "course/mp/06.md", team: true }
  ]);
})();

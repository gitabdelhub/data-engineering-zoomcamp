// Module 0 : ton poste de travail. Le texte et les exercices sont dans course/m00/*.md.
COURSE.fill("00", [
  { type: "lesson", id: "00-01", title: "La méthode de ce cours", overlay: "course/m00/01-methode.md",
    videos: [{ yt: "JgspdlKXS-w", label: "Le lancement de la cohorte 2026 : présentation du cours (en anglais, facultatif)" }] },
  { type: "lesson", id: "00-02", title: "Ton Codespace et le terminal", overlay: "course/m00/02-codespace.md" },
  { type: "lesson", id: "00-03", title: "Git : enregistrer ton travail", overlay: "course/m00/03-git-commits.md", verify: "gitignore" },
  { type: "lesson", id: "00-04", title: "Branches et pull requests", overlay: "course/m00/04-branches-pr.md", verify: "mergedPR", team: true },
  { type: "lesson", id: "00-05", title: "Ton site en ligne avec GitHub Pages", overlay: "course/m00/05-pages.md", verify: "moiJson" },
  { type: "lesson", id: "00-06", title: "Synchroniser ton fork automatiquement", overlay: "course/m00/06-sync.md", verify: "syncWorkflow" },
  { type: "lesson", id: "00-07", title: "Ton environnement en code : le devcontainer", overlay: "course/m00/07-devcontainer.md", verify: "devcontainer" }
]);

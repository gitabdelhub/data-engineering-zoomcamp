// Module 0 : ton poste de travail. Le texte et les exercices sont dans course/m00/*.md.
// min = durée indicative en minutes, pour savoir si une leçon tient dans ta séance.
COURSE.fill("00", [
  { type: "lesson", id: "00-01", title: "La méthode de ce cours", overlay: "course/m00/01-methode.md", min: 10, prose: true,
    videos: [{ yt: "JgspdlKXS-w", label: "Le lancement de la cohorte 2026 : présentation du cours (en anglais)", optional: true }] },
  { type: "lesson", id: "00-02", title: "Ton Codespace et le terminal", overlay: "course/m00/02-codespace.md", min: 20 },
  { type: "lesson", id: "00-03", title: "Git : enregistrer ton travail", overlay: "course/m00/03-git-commits.md", min: 30, verify: "gitignore" },
  { type: "lesson", id: "00-04", title: "Branches et pull requests", overlay: "course/m00/04-branches-pr.md", min: 40, verify: "mergedPR", team: true },
  { type: "lesson", id: "00-05", title: "Ton site en ligne avec GitHub Pages", overlay: "course/m00/05-pages.md", min: 25, verify: "moiJson" },
  { type: "lesson", id: "00-06", title: "Synchroniser ton fork automatiquement", overlay: "course/m00/06-sync.md", min: 45, verify: "syncWorkflow" },
  { type: "lesson", id: "00-07", title: "Ton environnement en code : le devcontainer", overlay: "course/m00/07-devcontainer.md", min: 40, verify: "devcontainer" }
]);

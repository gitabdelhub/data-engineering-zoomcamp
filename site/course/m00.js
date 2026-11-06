// Module 0 : ton poste de travail et Git, depuis zéro. Le texte et les exercices sont dans course/m00/*.md.
// Les leçons Git (00-03 à 00-10) suivent la méthode « Pour les nuls » : l'essentiel en 5 minutes (« @@ essentiel »),
// deux niveaux de Labo Git (les autres sont en bonus), puis le vrai exercice dans le Codespace.
// Le détail technique est replié. 00-14 est l'antisèche de tout le module.
// min = durée indicative en minutes, pour savoir si une leçon tient dans ta séance.
COURSE.fill("00", [
  { type: "lesson", id: "00-01", title: "La méthode de ce cours", overlay: "course/m00/01-methode.md", min: 10, prose: true,
    videos: [{ yt: "JgspdlKXS-w", label: "Le lancement de la cohorte 2026 : présentation du cours (en anglais)", optional: true }] },
  { type: "lesson", id: "00-02", title: "Ton Codespace et le terminal", overlay: "course/m00/02-codespace.md", min: 20 },
  { type: "lesson", id: "00-03", title: "Git, c'est quoi ? Ton premier dépôt", overlay: "course/m00/03-git-init.md", min: 15 },
  { type: "lesson", id: "00-04", title: "Ton premier commit : les trois zones", overlay: "course/m00/04-commit.md", min: 20 },
  { type: "lesson", id: "00-05", title: "Revenir en arrière et ignorer des fichiers", overlay: "course/m00/05-annuler.md", min: 20 },
  { type: "lesson", id: "00-06", title: "Les branches et la fusion", overlay: "course/m00/06-branches.md", min: 20 },
  { type: "lesson", id: "00-07", title: "Ton premier conflit", overlay: "course/m00/07-conflit.md", min: 20 },
  { type: "lesson", id: "00-08", title: "GitHub : clone, push et pull", overlay: "course/m00/08-github.md", min: 25, verify: "gitignore" },
  { type: "lesson", id: "00-09", title: "En équipe : branche, pull request et revue", overlay: "course/m00/09-pull-request.md", min: 30, verify: "mergedPR", team: true },
  { type: "lesson", id: "00-10", title: "En équipe : quand le travail se croise", overlay: "course/m00/10-equipe.md", min: 25, team: true },
  { type: "lesson", id: "00-14", title: "L'antisèche Git et les 10 erreurs du débutant", overlay: "course/m00/14-antiseche.md", min: 10, prose: true },
  { type: "lesson", id: "00-11", title: "Ton site en ligne avec GitHub Pages", overlay: "course/m00/11-pages.md", min: 25, verify: "moiJson" },
  { type: "lesson", id: "00-12", title: "Synchroniser ton fork automatiquement", overlay: "course/m00/12-sync.md", min: 45, verify: "syncWorkflow" },
  { type: "lesson", id: "00-13", title: "Ton environnement en code : le devcontainer", overlay: "course/m00/13-devcontainer.md", min: 40, verify: "devcontainer" }
]);

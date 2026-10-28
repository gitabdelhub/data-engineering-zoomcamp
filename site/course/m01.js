// Module 1 : Docker et Terraform. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m01/*.md. hash = 8 premiers caractères du SHA-256 de la leçon
// au moment où j'ai écrit les exercices : s'il change, le site affiche « Leçon modifiée ».
(function () {
  const WORKSHOP = { yt: "lP8xXebHmuE", label: "Atelier Docker, Postgres et ingestion", shared: "Une seule vidéo couvre les leçons 1 à 9 et 11. Le site la reprend là où tu t'es arrêté : avance jusqu'à la partie de cette leçon." };
  const dir = "01-docker-terraform/";
  COURSE.fill("01", [
    { type: "lesson", id: "01-01", title: "Introduction à Docker", src: dir + "01-introduction.md", hash: "60a0cb48", overlay: "course/m01/01.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-02", title: "Environnements virtuels et pipelines", src: dir + "02-virtual-environment.md", hash: "609617f6", overlay: "course/m01/02.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-03", title: "Dockeriser le pipeline", src: dir + "03-dockerizing-pipeline.md", hash: "8a18a5eb", overlay: "course/m01/03.md", videos: [WORKSHOP], team: true },
    { type: "lesson", id: "01-04", title: "PostgreSQL dans Docker", src: dir + "04-postgres-docker.md", hash: "ddacaee4", overlay: "course/m01/04.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-05", title: "Le dataset NY Taxi et l'ingestion", src: dir + "05-data-ingestion.md", hash: "5207a472", overlay: "course/m01/05.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-06", title: "Le script d'ingestion", src: dir + "06-ingestion-script.md", hash: "1adff5dd", overlay: "course/m01/06.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-07", title: "pgAdmin et les réseaux Docker", src: dir + "07-pgadmin.md", hash: "312f4fc3", overlay: "course/m01/07.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-08", title: "Dockeriser l'ingestion", src: dir + "08-dockerizing-ingestion.md", hash: "80f9335e", overlay: "course/m01/08.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-09", title: "Docker Compose", src: dir + "09-docker-compose.md", hash: "b8065c52", overlay: "course/m01/09.md", videos: [WORKSHOP], team: true },
    { type: "lesson", id: "01-10", title: "Rappels SQL", src: dir + "10-sql-refresher.md", hash: "b18b9375", overlay: "course/m01/10.md",
      videos: [{ yt: "QEcps_iskgg", label: "Rappels SQL" }] },
    { type: "lesson", id: "01-11", title: "Nettoyage", src: dir + "11-cleanup.md", hash: "022b5db5", overlay: "course/m01/11.md", videos: [WORKSHOP] },
    { type: "lesson", id: "01-12", title: "Terraform", src: dir + "12-terraform-overview.md", hash: "839fc56c", overlay: "course/m01/12.md",
      videos: [
        { yt: "s2bOYDCKl_M", label: "Terraform : concepts et vue d'ensemble" },
        { yt: "Y2ux7gq3Z0o", label: "Terraform : un premier déploiement en un seul fichier" },
        { yt: "PBi0hHjLftk", label: "Terraform : déployer avec un fichier de variables" }
      ] },
    { type: "lesson", id: "01-13", title: "Google Cloud", src: dir + "13-gcp-overview.md", hash: "836ade16", overlay: "course/m01/13.md",
      videos: [{ yt: "18jIzE41fJ4", label: "Introduction à Google Cloud" }] },
    { type: "homework", id: "01-hw", title: "Homework 1 : Docker et SQL", src: "cohorts/2026/01-docker-terraform/homework.md", hash: "b1046958", overlay: "course/m01/hw.md" },
    { type: "defi", id: "01-defi", title: "Défi : les aéroports du monde", overlay: "course/m01/defi.md", script: "site/checks/defi-01.sh",
      codeHash: "6ad95425d4aa9b2f529e087aa28c37f3600302fd3d46e5822efb51a82c49b4b9", team: true }
  ]);
})();

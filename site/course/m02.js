// Module 2 : l'orchestration avec Airflow 3. Le cours officiel 2026 utilise Kestra (il est en bonus) :
// ici, le texte et les exercices sont à moi, dans course/m02/*.md, testés sur Airflow 3.3.2.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const COMPOSE_VIDEO = { yt: "PbSIVDou17Q", label: "Une compose Airflow 3 minimale, de Data Slinger (en anglais)" };
  COURSE.fill("02", [
    { type: "lesson", id: "02-01", title: "Pourquoi un orchestrateur", overlay: "course/m02/01-orchestration.md", min: 30, prose: true,
      videos: [{ yt: "-JLnp-iLins", label: "L'orchestration, la vidéo officielle du Zoomcamp (les exemples sont avec Kestra, les idées sont les mêmes)", optional: true }] },
    { type: "lesson", id: "02-02", title: "Installer Airflow 3 avec Docker Compose", overlay: "course/m02/02-installer.md", min: 60, videos: [COMPOSE_VIDEO] },
    { type: "lesson", id: "02-03", title: "Ton premier DAG", overlay: "course/m02/03-premier-dag.md", min: 50,
      videos: [{ yt: "dX6p-EwnkP4", label: "Écrire ton premier DAG avec Airflow 3, de Marc Lamberti (en anglais)" }], team: true },
    { type: "lesson", id: "02-04", title: "Tâches, dépendances et XCom", overlay: "course/m02/04-xcom.md", min: 45 },
    { type: "lesson", id: "02-05", title: "Connexions et hooks", overlay: "course/m02/05-connexions.md", min: 45 },
    { type: "lesson", id: "02-06", title: "Templates Jinja et paramètres", overlay: "course/m02/06-jinja.md", min: 45,
      videos: [{ yt: "_QZFgQcGPYA", label: "Les paramètres dans le formulaire Trigger d'Airflow 3, Airflow Summit (en anglais)", optional: true }] },
    { type: "lesson", id: "02-07", title: "Le pipeline des taxis vers Postgres", overlay: "course/m02/07-pipeline.md", min: 90, team: true },
    { type: "lesson", id: "02-08", title: "Planification et backfill", overlay: "course/m02/08-planification.md", min: 60,
      videos: [{ yt: "_1sIZg8a4Ic", label: "Les backfills dans Airflow 3, d'Astronomer (en anglais)" }] },
    { type: "lesson", id: "02-09", title: "Le même pipeline vers Google Cloud", overlay: "course/m02/09-gcp.md", min: 75, videos: [COMPOSE_VIDEO] },
    { type: "lesson", id: "02-10", title: "Bonnes pratiques et débogage", overlay: "course/m02/10-bonnes-pratiques.md", min: 50 },
    { type: "homework", id: "02-hw", title: "Homework 2 : orchestration", min: 180, overlay: "course/m02/hw.md",
      eyebrow: "Homework de la cohorte 2026, fait avec Airflow" },
    { type: "defi", id: "02-defi", title: "Défi : les VTC de New York au printemps 2020", min: 150, overlay: "course/m02/defi.md",
      script: "site/checks/defi-02.sh", codeHash: "a96ce03ef94fd2cef75c8650ec8cefd1a3f010f59931503085307d42c258a156", team: true,
      seq: "Un DAG planifié, un backfill, puis la vérification" }
  ]);
})();

// Module 6 : le traitement par lots avec Spark. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m06/*.md : AB travaille dans mon-travail/module-06, avec PySpark installé par uv, dans son Codespace.
// hash = 8 premiers caractères du SHA-256 de la leçon quand j'ai écrit les exercices.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const dir = "06-batch/";
  COURSE.fill("06", [
    { type: "lesson", id: "06-01", title: "Le traitement par lots et Spark", min: 35, src: dir + "01-introduction-to-batch-processing.md", hash: "109abca8", overlay: "course/m06/01.md", prose: true,
      videos: [{ yt: "dcHe5Fl3MF8", label: "Le traitement par lots" }, { yt: "FhaqbEOuQ8U", label: "Introduction à Spark" }] },
    { type: "lesson", id: "06-02", title: "Spark dans ton Codespace", min: 45, src: dir + "03-installing-spark.md", hash: "2e8c950f", overlay: "course/m06/02.md",
      videos: [{ yt: "hqUbB9c8sKg", label: "Installer Spark" }] },
    { type: "lesson", id: "06-03", title: "Un gros CSV, un schéma, des partitions", min: 60, src: dir + "04-first-look-at-spark.md", hash: "18ddd329", overlay: "course/m06/03.md",
      videos: [{ yt: "r_Sf6fCB40c", label: "Premier regard sur PySpark" }] },
    { type: "lesson", id: "06-04", title: "Les DataFrames : transformations et actions", min: 50, src: dir + "05-spark-dataframes.md", hash: "41f24e4b", overlay: "course/m06/04.md",
      videos: [{ yt: "ti3aC1m3rE8", label: "Les DataFrames de Spark" }] },
    { type: "lesson", id: "06-05", title: "Préparer les taxis verts et jaunes", min: 60, src: dir + "06-preparing-taxi-data.md", hash: "1b459a16", overlay: "course/m06/05.md",
      videos: [{ yt: "CI3P4tAtru4", label: "Préparer les données des taxis" }] },
    { type: "lesson", id: "06-06", title: "Le SQL avec Spark", min: 50, src: dir + "07-sql-with-spark.md", hash: "a24d4d35", overlay: "course/m06/06.md",
      videos: [{ yt: "uAlp2VuZZPY", label: "Le SQL avec Spark" }] },
    { type: "lesson", id: "06-07", title: "Le cluster, le group by et le shuffle", min: 55, src: dir + "09-groupby-in-spark.md", hash: "f0ae3eb0", overlay: "course/m06/07.md",
      videos: [{ yt: "68CipcZt7ZA", label: "L'anatomie d'un cluster Spark" }, { yt: "9qrDsY_2COo", label: "Le group by dans Spark" }] },
    { type: "lesson", id: "06-08", title: "Les jointures", min: 50, src: dir + "10-joins-in-spark.md", hash: "45c2355a", overlay: "course/m06/08.md",
      videos: [{ yt: "lu7TrqAWuH4", label: "Les jointures dans Spark" }] },
    { type: "lesson", id: "06-09", title: "Les RDD et mapPartitions (facultatif)", min: 45, src: dir + "11-operations-on-spark-rdds.md", hash: "986aaa66", overlay: "course/m06/09.md",
      videos: [{ yt: "Bdu-xIrF3OM", label: "Les opérations sur les RDD", optional: true }, { yt: "k3uB2K99roI", label: "mapPartitions", optional: true }] },
    { type: "lesson", id: "06-10", title: "Un cluster local et spark-submit", min: 50, src: dir + "14-creating-a-local-spark-cluster.md", hash: "c5017662", overlay: "course/m06/10.md",
      videos: [{ yt: "HXBwSlXo5IA", label: "Créer un cluster Spark local" }], team: true },
    { type: "lesson", id: "06-11", title: "Spark dans Google Cloud", min: 75, src: dir + "15-setting-up-a-dataproc-cluster.md", hash: "7b2c2336", overlay: "course/m06/11.md",
      videos: [{ yt: "Yyz293hBVcQ", label: "Spark et Google Cloud Storage" }, { yt: "osAiAYahvh8", label: "Un cluster Dataproc" }, { yt: "HIm2BOj8C0Q", label: "Spark et BigQuery" }] },
    { type: "homework", id: "06-hw", title: "Homework 6 : batch processing", min: 90, src: "cohorts/2026/06-batch/homework.md", hash: "62c122f8", overlay: "course/m06/hw.md" },
    { type: "defi", id: "06-defi", title: "Défi : les heures de pointe de 2020", min: 90, overlay: "course/m06/defi.md",
      script: "site/checks/defi-06.py", codeHash: "9d4b4e28e4aecb9ae34aa3d6fdafdf71ca2d769e90b93b83736b8d984ab6419c", team: true,
      seq: "Un script Spark, spark-submit sur ton cluster, puis la vérification" }
  ]);
})();

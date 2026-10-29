// Module 7 : le streaming avec Redpanda (Kafka) et Flink. Le texte des leçons vient du repo officiel (src),
// mes exercices sont dans course/m07/*.md : AB construit son projet dans mon-travail/module-07, avec Docker Compose, dans son Codespace.
// hash = 8 premiers caractères du SHA-256 de la leçon quand j'ai écrit les exercices.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const dir = "07-streaming/";
  const WORKSHOP = { yt: "YDUgFeHQzJU", label: "Atelier streaming : Redpanda, Python et Flink", shared: "Une seule vidéo couvre tout le module. Le site la reprend là où tu t'es arrêté : avance jusqu'à la partie de cette leçon." };
  COURSE.fill("07", [
    { type: "lesson", id: "07-01", title: "Le streaming : des événements, pas des lots", min: 30, src: dir + "01-introduction.md", hash: "e5b3f231", overlay: "course/m07/01.md", prose: true,
      videos: [WORKSHOP, { yt: "P2loELMUUeI", label: "Le live 2025 avec Zach Wilson", optional: true }] },
    { type: "lesson", id: "07-02", title: "Redpanda, un broker compatible Kafka", min: 45, src: dir + "02-redpanda.md", hash: "40e8923e", overlay: "course/m07/02.md", videos: [WORKSHOP] },
    { type: "lesson", id: "07-03", title: "Produire des messages", min: 50, src: dir + "03-produce-messages-to-kafka.md", hash: "9b8933c7", overlay: "course/m07/03.md", videos: [WORKSHOP] },
    { type: "lesson", id: "07-04", title: "Consommer : les groupes et les offsets", min: 45, src: dir + "04-consume-messages-with-python.md", hash: "06d128ec", overlay: "course/m07/04.md", videos: [WORKSHOP] },
    { type: "lesson", id: "07-05", title: "Ranger les événements dans PostgreSQL", min: 45, src: dir + "05-save-events-to-postgresql.md", hash: "7af7c0e1", overlay: "course/m07/05.md", videos: [WORKSHOP] },
    { type: "lesson", id: "07-06", title: "Pourquoi Flink, et son image Docker", min: 55, src: dir + "07-the-flink-image-and-services.md", hash: "4b845fe7", overlay: "course/m07/06.md", videos: [WORKSHOP] },
    { type: "lesson", id: "07-07", title: "Le premier job Flink et les offsets", min: 50, src: dir + "08-the-pass-through-flink-job.md", hash: "9f0deb23", overlay: "course/m07/07.md", videos: [WORKSHOP] },
    { type: "lesson", id: "07-08", title: "Les fenêtres et le watermark", min: 65, src: dir + "10-aggregation-with-tumbling-windows.md", hash: "881a4ca2", overlay: "course/m07/08.md", videos: [WORKSHOP] },
    { type: "lesson", id: "07-09", title: "Les retards, les autres fenêtres et le ménage", min: 55, src: dir + "12-understanding-window-types.md", hash: "ecdfc7dd", overlay: "course/m07/09.md", videos: [WORKSHOP], team: true },
    { type: "homework", id: "07-hw", title: "Homework 7 : streaming", min: 120, src: "cohorts/2026/07-streaming/homework.md", hash: "48c49503", overlay: "course/m07/hw.md" },
    { type: "defi", id: "07-defi", title: "Défi : les pourboires en direct", min: 90, overlay: "course/m07/defi.md",
      script: "site/checks/defi-07.py", codeHash: "a6315c91422ba0076a90c4453fa38d9bd2a75dbf596980fc48db6502d2cf0c2b", team: true,
      seq: "Un producteur, un job Flink qui tourne, puis la vérification" }
  ]);
})();

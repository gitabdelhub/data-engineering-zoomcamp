// Module K (Bibliothèque, hors parcours) : Kubernetes. Il suit le module 10 du ML Zoomcamp et son workshop
// (https://github.com/DataTalksClub/machine-learning-zoomcamp/tree/main/10-kubernetes), fichiers figés au commit da53bea.
// Le texte est à moi, dans course/mk/*.md ; leçons 7 à 9 et défi ajoutés pour les data engineers.
// Il ne dépend d'aucun autre module : le modèle et le code sont fournis.
// min = durée indicative en minutes, vidéo comprise.
(function () {
  const WS = { yt: "c_CzCsCnWoU", label: "Le workshop Kubernetes et ONNX du ML Zoomcamp (en anglais)" };
  COURSE.fill("K", [
    { type: "lesson", light: true, id: "K-01", title: "Pourquoi Kubernetes", overlay: "course/mk/01.md", min: 30, prose: true,
      videos: [{ yt: "UjVkpszDzgk", label: "Introduction à Kubernetes, leçon 10.5 du ML Zoomcamp (en anglais)" }] },
    { type: "lesson", id: "K-02", title: "Un cluster kind dans ton Codespace", overlay: "course/mk/02.md", min: 40, videos: [WS] },
    { type: "lesson", light: "p", id: "K-03", title: "Le service de prédiction dans Docker", overlay: "course/mk/03.md", min: 45, videos: [WS] },
    { type: "lesson", id: "K-04", title: "Deployment, Service et sondes de santé", overlay: "course/mk/04.md", min: 50, videos: [WS] },
    { type: "lesson", id: "K-05", title: "Mettre à jour, revenir en arrière, déboguer", overlay: "course/mk/05.md", min: 50 },
    { type: "lesson", light: "p", id: "K-06", title: "L'autoscaling avec le HPA", overlay: "course/mk/06.md", min: 40, videos: [WS] },
    { type: "lesson", id: "K-07", title: "Postgres dans le cluster : Secret, ConfigMap et disque", overlay: "course/mk/07.md", min: 50 },
    { type: "lesson", id: "K-08", title: "Jobs et CronJobs : une ingestion planifiée", overlay: "course/mk/08.md", min: 50 },
    { type: "lesson", light: "p", id: "K-09", title: "Helm : empaqueter tes manifestes", overlay: "course/mk/09.md", min: 45 },
    { type: "defi", id: "K-defi", title: "Défi : l'ingestion mensuelle des taxis verts", min: 90, overlay: "course/mk/defi.md",
      script: "site/checks/defi-k8s.py", codeHash: "4b14263745fcff4f7ddd0f8adb1ba3c5f87e34a14eeb96c4714ff1a538a9adcb",
      seq: "Un programme idempotent, un CronJob, deux runs, puis la vérification" }
  ]);
})();

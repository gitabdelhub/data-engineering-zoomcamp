// Le plan du cours : les modules dans l'ordre conseillé (tout est ouvert).
// dir / docs : le cours officiel d'un module pas encore construit, lisible en aperçu.
// Le contenu de chaque module (leçons, homework, défi) est ajouté par course/mXX.js.
window.COURSE = {
  title: "Mon Zoomcamp",
  // Repli quand le site n'est pas servi depuis <user>.github.io/<repo>/
  repo: { owner: "gitabdelhub", name: "data-engineering-zoomcamp", branch: "main" },
  upstream: { owner: "DataTalksClub", name: "data-engineering-zoomcamp", branch: "main" },
  playlist: "https://www.youtube.com/playlist?list=PL3MmuxUbc_hJed7dXYoJw8DoCuVHhGEQb",
  faq: "https://datatalks.club/faq/data-engineering-zoomcamp.html",
  modules: [
    {
      id: "00", title: "Préparer ton poste", chips: ["Codespaces", "Git", "GitHub Actions"],
      cover: ["#3a4250", "#0d1117"], logo: ["github", "#181717"],
      sats: [["githubactions", "#2088FF"], ["git", "#F05032"]], help: 3,
      gate: "Ta synchro du fork et ton devcontainer", items: []
    },
    {
      id: "01", title: "Docker et Terraform", chips: ["Docker", "Postgres", "Terraform"],
      cover: ["#4fb3ff", "#1360c4"], logo: ["docker", "#2496ED"],
      sats: [["postgresql", "#4169E1"], ["terraform", "#844FBA"], ["googlecloud", "#4285F4"]], help: 3,
      gate: "Homework 1 et défi des aéroports", items: []
    },
    {
      id: "02", title: "Orchestration avec Airflow", chips: ["Airflow 3", "GCS"],
      cover: ["#4aa8ff", "#0b3f8a"], logo: ["apacheairflow", "#017CEE"],
      sats: [["googlecloud", "#4285F4"], ["postgresql", "#4169E1"]], help: 3,
      planned: 10, gate: "Homework 2", items: []
    },
    {
      id: "W1", docs: [["Le workshop dlt : présentation", "cohorts/2026/workshops/dlt.md"], ["Le workshop dlt : pas à pas", "cohorts/2026/workshops/dlt/README.md"]], title: "Workshop ingestion", chips: ["dlt", "API"],
      cover: ["#59c1d5", "#0e3f4a"], logo: ["dlt"], wide: true,
      sats: [["duckdb", "#000000"]], help: 2,
      planned: 2, gate: "Homework du workshop", items: []
    },
    {
      id: "03", dir: "03-data-warehouse", title: "Data warehouse", chips: ["BigQuery", "BigQuery ML"],
      cover: ["#8ab4ff", "#1a57d6"], logo: ["googlebigquery", "#4285F4"],
      sats: [["googlecloud", "#4285F4"]], help: 2,
      planned: 6, gate: "Homework 3", items: []
    },
    {
      id: "04", dir: "04-analytics-engineering", title: "Analytics engineering", chips: ["dbt", "DuckDB"],
      cover: ["#ff9a7f", "#d93f1f"], logo: ["dbt", "#FF694B"],
      sats: [["duckdb", "#000000"], ["googlebigquery", "#4285F4"]], help: 2,
      planned: 11, gate: "Homework 4 et ta CI dbt au vert", team: true, items: []
    },
    {
      id: "05", dir: "05-data-platforms", title: "Data platforms", chips: ["Bruin"],
      cover: ["#ff8a96", "#c42a3f"], logo: ["bruin"],
      sats: [["googlebigquery", "#4285F4"]], help: 2,
      planned: 10, gate: "Homework 5", items: []
    },
    {
      id: "06", dir: "06-batch", title: "Batch processing", chips: ["Spark", "Dataproc"],
      cover: ["#ff9a5c", "#b83c06"], logo: ["apachespark", "#E25A1C"],
      sats: [["googlecloud", "#4285F4"], ["googlebigquery", "#4285F4"]], help: 1,
      planned: 16, gate: "Homework 6", items: []
    },
    {
      id: "07", dir: "07-streaming", title: "Streaming", chips: ["Kafka", "Flink"],
      cover: ["#4a4a4a", "#0a0a0a"], logo: ["apachekafka", "#231F20"],
      sats: [["apacheflink", "#E6526F"], ["postgresql", "#4169E1"]], help: 1,
      planned: 14, gate: "Homework 7", items: []
    },
    {
      id: "P", docs: [["L'énoncé officiel du projet final", "cohorts/2026/project.md"]], title: "Projet final", chips: ["Ton dataset", "Terraform en CD", "Dashboard"],
      cover: ["#4d93ff", "#0b4fc4"], logo: ["github", "#181717"],
      sats: [["docker", "#2496ED"], ["terraform", "#844FBA"], ["googlebigquery", "#4285F4"], ["dbt", "#FF694B"]], help: 1,
      planned: 4, gate: "Ton projet rendu et relu", team: true, items: []
    }
  ]
};

// Ajoute le contenu d'un module (appelé par course/mXX.js).
window.COURSE.fill = function (id, items) {
  const mod = window.COURSE.modules.find(m => m.id === id);
  mod.items = items.map(it => Object.assign({ module: id }, it));
};

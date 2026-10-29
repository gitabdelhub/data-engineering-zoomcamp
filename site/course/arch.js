// « Ce que tu construis » : le schéma d'architecture en haut de chaque module.
// rows = une ligne par zone (où ça tourne). Un nœud = [logo, couleur, nom, détail, texte de la flèche qui y mène].
// link = la flèche qui descend de la ligne précédente. official = [image du repo, légende].
(function () {
  const BLUE = "#146ef5";
  const ARCH = {
    "00": {
      intro: "Avant Docker, tu montes ton atelier : ta copie du cours qui se met à jour seule, un poste de travail dans le navigateur, et ton site en ligne.",
      rows: [
        { zone: "GitHub", nodes: [
          ["github", "#181717", "Le repo officiel", "DataTalksClub"],
          ["github", "#181717", "Ton fork", "gitabdelhub/data-engineering-zoomcamp", "synchro chaque nuit (GitHub Action)"],
          ["githubpages", "#222222", "Ton site", "ce cours, en ligne", "GitHub Pages"]
        ] },
        { zone: "Ton poste de travail, chez GitHub", link: "ton fork s'ouvre dans", nodes: [
          ["docker", "#2496ED", "Devcontainer", "tes outils décrits en code"],
          ["browser", "", "Ton Codespace", "VS Code dans Chrome ou sur ton PC", "construit"],
          ["git", "#F05032", "Branche, commit, PR", "ton travail revient dans main", "tu travailles avec"]
        ] }
      ]
    },
    "01": {
      intro: "Tu fais tourner une base Postgres et ton script d'ingestion dans des conteneurs, puis tu crées tes ressources Google Cloud avec Terraform.",
      rows: [
        { zone: "Ton Codespace · Docker Compose", nodes: [
          ["file", BLUE, "CSV des taxis", "yellow, janvier 2021"],
          ["python", "#3776AB", "Ton script d'ingestion", "pandas, dans ton image Docker", "téléchargé"],
          ["postgresql", "#4169E1", "PostgreSQL", "base ny_taxi", "par paquets"],
          ["browser", "", "pgAdmin", "tes requêtes SQL", "réseau Docker"]
        ] },
        { zone: "Google Cloud", link: "puis dans le cloud", nodes: [
          ["terraform", "#844FBA", "Terraform", "main.tf et variables.tf"],
          ["googlecloud", "#4285F4", "Bucket GCS et dataset BigQuery", "créés et détruits en une commande", "terraform apply"]
        ] }
      ],
      official: ["01-docker-terraform/images/terraform-provider-flow.png", "Terraform lit ton code, puis crée les ressources chez le fournisseur cloud."]
    },
    "02": {
      intro: "Airflow lance ton pipeline tout seul, chaque mois : télécharger, charger, fusionner sans doublon. D'abord vers Postgres sur ta machine, puis vers Google Cloud.",
      rows: [
        { zone: "Ton Codespace · Docker Compose", nodes: [
          ["file", BLUE, "CSV des taxis", "green et yellow, un fichier par mois"],
          ["apacheairflow", "#017CEE", "Ton DAG Airflow", "extract, load, merge", "téléchargé chaque mois"],
          ["postgresql", "#4169E1", "PostgreSQL", "une table par type de taxi", "staging puis MERGE"]
        ] },
        { zone: "Google Cloud", link: "le même pipeline, vers le cloud", nodes: [
          ["apacheairflow", "#017CEE", "Ton DAG Airflow", "clé GCP dans un secret"],
          ["googlecloudstorage", "#4285F4", "Bucket GCS", "les fichiers bruts", "upload"],
          ["googlebigquery", "#4285F4", "BigQuery", "une table par type de taxi", "table externe puis MERGE"]
        ] }
      ]
    },
    "W1": {
      intro: "Tu écris toi-même un pipeline dlt qui va chercher des données dans une API, page par page, et les range en tables propres dans DuckDB.",
      rows: [
        { zone: "Ton Codespace", nodes: [
          ["api", BLUE, "API Open Library", "JSON, page par page"],
          ["dlt", "", "Ton pipeline dlt", "schéma déduit tout seul", "extraction"],
          ["duckdb", "#000000", "DuckDB", "tables normalisées", "chargement"]
        ] }
      ],
      official: ["cohorts/2026/workshops/dlt/images/etl_diagram.png", "Extraire, normaliser, charger : les trois étapes que dlt fait pour toi."]
    },
    "03": {
      intro: "Tu ranges les taxis dans BigQuery comme en entreprise : une table externe, une table partitionnée et clusterisée qui coûte moins cher à lire, et un modèle de machine learning écrit en SQL.",
      rows: [
        { zone: "Google Cloud", nodes: [
          ["file", BLUE, "CSV des taxis", "verts, 2019 et 2020, compressés"],
          ["googlecloudstorage", "#4285F4", "Bucket GCS", "ton data lake", "script de chargement"],
          ["googlebigquery", "#4285F4", "Table externe", "lit les fichiers sur place", "CREATE EXTERNAL TABLE"],
          ["googlebigquery", "#4285F4", "Table optimisée", "partitionnée et clusterisée", "CREATE TABLE … PARTITION BY"]
        ] },
        { zone: "BigQuery ML", link: "puis", nodes: [
          ["googlebigquery", "#4285F4", "Données d'entraînement", "les trajets payés par carte"],
          ["model", BLUE, "Ton modèle", "prédire le pourboire, en SQL", "CREATE MODEL"]
        ] }
      ],
      official: ["03-data-warehouse/images/01-data-warehouse-and-bigquery-02-data-warehouse-diagram.png", "Le trajet classique des données jusqu'à un entrepôt."]
    },
    "04": {
      intro: "Tu transformes les données brutes en tables prêtes pour l'analyse, avec dbt, des tests, de la documentation, et une CI qui vérifie chaque pull request.",
      rows: [
        { zone: "Ton entrepôt : DuckDB, dans ton Codespace", nodes: [
          ["duckdb", "#000000", "Données brutes", "taxis verts et jaunes"],
          ["dbt", "#FF694B", "Staging", "nettoyer, renommer, typer", "sources"],
          ["dbt", "#FF694B", "Marts", "fct_trips, dim_zones", "ref()"],
          ["dbt", "#FF694B", "Rapports", "par zone, par aéroport", "ref()"]
        ] },
        { zone: "Travail en équipe", link: "chaque changement passe par", nodes: [
          ["git", "#F05032", "Ta branche", "un modèle à la fois"],
          ["github", "#181717", "Pull request", "relue par un collègue", "git push"],
          ["githubactions", "#2088FF", "CI dbt", "dbt parse, seeds et tests", "déclenche"]
        ] }
      ],
      official: ["04-analytics-engineering/images/analytics-engineering-toolchain.png", "Les étapes de l'analytics engineering et les outils de chacune."]
    },
    "05": {
      intro: "Une seule plateforme pour ingérer, transformer et contrôler : tu refais le pipeline des taxis avec Bruin, en trois couches, et une CI valide chaque pull request.",
      rows: [
        { zone: "Ton Codespace", nodes: [
          ["file", BLUE, "Données des taxis", "source"],
          ["bruin", "", "Ingestion", "les données brutes", "assets Python"],
          ["bruin", "", "Staging", "dédoublonner, joindre les paiements", "SQL"],
          ["bruin", "", "Reports", "les agrégats pour l'analyse", "SQL"],
          ["duckdb", "#000000", "DuckDB", "avec contrôles qualité", "matérialisé dans"]
        ] },
        { zone: "Travail en équipe", link: "chaque changement passe par", nodes: [
          ["git", "#F05032", "Ta branche", "un pipeline à la fois"],
          ["github", "#181717", "Pull request", "relue par un collègue", "git push"],
          ["githubactions", "#2088FF", "CI Bruin", "bruin validate", "déclenche"]
        ] }
      ],
      official: ["05-data-platforms/images/bruin-pipeline-lineage.png", "Les couches d'un pipeline Bruin, de l'ingestion aux rapports."]
    },
    "06": {
      intro: "Quand les données deviennent trop grosses pour pandas, Spark les découpe et les traite en parallèle : d'abord dans ton Codespace, puis sur un cluster Google. Une CI vérifie que ton projet s'installe partout.",
      rows: [
        { zone: "Ton Codespace", nodes: [
          ["file", BLUE, "Parquet des taxis", "green et yellow"],
          ["apachespark", "#E25A1C", "Spark en local", "PySpark, puis ton cluster", "lecture"],
          ["file", BLUE, "Rapports en parquet", "par partitions", "écriture"]
        ] },
        { zone: "Travail en équipe", link: "chaque changement passe par", nodes: [
          ["git", "#F05032", "Ta branche", "un script à la fois"],
          ["github", "#181717", "Pull request", "avec la commande spark-submit", "git push"],
          ["githubactions", "#2088FF", "CI Spark", "Java, uv et un test", "déclenche"]
        ] },
        { zone: "Google Cloud", link: "puis à grande échelle", nodes: [
          ["googlecloudstorage", "#4285F4", "Bucket GCS", "les données d'entrée"],
          ["apachespark", "#E25A1C", "Cluster Dataproc", "ton job Spark", "spark-submit"],
          ["googlebigquery", "#4285F4", "BigQuery", "les résultats", "connecteur Spark"]
        ] }
      ],
      official: ["06-batch/images/02-introduction-to-spark-04-typical-workflow-whiteboard.png", "Où Spark se place dans un flux de données typique."]
    },
    "07": {
      intro: "Les données arrivent en continu : un producteur envoie des événements, Flink les traite au fil de l'eau et range les résultats dans Postgres.",
      rows: [
        { zone: "Ton Codespace · Docker Compose", nodes: [
          ["python", "#3776AB", "Producteur Python", "des trajets en temps réel"],
          ["apachekafka", "#231F20", "Redpanda", "un topic compatible Kafka", "messages"],
          ["apacheflink", "#E6526F", "Job Flink", "fenêtres et agrégats", "lecture continue"],
          ["postgresql", "#4169E1", "PostgreSQL", "les résultats, mis à jour", "écriture"]
        ] }
      ],
      official: ["07-streaming/theory/images/07-stream-processing-two-topic-flow.png", "Des producteurs écrivent dans des topics, des consommateurs les lisent en temps réel."]
    },
    "P": {
      intro: "Ton propre pipeline de bout en bout, sur un dataset que tu choisis. C'est ton portfolio, et une bonne base pour ton PFE.",
      rows: [
        { zone: "Ingestion · infrastructure créée par Terraform", nodes: [
          ["file", BLUE, "Ton dataset", "une API ou des fichiers"],
          ["apacheairflow", "#017CEE", "Airflow", "ingestion planifiée", "extraction"],
          ["googlecloudstorage", "#4285F4", "Data lake GCS", "les fichiers bruts", "chargement"]
        ] },
        { zone: "Entrepôt et restitution", link: "puis", nodes: [
          ["googlebigquery", "#4285F4", "BigQuery", "partitionné et clusterisé"],
          ["dbt", "#FF694B", "dbt", "modèles testés", "transformations"],
          ["dashboard", BLUE, "Ton tableau de bord", "au moins deux graphiques", "lecture"]
        ] },
        { zone: "Travail en équipe", link: "et pour livrer", nodes: [
          ["github", "#181717", "Pull request", "relue avant la fusion"],
          ["githubactions", "#2088FF", "CI/CD", "tests, puis Terraform en déploiement", "à chaque fusion"]
        ] }
      ]
    },
    "B": {
      intro: "Le même pipeline que ton module 2, mais avec Kestra : des flows écrits en YAML au lieu de DAGs en Python.",
      rows: [
        { zone: "Ton Codespace · Docker Compose", nodes: [
          ["file", BLUE, "CSV des taxis", "green et yellow"],
          ["kestra", "", "Ton flow Kestra", "YAML, déclencheur planifié", "téléchargé"],
          ["postgresql", "#4169E1", "PostgreSQL", "une table par type de taxi", "staging puis MERGE"]
        ] },
        { zone: "Google Cloud", link: "puis vers le cloud", nodes: [
          ["kestra", "", "Ton flow Kestra", "clés dans le KV store"],
          ["googlecloudstorage", "#4285F4", "Bucket GCS", "les fichiers bruts", "upload"],
          ["googlebigquery", "#4285F4", "BigQuery", "une table par type de taxi", "table externe puis MERGE"]
        ] }
      ]
    }
  };
  COURSE.modules.forEach(m => { if (ARCH[m.id]) m.arch = ARCH[m.id]; });
})();

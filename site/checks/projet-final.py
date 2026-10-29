"""Relecture automatique de ton projet final, avant la relecture par tes pairs.

Usage, depuis la racine de ton projet (son Codespace n'a pas ton fork du cours) :
    curl -sL https://raw.githubusercontent.com/gitabdelhub/data-engineering-zoomcamp/main/site/checks/projet-final.py | python3 - .

Le script lit ton dépôt et demande à Git ce qu'il suit. Il ne juge pas la qualité de ton travail :
il vérifie que chaque critère de la grille officielle a de quoi être noté, et que rien de dangereux
n'est commité. Pas de code de réussite ici : le vrai juge, ce sont tes trois relecteurs.
"""
import glob
import os
import re
import subprocess
import sys


def tracked(repo):
    out = subprocess.run(["git", "-C", repo, "ls-files"], capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f"❌ {repo} n'est pas un dépôt Git")
    return [p for p in out.stdout.splitlines() if p]


def read(repo, path):
    try:
        with open(os.path.join(repo, path), encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def main():
    repo = sys.argv[1] if len(sys.argv) > 1 else "."
    files = tracked(repo)
    readme = read(repo, "README.md")
    code = {p: read(repo, p) for p in files if p.endswith((".py", ".sql", ".tf", ".yml", ".yaml", ".toml", ".json"))}
    alltext = "\n".join(code.values()).lower()
    # row_number() over (partition by ...) est une fonction de fenêtre, pas une table partitionnée
    nowindow = re.sub(r"over\s*\(\s*partition\s+by", "over (", alltext)

    checks = []

    def check(label, ok, advice):
        checks.append((label, bool(ok), advice))

    headings = re.findall(r"^#{1,3} .+", readme, re.M)
    check("Le README décrit le projet (300 mots, au moins 5 titres)",
          len(readme.split()) >= 300 and len(headings) >= 5,
          "Le problème, les données, l'architecture, comment lancer, le tableau de bord : un titre pour chacun.")
    # Les fichiers des taxis, pas le mot : « contrairement aux taxis de New York » reste permis
    taxi = re.compile(r"tripdata|nyc-tlc|tlc[ _-]trip")
    check("Le projet n'utilise pas les données des taxis de New York",
          not taxi.search(readme.lower()) and not taxi.search(alltext) and not any(taxi.search(p.lower()) for p in files),
          "Le jeu de données des taxis est interdit pour le projet : choisis-en un autre.")
    check("L'infrastructure est en code (Terraform)",
          any(p.endswith(".tf") for p in files),
          "Un dossier terraform/ avec ton bucket et ton dataset, comme au module 1.")
    workflows = [p for p in files if p.startswith(".github/workflows/") and p.endswith((".yml", ".yaml"))]
    check("Une Action GitHub déploie l'infrastructure (CD Terraform)",
          any("terraform" in code.get(p, "").lower() for p in workflows),
          "Un workflow qui lance terraform plan sur chaque pull request, et apply sur main.")
    check("L'ingestion est orchestrée (Airflow, Bruin, Kestra, ou un flux Kafka)",
          re.search(r"from airflow|@dag|\bdag\(|bruin|kestra|kafkaproducer|'connector' = 'kafka'", alltext),
          "Un DAG ou un pipeline qui enchaîne les étapes jusqu'au data lake, pas des scripts lancés à la main.")
    check("Les transformations passent par dbt ou Spark",
          any(p.endswith("dbt_project.yml") for p in files) or "pyspark" in alltext,
          "Un projet dbt (avec ses tests) ou un job Spark.")
    check("Les tables sont partitionnées et clusterisées",
          re.search(r"partition_by|partition\s+by|time_partitioning", nowindow) and re.search(r"cluster_by|cluster\s+by|clustering", alltext),
          "Partitionne sur la date que filtrent tes requêtes, clusterise sur ce que tu groupes, et explique pourquoi dans le README.")
    secrets = [p for p in files if re.search(r"(^|/)\.env$|key.*\.json$|credentials.*\.json$|\.tfstate", p)]
    # une clé de compte de service se reconnaît à son contenu, quel que soit son nom
    secrets += [p for p, t in code.items() if re.search(r'"type"\s*:\s*"service_account"|"private_key"|BEGIN PRIVATE KEY', t)]
    check("Aucune clé, aucun .env et aucun état Terraform n'est commité",
          not secrets,
          "À retirer de Git (et à remplacer, une clé publiée est compromise) : " + ", ".join(sorted(set(secrets))[:5]))
    status = subprocess.run(["git", "-C", repo, "status", "--porcelain"], capture_output=True, text=True).stdout.strip()
    check("Tout est commité : un clone propre aura les mêmes fichiers que toi",
          status == "",
          "git status montre des fichiers non commités : un relecteur ne les aura pas.")

    print(f"Relecture de {os.path.abspath(repo)}")
    print()
    for label, ok, advice in checks:
        print(f"{'✅' if ok else '❌'} {label}")
        if not ok:
            print(f"   → {advice}")
    done = sum(ok for _, ok, _ in checks)
    print()
    print(f"{done} critère(s) sur {len(checks)}. Puis le vrai test : clone ton dépôt ailleurs et suis ton README à la lettre.")
    return done == len(checks)


if __name__ == "__main__":
    sys.exit(0 if main() else 1)

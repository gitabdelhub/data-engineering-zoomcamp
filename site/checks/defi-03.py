"""Vérification du défi du module 3 : la table fhv_2019_s2 dans BigQuery.

Usage, depuis la racine du fork :
    uv run --with google-cloud-bigquery python site/checks/defi-03.py

Le script lit ta clé grâce à GOOGLE_APPLICATION_CREDENTIALS, et le projet dans cette clé
(ou dans GCP_PROJECT_ID). Le dataset est dez_dataset, sauf si GCP_DATASET dit autre chose.
Il compare des empreintes : il ne contient pas les résultats attendus.
"""
import hashlib
import json
import os
import sys

TABLE = "fhv_2019_s2"

LABELS = [
    "La table est partitionnée sur l'heure de prise en charge",
    "Une partition par jour, et aucune date hors du semestre",
    "La table est clusterisée par base",
    "Une requête sans filtre sur la date est refusée",
    "Chaque trajet du semestre est là, une seule fois",
    "Chaque base n'est écrite que d'une seule façon",
    "Le comptage d'une base sur une journée est juste",
    "Les trajets sans zone de départ sont gardés",
]


def queries(ds, t):
    # Toujours un filtre sur la date : la table doit l'exiger
    since = "DATE(pickup_datetime) >= '2019-01-01'"
    return [
        f"SELECT column_name FROM `{ds}.INFORMATION_SCHEMA.COLUMNS` WHERE table_name = '{TABLE}' AND is_partitioning_column = 'YES'",
        f"SELECT COUNT(*) FROM `{ds}.INFORMATION_SCHEMA.PARTITIONS` WHERE table_name = '{TABLE}'",
        f"SELECT column_name FROM `{ds}.INFORMATION_SCHEMA.COLUMNS` WHERE table_name = '{TABLE}' AND clustering_ordinal_position = 1",
        f"SELECT option_value FROM `{ds}.INFORMATION_SCHEMA.TABLE_OPTIONS` WHERE table_name = '{TABLE}' AND option_name = 'require_partition_filter'",
        f"SELECT COUNT(*) FROM `{t}` WHERE {since}",
        f"SELECT COUNT(DISTINCT dispatching_base_num) FROM `{t}` WHERE {since}",
        f"SELECT COUNT(*) FROM `{t}` WHERE DATE(pickup_datetime) = '2019-10-15' AND dispatching_base_num = 'B01467'",
        f"SELECT COUNT(*) FROM `{t}` WHERE {since} AND PUlocationID IS NULL",
    ]


EXPECTED = [
    "c87656d37497e434",
    "52f11620e397f867",
    "8de9960f2f8df27a",
    "b5bea41b6c623f7c",
    "3537f6946b9aa00a",
    "81f27f8a7d8766c7",
    "89aa1e580023722d",
    "001318567e830e80",
]


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def normalize(value):
    # Les noms et les options sont comparés sans tenir compte des majuscules
    return str(value).strip().lower()


def project_id():
    if os.environ.get("GCP_PROJECT_ID"):
        return os.environ["GCP_PROJECT_ID"]
    key = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not key or not os.path.isfile(os.path.expanduser(key)):
        sys.exit("❌ Clé introuvable. Lance d'abord : export GOOGLE_APPLICATION_CREDENTIALS=~/.gcp/key.json")
    with open(os.path.expanduser(key)) as f:
        return json.load(f)["project_id"]


def bigquery_runner(project):
    from google.cloud import bigquery

    client = bigquery.Client(project=project)

    def run(sql):
        rows = list(client.query(sql).result())
        return rows[0][0] if rows else None

    return run


def check(run, ds):
    t = f"{ds}.{TABLE}"
    print(f"Défi du module 3 : vérification de la table {t}")
    print()
    ok, values = 0, []
    for label, sql, expected in zip(LABELS, queries(ds, t), EXPECTED):
        try:
            value = run(sql)
            value = "" if value is None else normalize(value)
            error = ""
        except Exception as e:  # une table absente ou un filtre manquant : on l'affiche
            value, error = "", str(e).splitlines()[0][:200]
        if value and fingerprint(value) == expected:
            print(f"✅ {label}")
            ok += 1
        else:
            print(f"❌ {label}")
            print(f"   Requête : {sql}")
            print(f"   BigQuery répond : {error or value or '(rien)'}")
        values.append(value)

    print()
    if ok == len(LABELS):
        code = hashlib.sha256("|".join(values).encode()).hexdigest()[:8]
        print(f"🎉 Tout est vert. Ton code de réussite : {code}")
        print("   Entre-le sur la page du défi pour le valider.")
        return True
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige et relance le script.")
    return False


if __name__ == "__main__":
    project = project_id()
    dataset = os.environ.get("GCP_DATASET", "dez_dataset")
    sys.exit(0 if check(bigquery_runner(project), f"{project}.{dataset}") else 1)

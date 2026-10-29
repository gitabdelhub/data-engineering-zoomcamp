"""Vérification du défi du module 4 : le modèle dbt fct_airport_daily.

Usage, depuis la racine du fork, après `dbt build` dans ton projet :
    uv run --with duckdb python site/checks/defi-04.py [dossier du projet] [fichier DuckDB]

Par défaut : mon-travail/module-04/mon_taxi et mon-travail/module-04/taxi_rides_ny.duckdb.
Le script lit la base et les fichiers target/manifest.json et target/run_results.json de dbt.
Il compare des empreintes : il ne contient pas les résultats attendus.
"""
import hashlib
import json
import os
import sys

MODEL = "fct_airport_daily"

LABELS = [
    "Une ligne par jour, type de taxi et aéroport",
    "Le nombre total de trajets est juste",
    "Le comptage d'un aéroport sur une journée est juste",
    "Les trois aéroports sont là, avec leur nom",
    "Le modèle est une table, et trip_date est une date sans heure",
    "Chaque colonne est testée comme demandé, et le test singulier porte sur trips",
    "Le modèle et chaque colonne ont une description",
    "Le dernier dbt build du modèle et de ses tests est vert",
]

EXPECTED = [
    "0b15045ec39fc90a",
    "657db080e6fe7b03",
    "2261b761b06d13e4",
    "02e7edeed866acdc",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
]


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def load_json(path):
    if not os.path.isfile(path):
        sys.exit(f"❌ Fichier introuvable : {path}. Lance d'abord `dbt build` dans ton projet.")
    with open(path) as f:
        return json.load(f)


def checks(con, manifest, results):
    nodes = manifest["nodes"]
    model = next((n for n in nodes.values() if n["resource_type"] == "model" and n["name"] == MODEL), None)
    if model is None:
        sys.exit(f"❌ Aucun modèle {MODEL} dans ton projet.")
    table = f'{model["schema"]}.{model["alias"] or MODEL}'
    tests = [n for n in nodes.values() if n["resource_type"] == "test" and model["unique_id"] in n["depends_on"]["nodes"]]
    singular = [n for n in tests if not n.get("test_metadata")]
    ids = {model["unique_id"]} | {n["unique_id"] for n in tests}
    ran = [r for r in results["results"] if r["unique_id"] in ids]

    def sql(q):
        return lambda: con.execute(q.format(t=table)).fetchone()[0]

    def columns():
        return [r[0] for r in con.execute(f"DESCRIBE {table}").fetchall()]

    def is_table():
        kind = con.execute(f"SELECT typeof(trip_date) FROM {table} LIMIT 1").fetchone()[0]
        return model["config"]["materialized"] == "table" and kind == "DATE"

    def tested():
        # (nom du test, colonne) pour chaque test générique du modèle
        found = {(n["test_metadata"]["name"], n.get("column_name")) for n in tests if n.get("test_metadata")}
        names = {name for name, _ in found}
        not_null = all(("not_null", c) in found for c in columns())
        accepted = {("accepted_values", "service_type"), ("accepted_values", "airport")} <= found
        trips = any("trips" in n.get("raw_code", "").lower() for n in singular)
        return "unique_combination_of_columns" in names and not_null and accepted and trips

    def documented():
        docs = model["columns"]
        return bool(model.get("description", "").strip()) and all(docs.get(c, {}).get("description", "").strip() for c in columns())

    return [
        sql("SELECT COUNT(*) || '|' || COUNT(DISTINCT (trip_date, service_type, airport)) FROM {t}"),
        sql("SELECT SUM(trips) FROM {t}"),
        sql("SELECT trips FROM {t} WHERE trip_date = '2019-01-15' AND service_type = 'Yellow' AND airport = 'JFK Airport'"),
        sql("SELECT STRING_AGG(DISTINCT airport, '|' ORDER BY airport) FROM {t}"),
        is_table,
        tested,
        documented,
        lambda: len(ran) == len(ids) and all(r["status"] in ("success", "pass") for r in ran),
    ]


def main():
    projet = sys.argv[1] if len(sys.argv) > 1 else "mon-travail/module-04/mon_taxi"
    base = sys.argv[2] if len(sys.argv) > 2 else "mon-travail/module-04/taxi_rides_ny.duckdb"
    manifest = load_json(os.path.join(projet, "target", "manifest.json"))
    results = load_json(os.path.join(projet, "target", "run_results.json"))
    if not os.path.isfile(base):
        sys.exit(f"❌ Base introuvable : {base}")

    import duckdb

    con = duckdb.connect(base, read_only=True)
    print(f"Défi du module 4 : vérification de {MODEL}")
    print()
    ok, values = 0, []
    for label, get, expected in zip(LABELS, checks(con, manifest, results), EXPECTED):
        try:
            value = get()
            value = "" if value is None else str(value).strip().lower()
            error = ""
        except Exception as e:  # une table ou une colonne absente : on l'affiche
            value, error = "", str(e).splitlines()[0][:200]
        if value and fingerprint(value) == expected:
            print(f"✅ {label}")
            ok += 1
        else:
            print(f"❌ {label}")
            if error:
                print(f"   Erreur : {error}")
        values.append(value)

    print()
    if ok == len(LABELS):
        code = hashlib.sha256("|".join(values).encode()).hexdigest()[:8]
        print(f"🎉 Tout est vert. Ton code de réussite : {code}")
        print("   Entre-le sur la page du défi pour le valider.")
        return True
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige, relance `dbt build`, puis ce script.")
    return False


if __name__ == "__main__":
    sys.exit(0 if main() else 1)

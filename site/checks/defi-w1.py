"""Vérification du défi du workshop dlt : la base DuckDB du pipeline zones_taxi.

Usage, depuis la racine du fork :
    uv run --with duckdb python site/checks/defi-w1.py mon-travail/workshop-dlt/defi/zones_taxi.duckdb

Sans chemin, le script cherche zones_taxi.duckdb dans mon-travail/.
Il compare des empreintes : il ne contient pas les résultats attendus.
"""
import glob
import hashlib
import json
import os
import sys

DATASET = "api_zones"

LABELS = [
    "La table zones a une ligne par zone",
    "id est la clé primaire de zones",
    "zones est chargée en merge",
    "Le détail par mois est complet, sans doublon",
    "Toutes les pages ont été chargées",
    "Chaque zone a sa dernière version",
    "Les mois corrigés sont les bons",
    "Les remarques des mises à jour sont là",
]

d = DATASET
QUERIES = [
    f"SELECT COUNT(*) || '|' || COUNT(DISTINCT id) FROM {d}.zones",
    "schema:primary_key",
    "schema:write_disposition",
    f"SELECT COUNT(*) FROM {d}.zones__mois",
    f"SELECT SUM(departs) FROM {d}.zones__mois",
    f"SELECT STRING_AGG(nom, '|' ORDER BY id) FROM {d}.zones WHERE id IN (7, 42, 82, 129, 166, 255)",
    f"""SELECT (SELECT SUM(m.departs) FROM {d}.zones z JOIN {d}.zones__mois m ON m._dlt_parent_id = z._dlt_id
               WHERE z.id IN (74, 75, 97) AND m.mois = '2019-03')
        || '|' ||
        (SELECT COUNT(*) FROM {d}.zones z JOIN {d}.zones__mois m ON m._dlt_parent_id = z._dlt_id
               WHERE z.id IN (25, 41, 181))""",
    f"SELECT COUNT(remarque) FROM {d}.zones",
]

EXPECTED = [
    "de576b33ec5250ef",
    "b5bea41b6c623f7c",
    "283128acef14943c",
    "bedd4ae332286cc0",
    "55013886849dbd3c",
    "fd8bfd1880087633",
    "a717de9bc646e0aa",
    "4e07408562bedb8b",
]


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def normalize(value):
    return str(value).strip().lower()


def schema_value(con, what):
    # dlt garde chaque version de son schéma, en JSON, dans la table _dlt_version
    row = con.execute(f"SELECT schema FROM {DATASET}._dlt_version ORDER BY inserted_at DESC LIMIT 1").fetchone()
    table = json.loads(row[0])["tables"]["zones"]
    if what == "primary_key":
        return table["columns"]["id"].get("primary_key", False)
    return table.get("write_disposition", "append")


def find_db():
    if len(sys.argv) > 1:
        return sys.argv[1]
    found = [p for p in glob.glob("mon-travail/**/zones_taxi.duckdb", recursive=True) if ".venv" not in p]
    if len(found) != 1:
        sys.exit("❌ Donne le chemin de ton fichier : python site/checks/defi-w1.py <chemin>/zones_taxi.duckdb")
    return found[0]


def check(con):
    print("Défi du workshop dlt : vérification de la base zones_taxi")
    print()
    ok, values = 0, []
    for label, sql, expected in zip(LABELS, QUERIES, EXPECTED):
        try:
            if sql.startswith("schema:"):
                value = schema_value(con, sql.split(":")[1])
            else:
                row = con.execute(sql).fetchone()
                value = row[0] if row else None
            value = "" if value is None else normalize(value)
            error = ""
        except Exception as e:  # une table ou une colonne absente : on l'affiche
            value, error = "", str(e).splitlines()[0][:200]
        if value and fingerprint(value) == expected:
            print(f"✅ {label}")
            ok += 1
        else:
            print(f"❌ {label}")
            print(f"   Réponse : {error or value or '(rien)'}")
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
    import duckdb

    path = find_db()
    if not os.path.isfile(path):
        sys.exit(f"❌ Fichier introuvable : {path}")
    con = duckdb.connect(path, read_only=True)
    sys.exit(0 if check(con) else 1)

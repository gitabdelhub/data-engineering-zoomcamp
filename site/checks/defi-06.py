"""Vérification du défi du module 6 : le rapport Spark des heures de pointe de 2020.

Usage, depuis la racine du fork, après ton `spark-submit` :
    uv run --with duckdb python site/checks/defi-06.py [script Spark] [dossier du rapport]

Par défaut : mon-travail/module-06/pointe.py et mon-travail/module-06/data/rapport-pointe.
Le script lit le parquet écrit par Spark (avec DuckDB), ton script, et demande à Git ce qu'il suit.
Il compare des empreintes : il ne contient pas les résultats attendus.
"""
import glob
import hashlib
import os
import re
import subprocess
import sys

LABELS = [
    "Le rapport est un seul fichier parquet, avec son _SUCCESS",
    "Les colonnes ont les bons noms, dans le bon ordre",
    "Une ligne par arrondissement, type de taxi et heure",
    "Le total des trajets de 2020 est juste",
    "Manhattan, taxis jaunes, 18 h : trajets et montant moyen justes",
    "Les arrondissements viennent bien de la table des zones",
    "Le script prend ses chemins en arguments, diffuse les zones, et ne fixe pas le master",
    "Les données du module ne sont pas suivies par Git, et sont ignorées",
]

EXPECTED = [
    "b5bea41b6c623f7c",
    "15cc8daa779a4476",
    "2464c70a1eb99034",
    "cd7e108dfb7d7138",
    "7d5ba055aa44cae7",
    "e88a2da284ab694b",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
]

DATA = "mon-travail/module-06/data"


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def git_ok():
    """Rien de suivi sous data/, et un nouveau fichier y serait ignoré."""
    tracked = subprocess.run(["git", "ls-files", DATA], capture_output=True, text=True).stdout.strip()
    ignored = subprocess.run(["git", "check-ignore", "-q", f"{DATA}/test.txt"]).returncode == 0
    return tracked == "" and ignored


def checks(con, script, output):
    with open(script, encoding="utf-8", errors="replace") as f:
        code = f.read()
    parts = glob.glob(os.path.join(output, "*.parquet"))
    pq = os.path.join(output, "*.parquet")

    def sql(q):
        return lambda: con.execute(q.replace("REPORT", f"read_parquet('{pq}')")).fetchone()[0]

    return [
        lambda: len(parts) == 1 and os.path.isfile(os.path.join(output, "_SUCCESS")),
        lambda: "|".join(c[0] for c in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{pq}')").fetchall()),
        sql("SELECT COUNT(*) || '|' || COUNT(DISTINCT (borough, service_type, hour_of_day)) FROM REPORT"),
        sql("SELECT SUM(trips) FROM REPORT"),
        sql("SELECT trips || '|' || avg_total_amount FROM REPORT WHERE borough = 'Manhattan' AND service_type = 'yellow' AND hour_of_day = 18"),
        sql("SELECT STRING_AGG(DISTINCT borough, '|' ORDER BY borough) FROM REPORT"),
        lambda: "argparse" in code and "broadcast" in code and re.search(r"\.master\(", code) is None,
        git_ok,
    ]


def main():
    script = sys.argv[1] if len(sys.argv) > 1 else "mon-travail/module-06/pointe.py"
    output = sys.argv[2] if len(sys.argv) > 2 else f"{DATA}/rapport-pointe"
    if not os.path.isfile(script):
        sys.exit(f"❌ Script introuvable : {script}")
    if not os.path.isdir(output):
        sys.exit(f"❌ Dossier du rapport introuvable : {output}")

    import duckdb

    con = duckdb.connect()
    print("Défi du module 6 : vérification du rapport des heures de pointe")
    print()
    ok, values = 0, []
    for label, get, expected in zip(LABELS, checks(con, script, output), EXPECTED):
        try:
            value = get()
            value = "" if value is None else str(value).strip().lower()
            error = ""
        except Exception as e:  # un fichier ou une colonne absente : on l'affiche
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
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige, relance ton spark-submit, puis ce script.")
    return False


if __name__ == "__main__":
    sys.exit(0 if main() else 1)

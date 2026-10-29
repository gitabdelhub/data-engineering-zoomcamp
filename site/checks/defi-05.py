"""Vérification du défi du module 5 : le pipeline Bruin des pourboires.

Usage, depuis la racine du fork, après tes deux `bruin run` :
    uv run --with duckdb python site/checks/defi-05.py [dossier du pipeline] [fichier DuckDB]

Par défaut : mon-travail/module-05/mon-pipeline/pourboires et mon-travail/module-05/nyc_taxi.duckdb.
Le script lit la base et les fichiers des assets, et demande à Git ce qu'il suit.
Il compare des empreintes : il ne contient pas les résultats attendus.
"""
import glob
import hashlib
import os
import re
import subprocess
import sys

LABELS = [
    "La couche brute garde tout, février compris deux fois (append)",
    "Le staging a un seul exemplaire de chaque trajet du trimestre",
    "Le rapport a une ligne par mois et par type de paiement",
    "Le nombre de trajets payés par carte en février est juste",
    "Le total des pourboires par carte en février est juste",
    "Le staging et le rapport sont en time_interval",
    "Le staging a un contrôle accepted_values et un contrôle personnalisé",
    "Ni .bruin.yml ni la base ne sont suivis par Git",
]

EXPECTED = [
    "49b2864caf015ee5",
    "6de1055ee9a50374",
    "743a03d1057f0778",
    "80c43eaf3c8df1a1",
    "4c03914d31dc8725",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
]


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def asset(pipeline, name):
    """Le texte du fichier d'asset qui porte ce nom, ou une chaîne vide."""
    for path in glob.glob(os.path.join(pipeline, "assets", "**", "*"), recursive=True):
        if not path.endswith((".sql", ".py", ".yml", ".yaml")):
            continue
        with open(path, encoding="utf-8", errors="replace") as f:
            text = f.read()
        if re.search(rf"^name:\s*{re.escape(name)}\s*$", text, re.M):
            return text
    return ""


def untracked(path):
    """Vrai si Git ne suit pas ce fichier."""
    tracked = subprocess.run(["git", "ls-files", "--error-unmatch", path], capture_output=True).returncode == 0
    return not tracked


def checks(con, pipeline, base):
    staging = asset(pipeline, "pourboires_staging.trips")
    report = asset(pipeline, "pourboires_reports.monthly_tips")

    def sql(q):
        return lambda: con.execute(q).fetchone()[0]

    feb_card = "FROM pourboires_reports.monthly_tips WHERE month = DATE '2019-02-01' AND payment_type_name = 'credit_card'"
    return [
        sql("SELECT COUNT(*) FROM pourboires_raw.trips"),
        sql("SELECT COUNT(*) || '|' || MIN(pickup_datetime)::DATE || '|' || MAX(pickup_datetime)::DATE FROM pourboires_staging.trips"),
        sql("SELECT COUNT(*) || '|' || COUNT(DISTINCT (month, payment_type_name)) FROM pourboires_reports.monthly_tips"),
        sql(f"SELECT trip_count {feb_card}"),
        sql(f"SELECT ROUND(total_tip)::BIGINT {feb_card}"),
        lambda: all(re.search(r"strategy:\s*time_interval", t) for t in (staging, report)),
        lambda: "accepted_values" in staging and re.search(r"^custom_checks:", staging, re.M) is not None,
        lambda: untracked(".bruin.yml") and untracked(base),
    ]


def main():
    pipeline = sys.argv[1] if len(sys.argv) > 1 else "mon-travail/module-05/mon-pipeline/pourboires"
    base = sys.argv[2] if len(sys.argv) > 2 else "mon-travail/module-05/nyc_taxi.duckdb"
    if not os.path.isfile(os.path.join(pipeline, "pipeline.yml")):
        sys.exit(f"❌ Pas de pipeline.yml dans {pipeline}")
    if not os.path.isfile(base):
        sys.exit(f"❌ Base introuvable : {base}")

    import duckdb

    con = duckdb.connect(base, read_only=True)
    print("Défi du module 5 : vérification du pipeline des pourboires")
    print()
    ok, values = 0, []
    for label, get, expected in zip(LABELS, checks(con, pipeline, base), EXPECTED):
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
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige, relance tes deux `bruin run`, puis ce script.")
    return False


if __name__ == "__main__":
    sys.exit(0 if main() else 1)

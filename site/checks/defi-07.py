"""Vérification du défi du module 7 : les pourboires de janvier, heure par heure, en direct.

Usage, depuis la racine du fork, pendant que ton job Flink tourne :
    uv run --with psycopg2-binary --with kafka-python python site/checks/defi-07.py [job Flink]

Par défaut : mon-travail/module-07/src/job/pourboires_horaires.py.
Le script interroge Redpanda (localhost:9092), PostgreSQL (localhost:5432), l'interface de Flink
(localhost:8081), lit ton job, et demande à Git ce qu'il suit.
Il compare des empreintes : il ne contient pas les résultats attendus.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request

LABELS = [
    "Le topic green-trips-jan a une partition et un seul exemplaire de chaque trajet",
    "La table tips_hourly a une ligne par heure fermée",
    "Le nombre total de trajets comptés est juste",
    "L'heure qui a rapporté le plus de pourboires est juste",
    "La dernière heure de janvier attend encore le watermark",
    "Un job Flink tourne, avec une vraie agrégation par fenêtre, vers tips_hourly",
    "Le job a un watermark, une fenêtre TUMBLE et un parallélisme de 1",
    "Les données du module ne sont pas suivies par Git, et sont ignorées",
]

EXPECTED = [
    "587e1cce557c546a",
    "0df5486b7bca884d",
    "505bd3beac230fb4",
    "a4fc67ba5c993ac9",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
    "b5bea41b6c623f7c",
]

DATA = "mon-travail/module-07/data"
TOPIC = "green-trips-jan"


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def topic_state():
    from kafka import KafkaConsumer, TopicPartition

    consumer = KafkaConsumer(bootstrap_servers=["localhost:9092"], request_timeout_ms=10000)
    try:
        partitions = consumer.partitions_for_topic(TOPIC) or set()
        ends = consumer.end_offsets([TopicPartition(TOPIC, p) for p in partitions])
        return f"{len(partitions)}|{sum(ends.values())}"
    finally:
        consumer.close()


def flink_ok():
    """Un job RUNNING qui écrit dans tips_hourly avec un opérateur WindowAggregate."""
    def get(path):
        with urllib.request.urlopen(f"http://localhost:8081{path}", timeout=10) as r:
            return json.load(r)

    for job in get("/jobs/overview")["jobs"]:
        if job["state"] != "RUNNING" or "tips_hourly" not in job["name"]:
            continue
        nodes = get(f"/jobs/{job['jid']}/plan")["plan"]["nodes"]
        if any("WindowAggregate" in n["description"] for n in nodes):
            return True
    return False


def git_ok():
    """Rien de suivi sous data/, et un nouveau fichier y serait ignoré."""
    tracked = subprocess.run(["git", "ls-files", DATA], capture_output=True, text=True).stdout.strip()
    ignored = subprocess.run(["git", "check-ignore", "-q", f"{DATA}/test.csv.gz"]).returncode == 0
    return tracked == "" and ignored


def checks(cur, job):
    with open(job, encoding="utf-8", errors="replace") as f:
        code = f.read()

    def sql(q):
        def run():
            cur.execute(q)
            return cur.fetchone()[0]
        return run

    return [
        topic_state,
        sql("SELECT COUNT(*) FROM tips_hourly"),
        sql("SELECT SUM(num_trips) FROM tips_hourly"),
        sql("SELECT window_start::text || '|' || total_tip::text FROM tips_hourly ORDER BY total_tip DESC LIMIT 1"),
        sql("SELECT MAX(window_start) = TIMESTAMP '2021-01-31 22:00:00' FROM tips_hourly"),
        flink_ok,
        lambda: "WATERMARK" in code.upper() and "TUMBLE" in code.upper()
        and re.search(r"set_parallelism\(\s*1\s*\)", code) is not None,
        git_ok,
    ]


def main():
    job = sys.argv[1] if len(sys.argv) > 1 else "mon-travail/module-07/src/job/pourboires_horaires.py"
    if not os.path.isfile(job):
        sys.exit(f"❌ Job introuvable : {job}")

    import psycopg2

    try:
        conn = psycopg2.connect(host="localhost", port=5432, dbname="postgres", user="postgres", password="postgres")
    except Exception as e:
        sys.exit(f"❌ PostgreSQL ne répond pas sur localhost:5432 : {str(e).strip().splitlines()[0]}")
    conn.autocommit = True
    cur = conn.cursor()

    print("Défi du module 7 : vérification des pourboires en direct")
    print()
    ok, values = 0, []
    for label, get, expected in zip(LABELS, checks(cur, job), EXPECTED):
        try:
            value = get()
            value = "" if value is None else str(value).strip().lower()
            error = ""
        except Exception as e:  # un service arrêté ou une table absente : on l'affiche
            value, error = "", str(e).strip().splitlines()[0][:200] if str(e).strip() else type(e).__name__
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
    print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige, puis relance ce script pendant que ton job tourne.")
    return False


if __name__ == "__main__":
    sys.exit(0 if main() else 1)

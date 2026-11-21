#!/usr/bin/env python3
"""Vérification du défi Kubernetes : l'ingestion mensuelle des taxis verts.

Usage, depuis n'importe quel dossier, avec ton cluster kind allumé :
    python3 site/checks/defi-k8s.py

Le script lit ton cluster avec kubectl et ta table avec psql, dans le pod Postgres.
Il compare des empreintes : il ne contient pas les résultats attendus.
"""
import hashlib
import json
import subprocess

CRONJOB = "ingestion-verts"

LABELS = [
    "Le CronJob ingestion-verts existe et tourne une fois par mois",
    "Deux runs ne peuvent jamais tourner en même temps",
    "Le mot de passe vient d'un Secret, jamais écrit en clair",
    "Le conteneur a une limite de mémoire",
    "Au moins deux Jobs lancés depuis le CronJob ont réussi",
    "Le mois de janvier 2019 est dans la table, en un seul exemplaire",
]
EXPECTED = [
    "3bcc505a390a1b15",
    "fa8f368e75acdc20",
    "2bb80d537b1da3e3",
    "eb46b0bc28f98c67",
    "6d6233cc8ad87c8b",
    "135b9e286be17aa0",
]


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def kubectl(*args):
    r = subprocess.run(["kubectl", *args], capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "kubectl a échoué")
    return r.stdout


def checks():
    cj = json.loads(kubectl("get", "cronjob", CRONJOB, "-o", "json"))
    spec = cj["spec"]
    container = spec["jobTemplate"]["spec"]["template"]["spec"]["containers"][0]
    env = {e["name"]: e for e in container.get("env", [])}

    def mensuel():
        f = spec["schedule"].split()
        return "mensuel" if len(f) == 5 and f[0] != "*" and f[1] != "*" and f[2] not in ("*", "?") and f[3] == "*" and f[4] == "*" else f"rythme {spec['schedule']}"

    def concurrence():
        return spec.get("concurrencyPolicy", "Allow")

    def secret():
        pw = env.get("PGPASSWORD")
        froms = [s for s in container.get("envFrom", []) if "secretRef" in s]
        if pw and "valueFrom" in pw and "secretKeyRef" in pw["valueFrom"]:
            return "secret"
        if froms and not pw:
            return "secret"
        return "en clair" if pw else "absent"

    def memoire():
        return "limite" if container.get("resources", {}).get("limits", {}).get("memory") else "sans limite"

    def runs():
        jobs = json.loads(kubectl("get", "jobs", "-o", "json"))["items"]
        n = sum(
            1 for j in jobs
            if any(o.get("kind") == "CronJob" and o.get("name") == CRONJOB for o in j["metadata"].get("ownerReferences", []))
            and j.get("status", {}).get("succeeded", 0) >= 1
        )
        return "2+" if n >= 2 else str(n)

    def table():
        sql = "SELECT count(*) FROM green_trips WHERE mois = '2019-01'"
        out = kubectl("exec", "deploy/postgres", "--", "sh", "-c",
                      f'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "{sql}"')
        return out.strip()

    return [mensuel, concurrence, secret, memoire, runs, table]


def main():
    print("Défi Kubernetes : vérification de l'ingestion mensuelle")
    print()
    try:
        fns = checks()
    except Exception as e:  # noqa: BLE001
        print(f"❌ Je ne trouve pas le CronJob {CRONJOB} : {e}")
        print("   Ton cluster est-il allumé (kubectl get nodes) ? Le CronJob a-t-il bien ce nom ?")
        raise SystemExit(1)
    values, ok = [], 0
    for label, expected, fn in zip(LABELS, EXPECTED, fns):
        error = None
        try:
            value = fn()
        except Exception as e:  # noqa: BLE001
            value, error = "", e
        values.append(value)
        if value and fingerprint(value) == expected:
            ok += 1
            print(f"✅ {label}")
        else:
            print(f"❌ {label}")
            if error:
                print(f"   Erreur : {error}")
    print()
    if ok == len(LABELS):
        code = hashlib.sha256("|".join(values).encode()).hexdigest()[:8]
        print(f"🎉 Tout est vert. Ton code de réussite : {code}")
        print("   Entre-le sur la page du défi pour le valider.")
    else:
        print(f"{ok} vérification(s) sur {len(LABELS)}. Corrige, puis relance ce script.")


if __name__ == "__main__":
    main()

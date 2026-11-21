# Défi Kubernetes : l'ingestion mensuelle des taxis verts

Pas de vidéo, pas de leçon. Ton cluster, ton Postgres, et tout ce que le module t'a appris. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## La commande

L'équipe qui étudie les taxis verts de New York veut leurs trajets dans le Postgres du cluster, **un mois à la fois**. Chaque mois, le 2 à 6 h, une ingestion doit charger le fichier du mois. Pour commencer, elle charge **janvier 2019**.

Les données : un fichier CSV compressé par mois, publié par DataTalksClub. Pour janvier 2019 :
`https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/green_tripdata_2019-01.csv.gz`

Le dictionnaire des colonnes : [celui de la ville de New York](https://www.nyc.gov/assets/tlc/downloads/pdf/data_dictionary_trip_records_green.pdf) (en anglais).

## Les règles

- Le programme est dans `mon-travail/kubernetes/ingest-verts/`, avec son Dockerfile. Son image s'appelle `ingest-verts:v1`.
- Il lit le mois à charger dans une variable d'environnement `MOIS` (par exemple `2019-01`), et sa connexion dans les variables `PG...` de la leçon 7.
- La table s'appelle `green_trips`. Elle a une colonne `mois` qui dit de quel fichier vient chaque ligne.
- 🔑 Le programme est **idempotent** : le relancer pour le même mois remplace ce mois, sans jamais le doubler.
- Un CronJob `ingestion-verts`, dans `mon-travail/kubernetes/k8s/cronjob-verts.yaml`, le lance **une fois par mois**, ne lance **jamais deux runs en même temps**, prend le mot de passe dans le **Secret** `taxi-db`, et a une **limite de mémoire**.
- Tu lances **deux runs** à la main depuis le CronJob, l'un après l'autre, pour prouver l'idempotence.

## La vérification

Après tes deux runs, depuis la racine de ton fork :

```bash
python3 site/checks/defi-k8s.py
```

Le script lit ton cluster avec `kubectl` et ta table avec `psql`, dans le pod Postgres. Il fait six vérifications et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Ton Postgres

Il doit tourner : `kubectl get pods -l app=postgres`. Si tu l'as supprimé à la leçon 9, recrée le Secret `taxi-db` puis `kubectl apply -f postgres.yaml` depuis `k8s/`.

### 2. Lis le fichier avant d'écrire la table

Télécharge-le dans ton Codespace et regarde ses deux premières lignes : `curl -sL <adresse> | zcat | head -2`. Compte les colonnes : ta table aura les mêmes, dans le même ordre, plus `mois`.

### 3. Le programme

Repars de `ingest.py` de la leçon 8. Trois différences : l'adresse dépend de `MOIS`, le fichier est compressé (`gzip.decompress`), et l'idempotence ne peut plus être un `TRUNCATE`, puisque la table gardera plusieurs mois. Cherche comment remplacer **seulement** un mois, dans une transaction.

Une astuce pour la colonne `mois` : `COPY` dans une **table temporaire** qui a exactement les colonnes du fichier, puis `INSERT INTO green_trips SELECT ...` en ajoutant le mois.

Teste le programme dans ton Codespace avant de construire l'image : `kubectl port-forward service/postgres 5432:5432` dans un terminal, et `PGHOST=localhost` dans l'autre.

### 4. L'image, puis le CronJob

`docker build`, `kind load`. Puis le CronJob, sur le modèle de `cronjob-zones.yaml`. Le rythme : traduis « le 2 de chaque mois à 6 h » avec [crontab.guru](https://crontab.guru/).

### 5. Deux runs, puis la vérification

`kubectl create job --from=cronjob/ingestion-verts run-1`, attends `Complete`, puis `run-2`. Puis le script.

@@ hints
- Le Job passe en `OOMKilled` : le fichier décompressé tient en mémoire, mais une limite trop basse le tue. Mesure avant de choisir : 512 Mi suffisent largement.
- Le script compte 1 261 836 lignes au lieu de 630 918 : ton second run a **ajouté** au lieu de **remplacer**. Le `DELETE` du mois doit être dans la même transaction que l'`INSERT`.
- Ne filtre pas sur la date de prise en charge pour supprimer le mois : le fichier de janvier contient aussi quelques courses de **décembre 2018**. C'est la colonne `mois` qui dit d'où vient une ligne.
- « Au moins deux Jobs » reste rouge : un `ttlSecondsAfterFinished` court a peut-être déjà effacé tes Jobs, ou tu les as créés avec `kubectl apply` au lieu de `--from=cronjob/...`.

@@ solution
`mon-travail/kubernetes/ingest-verts/ingest_green.py` :

~~~python
"""Charge un mois de taxis verts dans Postgres. Relançable : le mois est remplacé, jamais doublé."""
import gzip
import os
import urllib.request

import psycopg

MOIS = os.environ["MOIS"]  # par exemple 2019-01
URL = f"https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/green_tripdata_{MOIS}.csv.gz"
conninfo = (
    f"host={os.environ['PGHOST']} dbname={os.environ['PGDATABASE']} "
    f"user={os.environ['PGUSER']} password={os.environ['PGPASSWORD']}"
)

COLONNES = """
    vendor_id int, pickup_datetime timestamp, dropoff_datetime timestamp,
    store_and_fwd_flag text, ratecode_id int, pu_location_id int, do_location_id int,
    passenger_count int, trip_distance numeric, fare_amount numeric, extra numeric,
    mta_tax numeric, tip_amount numeric, tolls_amount numeric, ehail_fee numeric,
    improvement_surcharge numeric, total_amount numeric, payment_type int,
    trip_type int, congestion_surcharge numeric
"""

print(f"Téléchargement de {URL}")
with urllib.request.urlopen(URL) as r:
    donnees = gzip.decompress(r.read())

with psycopg.connect(conninfo) as conn:
    # La colonne mois dit de quel fichier vient la ligne : certaines courses de janvier ont commencé en décembre
    conn.execute(f"CREATE TABLE IF NOT EXISTS green_trips (mois text NOT NULL, {COLONNES})")
    conn.execute(f"CREATE TEMP TABLE arrivee ({COLONNES}) ON COMMIT DROP")
    with conn.cursor().copy("COPY arrivee FROM STDIN WITH (FORMAT csv, HEADER true)") as copy:
        copy.write(donnees)
    # Supprimer puis réinsérer dans la même transaction : relancer le Job ne double rien
    conn.execute("DELETE FROM green_trips WHERE mois = %s", (MOIS,))
    conn.execute("INSERT INTO green_trips SELECT %s, * FROM arrivee", (MOIS,))
    n = conn.execute("SELECT count(*) FROM green_trips WHERE mois = %s", (MOIS,)).fetchone()[0]

print(f"Terminé : {n} trajets pour {MOIS}")
~~~

`mon-travail/kubernetes/ingest-verts/Dockerfile` :

~~~dockerfile
FROM python:3.13-slim
RUN pip install --no-cache-dir "psycopg[binary]==3.2.10"
WORKDIR /app
COPY ingest_green.py .
CMD ["python", "ingest_green.py"]
~~~

`mon-travail/kubernetes/k8s/cronjob-verts.yaml` :

~~~yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ingestion-verts
spec:
  schedule: "0 6 2 * *"          # le 2 de chaque mois à 6 h (UTC)
  concurrencyPolicy: Forbid      # jamais deux runs en même temps sur la même table
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: ingest
            image: ingest-verts:v1
            imagePullPolicy: Never
            envFrom:
            - configMapRef: {name: taxi-db}
            env:
            - name: MOIS
              value: "2019-01"
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef: {name: taxi-db, key: PGPASSWORD}
            resources:
              requests: {memory: "256Mi", cpu: "250m"}
              limits: {memory: "512Mi"}   # le programme utilise environ 160 Mo au plus fort
~~~

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/kubernetes/ingest-verts
docker build -t ingest-verts:v1 .
kind load docker-image ingest-verts:v1 --name zoomcamp

cd ../k8s
kubectl apply -f cronjob-verts.yaml
kubectl create job --from=cronjob/ingestion-verts run-1
kubectl wait --for=condition=complete job/run-1 --timeout=300s
kubectl create job --from=cronjob/ingestion-verts run-2
kubectl wait --for=condition=complete job/run-2 --timeout=300s
kubectl logs job/run-2                 # Terminé : 630918 trajets pour 2019-01

cd /workspaces/data-engineering-zoomcamp
python3 site/checks/defi-k8s.py
~~~

`kubectl wait` attend qu'une condition soit vraie : pratique dans un script, à la place de `get -w`.

Dans une vraie ingestion mensuelle, `MOIS` ne serait pas écrit en dur : le programme calculerait le mois précédent à partir de la date du jour. Ici, il est fixe pour que la vérification soit possible.

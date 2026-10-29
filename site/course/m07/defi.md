# Défi du module 7 : les pourboires en direct

Pas de vidéo, pas de leçon. Ton projet de streaming, un nouveau topic, un nouveau job, et tout ce que le module t'a appris. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## La commande

L'équipe du service client veut un tableau qui se remplit **en direct** : pour chaque heure, combien de trajets de taxis verts, et combien de pourboires. Pour le tester, elle te demande de rejouer **janvier 2021**, comme si les trajets arrivaient au fil de l'eau. Ses données : le fichier `https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/green_tripdata_2021-01.csv.gz`.

La table attendue dans PostgreSQL, `tips_hourly` :

| Colonne | Contenu |
| --- | --- |
| `window_start` | le début de l'heure (`TIMESTAMP`, clé primaire) |
| `num_trips` | le nombre de trajets pris en charge dans l'heure |
| `total_tip` | la somme des pourboires de l'heure, arrondie au centime |

## Les règles

- Le fichier est téléchargé dans `mon-travail/module-07/data/`, qui est ignoré par Git.
- Un topic `green-trips-jan`, avec **une** partition, contient **un seul exemplaire** de chaque trajet.
- Le producteur `src/producers/producteur_janvier.py` n'envoie que les trajets pris en charge en janvier 2021, **dans l'ordre chronologique**, avec quatre clés JSON : `lpep_pickup_datetime` (texte `AAAA-MM-JJ HH:MM:SS`), `PULocationID`, `tip_amount`, `total_amount`.
- Le job Flink `src/job/pourboires_horaires.py` lit le topic depuis le début, déclare un watermark de 5 secondes sur la date de prise en charge, compte par fenêtres **tumbling** d'une heure avec une vraie agrégation par fenêtre, et tourne avec un parallélisme de 1.
- Le job **tourne encore** quand tu lances la vérification.

## La vérification

Pendant que ton job tourne, depuis la racine de ton fork :

```bash
uv run --with psycopg2-binary --with kafka-python python site/checks/defi-07.py mon-travail/module-07/src/job/pourboires_horaires.py
```

Le script interroge Redpanda, PostgreSQL et l'interface de Flink, lit ton job, et demande à Git ce qu'il suit. Il fait huit vérifications et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Les données et le topic

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-07
mkdir -p data
wget -P data https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/green_tripdata_2021-01.csv.gz
docker compose up -d
docker compose exec redpanda rpk topic create green-trips-jan
~~~

Ajoute `mon-travail/module-07/data/` à ton `.gitignore`, et vérifie avec `git check-ignore -v`.

### 2. Le producteur

Repars de ta leçon 3. Lis le CSV avec pandas, garde les quatre colonnes, filtre janvier, trie, convertis la date en texte, puis envoie chaque ligne comme un dictionnaire. Lance-le **une seule** fois.

### 3. La table

Crée `tips_hourly` dans Postgres avant le job.

### 4. Le job

Repars de ton job de la leçon 8 : une source avec la date en texte (la colonne calculée de l'énoncé du homework), un sink JDBC, une fenêtre d'une heure **sans** zone.

### 5. Lancer, attendre, vérifier

Envoie le job, reprends la main avec `Ctrl+C`, vérifie qu'il est `RUNNING` dans le port 8081, attends une minute, puis lance le script de vérification.

@@ hints
- Le CSV contient trois trajets hors de janvier 2021, dont un de 2009 : sans filtre, ce trajet ou un trajet de février ferait avancer le watermark n'importe comment.
- Sans tri, le CSV n'est pas tout à fait dans l'ordre : des trajets seraient en retard, et ignorés par la fenêtre.
- `df.to_dict(orient="records")` donne une liste de dictionnaires prête à envoyer.
- Si la vérification du topic est rouge, tu l'as rempli deux fois : `rpk topic delete green-trips-jan`, recrée-le, renvoie, puis annule et relance le job (et vide la table).
- La vérification de la dernière heure est un indice à elle seule : relis la prédiction de la leçon 8.
- La vérification du job lit le plan dans l'interface de Flink : un `GROUP BY window_start` seul ne passe pas.

@@ solution
`src/producers/producteur_janvier.py` :

~~~python
"""Envoie les trajets verts de janvier 2021, dans l'ordre chronologique, au topic green-trips-jan."""
import json
import time

import pandas as pd
from kafka import KafkaProducer

columns = ["lpep_pickup_datetime", "PULocationID", "tip_amount", "total_amount"]
df = pd.read_csv("data/green_tripdata_2021-01.csv.gz", usecols=columns, parse_dates=["lpep_pickup_datetime"])
df = df[(df.lpep_pickup_datetime >= "2021-01-01") & (df.lpep_pickup_datetime < "2021-02-01")]
df = df.sort_values("lpep_pickup_datetime", kind="stable")
df["lpep_pickup_datetime"] = df.lpep_pickup_datetime.dt.strftime("%Y-%m-%d %H:%M:%S")

producer = KafkaProducer(
    bootstrap_servers=["localhost:9092"],
    value_serializer=lambda row: json.dumps(row).encode("utf-8"),
)
t0 = time.time()
for row in df.to_dict(orient="records"):
    producer.send("green-trips-jan", value=row)
producer.flush()
print(f"{len(df)} messages en {time.time() - t0:.1f} s")
~~~

La table :

~~~sql
CREATE TABLE tips_hourly (window_start TIMESTAMP PRIMARY KEY, num_trips BIGINT, total_tip DOUBLE PRECISION);
~~~

`src/job/pourboires_horaires.py` :

~~~python
"""Le total des pourboires par heure, en direct, depuis le topic green-trips-jan."""
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import EnvironmentSettings, StreamTableEnvironment


def main():
    env = StreamExecutionEnvironment.get_execution_environment()
    env.enable_checkpointing(10 * 1000)
    env.set_parallelism(1)  # le topic a une seule partition
    t_env = StreamTableEnvironment.create(env, environment_settings=EnvironmentSettings.in_streaming_mode())

    t_env.execute_sql("""
        CREATE TABLE trips (
            lpep_pickup_datetime VARCHAR,
            PULocationID INTEGER,
            tip_amount DOUBLE,
            total_amount DOUBLE,
            event_timestamp AS TO_TIMESTAMP(lpep_pickup_datetime, 'yyyy-MM-dd HH:mm:ss'),
            WATERMARK FOR event_timestamp AS event_timestamp - INTERVAL '5' SECOND
        ) WITH (
            'connector' = 'kafka',
            'properties.bootstrap.servers' = 'redpanda:29092',
            'topic' = 'green-trips-jan',
            'scan.startup.mode' = 'earliest-offset',
            'format' = 'json'
        )
    """)
    t_env.execute_sql("""
        CREATE TABLE tips_hourly (
            window_start TIMESTAMP(3),
            num_trips BIGINT,
            total_tip DOUBLE,
            PRIMARY KEY (window_start) NOT ENFORCED
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://postgres:5432/postgres',
            'table-name' = 'tips_hourly',
            'username' = 'postgres',
            'password' = 'postgres',
            'driver' = 'org.postgresql.Driver'
        )
    """)
    t_env.execute_sql("""
        INSERT INTO tips_hourly
        SELECT window_start, COUNT(*) AS num_trips, ROUND(SUM(tip_amount), 2) AS total_tip
        FROM TABLE(TUMBLE(TABLE trips, DESCRIPTOR(event_timestamp), INTERVAL '1' HOUR))
        GROUP BY window_start, window_end
    """).wait()


if __name__ == "__main__":
    main()
~~~

Le producteur envoie 76 515 messages en quelques secondes. La table a une ligne par heure de janvier, **sauf la dernière** : le 31 janvier à 23 h attend un événement qui ne viendra pas. L'heure la plus généreuse est un matin de semaine : ce ne sont pas les soirées.

@@ team
Une vraie commande d'équipe. Sur une branche `module-07/defi-pourboires` : un commit pour le producteur, un pour le job, un pour la ligne du `.gitignore`. La pull request donne les commandes dans l'ordre (topic, table, producteur, job), le résultat du script de vérification, et ta CI de la leçon 9 doit être verte avant la fusion. Puis publie la version : `git tag -a v0.7.0 -m "Module 7 : pourboires en direct"`, `git push origin v0.7.0`, et une release GitHub avec **Generate release notes**, comme aux modules précédents. Pour aller plus loin : ajoute une colonne au tableau, la zone qui a le plus de trajets dans l'heure, sans casser la vérification (dans une seconde table).

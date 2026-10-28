# Défi du module 2 : les VTC de New York au printemps 2020

Pas de vidéo, pas de leçon. Tu as l'Airflow du module et tout ce que tu y as appris, sur des données que tu n'as jamais vues. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## Les données

Les trajets des **VTC et voitures avec chauffeur** de New York (*For-Hire Vehicles*, FHV), d'avril à juin 2020 : le printemps du confinement. Un fichier par mois, figé sur GitHub :

```text
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/fhv/fhv_tripdata_2020-04.csv.gz
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/fhv/fhv_tripdata_2020-05.csv.gz
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/fhv/fhv_tripdata_2020-06.csv.gz
```

Et la table des zones, pour savoir dans quel arrondissement (*borough*) se trouve chaque zone :

```text
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/misc/taxi_zone_lookup.csv
```

## L'objectif

Dans ton Airflow du module, un DAG `fhv_quotidien` qui remplit, dans la base `ny_taxi` de ton service `pgdatabase`, une table de résumé quotidien :

| Colonne | Contenu |
| --- | --- |
| `day` | Le jour (type `date`) |
| `borough` | L'arrondissement de la zone de **prise en charge** |
| `trips` | Le nombre de trajets ce jour-là, dans cet arrondissement |
| `avg_minutes` | La durée moyenne d'un trajet, en minutes, arrondie à 2 décimales |

La table s'appelle `fhv_daily_borough`, et `(day, borough)` est sa **clé primaire**.

## Les règles

- Le DAG est **planifié** chaque mois, le 1er à 6 h heure de New York, d'avril à juin 2020. Les trois mois sont chargés par **backfill**.
- Chaque run traite **son** mois, d'après sa date logique.
- Le DAG charge lui-même la table des zones.
- Un trajet **sans zone de départ** est compté dans l'arrondissement `Unknown`. Aucun trajet ne doit être perdu.
- Seuls comptent les trajets dont la date de prise en charge est dans le mois du fichier.
- Relancer un mois, ou tout le backfill, donne **exactement** la même table.
- Aucun mot de passe dans le code.

## La vérification

Quand tu penses avoir fini, lance depuis la racine de ton fork :

```bash
bash site/checks/defi-02.sh
```

Le script interroge ta base avec six requêtes et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Regarde les données avant d'écrire du code

Télécharge le fichier d'avril dans un dossier de travail et regarde ses premières lignes :

~~~bash
curl -sSLO https://github.com/DataTalksClub/nyc-tlc-data/releases/download/fhv/fhv_tripdata_2020-04.csv.gz
zcat fhv_tripdata_2020-04.csv.gz | head -5
~~~

Note les noms des colonnes, et repère celle qui donne la zone de départ. Regarde aussi si certaines lignes ont des valeurs **vides** dans cette colonne : `awk -F, '$4 == ""'` garde les lignes dont la 4e colonne est vide, et `wc -l` les compte :

~~~bash
zcat fhv_tripdata_2020-04.csv.gz | awk -F, '$4 == ""' | wc -l
~~~

Ne commite pas ce fichier.

### 2. Les tables, d'abord à la main

Avant le DAG, écris tes `CREATE TABLE` et teste-les avec `psql` dans le conteneur `pgdatabase` (leçon 5). Trois tables : les zones, une staging pour les trajets d'un mois (une colonne par colonne du CSV, dans l'ordre), et le résumé, avec sa clé primaire.

### 3. Le squelette du DAG

Repars de ton `taxi_postgres_scheduled` (leçon 8) : un timetable avec fuseau, `start_date`, `end_date`, la date logique dans le nom du fichier. Pas de paramètre : il n'y a qu'un type de VTC.

### 4. Les tâches

Une bonne découpe : télécharger les zones, les charger (vider puis remplir), télécharger le mois, le charger en staging (vider puis remplir, avec `copy_expert`), calculer le résumé, nettoyer. Les zones et le mois ne dépendent pas l'un de l'autre : deux branches en parallèle, qui se rejoignent avant le calcul (leçons 3 et 4).

### 5. Le calcul du résumé

Une seule requête `INSERT INTO ... SELECT ... GROUP BY` fait tout le travail. Pense à :

- la **jointure** avec les zones : quelle sorte de jointure garde les trajets sans zone ?
- la valeur à mettre quand il n'y a pas d'arrondissement : `COALESCE` ;
- la durée : `dropoff_datetime - pickup_datetime` donne un intervalle, et `extract(epoch FROM intervalle)` le convertit en secondes ;
- le filtre sur le mois.

### 6. Rendre le calcul relançable

Un `INSERT` simple ajoute des lignes en double, ou échoue sur la clé primaire au deuxième run. Postgres sait faire « insérer, ou remplacer si la clé existe déjà » : cherche `INSERT ... ON CONFLICT` dans sa documentation. Attention à ce que tu mets dans la partie « remplacer » : remplacer, ce n'est pas additionner.

### 7. Teste un mois, puis le backfill

`airflow dags test fhv_quotidien 2020-04-01` lance un run avec cette date logique. Quand avril est juste, le backfill des trois mois, un mois à la fois (leçon 8). Puis le script de vérification.

### 8. Prouve l'idempotence

Relance le backfill avec `--reprocess-behavior completed`, puis relance le script : le même code de réussite doit sortir.

@@ hints
- Avril 2020 a beaucoup de trajets **sans** `PULocationID` (valeur vide). Avec un `JOIN` classique, ils disparaissent du résumé. Un `LEFT JOIN` les garde, avec un arrondissement `NULL` que `COALESCE(z.borough, 'Unknown')` remplace.
- `round(avg(extract(epoch FROM s.dropoff_datetime - s.pickup_datetime) / 60), 2)` donne la durée moyenne en minutes, arrondie.
- `ON CONFLICT (day, borough) DO UPDATE SET trips = EXCLUDED.trips, avg_minutes = EXCLUDED.avg_minutes` : `EXCLUDED` désigne la ligne que tu essayais d'insérer. Et n'oublie pas `--max-active-runs 1` sur le backfill : les trois mois partagent la même staging.

@@ solution
`dags/fhv_quotidien.py` :

~~~python
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import dag, task
from airflow.timetables.trigger import CronTriggerTimetable

DATA = "/opt/airflow/data"
URL = "https://github.com/DataTalksClub/nyc-tlc-data/releases/download"
MOIS = "{{ logical_date.strftime('%Y-%m') }}"  # 2020-04 pour le run d'avril
FICHIER = "fhv_tripdata_" + MOIS + ".csv"


@dag(
    dag_id="fhv_quotidien",
    schedule=CronTriggerTimetable("0 6 1 * *", timezone="America/New_York"),
    start_date=datetime(2020, 4, 1),
    end_date=datetime(2020, 6, 30),
    catchup=False,
    max_active_runs=1,
    tags=["defi-02"],
)
def fhv_quotidien():
    get_zones = BashOperator(
        task_id="get_zones",
        bash_command="curl -sSLf -o " + DATA + "/taxi_zone_lookup.csv " + URL + "/misc/taxi_zone_lookup.csv",
    )
    extract = BashOperator(
        task_id="extract",
        bash_command="set -o pipefail; curl -sSLf " + URL + "/fhv/" + FICHIER + ".gz | gunzip > " + DATA + "/" + FICHIER,
    )

    @task
    def load_zones():
        hook = PostgresHook(postgres_conn_id="ny_taxi")
        # Vider puis remplir : la table des zones est toujours identique au fichier
        hook.run("""
            CREATE TABLE IF NOT EXISTS zones (locationid integer PRIMARY KEY, borough text, zone text, service_zone text);
            TRUNCATE zones;
        """)
        hook.copy_expert("COPY zones FROM STDIN WITH (FORMAT csv, HEADER true)", f"{DATA}/taxi_zone_lookup.csv")

    @task
    def load_staging(file: str):
        hook = PostgresHook(postgres_conn_id="ny_taxi")
        hook.run("""
            CREATE TABLE IF NOT EXISTS fhv_staging (
                dispatching_base_num text, pickup_datetime timestamp, dropoff_datetime timestamp,
                pulocationid integer, dolocationid integer, sr_flag text, affiliated_base_number text
            );
            TRUNCATE fhv_staging;
        """)
        # Une valeur vide dans le CSV devient NULL : c'est le cas de beaucoup de PULocationID en avril
        hook.copy_expert("COPY fhv_staging FROM STDIN WITH (FORMAT csv, HEADER true)", f"{DATA}/{file}")

    @task
    def upsert_daily(month: str):
        PostgresHook(postgres_conn_id="ny_taxi").run(f"""
            CREATE TABLE IF NOT EXISTS fhv_daily_borough (
                day date, borough text, trips integer, avg_minutes numeric(8, 2),
                PRIMARY KEY (day, borough)
            );
            INSERT INTO fhv_daily_borough (day, borough, trips, avg_minutes)
            SELECT s.pickup_datetime::date,
                   COALESCE(z.borough, 'Unknown'),   -- LEFT JOIN : on garde les trajets sans zone
                   count(*),
                   round(avg(extract(epoch FROM s.dropoff_datetime - s.pickup_datetime) / 60), 2)
            FROM fhv_staging s
            LEFT JOIN zones z ON z.locationid = s.pulocationid
            WHERE to_char(s.pickup_datetime, 'YYYY-MM') = '{month}'
            GROUP BY 1, 2
            -- Une journée déjà présente est remplacée, jamais additionnée : on peut relancer
            ON CONFLICT (day, borough) DO UPDATE
              SET trips = EXCLUDED.trips, avg_minutes = EXCLUDED.avg_minutes;
        """)

    cleanup = BashOperator(task_id="cleanup", bash_command="rm -f " + DATA + "/" + FICHIER)

    [get_zones >> load_zones(), extract >> load_staging(FICHIER)] >> upsert_daily(MOIS) >> cleanup


fhv_quotidien()
~~~

Les commandes, depuis `mon-travail/module-02/airflow/` :

~~~bash
docker compose exec airflow-scheduler airflow dags reserialize
docker compose exec airflow-scheduler airflow dags unpause fhv_quotidien
docker compose exec airflow-scheduler airflow backfill create \
  --dag-id fhv_quotidien --from-date 2020-04-01 --to-date 2020-06-30 \
  --max-active-runs 1
~~~

Puis, depuis la racine du fork : `bash site/checks/defi-02.sh`.

Les choix qui comptent :

- **`LEFT JOIN` et `COALESCE`** : en avril, environ 166 000 trajets n'ont pas de zone de départ. Un `JOIN` classique les ferait disparaître sans bruit, et le total serait faux.
- **`ON CONFLICT ... DO UPDATE SET trips = EXCLUDED.trips`** : relancer un mois **remplace** ses lignes. Avec `trips = fhv_daily_borough.trips + EXCLUDED.trips`, chaque relance additionnerait.
- **Les zones vidées puis rechargées** à chaque run : une petite table de référence, toujours identique au fichier.
- **`--max-active-runs 1`** : les trois mois utilisent la même `fhv_staging`. En parallèle, ils se mélangeraient (leçon 8).

Tu remarqueras que l'arrondissement `Unknown` domine largement : dans ces données, la plupart des sociétés de VTC ne déclarent pas la zone de départ (zone 264, « NV »). C'est une vraie découverte de data engineer : avant d'analyser un dataset, on mesure ce qu'il contient vraiment.

@@ team
Comme en entreprise : fais le défi sur une branche, ouvre une pull request dans ton fork, et colle la sortie du script de vérification dans la description. Fais relire ton code par un camarade, ou relis-toi dans Files changed, ligne par ligne, avant de fusionner. Une fois la PR fusionnée, marque la fin du module avec un **tag annoté** `module-02` sur `main`, et pousse-le, comme au module 1.

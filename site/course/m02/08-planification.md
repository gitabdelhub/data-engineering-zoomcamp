# Planification et backfill

Jusqu'ici, tu choisis le mois à la main, à chaque run. Un vrai pipeline se lance **tout seul** : le 1er de chaque mois, il charge le mois qui vient de se terminer. Et quand on te demande deux ans d'historique, tu ne lances pas 24 runs à la main : tu fais un **backfill**.

## Le schedule : une expression cron

`schedule` dit quand le DAG se lance. La forme la plus courante est une **expression cron**, que tu as déjà rencontrée au module 0 pour ta GitHub Action : cinq champs séparés par des espaces.

```text
┌──────── minute (0-59)
│ ┌────── heure (0-23)
│ │ ┌──── jour du mois (1-31)
│ │ │ ┌── mois (1-12)
│ │ │ │ ┌ jour de la semaine (0-6, 0 = dimanche)
0 9 1 * *
```

`0 9 1 * *` : à la minute 0, à 9 h, le 1er du mois, quel que soit le mois et le jour de la semaine. `*` veut dire « n'importe lequel ».

| Expression | Quand |
| --- | --- |
| `0 9 1 * *` | Le 1er de chaque mois à 9 h |
| `30 6 * * 1` | Chaque lundi à 6 h 30 |
| `0 */2 * * *` | Toutes les deux heures, à l'heure pile |
| `@daily` | Chaque jour à minuit |
| `@monthly` | Le 1er de chaque mois à minuit |

Le site [crontab.guru](https://crontab.guru/) traduit une expression en phrase : pratique pour vérifier.

## Le fuseau horaire

Par défaut, Airflow compte en **UTC**. « 9 h » veut donc dire 9 h à Londres en hiver, pas à New York. Pour planifier à l'heure locale, on utilise un *timetable* avec un fuseau :

```python
from airflow.timetables.trigger import CronTriggerTimetable

schedule=CronTriggerTimetable("0 9 1 * *", timezone="America/New_York")
```

Un fuseau s'écrit avec un nom de la base IANA, comme `Europe/Paris` ou `America/New_York`. Pas avec `EST` ou `UTC-5` : ces décalages sont **fixes**, alors que New York change d'heure en mars et en novembre. Avec `America/New_York`, Airflow suit le changement d'heure tout seul : ton run de janvier part à 14 h UTC, celui d'avril à 13 h UTC, et les deux à 9 h à New York.

## La date logique

Chaque run planifié a une **date logique** (`logical_date`) : la date qu'il représente. Le run du 1er février 2019 à 9 h a pour date logique le 1er février 2019. C'est elle que tes templates utilisent :

```python
FICHIER = "{{ params.taxi }}_tripdata_{{ logical_date.strftime('%Y-%m') }}.csv"
```

`strftime('%Y-%m')` écrit la date au format `2019-02`. Le même code charge donc un mois différent à chaque run, sans paramètre de mois.

## start_date, end_date et catchup

| Réglage | Effet |
| --- | --- |
| `start_date` | Le premier run possible. Avant cette date, rien |
| `end_date` | Le dernier run possible. Après, le DAG ne se lance plus tout seul |
| `catchup=True` | Quand tu sors le DAG de pause, Airflow lance **tous** les runs manqués depuis `start_date` |
| `catchup=False` | Seulement le plus récent. Le passé, tu le rattrapes quand tu veux, par backfill |

`catchup=False` est le réglage par défaut d'Airflow 3, et le plus sûr : un DAG avec `start_date` en 2019 et `catchup=True` lancerait d'un coup des dizaines de runs.

## Le backfill

Un backfill crée les runs d'une période passée, chacun avec sa date logique :

```bash
docker compose exec airflow-scheduler airflow backfill create \
  --dag-id taxi_postgres_scheduled \
  --from-date 2019-01-01 --to-date 2019-03-31 \
  --dag-run-conf '{"taxi": "green"}' \
  --max-active-runs 1
```

Le `\` en fin de ligne continue la commande sur la ligne suivante. `--dag-run-conf` donne les paramètres, comme `-c` avec `dags test`. `--dry-run` montre les runs qui **seraient** créés, sans rien lancer : lance-le toujours d'abord.

Deux pièges, tous deux vérifiés :

- **Un DAG en pause ne fait pas avancer ses backfills** : les runs restent `queued`. Sors-le de pause (l'interrupteur dans la page Dags, ou `airflow dags unpause <dag_id>`).
- **Le backfill ignore le `max_active_runs` du DAG** et lance plusieurs mois **en même temps**, sauf si tu lui donnes `--max-active-runs 1`. Pour ce pipeline, qui vide et remplit **une seule** table de staging, c'est indispensable : tu verras pourquoi dans l'exercice « casser et réparer ».

Dans l'interface, la fenêtre **Trigger Dag** d'un DAG planifié propose aussi **Backfill**, avec une période et des options.

@@ codespaces
- Un backfill de six mois de taxis verts prend environ 3 minutes dans un Codespace. Suis-le dans la grille du DAG : une colonne par mois, qui passe au vert l'une après l'autre.
- Laisse ton Codespace ouvert pendant un backfill : un Codespace inactif s'arrête au bout de 30 minutes, et Airflow avec.

@@ predict
Ton DAG planifié a `start_date=datetime(2019, 1, 1)`, `end_date=datetime(2021, 7, 31)` et `catchup=False`. Nous sommes en 2026. Tu le sors de pause. Combien de runs Airflow lance-t-il tout seul ?

@@ predict-answer
**Aucun.** Avec `catchup=False`, Airflow ne lancerait que le run le plus récent… mais `end_date` est dépassée depuis longtemps : il n'y a plus aucun run à planifier. Ce DAG ne se lance donc **que** par backfill, ce qui est exactement ce qu'on veut ici : les fichiers des taxis s'arrêtent en juillet 2021. Dans un vrai projet, sans `end_date`, il se lancerait le 1er de chaque mois.

@@ practice
Crée `taxi_postgres_scheduled`, la version planifiée de ton pipeline, puis charge le premier trimestre 2019 des taxis verts **par backfill**.

@@ constraints
- Un nouveau fichier `dags/taxi_postgres_scheduled.py`, copié de `taxi_postgres.py` : ton DAG de la leçon 7 reste intact
- Planifié le 1er de chaque mois à 9 h, **heure de New York**, du 1er janvier 2019 au 31 juillet 2021, sans catchup
- Un seul paramètre, `taxi` : le mois vient de la date logique
- Un backfill de janvier à mars 2019 pour `green`, un mois à la fois
- `SELECT filename, count(*) FROM green_tripdata GROUP BY 1 ORDER BY 1` montre trois fichiers : 630 918, 575 685 et 601 102 trajets

@@ guide
### 1. Copie le DAG

~~~bash
cp dags/taxi_postgres.py dags/taxi_postgres_scheduled.py
code dags/taxi_postgres_scheduled.py
~~~

Change le `dag_id`, le nom de la fonction, et l'appel tout en bas : deux DAGs ne peuvent pas avoir le même `dag_id`.

### 2. Le nom du fichier vient de la date logique

Dans ta constante du nom de fichier, remplace `{{ params.year }}-{{ params.month }}` par un seul template qui écrit la date logique au format année-mois. La leçon montre comment.

### 3. Les paramètres

Garde seulement `taxi` dans `params`. `year` et `month` ne servent plus.

### 4. La planification

Importe `CronTriggerTimetable`, puis remplace `schedule=None` par un timetable avec l'expression cron du 1er du mois à 9 h et le fuseau de New York. Change `start_date`, ajoute `end_date`, garde `catchup=False`. Ajoute aussi `max_active_runs=1` : pour les runs planifiés, il empêche deux mois de se chevaucher.

### 5. Vérifie que le DAG est lu

~~~bash
docker compose exec airflow-scheduler airflow dags reserialize
docker compose exec airflow-scheduler airflow dags list-import-errors
~~~

Dans la page Dags, la colonne **Schedule** de ton DAG montre maintenant `0 9 1 * *`.

### 6. Le backfill, d'abord à blanc

Lance la commande de backfill de la leçon avec `--dry-run` en plus. Tu dois voir trois dates logiques : les 1er janvier, février et mars 2019 à 14 h, en UTC (9 h à New York).

### 7. Sors le DAG de pause, puis lance le backfill

~~~bash
docker compose exec airflow-scheduler airflow dags unpause taxi_postgres_scheduled
~~~

Puis la commande de backfill, sans `--dry-run`. Suis les runs dans la grille, ou avec :

~~~bash
docker compose exec airflow-scheduler airflow dags list-runs taxi_postgres_scheduled
~~~

### 8. Compte par fichier

~~~bash
docker compose exec pgdatabase psql -U root -d ny_taxi -c "SELECT filename, count(*) FROM green_tripdata GROUP BY 1 ORDER BY 1"
~~~

Janvier était déjà là depuis la leçon 7 : le `MERGE` n'a rien ajouté pour ce mois. Ton idempotence marche même entre deux DAGs différents.

@@ hints
- Le template du mois : `{{ logical_date.strftime('%Y-%m') }}`. Les guillemets simples à l'intérieur, parce que la chaîne Python utilise des guillemets doubles.
- L'import : `from airflow.timetables.trigger import CronTriggerTimetable`. L'appel : `CronTriggerTimetable("0 9 1 * *", timezone="America/New_York")`.
- Les runs restent `queued` ? Ton DAG est en pause : `airflow dags unpause taxi_postgres_scheduled`.

@@ solution
`dags/taxi_postgres_scheduled.py` :

~~~python
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import Param, dag, task
from airflow.timetables.trigger import CronTriggerTimetable

from taxi_schema import COLUMNS

DATA = "/opt/airflow/data"
# Des chaînes normales : Jinja les remplit au moment du run (leçon 6)
TAXI = "{{ params.taxi }}"
# Le mois vient maintenant de la date logique du run, plus d'un paramètre
FICHIER = "{{ params.taxi }}_tripdata_{{ logical_date.strftime('%Y-%m') }}.csv"
URL = "https://github.com/DataTalksClub/nyc-tlc-data/releases/download/{{ params.taxi }}/" + FICHIER + ".gz"


@dag(
    dag_id="taxi_postgres_scheduled",
    # Le 1er de chaque mois à 9 h, heure de New York
    schedule=CronTriggerTimetable("0 9 1 * *", timezone="America/New_York"),
    start_date=datetime(2019, 1, 1),
    end_date=datetime(2021, 7, 31),  # les fichiers s'arrêtent en juillet 2021
    catchup=False,
    max_active_runs=1,
    params={"taxi": Param("green", enum=["yellow", "green"])},
    tags=["module-02"],
)
def taxi_postgres_scheduled():
    # pipefail : si curl échoue, toute la commande échoue (pas seulement gunzip)
    extract = BashOperator(
        task_id="extract",
        bash_command="set -o pipefail; curl -sSLf " + URL + " | gunzip > " + DATA + "/" + FICHIER + " && ls -lh " + DATA + "/" + FICHIER,
    )

    @task
    def create_tables(taxi: str):
        cols = ", ".join(f"{name} {kind}" for name, kind in COLUMNS[taxi].items())
        PostgresHook(postgres_conn_id="ny_taxi").run(f"""
            CREATE TABLE IF NOT EXISTS {taxi}_tripdata (unique_row_id text, filename text, {cols});
            CREATE TABLE IF NOT EXISTS {taxi}_tripdata_staging (LIKE {taxi}_tripdata);
            TRUNCATE {taxi}_tripdata_staging;
        """)

    @task
    def load_staging(taxi: str, file: str):
        cols = ", ".join(COLUMNS[taxi])
        hook = PostgresHook(postgres_conn_id="ny_taxi")
        # COPY lit le fichier d'un coup : bien plus rapide que des INSERT ligne par ligne
        hook.copy_expert(f"COPY {taxi}_tripdata_staging ({cols}) FROM STDIN WITH (FORMAT csv, HEADER true)", f"{DATA}/{file}")
        print(hook.get_first(f"SELECT count(*) FROM {taxi}_tripdata_staging")[0], "lignes en staging")

    @task
    def add_ids(taxi: str, file: str):
        p = "tpep" if taxi == "yellow" else "lpep"  # les colonnes de dates n'ont pas le même nom
        PostgresHook(postgres_conn_id="ny_taxi").run(f"""
            UPDATE {taxi}_tripdata_staging SET
              unique_row_id = md5(
                COALESCE(VendorID, '') || COALESCE({p}_pickup_datetime::text, '') ||
                COALESCE({p}_dropoff_datetime::text, '') || COALESCE(PULocationID, '') ||
                COALESCE(DOLocationID, '') || COALESCE(fare_amount::text, '') || COALESCE(trip_distance::text, '')
              ),
              filename = '{file}';
        """)

    @task
    def merge(taxi: str):
        names = ["unique_row_id", "filename", *COLUMNS[taxi]]
        hook = PostgresHook(postgres_conn_id="ny_taxi")
        # On ajoute seulement les trajets dont l'identifiant n'est pas déjà dans la table finale
        hook.run(f"""
            MERGE INTO {taxi}_tripdata AS T
            USING {taxi}_tripdata_staging AS S
            ON T.unique_row_id = S.unique_row_id
            WHEN NOT MATCHED THEN
              INSERT ({", ".join(names)}) VALUES ({", ".join("S." + n for n in names)});
        """)
        print(hook.get_first(f"SELECT count(*) FROM {taxi}_tripdata")[0], "lignes dans la table finale")

    cleanup = BashOperator(task_id="cleanup", bash_command="rm -f " + DATA + "/" + FICHIER)

    extract >> create_tables(TAXI) >> load_staging(TAXI, FICHIER) >> add_ids(TAXI, FICHIER) >> merge(TAXI) >> cleanup


taxi_postgres_scheduled()
~~~

Par rapport à `taxi_postgres.py`, seuls changent : l'import de `CronTriggerTimetable`, la constante `FICHIER`, le bloc `@dag(...)` et le nom de la fonction. Les tâches sont **exactement** les mêmes : c'est tout l'intérêt des templates.

La commande, puis le résultat :

~~~bash
docker compose exec airflow-scheduler airflow dags unpause taxi_postgres_scheduled
docker compose exec airflow-scheduler airflow backfill create \
  --dag-id taxi_postgres_scheduled \
  --from-date 2019-01-01 --to-date 2019-03-31 \
  --dag-run-conf '{"taxi": "green"}' \
  --max-active-runs 1
~~~

~~~text
          filename          | count
----------------------------+--------
 green_tripdata_2019-01.csv | 630918
 green_tripdata_2019-02.csv | 575685
 green_tripdata_2019-03.csv | 601102
~~~

@@ selfcheck
- La colonne Schedule de la page Dags montre `0 9 1 * *`
- `--dry-run` liste trois dates logiques à 14 h UTC
- Les trois runs de backfill sont verts, et les comptes par fichier sont justes

@@ breakfix
Provoque la course entre les runs. Supprime la table finale :

~~~bash
docker compose exec pgdatabase psql -U root -d ny_taxi -c "DROP TABLE green_tripdata"
~~~

Puis lance un backfill d'**avril à juin** 2019 pour `green`, avec `--reprocess-behavior completed` mais **sans** `--max-active-runs 1`. Regarde l'état des runs, les erreurs dans les logs, et les comptes par fichier. Explique ce qui s'est passé, puis répare les données.

@@ breakfix-hints
- `airflow dags list-runs taxi_postgres_scheduled` : plusieurs runs sont `running` **en même temps**.
- Les trois runs vident, remplissent et lisent la **même** table `green_tripdata_staging`. Que se passe-t-il si avril vide la staging pendant que mai la lit ?
- Pour réparer, ne te contente pas de relancer les runs rouges : une table finale abîmée se reconstruit. `DROP TABLE`, puis un backfill propre, avec `--max-active-runs 1`.

@@ breakfix-answer
Les trois mois tournent **en même temps** et se marchent dessus dans les mêmes tables. Le résultat change d'une fois à l'autre, ce qui rend ce bug si dangereux. Dans le lab de ce cours, on a obtenu par exemple :

- des runs **rouges**, avec `deadlock detected` (deux runs s'attendent l'un l'autre) ou `duplicate key value violates unique constraint` (deux runs créent la même table au même instant) ;
- et, pire, des runs **verts** avec des données **fausses** : les trajets d'avril rangés sous le nom du fichier de mai, parce que mai a écrit son nom de fichier sur toute la staging pendant qu'avril y était encore.

Les runs rouges se voient. Les données fausses, non : seule la requête par fichier les révèle. Pour réparer, supprime la table finale et relance le backfill **un mois à la fois** :

~~~bash
docker compose exec pgdatabase psql -U root -d ny_taxi -c "DROP TABLE green_tripdata"
docker compose exec airflow-scheduler airflow backfill create \
  --dag-id taxi_postgres_scheduled \
  --from-date 2019-04-01 --to-date 2019-06-30 \
  --dag-run-conf '{"taxi": "green"}' \
  --max-active-runs 1 --reprocess-behavior completed
~~~

Les comptes justes : 514 392 en avril, 504 887 en mai, 471 052 en juin. Tu as aussi supprimé janvier à mars : recharge-les de la même façon. La vraie correction, dans un projet sérieux, serait une table de staging **par run** (avec le mois dans son nom), pour que deux runs ne partagent jamais rien.

@@ explain
Explique la différence entre un run planifié, un run manuel et un run de backfill. Puis explique pourquoi `America/New_York` est plus juste que `EST` pour planifier à 9 h à New York.

@@ resources
- [Les planifications (documentation officielle)](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/cron.html)
- [Les timetables et les fuseaux horaires](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/timetable.html)
- [Le backfill dans Airflow 3](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/backfill.html)
- [crontab.guru, pour lire une expression cron](https://crontab.guru/)

@@ declic
- [00-06] Les expressions cron, tu les as découvertes au module 0 : ta GitHub Action de synchronisation tourne avec `cron: "0 3 * * *"`. Airflow utilise exactement la même syntaxe à cinq champs, et compte lui aussi en UTC par défaut.
- [02-06] À la leçon 6, `{{ ds }}` échouait sur un run lancé par `airflow dags trigger` sans date. Ici, chaque run de backfill a sa date logique : c'est pour ces runs-là que les templates de dates existent.

@@ teaser
- [02-09] Le même pipeline, mais les fichiers vont dans un bucket et les tables dans BigQuery.

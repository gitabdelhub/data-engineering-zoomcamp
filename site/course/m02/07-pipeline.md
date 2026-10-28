# Le pipeline des taxis vers Postgres

Tout ce que tu as appris se rejoint ici. Ton DAG `taxi_postgres` va, pour un type de taxi, une année et un mois choisis au lancement :

1. télécharger le fichier `.csv.gz` depuis GitHub et le décompresser dans `data/` ;
2. créer les tables si elles n'existent pas ;
3. charger le fichier dans une table de **staging** (une table de transit) ;
4. donner à chaque trajet un **identifiant unique** ;
5. **fusionner** dans la table finale seulement les trajets qu'elle n'a pas encore ;
6. supprimer le fichier.

C'est le même pipeline que le flow `04_postgres_taxi` du cours officiel, écrit pour Airflow.

```mermaid
graph LR
    E[extract] --> C[create_tables]
    C --> L[load_staging]
    L --> I[add_ids]
    I --> M[merge]
    M --> X[cleanup]
```

## Pourquoi staging puis fusion ?

Le but est l'**idempotence** : lancer deux fois le même mois doit donner **exactement** le même résultat qu'une seule fois. Dans la vraie vie, tu relanceras souvent : une tâche a échoué au milieu, un fichier a été corrigé, tu as cliqué deux fois.

Si tu chargeais directement dans la table finale avec un simple `INSERT`, chaque relance ajouterait une copie de tous les trajets. Avec le staging :

- la table de staging est **vidée** à chaque run, puis remplie avec le fichier du mois ;
- chaque trajet reçoit un identifiant calculé à partir de ses valeurs : le même trajet a toujours le même identifiant ;
- la fusion ajoute à la table finale seulement les identifiants **absents**. Relancer ne trouve rien de nouveau à ajouter.

## Les pièces, une par une

### Charger un fichier très vite : COPY

`COPY` est la commande de Postgres pour charger un fichier entier d'un coup, bien plus vite qu'un `INSERT` par ligne. Avec un hook, `copy_expert` envoie le fichier depuis ta tâche :

```python
hook.copy_expert(
    "COPY villes (nom, pays) FROM STDIN WITH (FORMAT csv, HEADER true)",
    "/opt/airflow/data/villes.csv",
)
```

`FROM STDIN` veut dire « le contenu arrive par la connexion », `HEADER true` saute la ligne des titres. La liste de colonnes doit suivre **l'ordre du fichier**.

### Un identifiant unique : md5

`md5(texte)` calcule une empreinte de 32 caractères : le même texte donne toujours la même empreinte. On colle les valeurs qui décrivent un trajet avec `||`, et `COALESCE(x, '')` remplace une valeur vide par un texte vide (sinon, une seule valeur vide rendrait tout le texte vide) :

```sql
UPDATE villes_staging
SET id = md5(COALESCE(nom, '') || COALESCE(pays, ''));
```

`::text` transforme une valeur en texte : `COALESCE(trip_distance::text, '')`.

### Une table copiée sur une autre : LIKE

```sql
CREATE TABLE IF NOT EXISTS villes_staging (LIKE villes);
```

crée une table avec exactement les mêmes colonnes que `villes`. Pratique : staging et table finale ne peuvent pas diverger.

### Fusionner : MERGE

```sql
MERGE INTO villes AS T
USING villes_staging AS S
ON T.id = S.id
WHEN NOT MATCHED THEN
  INSERT (id, nom, pays) VALUES (S.id, S.nom, S.pays);
```

Pour chaque ligne de `S` (la source), Postgres cherche une ligne de `T` (la cible) avec le même `id`. S'il n'en trouve pas, il l'insère. S'il en trouve une, il ne fait rien.

### Une commande Bash qui échoue vraiment : pipefail

Dans `curl ... | gunzip > fichier`, Bash ne regarde par défaut que le résultat de la **dernière** commande du tuyau. Si `curl` échoue, l'erreur peut passer inaperçue (souviens-toi de la tâche verte de la leçon 6). `set -o pipefail;` au début de la commande fait échouer tout le tuyau dès qu'une commande échoue.

## Les données

Les fichiers sont sur GitHub, de janvier 2019 à **juillet 2021**, pour `yellow` et `green` :

```text
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/green_tripdata_2019-01.csv.gz
```

Les colonnes des deux types de taxis ne sont pas les mêmes (les dates s'appellent `tpep_...` chez les jaunes, `lpep_...` chez les verts). Pour ne pas les répéter dans chaque DAG, elles vivent dans un petit module Python à part, `dags/taxi_schema.py`. Le dossier `dags/` est dans le chemin de Python d'Airflow : un DAG peut faire `from taxi_schema import COLUMNS`.

@@ codespaces
- Un mois de taxis jaunes fait plus de 100 Mo décompressé. La tâche `cleanup` le supprime à la fin : ton Codespace a 32 Go de disque, mais Docker en prend déjà une bonne part. `df -h /` te montre ce qui reste.
- Un mois prend entre 30 secondes et une minute dans un Codespace. Les mois jaunes de 2019 sont les plus gros (7 millions de trajets) : plusieurs minutes chacun.

@@ predict
Tu lances `taxi_postgres` pour `green`, 2019, `01` : la table finale contient 630 918 trajets. Tu relances **exactement** le même run. Combien de trajets contient la table finale ? Et la table de staging ?

@@ predict-answer
**630 918 dans les deux.** La staging a été vidée puis rechargée avec le même fichier : 630 918 lignes. La fusion compare chaque identifiant avec la table finale, les trouve tous, et n'ajoute **rien**. Le log de `merge` affiche le même total qu'au premier run. C'est l'idempotence : relancer n'abîme rien.

@@ practice
Construis le DAG `taxi_postgres`, qui charge un mois de taxis dans Postgres, et prouve qu'on peut le relancer sans créer de doublons.

@@ constraints
- Le dossier `data/` est monté dans les conteneurs d'Airflow, et `dags/taxi_schema.py` contient les colonnes des deux types de taxis
- Trois paramètres `taxi`, `year` et `month`, comme à la leçon 6, et six tâches : `extract`, `create_tables`, `load_staging`, `add_ids`, `merge`, `cleanup`
- Deux tables par type de taxi : `green_tripdata` et `green_tripdata_staging` (pareil pour `yellow`), avec deux colonnes de plus que le fichier : `unique_row_id` et `filename`
- Lancé deux fois pour `green`, 2019, `01`, la table finale contient 630 918 trajets les deux fois. Lancé pour `yellow`, 2021, `01`, elle en contient 1 369 765
- La connexion `ny_taxi` de la leçon 5, et aucun mot de passe dans les fichiers du DAG

@@ guide
### 1. Monte le dossier data/

Dans `docker-compose.yaml`, sous `x-airflow-common`, la liste `volumes:` monte déjà `dags`, `logs`, `config` et `plugins`. Ajoute une ligne sur le même modèle pour `data`, vers `/opt/airflow/data`. Puis `docker compose up -d`, et vérifie :

~~~bash
docker compose exec airflow-scheduler ls -ld /opt/airflow/data
~~~

### 2. Le module des colonnes

Crée `dags/taxi_schema.py` avec ce contenu. Ce sont des **données** (les colonnes des fichiers, dans leur ordre, avec leur type Postgres), pas de la logique : tu peux le recopier tel quel.

~~~python
"""Les colonnes des CSV des taxis, partagées par tous mes DAGs."""

# Les colonnes de chaque CSV, dans l'ordre du fichier, avec leur type Postgres
COLUMNS = {
    "yellow": {
        "VendorID": "text", "tpep_pickup_datetime": "timestamp", "tpep_dropoff_datetime": "timestamp",
        "passenger_count": "integer", "trip_distance": "double precision", "RatecodeID": "text",
        "store_and_fwd_flag": "text", "PULocationID": "text", "DOLocationID": "text",
        "payment_type": "integer", "fare_amount": "double precision", "extra": "double precision",
        "mta_tax": "double precision", "tip_amount": "double precision", "tolls_amount": "double precision",
        "improvement_surcharge": "double precision", "total_amount": "double precision",
        "congestion_surcharge": "double precision",
    },
    "green": {
        "VendorID": "text", "lpep_pickup_datetime": "timestamp", "lpep_dropoff_datetime": "timestamp",
        "store_and_fwd_flag": "text", "RatecodeID": "text", "PULocationID": "text", "DOLocationID": "text",
        "passenger_count": "integer", "trip_distance": "double precision", "fare_amount": "double precision",
        "extra": "double precision", "mta_tax": "double precision", "tip_amount": "double precision",
        "tolls_amount": "double precision", "ehail_fee": "double precision",
        "improvement_surcharge": "double precision", "total_amount": "double precision",
        "payment_type": "integer", "trip_type": "integer", "congestion_surcharge": "double precision",
    },
}
~~~

Dans une tâche, `COLUMNS["green"]` est un dictionnaire : `", ".join(COLUMNS["green"])` donne la liste des noms séparés par des virgules, et `.items()` donne les paires (nom, type).

### 3. Le squelette du DAG

`dags/taxi_postgres.py` : les imports (dont `PostgresHook` et `from taxi_schema import COLUMNS`), puis les constantes de la leçon 6 (`FICHIER`, l'adresse), et un `@dag` avec les trois paramètres. Ajoute une constante pour le dossier, `DATA = "/opt/airflow/data"`, et une pour le type de taxi, `TAXI = "{{ params.taxi }}"`.

Écris d'abord **seulement** `extract` et `cleanup`, reliés par `>>`, et lance `airflow dags test taxi_postgres`. Le log de `extract` doit montrer le fichier et sa taille. Avancer tâche par tâche évite de chercher une erreur dans six tâches à la fois.

### 4. extract

Une commande Bash : `set -o pipefail;`, puis `curl -sSLf` sur l'adresse, un tuyau vers `gunzip`, une redirection `>` vers `DATA + "/" + FICHIER`, puis `&& ls -lh` du fichier pour voir sa taille dans le log. Colle les morceaux avec `+`, sans f-string autour des templates.

### 5. create_tables

Une tâche `@task` qui reçoit le type de taxi (passe-lui `TAXI` à l'appel). Dans le corps, `taxi` est une vraie valeur (`"green"`) : tu peux construire le SQL avec une f-string, sans danger. Elle fabrique la liste `nom type, nom type…` à partir de `COLUMNS[taxi]`, puis lance avec le hook :

- la table finale, avec `unique_row_id text` et `filename text` en premier ;
- la staging, avec `LIKE` ;
- un `TRUNCATE` de la staging, pour la vider.

### 6. load_staging

Reçoit le type de taxi et le nom du fichier. `copy_expert` charge le fichier dans la staging, avec la liste des colonnes dans l'ordre du fichier. Affiche ensuite le nombre de lignes de la staging avec `get_first` : tu le verras dans le log.

### 7. add_ids

Un `UPDATE` de la staging qui remplit `unique_row_id` avec le `md5` de sept valeurs collées : `VendorID`, la date de prise en charge, la date de dépose, `PULocationID`, `DOLocationID`, `fare_amount` et `trip_distance`. Et `filename` avec le nom du fichier. Les colonnes de dates commencent par `tpep` chez les jaunes et `lpep` chez les verts : choisis le préfixe selon `taxi`.

### 8. merge

Le `MERGE` de la leçon, avec toutes les colonnes : `unique_row_id`, `filename`, puis celles de `COLUMNS[taxi]`. Affiche le total de la table finale.

### 9. Relie tout et teste deux fois

~~~bash
docker compose exec airflow-scheduler airflow dags test taxi_postgres
docker compose exec airflow-scheduler airflow dags test taxi_postgres
~~~

Sans `-c`, ce sont les valeurs par défaut : `green`, 2019, `01`. Les deux runs doivent afficher 630 918. Puis :

~~~bash
docker compose exec airflow-scheduler airflow dags test taxi_postgres -c '{"taxi": "yellow", "year": "2021", "month": "01"}'
~~~

@@ hints
- `copy_expert` échoue avec `extra data after last expected column` ou `missing data for column` : ta liste de colonnes ne correspond pas au fichier. Regarde la première ligne du fichier : `head -1 data/green_tripdata_2019-01.csv` (enlève `cleanup` le temps de vérifier).
- `invalid input syntax for type timestamp` ou `for type double precision` : une valeur tombe dans une colonne du mauvais type. Ta liste de colonnes du `COPY` n'est pas dans l'ordre du fichier, ou tu as pris les colonnes de l'autre type de taxi.
- Le total double au deuxième run ? Ton `merge` ajoute tout au lieu de seulement les absents : vérifie la ligne `ON T.unique_row_id = S.unique_row_id` et que `add_ids` tourne **avant** `merge`.

@@ solution
Dans `docker-compose.yaml`, la liste des volumes de `x-airflow-common` :

~~~yaml
  volumes:
    - ${AIRFLOW_PROJ_DIR:-.}/dags:/opt/airflow/dags
    - ${AIRFLOW_PROJ_DIR:-.}/logs:/opt/airflow/logs
    - ${AIRFLOW_PROJ_DIR:-.}/config:/opt/airflow/config
    - ${AIRFLOW_PROJ_DIR:-.}/plugins:/opt/airflow/plugins
    - ${AIRFLOW_PROJ_DIR:-.}/data:/opt/airflow/data      # les fichiers téléchargés
~~~

`dags/taxi_postgres.py` :

~~~python
from datetime import datetime

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import Param, dag, task

from taxi_schema import COLUMNS

DATA = "/opt/airflow/data"
# Des chaînes normales : Jinja les remplit au moment du run (leçon 6)
TAXI = "{{ params.taxi }}"
FICHIER = "{{ params.taxi }}_tripdata_{{ params.year }}-{{ params.month }}.csv"
URL = "https://github.com/DataTalksClub/nyc-tlc-data/releases/download/{{ params.taxi }}/" + FICHIER + ".gz"


@dag(
    dag_id="taxi_postgres",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    params={
        "taxi": Param("green", enum=["yellow", "green"]),
        "year": Param("2019", enum=["2019", "2020", "2021"]),
        "month": Param("01", enum=[f"{m:02d}" for m in range(1, 13)]),
    },
    tags=["module-02"],
)
def taxi_postgres():
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


taxi_postgres()
~~~

Les logs des deux runs `green`, 2019, `01` :

~~~text
-rw-rw-rw- 1 default root 55M ... /opt/airflow/data/green_tripdata_2019-01.csv
630918 lignes en staging
630918 lignes dans la table finale
~~~

Pourquoi des f-strings dans les tâches, alors que la leçon 6 les déconseille ? Parce qu'**à l'intérieur** d'une tâche, `taxi` et `file` sont déjà de vraies valeurs : il n'y a plus aucun template à protéger. Le piège ne concerne que les chaînes qui contiennent des `{{ }}`.

@@ selfcheck
- Deux runs de suite pour `green`, 2019, `01` affichent le même total : 630 918
- `SELECT filename, count(*) FROM green_tripdata GROUP BY 1` montre une seule ligne
- Le dossier `data/` est vide après un run : `cleanup` a fait son travail

@@ team
C'est le cœur du module : fais-le sur une branche `module-02/pipeline-taxis`, en plusieurs commits (un par tâche qui marche), puis une pull request dans ton fork. Dans la description, colle les logs des deux runs qui prouvent l'idempotence. Fais relire la PR par un camarade, ou relis-toi dans Files changed avant de fusionner.

@@ breakfix
Remplace ton `MERGE` par un simple ajout : `INSERT INTO green_tripdata SELECT * FROM green_tripdata_staging;` (seulement pour cet essai, avec `green`). Lance deux fois `green`, 2019, `01`. Que dit le total ? Comment réparer la table, et pas seulement le code ?

@@ breakfix-hints
- Le deuxième run affiche le double du premier.
- Remettre le `MERGE` dans le code ne retire pas les doublons déjà dans la table : le `MERGE` n'ajoute que des lignes, il n'en supprime jamais.
- La table finale peut toujours être reconstruite à partir des fichiers. Une table qu'on peut reconstruire, on peut la supprimer.

@@ breakfix-answer
Le premier run affiche 630 918, le deuxième **1 261 836** : chaque trajet est maintenant en double. L'`INSERT` ajoute tout ce qu'il y a en staging, sans regarder ce qui est déjà dans la table.

Réparer le code ne suffit pas : les doublons sont **déjà** dans la table. La solution la plus sûre est de la reconstruire :

~~~bash
docker compose exec pgdatabase psql -U root -d ny_taxi -c "DROP TABLE green_tripdata"
~~~

Puis remets le `MERGE`, et relance le run : `create_tables` recrée la table, et le total revient à 630 918. C'est une leçon importante du métier : un pipeline non idempotent ne casse pas bruyamment, il **abîme les données en silence**.

@@ explain
Explique avec tes mots ce qu'est l'idempotence, et comment le trio staging, `unique_row_id` et `MERGE` la garantit dans ton pipeline.

@@ resources
- [COPY dans la documentation de Postgres](https://www.postgresql.org/docs/current/sql-copy.html)
- [MERGE dans la documentation de Postgres](https://www.postgresql.org/docs/current/sql-merge.html)
- [Le flow Kestra officiel dont ce DAG est la traduction](https://github.com/DataTalksClub/data-engineering-zoomcamp/blob/main/02-workflow-orchestration/flows/04_postgres_taxi.yaml)

@@ declic
- [01-06] Au module 1, ton script lisait le CSV par morceaux avec pandas, puis `to_sql`. Ici, `COPY` fait le même travail directement dans Postgres, sans passer par pandas : c'est beaucoup plus rapide, mais toute la transformation doit alors se faire en SQL.
- [02-01] Les doublons que tu avais repérés en dessinant ton DAG à la leçon 1, sur la tâche `charger_trajets` : les voilà réglés par la fusion.

@@ teaser
- [02-08] Lancer ce DAG à la main pour chaque mois, c'est long. À la leçon suivante, il se lance tout seul, et rattrape les mois passés.

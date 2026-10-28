# Bonnes pratiques et débogage

Un DAG qui marche une fois n'est pas fini. En production, il tournera des centaines de fois, sera relancé après des pannes, relu par des collègues. Voici les règles que suivent les équipes, puis la boîte à outils pour comprendre un DAG qui échoue.

## Les règles

### 1. Idempotent

Relancer une tâche donne le même résultat qu'une seule fois. Tu l'as construit à la leçon 7 (staging et `MERGE`) et vu casser à la leçon 8 (runs en parallèle). Les deux formes les plus simples : **vider puis remplir** (`TRUNCATE` puis `COPY`) pour une petite table de référence, **fusionner** (`MERGE` sur un identifiant) pour une grosse table qui grandit.

### 2. Une tâche, une chose

Une tâche qui télécharge, transforme et charge d'un coup doit **tout** refaire si la dernière étape échoue. Trois tâches : seule celle qui a échoué se relance, et les logs disent tout de suite où est le problème.

### 3. Rien de lourd en haut du fichier

Le dag-processor **relit tes fichiers** toutes les 30 secondes environ. Tout ce qui est écrit en dehors des tâches s'exécute **à chaque lecture** : un téléchargement, une requête SQL ou un `Variable.get` en haut du fichier tournerait des milliers de fois par jour, et ralentirait tout Airflow. En haut du fichier : seulement des imports, des constantes et la définition du DAG. Le travail se fait **dans** les tâches.

### 4. Aucun secret dans le code

Mots de passe, clés, adresses de bases : dans des connexions et des variables, définies dans `.env` (leçons 5 et 9). Le fichier du DAG peut être lu par toute l'équipe, et finit sur GitHub.

### 5. Des réessais pour ce qui dépend du réseau

Un serveur qui ne répond pas pendant une minute ne doit pas faire échouer ton pipeline. `default_args` donne des réglages à **toutes** les tâches du DAG :

```python
from datetime import timedelta

@dag(..., default_args={"retries": 2, "retry_delay": timedelta(minutes=5)})
```

`retries=2` : deux essais de plus après un échec, donc trois en tout. Dans l'interface, une tâche qui attend son prochain essai est en état `up_for_retry` (jaune), et le log de chaque essai est gardé séparément.

### 6. Les XCom pour les adresses, pas pour les données

Un chemin de fichier, un nombre, une date : oui. Un fichier, un tableau de données : non (leçon 4).

## La boîte à outils du débogage

| Situation | L'outil |
| --- | --- |
| Le DAG n'apparaît pas | `airflow dags list-import-errors`, ou le badge rouge à côté du nombre de DAGs |
| Une tâche est rouge | Son onglet **Logs** : lis l'erreur **en entier**, de bas en haut |
| Mettre au point **une** tâche | `airflow tasks test <dag_id> <task_id>` : la lance seule, sans ses dépendances, sans rien enregistrer |
| Mettre au point tout le DAG | `airflow dags test <dag_id>` |
| Une valeur de template bizarre | L'onglet **Rendered Templates** de la tâche |
| Relancer une tâche après correction | Sur la page de la tâche, en haut à droite, la flèche circulaire (**Clear**, raccourci Maj + C) : la tâche et celles qui en dépendent repartent |
| Forcer l'état d'une tâche | Les icônes ✓ et ✕ à côté : marquer réussie ou ratée à la main |

**Clear** est l'outil le plus utile au quotidien : tu corriges le code, tu enregistres, tu « clear » la tâche rouge, et le run reprend **à partir de là**, sans refaire les tâches déjà vertes.

@@ predict
Tu mets `BUCKET = Variable.get("gcp_bucket")` tout en haut de ton fichier de DAG, juste après les imports. La variable existe. Le DAG marche-t-il ? Combien de fois cette ligne s'exécute-t-elle par heure ?

@@ predict-answer
**Le DAG marche**, et c'est bien le problème : rien ne t'alerte. Mais la ligne s'exécute à **chaque lecture** du fichier par le dag-processor, environ toutes les 30 secondes, donc **plus de 100 fois par heure**, plus une fois au début de chaque tâche. Avec une variable dans une base ou un coffre-fort de secrets, c'est autant de requêtes pour rien. Et si la variable disparaît, c'est **tout le DAG** qui disparaît, avec une erreur d'import. Dans une tâche, ou avec `{{ var.value.gcp_bucket }}`, elle n'est lue qu'au moment du run.

@@ practice
Voici un DAG qui « marche » : il charge les zones de taxis dans Postgres. Il viole presque toutes les règles de la leçon. Trouve chaque problème, puis réécris-le proprement sous le nom `zones_propre`.

~~~python
from datetime import datetime

import psycopg
import requests
from airflow.sdk import dag, task

# Téléchargé à chaque lecture du fichier par Airflow
ZONES = requests.get("https://github.com/DataTalksClub/nyc-tlc-data/releases/download/misc/taxi_zone_lookup.csv").text


@dag(dag_id="zones_mauvais", start_date=datetime(2026, 1, 1), schedule=None, catchup=False)
def zones_mauvais():
    @task
    def tout_faire():
        conn = psycopg.connect("postgresql://root:root@pgdatabase:5432/ny_taxi")
        cur = conn.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS zones_bis (locationid text, borough text, zone text, service_zone text)")
        for ligne in ZONES.splitlines()[1:]:
            valeurs = [v.strip('"') for v in ligne.split(",")]
            cur.execute("INSERT INTO zones_bis VALUES (%s, %s, %s, %s)", valeurs)
        conn.commit()
        print("fini")

    tout_faire()


zones_mauvais()
~~~

@@ constraints
- Dans la case ci-dessous, la liste des problèmes du DAG d'origine, avec pour chacun la règle qu'il viole
- Un nouveau fichier `dags/zones_propre.py`, `dag_id="zones_propre"`, qui charge les zones dans une table `taxi_zones` avec trois tâches : `telecharger`, `charger`, `verifier`
- Rien n'est exécuté en haut du fichier, et aucun mot de passe n'y apparaît
- Chaque tâche a droit à deux réessais, à 30 secondes d'écart
- Lancé deux fois, `taxi_zones` contient 265 lignes les deux fois, et `verifier` **échoue** si ce n'est pas le cas

@@ guide
### 1. Fais-le tourner tel quel, deux fois

Copie le DAG dans `dags/zones_mauvais.py`, puis :

~~~bash
docker compose exec airflow-scheduler airflow dags reserialize
docker compose exec airflow-scheduler airflow dags test zones_mauvais
docker compose exec pgdatabase psql -U root -d ny_taxi -c "SELECT count(*) FROM zones_bis"
~~~

Relance les deux dernières commandes. Note les deux comptes.

### 2. Liste les problèmes

Relis le DAG ligne par ligne avec les six règles de la leçon à côté. Pour chaque ligne suspecte, demande-toi : quand s'exécute-t-elle ? Que se passe-t-il si on la relance ? Qui peut lire ce fichier ? Écris ta liste dans la case.

### 3. Le nouveau DAG, tâche par tâche

- `telecharger` : une tâche Bash qui télécharge le CSV dans `data/`, comme `extract` à la leçon 7 (sans `gunzip` : ce fichier n'est pas compressé). `curl -o <fichier> <adresse>` écrit dans un fichier.
- `charger` : avec `PostgresHook` et la connexion `ny_taxi`, crée la table si besoin, **vide-la**, puis charge le fichier avec `copy_expert`. Avec `FORMAT csv`, Postgres gère tout seul les guillemets du fichier : plus besoin de découper les lignes à la main.
- `verifier` : compte les lignes. Pour faire échouer une tâche, il suffit de lever une exception : `raise ValueError("...")`.

### 4. Les réessais

Avec `default_args` dans `@dag`, comme dans la leçon. N'oublie pas `from datetime import timedelta`.

### 5. Deux runs, et la vérification

`dags test` deux fois, puis le compte : 265 et 265.

### 6. Range

Supprime le mauvais DAG et sa table : `rm dags/zones_mauvais.py`, puis `DROP TABLE zones_bis` avec `psql`.

@@ hints
- Le premier problème est en haut du fichier, avant même `@dag`.
- Il y en a au moins cinq : où s'exécute le téléchargement, ce qui est écrit dans `psycopg.connect`, combien de choses fait `tout_faire`, ce que fait un deuxième run, et ce qui arrive si GitHub ne répond pas.
- `verifier` : `total = hook.get_first("SELECT count(*) FROM taxi_zones")[0]`, puis `if total != 265: raise ValueError(...)`.

@@ solution
Les problèmes du DAG d'origine :

1. **Le téléchargement est en haut du fichier** (`ZONES = requests.get(...)`) : il s'exécute à chaque lecture par le dag-processor, toutes les 30 secondes, même quand personne ne lance le DAG. Règle 3.
2. **Le mot de passe est dans le code** (`root:root` dans `psycopg.connect`). Règle 4.
3. **Une seule tâche fait tout** : télécharger, créer, insérer. Règle 2.
4. **Pas idempotent** : un `INSERT` sans vider la table. Le deuxième run donne 530 lignes au lieu de 265. Règle 1.
5. **Pas de réessais**, alors que tout dépend de GitHub. Règle 5.
6. En prime : découper un CSV avec `split(",")` casse dès qu'une valeur contient une virgule entre guillemets, et un `INSERT` par ligne est lent. `COPY` règle les deux.

`dags/zones_propre.py` :

~~~python
from datetime import datetime, timedelta

from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import dag, task

DATA = "/opt/airflow/data"
URL = "https://github.com/DataTalksClub/nyc-tlc-data/releases/download/misc/taxi_zone_lookup.csv"


@dag(
    dag_id="zones_propre",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    # Chaque tâche a droit à 3 essais en tout, à 30 secondes d'écart
    default_args={"retries": 2, "retry_delay": timedelta(seconds=30)},
    tags=["module-02"],
)
def zones_propre():
    # Le téléchargement se fait dans une tâche, pas en haut du fichier
    telecharger = BashOperator(task_id="telecharger", bash_command=f"curl -sSLf -o {DATA}/taxi_zones.csv {URL}")

    @task
    def charger():
        hook = PostgresHook(postgres_conn_id="ny_taxi")  # le mot de passe reste dans .env
        hook.run("""
            CREATE TABLE IF NOT EXISTS taxi_zones (locationid integer, borough text, zone text, service_zone text);
            TRUNCATE taxi_zones;
        """)
        # TRUNCATE puis COPY : relancer donne toujours le même contenu
        hook.copy_expert("COPY taxi_zones FROM STDIN WITH (FORMAT csv, HEADER true)", f"{DATA}/taxi_zones.csv")

    @task
    def verifier():
        total = PostgresHook(postgres_conn_id="ny_taxi").get_first("SELECT count(*) FROM taxi_zones")[0]
        if total != 265:
            raise ValueError(f"265 zones attendues, {total} trouvées")
        print(f"{total} zones : tout est bon")

    telecharger >> charger() >> verifier()


zones_propre()
~~~

Deux runs de suite affichent `265 zones : tout est bon`.

@@ selfcheck
- Mon fichier ne contient ni `requests`, ni `psycopg.connect`, ni `root`
- Deux runs de suite donnent 265 lignes
- J'ai trouvé au moins cinq problèmes dans le DAG d'origine

@@ breakfix
Dans `zones_propre.py`, juste après les imports, ajoute `from airflow.sdk import Variable` puis la ligne `ZONES_TABLE = Variable.get("zones_table")`. Cette variable n'existe pas. Lance `reserialize`, puis `list-import-errors`. Où est passé ton DAG ? Lis l'erreur, puis répare de deux façons : en supprimant la ligne, puis (pour essayer) en ajoutant la variable dans `.env`.

@@ breakfix-hints
- `zones_propre` n'est plus dans `airflow dags list` : une ligne en haut du fichier a fait échouer **toute** la lecture.
- L'erreur contient `VARIABLE_NOT_FOUND`.
- Une variable dans `.env` s'écrit avec le préfixe `AIRFLOW_VAR_` et le nom en majuscules. Puis `docker compose up -d`.

@@ breakfix-answer
Le DAG **disparaît**, et `list-import-errors` montre :

~~~text
airflow.sdk.exceptions.AirflowRuntimeError: VARIABLE_NOT_FOUND: {'message': 'Variable zones_table not found'}
~~~

La ligne s'exécute **pendant la lecture du fichier**, avant même que le DAG soit défini. Elle échoue, donc le fichier entier est rejeté, avec les trois tâches qui n'avaient rien demandé. Avec `AIRFLOW_VAR_ZONES_TABLE=taxi_zones` dans `.env` puis `docker compose up -d`, le DAG revient. Mais la vraie correction est de ne pas lire de variable en haut du fichier : dans une tâche avec `Variable.get`, ou dans un champ templaté avec `{{ var.value.zones_table }}`, une variable manquante ferait échouer **une tâche**, avec un log clair, au lieu de faire disparaître le DAG.

@@ explain
Choisis trois des six règles de la leçon. Pour chacune, raconte ce qui se passerait en production, sur un vrai pipeline, si on ne la respectait pas.

@@ resources
- [Les bonnes pratiques officielles d'Airflow](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [Le code en haut des fichiers de DAG](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html#top-level-python-code)
- [Les états des tâches et les réessais](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/tasks.html#task-instances)

@@ declic
- [01-06] Au module 1, ton script d'ingestion faisait tout dans une seule fonction : télécharger, transformer, charger. Pour un script lancé à la main, c'est très bien. Dans un orchestrateur, le découper en tâches te donne les réessais ciblés, les logs par étape et le Clear.

@@ teaser
- [02-defi] Le défi du module : un DAG planifié, sur des données que tu n'as jamais vues, avec toutes ces règles à la fois.

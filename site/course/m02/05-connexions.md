# Connexions et hooks

Ton DAG va écrire dans Postgres. Il lui faut une adresse, un utilisateur, un mot de passe. Les écrire dans le fichier du DAG serait une mauvaise idée : le mot de passe finirait sur GitHub, et changer de base voudrait dire modifier chaque DAG. Airflow range ces informations dans des **connexions**.

## Une connexion

Une connexion, c'est un **nom** (le `conn_id`) et tout ce qu'il faut pour joindre un service : un type (`postgres`, `google_cloud_platform`…), un hôte, un port, un utilisateur, un mot de passe, une base. Tes DAGs ne citent que le nom : `conn_id="ny_taxi"`.

Il y a trois façons d'en créer une :

| Façon | Comment | Pour qui |
| --- | --- | --- |
| Variable d'environnement | `AIRFLOW_CONN_NY_TAXI=postgresql://root:root@pgdatabase:5432/ny_taxi` | Le plus simple en local, et ce qu'on fait ici |
| L'interface | Menu **Admin**, puis **Connections**, puis **Add Connection** | Pratique pour essayer |
| La commande | `airflow connections add ny_taxi --conn-uri ...` | Pour les scripts |

Avec une variable d'environnement, le nom de la variable est `AIRFLOW_CONN_` suivi du `conn_id` **en majuscules**, et la valeur est une adresse au format :

```text
postgresql://utilisateur:motdepasse@hôte:port/base
```

Le compose officiel lit ton fichier `.env` et donne chacune de ses lignes à **tous** les conteneurs d'Airflow (la clé `env_file` de `x-airflow-common`). Une ligne dans `.env`, et toutes tes tâches connaissent la connexion. Et `.env` n'est pas commité.

Une connexion venue d'une variable d'environnement **n'apparaît pas** dans Admin, puis Connections : la page te le dit elle-même. Pour la vérifier, utilise la commande :

```bash
docker compose exec airflow-scheduler airflow connections get ny_taxi
```

## L'hôte : le nom du service, pas localhost

Tes tâches tournent **dans le conteneur** du scheduler. Pour elles, `localhost` désigne ce conteneur, où il n'y a pas de Postgres. Ta base des taxis est le service `pgdatabase` du même compose : sur le réseau que Compose a créé, son nom est son adresse.

## Hooks et opérateurs SQL

Les **providers** installés dans l'image d'Airflow (`postgres`, `google`, `common-sql`…) apportent deux sortes d'outils :

- un **opérateur** est une tâche toute faite. `SQLExecuteQueryOperator` lance du SQL sur une connexion, sans une ligne de Python :

```python
creer = SQLExecuteQueryOperator(
    task_id="creer_table_villes",
    conn_id="ny_taxi",
    sql="CREATE TABLE IF NOT EXISTS villes (nom text, pays text);",
)
```

- un **hook** est un objet Python qui parle à un service, à utiliser **dans** une tâche `@task` quand tu veux faire plus :

```python
@task
def lister_villes():
    hook = PostgresHook(postgres_conn_id="ny_taxi")
    for nom, pays in hook.get_records("SELECT nom, pays FROM villes"):
        print(nom, pays)
```

| Méthode de `PostgresHook` | Ce qu'elle fait |
| --- | --- |
| `run(sql)` | Lance une ou plusieurs requêtes, sans rien renvoyer |
| `get_records(sql)` | Renvoie toutes les lignes, comme une liste de tuples |
| `get_first(sql)` | Renvoie la première ligne seulement |
| `copy_expert(sql, fichier)` | Charge un fichier avec `COPY`, très vite (leçon 7) |

Les imports :

```python
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
```

@@ codespaces
- Après avoir modifié `.env`, lance `docker compose up -d` : Compose voit que la configuration a changé et recrée les conteneurs d'Airflow. Sans ça, ils gardent les anciennes valeurs.
- Le log d'une tâche peut afficher `Skipping masking for a secret as it's too short (<5 chars)` : Airflow cache les mots de passe dans les logs, sauf ceux de moins de 5 caractères, comme `root`. C'est un avertissement, pas une erreur.

@@ predict
Ta connexion `ny_taxi` pointe vers `pgdatabase:5432`. Depuis le terminal de ton Codespace (pas dans un conteneur), tu lances `psql -h pgdatabase -U root ny_taxi`. Est-ce que ça marche ? Et avec `-h localhost` ?

@@ predict-answer
**`-h pgdatabase` échoue** : ce nom n'existe que sur le réseau Docker du compose, et ton terminal n'y est pas. **`-h localhost` marche** (si `psql` est installé), parce que le compose publie le port 5432 de `pgdatabase` sur ton Codespace. C'est exactement l'inverse pour tes tâches Airflow : elles sont **dans** le réseau Docker, donc `pgdatabase` marche et `localhost` échoue. Une même base, deux adresses, selon d'où tu viens.

@@ practice
Écris le DAG `compteur_visites` : il crée une table, y ajoute une ligne à chaque run, puis compte les lignes, en passant toujours par la connexion `ny_taxi`.

@@ constraints
- La connexion `ny_taxi` est définie dans ton fichier `.env`, vers ton service `pgdatabase`, et le DAG ne contient **aucun** mot de passe
- Une tâche `creer_table` (avec `SQLExecuteQueryOperator`) crée la table `visites` si elle n'existe pas, avec une colonne `moment` (date et heure) et une colonne `source` (texte)
- Une tâche `ajouter_visite` (avec `SQLExecuteQueryOperator`) ajoute une ligne : l'heure actuelle et le texte `airflow`
- Une tâche `@task` `compter` lit le nombre de lignes avec `PostgresHook`, l'affiche et le renvoie
- Après trois runs, la table contient trois lignes, et tu le vérifies aussi avec `psql`

@@ guide
### 1. La connexion

Ajoute une ligne à ton `.env`, dans `mon-travail/module-02/airflow/` : le nom `AIRFLOW_CONN_NY_TAXI`, puis `=`, puis l'adresse au format de la leçon. Les identifiants sont ceux de ton service `pgdatabase`. Applique le changement, puis vérifie :

~~~bash
docker compose up -d
docker compose exec airflow-scheduler airflow connections get ny_taxi
~~~

La ligne affichée doit montrer `pgdatabase` dans la colonne `host`.

### 2. Les deux tâches SQL

Un `SQLExecuteQueryOperator` prend un `task_id`, un `conn_id` et du `sql`. L'exemple de la leçon crée une table `villes` : fais la même chose pour `visites`. En SQL, le type « date et heure » s'appelle `timestamp`. Pour la ligne à ajouter, `INSERT INTO visites VALUES (now(), 'airflow');` : `now()` est l'heure actuelle, vue par Postgres.

### 3. La tâche qui compte

Dans une fonction `@task`, crée un `PostgresHook` sur la connexion, puis `get_first("SELECT count(*) FROM visites")`. Le résultat est un tuple, la première ligne du résultat : le nombre est son premier élément, `[0]`.

### 4. L'ordre

Les trois tâches en file : créer, ajouter, compter. Ici, aucune valeur ne passe d'une tâche à l'autre : il faut des `>>`.

### 5. Trois runs, puis la vérification

~~~bash
docker compose exec airflow-scheduler airflow dags reserialize
docker compose exec airflow-scheduler airflow dags test compteur_visites
~~~

Lance `dags test` trois fois. Le log de `compter` doit afficher 1, puis 2, puis 3. Puis regarde la table directement :

~~~bash
docker compose exec pgdatabase psql -U root -d ny_taxi -c "SELECT * FROM visites"
~~~

Ici, `psql` tourne dans le conteneur `pgdatabase` : pas besoin de l'installer.

@@ hints
- Le nom de la variable est `AIRFLOW_CONN_` plus le `conn_id` en majuscules : `AIRFLOW_CONN_NY_TAXI` pour `ny_taxi`. L'adresse commence par `postgresql://`.
- `airflow connections get ny_taxi` répond `not found` ? Les conteneurs n'ont pas été recréés : `docker compose up -d`.
- `get_first(...)` renvoie un tuple comme `(3,)` : `[0]` donne le nombre.

@@ solution
La ligne ajoutée au `.env` (jamais commité) :

~~~text
AIRFLOW_CONN_NY_TAXI=postgresql://root:root@pgdatabase:5432/ny_taxi
~~~

`dags/compteur_visites.py` :

~~~python
from datetime import datetime

from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sdk import dag, task


@dag(dag_id="compteur_visites", start_date=datetime(2026, 1, 1), schedule=None, catchup=False, tags=["module-02"])
def compteur_visites():
    # conn_id renvoie à la variable AIRFLOW_CONN_NY_TAXI du fichier .env
    creer_table = SQLExecuteQueryOperator(
        task_id="creer_table",
        conn_id="ny_taxi",
        sql="CREATE TABLE IF NOT EXISTS visites (moment timestamp, source text);",
    )
    ajouter_visite = SQLExecuteQueryOperator(
        task_id="ajouter_visite",
        conn_id="ny_taxi",
        sql="INSERT INTO visites VALUES (now(), 'airflow');",
    )

    @task
    def compter():
        # Le hook lit la même connexion : aucun mot de passe dans ce fichier
        hook = PostgresHook(postgres_conn_id="ny_taxi")
        total = hook.get_first("SELECT count(*) FROM visites")[0]
        print(f"La table visites contient {total} lignes")
        return total

    creer_table >> ajouter_visite >> compter()


compteur_visites()
~~~

Au premier run, le log de `compter` dit `La table visites contient 1 lignes`, puis 2, puis 3.

@@ selfcheck
- `grep -n "root" dags/compteur_visites.py` ne trouve rien
- `airflow connections get ny_taxi` montre l'hôte `pgdatabase`
- `SELECT * FROM visites` montre trois lignes, avec trois heures différentes

@@ breakfix
Dans `.env`, remplace `pgdatabase` par `localhost` dans l'adresse de la connexion, puis `docker compose up -d` et `airflow dags test compteur_visites`. Lis l'erreur, explique-la, puis répare.

@@ breakfix-hints
- La première tâche échoue. Cherche une ligne qui commence par `psycopg.OperationalError`.
- L'adresse dans l'erreur est `127.0.0.1` : c'est `localhost`. Mais `localhost` **de qui** ?
- Repense à la prédiction de cette leçon : où tournent tes tâches ?

@@ breakfix-answer
`creer_table` échoue avec :

~~~text
psycopg.OperationalError: connection failed: connection to server at "127.0.0.1", port 5432 failed: Connection refused
~~~

La tâche tourne dans le conteneur du scheduler. Pour elle, `localhost` (`127.0.0.1`) est **ce conteneur**, où personne n'écoute sur le port 5432 : la connexion est refusée. Remets `pgdatabase`, le nom du service sur le réseau du compose, puis `docker compose up -d`. C'est la même erreur que pgAdmin au module 1, avec la même réponse.

@@ explain
Pourquoi les DAGs citent-ils un `conn_id` au lieu d'écrire directement l'adresse et le mot de passe ? Donne deux avantages concrets.

@@ resources
- [Les connexions (documentation officielle)](https://airflow.apache.org/docs/apache-airflow/stable/howto/connection.html)
- [La connexion Postgres et ses options](https://airflow.apache.org/docs/apache-airflow-providers-postgres/stable/connections/postgres.html)
- [SQLExecuteQueryOperator](https://airflow.apache.org/docs/apache-airflow-providers-common-sql/stable/operators.html)

@@ declic
- [01-07] Au module 1, pgAdmin devait joindre Postgres par le nom `pgdatabase`, pas par `localhost`. C'est la même règle ici : dans un réseau Docker, chaque conteneur a son propre `localhost`, et les autres s'appellent par leur nom de service.
- [00-03] Le `.env` qui ne part jamais sur GitHub garde maintenant ta connexion. C'est encore la règle du module 0 qui te protège.

@@ teaser
- [02-09] Pour Google Cloud, la connexion ne contient pas de mot de passe mais le chemin d'une clé de compte de service.

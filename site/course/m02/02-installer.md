# Installer Airflow 3 avec Docker Compose

Airflow, ce sont quatre services plus une base Postgres (leçon 1). Les installer un par un serait long : le projet Airflow fournit un **fichier Docker Compose officiel** qui lance tout. Tu vas le télécharger, puis l'**alléger** pour qu'il tienne dans ton Codespace.

## Le fichier officiel, et pourquoi l'alléger

Le compose officiel est fait pour imiter une installation de production. Il utilise le **CeleryExecutor** : les tâches sont envoyées par une file d'attente (Redis) à des machines « workers ». C'est utile quand on a des centaines de tâches en même temps, mais ça ajoute trois services (redis, airflow-worker, flower) et de la mémoire.

Pour apprendre, le **LocalExecutor** suffit : le scheduler lance lui-même les tâches, dans son conteneur. Même DAGs, même interface, moins de pièces.

| Version | Services qui tournent | Mémoire au repos |
| --- | --- | --- |
| Officielle (Celery) | 7, plus flower à la demande | plus lourde : un worker et Redis en plus |
| Allégée (Local), avec ta base des taxis | 6 | autour de 1,3 Go, mesurée |

Ton Codespace a 8 Go de mémoire : la version allégée y tient largement.

## Lire le fichier

Le compose officiel commence par un bloc spécial :

```yaml
x-airflow-common:
  &airflow-common
  image: ${AIRFLOW_IMAGE_NAME:-apache/airflow:3.3.2}
  environment:
    &airflow-common-env
    AIRFLOW__CORE__EXECUTOR: CeleryExecutor
    ...
```

- Une clé qui commence par `x-` est ignorée par Compose : elle sert à ranger des réglages communs.
- `&airflow-common` donne un **nom** (une « ancre ») à ce bloc. Plus bas, `<<: *airflow-common` dans un service veut dire « copie ici tout le bloc ». C'est du YAML standard : tous les services Airflow partagent la même image, les mêmes variables et les mêmes dossiers, écrits une seule fois.
- Les variables `AIRFLOW__SECTION__CLE` règlent Airflow : `AIRFLOW__CORE__EXECUTOR` est la clé `executor` de la section `core`. Deux tirets bas entre les morceaux.

Les dossiers montés depuis ton Codespace :

| Dossier | Ce qu'il contient |
| --- | --- |
| `dags/` | Tes fichiers de DAGs. C'est là que tu travailles |
| `logs/` | Les logs de chaque tâche |
| `config/` | `airflow.cfg`, la configuration générée au premier démarrage. **Il contient des clés secrètes** |
| `plugins/` | Du code partagé avancé (pas utilisé dans ce module) |

Le service `airflow-init` se lance une fois au début : il prépare la base de métadonnées, crée l'utilisateur `airflow` (mot de passe `airflow`) et règle les droits des dossiers.

@@ codespaces
- Dans un Codespace, ton identifiant Linux est `1000` : c'est ce que donne `id -u`. Le fichier `.env` le transmet à Airflow avec `AIRFLOW_UID`, pour que les fichiers créés par Airflow t'appartiennent.
- Compose affiche un avertissement `The "FERNET_KEY" variable is not set`. C'est normal en local : cette clé chiffre les mots de passe gardés dans la base d'Airflow, et tu ne mettras pas de mot de passe dans la base, seulement dans le compose.
- L'interface s'ouvre sur le port **8080**, dans l'onglet **Ports**. Dans un Codespace ouvert dans Chrome, l'adresse ressemble à `https://<nom>-8080.app.github.dev`.

@@ predict
Tu remplaces `CeleryExecutor` par `LocalExecutor`, mais tu oublies de supprimer le service `redis`. Airflow marche-t-il quand même ? Et qu'est-ce que tu perds ?

@@ predict-answer
**Oui, Airflow marche** : avec le LocalExecutor, plus personne n'envoie de tâches à Redis, donc Redis tourne pour rien. Tu perds seulement de la **mémoire** et du temps de démarrage. C'est un piège classique : une configuration qui marche, mais qui garde des pièces inutiles. Un fichier propre ne contient que ce qui sert.

@@ practice
Installe ton Airflow dans `mon-travail/module-02/airflow/`, à partir du compose officiel 3.3.2 que tu allèges toi-même.

@@ constraints
- Le compose part du fichier officiel d'Airflow 3.3.2, avec le **LocalExecutor**, sans les services `redis`, `airflow-worker` et `flower`, et sans les DAGs d'exemple
- Un service `pgdatabase` (Postgres 18, base `ny_taxi`, utilisateur et mot de passe `root`, port 5432, avec un healthcheck) pour les données des taxis, séparé de la base d'Airflow
- Tous les services sont `healthy` dans `docker compose ps`, et tu te connectes à l'interface sur le port 8080
- `git status` ne montre ni `logs/`, ni `.env`, ni `config/airflow.cfg`

@@ guide
### 1. Le dossier et ses sous-dossiers

~~~bash
mkdir -p /workspaces/data-engineering-zoomcamp/mon-travail/module-02/airflow
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-02/airflow
mkdir -p dags logs plugins config data
~~~

`data/` servira à la leçon 7 pour les fichiers téléchargés.

### 2. Télécharge le compose officiel

~~~bash
curl -LfO 'https://airflow.apache.org/docs/apache-airflow/3.3.2/docker-compose.yaml'
~~~

`-L` suit les redirections, `-f` échoue proprement si l'adresse est fausse, `-O` garde le nom du fichier. Ouvre-le avec `code docker-compose.yaml` et parcours-le : repère le bloc `x-airflow-common`, puis chaque service sous `services:`.

### 3. Le fichier .env

~~~bash
echo "AIRFLOW_UID=$(id -u)" > .env
cat .env
~~~

`$(id -u)` est remplacé par ton identifiant : le fichier contient `AIRFLOW_UID=1000`.

### 4. Ce qui ne doit pas aller dans Git

Crée un fichier `.gitignore` dans ce dossier, avec une ligne par chose à ignorer : les dossiers `logs/` et `data/`, le fichier `.env`, et `config/airflow.cfg`. Ce dernier est généré au premier démarrage et contient des clés secrètes.

### 5. Allège le compose

Fais ces changements un par un, en relisant le fichier à chaque fois.

1. Dans `x-airflow-common`, sous `environment`, remplace `CeleryExecutor` par `LocalExecutor`.
2. Supprime les deux lignes qui commencent par `AIRFLOW__CELERY__` : elles ne servent qu'à Celery.
3. Passe `AIRFLOW__CORE__LOAD_EXAMPLES` à `'false'` : sinon, une soixantaine de DAGs d'exemple encombrent l'interface.
4. Dans `x-airflow-common`, sous `depends_on`, supprime le bloc `redis:` et sa ligne `condition`. Garde `postgres`.
5. Supprime les services entiers `redis`, `airflow-worker` et `flower`. Un service va de son nom (deux espaces, puis `redis:`) jusqu'au service suivant.

Après chaque suppression, `docker compose config --quiet` vérifie que le fichier est encore valide : pas de message, c'est bon.

### 6. Ajoute ta base des taxis

Airflow a déjà un service `postgres`, mais c'est **sa** base de métadonnées : n'y mets jamais tes données. Ajoute un service `pgdatabase` à la fin de `services:`, comme celui de ton compose du module 1 (leçon 9) : image `postgres:18`, les trois variables `POSTGRES_*`, un volume nommé, le port `5432:5432` et un healthcheck avec `pg_isready`. Déclare le volume tout en bas, sous `volumes:`, à côté de `postgres-db-volume`.

### 7. Initialise, puis démarre

~~~bash
docker compose up airflow-init
~~~

La première fois, Docker télécharge l'image d'Airflow (environ 1,5 Go) : compte quelques minutes. Attends la ligne `airflow-init-1 exited with code 0`. Puis lance tout en arrière-plan :

~~~bash
docker compose up -d
docker compose ps
~~~

Relance `docker compose ps` toutes les 30 secondes : chaque service passe de `health: starting` à `healthy` en une à deux minutes.

### 8. Ouvre l'interface

Onglet **Ports**, ligne **8080**, icône du globe (« Open in Browser »). Connecte-toi avec `airflow` / `airflow`. La page **Dags** est vide : normal, tu n'as encore écrit aucun DAG.

### 9. Mesure la mémoire

~~~bash
docker stats --no-stream
~~~

La colonne `MEM USAGE` montre ce que prend chaque conteneur. Additionne : tu dois être autour de 1,3 Go.

@@ hints
- `docker compose config --quiet` ne dit rien quand le YAML est valide. S'il se plaint d'un service `redis` introuvable, il reste un `depends_on` qui le cite : cherche `redis` dans le fichier avec Ctrl + F.
- Le service `pgdatabase` est presque celui de ta leçon 1-09. Le healthcheck s'écrit `test: ["CMD", "pg_isready", "-U", "root", "-d", "ny_taxi"]`.
- Si un service reste en `health: starting` puis passe en `unhealthy`, lis ses logs : `docker compose logs airflow-scheduler --tail 50`.

@@ solution
Les changements dans `x-airflow-common` (le reste du bloc ne bouge pas) :

~~~yaml
  environment:
    &airflow-common-env
    AIRFLOW__CORE__EXECUTOR: LocalExecutor        # le scheduler lance les tâches lui-même
    AIRFLOW__CORE__AUTH_MANAGER: airflow.providers.fab.auth_manager.fab_auth_manager.FabAuthManager
    AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
    # les deux lignes AIRFLOW__CELERY__ sont supprimées
    AIRFLOW__CORE__FERNET_KEY: ${FERNET_KEY}
    AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
    AIRFLOW__CORE__LOAD_EXAMPLES: 'false'         # pas de DAGs d'exemple
    ...
  depends_on:
    &airflow-common-depends-on
    postgres:                                      # le bloc redis est supprimé
      condition: service_healthy
~~~

Les services `redis`, `airflow-worker` et `flower` sont supprimés en entier. Le nouveau service, à la fin de `services:` :

~~~yaml
  pgdatabase:                     # tes données, séparées de la base d'Airflow
    image: postgres:18
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: root
      POSTGRES_DB: ny_taxi
    volumes:
      - ny_taxi_postgres_data:/var/lib/postgresql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "root", "-d", "ny_taxi"]
      interval: 10s
      retries: 5
    restart: always

volumes:
  postgres-db-volume:
  ny_taxi_postgres_data:
~~~

Le `.gitignore` du dossier :

~~~text
logs/
data/
.env
config/airflow.cfg
~~~

Les commandes, dans l'ordre :

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-02/airflow
mkdir -p dags logs plugins config data
curl -LfO 'https://airflow.apache.org/docs/apache-airflow/3.3.2/docker-compose.yaml'
echo "AIRFLOW_UID=$(id -u)" > .env
# ... modifications du compose et du .gitignore ...
docker compose config --quiet     # le fichier est valide
docker compose up airflow-init    # une seule fois
docker compose up -d
docker compose ps                 # tous healthy
~~~

@@ selfcheck
- `docker compose ps` montre 6 services `healthy`
- Je me connecte à l'interface sur le port 8080
- `git status` ne montre que `docker-compose.yaml` et `.gitignore`

@@ git
Ton installation mérite un commit, mais pas tout le dossier. Avant `git add`, lance `git status` depuis le dossier `airflow/` et vérifie la liste : seuls `docker-compose.yaml` et `.gitignore` doivent apparaître. Si tu vois `config/airflow.cfg`, ton `.gitignore` n'est pas bon : ce fichier contient une `secret_key` et une `fernet_key`, et ne doit jamais être sur GitHub. Profites-en pour ajouter le port 8080 à ton devcontainer (leçon 0-07), avec le nom « Airflow ».

@@ git-hints
- `git check-ignore -v config/airflow.cfg` te dit quelle ligne de quel `.gitignore` ignore ce fichier. Pas de réponse : il n'est pas ignoré.
- Dans `.devcontainer/devcontainer.json`, ajoute `8080` dans `forwardPorts` et une entrée `"8080": { "label": "Airflow" }` dans `portsAttributes`.

@@ breakfix
Dans ton compose, écris `LocalExecuter` (avec un **e** à la place du **o**), puis `docker compose up -d`. Que montre `docker compose ps` ? Trouve l'erreur exacte, puis répare.

@@ breakfix-hints
- Un des services n'arrive jamais à `healthy` : regarde la colonne STATUS, la durée de « Up » repart sans cesse de zéro.
- Les logs de ce service : `docker compose logs airflow-scheduler --tail 30`.
- Le message parle de la clé `executor` dans la section `core` : c'est `AIRFLOW__CORE__EXECUTOR`.

@@ breakfix-answer
Le **scheduler redémarre en boucle** : `docker compose ps` le montre `Up 2 seconds (health: starting)`, encore et encore, parce que le compose dit `restart: always`. Ses logs disent :

~~~text
AirflowConfigException: The module/attribute could not be loaded. Please check "executor" key in "core" section.
~~~

Airflow ne connaît pas d'exécuteur `LocalExecuter`. Corrige la faute, puis `docker compose up -d` : Compose recrée seulement les services dont la configuration a changé. Retiens le réflexe : un service qui ne devient jamais `healthy`, ce sont **ses logs** qu'il faut lire.

@@ explain
Explique avec tes mots la différence entre le CeleryExecutor et le LocalExecutor, et pourquoi tes données des taxis ne vont pas dans le service `postgres` du compose.

@@ resources
- [Lancer Airflow avec Docker Compose (documentation officielle)](https://airflow.apache.org/docs/apache-airflow/stable/howto/docker-compose/index.html)
- [Les exécuteurs d'Airflow](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/executor/index.html)
- [Les ancres et les fusions en YAML](https://docs.docker.com/reference/compose-file/fragments/)

@@ declic
- [01-09] Le healthcheck et `depends_on` avec `condition: service_healthy`, tu les as écrits toi-même au module 1. Le compose d'Airflow utilise exactement la même mécanique : tous ses services attendent que `postgres` soit `healthy`, puis que `airflow-init` ait fini.
- [00-07] Le port 8080 que tu ajoutes à ton devcontainer suit la même logique que 5432 et 8085 : le devcontainer ne lance pas Airflow, il donne un nom au port dans l'onglet Ports.

@@ teaser
- [02-05] Ton service `pgdatabase` deviendra une **connexion** Airflow : tes DAGs y écriront sans jamais contenir le mot de passe.

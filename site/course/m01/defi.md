# Défi du module 1 : les aéroports du monde

Pas de vidéo, pas de leçon. Tu as les mêmes outils que dans le module, sur des données que tu n'as jamais vues. Essaie d'abord seul : c'est le meilleur test de ce que tu as appris. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## Les données

La liste des aéroports du monde, du projet open data [datasets/airport-codes](https://github.com/datasets/airport-codes). Utilise **exactement** cette version, figée pour que le résultat soit vérifiable :

```text
https://raw.githubusercontent.com/datasets/airport-codes/47bcc2220351d78dfbf66a9f45e83baed82a7b35/data/airport-codes.csv
```

## L'objectif

Dans `mon-travail/module-01/defi/`, une seule commande `docker compose up` doit :

1. démarrer **Postgres 18**, avec la base `airports`, l'utilisateur `dez` et le mot de passe `dez`, sur le port `5432` de ton Codespace ;
2. démarrer **pgAdmin** sur le port `8085` ;
3. lancer un service `ingest`, construit depuis **ton propre** Dockerfile avec uv, qui charge le fichier dans une table `airports`.

## Les règles sur les données

- Toutes les colonnes du fichier sont gardées, avec leurs noms d'origine.
- Une colonne `elevation_m` contient l'altitude en mètres (1 pied = 0,3048 mètre).
- La colonne `coordinates` est découpée en deux colonnes numériques `latitude` et `longitude`. Lis bien le fichier pour savoir laquelle vient en premier.
- Relancer l'ingestion donne toujours le même résultat.
- Aucune ligne du fichier ne doit être perdue ou modifiée en route.

## La vérification

Quand tu penses avoir fini, lance depuis la racine de ton fork :

```bash
bash site/checks/defi-01.sh
```

Le script interroge ta base avec cinq requêtes et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Le dossier

`mkdir -p` puis `cd` dans `mon-travail/module-01/defi/`. Tout le défi vit dans ce dossier : un projet uv, un script, un Dockerfile, un compose et un `.env`.

### 2. Regarde les données avant d'écrire du code

Télécharge le fichier avec `wget` et regarde ses premières lignes avec `head -5 airport-codes.csv`. Note les noms des colonnes, le format de `coordinates`, et les valeurs de `continent`. Ouvre-le aussi avec pandas dans un notebook pour voir les types.

### 3. Le script d'ingestion

Crée un projet uv (leçon 2) avec pandas, sqlalchemy et `psycopg[binary]`. Ton script, `ingest.py`, doit :

1. lire le CSV depuis l'adresse figée (pandas lit directement une URL, leçon 5) ;
2. ajouter `elevation_m` à partir de `elevation_ft` ;
3. découper `coordinates` en deux colonnes. `df["col"].str.split(",", expand=True)` coupe un texte en plusieurs colonnes ;
4. écrire la table `airports` avec `to_sql`, de façon à ce qu'une relance donne le même résultat (leçon 5).

Les réglages de connexion (utilisateur, mot de passe, hôte) peuvent venir de **variables d'environnement** : `os.environ["PG_USER"]` lit la variable `PG_USER`. C'est pratique, parce que le compose peut les fournir.

Teste-le d'abord sans Docker, avec une base lancée à la main (leçon 4), puis lance le script de vérification.

### 4. Le Dockerfile

Repars de celui de la leçon 8 : `python:3.13-slim`, uv, `uv sync --locked`, ton script en `ENTRYPOINT`. N'oublie pas le `.dockerignore`.

### 5. Le compose

Repars de celui de la leçon 9, avec trois services, le healthcheck et `depends_on`. Change la base (`airports`), l'utilisateur et le mot de passe (`dez`). Pour le service `ingest`, `build: .` construit l'image depuis le dossier courant, et la clé `environment:` donne les variables au script, dont `PG_HOST: pgdatabase`.

### 6. Vérifie

`docker compose up`, puis, depuis la racine du fork, `bash site/checks/defi-01.sh`. Un ❌ affiche la requête et ce que ta base répond : compare avec ce que tu attendais. Un écart sur les continents ? Lis l'indice 1 ci-dessous.

@@ solution
Les fichiers, dans `mon-travail/module-01/defi/` :

~~~text
defi/
├── .dockerignore
├── .env               # pas commité
├── Dockerfile
├── docker-compose.yaml
├── ingest.py
├── pyproject.toml     # créé par uv init, puis uv add pandas sqlalchemy "psycopg[binary]"
└── uv.lock
~~~

`ingest.py` :

~~~python
import os

import pandas as pd
from sqlalchemy import create_engine

# La version figée du fichier, pour que le résultat soit vérifiable
URL = "https://raw.githubusercontent.com/datasets/airport-codes/47bcc2220351d78dfbf66a9f45e83baed82a7b35/data/airport-codes.csv"

# Les réglages de connexion viennent de l'environnement (le compose les fournit)
user = os.environ["PG_USER"]
password = os.environ["PG_PASS"]
host = os.environ.get("PG_HOST", "localhost")
db = os.environ.get("PG_DB", "airports")

# keep_default_na=False : sans lui, pandas lit le texte « NA » comme une valeur
# manquante. Or NA, c'est l'Amérique du Nord (continent) et la Namibie (pays).
# na_values=[""] : seules les cases vraiment vides deviennent des valeurs manquantes.
df = pd.read_csv(URL, keep_default_na=False, na_values=[""])

# L'altitude en mètres, à côté de celle en pieds
df["elevation_m"] = df["elevation_ft"] * 0.3048

# « 40.070985, -74.933689 » : la latitude vient en premier, puis la longitude
coords = df["coordinates"].str.split(",", expand=True)
df["latitude"] = coords[0].astype(float)
df["longitude"] = coords[1].astype(float)

engine = create_engine(f"postgresql+psycopg://{user}:{password}@{host}:5432/{db}")

# replace : relancer l'ingestion refait la table, donc toujours le même résultat
df.to_sql(name="airports", con=engine, if_exists="replace", index=False)
print(f"{len(df)} aéroports chargés dans la table airports")
~~~

`Dockerfile` :

~~~dockerfile
FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/

WORKDIR /code
ENV PATH="/code/.venv/bin:$PATH"

# Les dépendances d'abord, pour profiter du cache
COPY pyproject.toml .python-version uv.lock ./
RUN uv sync --locked

COPY ingest.py .
ENTRYPOINT ["python", "ingest.py"]
~~~

`.dockerignore` :

~~~text
.venv/
.env
~~~

`.env` :

~~~text
PG_USER=dez
PG_PASS=dez
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASS=dez
~~~

`docker-compose.yaml` :

~~~yaml
services:
  pgdatabase:
    image: postgres:18
    environment:
      POSTGRES_USER: ${PG_USER}
      POSTGRES_PASSWORD: ${PG_PASS}
      POSTGRES_DB: airports
    volumes:
      - airports_data:/var/lib/postgresql
    ports:
      - "5432:5432"
    healthcheck:                 # « prêt » = pg_isready répond OK
      test: ["CMD-SHELL", "pg_isready -U ${PG_USER} -d airports"]
      interval: 5s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASS}
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    ports:
      - "8085:80"

  ingest:
    build: .                     # le Dockerfile de ce dossier
    environment:                 # lues par ingest.py avec os.environ
      PG_USER: ${PG_USER}
      PG_PASS: ${PG_PASS}
      PG_HOST: pgdatabase        # le nom du service, sur le réseau du compose
      PG_DB: airports
    depends_on:
      pgdatabase:
        condition: service_healthy

volumes:
  airports_data:
  pgadmin_data:
~~~

Pour lancer et vérifier :

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-01/defi
docker compose up -d
docker compose logs ingest          # « 86293 aéroports chargés dans la table airports »
cd /workspaces/data-engineering-zoomcamp
bash site/checks/defi-01.sh         # cinq ✅ et ton code de réussite
~~~

Si Postgres de la leçon 9 tourne encore, il occupe le port 5432 : arrête-le d'abord avec `docker compose down` dans son dossier.

@@ hints
- Si une vérification sur les continents échoue alors que tout semble correct, compte les valeurs `NULL` de la colonne `continent`. Puis cherche comment pandas lit certaines chaînes de caractères par défaut.
- Tu as déjà vu ce piège à la leçon 5, avec la zone 265.

@@ team
Comme en entreprise : fais le défi sur une branche, ouvre une pull request dans ton fork, et colle la sortie du script de vérification dans la description. Envoie-moi le lien : je relis ton code avant que tu fusionnes. Une fois la PR fusionnée, marque ce moment par un **tag annoté** `module-01` sur `main`, et pousse-le : c'est ainsi que les équipes numérotent les versions d'un projet (cherche `git tag -a`). Il apparaîtra dans l'onglet Tags de ton fork.

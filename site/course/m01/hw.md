@@ intro
Le homework officiel de la cohorte 2026, question par question. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Ton code et tes requêtes vont dans `mon-travail/module-01/homework/`, avec un `README.md` qui reprend tes réponses et tes requêtes SQL, comme le demande l'énoncé.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-01/homework/` poussé sur ton fork, avec ton `README.md`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec celles d'autres étudiants sur le Slack de DataTalksClub (canal `#course-data-engineering`), ou cherche « de zoomcamp 2026 homework 1 » sur GitHub, où beaucoup publient leur rendu. Si tu as Claude, il peut relire ton raisonnement question par question.

@@ guide
Ici, rien que la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le dossier du homework

~~~bash
mkdir -p /workspaces/data-engineering-zoomcamp/mon-travail/module-01/homework
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-01/homework
~~~

Ajoute `*.parquet` et `*.csv` au `.gitignore` de ce dossier : les données ne se commitent pas.

### 2. Démarre ta base

Dans ton dossier `compose` de la leçon 9 : `docker compose up -d pgdatabase pgadmin`. Le `-d` les lance en arrière-plan, et nommer les services évite de relancer l'ingestion.

### 3. Télécharge les données

`wget` télécharge un fichier depuis une adresse web. Les deux adresses sont dans la partie « Prepare the Data » de l'énoncé : les trajets verts de novembre 2025 (en **Parquet**) et la table des zones (en CSV). Lance `wget` suivi de chaque adresse, puis `ls -lh` pour voir les fichiers et leur taille.

### 4. Charge-les dans Postgres

Ton script de la leçon 6 lit des CSV par morceaux. Ici, le fichier est un Parquet assez petit pour être lu d'un coup : un petit script suffit. Crée `load_homework.py` :

~~~python
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine("postgresql+psycopg://root:root@localhost:5432/ny_taxi")

# Le Parquet garde les types : les dates sont déjà des dates
trips = pd.read_parquet("green_tripdata_2025-11.parquet")
trips.to_sql(name="green_trips_2025_11", con=engine, if_exists="replace", index=False)
print(len(trips), "trajets chargés")

zones = pd.read_csv("taxi_zone_lookup.csv")
zones.to_sql(name="zones", con=engine, if_exists="replace", index=False)
print(len(zones), "zones chargées")
~~~

Lance-le avec l'environnement de ton projet `pipeline`, qui a déjà pandas, pyarrow et sqlalchemy :

~~~bash
uv run --project ../pipeline python load_homework.py
~~~

Adapte `root:root` si ton `.env` de la leçon 9 utilise d'autres identifiants.

### 5. Réponds question par question

Ouvre pgAdmin (Query Tool) ou pgcli, et lance tes requêtes sur `green_trips_2025_11` et `zones`. Dans ton `README.md`, note pour chaque question ta réponse **et** la requête ou la commande qui t'y a mené. Les leçons 6 et 10 contiennent toutes les formes de SQL dont tu as besoin : `WHERE`, `GROUP BY`, `JOIN`, `ORDER BY`, `LIMIT`.

### 6. Pousse ton rendu

`git add`, `git commit`, `git push` du dossier `homework` (sans les données, grâce au `.gitignore`).

@@ q1
- L'option `--entrypoint` de `docker run` remplace le programme lancé au démarrage du conteneur. Tu l'as utilisée à la leçon 1.
- Une fois dans le `bash` du conteneur, la plupart des outils affichent leur version avec `--version`.
- L'image `python:3.13` a pu être mise à jour depuis la cohorte : si ta version n'est dans aucun choix, garde la tienne, comme le dit la note de l'énoncé.

@@ q2
- pgAdmin et Postgres sont dans le même réseau, créé par Compose : pgAdmin passe par ce réseau, pas par ton Codespace.
- Sur ce réseau, un conteneur est joignable par le **nom du service** et aussi par son `container_name`. Regarde les deux dans le fichier.
- Pour le port : relis le « Casser et réparer » de la leçon 4. Quel côté de `5433:5432` est vu depuis le réseau Docker ?

@@ data
- Les données de novembre 2025 sont en **Parquet**, pas en CSV : ton script d'ingestion ne les lit pas tel quel. `pd.read_parquet` lit un fichier Parquet entier.
- Le fichier est assez petit pour être lu d'un coup. Si tu veux quand même lire par morceaux, regarde `pyarrow.parquet.ParquetFile` et sa méthode `iter_batches`.
- N'oublie pas la table des zones : tu l'as déjà chargée à la leçon 5.

@@ q3
- Chez les taxis verts, la date de départ s'appelle `lpep_pickup_datetime`.
- « Exclusive of the upper bound » : la borne du haut est **exclue**. Quel opérateur de comparaison utiliser pour `'2025-12-01'` ?
- « Less than or equal to 1 mile » : regarde bien si 1 lui-même est compris.

@@ q4
- Il faut une ligne par jour : `GROUP BY` sur la **date** de départ, pas sur la date et l'heure.
- Pour chaque jour, c'est la plus **grande** distance qui compte : quelle fonction d'agrégation ?
- Le filtre sur les 100 miles se fait **avant** le regroupement.

@@ q5
- Il faut le **nom** de la zone, donc un `JOIN` avec la table des zones sur la zone de départ.
- Un seul jour : filtre sur la date de départ convertie en date.
- « Sum of all trips » : additionne `total_amount` par zone, puis trie.

@@ q6
- Il te faut **deux** fois la table des zones : une pour la zone de départ, une pour la zone d'arrivée. La leçon 10 le fait avec deux alias.
- Le filtre porte sur le **nom** de la zone de départ, et sur le mois de novembre 2025.
- « Largest tip » : c'est le plus gros pourboire d'un seul trajet, pas la somme des pourboires. Lis bien la note de l'énoncé.

@@ q7
- `terraform --help` liste toutes les commandes : certaines commandes proposées dans les réponses n'existent pas.
- Regarde l'aide de `terraform apply` : quelle option évite la question de confirmation ?
- Relis le résumé de la leçon 12 : quelle commande supprime tout ce que Terraform gère ?

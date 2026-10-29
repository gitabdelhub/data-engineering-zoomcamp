@@ intro
Le homework officiel de la cohorte 2026, question par question, sur les taxis **jaunes** du premier semestre 2024 : d'autres données que celles des leçons. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Ton travail va dans `mon-travail/module-03/homework/`, avec un `README.md` qui reprend tes réponses et tes requêtes SQL, comme le demande l'énoncé.

@@ guide
Ici, seulement la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le dossier du homework

~~~bash
mkdir -p /workspaces/data-engineering-zoomcamp/mon-travail/module-03/homework
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-03/homework
printf '*.parquet\n*.json\n' > .gitignore
~~~

Le `.gitignore` est là **avant** tout le reste : les données ne se commitent pas, et une clé `.json` encore moins.

### 2. Le script officiel, adapté à ta clé

Copie le script du cours dans ton dossier :

~~~bash
cp ../../../cohorts/2026/03-data-warehouse/load_yellow_taxi_data.py .
~~~

Ouvre-le. Trois changements, tout en haut :

- `BUCKET_NAME` : le nom de **ton** bucket, `<ton-project-id>-dez-lake` ;
- les deux lignes `CREDENTIALS_FILE = "gcs.json"` et `client = storage.Client.from_service_account_json(...)` : remplace-les par une seule, `client = storage.Client()`. Comme à la leçon 1, la bibliothèque trouve ta clé grâce à `GOOGLE_APPLICATION_CREDENTIALS`. Ne copie **jamais** ta clé dans ce dossier ;
- rien d'autre : le script télécharge les 6 fichiers Parquet de janvier à juin 2024 et les envoie à la racine de ton bucket.

### 3. Lance-le

~~~bash
export GOOGLE_APPLICATION_CREDENTIALS=~/.gcp/key.json
uv run --with google-cloud-storage python load_yellow_taxi_data.py
~~~

Il travaille sur 4 fichiers à la fois : les messages arrivent dans le désordre, c'est normal. À la fin, ton bucket contient six fichiers `yellow_tripdata_2024-0X.parquet`, environ 50 Mo chacun. Vérifie qu'ils y sont **tous les six** avant de continuer, comme le demande l'énoncé.

### 4. Les deux tables de départ

Dans la console BigQuery, dans ton `dez_dataset` :

- une table **externe** sur les six fichiers. Pour du Parquet, pas besoin d'écrire les colonnes : le fichier contient déjà ses types. `format = 'PARQUET'` et un motif avec `*` dans `uris` suffisent ;
- une table **normale**, copie de la table externe, sans partition ni clustering.

Garde les deux requêtes dans `sql/00_tables.sql` du dossier du homework.

### 5. Désactive le cache

Comme à la leçon 2 : **Plus → Paramètres de requête**, cache décoché. Plusieurs questions portent sur des estimations : elles doivent être honnêtes.

@@ q1
- Un simple `COUNT(*)` sur une de tes deux tables.
- Sur la table normale, l'onglet **Détails** donne aussi le nombre de lignes, sans requête.
- Si tes deux tables ne donnent pas le même nombre, un fichier manque dans le bucket ou dans le motif de `uris`.

@@ q2
- La question demande l'estimation **avant** de lancer : elle s'affiche en haut à droite de l'éditeur. Ne lance rien.
- Écris la même requête deux fois, une par table, et lis l'estimation de chacune.
- Pour la table normale, tu sais la calculer toi-même (leçon 4). Pour la table externe, regarde l'onglet Détails de cette table : que sait BigQuery de sa taille ?

@@ q3
- Fais l'expérience : une requête avec une colonne, puis la même avec deux, sur la table normale. Compare les estimations.
- C'est la leçon 4 : comment BigQuery range-t-il les données ?
- Relis les quatre explications proposées : une seule correspond à ce que tu as vu à la leçon 4 en calculant une estimation colonne par colonne.

@@ q4
- `WHERE fare_amount = 0`.
- Sur la table normale : la table externe relit les fichiers à chaque fois.
- Note la requête complète dans ton `README.md`.

@@ q5
- C'est la leçon 2. Une table n'a qu'**une** colonne de partitionnement : élimine d'abord les choix impossibles.
- Le partitionnement sert les **filtres** sur une date. Le clustering sert le tri et les regroupements sur d'autres colonnes.
- L'énoncé demande aussi de **créer** cette table : tu en as besoin à la question suivante. Les syntaxes `PARTITION BY` et `CLUSTER BY` sont dans ton fichier `sql/02_partitions.sql`.

@@ q6
- Même requête, deux tables : seul le nom après `FROM` change. Ne lance pas, lis les estimations.
- Les deux bornes sont comprises : `DATE(tpep_dropoff_datetime) BETWEEN '2024-03-01' AND '2024-03-15'`.
- Leçon 2 : sur la table partitionnée, BigQuery ne lit que les partitions de ces 15 jours. Laquelle des deux tables devrait donc lire le moins ?

@@ q7
- C'est la leçon 1, et l'onglet Détails de ta table externe.
- Une table externe contient-elle des données ?
- Où as-tu envoyé les fichiers avec le script ?

@@ q8
- C'est la leçon 2 : la partie « Partitioning and clustering are not free ».
- Le mot « toujours » est la clé de la question.
- Pense à une petite table : qu'apporte le clustering, et que coûte-t-il ?

@@ q9
- Écris la requête et lis l'estimation, sans la lancer.
- Le résultat de cette requête, BigQuery le connaît-il déjà sans lire une seule colonne ? Regarde l'onglet Détails de la table.
- Compare avec un `SELECT COUNT(*)` sur la table externe, et explique la différence.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-03/homework/` poussé sur ton fork, avec ton `README.md`. Avant de pousser, `git status` ne doit montrer aucun `.parquet` ni `.json`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec celles d'autres étudiants sur le Slack de DataTalksClub (canal `#course-data-engineering`), ou cherche « de zoomcamp 2026 homework 3 » sur GitHub, où beaucoup publient leur rendu.

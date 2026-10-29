@@ intro
Le homework officiel de la cohorte 2026 : six questions, sur les taxis jaunes de **novembre 2025**, un mois que tu n'as pas encore utilisé. Ici, jamais de réponse : seulement des indices. Pour chaque question, tu choisis ta réponse **et** tu écris le code qui l'a donnée.

Ton travail va dans `mon-travail/module-06/homework/` : un script `homework.py` et un `README.md` avec tes réponses et ce que le script a affiché.

@@ guide
Ici, seulement la préparation : les réponses, c'est toi qui les trouves.

### 1. Les données

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-06
mkdir -p data/homework
wget -P data/homework https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_2025-11.parquet
wget -P data/homework https://d37ci6vzurychx.cloudfront.net/misc/taxi_zone_lookup.csv
~~~

Le fichier est déjà en parquet : pas de schéma à écrire, Spark lit les types dedans. Regarde-les avec `printSchema()` avant de commencer.

### 2. Un script, pas un terminal

Écris toutes tes réponses dans `homework.py`, une section par question, avec un `print` clair. Tu pourras le relancer et le montrer.

### 3. Le homework n'est pas le défi

Ces données ne sont pas celles du cours, et je ne les ai pas téléchargées : mon environnement n'avait pas accès au site de la ville de New York. Si un nombre ne correspond à aucune proposition, relis ton filtre avant de douter des données.

@@ q1
- Ta leçon 2 affiche déjà la réponse.
- La question demande la version de **ta** session, pas celle de la vidéo.

@@ q2
- Leçon 3 : `repartition`, puis `write.parquet`.
- Ne compte que les fichiers qui finissent par `.parquet` : `ls -l dossier/*.parquet`, ou `du -h`.
- La moyenne, c'est la taille totale divisée par le nombre de fichiers.

@@ q3
- Leçon 4, et son breakfix : une date ou un instant ?
- « Started on the 15th » : c'est la colonne de prise en charge qui compte.

@@ q4
- La durée d'un trajet, c'est la fin moins le début. `F.unix_timestamp` transforme un timestamp en secondes.
- Puis un `max`, et une conversion des secondes en heures.
- Si la plus longue durée est absurde (des jours), regarde si tu as bien soustrait dans le bon sens et avec les bonnes colonnes.

@@ q5
- Ta leçon 2 te l'a fait ouvrir dans l'onglet Ports.
- Attention, une autre proposition est le port de l'interface du **master**, à la leçon 10 : ce n'est pas la même interface.

@@ q6
- Leçon 8 : une jointure avec la table des zones, sur l'identifiant de la zone de **départ**.
- `groupBy(...).count()`, puis un tri **croissant**.
- Plusieurs zones peuvent avoir le même nombre minimal : regarde les premières lignes, pas seulement la première.
- Le homework demande une vue temporaire (`createOrReplaceTempView`) : la leçon 6 te montre comment, et la question peut se faire en SQL.

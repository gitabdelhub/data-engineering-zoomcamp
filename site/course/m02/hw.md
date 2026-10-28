## La consigne

Jusqu'ici, tu as chargé des mois de 2019. Étends ton pipeline à **2021** : charge les mois de janvier à **juillet 2021** (les fichiers s'arrêtent là), pour les taxis **jaunes et verts**, avec ton DAG planifié `taxi_postgres_scheduled` et un backfill par type de taxi.

Les fichiers sont ici, avec le type de taxi dans l'adresse :

```text
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/yellow/
```

## Question 1. La taille d'un fichier décompressé

Pour le run des taxis **jaunes** de **décembre 2020** : quelle est la taille du fichier décompressé `yellow_tripdata_2020-12.csv`, celui que produit ta tâche `extract` ?

- 128.3 MiB
- 134.5 MiB
- 364.7 MiB
- 692.6 MiB

## Question 2. Un nom de fichier rendu

Dans ton DAG `taxi_postgres` (leçon 7), quelle est la valeur **rendue** de ta constante du nom de fichier quand les paramètres valent `taxi` = `green`, `year` = `2020` et `month` = `04` ?

- `{{ params.taxi }}_tripdata_{{ params.year }}-{{ params.month }}.csv`
- `green_tripdata_2020-04.csv`
- `green_tripdata_04_2020.csv`
- `green_tripdata_2020.csv`

## Question 3. Les taxis jaunes de 2020

Combien de lignes en tout dans les fichiers CSV des taxis **jaunes** de l'année **2020** (les 12 mois) ?

- 13,537.299
- 24,648,499
- 18,324,219
- 29,430,127

## Question 4. Les taxis verts de 2020

Combien de lignes en tout dans les fichiers CSV des taxis **verts** de l'année **2020** (les 12 mois) ?

- 5,327,301
- 936,199
- 1,734,051
- 1,342,034

## Question 5. Un seul mois

Combien de lignes dans le fichier CSV des taxis **jaunes** de **mars 2021** ?

- 1,428,092
- 706,911
- 1,925,152
- 2,561,031

## Question 6. Le fuseau horaire

Comment planifier ton DAG à 9 h **heure de New York** dans Airflow ?

- `CronTriggerTimetable("0 9 1 * *", timezone="EST")`
- `CronTriggerTimetable("0 9 1 * *", timezone="America/New_York")`
- `CronTriggerTimetable("0 9 1 * *", timezone="UTC-5")`
- `CronTriggerTimetable("0 9 1 * *", location="New_York")`

## Apprendre en public

Le Zoomcamp encourage à partager ce que tu apprends : c'est l'« apprentissage en public ». Un modèle de post pour LinkedIn, adapté à ton parcours :

```text
🚀 Module 2 du Data Engineering Zoomcamp de @DataTalksClub terminé !

Orchestration avec Apache Airflow 3. J'ai appris à :

✅ Installer Airflow avec Docker Compose et écrire mes DAGs en Python
✅ Charger les taxis de New York dans Postgres, sans doublons (staging + MERGE)
✅ Paramétrer mes pipelines avec Jinja et les planifier, fuseau horaire compris
✅ Rattraper deux ans d'historique en une commande de backfill
✅ Envoyer le même pipeline vers Google Cloud Storage et BigQuery

Mon code : <LIEN>

Le cours est gratuit : https://github.com/DataTalksClub/data-engineering-zoomcamp/
```

@@ intro
Le homework officiel du module 2 de la cohorte 2026 a été écrit pour Kestra. Les questions portent sur les données et sur l'orchestration, pas sur l'outil : elles sont reprises ici telles quelles (mêmes choix de réponse), avec les mots d'Airflow là où l'énoncé parlait de Kestra. Si ta valeur ne tombe sur aucun choix exactement, prends **le plus proche**, comme le demande l'énoncé officiel.

Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Ton travail va dans `mon-travail/module-02/homework/`, avec un `README.md` qui reprend tes réponses, tes commandes et tes requêtes.

@@ guide
Ici, seulement la préparation : les réponses, c'est toi qui les trouves, avec les indices de chaque question.

### 1. Le dossier du homework

~~~bash
mkdir -p /workspaces/data-engineering-zoomcamp/mon-travail/module-02/homework
~~~

Ton `README.md` ira là. Tes DAGs restent dans `mon-travail/module-02/airflow/dags/`.

### 2. Démarre ton Airflow

Depuis `mon-travail/module-02/airflow/` : `docker compose up -d`, puis `docker compose ps` jusqu'à ce que tout soit `healthy`.

### 3. La consigne : le backfill de 2021

Ton DAG `taxi_postgres_scheduled` (leçon 8) sait déjà charger n'importe quel mois. Lance un backfill de janvier à juillet 2021 pour `green`, attends qu'il soit fini, puis le même pour `yellow`. N'oublie pas `--max-active-runs 1`, et que le DAG doit être sorti de pause. Chaque mois jaune de 2021 prend une minute environ.

### 4. Compter sans tout charger

Pour les questions 3 et 4, il faut compter les lignes de 12 fichiers. Tu as deux chemins, à toi de choisir :

- avec Airflow : un backfill de l'année 2020, puis les logs ou une requête ;
- sans Airflow : télécharger les fichiers et compter leurs lignes dans le terminal.

Le premier est plus long (les jaunes de 2020 font plus de 20 millions de trajets, plusieurs Go dans Postgres), le second plus rapide. Les deux sont de vraies méthodes de data engineer : note dans ton `README.md` laquelle tu as prise.

### 5. Note tout

Pour chaque question : ta réponse, puis la commande, la requête ou le raisonnement qui t'y a mené.

@@ q1
- La tâche `extract` de ton DAG se termine par un `ls -lh` du fichier : la taille est dans son log.
- `ls -lh` arrondit au-dessus. Pour la valeur exacte, `ls -l` donne la taille en octets. Un MiB vaut 1 024 × 1 024 octets.
- Le fichier est supprimé par `cleanup` à la fin du run. Lis le log de `extract`, ou retélécharge et décompresse le fichier toi-même dans le terminal.

@@ q2
- C'est la question de la leçon 6 : qu'est-ce qu'Airflow écrit à la place de chaque `{{ ... }}` ?
- Les mois sont écrits sur deux chiffres, et la constante met l'année **avant** le mois.
- Vérifie au lieu de deviner : lance `fichier_du_mois` (leçon 6) ou `taxi_postgres` avec ces valeurs, et ouvre l'onglet Rendered Templates.

@@ q3
- Le log de `load_staging` affiche le nombre de lignes de chaque mois. Additionne les 12.
- Sans Airflow : `zcat fichier.csv.gz | wc -l` compte les lignes d'un fichier compressé. Attention, la première ligne est celle des titres.
- Une boucle Bash fait les 12 mois d'un coup : `for m in 01 02 03 04 05 06 07 08 09 10 11 12; do ... ; done`. Et si tu as tout chargé : `SELECT count(*) FROM yellow_tripdata WHERE filename LIKE 'yellow_tripdata_2020-%'`.

@@ q4
- Même méthode qu'à la question 3, sur les taxis verts.
- Les fichiers verts sont beaucoup plus petits que les jaunes : un backfill de 2020 est raisonnable ici.
- `SELECT filename, count(*) FROM green_tripdata WHERE filename LIKE 'green_tripdata_2020-%' GROUP BY 1 ORDER BY 1` montre les 12 mois : vérifie qu'il n'en manque aucun avant d'additionner.

@@ q5
- Un seul fichier : ton backfill de 2021 l'a chargé.
- Le log de `load_staging` du run de mars 2021, ou une requête avec un `WHERE filename = '...'`.
- Attention au nom du fichier : `yellow_tripdata_2021-03.csv`.

@@ q6
- C'est la leçon 8.
- Une abréviation comme `EST` ou un décalage comme `UTC-5` est fixe toute l'année. New York change-t-il d'heure ?
- `CronTriggerTimetable` n'a pas de paramètre `location`.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-02/homework/` poussé sur ton fork, avec ton `README.md`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec celles d'autres étudiants sur le Slack de DataTalksClub (canal `#course-data-engineering`), ou cherche « de zoomcamp 2026 homework 2 » sur GitHub, où beaucoup publient leur rendu. Les questions 3 à 5 ne dépendent pas de l'outil : les rendus faits avec Kestra doivent trouver les mêmes nombres que toi.

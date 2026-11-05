@@ intro
Le homework officiel de la cohorte 2026 : six questions, sur les taxis **verts d'octobre 2025**, avec Redpanda, un producteur, un consommateur et trois jobs Flink. Ici, jamais de réponse : seulement des indices. Pour chaque question, tu choisis ta réponse **et** tu gardes le code qui l'a donnée.

Ton travail va dans ton projet `mon-travail/module-07/` : `src/producers/green_producer.py`, `src/consumers/green_consumer.py`, et un job par question Flink dans `src/job/`. Tes réponses et ce que tes scripts ont affiché vont dans `homework/README.md`.

@@ guide
Ici, seulement la préparation : les réponses, c'est toi qui les trouves.

### 1. Les bons chemins

Le homework écrit `cd 07-streaming/workshop/` et `workshop-redpanda-1`. Ce dossier n'existe plus, et tes conteneurs s'appellent d'après ton dossier : `module-07-redpanda-1`. Le plus simple : `docker compose exec redpanda ...` depuis `mon-travail/module-07`, et `docker compose exec jobmanager ./bin/flink run -py /opt/src/job/ton_job.py --pyFiles /opt/src -d` pour les jobs.

### 2. Un départ propre

Le homework demande un nouveau topic, `green-trips`. Si tu envoies les données deux fois, supprime et recrée le topic : les doublons faussent toutes les questions suivantes.

### 3. Pas de chiffres de ma part

Mon environnement de test n'avait pas accès au site de la ville de New York : je n'ai pas ces données, et ces réponses ne sont vérifiées nulle part ici. Tes leçons 3 à 9 te donnent toutes les méthodes.

@@ q1
- Leçon 2 : `rpk` a une commande qui affiche sa version.
- La réponse est la version de **ton** Redpanda, celle de l'image de ton `docker-compose.yml`.

@@ q2
- Leçon 3 : même producteur, autres colonnes. Les dates arrivent de pandas en `Timestamp` : JSON ne sait pas les écrire, convertis-les en texte (`strftime("%Y-%m-%d %H:%M:%S")`) avant d'envoyer.
- Mesure le temps du premier `send` jusqu'au `flush()` compris, comme le demande l'énoncé.
- Sans `time.sleep`, le producteur regroupe les messages : la durée dépend surtout du nombre de lignes et de la conversion.
- Les valeurs manquantes de pandas (`NaN`) ne sont pas du JSON valide pour tous les lecteurs : regarde ce que deviennent les lignes sans `passenger_count`.

@@ q3
- Leçon 4 : un **nouveau** `group_id`, `earliest`, et une condition sur `trip_distance`.
- Ton consommateur doit s'arrêter quand il n'y a plus rien à lire : l'option `consumer_timeout_ms` de `KafkaConsumer` arrête la boucle après un temps sans message.
- Si ton total change d'un lancement à l'autre, ton topic contient des doublons, ou ton groupe reprend où il s'était arrêté.

@@ q4
- Leçon 8 : une vraie fenêtre, groupée par `window_start, window_end`, avec un parallélisme de 1.
- Les dates sont du texte : l'énoncé donne la colonne calculée `TO_TIMESTAMP(lpep_pickup_datetime, 'yyyy-MM-dd HH:mm:ss')`.
- Crée la table Postgres avant de lancer le job, et laisse-le tourner une minute avant de lire.

@@ q5
- Leçon 9 : `SESSION(TABLE ... PARTITION BY PULocationID, DESCRIPTOR(...), INTERVAL '5' MINUTE)`.
- La question porte sur le **nombre de trajets** de la plus longue session, pas sur sa durée.
- La dernière session de chaque zone attend le watermark : elle peut manquer, comme la dernière fenêtre de la leçon 8.

@@ q6
- Leçon 8 : une fenêtre d'une heure, **sans** grouper par zone : une seule ligne par heure.
- `SUM(tip_amount)`, puis un tri décroissant dans Postgres.
- Le défi du module te fait faire presque la même chose sur d'autres données : essaie-le après, pas avant.

@@ pas-q1
>>> cd 07-streaming/workshop/
**Ne lance pas ce bloc :** le dossier `07-streaming/workshop/` n'existe plus. Ton infrastructure est celle de tes leçons, dans `mon-travail/module-07` :

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-07
docker compose build
docker compose up -d
docker compose ps
~~~

**Ce que tu dois voir :** les quatre services en `Up` (`redpanda`, `postgres`, `jobmanager`, `taskmanager`).

>>> docker compose down -v
**Depuis `mon-travail/module-07`.** `down -v` efface aussi les données de Postgres et de Redpanda : tes tables et tes topics des leçons disparaissent. C'est ce qu'on veut ici, pour un départ propre. Après le `up -d`, recrée les tables dont tu as besoin dans `psql`.

>>> docker exec -it workshop-redpanda-1 rpk version
**Ta version** (le nom `workshop-redpanda-1` n'existe pas chez toi), depuis `mon-travail/module-07` :

~~~bash
docker compose exec redpanda rpk version
~~~

`docker compose exec redpanda` trouve le conteneur par son nom de **service**, quel que soit le dossier.

@@ pas-q2
>>> docker exec -it workshop-redpanda-1 rpk topic create green-trips
**Ta version**, depuis `mon-travail/module-07` : `docker compose exec redpanda rpk topic create green-trips`.

**Ce que tu dois voir :** un petit tableau `TOPIC  STATUS` avec `green-trips  OK`. Si tu as `TOPIC_ALREADY_EXISTS`, le topic est déjà là : vérifie qu'il est vide avec `docker compose exec redpanda rpk topic describe green-trips` (le `HIGH-WATERMARK` doit être `0`), sinon supprime-le (`rpk topic delete green-trips`) et recrée-le.

>>> t0 = time()
**C'est un squelette, pas un script complet :** `# send all rows ...` est à remplacer par ta boucle d'envoi, et `producer` doit exister avant. Où : un nouveau fichier `src/producers/green_producer.py` (`code src/producers/green_producer.py` depuis `mon-travail/module-07`), sur le modèle de ton `producer.py` de la leçon 3. Lance-le avec `uv run python src/producers/green_producer.py`.

@@ pas-q4
>>> event_timestamp AS TO_TIMESTAMP(lpep_pickup_datetime, 'yyyy-MM-dd HH:mm:ss'),
**Ce n'est pas un bloc complet :** ce sont trois lignes à mettre **dans** le `CREATE TABLE` de la source Kafka de ton job, à la place de `tpep_pickup_datetime BIGINT` et de la colonne calculée de la leçon 8. Les autres colonnes (`PULocationID`, etc.) restent autour, séparées par des virgules.

**Où :** un nouveau fichier par question dans `src/job/` (par exemple `src/job/q4_tumbling.py`), lancé avec `docker compose exec jobmanager ./bin/flink run -py /opt/src/job/q4_tumbling.py --pyFiles /opt/src -d`.

>>> FROM <your_table>
**Où taper :** dans `psql` (`docker compose exec postgres psql -U postgres -d postgres`). Remplace `<your_table>` par le nom de ta table, sans les `< >`.

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

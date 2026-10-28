@@ intro
Le homework officiel de la cohorte 2026, question par question. Ici, jamais de réponse : seulement des indices, de plus en plus précis. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée. Sans ce « comment », la question ne compte pas comme faite.

Ton code et tes requêtes vont dans `mon-travail/module-01/homework/`, avec un `README.md` qui reprend tes réponses et tes requêtes SQL, comme le demande l'énoncé.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-01/homework/` poussé sur ton fork. Envoie-moi le lien dans ton projet Claude : je vérifie ton raisonnement question par question, sans te donner les réponses, et je te dis où creuser.

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

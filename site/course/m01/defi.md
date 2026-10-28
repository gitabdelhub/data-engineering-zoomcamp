# Défi du module 1 : les aéroports du monde

Pas de vidéo, pas de leçon, presque pas d'indices. Tu as les mêmes outils que dans le module, sur des données que tu n'as jamais vues. C'est le moment de vérifier ce que tu sais faire **seul**.

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

@@ hints
- Si une vérification sur les continents échoue alors que tout semble correct, compte les valeurs `NULL` de la colonne `continent`. Puis cherche comment pandas lit certaines chaînes de caractères par défaut.
- Tu as déjà vu ce piège à la leçon 5, avec la zone 265.

@@ team
Comme en entreprise : fais le défi sur une branche, ouvre une pull request dans ton fork, et colle la sortie du script de vérification dans la description. Envoie-moi le lien : je relis ton code avant que tu fusionnes. Une fois la PR fusionnée, marque ce moment par un **tag annoté** `module-01` sur `main`, et pousse-le : c'est ainsi que les équipes numérotent les versions d'un projet (cherche `git tag -a`). Il apparaîtra dans l'onglet Tags de ton fork.

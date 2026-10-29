# Défi du module 3 : le tableau de bord des bases VTC

Pas de vidéo, pas de leçon. Tu as ton bucket, ton dataset et tout ce que le module t'a appris, sur des données que tu n'as jamais vues. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## Les données

Les trajets des **VTC et voitures avec chauffeur** de New York (*For-Hire Vehicles*, FHV), de juillet à décembre 2019 : près de 11 millions de trajets. Un fichier par mois, figé sur GitHub :

```text
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/fhv/fhv_tripdata_2019-07.csv.gz
...
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/fhv/fhv_tripdata_2019-12.csv.gz
```

Chaque trajet est rattaché à une **base** : la société qui l'a envoyé, identifiée par un numéro comme `B00256` (colonne `dispatching_base_num`).

## La commande

Une équipe d'analystes prépare un tableau de bord : le nombre de trajets **par base et par jour**, sur ce semestre. Toutes ses requêtes filtreront sur une **période** et sur **une base**. Elle te demande la table, dans ton dataset `dez_dataset` :

| Colonne | Type |
| --- | --- |
| `dispatching_base_num` | `STRING` |
| `pickup_datetime` | `TIMESTAMP` |
| `dropoff_datetime` | `TIMESTAMP` |
| `PUlocationID` | `INT64` |
| `DOlocationID` | `INT64` |

La table s'appelle `fhv_2019_s2`.

## Les règles

- Les six fichiers sont dans ton bucket, sous `fhv/`, et une table externe les lit.
- La table est conçue pour les requêtes de l'équipe : le bon **partitionnement**, le bon **clustering**.
- Une requête qui oublie de filtrer sur la date est **refusée** : l'équipe ne doit pas pouvoir lire tout le semestre par erreur.
- Seuls les trajets **pris en charge** entre le 1er juillet et le 31 décembre 2019 sont gardés.
- Une base est toujours écrite **de la même façon**. Regarde bien les données : ce n'est pas le cas dans les fichiers.
- Aucun trajet n'est perdu, même sans zone de départ.

## La vérification

Quand tu penses avoir fini, lance depuis la racine de ton fork :

```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/.gcp/key.json
uv run --with google-cloud-bigquery python site/checks/defi-03.py
```

Le script interroge ta table avec huit requêtes et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi. Ses requêtes lisent moins de 500 Mo en tout, bien loin du To gratuit par mois.

@@ guide
### 1. Envoie les fichiers

Ton `charger_gcs.py` de la leçon 1 sait déjà tout faire. Copie-le en `charger_fhv.py`, puis change le type de taxi, l'année, et la boucle des mois : seulement de 7 à 12. Les fichiers doivent finir dans `gs://<ton bucket>/fhv/`.

### 2. Regarde les données avant d'écrire du SQL

Télécharge un mois dans un dossier de travail, et regarde :

~~~bash
curl -sSLO https://github.com/DataTalksClub/nyc-tlc-data/releases/download/fhv/fhv_tripdata_2019-07.csv.gz
zcat fhv_tripdata_2019-07.csv.gz | head -5
~~~

Note les 7 colonnes, dans l'ordre. Puis compte les façons d'écrire les bases. `cut -d, -f1` garde la première colonne, `sort | uniq -c` compte chaque valeur :

~~~bash
zcat fhv_tripdata_2019-07.csv.gz | cut -d, -f1 | sort | uniq -c | sort -rn | head -20
~~~

Ça a l'air propre. Maintenant, la liste des valeurs **distinctes**, avec `cat -A`, qui affiche un `$` à la fin de chaque ligne : ce qui est entre le numéro et le `$` fait partie de la valeur.

~~~bash
zcat fhv_tripdata_2019-07.csv.gz | cut -d, -f1 | sort -u | cat -A | grep -v '^B[0-9]*\$$'
~~~

Le `grep -v` cache les valeurs bien formées (un `B` majuscule, des chiffres, puis la fin). Ce qui reste, ce sont les problèmes : que vois-tu ? Ne commite pas ce fichier.

### 3. La table externe

Comme à la leçon 1 : les 7 colonnes du CSV avec leurs types, `format`, `uris` avec une étoile, `compression` et `skip_leading_rows`. Teste-la avec un `COUNT(*)`.

### 4. La table finale

Un `CREATE TABLE ... AS SELECT` à partir de la table externe, avec :

- `PARTITION BY`, `CLUSTER BY` et `OPTIONS (require_partition_filter = TRUE)`, dans cet ordre, avant le `AS` ;
- dans le `SELECT`, la base nettoyée : BigQuery a `UPPER()` pour les majuscules et `TRIM()` pour les espaces au début et à la fin. Donne à chaque colonne son nom final avec `AS` ;
- dans le `WHERE`, la période. Les fichiers contiennent quelques trajets d'avant juillet.

### 5. Vérifie toi-même, puis lance le script

Avant le script, pose tes propres questions : combien de bases distinctes avant et après nettoyage ? Combien de partitions dans `INFORMATION_SCHEMA.PARTITIONS` ? Une requête sans `WHERE` sur la date est-elle bien refusée ?

@@ hints
- Le type de taxi est `fhv` et les mois vont de 7 à 12 : `range(7, 13)`.
- Les bases en double se terminent par des espaces : `B01467` et `B01467` suivi de 9 espaces sont deux valeurs différentes pour BigQuery. D'autres sont écrites en minuscules.
- `CREATE OR REPLACE TABLE ... PARTITION BY DATE(pickup_datetime) CLUSTER BY dispatching_base_num OPTIONS (require_partition_filter = TRUE) AS SELECT ...`
- Les noms de colonnes du CSV ne sont pas tous ceux de la commande : `dropOff_datetime` devient `dropoff_datetime`.

@@ solution
Les changements dans `charger_fhv.py`, copie de `charger_gcs.py` :

~~~python
TAXI = "fhv"
YEARS = ["2019"]
# ...
    for month in range(7, 13):   # de juillet à décembre seulement
~~~

`mon-travail/module-03/sql/defi.sql` (remplace `<ton-bucket>`) :

~~~sql
-- La table externe : les 7 colonnes du CSV, dans l'ordre
CREATE OR REPLACE EXTERNAL TABLE dez_dataset.fhv_2019_s2_ext (
  dispatching_base_num STRING,
  pickup_datetime TIMESTAMP,
  dropOff_datetime TIMESTAMP,
  PUlocationID INT64,
  DOlocationID INT64,
  SR_Flag INT64,
  Affiliated_base_number STRING
)
OPTIONS (
  format = 'CSV',
  uris = ['gs://<ton-bucket>/fhv/fhv_tripdata_2019-*.csv.gz'],
  compression = 'GZIP',
  skip_leading_rows = 1
);

-- La table du tableau de bord
CREATE OR REPLACE TABLE dez_dataset.fhv_2019_s2
PARTITION BY DATE(pickup_datetime)          -- l'équipe filtre toujours sur une période
CLUSTER BY dispatching_base_num             -- et sur une base : beaucoup de valeurs, idéal pour le clustering
OPTIONS (require_partition_filter = TRUE)   -- une requête sans filtre sur la date est refusée
AS
SELECT
  UPPER(TRIM(dispatching_base_num)) AS dispatching_base_num,  -- 'b00855' et 'B01467   ' deviennent 'B00855' et 'B01467'
  pickup_datetime,
  dropOff_datetime AS dropoff_datetime,
  PUlocationID,
  DOlocationID
FROM dez_dataset.fhv_2019_s2_ext
WHERE pickup_datetime >= '2019-07-01' AND pickup_datetime < '2020-01-01';  -- 28 trajets de juin écartés
~~~

Le nettoyage fait passer de 682 façons d'écrire une base à 662 bases réelles. Sans lui, un tableau de bord filtré sur `B01467` raterait près de 40 000 trajets écrits avec des espaces, et le clustering rangerait la même base à deux endroits.

On ne garde pas `SR_Flag` (toujours vide sur ce semestre) ni `Affiliated_base_number` : la commande ne les demande pas, et chaque colonne en moins, c'est moins d'octets lus.

@@ team
Ce défi est une vraie commande d'équipe : branche `module-03/defi-fhv`, un commit pour le script et un pour le SQL, puis une pull request dans ton fork. Dans la description, colle la sortie du script de vérification, et explique en deux phrases tes choix de partitionnement et de clustering, comme tu le ferais pour l'équipe d'analystes. Fais relire la PR par un camarade, ou relis-toi dans Files changed avant de fusionner.

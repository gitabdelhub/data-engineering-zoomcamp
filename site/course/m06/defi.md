# Défi du module 6 : les heures de pointe de 2020

Pas de vidéo, pas de leçon. Tes données des leçons 5 et 8, un nouveau script Spark, et ton cluster de la leçon 10. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## La commande

L'équipe qui répartit les taxis dans la ville veut savoir, pour **2020**, à quelle heure de la journée chaque arrondissement (*borough*) a le plus de prises en charge, pour les taxis verts et pour les jaunes, et combien rapporte un trajet moyen à cette heure-là.

Le rapport attendu, en parquet :

| Colonne | Contenu |
| --- | --- |
| `borough` | l'arrondissement de la zone de départ, d'après la table des zones |
| `service_type` | `green` ou `yellow` |
| `hour_of_day` | l'heure de prise en charge, de 0 à 23 |
| `trips` | le nombre de trajets |
| `avg_total_amount` | la moyenne de `total_amount`, arrondie au centime |

## Les règles

- Le script est `mon-travail/module-06/pointe.py`. Il prend ses chemins en arguments : `--input_green`, `--input_yellow`, `--zones` et `--output`. Il ne fixe pas de `master`.
- Seuls comptent les trajets pris en charge en **2020**, verts et jaunes réunis.
- La table des zones est petite : la jointure la **diffuse** explicitement à chaque executor.
- Le rapport est écrit en **un seul fichier** parquet dans `mon-travail/module-06/data/rapport-pointe/`, et le script peut être relancé.
- Tu le lances avec `spark-submit` sur ton cluster de la leçon 10, pas en `local`.
- Rien de `mon-travail/module-06/data/` n'est suivi par Git, et ce dossier est ignoré.

## La vérification

Après ton `spark-submit`, depuis la racine de ton fork :

```bash
uv run --with duckdb python site/checks/defi-06.py mon-travail/module-06/pointe.py mon-travail/module-06/data/rapport-pointe
```

Le script lit ton rapport avec DuckDB, ton code, et demande à Git ce qu'il suit. Il fait huit vérifications et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Le squelette

Repars de ton `rapport_submit.py` de la leçon 10 : le bloc `argparse`, avec un argument de plus pour les zones, et une session sans `master`.

### 2. Les trajets de 2020

Pour chaque type : renomme la date de prise en charge, garde seulement les colonnes utiles, ajoute `service_type`. Réunis les deux **par nom**, puis filtre l'année.

### 3. Les zones

Lis le CSV avec un en-tête, garde `LocationID` (converti en entier) et `Borough`. Joins avec `F.broadcast(...)`.

### 4. Le regroupement

Trois clés, deux mesures. L'heure : une fonction de `F` qui renvoie l'heure d'un timestamp. L'arrondi : `F.round(..., 2)`.

### 5. L'écriture et le lancement

Un seul fichier, et le mode qui permet de relancer. Puis, cluster démarré :

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-06
uv run spark-submit --master spark://localhost:7077 pointe.py \
    --input_green='data/pq/green/2020/*/' \
    --input_yellow='data/pq/yellow/2020/*/' \
    --zones=data/zones/taxi_zone_lookup.csv \
    --output=data/rapport-pointe
~~~

Puis le script de vérification, depuis la racine du fork.

@@ hints
- Lire `data/pq/green/2020/*/` ne suffit pas pour l'année : des trajets ont des dates fausses (leçon 6). Le filtre est dans le script.
- `F.year(...)` et `F.hour(...)` existent.
- Après le `groupBy`, nomme tes colonnes avec `alias` : la vérification lit les noms exacts, dans l'ordre de la commande.
- Un seul fichier : `coalesce(1)` avant l'écriture.
- Si la vérification des arrondissements est rouge, regarde si ta jointure n'a pas gardé une colonne en trop, ou perdu une zone.
- Si le job ne démarre pas, relis le breakfix de la leçon 10.

@@ solution
`pointe.py` :

~~~python
"""Le rapport des heures de pointe de 2020, par arrondissement et type de taxi."""
import argparse

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

parser = argparse.ArgumentParser()
parser.add_argument("--input_green", required=True)
parser.add_argument("--input_yellow", required=True)
parser.add_argument("--zones", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args()

spark = SparkSession.builder.appName("heures-de-pointe").getOrCreate()

green = spark.read.parquet(args.input_green) \
    .withColumnRenamed("lpep_pickup_datetime", "pickup_datetime") \
    .withColumn("service_type", F.lit("green"))
yellow = spark.read.parquet(args.input_yellow) \
    .withColumnRenamed("tpep_pickup_datetime", "pickup_datetime") \
    .withColumn("service_type", F.lit("yellow"))

columns = ["pickup_datetime", "PULocationID", "total_amount", "service_type"]
trips = green.select(columns).unionByName(yellow.select(columns)) \
    .filter(F.year("pickup_datetime") == 2020)

zones = spark.read.option("header", "true").csv(args.zones) \
    .select(F.col("LocationID").cast("int").alias("LocationID"), "Borough")

report = trips.join(F.broadcast(zones), trips.PULocationID == zones.LocationID) \
    .groupBy(
        F.col("Borough").alias("borough"),
        "service_type",
        F.hour("pickup_datetime").alias("hour_of_day"),
    ) \
    .agg(
        F.count("*").alias("trips"),
        F.round(F.avg("total_amount"), 2).alias("avg_total_amount"),
    )

report.coalesce(1).write.parquet(args.output, mode="overwrite")
spark.stop()
~~~

Le rapport a 325 lignes : 7 arrondissements (dont `EWR`, l'aéroport de Newark, et `Unknown`), 2 types, 24 heures, moins les combinaisons sans aucun trajet. Pour Brooklyn, les taxis verts ont leur pointe à 14 h ; pour Manhattan, les jaunes à 18 h.

@@ team
Une vraie commande d'équipe. Sur une branche `module-06/defi-pointe` : un commit pour `pointe.py`, un pour la ligne du `.gitignore`. La pull request donne la commande `spark-submit` exacte et le résultat du script de vérification, et ta CI de la leçon 10 doit être verte avant la fusion. Puis publie la version : `git tag -a v0.6.0 -m "Module 6 : heures de pointe"`, `git push origin v0.6.0`, et une release GitHub avec **Generate release notes**, comme aux modules 4 et 5. Pour aller plus loin : lance le même script sur Dataproc (leçon 11), avec une sortie dans ton bucket, sans changer une ligne.

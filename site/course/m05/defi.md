# Défi du module 5 : les pourboires du trimestre

Pas de vidéo, pas de leçon. Ton projet Bruin, une nouvelle commande, et tout ce que le module t'a appris. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## La commande

L'équipe qui suit la satisfaction des clients veut savoir, chaque mois, combien de pourboires laissent les clients des taxis verts selon leur moyen de paiement. Elle te demande un **deuxième pipeline**, à côté du premier, dans le même projet. Ses données : les fichiers CSV des taxis verts publiés par DataTalksClub, un par mois, à l'adresse `https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/green_tripdata_2019-01.csv.gz` (pour janvier 2019).

Le rapport attendu, `pourboires_reports.monthly_tips` :

| Colonne | Contenu |
| --- | --- |
| `month` | le premier jour du mois (une date) |
| `payment_type_name` | le nom du paiement, d'après la table de correspondance des leçons |
| `trip_count` | le nombre de trajets |
| `total_tip` | la somme des pourboires, arrondie au centime |
| `avg_tip` | le pourboire moyen, arrondi au centime |

## Les règles

- Le pipeline est dans `mon-travail/module-05/mon-pipeline/pourboires/`, avec son `pipeline.yml` : le nom `pourboires`, un rythme mensuel, un départ au 1er janvier 2019, la même connexion `duckdb-default`.
- Trois couches, trois schémas : `pourboires_raw` (un asset Python en `append` qui lit les CSV des mois de la fenêtre, et un seed des paiements), `pourboires_staging.trips`, et `pourboires_reports.monthly_tips`.
- Le staging et le rapport sont en `time_interval`, et leurs requêtes filtrent exactement ce que Bruin efface.
- Le staging garde un seul exemplaire de chaque trajet (mêmes dates, mêmes zones, même prix). Il a un contrôle `not_null` sur la date de prise en charge, un `accepted_values` sur `payment_type_name`, et un contrôle personnalisé qui prouve l'absence de doublons.
- Tu construis le **premier trimestre 2019** avec `--full-refresh`, puis tu relances **février seul**, sans `--full-refresh`, comme pour une correction des données.
- Ni `.bruin.yml` ni ta base ne sont suivis par Git.

## La vérification

Après tes deux runs, depuis la racine de ton fork :

```bash
uv run --with duckdb python site/checks/defi-05.py mon-travail/module-05/mon-pipeline/pourboires mon-travail/module-05/nyc_taxi.duckdb
```

Le script lit ta base, les fichiers de tes assets, et demande à Git ce qu'il suit. Il fait huit vérifications et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Le squelette

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-05/mon-pipeline
mkdir -p pourboires/assets/ingestion pourboires/assets/staging pourboires/assets/reports
cp pipeline/assets/ingestion/payment_lookup.csv pourboires/assets/ingestion/
~~~

Écris `pourboires/pipeline.yml` sur le modèle de celui de la leçon 4, sans variable : ce pipeline ne lit que les taxis verts.

### 2. L'ingestion des CSV

Repars de ton `trips.py` de la leçon 5. Trois changements : l'adresse des fichiers, `pd.read_csv(url, parse_dates=[...])` au lieu de `read_parquet`, et la colonne `tip_amount` en plus. Lance l'asset seul sur janvier et compte ses lignes, avant d'écrire la suite.

### 3. Le seed

Une copie de ton `payment_lookup.asset.yml`, avec le nouveau nom d'asset.

### 4. Le staging

Repars de ta leçon 6. Ajoute `tip_amount`, et un `accepted_values` sur le nom du paiement, avec les sept valeurs du CSV.

### 5. Le rapport

Un `group by` sur le mois et le paiement. Le mois : `CAST(DATE_TRUNC('month', pickup_datetime) AS DATE)`. Son `incremental_key` est cette colonne `month`, en granularité `date`. Pour le filtre, pense à ce que Bruin efface pour une fenêtre de février.

### 6. Les deux runs

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-05/mon-pipeline
bruin validate .
bruin run pourboires --full-refresh --start-date 2019-01-01 --end-date "2019-03-31 23:59:59.999999"
bruin run pourboires --start-date 2019-02-01 --end-date "2019-02-28 23:59:59.999999"
~~~

Puis le script de vérification, depuis la racine du fork.

@@ hints
- Les fichiers CSV ont les mêmes noms de colonnes que les parquet des leçons : `lpep_pickup_datetime`, `PULocationID`… Sans `parse_dates`, les dates arrivent comme du texte, et le filtre du staging compare des chaînes.
- Le schéma d'une table vient du début du nom de l'asset : `pourboires_staging.trips` crée la table `trips` dans le schéma `pourboires_staging`, à côté de `staging.trips` sans le toucher.
- Le rapport filtre sur la **date** du trajet, avec les variables de dates sans heure, comme à la leçon 7.
- Après le second run, la couche brute a février en double. C'est voulu : le script le vérifie.
- Si la dernière vérification est rouge, `git ls-files .bruin.yml` et `git ls-files mon-travail/module-05` te disent ce que Git suit.

@@ solution
`pourboires/pipeline.yml` :

~~~yaml
name: pourboires
schedule: monthly
start_date: "2019-01-01"

default_connections:
  duckdb: duckdb-default
~~~

`pourboires/assets/ingestion/trips.py` :

~~~python
"""@bruin
name: pourboires_raw.trips
type: python
image: python:3.11
connection: duckdb-default

materialization:
  type: table
  strategy: append

columns:
  - name: pickup_datetime
    type: timestamp
    description: "Prise en charge"
  - name: tip_amount
    type: double
    description: "Pourboire"
@bruin"""

import os
from datetime import datetime, timezone

import pandas as pd
from dateutil.relativedelta import relativedelta

BASE_URL = "https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green"


def materialize():
    start = datetime.fromisoformat(os.environ["BRUIN_START_DATE"])
    end = datetime.fromisoformat(os.environ["BRUIN_END_DATE"])

    frames = []
    month = start.replace(day=1)
    while month <= end:  # la fin de la fenêtre est incluse
        url = f"{BASE_URL}/green_tripdata_{month:%Y-%m}.csv.gz"
        print(f"Téléchargement de {url}")
        df = pd.read_csv(url, parse_dates=["lpep_pickup_datetime", "lpep_dropoff_datetime"])
        frames.append(df.rename(columns={
            "lpep_pickup_datetime": "pickup_datetime",
            "lpep_dropoff_datetime": "dropoff_datetime",
            "PULocationID": "pickup_location_id",
            "DOLocationID": "dropoff_location_id",
        })[["pickup_datetime", "dropoff_datetime", "pickup_location_id",
            "dropoff_location_id", "fare_amount", "tip_amount", "payment_type"]])
        month += relativedelta(months=1)

    result = pd.concat(frames, ignore_index=True)
    result["extracted_at"] = datetime.now(timezone.utc)
    return result
~~~

`pourboires/assets/ingestion/requirements.txt` :

~~~text
pandas==2.2.3
python-dateutil==2.9.0.post0
~~~

`pourboires/assets/ingestion/payment_lookup.asset.yml` : ton seed de la leçon 5, avec `name: pourboires_raw.payment_lookup`.

`pourboires/assets/staging/trips.sql` :

~~~sql
/* @bruin
name: pourboires_staging.trips
type: duckdb.sql

depends:
  - pourboires_raw.trips
  - pourboires_raw.payment_lookup

materialization:
  type: table
  strategy: time_interval
  incremental_key: pickup_datetime
  time_granularity: timestamp

columns:
  - name: pickup_datetime
    type: timestamp
    description: "Prise en charge"
    checks:
      - name: not_null
  - name: payment_type_name
    type: string
    description: "Nom du paiement"
    checks:
      - name: not_null
      - name: accepted_values
        value: [flex_fare, credit_card, cash, no_charge, dispute, unknown, voided_trip]

custom_checks:
  - name: aucun_doublon
    description: "Un seul trajet par combinaison"
    query: |
      SELECT COUNT(*) - COUNT(DISTINCT (pickup_datetime, dropoff_datetime, pickup_location_id, dropoff_location_id, fare_amount))
      FROM pourboires_staging.trips
    value: 0
@bruin */

SELECT
    t.pickup_datetime,
    t.dropoff_datetime,
    t.pickup_location_id,
    t.dropoff_location_id,
    t.fare_amount,
    t.tip_amount,
    p.payment_type_name
FROM pourboires_raw.trips t
LEFT JOIN pourboires_raw.payment_lookup p
    ON t.payment_type = p.payment_type_id
WHERE t.pickup_datetime BETWEEN '{{ start_timestamp }}' AND '{{ end_timestamp }}'
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY t.pickup_datetime, t.dropoff_datetime,
                 t.pickup_location_id, t.dropoff_location_id, t.fare_amount
    ORDER BY t.extracted_at DESC
) = 1
~~~

`pourboires/assets/reports/monthly_tips.sql` :

~~~sql
/* @bruin
name: pourboires_reports.monthly_tips
type: duckdb.sql

depends:
  - pourboires_staging.trips

materialization:
  type: table
  strategy: time_interval
  incremental_key: month
  time_granularity: date

columns:
  - name: month
    type: date
    description: "Premier jour du mois"
    primary_key: true
  - name: payment_type_name
    type: string
    description: "Nom du paiement"
    primary_key: true
  - name: trip_count
    type: bigint
    description: "Nombre de trajets"
    checks:
      - name: positive
@bruin */

SELECT
    CAST(DATE_TRUNC('month', pickup_datetime) AS DATE) AS month,
    payment_type_name,
    COUNT(*) AS trip_count,
    ROUND(SUM(tip_amount), 2) AS total_tip,
    ROUND(AVG(tip_amount), 2) AS avg_tip
FROM pourboires_staging.trips
WHERE CAST(pickup_datetime AS DATE) BETWEEN '{{ start_date }}' AND '{{ end_date }}'
GROUP BY 1, 2
~~~

Les deux runs finissent par `✓ Assets executed 4 succeeded` et `✓ Quality checks 8 succeeded`. Le trimestre compte 1 807 508 trajets uniques. Quelques pourboires sont **négatifs** dans les données brutes (des remboursements) : la commande ne demande pas de les filtrer, mais tu peux le remarquer dans `total_tip` des paiements contestés.

@@ team
Une vraie commande d'équipe, avec une CI. Sur une branche `module-05/defi-pourboires` : un commit pour le pipeline, un pour les contrôles, et un pour `.github/workflows/bruin.yml`, une Action qui valide tes pipelines à chaque pull request :

- `on: pull_request`, un job sur `ubuntu-latest`, puis `actions/checkout` ;
- une étape qui installe Bruin avec `curl -LsSf https://getbruin.com/install/cli | sh`, puis ajoute `$HOME/.local/bin` au chemin avec `echo "$HOME/.local/bin" >> "$GITHUB_PATH"` ;
- une étape qui écrit un `.bruin.yml` de CI à la racine, avec la connexion `duckdb-default` vers un fichier `ci.duckdb` vide : ton vrai `.bruin.yml` n'est pas dans le dépôt, et c'est très bien ;
- puis `bruin validate mon-travail/module-05/mon-pipeline`.

Cette CI n'a pas été testée dans mon environnement : si l'installation de Bruin échoue, lis le log de l'étape, la cause y est écrite. Ouvre la pull request : la CI doit être verte avant la fusion, puis publie la version : `git tag -a v0.5.0 -m "Module 5 : pourboires"`, `git push origin v0.5.0`, et une release GitHub avec **Generate release notes**, comme au module 4.

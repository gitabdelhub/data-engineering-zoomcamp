# Défi du module 4 : le rapport des aéroports

Pas de vidéo, pas de leçon. Ton projet `mon_taxi`, une nouvelle commande, et tout ce que le module t'a appris. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## La commande

L'équipe qui gère les files de taxis des aéroports veut un tableau de bord : chaque jour, combien de taxis verts et jaunes partent de **JFK**, de **LaGuardia** et de **Newark**. Elle te demande un modèle dbt, construit sur ta table de faits, en `dev` pour commencer (janvier 2019).

| Colonne | Contenu |
| --- | --- |
| `trip_date` | le jour de la prise en charge (une date, sans l'heure) |
| `service_type` | `Green` ou `Yellow` |
| `airport` | le nom de la zone de l'aéroport, tel qu'il est dans `dim_zones` |
| `trips` | le nombre de trajets partis de cet aéroport ce jour-là |

## Les règles

- Le modèle s'appelle `fct_airport_daily`, dans `models/marts/reporting/`, et il est matérialisé en **table**.
- Les aéroports sont les zones de `dim_zones` dont le `service_zone` vaut `Airports` ou `EWR`. Aucun numéro de zone écrit en dur.
- Une ligne par jour, type de taxi et aéroport : un test le **prouve**.
- Chaque colonne est testée contre les valeurs vides, `service_type` et `airport` n'acceptent que leurs valeurs possibles, et un **test singulier** vérifie qu'aucune ligne n'a zéro trajet ou moins.
- Le modèle et **chaque colonne** ont une description.
- `uv run dbt build --select +fct_airport_daily` est tout vert.

## La vérification

Quand tu penses avoir fini, lance `dbt build` une dernière fois (si tu as lancé `dbt docs generate` après, il a remplacé le compte rendu du build), puis, depuis la racine de ton fork :

```bash
uv run --with duckdb python site/checks/defi-04.py mon-travail/module-04/mon_taxi mon-travail/module-04/taxi_rides_ny.duckdb
```

Le script lit ta table, le `manifest.json` et le `run_results.json` de dbt, avec huit vérifications, et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Regarde d'abord les zones

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-04/mon_taxi
uv run dbt show --inline "select * from {{ ref('dim_zones') }} where service_zone in ('Airports', 'EWR')"
~~~

Combien de zones ? Lesquelles ? Note leurs noms exacts, avec les majuscules.

### 2. Le modèle

Deux `with` : les trajets (`ref('fct_trips')`) et les aéroports (`ref('dim_zones')` filtré). Puis une jointure sur la zone de départ, et un `group by` sur les trois dimensions. Pour le jour : `cast(pickup_datetime as date)`.

### 3. Les tests et la documentation

Un fichier `models/marts/reporting/fct_airport_daily.yml`, avec la description du modèle, et pour chaque colonne sa description et ses tests. Le test d'unicité sur trois colonnes ensemble vient de dbt_utils, et se déclare au niveau du **modèle**, pas d'une colonne :

~~~yaml
models:
  - name: mon_modele
    data_tests:
      - dbt_utils.unique_combination_of_columns:
          arguments:
            combination_of_columns: [colonne_a, colonne_b]
~~~

### 4. Le test singulier

Un fichier dans `tests/`, qui renvoie les lignes où `trips <= 0`.

### 5. Construis et vérifie toi-même

~~~bash
uv run dbt build --select +fct_airport_daily
~~~

Avant le script, pose tes propres questions : combien de lignes ? Pourquoi pas 31 × 2 × 3 = 186 ? Quel aéroport reçoit le plus de taxis verts ?

@@ hints
- `where service_zone in ('Airports', 'EWR')` : Newark est dans le New Jersey, sa zone de service s'appelle `EWR`, pas `Airports`.
- Un `join` (pas `left join`) entre les trajets et les aéroports : on ne garde que les départs des aéroports.
- Les noms exacts pour `accepted_values` : `JFK Airport`, `LaGuardia Airport`, `Newark Airport`.
- Moins de 186 lignes, c'est normal : certains jours, aucun taxi vert n'est parti de Newark. Une ligne n'existe que s'il y a eu au moins un trajet.

@@ solution
`models/marts/reporting/fct_airport_daily.sql` :

~~~sql
-- Les départs des aéroports, par jour, type de taxi et aéroport
with trips as (
    select * from {{ ref('fct_trips') }}
),

airports as (
    select location_id, zone from {{ ref('dim_zones') }}
    where service_zone in ('Airports', 'EWR')   -- JFK et LaGuardia, plus Newark (zone de service EWR)
)

select
    cast(t.pickup_datetime as date) as trip_date,
    t.service_type,
    a.zone as airport,
    count(*) as trips
from trips t
join airports a on t.pickup_location_id = a.location_id   -- join : seulement les départs des aéroports
group by all
~~~

`models/marts/reporting/fct_airport_daily.yml` :

~~~yaml
models:
  - name: fct_airport_daily
    description: Le nombre de départs de taxis depuis les trois aéroports, par jour et par type de taxi.
    data_tests:
      - dbt_utils.unique_combination_of_columns:     # une ligne par jour, type et aéroport
          arguments:
            combination_of_columns: [trip_date, service_type, airport]
    columns:
      - name: trip_date
        description: Le jour de la prise en charge
        data_tests: [not_null]
      - name: service_type
        description: Green ou Yellow
        data_tests:
          - not_null
          - accepted_values:
              arguments:
                values: ['Green', 'Yellow']
      - name: airport
        description: Le nom de la zone de l'aéroport
        data_tests:
          - not_null
          - accepted_values:
              arguments:
                values: ['JFK Airport', 'LaGuardia Airport', 'Newark Airport']
      - name: trips
        description: Le nombre de trajets partis de cet aéroport ce jour-là
        data_tests: [not_null]
~~~

`tests/assert_airport_trips_positive.sql` :

~~~sql
-- Une ligne du rapport n'existe que s'il y a eu au moins un trajet
select * from {{ ref('fct_airport_daily') }} where trips <= 0
~~~

La fin de `uv run dbt build --select +fct_airport_daily` :

~~~text
Done. PASS=17 WARN=0 ERROR=0 SKIP=0 NO-OP=0 REUSED=0 TOTAL=17
~~~

Le nombre total dépend de tes tests sur les modèles parents : 17 avec seulement ceux de la solution. En janvier 2019, la table a 153 lignes : les taxis jaunes partent de JFK et LaGuardia par milliers chaque jour, les verts y sont rares.

@@ team
Une vraie commande d'équipe, avec une CI. Sur une branche `module-04/defi-aeroports` : un commit pour le modèle, un pour les tests et la documentation, et un pour `.github/workflows/dbt.yml`, une Action qui vérifie ton projet à chaque pull request. Elle n'a pas les 2 Go de données, mais elle peut prouver que le projet est **valide** :

- `on: pull_request`, un job sur `ubuntu-latest`, puis `actions/checkout`, et `astral-sh/setup-uv` pour avoir uv ;
- une étape qui écrit un `profiles.yml` de CI dans le dossier du projet, avec une target `ci` vers un fichier `ci.duckdb` vide (`type: duckdb`, `path: ci.duckdb`, `schema: ci`) ;
- puis, dans `mon-travail/module-04/mon_taxi`, avec `DBT_PROFILES_DIR: .` : `uv run dbt deps`, `uv run dbt parse --target ci` (toutes les références, tous les YAML) et `uv run dbt build --select resource_type:seed --target ci` (les seeds et leurs tests).

Ouvre la pull request : la CI doit être verte avant la fusion. Dans la description, colle la sortie du script et une capture du graphe de `fct_airport_daily` dans la documentation dbt. Une fois fusionnée, publie la version : `git tag -a v0.4.0 -m "Module 4 : rapport des aéroports"`, `git push origin v0.4.0`, puis sur GitHub, **Releases**, **Draft a new release**, choisis le tag, et clique **Generate release notes** : GitHub liste les pull requests fusionnées depuis la version précédente.

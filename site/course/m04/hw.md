@@ intro
Le homework officiel de la cohorte 2026, question par question. Il utilise le **projet officiel** `taxi_rides_ny` de ton fork, pas le tien : tu le construis en `prod`, puis tu interroges ses tables. Les questions 1 et 2 se résolvent en réfléchissant, les questions 3 à 5 avec une requête, la 6 avec un nouveau modèle de staging, sur des données que tu n'as pas encore chargées. Ici, jamais de réponse : seulement des indices. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée.

Ton travail va dans `mon-travail/module-04/homework/`, avec un `README.md` qui reprend tes réponses et tes requêtes.

@@ guide
Ici, seulement la préparation : les réponses, c'est toi qui les trouves.

### 1. La machine et la place

Le build `prod` du projet officiel traite environ 117 millions de trajets. Passe ton Codespace en **4 cœurs** (16 Go de mémoire), comme à la leçon 9, et vérifie qu'il te reste au moins **20 Go** avec `df -h /workspaces`. Si tu as construit ton propre projet en `prod`, supprime d'abord ses tables pour faire de la place : `uv run python -c "import duckdb; duckdb.connect('taxi_rides_ny.duckdb').sql('drop schema mon_prod cascade')"`, depuis `mon-travail/module-04/`.

### 2. Le profil du projet officiel

Le projet officiel s'attend à un profil nommé `taxi_rides_ny`. Ajoute-le dans `~/.dbt/profiles.yml`, **à côté** du tien : la même forme que `mon_taxi`, avec les schémas `dev` et `prod`, et le **même fichier** DuckDB, `/workspaces/data-engineering-zoomcamp/mon-travail/module-04/taxi_rides_ny.duckdb`. Les données brutes y sont déjà, dans le schéma `prod`.

Attention : le projet officiel construit sa target `prod` dans le schéma `prod`, **le même** que les données brutes. C'est voulu par le cours, et sans danger : les noms des modèles ne sont pas ceux des tables brutes.

### 3. Construis le projet officiel

~~~bash
cd /workspaces/data-engineering-zoomcamp/04-analytics-engineering/taxi_rides_ny
uv run --project ../../mon-travail/module-04 dbt deps
uv run --project ../../mon-travail/module-04 dbt build --target prod
~~~

`--project` dit à uv où est ton environnement avec dbt, puisque tu n'es plus dans `mon-travail/module-04/`. Le guide officiel annonce 5 à 10 minutes ; compte plus sur un petit Codespace. En cas d'échec par manque de mémoire, `dbt retry` avec les mêmes options reprend où il s'est arrêté. Le dossier du projet officiel a son `.gitignore` : `target/`, `logs/` et `dbt_packages/` ne seront pas commités.

### 4. Pour la question 6

Il te faudra les FHV de 2019 dans la base, dans une table `prod.fhv_tripdata`. Les fichiers sont sur la page des [données FHV](https://github.com/DataTalksClub/nyc-tlc-data/releases/tag/fhv), au même format que les autres. Adapte ton `charger.py` de la leçon 2 : un type de taxi, une seule année. Puis déclare la table dans le `sources.yml` du projet officiel, et écris le modèle demandé.

@@ q1
- `--select` avec un nom seul, sans `+` : relis la leçon 9, ou essaie `uv run dbt ls --select int_trips_unioned` dans le projet officiel.
- `dbt ls` ne construit rien : il te montre exactement ce que `dbt run` construirait avec la même sélection.

@@ q2
- Un test générique `accepted_values` est une requête qui renvoie les lignes dont la valeur n'est pas dans la liste.
- Relis la leçon 7 : que fait un test qui trouve des lignes, quand il n'a pas de `severity` ?
- Le fait que le modèle n'ait pas changé compte-t-il pour `dbt test` ? Pense à ce que lit la requête du test.

@@ q3
- Un `count(*)` sur la table de la target `prod`, pas sur celle de `dev` : en `dev`, elle n'a que les 516 lignes de janvier 2019.
- `uv run --project ../../mon-travail/module-04 dbt show --target prod --inline "select count(*) from {{ ref('fct_monthly_zone_revenue') }}"`

@@ q4
- Trois filtres : le type de service, l'année du mois de revenu, et un `group by` sur la zone pour additionner les **12 mois**.
- `revenue_month` est une date de début de mois : `extract(year from revenue_month) = 2020`.
- Trie par la somme de `revenue_monthly_total_amount`, du plus grand au plus petit.

@@ q5
- Une somme de `total_monthly_trips`, pas un `count(*)` : chaque ligne du rapport représente déjà beaucoup de trajets.
- Le filtre sur le mois : `revenue_month = '2019-10-01'`.

@@ q6
- La source FHV a des noms de colonnes différents : regarde-les avec `describe prod.fhv_tripdata` avant d'écrire le modèle.
- Le filtre demandé porte sur `dispatching_base_num`. Mets ton modèle dans `models/staging/` : il sera en vue, comme les autres.
- Le filtre `dev` du projet officiel ne garde que janvier 2019 : construis et compte en `--target prod`.
- Si ton nombre ne fait partie d'aucune proposition, vérifie que les 12 mois de 2019 sont chargés : un `count(*)` par mois sur la source.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/module-04/homework/` poussé sur ton fork, avec ton `README.md` et ton `stg_fhv_tripdata.sql`. Avant de pousser, `git status` ne doit montrer aucun `.duckdb` ni `.parquet`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec d'autres étudiants sur le Slack de DataTalksClub (canal `#course-data-engineering`), ou cherche « de zoomcamp 2026 homework 4 » sur GitHub.

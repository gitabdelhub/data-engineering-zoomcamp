@@ intro
Le homework officiel du workshop : un pipeline dlt vers une API de taxis jaunes de New York, faite pour le cours, puis trois questions sur les données chargées. L'énoncé officiel fait écrire le pipeline par une IA ; ici, tu l'écris toi-même, avec ce que tu as appris aux leçons 2 et 4. L'IA reste permise pour la comparaison, comme à la leçon 5. Jamais de réponse ici : seulement des indices. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as trouvée.

Ton travail va dans `mon-travail/workshop-dlt/homework/`, avec un `README.md` qui reprend tes réponses et tes requêtes.

@@ guide
Ici, seulement la préparation et ce qu'il faut savoir de l'API : le pipeline et les réponses, c'est toi qui les trouves.

### 1. Le dossier et le projet

~~~bash
mkdir -p /workspaces/data-engineering-zoomcamp/mon-travail/workshop-dlt/homework
cd /workspaces/data-engineering-zoomcamp/mon-travail/workshop-dlt/homework
uv init --bare --python=3.13
uv add "dlt[duckdb]==1.31.0" "sqlglot<30.22" pandas marimo pyarrow "ibis-framework[duckdb]"
printf '*.duckdb\n' > .gitignore
~~~

Pas besoin de `dlt init` : tu écris `taxi_pipeline.py` toi-même. Le pipeline s'appelle `taxi_pipeline`, comme dans l'énoncé.

### 2. Regarde l'API avant de coder

Ouvre dans ton navigateur l'adresse de l'énoncé, puis la même avec `?page=2` à la fin. Note :

- la **forme** de la réponse : est-ce un objet `{...}` avec une clé qui contient la liste, ou directement une liste `[...]` ?
- comment on demande la page suivante, et à partir de quel numéro les pages commencent ;
- ce que renvoie une page **après** la dernière (essaie un grand numéro, comme `?page=1000`).

### 3. Ce que ton paginateur doit faire

D'après l'énoncé, les pages ont 1 000 trajets, et la seule façon de savoir qu'on a fini est une **page vide**. Il n'y a **pas** de total dans la réponse. Relis la leçon 2 : quel type de paginateur, et quelle clé lui dire de **ne pas** chercher ?

Si tu vois `Total `pages` not found in the response in `PageNumberPaginator``, le paginateur cherche un total qui n'existe pas : c'est le réglage par défaut de `page_number`.

### 4. Lance et vérifie

~~~bash
uv run python taxi_pipeline.py
uv run dlt pipeline taxi_pipeline show
~~~

Avant de répondre aux questions : combien de lignes as-tu ? Est-ce un multiple de 1 000, ou pas ? Si c'est exactement 1 000, ton paginateur s'arrête après la première page.

### 5. Les noms de colonnes

dlt met les noms de colonnes en **snake_case** : minuscules, mots séparés par des tirets bas. Une clé `PickupDateTime` dans l'API devient `pickup_date_time` dans la table. Pour tes requêtes, prends les noms dans **Inspect Schema**, pas dans le JSON.

@@ q1
- Le début et la fin, ce sont le plus petit et le plus grand moment de **prise en charge** : `MIN` et `MAX` sur la bonne colonne.
- Regarde le type de cette colonne dans **Inspect Schema** : dlt a-t-il reconnu une date, ou gardé du texte ?
- Les propositions sont des **jours**. Compare-les à tes résultats, qui ont une heure.

@@ q2
- D'abord, la liste des valeurs **distinctes** de la colonne du type de paiement, avec leur nombre de trajets. Elles ne sont pas forcément toutes écrites de la même façon.
- Une proportion, c'est le nombre de trajets payés par carte divisé par le nombre **total** de trajets, pas seulement ceux qui ont un type de paiement connu.
- En SQL, `COUNT(*) FILTER (WHERE ...)` compte seulement les lignes qui respectent la condition, dans la même requête que le total.

@@ q3
- Une somme sur la colonne des pourboires, sur **tous** les trajets chargés.
- Si ton total est bien plus petit que toutes les propositions, compte tes lignes : ton pipeline a-t-il chargé toutes les pages ?
- Arrondis à deux décimales avec `ROUND(..., 2)` avant de comparer.

@@ submit
La cohorte 2026 est terminée : le formulaire officiel n'accepte sans doute plus de réponses. Ton rendu, c'est ton dossier `mon-travail/workshop-dlt/homework/` poussé sur ton fork, avec `taxi_pipeline.py` et ton `README.md` : tes trois réponses, tes requêtes, et ce que tu as essayé pour y arriver (le tableau de bord, le SQL, ou l'IA). Avant de pousser, `git status` ne doit montrer aucun `.duckdb`. Pour vérifier tes réponses sans les recevoir toutes faites : compare-les avec d'autres étudiants sur le Slack de DataTalksClub (canal `#course-data-engineering`), ou cherche « de zoomcamp 2026 dlt homework » sur GitHub.

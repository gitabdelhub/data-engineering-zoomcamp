@@ intro
Le homework officiel de la cohorte 2026 : sept questions à choix, sur ce que tu as construit dans le module. Pas de données à charger en plus : ton pipeline `mon-pipeline` suffit. Ici, jamais de réponse : seulement des indices. La meilleure façon de répondre, c'est d'**essayer** chaque proposition sur ton pipeline et de lire ce que Bruin répond. Pour chaque question, tu choisis ta réponse **et** tu écris comment tu l'as vérifiée.

Ton travail va dans `mon-travail/module-05/homework/README.md`, avec tes réponses, les commandes lancées et ce qu'elles ont affiché.

@@ guide
Ici, seulement la préparation : les réponses, c'est toi qui les trouves.

### 1. Un pipeline qui marche

Le homework suppose le pipeline des leçons 3 à 7, complet et vert. Vérifie :

~~~bash
cd /workspaces/data-engineering-zoomcamp/mon-travail/module-05
bruin validate mon-pipeline
~~~

### 2. Une petite fenêtre pour essayer

Pour tester une commande sans attendre, prends une fenêtre courte, un seul jour par exemple : `--start-date 2019-01-15 --end-date "2019-01-15 23:59:59.999999"`. Ton staging et ton rapport sont en `time_interval` : relancer un jour ne casse pas les autres.

### 3. La version de Bruin

Note `bruin version` dans ton README : quelques options du cours officiel ont changé de nom, et le homework a été écrit pour une version plus ancienne. Si une proposition n'existe plus, dis-le, et explique laquelle reste juste.

@@ q1
- Regarde ce que `bruin init zoomcamp` a créé, et **où** : dans le dossier du pipeline, et à la racine du fork.
- Relis la leçon 3 : quel fichier Bruin cherche-t-il pour les connexions ? Et la leçon 4 : qu'est-ce qui fait d'un dossier un pipeline ?
- Les quatre propositions diffèrent par un point devant un nom, et par l'endroit des assets. Compare chacune avec ton arborescence : `ls -a` à la racine, puis dans `mon-pipeline/`.

@@ q2
- Relis la leçon 6 : quelle stratégie efface une fenêtre de temps, puis réinsère ?
- La liste complète des stratégies est dans l'erreur de la panne de la leçon 5.
- Une `view` ne stocke aucune donnée : peut-elle effacer et insérer une période ?

@@ q3
- Essaie chaque proposition sur ton pipeline, avec `bruin validate mon-pipeline` suivi de l'option : Bruin te dit tout de suite si l'option existe et si la valeur est acceptée.
- Relis la panne de la leçon 4 : que doit être la valeur après le `=` ?
- Une seule proposition passe, et donne bien un tableau à ton asset Python.

@@ q4
- Une seule des propositions désigne l'asset par un **chemin de fichier** qui existe dans ton pipeline.
- `bruin run --help` liste les options de cette version : cherche celles des quatre propositions.
- Relis la leçon 7 : quelle option lance aussi ce qui dépend de l'asset ?

@@ q5
- Relis la leçon 6 et la page officielle des contrôles disponibles, dans les ressources.
- Une valeur vide n'est pas un doublon : `unique` ne la refuse pas forcément.
- `accepted_values` attend une liste de valeurs permises : `not_null` n'est pas une valeur.

@@ q6
- Essaie les quatre commandes : `bruin graph`, `bruin dependencies`, `bruin lineage <fichier>`, `bruin show`.
- `bruin --help` liste toutes les commandes de cette version, avec une phrase pour chacune.

@@ q7
- Relis la leçon 6 : que s'est-il passé à ton premier run du staging, sur une base neuve ?
- `bruin run --help` décrit chaque option : cherche celles qui existent parmi les quatre.

# Défi du workshop : l'API des zones de taxi

Pas de vidéo, pas de leçon. Une API que tu n'as jamais vue, et tout ce que le workshop t'a appris. Essaie d'abord seul : c'est le meilleur test de ce que tu sais faire. Si tu ne sais pas par où commencer, le **plan d'attaque** plus bas te guide étape par étape, et la **solution complète** est là pour comparer.

## L'API

Ton propre site publie une petite API : les **265 zones** de taxi de New York, et pour chacune, ses départs de taxis verts mois par mois en 2019, avec le pourboire moyen. Elle est découpée en pages, et chaque page indique l'adresse de la suivante :

```text
https://gitabdelhub.github.io/data-engineering-zoomcamp/site/api/zones/page-1.json
```

L'API a un défaut, comme beaucoup de vraies API : sa première publication contenait des **erreurs**. Elles ont été corrigées dans un second flux, celui des **mises à jour**, qui republie les zones corrigées en entier, avec une date de mise à jour plus récente :

```text
https://gitabdelhub.github.io/data-engineering-zoomcamp/site/api/maj/page-1.json
```

## La commande

L'équipe d'analyse veut ces zones dans DuckDB, **toujours à jour** : une ligne par zone, dans sa dernière version, et le détail par mois dans une table à part. Le pipeline sera relancé chaque fois que l'API publiera des corrections.

## Les règles

- Un script `zones_taxi.py`, avec la source REST API de dlt. Pas de `requests` ni de boucle des pages écrite à la main.
- Le pipeline s'appelle `zones_taxi`, le dataset `api_zones`.
- La table `zones` a exactement **une ligne par zone**, dans sa **dernière** version, et `id` est sa clé primaire.
- Le détail par mois est dans la table enfant `zones__mois`, sans doublon.
- Toutes les pages des deux flux sont chargées.
- Relancer le pipeline ne change rien au résultat.

## La vérification

Quand tu penses avoir fini, lance depuis la racine de ton fork, avec le chemin de ton fichier DuckDB :

```bash
uv run --with duckdb python site/checks/defi-w1.py mon-travail/workshop-dlt/defi/zones_taxi.duckdb
```

Le script lit ta base avec huit requêtes et affiche ✅ ou ❌ pour chacune. Il ne dit pas ce qui est attendu : seulement si c'est juste. Quand tout est vert, il affiche un **code de réussite** : entre-le ci-dessous pour valider le défi.

@@ guide
### 1. Le dossier

~~~bash
mkdir -p /workspaces/data-engineering-zoomcamp/mon-travail/workshop-dlt/defi
cd /workspaces/data-engineering-zoomcamp/mon-travail/workshop-dlt/defi
uv init --bare --python=3.13
uv add "dlt[duckdb]==1.31.0" "sqlglot<30.22" pandas
printf '*.duckdb\n' > .gitignore
~~~

### 2. Regarde l'API

Ouvre la page 1 des zones dans ton navigateur (Chrome et Firefox affichent le JSON joliment). Note :

- la clé qui contient la liste des zones ;
- la clé qui donne l'adresse de la page suivante, et ce qu'elle vaut sur la **dernière** page ;
- ce qui est imbriqué dans chaque zone.

Puis ouvre la page 1 des mises à jour. Cherche la zone `7` dans les deux flux : qu'est-ce qui a changé ? Quels champs n'existent que dans les mises à jour ?

### 3. Le paginateur

Ce n'est ni un décalage, ni un numéro de page : la réponse contient un **lien** vers la suite. Relis le tableau de la leçon 2, puis la [page des paginateurs](https://dlthub.com/docs/general-usage/http/rest-client#paginators) : ce type a une option pour dire **où** est le lien dans la réponse.

### 4. Deux ressources, une seule table

Une ressource par flux, `zones` et `maj`. Pour qu'elles écrivent dans la **même** table, chaque ressource accepte `"table_name": "zones"`. Mets la clé primaire et le `write_disposition` qui conviennent (leçon 4).

### 5. Lance, puis vérifie tout toi-même

~~~bash
uv run python zones_taxi.py
~~~

Avant le script de vérification, pose tes propres questions, dans le tableau de bord ou en SQL : combien de lignes dans `zones` ? Combien d'`id` différents ? Quel nom pour la zone 7 ? Combien de mois pour la zone 41, dans les deux flux et dans ta table ? Si une réponse te surprend, relis les deux flux.

@@ hints
- Le paginateur : `{"type": "json_link", "next_url_path": "suivant"}`. Le lien est relatif (`page-2.json`) : dlt le complète avec l'adresse de la page en cours.
- Avec `replace` ou `append`, ta table a plus de 265 lignes : les zones corrigées y sont deux fois. Il faut `merge`, avec `"primary_key": "id"`.
- Même avec `merge`, si les deux flux sont chargés **dans le même lancement**, dlt reçoit deux versions de la même zone en même temps, et il en garde **une au hasard**. Regarde la zone 7 : as-tu le bon nom ? Deux solutions : charger les deux flux en deux lancements, dans l'ordre (`source.with_resources("zones")` puis `source.with_resources("maj")`), ou dire à dlt quelle version garder, avec `"columns": {"mis_a_jour": {"dedup_sort": "desc"}}`.
- Le champ `remarque` n'existe que dans les mises à jour : dlt ajoute la colonne tout seul, et elle est vide pour les autres zones.

@@ solution
`mon-travail/workshop-dlt/defi/zones_taxi.py` :

~~~python
import dlt
from dlt.sources.rest_api import rest_api_source

BASE_URL = "https://gitabdelhub.github.io/data-engineering-zoomcamp/site/api/"


def flux(nom, dossier):
    # Une ressource par flux, qui écrivent toutes les deux dans la table zones
    return {
        "name": nom,
        "table_name": "zones",
        "endpoint": {
            "path": f"{dossier}/page-1.json",
            "data_selector": "zones",                                         # la liste est dans "zones"
            "paginator": {"type": "json_link", "next_url_path": "suivant"},  # le lien vers la page suivante
        },
    }


source = rest_api_source({
    "client": {"base_url": BASE_URL},
    "resource_defaults": {
        "primary_key": "id",                 # une zone = un id
        "write_disposition": "merge",        # une zone déjà connue est remplacée, pas ajoutée
        # Deux versions d'une zone dans le même chargement : garder la plus récente
        "columns": {"mis_a_jour": {"dedup_sort": "desc"}},
    },
    "resources": [flux("zones", "zones"), flux("maj", "maj")],
})

pipeline = dlt.pipeline(pipeline_name="zones_taxi", destination="duckdb", dataset_name="api_zones")
print(pipeline.run(source))
print(pipeline.dataset().row_counts().df())
~~~

La fin de la sortie :

~~~text
     table_name  row_count
0         zones        265
1   zones__mois       3065
~~~

`dedup_sort` dit à dlt, quand plusieurs lignes ont la même clé primaire dans un chargement, de trier sur `mis_a_jour` du plus récent au plus ancien et de garder la première. Sans lui, la table a bien 265 lignes, mais certaines zones gardent leur **ancienne** version : un bug invisible au simple comptage. Les 12 zones corrigées ont aussi leurs mois remplacés : `merge` supprime les anciennes lignes enfants d'une zone quand elle est mise à jour.

@@ team
Ce défi est une vraie commande d'équipe : branche `workshop-dlt/defi-zones`, un commit pour le script et un pour le `.gitignore`, puis une pull request dans ton fork. Dans la description, colle la sortie du script de vérification, et explique en deux phrases pourquoi `merge` et `dedup_sort`, comme tu le ferais pour l'équipe d'analyse. Fais relire la PR par un camarade, ou relis-toi dans **Files changed** avant de fusionner.

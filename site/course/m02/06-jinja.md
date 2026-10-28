# Templates Jinja et paramètres

Ton pipeline doit marcher pour n'importe quel mois et n'importe quel type de taxi, **sans modifier le code** à chaque fois. Deux outils d'Airflow servent à ça : les **paramètres**, choisis au moment de lancer un run, et les **templates Jinja**, des trous dans ton code qu'Airflow remplit juste avant d'exécuter une tâche.

## Les paramètres

```python
from airflow.sdk import Param

@dag(
    dag_id="meteo_ville",
    ...,
    params={
        "ville": Param("Paris", type="string"),
        "unite": Param("celsius", enum=["celsius", "fahrenheit"]),
    },
)
```

Chaque paramètre a une valeur par défaut. `enum` limite les choix possibles. Quand tu cliques sur ▷, la fenêtre **Trigger Dag** affiche une section **Run Parameters** avec un champ par paramètre (une liste déroulante pour un `enum`). Dans le terminal :

```bash
docker compose exec airflow-scheduler airflow dags test meteo_ville -c '{"ville": "Lyon"}'
```

`-c` (pour *conf*) donne les valeurs en JSON. Les guillemets simples autour protègent les guillemets doubles du JSON.

## Les templates Jinja

Dans certains champs, Airflow remplace tout ce qui est entre `{{` et `}}` au moment du run :

```python
BashOperator(task_id="dire", bash_command="echo 'Météo de {{ params.ville }}'")
```

Ce qu'on peut écrire entre les accolades :

| Template | Valeur |
| --- | --- |
| `{{ params.ville }}` | Le paramètre `ville` de ce run |
| `{{ ds }}` | La date logique du run, au format `2026-10-28` |
| `{{ logical_date }}` | La même date, en objet date et heure : `{{ logical_date.strftime('%Y-%m') }}` donne `2026-10` |
| `{{ run_id }}` | L'identifiant du run, comme `manual__2026-10-28T19:37:49+00:00` |
| `{{ params.ville \| upper }}` | Un **filtre** : `upper` met en majuscules |

## Où Jinja marche, et où il ne marche pas

Jinja ne remplit que les **champs templatés** des opérateurs, pas tout ton fichier :

- `bash_command` d'un `BashOperator` ;
- `sql` d'un `SQLExecuteQueryOperator` ;
- les **arguments** que tu passes à une tâche `@task` quand tu l'appelles.

```python
@task
def preparer(ville: str):
    print(ville)                  # Lyon : l'argument a été rempli avant l'appel
    print("{{ params.ville }}")   # {{ params.ville }} : dans le corps, rien n'est remplacé

preparer("{{ params.ville }}")
```

Pour vérifier ce qu'Airflow a vraiment exécuté : clique sur le carré d'une tâche, onglet **Rendered Templates**.

## Le piège des f-strings

En Python, dans une f-string, `{{` veut dire « une accolade ». `f"{{ params.ville }}"` devient donc `{ params.ville }`, avec **une seule** accolade, et Jinja ne le reconnaît plus. Garde les templates dans des chaînes normales, et colle les morceaux avec `+` :

```python
VILLE = "{{ params.ville }}"
BashOperator(task_id="dire", bash_command="echo " + VILLE)
```

## La date logique d'un run manuel

Quand tu lances un run avec ▷, la fenêtre **Trigger Dag** remplit le champ **Logical Date** avec l'heure actuelle : `{{ ds }}` marche. Mais avec `airflow dags trigger` sans l'option `--logical-date`, un run manuel **n'a pas de date logique** dans Airflow 3, et `{{ ds }}` fait échouer la tâche avec `UndefinedError: 'ds' is undefined`. Pour un DAG lancé à la main, préfère des paramètres. Les dates logiques prennent tout leur sens avec la planification, à la leçon 8.

@@ predict
Dans un DAG, tu écris `CHEMIN = f"/opt/airflow/data/{{ params.taxi }}.csv"` puis `BashOperator(task_id="voir", bash_command="ls " + CHEMIN)`. Tu lances un run avec `taxi` à `green`. Quelle commande Bash est vraiment exécutée ?

@@ predict-answer
`ls /opt/airflow/data/{ params.taxi }.csv`. La f-string a transformé `{{` en `{` **avant même** qu'Airflow lise le fichier. Jinja reçoit une seule accolade, ne reconnaît pas de template, et laisse le texte tel quel. La commande cherche un fichier au nom absurde, et `ls` échoue. Enlève le `f` devant la chaîne, et la commande devient `ls /opt/airflow/data/green.csv`.

@@ practice
Écris le DAG `fichier_du_mois` : on choisit un type de taxi, une année et un mois au lancement, et le DAG annonce le fichier correspondant et sa taille sur GitHub, **sans le télécharger**.

@@ constraints
- Trois paramètres : `taxi` (`yellow` ou `green`), `year` (`2019`, `2020` ou `2021`) et `month` (de `01` à `12`), avec des listes de choix
- Une tâche Bash `afficher_nom` affiche le nom du fichier, comme `yellow_tripdata_2021-03.csv`
- Une tâche Bash `taille_distante` affiche la taille du fichier `.csv.gz` sur GitHub, lue dans les en-têtes HTTP
- Une tâche `@task` `annoncer` reçoit le nom du fichier **et** l'identifiant du run par des templates, et affiche « Prêt à charger … »
- Un run lancé depuis l'interface avec `yellow`, `2021` et `03`, et le bon nom visible dans l'onglet Rendered Templates

@@ guide
### 1. Les paramètres

Reprends le bloc `params` de la leçon, avec trois `Param`. Pour la liste des mois, une compréhension de liste évite d'écrire douze valeurs : la même que pour les mois à la leçon 4, mais sur 1 à 12.

### 2. Le nom du fichier, une seule fois

Les fichiers des taxis s'appellent `<taxi>_tripdata_<année>-<mois>.csv`. Écris une constante en haut du fichier, avec trois templates, **sans f-string**. Tu la réutiliseras dans les trois tâches.

### 3. L'adresse du fichier

Les fichiers sont sur GitHub, à l'adresse :

~~~text
https://github.com/DataTalksClub/nyc-tlc-data/releases/download/<taxi>/<nom du fichier>.gz
~~~

Construis-la avec `+` à partir de morceaux de texte, de templates et de ta constante.

### 4. La taille sans télécharger

`curl -I` demande seulement les **en-têtes** de la réponse, pas le fichier. Teste dans ton terminal, sur un fichier que tu connais déjà :

~~~bash
curl -sIL https://github.com/DataTalksClub/nyc-tlc-data/releases/download/green/green_tripdata_2021-01.csv.gz
~~~

`-L` suit les redirections : GitHub renvoie vers un autre serveur, donc plusieurs blocs d'en-têtes s'affichent. La taille est sur la ligne `content-length` du **dernier** bloc. `grep -i` garde les lignes qui contiennent un mot sans tenir compte des majuscules, et `tail -1` garde la dernière.

### 5. La tâche Python et ses arguments

`annoncer` prend deux arguments. À l'appel, passe ta constante, et le template `"{{ run_id }}"` en texte.

### 6. Lance depuis l'interface

Bouton ▷, section **Run Parameters** : choisis `yellow`, `2021`, `03`, puis **Trigger**. Ouvre le carré de `afficher_nom`, onglet **Rendered Templates** : tu vois la commande exacte qui a tourné.

@@ hints
- `Param("green", enum=["yellow", "green"])` : la valeur par défaut, puis les choix possibles.
- Une constante comme `FICHIER = "{{ params.taxi }}_tripdata_..."` est une chaîne normale. Pour l'adresse : `"https://.../download/{{ params.taxi }}/" + FICHIER + ".gz"`.
- Pour la taille : `"curl -sIL " + URL + " | grep -i content-length | tail -1"`.

@@ solution
~~~python
from datetime import datetime

from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import Param, dag, task

# Une simple chaîne, pas une f-string : Jinja la remplira au moment du run
FICHIER = "{{ params.taxi }}_tripdata_{{ params.year }}-{{ params.month }}.csv"
URL = "https://github.com/DataTalksClub/nyc-tlc-data/releases/download/{{ params.taxi }}/" + FICHIER + ".gz"


@dag(
    dag_id="fichier_du_mois",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    params={
        "taxi": Param("green", enum=["yellow", "green"]),
        "year": Param("2019", enum=["2019", "2020", "2021"]),
        "month": Param("01", enum=[f"{m:02d}" for m in range(1, 13)]),
    },
    tags=["module-02"],
)
def fichier_du_mois():
    afficher_nom = BashOperator(task_id="afficher_nom", bash_command="echo " + FICHIER)

    # -I demande seulement les en-têtes : on connaît la taille sans télécharger
    taille_distante = BashOperator(
        task_id="taille_distante",
        bash_command="curl -sIL " + URL + " | grep -i content-length | tail -1",
    )

    @task
    def annoncer(fichier: str, run: str):
        print(f"Prêt à charger {fichier} (run {run})")

    # Les arguments d'une tâche @task sont des champs templatés
    [afficher_nom, taille_distante] >> annoncer(FICHIER, "{{ run_id }}")


fichier_du_mois()
~~~

Avec `yellow`, `2021` et `03`, les logs affichent :

~~~text
yellow_tripdata_2021-03.csv
content-length: 35196823
Prêt à charger yellow_tripdata_2021-03.csv (run manual__2026-10-28T19:37:49.319058+00:00)
~~~

La taille est en octets : environ 33,6 Mio compressés.

@@ selfcheck
- La fenêtre Trigger Dag montre trois listes déroulantes
- L'onglet Rendered Templates de `afficher_nom` montre `echo yellow_tripdata_2021-03.csv`
- Mon fichier ne contient aucune f-string autour d'un template

@@ breakfix
Dans ton DAG, transforme la constante `FICHIER` en f-string (ajoute un `f` devant les guillemets), puis relance avec les mêmes paramètres. Que devient le log de `afficher_nom` ? Et `taille_distante` ? Explique, puis répare.

@@ breakfix-hints
- Regarde l'onglet Rendered Templates de `afficher_nom` : il reste des accolades.
- Dans une f-string, Python lit `{{` comme une accolade simple, avant même qu'Airflow voie le fichier.
- `taille_distante` n'affiche rien, et pourtant tout est vert : `curl` n'a trouvé aucun fichier à cette adresse, donc `grep` ne trouve aucune taille.

@@ breakfix-answer
`afficher_nom` affiche `{ params.taxi }_tripdata_{ params.year }-{ params.month }.csv`. Python a transformé chaque `{{` en `{` à la lecture du fichier, et Jinja ne reconnaît plus aucun template. `taille_distante` interroge une adresse absurde : `curl` ne récupère aucun fichier, `grep` ne trouve aucune taille, et la ligne reste vide. Le plus traître : **toutes les tâches restent vertes**, parce que la dernière commande du tuyau (`tail`) réussit toujours. Enlève le `f` : avec Jinja, garde des chaînes normales, et colle-les avec `+`.

@@ explain
Quelle est la différence entre une valeur écrite en dur dans le DAG, un paramètre et un template Jinja ? Explique quand chacun est remplacé par sa vraie valeur.

@@ resources
- [Les templates Jinja dans Airflow](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/operators.html#concepts-jinja-templating)
- [La liste des variables de template](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html)
- [Les paramètres et le formulaire Trigger](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/params.html)

@@ teaser
- [02-07] Ta constante `FICHIER` sert telle quelle dans le pipeline des taxis.
- [02-08] Avec la planification, le mois ne vient plus d'un paramètre mais de la date logique : `{{ logical_date.strftime('%Y-%m') }}`.

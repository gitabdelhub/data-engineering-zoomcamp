# Tâches, dépendances et XCom

Chaque tâche d'Airflow tourne dans son **propre processus**, parfois sur une autre machine. Deux tâches ne partagent donc pas de variables Python : si `telecharger` met un nom de fichier dans une variable, `charger` ne la verra jamais. Pour se passer une information, les tâches utilisent les **XCom** (*cross-communication*).

## Une valeur renvoyée devient un XCom

Avec `@task`, c'est presque invisible : ce que la fonction **renvoie** est enregistré dans la base d'Airflow, et une autre tâche le reçoit **en argument**.

```python
@task
def choisir_ville():
    return "Lyon"

@task
def meteo(ville: str):
    print(f"Je cherche la météo de {ville}")

meteo(choisir_ville())
```

La dernière ligne fait deux choses à la fois : elle crée la dépendance `choisir_ville >> meteo`, et elle branche le XCom de l'une sur l'argument de l'autre. Pas besoin d'écrire `>>`.

Au moment où tu écris `choisir_ville()`, la fonction **ne tourne pas** : tu obtiens une promesse de valeur (un `XComArg`). Elle sera remplacée par la vraie valeur quand `meteo` s'exécutera.

## Une sortie Bash aussi

Un `BashOperator` enregistre la **dernière ligne** affichée par sa commande comme XCom. Pour la donner à une tâche Python, utilise `.output` :

```python
heure = BashOperator(task_id="heure", bash_command="date +%H")

@task
def saluer(h: str):
    print("Bonjour" if int(h) < 18 else "Bonsoir")

saluer(heure.output)
```

## Plusieurs en parallèle, puis tous ensemble

```python
v = choisir_ville()
rapport(meteo(v), trafic(v))
```

`meteo` et `trafic` dépendent de `v` mais pas l'une de l'autre : elles tournent **en parallèle** (le *fan-out*). `rapport` attend les deux (le *fan-in*).

## Où voir un XCom

- Dans un run, clique sur le carré d'une tâche, onglet **Storage**, puis **XCom** : la valeur sous la clé `return_value`.
- Le menu **Browse**, puis **XComs** : tous les XCom de tous les runs.

## Les limites

Un XCom est gardé **dans la base de métadonnées**. Il est fait pour de **petites** valeurs : un nombre, une date, un nom de fichier, une petite liste ou un dictionnaire. Jamais un fichier entier ni un tableau de millions de lignes : la base d'Airflow n'est pas un entrepôt de données.

La règle des data engineers : **les données voyagent par le disque ou le stockage cloud, les XCom transportent seulement leur adresse**. Une tâche écrit le fichier dans `data/`, et renvoie le chemin `data/green_tripdata_2019-01.csv`.

La valeur doit aussi pouvoir être **sérialisée**, c'est-à-dire transformée en texte pour être rangée dans la base : nombres, textes, listes, dictionnaires, dates passent sans problème.

@@ predict
Une tâche `@task` fait `return open("/etc/hostname")` : elle renvoie le fichier ouvert, pour qu'une autre tâche le lise. La fonction elle-même s'exécute-t-elle sans erreur ? Et la tâche, dans Airflow, est-elle verte ou rouge ?

@@ predict-answer
La **fonction** s'exécute sans erreur : ouvrir un fichier est banal. Mais la **tâche** est **rouge** : juste après, Airflow essaie d'enregistrer la valeur renvoyée comme XCom, et un fichier ouvert ne peut pas être transformé en texte. L'erreur arrive après ton code, ce qui la rend surprenante : ton `print` s'affiche, puis la tâche échoue quand même. Tu la verras en vrai dans l'exercice « casser et réparer ».

@@ practice
Écris le DAG `mois_a_charger`, qui prépare la liste des fichiers d'un trimestre en se passant les informations **uniquement** par des XCom.

@@ constraints
- Une tâche `lister_mois` renvoie la liste des trois premiers mois de 2019, au format `2019-01`
- Deux tâches **en parallèle** reçoivent cette liste : `noms_fichiers` renvoie la liste des noms `green_tripdata_2019-01.csv`…, et `compter_mois` renvoie leur nombre
- Une tâche Bash `espace_libre` renvoie l'espace disque libre du conteneur, et une tâche `resume` reçoit les trois résultats et affiche une phrase du type « 3 fichiers à charger : … » et l'espace libre
- Aucune variable globale pour se passer les données, et aucun `>>` : les dépendances viennent seulement des arguments
- Tu retrouves la liste des fichiers dans l'interface, dans l'onglet XCom de `noms_fichiers`

@@ guide
### 1. Le fichier et le DAG

`code dags/mois_a_charger.py`, puis les imports et un `@dag` comme à la leçon 3, avec `dag_id="mois_a_charger"`.

### 2. Une tâche qui renvoie une liste

Une compréhension de liste fabrique les mois. Exemple, pour des numéros de semaine :

~~~python
@task
def lister_semaines():
    return [f"S{n:02d}" for n in range(1, 5)]   # ['S01', 'S02', 'S03', 'S04']
~~~

`{n:02d}` écrit le nombre sur deux chiffres, avec un zéro devant si besoin.

### 3. Des tâches qui reçoivent un argument

Une tâche `@task` qui reçoit une valeur la déclare comme argument, avec son type : `def noms_fichiers(mois: list[str]):`. À l'intérieur, c'est une vraie liste Python.

### 4. La sortie d'une commande Bash

`df -h /opt/airflow` affiche l'espace disque. Teste-la dans le conteneur, puis cherche comment garder seulement la colonne « disponible » de la dernière ligne : `tail -1` garde la dernière ligne, et `awk '{print $4}'` la quatrième colonne. Dans le DAG, la tâche Bash se branche sur `resume` avec `.output`.

### 5. Relie tout par les appels

Garde le résultat de `lister_mois()` dans une variable, et passe-la aux **deux** tâches suivantes. Puis passe leurs résultats, et le `.output` de la tâche Bash, à `resume`. Une seule ligne suffit pour les trois derniers branchements.

### 6. Lance et regarde les XCom

`airflow dags test mois_a_charger`, puis dans l'interface : un run depuis le bouton ▷, puis le carré de `noms_fichiers`, onglet **Storage**, puis **XCom**.

@@ hints
- `mois = lister_mois()` ne lance rien : `mois` est une promesse. Tu peux la passer à plusieurs tâches, chacune recevra la même liste.
- `resume(noms_fichiers(mois), compter_mois(mois), espace.output)` crée toutes les dépendances d'un coup.
- Si `resume` reçoit `None` pour l'espace disque, ta commande Bash n'affiche rien sur sa dernière ligne : teste-la seule dans le conteneur.

@@ solution
~~~python
from datetime import datetime

from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import dag, task


@dag(dag_id="mois_a_charger", start_date=datetime(2026, 1, 1), schedule=None, catchup=False, tags=["module-02"])
def mois_a_charger():
    @task
    def lister_mois():
        # La valeur renvoyée devient un XCom, gardé dans la base d'Airflow
        return [f"2019-{m:02d}" for m in range(1, 4)]

    @task
    def noms_fichiers(mois: list[str]):
        return [f"green_tripdata_{m}.csv" for m in mois]

    @task
    def compter_mois(mois: list[str]):
        return len(mois)

    @task
    def resume(fichiers: list[str], n: int, espace: str):
        print(f"{n} fichiers à charger : {', '.join(fichiers)}")
        print(f"Espace libre : {espace}")

    # La dernière ligne affichée par la commande devient le XCom de la tâche
    espace = BashOperator(task_id="espace_libre", bash_command="df -h /opt/airflow | tail -1 | awk '{print $4}'")

    mois = lister_mois()  # une promesse : la vraie liste arrivera à l'exécution
    # noms_fichiers et compter_mois dépendent de mois, pas l'une de l'autre : elles tournent en parallèle
    resume(noms_fichiers(mois), compter_mois(mois), espace.output)


mois_a_charger()
~~~

Le log de `resume` affiche :

~~~text
3 fichiers à charger : green_tripdata_2019-01.csv, green_tripdata_2019-02.csv, green_tripdata_2019-03.csv
Espace libre : 18G
~~~

L'espace libre dépend de ton Codespace.

@@ selfcheck
- Dans la vue en graphe du DAG (deuxième icône en haut de la grille), `noms_fichiers` et `compter_mois` sont côte à côte
- L'onglet XCom de `noms_fichiers` montre la liste des trois noms
- Mon fichier ne contient aucun `>>`

@@ breakfix
Ajoute à ton DAG une tâche `@task` nommée `ouvrir`, qui fait `print("j'ouvre")` puis `return open("/etc/hostname")`, et appelle-la dans le DAG. Lance `airflow dags test mois_a_charger`. Trouve le message d'erreur exact, explique-le, puis corrige `ouvrir` pour qu'elle renvoie quelque chose d'utile à la place.

@@ breakfix-hints
- Cherche `Error` dans la sortie : l'erreur arrive **après** ton `print`.
- Le message commence par `TypeError: Cannot serialize object of type`. Quel type ?
- Un fichier ouvert ne peut pas voyager entre deux tâches. Mais son **contenu**, un simple texte, le peut : `open(...).read()`. Ou mieux, son **chemin**.

@@ breakfix-answer
La tâche affiche `j'ouvre`, puis échoue :

~~~text
TypeError: Cannot serialize object of type <class '_io.TextIOWrapper'>.
~~~

Ta fonction a bien marché, c'est l'**enregistrement du XCom** qui échoue : Airflow doit transformer la valeur renvoyée en texte pour la ranger dans sa base, et un fichier ouvert (`TextIOWrapper`) n'a pas de forme texte. Corrige en renvoyant le contenu (`return open("/etc/hostname").read().strip()`) ou simplement le chemin (`return "/etc/hostname"`) : la tâche suivante ouvrira le fichier elle-même. C'est la règle de la leçon : les XCom transportent des adresses, pas des données.

@@ explain
Pourquoi deux tâches Airflow ne peuvent-elles pas se partager une variable Python ? Et pourquoi passe-t-on le **chemin** d'un fichier plutôt que son contenu ?

@@ resources
- [Les XCom (documentation officielle)](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/xcoms.html)
- [TaskFlow : passer des données entre tâches](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html)

@@ teaser
- [02-07] Dans le pipeline des taxis, le nom du fichier passe de tâche en tâche, et le fichier lui-même reste dans le dossier `data/`.

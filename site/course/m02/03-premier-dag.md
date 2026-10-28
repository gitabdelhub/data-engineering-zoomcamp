# Ton premier DAG

Un DAG Airflow est un **fichier Python** posé dans le dossier `dags/`. Airflow le lit tout seul, l'affiche dans l'interface, et l'exécute quand tu le demandes. Voici un DAG complet, avec deux tâches :

```python
from datetime import datetime

from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import dag, task


@dag(
    dag_id="premier_dag",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["module-02"],
)
def premier_dag():
    dire_bonjour = BashOperator(
        task_id="dire_bonjour",
        bash_command="echo 'Bonjour depuis Airflow' && date",
    )

    @task
    def compter():
        total = sum(range(10))
        print(f"La somme vaut {total}")
        return total

    dire_bonjour >> compter()


premier_dag()
```

## Ligne par ligne

| Ligne | Ce qu'elle fait |
| --- | --- |
| `from airflow.sdk import dag, task` | Le **Task SDK** d'Airflow 3 : tout ce qu'il faut pour écrire des DAGs. Les tutoriels pour Airflow 2 écrivent `from airflow.decorators import ...` : c'est l'ancienne adresse |
| `from airflow.providers.standard...` | Les opérateurs viennent de paquets appelés **providers**. `standard` contient les plus courants, comme `BashOperator` |
| `@dag(...)` | Transforme la fonction en DAG |
| `dag_id` | Le nom du DAG dans l'interface. Unique |
| `start_date` | La date à partir de laquelle le DAG existe. Obligatoire dès qu'il a une planification |
| `schedule=None` | Pas de planification : le DAG se lance seulement quand tu le demandes |
| `catchup=False` | Ne rattrape pas les dates passées (leçon 8) |
| `tags` | Des étiquettes pour filtrer la liste des DAGs |
| `BashOperator(task_id=..., bash_command=...)` | Une tâche qui lance une commande shell. `task_id` est son nom, unique dans le DAG |
| `@task` | Une fonction Python devient une tâche. Son nom est celui de la fonction |
| `dire_bonjour >> compter()` | `compter` commence quand `dire_bonjour` a réussi. Remarque les parenthèses : appeler une fonction `@task` **crée** la tâche |
| `premier_dag()` | **Appelle** la fonction du DAG. Sans cette dernière ligne, le DAG n'existe pas |

## Quand Airflow voit-il ton fichier ?

Le service **dag-processor** relit le dossier `dags/` régulièrement :

- un fichier **modifié** est relu en moins d'une minute ;
- un **nouveau** fichier peut mettre jusqu'à **5 minutes** à apparaître.

Pour ne pas attendre, force la lecture :

```bash
docker compose exec airflow-scheduler airflow dags reserialize
```

`docker compose exec <service> <commande>` lance une commande **dans** un conteneur qui tourne déjà. Ici, la commande `airflow` du conteneur du scheduler.

## Lancer un DAG

**Dans l'interface** : page **Dags**. Chaque DAG a, à droite, un **interrupteur** (en pause ou actif) et un bouton ▷ pour le déclencher. Un nouveau DAG est **en pause** : c'est le réglage du compose. Le bouton ▷ ouvre une fenêtre **Trigger Dag** ; la case « Unpause on trigger » le sort de pause en même temps. Clique ensuite sur le nom du DAG : la **grille** à gauche montre une colonne par run et un carré par tâche. Vert : réussi. Rouge : échec. Clique sur un carré, puis sur l'onglet **Logs**.

**Dans le terminal** : `airflow dags test` exécute tout le DAG **tout de suite**, dans ton terminal, avec les logs qui défilent. C'est le meilleur outil pour mettre au point un DAG.

```bash
docker compose exec airflow-scheduler airflow dags test premier_dag
```

## Les commandes à connaître

Toutes se lancent avec `docker compose exec airflow-scheduler` devant.

| Commande | À quoi elle sert |
| --- | --- |
| `airflow dags list` | La liste des DAGs qu'Airflow connaît |
| `airflow dags list-import-errors` | Les fichiers qu'Airflow n'arrive pas à lire, avec l'erreur |
| `airflow dags reserialize` | Relire tout le dossier `dags/` maintenant |
| `airflow dags test <dag_id>` | Exécuter tout le DAG dans le terminal |
| `airflow tasks test <dag_id> <task_id>` | Exécuter une seule tâche, sans enregistrer son état |

Une erreur d'import peut rester affichée un moment après que tu as supprimé le fichier fautif : Airflow nettoie sa liste d'erreurs lors de ses relectures. Regarde surtout le **nom du fichier** dans l'erreur.

@@ codespaces
- Lance ces commandes depuis ton dossier `mon-travail/module-02/airflow/` : `docker compose` cherche le `docker-compose.yaml` du dossier où tu es.
- Tu écris tes DAGs dans l'éditeur de ton Codespace, dans `dags/`. Ce dossier est monté dans les conteneurs : Airflow voit tes fichiers sans rien copier.

@@ predict
Tu enregistres un nouveau fichier `dags/essai.py` qui contient un DAG correct, mais tu as oublié la dernière ligne, l'appel `essai()`. Que montre l'interface après `airflow dags reserialize` : le DAG, une erreur d'import, ou rien du tout ?

@@ predict-answer
**Rien du tout.** Le fichier est du Python valide, donc pas d'erreur d'import. Mais la fonction décorée par `@dag` n'est jamais appelée : aucun DAG n'est créé. C'est un des pièges les plus déroutants pour débuter, justement parce qu'aucun message ne te prévient. Tu le provoqueras dans l'exercice « casser et réparer ».

@@ practice
Écris ton propre DAG, `journal`, dans `dags/journal.py`, et lance-le de deux façons.

@@ constraints
- `dag_id="journal"`, le tag `module-02`, lancé seulement à la main
- Une tâche Bash `date_du_jour` qui affiche la date du jour
- Une tâche Bash `compter_dags` qui affiche combien de fichiers `.py` il y a dans le dossier des DAGs **du conteneur** (`/opt/airflow/dags`)
- Une tâche Python `bilan` qui affiche une phrase, et qui commence seulement quand **les deux** tâches Bash ont réussi. Les deux tâches Bash tournent en parallèle
- Un run vert lancé depuis l'interface, et un run lancé avec `airflow dags test`

@@ guide
### 1. Crée le fichier

Depuis `mon-travail/module-02/airflow/` :

~~~bash
code dags/journal.py
~~~

### 2. Les imports et le décorateur

Reprends les deux lignes d'import de l'exemple de la leçon, puis le bloc `@dag(...)`. Change le `dag_id`, et garde `schedule=None` : le DAG ne se lance qu'à la main. Juste en dessous, `def journal():` ouvre la fonction qui contiendra les tâches.

### 3. Les deux tâches Bash

Un `BashOperator` prend un `task_id` et une `bash_command`. Exemple, sur une autre commande :

~~~python
espace = BashOperator(task_id="espace_disque", bash_command="df -h /")
~~~

Pour la date, la commande `date` suffit. Pour compter des fichiers, deux commandes reliées par un tuyau : `ls` liste les fichiers, `wc -l` compte les lignes qu'on lui donne. Teste ta commande dans le conteneur avant de l'écrire dans le DAG :

~~~bash
docker compose exec airflow-scheduler bash -c "ls /opt/airflow/dags"
~~~

### 4. La tâche Python

Une fonction décorée par `@task`, **dans** la fonction du DAG, qui fait un `print`. Ce qu'elle affiche apparaîtra dans les logs de la tâche.

### 5. Les dépendances

Pour dire « c commence quand a **et** b ont réussi », mets a et b dans une liste :

~~~python
[telecharger, nettoyer] >> publier()
~~~

N'oublie pas les parenthèses pour une tâche `@task`.

### 6. La dernière ligne

Hors de la fonction, tout en bas, sans indentation : `journal()`.

### 7. Fais-le lire par Airflow

~~~bash
docker compose exec airflow-scheduler airflow dags reserialize
docker compose exec airflow-scheduler airflow dags list-import-errors
~~~

La deuxième commande doit répondre `No data found`. Sinon, elle affiche ton erreur avec son numéro de ligne.

### 8. Lance-le depuis l'interface

Page **Dags**, ligne `journal`, bouton ▷, puis **Trigger**. Clique sur `journal` : les carrés deviennent verts en quelques secondes. Ouvre le carré de `compter_dags`, onglet **Logs** : le nombre de fichiers est dans le log.

### 9. Lance-le depuis le terminal

~~~bash
docker compose exec airflow-scheduler airflow dags test journal
~~~

Les logs des trois tâches défilent, et la dernière ligne dit `DagRun Finished` avec `state=success`.

@@ hints
- Si ton DAG n'apparaît pas après `reserialize`, lance `airflow dags list-import-errors`. Si ce n'est pas une erreur d'import, vérifie la dernière ligne du fichier.
- Pour compter les fichiers Python : `ls /opt/airflow/dags/*.py | wc -l`. Le chemin est celui **du conteneur**, pas de ton Codespace.
- Une liste à gauche de `>>` veut dire « toutes ces tâches avant ». `[a, b] >> c()` crée exactement la forme demandée.

@@ solution
~~~python
from datetime import datetime

from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import dag, task


@dag(dag_id="journal", start_date=datetime(2026, 1, 1), schedule=None, catchup=False, tags=["module-02"])
def journal():
    # Deux tâches Bash indépendantes : Airflow les lance en même temps
    date_du_jour = BashOperator(task_id="date_du_jour", bash_command="date '+%A %d %B %Y'")
    # Le chemin est celui du conteneur, où ton dossier dags/ est monté
    compter_dags = BashOperator(task_id="compter_dags", bash_command="ls /opt/airflow/dags/*.py | wc -l")

    @task
    def bilan():
        print("Les deux premières tâches ont réussi : le journal est à jour.")

    # bilan() crée la tâche ; la liste veut dire « les deux avant »
    [date_du_jour, compter_dags] >> bilan()


journal()  # sans cet appel, le DAG n'existe pas
~~~

La date s'affiche en anglais (`Wednesday 28 October 2026`) : le conteneur d'Airflow est réglé en anglais. Ce n'est pas une erreur.

@@ selfcheck
- `journal` apparaît dans la page Dags, sans erreur d'import
- Dans la grille, `date_du_jour` et `compter_dags` ont démarré en même temps, et `bilan` après
- `airflow dags test journal` se termine par `state=success`

@@ team
Ton premier DAG mérite la routine d'équipe : une branche `module-02/premier-dag`, un commit avec `dags/journal.py`, une pull request dans ton fork. Fais-la relire par un camarade, ou relis-toi toi-même dans l'onglet Files changed, ligne par ligne, avant de fusionner.

@@ breakfix
Copie ton DAG : `cp dags/journal.py dags/journal2.py`. Dans la copie, change le `dag_id` en `journal2`, puis **supprime la dernière ligne**, l'appel `journal()`. Lance `reserialize`, puis `list-import-errors`, puis `airflow dags list`. Où est `journal2` ? Pourquoi aucune erreur ne s'affiche ? Répare, puis supprime la copie.

@@ breakfix-hints
- `list-import-errors` ne signale rien de nouveau : Python n'a trouvé aucune erreur dans ton fichier.
- `@dag` prépare un DAG, mais c'est l'**appel** de la fonction qui le crée.
- Pour réparer, ajoute l'appel en bas du fichier. Attention : la fonction s'appelle toujours `journal` dans la copie, seul le `dag_id` a changé.

@@ breakfix-answer
`journal2` **n'apparaît jamais**, et **aucune erreur** n'est signalée : le fichier est du Python correct. Le décorateur `@dag` transforme ta fonction en « fabrique de DAG », et c'est l'appel `journal()` qui fabrique vraiment le DAG. Sans appel, le dag-processor lit le fichier et n'y trouve aucun DAG. Quand tu remets `journal()` en bas, `journal2` apparaît. Supprime ensuite la copie avec `rm dags/journal2.py`.

Retiens : un DAG qui n'apparaît pas, c'est soit une **erreur d'import** (visible avec `list-import-errors`, et un badge rouge à côté du nombre de DAGs dans l'interface), soit un **appel oublié** (invisible).

@@ explain
Explique ce qui se passe entre le moment où tu enregistres `dags/journal.py` dans ton Codespace et le moment où les carrés deviennent verts : quels services d'Airflow interviennent, et dans quel ordre ?

@@ resources
- [Le tutoriel officiel : écrire ton premier DAG](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/fundamentals.html)
- [Le tutoriel TaskFlow (les fonctions @task)](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html)
- [La liste des commandes airflow](https://airflow.apache.org/docs/apache-airflow/stable/cli-and-env-variables-ref.html)

@@ declic
- [01-02] Une tâche `@task`, c'est une fonction Python ordinaire, comme celles de ton `pipeline.py` du module 1. Airflow ajoute autour : l'ordre, les logs, la relance.

@@ teaser
- [02-04] Ta fonction `compter` renvoie un nombre. Où va-t-il ? Une autre tâche peut le récupérer : ce sont les XCom.

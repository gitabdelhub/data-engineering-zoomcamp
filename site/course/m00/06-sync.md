# Synchroniser ton fork, à la main puis automatiquement

Le repo officiel continue d'évoluer : corrections, nouvelles versions d'outils, nouveaux homework. Ton fork, lui, ne bouge pas tout seul. Il faut le **synchroniser**.

## Les deux « remotes »

Un **remote** est une adresse de repo distant que Git connaît.

| Remote | Adresse | Rôle |
| --- | --- | --- |
| `origin` | ton fork `gitabdelhub/data-engineering-zoomcamp` | Là où tu pousses ton travail |
| `upstream` | le repo officiel `DataTalksClub/data-engineering-zoomcamp` | Là d'où viennent les nouveautés du cours |

Par défaut, ton Codespace ne connaît que `origin`. Tu peux le vérifier avec `git remote -v`.

## La synchronisation à la main

Le principe, en trois temps :

1. **Récupérer** les nouveautés du repo officiel (`git fetch`) : elles arrivent dans `upstream/main`, sans toucher à tes fichiers.
2. **Fusionner** `upstream/main` dans ta branche `main` (`git merge`).
3. **Pousser** le résultat sur ton fork (`git push`).

Sur GitHub, le bouton **Sync fork** de la page de ton fork fait la même chose, directement sur GitHub.

## L'automatiser avec GitHub Actions

**GitHub Actions** exécute des tâches automatiques, décrites dans des fichiers YAML rangés dans `.github/workflows/`. Un workflow contient :

- **`on:`** : quand il se lance. Par exemple à chaque push, sur un planning (`schedule` avec une expression **cron**), ou à la main (`workflow_dispatch`).
- **`permissions:`** : ce que le workflow a le droit de faire sur le repo.
- **`jobs:`** : une ou plusieurs tâches, chacune avec des **steps** (des commandes ou des actions toutes faites).

Chaque workflow reçoit automatiquement un jeton d'accès, `GITHUB_TOKEN`, limité au repo et aux `permissions` déclarées. L'outil en ligne de commande `gh` est déjà installé sur les machines de GitHub Actions, et il sait synchroniser un fork.

C'est exactement le même outil que celui qu'on utilise en data engineering pour le **CI** : lancer les tests à chaque pull request, vérifier le code, déployer. Tu le reverras au module 4 avec dbt.

## Une expression cron

Cinq champs : `minute heure jour-du-mois mois jour-de-la-semaine`, en heure UTC.

| Expression | Signification |
| --- | --- |
| `0 3 * * *` | Tous les jours à 3 h 00 UTC |
| `30 6 * * 1` | Tous les lundis à 6 h 30 UTC |
| `0 */6 * * *` | Toutes les 6 heures |

[crontab.guru](https://crontab.guru) permet de tester une expression.

## Quand la synchro peut bloquer

- Si tu as modifié un fichier du cours et que le repo officiel modifie les mêmes lignes : conflit. C'est pour éviter ça que ton travail va dans `mon-travail/`.
- Si le repo officiel modifie un fichier dans `.github/workflows/`, le `GITHUB_TOKEN` n'a pas le droit de l'écrire. Tu le verras à l'étape « Casser et réparer ».

@@ predict
Le repo officiel corrige une faute dans la leçon `01-docker-terraform/04-postgres-docker.md`. Sans que tu fasses rien, ton site affiche-t-il la correction ? Et le fichier dans ton Codespace ?

@@ predict-answer
**Ni l'un ni l'autre.** Il faut d'abord que ton fork sur GitHub récupère la correction (la synchronisation). Pages republie alors le site avec la nouvelle leçon. Ton Codespace, lui, est une copie de plus : il ne la voit qu'après un `git pull`. Trois copies, trois mises à jour : repo officiel, puis ton fork, puis ton Codespace.

@@ practice
D'abord, synchronise ton fork **à la main** depuis ton Codespace pour comprendre le mécanisme. Ensuite, écris un workflow GitHub Actions qui le fait **tout seul**.

@@ constraints
- À la main : le remote `upstream` pointe vers le repo de DataTalksClub, et tu as vu combien de commits ton fork avait de retard avant de fusionner (zéro, c'est possible : le badge « Fork à jour » en haut du site te le dit)
- Le workflow est dans `.github/workflows/sync-fork.yml` et s'appelle « Synchroniser le fork »
- Il se lance tout seul chaque nuit **et** il a un bouton pour le lancer à la main
- Il déclare seulement les permissions dont il a besoin
- Après la synchro, il demande à GitHub Pages de reconstruire le site
- Tu l'as lancé à la main depuis l'onglet Actions, et il est vert

@@ guide
### 1. Ajoute le remote upstream

Regarde d'abord les remotes que ton Codespace connaît : `git remote -v`. Tu ne vois que `origin`, ton fork. Ajoute le repo officiel sous le nom `upstream` :

~~~bash
git remote add upstream https://github.com/DataTalksClub/data-engineering-zoomcamp.git
~~~

Relance `git remote -v` : les deux apparaissent maintenant.

### 2. Compte ton retard

Pars de ton fork à jour (`git switch main` puis `git pull`). Ensuite, `git fetch upstream` télécharge les nouveautés du repo officiel **sans toucher à tes fichiers**. Pour voir les commits que le repo officiel a et que ton `main` n'a pas :

~~~bash
git log --oneline main..upstream/main
~~~

Lis `main..upstream/main` comme « ce qui est dans `upstream/main` mais pas dans `main` ». Une ligne par commit qui te manque. Rien du tout : ton fork est à jour, c'est possible.

### 3. Fusionne et pousse

`git merge` suivi du nom de la branche à fusionner, ici `upstream/main`. Ajoute `--no-edit` pour garder le message de fusion automatique, sinon Git ouvre un éditeur de texte dans le terminal. Puis `git push` envoie le résultat sur ton fork.

### 4. Comprends un workflow sur un exemple

Voici un autre workflow, qui n'a rien à voir avec la synchro. Il dit bonjour tous les lundis à 8 h UTC, et il a un bouton pour le lancer à la main :

~~~yaml
name: Dire bonjour

on:
  schedule:
    - cron: "0 8 * * 1"     # tous les lundis à 8 h UTC
  workflow_dispatch:         # le bouton « Run workflow »

permissions:
  contents: read             # il lit le repo, rien de plus

jobs:
  bonjour:
    runs-on: ubuntu-latest   # une machine Linux fournie par GitHub
    steps:
      - name: Afficher un message
        run: echo "Bonjour $REPO"
        env:
          REPO: ${{ github.repository }}
~~~

En YAML, **l'indentation compte** : deux espaces par niveau, jamais de tabulation. Une ligne mal décalée et GitHub refuse le fichier.

### 5. Écris le tien

Crée `.github/workflows/sync-fork.yml` à la racine du fork (`code .github/workflows/sync-fork.yml`). Pars de la structure de l'exemple, puis change :

- le `name` : « Synchroniser le fork » ;
- le planning : chaque nuit, à l'heure de ton choix ;
- les permissions : écrire dans le repo (`contents`) et reconstruire le site (`pages`) ;
- un premier step qui lance `gh repo sync` sur ton repo, branche `main`. `gh` a besoin d'un jeton : passe-lui `${{ secrets.GITHUB_TOKEN }}` dans la variable d'environnement `GH_TOKEN` ;
- un deuxième step qui appelle l'API de Pages avec `gh api` (la route est dans les indices).

### 6. Pousse et lance-le à la main

Commite et pousse le fichier, par une branche et une PR comme d'habitude, ou directement sur `main`. Puis, sur GitHub : onglet **Actions**, ton workflow dans la liste de gauche, bouton **Run workflow**. Clique sur l'exécution qui démarre pour voir chaque step. Au vert ✓, c'est gagné. Au rouge ✗, ouvre le step en échec : la dernière ligne dit ce qui ne va pas.

@@ hints
- À la main : `git remote add upstream <url>`, puis `git fetch upstream`. Pour compter le retard : `git log --oneline main..upstream/main`. Avant de fusionner, fais un `git pull` pour partir de ton fork à jour.
- Dans le workflow : la commande `gh repo sync` sait synchroniser un fork. Elle a besoin d'un jeton dans la variable d'environnement `GH_TOKEN`, et le nom de ton repo est disponible dans `github.repository`.
- Pour Pages : l'API REST a une route `POST /repos/{owner}/{repo}/pages/builds`, que `gh api` peut appeler. Les permissions à déclarer sont `contents` (écriture) et `pages` (écriture).
- Si l'onglet Actions de ton fork affiche un message disant que les workflows sont désactivés sur ce fork, clique sur le bouton pour les activer.

@@ solution
À la main :
~~~bash
# Faire connaître le repo officiel à Git, sous le nom upstream
git remote add upstream https://github.com/DataTalksClub/data-engineering-zoomcamp.git
git switch main
git pull                                  # d'abord, ce qui est déjà sur ton fork
git fetch upstream                        # télécharger les nouveautés, sans toucher aux fichiers
git log --oneline main..upstream/main     # les commits qui te manquent
git merge --no-edit upstream/main         # les fusionner ; --no-edit : message automatique
git push                                  # envoyer le résultat sur ton fork
~~~

Le workflow `.github/workflows/sync-fork.yml` :
~~~yaml
name: Synchroniser le fork

on:
  schedule:
    - cron: "0 3 * * *"     # chaque nuit à 3 h UTC
  workflow_dispatch:         # bouton « Run workflow »

permissions:
  contents: write
  pages: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Récupérer les nouveautés du repo officiel
        # gh repo sync met ton fork au niveau du repo dont il est issu
        run: gh repo sync "$REPO" --branch main
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
      - name: Reconstruire le site
        # un push fait par GITHUB_TOKEN ne relance pas Pages : on le demande à l'API
        run: gh api -X POST "repos/$REPO/pages/builds"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
~~~

@@ verify
syncWorkflow

@@ selfcheck
- `git remote -v` montre `origin` et `upstream`
- Dans l'onglet Actions, « Synchroniser le fork » a un passage vert lancé à la main
- J'ai lu les logs de chaque étape du workflow

@@ breakfix
Dans ton workflow, remplace `contents: write` par `contents: read`, pousse, et lance-le à la main. Il échoue. Lis les logs, explique l'erreur, puis remets le bon réglage.

@@ breakfix-hints
- Clique sur le passage rouge, puis sur l'étape en échec : le message de `gh` est en bas.
- Le message parle d'une ressource « not accessible by integration » : l'« integration », c'est le jeton du workflow.
- Le jeton n'a que les droits déclarés dans `permissions`. Une synchro écrit des commits sur ta branche : de quel droit a-t-elle besoin ?

@@ breakfix-answer
Avec `contents: read`, le jeton peut lire le repo mais pas y écrire de commits : l'API refuse avec une erreur 403. Le principe s'appelle le **moindre privilège** : un workflow ne reçoit que les droits dont il a besoin, pour limiter les dégâts si quelque chose tourne mal. Un autre cas à connaître : si le repo officiel modifie un jour un fichier de `.github/workflows/`, la synchro échouera aussi, car le `GITHUB_TOKEN` n'a jamais le droit de modifier des workflows. Il faudra alors synchroniser avec le bouton **Sync fork** de GitHub, ou utiliser un jeton personnel.

@@ explain
Explique ce que fait ton workflow, étape par étape : quand il se lance, avec quels droits, et ce qui se passe jusqu'à la mise en ligne de ton site.

@@ resources
- [La syntaxe des workflows GitHub Actions](https://docs.github.com/fr/actions/writing-workflows/workflow-syntax-for-github-actions)
- [Les permissions du GITHUB_TOKEN](https://docs.github.com/fr/actions/security-for-github-actions/security-guides/automatic-token-authentication)
- [La commande gh repo sync](https://cli.github.com/manual/gh_repo_sync)
- [Synchroniser un fork (documentation GitHub)](https://docs.github.com/fr/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)

@@ teaser
- [02] Airflow, l'orchestrateur du module 2, planifie ses DAG avec la même syntaxe `cron` que ta synchro de nuit.
- [04] Le même GitHub Actions lancera les tests de tes modèles dbt à chaque pull request : ta première vraie CI.

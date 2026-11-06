# Revenir en arrière et ignorer des fichiers

Le vrai pouvoir de Git : tu peux toujours revenir en arrière. Encore faut-il savoir **ce que** tu veux annuler. Cette leçon range les cas les plus courants, puis t'apprend à dire à Git ce qu'il ne doit jamais photographier.

## 🔑 HEAD : « tu es ici »

**HEAD** est un repère : il montre le commit sur lequel tu travailles. D'habitude, HEAD pointe sur une branche (`HEAD -> main`), qui pointe sur le dernier commit. Dans le Labo Git, c'est l'étiquette noire `HEAD →`.

Tu peux désigner les commits d'avant à partir de HEAD : `HEAD~1` est le parent de HEAD, `HEAD~2` le grand-parent. Ou avec leur identifiant : `git show 5b7a0d3`.

## 🔑 Quelle commande pour quelle situation ?

| Ta situation | La commande | Ce qui se passe |
| --- | --- | --- |
| J'ai abîmé un fichier, je veux revenir à la dernière photo | `git restore fichier` | Le fichier redevient comme dans le dernier commit. Tes modifications sont **perdues** |
| J'ai fait `git add` sur le mauvais fichier | `git restore --staged fichier` | Le fichier sort de la zone de préparation. Ton fichier ne change pas |
| Je veux regarder une ancienne version | `git switch --detach 5b7a0d3` | Ton dossier montre cette ancienne photo. Pour revenir : `git switch main` |
| Je veux annuler un commit, même ancien | `git revert 5b7a0d3` | Git crée un **nouveau** commit qui fait l'inverse. L'historique garde tout |
| Mon dernier commit, pas encore partagé, est à corriger | `git commit --amend` | Le dernier commit est remplacé (leçon précédente) |

La règle d'or : **`git revert` ne réécrit pas l'historique**, il ajoute un commit. C'est la façon sûre d'annuler quelque chose qui a déjà été partagé avec ton équipe.

## 🔑 Ce qu'on ne commite jamais

- **Les secrets** : mots de passe, clés de compte de service Google Cloud (`*.json`), fichiers `.env`.
- **Les fichiers générés ou lourds** : données (`*.csv`, `*.parquet`), environnements virtuels Python (`.venv/`), états Terraform (`*.tfstate`), fichiers de log.

Une fois commité, un secret reste dans l'historique, même si tu supprimes le fichier au commit suivant. Et une fois poussé sur GitHub, il faut le considérer comme **public**.

## 🔑 Le fichier `.gitignore`

Tu listes dans un fichier texte nommé `.gitignore` ce que Git doit faire semblant de ne pas voir. Une règle par ligne :

| Règle | Ce qu'elle ignore |
| --- | --- |
| `.env` | Le fichier `.env`, dans ce dossier et tous les sous-dossiers |
| `*.csv` | Tous les fichiers qui finissent par `.csv` (`*` veut dire « n'importe quel nom ») |
| `.venv/` | Le dossier `.venv` entier (le `/` final veut dire « un dossier ») |
| `# ma note` | Rien : une ligne qui commence par `#` est un commentaire |

Le `.gitignore` lui-même, on le commite : toute l'équipe profite des mêmes règles. Attention, il n'agit que sur les fichiers **pas encore suivis**. Un fichier déjà commité reste suivi, même si tu ajoutes une règle.

@@ essentiel
**En une image.** Git est un bouton « annuler » pour ton dossier, mais avec plusieurs boutons. Le tout est de savoir **ce que** tu veux annuler.

| Ta situation | Tu tapes |
| --- | --- |
| J'ai abîmé un fichier, je reviens au dernier commit | `git restore fichier` |
| J'ai fait `git add` sur le mauvais fichier | `git restore --staged fichier` |
| Je veux annuler un commit, même ancien ou déjà partagé | `git revert <identifiant>` |
| Git ne doit jamais voir certains fichiers | une règle par ligne dans `.gitignore` |

📌 **À retenir :** `git revert` n'efface rien : il ajoute un commit qui fait l'inverse. C'est la façon sûre d'annuler en équipe.

📌 **À retenir :** un `.gitignore` typique contient `.env`, `*.csv`, `.venv/` et `*.log`. Le `.gitignore` lui-même, on le commite.

⚠️ **Attention :** `git restore fichier` jette tes modifications pour de bon. Et un secret commité reste dans l'historique : écris le `.gitignore` **avant** le premier commit.

@@ labo
{
  "id": "00-05",
  "niveaux": [
    {
      "titre": "Annuler une modification ratée",
      "intro": "Ton fichier `notes.txt` était propre au dernier commit. Puis tu l'as écrasé par erreur : clique dessus dans le dessin pour voir les dégâts. Remets-le exactement comme dans le dernier commit.",
      "depart": ["git init", "echo 'Ma version propre' > notes.txt", "git add notes.txt", "git commit -m 'Ajoute mes notes'", "echo 'oups, tout effacé' > notes.txt"],
      "buts": ["file:notes.txt~Ma version propre | `notes.txt` contient de nouveau « Ma version propre »", "clean | Plus aucune modification en attente"],
      "indices": ["`git status` te propose lui-même la commande, entre parenthèses.", "`git restore notes.txt`"],
      "solution": ["git status", "git restore notes.txt", "cat notes.txt"]
    },
    {
      "titre": "Le .gitignore",
      "intro": "Ce nouveau projet contient un secret (`.env`), des données (`trajets.csv`) et un journal (`debug.log`). Écris un `.gitignore` qui les ignore tous les trois, puis commite tout le reste d'un coup avec `git add .`. Regarde les étiquettes IGNORÉ apparaître.",
      "depart": ["git init", "echo 'print(1)' > pipeline.py", "echo 'PASSWORD=1234' > .env", "echo 'id,km' > trajets.csv", "echo 'debug' > debug.log"],
      "buts": ["ignored:.env | `.env` est ignoré", "ignored:trajets.csv | Les fichiers `.csv` sont ignorés", "ignored:debug.log | Les fichiers `.log` sont ignorés", "committed:.gitignore | Le `.gitignore` est commité", "committed:pipeline.py | `pipeline.py` est commité", "notcommitted:.env | Le secret n'est dans aucun commit"],
      "indices": ["Une règle par ligne. Dans le labo : `echo '.env' > .gitignore` crée le fichier, puis `echo '*.csv' >> .gitignore` ajoute une ligne.", "Après les trois règles : `git status` (le secret a disparu de la liste), puis `git add .` et `git commit -m \"...\"`."],
      "solution": ["echo '.env' > .gitignore", "echo '*.csv' >> .gitignore", "echo '*.log' >> .gitignore", "git status", "git add .", "git commit -m 'Premier commit avec .gitignore'"]
    },
    {
      "titre": "Sortir un fichier de la zone de préparation",
      "intro": "Tu as tapé `git add .` trop vite : `motdepasse.txt` est parti dans la zone de préparation avec `notes.txt`. Retire **seulement** `motdepasse.txt` de la zone de préparation (sans supprimer le fichier), puis commite `notes.txt` seul.",
      "depart": ["git init", "echo 'Mes notes' > notes.txt", "git add notes.txt", "git commit -m 'Ajoute mes notes'", "echo 'Une note de plus' >> notes.txt", "echo 'PASSWORD=1234' > motdepasse.txt", "git add ."],
      "buts": ["committed:notes.txt~Une note de plus | La nouvelle note est dans un commit", "notcommitted:motdepasse.txt | `motdepasse.txt` n'est dans aucun commit", "file:motdepasse.txt | Le fichier existe toujours sur ton disque"],
      "indices": ["`git status` montre la commande pour « unstage » un fichier.", "`git restore --staged motdepasse.txt`, puis un commit."],
      "solution": ["git status", "git restore --staged motdepasse.txt", "git status", "git commit -m 'Ajoute une note'"],
      "bonus": true
    },
    {
      "titre": "Voyager dans le temps",
      "intro": "`recette.txt` a changé trois fois. Va voir à quoi il ressemblait au **tout premier** commit, lis-le, puis reviens sur `main`. Regarde l'étiquette `HEAD` quitter la branche, puis y revenir.",
      "depart": ["git init", "echo 'Recette : des pâtes' > recette.txt", "git add recette.txt", "git commit -m 'Première recette'", "echo 'Recette : des pâtes au pesto' > recette.txt", "git commit -am 'Ajoute le pesto'", "echo 'Recette : des pâtes au pesto et au parmesan' > recette.txt", "git commit -am 'Ajoute le parmesan'"],
      "buts": ["cmd:git switch --detach or cmd:git checkout | Tu es allé voir un ancien commit", "cmd:cat recette.txt | Tu as lu l'ancienne recette", "on:main | Tu es revenu sur `main`"],
      "indices": ["`git log --oneline` donne les identifiants. Le premier commit est en bas. `HEAD~2` le désigne aussi.", "`git switch --detach HEAD~2`, puis `cat recette.txt`, puis `git switch main`."],
      "solution": ["git log --oneline", "git switch --detach HEAD~2", "cat recette.txt", "git switch main"],
      "bonus": true
    },
    {
      "titre": "Annuler un vieux commit avec revert",
      "intro": "Au deuxième commit, quelqu'un a ajouté `bug.txt`, qui casse tout. Depuis, un troisième commit a été fait. Annule **seulement** le commit qui a ajouté `bug.txt`, sans toucher à l'historique : un nouveau rond doit apparaître.",
      "depart": ["git init", "echo 'Mon script' > script.py", "git add script.py", "git commit -m 'Ajoute le script'", "echo 'erreur' > bug.txt", "git add bug.txt", "git commit -m 'Ajoute bug.txt'", "echo '# doc' > README.md", "git add README.md", "git commit -m 'Ajoute le README'"],
      "buts": ["revert | Un commit « Revert … » est apparu", "nofile:bug.txt | `bug.txt` a disparu", "file:README.md | Le README, ajouté après, est toujours là", "commits>=4 | Les anciens commits sont toujours dans l'historique"],
      "indices": ["`git log --oneline` : repère l'identifiant du commit « Ajoute bug.txt ». C'est aussi `HEAD~1`.", "`git revert HEAD~1` (ou `git revert` suivi de l'identifiant)."],
      "solution": ["git log --oneline", "git revert HEAD~1", "git log --oneline", "ls"],
      "bonus": true
    }
  ]
}

@@ cles
- HEAD, `HEAD~1` et les identifiants de commit | git HEAD explication | Toutes les commandes pour revenir en arrière désignent un commit. HEAD est ton point de repère.
- `git restore` et `git revert` | git restore vs git revert vs reset | Restore agit sur tes fichiers, revert ajoute un commit qui annule. Les confondre, c'est risquer de perdre du travail.
- Le `.gitignore` et les secrets | gitignore secrets | Une clé ou un mot de passe poussé sur GitHub est public, même si tu le supprimes après.

@@ schema
~~~mermaid
flowchart TB
  subgraph AV["Avant git revert"]
    direction LR
    A1(("c1<br/>script")) --> A2(("c2<br/>ajoute bug.txt")) --> A3(("c3<br/>README"))
  end
  subgraph AP["Après git revert c2"]
    direction LR
    B1(("c1")) --> B2(("c2")) --> B3(("c3")) --> B4(("c4<br/>Revert : enlève bug.txt"))
  end
  AV -- "git revert c2" --> AP
~~~

`git revert` n'efface rien : il ajoute `c4`, qui fait exactement l'inverse de `c2`. Tout le monde peut récupérer `c4` sans conflit d'historique. C'est pour ça qu'on l'utilise sur ce qui est déjà partagé.

@@ zoom
### `git restore` perd tes modifications pour de bon

`git restore fichier` remplace ton fichier par la version du dernier commit. Ce que tu avais écrit depuis n'était dans aucun commit : Git ne peut pas te le rendre. Avant un `restore`, un coup d'œil à `git diff` montre ce que tu vas perdre.

### « Detached HEAD » : pas de panique

Après `git switch --detach <id>`, Git affiche un long message sur le *detached HEAD*. Ça veut juste dire : HEAD pointe directement sur un commit, et pas sur une branche. Tu peux regarder, lancer ton code, comparer. Pour revenir : `git switch main`. Si tu fais des commits dans cet état, ils ne sont sur aucune branche : crée-en une d'abord (leçon suivante).

### Et `git reset` ?

Tu verras souvent `git reset --hard HEAD~1` sur Internet. Il **déplace la branche** en arrière, comme si les commits d'après n'avaient jamais existé, et efface tes modifications en cours. C'est utile pour un commit raté qui n'est que chez toi. Sur un commit déjà poussé, c'est le meilleur moyen de semer le chaos dans ton équipe : utilise `git revert`.

### Un fichier déjà suivi qu'on veut ignorer

Ajouter une règle au `.gitignore` ne suffit pas pour un fichier déjà commité. Il faut d'abord dire à Git d'arrêter de le suivre, sans le supprimer du disque : `git rm --cached fichier`, puis un commit. C'est l'exercice « Casser et réparer » de cette leçon.

@@ predict
Ton `.gitignore` contient `*.csv`. Ton fichier `zones.csv` était déjà dans un commit avant que tu ajoutes cette règle. Tu le modifies. Apparaît-il dans `git status` ?

@@ predict-answer
**Oui**, en « modified ». Le `.gitignore` ne s'applique qu'aux fichiers **pas encore suivis**. `zones.csv` est déjà dans l'historique : Git continue de le suivre. Pour qu'il soit vraiment ignoré, il faut `git rm --cached zones.csv` puis un commit (le fichier reste sur ton disque).

@@ practice
Dans `/workspaces/labo-git`, entraîne-toi à revenir en arrière, puis protège ton dépôt avec un `.gitignore`.

@@ constraints
- Tu as abîmé `idees.txt` puis tu l'as remis comme au dernier commit avec `git restore`
- Tu es allé voir ton premier commit, puis tu es revenu sur `main`
- Un commit « Revert … » annule ton commit de `todo.txt`, et les anciens commits sont toujours dans `git log`
- Un `.gitignore` commité ignore au minimum `.env`, `*.csv`, `*.parquet`, `.venv/` et `keys/`
- `git status` ne montre ni le fichier `.env` ni le fichier `.csv` que tu as créés pour tester

@@ guide
### 1. Abîme un fichier, puis répare-le

~~~bash
cd /workspaces/labo-git
echo "n'importe quoi" > idees.txt
git diff
~~~

`git diff` montre tes lignes d'avant en rouge (`-`) et la nouvelle en vert (`+`). Remets le fichier comme au dernier commit avec `git restore` suivi du nom du fichier, puis vérifie avec `cat idees.txt` et `git status`.

### 2. Va voir ton premier commit

`git log --oneline` liste tes commits. Copie l'identifiant du plus ancien (en bas), puis :

~~~bash
git switch --detach <identifiant>
cat idees.txt
ls
~~~

Ton dossier est revenu à cette époque : `todo.txt` n'existe pas encore. Reviens au présent avec `git switch main`.

### 3. Annule le commit de `todo.txt` avec revert

Repère dans `git log --oneline` le commit qui a ajouté `todo.txt`, puis `git revert` suivi de son identifiant. Git peut ouvrir un éditeur pour le message (*Revert "…"*) : dans l'éditeur du terminal, enregistre et ferme (pour `nano` : **Ctrl + X**). Pour éviter l'éditeur, ajoute `--no-edit`. Ensuite, `git log --oneline` : un commit de plus, rien d'effacé.

### 4. Crée des fichiers à ne jamais commiter

~~~bash
echo "PASSWORD=1234" > .env
echo "id,zone" > test.csv
git status
~~~

Les deux apparaissent en rouge : sans `.gitignore`, un `git add .` les enverrait.

### 5. Écris le `.gitignore`

Ouvre-le dans l'éditeur avec `code .gitignore`. Écris une règle par ligne pour : le fichier `.env`, tous les `.csv`, tous les `.parquet`, le dossier `.venv`, et le dossier `keys`. Enregistre (**Ctrl + S**), puis `git status` : `.env` et `test.csv` ont disparu de la liste, il ne reste que `.gitignore`.

### 6. Commite le `.gitignore`

`git add .gitignore`, puis un commit avec un message clair, comme `chore: ignore les secrets et les données`.

@@ hints
- `git status` affiche lui-même la commande pour annuler une modification : lis les lignes entre parenthèses.
- Un dossier dans un `.gitignore` se termine par `/` : `.venv/`, `keys/`.
- Si `git revert` ouvre un éditeur dans le terminal et que tu es perdu : avec `nano`, **Ctrl + X** ; avec `vim`, tape `:wq` puis Entrée.

@@ solution
~~~bash
cd /workspaces/labo-git

# 1. Abîmer puis réparer
echo "n'importe quoi" > idees.txt
git diff                         # ce que je vais perdre
git restore idees.txt
git status                       # working tree clean

# 2. Voyager dans le temps
git log --oneline
git switch --detach <id-du-premier-commit>
ls                               # pas de todo.txt
git switch main

# 3. Annuler le commit de todo.txt, sans réécrire l'historique
git revert <id-du-commit-todo> --no-edit
git log --oneline                # Revert "Ajoute ma liste…" en haut

# 4-5. Le .gitignore
echo "PASSWORD=1234" > .env
echo "id,zone" > test.csv
cat > .gitignore <<'FIN'
.env
*.csv
*.parquet
.venv/
keys/
FIN
git status                       # seul .gitignore apparaît

# 6. Le commiter
git add .gitignore
git commit -m "chore: ignore les secrets et les données"
~~~

Écrire le `.gitignore` dans l'éditeur, comme dans le pas à pas, donne exactement le même fichier.

@@ selfcheck
- `git log --oneline` montre un commit « Revert … », et mes anciens commits sont toujours là
- `git status` ne montre ni `.env` ni `test.csv`
- `git show --stat HEAD` montre que mon dernier commit contient `.gitignore`

@@ breakfix
Dans `/workspaces/labo-git`, ajoute une ligne à `idees.txt`. Ton `.gitignore` ignore `.env` : force-le quand même. `git add idees.txt`, puis `git add -f .env`, puis `git commit -m "Complète mes idées"`. **Le secret est maintenant dans ton dernier commit.** Retire-le de ce commit, en gardant le changement de `idees.txt` et sans supprimer `.env` de ton disque.

@@ breakfix-hints
- Il existe une option de `git rm` qui retire un fichier de Git sans le supprimer du disque.
- Le commit n'a pas été partagé : tu peux le refaire avec `git commit --amend`. Avec `--no-edit`, il garde le même message.
- Vérifie avec `git show --stat HEAD` : seul `idees.txt` doit apparaître.

@@ breakfix-answer
~~~bash
git rm --cached .env
git commit --amend --no-edit
git show --stat HEAD      # seul idees.txt reste dans le commit
ls -a                     # .env est toujours sur ton disque, et Git l'ignore de nouveau
~~~
C'est le `-f` qui a forcé la règle : c'est exactement pour ça qu'elle existe. **Si un secret a déjà été poussé sur GitHub**, le retirer de Git ne suffit pas : il faut le considérer comme public et le changer (nouveau mot de passe, nouvelle clé).

@@ explain
Explique à un camarade quand utiliser `git restore`, `git revert` et `git commit --amend`, et pourquoi `git revert` est la seule des trois à utiliser sur un commit déjà partagé.

@@ resources
- [Pro Git, en français : annuler des actions](https://git-scm.com/book/fr/v2/Les-bases-de-Git-Annuler-des-actions)
- [Pro Git, en français : ignorer des fichiers](https://git-scm.com/book/fr/v2/Les-bases-de-Git-Enregistrer-des-modifications-dans-le-d%C3%A9p%C3%B4t#_ignoring)
- [Des modèles de .gitignore pour chaque langage (GitHub)](https://github.com/github/gitignore)

@@ teaser
- [00-08] Ton fork aura bientôt son propre `mon-travail/.gitignore`, avec ces mêmes règles.
- [01-02] Au module 1, ce `.gitignore` travaille pour de vrai : ton `.venv` de plusieurs centaines de Mo n'apparaîtra jamais dans `git status`.
- [01-13] Le faux mot de passe de l'exercice « Casser et réparer » deviendra une vraie clé Google Cloud.

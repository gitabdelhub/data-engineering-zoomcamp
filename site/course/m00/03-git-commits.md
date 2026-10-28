# Git : enregistrer ton travail

Git garde l'historique de ton code. Chaque **commit** est une photo de tes fichiers à un instant, avec un message qui explique ce qui a changé.

## Les trois zones de Git

```mermaid
graph LR
    A[Dossier de travail<br/>tes fichiers] -->|git add| B[Zone de préparation<br/>staging]
    B -->|git commit| C[Historique local<br/>commits]
    C -->|git push| D[GitHub<br/>ton fork]
```

1. **Le dossier de travail** : les fichiers tels que tu les modifies.
2. **La zone de préparation** (staging) : ce que tu as choisi de mettre dans le prochain commit, avec `git add`.
3. **L'historique** : les commits, créés avec `git commit`. Ils restent sur ton Codespace jusqu'au `git push`.

## Les commandes du quotidien

| Commande | Ce qu'elle fait |
| --- | --- |
| `git status` | Montre ce qui a changé et ce qui est préparé. Lance-la tout le temps |
| `git diff` | Montre les lignes modifiées, pas encore préparées |
| `git add fichier` | Prépare un fichier pour le prochain commit |
| `git commit -m "message"` | Crée le commit avec ce qui est préparé |
| `git log --oneline` | Liste les commits |
| `git push` | Envoie tes commits sur GitHub |

## Écrire un bon message de commit

Un bon message dit **ce que fait** le commit, au présent, en une ligne courte :

- Bien : `Ajoute le script d'ingestion des zones`
- Pas bien : `update`, `modifs`, `ça marche enfin`

En entreprise, beaucoup d'équipes utilisent un préfixe : `feat:` (nouvelle fonctionnalité), `fix:` (correction), `docs:` (documentation). Par exemple : `feat: ingestion des zones de taxi`.

## Ce qu'on ne commite jamais

- Les secrets : mots de passe, clés de compte de service (`*.json` de Google Cloud), fichiers `.env`.
- Les fichiers générés ou lourds : données (`*.csv`, `*.parquet`), environnements virtuels (`.venv/`), états Terraform (`*.tfstate`).

On les liste dans un fichier `.gitignore` : Git fait alors comme s'ils n'existaient pas.

## Qui es-tu pour Git ?

Dans un Codespace, ton nom et ton e-mail GitHub sont déjà configurés. Vérifie avec `git config user.name` et `git config user.email`.

## Toujours commencer par `git pull`

Ton fork sur GitHub peut recevoir des commits sans passer par ton Codespace : la synchronisation avec le repo officiel, les mises à jour de ce site… Avant de travailler, récupère-les avec `git pull`. Sinon, ton `git push` sera refusé avec un message `rejected` et `fetch first`.

Si un jour `git pull` répond `You have divergent branches`, c'est que GitHub et ton Codespace ont chacun des commits que l'autre n'a pas. Lance une fois `git config --global pull.rebase false`, puis `git pull --no-edit` : Git fusionne les deux historiques avec un message de fusion automatique.

@@ predict
Tu modifies `README.md`, puis tu lances `git add README.md`. Ensuite, tu modifies **encore** `README.md`, et tu lances `git commit -m "..."`. Quelle version du fichier est enregistrée dans le commit ?

@@ predict-answer
La version **du moment du `git add`**. La deuxième modification n'est pas préparée : elle reste dans ton dossier de travail. `git status` montre alors le même fichier deux fois, une fois en « Changes to be committed » et une fois en « Changes not staged ». C'est la preuve que la zone de préparation est une vraie photo, pas un simple marque-page.

@@ practice
Enregistre ton espace de travail dans l'historique de ton fork, proprement.

@@ constraints
- Tu as commencé par récupérer ce qui est sur GitHub avec `git pull`
- `mon-travail/README.md` contient ton contrat d'apprentissage de la leçon 1, sous le titre
- Un fichier `mon-travail/.gitignore` ignore au minimum : `.venv/`, les fichiers `.parquet`, les fichiers `.csv.gz`, les fichiers `.env` et un dossier `keys/`
- **Deux commits séparés** : un pour le README, un pour le `.gitignore`, chacun avec un message clair
- Les deux commits sont poussés sur GitHub, et visibles dans ton fork

@@ guide
### 1. Récupère ce qui est sur GitHub

Dans le terminal, place-toi à la racine du fork, puis lance `git pull`. Cette commande télécharge les commits arrivés sur GitHub depuis ta dernière séance (la synchro avec le cours officiel, par exemple) et les applique chez toi.

~~~bash
cd /workspaces/data-engineering-zoomcamp
git pull
~~~

S'il n'y a rien de nouveau, Git répond `Already up to date.`

### 2. Colle ton contrat dans le README

Ton contrat d'apprentissage, tu l'as écrit dans l'étape Pratiquer de la leçon 1, sur ce site. Retourne le copier.

Ouvre ensuite `mon-travail/README.md` dans l'éditeur. Deux façons : clique dessus dans l'explorateur de fichiers à gauche, ou tape `code mon-travail/README.md` dans le terminal. Colle ton contrat **sous** la ligne de titre, puis enregistre avec **Ctrl + S**. Un point blanc à côté du nom de l'onglet veut dire « pas enregistré ».

### 3. Regarde ce que Git voit

Lance `git status`. Git liste `mon-travail/` en rouge sous `Untracked files` : des fichiers qu'il ne suit pas encore. Rouge veut dire « pas encore préparé pour le commit ».

### 4. Premier commit : le README seul

Prépare **un seul fichier** avec `git add` suivi de son chemin, puis relance `git status` : le fichier passe en vert, sous `Changes to be committed`. Ensuite, crée le commit avec un message qui dit ce qu'il fait. Exemple de forme, pour un autre fichier :

~~~bash
git add notes/idees.md
git commit -m "docs: mes idées de projet"
~~~

Fais la même chose avec `mon-travail/README.md` et ton propre message.

### 5. Crée le .gitignore

Un `.gitignore` est un simple fichier texte : **une règle par ligne**. Une étoile veut dire « n'importe quel nom » : `*.log` ignore tous les fichiers qui finissent par `.log`. Un nom suivi de `/` ignore un dossier entier : `cache/` ignore le dossier `cache`.

Crée `mon-travail/.gitignore` avec l'éditeur (`code mon-travail/.gitignore`). Écris une ligne pour chacune des cinq choses à ignorer de la consigne, puis enregistre.

Attention : le nom commence par un point. Sous Linux, les fichiers qui commencent par un point sont cachés : `ls -a` les montre.

### 6. Deuxième commit : le .gitignore seul

Même geste qu'à l'étape 4, avec ce fichier et un autre message. Puis vérifie avec `git log --oneline -3` : tes deux commits doivent apparaître en haut, le plus récent en premier.

### 7. Envoie sur GitHub

`git push` envoie tes commits sur ton fork. Ouvre ensuite ton fork sur github.com : le dossier `mon-travail` y est, avec tes deux fichiers. Si Git refuse avec `rejected` et `fetch first`, fais `git pull`, puis de nouveau `git push`.

@@ hints
- Pour faire deux commits séparés, ne fais pas `git add .` : prépare un seul fichier à la fois, et vérifie avec `git status` avant chaque commit.
- Dans un `.gitignore`, une ligne = une règle. `*.parquet` ignore tous les fichiers qui finissent par `.parquet`, et `keys/` ignore un dossier.
- Ta branche s'appelle `main`. Pour pousser : `git push`. Si le push est refusé avec `fetch first`, fais `git pull` puis repousse. Lis toujours le message de Git en entier : il donne souvent la commande exacte.

@@ solution
~~~bash
# 1. Se placer à la racine du fork et récupérer les nouveautés de GitHub
cd /workspaces/data-engineering-zoomcamp
git pull

# 2. Coller le contrat sous le titre de mon-travail/README.md, dans l'éditeur, puis Ctrl + S

# 3-4. Préparer UNIQUEMENT le README, vérifier, puis le commiter
git add mon-travail/README.md
git status                         # README.md en vert, rien d'autre
git commit -m "docs: mon contrat d'apprentissage"

# 5. Le .gitignore, une règle par ligne (ici écrit sans éditeur : tout ce qui
#    est entre les deux FIN part dans le fichier)
cat > mon-travail/.gitignore <<'FIN'
.venv/
*.parquet
*.csv.gz
.env
keys/
FIN

# 6. Deuxième commit, avec ce seul fichier
git add mon-travail/.gitignore
git commit -m "chore: ignorer les fichiers lourds et les secrets"
git log --oneline -3               # tes deux commits en haut

# 7. Envoyer sur GitHub
git push
~~~

Écrire le `.gitignore` dans l'éditeur, comme dans le pas à pas, donne exactement le même fichier.

@@ verify
gitignore

@@ selfcheck
- `git log --oneline -3` montre mes deux commits
- Sur la page GitHub de mon fork, le dossier `mon-travail` apparaît avec les deux fichiers

@@ breakfix
Ajoute une ligne à `mon-travail/README.md`. Crée aussi `mon-travail/.env` avec la ligne `PASSWORD=test` : c'est un « secret ». Ton `.gitignore` l'ignore, alors force-le : `git add mon-travail/README.md`, puis `git add -f mon-travail/.env`, puis `git commit -m "Complète le README"`. **Ne pousse pas.** Le secret est maintenant dans ton dernier commit. Retire-le de ce commit, en gardant le changement du README et sans supprimer le fichier de ton disque.

@@ breakfix-hints
- Il existe une option de `git rm` qui retire un fichier de Git sans le supprimer du disque.
- Un commit qui n'a pas encore été poussé peut être refait : regarde l'option `--amend` de `git commit`. Avec `--no-edit`, il garde le même message.
- Vérifie le résultat avec `git show --stat HEAD` : seul `README.md` doit apparaître dans le commit.

@@ breakfix-answer
~~~bash
git rm --cached mon-travail/.env
git commit --amend --no-edit
git show --stat HEAD      # seul README.md reste dans le commit
ls mon-travail/.env       # le fichier est toujours sur ton disque, et Git l'ignore de nouveau
~~~
Ton `.gitignore` ignorait déjà les `.env` : c'est le `-f` qui l'a forcé, et c'est pour ça que la règle existe. Tu peux maintenant pousser ton commit. **Si un secret a déjà été poussé**, le retirer de Git ne suffit pas : il faut considérer qu'il est public et le changer (nouveau mot de passe, nouvelle clé).

@@ explain
Explique la différence entre `git add`, `git commit` et `git push`, comme si tu l'expliquais à un camarade de ta promo.

@@ teaser
- [01-02] Ces règles travailleront pour de vrai au module 1 : ton `.venv` de plusieurs centaines de Mo et tes fichiers Parquet n'apparaîtront jamais dans `git status`.
- [01-13] Le faux mot de passe de l'exercice « Casser et réparer » deviendra une vraie clé Google Cloud.

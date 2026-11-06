# GitHub : clone, push et pull

Jusqu'ici, ton dépôt n'existait que sur ta machine. GitHub garde une copie en ligne de ton dépôt : pour ne rien perdre, pour la partager, et pour travailler à plusieurs. Cette leçon relie les deux, puis tu enregistres enfin ton travail du module 1 dans ton fork.

## 🔑 Un dépôt distant, surnommé `origin`

Un **dépôt distant** (*remote*) est une autre copie du même dépôt, ailleurs : ici, sur GitHub. Ton dépôt local lui donne un surnom, presque toujours **`origin`**. `git remote -v` affiche ce surnom et l'adresse qu'il désigne.

Les deux copies sont complètes : chacune a tout l'historique. Mais elles ne se synchronisent **jamais toutes seules**. C'est toi qui envoies et qui récupères, avec quatre commandes.

## 🔑 Les quatre commandes qui parlent à GitHub

| Commande | Sens | Ce qu'elle fait |
| --- | --- | --- |
| `git clone <adresse>` | GitHub → toi | Copie tout le dépôt (fichiers **et** historique) dans un nouveau dossier, et règle `origin` |
| `git push` | toi → GitHub | Envoie tes nouveaux commits sur GitHub |
| `git fetch` | GitHub → toi | Télécharge les nouveaux commits de GitHub, **sans toucher à tes branches** |
| `git pull` | GitHub → toi | `git fetch`, **puis fusionne** dans ta branche : ta branche est à jour |

La première fois que tu pousses une nouvelle branche, GitHub ne la connaît pas : `git push -u origin nom-de-branche`. Le `-u` relie ta branche à celle de GitHub. Ensuite, `git push` et `git pull` tout courts suffisent.

## 🔑 `origin/main` : la dernière nouvelle de GitHub

Après un `fetch`, un `pull` ou un `push`, ton dépôt note où en était chaque branche sur GitHub : `origin/main`, `origin/ma-branche`. Dans le Labo Git, ce sont les étiquettes en pointillés. Elles ne bougent que quand tu parles à GitHub : si ton collègue pousse, ton `origin/main` ne le sait pas tant que tu n'as pas fait `fetch` ou `pull`.

C'est pour ça que `git status` dit « Your branch is up to date with 'origin/main' » : à jour **par rapport à la dernière nouvelle**, pas forcément par rapport à GitHub en ce moment.

## 🔑 Push refusé : quelqu'un est passé avant toi

Si GitHub a des commits que tu n'as pas, Git refuse ton `push` (`rejected`, `fetch first`) : sinon, il effacerait ces commits. La solution est toujours la même : `git pull` (qui fusionne leur travail avec le tien), puis `git push`.

La première fois, `git pull` peut répondre `Need to specify how to reconcile divergent branches`. Git te demande juste ta méthode préférée. Choisis la fusion, une fois pour toutes :

~~~bash
git config --global pull.rebase false
~~~

## Ton fork, ton clone, ton Codespace

Trois copies du même projet, à ne pas confondre :

- **Le dépôt officiel**, `DataTalksClub/data-engineering-zoomcamp`, sur GitHub.
- **Ton fork**, `gitabdelhub/data-engineering-zoomcamp`, sur GitHub aussi : une copie **à ton nom**, créée avec le bouton *Fork*. Tu peux y pousser.
- **Ton Codespace** : un **clone** de ton fork. Son `origin`, c'est ton fork.

Ton fork bouge parfois sans passer par ton Codespace : quand tu fusionnes une mise à jour de ce site sur GitHub, par exemple. D'où le réflexe : **en début de séance, `git pull`**.

@@ labo
{
  "id": "00-08",
  "niveaux": [
    {
      "titre": "Envoyer ton dépôt sur GitHub",
      "intro": "Ton dépôt a deux commits, et un dépôt **vide** t'attend sur GitHub (panneau du haut). Fais connaître GitHub à ton dépôt sous le surnom `origin`, puis envoie ta branche `main`. Essaie d'abord `git push` tout court : lis bien les deux erreurs successives, elles te disent quoi faire.",
      "postes": ["moi", "github"],
      "depart": ["git init", "echo '# Mon projet' > README.md", "git add README.md", "git commit -m 'Premier commit'", "echo 'print(1)' > pipeline.py", "git add pipeline.py", "git commit -m 'Ajoute le pipeline'"],
      "buts": [
        "remote:origin | Ton dépôt connaît GitHub sous le nom `origin`",
        "synced:main | GitHub a ta branche `main`, avec tes deux commits",
        "upstream:main | Ta branche est reliée à GitHub : la prochaine fois, `git push` suffira"
      ],
      "indices": ["L'adresse du dépôt GitHub dans ce labo : `https://github.com/toi/projet.git`. La commande : `git remote add origin <adresse>`.", "La première fois : `git push -u origin main`."],
      "solution": ["git push", "git remote add origin https://github.com/toi/projet.git", "git push", "git push -u origin main", "git status"]
    },
    {
      "titre": "Cloner, comme ton Codespace",
      "intro": "Cette fois, le dépôt existe déjà sur GitHub, et ton ordinateur est vide. Récupère-le avec `git clone`. Puis regarde ce que Git a réglé tout seul : l'historique, le surnom `origin`, et les étiquettes en pointillés `origin/main`.",
      "postes": ["moi", "github"],
      "depart": ["git init", "echo '# Projet de l équipe' > README.md", "git add README.md", "git commit -m 'Premier commit'", "echo 'id,zone' > zones.csv", "git add zones.csv", "git commit -m 'Ajoute les zones'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "rm -rf .git", "rm README.md zones.csv"],
      "buts": [
        "repo | Tu as un dépôt",
        "synced:main | Ta branche `main` est identique à celle de GitHub",
        "cmd:git remote -v | Tu as regardé le surnom avec `git remote -v`",
        "cmd:git log | Tu as vu l'historique, arrivé avec le clone"
      ],
      "indices": ["`git clone https://github.com/toi/projet.git`", "Puis `git remote -v` et `git log --oneline`."],
      "solution": ["git clone https://github.com/toi/projet.git", "git remote -v", "git log --oneline", "git status"]
    },
    {
      "titre": "fetch : regarder avant de fusionner",
      "intro": "Sam, ton collègue, vient de pousser un commit sur GitHub. Ton ordinateur ne le sait pas encore. Fais d'abord `git fetch` : regarde l'étiquette `origin/main` avancer, alors que ta branche `main` ne bouge pas. Lis `git status`. Puis mets ta branche à jour avec `git pull`.",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "echo '# Projet' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "collegue: git clone https://github.com/toi/projet.git", "echo 'Notes de Sam' > notes.md", "git add notes.md", "git commit -m 'Ajoute les notes de Sam'", "git push", "moi: git status"],
      "buts": [
        "cmd:git fetch | Tu as fait `git fetch`",
        "cmd:git status | Tu as lu `git status` (« behind »)",
        "synced:main | Ta branche `main` a rattrapé GitHub",
        "file:notes.md | Le fichier de Sam est dans ton dossier",
        "merges=0 | Pas de commit de fusion : une avance rapide suffisait"
      ],
      "indices": ["`git fetch`, puis `git status`.", "`git pull` pour fusionner `origin/main` dans ta branche."],
      "solution": ["git fetch", "git status", "git pull"]
    },
    {
      "titre": "Quelqu'un a poussé avant toi",
      "intro": "Tu as fait un commit. Pendant ce temps, Sam a poussé le sien sur GitHub. Essaie d'envoyer ton commit : refusé. Lis le message, récupère le travail de Sam, puis renvoie. Si `git pull` te demande comment réconcilier, suis son conseil (la fusion).",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "echo '# Projet' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "collegue: git clone https://github.com/toi/projet.git", "echo 'Les tests de Sam' > tests.py", "git add tests.py", "git commit -m 'Ajoute les tests'", "git push", "moi: echo 'print(1)' > pipeline.py", "git add pipeline.py", "git commit -m 'Ajoute le pipeline'"],
      "buts": [
        "cmd:git push | Tu as tenté le push (et lu le refus)",
        "merges>=1 | Ton commit et celui de Sam sont réunis par une fusion",
        "synced:main | GitHub a maintenant ton commit aussi",
        "file:tests.py | Le fichier de Sam est chez toi"
      ],
      "indices": ["Après le refus : `git pull`. S'il demande une méthode : `git config --global pull.rebase false`, puis encore `git pull`.", "Enfin `git push`."],
      "solution": ["git push", "git pull", "git config --global pull.rebase false", "git pull", "git push", "git log --oneline --graph"]
    }
  ]
}

@@ cles
- Le dépôt distant `origin` | git remote origin explication | Toutes les commandes qui parlent à GitHub passent par lui. Sans ce mot, push et pull restent magiques.
- `git fetch` et `git pull` | git fetch vs git pull | Fetch regarde, pull fusionne. Savoir la différence évite les fusions surprises.
- Push refusé : pull d'abord | git push rejected fetch first | Ça t'arrivera dans ton fork comme en équipe. La réponse est toujours la même.
- Fork et clone | github fork vs clone | Ton projet a trois copies : l'officielle, ton fork, ton Codespace. Il faut savoir laquelle tu modifies.

@@ schema
~~~mermaid
flowchart TB
  subgraph GH["☁️ GitHub"]
    UP["Le dépôt officiel<br/>DataTalksClub/data-engineering-zoomcamp"]
    FK["Ton fork<br/>gitabdelhub/data-engineering-zoomcamp"]
    UP -- "Fork (une fois, sur github.com)" --> FK
  end
  subgraph CS["💻 Ton Codespace"]
    LOC["Ton clone<br/>/workspaces/data-engineering-zoomcamp<br/>main · origin/main"]
  end
  FK -- "git clone (fait par GitHub à la création du Codespace)" --> LOC
  LOC -- "git push : tes commits partent" --> FK
  FK -- "git fetch / git pull : les commits de GitHub arrivent" --> LOC
~~~

Ton Codespace parle à **ton fork** (`origin`), jamais directement au dépôt officiel. Faire venir les nouveautés du dépôt officiel dans ton fork, c'est la leçon « Synchroniser ton fork automatiquement ».

@@ zoom
### Ce que fait vraiment `git pull`

`git pull` = `git fetch` + `git merge origin/main` (pour la branche `main`). Trois cas :

- Tu n'as rien fait de nouveau : **avance rapide**, ta branche rattrape GitHub.
- Vous avez travaillé tous les deux, sur des lignes différentes : un **commit de fusion**, sans rien demander.
- Vous avez changé les mêmes lignes : **conflit**, qui se résout comme à la leçon précédente.

### Pourquoi le push est refusé, au lieu d'écraser

Sur GitHub, `main` pointe sur le commit de Sam. Ton commit a pour parent l'ancien commit, pas celui de Sam. Si GitHub acceptait ton push, `main` sauterait sur ton commit, et celui de Sam ne serait plus sur aucune branche. Git refuse donc tout push qui ferait « reculer » une branche. Le `git push --force` passe outre : **en équipe, on ne l'utilise jamais sur une branche partagée**.

### `-u` : relier ta branche à celle de GitHub

`git push -u origin ma-branche` envoie la branche **et** retient le lien. Ensuite, `git status` peut te dire « ahead by 2 commits » (2 commits à envoyer) ou « behind by 1 commit » (1 commit à récupérer), et `git push` / `git pull` savent où aller sans rien préciser. Une branche créée par `git clone` est déjà reliée.

### HTTPS et authentification

Dans un Codespace, tu ne tapes jamais de mot de passe : GitHub a donné au Codespace un jeton qui l'autorise à pousser **dans ton fork**. Sur ton propre PC, il faudrait te connecter (avec l'extension GitHub de VS Code, `gh auth login`, ou une clé SSH). Un mot de passe GitHub ne marche plus pour `git push` depuis 2021.

@@ predict
Ton collègue a poussé un commit sur GitHub il y a cinq minutes. Toi, tu n'as rien tapé depuis. Tu lances `git status`, qui répond « Your branch is up to date with 'origin/main' ». Est-ce vrai ?

@@ predict-answer
**Non, pas vraiment.** `git status` compare ta branche à `origin/main`, c'est-à-dire **à la dernière nouvelle** que tu as eue de GitHub. Il ne va pas sur Internet. Après un `git fetch`, `origin/main` avance sur le commit de ton collègue, et `git status` dit alors « Your branch is behind 'origin/main' by 1 commit ». C'est le niveau 3 du Labo Git.

@@ practice
Applique tout ça à ton fork : récupère ce qui a changé sur GitHub, puis enregistre et pousse ton espace de travail, y compris ce que tu as fait au module 1.

@@ constraints
- Tu as regardé `git remote -v` dans ton fork, et tu sais quelle adresse est `origin`
- Ta branche `main` a récupéré ce qui était sur GitHub (`git pull`), sans erreur
- `mon-travail/README.md` contient ton titre et ton contrat d'apprentissage de la leçon 1
- `mon-travail/.gitignore` ignore au minimum : `.venv/`, les fichiers `.parquet`, les fichiers `.csv.gz`, les fichiers `.env` et un dossier `keys/`
- Au moins deux commits séparés : un pour le README, un pour le `.gitignore` (et un pour ton travail du module 1, s'il existe)
- Tes commits sont poussés : visibles sur la page GitHub de ton fork

@@ guide
### 1. Regarde à qui parle ton Codespace

~~~bash
cd /workspaces/data-engineering-zoomcamp
git remote -v
~~~

Deux lignes `origin … (fetch)` et `origin … (push)`, avec l'adresse de **ton fork**. C'est là que partiront tes `push`.

### 2. Récupère ce qui a changé sur GitHub

D'abord, regarde sans fusionner :

~~~bash
git fetch
git status
~~~

Si `git status` dit `behind`, ton fork a reçu des commits (des mises à jour de ce site, par exemple). Récupère-les avec `git pull`. S'il répond `Need to specify how to reconcile divergent branches`, lance une fois `git config --global pull.rebase false`, puis de nouveau `git pull`. Si Git ouvre un éditeur pour un message de fusion, enregistre et ferme (avec `nano` : **Ctrl + X**).

### 3. Regarde ce qui n'est pas encore enregistré

`git status` : ton dossier `mon-travail/` apparaît sans doute en rouge, sous `Untracked files`. Tout ce que tu as fait dans ton Codespace (y compris au module 1) n'est encore **dans aucun commit**, ni sur GitHub. Si tu supprimais ton Codespace maintenant, tu le perdrais.

### 4. Le README de ton espace de travail

Si `mon-travail/README.md` n'existe pas encore (leçon « Ton Codespace et le terminal »), crée-le : `mkdir -p mon-travail` puis `echo "# Mon travail sur le Data Engineering Zoomcamp" > mon-travail/README.md`. Ouvre-le (`code mon-travail/README.md`), colle ton contrat d'apprentissage de la leçon 1 sous le titre, enregistre. Puis un commit avec ce seul fichier.

### 5. Le `.gitignore` de ton espace de travail

Crée `mon-travail/.gitignore` avec les cinq règles de la consigne, comme à la leçon « Revenir en arrière et ignorer des fichiers ». Puis un deuxième commit, avec ce seul fichier.

### 6. Ton travail du module 1

Relance `git status`. S'il reste des fichiers dans `mon-travail/module-01/` (le dossier `test` de la leçon 1, par exemple), regarde-les, puis fais un troisième commit avec `git add mon-travail/module-01`.

### 7. Envoie tout sur GitHub

`git push`. Puis ouvre ton fork sur github.com : le dossier `mon-travail` y est, et tes commits apparaissent dans l'historique (lien **commits**, en haut de la liste des fichiers).

@@ hints
- Si `git push` est refusé avec `fetch first`, c'est que ton fork a bougé : `git pull`, puis `git push`.
- Pour des commits séparés, ne fais pas `git add .` : un fichier (ou un dossier) à la fois, et `git status` avant chaque commit.
- Dans un `.gitignore`, une ligne = une règle : `*.parquet` ignore tous les fichiers qui finissent par `.parquet`, et `keys/` ignore un dossier.

@@ solution
~~~bash
# 1. À qui parle mon Codespace
cd /workspaces/data-engineering-zoomcamp
git remote -v                       # origin  https://github.com/gitabdelhub/data-engineering-zoomcamp (fetch/push)

# 2. Récupérer ce qui a changé sur GitHub
git fetch
git status                          # « behind » si le fork a bougé
git config --global pull.rebase false   # une fois pour toutes (si git pull le demande)
git pull

# 3-4. Le README (créé s'il n'existe pas), avec le contrat collé dans l'éditeur
mkdir -p mon-travail
[ -f mon-travail/README.md ] || echo "# Mon travail sur le Data Engineering Zoomcamp" > mon-travail/README.md
code mon-travail/README.md          # coller le contrat sous le titre, Ctrl + S
git add mon-travail/README.md
git commit -m "docs: mon contrat d'apprentissage"

# 5. Le .gitignore, une règle par ligne
cat > mon-travail/.gitignore <<'FIN'
.venv/
*.parquet
*.csv.gz
.env
keys/
FIN
git add mon-travail/.gitignore
git commit -m "chore: ignorer les fichiers lourds et les secrets"

# 6. Le travail du module 1, s'il existe
git status
git add mon-travail/module-01
git commit -m "module 1 : mes essais de la leçon 1"

# 7. Envoyer
git push
git log --oneline -4
~~~

@@ verify
gitignore

@@ selfcheck
- `git status` dit `Your branch is up to date with 'origin/main'` et `working tree clean`
- Sur github.com, mon fork montre le dossier `mon-travail` avec le README, le `.gitignore` et mon travail du module 1
- Je sais dire à quoi sert `origin`, et la différence entre `fetch` et `pull`

@@ breakfix
Sur github.com, ouvre `mon-travail/README.md` dans ton fork, clique sur le crayon (**Edit this file**), ajoute une ligne à la fin, puis **Commit changes** directement sur `main`. Dans ton Codespace, **sans faire de pull**, ajoute aussi une ligne (différente) dans un **autre** fichier de `mon-travail/`, commite, et pousse. Lis le refus, puis répare.

@@ breakfix-hints
- GitHub a maintenant un commit que ton Codespace n'a pas : c'est le cas « fetch first ».
- `git pull` va fusionner le commit fait sur github.com avec le tien. Les fichiers sont différents : pas de conflit.
- Puis `git push`. Vérifie avec `git log --oneline --graph`.

@@ breakfix-answer
~~~bash
git push                     # ! [rejected] main -> main (fetch first)
git pull                     # fusionne le commit fait sur github.com (commit de fusion)
git push                     # accepté
git log --oneline --graph -5 # les deux histoires se rejoignent
~~~
GitHub refuse tout push qui effacerait un commit qu'il a et que tu n'as pas. Le réflexe d'équipe : `git pull` en début de séance, et toujours avant de pousser.

@@ explain
Explique à un camarade ce que font `git clone`, `git push`, `git fetch` et `git pull`, ce qu'est `origin`, et pourquoi un `git push` peut être refusé.

@@ resources
- [Learn Git Branching, en français : la partie « Remote », niveaux 1 à 8](https://learngitbranching.js.org/?locale=fr_FR)
- [Pro Git, en français : travailler avec des dépôts distants](https://git-scm.com/book/fr/v2/Les-bases-de-Git-Travailler-avec-des-d%C3%A9p%C3%B4ts-distants)
- [Pro Git, en français : les branches de suivi à distance](https://git-scm.com/book/fr/v2/Les-branches-avec-Git-Branches-de-suivi-%C3%A0-distance)
- [GitHub Docs, en français : à propos des forks](https://docs.github.com/fr/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks)

@@ teaser
- [00-09] Tu sais envoyer et récupérer. Il manque la règle d'or du travail en équipe : on ne pousse pas directement sur `main`.
- [00-12] Ton fork a deux origines : ton Codespace (`origin`) et le dépôt officiel (`upstream`). Tu automatiseras sa mise à jour.

# Git, c'est quoi ? Ton premier dépôt

Tu as sûrement déjà eu un dossier comme ça : `rapport.docx`, `rapport-v2.docx`, `rapport-final.docx`, `rapport-final-VRAI.docx`. Personne ne sait plus quelle version est la bonne, ni ce qui a changé entre deux. Git règle ce problème, et c'est l'outil que toutes les équipes de développeurs et de data engineers utilisent.

## 🔑 Git, en une phrase

**Git prend des photos de ton dossier.** Chaque photo s'appelle un **commit**. Git les garde toutes, dans l'ordre, avec qui l'a prise, quand, et un message qui dit ce qui a changé. Tu peux revenir à n'importe quelle photo, comparer deux photos, et travailler à plusieurs sur le même dossier sans écraser le travail des autres.

## 🔑 Git n'est pas GitHub

- **Git** est un programme qui tourne sur ta machine (ici, ton Codespace). Il marche sans Internet.
- **GitHub** est un site web qui garde des copies de dépôts Git en ligne, pour les partager et travailler en équipe.

On commence par Git tout seul, sur ta machine. GitHub arrive à la leçon « GitHub : clone, push et pull ».

## 🔑 Un dépôt, c'est ton dossier plus un dossier caché `.git`

Un dossier normal ne garde aucune histoire. Pour que Git s'en occupe, tu tapes **une seule fois**, dans ce dossier :

~~~bash
git init
~~~

Git crée alors un dossier caché, `.git`, à l'intérieur. **C'est lui, le dépôt** : toutes les photos, toutes les branches et tout l'historique vivent dedans. Tes fichiers, eux, restent à côté, comme avant. Si tu supprimes `.git`, tu perds tout l'historique, mais pas tes fichiers.

Un dépôt se dit aussi **repository**, ou **repo**.

## 🔑 `git status` : « Git, qu'est-ce que tu vois ? »

`git status` ne change rien : elle décrit. Tu peux la taper autant que tu veux, et tu devrais la taper tout le temps. Juste après `git init`, elle dit trois choses :

- `On branch main` : tu es sur la branche principale, qui s'appelle `main` (les branches, c'est pour plus tard).
- `No commits yet` : aucune photo pour l'instant.
- `Untracked files` : les fichiers que Git voit, mais qu'il **ne suit pas encore**. Un fichier non suivi n'est pas protégé : Git ne le photographie pas tant que tu ne le lui demandes pas. C'est le sujet de la leçon suivante.

## Et ton fork, dans tout ça ?

Ton Codespace est **déjà** un dépôt Git. Quand GitHub l'a créé, il a copié ton fork avec son dossier `.git` : c'est pour ça que ton terminal affiche `(main)` au bout de la ligne. Pendant les cinq premières leçons de Git, tu t'entraînes donc dans un dossier à part, `/workspaces/labo-git`, où tu peux tout casser sans risque.

Commence par le **Labo Git** ci-dessous : tu tapes les commandes dans la page, et le dessin te montre ce que Git fait.

@@ labo
{
  "id": "00-03",
  "niveaux": [
    {
      "titre": "Un dossier normal, puis un dépôt",
      "intro": "Ton dossier contient un seul fichier, `idees.txt`. Dans le dessin, la colonne **Dépôt** est vide : ce n'est pas encore un dépôt. Tape d'abord `git status` pour voir ce que Git répond dans un dossier normal. Puis transforme le dossier en dépôt, et affiche les fichiers cachés avec `ls -a`.",
      "depart": ["echo 'Mes idées de projet' > idees.txt"],
      "buts": [
        "cmd:git status | Tu as tapé `git status` (avant ou après, peu importe)",
        "repo | Le dossier est devenu un dépôt : `git init`",
        "cmd:ls -a | Tu as vu le dossier caché `.git` avec `ls -a`"
      ],
      "indices": ["La commande qui transforme le dossier en dépôt tient en deux mots : `git` puis le verbe anglais « initialiser », en abrégé.", "`ls` liste les fichiers. L'option `-a` (*all*) montre aussi ceux dont le nom commence par un point."],
      "solution": ["git status", "git init", "ls -a"]
    },
    {
      "titre": "Ce que Git voit",
      "intro": "Le dépôt existe, mais il n'a aucun commit. Crée un deuxième fichier, `todo.txt`, qui contient `Apprendre Git`. Regarde sa couleur dans le dessin, puis demande à Git ce qu'il voit. Enfin, lis le fichier `.git/HEAD` : c'est lui qui dit à Git sur quelle branche tu es.",
      "depart": ["echo 'Mes idées de projet' > idees.txt", "git init"],
      "buts": [
        "file:todo.txt~Apprendre Git | `todo.txt` existe et contient « Apprendre Git »",
        "untracked:todo.txt | Git le voit, mais ne le suit pas encore (étiquette rouge NOUVEAU)",
        "cmd:git status | Tu as lu la réponse de `git status`",
        "cmd:cat .git/HEAD | Tu as lu `.git/HEAD` avec `cat`"
      ],
      "indices": ["`echo 'texte' > fichier` crée un fichier qui contient ce texte.", "`cat chemin/du/fichier` affiche un fichier. Ici, le chemin est `.git/HEAD`."],
      "solution": ["echo 'Apprendre Git' > todo.txt", "git status", "cat .git/HEAD"]
    },
    {
      "titre": "Casser pour comprendre",
      "intro": "Ce dépôt a déjà un commit : le rond bleu dans la colonne Dépôt. Supprime le dossier `.git` avec `rm -rf .git`, et regarde ce qui disparaît et ce qui reste. Puis recrée un dépôt neuf.",
      "depart": ["echo 'Mes idées de projet' > idees.txt", "git init", "git add idees.txt", "git commit -m 'Mes premières idées'"],
      "buts": [
        "cmd:rm -rf .git | Tu as supprimé le dossier `.git`",
        "file:idees.txt | Ton fichier `idees.txt` est toujours là",
        "commits=0 | Un dépôt neuf, sans aucun commit : l'ancien historique est bien perdu"
      ],
      "indices": ["Après `rm -rf .git`, tape `git status` : Git ne reconnaît plus le dossier.", "Pour recréer un dépôt : la même commande qu'au niveau 1."],
      "solution": ["rm -rf .git", "ls -a", "git status", "git init"],
      "bravo": "Retiens-le : le dépôt, c'est le dossier .git. Tes fichiers sont à côté, et ne dépendent pas de lui."
    }
  ]
}

@@ cles
- Git n'est pas GitHub | git vs github différence | Git est le programme sur ta machine, GitHub le site qui garde des copies en ligne. Les confondre rend tout le reste flou.
- Le dépôt et le dossier caché `.git` | git init dossier .git | Tout l'historique est dans `.git`. Comprendre ça, c'est comprendre où Git range ce qu'il sait.
- `git status` | git status explication | La commande à taper avant et après chaque action. Elle dit toujours où tu en es, et souvent quoi faire ensuite.

@@ schema
~~~mermaid
flowchart LR
  A["📁 labo-git<br/>un dossier normal<br/>idees.txt"] -- "git init" --> B
  subgraph B["📁 labo-git, devenu un dépôt"]
    direction TB
    F["idees.txt<br/>tes fichiers, comme avant"]
    G[("📁 .git, caché<br/>les commits, les branches, HEAD")]
  end
  G -. "git status compare tes fichiers à ce qu'il connaît" .-> F
~~~

`git init` ne touche pas à tes fichiers : il ajoute seulement le dossier `.git` à côté d'eux. C'est dans `.git` que Git rangera chaque commit.

@@ zoom
### Qu'y a-t-il dans `.git` ?

Tu n'as jamais besoin d'y toucher à la main, mais savoir ce qu'il contient aide à comprendre la suite :

| Dans `.git` | Ce que c'est |
| --- | --- |
| `objects/` | Les photos (commits) et le contenu de tes fichiers, compressés |
| `refs/heads/` | Les branches : un petit fichier par branche, qui contient l'identifiant d'un commit |
| `HEAD` | Où tu es : `ref: refs/heads/main` veut dire « sur la branche main » |
| `config` | Les réglages de ce dépôt (par exemple, l'adresse GitHub, plus tard) |

### Pourquoi `main`, et pas `master` ?

Pendant longtemps, la branche principale s'appelait `master`. GitHub et la plupart des équipes utilisent maintenant `main`. Selon sa version et ses réglages, Git peut encore créer `master` : tu règles ça une fois pour toutes dans la partie Pratiquer, avec `git config --global init.defaultBranch main`.

### Un dépôt dans un dépôt : à éviter

Si tu tapes `git init` dans un dossier qui est **déjà** dans un dépôt (par exemple, dans ton fork), tu crées un dépôt imbriqué : le dépôt du dessus voit un dossier bizarre qu'il ne sait pas gérer. C'est pour ça que ton dossier d'entraînement est **à côté** de ton fork (`/workspaces/labo-git`), pas dedans.

### Git marche sans Internet

Tout ce que tu fais dans ces premières leçons (init, commit, branches, fusion) se passe dans `.git`, sur ta machine. Internet ne sert qu'à échanger avec GitHub (`clone`, `push`, `pull`).

@@ predict
Un dépôt a 10 commits. Tu supprimes son dossier `.git`. Que reste-t-il : tes fichiers, l'historique, les deux, ou rien ?

@@ predict-answer
**Tes fichiers restent**, dans leur état actuel. **L'historique disparaît** : les 10 commits étaient dans `.git`. Le dossier redevient un dossier normal, et `git status` répond `fatal: not a git repository`. Tu l'as vu au niveau 3 du Labo Git. (Si le dépôt était aussi sur GitHub, l'historique existe encore là-bas : c'est une des raisons de pousser son travail.)

@@ practice
Refais pour de vrai, dans ton Codespace, ce que tu as fait dans le Labo Git : crée ton dossier d'entraînement et transforme-le en dépôt.

@@ constraints
- Le dossier `/workspaces/labo-git` existe, **à côté** de ton fork (pas dedans)
- Git crée ses nouvelles branches principales sous le nom `main`
- `/workspaces/labo-git` est un dépôt : il contient un dossier caché `.git`
- Tu as lu le contenu de `.git/HEAD`
- `idees.txt` existe, et `git status` le montre dans `Untracked files`

@@ guide
### 1. Crée le dossier d'entraînement, à côté de ton fork

Ouvre un terminal dans ton Codespace (**Ctrl + `**). Ton fork est dans `/workspaces/data-engineering-zoomcamp`. Ton dossier d'entraînement ira juste à côté :

~~~bash
cd /workspaces
mkdir labo-git
cd labo-git
pwd
~~~

`pwd` doit afficher `/workspaces/labo-git`. Si `mkdir` répond `Permission denied`, utilise ton dossier personnel à la place : `mkdir ~/labo-git && cd ~/labo-git`, et remplace `/workspaces/labo-git` par `~/labo-git` dans toutes les leçons suivantes.

### 2. Vérifie que ce n'est pas encore un dépôt

Tape `git status`. Git doit répondre `fatal: not a git repository`. C'est normal : pour l'instant, c'est un dossier comme un autre. Remarque aussi que l'invite du terminal n'affiche plus `(main)` : tu n'es plus dans ton fork.

### 3. Règle le nom de la branche principale, une fois pour toutes

Tape `git config --global init.defaultBranch`. Si la réponse est `main`, passe à l'étape suivante. Si elle est vide ou dit `master`, règle-la :

~~~bash
git config --global init.defaultBranch main
~~~

`--global` veut dire « pour tous tes dépôts dans ce Codespace », pas seulement celui-ci.

### 4. Transforme le dossier en dépôt

Lance `git init`. Puis regarde ce qui est apparu : `ls` ne montre rien de nouveau, mais `ls -a` montre `.git`. Jette un œil dedans avec `ls .git`, puis lis `.git/HEAD` avec `cat`. Tu dois retrouver ce que le Labo Git t'a montré : `ref: refs/heads/main`.

### 5. Crée un fichier et demande à Git ce qu'il voit

Crée `idees.txt` avec une phrase à toi, par exemple :

~~~bash
echo "Faire un pipeline de données sur le foot" > idees.txt
~~~

Puis `git status`. Ton fichier apparaît en rouge, sous `Untracked files`. Lis bien le reste de la réponse : `No commits yet`, et la ligne qui te suggère quoi faire (`use "git add"…`). Ne fais pas de commit maintenant : c'est la leçon suivante.

@@ hints
- Le dossier d'entraînement doit être dans `/workspaces`, pas dans `/workspaces/data-engineering-zoomcamp`. Vérifie avec `pwd`.
- Les fichiers qui commencent par un point sont cachés : `ls -a` les montre.
- `cat .git/HEAD` affiche le fichier qui dit sur quelle branche tu es.

@@ solution
~~~bash
# 1. Le dossier d'entraînement, à côté du fork (pas dedans)
cd /workspaces
mkdir labo-git
cd labo-git
pwd                                   # /workspaces/labo-git

# 2. Pas encore un dépôt
git status                            # fatal: not a git repository

# 3. Branche principale nommée main pour tous les nouveaux dépôts
git config --global init.defaultBranch main

# 4. Le dépôt
git init                              # Initialized empty Git repository in /workspaces/labo-git/.git/
ls -a                                 # .  ..  .git
ls .git                               # HEAD  config  hooks  objects  refs …
cat .git/HEAD                         # ref: refs/heads/main

# 5. Un fichier, que Git voit sans le suivre
echo "Faire un pipeline de données sur le foot" > idees.txt
git status
~~~

La fin de `git status` doit ressembler à :

~~~text
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	idees.txt

nothing added to commit but untracked files present (use "git add" to track)
~~~

@@ selfcheck
- `pwd` affiche `/workspaces/labo-git` (ou `~/labo-git`), pas un dossier de mon fork
- `ls -a` montre `.git`, et `cat .git/HEAD` affiche `ref: refs/heads/main`
- `git status` montre `idees.txt` sous `Untracked files`

@@ breakfix
Un piège classique : taper `git init` dans le mauvais dossier. Fais-le exprès : `cd ~`, puis `git init`. Maintenant, va dans `/tmp` puis reviens dans `~`, et tape `git status` : Git croit que tout ton dossier personnel est un dépôt, et liste plein de fichiers en `Untracked`. Répare ça, sans toucher à aucun autre fichier.

@@ breakfix-hints
- Un dépôt, c'est un dossier `.git`. Où Git vient-il de le créer ?
- `ls -a ~` montre les fichiers cachés de ton dossier personnel.
- Supprimer un dossier et son contenu : `rm -rf`. Vise **uniquement** ce dossier-là, avec son chemin complet.

@@ breakfix-answer
~~~bash
ls -a ~             # un dossier .git est apparu dans ton dossier personnel
rm -rf ~/.git       # supprime ce dépôt créé par erreur (et seulement lui)
cd ~ && git status  # fatal: not a git repository : tout est revenu à la normale
~~~
Le dépôt créé par erreur était vide : le supprimer ne fait rien perdre. Avant un `rm -rf`, relis toujours le chemin deux fois : la commande ne demande pas de confirmation, et il n'y a pas de corbeille.

@@ explain
Explique à un camarade qui n'a jamais utilisé Git : la différence entre Git et GitHub, ce que fait `git init`, et ce qu'il y a dans le dossier `.git`.

@@ resources
- [Pro Git, en français : à propos de la gestion de version](https://git-scm.com/book/fr/v2/D%C3%A9marrage-rapide-%C3%80-propos-de-la-gestion-de-version)
- [Pro Git, en français : démarrer un dépôt Git](https://git-scm.com/book/fr/v2/Les-bases-de-Git-D%C3%A9marrer-un-d%C3%A9p%C3%B4t-Git)
- [GitHub Docs, en français : à propos de Git](https://docs.github.com/fr/get-started/using-git/about-git)

@@ teaser
- [00-04] Ton `idees.txt` est rouge, « untracked ». À la leçon suivante, tu prends ta première photo.
- [00-08] Ton Codespace est un dépôt parce qu'il a été **cloné** depuis ton fork. Tu sauras exactement ce que ça veut dire.

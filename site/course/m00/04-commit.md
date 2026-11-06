# Ton premier commit : les trois zones

Un **commit** est une photo de tes fichiers à un instant, avec un message. Pour prendre cette photo, Git te fait passer par trois endroits. Une fois que tu les vois, toutes les commandes de Git deviennent logiques.

## 🔑 Les trois zones de Git

1. **Le dossier de travail** : tes fichiers, tels que tu les modifies dans l'éditeur.
2. **La zone de préparation** (en anglais *staging area*, ou *index*) : ce que tu as choisi de mettre dans la prochaine photo. On y met un fichier avec `git add`.
3. **Le dépôt** (`.git`) : les photos déjà prises. `git commit` prend tout ce qui est dans la zone de préparation et en fait un commit.

Une image : un photographe de mariage. `git add`, c'est appeler les personnes qui doivent être sur la photo. `git commit`, c'est appuyer sur le bouton. Les invités restés au buffet (les fichiers que tu n'as pas ajoutés) ne sont pas sur la photo.

## Pourquoi une zone de préparation ?

Pour **choisir** ce qui va dans chaque commit. Tu as corrigé une faute dans le README **et** commencé un script ? Ce sont deux idées différentes : deux commits. Plus tard, quand tu chercheras « quand est-ce que ce bug est arrivé ? », des commits qui font une seule chose chacun te sauveront.

## 🔑 Ce qu'il y a dans un commit

- Une photo **complète** de tous les fichiers suivis (pas seulement ceux qui ont changé).
- Un **message**, un **auteur**, une **date**.
- Un lien vers le commit d'avant : son **parent**. C'est cette chaîne de parents qui forme l'historique.
- Un **identifiant** calculé à partir de tout ça, comme `a1b2c3d4e5…`. On n'en montre souvent que les 7 premiers caractères : `a1b2c3d`.

## Les commandes du quotidien

| Commande | Ce qu'elle fait |
| --- | --- |
| `git status` | Montre ce qui a changé et ce qui est préparé |
| `git add fichier` | Met ce fichier dans la zone de préparation |
| `git commit -m "message"` | Crée le commit avec ce qui est préparé |
| `git log --oneline` | Liste les commits, le plus récent en haut |
| `git diff` | Montre les lignes modifiées **pas encore** préparées |
| `git diff --staged` | Montre les lignes préparées, qui partiront dans le prochain commit |

Dans `git status`, retiens le code couleur : **rouge** = pas encore préparé, **vert** = prêt pour le prochain commit.

## Un bon message de commit

Il dit **ce que fait** le commit, en une ligne courte, au présent :

- Bien : `Ajoute le script d'ingestion des zones`, `Corrige l'URL du fichier de janvier`
- Pas bien : `update`, `modifs`, `ça marche enfin`

Beaucoup d'équipes ajoutent un préfixe : `feat:` (nouvelle fonctionnalité), `fix:` (correction), `docs:` (documentation), `chore:` (rangement). Par exemple : `docs: ajoute mes idées de projet`. Pendant ton PFE, regarde la convention de ton équipe dès le premier jour.

## Qui signe tes commits ?

Chaque commit porte un nom et un e-mail : ceux de `git config user.name` et `git config user.email`. Dans un Codespace, GitHub les a déjà réglés avec ton compte. Tu vérifieras dans la partie Pratiquer.

@@ essentiel
**En une image.** Un photographe de mariage. `git add`, c'est appeler les personnes qui seront sur la photo. `git commit`, c'est appuyer sur le bouton. Les invités restés au buffet ne sont pas sur la photo.

Ce qui donne trois zones : **dossier de travail** (tes fichiers) → `git add` → **zone de préparation** (la prochaine photo) → `git commit` → **dépôt** (les photos prises).

| Tu veux… | Tu tapes |
| --- | --- |
| Préparer un fichier pour la prochaine photo | `git add fichier` |
| Prendre la photo | `git commit -m "Ajoute mes idées"` |
| Voir ce que tu as modifié | `git diff` |
| Voir les photos déjà prises | `git log --oneline` |

📌 **À retenir :** dans `git status`, **rouge** = pas encore préparé, **vert** = partira dans le prochain commit.

📌 **À retenir :** un commit = une idée, avec un message qui dit ce qu'il fait : `Corrige l'URL de janvier`, pas `modifs`.

⚠️ **Attention :** `git add .` prépare **tout**. Regarde `git status` avant, pour ne pas envoyer un mot de passe par erreur.

@@ labo
{
  "id": "00-04",
  "niveaux": [
    {
      "titre": "Ta première photo",
      "intro": "Ton dépôt contient `idees.txt`, en rouge : Git ne le suit pas. Mets-le dans la zone de préparation, regarde-le passer d'une colonne à l'autre, puis prends la photo. Lis `git status` entre chaque étape.",
      "depart": ["echo 'Mes idées de projet' > idees.txt", "git init"],
      "buts": ["cmd:git add | Tu as préparé le fichier avec `git add`", "commits>=1 | Ton premier commit est dans le dépôt (un rond apparaît)", "clean | `git status` dit « nothing to commit, working tree clean »"],
      "indices": ["`git add idees.txt` met le fichier dans la zone de préparation.", "`git commit -m \"Ajoute mes idées\"` prend la photo. Le message entre guillemets est obligatoire dans le labo."],
      "solution": ["git status", "git add idees.txt", "git status", "git commit -m 'Ajoute mes idées'", "git status"]
    },
    {
      "titre": "Deux idées, deux commits",
      "intro": "Tu as fait deux choses différentes : tu as ajouté une ligne à `idees.txt`, et tu as créé `todo.txt`. Fais **deux commits séparés**, un par fichier. Avant le premier, regarde avec `git diff` la ligne que tu as ajoutée.",
      "depart": ["echo 'Mes idées de projet' > idees.txt", "git init", "git add idees.txt", "git commit -m 'Ajoute mes idées'", "echo 'Un pipeline sur le foot' >> idees.txt", "echo 'Apprendre Git' > todo.txt"],
      "buts": ["cmd:git diff | Tu as regardé la modification avec `git diff`", "committed:idees.txt~foot | La nouvelle idée est dans un commit", "committed:todo.txt | `todo.txt` est dans un commit", "commits>=3 | Deux commits séparés (3 en tout, avec le premier)", "clean | Plus rien en attente"],
      "indices": ["`git add .` préparerait les deux fichiers d'un coup : ici, prépare-les un par un.", "Le cycle, deux fois : `git add un-fichier`, puis `git commit -m \"...\"`."],
      "solution": ["git diff", "git add idees.txt", "git commit -m 'Ajoute une idée sur le foot'", "git add todo.txt", "git commit -m 'Ajoute ma liste de choses à faire'", "git log --oneline"]
    },
    {
      "titre": "La photo est prise au moment du git add",
      "intro": "Écris `version 1` dans `notes.txt`, prépare-le avec `git add`. **Puis** remplace son contenu par `version 2`, et seulement ensuite fais le commit. Quelle version est dans la photo ? Regarde les colonnes avant de taper `git commit`, puis clique sur les fichiers pour voir leur contenu.",
      "depart": ["git init", "echo 'Mes idées de projet' > idees.txt", "git add idees.txt", "git commit -m 'Ajoute mes idées'"],
      "buts": ["committed:notes.txt~version 1 | Le commit contient `version 1`", "file:notes.txt~version 2 | Ton fichier, lui, contient `version 2`", "cmd:git status | Tu as lu `git status` : `notes.txt` est encore « modified »"],
      "indices": ["`echo 'version 1' > notes.txt`, puis `git add notes.txt`.", "`>` remplace tout le contenu : `echo 'version 2' > notes.txt`. Puis `git commit -m \"...\"` et `git status`."],
      "solution": ["echo 'version 1' > notes.txt", "git add notes.txt", "echo 'version 2' > notes.txt", "git status", "git commit -m 'Ajoute mes notes'", "git status"],
      "bravo": "La zone de préparation garde une copie du fichier au moment du git add. Ce que tu modifies après n'y entre que si tu refais git add.",
      "bonus": true
    }
  ]
}

@@ cles
- Les trois zones : dossier de travail, zone de préparation, dépôt | git working directory staging area repository | Tout Git devient logique une fois ces trois zones comprises. Si c'est flou, refais le Labo Git en regardant les colonnes.
- Un commit et son parent | git commit parent historique | Chaque commit pointe vers le précédent. C'est cette chaîne qui permet de revenir en arrière et de créer des branches.
- Un commit = une idée, avec un bon message | git commit message bonnes pratiques | En équipe, ton historique est lu par les autres. Des petits commits clairs se relisent et s'annulent facilement.

@@ schema
~~~mermaid
flowchart LR
  W["📝 Dossier de travail<br/>idees.txt modifié<br/>todo.txt nouveau"] -- "git add idees.txt" --> I["🟩 Zone de préparation<br/>idees.txt"]
  I -- "git commit -m '...'" --> C2(("c2"))
  subgraph D["📁 Dépôt .git : l'historique"]
    C1(("c1")) --> C2
  end
  W -. "todo.txt reste ici :<br/>pas dans ce commit" .-> W
~~~

Le nouveau commit `c2` contient la photo de **tout** ce qui est suivi, avec `c1` comme parent. `todo.txt`, qui n'a pas été ajouté, attend dans le dossier de travail.

@@ zoom
### Lire `git status` ligne par ligne

~~~text
On branch main
Changes to be committed:                     ← en VERT : dans la zone de préparation
	modified:   idees.txt
Changes not staged for commit:               ← en ROUGE : modifié, mais pas préparé
	modified:   notes.txt
Untracked files:                             ← en ROUGE : nouveau, Git ne le suit pas
	todo.txt
~~~

Les lignes entre parenthèses (`use "git add <file>..."`) te disent quoi taper : lis-les.

### `git add .` : pratique, mais regarde avant

`git add .` prépare **tout** ce qui a changé dans le dossier. C'est pratique, mais c'est comme ça qu'on envoie par erreur un fichier de mot de passe ou un gros fichier de données. Le bon réflexe : `git status` d'abord, `git add .` seulement si tout ce que tu vois doit partir.

### `git commit -a` : un raccourci

`git commit -am "message"` prépare tous les fichiers **déjà suivis** qui ont changé, puis fait le commit. Il n'ajoute jamais un fichier nouveau (untracked) : pour un nouveau fichier, il faut un vrai `git add`.

### L'identifiant d'un commit

L'identifiant (le *hash*) est calculé à partir du contenu, du message, de l'auteur, de la date et du parent. Changer un seul de ces éléments donne un autre identifiant. C'est pour ça que deux personnes qui ont le même commit ont exactement le même identifiant, et que « modifier » un commit en crée en réalité un nouveau.

@@ predict
Tu modifies `README.md`, puis tu lances `git add README.md`. Ensuite, tu modifies **encore** `README.md`, et tu lances `git commit -m "..."`. Quelle version du fichier est enregistrée dans le commit ?

@@ predict-answer
La version **du moment du `git add`**. La deuxième modification n'est pas préparée : elle reste dans le dossier de travail, et `git status` montre `README.md` en « modified » juste après le commit. C'est le niveau bonus du Labo Git : la zone de préparation est une vraie copie, pas un marque-page.

@@ practice
Dans ton dossier d'entraînement `/workspaces/labo-git`, prends tes trois premières photos, proprement.

@@ constraints
- Tu as vérifié le nom et l'e-mail qui signeront tes commits
- Un premier commit contient `idees.txt`
- Un deuxième commit ajoute **une ligne** à `idees.txt`, et tu as regardé cette ligne avec `git diff` avant de la préparer
- Un troisième commit, séparé, ajoute `todo.txt`
- `git log --oneline` montre trois commits, avec des messages qui disent ce qu'ils font
- `git status` dit `nothing to commit, working tree clean`

@@ guide
### 1. Place-toi dans ton dossier d'entraînement

~~~bash
cd /workspaces/labo-git
git status
~~~

Tu dois retrouver `idees.txt` en rouge, sous `Untracked files` (leçon précédente). S'il n'existe pas, recrée-le avec `echo "ton idée" > idees.txt`.

### 2. Vérifie qui signera tes commits

`git config user.name` et `git config user.email` affichent ton nom et ton e-mail GitHub. Dans un Codespace, ils sont déjà réglés. S'ils sont vides, règle-les une fois :

~~~bash
git config --global user.name "Ton Nom"
git config --global user.email "ton-email@exemple.com"
~~~

### 3. Premier commit

Prépare le fichier, regarde le résultat, puis prends la photo :

~~~bash
git add idees.txt
git status
~~~

`idees.txt` passe en vert, sous `Changes to be committed`. Fais maintenant le commit avec un message qui dit ce qu'il fait, par exemple `git commit -m "Ajoute mes idées de projet"`. Git répond avec une ligne qui commence par `[main (root-commit) …]` : *root-commit* veut dire « le tout premier commit ».

### 4. Deuxième commit : une ligne de plus

Ajoute une ligne à la fin du fichier. `>>` **ajoute** à la fin (alors que `>` remplace tout) :

~~~bash
echo "Une deuxième idée" >> idees.txt
git diff
~~~

`git diff` montre la ligne ajoutée, précédée d'un `+` vert. Prépare et commite, comme à l'étape 3, avec un autre message.

### 5. Troisième commit : un nouveau fichier

Crée `todo.txt` avec une ligne de ton choix, puis le même geste : `git add todo.txt`, `git commit -m "..."`.

### 6. Regarde ton historique

`git log --oneline` liste tes commits, le plus récent en haut. `git log` tout court montre aussi l'auteur et la date de chacun. Appuie sur **q** pour sortir de l'affichage quand il remplit l'écran.

@@ hints
- Pour des commits séparés, prépare un seul fichier à la fois, et vérifie avec `git status` avant chaque commit.
- `>>` ajoute une ligne à la fin d'un fichier ; `>` remplace tout son contenu.
- Si `git log` affiche `(END)` et ne rend pas la main, appuie sur **q**.

@@ solution
~~~bash
cd /workspaces/labo-git

# Qui signe mes commits (déjà réglé dans un Codespace)
git config user.name
git config user.email

# 1er commit : le fichier d'idées
git add idees.txt
git status                               # idees.txt en vert
git commit -m "Ajoute mes idées de projet"

# 2e commit : une ligne de plus, regardée avant de la préparer
echo "Une deuxième idée" >> idees.txt
git diff                                 # +Une deuxième idée
git add idees.txt
git commit -m "Ajoute une deuxième idée"

# 3e commit : un nouveau fichier, seul
echo "Finir la leçon sur les branches" > todo.txt
git add todo.txt
git commit -m "Ajoute ma liste de choses à faire"

git log --oneline                        # 3 lignes, la plus récente en haut
git status                               # nothing to commit, working tree clean
~~~

`git log --oneline` doit ressembler à (tes identifiants seront différents) :

~~~text
9c1e2f4 (HEAD -> main) Ajoute ma liste de choses à faire
5b7a0d3 Ajoute une deuxième idée
1f3c8e9 Ajoute mes idées de projet
~~~

@@ selfcheck
- `git log --oneline` montre mes trois commits, avec des messages clairs
- J'ai vu le `+` vert de `git diff` avant mon deuxième commit
- `git status` dit `working tree clean`

@@ breakfix
Fais un commit avec une faute dans le message : `echo "test" >> todo.txt`, `git add todo.txt`, puis `git commit -m "Ajjoute un tset"`. Tu n'as encore envoyé ce commit nulle part. Corrige son message, sans créer de commit en plus.

@@ breakfix-hints
- Un commit qui n'a pas encore été partagé peut être refait. Regarde l'option `--amend` de `git commit`.
- Avec `-m`, `--amend` remplace le message du dernier commit.
- Vérifie avec `git log --oneline` : toujours le même nombre de commits, mais un identifiant différent pour le dernier.

@@ breakfix-answer
~~~bash
git commit --amend -m "Ajoute un test"
git log --oneline       # même nombre de commits, le dernier a un nouveau message… et un nouvel identifiant
~~~
`--amend` ne modifie pas le commit : il en crée un nouveau qui le remplace (d'où le nouvel identifiant). C'est sans danger tant que le commit n'est que chez toi. **Ne fais jamais `--amend` sur un commit déjà poussé** sur une branche que d'autres utilisent : leur historique ne correspondrait plus au tien. Tu comprendras pourquoi aux leçons sur l'équipe.

@@ explain
Explique la différence entre le dossier de travail, la zone de préparation et le dépôt, en racontant ce qui se passe quand tu tapes `git add` puis `git commit`.

@@ resources
- [Pro Git, en français : enregistrer des modifications dans le dépôt](https://git-scm.com/book/fr/v2/Les-bases-de-Git-Enregistrer-des-modifications-dans-le-d%C3%A9p%C3%B4t)
- [Pro Git, en français : visualiser l'historique](https://git-scm.com/book/fr/v2/Les-bases-de-Git-Visualiser-l%E2%80%99historique-des-validations)
- [Les messages de commit conventionnels (Conventional Commits, en français)](https://www.conventionalcommits.org/fr/v1.0.0/)

@@ teaser
- [00-05] Tu sais prendre des photos. À la leçon suivante, tu apprends à revenir à une ancienne photo, et à dire à Git ce qu'il ne doit jamais photographier.

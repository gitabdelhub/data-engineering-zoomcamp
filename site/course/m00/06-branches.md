# Les branches et la fusion

Jusqu'ici, ton historique est une ligne droite. Une **branche** te permet d'essayer quelque chose à côté, sans casser ce qui marche. En équipe, c'est la base de tout : chaque tâche se fait sur sa propre branche.

## 🔑 Une branche n'est qu'une étiquette

Une branche est une **étiquette posée sur un commit**. Rien de plus : dans `.git`, c'est un petit fichier qui contient l'identifiant de ce commit. Créer une branche est donc instantané, et ne copie aucun fichier.

Quand tu fais un commit, l'étiquette de la branche où tu es **avance** sur le nouveau commit. Les autres étiquettes ne bougent pas.

## 🔑 HEAD dit sur quelle branche tu es

Tu as déjà vu HEAD : c'est « tu es ici ». Quand HEAD pointe sur `main`, tes commits font avancer `main`. Quand tu passes sur une autre branche avec `git switch`, HEAD pointe sur elle, et Git remet tes fichiers dans l'état de son dernier commit.

| Commande | Ce qu'elle fait |
| --- | --- |
| `git branch` | Liste les branches. L'étoile `*` montre celle où tu es |
| `git branch menu` | Crée l'étiquette `menu` sur le commit actuel, sans t'y déplacer |
| `git switch menu` | Passe sur la branche `menu` (HEAD pointe sur elle) |
| `git switch -c menu` | Crée la branche **et** passe dessus, en une commande |
| `git log --oneline --graph --all` | Dessine toutes les branches dans le terminal |
| `git merge menu` | Fusionne `menu` **dans la branche où tu es** |
| `git branch -d menu` | Supprime l'étiquette `menu` (ses commits restent, s'ils sont fusionnés) |

## 🔑 Deux façons de fusionner

On fusionne toujours **vers** la branche où l'on est : pour ramener `menu` dans `main`, on va sur `main`, puis `git merge menu`.

- **Avance rapide** (*fast-forward*) : si `main` n'a pas bougé depuis la création de `menu`, il n'y a rien à mélanger. Git avance juste l'étiquette `main` jusqu'au bout de `menu`. Aucun nouveau commit.
- **Commit de fusion** (*merge commit*) : si les deux branches ont avancé chacune de leur côté, Git crée un commit spécial qui a **deux parents**, et qui réunit les deux histoires. Dans le Labo Git, c'est un rond vide.

## Pourquoi c'est si important en équipe

Sur un projet, `main` doit toujours marcher : c'est ce qui est en production, ou ce que tes collègues récupèrent. Chacun travaille donc sur sa branche (`ajout-ingestion`, `fix-url-janvier`…), et la fusionne dans `main` quand elle est prête et relue. C'est exactement ce que tu feras au PFE, avec les pull requests des leçons sur l'équipe.

## Voir tes branches dans VS Code

L'extension **Git Graph** dessine l'historique de ton dépôt comme le Labo Git. Installe-la dans ton Codespace : panneau Extensions (**Ctrl + Shift + X**), cherche `Git Graph` (de mhutchie), **Install**. Elle montre les dépôts ouverts dans VS Code : tu vas ajouter ton dossier d'entraînement à la fenêtre dans la partie Pratiquer.

@@ labo
{
  "id": "00-06",
  "niveaux": [
    {
      "titre": "Une branche, c'est une étiquette",
      "intro": "Crée une branche `essai` avec `git branch essai` : regarde, deux étiquettes sur le même rond. Lis le fichier `.git/refs/heads/essai`. Puis passe sur `essai` et fais un commit : une seule étiquette avance. Laquelle ?",
      "depart": ["git init", "echo 'Recette : des pâtes' > recette.txt", "git add recette.txt", "git commit -m 'Première recette'", "echo 'Ingrédients : pâtes, sel' > ingredients.txt", "git add ingredients.txt", "git commit -m 'Ajoute les ingrédients'"],
      "buts": [
        "branch:essai | La branche `essai` existe",
        "cmd:cat .git/refs/heads/essai | Tu as lu son fichier dans `.git`",
        "on:essai | Tu es sur `essai` (HEAD pointe sur elle)",
        "commits>=3 | Un nouveau commit sur `essai`",
        "contains:main,essai | `main` n'a pas bougé : elle est restée derrière"
      ],
      "indices": ["`git branch essai` crée l'étiquette. `cat .git/refs/heads/essai` montre ce qu'elle contient : un identifiant de commit.", "`git switch essai`, puis par exemple `echo 'sauce tomate' >> recette.txt` et `git commit -am \"Ajoute la sauce\"`."],
      "solution": ["git branch essai", "cat .git/refs/heads/essai", "git switch essai", "echo 'sauce tomate' >> recette.txt", "git commit -am 'Ajoute la sauce'", "git log --oneline --graph --all"]
    },
    {
      "titre": "La fusion en avance rapide",
      "intro": "La branche `dessert` a deux commits d'avance, et `main` n'a pas bougé depuis. Ramène le travail de `dessert` dans `main`. Regarde bien : aucun nouveau rond, l'étiquette `main` glisse simplement.",
      "depart": ["git init", "echo 'Menu : pâtes' > menu.txt", "git add menu.txt", "git commit -m 'Premier menu'", "git switch -c dessert", "echo 'Dessert : tiramisu' >> menu.txt", "git commit -am 'Ajoute le tiramisu'", "echo 'Café offert' >> menu.txt", "git commit -am 'Ajoute le café'"],
      "buts": [
        "on:main | Tu es sur `main`",
        "contains:dessert,main | `main` contient le travail de `dessert`",
        "merges=0 | Aucun commit de fusion : Git a juste avancé l'étiquette"
      ],
      "indices": ["On fusionne **vers** la branche où l'on est : va d'abord sur `main`.", "`git switch main`, puis `git merge dessert`."],
      "solution": ["git switch main", "git merge dessert", "git log --oneline --graph --all"]
    },
    {
      "titre": "Deux histoires qui se rejoignent",
      "intro": "Cette fois, `main` et `boissons` ont avancé chacune de leur côté, sur des fichiers différents. Fusionne `boissons` dans `main` : un commit de fusion, avec deux parents, va apparaître. Puis supprime l'étiquette `boissons`, devenue inutile.",
      "depart": ["git init", "echo 'Menu : pâtes' > menu.txt", "git add menu.txt", "git commit -m 'Premier menu'", "git switch -c boissons", "echo 'Eau, jus' > boissons.txt", "git add boissons.txt", "git commit -m 'Ajoute les boissons'", "git switch main", "echo 'Ouvert le midi' > horaires.txt", "git add horaires.txt", "git commit -m 'Ajoute les horaires'"],
      "buts": [
        "on:main | Tu es sur `main`",
        "merges>=1 | Un commit de fusion relie les deux histoires",
        "tracked:boissons.txt | `main` contient maintenant `boissons.txt`",
        "nobranch:boissons | L'étiquette `boissons` est supprimée"
      ],
      "indices": ["Tu es déjà sur `main` : `git merge boissons`.", "`git branch -d boissons` supprime l'étiquette. Ses commits restent : ils font partie de l'histoire de `main`."],
      "solution": ["git log --oneline --graph --all", "git merge boissons", "git branch -d boissons", "git log --oneline --graph"]
    },
    {
      "titre": "À toi : le cycle complet",
      "intro": "Sans aide : crée une branche `contact`, fais-y **deux** commits (un fichier `contact.txt`, puis une ligne de plus). Reviens sur `main`, fais-y un commit sur un autre fichier. Fusionne `contact` dans `main`, puis supprime la branche.",
      "depart": ["git init", "echo '# Mon restaurant' > README.md", "git add README.md", "git commit -m 'Premier commit'"],
      "buts": [
        "merges>=1 | Un commit de fusion dans `main`",
        "tracked:contact.txt | `main` contient `contact.txt`",
        "commits>=5 | Au moins 5 commits (1 + 2 sur contact + 1 sur main + la fusion)",
        "nobranch:contact | La branche `contact` est supprimée",
        "on:main | Tu termines sur `main`"
      ],
      "indices": ["`git switch -c contact` crée la branche et y va.", "Après tes deux commits : `git switch main`, un commit sur un autre fichier, `git merge contact`, `git branch -d contact`."],
      "solution": ["git switch -c contact", "echo 'Tél : 01 23 45 67 89' > contact.txt", "git add contact.txt", "git commit -m 'Ajoute le contact'", "echo 'Mail : resto@exemple.com' >> contact.txt", "git commit -am 'Ajoute le mail'", "git switch main", "echo 'Ouvert du mardi au samedi' > horaires.txt", "git add horaires.txt", "git commit -m 'Ajoute les horaires'", "git merge contact", "git branch -d contact"]
    }
  ]
}

@@ cles
- Une branche est une étiquette sur un commit | git branche pointeur commit | Si tu vois une branche comme une étiquette qui avance, tout le reste (fusion, push, pull request) devient simple.
- HEAD et `git switch` | git switch branche HEAD | Savoir sur quelle branche tu es évite le piège numéro un : faire ses commits au mauvais endroit.
- Fast-forward et commit de fusion | git merge fast forward vs merge commit | Tu verras les deux tous les jours en équipe, dans ton terminal et sur GitHub.

@@ schema
~~~mermaid
gitGraph
  commit id: "Premier menu"
  branch boissons
  checkout boissons
  commit id: "Ajoute les boissons"
  checkout main
  commit id: "Ajoute les horaires"
  merge boissons id: "Fusion"
~~~

`main` et `boissons` ont avancé chacune de leur côté. `git merge boissons`, lancé depuis `main`, crée le commit de fusion : il a deux parents, « Ajoute les horaires » et « Ajoute les boissons ».

@@ zoom
### Pourquoi `git switch` change tes fichiers

Chaque branche pointe sur un commit, et chaque commit est une photo complète. Passer d'une branche à l'autre, c'est demander à Git de remettre ton dossier dans l'état de cette photo. Un fichier qui n'existe que sur `menu` disparaît de ton dossier quand tu reviens sur `main`, et revient quand tu retournes sur `menu`. Rien n'est perdu : il est dans `.git`.

### « Your local changes would be overwritten »

Si tu as des modifications pas encore commitées sur un fichier que l'autre branche change aussi, Git refuse de changer de branche pour ne rien écraser. Deux solutions : faire un commit, ou annuler tes modifications (`git restore`). Tu verras une troisième solution au module 1 : `git stash`.

### `git checkout`, l'ancêtre de `git switch`

Sur Internet, tu verras partout `git checkout menu` et `git checkout -b menu`. C'est l'ancienne commande, qui fait la même chose que `git switch menu` et `git switch -c menu` (et bien d'autres choses, d'où la confusion). `git switch` est plus récent et plus clair : utilise-le, mais reconnais l'autre.

### Bien nommer une branche

Un nom de branche dit ce qu'on y fait, en minuscules, avec des tirets : `ajout-ingestion-zones`, `fix-url-janvier`. Beaucoup d'équipes ajoutent un préfixe : `feat/…`, `fix/…`, `docs/…`. Pas d'espace, pas d'accent.

@@ predict
Tu es sur `main`. Tu crées `menu` avec `git branch menu` (sans `switch`), puis tu fais un commit. Quelle étiquette avance : `main`, `menu`, ou les deux ?

@@ predict-answer
**`main`**. `git branch menu` crée l'étiquette, mais **ne te déplace pas** : HEAD pointe toujours sur `main`, donc c'est `main` qui avance. `menu` reste sur l'ancien commit. Pour travailler sur la nouvelle branche, il faut `git switch menu` (ou directement `git switch -c menu`). C'est le piège classique : toujours vérifier avec `git status` (première ligne : `On branch …`).

@@ practice
Dans `/workspaces/labo-git`, crée deux branches, fusionne-les dans `main` (une en avance rapide, une avec un commit de fusion), et regarde le résultat dans Git Graph.

@@ constraints
- Une branche `recettes` a été fusionnée dans `main` en **avance rapide** (pas de commit de fusion pour elle)
- Une branche `courses` a été fusionnée dans `main` avec un **commit de fusion**, parce que `main` avait avancé entre-temps
- `git log --oneline --graph --all` montre la fusion
- Tu as vu ton historique dans Git Graph
- Les deux branches sont supprimées, et tu es sur `main`

@@ guide
### 1. Une branche, deux commits

~~~bash
cd /workspaces/labo-git
git switch -c recettes
~~~

La dernière ligne de ton invite affiche maintenant `(recettes)`. Crée un fichier `recettes.txt` et fais deux commits sur cette branche (un pour le créer, un pour ajouter une ligne). Le même geste qu'à la leçon sur les commits : `add`, puis `commit -m`.

### 2. Reviens sur `main` et regarde

`git switch main`, puis `ls` : `recettes.txt` a disparu de ton dossier. Il n'est pas perdu : il est sur la branche `recettes`. Vérifie avec `git log --oneline --graph --all`.

### 3. Fusion en avance rapide

Depuis `main`, fusionne `recettes`. Git doit répondre `Fast-forward` : `main` n'avait pas bougé, il a juste avancé son étiquette. `ls` : le fichier est revenu.

### 4. Deux histoires qui divergent

Crée une branche `courses`, fais-y un commit avec un fichier `courses.txt`. Puis reviens sur `main` et fais-y un commit sur un **autre** fichier (par exemple une ligne de plus dans `todo.txt`, ou un nouveau `horaires.txt`). Maintenant, les deux branches ont avancé chacune de leur côté.

### 5. Le commit de fusion

Depuis `main`, fusionne `courses`. Git peut ouvrir un éditeur pour le message de fusion (`Merge branch 'courses'`) : garde-le tel quel, enregistre et ferme (avec `nano` : **Ctrl + X**). Pour éviter l'éditeur : `git merge courses --no-edit`. Puis `git log --oneline --graph --all` : les deux traits se rejoignent.

### 6. Regarde dans Git Graph

Ajoute ton dossier d'entraînement à la fenêtre de VS Code : menu **☰ → File → Add Folder to Workspace…**, tape `/workspaces/labo-git`, **OK**. Si VS Code recharge la fenêtre, c'est normal. Ensuite, ouvre Git Graph : l'icône **Git Graph** en bas de l'écran (barre bleue), ou **Ctrl + Shift + P** puis `Git Graph: View Git Graph`. En haut, choisis le dépôt `labo-git` dans la liste **Repo**.

### 7. Fais le ménage

Supprime les deux branches avec `git branch -d`. Git accepte, parce qu'elles sont fusionnées : leurs commits font partie de l'histoire de `main`.

@@ hints
- Avant chaque commit, la première ligne de `git status` te dit sur quelle branche tu es.
- On fusionne vers la branche où l'on est : `git switch main`, puis `git merge le-nom-de-la-branche`.
- Pour forcer un commit de fusion, il faut que `main` ait reçu un commit **après** la création de `courses`.

@@ solution
~~~bash
cd /workspaces/labo-git

# 1. Branche recettes, deux commits
git switch -c recettes
echo "Pâtes au pesto" > recettes.txt
git add recettes.txt
git commit -m "Ajoute une recette"
echo "Salade niçoise" >> recettes.txt
git commit -am "Ajoute une deuxième recette"

# 2-3. Retour sur main, fusion en avance rapide
git switch main
ls                                   # pas de recettes.txt ici
git merge recettes                   # Fast-forward

# 4. Deux branches qui divergent
git switch -c courses
echo "Pain, lait" > courses.txt
git add courses.txt
git commit -m "Ajoute la liste de courses"
git switch main
echo "Ouvert le midi" > horaires.txt
git add horaires.txt
git commit -m "Ajoute les horaires"

# 5. Commit de fusion
git merge courses --no-edit          # Merge made by the 'ort' strategy.
git log --oneline --graph --all

# 7. Ménage
git branch -d recettes courses
git branch                           # * main
~~~

La fin de `git log --oneline --graph --all` doit ressembler à :

~~~text
*   4e1d9a2 (HEAD -> main) Merge branch 'courses'
|\
| * 7b3c0f1 Ajoute la liste de courses
* | 2a9e8d4 Ajoute les horaires
|/
* 6f0b2c7 Ajoute une deuxième recette
~~~

@@ selfcheck
- `git log --oneline --graph --all` montre deux traits qui se rejoignent dans un commit `Merge branch 'courses'`
- J'ai vu le même dessin dans Git Graph
- `git branch` ne liste plus que `main`

@@ breakfix
Sur `main`, crée une branche `brouillon`, fais-y un commit, reviens sur `main` **sans fusionner**, puis tente `git branch -d brouillon`. Git refuse. Lis son message, comprends pourquoi, puis décide : soit tu fusionnes, soit tu supprimes quand même la branche. Fais les deux, dans l'ordre qui te semble logique, sur deux branches différentes.

@@ breakfix-hints
- Le message dit `The branch 'brouillon' is not fully merged` : ses commits ne sont nulle part ailleurs.
- `-d` protège ton travail. La version en majuscule force la suppression.
- Après une suppression forcée, les commits ne sont plus sur aucune branche : ils finiront par être nettoyés par Git.

@@ breakfix-answer
~~~bash
git branch -d brouillon     # error: The branch 'brouillon' is not fully merged.
# Option 1 : garder le travail
git merge brouillon --no-edit && git branch -d brouillon
# Option 2 (sur une autre branche jetable) : abandonner le travail exprès
git branch -D brouillon2
~~~
`-d` refuse de supprimer une branche dont les commits seraient perdus : c'est une ceinture de sécurité. `-D` force, quand tu es **sûr** de vouloir jeter ce travail.

@@ explain
Explique avec tes mots ce qu'est une branche, ce que fait `git switch`, et la différence entre une fusion en avance rapide et un commit de fusion.

@@ resources
- [Learn Git Branching, en français : niveaux « Introduction » 1 à 3 (commit, branch, merge)](https://learngitbranching.js.org/?locale=fr_FR)
- [Pro Git, en français : les branches en bref](https://git-scm.com/book/fr/v2/Les-branches-avec-Git-Les-branches-en-bref)
- [Pro Git, en français : branches et fusions, les bases](https://git-scm.com/book/fr/v2/Les-branches-avec-Git-Branches-et-fusions%C2%A0%3A-les-bases)
- [L'extension Git Graph pour VS Code](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph)

@@ teaser
- [00-07] Ici, les deux branches touchaient des fichiers différents. À la leçon suivante, elles modifient la **même ligne** : c'est un conflit.
- [00-09] En équipe, la fusion dans `main` ne se fait pas dans ton terminal, mais sur GitHub, avec une pull request.

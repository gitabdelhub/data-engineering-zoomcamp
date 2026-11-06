# Ton premier conflit

Un conflit fait peur la première fois. En réalité, c'est Git qui te dit poliment : « vous avez changé la même chose de deux façons différentes, je ne vais pas choisir à ta place ». En équipe, tu en auras régulièrement. Savoir les résoudre calmement fait partie du métier.

## 🔑 Quand y a-t-il un conflit ?

Pendant une fusion, Git compare chaque fichier dans trois versions : celle du **commit de départ commun** (là où les branches se sont séparées), la tienne, et celle de l'autre branche.

- Un seul côté a changé une partie du fichier : Git prend ce changement, sans rien demander.
- Les deux côtés ont changé des **parties différentes** du même fichier : Git mélange les deux, sans rien demander.
- Les deux côtés ont changé **les mêmes lignes** (ou des lignes qui se touchent) : **conflit**. Git s'arrête et te demande de choisir.

## 🔑 Les marqueurs de conflit

Git écrit les deux versions dans le fichier, entre des marqueurs :

~~~text
<<<<<<< HEAD
Plat du jour : lasagnes
=======
Plat du jour : couscous
>>>>>>> menu-hiver
~~~

- Entre `<<<<<<< HEAD` et `=======` : **ta** version, celle de la branche où tu es.
- Entre `=======` et `>>>>>>> menu-hiver` : la version de **l'autre** branche, celle que tu fusionnes.

## 🔑 Résoudre, en quatre gestes

1. `git status` : la liste des fichiers en conflit, sous `Unmerged paths` (`both modified`).
2. Ouvre chaque fichier et **écris la version finale** : la tienne, la leur, ou un mélange. Supprime les trois lignes de marqueurs.
3. `git add fichier` : tu dis à Git « ce conflit est réglé ».
4. `git commit` : le commit de fusion est créé, et la fusion est finie.

Tu n'es pas prêt ? `git merge --abort` annule toute la fusion : tout redevient comme avant le `git merge`.

## Dans VS Code, c'est plus visuel

Quand tu ouvres un fichier en conflit, VS Code colore les deux versions et affiche au-dessus des petits liens : **Accept Current Change** (la tienne), **Accept Incoming Change** (la leur), **Accept Both Changes** (les deux), ou **Compare Changes**. Le bouton **Resolve in Merge Editor** ouvre un éditeur en trois panneaux : leur version, la tienne, et le résultat en bas. Tu cliques, tu vérifies le résultat, puis **Complete Merge**, qui fait le `git add` pour toi.

## Moins de conflits, en pratique

Faire de petites branches qui vivent peu de temps, récupérer souvent le travail des autres, et se parler (« je touche au fichier de config ») évite la plupart des conflits. Tu verras ces réflexes d'équipe à la leçon « En équipe : quand le travail se croise ».

@@ essentiel
**En une image.** Deux personnes ont réécrit **la même phrase** d'un document. Git ne choisit pas à ta place : il te montre les deux versions et attend ta décision. Un conflit n'est pas une erreur, c'est une question.

Git écrit les deux versions dans le fichier :

~~~text
<<<<<<< HEAD
Plat du jour : lasagnes        ← ta version
=======
Plat du jour : couscous        ← celle de l'autre branche
>>>>>>> menu-hiver
~~~

| Pour résoudre | Tu fais |
| --- | --- |
| 1. Voir les fichiers en conflit | `git status` |
| 2. Écrire la version finale, et **supprimer les trois lignes de marqueurs** | dans l'éditeur |
| 3. Dire à Git « c'est réglé » | `git add menu.txt` |
| 4. Finir la fusion | `git commit` |

📌 **À retenir :** des lignes **différentes** changées des deux côtés : pas de conflit, Git mélange seul. Les **mêmes** lignes : conflit.

⚠️ **Attention :** pas prêt à choisir ? `git merge --abort` annule toute la fusion.

@@ labo
{
  "id": "00-07",
  "niveaux": [
    {
      "titre": "Pas de conflit : des lignes différentes",
      "intro": "`menu.txt` a trois lignes : entrée, plat, dessert. Sur la branche `entree`, quelqu'un a changé **la ligne 1**. Sur `main`, tu as changé **la ligne 3**. Avant de fusionner, devine : conflit ou pas ? Puis fusionne `entree` dans `main`, et lis le fichier.",
      "depart": ["git init", "echo 'Entrée : salade' > menu.txt", "echo 'Plat : lasagnes' >> menu.txt", "echo 'Dessert : fruit' >> menu.txt", "git add menu.txt", "git commit -m 'Premier menu'", "git switch -c entree", "echo 'Entrée : soupe' > menu.txt", "echo 'Plat : lasagnes' >> menu.txt", "echo 'Dessert : fruit' >> menu.txt", "git commit -am 'Change l entrée'", "git switch main", "echo 'Entrée : salade' > menu.txt", "echo 'Plat : lasagnes' >> menu.txt", "echo 'Dessert : tiramisu' >> menu.txt", "git commit -am 'Change le dessert'"],
      "buts": ["merges>=1 | Fusion faite, avec un commit de fusion", "committed:menu.txt~soupe | L'entrée de la branche est là", "committed:menu.txt~tiramisu | Ton dessert est là aussi", "cmd:cat menu.txt | Tu as lu le résultat"],
      "indices": ["Tu es sur `main` : `git merge entree`.", "Git a mélangé les deux changements tout seul, parce qu'ils ne touchent pas les mêmes lignes. Vérifie avec `cat menu.txt`."],
      "solution": ["git merge entree", "cat menu.txt", "git log --oneline --graph --all"]
    },
    {
      "titre": "Ton premier conflit",
      "intro": "Cette fois, `main` et `menu-hiver` ont changé **la même ligne** : le plat. Fusionne, regarde le fichier passer en rouge CONFLIT, lis-le avec `cat`. Puis écris la version finale (garde le plat que tu veux), et termine la fusion.",
      "depart": ["git init", "echo 'Entrée : salade' > menu.txt", "echo 'Plat : lasagnes' >> menu.txt", "echo 'Dessert : fruit' >> menu.txt", "git add menu.txt", "git commit -m 'Premier menu'", "git switch -c menu-hiver", "echo 'Entrée : salade' > menu.txt", "echo 'Plat : couscous' >> menu.txt", "echo 'Dessert : fruit' >> menu.txt", "git commit -am 'Plat d hiver : couscous'", "git switch main", "echo 'Entrée : salade' > menu.txt", "echo 'Plat : pizza' >> menu.txt", "echo 'Dessert : fruit' >> menu.txt", "git commit -am 'Plat : pizza'"],
      "buts": ["cmd:git merge | Tu as lancé la fusion (et vu le conflit)", "nomarkers:menu.txt | Plus aucun marqueur <<<<<<< ======= >>>>>>> dans le fichier", "nomerge | La fusion est terminée", "merges>=1 | Le commit de fusion existe"],
      "indices": ["`git merge menu-hiver`, puis `cat menu.txt` pour voir les marqueurs.", "Dans le labo, réécris le fichier entier avec `echo` : `echo 'Entrée : salade' > menu.txt`, puis `>>` pour les deux lignes suivantes, sans les marqueurs. Ensuite `git add menu.txt` et `git commit -m \"Fusionne le menu d'hiver\"`."],
      "solution": ["git merge menu-hiver", "cat menu.txt", "echo 'Entrée : salade' > menu.txt", "echo 'Plat : couscous' >> menu.txt", "echo 'Dessert : fruit' >> menu.txt", "git add menu.txt", "git status", "git commit -m 'Fusionne le menu d hiver'"]
    },
    {
      "titre": "Le piège : commiter avec les marqueurs",
      "intro": "La fusion est en cours, avec un conflit dans `menu.txt`. Essaie de faire `git commit` tout de suite : Git refuse. Lis pourquoi, puis règle le conflit correctement. Attention : `git add` sur un fichier qui contient encore les marqueurs, Git l'accepte… et les marqueurs partent dans le commit. Le but l'interdit.",
      "depart": ["git init", "echo 'Plat : lasagnes' > menu.txt", "git add menu.txt", "git commit -m 'Premier menu'", "git switch -c midi", "echo 'Plat : salade' > menu.txt", "git commit -am 'Plat du midi'", "git switch main", "echo 'Plat : burger' > menu.txt", "git commit -am 'Plat : burger'", "git merge midi"],
      "buts": ["cmd:git commit | Tu as vu Git refuser le commit tant que le conflit n'est pas marqué comme réglé", "nomarkers:menu.txt | Aucun marqueur, ni dans le fichier ni dans le commit", "nomerge | La fusion est terminée"],
      "indices": ["`git commit -m \"essai\"` d'abord, pour lire l'erreur.", "Réécris `menu.txt` avec une seule ligne de plat, puis `git add menu.txt` et `git commit -m \"...\"`."],
      "solution": ["git status", "git commit -m 'essai'", "echo 'Plat : salade' > menu.txt", "git add menu.txt", "git commit -m 'Fusionne le plat du midi'"],
      "bonus": true
    },
    {
      "titre": "Abandonner une fusion",
      "intro": "Tu as lancé une fusion, il y a un conflit, et tu n'es pas prêt à choisir (il faut d'abord demander à ton équipe). Annule toute la fusion : tout doit redevenir comme avant.",
      "depart": ["git init", "echo 'Prix : 10 euros' > tarifs.txt", "git add tarifs.txt", "git commit -m 'Premiers tarifs'", "git switch -c promo", "echo 'Prix : 8 euros' > tarifs.txt", "git commit -am 'Promo'", "git switch main", "echo 'Prix : 12 euros' > tarifs.txt", "git commit -am 'Hausse des prix'", "git merge promo"],
      "buts": ["cmd:git merge --abort | Tu as annulé la fusion", "nomerge | Plus de fusion en cours", "merges=0 | Aucun commit de fusion", "file:tarifs.txt~12 euros | Le fichier est revenu à ta version"],
      "indices": ["`git status` rappelle la commande pour annuler, entre parenthèses.", "`git merge --abort`"],
      "solution": ["git status", "git merge --abort", "git status", "cat tarifs.txt"],
      "bonus": true
    }
  ]
}

@@ cles
- Pourquoi un conflit arrive | git merge conflict pourquoi | Git ne crée un conflit que si les mêmes lignes ont changé des deux côtés. Le comprendre, c'est savoir l'éviter.
- Les marqueurs `<<<<<<<`, `=======`, `>>>>>>>` | git conflict markers HEAD | Il faut savoir lire quelle version est la tienne et laquelle vient de l'autre branche.
- Résoudre : corriger, `git add`, `git commit` (ou `--abort`) | résoudre conflit git vscode merge editor | Les quatre gestes que tu feras en équipe, dans le terminal ou dans VS Code.

@@ schema
~~~mermaid
flowchart LR
  B["Commit de départ commun<br/>Plat : lasagnes"] --> O["Ta branche (HEAD)<br/>Plat : pizza"]
  B --> T["menu-hiver<br/>Plat : couscous"]
  O --> F{"git merge menu-hiver<br/>même ligne changée<br/>des deux côtés"}
  T --> F
  F -->|"Git écrit les deux versions<br/>entre les marqueurs"| C["menu.txt en conflit"]
  C -->|"tu choisis, tu enlèves les marqueurs<br/>git add + git commit"| M(("commit de fusion"))
~~~

Git compare toujours **trois** versions. Si une seule des deux branches a changé une ligne par rapport au départ commun, il garde ce changement tout seul. Il ne s'arrête que si les deux l'ont changée différemment.

@@ zoom
### Lire un conflit sans paniquer

~~~text
Entrée : salade
<<<<<<< HEAD                 ← début de TA version (la branche où tu es)
Plat : pizza
=======                      ← séparation
Plat : couscous
>>>>>>> menu-hiver           ← fin de LEUR version (la branche fusionnée)
Dessert : fruit
~~~

Les lignes hors des marqueurs (l'entrée, le dessert) ont déjà été fusionnées. Tu n'as à décider que pour la zone entre `<<<<<<<` et `>>>>>>>`. Le résultat final peut être l'une des deux versions, ou un mélange : `Plat : pizza ou couscous`.

### Pendant un `git pull`, c'est pareil

`git pull` récupère le travail de GitHub **et le fusionne** (leçon « GitHub : clone, push et pull »). Si ton collègue a changé les mêmes lignes que toi, le conflit arrive pendant le `pull`, et se résout exactement de la même façon. L'autre version s'appelle alors `origin/main` dans les marqueurs.

### Vérifier qu'il ne reste aucun marqueur

Avant de commiter, un `grep` dans tout le projet évite les mauvaises surprises :

~~~bash
grep -rn "<<<<<<<\|>>>>>>>" .
~~~

Aucune réponse = aucun marqueur oublié.

### Le conflit est un signal, pas une erreur

Un conflit veut souvent dire que deux personnes travaillent sur la même chose sans le savoir. La bonne réaction n'est pas seulement de choisir une version : c'est parfois d'aller voir le collègue pour savoir laquelle est la bonne.

@@ predict
Sur `main`, tu ajoutes une ligne **à la fin** de `notes.txt`. Sur la branche `idees`, ton collègue ajoute aussi une ligne **à la fin** de `notes.txt`, différente de la tienne. Tu fusionnes `idees` dans `main`. Conflit ou pas ?

@@ predict-answer
**Conflit.** Les deux ajouts sont au même endroit (après la dernière ligne commune) : Git ne sait pas lequel mettre en premier, ni s'il faut garder les deux. Le résultat attendu est souvent « les deux lignes », mais c'est à toi de le dire. C'est un des conflits les plus fréquents en équipe, par exemple quand deux personnes ajoutent chacune une ligne à la fin d'un fichier de configuration ou d'un `requirements.txt`.

@@ practice
Dans `/workspaces/labo-git`, provoque un vrai conflit, résous-le dans l'éditeur de fusion de VS Code, puis entraîne-toi à abandonner une fusion.

@@ constraints
- Deux branches ont modifié la même ligne de `menu.txt`, et leur fusion a produit un conflit
- Tu as résolu ce conflit dans VS Code (liens au-dessus du conflit, ou Merge Editor), et la fusion est terminée par un commit
- `menu.txt` ne contient plus aucun marqueur de conflit
- Sur un deuxième conflit, tu as utilisé `git merge --abort`, et `git status` est propre

@@ guide
### 1. Prépare le terrain

~~~bash
cd /workspaces/labo-git
printf "Entrée : salade\nPlat : lasagnes\nDessert : fruit\n" > menu.txt
git add menu.txt
git commit -m "Ajoute le menu"
~~~

`printf` écrit plusieurs lignes d'un coup : chaque `\n` est un retour à la ligne.

### 2. Deux branches changent la même ligne

Crée une branche `menu-hiver`. Ouvre `menu.txt` dans l'éditeur (`code menu.txt`), remplace `lasagnes` par `couscous`, enregistre, puis fais un commit. Reviens sur `main`, remplace cette fois `lasagnes` par `pizza`, enregistre, commit.

### 3. Fusionne et lis le conflit

Depuis `main` : `git merge menu-hiver`. Git répond `CONFLICT (content): Merge conflict in menu.txt`. Lance `git status` : `menu.txt` est sous `Unmerged paths`, en `both modified`. Puis `cat menu.txt` : tu retrouves les marqueurs.

### 4. Résous-le dans VS Code

Ouvre `menu.txt` dans l'éditeur. Au-dessus de la zone colorée, clique sur **Accept Current Change**, **Accept Incoming Change** ou **Accept Both Changes**, ou ouvre **Resolve in Merge Editor**. Vérifie que le fichier ne contient plus aucun marqueur, enregistre.

### 5. Termine la fusion

`git add menu.txt` (le Merge Editor le fait pour toi avec **Complete Merge**), puis `git commit --no-edit` : le message de fusion par défaut convient. `git log --oneline --graph` montre la fusion.

### 6. Un deuxième conflit, que tu abandonnes

Recommence les étapes 2 et 3 avec une branche `promo` qui change le dessert, et `main` qui le change autrement. Au moment du conflit, ne choisis pas : `git merge --abort`. Puis `git status` et `cat menu.txt` : tout est comme avant la fusion.

@@ hints
- Le conflit n'apparaît que si `main` et l'autre branche ont **toutes les deux** un commit qui change la même ligne.
- Après avoir choisi dans VS Code, n'oublie pas d'enregistrer le fichier (**Ctrl + S**) avant `git add`.
- `git status` affiche toujours la commande pour annuler la fusion en cours.

@@ solution
~~~bash
cd /workspaces/labo-git

# 1. Le menu de départ
printf "Entrée : salade\nPlat : lasagnes\nDessert : fruit\n" > menu.txt
git add menu.txt
git commit -m "Ajoute le menu"

# 2. Deux branches qui changent la même ligne
git switch -c menu-hiver
sed -i 's/lasagnes/couscous/' menu.txt        # (ou à la main dans l'éditeur)
git commit -am "Plat d'hiver : couscous"
git switch main
sed -i 's/lasagnes/pizza/' menu.txt
git commit -am "Plat : pizza"

# 3. La fusion, et le conflit
git merge menu-hiver                          # CONFLICT (content): Merge conflict in menu.txt
git status                                    # both modified: menu.txt
cat menu.txt                                  # <<<<<<< HEAD … ======= … >>>>>>> menu-hiver

# 4. Résoudre dans VS Code (ou écrire la version finale à la main), puis :
grep -n "<<<<<<<\|>>>>>>>" menu.txt           # aucune réponse = aucun marqueur
git add menu.txt
git commit --no-edit                          # 5. la fusion est terminée
git log --oneline --graph

# 6. Un conflit qu'on abandonne
git switch -c promo
sed -i 's/fruit/glace/' menu.txt && git commit -am "Dessert : glace"
git switch main
sed -i 's/fruit/tarte/' menu.txt && git commit -am "Dessert : tarte"
git merge promo                               # CONFLICT
git merge --abort
git status                                    # nothing to commit, working tree clean
~~~

`sed -i 's/ancien/nouveau/' fichier` remplace un mot dans un fichier sans ouvrir d'éditeur. Le pas à pas fait la même chose dans VS Code.

@@ selfcheck
- J'ai vu les marqueurs dans `menu.txt`, puis les liens « Accept… » dans VS Code
- `git log --oneline --graph` montre mon commit de fusion
- Après `git merge --abort`, `git status` est propre

@@ breakfix
Provoque un conflit, puis fais exprès la pire erreur : `git add menu.txt` **sans** enlever les marqueurs, puis `git commit --no-edit`. Git accepte ! Les marqueurs sont maintenant dans l'historique. Répare : `main` doit contenir un fichier propre, et tu ne dois pas réécrire le commit de fusion.

@@ breakfix-hints
- Git ne vérifie pas le contenu de tes fichiers : `git add` veut seulement dire « c'est réglé ».
- Le commit de fusion existe. Pour corriger sans réécrire l'historique : un nouveau commit.
- Corrige le fichier, puis `git commit -am "..."`. Et la prochaine fois, le `grep` du zoom avant de commiter.

@@ breakfix-answer
~~~bash
grep -n "<<<<<<<\|=======\|>>>>>>>" menu.txt   # les marqueurs sont bien là
# corrige menu.txt dans l'éditeur : garde la bonne ligne, supprime les trois marqueurs
git commit -am "Corrige le conflit mal résolu dans menu.txt"
~~~
Sur un commit de fusion pas encore partagé, `git commit --amend` marcherait aussi. Mais un commit de correction est toujours sûr, même après un `push`. C'est une erreur fréquente en équipe : un fichier de code avec des marqueurs ne marche plus du tout, et c'est souvent la CI qui le détecte.

@@ explain
Explique à un camarade pourquoi un conflit arrive, comment lire les marqueurs, et les quatre gestes pour le résoudre.

@@ resources
- [Pro Git, en français : conflits de fusion](https://git-scm.com/book/fr/v2/Les-branches-avec-Git-Branches-et-fusions%C2%A0%3A-les-bases#s_basic_merge_conflicts)
- [VS Code : résoudre les conflits de fusion (en anglais)](https://code.visualstudio.com/docs/sourcecontrol/merge-conflicts)
- [GitHub Skills : Resolve merge conflicts (en anglais, interactif)](https://github.com/skills/resolve-merge-conflicts)

@@ teaser
- [00-10] En équipe, le même conflit arrive dans une pull request, quand ton collègue a fusionné avant toi. Tu le résoudras de la même façon.

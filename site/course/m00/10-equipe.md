# En équipe : quand le travail se croise

À plusieurs, le travail des uns finit toujours par croiser celui des autres. Deux situations reviennent sans cesse : ton `push` est refusé parce qu'un collègue a poussé avant toi, et ta pull request est en conflit parce qu'une autre a été fusionnée avant la tienne. Les deux se règlent avec ce que tu sais déjà.

## 🔑 Cas 1 : à deux sur la même branche, push refusé

Sam et toi travaillez sur la même branche. Sam pousse en premier. Ton `git push` est refusé (`rejected`, `fetch first`), comme à la leçon « GitHub : clone, push et pull ».

La réponse : `git pull` (le travail de Sam est fusionné avec le tien), puis `git push`.

Ce qu'on ne fait **jamais** : `git push --force` sur une branche partagée. Ça « marche »… en effaçant les commits de Sam sur GitHub.

## 🔑 Cas 2 : ta pull request est en conflit avec `main`

Tu as ouvert ta PR. Pendant que Sam la relisait, la PR d'un autre collègue, qui touchait aux mêmes lignes, a été fusionnée dans `main`. GitHub affiche alors : *This branch has conflicts that must be resolved*, et le bouton **Merge** est grisé.

Ce n'est pas à `main` de s'adapter : c'est **ta branche** qui doit récupérer le nouveau `main`.

~~~bash
git switch ma-branche
git pull origin main          # récupère main depuis GitHub et le fusionne dans ta branche
# conflit : résous-le comme à la leçon « Ton premier conflit »
git add fichier
git commit                    # le commit de fusion
git push                      # la PR se met à jour, plus de conflit
~~~

`git pull origin main` veut dire : « va chercher la branche `main` de `origin`, et fusionne-la dans la branche où je suis ». La PR redevient fusionnable, et le relecteur voit ta résolution.

S'il n'y a pas de conflit mais que ta branche est seulement **en retard** sur `main`, GitHub propose parfois un bouton **Update branch**, qui fait la même fusion pour toi, sur GitHub. N'oublie pas ensuite le `git pull` chez toi.

## 🔑 Les réflexes d'une équipe qui travaille bien

| Réflexe | Pourquoi |
| --- | --- |
| `git pull` en début de séance, et avant de créer une branche | Tu pars du dernier état, tu évites les conflits |
| Une branche par tâche, qui vit peu de temps (un à trois jours) | Moins elle vit, moins elle diverge de `main` |
| De petits commits, avec des messages clairs | Ton historique se relit, et s'annule facilement |
| Des petites PR, avec Quoi / Pourquoi / Comment vérifier | Elles sont relues vite et bien |
| Pousser au moins une fois par jour | Ton travail est sauvegardé, et visible par l'équipe |
| Relire les PR des autres, rapidement | Une PR qui attend une revue bloque quelqu'un |
| Jamais de secret dans un commit, jamais de `--force` sur une branche partagée | Ce sont les deux erreurs qui coûtent le plus cher |
| Prévenir quand tu touches à un fichier que tout le monde utilise | Un message sur le chat d'équipe évite un conflit |
| Supprimer les branches fusionnées | Le dépôt reste lisible |

## Et `git rebase` ?

Tu entendras parler de `git rebase`, une autre façon de remettre ta branche à jour : au lieu d'un commit de fusion, tes commits sont « rejoués » au bout de `main`, pour un historique en ligne droite. Certaines équipes l'utilisent, d'autres l'interdisent. Commence par la fusion, que tu maîtrises maintenant, et demande la règle de ton équipe au PFE.

@@ essentiel
**En une image.** Deux collègues écrivent le même rapport. L'un finit forcément avant l'autre, et le second doit d'abord récupérer son travail avant de rendre le sien.

| Ta situation | Tu fais |
| --- | --- |
| Push refusé : un collègue a poussé avant toi sur ta branche | `git pull`, puis `git push` |
| Ta PR est en conflit avec `main` | dans ta branche : `git pull origin main`, tu résous, `git add`, `git commit`, `git push` |
| Ta PR est juste en retard sur `main` | bouton **Update branch** sur GitHub, puis `git pull` chez toi |

📌 **À retenir :** ce n'est jamais à `main` de s'adapter. C'est **ta branche** qui récupère le nouveau `main`.

⚠️ **Attention :** **jamais** de `git push --force` sur une branche partagée : ça efface le travail des autres sur GitHub.

💡 **Astuce :** trois réflexes évitent presque tous les ennuis : `git pull` en début de séance, des branches qui vivent peu, des petites PR.

@@ labo
{
  "id": "00-10",
  "niveaux": [
    {
      "titre": "À deux sur la même branche",
      "intro": "Sam et toi écrivez un rapport ensemble, sur la branche `rapport`. Sam vient de pousser sa conclusion. Toi, tu as écrit ton introduction et fait un commit. Pousse : refusé. Récupère le travail de Sam, puis pousse à nouveau. Interdit d'utiliser `--force`.",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "git config pull.rebase false", "echo '# Projet' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "git switch -c rapport", "echo 'Plan du rapport' > plan.md", "git add plan.md", "git commit -m 'Ajoute le plan'", "git push -u origin rapport", "collegue: git clone https://github.com/toi/projet.git", "git config pull.rebase false", "git switch rapport", "echo 'Conclusion de Sam' > conclusion.md", "git add conclusion.md", "git commit -m 'Ajoute la conclusion'", "git push", "moi: echo 'Mon introduction' > intro.md", "git add intro.md", "git commit -m 'Ajoute l introduction'"],
      "buts": ["cmd:git push | Tu as tenté le push (et lu le refus)", "file:conclusion.md | La conclusion de Sam est chez toi", "synced:rapport | GitHub a ta branche `rapport` avec ton introduction", "merges>=1 | Ton travail et celui de Sam sont réunis par une fusion : rien n'a été écrasé"],
      "indices": ["`git pull`, puis `git push`.", "Tu es déjà relié à `origin/rapport` : `git pull` et `git push` sans rien préciser suffisent."],
      "solution": ["git push", "git pull", "git push", "git log --oneline --graph"]
    },
    {
      "titre": "Ta pull request est en conflit",
      "intro": "Ta PR #1 change le titre du README. Mais la PR #2 de Sam, qui change **la même ligne**, vient d'être fusionnée dans `main`. Regarde le panneau GitHub : ta PR est en conflit, le bouton est grisé. Remets ta branche à jour avec `main`, résous le conflit, pousse. Puis Sam approuve et fusionne ta PR.",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "git config pull.rebase false", "echo '# Projet' > README.md", "echo 'Un projet de données.' >> README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "collegue: git clone https://github.com/toi/projet.git", "git config pull.rebase false", "@protect", "moi: git switch -c titre", "echo '# Projet data engineering' > README.md", "echo 'Un projet de données.' >> README.md", "git commit -am 'Titre plus précis'", "git push -u origin titre", "gh pr create --title 'Titre plus précis'", "collegue: git switch -c titre-taxis", "echo '# Projet taxis de New York' > README.md", "echo 'Un projet de données.' >> README.md", "git commit -am 'Titre : taxis'", "git push -u origin titre-taxis", "gh pr create --title 'Titre : taxis'", "moi: gh pr review 2 --approve", "collegue: gh pr merge 2 --merge --delete-branch", "git switch main", "git pull", "moi: git status"],
      "buts": ["cmd:git pull origin main or cmd:git merge origin/main | Tu as fait venir le nouveau `main` dans ta branche", "nomarkers:README.md | Le conflit est résolu, sans marqueur", "prmerged>=2 | Ta PR est fusionnée à son tour", "github.nomarkers:README.md | Le `main` de GitHub est propre"],
      "indices": ["Tu es sur `titre` : `git pull origin main`. Lis le conflit avec `cat README.md`.", "Réécris le README (`echo '# Projet taxis de New York, en data engineering' > README.md` puis `echo 'Un projet de données.' >> README.md`), puis `git add README.md`, `git commit -m \"...\"`, `git push`. Ensuite, terminal de Sam : approuver, puis fusionner."],
      "solution": ["git pull origin main", "cat README.md", "echo '# Projet taxis de New York, en data engineering' > README.md", "echo 'Un projet de données.' >> README.md", "git add README.md", "git commit -m 'Fusionne main dans titre'", "git push", "collegue: gh pr review 1 --approve", "gh pr merge 1 --merge --delete-branch"]
    },
    {
      "titre": "La journée type, sans aide",
      "intro": "Tout le cycle, à deux, avec `main` protégée. **Toi** : ajoute `faq.md` sur une branche, et ouvre une PR. **Sam** : ajoute `equipe.md` sur une autre branche, et ouvre une PR. Chacun approuve la PR de l'autre, puis les deux PR sont fusionnées. À la fin, les deux ordinateurs ont un `main` à jour.",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "git config pull.rebase false", "echo '# Projet' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "collegue: git clone https://github.com/toi/projet.git", "git config pull.rebase false", "@protect", "moi: git status"],
      "buts": ["prmerged>=2 | Deux pull requests fusionnées", "github.file:faq.md | `faq.md` est dans `main` sur GitHub", "github.file:equipe.md | `equipe.md` aussi", "on:main | Tu es sur `main`", "synced:main | Ton `main` est à jour", "collegue.synced:main | Celui de Sam aussi"],
      "indices": ["Pour chacun : `git switch -c …`, un fichier, `git add`, `git commit`, `git push -u origin …`, puis une PR.", "Approuver la PR de l'autre depuis **son** terminal à soi, fusionner, puis sur les deux : `git switch main` et `git pull`."],
      "solution": ["git switch -c ajout-faq", "echo 'Q : où sont les données ? R : dans le bucket.' > faq.md", "git add faq.md", "git commit -m 'Ajoute la FAQ'", "git push -u origin ajout-faq", "gh pr create --title 'Ajoute la FAQ'", "collegue: git switch -c ajout-equipe", "echo 'Toi et Sam' > equipe.md", "git add equipe.md", "git commit -m 'Ajoute l équipe'", "git push -u origin ajout-equipe", "gh pr create --title 'Ajoute l équipe'", "gh pr review 1 --approve", "gh pr merge 1 --merge --delete-branch", "moi: gh pr review 2 --approve", "gh pr merge 2 --merge --delete-branch", "git switch main", "git pull", "collegue: git switch main", "git pull"],
      "bravo": "C'est exactement la journée d'une équipe de data engineers. Tu es prêt pour le travail en équipe du PFE.",
      "bonus": true
    }
  ]
}

@@ cles
- Push refusé sur une branche partagée : pull, puis push | git push rejected pull then push | Ça arrive plusieurs fois par semaine en équipe. Le `--force` n'est jamais la réponse.
- Remettre sa branche à jour avec `main` | git update branch with main merge conflict pull request | C'est la façon de débloquer une PR en conflit, sans toucher à `main`.
- Les réflexes d'équipe | git workflow équipe bonnes pratiques | Ce sont eux qui font qu'une équipe avance vite, au PFE comme en entreprise.

@@ schema
~~~mermaid
gitGraph
  commit id: "Premier commit"
  branch titre
  checkout main
  branch titre-taxis
  checkout titre
  commit id: "Ton titre (PR 1)"
  checkout titre-taxis
  commit id: "Titre de Sam (PR 2)"
  checkout main
  merge titre-taxis id: "PR 2 fusionnée"
  checkout titre
  merge main id: "git pull origin main + conflit résolu"
  checkout main
  merge titre id: "PR 1 fusionnée"
~~~

La PR de Sam est fusionnée en premier. Ta branche récupère ce nouveau `main` (`git pull origin main`), tu résous le conflit **dans ta branche**, tu pousses, et ta PR redevient fusionnable.

@@ zoom
### Pourquoi on résout le conflit dans **sa** branche

`main` est la référence de toute l'équipe : on n'y fait jamais d'essais. En fusionnant `main` dans ta branche, tu résous le conflit chez toi, tu peux tester que tout marche encore, et le relecteur voit ta résolution dans la PR avant qu'elle n'arrive dans `main`.

### `git pull origin main` ou `git merge origin/main` ?

Les deux marchent. `git pull origin main` fait le `fetch` et la fusion en une commande. `git fetch` puis `git merge origin/main` fait la même chose en deux temps, ce qui te laisse regarder (`git log --oneline --graph --all`) avant de fusionner.

### Le bouton « Resolve conflicts » de GitHub

Pour un petit conflit dans un fichier texte, GitHub propose un éditeur en ligne (**Resolve conflicts**) : tu enlèves les marqueurs dans le navigateur, puis **Mark as resolved** et **Commit merge**. Pratique, mais tu ne peux pas tester ton code avant. Pour du vrai code, résous en local.

### Ce que veut dire `--force`, et pourquoi c'est dangereux

`git push --force` dit à GitHub : « mets la branche sur mon commit, même si tu perds des commits ». Sur une branche que toi seul utilises, c'est parfois utile (après un `rebase`, par exemple). Sur une branche partagée, tu effaces le travail de tes collègues sans qu'ils le sachent. Si un jour tu en as vraiment besoin, préfère `git push --force-with-lease`, qui refuse s'il y a sur GitHub des commits que tu n'as jamais vus.

@@ predict
Ta PR est en conflit avec `main`. Ton collègue te propose : « Fusionne directement ta branche dans `main` sur ton ordinateur, résous le conflit et pousse `main` ». Pourquoi est-ce une mauvaise idée, et qu'est-ce qui se passerait avec un `main` protégé ?

@@ predict-answer
Ça contourne la revue : ta résolution de conflit arriverait dans `main` sans que personne ne l'ait relue ni testée. Avec un `main` **protégé**, GitHub refuse même le `push` (`protected branch hook declined`). La bonne méthode : fusionner `main` **dans ta branche**, résoudre, pousser ta branche, et laisser la PR faire son travail.

@@ practice
Avec tes deux copies (ton fork et `~/collegue`), provoque le conflit le plus courant en équipe : deux PR qui changent la même ligne. Fusionne celle de Sam, puis débloque la tienne.

@@ constraints
- Deux branches, une chez toi et une chez Sam, changent la **même ligne** de `mon-travail/equipe/regles.md`, et chacune a sa PR vers le `main` de ton fork
- La PR de Sam est fusionnée en premier, et GitHub montre que la tienne est en conflit
- Tu as fusionné le nouveau `main` dans ta branche, résolu le conflit en local et poussé
- Ta PR est fusionnée à son tour, et les deux copies ont un `main` à jour, sans branche qui traîne

@@ guide
### 1. Les deux partent de `main` à jour

Dans ton terminal (`/workspaces/data-engineering-zoomcamp`) **et** dans celui de Sam (`~/collegue`) : `git switch main` puis `git pull`. Les deux ont le fichier `mon-travail/equipe/regles.md` de la leçon précédente.

### 2. Deux branches, la même ligne

- **Chez Sam** : branche `equipe/titre-sam`. Remplace la première ligne du fichier par `# Les règles de notre équipe`. Commit, push avec `-u`, PR vers le `main` de ton fork.
- **Chez toi** : branche `equipe/titre-toi`. Remplace la même ligne par `# Nos règles pour le PFE`. Commit, push avec `-u`, PR vers le `main` de ton fork.

### 3. La PR de Sam passe en premier

Sur GitHub, fusionne la PR de Sam (**Merge pull request**, **Confirm merge**, **Delete branch**). Ouvre maintenant ta PR : en bas, *This branch has conflicts that must be resolved*. Le bouton de fusion est grisé.

### 4. Débloque ta PR, chez toi

Dans ton terminal, sur ta branche :

~~~bash
git switch equipe/titre-toi
git pull origin main
~~~

Git annonce le conflit. Ouvre le fichier dans VS Code, choisis le titre final (ou un mélange), enlève les marqueurs, enregistre. Puis `git add`, `git commit --no-edit` et `git push`. Retourne sur ta PR : le conflit a disparu, et la PR montre un commit de fusion.

### 5. Fusionne et nettoie

Fusionne ta PR sur GitHub, supprime la branche. Puis, dans les **deux** terminaux : `git switch main`, `git pull`, et `git branch -d` sur la branche locale de chacun.

@@ hints
- Le conflit n'apparaît que si les deux branches changent **la même ligne** et partent du même `main`.
- `git pull origin main` se lance depuis **ta** branche, pas depuis `main`.
- Après le `push`, rafraîchis la page de ta PR : GitHub recalcule si elle est fusionnable.

@@ solution
~~~bash
# 1. Les deux à jour
cd /workspaces/data-engineering-zoomcamp && git switch main && git pull
cd ~/collegue && git switch main && git pull

# 2. Chez Sam (~/collegue)
git switch -c equipe/titre-sam
sed -i '1s/.*/# Les règles de notre équipe/' mon-travail/equipe/regles.md
git commit -am "docs: titre des règles"
git push -u origin equipe/titre-sam          # puis la PR sur GitHub

# 2. Chez toi (ton fork)
cd /workspaces/data-engineering-zoomcamp
git switch -c equipe/titre-toi
sed -i '1s/.*/# Nos règles pour le PFE/' mon-travail/equipe/regles.md
git commit -am "docs: titre pour le PFE"
git push -u origin equipe/titre-toi          # puis la PR sur GitHub

# 3. Sur GitHub : fusionner la PR de Sam. La tienne passe « en conflit ».

# 4. Débloquer ta PR
git pull origin main                         # CONFLICT (content): Merge conflict in mon-travail/equipe/regles.md
code mon-travail/equipe/regles.md            # choisir le titre, enlever les marqueurs, Ctrl + S
git add mon-travail/equipe/regles.md
git commit --no-edit
git push                                     # la PR redevient fusionnable

# 5. Après la fusion de ta PR sur GitHub, dans les deux copies
git switch main && git pull && git branch -d equipe/titre-toi
cd ~/collegue && git switch main && git pull && git branch -d equipe/titre-sam
~~~

`sed -i '1s/.*/texte/' fichier` remplace la ligne 1 d'un fichier. Le pas à pas fait la même chose dans l'éditeur.

@@ team
À deux, pour de vrai : ton camarade (collaborateur de ton fork, voir la leçon précédente) prend le rôle de Sam. Mettez-vous d'accord pour modifier la même ligne en même temps, sans vous prévenir de ce que vous écrivez. Celui dont la PR est fusionnée en second résout le conflit, et l'autre relit sa résolution.

@@ selfcheck
- J'ai vu le message *This branch has conflicts that must be resolved* sur ma PR
- J'ai résolu le conflit dans ma branche, pas dans `main`
- `git log --oneline --graph -6` dans mon fork montre les deux PR fusionnées

@@ breakfix
Sam et toi travaillez sur la même branche `equipe/faq`. Sam crée la branche, ajoute `mon-travail/equipe/faq.md` et pousse. Toi, tu récupères la branche (`git fetch`, puis `git switch equipe/faq`), tu ajoutes une question **à la fin** du fichier, et tu commites. Pendant ce temps, Sam ajoute aussi une question à la fin, commite et pousse. Ton `push` est refusé, puis ton `pull` fait un conflit. Termine sans `--force`, en gardant les deux questions.

@@ breakfix-hints
- `git switch equipe/faq` crée ta branche locale à partir de `origin/equipe/faq`, si tu as fait `git fetch` avant.
- Deux ajouts à la fin du même fichier : c'est le conflit de la question « Prédire » de la leçon « Ton premier conflit ».
- Garde les deux lignes, enlève les marqueurs, puis `git add`, `git commit --no-edit`, `git push`.

@@ breakfix-answer
~~~bash
git push                   # ! [rejected] equipe/faq -> equipe/faq (fetch first)
git pull                   # CONFLICT dans mon-travail/equipe/faq.md
code mon-travail/equipe/faq.md   # garder les DEUX questions, enlever les marqueurs
git add mon-travail/equipe/faq.md
git commit --no-edit
git push                   # accepté : rien n'est perdu
~~~
Le `--force` aurait « marché », en effaçant la question de Sam sur GitHub. Le refus de Git est une protection, pas un obstacle.

@@ explain
Explique à un camarade de PFE les deux situations de cette leçon (push refusé, PR en conflit), comment tu les règles, et trois réflexes d'équipe qui les rendent plus rares.

@@ resources
- [GitHub Docs, en français : résoudre un conflit de fusion sur GitHub](https://docs.github.com/fr/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-on-github)
- [GitHub Docs, en français : maintenir ta PR à jour avec la branche de base](https://docs.github.com/fr/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/keeping-your-pull-request-in-sync-with-the-base-branch)
- [Pro Git, en français : contribution à un projet (petite équipe)](https://git-scm.com/book/fr/v2/Git-distribu%C3%A9-Contribution-%C3%A0-un-projet)
- [Learn Git Branching, en français : « Remote », niveaux sur les historiques divergents](https://learngitbranching.js.org/?locale=fr_FR)

@@ teaser
- [00-14] Juste après : toute la partie Git sur une page, l'antisèche à garder ouverte, et les 10 erreurs du débutant.
- [00-11] Ton site en ligne se met à jour par une branche et une PR, comme dans cette leçon.
- [01-13] Au module 1, tu te resserviras de `git revert` pour annuler un changement Terraform déjà poussé, sans réécrire l'historique de l'équipe.

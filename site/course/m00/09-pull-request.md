# En équipe : branche, pull request et revue

Tout ce que tu as appris jusqu'ici sert à ce moment : travailler à plusieurs sur le même dépôt sans se marcher dessus. C'est ce que tu feras chaque jour en stage, et ce que les recruteurs regardent sur ton GitHub.

## 🔑 La règle d'or : personne ne pousse sur `main`

En équipe, `main` doit toujours marcher. Personne n'y pousse directement. Chaque tâche suit le même chemin :

1. Tu pars de `main` à jour : `git switch main` puis `git pull`.
2. Tu crées une branche pour ta tâche : `git switch -c ajout-ingestion`.
3. Tu fais tes commits, puis tu pousses ta branche : `git push -u origin ajout-ingestion`.
4. Sur GitHub, tu ouvres une **pull request**.
5. Un collègue **relit** ton code, commente, demande des changements ou approuve.
6. Tu corriges si besoin : de nouveaux commits sur la même branche, puis `git push`. La pull request se met à jour toute seule.
7. Quand c'est approuvé, on **fusionne** la pull request dans `main`, sur GitHub, et on supprime la branche.
8. Chacun remet son `main` à jour : `git switch main`, `git pull`.

## 🔑 Une pull request, c'est quoi ?

Une **pull request** (PR, ou *merge request* sur GitLab) est une demande, sur GitHub : « fusionne ma branche dans `main` ». C'est surtout un **lieu de discussion** autour de ton code :

- un titre et une description (quoi, pourquoi, comment vérifier) ;
- l'onglet **Files changed**, avec chaque ligne ajoutée (en vert) ou supprimée (en rouge) ;
- des commentaires sur des lignes précises, et des **suggestions** de code que l'auteur peut accepter d'un clic ;
- les vérifications automatiques (la CI, que tu verras plus tard) ;
- le bouton **Merge pull request**.

## 🔑 La revue de code

Relire le code d'un collègue est une partie normale du travail, pas une punition. Sur GitHub, le relecteur ouvre **Files changed**, commente les lignes, puis termine sa revue avec **Review changes** et l'un de ces choix :

| Choix | Ce qu'il veut dire |
| --- | --- |
| **Comment** | Des remarques, sans bloquer |
| **Request changes** | « Corrige ça avant de fusionner » |
| **Approve** | « C'est bon pour moi, on peut fusionner » |

On ne peut pas approuver **sa propre** pull request. Beaucoup d'équipes **protègent** `main` sur GitHub : interdiction de pousser directement, et au moins une approbation obligatoire avant de fusionner. Dans le Labo Git, c'est le cadenas « main protégée ».

## Une bonne pull request

- **Petite** : elle fait une seule chose. Une PR de 50 lignes se relit en 5 minutes. Une PR de 2 000 lignes ne se relit jamais vraiment.
- **Un titre clair**, comme un message de commit : `Ajoute l'ingestion des zones de taxi`.
- **Une description** en trois parties : **Quoi** (ce qui change), **Pourquoi** (le problème réglé), **Comment vérifier** (la commande à lancer, le résultat attendu).

## Le piège des forks

Ton dépôt est un **fork**. Quand tu ouvres une pull request, GitHub propose par défaut de l'envoyer **au dépôt officiel de DataTalksClub**. Ce n'est pas ce que tu veux. Sur la page de création, en haut :

- **base repository** doit être `gitabdelhub/data-engineering-zoomcamp`, branche `main` ;
- **head repository** : ton fork, ta branche.

Si tu vois `DataTalksClub/data-engineering-zoomcamp` dans « base », change-le avant de cliquer.

@@ labo
{
  "id": "00-09",
  "niveaux": [
    {
      "titre": "Ta première pull request",
      "intro": "Toi et Sam travaillez sur le même dépôt GitHub, et `main` est protégée (le cadenas). Ta tâche : ajouter un fichier `contact.md`. Fais-le comme en équipe : une branche `ajout-contact`, un commit, la branche poussée sur GitHub, puis une pull request (avec le formulaire du panneau GitHub, ou `gh pr create --title \"...\"`).",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "echo '# Projet de l équipe' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "git config pull.rebase false", "collegue: git clone https://github.com/toi/projet.git", "git config pull.rebase false", "@protect", "moi: git status"],
      "buts": [
        "branch:ajout-contact | La branche `ajout-contact` existe",
        "github.branch:ajout-contact | Elle est poussée sur GitHub",
        "pr:open | Une pull request est ouverte",
        "github.commits=1 | `main` sur GitHub n'a pas bougé : rien n'a été poussé dessus"
      ],
      "indices": ["`git switch -c ajout-contact`, puis `echo 'Tél : 01 23 45 67 89' > contact.md`, `git add` et `git commit`.", "`git push -u origin ajout-contact`, puis le bouton « Ouvrir une pull request » du panneau GitHub."],
      "solution": ["git switch -c ajout-contact", "echo 'Tél : 01 23 45 67 89' > contact.md", "git add contact.md", "git commit -m 'Ajoute le contact'", "git push -u origin ajout-contact", "gh pr create --title 'Ajoute le contact'"]
    },
    {
      "titre": "La revue de Sam",
      "intro": "Ta pull request #1 est ouverte. Passe sur le **terminal de Sam** (onglet au-dessus du terminal) : Sam relit et clique sur « Demander des changements », parce qu'il manque l'e-mail. Reviens sur **ton** terminal : ajoute la ligne `Mail : equipe@exemple.com` à `contact.md`, commite, pousse. Regarde la PR se mettre à jour. Sam approuve, puis fusionne la PR.",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "echo '# Projet de l équipe' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "git config pull.rebase false", "collegue: git clone https://github.com/toi/projet.git", "git config pull.rebase false", "@protect", "moi: git switch -c ajout-contact", "echo 'Tél : 01 23 45 67 89' > contact.md", "git add contact.md", "git commit -m 'Ajoute le contact'", "git push -u origin ajout-contact", "gh pr create --title 'Ajoute le contact'"],
      "buts": [
        "pr:changes | Sam a demandé des changements",
        "github.contains:main,ajout-contact or pr:merged | Ta correction est poussée sur la branche de la PR",
        "pr:approved | Sam a approuvé",
        "pr:merged | La pull request est fusionnée",
        "github.file:contact.md~Mail | `main` sur GitHub contient le contact avec l'e-mail"
      ],
      "indices": ["Clique sur « Terminal de Sam », puis sur « Demander des changements » dans la PR (ou `gh pr review 1 --request-changes`).", "Sur ton terminal : `echo 'Mail : equipe@exemple.com' >> contact.md`, `git commit -am \"Ajoute l'e-mail\"`, `git push`. Puis de nouveau Sam : « Approuver », puis « Merge pull request »."],
      "solution": ["collegue: gh pr review 1 --request-changes -b 'Il manque l e-mail'", "moi: echo 'Mail : equipe@exemple.com' >> contact.md", "git commit -am 'Ajoute l e-mail'", "git push", "collegue: gh pr review 1 --approve", "gh pr merge 1 --merge"]
    },
    {
      "titre": "Après la fusion, chacun se met à jour",
      "intro": "La PR est fusionnée sur GitHub, et Sam a supprimé la branche là-bas. Mais vos deux ordinateurs ne le savent pas encore : regarde leurs étiquettes `main`, en retard. Sur **ton** ordinateur : reviens sur `main`, récupère, puis supprime ta branche locale. Sur l'ordinateur de **Sam** : récupère aussi.",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "echo '# Projet de l équipe' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "git config pull.rebase false", "collegue: git clone https://github.com/toi/projet.git", "git config pull.rebase false", "@protect", "moi: git switch -c ajout-contact", "echo 'Tél : 01 23 45 67 89' > contact.md", "git add contact.md", "git commit -m 'Ajoute le contact'", "git push -u origin ajout-contact", "gh pr create --title 'Ajoute le contact'", "collegue: gh pr review 1 --approve", "gh pr merge 1 --merge --delete-branch", "moi: git status"],
      "buts": [
        "on:main | Tu es sur `main`",
        "synced:main | Ton `main` a rattrapé GitHub",
        "nobranch:ajout-contact | Ta branche locale est supprimée",
        "collegue.synced:main | Le `main` de Sam a rattrapé GitHub aussi"
      ],
      "indices": ["Sur ton terminal : `git switch main`, `git pull`, `git branch -d ajout-contact`.", "Puis le terminal de Sam : `git pull`."],
      "solution": ["git switch main", "git pull", "git branch -d ajout-contact", "collegue: git pull"]
    },
    {
      "titre": "Oups : un commit directement sur main",
      "intro": "Par réflexe, tu as fait un commit directement sur `main`. Essaie de le pousser : `main` est protégée, GitHub refuse. Pas de panique : crée une branche à partir de là où tu es (ton commit vient avec), pousse-la, ouvre une PR. Sam approuve et fusionne. Puis remets ton `main` à jour.",
      "postes": ["moi", "github", "collegue"],
      "depart": ["git init", "echo '# Projet de l équipe' > README.md", "git add README.md", "git commit -m 'Premier commit'", "git remote add origin https://github.com/toi/projet.git", "git push -u origin main", "git config pull.rebase false", "collegue: git clone https://github.com/toi/projet.git", "git config pull.rebase false", "@protect", "moi: echo '# Projet de l équipe data' > README.md", "git commit -am 'Corrige le titre'"],
      "buts": [
        "cmd:git push | Tu as vu GitHub refuser le push sur `main`",
        "pr:merged | Ton commit est arrivé dans `main` par une pull request",
        "on:main | Tu es revenu sur `main`",
        "synced:main | Ton `main` est à jour avec GitHub"
      ],
      "indices": ["`git switch -c corrige-titre` crée une branche sur ton commit. Puis `git push -u origin corrige-titre` et une PR.", "Sam approuve et fusionne. Ensuite, sur ton terminal : `git switch main` et `git pull`."],
      "solution": ["git push", "git switch -c corrige-titre", "git push -u origin corrige-titre", "gh pr create --title 'Corrige le titre'", "collegue: gh pr review 1 --approve", "gh pr merge 1 --merge --delete-branch", "moi: git switch main", "git pull"],
      "bravo": "Ton commit n'est jamais perdu : une branche n'est qu'une étiquette, tu peux toujours en poser une sur ton travail et passer par une PR."
    }
  ]
}

@@ cles
- Le flux branche → pull request → revue → fusion | github flow pull request | C'est la façon de travailler de presque toutes les équipes. Au PFE, on te le demandera dès la première semaine.
- La revue de code : commenter, demander des changements, approuver | code review github pull request | Relire et être relu fait partie du métier. Une bonne revue apprend autant à l'auteur qu'au relecteur.
- La branche `main` protégée | github branch protection rules | Elle explique pourquoi un push sur `main` est refusé en entreprise, et pourquoi la PR est obligatoire.

@@ schema
~~~mermaid
sequenceDiagram
  participant T as Toi (ton ordinateur)
  participant G as GitHub
  participant S as Sam (relecteur)
  T->>T: git switch -c ajout-contact, commits
  T->>G: git push -u origin ajout-contact
  T->>G: ouvre la pull request #1
  S->>G: relit Files changed, Request changes
  T->>T: corrige, git commit
  T->>G: git push (la PR se met à jour)
  S->>G: Approve, puis Merge pull request
  G-->>T: git switch main, git pull
  G-->>S: git switch main, git pull
~~~

La fusion se fait **sur GitHub**, pas dans un terminal. Après, chacun récupère le nouveau `main` avec `git pull`.

@@ zoom
### Ce qui se passe quand on clique sur « Merge pull request »

GitHub fait un `git merge` de ta branche dans `main`, sur ses serveurs, et crée un commit de fusion `Merge pull request #1 from …`. Il existe deux autres boutons, que les équipes choisissent selon leurs habitudes : **Squash and merge** (tous les commits de la PR deviennent un seul commit sur `main`) et **Rebase and merge** (les commits sont recopiés au bout de `main`, sans commit de fusion).

### Pousser sur une PR déjà ouverte

Une PR n'est pas une copie figée : elle suit la **branche**. Chaque `git push` sur cette branche ajoute les nouveaux commits à la PR, et la revue repart. Pas besoin de fermer et rouvrir quoi que ce soit.

### Une suggestion acceptée sur GitHub crée un commit… sur GitHub

Quand l'auteur clique sur **Commit suggestion**, GitHub crée un commit sur la branche de la PR, **sur GitHub**. Son ordinateur ne l'a pas : avant de continuer à travailler sur cette branche, il doit faire `git pull`. Sinon, son prochain `push` sera refusé.

### Nettoyer après la fusion

Après la fusion, la branche n'a plus de raison d'exister. Sur GitHub, le bouton **Delete branch** la supprime. Chez toi : `git switch main`, `git pull`, puis `git branch -d ajout-contact`. `git fetch --prune` fait aussi disparaître les étiquettes `origin/…` des branches supprimées sur GitHub.

@@ predict
Ta PR est ouverte. Sam te demande une correction. Tu fais un nouveau commit sur ta branche et tu le pousses. Faut-il ouvrir une nouvelle pull request ?

@@ predict-answer
**Non.** La pull request suit ta **branche**, pas un commit précis. Ton nouveau commit apparaît tout seul dans la PR (onglet **Commits** et **Files changed**), et Sam peut relire la suite. C'est le niveau 2 du Labo Git.

@@ practice
Fais le cycle complet d'une pull request dans ton fork, en jouant deux rôles : Sam, qui écrit le code depuis une deuxième copie du dépôt, et toi, qui relis.

@@ constraints
- Une deuxième copie de ton fork existe dans `~/collegue`, avec un nom d'auteur différent (Sam) réglé **seulement** pour cette copie
- Depuis `~/collegue`, une branche `equipe/regles` ajoute `mon-travail/equipe/regles.md`, et elle est poussée
- Une pull request de `equipe/regles` vers le `main` **de ton fork** (pas DataTalksClub) a une description Quoi / Pourquoi / Comment vérifier
- Tu as laissé au moins un commentaire de revue sur une ligne, avec une suggestion, et elle a été appliquée
- La PR est fusionnée, la branche supprimée sur GitHub, et tes deux copies ont un `main` à jour

@@ guide
### 1. Crée la copie de Sam

Dans un terminal de ton Codespace :

~~~bash
git clone https://github.com/gitabdelhub/data-engineering-zoomcamp.git ~/collegue
cd ~/collegue
git config user.name "Sam (collègue)"
git config user.email "sam@exemple.com"
~~~

Sans `--global`, ce réglage ne vaut que pour **ce** dépôt : tes commits dans ton fork restent signés de ton nom. Astuce : ouvre un deuxième terminal (bouton `+`), et garde-le dans `~/collegue` : c'est « le terminal de Sam », comme dans le Labo Git.

### 2. Sam travaille sur une branche

Toujours dans `~/collegue` : pars de `main` à jour, crée la branche `equipe/regles`, puis écris le fichier :

~~~bash
mkdir -p mon-travail/equipe
code mon-travail/equipe/regles.md
~~~

Écris trois règles d'équipe que tu trouves importantes (par exemple « Personne ne pousse sur main »). Enregistre, commite avec un message clair, puis pousse la branche avec `-u`.

### 3. Sam ouvre la pull request

Dans la réponse du `push`, GitHub donne un lien `https://github.com/…/pull/new/equipe/regles` : ouvre-le (ou, sur la page de ton fork, le bandeau jaune **Compare & pull request**). **Vérifie la ligne du haut** : base repository = `gitabdelhub/data-engineering-zoomcamp`, base = `main`. Titre clair, et une description :

~~~markdown
## Quoi
Ajoute nos règles d'équipe.

## Pourquoi
Pour que tout le monde travaille de la même façon.

## Comment vérifier
Lire mon-travail/equipe/regles.md
~~~

Clique sur **Create pull request**.

### 4. Toi, tu relis

Dans la PR, onglet **Files changed**. Survole une ligne : un `+` bleu apparaît à gauche, clique dessus. Dans le commentaire, clique sur l'icône **Add a suggestion** (un petit fichier avec `+/-`) : GitHub recopie la ligne, modifie-la (une faute, une formulation plus claire). Puis **Start a review**, et en haut à droite **Finish your review** → **Comment** → **Submit review**. (GitHub ne te laisse pas choisir **Approve** : c'est ta propre PR, vu que Sam et toi partagez le même compte. Avec un vrai collègue, c'est lui qui approuverait.)

### 5. Sam applique la suggestion, puis récupère

Dans l'onglet **Files changed** (ou **Conversation**), sous la suggestion : **Commit suggestion** → **Commit changes**. GitHub crée un commit sur la branche, **sur GitHub**. Dans le terminal de Sam : `git pull`, et vérifie avec `git log --oneline -3` que le commit est arrivé.

### 6. Fusionne et nettoie

Onglet **Conversation** : **Merge pull request** → **Confirm merge**, puis **Delete branch**. Dans le terminal de Sam : `git switch main`, `git pull`, `git branch -d equipe/regles`. Dans ton terminal à toi (ton fork, `/workspaces/data-engineering-zoomcamp`) : `git switch main` et `git pull`. Le fichier `mon-travail/equipe/regles.md` y est.

@@ hints
- Le réglage `git config user.name` sans `--global` ne change que le dépôt où tu te trouves. Vérifie avec `pwd` que tu es dans `~/collegue`.
- Si `git push` répond `has no upstream branch`, c'est la première fois pour cette branche : `git push -u origin equipe/regles`.
- Si la PR part vers DataTalksClub, ferme-la et recommence en changeant **base repository**.

@@ solution
~~~bash
# 1. La copie de Sam, avec son nom d'auteur pour ce dépôt seulement
git clone https://github.com/gitabdelhub/data-engineering-zoomcamp.git ~/collegue
cd ~/collegue
git config user.name "Sam (collègue)"
git config user.email "sam@exemple.com"

# 2. Sam travaille sur une branche
git switch main && git pull
git switch -c equipe/regles
mkdir -p mon-travail/equipe
printf "# Nos règles d'équipe\n\n- Personne ne pousse sur main\n- Une branche par tâche\n- Une PR relue avant chaque fusion\n" > mon-travail/equipe/regles.md
git add mon-travail/equipe/regles.md
git commit -m "docs: ajoute nos règles d'équipe"
git push -u origin equipe/regles

# 3-4-5. Sur github.com : PR vers gitabdelhub/…:main, revue avec une suggestion,
#        Commit suggestion. Puis Sam récupère ce commit fait sur GitHub :
git pull

# 6. Après Merge pull request + Delete branch sur GitHub
git switch main && git pull && git branch -d equipe/regles     # chez Sam
cd /workspaces/data-engineering-zoomcamp && git switch main && git pull   # chez toi
ls mon-travail/equipe                                            # regles.md
~~~

@@ verify
mergedPR

@@ team
Avec un vrai camarade, c'est encore mieux : dans ton fork, **Settings → Collaborators → Add people**, invite son compte GitHub. Il clone ton fork, crée sa branche, pousse, ouvre la PR. Toi, tu fais une vraie revue, avec **Request changes** puis **Approve**. Ensuite, inversez les rôles sur son fork.

@@ selfcheck
- Ma PR allait bien vers `gitabdelhub/data-engineering-zoomcamp`, branche `main`
- J'ai vu le commit de la suggestion arriver chez Sam avec `git pull`
- Dans mon fork, `git log --oneline -3` montre `Merge pull request #… from gitabdelhub/equipe/regles`

@@ breakfix
Dans `~/collegue`, Sam crée une nouvelle branche `equipe/horaires`, fait un commit et pousse. Il ouvre la PR. Toi, tu acceptes une suggestion **sur GitHub** (Commit suggestion). Sam, sans faire de pull, ajoute un deuxième commit dans son terminal et pousse. Refusé ! Répare, puis fusionne la PR.

@@ breakfix-hints
- Le commit de la suggestion est sur GitHub, pas chez Sam : c'est le cas « fetch first » de la leçon précédente.
- `git pull` dans `~/collegue`, sur la branche `equipe/horaires`, puis `git push`.
- Si `git pull` demande une méthode, `git config --global pull.rebase false` l'a déjà réglée pour tout ton Codespace.

@@ breakfix-answer
~~~bash
cd ~/collegue
git push            # ! [rejected] equipe/horaires -> equipe/horaires (fetch first)
git pull            # récupère le commit de la suggestion, et fusionne
git push            # accepté : la PR montre les trois commits
~~~
Une branche de PR peut recevoir des commits de plusieurs endroits : ton terminal, une suggestion acceptée sur GitHub, un collègue qui t'aide. Le réflexe ne change pas : `git pull` avant de pousser.

@@ explain
Raconte le chemin d'une tâche en équipe, de `git switch -c` jusqu'au `git pull` après la fusion, et explique ce que le relecteur fait dans une pull request.

@@ resources
- [GitHub Docs, en français : à propos des pull requests](https://docs.github.com/fr/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs, en français : relire les modifications proposées](https://docs.github.com/fr/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request)
- [GitHub Skills : Review pull requests (en anglais, interactif)](https://github.com/skills/review-pull-requests)
- [GitHub Docs, en français : les branches protégées](https://docs.github.com/fr/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

@@ teaser
- [00-10] Ici, Sam et toi ne touchiez pas aux mêmes lignes. À la leçon suivante, si : push refusé, PR en conflit, et comment s'en sortir.
- [01-03] Au module 1, tu ajoutes les **issues** : une tâche notée sur GitHub, que ta pull request ferme toute seule à la fusion.

# Ton Codespace et le terminal

Un **Codespace** est un ordinateur Linux qui tourne chez GitHub. Ton navigateur ou VS Code, sur ton PC, ne fait que l'afficher : c'est la machine de GitHub qui fait tourner Docker, Python et tes pipelines. C'est pour ça qu'un PC peu puissant suffit.

## Ce qu'il faut savoir sur ton Codespace

- **Il est lié à ton fork.** Les fichiers que tu vois dans VS Code sont ceux de ton fork, clonés dans `/workspaces/data-engineering-zoomcamp`.
- **Il s'arrête tout seul** après 30 minutes sans activité (réglable dans les paramètres GitHub). Ses fichiers restent sur le disque tant que tu ne le supprimes pas.
- **Il consomme des heures gratuites.** Le compte GitHub gratuit donne environ 60 heures par mois sur une machine à 2 cœurs, et 15 Go de stockage. Vérifie ta consommation dans GitHub → Settings → Billing.
- **Ce qui n'est pas poussé sur GitHub n'existe que dans ce Codespace.** Si tu le supprimes, tout ce qui n'est pas commité et poussé disparaît.

## Ouvrir ton Codespace dans Chrome

C'est le plus simple : tout se passe dans ton navigateur, rien à installer.

1. Va sur la page de ton fork, `github.com/gitabdelhub/data-engineering-zoomcamp`.
2. Bouton vert **Code**, onglet **Codespaces**.
3. Clique sur ton Codespace (ou sur **Create codespace on main** la première fois).

Il s'ouvre dans un nouvel onglet : c'est le même VS Code, avec le même terminal et les mêmes extensions. Garde ce cours dans un onglet et ton Codespace dans l'onglet d'à côté, et passe de l'un à l'autre avec **Ctrl + Tab**. Retrouve tous tes Codespaces sur [github.com/codespaces](https://github.com/codespaces).

Deux pièges du navigateur :
- **Ctrl + W ferme l'onglet** au lieu d'agir dans VS Code. Si tu le fais par erreur, rouvre le Codespace : rien n'est perdu, il tourne toujours.
- **Copier-coller dans le terminal** : Chrome demande la permission d'accéder au presse-papiers la première fois. Accepte-la.

## Ou bien depuis VS Code, sur ton PC

1. Dans VS Code, installe l'extension **GitHub Codespaces** si ce n'est pas déjà fait.
2. Clique sur l'icône **Remote Explorer** dans la barre de gauche.
3. Dans la liste déroulante en haut, choisis **GitHub Codespaces**.
4. Clique sur ton Codespace : VS Code se reconnecte dessus.

En bas à gauche de VS Code, tu dois voir `Codespaces: <nom>`. C'est la preuve que tu travailles sur la machine de GitHub.

## Le terminal, l'outil principal

Ouvre un terminal avec **Ctrl + `** (ou Terminal → New Terminal). Les commandes de base :

| Commande | Ce qu'elle fait |
| --- | --- |
| `pwd` | Affiche le dossier où tu es |
| `ls` / `ls -la` | Liste les fichiers (avec `-la` : aussi les fichiers cachés, et les détails) |
| `cd dossier` / `cd ..` | Entre dans un dossier / remonte d'un niveau |
| `mkdir -p a/b/c` | Crée des dossiers, même imbriqués |
| `touch fichier` | Crée un fichier vide |
| `cat fichier` | Affiche le contenu d'un fichier |
| `cp`, `mv`, `rm` | Copier, déplacer, supprimer (attention : pas de corbeille) |
| `↑` et `Tab` | Rappeler la commande précédente, compléter un nom |

Quand une commande occupe le terminal (un serveur, une base de données), ouvre un **deuxième terminal** avec le bouton `+`. Tu en auras souvent besoin.

## L'onglet Ports

Quand un programme écoute sur un port (pgAdmin sur 8085, Airflow sur 8080…), VS Code le détecte et l'affiche dans l'onglet **Ports**, à côté du terminal.

Ce que tu tapes dans Chrome dépend de la façon dont tu as ouvert ton Codespace :

- **Codespace dans un onglet Chrome** : l'adresse est du type `https://<nom>-8085.app.github.dev`. Quand une leçon dit `http://localhost:8085`, utilise cette adresse à la place.
- **VS Code installé sur ton PC** : VS Code fait un **tunnel**, le port du Codespace est aussi ouvert sur ton PC. Les adresses `http://localhost:8085` des leçons marchent telles quelles.

Dans les deux cas, pas besoin de retenir l'adresse : la colonne **Forwarded Address** de l'onglet Ports te la donne, et l'icône globe l'ouvre.

@@ predict
Tu crées un fichier dans ton Codespace. Tu ne fais ni commit ni push. Tu arrêtes le Codespace et tu le rouvres le lendemain : le fichier est-il encore là ? Et si, au lieu de l'arrêter, tu le **supprimes** ?

@@ predict-answer
**Arrêté :** le fichier est toujours là. Un Codespace arrêté garde son disque, comme un ordinateur éteint.

**Supprimé :** le fichier est perdu pour toujours. Seul ce qui a été poussé sur GitHub survit. GitHub supprime aussi tout seul les Codespaces restés arrêtés trop longtemps (30 jours par défaut), d'où la règle : on pousse son travail à la fin de chaque séance.

@@ practice
Prépare ton espace de travail **uniquement avec le terminal**, sans utiliser l'explorateur de fichiers de VS Code.

@@ constraints
- Les dossiers `mon-travail/module-00/` et `mon-travail/module-01/` existent à la racine de ton fork
- Le fichier `mon-travail/README.md` contient la ligne `# Mon travail sur le Data Engineering Zoomcamp`, écrite avec une seule commande
- Une commande affiche l'arborescence complète de `mon-travail/`
- Tu connais la version de Docker et la version de Python de ton Codespace

@@ guide
### 1. Ouvre un terminal et regarde où tu es

Dans ton Codespace, ouvre le terminal : menu **☰ → Terminal → New Terminal**, ou **Ctrl + `** (la touche à gauche du 1). Une zone s'ouvre en bas de l'écran : c'est là que tu tapes les commandes, puis **Entrée** pour les lancer.

Tape `pwd` (pour *print working directory*, « affiche le dossier où je suis »). Le terminal doit répondre :

~~~text
/workspaces/data-engineering-zoomcamp
~~~

C'est la **racine de ton fork** : le dossier qui contient tout le cours. Si tu vois autre chose, tape `cd /workspaces/data-engineering-zoomcamp` pour y aller.

### 2. Crée les deux dossiers

La commande `mkdir` (*make directory*) crée un dossier. L'option `-p` crée aussi les dossiers du chemin qui n'existent pas encore. Exemple, pour créer un dossier `photos/vacances` :

~~~bash
mkdir -p photos/vacances
~~~

Toi, tu veux **deux** dossiers, `module-00` et `module-01`, tous les deux dans `mon-travail`. Écris ta commande : `mkdir -p`, puis les deux chemins séparés par un espace. Si la commande ne répond rien, c'est que tout s'est bien passé : sous Linux, pas de message veut dire pas d'erreur.

### 3. Écris le titre dans le README en une seule commande

`echo "texte"` affiche un texte. Le signe `>` envoie ce texte dans un fichier au lieu de l'écran, et crée le fichier s'il n'existe pas. Exemple :

~~~bash
echo "Bonjour" > test.txt
~~~

crée `test.txt` avec la ligne `Bonjour`. Fais pareil pour écrire `# Mon travail sur le Data Engineering Zoomcamp` dans `mon-travail/README.md`. Garde bien les guillemets autour du texte : sans eux, le `#` serait compris comme le début d'un commentaire.

Vérifie avec `cat mon-travail/README.md` : `cat` affiche le contenu d'un fichier.

### 4. Affiche toute l'arborescence

L'**arborescence**, c'est la liste des dossiers et de tout ce qu'ils contiennent, sous-dossiers compris. `ls mon-travail` ne montre que le premier niveau. Avec l'option `-R` (*récursif*), `ls` descend aussi dans chaque sous-dossier. Tu dois voir `README.md`, `module-00` et `module-01`.

### 5. Note les versions de Docker et de Python

Presque tous les outils affichent leur version avec l'option `--version`. Essaie `docker --version`, puis la même chose avec `python3`. Note les deux numéros dans ta case ci-dessous : ils te serviront si un jour une commande du cours ne marche pas pareil chez toi.

### 6. Fais le ménage

À l'étape 2, si tu as testé l'exemple `photos/vacances` ou `test.txt`, supprime-les : `rm -r photos` supprime un dossier et son contenu, `rm test.txt` un fichier. Attention, `rm` ne passe pas par une corbeille.

@@ hints
- Commence par vérifier où tu es avec `pwd`. Tu dois être dans `/workspaces/data-engineering-zoomcamp`.
- `mkdir` a une option qui crée les dossiers parents s'ils n'existent pas. Et `echo "texte" > fichier` écrit un texte dans un fichier.
- `ls` a une option `-R` (récursif). Pour les versions, la plupart des outils comprennent `--version`.

@@ solution
~~~bash
# Aller à la racine du fork (pwd doit afficher ce chemin)
cd /workspaces/data-engineering-zoomcamp

# Créer les deux dossiers ; -p crée aussi mon-travail s'il n'existe pas
mkdir -p mon-travail/module-00 mon-travail/module-01

# Écrire la ligne de titre dans le README ; > crée le fichier
echo "# Mon travail sur le Data Engineering Zoomcamp" > mon-travail/README.md

# Afficher tout le contenu de mon-travail, sous-dossiers compris
ls -R mon-travail

# Les versions des deux outils
docker --version
python3 --version
~~~

`ls -R mon-travail` doit afficher quelque chose comme :

~~~text
mon-travail:
README.md  module-00  module-01

mon-travail/module-00:

mon-travail/module-01:
~~~

Les deux dossiers sont vides pour l'instant, c'est normal.

Attention à la différence entre `>` et `>>` : `>` remplace tout le contenu du fichier, `>>` ajoute à la fin.

@@ selfcheck
- `ls -R mon-travail` affiche les deux sous-dossiers et le README
- `cat mon-travail/README.md` affiche bien la ligne du titre
- J'ai noté la version de Docker et celle de Python de mon Codespace

@@ breakfix
Lance un petit serveur web avec `python3 -m http.server 8000`. Ton terminal ne répond plus à tes commandes. Sans fermer ton Codespace : ouvre la page servie dans un onglet de ton navigateur, puis reprends la main sur ce terminal.

@@ breakfix-hints
- Le serveur tourne **au premier plan** : le terminal attend qu'il se termine. Tu peux en ouvrir un second avec le bouton `+`.
- Regarde l'onglet **Ports** : le port 8000 doit y apparaître, avec une adresse.
- Pour arrêter un programme au premier plan, il y a un raccourci clavier universel sous Linux.

@@ breakfix-answer
Le serveur occupe le terminal tant qu'il tourne. L'onglet **Ports** montre le port 8000, avec son adresse dans la colonne Forwarded Address (`https://<nom>-8000.app.github.dev` dans Chrome, `http://localhost:8000` avec VS Code sur ton PC). **Ctrl + C** arrête le programme au premier plan et te rend la main. Tu reverras ce réflexe partout : Postgres, pgAdmin, Airflow, Spark…

@@ explain
Explique à quelqu'un qui ne connaît pas : quand tu travailles dans un Codespace (dans Chrome ou dans VS Code), **où tourne** Docker, et où sont tes fichiers ? Pourquoi faut-il arrêter son Codespace à la fin d'une séance ?

@@ resources
- [Documentation GitHub Codespaces](https://docs.github.com/fr/codespaces/overview)
- [Codespaces dans le navigateur](https://docs.github.com/fr/codespaces/developing-in-a-codespace/developing-in-a-codespace)
- [Codespaces dans VS Code](https://docs.github.com/fr/codespaces/developing-in-a-codespace/using-github-codespaces-in-visual-studio-code)
- [Les heures gratuites de Codespaces](https://docs.github.com/fr/billing/managing-billing-for-your-products/managing-billing-for-github-codespaces/about-billing-for-github-codespaces)

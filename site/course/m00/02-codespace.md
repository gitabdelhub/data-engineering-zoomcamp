# Ton Codespace et le terminal

Un **Codespace** est un ordinateur Linux qui tourne chez GitHub. VS Code, sur ton PC, ne fait que l'afficher : c'est la machine de GitHub qui fait tourner Docker, Python et tes pipelines. C'est pour ça qu'un PC peu puissant suffit.

## Ce qu'il faut savoir sur ton Codespace

- **Il est lié à ton fork.** Les fichiers que tu vois dans VS Code sont ceux de ton fork, clonés dans `/workspaces/data-engineering-zoomcamp`.
- **Il s'arrête tout seul** après 30 minutes sans activité (réglable dans les paramètres GitHub). Ses fichiers restent sur le disque tant que tu ne le supprimes pas.
- **Il consomme des heures gratuites.** Le compte GitHub gratuit donne environ 60 heures par mois sur une machine à 2 cœurs, et 15 Go de stockage. Vérifie ta consommation dans GitHub → Settings → Billing.
- **Ce qui n'est pas poussé sur GitHub n'existe que dans ce Codespace.** Si tu le supprimes, tout ce qui n'est pas commité et poussé disparaît.

## Ouvrir ton Codespace depuis VS Code

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

Quand un programme écoute sur un port (pgAdmin sur 8085, Kestra sur 8080…), VS Code le détecte et l'affiche dans l'onglet **Ports**, à côté du terminal.

Comme tu utilises VS Code installé sur ton PC, VS Code fait un **tunnel** : le port du Codespace est aussi ouvert sur ton PC. Les adresses `http://localhost:8085` des leçons marchent donc telles quelles dans le navigateur de ton PC. La colonne **Forwarded Address** de l'onglet Ports te donne l'adresse exacte, et l'icône globe l'ouvre.

Si tu ouvres un jour ton Codespace dans le navigateur (sur github.com), l'adresse devient du type `https://<nom>-8085.app.github.dev`.

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

@@ hints
- Commence par vérifier où tu es avec `pwd`. Tu dois être dans `/workspaces/data-engineering-zoomcamp`.
- `mkdir` a une option qui crée les dossiers parents s'ils n'existent pas. Et `echo "texte" > fichier` écrit un texte dans un fichier.
- `ls` a une option `-R` (récursif). Pour les versions, la plupart des outils comprennent `--version`.

@@ solution
~~~bash
cd /workspaces/data-engineering-zoomcamp
mkdir -p mon-travail/module-00 mon-travail/module-01
echo "# Mon travail sur le Data Engineering Zoomcamp" > mon-travail/README.md
ls -R mon-travail
docker --version
python3 --version
~~~

Attention à la différence entre `>` et `>>` : `>` remplace tout le contenu du fichier, `>>` ajoute à la fin.

@@ selfcheck
- `ls -R mon-travail` affiche les deux sous-dossiers et le README
- `cat mon-travail/README.md` affiche bien la ligne du titre
- J'ai noté la version de Docker et celle de Python de mon Codespace

@@ breakfix
Lance un petit serveur web avec `python3 -m http.server 8000`. Ton terminal ne répond plus à tes commandes. Sans fermer VS Code : ouvre la page servie dans le navigateur de ton PC, puis reprends la main sur ce terminal.

@@ breakfix-hints
- Le serveur tourne **au premier plan** : le terminal attend qu'il se termine. Tu peux en ouvrir un second avec le bouton `+`.
- Regarde l'onglet **Ports** : le port 8000 doit y apparaître, avec une adresse.
- Pour arrêter un programme au premier plan, il y a un raccourci clavier universel sous Linux.

@@ breakfix-answer
Le serveur occupe le terminal tant qu'il tourne. L'onglet **Ports** montre le port 8000, ouvrable sur ton PC à `http://localhost:8000`. **Ctrl + C** arrête le programme au premier plan et te rend la main. Tu reverras ce réflexe partout : Postgres, pgAdmin, Kestra, Spark…

@@ explain
Explique à quelqu'un qui ne connaît pas : quand tu travailles dans VS Code sur ton PC avec un Codespace, **où tourne** Docker, et où sont tes fichiers ? Pourquoi faut-il arrêter son Codespace à la fin d'une séance ?

@@ resources
- [Documentation GitHub Codespaces](https://docs.github.com/fr/codespaces/overview)
- [Codespaces dans VS Code](https://docs.github.com/fr/codespaces/developing-in-a-codespace/using-github-codespaces-in-visual-studio-code)
- [Les heures gratuites de Codespaces](https://docs.github.com/fr/billing/managing-billing-for-your-products/managing-billing-for-github-codespaces/about-billing-for-github-codespaces)

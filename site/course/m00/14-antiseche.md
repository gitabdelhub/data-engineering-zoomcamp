# L'antisèche Git et les 10 erreurs du débutant

Tout le module Git sur une page. Garde-la ouverte dans un onglet pendant le reste du cours (ou imprime-la avec **Ctrl + P**). Si une commande ne te dit plus rien, la leçon d'où elle vient est indiquée entre parenthèses.

## Les trois zones, en une ligne

**Dossier de travail** (tes fichiers) → `git add` → **zone de préparation** (la prochaine photo) → `git commit` → **dépôt** `.git` (les photos prises) → `git push` → **GitHub**.

## Commencer

| Tu veux… | Tu tapes |
| --- | --- |
| Que Git s'occupe d'un dossier (une seule fois) | `git init` (Ton premier dépôt) |
| Copier un dépôt GitHub sur ta machine | `git clone <adresse>` (GitHub) |
| Savoir ce que Git voit | `git status`, à taper tout le temps |

## Seul, chaque jour

| Tu veux… | Tu tapes |
| --- | --- |
| Préparer un fichier | `git add fichier` (Ton premier commit) |
| Prendre la photo | `git commit -m "Ajoute le script d'ingestion"` |
| Voir ce que tu as modifié | `git diff` (pas encore préparé), `git diff --staged` (préparé) |
| Voir l'historique | `git log --oneline`, ou `git log --oneline --graph --all` pour les branches |

## Annuler

| Ta situation | Tu tapes |
| --- | --- |
| J'ai abîmé un fichier, je reviens au dernier commit | `git restore fichier` (Revenir en arrière) |
| J'ai fait `git add` sur le mauvais fichier | `git restore --staged fichier` |
| Je veux annuler un commit, même ancien ou partagé | `git revert <identifiant>` |
| Mon dernier commit, **pas encore poussé**, a un mauvais message | `git commit --amend -m "Le bon message"` |
| Git ne doit jamais voir certains fichiers | une règle par ligne dans `.gitignore` : `.env`, `*.csv`, `.venv/` |

## Branches

| Tu veux… | Tu tapes |
| --- | --- |
| Créer une branche et passer dessus | `git switch -c ma-tache` (Les branches) |
| Changer de branche | `git switch main` |
| Ramener `ma-tache` dans la branche où tu es | `git merge ma-tache` |
| Supprimer une branche fusionnée | `git branch -d ma-tache` |

## Un conflit

1. `git status` liste les fichiers en conflit (`both modified`).
2. Dans chaque fichier, écris la version finale et **supprime les lignes** `<<<<<<<`, `=======` et `>>>>>>>`.
3. `git add fichier`, puis `git commit`.

Pas prêt ? `git merge --abort` remet tout comme avant. (Ton premier conflit)

## GitHub

| Tu veux… | Tu tapes |
| --- | --- |
| Envoyer une nouvelle branche (la première fois) | `git push -u origin ma-tache` (GitHub) |
| Envoyer tes commits ensuite | `git push` |
| Récupérer le travail des autres | `git pull` |
| Regarder sans toucher à ta branche | `git fetch` |
| Push refusé (`rejected`, `fetch first`) | `git pull`, puis `git push` |

## La journée type, en équipe

~~~bash
git switch main && git pull          # 1. partir du dernier état
git switch -c ajout-zones            # 2. une branche pour ta tâche
# ... tu codes, puis :
git add fichier
git commit -m "Ajoute l'ingestion des zones"
git push -u origin ajout-zones       # 3. ta branche sur GitHub
# 4. sur GitHub : Compare & pull request, puis la revue
# 5. après la fusion de la PR :
git switch main && git pull
git branch -d ajout-zones
~~~

Ta PR est en conflit avec `main` ? Dans ta branche : `git pull origin main`, tu résous, `git add`, `git commit`, `git push`. (Quand le travail se croise)

## Les 10 erreurs du débutant

1. **Taper une commande Git hors du dépôt.** Git répond `fatal: not a git repository`. Va dans le bon dossier avec `cd`, puis vérifie avec `git status`.
2. **Oublier `git add` avant `git commit`.** Git répond `nothing added to commit`. Prépare d'abord le fichier.
3. **Faire `git add .` sans regarder.** C'est comme ça qu'un mot de passe ou un gros fichier de données part dans un commit. `git status` d'abord, toujours.
4. **Commiter un secret** (`.env`, clé Google Cloud en `.json`). Il reste dans l'historique, même supprimé ensuite. Écris le `.gitignore` avant le premier commit. Si c'est déjà poussé : considère la clé comme publique et révoque-la.
5. **Écrire des messages vagues** (`modif`, `fix`, `ça marche`). Dans six mois, personne ne saura ce que fait le commit, pas même toi. Dis ce qu'il fait : `Corrige l'URL du fichier de janvier`.
6. **Faire des commits géants.** Un commit = une idée. Des petits commits se relisent et s'annulent facilement.
7. **Travailler directement sur `main` en équipe.** Une tâche = une branche = une pull request. Déjà fait un commit sur `main` par erreur ? `git switch -c ma-tache` l'emporte sur une nouvelle branche.
8. **Commencer sans `git pull`.** Tu pars d'une vieille version et tu fabriques des conflits. `git pull` en début de séance, et avant chaque nouvelle branche.
9. **Laisser des marqueurs de conflit dans un fichier.** `<<<<<<<` et `>>>>>>>` finissent dans le commit et cassent le code. Cherche-les avant de commiter (**Ctrl + F** dans l'éditeur).
10. **Utiliser `git push --force` sur une branche partagée.** Ça « marche », en effaçant les commits de tes collègues sur GitHub. Push refusé ? `git pull`, puis `git push`.

## Où chercher quand tu bloques

- Le message de Git lui-même : ses lignes entre parenthèses disent souvent quoi taper.
- `git <commande> --help`, ou l'aide courte : `git <commande> -h`.
- [Pro Git, en français](https://git-scm.com/book/fr/v2), le livre de référence, gratuit.
- [Oh Shit, Git!?! en français](https://ohshitgit.com/fr) : les erreurs courantes et comment s'en sortir.

@@ explain
Sans regarder l'antisèche : quelles commandes tapes-tu, dans l'ordre, pour faire une tâche en équipe, de `main` à jour jusqu'à la pull request ?

@@ resources
- [Oh Shit, Git!?! en français](https://ohshitgit.com/fr)
- [Pro Git, en français](https://git-scm.com/book/fr/v2)

@@ teaser
- [00-11] Git est en place. Les trois dernières leçons du module équipent ton fork : ton site en ligne, la synchro automatique et ton devcontainer.

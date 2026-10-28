# La méthode de ce cours

Ce cours reprend le **Data Engineering Zoomcamp** de DataTalksClub (contenu de la cohorte 2026), dans un ordre fixe, avec une règle simple : **tu ne copies pas, tu construis**.

## Comment avance le cours

Tout est rangé dans un ordre conseillé : module 0, module 1, puis les suivants jusqu'au projet final. Tout est ouvert : tu peux jeter un œil à n'importe quel module pour te motiver, et le bouton **Continuer** te ramène toujours à ta prochaine étape. Il n'y a ni date ni deadline : tu avances à ton rythme.

Une leçon se fait toujours en 5 étapes, dans cet ordre :

| Étape | Ce que tu fais | Pourquoi |
| --- | --- | --- |
| 1. Découvrir | Tu regardes la vidéo et tu lis la leçon, en tapant le code toi-même dans ton Codespace | C'est la méthode du Zoomcamp : coder en même temps que le formateur |
| 2. Prédire | Tu réponds à une question **avant** de lancer une commande, puis tu vérifies | Se tromper sur une prédiction est ce qui fait le plus retenir |
| 3. Pratiquer | Tu reçois un objectif, puis un **Pas à pas** qui explique chaque étape avec un exemple. Tu écris ton code toi-même, et la solution commentée est là pour comparer | C'est le vrai travail d'un data engineer |
| 4. Casser et réparer | Tu provoques une erreur volontairement et tu trouves comment la corriger | La moitié du métier, c'est lire des erreurs |
| 5. Expliquer | Tu écris avec tes mots ce que tu as compris | Si tu ne sais pas l'expliquer, tu ne l'as pas encore compris |

À la fin de chaque module : le **homework** officiel du Zoomcamp, puis un **défi sans guide** sur d'autres données, vérifié par un script.

Le cours avance en spirale. Le module 0 annonce ce qui viendra (« Tu le reverras »), et les modules suivants y renvoient (« Ah, c'est donc ça ! »). Git, lui, s'apprend en route, au moment précis où un exercice en a besoin (« Git en situation »).

## Les indices et la solution

Les indices sont de plus en plus précis. Demande-les seulement après avoir vraiment cherché : relire l'erreur, relire la leçon, chercher dans la [FAQ du cours](https://datatalks.club/faq/data-engineering-zoomcamp.html). La solution est toujours disponible, commentée ligne par ligne : ouvre-la quand tu as essayé, ou quand tu es vraiment bloqué. Tu peux finir tout le cours avec ce site seul.

## Pourquoi pas de bouton « Copier » ?

Dans le texte des leçons, il n'y a volontairement pas de bouton pour copier le code. Taper une commande t'oblige à la lire, à comprendre chaque option, et à faire des fautes que tu apprendras à corriger.

## Si tu bloques

Tu n'as besoin de personne pour avancer : chaque exercice a son pas à pas et sa solution expliquée. Si une erreur résiste quand même :

1. relis le message d'erreur en entier ;
2. cherche-le dans la [FAQ du cours](https://datatalks.club/faq/data-engineering-zoomcamp.html), puis sur le web ;
3. pose ta question sur le [Slack de DataTalksClub](https://datatalks.club/slack.html), canal `#course-data-engineering`. C'est gratuit, et des milliers d'étudiants du Zoomcamp y sont.

Si tu as Claude, c'est un bonus : une relecture de ta pull request, des questions sur ton explication de l'étape 5, de l'aide sur une erreur. Pour les homework, Claude donne des indices, pas les réponses.

## Ton espace de travail

Tout ton code va dans le dossier `mon-travail/` de ton fork, un sous-dossier par module. Tu ne modifies jamais les fichiers du cours : comme ça, la synchronisation avec le repo officiel ne bloque jamais.

@@ predict
Avant de commencer : d'après toi, qu'est-ce qui fait le plus retenir une commande ? La lire dans le cours, la copier-coller, ou la taper toi-même en te trompant une ou deux fois ? Écris ta réponse et pourquoi.

@@ predict-answer
La recherche sur l'apprentissage est assez nette : ce qui fait retenir, c'est l'**effort de récupération**. Chercher la réponse dans ta tête, te tromper, puis corriger. Relire ou copier donne une impression de facilité, mais on oublie vite. C'est pour ça que ce cours te fait prédire, écrire et casser, au lieu de copier.

@@ practice
Écris ton **contrat d'apprentissage**. Il ne contient aucune date : c'est un engagement sur ta façon de travailler, pas sur un calendrier.

@@ constraints
- Pourquoi tu fais ce cours, en une phrase (par exemple : ton PFE de février)
- Combien de séances par semaine tu vises, et combien de temps par séance
- Ce que tu fais quand tu bloques plus de 20 minutes, dans l'ordre (relire l'erreur, la solution expliquée, la FAQ, le Slack de DataTalksClub…)
- Comment tu vas « apprendre en public » : où tu publieras ce que tu apprends (LinkedIn, GitHub…)

@@ guide
### 1. Écris dans la case ci-dessous

Ton contrat s'écrit directement sur ce site, dans la case « Ton texte ». Il est enregistré tout seul dans ton navigateur : tu le recopieras dans ton fork à la leçon 3.

### 2. Réponds aux quatre questions, une phrase chacune

Tu peux partir de cette trame et compléter les trous :

~~~text
Je fais ce cours pour …
Je vise … séances par semaine, de … chacune.
Quand je bloque plus de 20 minutes : d'abord …, ensuite …, puis …
À la fin de chaque module, je publie ce que j'ai appris sur …
~~~

### 3. Relis-toi avec la liste « Ça marche si… »

Elle apparaît quand tu ouvres la solution. Si ton contrat contient une date, enlève-la : ici, on avance à son rythme.

@@ hints
- Une séance courte et régulière vaut mieux qu'une longue séance de temps en temps. Une heure, trois fois par semaine, c'est déjà très bien.
- Pour le blocage : le Zoomcamp a une FAQ très complète, et la plupart des erreurs y sont déjà. Mets-la en premier ou en deuxième.
- Le Zoomcamp encourage à publier un petit post à la fin de chaque module. Le homework du module 1 te donne même un modèle de post.

@@ solution
Il n'y a pas de bonne réponse unique. Un exemple :

> Je fais ce cours pour arriver à mon PFE en sachant construire un vrai pipeline de données. Je vise 3 séances d'une heure par semaine. Quand je bloque plus de 20 minutes : je relis l'erreur en entier, je cherche dans la FAQ du cours, je cherche l'erreur exacte sur le web, puis je pose ma question sur le Slack de DataTalksClub avec ce que j'ai essayé. À la fin de chaque module, je publie un post LinkedIn avec le lien de mon code.

Garde le tien : à la leçon 3, tu le mettras dans le fichier `mon-travail/README.md` de ton fork.

@@ selfcheck
- Mon contrat ne contient aucune date
- J'ai écrit une stratégie précise pour quand je bloque

@@ explain
Explique avec tes mots pourquoi il n'y a pas de bouton « Copier » dans ce cours, et pourquoi il vaut mieux essayer avant d'ouvrir la solution, alors qu'elle est toujours disponible.

@@ resources
- [Le repo officiel du Zoomcamp](https://github.com/DataTalksClub/data-engineering-zoomcamp)
- [La FAQ du cours](https://datatalks.club/faq/data-engineering-zoomcamp.html)
- [La playlist YouTube du cours](https://www.youtube.com/playlist?list=PL3MmuxUbc_hJed7dXYoJw8DoCuVHhGEQb)
- [Le Slack de DataTalksClub](https://datatalks.club/slack.html)

# Mesurer ton LLM, puis le surveiller

Ton DAG enrichit maintenant chaque texte, et le JSON est valide. Mais **le modèle a-t-il raison ?** Un JSON valide peut contenir un mauvais thème, et rien ne plantera. La seule façon de savoir, c'est de **mesurer** : comparer ses réponses à celles d'un humain, sur des textes choisis à l'avance. C'est ce qu'on appelle une **évaluation**. C'est la compétence qui sépare le plus « utiliser l'IA » de « mettre l'IA en production ».

## Le jeu de référence

Tu tires **150 textes au hasard** dans tes données, et tu écris toi-même, pour chacun, la bonne réponse (le thème). C'est ton **jeu de référence** (en anglais, *golden set*).

Deux règles :

- **Étiquette avant de regarder les réponses du modèle.** Sinon, tu seras tenté d'être d'accord avec lui, et ta mesure sera trop belle.
- **Tire au hasard**, pas les 150 premiers : les premiers textes d'un fichier se ressemblent souvent (même jour, même source).

150 textes, c'est environ 2 à 3 heures. C'est long, et c'est voulu : en les lisant, tu découvres aussi ce que contiennent vraiment tes données, et souvent un thème qui manque à ta liste.

## Les mesures

Tu compares la réponse du modèle à la tienne, texte par texte.

- **L'exactitude** : la part des textes où le modèle a donné le même thème que toi. Simple, mais trompeuse quand un thème domine (voir le « Casse et répare »).
- **La précision d'un thème** : quand le modèle dit « station pleine ou vide », à quelle fréquence a-t-il raison ?
- **Le rappel d'un thème** : parmi les vrais textes « station pleine ou vide », combien le modèle en a-t-il trouvés ?

Exemple : 20 textes parlent vraiment de stations. Le modèle classe 25 textes en « station », dont 18 justes. Sa précision est de 18 / 25 = 72 %, son rappel de 18 / 20 = 90 %. Il trouve presque tout, mais il en met trop dans cette case.

- **La matrice de confusion** : un tableau qui croise ta réponse (en ligne) et celle du modèle (en colonne). La diagonale, ce sont les bonnes réponses. Tout le reste montre **quels thèmes il confond**, et c'est souvent là que le prompt doit être plus clair.
- **Les erreurs à relire** : les chiffres disent combien, les textes ratés disent **pourquoi**. Relis-en 10 à chaque essai.

## Le script d'évaluation

~~~python
# ia/evaluer.py
import sys
import time
from datetime import date
from pathlib import Path

import pandas as pd

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", None)
from sklearn.metrics import classification_report

from enrichir import enrichir
from modeles import appeler_gemini, appeler_ollama
from stockage import cles_existantes, ouvrir, ranger

MODELES = {"gemini": (appeler_gemini, "gemini-3.5-flash"), "ollama": (appeler_ollama, "llama3.2:1b")}


def evaluer(nom, version, reference="reference.csv", base="eval.duckdb"):
    appeler, modele = MODELES[nom]
    ref = pd.read_csv(reference, dtype={"id": str})
    con = ouvrir(base)                       # une base à part : jamais mélangée à la production
    debut = time.time()
    resultats, echecs = enrichir(ref.to_dict("records"), cles_existantes(con), appeler, modele, version)
    ranger(con, resultats, echecs)
    duree = time.time() - debut

    ia = con.execute("""SELECT id, theme AS theme_ia, tokens_entree, tokens_sortie FROM enrichissements
                        WHERE modele = ? AND version_prompt = ?""", [modele, version]).df()
    m = ref.merge(ia, on="id", how="left")
    m["theme_ia"] = m["theme_ia"].fillna("ÉCHEC")   # une ligne sans réponse compte comme une erreur
    exactitude = (m["theme"] == m["theme_ia"]).mean()

    print(f"\n=== {modele} · prompt {version} · {len(m)} textes ===")
    print(f"Exactitude : {exactitude:.1%}   échecs : {(m['theme_ia'] == 'ÉCHEC').sum()}")
    print(classification_report(m["theme"], m["theme_ia"], zero_division=0))
    print(pd.crosstab(m["theme"], m["theme_ia"], rownames=["humain"], colnames=["IA"]))
    print("\nLes erreurs à relire :")
    print(m.loc[m["theme"] != m["theme_ia"], ["id", "texte", "theme", "theme_ia"]].head(10).to_string(index=False))

    ligne = pd.DataFrame([{"date": date.today().isoformat(), "modele": modele, "version_prompt": version,
                           "textes": len(m), "exactitude": round(exactitude, 3),
                           "echecs": int((m["theme_ia"] == "ÉCHEC").sum()),
                           "tokens": int(m["tokens_entree"].sum() + m["tokens_sortie"].sum()),
                           "secondes_ce_lancement": round(duree, 1)}])
    journal = Path("evaluations.csv")
    ligne.to_csv(journal, mode="a", header=not journal.exists(), index=False)
    return exactitude


if __name__ == "__main__":
    evaluer(sys.argv[1], sys.argv[2])        # par exemple : uv run python evaluer.py gemini v1
~~~

Il enrichit les textes de `reference.csv` (colonnes `id`, `texte`, `theme`) dans une base à part, `eval.duckdb`, jamais mélangée à la production. Il affiche les mesures, puis ajoute une ligne à `evaluations.csv` : le journal de tes essais. Grâce au cache, relancer la même version ne refait aucun appel.

## Comparer, puis décider

Lance le script sur deux versions, par exemple :

~~~bash
uv run python evaluer.py gemini v1
uv run python evaluer.py gemini v2
uv run python evaluer.py ollama v2
~~~

Puis décide avec les chiffres : l'exactitude, mais aussi le rappel du thème qui compte le plus pour ton tableau de bord, les échecs, les tokens et le temps. Un petit modèle local un peu moins juste mais gratuit et sans quota peut être le bon choix. Écris ta décision et sa raison dans le README : c'est la première chose qu'un relecteur ou un recruteur te demandera.

## Surveiller en production

Ton évaluation dit la qualité **le jour où tu l'as mesurée**. Ensuite, les données changent : un nouveau sujet apparaît, le modèle est mis à jour par Google. On parle de **dérive**. dbt la surveille pour toi.

Le modèle de staging ne garde que la version choisie, grâce à deux variables :

~~~sql
-- models/staging/stg_enrichissements.sql
select id, theme, urgence, veut_remboursement, tokens_entree, tokens_sortie
from {{ source('ia', 'enrichissements') }}
where modele = '{{ var("modele_ia") }}'
  and version_prompt = '{{ var("version_ia") }}'
~~~

Les tests vérifient chaque champ produit par le modèle :

~~~yaml
# models/staging/schema.yml (extrait)
  - name: stg_enrichissements
    columns:
      - name: id
        tests: [unique, not_null]
      - name: theme
        tests:
          - accepted_values:
              values: ["vélo abîmé", "station pleine ou vide", "application", "prix", "autre"]
~~~

Et un mart suit la santé de la couche IA, mois par mois :

~~~sql
-- models/marts/qualite_ia.sql
with textes as (
    select id, date_trunc(date(cree_le), month) as mois from {{ ref('stg_avis') }}
),
echecs as (
    select distinct id from {{ source('ia', 'echecs_ia') }}
    where modele = '{{ var("modele_ia") }}' and version_prompt = '{{ var("version_ia") }}'
)
select
    t.mois,
    count(*) as textes,
    countif(e.id is not null) as enrichis,
    countif(e.id is null and x.id is not null) as en_echec,
    safe_divide(countif(e.theme = 'autre'), countif(e.id is not null)) as part_autre,
    sum(e.tokens_entree + e.tokens_sortie) as tokens
from textes t
left join {{ ref('stg_enrichissements') }} e using (id)
left join echecs x using (id)
group by t.mois
~~~

Si la part d'« autre » monte d'un mois à l'autre, un nouveau sujet est apparu : c'est le moment de relire ces textes, de créer un prompt v2, de l'évaluer, puis de changer `version_ia`.

## Pour aller plus loin (bonus)

Les textes classés « autre » cachent souvent les thèmes qui manquent à ta liste. Un **embedding** transforme un texte en une liste de nombres, de façon que deux textes de même sens aient des nombres proches. Avec un petit modèle local ([sentence-transformers](https://sbert.net/)), tu calcules l'embedding de chaque texte « autre », tu les regroupes en 5 à 10 groupes (`KMeans` de scikit-learn), et tu lis quelques textes de chaque groupe. Un groupe cohérent devient un nouveau thème du prompt v2. Tu retrouveras les embeddings en détail au module 2 du LLM Zoomcamp.

@@ brief
- 🔑 Une **évaluation** compare les réponses du modèle à celles d'un humain, sur un **jeu de référence** étiqueté à l'avance et tiré au hasard.
- 🔑 **Précision** (quand il dit X, a-t-il raison ?) et **rappel** (trouve-t-il tous les X ?) disent plus que l'exactitude seule.
- 🔑 La **matrice de confusion** et les erreurs relues montrent ce que le prompt doit clarifier.
- On choisit un modèle ou un prompt **avec des chiffres** : qualité, échecs, tokens, temps. La décision va dans le README.
- 🔑 En production, les tests dbt et un mart `qualite_ia` surveillent la **dérive** : la qualité mesurée un jour ne dure pas toute seule.

@@ codespaces
- `uv add scikit-learn` dans ton dossier `ia/`. `reference.csv` s'étiquette très bien dans VS Code (l'extension Rainbow CSV aide), ou dans un tableur, puis exporté en CSV.
- Pour tirer 150 textes au hasard dans BigQuery : `ORDER BY FARM_FINGERPRINT(CAST(id AS STRING)) LIMIT 150`. Le tirage reste le même si tu relances la requête.

@@ verified
- Testé ici avec un faux modèle : `evaluer.py` sur 30 textes (exactitude, rapport par thème, matrice de confusion, erreurs à relire), un JSON invalide compté comme échec, un second lancement entièrement servi par le cache, et le journal `evaluations.csv`.
- **Pas testé ici** : les modèles dbt et le mart `qualite_ia` (écrits pour BigQuery, sans compte dans cet environnement), un vrai modèle Gemini ou Ollama, et le bonus des embeddings.

@@ predict
Ton jeu de référence a 150 textes, dont 120 sont vraiment « autre » (des remerciements, des messages vides de sens). Un modèle obtient 82 % d'exactitude. Est-ce un bon modèle ?

@@ predict-answer
**On ne peut pas le savoir avec ce seul chiffre, et c'est probablement un mauvais modèle.** Un « modèle » qui répond toujours « autre » obtient déjà 120 / 150 = 80 %, sans rien comprendre. 82 % ne vaut presque rien de plus. Il faut regarder le **rappel** des thèmes qui t'intéressent : sur les 30 vraies plaintes, combien en a-t-il trouvé ? C'est pour ça qu'on compare toujours un modèle à ce modèle idiot.

@@ practice
**Objectif** : mesurer la qualité de ta couche IA sur un jeu de référence de 150 textes, comparer deux versions, écrire ta décision dans le README, puis ajouter dans dbt les tests des champs IA et le mart `qualite_ia`.

**Tu pars de** : ton dossier `ia/` et ta table `enrichissements` du jalon précédent, ton projet dbt du module 4 comme modèle (ou celui de ton jalon 4 s'il est commencé).

@@ constraints
- `ia/reference.csv` contient 150 textes tirés au hasard, avec le thème écrit par toi **avant** d'avoir lu les réponses du modèle
- `evaluations.csv` contient au moins deux lignes : deux versions différentes (deux prompts, ou deux modèles)
- Tu as comparé ta meilleure exactitude à celle du modèle idiot (toujours le thème le plus fréquent), et elle est nettement au-dessus
- Le README a une section « La couche IA » : les champs extraits, le modèle et le prompt choisis, leur exactitude et le rappel de ton thème principal, et pourquoi ce choix
- `dbt build` passe, avec `accepted_values` sur le thème et `unique` sur `id` dans le staging des enrichissements
- Le mart `qualite_ia` donne, par mois : les textes, les enrichis, les échecs, la part d'« autre » et les tokens

@@ guide
### 1. Tire et étiquette

Une requête BigQuery tire 150 textes au hasard (voir l'encadré Codespace), tu l'exportes en CSV, tu ajoutes une colonne `theme` et tu la remplis. Ne lance pas encore le modèle sur ces textes.

### 2. Première mesure

Copie `evaluer.py`, adapte `MODELES` et le nom de ta classe. `uv run python evaluer.py gemini v1`. Lis la matrice, puis les 10 erreurs.

### 3. Une version 2

À partir des erreurs relues, écris `prompts/v2.md` : une règle plus claire pour les thèmes confondus, un exemple de plus. Mesure-la. Puis mesure un petit modèle avec Ollama si tu as la place.

### 4. Décide

Compare les lignes de `evaluations.csv`. Écris la section du README.

### 5. Dans dbt

Déclare `enrichissements` et `echecs_ia` comme sources, puis écris le staging, ses tests et le mart. Mets `modele_ia` et `version_ia` dans `vars:` de `dbt_project.yml`.

@@ hints
- Si une ligne de `reference.csv` ne se retrouve pas dans les résultats, regarde le type de `id` : `dtype={"id": str}` dans `read_csv`.
- Un thème trop rare (moins de 5 textes dans ta référence) donne des mesures qui sautent d'un essai à l'autre. Regroupe-le, ou ajoute des textes de ce thème (en le disant dans le README).
- Le modèle idiot en une ligne : `uv run python -c "import pandas as pd; print(pd.read_csv('reference.csv').theme.value_counts(normalize=True))"`.
- `accepted_values` doit avoir **exactement** la même liste que `schema.py`, accents compris.

@@ solution
Le journal d'un projet type, après trois essais (les chiffres sont un exemple inventé, ceux de ton projet seront différents) :

~~~text
date,modele,version_prompt,textes,exactitude,echecs,tokens,secondes_ce_lancement
2026-12-02,gemini-3.5-flash,v1,150,0.787,0,61240,212.4
2026-12-02,gemini-3.5-flash,v2,150,0.88,0,70110,198.0
2026-12-03,llama3.2:1b,v2,150,0.653,9,68920,1046.7
~~~

Et la section du README qui en sort :

~~~markdown
## La couche IA

Le LLM lit chaque commentaire et donne : son thème (liste fermée de 5, avec « autre »),
une urgence de 1 à 5, et s'il demande un remboursement.

Mesuré sur 150 commentaires tirés au hasard et étiquetés à la main :
- gemini-3.5-flash, prompt v2 : 88 % d'exactitude, rappel « vélo abîmé » 0,93, 0 échec.
- Le modèle idiot (toujours « autre ») : 41 %.
- llama3.2:1b, prompt v2 : 65 %, 9 réponses invalides, 5 fois plus lent.

Choix : Gemini avec le prompt v2. Le v2 ajoute la règle « un vélo sale n'est pas abîmé »,
qui était la confusion la plus fréquente. Ollama reste le secours sans clé (voir « Lancer le projet »).
~~~

@@ selfcheck
- Je sais expliquer la différence entre précision et rappel avec un exemple de mes données
- Je connais l'exactitude du modèle idiot sur mon jeu de référence
- Je sais ce que je ferais si la part d'« autre » doublait le mois prochain

@@ breakfix
Dans ton dossier `ia/`, calcule l'exactitude du **modèle idiot** sur ton `reference.csv` : celui qui répond toujours le thème le plus fréquent (la ligne est dans les indices). Compare-la à la meilleure ligne de `evaluations.csv`. Puis, dans une copie (`reference_desequilibree.csv`), garde tous les textes du thème le plus fréquent et seulement 3 textes de chaque autre thème, et relance `evaluer.py` dessus avec ta meilleure version. Que devient l'exactitude ? Et le rappel de ton thème principal ? Quelle mesure mets-tu dans ton README, et pourquoi ?

@@ breakfix-hints
- L'exactitude du modèle idiot = la part du thème le plus fréquent.
- Sur la copie déséquilibrée, regarde la colonne `recall` du thème qui t'intéresse.
- `evaluer.py` prend le fichier de référence en paramètre : `evaluer("gemini", "v2", reference="reference_desequilibree.csv", base="eval_deseq.duckdb")`.

@@ breakfix-answer
L'exactitude **monte** sur la copie déséquilibrée, alors que le modèle n'a pas changé : elle est surtout faite du thème dominant, que le modèle reconnaît bien. Le rappel des petits thèmes, lui, se calcule sur 3 textes et devient très instable. Une exactitude seule peut donc être gonflée par la composition du jeu de référence. Dans le README, on donne l'exactitude **à côté de celle du modèle idiot**, et le rappel du thème qui compte pour le tableau de bord, mesuré sur un tirage au hasard.

@@ explain
Pourquoi ton évaluation d'aujourd'hui ne suffit-elle pas à garantir la qualité dans six mois ? Et que surveille exactement ton mart `qualite_ia` ?

@@ resources
- [scikit-learn : le rapport de classification](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.classification_report.html)
- [scikit-learn : précision et rappel](https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-f-measure-metrics)
- [dbt : les variables](https://docs.getdbt.com/docs/build/project-variables)
- [sentence-transformers, pour le bonus](https://sbert.net/)

@@ declic
- [04-07] Les tests dbt : `accepted_values` protège maintenant une colonne écrite par un LLM.
- [03-05] Au module 3, `ML.EVALUATE` mesurait ton modèle de pourboires : ici, tu écris toi-même la mesure.

@@ teaser
- [P-04] Au jalon 4, ton mart `qualite_ia` rejoint les autres modèles dbt de ton warehouse.
- [P-05] Au jalon 5, une tuile de ton tableau de bord montre la qualité mesurée.

@@ cles
- Le jeu de référence | llm evaluation golden dataset | Des textes tirés au hasard et étiquetés à la main, avant de voir les réponses du modèle.
- Précision et rappel | precision recall classification | Quand il dit X, a-t-il raison ? Trouve-t-il tous les X ? Deux questions différentes.
- La matrice de confusion | confusion matrix | Le tableau qui montre quels thèmes le modèle confond.
- La dérive | data drift llm monitoring | Les données et les modèles changent : la qualité se surveille dans le temps.

@@ practice-min
4 à 5 h

@@ breakfix-min
15

@@ pas
<!-- dossiers : lignes 📁 seulement -->
>>> ia/evaluer.py
👁 Exemple à lire : `ia/evaluer.py`, presque identique pour ton projet

>>> uv run python evaluer.py ollama v2
📁 Dans ton dépôt de projet, dossier `ia/`

>>> -- models/staging/stg_enrichissements.sql
👁 Exemple à lire : dans ton projet dbt, `models/staging/`

>>> models/staging/schema.yml (extrait)
👁 Exemple à lire : dans ton projet dbt

>>> -- models/marts/qualite_ia.sql
👁 Exemple à lire : dans ton projet dbt, `models/marts/`

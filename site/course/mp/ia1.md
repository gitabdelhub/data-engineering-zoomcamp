# Un LLM comme étape de ton pipeline

Jusqu'ici, ton pipeline déplace et transforme des données **structurées** : des nombres, des dates, des catégories. Mais une grande partie des données d'une entreprise est du **texte libre** : des avis, des plaintes, des tickets, des offres d'emploi. Personne ne peut les lire tous, et SQL ne sait pas les comprendre.

Un **LLM** (grand modèle de langage, comme Gemini ou Claude) sait les lire. Dans ce jalon, tu en fais une **étape de transformation** : pour chaque nouveau texte, il répond avec quelques champs en JSON, qui deviennent des colonnes dans BigQuery. C'est l'usage des LLM le plus répandu dans les équipes data aujourd'hui.

## Ce qu'il faut savoir avant de coder

**Un LLM prédit du texte.** Tu lui envoies une consigne (le **prompt**) suivie du texte à traiter, et il écrit la suite la plus probable. Il ne « sait » pas : il produit ce qui ressemble à une bonne réponse. D'où ses deux défauts : il peut **inventer** une information absente du texte (on parle d'**hallucination**), et il le fait avec assurance.

**Il compte en tokens.** Un token est un morceau de mot : environ 4 caractères en anglais, un peu moins en français. Tu paies (ou tu consommes ton quota gratuit) au token, en entrée **et** en sortie. Un prompt de 300 tokens envoyé avec 10 000 textes, c'est déjà 3 millions de tokens en entrée. C'est pour ça qu'on écrit des prompts courts, qu'on plafonne le nombre d'appels, et qu'on ne traite jamais deux fois le même texte.

**Un pipeline a besoin de colonnes, pas de phrases.** Si tu demandes « quel est le thème de ce texte ? », tu recevras « Le thème principal semble être… ». Inutilisable. La solution s'appelle la **sortie structurée** : tu donnes au modèle un **schéma JSON** (les champs, leurs types, la liste des valeurs permises), et l'API l'oblige à répondre dans ce format.

**Une liste fermée, avec une porte de sortie.** Si tes thèmes sont libres, le modèle en invente un nouveau à chaque texte : « vélo cassé », « vélo endommagé », « problème de vélo »… Impossible à compter. Donne-lui une liste fermée, **et** une valeur « autre » : sans elle, il force chaque texte dans une case qui ne lui va pas, sans jamais signaler d'erreur.

**La température.** C'est le réglage du hasard. À 0, le modèle choisit presque toujours le mot le plus probable : ses réponses sont plus régulières d'un appel à l'autre. Mais pas parfaitement identiques : c'est une raison de plus pour **mettre en cache** chaque réponse au lieu de redemander.

## L'exemple : les commentaires des usagers des vélos

Les jalons précédents prenaient l'exemple des vélos de Londres. On imagine que les usagers laissent aussi des commentaires, et que l'équipe veut savoir de quoi ils se plaignent. Le code ci-dessous est testé : lis-le d'abord en entier, tu écriras le tien pour tes propres données.

### Le schéma : ce que tu attends du modèle

~~~python
# ia/schema.py
from typing import Literal

from pydantic import BaseModel, Field

# La liste fermée des thèmes : le modèle ne peut rien répondre d'autre.
Theme = Literal["vélo abîmé", "station pleine ou vide", "application", "prix", "autre"]


class Avis(BaseModel):
    theme: Theme
    urgence: int = Field(ge=1, le=5, description="1 = simple remarque, 5 = danger ou blocage")
    veut_remboursement: bool = Field(description="vrai seulement si le texte le demande")
~~~

`pydantic` décrit la réponse attendue. `Literal[...]` est la liste fermée ; `Field(ge=1, le=5)` borne l'urgence. La même classe sert deux fois : pour **dire** au modèle le format (`Avis.model_json_schema()`), et pour **vérifier** sa réponse (`Avis.model_validate_json(...)`).

### Le prompt : rangé dans Git, avec un numéro de version

~~~text
Tu classes les commentaires laissés par les usagers d'un service de vélos en libre-service.

Pour le commentaire ci-dessous, réponds en JSON avec :
- theme : un seul thème parmi « vélo abîmé », « station pleine ou vide », « application », « prix », « autre ».
  Si aucun ne convient vraiment, réponds « autre ». N'invente pas de thème.
- urgence : de 1 (simple remarque) à 5 (danger ou blocage total).
- veut_remboursement : vrai seulement si l'usager demande à être remboursé.

Exemple : « Frein arrière HS, j'ai failli tomber » → {"theme": "vélo abîmé", "urgence": 5, "veut_remboursement": false}

Commentaire :
~~~

Le prompt est un fichier, `ia/prompts/v1.md`, pas une chaîne cachée dans le code. Quand tu l'améliores, tu crées `v2.md` : les deux versions restent comparables (c'est le jalon suivant), et chaque réponse stockée dit avec quelle version elle a été produite.

### L'appel au modèle : deux fournisseurs, une même forme

~~~python
# ia/modeles.py
import os
import time

from schema import Avis


def appeler_gemini(prompt, modele="gemini-3.5-flash"):
    """Renvoie (texte JSON, tokens en entrée, tokens en sortie)."""
    from google import genai
    from google.genai import types

    client = genai.Client()  # lit la clé dans la variable GEMINI_API_KEY
    reponse = client.models.generate_content(
        model=modele,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=Avis.model_json_schema(),  # le format imposé
            temperature=0,
        ),
    )
    u = reponse.usage_metadata
    sortie = (u.candidates_token_count or 0) + (u.thoughts_token_count or 0)
    return reponse.text, u.prompt_token_count or 0, sortie


def appeler_ollama(prompt, modele="llama3.2:1b"):
    from ollama import Client

    client = Client(host=os.environ.get("OLLAMA_HOST", "http://localhost:11434"))
    reponse = client.chat(
        model=modele,
        messages=[{"role": "user", "content": prompt}],
        format=Avis.model_json_schema(),
        options={"temperature": 0},
    )
    return reponse.message.content, reponse.prompt_eval_count or 0, reponse.eval_count or 0


def avec_relances(appeler, prompt, modele, essais=4):
    """Une limite atteinte (429) ou un serveur occupé (503) : on attend, puis on réessaie."""
    for essai in range(essais):
        try:
            return appeler(prompt, modele)
        except Exception as erreur:
            code = getattr(erreur, "code", None) or getattr(erreur, "status_code", None)
            if code not in (429, 503) or essai == essais - 1:
                raise
            time.sleep(2 ** essai * 5)  # 5 s, 10 s, 20 s
~~~

Les deux fonctions renvoient la même chose : le texte JSON, les tokens en entrée, les tokens en sortie. Le reste du code ne sait pas quel modèle il appelle : changer de fournisseur touche ce seul fichier. `avec_relances` gère le cas le plus courant en production : la **limite de requêtes** (erreur 429) du niveau gratuit.

Les tokens de sortie comptent aussi les tokens de « réflexion » (`thoughts_token_count`) : les modèles récents réfléchissent avant de répondre, et ces tokens se paient comme les autres.

### L'enrichissement : cache, plafond, échecs

~~~python
# ia/enrichir.py
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from pydantic import ValidationError

from modeles import avec_relances
from schema import Avis

DOSSIER = Path(__file__).parent


def cle(id_ligne, texte, version, modele):
    """Même ligne + même texte + même prompt + même modèle = même clé : on ne paie qu'une fois.
    Si le texte est corrigé à la source, ou si tu changes de prompt, la clé change : on retraite."""
    return hashlib.sha256(f"{version}|{modele}|{id_ligne}|{texte}".encode()).hexdigest()[:20]


def enrichir(lignes, deja_faits, appeler, modele, version="v1", plafond=2000):
    """lignes : [{"id": ..., "texte": ...}]. deja_faits : l'ensemble des clés déjà en table.
    Renvoie (résultats, échecs), deux listes de dictionnaires prêtes à charger."""
    consigne = (DOSSIER / "prompts" / f"{version}.md").read_text()
    resultats, echecs, appels = [], [], 0
    for ligne in lignes:
        k = cle(ligne["id"], ligne["texte"], version, modele)
        if k in deja_faits:
            continue                      # le cache : déjà traité, on saute
        if appels >= plafond:
            break                         # le plafond : la suite attendra la prochaine exécution
        appels += 1
        base = {"cle": k, "id": ligne["id"], "modele": modele, "version_prompt": version,
                "traite_le": datetime.now(timezone.utc).isoformat()}
        try:
            brut, t_in, t_out = avec_relances(appeler, consigne + "\n" + ligne["texte"], modele)
            avis = Avis.model_validate_json(brut)   # refuse un JSON cassé ou hors liste
        except ValidationError as erreur:
            echecs.append({**base, "erreur": "json_invalide", "detail": str(erreur)[:500], "reponse_brute": brut})
            continue
        except Exception as erreur:
            echecs.append({**base, "erreur": type(erreur).__name__, "detail": str(erreur)[:500]})
            continue
        resultats.append({**base, **avis.model_dump(), "reponse_brute": brut,
                          "tokens_entree": t_in, "tokens_sortie": t_out})
        deja_faits.add(k)
    return resultats, echecs
~~~

Trois idées du cours, appliquées à l'IA :

- **La clé** (module 1, idempotence) : même ligne, même texte, même prompt, même modèle = même clé. Avant chaque appel, on regarde si la clé existe déjà. Relancer ne coûte rien.
- **Le plafond** : au-delà de `plafond` appels, on s'arrête. La suite sera traitée à la prochaine exécution, sans rien perdre.
- **Les échecs** : un JSON invalide ou une erreur réseau ne font pas planter le lot. Ils vont dans une liste à part, avec la réponse brute, pour que tu puisses les lire. Une ligne en échec n'a pas de clé en table : elle sera retentée la fois suivante.

### Le stockage et l'essai local

~~~python
# ia/stockage.py
import duckdb
import pandas as pd

TABLES = """
CREATE TABLE IF NOT EXISTS enrichissements (
    cle VARCHAR PRIMARY KEY, id VARCHAR, modele VARCHAR, version_prompt VARCHAR, traite_le VARCHAR,
    theme VARCHAR, urgence INTEGER, veut_remboursement BOOLEAN,
    reponse_brute VARCHAR, tokens_entree INTEGER, tokens_sortie INTEGER);
CREATE TABLE IF NOT EXISTS echecs (
    cle VARCHAR, id VARCHAR, modele VARCHAR, version_prompt VARCHAR, traite_le VARCHAR,
    erreur VARCHAR, detail VARCHAR, reponse_brute VARCHAR);
"""


def ouvrir(chemin):
    con = duckdb.connect(chemin)
    con.execute(TABLES)
    return con


def cles_existantes(con):
    return {r[0] for r in con.execute("SELECT cle FROM enrichissements").fetchall()}


def ranger(con, resultats, echecs):
    if resultats:
        df = pd.DataFrame(resultats)
        con.execute("INSERT INTO enrichissements BY NAME SELECT * FROM df")
    if echecs:
        df = pd.DataFrame(echecs)
        con.execute("INSERT INTO echecs BY NAME SELECT * FROM df")
~~~

~~~python
# ia/essai_local.py
import sys

from enrichir import enrichir
from modeles import appeler_gemini, appeler_ollama
from stockage import cles_existantes, ouvrir, ranger

COMMENTAIRES = [
    "La selle est déchirée et le frein avant ne répond plus.",
    "Station de Waterloo pleine, j'ai tourné 20 minutes pour poser le vélo.",
    "L'appli plante au moment de payer, trois fois de suite.",
    "Huit livres la journée, c'est devenu trop cher pour moi.",
    "On m'a facturé 2 heures alors que j'ai rendu le vélo après 10 minutes. Remboursez-moi.",
    "Super service, merci à l'équipe de King's Cross !",
    "Plus aucun vélo à la station Angel ce matin, encore.",
    "La chaîne saute à chaque coup de pédale, c'est dangereux en descente.",
]

ollama = "--ollama" in sys.argv
appeler, modele = (appeler_ollama, "llama3.2:1b") if ollama else (appeler_gemini, "gemini-3.5-flash")

lignes = [{"id": str(i), "texte": t} for i, t in enumerate(COMMENTAIRES)]
con = ouvrir("ia.duckdb")
resultats, echecs = enrichir(lignes, cles_existantes(con), appeler, modele)
ranger(con, resultats, echecs)
print(f"{len(resultats)} nouveaux, {len(echecs)} échecs")
print(con.execute("""SELECT id, theme, urgence, veut_remboursement, tokens_entree, tokens_sortie
                     FROM enrichissements WHERE modele = ? ORDER BY id""", [modele]).df())
~~~

Lance-le deux fois. La première fois, 8 appels. La deuxième : « 0 nouveaux », sans un seul appel. C'est le cache.

## Ta clé et tes données

- **La clé Gemini** se crée sur [Google AI Studio](https://aistudio.google.com/apikey), avec ton compte Google. Range-la comme ta clé GCP : un **secret Codespaces** nommé `GEMINI_API_KEY` (Settings de GitHub, Codespaces, Secrets), jamais dans un fichier commité. Le SDK la lit tout seul dans cette variable.
- **Le niveau gratuit** de l'API Gemini existe pour les modèles Flash, avec des limites par minute et par jour qui changent souvent : regarde les tiennes sur [la page des limites d'AI Studio](https://aistudio.google.com/rate-limit). Attention : sur le niveau gratuit, [les conditions de Google](https://ai.google.dev/gemini-api/terms) disent que tes textes peuvent servir à améliorer ses produits, et être lus par des personnes. N'y envoie que des **données publiques**.
- **Ollama** fait tourner un petit modèle ouvert dans ton Codespace, sans clé et sans quota : `docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama`, puis `docker exec -it ollama ollama pull llama3.2:1b`. Il est plus lent et moins bon que Gemini : le jalon suivant le mesure. L'image et le modèle pèsent plusieurs Go : vérifie la place avec `df -h` avant.
- **Tes données** doivent avoir une colonne de texte libre. Deux idées, si tu cherches encore :
    - les offres « Who is hiring » de Hacker News : un fil par mois depuis 2011, lisible par [l'API publique de Hacker News](https://github.com/HackerNews/API) (l'utilisateur `whoishiring` liste ses fils dans `submitted`). Le LLM extrait les compétences, le niveau, le télétravail ;
    - les plaintes de consommateurs du CFPB américain : leur texte n'est plus publié depuis août 2026, mais [une archive en fichiers ZIP](https://www.consumerfinance.gov/foia-requests/foia-electronic-reading-room/cfpb-consumer-complaint-database-narratives-archive/) couvre décembre 2011 à août 2026. Un très bon terrain pour un pipeline batch qui rejoue l'historique.

@@ brief
- 🔑 Un **LLM** devient une étape de transformation : un texte libre entre, des colonnes sortent. On parle d'**enrichissement**.
- 🔑 La **sortie structurée** (un schéma JSON imposé) transforme une réponse en phrases en champs utilisables. On la vérifie quand même, avec `pydantic`.
- 🔑 Une **liste fermée avec « autre »** empêche le modèle d'inventer des catégories, et de forcer un texte dans la mauvaise case.
- 🔑 La **clé de cache** (ligne + texte + version du prompt + modèle) rend l'enrichissement idempotent : relancer ou faire un backfill ne coûte rien.
- Les **échecs** (JSON invalide, limite atteinte) vont dans une table à part : aucune ligne ne disparaît en silence.

@@ codespaces
- `uv add google-genai pydantic duckdb pandas` dans un dossier `ia/` de ton dépôt de projet. Le secret Codespaces `GEMINI_API_KEY` n'apparaît qu'après un redémarrage du Codespace.
- Pour Airflow, ajoute `google-genai` et `pydantic` à l'image, comme tu as ajouté les paquets Google au module 2, et passe `GEMINI_API_KEY` aux conteneurs dans `docker-compose.yaml` (`environment:`), lue depuis ton environnement.

@@ verified
- Testé ici, avec un faux modèle à la place de l'API : le cache (deuxième lancement à 0 appel, la ligne en échec seule retentée), le plafond, un JSON hors liste rangé en échec, une erreur 429 retentée puis réussie, le stockage DuckDB et `essai_local.py` lancé deux fois.
- Vérifié sur la version 3.5.0 du SDK `google-genai` : `GenerateContentConfig` accepte `response_mime_type` et `response_json_schema`. La documentation de Gemini montre aussi une écriture plus récente, `response_format` : la version 3.5.0 la refuse. Si tu installes une version plus récente et que l'appel change, suis la [page de la sortie structurée](https://ai.google.dev/gemini-api/docs/structured-output).
- **Pas testé ici** : un vrai appel à Gemini (pas de clé dans cet environnement) ni à Ollama (l'image ne tenait pas sur le disque), et la tâche Airflow vers BigQuery de la solution. Les appels suivent les exemples officiels de [Gemini](https://ai.google.dev/gemini-api/docs/structured-output) et d'[Ollama](https://docs.ollama.com/capabilities/structured-outputs).

@@ predict
Tu lances `essai_local.py` une première fois : 8 commentaires, 8 appels. Puis tu le relances sans rien changer. Ensuite, tu ajoutes `version="v2"` à l'appel d'`enrichir` (avec un fichier `prompts/v2.md`) et tu relances encore. Combien d'appels au modèle pour le deuxième lancement, puis pour le troisième ?

@@ predict-answer
**0, puis 8.** Au deuxième lancement, les 8 clés sont déjà en table : tout est sauté, rien n'est payé. Au troisième, la version du prompt fait partie de la clé : les 8 clés sont nouvelles, donc tout est retraité, et les réponses v1 restent en table à côté des réponses v2. C'est voulu : un nouveau prompt doit être appliqué partout, et l'ancien reste disponible pour comparer.

@@ practice
**Objectif** : ajouter à ton projet une couche d'enrichissement par LLM. D'abord dans ton Codespace sur 20 de tes textes, puis comme une tâche Airflow `enrichir` qui, après le chargement, écrit dans deux tables BigQuery : `enrichissements` et `echecs_ia`.

**Tu pars de** : ton dépôt de projet, ton DAG du jalon 3 et ta table brute dans BigQuery, ta clé dans le secret Codespaces `GEMINI_API_KEY`. L'exemple des vélos de la leçon (étape Découvrir, onglet « Texte du cours ») est ton modèle : tu écris **tes** champs et **ton** prompt.

@@ constraints
- `ia/schema.py` décrit 2 à 4 champs utiles à ton tableau de bord, dont un thème en liste fermée qui contient « autre »
- `ia/prompts/v1.md` est dans Git, et le prompt contient au moins un exemple de réponse attendue
- `uv run python essai_local.py`, lancé deux fois sur 20 de tes textes, affiche la deuxième fois `0 nouveaux`
- Un JSON invalide finit dans la table des échecs avec sa réponse brute, sans arrêter le lot (tu l'as provoqué une fois, voir le pas à pas)
- La tâche `enrichir` de ton DAG vient **après** le chargement ; relancer le même jour ne change pas `SELECT COUNT(*) FROM <dataset>.enrichissements`
- `git status` ne montre aucun fichier qui contient ta clé

@@ guide
### 1. Choisis tes champs

Écris d'abord, en une phrase, la question de ton tableau de bord qui dépend du texte. Puis 2 à 4 champs qui y répondent. Un thème en liste fermée est presque toujours le premier. Préfère un booléen ou une note de 1 à 5 à un texte libre : on peut les compter.

### 2. Le schéma et le prompt

Copie la forme de `schema.py` et de `prompts/v1.md`, avec tes champs. Dans le prompt : le contexte en une phrase, chaque champ avec sa règle, la règle de « autre », et un ou deux exemples réels de tes données.

### 3. L'essai local

`modeles.py`, `enrichir.py`, `stockage.py` sont génériques : reprends-les, en changeant seulement `Avis` pour ta classe. Dans `essai_local.py`, mets 20 de tes vrais textes (une requête sur ta table brute, ou un extrait en CSV). Lance deux fois.

### 4. Provoque un échec

Dans `essai_local.py`, remplace temporairement `appeler` par une fausse fonction : `appeler = lambda prompt, modele: ('{"theme": "météo"}', 0, 0)`, avec un nouveau nom de modèle (`modele = "faux"`) pour ne pas toucher au cache. Lance : tout doit finir dans `echecs`, avec la réponse brute. Remets le vrai appel.

### 5. La tâche Airflow

Dans ton DAG, après la tâche qui charge la table brute : une tâche qui lit les textes du jour, lit les clés déjà en table, appelle `enrichir`, puis charge les deux listes dans BigQuery en mode ajout. La solution montre une version complète.

@@ hints
- Mets `id` en texte (`CAST(id AS STRING)`) partout : c'est la colonne qui reliera les enrichissements à tes données dans dbt.
- Un texte très long coûte cher : coupe-le à quelques milliers de caractères avant l'appel (`texte[:4000]`), et note-le dans ton README.
- Si tu vois beaucoup de 429, baisse le plafond ou espace les appels : le niveau gratuit compte par minute.
- `uv run python -c "from schema import Avis; import json; print(json.dumps(Avis.model_json_schema(), indent=2, ensure_ascii=False))"` montre le schéma exact envoyé au modèle.

@@ solution
La tâche Airflow pour les vélos, à adapter à tes noms de tables. Le dossier `ia/` est monté dans les conteneurs, comme `dags/`.

~~~python
from airflow.sdk import task

PROJET, DATASET = "mon-projet-gcp", "velos"


@task(retries=2)
def enrichir_avis(ds=None):
    import sys
    sys.path.insert(0, "/opt/airflow/ia")          # le dossier ia/ monté dans le conteneur

    import pandas as pd
    from google.cloud import bigquery

    from enrichir import enrichir
    from modeles import appeler_gemini

    bq = bigquery.Client(project=PROJET)
    lignes = bq.query(f"""
        SELECT CAST(id AS STRING) AS id, commentaire AS texte
        FROM `{PROJET}.{DATASET}.avis_brut`
        WHERE DATE(cree_le) = '{ds}' AND commentaire IS NOT NULL
    """).to_dataframe().to_dict("records")

    # Les clés déjà traitées (la table est créée vide la première fois, avec le même schéma)
    deja = {r.cle for r in bq.query(f"SELECT cle FROM `{PROJET}.{DATASET}.enrichissements`").result()}

    resultats, echecs = enrichir(lignes, deja, appeler_gemini, "gemini-3.5-flash", plafond=2000)

    ajout = bigquery.LoadJobConfig(write_disposition="WRITE_APPEND")
    if resultats:
        bq.load_table_from_dataframe(pd.DataFrame(resultats), f"{PROJET}.{DATASET}.enrichissements", job_config=ajout).result()
    if echecs:
        bq.load_table_from_dataframe(pd.DataFrame(echecs), f"{PROJET}.{DATASET}.echecs_ia", job_config=ajout).result()

    print(f"{len(lignes)} textes, {len(resultats)} enrichis, {len(echecs)} échecs")
    if lignes and len(echecs) > 0.2 * len(lignes):
        raise ValueError("Plus de 20 % d'échecs : regarde la table echecs_ia avant de continuer")
~~~

Ce qui compte :

- La tâche est **idempotente** : relancée pour le même `ds`, elle trouve toutes les clés et ne fait aucun appel.
- Le seuil de 20 % fait échouer la tâche si le modèle répond n'importe quoi : une erreur visible dans Airflow vaut mieux qu'un tableau de bord faux.
- Le nom du modèle est écrit dans chaque ligne : le jour où tu changes de modèle, l'historique reste lisible.

@@ selfcheck
- Je sais dire combien de tokens coûte à peu près un de mes textes, et combien d'appels fait mon DAG par jour
- Relancer mon DAG ne rappelle pas le modèle pour les textes déjà traités
- Je sais où aller lire une réponse que le modèle a ratée

@@ breakfix
Dans ton `ia/schema.py`, **retire « autre »** de la liste des thèmes, et retire sa règle du prompt (dans une copie : `prompts/v1-sans-autre.md`, avec `version="v1-sans-autre"`). Lance `essai_local.py` sur tes 20 textes, dont au moins un qui ne parle d'aucun de tes thèmes (un simple « merci », par exemple). Y a-t-il une erreur ? Quel thème a reçu ce texte ? Explique pourquoi c'est le bug le plus dangereux de la couche IA, puis remets « autre ».

@@ breakfix-hints
- Regarde la table `enrichissements` pour la version `v1-sans-autre`, ligne par ligne.
- Compte les échecs : combien ?
- Le schéma impose une valeur de la liste : que peut faire le modèle s'il n'y en a aucune de juste ?

@@ breakfix-answer
**Aucune erreur, et c'est tout le problème.** Le schéma oblige le modèle à choisir un thème de la liste ; sans « autre », il prend le moins mauvais, et le « merci » devient par exemple « application » ou « prix ». Le JSON est valide, `pydantic` l'accepte, le DAG est vert, et ton graphique compte de fausses plaintes. Une erreur qui plante se voit tout de suite ; une erreur silencieuse finit dans un tableau de bord. C'est pour ça qu'on garde une porte de sortie dans toute liste fermée, et qu'on **mesure** la qualité au jalon suivant.

@@ explain
Pourquoi vérifier la réponse avec `pydantic`, alors que l'API impose déjà le schéma ? Et pourquoi la version du prompt fait-elle partie de la clé du cache ?

@@ resources
- [La sortie structurée de l'API Gemini](https://ai.google.dev/gemini-api/docs/structured-output)
- [Les limites de l'API Gemini](https://ai.google.dev/gemini-api/docs/rate-limits)
- [La sortie structurée avec Ollama](https://docs.ollama.com/capabilities/structured-outputs)
- [Ollama dans Docker](https://docs.ollama.com/docker)
- [Les modèles pydantic](https://docs.pydantic.dev/latest/concepts/models/)

@@ declic
- [01-05] La clé qui évite les doublons : la même idée que ton `if_exists="replace"`, appliquée à des appels qui coûtent.
- [02-10] Les relances d'Airflow : ici, en plus, `avec_relances` attend quand l'API dit « trop de requêtes ».
- [W1-05] Tu as déjà fait écrire du code par une IA ; cette fois, l'IA est **dans** ton pipeline.

@@ teaser
- [P-IA2] Au jalon suivant, tu mesures si ton modèle a raison, et tu choisis entre deux versions avec des chiffres.

@@ cles
- La sortie structurée | llm structured output json schema | On impose au modèle un format JSON : ses réponses deviennent des colonnes au lieu de phrases.
- Les tokens | llm tokens pricing context window | Le modèle lit et écrit en morceaux de mots ; on paie au token, en entrée et en sortie.
- L'hallucination | llm hallucination | Le modèle peut affirmer une information absente du texte, avec assurance. Une liste fermée et une évaluation la limitent.
- Le cache des appels | llm caching idempotent pipeline | Une clé par ligne, texte, prompt et modèle : on ne paie jamais deux fois la même réponse.

@@ practice-min
3 à 4 h

@@ breakfix-min
10

@@ pas
<!-- dossiers : lignes 📁 seulement -->
>>> ia/schema.py
👁 Exemple à lire : ton fichier ira dans `ia/schema.py` de ton dépôt de projet

>>> Tu classes les commentaires
👁 Exemple à lire : ton prompt ira dans `ia/prompts/v1.md`

>>> ia/modeles.py
👁 Exemple à lire : `ia/modeles.py`, presque identique pour ton projet

>>> ia/enrichir.py
👁 Exemple à lire : `ia/enrichir.py`, générique, réutilisable tel quel

>>> ia/stockage.py
👁 Exemple à lire : `ia/stockage.py`

>>> ia/essai_local.py
📁 Dans ton dépôt de projet, dossier `ia/` : `uv run python essai_local.py`

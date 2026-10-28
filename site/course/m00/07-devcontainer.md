# Ton environnement décrit en code : le devcontainer

Ton Codespace actuel utilise l'image par défaut de GitHub. Elle contient Docker, Python et Git, mais pas Terraform, ni `uv`, ni le SDK Google Cloud. Tu pourrais les installer à la main… et recommencer à chaque nouveau Codespace.

La solution d'un data engineer : **décrire l'environnement dans un fichier**. C'est le même principe que le Dockerfile, que tu verras au module 1, et que Terraform pour le cloud : **l'infrastructure en code**.

## Le fichier `.devcontainer/devcontainer.json`

Quand un repo contient ce fichier, chaque Codespace créé (ou reconstruit) à partir de ce repo est configuré automatiquement. Les blocs principaux :

| Clé | Rôle |
| --- | --- |
| `name` | Le nom de l'environnement |
| `image` | L'image Docker de base du Codespace |
| `features` | Des outils prêts à installer : Docker, Terraform, gcloud, Python… |
| `postCreateCommand` | Une commande lancée une fois, après la création |
| `forwardPorts` / `portsAttributes` | Les ports à ouvrir et leur nom dans l'onglet Ports |
| `customizations.vscode.extensions` | Les extensions VS Code à installer |

Les **features** sont référencées par une adresse, par exemple `ghcr.io/devcontainers/features/terraform:1`. Le catalogue officiel est sur [containers.dev/features](https://containers.dev/features).

## Docker dans un Codespace

Ton Codespace est lui-même un conteneur. Pour y lancer d'autres conteneurs, il faut une feature dédiée : `docker-in-docker` ou `docker-outside-of-docker`. Si ton fichier remplace l'image par défaut sans l'une de ces features, `docker` ne marchera plus.

## Appliquer les changements

Après avoir créé ou modifié le fichier :

1. Palette de commandes (**Ctrl + Shift + P**) → **Codespaces: Rebuild Container**.
2. Le Codespace redémarre avec la nouvelle configuration. Le dossier `/workspaces` (ton code) est conservé.
3. Si la configuration contient une erreur, le Codespace démarre en **recovery mode** : un environnement minimal qui te permet de corriger le fichier. Le journal de création (**Codespaces: View Creation Log**) indique l'erreur.

Commite et pousse ton `.devcontainer` : un nouveau Codespace sur ton fork aura directement tous tes outils.

@@ predict
Tu ajoutes `.devcontainer/devcontainer.json` à ton fork et tu le pousses. Ton Codespace actuel a-t-il maintenant Terraform ?

@@ predict-answer
**Non.** Un Codespace est construit à sa création. Pour qu'il prenne en compte le fichier, il faut le **reconstruire** (Rebuild Container) ou créer un nouveau Codespace. VS Code te le propose souvent par une notification dès que le fichier change.

@@ practice
Décris ton environnement de data engineer dans `.devcontainer/devcontainer.json`, à la racine de ton fork, puis reconstruis ton Codespace.

@@ constraints
- Une image de base Python 3.13 du catalogue officiel des devcontainers
- Docker marche à l'intérieur du Codespace
- Terraform et la CLI Google Cloud (`gcloud`) sont installés
- `uv` est installé automatiquement après la création
- Les ports 5432 et 8085 sont déclarés, avec les noms « Postgres » et « pgAdmin »
- Après la reconstruction, `terraform -version`, `gcloud --version`, `uv --version` et `docker run --rm hello-world` marchent tous

@@ hints
- Les images Python des devcontainers sont sur `mcr.microsoft.com/devcontainers/python`, avec la version de Python comme tag.
- Cherche sur [containers.dev/features](https://containers.dev/features) : « docker-in-docker », « terraform » et « google-cloud-cli ». Chaque feature a une adresse à mettre dans le bloc `features`.
- `postCreateCommand` lance une commande une seule fois après la création : `pip install uv` suffit. Pour les noms de ports, regarde `portsAttributes` et sa clé `label`.

@@ solution
~~~json
{
  "name": "Data Engineering Zoomcamp",
  "image": "mcr.microsoft.com/devcontainers/python:3.13",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/terraform:1": {},
    "ghcr.io/dhoeric/features/google-cloud-cli:1": {}
  },
  "postCreateCommand": "pip install uv",
  "forwardPorts": [5432, 8085],
  "portsAttributes": {
    "5432": { "label": "Postgres" },
    "8085": { "label": "pgAdmin" }
  },
  "customizations": {
    "vscode": {
      "extensions": ["ms-python.python", "ms-toolsai.jupyter", "hashicorp.terraform"]
    }
  }
}
~~~

Les volumes Docker (comme les données Postgres) vivent dans le Codespace. Une reconstruction peut les effacer, mais ton code dans `/workspaces` est gardé.

@@ verify
devcontainer

@@ selfcheck
- Les quatre commandes de vérification marchent après la reconstruction
- L'onglet Ports affiche les noms « Postgres » et « pgAdmin » quand les services tournent
- Le fichier est commité et poussé

@@ breakfix
Dans ton fichier, change la version de la feature Terraform en `:99`, puis reconstruis le Codespace. Que se passe-t-il ? Trouve l'erreur dans le journal de création, puis répare.

@@ breakfix-hints
- Un Codespace qui ne peut pas se construire démarre quand même, dans un mode dégradé : regarde le message affiché par VS Code.
- La palette de commandes a une commande pour voir le journal de création du Codespace.
- Cherche dans le journal le nom de la feature en erreur. La version `99` n'existe pas dans le registre.

@@ breakfix-answer
Le Codespace démarre en **recovery mode** : un conteneur minimal, sans tes outils, juste assez pour corriger le fichier. Le journal (**Codespaces: View Creation Log**) montre que la feature `terraform:99` est introuvable. Tu remets `:1` et tu reconstruis. Retiens le réflexe : quand quelque chose ne démarre pas, on cherche d'abord **le journal**.

@@ explain
Explique pourquoi on décrit son environnement dans un fichier plutôt que d'installer ses outils à la main. Fais le lien avec le Dockerfile et Terraform.

@@ resources
- [Introduction aux devcontainers dans Codespaces](https://docs.github.com/fr/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers)
- [La référence de devcontainer.json](https://containers.dev/implementors/json_reference/)
- [Le catalogue des features](https://containers.dev/features)

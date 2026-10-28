#!/usr/bin/env bash
# Vérification du défi du module 1 : la table airports dans Postgres.
# Usage, depuis la racine du fork : bash site/checks/defi-01.sh
# Le script compare des empreintes : il ne contient pas les résultats attendus.

DB="airports"
PG_USER="dez"
PG_PASS="${PGPASSWORD:-dez}"
PG_HOST="${PGHOST:-localhost}"
PG_PORT="${PGPORT:-5432}"

# Choisit comment lancer psql : installé dans le Codespace, ou dans le conteneur Postgres.
if command -v psql >/dev/null 2>&1; then
  MODE="local"
else
  CONTAINER="$(docker ps --filter "publish=${PG_PORT}" --format '{{.Names}}' 2>/dev/null | head -n 1)"
  if [ -z "$CONTAINER" ]; then
    echo "❌ Aucun conteneur ne publie le port ${PG_PORT}. Lance d'abord : docker compose up -d"
    exit 1
  fi
  MODE="docker"
fi

run_sql() {
  if [ "$MODE" = "local" ]; then
    PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB" -tAc "$1" 2>/dev/null
  else
    docker exec -e PGPASSWORD="$PG_PASS" "$CONTAINER" psql -U "$PG_USER" -d "$DB" -tAc "$1" 2>/dev/null
  fi
}

fingerprint() {
  printf '%s' "$1" | sha256sum | cut -c1-16
}

if ! run_sql "SELECT 1" >/dev/null; then
  echo "❌ Connexion impossible à la base « ${DB} » avec l'utilisateur « ${PG_USER} »."
  echo "   Vérifie le nom de la base, l'utilisateur et le mot de passe dans ton compose."
  exit 1
fi

LABELS=(
  "Toutes les lignes du fichier sont dans la table"
  "Les aéroports d'Amérique du Nord sont bien comptés"
  "Les grands aéroports sont bien comptés"
  "L'altitude en mètres de Paris-Charles-de-Gaulle est juste"
  "Les latitudes sont dans la bonne colonne"
)
QUERIES=(
  "SELECT COUNT(*) FROM airports"
  "SELECT COUNT(*) FROM airports WHERE continent = 'NA'"
  "SELECT COUNT(*) FROM airports WHERE type = 'large_airport'"
  "SELECT ROUND(elevation_m::numeric, 1) FROM airports WHERE ident = 'LFPG'"
  "SELECT ROUND(AVG(latitude)::numeric, 3) FROM airports WHERE type = 'large_airport'"
)
EXPECTED=(
  "594c441c878167b2"
  "d3cd96698fc7aa1c"
  "56626ff45dd863da"
  "104aa67ca57e25bc"
  "99cb999cd9c3ed5e"
)

echo "Défi du module 1 : vérification de la table airports"
echo
ok=0
results=""
for i in "${!QUERIES[@]}"; do
  value="$(run_sql "${QUERIES[$i]}" | tr -d '[:space:]')"
  if [ -n "$value" ] && [ "$(fingerprint "$value")" = "${EXPECTED[$i]}" ]; then
    echo "✅ ${LABELS[$i]}"
    ok=$((ok + 1))
  else
    echo "❌ ${LABELS[$i]}"
    echo "   Requête : ${QUERIES[$i]}"
    echo "   Ta base répond : ${value:-(rien ou une erreur)}"
  fi
  results="${results:+${results}|}${value}"
done

echo
if [ "$ok" -eq "${#QUERIES[@]}" ]; then
  code="$(printf '%s' "$results" | sha256sum | cut -c1-8)"
  echo "🎉 Tout est vert. Ton code de réussite : ${code}"
  echo "   Entre-le sur la page du défi pour le valider."
else
  echo "${ok} vérification(s) sur ${#QUERIES[@]}. Corrige et relance le script."
  exit 1
fi

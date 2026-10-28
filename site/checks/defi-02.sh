#!/usr/bin/env bash
# Vérification du défi du module 2 : la table fhv_daily_borough dans Postgres.
# Usage, depuis la racine du fork : bash site/checks/defi-02.sh
# Le script compare des empreintes : il ne contient pas les résultats attendus.

DB="ny_taxi"
PG_USER="${PGUSER:-root}"
PG_PASS="${PGPASSWORD:-root}"
PG_HOST="${PGHOST:-localhost}"
PG_PORT="${PGPORT:-5432}"

# Choisit comment lancer psql : installé dans le Codespace, ou dans le conteneur Postgres.
if command -v psql >/dev/null 2>&1; then
  MODE="local"
else
  CONTAINER="$(docker ps --filter "publish=${PG_PORT}" --format '{{.Names}}' 2>/dev/null | head -n 1)"
  if [ -z "$CONTAINER" ]; then
    echo "❌ Aucun conteneur ne publie le port ${PG_PORT}. Lance d'abord ton Airflow : docker compose up -d"
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
  echo "   Vérifie que le service pgdatabase de ton compose tourne, avec ces identifiants."
  exit 1
fi

LABELS=(
  "La table a une clé primaire"
  "Tous les jours du printemps 2020 sont là"
  "Chaque trajet est compté, une seule fois"
  "Les trajets sans zone de départ sont comptés"
  "Le comptage d'une journée est juste"
  "Les durées moyennes sont justes"
)
QUERIES=(
  "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'fhv_daily_borough' AND constraint_type = 'PRIMARY KEY'"
  "SELECT COUNT(DISTINCT day) FROM fhv_daily_borough"
  "SELECT SUM(trips) FROM fhv_daily_borough"
  "SELECT SUM(trips) FROM fhv_daily_borough WHERE borough = 'Unknown'"
  "SELECT trips FROM fhv_daily_borough WHERE day = '2020-05-15' AND borough = 'Queens'"
  "SELECT ROUND(avg_minutes::numeric, 2) FROM fhv_daily_borough WHERE day = '2020-06-20' AND borough = 'Brooklyn'"
)
EXPECTED=(
  "6b86b273ff34fce1"
  "1da51b8d8ff98f6a"
  "8592324c18d05a00"
  "5e477e415f197e2e"
  "f3fc4fc7ae34fab1"
  "1912dcaea2855f74"
)

echo "Défi du module 2 : vérification de la table fhv_daily_borough"
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

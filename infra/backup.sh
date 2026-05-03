#!/usr/bin/env bash
# Snapshot the dashboard SQLite database to ./backups/, then prune to the most recent KEEP files.
# Uses SQLite's online .backup (WAL-safe — no need to stop the API or workers).
#
# Run from anywhere — paths resolve relative to the repo root.
# Override retention with KEEP=<n> (default 14).
set -euo pipefail

KEEP="${KEEP:-14}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_PATH="$REPO_ROOT/data/dashboard.db"
BACKUP_DIR="$REPO_ROOT/backups"

if [ ! -f "$DB_PATH" ]; then
  echo "[backup] No database at $DB_PATH — nothing to back up." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TS="$(date +%Y-%m-%dT%H-%M-%S)"
DEST="$BACKUP_DIR/dashboard-$TS.db"

sqlite3 "$DB_PATH" ".backup '$DEST'"

# Keep the $KEEP newest snapshots, drop the rest.
ls -1t "$BACKUP_DIR"/dashboard-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f --

echo "[backup] Wrote $DEST (kept newest $KEEP in $BACKUP_DIR)"

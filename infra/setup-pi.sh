#!/usr/bin/env bash
# One-time Raspberry Pi setup for home-dashboard.
# Run this on the Pi from inside the already-cloned repo:
#   cd ~/home-dashboard && bash infra/setup-pi.sh
set -euo pipefail

log() { printf '[setup-pi] %s\n' "$*"; }

log "Updating apt and installing prerequisites..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl git sqlite3

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker via get.docker.com..."
  curl -fsSL https://get.docker.com | sh
else
  log "Docker already installed: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
  log "Installing docker-compose-plugin..."
  sudo apt-get install -y docker-compose-plugin
fi

log "Verifying tools..."
git --version
docker --version
docker compose version

if ! id -nG "$USER" | grep -qw docker; then
  log "Adding $USER to docker group (log out + back in for it to take effect)..."
  sudo usermod -aG docker "$USER"
fi

log "Enabling Docker on boot..."
sudo systemctl enable docker
sudo systemctl start docker

log "Enabling BuildKit..."
sudo mkdir -p /etc/docker
if ! sudo test -f /etc/docker/daemon.json; then
  echo '{"features":{"buildkit":true}}' | sudo tee /etc/docker/daemon.json >/dev/null
  sudo systemctl restart docker
else
  log "/etc/docker/daemon.json already exists; leaving it alone."
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

log "Ensuring data/ and backups/ exist (so Docker doesn't auto-create them as root)..."
mkdir -p "$REPO_ROOT/data" "$REPO_ROOT/backups"

if [ -f "$REPO_ROOT/.env" ]; then
  log "Restricting .env to current user (chmod 600)..."
  chmod 600 "$REPO_ROOT/.env"
fi

log "Installing nightly DB backup cron entry (03:00 daily)..."
CRON_LINE="0 3 * * * cd \"$REPO_ROOT\" && bash infra/backup.sh >> backups/backup.log 2>&1"
{
  (crontab -l 2>/dev/null || true) | grep -vF "infra/backup.sh" || true
  echo "$CRON_LINE"
} | crontab -

log "Done."
log "Next steps:"
log "  1. If you were just added to the docker group, log out and back in."
log "  2. cp .env.example .env  (then fill in DIGITRANSIT_API_KEY)"
log "  3. docker compose up -d --build"

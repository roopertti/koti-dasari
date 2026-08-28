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

cat <<'NOTE'
[setup-pi] Optional: hardware screen power-off
[setup-pi]
[setup-pi]   The dashboard has a built-in software "sleep mode" (admin → Lepotila):
[setup-pi]   during the configured night window it dims to a near-black clock and
[setup-pi]   wakes on touch. The display stays powered so the clock and touch-to-wake
[setup-pi]   keep working — this is the recommended setup and needs nothing on the Pi.
[setup-pi]
[setup-pi]   If you also want to cut backlight power overnight (deeper power saving,
[setup-pi]   but NO clock and NO touch-to-wake while off), add a cron pair that calls
[setup-pi]   the display-power control. NOTE: this is a STATIC schedule and does NOT
[setup-pi]   track the admin sleep window — keep the two roughly aligned by hand:
[setup-pi]
[setup-pi]     # Wayland (Bookworm default): use wlr-randr / your compositor's DPMS.
[setup-pi]     # Legacy KMS example with cron (adjust DISPLAY/user as needed):
[setup-pi]     0 23 * * *  vcgencmd display_power 0   # off at 23:00
[setup-pi]     30 6 * * *  vcgencmd display_power 1   # on at 06:30
NOTE

log "Done."
log "Next steps:"
log "  1. If you were just added to the docker group, log out and back in."
log "  2. cp .env.example .env  (then fill in DIGITRANSIT_API_KEY)"
log "  3. docker compose up -d --build"

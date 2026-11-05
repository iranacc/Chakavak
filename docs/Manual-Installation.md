# Manual Installation

**Prerequisites (tested on Ubuntu 22.04+):**

- An Ubuntu server with sudo access
- A domain name pointing to your server's public IP (recommended)

## 1. System setup

Update and install required packages:

```bash
sudo apt update
sudo apt install -y git curl build-essential nginx python3-certbot-nginx ffmpeg
```

Install Node.js and npm (pick one):

| Method | Best for | Note |
|---|---|---|
| NodeSource | Most installs (recommended) | System-wide install via apt. |
| nvm | Per-user Node version management | Requires `nvm install` / `nvm use` after cloning. |
| Volta | Pinned toolchain per project | Installs a specific Node/npm version. |

**NodeSource (Recommended)**:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
```

**nvm**:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/latest/install.sh | bash
```

**Volta**:

```bash
curl https://get.volta.sh | bash
volta install node@24.22.1 npm@11.6.4
```

## 2. Clone repository

```bash
sudo mkdir -p /opt/chakavak
cd /opt/chakavak
git clone https://github.com/bllackbull/Chakavak.git .
```

:::info

If you installed Node.js using nvm:

```bash
nvm install
nvm use
```

:::

## 3. Install dependencies

```bash
cd /opt/chakavak/server
npm install

cd /opt/chakavak/client
npm install
npm run build
```

## 4. Create systemd service

Create `/etc/systemd/system/chakavak.service` with the following:

```ini
[Unit]
Description=Chakavak server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/chakavak/server
ExecStart=/usr/bin/env node /opt/chakavak/server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

:::info

- If you installed Node.js using nvm, set this as Node path in `ExecStart`:

```ini
ExecStart=/root/.nvm/versions/node/v24.22.1/bin/node index.js
```

- If you installed Node.js using volta, set this as Node path in `ExecStart`:

```ini
ExecStart=/root/.volta/bin/node index.js
```

:::

**Recommended: Create a dedicated user:**

:::warning

Skip this step if you installed Node.js using nvm or volta.

:::

Due to security concerns, it is recommended to create a dedicated system user and change ownership of the project directory:

1. Add these lines to systemd service file:

```ini
User=chakavak
Group=chakavak
```

2. Create a dedicated system user:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin chakavak
```

3. Change ownership of the project directory:

```bash
sudo chown -R chakavak:chakavak /opt/chakavak
git config --global --add safe.directory /opt/chakavak
```

4. Grant the service user permission to control its own unit and read system logs (required for service restart/stop and the Logs tab in the admin panel):

```bash
sudo tee /etc/sudoers.d/chakavak > /dev/null <<'EOF'
# Chakavak — allow the service user to control its own unit
# and read privileged logs without a password.
chakavak ALL=(root) NOPASSWD: /usr/bin/systemctl restart chakavak.service
chakavak ALL=(root) NOPASSWD: /usr/bin/systemctl stop chakavak.service
chakavak ALL=(root) NOPASSWD: /usr/bin/journalctl -u chakavak *
chakavak ALL=(root) NOPASSWD: /usr/bin/journalctl -u chakavak-worker *
chakavak ALL=(root) NOPASSWD: /usr/bin/cat /var/log/nginx/error.log
chakavak ALL=(root) NOPASSWD: /usr/bin/cat /var/log/nginx/access.log
chakavak ALL=(root) NOPASSWD: /usr/bin/nginx -t
chakavak ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx
EOF
sudo chmod 0440 /etc/sudoers.d/chakavak
```

Without this step the **Restart service** and **Stop service** buttons in the admin panel will fail with a permissions error, and system logs (service journal, nginx) will not be visible in the Logs tab.

**Enable and start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now chakavak.service
```

# Arika Deploy 🚀
> Zero-config deployment tool for ArikaJS apps — PM2 + Nginx/Apache + SSL, fully automated.

Arika Deploy is a developer-first deployment tool. You built your app with **ArikaJS** — now deploy it to a real server in minutes, without touching Nginx configs, PM2 setup, or SSL certificates manually.

```bash
npm install -g arika-deploy
arika deploy
```

That's it. ✅

---

## 📋 Table of Contents
- [How It Works](#-how-it-works)
- [Complete Deployment Guide](#-complete-deployment-guide-step-by-step)
- [Commands Reference](#-commands-reference)
- [Configuration](#-configuration)
- [Web Server Config](#-web-server-config)
- [SSL Setup](#-ssl-setup)
- [Common Errors](#-common-errors)
- [Future Roadmap](#-future-roadmap)

---

## 🔍 How It Works

```
Developer's Machine          Linux Server
      │                           │
      │  git push / scp           │
      │ ─────────────────────────>│
      │                           │
      │                    arika deploy
      │                           │
      │                   ┌───────▼────────┐
      │                   │  PM2 (Node App)│
      │                   └───────┬────────┘
      │                           │
      │                   ┌───────▼────────┐
      │                   │ Nginx / Apache  │
      │                   └───────┬────────┘
      │                           │
      │                   ┌───────▼────────┐
      │                   │  SSL (HTTPS)   │
      │                   └───────┬────────┘
      │                           │
   Browser ──────────────────────>│ https://example.com
```

---

## 🚀 Complete Deployment Guide (Step by Step)

This guide takes you from **zero → live HTTPS app** on a Linux server.

---

### Step 1 — Get a Linux Server

You need a VPS (Virtual Private Server). Recommended providers:
- [DigitalOcean](https://digitalocean.com) (Droplet — $6/mo)
- [Vultr](https://vultr.com)
- [Hetzner](https://hetzner.com)
- [AWS EC2](https://aws.amazon.com/ec2/)

> **Recommended:** Ubuntu 22.04 LTS, minimum 1GB RAM.

---

### Step 2 — Point Your Domain to the Server

Go to your domain registrar's DNS settings and add an **A Record**:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `YOUR_SERVER_IP` |
| A | `www` | `YOUR_SERVER_IP` |

> ⏳ DNS propagation can take 5–30 minutes.

---

### Step 3 — Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

---

### Step 4 — Install Node.js on the Server

```bash
# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # v20.x.x
npm -v    # 10.x.x
```

---

### Step 5 — Install Arika Deploy (Global)

```bash
npm install -g arika-deploy
```

Verify installation:
```bash
arika help
```

---

### Step 6 — Upload Your ArikaJS App to the Server

**Option A — Clone from Git (Recommended)**
```bash
cd /var/www
git clone https://github.com/your-username/your-app.git
cd your-app
```

**Option B — Upload via SCP from your local machine**
```bash
scp -r ./my-app root@YOUR_SERVER_IP:/var/www/my-app
```

---

### Step 7 — Set Up Environment Variables

```bash
cd /var/www/your-app
cp .env.example .env
nano .env
```

Set your production values:
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
APP_KEY=your-secret-key
```

---

### Step 8 — Run Doctor (Health Check)

Before deploying, verify your server has everything needed:

```bash
arika doctor
```

**Expected output on a fresh server:**
```text
🩺 Arika Deploy — Doctor

  ✅ Node.js installed (>=16)
  ✅ npm installed
  ❌ PM2 installed
     👉 Run: npm install -g pm2
  ❌ Nginx installed
     👉 Run: sudo apt install nginx
  ❌ Certbot (SSL) installed
     👉 Run: sudo apt install certbot python3-certbot-nginx
  ✅ Git installed
```

Fix any missing tools, then run `arika doctor` again until all are ✅.

---

### Step 9 — Deploy 🚀

```bash
cd /var/www/your-app
arika deploy
```

**First time — it will ask you a few questions:**
```text
📋 First-time setup (answers saved for next run):

  Domain(s) [comma separated, e.g. example.com,www.example.com]: example.com,www.example.com
  App port [default: 3000]:
  Entry file [default: server.js]:
  Web server [nginx/apache/none, auto-detected: nginx]:
  Enable SSL (Let's Encrypt)? [Y/n]: Y
```

**Then it runs automatically:**
```text
🚀 Arika Deploy
─────────────────────────────────
  ✔ Config saved to .arika/config.json

[1/5] Checking environment...     ✔
[2/5] Installing dependencies...  ✔
[3/5] Starting app with PM2...    ✔
[4/5] Configuring web server...   ✔
[5/5] Setting up SSL...           ✔

─────────────────────────────────
✅ App running at https://example.com
```

---

### Step 10 — Verify It's Running

```bash
arika status      # PM2 process list
arika logs        # Live logs
```

Open your browser: **https://example.com** 🎉

---

### Next Deployments (Fully Automatic)

After the first deploy, every future deploy is one command — no questions asked:

```bash
git pull
arika deploy --yes
```

Config is saved in `.arika/config.json` — everything is remembered.

---

## 🔧 Commands Reference

| Command | Description |
|---------|-------------|
| `arika deploy` | Deploy the app (interactive first time) |
| `arika deploy --yes` | Deploy using saved config (no prompts) |
| `arika deploy --nginx` | Force Nginx as web server |
| `arika deploy --apache` | Force Apache as web server |
| `arika deploy --no-ssl` | Skip SSL setup |
| `arika logs` | View live logs |
| `arika logs --error` | View error logs only |
| `arika status` | Show PM2 process status |
| `arika restart` | Restart the app |
| `arika stop` | Stop the app |
| `arika remove` | Remove the full deployment |
| `arika doctor` | Check environment health |

---

## ⚙️ Configuration

After first deploy, config is saved at `.arika/config.json`:

```json
{
  "name": "my-app",
  "domains": ["example.com", "www.example.com"],
  "port": 3000,
  "server": "nginx",
  "ssl": true,
  "entry": "server.js"
}
```

Edit this file anytime to change settings, then run `arika deploy --yes`.

---

## 🌐 Web Server Config

**Nginx (Auto Generated)**
```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Apache (Auto Generated)**
```apache
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com

    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

---

## 🔐 SSL Setup

Arika Deploy uses **Let's Encrypt** (free SSL) via Certbot:
- Auto installs Certbot if missing
- Generates certificate for all your domains
- Enables automatic HTTPS redirect
- Auto renewal configured

> ⚠️ SSL requires your domain's DNS to be pointing to the server **before** running deploy.

---

## ❌ Common Errors

**Port Already in Use**
```text
❌ Port 3000 is busy
👉 Change PORT in your .env file or edit .arika/config.json
```

**Permission Denied**
```text
❌ Permission denied
👉 Try: sudo arika deploy
```

**SSL Failed**
```text
❌ Domain not pointing to server
👉 Fix your DNS A record to point to this server's IP
👉 Wait 5–30 minutes for DNS to propagate, then retry
```

**Nginx not installed**
```text
❌ Nginx not installed
👉 Run: sudo apt install nginx
```

---

## ⚠️ Requirements

- Node.js >= 16
- Linux server (Ubuntu 20.04+ recommended)
- Root or sudo access
- Domain pointing to your server (for SSL)

---

## 📁 Project Structure

```text
your-app/
├── .env                  ← Environment variables
├── .arika/
│   └── config.json       ← Auto-generated deploy config
├── server.js / app.js    ← App entry point
└── package.json
```

---

## 📦 Installation

```bash
npm install -g arika-deploy
```

---

## 🔮 Future Roadmap
- Remote deploy (`--host`) — deploy from local machine directly
- CI/CD integration (GitHub Actions support)
- Docker support
- Git-based auto deploy (webhook trigger)
- Dashboard UI

---

## 🤝 Contributing
Pull requests are welcome. Please open an issue first for major changes.

---

## 📄 License
MIT

---

## 💡 Vision
Arika Deploy is not just a deployment tool.
It aims to become a Node.js deployment platform where developers focus only on code — not infrastructure.

🔥 Built for developers who hate DevOps complexity.

# Arika Deploy 🚀
> Zero-config deployment tool for Node.js apps (PM2 + Nginx/Apache + SSL)

Arika Deploy is a developer-first deployment tool designed to make Node.js app deployment **simple, automated, and repeatable**.

No more manual setup of:
- PM2 ❌
- Nginx / Apache ❌
- SSL ❌
- Ports ❌

Just run:
```bash
arika deploy
```

## ✨ Features

**🔹 Zero-Config Deploy**
- First time: interactive setup
- Next time: fully automatic

**🔹 Smart Server Detection**
Detects:
- Nginx
- Apache
- None → installs Nginx

**🔹 PM2 Integration (Hidden)**
- Auto install PM2
- Runs app in cluster mode
- Auto restart on crash

**🔹 SSL Support (HTTPS)**
- Free SSL using Let's Encrypt
- Auto renewal

**🔹 Multiple Domains**
Supports: `example.com`, `www.example.com`, `api.example.com`

**🔹 Logs & Debugging**
- `arika logs`
- `arika status`
- `arika restart`
- `arika stop`

**🔹 Smart Error Handling**
Clear errors with fixes:
```text
❌ Nginx not installed
👉 Run: sudo apt install nginx
```

## 📦 Installation
```bash
npm install -g arika-deploy
```

## 🚀 Usage

### 1. Deploy App
```bash
arika deploy
```

**First Run (Interactive Mode)**
```text
? Domain: example.com
? Use existing web server? (auto-detected)
? Enable SSL? (Y/n)
? App port (default: from .env or 3000)
```

**Output**
```text
🚀 Deploying...

[1/5] Checking environment...
[2/5] Installing dependencies...
[3/5] Starting app with PM2...
[4/5] Configuring web server...
[5/5] Setting up SSL...

✅ App running at https://example.com
```

### 2. Deploy Without Questions
```bash
arika deploy --yes
```

### 3. Force Specific Server
```bash
arika deploy --nginx
arika deploy --apache
```

### 4. Disable Features
```bash
arika deploy --no-nginx
arika deploy --no-ssl
```

## ⚙️ Configuration
After first deploy, config is saved at: `.arika/config.json`

Example:
```json
{
  "name": "my-app",
  "domains": ["example.com", "www.example.com"],
  "port": 3000,
  "server": "nginx",
  "ssl": true
}
```

## 🔍 How It Works

**Flow:**
```
User → Domain → Nginx/Apache → PM2 → Node App
```

**Internally Arika:**
1. Detects environment
2. Installs missing dependencies
3. Starts app via PM2
4. Configures reverse proxy
5. Sets up SSL (optional)

### 🧠 Smart Detection Logic
| Scenario | Action |
|----------|--------|
| Nginx installed | Use Nginx |
| Apache installed | Ask or use Apache |
| None installed | Install Nginx |

## 🔧 Commands

**Logs**
```bash
arika logs
arika logs --error
```

**Status**
```bash
arika status
```

**Restart App**
```bash
arika restart
```

**Stop App**
```bash
arika stop
```

**Remove Deployment**
```bash
arika remove
```

## 🩺 Doctor (Health Check)
```bash
arika doctor
```
**Output:**
```text
✅ Node installed
✅ PM2 installed
❌ Nginx missing
```

## 🌐 Web Server Config

**Nginx (Auto Generated)**
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

**Apache (Auto Generated)**
```apache
<VirtualHost *:80>
    ServerName example.com

    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

## 🔐 SSL Setup
- Uses Let's Encrypt
- Auto HTTPS redirect
- Auto renewal enabled

## ⚠️ Requirements
- Node.js >= 16
- Linux server (Ubuntu recommended)
- Root or sudo access

## ❌ Common Errors

**Port Already in Use**
```text
❌ Port 3000 is busy
👉 Suggested: 3001
```

**Permission Denied**
```text
❌ Permission denied
👉 Try: sudo arika deploy
```

**SSL Failed**
```text
❌ Domain not pointing to server
👉 Fix DNS A record
```

## 📁 Project Structure
```text
project/
├── .env
├── .arika/
│   └── config.json
├── app.js / server.js
```

## 🔮 Future Roadmap
- Remote deploy (`--host`)
- CI/CD integration
- Docker support
- Git-based auto deploy
- Dashboard UI

## 🤝 Contributing
Pull requests are welcome.

## 📄 License
MIT

## 💡 Vision
Arika Deploy is not just a deployment tool.
It aims to become a Node.js deployment platform where developers focus only on code — not infrastructure.

🔥 Built for developers who hate DevOps complexity.

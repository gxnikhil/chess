# 🚀 ChessMaster Production Deployment Guide

This guide details how to deploy **ChessMaster** to production using Railway, Render, VPS (PM2 + NGINX), or Docker.

---

## 📋 Pre-Deployment Checklist

1. Generate a strong `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
2. Update `.env` or set environment variables in your cloud provider dashboard:
   - `DATABASE_URL`: `file:./prod.db` or PostgreSQL connection string
   - `NEXTAUTH_URL`: Your live domain (e.g. `https://chessmaster.com`)
   - `NEXTAUTH_SECRET`: Generated secret
   - `NODE_ENV`: `production`

---

## ⚡ Option 1: Railway / Render (Recommended Cloud Deployment)

Because ChessMaster uses WebSocket connections (`Socket.IO`) and a custom Node server (`server.js`), Railway or Render provides instant one-click deployment.

### Steps for Railway:
1. Connect your GitHub repository to [Railway.app](https://railway.app).
2. Set the build command: `npm run build`
3. Set the start command: `node server.js`
4. Add environment variables (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`).
5. Railway automatically provides SSL and live domain.

---

## 🐳 Option 2: Docker Container Deployment

Run with Docker Compose on any server:

```bash
# Build and launch production containers
docker-compose up -d --build
```

---

## 🖥 Option 3: VPS Deployment (Ubuntu/Debian + PM2 + Nginx)

### 1. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

### 2. Clone & Build Application
```bash
git clone <your-repo-url> /var/www/chessmaster
cd /var/www/chessmaster
npm install
npx prisma db push
npm run build
```

### 3. Launch Application with PM2
```bash
pm2 start server.js --name "chessmaster"
pm2 save
pm2 startup
```

### 4. Configure Nginx Reverse Proxy with WebSockets
Edit `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

Restart Nginx:
```bash
sudo nginx -t && sudo service nginx restart
```

### 5. Enable Free SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## ✅ Post-Deployment Verification

1. Test registration and login.
2. Test live matchmaking in two browser windows.
3. Test bot gameplay and Stockfish position evaluation.
4. Verify HTTPS/WSS WebSocket connections.

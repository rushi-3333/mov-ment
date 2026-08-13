# Mov-Ment — Production Deployment Guide

Everything you must **change**, **configure**, and **implement** before going live.

---

## Deployment options

| Option | Best for | Frontend + API |
|--------|----------|----------------|
| **A. Single server (recommended)** | Railway, Render, VPS, Docker | One Node process serves API + React build |
| **B. Split hosting** | Vercel (UI) + Railway (API) | Two URLs, set `CLIENT_URL` + `VITE_API_URL` |
| **C. Docker Compose** | VPS / cloud VM | `docker compose up` |

---

## 1. Required environment variables (production)

Copy the production template:

```powershell
copy server\.env.production.example server\.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Must be `production` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Random string, **min 32 characters** |
| `CLIENT_URL` | Yes* | Frontend URL(s) for CORS, comma-separated |
| `SERVE_CLIENT` | Recommended | `true` — serve `client/dist` from API |
| `SEED_DEMO_ACCOUNTS` | No | Keep `false` in production |
| `TRUST_PROXY` | Yes | `true` behind nginx / Railway / Render |
| `PORT` | Usually auto | Host sets this (5000 locally) |

\*Not required if frontend and API are same origin (`SERVE_CLIENT=true` only).

Generate a strong JWT secret:

```powershell
# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## 2. MongoDB Atlas (production database)

1. Create a free/paid cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user (username + password)
3. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`) for cloud hosts, or your server IP
4. Copy connection string → set `MONGO_URI` in `server/.env`:

```env
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/movmentDB?retryWrites=true&w=majority
```

5. Create owner account once (after deploy) — either set `OWNER_PASSWORD` in `.env` before first start, or run:

```powershell
cd server
node scripts/createOwner.js
```

---

## 3. What changed for production (already implemented)

| Area | Development | Production |
|------|-------------|------------|
| **Demo seed passwords** | Auto-created | Disabled unless `SEED_DEMO_ACCOUNTS=true` |
| **In-memory MongoDB fallback** | Optional | **Disabled** — server exits if DB fails |
| **CORS** | All origins | Only `CLIENT_URL` list |
| **Rate limiting** | Relaxed | Login/register limited (20 / 15 min) |
| **Security headers** | Helmet (relaxed CSP) | Helmet enabled |
| **Error responses** | May include `detail` | Generic messages only |
| **Static frontend** | Vite dev server | Built files from `client/dist` |
| **Graceful shutdown** | — | SIGTERM / SIGINT handlers |

---

## 4. Build & run locally (production mode)

```powershell
cd E:\Projects\mov-ment

# 1. Configure production env
copy server\.env.production.example server\.env
# Edit server\.env — set MONGO_URI, JWT_SECRET, CLIENT_URL

# 2. Build frontend + start API in production mode
npm run start:prod
```

Open **http://localhost:5000** — single URL serves UI + API.

Health check: **http://localhost:5000/api/health**

---

## 5. Docker deployment

### Build & run

```powershell
cd E:\Projects\mov-ment

# Create .env for docker-compose (do NOT commit)
@"
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/movmentDB?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret_at_least_32_characters
CLIENT_URL=https://your-domain.com
"@ | Out-File -Encoding utf8 .env

docker compose up --build -d
```

App: **http://localhost:5000**

### Push to container registry

```powershell
docker build -t mov-ment:latest .
docker tag mov-ment:latest YOUR_REGISTRY/mov-ment:latest
docker push YOUR_REGISTRY/mov-ment:latest
```

---

## 6. Option B — Split frontend & API

Use when React is on **Vercel/Netlify** and API on **Railway/Render**.

### API server (`server/.env`)

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=https://your-app.vercel.app
SERVE_CLIENT=false
TRUST_PROXY=true
```

### Frontend build (`client/.env.production`)

```env
VITE_API_URL=https://your-api.railway.app
```

Build and deploy:

```powershell
cd client
npm run build
# Deploy client/dist to Vercel/Netlify
```

Deploy `server/` folder to Railway/Render with env vars above.

---

## 7. Platform-specific notes

### Railway / Render / Fly.io

- Set all env vars from `server/.env.production.example`
- **Build command:** `npm run build:prod` (root) or `cd client && npm ci && npm run build`
- **Start command:** `cd server && node index.js`
- Enable **health check** path: `/api/health`
- Set `TRUST_PROXY=true`

### Vercel (frontend only)

- Root directory: `client`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://your-api-host`

### VPS (nginx reverse proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use **Certbot** for HTTPS. Set `CLIENT_URL=https://your-domain.com`.

### PM2 (process manager on VPS)

```powershell
npm run build:prod
cd server
npm install --omit=dev
pm2 start index.js --name mov-ment --env production
pm2 save
pm2 startup
```

---

## 8. Pre-launch checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is unique and ≥ 32 chars
- [ ] `MONGO_URI` points to production Atlas cluster
- [ ] Atlas Network Access allows your server IP
- [ ] `SEED_DEMO_ACCOUNTS=false`
- [ ] `CLIENT_URL` matches your live frontend URL(s)
- [ ] HTTPS enabled (Let's Encrypt / platform SSL)
- [ ] Owner account created via `createOwner.js` (not default demo password)
- [ ] `/api/health` returns `"ok": true`
- [ ] Login, register, and booking flow tested on live URL
- [ ] `.env` files are **not** committed to Git

---

## 9. CI/CD example (GitHub Actions)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm run install:all
      - run: npm run lint
      - run: npm run build
      - run: cd server && npm ci --omit=dev
      # Deploy dist + server to your host (Railway, SSH, Docker, etc.)
```

---

## 10. Troubleshooting production

| Issue | Fix |
|-------|-----|
| Server exits on start | Check `MONGO_URI` and `JWT_SECRET` — production validates both |
| CORS error in browser | Add frontend URL to `CLIENT_URL` |
| Blank page after deploy | Run `npm run build`; set `SERVE_CLIENT=true` |
| API works, UI 404 | Ensure `client/dist` exists next to server |
| 503 on all API calls | MongoDB not connected — check Atlas IP whitelist |
| Login rate limited | Wait 15 min or adjust limiter in `server/middleware/security.js` |

---

## Quick reference

```powershell
# Production build + run (single server)
npm run start:prod

# Docker
docker compose up --build

# Health
curl http://localhost:5000/api/health

# Create owner after deploy
cd server && node scripts/createOwner.js
```

See also: [OPERATIONS.md](./OPERATIONS.md) for daily dev commands.

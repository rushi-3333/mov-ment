# Mov-Ment — Operations Guide

Day-to-day commands for **installing**, **running**, **stopping**, **building**, and **pushing to Git**.

Project root: `E:\Projects\mov-ment`

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| **Node.js 18+** | Backend & frontend |
| **npm** | Package manager (comes with Node) |
| **MongoDB** | Local (`mongodb://localhost:27017`) or [MongoDB Atlas](https://www.mongodb.com/atlas) |
| **Git** | Version control & push to remote |

Check versions:

```powershell
node -v
npm -v
git --version
```

---

## 1. First-time setup

### 1.1 Install all dependencies

From the **project root**:

```powershell
cd E:\Projects\mov-ment
npm run setup
```

Or step by step:

```powershell
npm run install:all
npm run setup:env
```

### 1.2 Environment files

**Server** — copy the example and edit:

```powershell
copy server\.env.example server\.env
```

Edit `server\.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/movment
JWT_SECRET=your_secret_at_least_32_characters_long
```

For **MongoDB Atlas**, replace `MONGO_URI` with your Atlas connection string and add your IP under **Network Access** in Atlas.

**Client** (optional) — only needed if the API is not on `localhost:5000`:

```powershell
copy client\.env.example client\.env
```

Add to `client\.env`:

```env
VITE_API_URL=http://localhost:5000
```

If `VITE_API_URL` is unset, the Vite dev server proxies `/api` to port 5000 automatically.

### 1.3 Initialize Git (first time only)

This repo may not be a Git repo yet. From the project root:

```powershell
cd E:\Projects\mov-ment
git init
git branch -M main
```

Create a repo on GitHub/GitLab, then add the remote:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/mov-ment.git
```

---

## 2. Running the application

### Option A — Run everything (recommended)

From the **project root**:

```powershell
cd E:\Projects\mov-ment
npm start
```

Starts:

| Service | URL |
|---------|-----|
| **Backend API** | http://localhost:5000 |
| **Frontend (Vite)** | http://localhost:5173 |

Open the **frontend URL** in your browser.

Verify API:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

### Option B — Run backend and frontend separately

**Terminal 1 — Backend:**

```powershell
cd E:\Projects\mov-ment
npm run start:server
```

**Terminal 2 — Frontend:**

```powershell
cd E:\Projects\mov-ment
npm run start:client
```

### Option C — Backend only

```powershell
cd E:\Projects\mov-ment\server
npm start
```

---

## 3. Stopping / exiting

| How you started | How to stop |
|-----------------|-------------|
| `npm start` (one terminal) | Press **`Ctrl + C`** once (stops both server and client) |
| Two terminals (`start:server` + `start:client`) | **`Ctrl + C`** in **each** terminal |
| Backend only in `server/` | **`Ctrl + C`** in that terminal |

If a port stays in use (5000 or 5173), find and kill the process:

```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill by PID (replace 12345 with the PID from the last column)
taskkill /PID 12345 /F
```

Repeat for port `5173` if needed.

---

## 4. Test accounts (auto-seeded on first server start)

| Role | Email | Password |
|------|-------|----------|
| Owner / Admin | admin@gmail.com | admin3168 |
| User | user@gmail.com | user3168 |
| Manager | manager@gmail.com | manager3168 |

Dashboard routes after login:

- User → `/user`
- Manager → `/manager`
- Admin / Owner → `/admin`

---

## 5. Build, lint, and preview (before deploy)

From `client/`:

```powershell
cd E:\Projects\mov-ment\client
npm run lint
npm run build
npm run preview
```

Production build output: `client/dist/`

---

## 6. Git workflow — commit and push

### Files that must NOT be committed

Already listed in `.gitignore`:

- `node_modules/`
- `.env`, `.env.local` (secrets)
- `*.log`

Never commit `server/.env` — it contains `JWT_SECRET` and database credentials.

### Daily workflow

```powershell
cd E:\Projects\mov-ment

# See what changed
git status

# Stage changes
git add .

# Or stage specific files
git add client/src server/routes README.md

# Commit
git commit -m "Describe what you changed and why"

# Push to remote (first push on a new branch)
git push -u origin main

# Later pushes
git push
```

### First push to a new GitHub repo

```powershell
cd E:\Projects\mov-ment
git add .
git commit -m "Initial commit: Mov-Ment event booking app"
git push -u origin main
```

### Create a feature branch (recommended)

```powershell
git checkout -b feature/your-feature-name
# ... make changes ...
git add .
git commit -m "Add your feature"
git push -u origin feature/your-feature-name
```

Then open a Pull Request on GitHub.

### Pull latest changes from remote

```powershell
git pull origin main
```

---

## 7. Useful npm scripts (reference)

| Command | Location | Action |
|---------|----------|--------|
| `npm run setup` | Root | Install deps + create `.env` files |
| `npm run setup:env` | Root | Create `.env` files only |
| `npm run install:all` | Root | Install all dependencies |
| `npm start` | Root | Run API + frontend together |
| `npm run start:server` | Root | Run API only |
| `npm run start:client` | Root | Run Vite dev server only |
| `npm start` | `server/` | Run API (`node index.js`) |
| `npm run dev` | `client/` | Run Vite dev server |
| `npm run lint` | Root / `client/` | ESLint check |
| `npm run start:prod` | Root | Build client + run API in production mode |
| `npm run build:prod` | Root | Build client for production |
| `npm run preview` | Root / `client/` | Preview production build |

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| **`vite` is not recognized** | Run `npm run install:all` from project root |
| **Login fails / JWT error** | Set `JWT_SECRET` (32+ chars) in `server/.env` and restart server |
| **Database connecting / 503** | Check `MONGO_URI`, start local MongoDB, or fix Atlas IP whitelist |
| **Frontend “Failed to fetch”** | Ensure backend is running on port 5000 |
| **Port 5000 already in use** | Stop old process (see §3) or change `PORT` in `server/.env` |
| **`fatal: not a git repository`** | Run `git init` in project root (see §1.3) |
| **Push rejected** | Run `git pull origin main` first, resolve conflicts, then push again |

---

## 9. Quick command cheat sheet

```powershell
# Setup (once)
cd E:\Projects\mov-ment
npm run setup
# edit server\.env if needed, then:

# Run
npm start

# Stop
Ctrl + C

# Git
git status
git add .
git commit -m "Your message"
git push
```

---

*Mov-Ment · Event booking & management*

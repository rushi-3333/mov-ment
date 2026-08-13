# Mov-Ment

Event booking & management application — customers book events, managers handle them, admin/owner oversees the platform.

**Last updated:** August 13, 2026

---

## Prerequisites (install before running)

Install these **once** on your machine before you run the app:

| # | Tool | Minimum version | How to check | Install |
|---|------|-----------------|--------------|---------|
| 1 | **Node.js** | 18 or higher | `node -v` | [nodejs.org](https://nodejs.org/) |
| 2 | **npm** | Comes with Node | `npm -v` | Installed with Node.js |
| 3 | **MongoDB** | Local or Atlas | — | [MongoDB Community](https://www.mongodb.com/try/download/community) **or** free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud |

**Optional (recommended):**
- **Git** — to clone/pull this repo: [git-scm.com](https://git-scm.com/)
- **Python 3** — only if you want to regenerate the Word doc: `pip install python-docx`

---

## How to run the application

### Step 1 — Get the project

```bash
git clone https://github.com/rushi-3333/mov-ment.git
cd mov-ment
```

Or open the folder if you already have it locally.

### Step 2 — Install dependencies (required before first run)

From the **project root** folder:

```bash
npm run setup
```

This command:
- Installs packages for root, `server/`, and `client/`
- Creates `server/.env` and `client/.env` if they do not exist

**Alternative (manual install):**

```bash
npm run install:all
npm run setup:env
```

### Step 3 — Configure environment

Edit **`server/.env`** (created in Step 2):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/movment
JWT_SECRET=your_secret_at_least_32_characters_long
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Yes | Random string, **minimum 32 characters** |
| `PORT` | No | API port (default `5000`) |

**Using MongoDB Atlas:** copy your connection string into `MONGO_URI` and add your IP under Atlas → Network Access.

### Step 4 — Start the application

```bash
npm start
```

Wait until you see both servers running in the terminal.

| Service | URL |
|---------|-----|
| **Frontend (open in browser)** | http://localhost:5173 |
| **Backend API** | http://localhost:5000 |
| **Health check** | http://localhost:5000/api/health |

### Step 5 — Stop the application

Press **`Ctrl + C`** in the terminal where `npm start` is running.

---

## Run backend and frontend separately (optional)

**Terminal 1 — API only:**

```bash
npm run start:server
```

**Terminal 2 — Frontend only:**

```bash
npm run start:client
```

---

## Test accounts (development)

Created automatically on first server start:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Owner / Admin | admin@gmail.com | admin3168 | http://localhost:5173/admin |
| User | user@gmail.com | user3168 | http://localhost:5173/user |
| Manager | manager@gmail.com | manager3168 | http://localhost:5173/manager |

You can also **Register** a new account from the app home page.

---

## Other useful commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Check frontend code quality |
| `npm run build` | Build frontend for production |
| `npm run start:prod` | Production build + run (single URL on port 5000) |
| `npm run docs` | Regenerate `Mov-Ment-Application-Documentation.docx` |

---

## Documentation

| File | Purpose |
|------|---------|
| [OPERATIONS.md](./OPERATIONS.md) | Daily dev commands, Git, troubleshooting |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deploy (Docker, Railway, Atlas) |
| [ATLAS_SETUP.md](./ATLAS_SETUP.md) | MongoDB Atlas setup |
| [Mov-Ment-Application-Documentation.docx](./Mov-Ment-Application-Documentation.docx) | Full application documentation (Word) |

---

## Features

- **Users:** Register/login, 2FA, book events, cancel/reschedule, invoices, notifications, support, FAQ
- **Managers:** Accept events, update status, chat, portfolio, resources, calendar
- **Admin/Owner:** Users, managers, analytics, refunds, promotions, support tickets

---

## Tech stack

- **Frontend:** React 19, Vite, React Router
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT
- **Security:** bcrypt, 2FA (TOTP), Helmet, rate limiting, CORS

---

## Repository

https://github.com/rushi-3333/mov-ment

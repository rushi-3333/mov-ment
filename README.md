# Mov-Ment

Event booking app: customers book events, managers handle them, admin/owner oversees.

**Full run / stop / Git guide:** see [OPERATIONS.md](./OPERATIONS.md)

**Detailed application documentation (Word):** [Mov-Ment-Application-Documentation.docx](./Mov-Ment-Application-Documentation.docx) — regenerate with `npm run docs`  
**Production deployment:** see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Quick start

### 1. One-command setup

From the project root:

```bash
npm run setup
```

This installs dependencies and creates `server/.env` and `client/.env` if they are missing.

### 2. Configure server (if using Atlas)

Edit `server/.env`:

- `PORT` — default `5000`
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — at least 32 characters

Local MongoDB example:

```env
MONGO_URI=mongodb://localhost:27017/movment
JWT_SECRET=your_secret_at_least_32_characters_long
```

### 3. Run the app

```bash
npm start
```

| Service   | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:5173    |
| Backend   | http://localhost:5000    |

Stop with **Ctrl + C**.

### 4. Test accounts (auto-created on first server start)

| Role    | Email               | Password     |
|---------|---------------------|--------------|
| Owner   | admin@gmail.com     | admin3168    |
| User    | user@gmail.com      | user3168     |
| Manager | manager@gmail.com   | manager3168  |

## Production deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full guide (Atlas, Docker, Railway, Vercel split, checklist).

Quick production run (single server — UI + API on port 5000):

```bash
npm run setup:env:prod
# Edit server/.env — MONGO_URI, JWT_SECRET, OWNER_PASSWORD, CLIENT_URL

npm run start:prod
```

Open **http://localhost:5000** (after build, one URL serves everything).

## Other commands

| Command            | Description              |
|--------------------|--------------------------|
| `npm run lint`     | ESLint (client)          |
| `npm run build`    | Production build         |
| `npm run start:prod` | Build frontend + run API in production mode |
| `npm run setup:env:prod` | Create `server/.env` from production template |

## Features

- **Users:** Register/login (email or phone), 2FA, book events, cancel/reschedule, invoices, notifications, support, FAQ
- **Managers:** Accept events, update status, chat, portfolio, resources
- **Admin/Owner:** Users, managers, events, analytics, refunds, promotions

## Tech

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT
- **Frontend:** React (Vite), React Router

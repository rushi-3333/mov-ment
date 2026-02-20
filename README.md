# Mov-Ment

Event booking app: customers book events, managers handle them, admin/owner oversees.

## Quick start (do everything)

### 1. Install dependencies

From the project root:

```bash
npm run install:all
```

Or manually:

```bash
npm install
cd server
npm install
cd ../client
npm install
cd ..
```

### 2. Environment

- **Server:** Copy `server/.env.example` to `server/.env` and set:
  - `PORT` (default 5000)
  - `MONGO_URI` (your MongoDB connection string)
  - `JWT_SECRET` (min 32 characters)
- **Client:** `client/.env` is already set with `VITE_API_URL=http://localhost:5000`. If your API runs on another port, change it there.

### 3. Run the app

From the project root:

```bash
npm start
```

This starts both the backend (port 5000) and the frontend (Vite, usually http://localhost:5173). Open the URL shown in the terminal in your browser.

**Or run in two terminals:**

- Terminal 1: `npm run start:server`
- Terminal 2: `npm run start:client`

### 4. First-time setup

- **Owner account:** From `server` folder run: `node scripts/createOwner.js`  
  Then log in as **admin@gmail.com** / **admin3168** to access the admin dashboard.
- **Register** as a user or manager from the app.

## Features

- **Users:** Register/login (email or phone), 2FA, book events (types, venue, guests, additional services with description/image), booking history, cancel/reschedule, invoice download, notifications, support tickets, FAQ, share/invite.
- **Managers:** Pending approvals, accept events, update status.
- **Admin/Owner:** Users, pending managers, approve/promote/remove managers, events overview.

## Tech

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT.
- **Frontend:** React (Vite), React Router.

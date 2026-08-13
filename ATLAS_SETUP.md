# Connect the app to MongoDB Atlas (real database)

Your server is already configured with your Atlas connection string. To **stop seeing the IP whitelist error** and use the real database, you must allow your current IP in Atlas (one-time setup).

## Step 1: Open Network Access in Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign in.
2. Select your project and your cluster (**Cluster0**).
3. In the left sidebar, click **Network Access** (under "Security").

## Step 2: Allow your IP (or all IPs for development)

1. Click **"+ ADD IP ADDRESS"**.
2. Either:
   - Click **"ALLOW ACCESS FROM ANYWHERE"** (adds `0.0.0.0/0`) — easiest for development and changing networks, or  
   - Click **"ADD CURRENT IP ADDRESS"** to only allow this machine.
3. Click **Confirm**.

Wait about 1 minute for the change to apply.

## Step 3: Restart the server

From the project root:

```bash
npm start
```

Or from the `server` folder:

```bash
node index.js
```

You should see:

```
MongoDB Connected ✅
```

and **no** in-memory fallback message. Your data will then be stored in Atlas and persist across restarts.

---

**Connection string used:**  
The app uses your cluster with database name `movment` and options `retryWrites=true&w=majority`. This is set in `server/.env` as `MONGO_URI`.

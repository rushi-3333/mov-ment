// Set DNS first (before other requires) so MongoDB SRV lookups work on Windows
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const config = require("./config/env");
const { applySecurity, buildCorsOptions } = require("./middleware/security");
const { serveClient } = require("./middleware/serveClient");
const errorHandler = require("./middleware/errorHandler");
const { connectWithDevFallback } = require("./services/database");
const { runSeed } = require("./services/seed");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const managerRoutes = require("./routes/manager");
const { startAutoAssignScheduler } = require("./services/autoAssign");

const app = express();

applySecurity(app);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Mov-Ment API",
    status: "running",
    environment: config.NODE_ENV,
  });
});

app.get("/api/health", (req, res) => {
  const db = mongoose.connection.db;
  const dbName = db ? db.databaseName : null;
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    ok: isConnected,
    environment: config.NODE_ENV,
    version: config.APP_VERSION,
    database: dbName,
    message: isConnected
      ? `Connected to database: ${dbName}`
      : "Not connected to any database",
  });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database connecting or unavailable. Try again in a moment." });
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/manager", managerRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found", path: req.path });
});

serveClient(app);
app.use(errorHandler);

let server;

async function bootDatabase() {
  const connected = await connectWithDevFallback();
  if (!connected) return;
  startAutoAssignScheduler();
  await runSeed();
}

function startServer() {
  server = app.listen(config.PORT, () => {
    console.log(`Mov-Ment API listening on port ${config.PORT} [${config.NODE_ENV}]`);
    bootDatabase();
  });
}

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  if (server) {
    server.close(() => {
      mongoose.connection.close(false).then(() => process.exit(0));
    });
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();

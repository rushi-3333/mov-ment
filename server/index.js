// Set DNS first (before any other requires) so MongoDB SRV lookups work on Windows
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ quiet: true });

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const managerRoutes = require("./routes/manager");
const { startAutoAssignScheduler } = require("./services/autoAssign");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow any localhost / 127.0.0.1 origin (any port) so Vite dev server works
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mov-Ment API Running...");
});

// Return 503 if MongoDB is not connected (so frontend gets a clear error, not "Failed to fetch")
app.use("/api", (req, res, next) => {
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

// Start HTTP server first so the API is reachable even while MongoDB connects
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB in the background (server already accepting requests)
mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("MongoDB Connected ✅");
    startAutoAssignScheduler();
  })
  .catch((err) => {
    console.error("MongoDB connection error ❌", err.message);
    if (err.message && err.message.includes("ETIMEDOUT")) {
      console.error("  → Add your IP in Atlas Network Access or try mobile hotspot.");
    }
    console.error("  → API will return 503 for auth/events until MongoDB is connected.");
  });

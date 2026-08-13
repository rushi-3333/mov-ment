const mongoose = require("mongoose");
const config = require("../config/env");

async function connectDatabase() {
  await mongoose.connect(config.MONGO_URI, {
    maxPoolSize: config.isProduction ? 20 : 10,
    serverSelectionTimeoutMS: config.isProduction ? 10000 : 30000,
  });

  const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : "?";
  console.log("MongoDB Connected");
  console.log("  Database:", dbName);
}

async function connectWithDevFallback() {
  const match = config.MONGO_URI.match(/\/([^/?]+)(\?|$)/);
  const attemptedDb = match ? match[1] : "unknown";
  console.log("Attempting MongoDB connection to database:", attemptedDb);

  try {
    await connectDatabase();
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);

    if (config.isProduction) {
      console.error("Production requires a working MongoDB connection. Fix MONGO_URI and restart.");
      process.exit(1);
    }

    if (err.message && (err.message.includes("whitelist") || err.message.includes("IP"))) {
      console.error("  → Add your IP in Atlas: Database → Network Access → Add IP Address");
    }

    if (!config.ALLOW_MEMORY_DB) {
      console.error("Set ALLOW_MEMORY_DB=true in development to use in-memory fallback, or fix MONGO_URI.");
      return false;
    }

    console.log("Starting in-memory database (development only)...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log("MongoDB Connected (in-memory — data is not persisted)");
      return true;
    } catch (fallbackErr) {
      console.error("In-memory fallback failed:", fallbackErr.message);
      return false;
    }
  }
}

module.exports = { connectDatabase, connectWithDevFallback };

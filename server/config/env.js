const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

function parseBool(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return value === "true" || value === "1";
}

function parseList(value) {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const JWT_SECRET = (process.env.JWT_SECRET || "").trim();
const MONGO_URI = (process.env.MONGO_URI || "mongodb://localhost:27017/movment").trim();

function validateProductionEnv() {
  const errors = [];
  if (!MONGO_URI || MONGO_URI.includes("USER:PASSWORD") || MONGO_URI.includes("USER:PASS")) {
    errors.push("MONGO_URI must be set to a real MongoDB connection string");
  }
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters");
  }
  if (parseBool(process.env.SEED_DEMO_ACCOUNTS, false)) {
    errors.push("SEED_DEMO_ACCOUNTS must be false in production");
  }
  const serveClient = parseBool(process.env.SERVE_CLIENT, true);
  const clientUrls = parseList(process.env.CLIENT_URL);
  if (!serveClient && clientUrls.length === 0) {
    errors.push("CLIENT_URL is required when SERVE_CLIENT=false (split frontend/API deploy)");
  }
  if (errors.length) {
    throw new Error(`Production environment invalid:\n  - ${errors.join("\n  - ")}`);
  }
}

if (isProduction) {
  validateProductionEnv();
} else if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn("WARNING: JWT_SECRET is missing or shorter than 32 characters — login will fail.");
}

module.exports = {
  NODE_ENV,
  isProduction,
  isDevelopment: !isProduction,
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI,
  JWT_SECRET,
  CLIENT_URL: parseList(process.env.CLIENT_URL),
  SERVE_CLIENT: parseBool(process.env.SERVE_CLIENT, isProduction),
  SEED_DEMO_ACCOUNTS: parseBool(process.env.SEED_DEMO_ACCOUNTS, !isProduction),
  ALLOW_MEMORY_DB: parseBool(process.env.ALLOW_MEMORY_DB, false) && !isProduction,
  TRUST_PROXY: parseBool(process.env.TRUST_PROXY, isProduction),
  APP_VERSION: process.env.APP_VERSION || "1.0.0",
  OWNER_EMAIL: (process.env.OWNER_EMAIL || "admin@gmail.com").trim().toLowerCase(),
  OWNER_PASSWORD: process.env.OWNER_PASSWORD || "",
  OWNER_NAME: (process.env.OWNER_NAME || "Owner").trim(),
};

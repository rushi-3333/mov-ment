const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const config = require("../config/env");

function applySecurity(app) {
  if (config.isProduction) {
    app.use(compression());
  }

  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  if (config.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.isProduction ? 300 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.isProduction ? 20 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again later." },
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
}

function buildCorsOptions() {
  const { CLIENT_URL, isProduction, SERVE_CLIENT } = config;

  if (!isProduction && CLIENT_URL.length === 0) {
    return {
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
      optionsSuccessStatus: 204,
    };
  }

  const allowed = new Set(CLIENT_URL);
  if (SERVE_CLIENT) {
    allowed.add(undefined);
  }

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowed.has(origin)) return callback(null, true);
      if (!isProduction) return callback(null, true);
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    optionsSuccessStatus: 204,
  };
}

module.exports = { applySecurity, buildCorsOptions };

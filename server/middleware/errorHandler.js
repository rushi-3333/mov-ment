const config = require("../config/env");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const isCors = err.message && err.message.startsWith("CORS blocked");

  if (isCors) {
    return res.status(403).json({ message: "Origin not allowed" });
  }

  console.error("Unhandled error:", err.message || err);

  const payload = {
    message: status >= 500 ? "Server error" : err.message || "Request failed",
  };

  if (!config.isProduction && err.message) {
    payload.detail = err.message;
  }

  res.status(status >= 400 && status < 600 ? status : 500).json(payload);
}

module.exports = errorHandler;

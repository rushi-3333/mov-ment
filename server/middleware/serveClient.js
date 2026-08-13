const path = require("path");
const fs = require("fs");
const express = require("express");
const config = require("../config/env");

function resolveClientDist() {
  return path.join(__dirname, "..", "..", "client", "dist");
}

function serveClient(app) {
  if (!config.SERVE_CLIENT) return false;

  const distPath = resolveClientDist();
  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    if (config.isProduction) {
      console.warn("SERVE_CLIENT is enabled but client/dist was not found. Run: npm run build");
    }
    return false;
  }

  app.use(express.static(distPath, { maxAge: config.isProduction ? "1d" : 0, index: false }));

  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(distPath, "index.html"));
  });

  console.log("Serving frontend from", distPath);
  return true;
}

module.exports = { serveClient, resolveClientDist };

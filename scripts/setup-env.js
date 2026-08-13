const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const isProd = process.argv.includes("--production");

function ensureFile(fromExample, target, label) {
  if (fs.existsSync(target)) {
    console.log(`  OK  ${label} (already exists)`);
    return;
  }
  if (fs.existsSync(fromExample)) {
    fs.copyFileSync(fromExample, target);
    console.log(`  +   ${label} (created from example)`);
    return;
  }
  console.warn(`  !   ${label} — example file missing: ${fromExample}`);
}

function ensureClientEnv() {
  const target = path.join(root, "client", ".env");
  if (fs.existsSync(target)) {
    console.log("  OK  client/.env (already exists)");
    return;
  }
  fs.writeFileSync(target, "VITE_API_URL=http://localhost:5000\n", "utf8");
  console.log("  +   client/.env (created for local dev)");
}

console.log(`Mov-Ment environment setup${isProd ? " (production template)" : ""}\n`);

if (isProd) {
  ensureFile(
    path.join(root, "server", ".env.production.example"),
    path.join(root, "server", ".env"),
    "server/.env (production template)"
  );
  console.log("\nEdit server/.env — set MONGO_URI, JWT_SECRET, OWNER_PASSWORD, CLIENT_URL.");
  console.log("See DEPLOYMENT.md for full production checklist.");
} else {
  ensureFile(path.join(root, "server", ".env.example"), path.join(root, "server", ".env"), "server/.env");
  ensureClientEnv();
  console.log("\nDone. Edit server/.env with your MONGO_URI and JWT_SECRET if needed.");
  console.log("For production: npm run setup:env:prod  (or see DEPLOYMENT.md)");
}

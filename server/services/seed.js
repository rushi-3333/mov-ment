const bcrypt = require("bcryptjs");
const User = require("../models/User");
const config = require("../config/env");

const DEMO_ACCOUNTS = [
  { email: "user@gmail.com", password: "user3168", name: "Test User", role: "user" },
  { email: "manager@gmail.com", password: "manager3168", name: "Test Manager", role: "manager" },
];

async function ensureOwnerAccount() {
  const existing = await User.findOne({ email: config.OWNER_EMAIL });
  if (existing) return;

  const password =
    config.OWNER_PASSWORD ||
    (config.isDevelopment ? "admin3168" : null);

  if (!password) {
    console.warn(
      `No owner account for ${config.OWNER_EMAIL}. Set OWNER_PASSWORD in .env or run: node scripts/createOwner.js`
    );
    return;
  }

  if (config.isProduction && password.length < 12) {
    console.warn("OWNER_PASSWORD should be at least 12 characters in production.");
  }

  const salt = await bcrypt.genSalt(10);
  await User.create({
    name: config.OWNER_NAME,
    email: config.OWNER_EMAIL,
    passwordHash: await bcrypt.hash(password, salt),
    role: "owner",
    approved: true,
  });

  if (config.isDevelopment) {
    console.log("Owner account created:", config.OWNER_EMAIL, "/", password);
  } else {
    console.log("Owner account created:", config.OWNER_EMAIL);
  }
}

async function ensureDemoAccounts() {
  if (!config.SEED_DEMO_ACCOUNTS) return;

  const salt = await bcrypt.genSalt(10);
  for (const acc of DEMO_ACCOUNTS) {
    const exists = await User.findOne({ email: acc.email });
    if (exists) continue;

    await User.create({
      name: acc.name,
      email: acc.email,
      passwordHash: await bcrypt.hash(acc.password, salt),
      role: acc.role,
      approved: true,
    });

    if (config.isDevelopment) {
      console.log("Demo account created:", acc.email, "/", acc.password, `(${acc.role})`);
    } else {
      console.log("Demo account created:", acc.email, `(${acc.role})`);
    }
  }
}

async function runSeed() {
  try {
    await ensureOwnerAccount();
    await ensureDemoAccounts();
  } catch (err) {
    console.warn("Seed accounts:", err.message || err);
  }
}

module.exports = { runSeed };

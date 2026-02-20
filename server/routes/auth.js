const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const User = require("../models/User");
const UserActivity = require("../models/UserActivity");

// Register – sign up with email, phone optional
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, city, area } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const r = (role || "user").toLowerCase();
    if (!["user", "manager"].includes(r)) {
      return res.status(400).json({ message: "Role must be user or manager" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: r,
      approved: r === "manager" ? false : true,
      phone: (phone && String(phone).trim()) ? String(phone).trim() : undefined,
      location: { city, area },
    });

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login – with email or phone
router.post("/login", async (req, res) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Login: JWT_SECRET is not set in .env");
      return res.status(500).json({ message: "Server misconfigured (JWT_SECRET). Restart server after adding it to .env" });
    }

    const { email, phone, password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Email or phone and password required" });
    }
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone required" });
    }

    const query = email ? { email: email.trim().toLowerCase() } : { phone: String(phone).trim() };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "manager" && user.approved !== true) {
      return res.status(403).json({
        message: "Your manager account is pending approval. Please contact the admin.",
      });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return res.json({
        requireTwoFactor: true,
        tempUserId: String(user._id),
        message: "Enter the 6-digit code from your authenticator app",
      });
    }

    const payload = { id: String(user._id), role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });
    UserActivity.create({ user: user._id, action: "login" }).catch(() => {});

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message || err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// Verify 2FA and complete login
router.post("/login/verify-2fa", async (req, res) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "Server misconfigured" });

    const { tempUserId, code } = req.body;
    if (!tempUserId || !code) {
      return res.status(400).json({ message: "User and verification code required" });
    }

    const user = await User.findById(tempUserId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({ message: "Invalid or expired. Please log in again." });
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: String(code).replace(/\s/g, ""),
      window: 1,
    });
    if (!valid) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    const payload = { id: String(user._id), role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });
    UserActivity.create({ user: user._id, action: "login" }).catch(() => {});

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Verify 2FA error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Enable 2FA – returns secret for authenticator app (call after login)
const auth = require("../middleware/auth");
router.post("/2fa/enable", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({ name: `Mov-Ment (${user.email})`, length: 20 });
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = true;
    await user.save();

    return res.json({
      secret: secret.base32,
      qrUrl: secret.otpauth_url,
      message: "Scan the QR code in your authenticator app, then verify with a code.",
    });
  } catch (err) {
    console.error("2FA enable error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Verify 2FA setup (user sends first code to confirm)
router.post("/2fa/verify", auth(), async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) return res.status(400).json({ message: "2FA not in progress" });

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: String(code).replace(/\s/g, ""),
      window: 1,
    });
    if (!valid) return res.status(400).json({ message: "Invalid code. Try again." });

    return res.json({ message: "Two-factor authentication is now enabled." });
  } catch (err) {
    console.error("2FA verify error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Disable 2FA (requires password)
router.post("/2fa/disable", auth(), async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Incorrect password" });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return res.json({ message: "Two-factor authentication disabled." });
  } catch (err) {
    console.error("2FA disable error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


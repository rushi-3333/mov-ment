const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const email = process.argv[2];
const newPassword = process.argv[3];

async function main() {
  if (!email || !newPassword) {
    console.log("Usage: node scripts/resetPassword.js <email> <new-password>");
    console.log("Example: node scripts/resetPassword.js rushi@gmail.com MyNewPass123");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.log("No user found with email:", email);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log("Password updated for:", user.email);
    console.log("You can now sign in with this email and the new password.");
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();

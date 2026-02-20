const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ quiet: true });

const User = require("../models/User");

const EMAIL = "admin@gmail.com";
const PASSWORD = "admin3168";

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    let user = await User.findOne({ email: EMAIL });
    if (user) {
      console.log("User already exists, updating role to owner.");
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(PASSWORD, salt);
      user = new User({
        name: "Owner",
        email: EMAIL,
        passwordHash,
      });
    }

    user.role = "owner";
    user.approved = true;
    await user.save();

    console.log("Owner account ready:");
    console.log(`  Email: ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
  } catch (err) {
    console.error("Error creating owner:", err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();


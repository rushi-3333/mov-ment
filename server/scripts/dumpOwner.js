const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
require("dotenv").config({ quiet: true });

const User = require("../models/User");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: "admin@gmail.com" }).lean();
    console.log("Owner record:", user);
  } catch (err) {
    console.error("dumpOwner error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();


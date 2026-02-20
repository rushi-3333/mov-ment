const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running successfully 🚀");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected ✅");
  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
})
.catch((err) => {
  console.log("MongoDB connection error ❌:", err);
});

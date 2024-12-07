require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const bot = require("./utils/telegram"); // Import your Telegram bot instance

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Set webhook for Telegram bot
const url =
  process.env.WEBHOOK_URL || `https://hackintownbot.onrender.com/telegram`;
bot
  .setWebHook(url)
  .then(() => {
    console.log("Webhook set successfully");
  })
  .catch((error) => {
    console.error("Error setting webhook:", error);
  });

// Telegram webhook endpoint
app.post("/telegram", (req, res) => {
  bot.processUpdate(req.body); // Pass the incoming updates to the bot instance
  res.sendStatus(200); // Respond with HTTP 200 status
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

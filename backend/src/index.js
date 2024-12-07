require("dotenv").config(); // Load environment variables
const express = require("express"); // Framework for handling HTTP requests
const connectDB = require("./config/db"); // Database connection function
const bot = require("./utils/telegram"); // Telegram bot setup
const apiRoutes = require("./routes/api"); // Import API routes
const cors = require("cors"); // Middleware for Cross-Origin Resource Sharing

const app = express();

// Connect to MongoDB
connectDB();

// Middleware for parsing JSON
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
// API Routes (e.g., /api/users, /api/spins, etc.)
app.use("/api", apiRoutes);

// Telegram Webhook Endpoint
app.post("/telegram", (req, res) => {
  try {
    console.log("Webhook update received:", req.body); // Log incoming webhook updates for debugging
    bot.processUpdate(req.body); // Pass the update to the Telegram bot instance
    res.sendStatus(200); // Acknowledge Telegram's request
  } catch (error) {
    console.error("Error processing webhook:", error.message);
    res.sendStatus(500); // Respond with a server error if something goes wrong
  }
});

// Default Route for Health Check
app.get("/", (req, res) => {
  res.send("Server is running. API and Telegram bot are ready!");
});

// Fallback Route for Unmatched Endpoints
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

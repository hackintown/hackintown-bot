const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Fetch user data for frontend
router.get("/user/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(user);
});

// Handle spin updates
router.post("/spin", async (req, res) => {
  const { telegramId, reward } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ message: "User not found." });

  user.spins -= 1;
  user.totalEarnings += reward;
  await user.save();
  res.json(user);
});

// Process withdrawal
router.post("/withdraw", async (req, res) => {
  const { telegramId, upiId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user || user.totalEarnings < 100) {
    return res
      .status(400)
      .json({ message: "Insufficient balance or user not found." });
  }

  user.withdrawalRequests.push({ amount: user.totalEarnings, upiId });
  user.totalEarnings = 0;
  await user.save();
  res.json({ message: "Withdrawal request submitted successfully." });
});

module.exports = router;

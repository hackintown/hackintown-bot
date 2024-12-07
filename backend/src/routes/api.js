const express = require("express");
const User = require("../models/User");
const Joi = require("joi");
const router = express.Router();

// Base route to verify API status
router.get("/", (req, res) => {
  res.json({ message: "API is working!" });
});

// Helper function to fetch user
const getUser = async (telegramId) => {
  const user = await User.findOne({ telegramId });
  if (!user) throw new Error("User not found.");
  return user;
};

// Fetch user data for frontend
router.get("/user/:telegramId", async (req, res) => {
  try {
    const user = await getUser(req.params.telegramId);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(404).json({ message: error.message });
  }
});

// Schema for validating spin requests
const spinSchema = Joi.object({
  telegramId: Joi.string().required(),
  reward: Joi.number().required(),
});

// Handle spin updates
router.post("/spin", async (req, res) => {
  try {
    const { error } = spinSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { telegramId, reward } = req.body;
    const user = await getUser(telegramId);

    if (user.spins <= 0) {
      return res.status(400).json({ message: "No spins left!" });
    }

    user.spins -= 1;
    user.totalEarnings += reward;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Error updating spin:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Schema for validating withdrawal requests
const withdrawSchema = Joi.object({
  telegramId: Joi.string().required(),
  upiId: Joi.string()
    .pattern(/^[\w.-]+@[\w.-]+$/)
    .required(),
});

// Process withdrawal
router.post("/withdraw", async (req, res) => {
  try {
    const { error } = withdrawSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { telegramId, upiId } = req.body;
    const user = await getUser(telegramId);

    if (user.totalEarnings < 100) {
      return res
        .status(400)
        .json({ message: "Insufficient balance or user not found." });
    }

    user.withdrawalRequests.push({ amount: user.totalEarnings, upiId });
    user.totalEarnings = 0;
    await user.save();

    res.json({ message: "Withdrawal request submitted successfully." });
  } catch (error) {
    console.error("Error processing withdrawal:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Add to existing routes
router.get("/verify-channel/:telegramId", async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMember = await verifyMembership(req.params.telegramId);
    user.channelJoined = isMember;
    await user.save();

    res.json({ isChannelMember: isMember });
  } catch (error) {
    console.error("Error verifying channel membership:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

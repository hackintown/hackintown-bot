const express = require("express");
const User = require("../models/User");
const Joi = require("joi");
const { verifyMembership } = require("../utils/telegram");
const router = express.Router();
const cache = require("../utils/cache");

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

router.get("/user/:telegramId", async (req, res) => {
  try {
    const telegramId = req.params.telegramId;

    // Validate the request is from Telegram WebApp
    const initData = req.headers["x-telegram-init-data"];
    if (!initData) {
      // For development, you might want to bypass this check
      console.warn("Missing Telegram init data");
    }

    const user = await getUser(telegramId);
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
    const telegramId = req.params.telegramId;
    const cacheKey = `channel_member_${telegramId}`;

    // Check cache first
    let isMember = cache.get(cacheKey);

    if (isMember === undefined) {
      isMember = await verifyMembership(telegramId);
      cache.set(cacheKey, isMember);
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isMember && !user.channelJoined) {
      user.channelJoined = true;
      if (user.spins === 0) user.spins = 3;
      await user.save();
    }

    res.json({
      isChannelMember: isMember,
      spins: user.spins,
      totalEarnings: user.totalEarnings,
    });
  } catch (error) {
    console.error("Error verifying channel membership:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add this to your existing routes
router.post("/verify-membership", async (req, res) => {
  try {
    const { telegramId } = req.body;
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const member = await bot.getChatMember(CHANNEL_USERNAME, telegramId);
    const isChannelMember = ["member", "administrator", "creator"].includes(
      member.status
    );

    if (isChannelMember && !user.channelJoined) {
      user.channelJoined = true;
      if (user.spins === 0) user.spins = 3;
      await user.save();
    }

    res.json({
      isChannelMember,
      spins: user.spins,
      totalEarnings: user.totalEarnings,
    });
  } catch (error) {
    console.error("Membership verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/referral-reward", async (req, res) => {
  try {
    const { referrerId, referredId } = req.body;

    const referrer = await User.findOne({ telegramId: referrerId });
    const referred = await User.findOne({ telegramId: referredId });

    if (!referrer || !referred) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if referred user has joined the channel
    if (!referred.channelJoined) {
      return res.status(400).json({
        message: "Referred user must join the channel first",
      });
    }

    // Check if referral reward already given
    const existingReferral = referrer.referralStats.referredUsers.find(
      (user) => user.userId === referredId && user.rewarded
    );

    if (!existingReferral) {
      // Add 1 spin to referrer
      referrer.spins += 1;

      // Update referral status
      const referralIndex = referrer.referralStats.referredUsers.findIndex(
        (user) => user.userId === referredId
      );

      if (referralIndex !== -1) {
        referrer.referralStats.referredUsers[referralIndex].rewarded = true;
      }

      await referrer.save();
    }

    res.json({ success: true, spins: referrer.spins });
  } catch (error) {
    console.error("Error processing referral reward:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

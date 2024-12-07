const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");
const crypto = require("crypto-browserify");

// Environment variables
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || "@hackintown";
const BOT_USERNAME = process.env.BOT_USERNAME || "HackintownBot";
const WITHDRAWAL_THRESHOLD = process.env.WITHDRAWAL_THRESHOLD || 100;

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

bot.on("error", (error) => {
  console.error("Telegram Bot Error:", error.message);
});

const generateReferralCode = () => crypto.randomBytes(4).toString("hex");
const generateUniqueReferralCode = async () => {
  let code;
  let exists;
  do {
    code = generateReferralCode();
    exists = await User.findOne({ referralCode: code });
  } while (exists);
  return code;
};

const handleReferral = async (newUser, referrerCode) => {
  try {
    const referrer = await User.findOne({ referralCode: referrerCode });
    if (!referrer) return null;

    // Add pending referral
    referrer.referralStats.pendingReferrals.push({
      userId: newUser.telegramId,
      joinedChannel: false,
      rewardClaimed: false,
    });

    newUser.referredBy = referrer.telegramId;
    await Promise.all([referrer.save(), newUser.save()]);

    return referrer;
  } catch (error) {
    console.error("Error handling referral:", error);
    return null;
  }
};

const checkAndRewardReferrer = async (userId) => {
  try {
    const user = await User.findOne({ telegramId: userId });
    if (!user || !user.referredBy) return;

    const referrer = await User.findOne({ telegramId: user.referredBy });
    if (!referrer) return;

    // Find the pending referral
    const pendingReferral = referrer.referralStats.pendingReferrals.find(
      (ref) => ref.userId === userId && !ref.rewardClaimed
    );

    if (pendingReferral && user.channelJoined) {
      // Move to completed referrals
      referrer.referralStats.pendingReferrals =
        referrer.referralStats.pendingReferrals.filter(
          (ref) => ref.userId !== userId
        );

      referrer.referralStats.completedReferrals.push({
        userId: userId,
        joinedChannel: true,
        rewardClaimed: true,
        completedAt: new Date(),
      });

      referrer.referralStats.totalReferrals += 1;
      referrer.spins += 1; // Reward one free spin

      await referrer.save();

      // Notify referrer
      bot.sendMessage(
        referrer.telegramId,
        `🎉 Congratulations! Your referral has joined the channel. You've earned 1 free spin!`
      );
    }
  } catch (error) {
    console.error("Error checking referral:", error);
  }
};

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const referralCode = match ? match[1]?.replace(/[^\w-]/g, "") : null;

  try {
    let user = await User.findOne({ telegramId: chatId });
    if (!user) {
      user = new User({
        telegramId: chatId,
        username: msg.from.username || "",
        referralCode: await generateUniqueReferralCode(),
        spins: 3,
        channelJoined: false,
      });

      if (referralCode) {
        await handleReferral(user, referralCode);
      }

      await user.save();
    }

    // Welcome message with referral link
    const welcomeMessage = `
        Welcome to Spin & Win! 🎰

        ${referralCode ? "🎯 You were invited by a friend!" : ""}
        Your unique referral link:
        https://t.me/${BOT_USERNAME}?start=${user.referralCode}

        Share this link with friends and earn 1 free spin for each friend who joins! 🎁
    `;

    bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎮 Start Playing", callback_data: "start_playing" }],
          [{ text: "📊 My Referrals", callback_data: "show_referrals" }],
        ],
      },
    });
  } catch (error) {
    console.error("Error in /start:", error);
    bot.sendMessage(chatId, "⚠️ An error occurred. Please try again.");
  }
});

// Handle callback queries
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  try {
    const user = await User.findOne({ telegramId: chatId });
    if (!user) throw new Error("User not found.");

    switch (data) {
      case "start_playing":
        if (!user.channelJoined) {
          bot.sendMessage(chatId, "Join our channel to get 3 free spins! 🎁", {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📢 Join Channel",
                    url: `https://t.me/${CHANNEL_USERNAME}`,
                  },
                ],
                [
                  {
                    text: "✅ I've Joined",
                    callback_data: "verify_membership",
                  },
                ],
              ],
            },
          });
        } else {
          showSpinMenu(chatId, user);
        }
        break;

      case "verify_membership":
        const isMember = await verifyMembership(chatId);
        if (isMember) {
          user.channelJoined = true;
          user.spins = 3;
          await user.save();
          showSpinMenu(chatId, user);
        } else {
          bot.sendMessage(chatId, "❌ Please join the channel first!");
        }
        break;

      case "spin":
        handleSpin(chatId, user);
        break;

      case "withdraw":
        handleWithdraw(chatId, user);
        break;

      case "show_referrals":
        const stats = `
📊 Your Referral Stats:

Total Referrals: ${user.referralStats.totalReferrals}
Pending Referrals: ${user.referralStats.pendingReferrals.length}
Completed Referrals: ${user.referralStats.completedReferrals.length}

Share your link to earn more spins!
https://t.me/${BOT_USERNAME}?start=${user.referralCode}
        `;

        bot.editMessageText(stats, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: "🎮 Back to Game", callback_data: "start_playing" }],
            ],
          },
        });
        break;
    }
  } catch (error) {
    console.error("Error in callback query:", error.message);
    bot.sendMessage(chatId, "⚠️ An error occurred. Please try again.");
  }
});

// Verify channel membership
async function verifyMembership(chatId) {
  try {
    const res = await bot.getChatMember(CHANNEL_USERNAME, chatId);
    const isMember = ["member", "administrator", "creator"].includes(
      res.status
    );

    if (isMember) {
      // Check and reward referrer if this user was referred
      await checkAndRewardReferrer(chatId);
    }

    return isMember;
  } catch (err) {
    console.error("Error verifying membership:", err);
    return false;
  }
}

// Handle spinning logic
const handleSpin = async (chatId, user) => {
  if (!user.channelJoined) {
    const isMember = await verifyMembership(chatId);
    if (!isMember) {
      bot.sendMessage(chatId, "Please join our channel first!");
      return;
    }
    user.channelJoined = true;
  }

  if (user.spins <= 0) {
    bot.sendMessage(
      chatId,
      `No spins left! 😢\nInvite friends to get more spins!\nYour referral link: https://t.me/HackintownBot?start=${user.referralCode}`
    );
    return;
  }

  const winAmount = calculateReward(user.spins);
  user.spins -= 1;
  user.totalEarnings += winAmount;
  await user.save();

  bot.sendMessage(
    chatId,
    `🎉 You won ₹${winAmount}!\nSpins left: ${user.spins}\nTotal earnings: ₹${user.totalEarnings}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎰 Spin Again", callback_data: "spin" }],
          [{ text: "💰 Withdraw", callback_data: "withdraw" }],
        ],
      },
    }
  );
};

const calculateReward = (spinsLeft) => {
  const ranges = {
    3: { min: 30, max: 50 },
    2: { min: 20, max: 35 },
    1: { min: 10, max: 20 },
  };

  const range = ranges[spinsLeft] || ranges[1];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
};

// Handle withdrawal logic
const handleWithdraw = async (chatId, user) => {
  if (user.totalEarnings >= WITHDRAWAL_THRESHOLD) {
    bot.sendMessage(chatId, "Enter your UPI ID (format: upi <your-upi-id>)");
  } else {
    bot.sendMessage(
      chatId,
      `You need ₹${WITHDRAWAL_THRESHOLD} to withdraw. Current balance: ₹${user.totalEarnings}`
    );
  }
};

// Handle UPI submission
bot.onText(/^upi (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const upiId = match[1];
  const upiPattern = /^[\w.-]+@[\w.-]+$/;

  if (!upiPattern.test(upiId)) {
    bot.sendMessage(chatId, "⚠️ Invalid UPI ID. Please try again.");
    return;
  }

  const user = await User.findOne({ telegramId: chatId });
  if (user && user.totalEarnings >= WITHDRAWAL_THRESHOLD) {
    user.withdrawalRequests.push({ amount: user.totalEarnings, upiId });
    user.totalEarnings = 0;
    await user.save();

    bot.sendMessage(
      chatId,
      "✅ Withdrawal request submitted! We'll process it within 24 hours."
    );
  } else {
    bot.sendMessage(chatId, "You need at least ₹100 to withdraw.");
  }
});

// Leaderboard functionality
bot.onText(/\/leaderboard/, async (msg) => {
  const chatId = msg.chat.id;
  const topReferrers = await User.find().sort({ referredUsers: -1 }).limit(10);

  let leaderboard = "🏆 Top Referrers 🏆\n\n";
  topReferrers.forEach((user, index) => {
    leaderboard += `${index + 1}. @${user.username || "Anonymous"} - ${
      user.referredUsers.length
    } referrals\n`;
  });

  bot.sendMessage(chatId, leaderboard);
});

// Add referral stats command
bot.onText(/\/referrals/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    const stats = `
📊 Your Referral Stats:

Total Referrals: ${user.referralStats.totalReferrals}
Pending Referrals: ${user.referralStats.pendingReferrals.length}
Completed Referrals: ${user.referralStats.completedReferrals.length}

Share your link to earn more spins!
https://t.me/${BOT_USERNAME}?start=${user.referralCode}
    `;

    bot.sendMessage(chatId, stats);
  } catch (error) {
    console.error("Error showing referrals:", error);
    bot.sendMessage(chatId, "⚠️ Error fetching referral stats");
  }
});

module.exports = bot;

const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");
const crypto = require("crypto-browserify");

// Environment variables
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || "@hackintown";
const BOT_USERNAME = process.env.BOT_USERNAME || "HackintownBot";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

bot.on("error", (error) => {
  console.error("Telegram Bot Error:", error.message);
});

const generateReferralCode = () => crypto.randomBytes(4).toString("hex");

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const referralCode = match ? match[1]?.replace(/[^\w-]/g, "") : null;

  try {
    let user = await User.findOne({ telegramId: chatId });
    if (!user) {
      user = new User({
        telegramId: chatId,
        username: msg.from.username || "",
        referralCode: generateReferralCode(),
        referredBy: referralCode
          ? (await User.findOne({ referralCode }))?.telegramId
          : null,
      });

      if (user.referredBy) {
        const referrer = await User.findOne({ telegramId: user.referredBy });
        if (referrer) {
          referrer.spins += 1;
          referrer.referredUsers.push(chatId);
          await referrer.save();
          bot.sendMessage(
            referrer.telegramId,
            "🎉 You got 1 free spin for inviting a friend!"
          );
        }
      }

      await user.save();
    }

    bot.sendMessage(
      chatId,
      `Welcome to Spin & Win! 🎰\nYour referral link: https://t.me/${BOT_USERNAME}?start=${user.referralCode}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎮 Start Playing", callback_data: "start_playing" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Error in /start:", error.message);
    bot.sendMessage(chatId, "⚠️ An error occurred. Please try again.");
  }
});

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
        if (user.totalEarnings >= 100) {
          bot.sendMessage(
            chatId,
            "Enter your UPI ID (format: upi <your-upi-id>)"
          );
        } else {
          bot.sendMessage(
            chatId,
            `You need ₹100 to withdraw. Current balance: ₹${user.totalEarnings}`
          );
        }
        break;
    }
  } catch (error) {
    console.error("Error in callback query:", error.message);
    bot.sendMessage(chatId, "⚠️ An error occurred. Please try again.");
  }
});

async function verifyMembership(chatId) {
  try {
    const res = await bot.getChatMember(CHANNEL_USERNAME, chatId);
    return (
      res.status === "member" ||
      res.status === "administrator" ||
      res.status === "creator"
    );
  } catch (err) {
    return false;
  }
}

const handleSpin = async (chatId, user) => {
  if (!user.channelJoined) {
    bot.sendMessage(chatId, "Please join our channel first!");
    return;
  }

  if (user.spins <= 0) {
    bot.sendMessage(
      chatId,
      `No spins left! 😢\nInvite friends to get more spins! 🎁\nYour referral link: https://t.me/HackintownBot?start=${user.referralCode}`
    );
    return;
  }

  const winAmount = calculateWinAmount(user.spins);
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

const calculateWinAmount = (remainingSpins) => {
  const rewardConfig = {
    3: { min: 30, max: 50 },
    2: { min: 20, max: 35 },
    1: { min: 10, max: 20 },
  };
  const config = rewardConfig[remainingSpins];
  return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
};

bot.onText(/^upi (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const upiId = match[1];
  const upiPattern = /^[\w.-]+@[\w.-]+$/;

  if (!upiPattern.test(upiId)) {
    bot.sendMessage(chatId, "⚠️ Invalid UPI ID. Please try again.");
    return;
  }

  const user = await User.findOne({ telegramId: chatId });
  if (user && user.totalEarnings >= 100) {
    user.withdrawalRequests.push({ amount: user.totalEarnings, upiId });
    user.totalEarnings = 0;
    await user.save();

    bot.sendMessage(
      chatId,
      "✅ Withdrawal request submitted!\nWe'll process it within 24 hours."
    );
  } else {
    bot.sendMessage(chatId, "You need at least ₹100 to withdraw.");
  }
});

module.exports = bot;

const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");
const crypto = require("crypto");

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

// Add error handling for the bot
bot.on("error", (error) => {
  console.error("Telegram Bot Error:", error.code, error.message);
});

// Generate unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString("hex");
};

bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const referralCode = match[1];

  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    const newReferralCode = generateReferralCode();
    user = new User({
      telegramId: chatId,
      username: msg.from.username,
      referralCode: newReferralCode,
    });

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer.telegramId;
        referrer.referredUsers.push(chatId);
        referrer.spins += 1;
        await referrer.save();
        bot.sendMessage(
          referrer.telegramId,
          "🎉 You got 1 free spin for inviting a friend!"
        );
      }
    }
    await user.save();
  }

  const welcomeMessage = `Welcome to Spin & Win! 🎰\nYour referral code: ${user.referralCode}`;
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 Start Playing", callback_data: "start_playing" }],
      ],
    },
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const user = await User.findOne({ telegramId: chatId });

  switch (data) {
    case "start_playing":
      if (!user.channelJoined) {
        bot.sendMessage(chatId, "Join our channel to get 3 free spins! 🎁", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "📢 Join Channel", url: "https://t.me/hackintown" }],
              [{ text: "✅ I've Joined", callback_data: "verify_membership" }],
            ],
          },
        });
      } else {
        showSpinMenu(chatId, user);
      }
      break;

    case "verify_membership":
      const isMember = await verifyMembership(chatId);
      if (isMember && !user.channelJoined) {
        user.channelJoined = true;
        user.spins = 3;
        await user.save();
        showSpinMenu(chatId, user);
      } else if (!isMember) {
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
});

async function verifyMembership(chatId) {
  try {
    const res = await bot.getChatMember("@hackintown", chatId);
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
      "No spins left! 😢\n\n" +
        "Invite friends to get more spins! 🎁\n" +
        `Share your referral code: ${user.referralCode}`
    );
    return;
  }

  const winAmount = calculateWinAmount(user.spins);
  user.spins -= 1;
  user.totalEarnings += winAmount;
  user.lastSpinTime = new Date();
  await user.save();

  bot.sendMessage(
    chatId,
    `🎉 You won ₹${winAmount}!\n\n` +
      `Spins left: ${user.spins}\n` +
      `Total earnings: ₹${user.totalEarnings}`,
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
  // Adjust win amounts based on remaining spins
  if (remainingSpins === 3) return Math.floor(Math.random() * 20) + 30; // 30-50
  if (remainingSpins === 2) return Math.floor(Math.random() * 15) + 20; // 20-35
  return Math.floor(Math.random() * 10) + 10; // 10-20
};

const showSpinMenu = (chatId, user) => {
  const keyboard = [[{ text: "🎰 Spin Now", callback_data: "spin" }]];

  if (user.totalEarnings >= 100) {
    keyboard.push([{ text: "💰 Withdraw", callback_data: "withdraw" }]);
  }

  bot.sendMessage(
    chatId,
    `🎮 Ready to play!\n\n` +
      `Spins available: ${user.spins}\n` +
      `Total earnings: ₹${user.totalEarnings}`,
    { reply_markup: { inline_keyboard: keyboard } }
  );
};

// Handle UPI ID submission
bot.onText(/^upi (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const upiId = match[1];
  const user = await User.findOne({ telegramId: chatId });

  if (user && user.totalEarnings >= 100) {
    user.withdrawalRequests.push({
      amount: user.totalEarnings,
      upiId: upiId,
    });
    user.totalEarnings = 0;
    await user.save();

    bot.sendMessage(
      chatId,
      "✅ Withdrawal request submitted!\n" + "We'll process it within 24 hours."
    );
  }
});

module.exports = bot;

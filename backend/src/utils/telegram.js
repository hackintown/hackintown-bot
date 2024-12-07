const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");
const crypto = require("crypto");

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });
const CHANNEL_USERNAME = "@hackintown";

// Helper function to verify channel membership
const verifyChannelMembership = async (telegramId) => {
  try {
    const member = await bot.getChatMember(CHANNEL_USERNAME, telegramId);
    return ["member", "administrator", "creator"].includes(member.status);
  } catch (error) {
    console.error("Channel membership check error:", error);
    return false;
  }
};

// Generate unique referral code
const generateReferralCode = () => crypto.randomBytes(3).toString("hex");

// Start command handler
bot.onText(/\/start(?:\s+(\w+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const referralCode = match ? match[1] : null;

  try {
    let user = await User.findOne({ telegramId: String(chatId) });

    if (!user) {
      const newReferralCode = await generateReferralCode();
      user = new User({
        telegramId: String(chatId),
        username: msg.from.username,
        referralCode: newReferralCode,
      });
      await user.save();

      // Handle referral if exists
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) {
          referrer.referralStats.referredUsers.push({
            userId: user.telegramId,
            username: user.username,
            joinedAt: new Date(),
          });
          await referrer.save();
        }
      }
    }

    // Check channel membership
    const isChannelMember = await verifyChannelMembership(chatId);
    if (isChannelMember !== user.channelJoined) {
      user.channelJoined = isChannelMember;
      if (isChannelMember && user.spins === 0) {
        user.spins = 3; // Give 3 free spins when joining channel
      }
      await user.save();
    }

    // Send welcome message
    const welcomeMessage = `Welcome to Spin and Win! 🎰\n\nJoin our channel and get 3 FREE spins! 🎁`;

    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Start Playing 🎮",
              web_app: {
                url: `${process.env.CLIENT_URL}?id=${user.telegramId}`,
              },
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Start command error:", error);
    await bot.sendMessage(chatId, "An error occurred. Please try again.");
  }
});

// Channel membership verification endpoint
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "verify_membership") {
    try {
      const user = await User.findOne({ telegramId: String(chatId) });
      const isChannelMember = await verifyChannelMembership(chatId);

      if (isChannelMember) {
        user.channelJoined = true;
        user.spins = 3;
        await user.save();

        await bot.editMessageText("✅ Channel joined! You got 3 FREE spins!", {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Continue to Game 🎮",
                  web_app: {
                    url: `${process.env.CLIENT_URL}?id=${user.telegramId}`,
                  },
                },
              ],
            ],
          },
        });
      } else {
        await bot.answerCallbackQuery(query.id, {
          text: "Please join the channel first!",
          show_alert: true,
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      await bot.answerCallbackQuery(query.id, {
        text: "An error occurred. Please try again.",
        show_alert: true,
      });
    }
  }
});

module.exports = bot;

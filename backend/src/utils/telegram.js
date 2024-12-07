const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = new User({ telegramId: chatId, username });
    await user.save();
  }

  bot.sendMessage(chatId, "Welcome to Spin and Win!", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Start Playing", callback_data: "start_playing" }],
      ],
    },
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === "start_playing") {
    bot.sendMessage(chatId, "Join our channel to get 3 free spins!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Join Channel", url: "https://t.me/hackintown" }],
          [{ text: "Continue", callback_data: "check_channel" }],
        ],
      },
    });
  } else if (data === "check_channel") {
    const isMember = await verifyMembership(chatId);
    if (isMember) {
      bot.sendMessage(chatId, "You are now eligible to play. Let's spin!", {
        reply_markup: {
          inline_keyboard: [[{ text: "Spin Now", callback_data: "spin" }]],
        },
      });
    } else {
      bot.sendMessage(chatId, "Please join the channel to continue.");
    }
  } else if (data === "spin") {
    const user = await User.findOne({ telegramId: chatId });
    if (user.spins > 0) {
      const spinResult = Math.floor(Math.random() * 30) + 10; // Random between 10-40
      user.spins -= 1;
      user.totalEarnings += spinResult;
      await user.save();

      bot.sendMessage(
        chatId,
        `You won ${spinResult} INR! Spins left: ${user.spins}`
      );
    } else {
      bot.sendMessage(
        chatId,
        "No spins left! Invite friends to earn more spins."
      );
    }
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

module.exports = bot;

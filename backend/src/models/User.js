const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String },
  referralCode: { type: String },
  referredBy: { type: String },
  referredUsers: { type: [String], default: [] },
  spins: { type: Number, default: 3 },
  totalEarnings: { type: Number, default: 0 },
  withdrawalRequests: [
    {
      amount: { type: Number, required: true },
      upiId: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  channelJoined: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);

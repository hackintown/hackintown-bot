const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String },
  referralCode: {
    type: String,
    unique: true,
    required: true,
  },
  channelJoined: { type: Boolean, default: false },
  lastChannelCheckTime: { type: Date },
  spins: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  referralStats: {
    totalReferrals: { type: Number, default: 0 },
    referredUsers: [
      {
        userId: String,
        username: String,
        joinedAt: Date,
        rewarded: { type: Boolean, default: false },
      },
    ],
  },
  withdrawalRequests: [
    {
      amount: Number,
      upiId: String,
      status: {
        type: String,
        enum: ["pending", "processed", "rejected"],
        default: "pending",
      },
      requestedAt: { type: Date, default: Date.now },
    },
  ],
  spinHistory: [
    {
      amount: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);

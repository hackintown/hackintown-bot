const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String },
  referralCode: {
    type: String,
    unique: true,
    required: true,
  },
  referredBy: {
    type: String,
    ref: "User",
  },
  referralStats: {
    totalReferrals: { type: Number, default: 0 },
    pendingReferrals: [
      {
        userId: String,
        joinedChannel: { type: Boolean, default: false },
        rewardClaimed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    completedReferrals: [
      {
        userId: String,
        joinedChannel: Boolean,
        rewardClaimed: Boolean,
        completedAt: Date,
      },
    ],
  },
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

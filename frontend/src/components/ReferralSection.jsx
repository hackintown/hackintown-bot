import React from "react";

const ReferralSection = ({ referralLink, totalEarnings, spinsLeft }) => {
  return (
    <div className="bg-purple-100 p-4 rounded-md mt-6">
      <h3 className="text-xl font-bold text-purple-700">
        Invite To Get More Spins
      </h3>
      <p className="mt-2">
        Earn spins by inviting your friends. Share your referral link:
      </p>
      <input
        type="text"
        value={referralLink}
        readOnly
        className="w-full mt-2 border p-2 rounded"
      />
      <button
        onClick={() => navigator.clipboard.writeText(referralLink)}
        className="bg-purple-500 text-white py-2 px-4 mt-4 rounded w-full"
      >
        Copy Referral Link
      </button>
      <div className="flex items-center justify-between mt-6">
        <p className="text-lg font-semibold text-gray-700">Total Earnings:</p>
        <p className="text-lg font-bold text-green-600">₹{totalEarnings}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-lg font-semibold text-gray-700">Spins Left:</p>
        <p className="text-lg font-bold text-red-600">{spinsLeft}</p>
      </div>
    </div>
  );
};

export default ReferralSection;

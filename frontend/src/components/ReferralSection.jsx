import React, { useState } from "react";

const ReferralSection = ({
  referralLink,
  totalEarnings,
  spinsLeft,
  referralStats,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-purple-100 p-4 rounded-md mt-6">
      <h3 className="text-xl font-bold text-purple-700">
        Invite To Get More Spins
      </h3>

      <div className="mt-4 bg-white p-3 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Your Referral Link:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 border p-2 rounded text-sm"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded ${
              copied ? "bg-green-500" : "bg-purple-500"
            } text-white text-sm transition-colors`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {referralStats && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Referrals</p>
            <p className="text-xl font-bold text-purple-600">
              {referralStats.totalReferrals}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">
              {referralStats.pendingReferrals.length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-xl font-bold text-green-600">
              {referralStats.completedReferrals.length}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold text-gray-700">Total Earnings:</p>
          <p className="text-lg font-bold text-green-600">₹{totalEarnings}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Spins Left:</p>
          <p className="text-lg font-bold text-purple-600">{spinsLeft}</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralSection;

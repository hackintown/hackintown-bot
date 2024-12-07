import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";

const SpinWheel = ({ spinsLeft, handleSpin, channelJoined }) => {
  const [spinning, setSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(null);
  const [showJoinPrompt, setShowJoinPrompt] = useState(!channelJoined);

  // Reward configuration for different spin counts
  const rewardRanges = {
    3: { min: 30, max: 50 },
    2: { min: 20, max: 35 },
    1: { min: 10, max: 20 },
  };

  const data = [
    { option: "₹50", style: { backgroundColor: "#FF4B4B" } },
    { option: "₹20", style: { backgroundColor: "#FF9933" } },
    { option: "₹30", style: { backgroundColor: "#FFD700" } },
    { option: "₹40", style: { backgroundColor: "#85FF85" } },
    { option: "₹25", style: { backgroundColor: "#58CCED" } },
  ];

  const handleSpinClick = () => {
    if (!channelJoined) {
      setShowJoinPrompt(true);
      return;
    }

    if (spinsLeft <= 0) return;

    setSpinning(true);
    const range = rewardRanges[spinsLeft] || rewardRanges[1];
    const reward =
      Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const randomIndex = Math.floor(Math.random() * data.length);
    setPrizeIndex(randomIndex);

    setTimeout(() => {
      handleSpin(reward);
      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center">
      {showJoinPrompt && !channelJoined ? (
        <div className="bg-yellow-100 p-4 rounded-lg mb-4">
          <p className="text-yellow-800">
            Please join our channel to start spinning!
          </p>
          <a
            href="https://t.me/hackintown"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2 inline-block"
          >
            Join Channel
          </a>
        </div>
      ) : (
        <>
          <div className="relative">
            <Wheel
              mustStartSpinning={spinning}
              prizeNumber={prizeIndex}
              data={data}
              onStopSpinning={() => setSpinning(false)}
            />
          </div>
          <button
            onClick={handleSpinClick}
            disabled={spinsLeft <= 0 || spinning}
            className={`bg-purple-600 text-white py-2 px-6 mt-4 rounded ${
              spinning || spinsLeft <= 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {spinning
              ? "Spinning..."
              : spinsLeft > 0
              ? "Spin Now"
              : "No Spins Left"}
          </button>
        </>
      )}
    </div>
  );
};

export default SpinWheel;

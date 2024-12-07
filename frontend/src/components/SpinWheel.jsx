import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";

const SpinWheel = ({ spinsLeft, handleSpin, channelJoined }) => {
  const [spinning, setSpinning] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(!channelJoined);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [verifying, setVerifying] = useState(false);

  // Add wheel data
  const data = [
    { option: "10" },
    { option: "20" },
    { option: "30" },
    { option: "40" },
    { option: "50" },
    { option: "25" },
    { option: "35" },
    { option: "45" },
  ];

  // Add continuous channel verification
  useEffect(() => {
    const verifyChannel = async () => {
      if (!channelJoined) {
        setVerifying(true);
        try {
          const tgWebApp = window.Telegram?.WebApp;
          const telegramId = tgWebApp?.initDataUnsafe?.user?.id?.toString();

          if (telegramId) {
            const response = await fetch(
              `${API_BASE_URL}/api/verify-channel/${telegramId}`
            );
            const data = await response.json();

            if (data.isChannelMember) {
              setShowJoinPrompt(false);
            }
          }
        } catch (error) {
          console.error("Channel verification error:", error);
        } finally {
          setVerifying(false);
        }
      }
    };

    const interval = setInterval(verifyChannel, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [channelJoined]);

  const handleSpinClick = () => {
    if (!channelJoined) {
      setShowJoinPrompt(true);
      return;
    }

    if (spinsLeft <= 0 || spinning) return;

    setSpinning(true);
    const newPrizeIndex = Math.floor(Math.random() * data.length);
    setPrizeIndex(newPrizeIndex);

    setTimeout(() => {
      const reward = parseInt(data[newPrizeIndex].option);
      handleSpin(reward);
      setSpinning(false);
    }, 4000);
  };

  if (showJoinPrompt) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">
          {verifying ? "Verifying..." : "Join our Channel to Start!"}
        </h2>
        <p className="mb-4">Get 3 FREE spins when you join our channel</p>
        <div className="space-y-4">
          <a
            href="https://t.me/hackintown"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-6 py-2 rounded-full inline-block hover:bg-blue-600"
          >
            Join Channel
          </a>
          {verifying && (
            <p className="text-sm text-gray-600">
              Checking membership status...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
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
    </div>
  );
};

export default SpinWheel;

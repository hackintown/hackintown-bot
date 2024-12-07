import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import SpinWheel from "./components/SpinWheel";
import ReferralSection from "./components/ReferralSection";
import ProgressBar from "./components/ProgressBar";
import API_BASE_URL from "./config/api";
import Loading from "./components/Loading";
const App = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelJoined, setChannelJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Get Telegram WebApp data
        const tgWebApp = window.Telegram?.WebApp;
        if (!tgWebApp) {
          setError("Please start from Telegram bot!");
          setLoading(false);
          return;
        }

        // Get user data from WebApp initData
        const initData = tgWebApp.initData;
        const initDataUnsafe = tgWebApp.initDataUnsafe;
        const telegramId = initDataUnsafe?.user?.id?.toString();

        if (!telegramId) {
          setError("Unable to get user data!");
          setLoading(false);
          return;
        }

        // Fetch user data
        const response = await fetch(`${API_BASE_URL}/api/user/${telegramId}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        setUser(userData);

        // Check channel membership
        const membershipResponse = await fetch(
          `${API_BASE_URL}/api/verify-channel/${telegramId}`
        );
        if (membershipResponse.ok) {
          const { isChannelMember } = await membershipResponse.json();
          setChannelJoined(isChannelMember);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSpin = async (reward) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user.telegramId, reward }),
      });
      if (!res.ok) throw new Error("Failed to update spin.");
      const updatedUser = await res.json();
      setUser(updatedUser);
    } catch (err) {
      console.error("Error updating spin:", err.message);
      setError("Unable to complete the spin. Please try again.");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-4">
        {error && <p className="text-red-500">{error}</p>}
        {user && (
          <>
            <SpinWheel
              spinsLeft={user.spins}
              handleSpin={handleSpin}
              channelJoined={channelJoined}
            />
            <ReferralSection
              referralLink={`https://t.me/HackintownBot?start=${user.referralCode}`}
              totalEarnings={user.totalEarnings}
              spinsLeft={user.spins}
            />
            <ProgressBar totalEarnings={user.totalEarnings} />
          </>
        )}
      </div>
    </div>
  );
};

export default App;

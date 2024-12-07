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
    const verifyChannelMembership = async (telegramId) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/verify-channel/${telegramId}`
        );
        const data = await res.json();
        setChannelJoined(data.isChannelMember);
      } catch (err) {
        console.error("Error verifying channel membership:", err);
      }
    };

    const telegramId = localStorage.getItem("telegramId");
    if (telegramId) {
      verifyChannelMembership(telegramId);
    }
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const telegramId =
      queryParams.get("telegramId") || localStorage.getItem("telegramId");

    if (telegramId) {
      localStorage.setItem("telegramId", telegramId); // Save for persistence
      fetchUserData(telegramId);
    } else {
      setError("Telegram ID not found!");
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (telegramId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${telegramId}`);
      if (!res.ok) throw new Error("Failed to fetch user data.");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

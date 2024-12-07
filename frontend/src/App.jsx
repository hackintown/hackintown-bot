import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import SpinWheel from "./components/SpinWheel";
import ReferralSection from "./components/ReferralSection";
import ProgressBar from "./components/ProgressBar";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get telegramId from localStorage or query parameter
    const queryParams = new URLSearchParams(window.location.search);
    const telegramId =
      queryParams.get("telegramId") || localStorage.getItem("telegramId");

    if (telegramId) {
      localStorage.setItem("telegramId", telegramId); // Save to localStorage for persistence

      fetch(`/api/user/${telegramId}`)
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch((err) => console.error("Error fetching user data:", err));
    } else {
      console.error("telegramId not found!");
    }
  }, []);

  const handleSpin = (reward) => {
    fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: user.telegramId, reward }),
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error updating spin:", err));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-4">
        {user && (
          <>
            <SpinWheel spinsLeft={user.spins} handleSpin={handleSpin} />
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

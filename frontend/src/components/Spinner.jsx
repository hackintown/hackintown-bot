import React, { useState } from "react";

const Spinner = () => {
  const [spinResult, setSpinResult] = useState(null);
  const [spinsLeft, setSpinsLeft] = useState(3);

  const handleSpin = () => {
    if (spinsLeft > 0) {
      const result = Math.floor(Math.random() * 30) + 10; // Random between 10-40
      setSpinResult(result);
      setSpinsLeft(spinsLeft - 1);
    } else {
      alert("No spins left! Invite friends for more spins.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Spin and Win!</h1>
      <div className="w-64 h-64 border-4 border-blue-500 rounded-full flex items-center justify-center">
        <button
          onClick={handleSpin}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Spin the Wheel
        </button>
      </div>
      {spinResult && <p className="mt-4 text-xl">You won {spinResult} INR!</p>}
      <p className="mt-2 text-gray-600">Spins Left: {spinsLeft}</p>
    </div>
  );
};

export default Spinner;

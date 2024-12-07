import React, { useState } from "react";
import { Wheel } from "react-custom-roulette";

const SpinWheel = ({ spinsLeft, handleSpin }) => {
  const [spinning, setSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(null);

  const data = [
    {
      option: "₹100",
      style: { backgroundColor: "#FF4B4B", textColor: "#FFF" },
    },
    {
      option: "Mini",
      style: { backgroundColor: "#FF9933", textColor: "#FFF" },
    },
    {
      option: "Mega",
      style: { backgroundColor: "#FFD700", textColor: "#FFF" },
    },
    {
      option: "Double",
      style: { backgroundColor: "#85FF85", textColor: "#FFF" },
    },
    { option: "₹50", style: { backgroundColor: "#58CCED", textColor: "#FFF" } },
  ];

  const spin = () => {
    if (spinsLeft <= 0) return;
    setSpinning(true);
    const randomIndex = Math.floor(Math.random() * data.length);
    setPrizeIndex(randomIndex);

    setTimeout(() => {
      handleSpin(data[randomIndex].option);
      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Wheel
          mustStartSpinning={spinning}
          prizeNumber={prizeIndex}
          data={data}
          backgroundColors={["#FF4B4B", "#FFD700", "#85FF85"]}
          textColors={["#FFF"]}
        />
      </div>
      <button
        onClick={spin}
        disabled={spinsLeft <= 0 || spinning}
        className={`bg-purple-600 text-white py-2 px-6 mt-4 rounded ${
          spinning ? "opacity-50" : ""
        }`}
      >
        {spinsLeft > 0 ? "Spin Now" : "No Spins Left"}
      </button>
    </div>
  );
};

export default SpinWheel;

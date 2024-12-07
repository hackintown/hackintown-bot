import React from "react";

const ProgressBar = ({ totalEarnings }) => {
  const progress = (totalEarnings / 100) * 100;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-700">
        Progress To Withdraw ₹100
      </h3>
      <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
        <div
          className="bg-green-500 h-4 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-gray-600 mt-2 text-sm">
        ₹{totalEarnings} earned. ₹{100 - totalEarnings} more to go!
      </p>
    </div>
  );
};

export default ProgressBar;

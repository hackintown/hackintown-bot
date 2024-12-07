import React from "react";

const StartPage = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Welcome to Spin and Win!</h1>
      <button
        onClick={onStart}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Start Playing
      </button>
    </div>
  );
};

export default StartPage;

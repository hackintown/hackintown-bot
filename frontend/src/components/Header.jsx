import React from "react";

const Header = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-purple-600 text-white">
      <h1 className="text-xl font-bold">🎉 FindoLucky</h1>
      <button className="bg-yellow-500 py-2 px-4 rounded">Cash Out</button>
    </div>
  );
};

export default Header;

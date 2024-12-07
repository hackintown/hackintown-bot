import React, { useState } from "react";
import StartPage from "./components/StartPage";
import Spinner from "./components/Spinner";

const App = () => {
  const [currentPage, setCurrentPage] = useState("start");

  const handleStart = () => setCurrentPage("spinner");

  return (
    <div>
      {currentPage === "start" && <StartPage onStart={handleStart} />}
      {currentPage === "spinner" && <Spinner />}
    </div>
  );
};

export default App;

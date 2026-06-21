import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import BrickBreakerGame from "../games/BrickBreakerGame";
import EnchantedBackground from "./Enchantedbackground";

const BrickBreaker = () => {

  console.log("BrickBreaker.js");
  const navigate = useNavigate();

useEffect(() => {
  const token = localStorage.getItem("token"); // Check if token exists in localStorage

  if (!token) {
    // If no token, redirect to the login page
    navigate("/login");
    return;
  }
}, [navigate]);


  return (
  <div className="page-home">
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Brick Breaker</h1>
        </div>

    <BrickBreakerGame />

   </div>
        <Footer />
    </div>
  );
};
export default BrickBreaker;

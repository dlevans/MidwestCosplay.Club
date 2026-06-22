import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import SnakeGame from "../games/SnakeGame";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const Snake = () => {

   console.log("Snake.js");
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
      <Helmet>
        <title data-rh="true">Snake Game</title>
        <meta name="description" content="Snake game for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Snake</h1>
        </div>

    <SnakeGame />

  </div>
        <Footer />
    </div>
  );
};
export default Snake;

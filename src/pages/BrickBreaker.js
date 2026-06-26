import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import BrickBreakerGame from "../games/BrickBreakerGame";
import EnchantedBackground from "./Enchantedbackground";

const BrickBreaker = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Brick Breaker — MidwestCosplay Club</title>
        <meta name="description" content="Brick Breaker game for MidwestCosplay Club members." />
      </Helmet>
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
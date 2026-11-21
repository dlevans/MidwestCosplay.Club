import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import SnakeGame from "../games/SnakeGame";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const Snake = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Snake — Midwest Cosplay Club</title>
        <meta name="description" content="Play Snake in your browser on Midwest Cosplay Club." />
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
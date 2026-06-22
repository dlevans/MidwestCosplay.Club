import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";


const Games = () => {
    console.log("Games.js");
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
        <title data-rh="true">MidwestCosplay Club Games</title>
        <meta name="description" content="Game landing page for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Games</h1>
        </div>
        
        <Link to={`/snake`}>Snake</Link>
        <br></br>
        <br></br>
        <br></br>
        <Link to={`/brickbreaker`}>Brick Breaker</Link>
      </div>
        <Footer />
    </div>
  );
};
export default Games;

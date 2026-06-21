import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

const Tutorials = () => 
  {
    console.log("Tutorials.js");
    const navigate = useNavigate();
    useEffect(() => 
      {
        const token = localStorage.getItem("token"); // Check if token exists in localStorage
    
        if (!token) 
          {
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
          <h1 className="home-headline"><h1>MidwestCosplay.Club Tutorials</h1></h1>
        </div>      
      <h2>Update your account!</h2>
      {
        <iframe width="560" height="315" src="https://www.youtube.com/embed/_Muq7eaBfNw?si=hPQiwXP-KbykP5j6" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      }
      <h2>Join the Discord!</h2>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/JoE3IWihJ7Y?si=A1MZztO0dDv97oMC" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      
      <Footer />
      </div>
    </div>
  );
}

export default Tutorials;

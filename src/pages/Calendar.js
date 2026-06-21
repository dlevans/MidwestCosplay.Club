import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

const Calendar = () => {
  console.log("Calendar.js");
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
          <h1 className="home-headline">MidwestCosplay.Club Public Calendar</h1>
          <p>To add your event to this public calendar invite MidwestCosplay.Club at gmail dot com!!</p>
        </div>      
      <iframe src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FChicago&showPrint=0&showTabs=0&showCalendars=0&src=bWlkd2VzdGNvc3BsYXkuY2x1YkBnbWFpbC5jb20&color=%23039BE5" 
      width="800" 
      height="600" 
      frameBorder="0" scrolling="no" title="MidwestCosplay.Club Event Calendar!">

      </iframe>
      </div>
        <Footer />
    </div>
  );
}

export default Calendar;
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const MOTD = () => {
  console.log("MessageOfTheDay.js");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Message Of The Day</title>
        <meta name="description" content="Message of the day." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">
            MCC's
            <span className="home-headline-accent">Message Of The Day</span>
          </h1>
          <br />
          <br />
          <br />
        </div>
        <div className="home-member-welcome">
          <p className="home-member-copy">
            <strong>Help me. Help you. </strong>
            Tell me what you'd like added or updated.
          </p>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default MOTD;
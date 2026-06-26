import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import AdSense from 'react-adsense';

function Footer() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const today = new Date();

  return (
    <div className="footer">
      <p>
        © {today.getFullYear()} MidwestCosplay.Club. All rights reserved.
        <br />
        All brands are registered trademarks of their respective brands and are not affiliated with MidwestCosplay.Club.
      </p>

      {/* Ad banner */}
      <AdSense.Google
        client="ca-pub-1147838882537189"
        slot="1442467878"
        style={{ display: 'block' }}
        format="auto"
        responsive="true"
      />
    </div>
  );
}

export default Footer;
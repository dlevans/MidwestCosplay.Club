import React from "react";
import { Link } from "react-router-dom";

// Ads come from AdSense Auto ads (the script in public/index.html), the same
// setup as dustinevans.net. There are no hand-placed ad units on the site.

function Footer() {
  const today = new Date();

  return (
    <div className="footer">
      <p>
        © {today.getFullYear()} MidwestCosplay.Club. All rights reserved.
        <br />
        All brands are registered trademarks of their respective brands and are not affiliated with MidwestCosplay.Club.
        <br />
        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
      </p>
    </div>
  );
}

export default Footer;

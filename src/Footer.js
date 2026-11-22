import React from "react";
import { Link, useLocation } from "react-router-dom";
import AdSense from 'react-adsense';

// AdSense only allows ads on pages with real content. Keep them off sign-in and
// account forms, admin and edit pages, games, user profiles, and the 404 page.
const AD_PAGES = [
  "/tutorials",
  "/templates",
  "/measurements",
  "/bodymeasurements",
  "/shapemeasurements",
  "/electricalmeasurements",
  "/calendar",
  "/events",
  "/groups",
  "/storemap",
];

function Footer() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "").toLowerCase();
  const showAd = AD_PAGES.includes(path);

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

      {/* Ad banner */}
      {showAd && (
        <AdSense.Google
          client="ca-pub-1147838882537189"
          slot="1442467878"
          style={{ display: 'block' }}
          format="auto"
          responsive="true"
        />
      )}
    </div>
  );
}

export default Footer;

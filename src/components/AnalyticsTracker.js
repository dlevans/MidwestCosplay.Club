import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // 1. Debugging line: Open your browser console (F12) to make sure this fires on every click!
    console.log("GA4 Tracking Route Change to:", currentPath);

    // 2. Explicitly send both the path and the full location to GA4
    ReactGA.send({ 
      hitType: 'pageview', 
      page_path: currentPath,
      page_location: window.location.href
    });
  }, [location]);

  return null;
};

export default AnalyticsTracker;
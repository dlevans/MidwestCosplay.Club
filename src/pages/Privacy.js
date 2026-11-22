import React from "react";
import { Helmet } from "react-helmet-async";
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

const EFFECTIVE_DATE = "November 21, 2026";

const ext = { target: "_blank", rel: "noopener noreferrer" };

function Privacy() {
  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Privacy Policy — Midwest Cosplay Club</title>
        <meta
          name="description"
          content="How Midwest Cosplay Club handles account information, cookies, analytics, and advertising."
        />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Privacy Policy ✦</h1>
        </div>

        <div className="privacy-content">
          <p className="privacy-date">Effective {EFFECTIVE_DATE}</p>

          <p>
            This policy explains what information MidwestCosplay.Club ("the Club", "we") collects, how it is
            used, and the choices you have.
          </p>

          <h2>Information you give us</h2>
          <ul>
            <li>
              <strong>Account details:</strong> when you join, we collect your first and last name, date of
              birth, username, and password.
            </li>
            <li>
              <strong>Profile details:</strong> anything you choose to add to your profile, such as a photo,
              location, bio, email address, phone number, and links to your social media or shops.{" "}
              <strong>Your public profile page shows what you add to it to anyone who visits.</strong> Only add
              what you're comfortable sharing.
            </li>
            <li>
              <strong>Community content:</strong> groups, events, tutorials, templates, store listings,
              scavenger hunt answers, and images you submit.
            </li>
          </ul>

          <h2>How we use it</h2>
          <ul>
            <li>To run your account and show your profile and submissions on the site.</li>
            <li>To keep the site secure and working.</li>
            <li>We do not sell, rent, or trade your personal information.</li>
          </ul>
          <p>
            Uploaded images are stored with Cloudinary, our image hosting provider. Your browser keeps a sign-in
            token in local storage so you stay logged in. Location features like the store map only use your
            location in your browser, when you allow it, to center the map near you. Your location isn't sent to
            us or saved.
          </p>

          <h2>Analytics</h2>
          <p>
            We use Google Analytics to understand how visitors use the site, such as which pages are popular.
            Google may set cookies and collect information like your approximate location, browser, device, and
            pages visited. We only see this as combined statistics. You can opt out with the{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" {...ext}>Google Analytics opt-out add-on</a>.
          </p>

          <h2>Advertising</h2>
          <ul>
            <li>
              This site shows ads through Google AdSense. Third-party vendors, including Google, use cookies to
              serve ads based on your previous visits to this website and other websites.
            </li>
            <li>
              Google's use of advertising cookies enables it and its partners to serve ads to you based on your
              visits to this site and/or other sites on the Internet. Learn{" "}
              <a href="https://policies.google.com/technologies/ads" {...ext}>how Google uses cookies in advertising</a>.
            </li>
            <li>
              You can opt out of personalized advertising in{" "}
              <a href="https://adssettings.google.com" {...ext}>Google's Ad Settings</a>, or opt out of many
              third-party vendors' cookies at{" "}
              <a href="https://www.aboutads.info/choices/" {...ext}>aboutads.info</a>.
            </li>
            <li>
              Google processes this data under its own{" "}
              <a href="https://policies.google.com/privacy" {...ext}>privacy policy</a>. See{" "}
              <a href="https://policies.google.com/technologies/partner-sites" {...ext}>
                how Google uses information from sites that use its services
              </a>
              .
            </li>
          </ul>

          <h2>Children</h2>
          <p>
            The Club is not directed at children under 13, and we do not knowingly collect personal information
            from children under 13. If you believe a child under 13 has created an account, contact us and we
            will remove it.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>You can edit or remove your profile details at any time from your profile settings.</li>
            <li>To delete your account and its data, contact us and we'll take care of it.</li>
            <li>You can block or delete cookies in your browser settings.</li>
          </ul>

          <h2>Changes</h2>
          <p>If this policy changes, we'll update this page and the date above.</p>

          <h2>Contact</h2>
          <p>
            Questions or requests? Email MidwestCosplay.Club at gmail dot com, or reach us on{" "}
            <a href="https://discord.gg/7BH7Hthuz6" {...ext}>Discord</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Privacy;

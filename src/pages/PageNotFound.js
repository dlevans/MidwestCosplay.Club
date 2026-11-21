import React from "react";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import * as errorImage from "../images/badlink.jpg"

const PageNotFound = () => {
  return (
  <div className="page">
      <Helmet>
        <title data-rh="true">Page Not Found — Midwest Cosplay Club</title>
        <meta name="description" content="The page you were looking for could not be found." />
        <meta name="robots" content="noindex" />
      </Helmet>
    <br />
    <br />
    <br />
    <br />
  <center><img alt="error" src={errorImage} ></img></center>
  <br />
  <br />
  <center><h1>The page you have requested was not found.</h1></center>
  <Footer />
  </div> );
};
export default PageNotFound;

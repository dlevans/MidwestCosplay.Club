import React from "react";
import Footer from "../Footer";
import * as errorImage from "../images/badlink.jpg"

const PageNotFound = () => {
  return (
  <div className="page">
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

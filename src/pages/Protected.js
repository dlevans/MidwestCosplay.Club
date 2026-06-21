import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Footer from "../Footer";

const Protected = () => {
  console.log("Protected.js");

  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token"); // Check if token exists in localStorage

    if (!token) {
      // If no token, redirect to the login page
      navigate("/login");
      return;
    }

    // If token exists, fetch protected data from backend
    axios.get(apiUrl + "/protected", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setData(response.data); // Set the protected data
      })
      .catch((err) => {
        console.error(err);
        navigate("/login"); // If token is invalid or expired, redirect to login
      });
  }, [navigate]);

  if (!data) {
    return <div>Loading...</div>; // Loading state while waiting for data
  }

  return (
    <div className="page">
      <h1>Protected Page</h1>
      <p>{data.message}</p>
      <Footer />
    </div>
  );
};

export default Protected;

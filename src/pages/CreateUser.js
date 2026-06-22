import axios from "axios";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const CreateUser = () => {
  console.log("CreateUser.js");
  const [user, setUser] = useState({
    firstname: "",
    lastname: "",
    birthdate: "",
    username: "",
    password: "",
    confirmPassword: "",
    image: null,
  });

  const [error, setError] = useState("");
  const [crop, setCrop] = useState({
    unit: "px",
    width: 100,
    height: 100,
    x: 20,
    y: 20,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [previewSize, setPreviewSize] = useState(null);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "birthdate") {
      const birthdateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      if (!birthdateRegex.test(value)) {
        setError("Birthdate must be in YYYY-MM-DD format.");
      } else if (age < 18) {
        setError("You must be at least 18 years old to register.");
      } else {
        setError(""); // Clear error if valid
      }
    }

    // Update state regardless of validation to allow typing
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setShowCrop(true);
        setCrop({ unit: "px", width: 100, height: 100, aspect: 1 });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*()\-=+_%])[A-Za-z\d!@#$%^&*()\-=+_%]{8,}$/;
    return passwordRegex.test(password);
  };

  const onCropChange = (newCrop) => {
    if (newCrop.width > 0 && newCrop.height > 0) {
      setCrop(newCrop);
    }
  };

  const onCropComplete = useCallback((crop) => {
    if (crop.width > 0 && crop.height > 0) {
      setCompletedCrop(crop);
    } else {
      console.error("Invalid crop dimensions:", crop);
    }
  }, []);

  useEffect(() => {
    const getCroppedImage = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas reference is null");
        return;
      }

      const image = imageRef.current;
      if (!image) {
        console.error("Image reference is null");
        return;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context");
        return;
      }

      canvas.width = 1000;
      canvas.height = 1000;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        1000,
        1000
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Could not create blob from canvas");
          return;
        }
        const croppedImageURL = URL.createObjectURL(blob);
        setCroppedImageUrl(croppedImageURL);
        setUser((prev) => ({ ...prev, image: blob }));

        setPreviewSize({
          width: 200,
          height: 200,
        });
      }, "image/jpeg");
    };

    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      getCroppedImage();
    }
  }, [completedCrop]);



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(user.password)) {
      setError("Password must be at least 8 characters long, contain at least one number, and one special character (?=.*[!@#$%^&*()\-=+_%]).");
      return;
    }

    if (user.password !== user.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const formData = new FormData();
    formData.append("firstname", user.firstname);
    formData.append("lastname", user.lastname);
    formData.append("birthdate", user.birthdate);
    formData.append("username", user.username);
    formData.append("password", user.password);
    if (user.image) {
      formData.append("image", user.image, "cropped-image.jpg");
    }

    try {
      const response = await axios.post(apiUrl + "/createnew", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("User created successfully!");
      const newUserID = response.data.userId;

      const loginResponse = await axios.post(apiUrl + "/login", {
        username: user.username,
        password: user.password,
      });

      const {token} = loginResponse.data;

      localStorage.setItem("token", token);

      navigate(`/update/${newUserID}`);
    } catch (err) {
      console.error("API Error:", err);
      if (err.response) {
        if (err.response.status === 409) {
          setError("Username already exists!");
        } else if (err.response.status === 400) {
          setError(err.response.data.message);
        } else {
          setError("Something went wrong!");
        }
      } else {
        setError("Network error or server unreachable.");
      }
    }
  };

  const handleRecrop = () => {
    setShowCrop(true);
    setCroppedImageUrl(null);
  };

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Create new</title>
        <meta name="description" content="Page to create new MidwestCosplay Club members." />
      </Helmet>      
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Add New User</h1>
        </div>
      <form className="form-group" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter First Name"
          name="firstname"
          value={user.firstname}
          onChange={handleChange}
        />
        <input
          type="text"
          placeholder="Enter Last Name"
          name="lastname"
          value={user.lastname}
          onChange={handleChange}
        />
        <input
          type="text"
          placeholder="Enter Birthdate YYYY-MM-DD"
          name="birthdate"
          value={user.birthdate}
          onChange={handleChange}
        />
        <input
          type="text"
          placeholder="Enter Username"
          name="username"
          value={user.username}
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Enter Password"
          name="password"
          value={user.password}
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          name="confirmPassword"
          value={user.confirmPassword}
          onChange={handleChange}
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />

        {imageSrc && showCrop && (
          <div className="crop-popup">
            <div className="popup-overlay" onClick={() => setShowCrop(false)} />
            <div className="crop-container">
              <ReactCrop
                src={imageSrc}
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropComplete}
                aspect={1}
              >
                <img
                  className="cropimg"
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                  }}
                />
              </ReactCrop>
              <button className="accept-button" onClick={() => setShowCrop(false)}>Accept Crop</button>
            </div>
          </div>
        )}

        {croppedImageUrl && previewSize && (
          <div>
            <h3>Thumbnail Preview:</h3>
            <img
              className="cropimg"
              src={croppedImageUrl}
              alt="Cropped Preview"
              style={{
                width: `${previewSize.width}px`,
                height: `${previewSize.height}px`,
                borderRadius: "10px",
              }}
            />
            <br></br>
            <button type="button" onClick={handleRecrop}>Re-crop</button>
          </div>
        )}
        <br></br>
        <button type="submit">Add</button>
      </form>      
      {error && <p style={{ color: "red" }}>{error}</p>}

      <canvas ref={canvasRef} style={{ display: "none" }} />
      <Footer />
    </div>
    </div>
  );
};

export default CreateUser;
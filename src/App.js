import React, { useEffect } from "react"; 
import { Route, Routes, useNavigate } from "react-router-dom"; 
import Nav from "./Nav";
import ErrorBoundary from "./ErrorBoundary";
import CreateUser from "./pages/CreateUser";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Public from "./pages/Public";
import Search from "./pages/Search";
import Update from "./pages/Update";
import Users from "./pages/Users";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import ManageGroup from "./pages/ManageGroup";
import ManageEvent from "./pages/ManageEvent";
import PublicGroup from "./pages/PublicGroup";
import PublicEvent from "./pages/PublicEvent";
import Calendar from "./pages/Calendar";
import Protected from "./pages/Protected";
import Tutorials from "./pages/Tutorials"
import MOTD from "./pages/MessageOfTheDay";
import Games from "./pages/Games"
import Snake from "./pages/Snake"
import BrickBreaker from "./pages/BrickBreaker";
import MemoryGame from "./games/MemoryGame";
import ForgotPassword from "./pages/ForgotPassword"
import PasswordReset from "./pages/PasswordReset";
import PageNotFound from "./pages/PageNotFound";
import MeasurementsIndex from "./pages/MeasurementsIndex";
import BodyMeasurements from "./pages/BodyMeasurements";
import ShapeMeasurements from "./pages/ShapeMeasurements";
import ElectricalMeasurements from "./pages/ElectricalMeasurements";
import AnalyticsTracker from './components/AnalyticsTracker';
import AddTutorial from "./pages/Addtutorial";
import AddTemplate from "./pages/Addtemplate";
import Templates from "./pages/Template";
import Admin from "./pages/Admin";
import StoreMap  from "./components/StoreMap";
import AddStore  from "./components/AddStore";
import HackingGame from "./games/HackingGame";
import SigilStrike from "./games/SigilStrike";



function App() {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // not logged in, nothing to check

      try {
        const res = await fetch(`${apiUrl}/login/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          // Token is expired or invalid — clear it out
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          navigate("/login");
        }
      } catch {
        // Network error — optionally handle, but don't log them out
        // in case of a blip. Remove this catch block if you'd rather
        // be aggressive and log out on any failure.
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="main">
      <Nav />
      <ErrorBoundary>
        {/* The tracker must live inside the BrowserRouter context */}
      <AnalyticsTracker />
        <Routes>          
          <Route path="/createuser" element={<CreateUser />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<PasswordReset />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/games" element={<Games />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/brickbreaker" element={<BrickBreaker />} />
          <Route path="/memory" element={<MemoryGame />} />
          <Route path="/hackinggame" element = {<HackingGame />} />
          <Route path="/sigilstrike" element = {<SigilStrike />} />
          <Route path="/protected" element={<Protected />} />
          <Route path="/motd" element={<MOTD />} />
          <Route path="/public/event/:eventid" element={<PublicEvent />} />
          <Route path="/public/group/:groupid" element={<PublicGroup />} />
          <Route path="/public/:username" element={<Public />} />
          <Route path="/search" element={<Search />} />
          <Route path="/update/:id" element={<Update />} />
          <Route path="/users" element={<Users />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/events" element={<Events />} />          
          <Route path="/storemap"         element={<StoreMap />} />
          <Route path="/addstore"         element={<AddStore />} />
          <Route path="/addstore/:storeid" element={<AddStore />} />
          <Route path="/managegroup" element={<ManageGroup />} />
          <Route path="/managegroup/:groupid" element={<ManageGroup />} />
          <Route path="/manageevent" element={<ManageEvent />} />
          <Route path="/manageevent/:eventid" element={<ManageEvent />} />
          <Route path="/measurements" element={<MeasurementsIndex />} />
          <Route path="/bodymeasurements" element={<BodyMeasurements />} />
          <Route path="/shapemeasurements" element={<ShapeMeasurements />} />
          <Route path="/electricalmeasurements" element={<ElectricalMeasurements />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/addtutorial" element={<AddTutorial />} />
          <Route path="/addtutorial/:tutorialid" element={<AddTutorial />} />
          <Route path="/templates"              element={<Templates />} />
          <Route path="/addtemplate"            element={<AddTemplate />} />
          <Route path="/addtemplate/:templateid" element={<AddTemplate />} />
          <Route path="/admin"            element={<Admin />} />
          <Route path="/" element={<Home />} />
          <Route path="/*" element={<PageNotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
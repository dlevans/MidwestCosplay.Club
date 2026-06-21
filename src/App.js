import React from "react";
import { Route, Routes } from "react-router-dom";
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
import ManageGroup from "./pages/ManageGroup";
import PublicGroup from "./pages/PublicGroup";
import Calendar from "./pages/Calendar";
import Protected from "./pages/Protected";
import Tutorials from "./pages/Tutorials"
import MOTD from "./pages/MessageOfTheDay";
import Games from "./pages/Games"
import Snake from "./pages/Snake"
import BrickBreaker from "./pages/BrickBreaker";
import ForgotPassword from "./pages/ForgotPassword"
import PasswordReset from "./pages/PasswordReset";
import PageNotFound from "./pages/PageNotFound";
import MeasurementsIndex from "./pages/MeasurementsIndex";
import BodyMeasurements from "./pages/BodyMeasurements";
import ShapeMeasurements from "./pages/ShapeMeasurements";
import ElectricalMeasurements from "./pages/ElectricalMeasurements";


function App() {

  return (
    <div className="main">
      <Nav />
      <ErrorBoundary>
        <Routes>          
          <Route path="/createuser" element={<CreateUser />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<PasswordReset />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/games" element={<Games />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/brickbreaker" element={<BrickBreaker />} />
          <Route path="/protected" element={<Protected />} />
          <Route path="/motd" element={<MOTD />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/public/:username" element={<Public />} />
          <Route path="/search" element={<Search />} />
          <Route path="/update/:id" element={<Update />} />
          <Route path="/users" element={<Users />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/managegroup" element={<ManageGroup />} />
          <Route path="/managegroup/:groupid" element={<ManageGroup />} />
          <Route path="/public/group/:groupid" element={<PublicGroup />} />
          <Route path="/measurements" element={<MeasurementsIndex />} />
          <Route path="/bodymeasurements" element={<BodyMeasurements />} />
          <Route path="/shapemeasurements" element={<ShapeMeasurements />} />
          <Route path="/electricalmeasurements" element={<ElectricalMeasurements />} />
          <Route path="/" element={<Home />} />
          <Route path="/*" element={<PageNotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
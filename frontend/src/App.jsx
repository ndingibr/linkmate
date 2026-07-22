import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Main from "./Main";
import ContactPage from "./ContactPage";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import Profile from "./Profile";
import Intentions from "./Intentions";
import Messages from "./Messages";
import Matches from "./Matches";
import ForgotPassword from "./ForgotPassword";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("linkmate_auth_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate("/matches");
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/intentions" element={<Intentions />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}
// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Main from "./Main";
import ContactPage from "./ContactPage";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import Profile from "./Profile";
import Messages from "./Messages";
import Matches from "./Matches";
import ForgotPassword from "./ForgotPassword";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}
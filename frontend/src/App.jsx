// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Main from "./Main";
import ContactPage from "./ContactPage";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Messages from "./Messages";
import ForgotPassword from "./ForgotPassword";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}
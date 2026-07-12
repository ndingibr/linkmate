// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Main from "./Main";
import SearchPage from "./Search";
import Quote from "./Quote";
import Pay from "./Pay";
import Contact from "./Contact";
import EarningsPage from "./EarningsPage"; 
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import EarningsPredictor from "./EarningsPredictor";

import { CartProvider } from "./CartContext";
import QuoteCartIcon from "./components/QuoteCartIcon";

export default function App() {
  return (
    <CartProvider>
      {/* Global Cart Icon */}
      <QuoteCartIcon />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/earnings" element={<EarningsPage />} /> 
        <Route path="/earnings-predictor" element={<EarningsPredictor />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/pay/:quoteNumber" element={<Pay />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </CartProvider>
  );
}
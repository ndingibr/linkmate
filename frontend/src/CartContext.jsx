import React, { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(
        i => i.name === item.name && i.log_id === item.log_id
      );

      // Same item + same log_id → increase quantity
      if (existing) {
        return prev.map(i =>
          i.name === item.name && i.log_id === item.log_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      // New line item (different log_id allowed)
      return [
        ...prev,
        {
          ...item,
          quantity: item.quantity || 1,
          log_id: item.log_id // ✅ item-level log_id
        }
      ];
    });
  };

  const removeFromCart = (name, log_id) => {
    setCartItems(prev =>
      prev.filter(i => !(i.name === name && i.log_id === log_id))
    );
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

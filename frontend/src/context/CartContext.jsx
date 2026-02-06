import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const { data } = await cartAPI.get();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }
    try {
      const { data } = await cartAPI.addItem(productId, quantity);
      setItems(data.items || []);
      toast.success('Added to cart');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add to cart');
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const { data } = await cartAPI.updateQuantity(productId, quantity);
      setItems(data.items || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await cartAPI.removeItem(productId);
      setItems(data.items || []);
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading, addToCart, updateQuantity,
      removeFromCart, clearCart, fetchCart, itemCount, total
    }}>
      {children}
    </CartContext.Provider>
  );
};

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();
const WISHLIST_STORAGE_KEY = 'industrial-monitor-wishlist';

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  // Initialize wishlist from localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      return [];
    }
  });

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }, [wishlist]);

  const addToWishlist = (variable) => {
    setWishlist((prev) => {
      // Check if already in wishlist
      if (prev.find((item) => item.id === variable.id)) {
        return prev;
      }
      return [...prev, variable];
    });
  };

  const removeFromWishlist = (variableId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== variableId));
  };

  const isInWishlist = (variableId) => {
    return wishlist.some((item) => item.id === variableId);
  };

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

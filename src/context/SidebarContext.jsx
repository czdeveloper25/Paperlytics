import React, { createContext, useContext, useState, useEffect } from 'react';

// Create Sidebar Context
const SidebarContext = createContext();

// Custom hook to use sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

// Sidebar Provider Component
export const SidebarProvider = ({ children }) => {
  // Sidebar open state - default based on screen size
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      // Default: open on desktop (>= 1024px), closed on mobile/tablet
      return window.innerWidth >= 1024;
    }
    return true; // Default to open for SSR
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Close sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Open sidebar
  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  // Handle window resize - auto-close on mobile, auto-open on desktop
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Auto-close on mobile/tablet (< 1024px)
      if (width < 1024) {
        setIsSidebarOpen(false);
      } else {
        // Auto-open on desktop (>= 1024px)
        setIsSidebarOpen(true);
      }
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

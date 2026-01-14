import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WishlistProvider } from './context/WishlistContext';
import { SCTProvider } from './context/SCTContext';
import { ThemeProvider } from './context/ThemeContext';
import { VariableRefreshProvider } from './context/VariableRefreshContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Login from './components/Login';
import GlobalHeader from './components/GlobalHeader';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout wrapper for authenticated pages
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="flex bg-white dark:bg-black min-h-screen dashboard-fade-in">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <GlobalHeader />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <WishlistProvider>
          <SCTProvider>
            <VariableRefreshProvider>
              <Routes>
                {/* Login Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AuthenticatedLayout>
                        <Dashboard />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/:variableId"
                  element={
                    <ProtectedRoute>
                      <AuthenticatedLayout>
                        <Analytics />
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </VariableRefreshProvider>
          </SCTProvider>
        </WishlistProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

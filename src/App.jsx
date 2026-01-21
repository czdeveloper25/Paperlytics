import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WishlistProvider } from './context/WishlistContext';
import { SCTProvider } from './context/SCTContext';
import { ThemeProvider } from './context/ThemeContext';
import { VariableRefreshProvider } from './context/VariableRefreshContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import GlobalHeader from './components/GlobalHeader';

// Lazy load Analytics page (contains heavy Recharts library)
const Analytics = lazy(() => import('./components/Analytics'));

// Loading fallback for lazy-loaded components
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-success-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

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
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="flex bg-white dark:bg-black min-h-screen dashboard-fade-in">
      <Sidebar />
      {/* Dynamic margin based on sidebar state and screen size */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
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
      <SidebarProvider>
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
                          <Suspense fallback={<PageLoader />}>
                            <Analytics />
                          </Suspense>
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
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;

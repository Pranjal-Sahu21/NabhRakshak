import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

const MotionDiv = motion.div as React.FC<any>;

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components (always needed — not lazy)
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingScreen from './components/Common/LoadingScreen';

// Auth Components (small — keep eager)
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Pages — lazy loaded for code splitting (heavy bundles only load when navigated to)
const CombinedDashboard = lazy(() => import('./pages/CombinedDashboard'));
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const Visualization3D   = lazy(() => import('./pages/Visualization3D'));
const Rockets           = lazy(() => import('./pages/Rockets'));
const Satellites        = lazy(() => import('./pages/Satellites'));
const Alerts            = lazy(() => import('./pages/Alerts'));
const Simulation        = lazy(() => import('./pages/Simulation'));
const Reports           = lazy(() => import('./pages/Reports'));
const Settings          = lazy(() => import('./pages/Settings'));
const SpaceWeather      = lazy(() => import('./pages/SpaceWeather'));
const Architecture      = lazy(() => import('./pages/Architecture'));

// Main App Layout Component
const AppLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      x: -20,
    },
    in: {
      opacity: 1,
      x: 0,
    },
    out: {
      opacity: 0,
      x: 20,
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-black">
        {/* Navbar */}
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-black pt-[73px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <MotionDiv
                key={location.pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="h-full bg-black"
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full bg-black">
                    <div className="animate-spin rounded-full h-8 w-8 border-b border-gray-400" />
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<CombinedDashboard />} />
                    <Route path="/3d-visualization" element={<Visualization3D />} />
                    <Route path="/rockets" element={<Rockets />} />
                    <Route path="/satellites" element={<Satellites />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/simulation" element={<Simulation />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/space-weather" element={<SpaceWeather />} />
                    <Route path="/architecture" element={<Architecture />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </MotionDiv>
            </AnimatePresence>
          </div>

          {/* Space Operations Footer */}
          <footer className="border-t border-white/[0.08] bg-[#0c0c0f] shadow-[0_-8px_30px_rgba(0,0,0,0.7)] py-5 px-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
            <div className="w-full sm:w-1/3 flex justify-center sm:justify-start items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="tracking-wide text-gray-400">All systems operational</span>
            </div>
            <div className="w-full sm:w-1/3 text-center text-gray-300 font-normal">
              &copy; {new Date().getFullYear()} NabhRakshak. All rights reserved.
            </div>
            <div className="hidden sm:block w-full sm:w-1/3" />
          </footer>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [showLoader, setShowLoader] = React.useState(true);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-black relative">
          {/* Main content */}
          <div className="w-full min-h-screen">
            <Routes>
              {/* Main Application Routes */}
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </div>

          <AnimatePresence>
            {showLoader && (
              <LoadingScreen
                key="app-loader"
                onComplete={() => setShowLoader(false)}
              />
            )}
          </AnimatePresence>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#ffffff',
                border: '1px solid #00ffff',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#00ffff',
                  secondary: '#1a1a2e',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff6b6b',
                  secondary: '#1a1a2e',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
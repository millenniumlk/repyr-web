import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Auth from './pages/Auth';
import Home from './pages/Home';
import Garage from './pages/Garage';
import History from './pages/History';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
import AddVehicle from './pages/AddVehicle';
import Notifications from './pages/Notifications';
import GuestIntake from './pages/GuestIntake';
import Subscription from './pages/Subscription';
import CompleteVehicleProfile from './pages/CompleteVehicleProfile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Support from './pages/Support';
import AuthCallback from './pages/AuthCallback';

// Initialize GA
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
    }
  }, [location]);

  return null;
};

/** Root layout that wraps the entire app with context providers */
const RootLayout = () => (
  <AuthProvider>
    <ToastProvider>
      <AnalyticsTracker />
      <Outlet />
    </ToastProvider>
  </AuthProvider>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isGuest, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!session && !isGuest) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/auth',
        element: <Auth />,
      },
      {
        path: '/auth/callback',
        element: <AuthCallback />,
      },
      {
        path: '/guest-intake',
        element: <GuestIntake />,
      },
      {
        path: '/terms',
        element: <Terms />,
      },
      {
        path: '/privacy',
        element: <Privacy />,
      },
      {
        path: '/support',
        element: <Support />,
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Home /> },
          { path: 'garage', element: <Garage /> },
          { path: 'garage/add', element: <AddVehicle /> },
          { path: 'history', element: <History /> },
          { path: 'notifications', element: <Notifications /> },
          { path: 'settings', element: <Settings /> },
          { path: 'settings/profile', element: <EditProfile /> },
          { path: 'settings/subscription', element: <Subscription /> },
          { path: 'complete-profile', element: <CompleteVehicleProfile /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

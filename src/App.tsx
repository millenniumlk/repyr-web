import React, { useEffect, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import { Loader2 } from 'lucide-react';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
const Auth = React.lazy(() => import('./pages/Auth'));
const Home = React.lazy(() => import('./pages/Home'));
const Garage = React.lazy(() => import('./pages/Garage'));
const History = React.lazy(() => import('./pages/History'));
const Settings = React.lazy(() => import('./pages/Settings'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const AddVehicle = React.lazy(() => import('./pages/AddVehicle'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Subscription = React.lazy(() => import('./pages/Subscription'));
const CompleteVehicleProfile = React.lazy(() => import('./pages/CompleteVehicleProfile'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Support = React.lazy(() => import('./pages/Support'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const OBDHub = React.lazy(() => import('./pages/OBDHub'));
const OBDDirectory = React.lazy(() => import('./pages/OBDDirectory'));
const OBDDetail = React.lazy(() => import('./pages/OBDDetail'));
const AllMakes = React.lazy(() => import('./pages/AllMakes'));
const BrandCatalog = React.lazy(() => import('./pages/BrandCatalog'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
import { HelmetProvider } from 'react-helmet-async';

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

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

/** Root layout that wraps the entire app with context providers */
const RootLayout = () => (
  <HelmetProvider>
    <AuthProvider>
      <ToastProvider>
        <AnalyticsTracker />
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  </HelmetProvider>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isGuest, setGuestMode, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !session && !isGuest) {
      setGuestMode(true);
    }
  }, [isLoading, session, isGuest, setGuestMode]);

  if (isLoading || (!session && !isGuest)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      { path: '/cars', element: <AllMakes /> },
      { path: '/cars/:make', element: <BrandCatalog /> },
      { path: '/cars/:make/:model', element: <BrandCatalog /> },
      { path: '/cars/:make/:model/:year', element: <BrandCatalog /> },
      {
        path: '/obd',
        element: <OBDHub />,
      },
      {
        path: '/obd/category/:category',
        element: <OBDDirectory />,
      },
      {
        path: '/obd/make/:make',
        element: <OBDDirectory />,
      },
      {
        path: '/obd/:code',
        element: <OBDDetail />,
      },
      {
        path: '/obd/:code/:make',
        element: <OBDDetail />,
      },
      {
        path: '/obd/:code/:make',
        element: <OBDDetail />,
      },
      {
        path: '/auth',
        element: <Auth />,
      },
      {
        path: '/auth/callback',
        element: <AuthCallback />,
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
        path: '/diagnose',
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

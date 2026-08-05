import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/guest-intake" element={<GuestIntake />} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="garage" element={<Garage />} />
        <Route path="garage/add" element={<AddVehicle />} />
        <Route path="history" element={<History />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/profile" element={<EditProfile />} />
        <Route path="settings/subscription" element={<Subscription />} />
        <Route path="complete-profile" element={<CompleteVehicleProfile />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

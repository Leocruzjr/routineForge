import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import Navbar from '@/components/layout/Navbar';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import BetaBanner from '@/components/feedback/BetaBanner';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import RoutineListPage from '@/features/routines/RoutineListPage';
import RoutineEditorPage from '@/features/routines/RoutineEditorPage';
import RoutineRunnerPage from '@/features/routines/RoutineRunnerPage';
import ProgressPage from '@/features/progress/ProgressPage';
import SettingsPage from '@/features/settings/SettingsPage';
import ResourcesPage from '@/features/resources/ResourcesPage';
import OnboardingPage from '@/features/onboarding/OnboardingPage';
import LevelUpTest from '@/features/settings/LevelUpTest';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuthStore();
  const { hasSeenTour } = useOnboardingStore();

  if (isLoading) return <LoadingSpinner />;

  if (!user && !hasSeenTour) {
    return <Navigate to="/welcome" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function WelcomeRoute({ children }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSpinner />;
  // If user is already logged in, send them home instead of showing tour again
  if (user) return <Navigate to="/" replace />;

  return children;
}

function GuestRoute({ children }) {
  const { user, isGuest, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSpinner />;
  if (user && !isGuest) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  const { checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const hideNavbar = ['/welcome', '/login', '/register'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <InstallPrompt />}
      {!hideNavbar && <BetaBanner />}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/welcome" element={
            <WelcomeRoute><OnboardingPage /></WelcomeRoute>
          } />

          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/routines" element={<ProtectedRoute><RoutineListPage /></ProtectedRoute>} />
          <Route path="/routines/new" element={<ProtectedRoute><RoutineEditorPage /></ProtectedRoute>} />
          <Route path="/routines/:id/edit" element={<ProtectedRoute><RoutineEditorPage /></ProtectedRoute>} />
          <Route path="/routines/:id/run" element={<ProtectedRoute><RoutineRunnerPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/test/levelup" element={<ProtectedRoute><LevelUpTest /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

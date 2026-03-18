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
import BadgesPage from '@/features/gamification/BadgesPage';
import RewardsShopPage from '@/features/gamification/RewardsShopPage';
import ProgressPage from '@/features/progress/ProgressPage';
import SettingsPage from '@/features/settings/SettingsPage';
import OnboardingPage from '@/features/onboarding/OnboardingPage';

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

  // First-time user who hasn't seen the tour
  if (!user && !hasSeenTour) {
    return <Navigate to="/welcome" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { user, isGuest, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSpinner />;
  // Allow guest users through to register/login so they can create a real account
  if (user && !isGuest) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  const { checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Hide navbar on onboarding and auth pages
  const hideNavbar = ['/welcome', '/login', '/register'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <InstallPrompt />}
      {!hideNavbar && <BetaBanner />}
      <AnimatePresence mode="wait">
        <Routes>
          {/* Onboarding */}
          <Route path="/welcome" element={<OnboardingPage />} />

          {/* Auth */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          {/* Protected pages */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/routines" element={<ProtectedRoute><RoutineListPage /></ProtectedRoute>} />
          <Route path="/routines/new" element={<ProtectedRoute><RoutineEditorPage /></ProtectedRoute>} />
          <Route path="/routines/:id/edit" element={<ProtectedRoute><RoutineEditorPage /></ProtectedRoute>} />
          <Route path="/routines/:id/run" element={<ProtectedRoute><RoutineRunnerPage /></ProtectedRoute>} />
          <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><RewardsShopPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

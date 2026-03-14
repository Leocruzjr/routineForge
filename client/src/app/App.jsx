import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import RoutineListPage from '@/features/routines/RoutineListPage';
import RoutineEditorPage from '@/features/routines/RoutineEditorPage';
import RoutineRunnerPage from '@/features/routines/RoutineRunnerPage';
import BadgesPage from '@/features/gamification/BadgesPage';
import RewardsShopPage from '@/features/gamification/RewardsShopPage';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/routines"
            element={
              <ProtectedRoute>
                <RoutineListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routines/new"
            element={
              <ProtectedRoute>
                <RoutineEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routines/:id/edit"
            element={
              <ProtectedRoute>
                <RoutineEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routines/:id/run"
            element={
              <ProtectedRoute>
                <RoutineRunnerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/badges"
            element={
              <ProtectedRoute>
                <BadgesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <ProtectedRoute>
                <RewardsShopPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Flame, LogOut, Home, ListChecks, BarChart3, BookOpen, Settings, UserPlus, Sun, Moon, Crown } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useThemeStore } from '@/stores/themeStore';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/routines', label: 'Routines', icon: ListChecks },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/resources', label: 'Resources', icon: BookOpen },
];

export default function Navbar() {
  const { user, isGuest, logout, isPro } = useAuthStore();
  const userIsPro = user ? isPro() : false;
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      {/* Guest banner */}
      {user && isGuest && (
        <div className="bg-primary-500 text-white text-center py-2 px-4 text-sm">
          <Link to="/register" className="inline-flex items-center gap-1.5 font-medium hover:underline">
            <UserPlus className="w-3.5 h-3.5" />
            Sign up to save your data and sync across devices
          </Link>
        </div>
      )}

      {/* Top navbar */}
      <nav className="sticky top-0 z-50 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-[#38383A]/50 pt-safe">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              RoutineForge
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-gray-200/60 dark:bg-[#38383A] text-gray-500 px-1.5 py-0.5 rounded-full leading-none">
              Beta
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-500'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link to="/settings" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setShowLogout(true)}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F2F2F7]/90 dark:bg-black/90 backdrop-blur-md border-t border-gray-200/50 dark:border-[#38383A]/50 pb-safe">
          <div className="flex items-center justify-around h-14">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-0 transition-colors ${
                    isActive ? 'text-primary-500' : 'text-gray-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <ConfirmModal
        isOpen={showLogout}
        title="Sign Out"
        message="Sign out?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={() => { setShowLogout(false); logout(); }}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Flame, LogOut, Home, ListChecks, Award, ShoppingBag, BarChart3, Settings, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';

const navLinks = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/routines', label: 'Routines', icon: ListChecks },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/badges', label: 'Badges', icon: Award },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
];

export default function Navbar() {
  const { user, isGuest, logout } = useAuthStore();
  const location = useLocation();

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
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-primary-500" />
            <span className="font-display text-xl text-gray-900 dark:text-white">
              RoutineForge
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-mono text-primary-600 dark:text-primary-400">
                  Lv.{user.level}
                </span>
                <span className="text-sm text-gray-500">
                  {isGuest ? 'Guest' : user.username}
                </span>
              </div>
              <Link to="/settings" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-around h-16">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary-500'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}

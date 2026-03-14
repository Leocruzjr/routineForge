import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Flame, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
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
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-mono text-primary-600 dark:text-primary-400">
                Lv.{user.level}
              </span>
              <span className="text-sm text-gray-500">
                {user.username}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import { Flame, Trophy, TrendingUp, Zap } from 'lucide-react';
import { xpForLevel } from '../../../../shared/constants.js';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const currentLevelXp = xpForLevel(user.level);
  const nextLevelXp = xpForLevel(user.level + 1);
  const progressXp = user.totalXp - currentLevelXp;
  const neededXp = nextLevelXp - currentLevelXp;
  const progressPct = neededXp > 0 ? Math.min((progressXp / neededXp) * 100, 100) : 100;

  return (
    <PageWrapper className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-gray-900 dark:text-white">
          Good {getTimeOfDay()}, {user.username}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your progress today</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-accent-100 dark:bg-accent-900/30 rounded-xl">
            <Flame className="w-6 h-6 text-accent-500" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{user.currentStreak}</p>
            <p className="text-xs text-gray-500">Day Streak</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Zap className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{user.totalXp.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total XP</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl">
            <Trophy className="w-6 h-6 text-secondary-500" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">Lv.{user.level}</p>
            <p className="text-xs text-gray-500">Current Level</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-success-100 dark:bg-success-900/30 rounded-xl">
            <TrendingUp className="w-6 h-6 text-success-500" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{user.longestStreak}</p>
            <p className="text-xs text-gray-500">Best Streak</p>
          </div>
        </Card>
      </div>

      {/* XP Progress Bar */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Level {user.level}
          </span>
          <span className="text-sm font-mono text-gray-500">
            {progressXp} / {neededXp} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      {/* Placeholder for today's routines */}
      <Card>
        <h2 className="font-display text-xl text-gray-900 dark:text-white mb-4">Today&apos;s Routines</h2>
        <p className="text-gray-500 text-center py-8">
          Routine cards will appear here in Phase 2. Your foundation is ready!
        </p>
      </Card>
    </PageWrapper>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

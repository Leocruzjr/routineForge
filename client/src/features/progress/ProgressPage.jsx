import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import CalendarHeatmap from './CalendarHeatmap';
import WeeklyXpChart from './WeeklyXpChart';
import { Flame, Trophy, TrendingUp, Target, Zap, Crown } from 'lucide-react';
import UpgradeModal from '@/components/ui/UpgradeModal';

export default function ProgressPage() {
  const { stats, fetchStats, badges, fetchBadges } = useGamificationStore();
  const { user, isPro, upgradePlan } = useAuthStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const userIsPro = isPro();

  useEffect(() => {
    fetchStats();
    fetchBadges();
  }, [fetchStats, fetchBadges]);

  const recentBadges = badges
    .filter((b) => b.earned)
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
    .slice(0, 3);

  return (
    <PageWrapper className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-gray-900 dark:text-white">Progress</h1>
        <p className="text-gray-500 mt-1">Your routine journey at a glance</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Flame} color="accent" label="Current Streak" value={`${user.currentStreak} days`} />
        <StatCard icon={Trophy} color="primary" label="Best Streak" value={`${user.longestStreak} days`} />
        <StatCard icon={Target} color="success" label="Avg Completion" value={stats ? `${Math.round(stats.avgCompletionPct * 100)}%` : '—'} />
        <StatCard icon={TrendingUp} color="secondary" label="Total Completed" value={stats?.totalCompleted ?? '—'} />
      </div>

      {/* Calendar Heatmap */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-success-500" />
            Completion Heatmap
          </h2>
          {!userIsPro && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-1 text-xs text-primary-500 hover:underline font-medium"
            >
              <Crown className="w-3.5 h-3.5" /> Unlock 90 days
            </button>
          )}
        </div>
        {stats?.heatmap ? (
          <>
            <CalendarHeatmap data={stats.heatmap} />
            {!userIsPro && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Showing last 7 days — upgrade to Pro for full 90-day history
              </p>
            )}
          </>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400">
            Loading...
          </div>
        )}
      </Card>

      {/* Weekly XP Chart */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-500" />
            Weekly XP
          </h2>
          {!userIsPro && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-1 text-xs text-primary-500 hover:underline font-medium"
            >
              <Crown className="w-3.5 h-3.5" /> Unlock 8 weeks
            </button>
          )}
        </div>
        {stats?.weeklyXp && stats.weeklyXp.length > 0 ? (
          <WeeklyXpChart data={stats.weeklyXp} />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400">
            Complete routines to see your XP chart
          </div>
        )}
      </Card>

      {/* Streak Timeline */}
      <Card className="mb-8">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent-500" />
          Streak Status
        </h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-mono font-bold text-accent-500">{user.currentStreak}</p>
            <p className="text-xs text-gray-500 mt-1">Current</p>
          </div>
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <p className="text-4xl font-mono font-bold text-gray-300 dark:text-gray-600">{user.longestStreak}</p>
            <p className="text-xs text-gray-500 mt-1">Personal Best</p>
          </div>
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <p className="text-4xl font-mono font-bold text-secondary-400">{user.streakFreezes}</p>
            <p className="text-xs text-gray-500 mt-1">Freezes Left</p>
          </div>
        </div>
      </Card>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-500" />
            Recent Badges
          </h2>
          <div className="space-y-3">
            {recentBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{badge.name}</p>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                </div>
                <span className="text-xs font-mono text-primary-500">+{badge.xpReward} XP</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={async () => {
          try {
            await upgradePlan();
            setShowUpgrade(false);
            fetchStats();
          } catch {}
        }}
        reason="Unlock full stats history with 90-day heatmap and 8-week XP trends."
      />
    </PageWrapper>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="flex items-center gap-3">
        <div className={`p-2.5 bg-${color}-100 dark:bg-${color}-900/30 rounded-xl`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

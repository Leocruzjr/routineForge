import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import { Flame, Trophy, Target, Star } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';


export default function ProgressPage() {
  const { stats, fetchStats } = useGamificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Top routine by completion %
  const topRoutine = (() => {
    if (!stats?.perRoutine || stats.perRoutine.length === 0) return null;
    const sorted = [...stats.perRoutine].sort((a, b) => b.avgCompletionPct - a.avgCompletionPct);
    const best = sorted[0];
    if (!best || best.avgCompletionPct === 0) return null;
    return { name: best.name, pct: Math.round(best.avgCompletionPct * 100) };
  })();

  // Weekly XP data (Mon-Sun)
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = format(date, 'yyyy-MM-dd');
    const entry = stats?.heatmap?.find((h) => h.date === key);
    return { label: format(date, 'EEE'), xp: entry?.xpEarned || 0, pct: entry?.completionPct ?? null };
  });
  const weekTotalXp = weekDays.reduce((sum, d) => sum + d.xp, 0);
  const maxXp = Math.max(...weekDays.map((d) => d.xp), 1);

  return (
    <PageWrapper className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Progress</h1>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatPill icon={Flame} value={user.currentStreak} label="Streak" />
        <StatPill icon={Target} value={stats ? `${Math.round(stats.avgCompletionPct * 100)}%` : '—'} label="Avg" />
        <StatPill icon={Trophy} value={stats?.totalCompleted ?? '—'} label="Done" />
      </div>

      {/* This week's activity */}
      <Section title="This week" right={weekTotalXp > 0 ? `${weekTotalXp} XP` : null}>
        <div className="flex items-end gap-2 h-24">
          {weekDays.map((day) => {
            const height = day.xp > 0 ? Math.max((day.xp / maxXp) * 100, 12) : 8;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-lg transition-all ${
                    day.xp > 0 ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ height: `${height}%`, minHeight: '4px' }}
                />
                <span className="text-[10px] text-gray-400">{day.label}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Top routine */}
      {topRoutine && (
        <Section title="Top routine">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary-500" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{topRoutine.name}</p>
            </div>
            <span className="text-lg font-mono font-bold text-primary-500">{topRoutine.pct}%</span>
          </div>
        </Section>
      )}

      {/* Streak details */}
      <Section title="Streak">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{user.currentStreak}</p>
            <p className="text-xs text-gray-400">Current</p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div>
            <p className="text-2xl font-mono font-bold text-gray-300 dark:text-gray-600">{user.longestStreak}</p>
            <p className="text-xs text-gray-400">Best</p>
          </div>
        </div>
      </Section>

      {/**/}
    </PageWrapper>
  );
}

function StatPill({ icon: Icon, value, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 text-center"
    >
      <Icon className="w-4 h-4 text-primary-500 mx-auto mb-1" />
      <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

function Section({ title, right, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
        {right && <span className="text-xs font-mono text-gray-400">{right}</span>}
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
        {children}
      </div>
    </div>
  );
}

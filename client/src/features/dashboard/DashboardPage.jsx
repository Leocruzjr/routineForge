import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useRoutineStore } from '@/stores/routineStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Flame, Trophy, TrendingUp, Zap, Plus, Award, HelpCircle, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { getBadgeIcon } from '@/lib/badgeIcons';
import { xpForLevel } from '../../../../shared/constants.js';
import { format, startOfWeek, addDays } from 'date-fns';
import LevelUpModal from '@/components/ui/LevelUpModal';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { routines, todayCompletions, fetchRoutines, fetchTodayCompletions } = useRoutineStore();
  const { badges, fetchBadges, stats, fetchStats } = useGamificationStore();
  const navigate = useNavigate();

  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth(); // Refresh user data (XP, level) on every dashboard visit
    fetchRoutines();
    fetchTodayCompletions();
    fetchBadges();
    fetchStats();
  }, [checkAuth, fetchRoutines, fetchTodayCompletions, fetchBadges, fetchStats]);

  const currentLevelXp = xpForLevel(user.level);
  const nextLevelXp = xpForLevel(user.level + 1);
  const progressXp = user.totalXp - currentLevelXp;
  const neededXp = nextLevelXp - currentLevelXp;
  const progressPct = neededXp > 0 ? Math.min((progressXp / neededXp) * 100, 100) : 100;

  // Only show today's scheduled routines, sorted: incomplete first, by time relevance
  const dayOfWeek = new Date().getDay();
  const hour = new Date().getHours();
  const todaysRoutines = routines
    .filter((r) => r.isActive && r.daysOfWeek.includes(dayOfWeek))
    .sort((a, b) => {
      const aCompleted = todayCompletions.find((c) => c.routineId === a.id)?.completedAt != null;
      const bCompleted = todayCompletions.find((c) => c.routineId === b.id)?.completedAt != null;
      // Incomplete routines first
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      // Among incomplete, sort by time-of-day relevance
      if (!aCompleted && !bCompleted) {
        const aTime = parseScheduledTime(a.scheduledTime);
        const bTime = parseScheduledTime(b.scheduledTime);
        // Closer to current hour = more relevant = comes first
        const aDist = Math.abs(aTime - hour);
        const bDist = Math.abs(bTime - hour);
        return aDist - bDist;
      }
      return 0;
    });

  const [expandedId, setExpandedId] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);

  // Check for pending level-up from routine completion
  useEffect(() => {
    const pending = localStorage.getItem('rf_pending_levelup');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        // Small delay so the dashboard renders first
        const t = setTimeout(() => setLevelUpData(data), 600);
        localStorage.removeItem('rf_pending_levelup');
        return () => clearTimeout(t);
      } catch {
        localStorage.removeItem('rf_pending_levelup');
      }
    }
  }, []);

  const getCompletion = (routineId) =>
    todayCompletions.find((c) => c.routineId === routineId);

  // Most recent earned badge
  const recentBadge = badges
    .filter((b) => b.earned)
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0];

  // Weekly heatmap (Mon–Sun of current week)
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = format(date, 'yyyy-MM-dd');
    const entry = stats?.heatmap?.find((h) => h.date === key);
    return {
      label: format(date, 'EEE'),
      date: key,
      pct: entry?.completionPct ?? null,
    };
  });

  return (
    <PageWrapper className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-gray-900 dark:text-white">
            Good {getTimeOfDay()}, {user.username}
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s your progress today</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('rf_tour_completed');
            navigate('/welcome');
          }}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          title="View tutorial"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
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

      {/* Weekly heatmap + recent badge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* 7-day heatmap */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">This Week</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/progress')}>
              See Full Stats
            </Button>
          </div>
          <div className="flex items-end gap-2 justify-between">
            {weekDays.map((day) => {
              const height = day.pct != null ? Math.max(day.pct * 100, 8) : 8;
              const color = day.pct == null
                ? 'bg-gray-200 dark:bg-gray-700'
                : day.pct >= 0.7
                  ? 'bg-success-500'
                  : day.pct > 0
                    ? 'bg-success-300'
                    : 'bg-gray-200 dark:bg-gray-700';

              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full rounded-lg ${color} transition-all duration-300`}
                    style={{ height: `${height}px`, minHeight: '8px', maxHeight: '64px' }}
                  />
                  <span className="text-[10px] text-gray-400">{day.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent badge */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Latest Badge</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/badges')}>
              See All Badges
            </Button>
          </div>
          {recentBadge ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                {(() => {
                  const Icon = getBadgeIcon(recentBadge.icon);
                  return <Icon className="w-7 h-7 text-primary-500" />;
                })()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{recentBadge.name}</p>
                <p className="text-xs text-gray-500">{recentBadge.description}</p>
                <p className="text-xs text-primary-500 font-mono mt-1">+{recentBadge.xpReward} XP</p>
                {recentBadge.earnedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Earned {format(new Date(recentBadge.earnedAt), 'MM/dd/yy')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Award className="w-7 h-7 text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-gray-500">No badges yet</p>
                <p className="text-xs text-gray-400">Complete routines to earn your first badge!</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Today's Routines */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-gray-900 dark:text-white">Today&apos;s Routines</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/routines')}>
          View All
        </Button>
      </div>

      {todaysRoutines.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500 mb-4">No routines scheduled for today.</p>
          <Button size="sm" onClick={() => navigate('/routines')}>
            <Plus className="w-4 h-4 mr-1" /> Add a Routine
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {todaysRoutines.map((routine) => {
            const completion = getCompletion(routine.id);
            const isCompleted = completion?.completedAt != null;
            const isExpanded = expandedId === routine.id;
            const totalMin = routine.steps?.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) || 0;

            return (
              <Card
                key={routine.id}
                className={`cursor-pointer transition-all ${isCompleted ? 'ring-2 ring-success-400' : ''}`}
                onClick={() => !isCompleted && setExpandedId(isExpanded ? null : routine.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{routine.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {routine.steps?.length || 0} steps{totalMin > 0 ? ` · Estimated ${totalMin} min` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="text-xs font-bold text-success-500 bg-success-50 dark:bg-success-900/20 px-2 py-1 rounded-full">Done</span>
                    ) : (
                      isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && !isCompleted && (
                  <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="space-y-2 mb-4">
                      {routine.steps?.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{step.title}</span>
                          {step.durationMinutes && (
                            <span className="text-xs text-gray-400 ml-auto">{step.durationMinutes} min</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/routines/${routine.id}/run`); }}>
                      <Play className="w-4 h-4 mr-1" /> Start Routine
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <LevelUpModal
        isOpen={!!levelUpData}
        levelData={levelUpData}
        onClose={() => {
          setLevelUpData(null);
          // Refresh user data to update all level sections
          checkAuth();
        }}
      />
    </PageWrapper>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function parseScheduledTime(timeStr) {
  if (!timeStr) return 12;
  const [h] = timeStr.split(':').map(Number);
  return h || 12;
}

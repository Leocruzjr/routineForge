import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useRoutineStore } from '@/stores/routineStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import { Flame, Plus, Check, Minus, ChevronRight, ChevronDown, Crosshair, TrendingUp, Target, Zap, Sparkles, Sunrise, Moon, Dumbbell } from 'lucide-react';
import { xpForLevel, getMilestoneTitle, getNextMilestone } from '../../../../shared/constants.js';
import { format, startOfWeek, addDays } from 'date-fns';
import LevelUpModal from '@/components/ui/LevelUpModal';
import PageTour from '@/components/ui/PageTour';
import { dashboardTourSteps } from '@/lib/tourSteps';
import { fireCompletionConfetti, fireLevelUpConfetti } from '@/lib/confetti';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { routines, todayCompletions, fetchRoutines, fetchTodayCompletions, startRun, completeStep, finishRun } = useRoutineStore();
  const { stats, fetchStats } = useGamificationStore();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    fetchRoutines();
    fetchTodayCompletions();
    fetchStats();
  }, [fetchRoutines, fetchTodayCompletions, fetchStats]);

  const currentLevelXp = xpForLevel(user.level);
  const nextLevelXp = xpForLevel(user.level + 1);
  const progressXp = user.totalXp - currentLevelXp;
  const neededXp = nextLevelXp - currentLevelXp;
  const progressPct = neededXp > 0 ? Math.min((progressXp / neededXp) * 100, 100) : 100;
  const xpToNextLevel = neededXp - progressXp;

  // Today's routines sorted: incomplete first, by time relevance
  const dayOfWeek = new Date().getDay();
  const hour = new Date().getHours();
  const todaysRoutines = routines
    .filter((r) => r.isActive && r.daysOfWeek.includes(dayOfWeek))
    .sort((a, b) => {
      const aCompleted = todayCompletions.find((c) => c.routineId === a.id)?.completedAt != null;
      const bCompleted = todayCompletions.find((c) => c.routineId === b.id)?.completedAt != null;
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      if (!aCompleted && !bCompleted) {
        return Math.abs(parseScheduledTime(a.scheduledTime) - hour) - Math.abs(parseScheduledTime(b.scheduledTime) - hour);
      }
      return 0;
    });

  const [expandedId, setExpandedId] = useState(null);
  const [activeCompletions, setActiveCompletions] = useState({});
  const [stepStatuses, setStepStatuses] = useState({});
  const [finishingId, setFinishingId] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);

  // Check for pending level-up
  useEffect(() => {
    const pending = localStorage.getItem('rf_pending_levelup');
    if (pending) {
      try {
        const data = JSON.parse(pending);
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

  const completedToday = todaysRoutines.filter(
    (r) => getCompletion(r.id)?.completedAt != null
  ).length;

  const allDoneToday = todaysRoutines.length > 0 && completedToday === todaysRoutines.length;
  const hasRoutines = routines.filter((r) => r.isActive).length > 0;

  // Expand and start a run
  const handleExpand = async (routine) => {
    if (expandedId === routine.id) { setExpandedId(null); return; }
    setExpandedId(routine.id);
    if (!activeCompletions[routine.id]) {
      try {
        const { completion, resumed } = await startRun(routine.id);
        setActiveCompletions((prev) => ({ ...prev, [routine.id]: completion }));
        if (resumed && completion.stepCompletions) {
          const statuses = {};
          completion.stepCompletions.forEach((sc) => {
            if (sc.completed) statuses[sc.stepId] = 'completed';
            else if (sc.skipped) statuses[sc.stepId] = 'skipped';
          });
          setStepStatuses((prev) => ({ ...prev, [routine.id]: statuses }));
        } else {
          setStepStatuses((prev) => ({ ...prev, [routine.id]: {} }));
        }
      } catch {
        setStepStatuses((prev) => ({ ...prev, [routine.id]: {} }));
      }
    }
  };

  const toggleStep = (routine, step) => {
    const comp = activeCompletions[routine.id];
    if (!comp) return;
    const routineStatuses = stepStatuses[routine.id] || {};
    const wasCompleted = routineStatuses[step.id] === 'completed';
    const newStatuses = { ...routineStatuses };
    if (wasCompleted) delete newStatuses[step.id];
    else newStatuses[step.id] = 'completed';
    setStepStatuses((prev) => ({ ...prev, [routine.id]: newStatuses }));
    completeStep(comp.id, { stepId: step.id, completed: !wasCompleted, skipped: false, timeSpentMs: null });
  };

  const completeAll = (routine) => {
    const comp = activeCompletions[routine.id];
    if (!comp) return;
    const newStatuses = {};
    for (const step of routine.steps) {
      newStatuses[step.id] = 'completed';
      completeStep(comp.id, { stepId: step.id, completed: true, skipped: false, timeSpentMs: null });
    }
    setStepStatuses((prev) => ({ ...prev, [routine.id]: newStatuses }));
  };

  const handleFinish = async (routine) => {
    const comp = activeCompletions[routine.id];
    if (!comp || finishingId) return;
    setFinishingId(routine.id);
    try {
      const result = await finishRun(comp.id);
      if (result.leveledUp) {
        fireLevelUpConfetti();
        localStorage.setItem('rf_pending_levelup', JSON.stringify({ newLevel: result.newLevel, newTotalXp: result.newTotalXp }));
      } else {
        fireCompletionConfetti();
      }
      checkAuth();
      fetchTodayCompletions();
      fetchStats();
      setExpandedId(null);
      if (result.leveledUp) {
        setTimeout(() => {
          const pending = localStorage.getItem('rf_pending_levelup');
          if (pending) { setLevelUpData(JSON.parse(pending)); localStorage.removeItem('rf_pending_levelup'); }
        }, 600);
      }
    } catch {} finally {
      setFinishingId(null);
    }
  };

  // Weekly summary data
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCompleted = todayCompletions.filter((c) => c.completedAt != null);
  const todayXpFromCompletions = todayCompleted.reduce((sum, c) => sum + (c.xpEarned || 0), 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = format(date, 'yyyy-MM-dd');
    const entry = stats?.heatmap?.find((h) => h.date === key);
    const isToday = key === today;
    // For today, use live completion data as fallback if heatmap hasn't updated
    const xp = isToday
      ? Math.max(entry?.xpEarned || 0, todayXpFromCompletions)
      : (entry?.xpEarned || 0);
    const active = isToday ? todayCompleted.length > 0 || (entry?.xpEarned || 0) > 0 : (entry?.xpEarned || 0) > 0;
    return { label: format(date, 'EEE'), date: key, xp, active, isToday };
  });
  const weekTotalXp = weekDays.reduce((sum, d) => sum + d.xp, 0);
  const daysActiveThisWeek = weekDays.filter((d) => d.active).length;
  const maxXp = Math.max(...weekDays.map((d) => d.xp), 1);

  // Insight message
  const insight = getInsight(user, completedToday, todaysRoutines.length, allDoneToday, stats, daysActiveThisWeek);

  return (
    <PageWrapper className="max-w-lg md:max-w-3xl mx-auto px-4 pt-8 pb-24">
      {/* Greeting */}
      <div data-tour="dash-greeting" className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {getGreeting()}
        </h1>
        <p className="text-gray-400 mt-0.5 text-sm">{user.username}</p>
      </div>

      {/* Streak + Level row */}
      <div data-tour="dash-streak-level" className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3">
          <Flame className="w-5 h-5 text-[#FF3B30]" />
          <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">{user.currentStreak}</span>
        </div>
        <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">Lv. {user.level} <span className="text-primary-500">{getMilestoneTitle(user.level)}</span></span>
            <span className="text-[10px] font-mono text-gray-400">{progressXp}/{neededXp} XP</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Next milestone */}
      <div className="mb-6">
        <p className="text-[11px] text-gray-400 text-right px-1">
          {user.currentStreak > 0 && user.currentStreak < user.longestStreak
            ? `${user.longestStreak - user.currentStreak} more day${user.longestStreak - user.currentStreak === 1 ? '' : 's'} to beat your best streak`
            : xpToNextLevel > 0
              ? `${xpToNextLevel} XP to Level ${user.level + 1}`
              : ''}
        </p>
      </div>

      {/* First-time user: no routines */}
      {!hasRoutines ? (
        <div data-tour="dash-routines" className="mb-6">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 text-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Pick your first routine</h2>
            <p className="text-sm text-gray-500 mb-5">Start small — even one routine builds momentum.</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" onClick={() => navigate('/routines')}>
                <Plus className="w-4 h-4 mr-1" /> Build Your Own
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/routines')}>
                Browse Templates
              </Button>
            </div>
          </div>
          <QuickTemplates navigate={navigate} />
        </div>
      ) : (
        <>
          {/* Today's Routines */}
          <div data-tour="dash-routines" className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Today{todaysRoutines.length > 0 ? ` · ${completedToday}/${todaysRoutines.length}` : ''}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/routines')}
                  className="text-xs text-primary-500 font-medium flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
                <button
                  onClick={() => navigate('/routines')}
                  className="text-xs text-gray-400 font-medium flex items-center gap-0.5"
                >
                  All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* All done banner */}
            {allDoneToday && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1C1C1E] border-2 border-primary-200 dark:border-primary-800 rounded-2xl p-4 mb-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">All done for today</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Come back tomorrow to keep your streak going.</p>
                </div>
              </motion.div>
            )}

            {todaysRoutines.length === 0 ? (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-sm mb-1">No routines scheduled today</p>
                <p className="text-xs text-gray-400 mb-4">Your next routines will show up here.</p>
                <Button size="sm" onClick={() => navigate('/routines')}>
                  <Plus className="w-4 h-4 mr-1" /> Add Routine
                </Button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
                {todaysRoutines.map((routine, i) => {
                  const serverCompletion = getCompletion(routine.id);
                  const isCompleted = serverCompletion?.completedAt != null;
                  const isExpanded = expandedId === routine.id;
                  const routineStatuses = stepStatuses[routine.id] || {};
                  const checkedCount = Object.values(routineStatuses).filter((s) => s === 'completed').length;
                  const totalSteps = routine.steps?.length || 0;
                  const totalMin = routine.steps?.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) || 0;
                  const allChecked = checkedCount === totalSteps && totalSteps > 0;

                  return (
                    <div key={routine.id}>
                      {i > 0 && <div className="h-px bg-gray-100 dark:bg-[#38383A] ml-4" />}

                      <button
                        onClick={() => !isCompleted && handleExpand(routine)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:active:bg-[#2C2C2E] ${
                          isCompleted ? 'opacity-50' : ''
                        }`}
                        disabled={isCompleted}
                      >
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                            <Minus className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[15px] font-medium ${
                            isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                          }`}>{routine.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {totalSteps} steps{totalMin > 0 ? ` · ${totalMin} min` : ''}
                          </p>
                        </div>
                        {!isCompleted && (
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-4 h-4 text-gray-300" />
                          </motion.div>
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && !isCompleted && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4">
                              <div className="space-y-0.5 mb-4">
                                {routine.steps?.map((step) => {
                                  const isDone = routineStatuses[step.id] === 'completed';
                                  const isSkipped = routineStatuses[step.id] === 'skipped';
                                  return (
                                    <div key={step.id} className="flex items-center gap-3 py-2">
                                      <button onClick={() => toggleStep(routine, step)} className="flex-shrink-0">
                                        {isDone ? (
                                          <div className="w-5 h-5 rounded-md bg-primary-500 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600" />
                                        )}
                                      </button>
                                      <span className={`text-sm flex-1 ${
                                        isDone ? 'text-gray-400 line-through' : isSkipped ? 'text-gray-400' : 'text-gray-800 dark:text-gray-200'
                                      }`}>
                                        {step.title}
                                        {step.isOptional && <span className="text-gray-400 text-xs ml-1">optional</span>}
                                      </span>
                                      {step.durationMinutes && !isDone && (
                                        <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">{step.durationMinutes}m</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex gap-2">
                                {checkedCount < totalSteps && (
                                  <button onClick={() => completeAll(routine)} className="text-xs text-primary-500 font-medium px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
                                    Check all
                                  </button>
                                )}
                                {!allChecked && (
                                  <button onClick={() => navigate(`/routines/${routine.id}/run`)} className="text-xs text-gray-400 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors flex items-center gap-1">
                                    <Crosshair className="w-3 h-3" /> Focus mode
                                  </button>
                                )}
                                <div className="flex-1" />
                                {checkedCount > 0 && (
                                  <Button size="sm" onClick={() => handleFinish(routine)} loading={finishingId === routine.id}>
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Insight card */}
          {insight && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3.5 mb-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                <insight.icon className="w-4 h-4 text-primary-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{insight.text}</p>
            </motion.div>
          )}
        </>
      )}

      {/* Weekly summary */}
      <div data-tour="dash-weekly" className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">This week</h2>
          <span className="text-xs font-mono text-gray-400">
            {daysActiveThisWeek}/7 days{weekTotalXp > 0 ? ` · ${weekTotalXp} XP` : ''}
          </span>
        </div>
        <div className="flex items-end gap-2 h-16">
          {weekDays.map((day) => {
            const height = day.active ? Math.max((day.xp / maxXp) * 100, 15) : 8;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-md transition-all ${
                    day.isToday
                      ? day.active ? 'bg-primary-500' : 'bg-primary-200 dark:bg-primary-800'
                      : day.active ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                  style={{ height: `${height}%`, minHeight: '3px' }}
                />
                <span className={`text-[10px] font-medium ${day.isToday ? 'text-primary-500' : 'text-gray-400'}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <LevelUpModal
        isOpen={!!levelUpData}
        levelData={levelUpData}
        onClose={() => {
          setLevelUpData(null);
          checkAuth();
        }}
      />
      <PageTour pageKey="dashboard" steps={dashboardTourSteps} />
    </PageWrapper>
  );
}

// Quick template suggestions for new users
function QuickTemplates({ navigate }) {
  const suggestions = [
    { name: 'Morning Routine', desc: '5 steps · 20 min', icon: Sunrise, color: 'text-accent-500 bg-accent-50 dark:bg-accent-900/20' },
    { name: 'Bedtime Wind-Down', desc: '4 steps · 15 min', icon: Moon, color: 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20' },
    { name: 'Workout', desc: '6 steps · 30 min', icon: Dumbbell, color: 'text-success-500 bg-success-50 dark:bg-success-900/20' },
  ];

  return (
    <div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Popular routines</p>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.name}
            onClick={() => navigate('/routines')}
            className="w-full bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

function getInsight(user, completedToday, totalToday, allDone, stats, daysActiveThisWeek) {
  const insights = [];

  // Streak approaching personal best
  if (user.currentStreak > 0 && user.currentStreak >= user.longestStreak) {
    insights.push({ icon: Flame, text: `${user.currentStreak} days — this is your longest streak ever. Keep it going!` });
  } else if (user.currentStreak > 0 && user.longestStreak - user.currentStreak <= 3) {
    insights.push({ icon: Flame, text: `You're ${user.longestStreak - user.currentStreak} day${user.longestStreak - user.currentStreak === 1 ? '' : 's'} away from your longest streak of ${user.longestStreak}.` });
  }

  // Weekly comparison
  if (daysActiveThisWeek >= 5) {
    insights.push({ icon: TrendingUp, text: `Active ${daysActiveThisWeek} out of 7 days this week — strong consistency.` });
  } else if (daysActiveThisWeek >= 3) {
    insights.push({ icon: Target, text: `${daysActiveThisWeek} days active this week. A couple more and you'll have a great week.` });
  }

  // Completion rate today
  if (allDone && totalToday > 1) {
    insights.push({ icon: Sparkles, text: `All ${totalToday} routines done today. You're building real momentum.` });
  } else if (completedToday > 0 && !allDone) {
    const remaining = totalToday - completedToday;
    insights.push({ icon: Zap, text: `${completedToday} down, ${remaining} to go. You're already making progress.` });
  }

  // Top routine from stats
  if (stats?.perRoutine?.length > 0) {
    const sorted = [...stats.perRoutine].sort((a, b) => b.avgCompletionPct - a.avgCompletionPct);
    const best = sorted[0];
    if (best && best.avgCompletionPct >= 0.8) {
      insights.push({ icon: TrendingUp, text: `"${best.name}" is your most consistent routine at ${Math.round(best.avgCompletionPct * 100)}%.` });
    }
  }

  // Level milestone
  if (user.level >= 5 && user.level % 5 === 0) {
    insights.push({ icon: Zap, text: `Level ${user.level} — that's real dedication. Most people don't make it this far.` });
  }

  // Pick one insight, rotating by hour so it feels fresh
  if (insights.length === 0) return null;
  const idx = new Date().getHours() % insights.length;
  return insights[idx];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function parseScheduledTime(timeStr) {
  if (!timeStr) return 12;
  const [h] = timeStr.split(':').map(Number);
  return h || 12;
}

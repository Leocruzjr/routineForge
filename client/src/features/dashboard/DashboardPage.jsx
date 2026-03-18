import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useRoutineStore } from '@/stores/routineStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import { Flame, Plus, Check, Minus, ChevronRight, ChevronDown, Clock, SkipForward, Crosshair, Zap } from 'lucide-react';
import { xpForLevel } from '../../../../shared/constants.js';
import { format, startOfWeek, addDays } from 'date-fns';
import LevelUpModal from '@/components/ui/LevelUpModal';
import { fireCompletionConfetti, fireLevelUpConfetti } from '@/lib/confetti';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { routines, todayCompletions, fetchRoutines, fetchTodayCompletions, startRun, completeStep, finishRun } = useRoutineStore();
  const { fetchStats } = useGamificationStore();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    fetchRoutines();
    fetchTodayCompletions();
    fetchStats();
  }, [checkAuth, fetchRoutines, fetchTodayCompletions, fetchStats]);

  const currentLevelXp = xpForLevel(user.level);
  const nextLevelXp = xpForLevel(user.level + 1);
  const progressXp = user.totalXp - currentLevelXp;
  const neededXp = nextLevelXp - currentLevelXp;
  const progressPct = neededXp > 0 ? Math.min((progressXp / neededXp) * 100, 100) : 100;

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
  const [activeCompletions, setActiveCompletions] = useState({}); // { routineId: completionRecord }
  const [stepStatuses, setStepStatuses] = useState({}); // { routineId: { stepId: 'completed'|'skipped' } }
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

  // Expand and start a run
  const handleExpand = async (routine) => {
    if (expandedId === routine.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(routine.id);

    // Start run if we don't have one yet
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
        // If start fails, still expand to show steps
        setStepStatuses((prev) => ({ ...prev, [routine.id]: {} }));
      }
    }
  };

  const toggleStep = async (routine, step) => {
    const comp = activeCompletions[routine.id];
    if (!comp) return;

    const routineStatuses = stepStatuses[routine.id] || {};
    const wasCompleted = routineStatuses[step.id] === 'completed';

    const newStatuses = { ...routineStatuses };
    if (wasCompleted) {
      delete newStatuses[step.id];
    } else {
      newStatuses[step.id] = 'completed';
    }

    setStepStatuses((prev) => ({ ...prev, [routine.id]: newStatuses }));

    completeStep(comp.id, {
      stepId: step.id,
      completed: !wasCompleted,
      skipped: false,
      timeSpentMs: null,
    });
  };

  const completeAll = async (routine) => {
    const comp = activeCompletions[routine.id];
    if (!comp) return;

    const newStatuses = {};
    for (const step of routine.steps) {
      newStatuses[step.id] = 'completed';
      completeStep(comp.id, {
        stepId: step.id,
        completed: true,
        skipped: false,
        timeSpentMs: null,
      });
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
        localStorage.setItem('rf_pending_levelup', JSON.stringify({
          newLevel: result.newLevel,
          newTotalXp: result.newTotalXp,
        }));
      } else {
        fireCompletionConfetti();
      }

      // Refresh data
      checkAuth();
      fetchTodayCompletions();
      setExpandedId(null);

      // Show level up after a beat
      if (result.leveledUp) {
        setTimeout(() => {
          const pending = localStorage.getItem('rf_pending_levelup');
          if (pending) {
            setLevelUpData(JSON.parse(pending));
            localStorage.removeItem('rf_pending_levelup');
          }
        }, 600);
      }
    } catch {
      // silently fail
    } finally {
      setFinishingId(null);
    }
  };

  // Week dots
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <PageWrapper className="max-w-lg mx-auto px-4 pt-8 pb-24">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {getGreeting()}
        </h1>
        <p className="text-gray-400 mt-0.5 text-sm">{user.username}</p>
      </div>

      {/* Streak + Level row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3">
          <Flame className="w-5 h-5 text-[#FF3B30]" />
          <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">{user.currentStreak}</span>
        </div>
        <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">Lv. {user.level}</span>
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

      {/* Today's Routines */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Today{todaysRoutines.length > 0 ? ` · ${completedToday}/${todaysRoutines.length}` : ''}
          </h2>
          <button
            onClick={() => navigate('/routines')}
            className="text-xs text-primary-500 font-medium flex items-center gap-0.5"
          >
            All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {todaysRoutines.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4 text-sm">No routines for today</p>
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

                  {/* Routine header row */}
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
                      }`}>
                        {routine.name}
                      </p>
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

                  {/* Expanded checklist */}
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
                          {/* Steps */}
                          <div className="space-y-0.5 mb-4">
                            {routine.steps?.map((step) => {
                              const isDone = routineStatuses[step.id] === 'completed';
                              const isSkipped = routineStatuses[step.id] === 'skipped';

                              return (
                                <div
                                  key={step.id}
                                  className="flex items-center gap-3 py-2"
                                >
                                  <button
                                    onClick={() => toggleStep(routine, step)}
                                    className="flex-shrink-0"
                                  >
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
                                    <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">
                                      {step.durationMinutes}m
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {checkedCount < totalSteps && (
                              <button
                                onClick={() => completeAll(routine)}
                                className="text-xs text-primary-500 font-medium px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                              >
                                Check all
                              </button>
                            )}
                            {!allChecked && (
                              <button
                                onClick={() => navigate(`/routines/${routine.id}/run`)}
                                className="text-xs text-gray-400 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors flex items-center gap-1"
                              >
                                <Crosshair className="w-3 h-3" /> Focus mode
                              </button>
                            )}
                            <div className="flex-1" />
                            {checkedCount > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleFinish(routine)}
                                loading={finishingId === routine.id}
                              >
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

      {/* Week dots */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-4 py-3 mt-4">
        <div className="flex items-center justify-between">
          {Array.from({ length: 7 }, (_, i) => {
            const date = addDays(monday, i);
            const key = format(date, 'yyyy-MM-dd');
            const isToday = key === today;
            const isPast = date < new Date() && !isToday;
            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <span className={`text-[10px] font-medium ${isToday ? 'text-primary-500' : 'text-gray-400'}`}>
                  {format(date, 'EEE')}
                </span>
                <div className={`w-3 h-3 rounded-full ${
                  isToday
                    ? completedToday === todaysRoutines.length && todaysRoutines.length > 0
                      ? 'bg-primary-500'
                      : 'ring-2 ring-primary-500 ring-inset'
                    : isPast
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                }`} />
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
    </PageWrapper>
  );
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


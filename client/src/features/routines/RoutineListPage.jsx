import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutineStore } from '@/stores/routineStore';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import UpgradeModal from '@/components/ui/UpgradeModal';
import TemplatePickerModal from './TemplatePickerModal';
import { Plus, Crown, Check, Minus, ChevronDown, Crosshair, Edit2, Trash2 } from 'lucide-react';
import { FREE_TIER_LIMITS } from '../../../../shared/constants.js';
import { fireCompletionConfetti, fireLevelUpConfetti } from '@/lib/confetti';
import LevelUpModal from '@/components/ui/LevelUpModal';
import PageTour from '@/components/ui/PageTour';
import { routinesTourSteps } from '@/lib/tourSteps';

export default function RoutineListPage() {
  const navigate = useNavigate();
  const { routines, todayCompletions, fetchRoutines, fetchTodayCompletions, startRun, completeStep, finishRun, deleteRoutine, isLoading } = useRoutineStore();
  const { isPro, upgradePlan, checkAuth } = useAuthStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [activeCompletions, setActiveCompletions] = useState({});
  const [stepStatuses, setStepStatuses] = useState({});
  const [finishingId, setFinishingId] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const userIsPro = isPro();
  const activeCount = routines.filter((r) => r.isActive).length;
  const atLimit = !userIsPro && activeCount >= FREE_TIER_LIMITS.maxActiveRoutines;

  useEffect(() => {
    fetchRoutines();
    fetchTodayCompletions();
  }, [fetchRoutines, fetchTodayCompletions]);

  const handleCreate = () => {
    if (atLimit) setShowUpgrade(true);
    else navigate('/routines/new');
  };

  const getCompletion = (routineId) =>
    todayCompletions.find((c) => c.routineId === routineId);

  const handleExpand = async (routine) => {
    if (expandedId === routine.id) {
      setExpandedId(null);
      return;
    }
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
    const routineStats = stepStatuses[routine.id] || {};
    const wasCompleted = routineStats[step.id] === 'completed';
    const newStatuses = { ...routineStats };
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
        setTimeout(() => {
          const pending = localStorage.getItem('rf_pending_levelup');
          if (pending) { setLevelUpData(JSON.parse(pending)); localStorage.removeItem('rf_pending_levelup'); }
        }, 600);
      } else {
        fireCompletionConfetti();
      }
      checkAuth();
      fetchTodayCompletions();
      setExpandedId(null);
    } catch {} finally {
      setFinishingId(null);
    }
  };

  const handleDelete = async (routine) => {
    await deleteRoutine(routine.id);
    setDeleteTarget(null);
  };

  const activeRoutines = routines.filter((r) => r.isActive);
  const inactiveRoutines = routines.filter((r) => !r.isActive);

  const dayOfWeek = new Date().getDay();
  const isScheduledToday = (r) => r.daysOfWeek.includes(dayOfWeek);

  const renderRoutineRow = (routine, i, showDivider) => {
    const serverCompletion = getCompletion(routine.id);
    const isCompleted = serverCompletion?.completedAt != null;
    const isExpanded = expandedId === routine.id;
    const routineStats = stepStatuses[routine.id] || {};
    const checkedCount = Object.values(routineStats).filter((s) => s === 'completed').length;
    const totalSteps = routine.steps?.length || 0;
    const allChecked = checkedCount === totalSteps && totalSteps > 0;
    const scheduledToday = isScheduledToday(routine);

    return (
      <div key={routine.id}>
        {showDivider && <div className="h-px bg-gray-100 dark:bg-[#38383A] ml-4" />}
        <div className="flex items-center">
          <button
            onClick={() => scheduledToday && !isCompleted && handleExpand(routine)}
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:active:bg-[#2C2C2E] ${
              isCompleted ? 'opacity-50' : !scheduledToday ? 'opacity-40' : ''
            }`}
            disabled={isCompleted || !scheduledToday}
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
                {totalSteps} steps{!scheduledToday ? ' · Not scheduled today' : ''}
              </p>
            </div>
            {scheduledToday && !isCompleted && (
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-gray-300" />
              </motion.div>
            )}
          </button>
          <div className="flex items-center gap-0.5 pr-2">
            <button onClick={() => navigate(`/routines/${routine.id}/edit`)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setDeleteTarget(routine)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && !isCompleted && scheduledToday && (
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
                    const isDone = routineStats[step.id] === 'completed';
                    const isSkipped = routineStats[step.id] === 'skipped';
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
  };

  return (
    <PageWrapper className="max-w-lg md:max-w-3xl mx-auto px-4 pt-8 pb-24">
      <div data-tour="routines-header" className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Routines</h1>
        <div data-tour="routines-actions" className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            Templates
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-1" /> Create
            {atLimit && <Crown className="w-3.5 h-3.5 ml-1 text-primary-200" />}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {activeRoutines.length === 0 && inactiveRoutines.length === 0 && (
            <div data-tour="routines-list" className="text-center py-16">
              <p className="text-gray-500 text-sm mb-4">No routines yet</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowTemplates(true)}>Start from Template</Button>
                <Button variant="outline" onClick={() => navigate('/routines/new')}>Build Custom</Button>
              </div>
            </div>
          )}

          {activeRoutines.length > 0 && (
            <div data-tour="routines-list" className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-6">
              {activeRoutines.map((routine, i) => renderRoutineRow(routine, i, i > 0))}
            </div>
          )}

          {inactiveRoutines.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactive</h2>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden opacity-60">
                {inactiveRoutines.map((routine, i) => renderRoutineRow(routine, i, i > 0))}
              </div>
            </>
          )}
        </>
      )}

      {!userIsPro && activeCount > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            {activeCount} / {FREE_TIER_LIMITS.maxActiveRoutines} active routines
            {atLimit && (
              <button onClick={() => setShowUpgrade(true)} className="ml-2 text-primary-500 hover:underline font-medium">
                Upgrade for more
              </button>
            )}
          </p>
        </div>
      )}

      {showTemplates && <TemplatePickerModal onClose={() => setShowTemplates(false)} />}

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={async () => { try { await upgradePlan(); setShowUpgrade(false); } catch {} }}
        reason={`You've reached the free plan limit of ${FREE_TIER_LIMITS.maxActiveRoutines} active routines.`}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Routine"
        message={`Delete "${deleteTarget?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      <LevelUpModal
        isOpen={!!levelUpData}
        levelData={levelUpData}
        onClose={() => { setLevelUpData(null); checkAuth(); }}
      />
      <PageTour pageKey="routines" steps={routinesTourSteps} />
    </PageWrapper>
  );
}

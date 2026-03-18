import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutineStore } from '@/stores/routineStore';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import { Check, SkipForward, Clock, X, Zap, Flame } from 'lucide-react';
import { fireCompletionConfetti, fireLevelUpConfetti } from '@/lib/confetti';

export default function RoutineRunnerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { routines, startRun, completeStep, finishRun } = useRoutineStore();
  const { checkAuth } = useAuthStore();

  const routine = routines.find((r) => r.id === id);
  const steps = routine?.steps || [];

  const [completion, setCompletion] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState({});
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!routine) return;
    const init = async () => {
      try {
        const { completion: comp, resumed } = await startRun(routine.id);
        setCompletion(comp);
        if (resumed && comp.stepCompletions) {
          const statuses = {};
          let firstIncomplete = 0;
          comp.stepCompletions.forEach((sc) => {
            if (sc.completed) statuses[sc.stepId] = 'completed';
            else if (sc.skipped) statuses[sc.stepId] = 'skipped';
          });
          for (let i = 0; i < steps.length; i++) {
            if (!statuses[steps[i].id]) { firstIncomplete = i; break; }
            if (i === steps.length - 1) firstIncomplete = steps.length;
          }
          setStepStatuses(statuses);
          setCurrentStepIndex(firstIncomplete);
        }
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [routine?.id]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    setTimer(0);
    setTimerRunning(false);
  }, [currentStepIndex]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleComplete = async () => {
    const step = steps[currentStepIndex];
    if (!completion || !step) return;
    setStepStatuses((prev) => ({ ...prev, [step.id]: 'completed' }));
    completeStep(completion.id, { stepId: step.id, completed: true, skipped: false, timeSpentMs: timer * 1000 });
    setTimerRunning(false);
    advanceOrFinish(currentStepIndex);
  };

  const handleSkip = async () => {
    const step = steps[currentStepIndex];
    if (!completion || !step) return;
    setStepStatuses((prev) => ({ ...prev, [step.id]: 'skipped' }));
    completeStep(completion.id, { stepId: step.id, completed: false, skipped: true, timeSpentMs: null });
    setTimerRunning(false);
    advanceOrFinish(currentStepIndex);
  };

  const advanceOrFinish = async (fromIndex) => {
    if (fromIndex >= steps.length - 1) {
      try {
        const finishResult = await finishRun(completion.id);
        setResult(finishResult);
        if (finishResult.leveledUp) fireLevelUpConfetti();
        else fireCompletionConfetti();
        checkAuth();
      } catch {
        navigate('/');
      }
    } else {
      setCurrentStepIndex(fromIndex + 1);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </PageWrapper>
    );
  }

  if (!routine) { navigate('/'); return null; }

  // --- Completion ---
  if (result) {
    const { xpBreakdown, leveledUp, newLevel, newTotalXp, streak } = result;
    return (
      <PageWrapper className="max-w-lg mx-auto px-4 py-12 pb-24 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
          <div className="text-5xl mb-3">{leveledUp ? '🎉' : '✓'}</div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{routine.name}</h1>
          <p className="text-gray-400 mb-6">Routine complete</p>

          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary-500" />
              <span className="text-3xl font-mono font-bold text-gray-900 dark:text-white">+{xpBreakdown.totalXp}</span>
              <span className="text-gray-400 text-sm">XP</span>
            </div>
            {streak?.currentStreak > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
                <Flame className="w-4 h-4 text-[#FF3B30]" />
                {streak.currentStreak} day streak
              </div>
            )}
          </div>

          <Button className="w-full" onClick={() => {
            if (leveledUp) localStorage.setItem('rf_pending_levelup', JSON.stringify({ newLevel, newTotalXp }));
            navigate('/');
          }}>
            Done
          </Button>
        </motion.div>
      </PageWrapper>
    );
  }

  // --- Focus Mode: Step-by-step ---
  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex) / steps.length) * 100 : 0;

  return (
    <PageWrapper className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header with exit */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" /> Exit
        </button>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Focus Mode</span>
        <span className="text-sm font-mono text-gray-400">{currentStepIndex + 1}/{steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-10">
        <motion.div
          className="bg-primary-500 h-1 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="text-center"
        >
          <p className="text-sm text-gray-400 mb-3">Step {currentStepIndex + 1}</p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {currentStep.title}
          </h2>

          {currentStep.description && (
            <p className="text-gray-500 text-sm mb-4">{currentStep.description}</p>
          )}

          {currentStep.isOptional && (
            <span className="inline-block text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full mb-4">
              Optional
            </span>
          )}

          {/* Timer */}
          {currentStep.durationMinutes && (
            <div className="my-8">
              <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-1">
                {formatTime(timer)}
              </div>
              <p className="text-xs text-gray-400">{currentStep.durationMinutes} min target</p>
            </div>
          )}

          {/* Science note */}
          {currentStep.scienceNote && (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-3 text-left mt-6 mb-2">
              <p className="text-xs text-gray-500">{currentStep.scienceNote}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 z-40">
        <div className="max-w-lg mx-auto flex gap-2">
          {currentStep.durationMinutes && (
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={() => setTimerRunning(!timerRunning)}
            >
              <Clock className="w-4 h-4 mr-1" />
              {timerRunning ? 'Pause' : timer > 0 ? 'Resume' : 'Timer'}
            </Button>
          )}
          <Button className="flex-1" onClick={handleComplete}>
            <Check className="w-4 h-4 mr-1" /> Done
          </Button>
          {currentStep.isOptional && (
            <Button variant="outline" className="flex-shrink-0" onClick={handleSkip}>
              Skip
            </Button>
          )}
        </div>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 mt-8">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentStepIndex
                ? 'bg-primary-500'
                : stepStatuses[step.id] === 'completed'
                  ? 'bg-primary-300'
                  : stepStatuses[step.id] === 'skipped'
                    ? 'bg-gray-300'
                    : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
    </PageWrapper>
  );
}

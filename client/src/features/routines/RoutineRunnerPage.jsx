import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutineStore } from '@/stores/routineStore';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Check, SkipForward, Clock, Info, ArrowLeft, Zap, Trophy, Flame } from 'lucide-react';
import { getBadgeIcon } from '@/lib/badgeIcons';
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

  // Start or resume the run
  useEffect(() => {
    if (!routine) return;

    const init = async () => {
      try {
        const { completion: comp, resumed } = await startRun(routine.id);
        setCompletion(comp);

        if (resumed && comp.stepCompletions) {
          // Rebuild step statuses from existing completion
          const statuses = {};
          let firstIncomplete = 0;
          comp.stepCompletions.forEach((sc) => {
            if (sc.completed) statuses[sc.stepId] = 'completed';
            else if (sc.skipped) statuses[sc.stepId] = 'skipped';
          });
          // Find first incomplete step
          for (let i = 0; i < steps.length; i++) {
            if (!statuses[steps[i].id]) {
              firstIncomplete = i;
              break;
            }
            if (i === steps.length - 1) firstIncomplete = steps.length;
          }
          setStepStatuses(statuses);
          setCurrentStepIndex(firstIncomplete);
        }
      } catch {
        // If we can't start, go back
        navigate('/routines');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [routine?.id]);

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // Reset timer when moving to a new step (don't auto-start)
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

    // Send to server (optimistic UI — we already updated state)
    completeStep(completion.id, {
      stepId: step.id,
      completed: true,
      skipped: false,
      timeSpentMs: timer * 1000,
    });

    setTimerRunning(false);
    advanceOrFinish(currentStepIndex);
  };

  const handleSkip = async () => {
    const step = steps[currentStepIndex];
    if (!completion || !step) return;

    setStepStatuses((prev) => ({ ...prev, [step.id]: 'skipped' }));

    completeStep(completion.id, {
      stepId: step.id,
      completed: false,
      skipped: true,
      timeSpentMs: null,
    });

    setTimerRunning(false);
    advanceOrFinish(currentStepIndex);
  };

  const advanceOrFinish = async (fromIndex) => {
    if (fromIndex >= steps.length - 1) {
      // All steps done — finish the run
      try {
        const finishResult = await finishRun(completion.id);
        setResult(finishResult);
        // Fire confetti
        if (finishResult.leveledUp) {
          fireLevelUpConfetti();
        } else {
          fireCompletionConfetti();
        }
        // Refresh user data for updated XP/level
        checkAuth();
      } catch {
        navigate('/routines');
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

  if (!routine) {
    navigate('/routines');
    return null;
  }

  // --- Celebration Screen ---
  if (result) {
    const { xpBreakdown, leveledUp, newLevel, newTotalXp, streak, newBadges } = result;
    return (
      <PageWrapper className="max-w-lg mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <div className="text-6xl mb-4">
            {leveledUp ? '🎉' : '🔥'}
          </div>

          <h1 className="font-display text-3xl text-gray-900 dark:text-white mb-2">
            {leveledUp ? 'Level Up!' : 'Routine Complete!'}
          </h1>

          {leveledUp && (
            <motion.p
              className="text-2xl font-mono font-bold text-primary-500 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              Level {newLevel}
            </motion.p>
          )}

          <Card className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" /> XP Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Base XP</span>
                <span className="font-mono font-semibold">{xpBreakdown.baseXp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Streak multiplier</span>
                <span className="font-mono">{xpBreakdown.streakMultiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Difficulty multiplier</span>
                <span className="font-mono">{xpBreakdown.difficultyMultiplier}x</span>
              </div>
              {xpBreakdown.weekendMultiplier > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Weekend bonus</span>
                  <span className="font-mono">{xpBreakdown.weekendMultiplier}x</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 text-base">
                <span className="font-semibold text-gray-900 dark:text-white">Total XP earned</span>
                <motion.span
                  className="font-mono font-bold text-primary-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  +{xpBreakdown.totalXp}
                </motion.span>
              </div>
            </div>
          </Card>

          {/* Streak update */}
          {streak && streak.currentStreak > 0 && (
            <Card className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-6 h-6 text-accent-500" />
                <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {streak.currentStreak} day streak
                </span>
              </div>
            </Card>
          )}

          {/* Newly earned badges */}
          {newBadges && newBadges.length > 0 && (
            <Card className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary-500" /> Badges Earned!
              </h3>
              <div className="space-y-3">
                {newBadges.map((badge, i) => {
                  const BadgeIcon = getBadgeIcon(badge.icon);
                  return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.2 }}
                    className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <BadgeIcon className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{badge.name}</p>
                      <p className="text-xs text-gray-500">{badge.description}</p>
                    </div>
                    <span className="text-xs font-mono text-primary-500 flex-shrink-0">+{badge.xpReward} XP</span>
                  </motion.div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate('/')}>
              Dashboard
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/routines')}>
              My Routines
            </Button>
          </div>
        </motion.div>
      </PageWrapper>
    );
  }

  // --- Step-by-step runner ---
  const currentStep = steps[currentStepIndex];
  const completedCount = Object.values(stepStatuses).filter((s) => s === 'completed').length;
  const progress = steps.length > 0 ? (currentStepIndex / steps.length) * 100 : 0;

  return (
    <PageWrapper className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/routines')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <span className="text-sm font-mono text-gray-500">
          {currentStepIndex + 1} / {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
        <motion.div
          className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mb-6">
            <div className="text-center">
              <span className="inline-block w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-lg font-bold flex items-center justify-center mx-auto mb-4">
                {currentStepIndex + 1}
              </span>

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentStep.title}
              </h2>

              {currentStep.description && (
                <p className="text-gray-500 mb-4">{currentStep.description}</p>
              )}

              {currentStep.isOptional && (
                <span className="inline-block text-xs font-medium text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-full mb-4">
                  Optional
                </span>
              )}

              {/* Timer */}
              {currentStep.durationMinutes && (
                <div className="my-6">
                  <div className="flex items-center justify-center gap-2 text-3xl font-mono font-bold text-gray-900 dark:text-white">
                    <Clock className="w-6 h-6 text-gray-400" />
                    {formatTime(timer)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Target: {currentStep.durationMinutes} min
                  </p>
                </div>
              )}

              {/* Science note */}
              {currentStep.scienceNote && (
                <div className="flex items-start gap-2 p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl text-left mt-4">
                  <Info className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-secondary-700 dark:text-secondary-400">
                    {currentStep.scienceNote}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            {currentStep.durationMinutes && !timerRunning && timer === 0 ? (
              <Button className="flex-1" variant="outline" onClick={() => setTimerRunning(true)}>
                <Clock className="w-5 h-5 mr-2" />
                Start Timer
              </Button>
            ) : currentStep.durationMinutes && timerRunning ? (
              <Button className="flex-1" variant="outline" onClick={() => setTimerRunning(false)}>
                Pause
              </Button>
            ) : currentStep.durationMinutes && !timerRunning && timer > 0 ? (
              <Button className="flex-1" variant="outline" onClick={() => setTimerRunning(true)}>
                Resume
              </Button>
            ) : null}
            <Button className="flex-1" onClick={handleComplete}>
              <Check className="w-5 h-5 mr-2" />
              Done
            </Button>
            {currentStep.isOptional && (
              <Button variant="outline" onClick={handleSkip}>
                <SkipForward className="w-5 h-5 mr-1" />
                Skip
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step indicators */}
      <div className="flex justify-center gap-1.5 mt-8">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentStepIndex
                ? 'bg-primary-500'
                : stepStatuses[step.id] === 'completed'
                  ? 'bg-success-500'
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

import { AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboardingStore';
import TourSlide from './TourSlide';
import Button from '@/components/ui/Button';
import { Flame, ListChecks, Zap, Award } from 'lucide-react';

const slides = [
  {
    icon: Flame,
    iconColor: 'primary',
    title: 'Welcome to RoutineForge',
    subtitle: 'Build habits that stick.',
    description:
      'Science-backed routines designed to help you start small, stay consistent, and build the life you want — one step at a time.',
  },
  {
    icon: ListChecks,
    iconColor: 'success',
    title: 'Build Your Routine',
    subtitle: 'Start with just one step.',
    description:
      'Choose from science-backed templates or create your own. Each step tells you why it works. Morning, bedtime, workout — whatever matters to you.',
  },
  {
    icon: Zap,
    iconColor: 'primary',
    title: 'Earn XP & Level Up',
    subtitle: 'Every step counts.',
    description:
      'Complete routines to earn XP, climb levels, and unlock rewards. Streak multipliers reward your consistency — the longer you go, the more you earn.',
  },
  {
    icon: Award,
    iconColor: 'accent',
    title: 'Collect Badges',
    subtitle: 'Celebrate your progress.',
    description:
      'Unlock 17 unique badges as you hit milestones. Streak freezes protect you on off days — because life happens, and that\'s okay.',
  },
];

export default function OnboardingTour({ onComplete }) {
  const { currentStep, totalSteps, nextStep, prevStep, skipTour } = useOnboardingStore();
  const slide = slides[currentStep];
  const isLast = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      nextStep();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface-light dark:bg-surface-dark">
      {/* Skip button */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => { skipTour(); onComplete(); }}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors"
        >
          Skip Tutorial
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <AnimatePresence mode="wait">
          <TourSlide key={currentStep} {...slide} />
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-md" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)' }}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-primary-500'
                  : i < currentStep
                    ? 'w-2 bg-primary-300'
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep} className="flex-1">
              Back
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1">
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

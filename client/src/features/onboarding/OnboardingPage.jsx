import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import OnboardingTour from './OnboardingTour';
import SignupPrompt from './SignupPrompt';

export default function OnboardingPage() {
  const { completeTour } = useOnboardingStore();
  const [tourDone, setTourDone] = useState(false);

  const handleTourComplete = () => {
    completeTour();
    setTourDone(true);
  };

  if (!tourDone) {
    return <OnboardingTour onComplete={handleTourComplete} />;
  }

  return <SignupPrompt />;
}

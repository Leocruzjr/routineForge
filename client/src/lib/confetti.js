import confetti from 'canvas-confetti';

export function fireCompletionConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#f59e0b', '#6366f1', '#10b981', '#f97316'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#f59e0b', '#6366f1', '#10b981', '#f97316'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export function fireLevelUpConfetti() {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
    scalar: 1.2,
  });

  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#6366f1', '#818cf8', '#a5b4fc'],
      scalar: 1.1,
    });
  }, 300);
}

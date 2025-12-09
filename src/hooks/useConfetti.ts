import confetti from 'canvas-confetti';

type CelebrationEvent = 'first_upload' | 'first_clip' | 'first_export' | 'clip_ready';

const CELEBRATION_KEY_PREFIX = 'alchify_celebrated_';

export function useConfetti() {
  // Check if this is the first time for an event
  const isFirstTime = (event: CelebrationEvent): boolean => {
    return !localStorage.getItem(`${CELEBRATION_KEY_PREFIX}${event}`);
  };

  // Mark event as celebrated
  const markCelebrated = (event: CelebrationEvent) => {
    localStorage.setItem(`${CELEBRATION_KEY_PREFIX}${event}`, 'true');
  };

  // Fire confetti burst
  const fireConfetti = () => {
    // Burst from left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 }
    });
    
    // Burst from right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 }
    });
  };

  // Fire stars
  const fireStars = () => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'] as confetti.Shape[],
      colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.3 }
    });

    confetti({
      ...defaults,
      particleCount: 20,
      scalar: 0.75,
      origin: { x: 0.5, y: 0.3 }
    });
  };

  // Celebrate an event (only fires confetti if first time)
  const celebrate = (event: CelebrationEvent, forceShow = false) => {
    if (forceShow || isFirstTime(event)) {
      if (!forceShow) {
        markCelebrated(event);
      }
      
      switch (event) {
        case 'first_upload':
          fireConfetti();
          setTimeout(fireStars, 200);
          break;
        case 'first_clip':
          fireStars();
          setTimeout(fireConfetti, 100);
          break;
        case 'first_export':
          fireConfetti();
          break;
        case 'clip_ready':
          // Smaller celebration for clip ready
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { x: 0.5, y: 0.7 }
          });
          break;
      }
    }
  };

  // Direct confetti trigger (always fires)
  const triggerConfetti = () => {
    fireConfetti();
  };

  return { celebrate, triggerConfetti, isFirstTime };
}

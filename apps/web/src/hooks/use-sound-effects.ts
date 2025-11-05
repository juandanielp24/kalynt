import { useCallback } from 'react';

const sounds = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  scan: '/sounds/beep.mp3',
  click: '/sounds/click.mp3',
};

export function useSoundEffects() {
  const play = useCallback((soundName: keyof typeof sounds) => {
    try {
      const audio = new Audio(sounds[soundName]);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors (autoplay policy, etc.)
      });
    } catch (error) {
      // Ignore errors
    }
  }, []);

  return { play };
}

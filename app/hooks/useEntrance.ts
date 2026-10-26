import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface EntranceOptions {
  /** Initial vertical offset in px (slides up to 0). */
  offset?: number;
  duration?: number;
  delay?: number;
  /** Re-run the entrance whenever this key changes. */
  resetKey?: string | number;
}

/**
 * Fade + slide-up entrance animation. Returns an animated style object that
 * can be spread onto an Animated.View.
 */
export function useEntrance({
  offset = 16,
  duration = 420,
  delay = 0,
  resetKey,
}: EntranceOptions = {}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, duration, delay, resetKey]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [offset, 0],
        }),
      },
    ],
  };
}

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Continuous looping 0->1->0 pulse, useful for glows and breathing halos.
 * Pass `active=false` to hold the animation still.
 */
export function usePulse(active = true, duration = 1600) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      value.stopAnimation();
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, value]);

  return value;
}

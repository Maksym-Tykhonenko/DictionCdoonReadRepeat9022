import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale to shrink to while pressed. */
  activeScale?: number;
}

/**
 * Pressable wrapper that adds a smooth spring press-in scale to any control,
 * giving every tappable surface a consistent tactile feel.
 */
export function PressBounce({
  children,
  style,
  activeScale = 0.96,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
    onPressIn?.(e);
  };

  const handleOut = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      disabled={disabled}
      {...rest}>
      <Animated.View
        style={[{ transform: [{ scale }], opacity: disabled ? 0.5 : 1 }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

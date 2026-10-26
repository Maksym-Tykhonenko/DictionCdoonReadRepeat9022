import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { PressBounce } from './PressBounce';
import { usePulse } from '../hooks/usePulse';
import { gradients, palette } from '../theme';

interface Props {
  children: React.ReactNode;
  onPress: () => void;
  size?: number;
  /** Pulsing glow halo (active playback / recording). */
  glowing?: boolean;
  accessibilityLabel?: string;
}

/** Large circular gradient control (play / pause / record). */
export function CircleControl({
  children,
  onPress,
  size = 72,
  glowing,
  accessibilityLabel,
}: Props) {
  const pulse = usePulse(!!glowing, 1500);
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={[styles.wrap, { width: size * 1.5, height: size * 1.5 }]}>
      {glowing ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
            },
          ]}
        />
      ) : null}
      <PressBounce
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.btn,
          { width: size, height: size, borderRadius: size / 2 },
        ]}>
        <LinearGradient
          colors={[...gradients.goldButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>{children}</View>
      </PressBounce>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: palette.goldMark,
  },
  btn: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.goldMark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { palette } from '../theme';

interface Props {
  active?: boolean;
  bars?: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Animated equalizer / soundwave bars (loader + recording states). */
export function SoundBars({
  active = true,
  bars = 5,
  color = palette.goldMark,
  height = 28,
  style,
}: Props) {
  const values = useRef(
    Array.from({ length: bars }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    if (!active) {
      values.forEach(v => {
        v.stopAnimation();
        Animated.timing(v, {
          toValue: 0.25,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      return;
    }
    const animations = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 360 + i * 70,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(v, {
            toValue: 0.3,
            duration: 320 + i * 60,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    animations.forEach((a, i) => setTimeout(() => a.start(), i * 90));
    return () => animations.forEach(a => a.stop());
  }, [active, values]);

  return (
    <View style={[styles.row, { height }, style]}>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: v.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.18, height],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: 4,
    marginHorizontal: 3,
    borderRadius: 3,
  },
});

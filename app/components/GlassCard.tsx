import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { gradients, palette, radius, space } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Highlighted border (used for active/selected cards). */
  active?: boolean;
  padded?: boolean;
}

/**
 * Glassmorphism surface: a soft violet gradient fill with a hairline border
 * and rounded corners. The gradient sits absolutely so children never clip.
 */
export function GlassCard({ children, style, active, padded = true }: Props) {
  return (
    <View
      style={[
        styles.card,
        { borderColor: active ? palette.goldMark : palette.hairline },
        active && styles.activeShadow,
        style,
      ]}>
      <LinearGradient
        colors={
          active
            ? ['rgba(58, 44, 116, 0.78)', 'rgba(28, 21, 64, 0.78)']
            : [...gradients.glassCard]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={padded ? styles.inner : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  inner: {
    padding: space.lg,
  },
  activeShadow: {
    shadowColor: palette.goldMark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
});

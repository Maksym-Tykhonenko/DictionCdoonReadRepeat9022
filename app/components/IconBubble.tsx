import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radius } from '../theme';

interface Props {
  children: React.ReactNode;
  /** Accent color used for tint + border. */
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function withAlpha(hex: string, alpha: number): string {
  // Supports #RRGGBB; falls back to the raw color for rgba() inputs.
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

/** Rounded square holder for an icon, tinted with an accent color. */
export function IconBubble({ children, color, size = 44, style }: Props) {
  return (
    <View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          backgroundColor: withAlpha(color, 0.16),
          borderColor: withAlpha(color, 0.4),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

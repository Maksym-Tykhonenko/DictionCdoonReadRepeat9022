import { StyleSheet, TextStyle } from 'react-native';
import { palette } from './palette';
import { fontFamily, fontWeight } from './metrics';

/** Shared text presets. Components compose these instead of redefining sizes. */
export const type = StyleSheet.create({
  display: {
    fontFamily,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: fontWeight.heavy,
    color: palette.textPrimary,
    letterSpacing: 0.2,
  },
  title: {
    fontFamily,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: fontWeight.bold,
    color: palette.textPrimary,
    letterSpacing: 0.2,
  },
  heading: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    color: palette.textPrimary,
  },
  body: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeight.regular,
    color: palette.textSecondary,
  },
  bodyStrong: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
    color: palette.textPrimary,
  },
  caption: {
    fontFamily,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: fontWeight.medium,
    color: palette.textMuted,
  },
  overline: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.textMuted,
  },
  label: {
    fontFamily,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
    color: palette.textPrimary,
  },
});

export type TypePreset = keyof typeof type;

export function withColor(base: TextStyle, color: string): TextStyle {
  return { ...base, color };
}

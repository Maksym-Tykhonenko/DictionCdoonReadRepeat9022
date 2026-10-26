import { StyleSheet } from 'react-native';
import { palette } from './palette';
import { radius, space } from './metrics';

/** Reusable structural styles shared by many screens/components. */
export const shared = StyleSheet.create({
  fill: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: palette.abyss,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Glass card surface
  glassPanel: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    overflow: 'hidden',
  },
  // Soft separator
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.hairlineSoft,
  },
  // Standard horizontal page gutter
  gutter: {
    paddingHorizontal: space.xl,
  },
  // Centered pill chip
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  // Floating dock card shadow
  dockShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
  },
  goldGlow: {
    shadowColor: palette.goldMark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  violetGlowShadow: {
    shadowColor: palette.neonViolet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});

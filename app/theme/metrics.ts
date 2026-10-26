import { Platform } from 'react-native';

/** Spacing scale (8pt-ish rhythm). */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Corner radii. */
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

/** Height of the floating tab dock; screens pad their scroll content by this. */
export const TAB_DOCK_HEIGHT = 64;

/** Extra breathing room so scroll content never hides behind the dock. */
export const SCROLL_BOTTOM_GAP = TAB_DOCK_HEIGHT + 48;

/** Platform-aware font family. No custom Exo font ships, so we lean on the
 *  cleanest system stack with strong weights to keep a premium feel. */
export const fontFamily = Platform.select({
  ios: undefined, // San Francisco
  android: 'sans-serif',
  default: undefined,
});

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

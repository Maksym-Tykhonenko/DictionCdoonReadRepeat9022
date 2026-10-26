import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_DOCK_HEIGHT, space } from '../theme';

/**
 * Bottom padding (px) needed so scroll/footer content clears the floating
 * dock on any device. The dock occupies its own height plus the safe-area
 * inset, so we add both plus a comfortable gap.
 */
export function useDockSpace(extra = space.xl): number {
  const insets = useSafeAreaInsets();
  return TAB_DOCK_HEIGHT + Math.max(insets.bottom, 10) + extra;
}

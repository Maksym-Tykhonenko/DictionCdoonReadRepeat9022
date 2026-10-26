import rawTips from '../../cordartio/voicetips';
import { sanitizeText } from '../utils/sanitize';
import { palette } from '../theme/palette';
import type { VoicePointer, VoicePointerIcon } from './types';

interface RawTip {
  id: number;
  icon: string;
  title: string;
  shortDescription: string;
  whyItWorks: string;
  practiceTask: string;
  bottomNote: string;
}

// Maps the source emoji to a lucide icon key + accent tint, keeping us off
// emoji glyphs and on crisp vector icons in the UI.
const ICON_BY_ID: Record<number, { icon: VoicePointerIcon; accent: string }> = {
  1: { icon: 'wind', accent: palette.sky },
  2: { icon: 'speech', accent: palette.neonViolet },
  3: { icon: 'pause', accent: palette.mint },
  4: { icon: 'turtle', accent: palette.amber },
  5: { icon: 'smile', accent: palette.mint },
  6: { icon: 'volume', accent: palette.goldMark },
  7: { icon: 'posture', accent: palette.sky },
  8: { icon: 'target', accent: palette.coral },
  9: { icon: 'mirror', accent: palette.rose },
  10: { icon: 'message', accent: palette.neonViolet },
  11: { icon: 'music', accent: palette.amber },
  12: { icon: 'droplet', accent: palette.sky },
  13: { icon: 'mic', accent: palette.goldMark },
  14: { icon: 'sparkle', accent: palette.rose },
  15: { icon: 'brain', accent: palette.neonViolet },
  16: { icon: 'flag', accent: palette.mint },
};

/** Sanitized voice tips with vector icons + accent colors. */
export const VOICE_POINTERS: VoicePointer[] = (rawTips as RawTip[]).map(item => {
  const mapped = ICON_BY_ID[item.id] ?? { icon: 'sparkle', accent: palette.goldMark };
  return {
    id: `tip-${item.id}`,
    icon: mapped.icon,
    accent: mapped.accent,
    title: sanitizeText(item.title),
    summary: sanitizeText(item.shortDescription),
    whyItWorks: sanitizeText(item.whyItWorks),
    practiceTask: sanitizeText(item.practiceTask),
    dailyNote: sanitizeText(item.bottomNote),
  };
});

/**
 * Color palette for the Diction practice experience.
 * Dark purple-black base, gold accents, soft neon violet cards.
 */

export const palette = {
  // Backdrop layers (deep purple -> near black)
  abyss: '#070512',
  midnight: '#0E0A22',
  twilight: '#161033',
  duskCard: '#1C1640',
  violetGlow: '#2A1F5C',

  // Gold accent family ("gold mark" / "voice crest")
  goldMark: '#E7C168',
  goldBright: '#F4D886',
  goldDeep: '#C99B3E',
  goldSoft: 'rgba(231, 193, 104, 0.16)',

  // Neon violet family
  neonViolet: '#7C5CFF',
  violetSoft: 'rgba(124, 92, 255, 0.18)',
  violetEdge: 'rgba(124, 92, 255, 0.42)',

  // Supporting hues for emotion tags / states
  mint: '#5BD8A8',
  mintSoft: 'rgba(91, 216, 168, 0.16)',
  coral: '#F47C8C',
  coralSoft: 'rgba(244, 124, 140, 0.16)',
  sky: '#6FB8FF',
  skySoft: 'rgba(111, 184, 255, 0.16)',
  amber: '#F2A65A',
  amberSoft: 'rgba(242, 166, 90, 0.16)',
  rose: '#D88BE0',
  roseSoft: 'rgba(216, 139, 224, 0.16)',

  // Text
  textPrimary: '#F6F3FF',
  textSecondary: '#C7BEE6',
  textMuted: '#8A82AE',
  textOnGold: '#241A07',

  // Lines / glass
  glassFill: 'rgba(40, 30, 84, 0.55)',
  glassFillSoft: 'rgba(40, 30, 84, 0.32)',
  hairline: 'rgba(124, 92, 255, 0.22)',
  hairlineSoft: 'rgba(198, 190, 230, 0.12)',

  // Feedback
  correct: '#5BD8A8',
  correctSoft: 'rgba(91, 216, 168, 0.14)',
  wrong: '#F4748A',
  wrongSoft: 'rgba(244, 116, 138, 0.14)',
} as const;

export type PaletteKey = keyof typeof palette;

/** Gradient stop presets used across the app. */
export const gradients = {
  screen: ['#0B0820', '#0A0718', '#070512'] as const,
  goldButton: ['#F4D886', '#E7C168', '#C99B3E'] as const,
  violetCard: ['rgba(44, 33, 96, 0.92)', 'rgba(24, 18, 56, 0.92)'] as const,
  glassCard: ['rgba(46, 35, 92, 0.66)', 'rgba(22, 16, 51, 0.66)'] as const,
  loaderHalo: ['rgba(124, 92, 255, 0.0)', 'rgba(124, 92, 255, 0.35)'] as const,
  heroFade: ['rgba(7, 5, 18, 0)', 'rgba(7, 5, 18, 0.7)', '#070512'] as const,
} as const;

/** Maps an emotion / difficulty label to a tinted accent pair. */
export function accentForLabel(label: string): { fg: string; bg: string } {
  const key = label.toLowerCase();
  if (['easy', 'calm', 'soft', 'thoughtful', 'sincere', 'clear'].includes(key)) {
    return { fg: palette.mint, bg: palette.mintSoft };
  }
  if (['medium', 'excited', 'happy', 'playful', 'joyful', 'triumphant'].includes(key)) {
    return { fg: palette.amber, bg: palette.amberSoft };
  }
  if (['hard', 'dramatic', 'serious', 'powerful', 'determined'].includes(key)) {
    return { fg: palette.coral, bg: palette.coralSoft };
  }
  if (['mysterious', 'focused', 'curious', 'emotional'].includes(key)) {
    return { fg: palette.rose, bg: palette.roseSoft };
  }
  if (['confident', 'professional', 'motivating', 'inspiring', 'proud'].includes(key)) {
    return { fg: palette.goldMark, bg: palette.goldSoft };
  }
  return { fg: palette.sky, bg: palette.skySoft };
}

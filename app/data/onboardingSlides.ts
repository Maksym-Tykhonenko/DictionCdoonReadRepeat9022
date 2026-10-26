import type { OnboardingSlide } from './types';

// Ambient onboarding backdrops (used softly behind a dark gradient overlay).
const bgA = require('../../aodkagaims/sorbrogs/onbel1.png');
const bgB = require('../../aodkagaims/sorbrogs/onbel2.png');
const bgC = require('../../aodkagaims/sorbrogs/onbel3.png');

/** Five-slide intro journey. Copy is localized via `onboarding.<key>.*`. */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  { key: 'twister', background: bgA, glyph: 'twister' },
  { key: 'emotion', background: bgB, glyph: 'emotion' },
  { key: 'tips', background: bgC, glyph: 'tips' },
  { key: 'quiz', background: bgA, glyph: 'quiz' },
  { key: 'game', background: bgB, glyph: 'game' },
];

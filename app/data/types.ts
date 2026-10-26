/** Shared domain types for the practice content. */

import type { LanguageCode } from '../i18n';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TwisterEntry {
  id: string;
  title: string;
  difficulty: Difficulty;
  text: string;
  /** Locally-authored twisters are flagged so they can be edited/removed. */
  custom?: boolean;
  /** Language the twister is written in (drives speech recognition). */
  lang?: LanguageCode;
}

export interface ReadingChunk {
  cue: string;
  text: string;
}

export interface EmotionScript {
  id: string;
  title: string;
  description: string;
  emotions: string[];
  chunks: ReadingChunk[];
}

export type VoicePointerIcon =
  | 'wind'
  | 'speech'
  | 'pause'
  | 'turtle'
  | 'smile'
  | 'volume'
  | 'posture'
  | 'target'
  | 'mirror'
  | 'message'
  | 'music'
  | 'droplet'
  | 'mic'
  | 'sparkle'
  | 'brain'
  | 'flag';

export interface VoicePointer {
  id: string;
  icon: VoicePointerIcon;
  title: string;
  summary: string;
  whyItWorks: string;
  practiceTask: string;
  dailyNote: string;
  accent: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface OnboardingSlide {
  /** Copy lives in i18n under `onboarding.<key>.*`. */
  key: 'twister' | 'emotion' | 'tips' | 'quiz' | 'game';
  background: number; // require() asset
  glyph: 'twister' | 'emotion' | 'tips' | 'quiz' | 'game';
}

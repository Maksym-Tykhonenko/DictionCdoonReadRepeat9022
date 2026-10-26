import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TwisterEntry } from '../data/types';
import type { LanguageCode } from '../i18n';

/** Namespaced persistence keys (unique to this app's storage surface). */
const KEY = {
  intro: 'dcrr.intro.completed.v1',
  savedTwisters: 'dcrr.twisters.saved.v1',
  customTwisters: 'dcrr.twisters.custom.v1',
  readDone: 'dcrr.reading.completed.v1',
  quizScore: 'dcrr.quiz.score.v1',
  language: 'dcrr.language.v1',
  twisterBest: 'dcrr.twisters.best.v1',
  speeches: 'dcrr.speeches.v1',
  progress: 'dcrr.progress.v1',
} as const;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage failures are non-fatal; the in-memory state still drives the UI.
  }
}

export interface QuizScoreRecord {
  bestCorrect: number;
  bestTotal: number;
  latestCorrect: number;
  latestTotal: number;
}

export interface RehearsalAttempt {
  at: number;
  duration: number;
  wpm: number;
  fillerTotal: number;
  coverage: number;
}

export interface SpeechDraft {
  id: string;
  title: string;
  text: string;
  /** Language the speech is delivered in (speech recognition + fillers). */
  lang: LanguageCode;
  updatedAt: number;
  /** Most recent first, capped. */
  attempts: RehearsalAttempt[];
}

export interface ProgressRecord {
  streak: number;
  bestStreak: number;
  /** dayKey of the last day with any practice. */
  lastPracticeDay: string | null;
  /** dayKeys on which the daily challenge was completed (recent only). */
  dailyDone: string[];
  reminderEnabled: boolean;
  reminderHour: number;
}

export const DEFAULT_PROGRESS: ProgressRecord = {
  streak: 0,
  bestStreak: 0,
  lastPracticeDay: null,
  dailyDone: [],
  reminderEnabled: false,
  reminderHour: 19,
};

export const vault = {
  // --- onboarding ---
  getIntroDone: () => readJSON<boolean>(KEY.intro, false),
  setIntroDone: () => writeJSON(KEY.intro, true),

  // --- saved twister ids ---
  getSavedTwisters: () => readJSON<string[]>(KEY.savedTwisters, []),
  setSavedTwisters: (ids: string[]) => writeJSON(KEY.savedTwisters, ids),

  // --- custom twisters ---
  getCustomTwisters: () => readJSON<TwisterEntry[]>(KEY.customTwisters, []),
  setCustomTwisters: (items: TwisterEntry[]) =>
    writeJSON(KEY.customTwisters, items),

  // --- reading completion ---
  getReadingDone: () => readJSON<string[]>(KEY.readDone, []),
  setReadingDone: (ids: string[]) => writeJSON(KEY.readDone, ids),

  // --- quiz score ---
  getQuizScore: () =>
    readJSON<QuizScoreRecord | null>(KEY.quizScore, null),
  setQuizScore: (record: QuizScoreRecord) => writeJSON(KEY.quizScore, record),

  // --- interface / content language ---
  getLanguage: () => readJSON<string | null>(KEY.language, null),
  setLanguage: (code: string) => writeJSON(KEY.language, code),

  // --- best pronunciation accuracy per twister id ---
  getTwisterBest: () => readJSON<Record<string, number>>(KEY.twisterBest, {}),
  setTwisterBest: (map: Record<string, number>) => writeJSON(KEY.twisterBest, map),

  // --- speech rehearsal drafts ---
  getSpeeches: () => readJSON<SpeechDraft[]>(KEY.speeches, []),
  setSpeeches: (items: SpeechDraft[]) => writeJSON(KEY.speeches, items),

  // --- streak / daily challenge / reminders ---
  getProgress: async (): Promise<ProgressRecord> => ({
    ...DEFAULT_PROGRESS,
    ...(await readJSON<Partial<ProgressRecord>>(KEY.progress, {})),
  }),
  setProgress: (record: ProgressRecord) => writeJSON(KEY.progress, record),
};

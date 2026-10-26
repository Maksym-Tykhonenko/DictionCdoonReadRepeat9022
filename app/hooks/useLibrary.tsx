import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { twisterDeckFor } from '../data/twisterDeck';
import { useI18n } from '../i18n';
import type { TwisterEntry } from '../data/types';
import { vault, type QuizScoreRecord } from '../storage/vault';

interface LibraryValue {
  ready: boolean;
  introDone: boolean;
  completeIntro: () => void;

  /** Seed deck + locally authored twisters (custom first). */
  twisters: TwisterEntry[];
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  addCustomTwister: (entry: Omit<TwisterEntry, 'id' | 'custom' | 'lang'>) => void;
  removeCustomTwister: (id: string) => void;

  /** Best pronunciation accuracy (0-100) per twister id. */
  twisterBest: Record<string, number>;
  /** Stores a pronunciation score; returns true when it is a new best. */
  recordTwisterScore: (id: string, accuracy: number) => boolean;

  readingDoneIds: string[];
  isReadingDone: (id: string) => boolean;
  markReadingDone: (id: string) => void;

  quizScore: QuizScoreRecord | null;
  recordQuiz: (correct: number, total: number) => void;
}

const LibraryContext = createContext<LibraryValue | null>(null);

let localCounter = 0;
function nextCustomId(): string {
  localCounter += 1;
  return `custom-${Date.now().toString(36)}-${localCounter}`;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [customTwisters, setCustomTwisters] = useState<TwisterEntry[]>([]);
  const [readingDoneIds, setReadingDoneIds] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<QuizScoreRecord | null>(null);
  const [twisterBest, setTwisterBest] = useState<Record<string, number>>({});

  // Hydrate from storage once.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [intro, saved, custom, reading, score, best] = await Promise.all([
        vault.getIntroDone(),
        vault.getSavedTwisters(),
        vault.getCustomTwisters(),
        vault.getReadingDone(),
        vault.getQuizScore(),
        vault.getTwisterBest(),
      ]);
      if (!alive) {
        return;
      }
      setIntroDone(intro);
      setSavedIds(saved);
      setCustomTwisters(custom);
      setReadingDoneIds(reading);
      setQuizScore(score);
      setTwisterBest(best);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const completeIntro = useCallback(() => {
    setIntroDone(true);
    void vault.setIntroDone();
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      void vault.setSavedTwisters(next);
      return next;
    });
  }, []);

  const addCustomTwister = useCallback(
    (entry: Omit<TwisterEntry, 'id' | 'custom' | 'lang'>) => {
      setCustomTwisters(prev => {
        const next: TwisterEntry[] = [
          { ...entry, id: nextCustomId(), custom: true, lang },
          ...prev,
        ];
        void vault.setCustomTwisters(next);
        return next;
      });
    },
    [lang],
  );

  const recordTwisterScore = useCallback(
    (id: string, accuracy: number) => {
      const previous = twisterBest[id];
      if (previous !== undefined && previous >= accuracy) {
        return false;
      }
      const next = { ...twisterBest, [id]: accuracy };
      setTwisterBest(next);
      void vault.setTwisterBest(next);
      return true;
    },
    [twisterBest],
  );

  const removeCustomTwister = useCallback((id: string) => {
    setCustomTwisters(prev => {
      const next = prev.filter(t => t.id !== id);
      void vault.setCustomTwisters(next);
      return next;
    });
    setSavedIds(prev => {
      if (!prev.includes(id)) {
        return prev;
      }
      const next = prev.filter(x => x !== id);
      void vault.setSavedTwisters(next);
      return next;
    });
  }, []);

  const markReadingDone = useCallback((id: string) => {
    setReadingDoneIds(prev => {
      if (prev.includes(id)) {
        return prev;
      }
      const next = [...prev, id];
      void vault.setReadingDone(next);
      return next;
    });
  }, []);

  const recordQuiz = useCallback(
    (correct: number, total: number) => {
      setQuizScore(prev => {
        const record: QuizScoreRecord = {
          bestCorrect:
            prev && prev.bestCorrect / Math.max(prev.bestTotal, 1) >=
            correct / Math.max(total, 1)
              ? prev.bestCorrect
              : correct,
          bestTotal:
            prev && prev.bestCorrect / Math.max(prev.bestTotal, 1) >=
            correct / Math.max(total, 1)
              ? prev.bestTotal
              : total,
          latestCorrect: correct,
          latestTotal: total,
        };
        void vault.setQuizScore(record);
        return record;
      });
    },
    [],
  );

  // Custom twisters always show; the built-in deck follows the UI language.
  const twisters = useMemo(
    () => [...customTwisters, ...twisterDeckFor(lang)],
    [customTwisters, lang],
  );

  const value = useMemo<LibraryValue>(
    () => ({
      ready,
      introDone,
      completeIntro,
      twisters,
      savedIds,
      isSaved: (id: string) => savedIds.includes(id),
      toggleSaved,
      addCustomTwister,
      removeCustomTwister,
      twisterBest,
      recordTwisterScore,
      readingDoneIds,
      isReadingDone: (id: string) => readingDoneIds.includes(id),
      markReadingDone,
      quizScore,
      recordQuiz,
    }),
    [
      ready,
      introDone,
      completeIntro,
      twisters,
      savedIds,
      toggleSaved,
      addCustomTwister,
      removeCustomTwister,
      twisterBest,
      recordTwisterScore,
      readingDoneIds,
      markReadingDone,
      quizScore,
      recordQuiz,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used inside a LibraryProvider');
  }
  return ctx;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { DEFAULT_PROGRESS, vault, type ProgressRecord } from '../storage/vault';
import { Reminders, type ReminderItem } from '../native/reminders';
import { twisterDeckFor } from '../data/twisterDeck';
import { addDays, dayKey, dayNumber, daysBetween } from '../utils/days';
import { useI18n } from '../i18n';
import type { TwisterEntry } from '../data/types';

export const REMINDER_HOURS = [8, 12, 18, 21] as const;
const REMINDER_DAYS_AHEAD = 7;

interface ProgressValue {
  /** Streak as shown today (0 once a day was missed). */
  streak: number;
  bestStreak: number;
  practicedToday: boolean;
  dailyTwister: TwisterEntry | null;
  dailyDoneToday: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  /** Marks today as practiced (any check, game round or rehearsal). */
  recordPractice: () => void;
  completeDaily: () => void;
  /** Returns false when notification permission was refused. */
  setReminder: (enabled: boolean, hour?: number) => Promise<boolean>;
}

const ProgressContext = createContext<ProgressValue | null>(null);

function withPractice(record: ProgressRecord, today: string): ProgressRecord {
  if (record.lastPracticeDay === today) {
    return record;
  }
  const continues =
    record.lastPracticeDay !== null && daysBetween(record.lastPracticeDay, today) === 1;
  const streak = continues ? record.streak + 1 : 1;
  return {
    ...record,
    streak,
    bestStreak: Math.max(record.bestStreak, streak),
    lastPracticeDay: today,
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { lang, t } = useI18n();
  const [record, setRecord] = useState<ProgressRecord>(DEFAULT_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(dayKey);

  useEffect(() => {
    let alive = true;
    vault.getProgress().then(stored => {
      if (alive) {
        setRecord(stored);
        setLoaded(true);
      }
    });
    // Roll the day over when the app comes back to the foreground.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setToday(dayKey());
      }
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const update = useCallback((fn: (prev: ProgressRecord) => ProgressRecord) => {
    setRecord(prev => {
      const next = fn(prev);
      if (next !== prev) {
        void vault.setProgress(next);
      }
      return next;
    });
  }, []);

  const recordPractice = useCallback(() => {
    update(prev => withPractice(prev, dayKey()));
  }, [update]);

  const completeDaily = useCallback(() => {
    const day = dayKey();
    update(prev => {
      const practiced = withPractice(prev, day);
      if (practiced.dailyDone.includes(day)) {
        return practiced;
      }
      return { ...practiced, dailyDone: [day, ...practiced.dailyDone].slice(0, 30) };
    });
  }, [update]);

  const setReminder = useCallback(
    async (enabled: boolean, hour?: number) => {
      if (enabled) {
        const granted = await Reminders.requestPermission().catch(() => false);
        if (!granted) {
          update(prev => ({ ...prev, reminderEnabled: false }));
          return false;
        }
      }
      update(prev => ({
        ...prev,
        reminderEnabled: enabled,
        reminderHour: hour ?? prev.reminderHour,
      }));
      return true;
    },
    [update],
  );

  const lastDay = record.lastPracticeDay;
  const practicedToday = lastDay === today;
  const streak =
    lastDay !== null && daysBetween(lastDay, today) <= 1 ? record.streak : 0;

  const dailyTwister = useMemo(() => {
    const deck = twisterDeckFor(lang);
    return deck.length ? deck[dayNumber(today) % deck.length] : null;
  }, [lang, today]);

  // Keep the next week of reminders in sync with the streak + language.
  useEffect(() => {
    if (!loaded) {
      return;
    }
    if (!record.reminderEnabled) {
      void Reminders.cancelAll().catch(() => {});
      return;
    }
    const now = new Date();
    const items: ReminderItem[] = [];
    for (let d = 0; d < REMINDER_DAYS_AHEAD; d++) {
      if (d === 0 && practicedToday) {
        continue;
      }
      const at = addDays(now, d);
      at.setHours(record.reminderHour, 0, 0, 0);
      if (at.getTime() <= now.getTime()) {
        continue;
      }
      // Streak still alive on that day only if practice continues daily;
      // we show the count the user would protect by practicing then.
      const atRisk = d === 0 ? streak : d === 1 && practicedToday ? streak : 0;
      items.push({
        id: dayKey(at),
        timestamp: at.getTime(),
        title: 'Diction Crown',
        body:
          atRisk > 0
            ? t('reminder.bodyStreak', { n: atRisk })
            : t('reminder.bodyStart'),
      });
    }
    void Reminders.schedule(items).catch(() => {});
  }, [loaded, record.reminderEnabled, record.reminderHour, practicedToday, streak, t]);

  const value = useMemo<ProgressValue>(
    () => ({
      streak,
      bestStreak: record.bestStreak,
      practicedToday,
      dailyTwister,
      dailyDoneToday: record.dailyDone.includes(today),
      reminderEnabled: record.reminderEnabled,
      reminderHour: record.reminderHour,
      recordPractice,
      completeDaily,
      setReminder,
    }),
    [streak, record, practicedToday, dailyTwister, today, recordPractice, completeDaily, setReminder],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used inside a ProgressProvider');
  }
  return ctx;
}

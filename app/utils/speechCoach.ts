/**
 * Speech rehearsal analysis: pace, filler words, script coverage and long
 * pauses. Pure functions over the transcript + loudness envelope.
 */

import type { LanguageCode } from '../i18n';
import { alignWords, normalizeWords } from './similarity';

/**
 * Filler words / phrases per language, already in normalizeWords() form
 * (lower-case, no accents). Note: Apple's recogniser often drops pure
 * hesitation sounds ("um", "äh"), so word fillers are the reliable signal.
 */
export const FILLERS: Record<LanguageCode, string[]> = {
  en: ['um', 'uh', 'erm', 'er', 'hmm', 'like', 'you know', 'i mean', 'basically', 'actually', 'literally', 'kind of', 'sort of', 'so yeah', 'right'],
  uk: ['е', 'ее', 'еее', 'м', 'мм', 'ну', 'типу', 'тіпа', 'ніби', 'наче', 'короче', 'як би', 'значить', 'так би мовити', 'власне', 'взагалі то', 'отже', 'загалом'],
  es: ['eh', 'em', 'mm', 'este', 'o sea', 'bueno', 'pues', 'tipo', 'en plan', 'digamos', 'vale', 'sabes', 'nada'],
  de: ['ah', 'ahm', 'hm', 'halt', 'eigentlich', 'sozusagen', 'quasi', 'irgendwie', 'genau', 'also', 'ne', 'oder so'],
  pt: ['hum', 'tipo', 'ne', 'entao', 'ai', 'assim', 'sabe', 'basicamente', 'tipo assim', 'na verdade'],
};

export interface FillerCount {
  phrase: string;
  count: number;
}

/** Counts filler phrases, preferring longer phrases when they overlap. */
export function countFillers(words: string[], lang: LanguageCode): FillerCount[] {
  const phrases = FILLERS[lang]
    .map(p => p.split(' '))
    .sort((a, b) => b.length - a.length);
  const counts = new Map<string, number>();
  let i = 0;
  while (i < words.length) {
    let matched = 0;
    for (const parts of phrases) {
      if (parts.every((w, k) => words[i + k] === w)) {
        const key = parts.join(' ');
        counts.set(key, (counts.get(key) ?? 0) + 1);
        matched = parts.length;
        break;
      }
    }
    i += matched || 1;
  }
  return [...counts.entries()]
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count);
}

export interface PauseStats {
  /** Pauses longer than `minSeconds` between speech. */
  count: number;
  longest: number;
}

/** Finds quiet stretches inside speech (leading/trailing silence ignored). */
export function findPauses(
  envelope: number[],
  durationSec: number,
  minSeconds = 2,
  threshold = 0.08,
): PauseStats {
  if (envelope.length < 2 || durationSec <= 0) {
    return { count: 0, longest: 0 };
  }
  const binSec = durationSec / envelope.length;
  let start = 0;
  let end = envelope.length - 1;
  while (start < end && envelope[start] < threshold) {
    start++;
  }
  while (end > start && envelope[end] < threshold) {
    end--;
  }
  let count = 0;
  let longest = 0;
  let run = 0;
  for (let i = start; i <= end; i++) {
    if (envelope[i] < threshold) {
      run++;
    } else {
      const secs = run * binSec;
      if (secs >= minSeconds) {
        count++;
      }
      longest = Math.max(longest, secs);
      run = 0;
    }
  }
  return { count, longest: Math.round(longest * 10) / 10 };
}

export type PaceVerdict = 'slow' | 'good' | 'fast';

/** Comfortable presentation pace is roughly 120–160 words per minute. */
export function paceVerdict(wpm: number): PaceVerdict {
  if (wpm < 110) {
    return 'slow';
  }
  if (wpm > 170) {
    return 'fast';
  }
  return 'good';
}

export interface RehearsalReport {
  duration: number;
  wordsSpoken: number;
  wpm: number;
  pace: PaceVerdict;
  fillers: FillerCount[];
  fillerTotal: number;
  fillersPerMinute: number;
  /** 0..100: share of the script that was actually said. */
  coverage: number;
  pauses: PauseStats;
}

export function analyzeRehearsal(input: {
  script: string;
  transcript: string;
  duration: number;
  envelope: number[];
  lang: LanguageCode;
}): RehearsalReport {
  const spoken = normalizeWords(input.transcript);
  const target = normalizeWords(input.script);
  const minutes = input.duration / 60;
  const wpm = minutes > 0 ? Math.round(spoken.length / minutes) : 0;
  const fillers = countFillers(spoken, input.lang);
  const fillerTotal = fillers.reduce((sum, f) => sum + f.count, 0);
  const verdicts = target.length ? alignWords(target, spoken) : [];
  const said = verdicts.filter(v => v !== 'miss').length;
  return {
    duration: input.duration,
    wordsSpoken: spoken.length,
    wpm,
    pace: paceVerdict(wpm),
    fillers,
    fillerTotal,
    fillersPerMinute: minutes > 0 ? Math.round((fillerTotal / minutes) * 10) / 10 : 0,
    coverage: target.length ? Math.round((said / target.length) * 100) : 0,
    pauses: findPauses(input.envelope, input.duration),
  };
}

/**
 * Advances the teleprompter position from the live transcript. Only a window
 * around the current position is aligned against the latest spoken words,
 * so this stays cheap on every partial result.
 */
export function advanceScriptPosition(
  scriptWords: string[],
  transcript: string,
  current: number,
): number {
  const spoken = normalizeWords(transcript).slice(-40);
  if (!spoken.length) {
    return current;
  }
  const from = Math.max(0, current - 10);
  const to = Math.min(scriptWords.length, current + 25);
  const verdicts = alignWords(scriptWords.slice(from, to), spoken);
  for (let i = verdicts.length - 1; i >= 0; i--) {
    if (verdicts[i] !== 'miss') {
      return Math.max(current, from + i + 1);
    }
  }
  return current;
}

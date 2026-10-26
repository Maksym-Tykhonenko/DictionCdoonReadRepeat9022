/**
 * Scoring helpers for pronunciation checks and the Reverse Voice Game.
 * Pure functions so they can be unit-tested without native audio.
 */

const PUNCTUATION = /[.,!?;:"“”„«»()[\]{}…–—\-_/\\*¿¡]/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lower-cases, strips punctuation + accents, and splits into words. */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[’`]/g, "'")
    .replace(PUNCTUATION, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (!a.length) {
    return b.length;
  }
  if (!b.length) {
    return a.length;
  }
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 0..1 similarity based on edit distance. */
export function stringSimilarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) {
    return 1;
  }
  return 1 - levenshtein(a, b) / max;
}

export type WordVerdict = 'hit' | 'close' | 'miss';

const HIT = 0.8;
const CLOSE = 0.55;

/**
 * Aligns spoken words to target words (weighted LCS) and returns a verdict per
 * target word, so the UI can colour the original phrase.
 */
export function alignWords(target: string[], spoken: string[]): WordVerdict[] {
  const n = target.length;
  const m = spoken.length;
  const score: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  const sim: number[][] = Array.from({ length: n }, (_, i) =>
    spoken.map(s => stringSimilarity(target[i], s)),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const s = sim[i - 1][j - 1];
      const diag = s >= CLOSE ? score[i - 1][j - 1] + s : -Infinity;
      score[i][j] = Math.max(score[i - 1][j], score[i][j - 1], diag);
    }
  }
  const verdicts: WordVerdict[] = Array(n).fill('miss');
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const s = sim[i - 1][j - 1];
    if (s >= CLOSE && score[i][j] === score[i - 1][j - 1] + s) {
      verdicts[i - 1] = s >= HIT ? 'hit' : 'close';
      i--;
      j--;
    } else if (score[i - 1][j] >= score[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return verdicts;
}

export interface PronunciationReport {
  verdicts: WordVerdict[];
  /** 0..100 */
  accuracy: number;
  /** Words per minute based on recognised words. */
  wpm: number;
  hits: number;
  close: number;
  misses: number;
}

export function scorePronunciation(
  targetText: string,
  spokenText: string,
  durationSec: number,
): PronunciationReport {
  const target = normalizeWords(targetText);
  const spoken = normalizeWords(spokenText);
  const verdicts = alignWords(target, spoken);
  const hits = verdicts.filter(v => v === 'hit').length;
  const close = verdicts.filter(v => v === 'close').length;
  const misses = verdicts.length - hits - close;
  // Extra words the speaker added cost a little, so mumbling a long stream
  // of guesses can't reach 100%.
  const extra = Math.max(0, spoken.length - target.length);
  const raw = target.length ? (hits + close * 0.5 - extra * 0.25) / target.length : 0;
  const accuracy = Math.round(Math.min(1, Math.max(0, raw)) * 100);
  const minutes = durationSec / 60;
  const wpm = minutes > 0 ? Math.round(spoken.length / minutes) : 0;
  return { verdicts, accuracy, wpm, hits, close, misses };
}

/** Drops quiet edges so leading/trailing silence doesn't skew comparisons. */
export function trimEnvelope(env: number[], threshold = 0.12): number[] {
  let start = 0;
  let end = env.length - 1;
  while (start < end && env[start] < threshold) {
    start++;
  }
  while (end > start && env[end] < threshold) {
    end--;
  }
  return env.slice(start, end + 1);
}

export function resample(values: number[], size: number): number[] {
  if (values.length === 0) {
    return Array(size).fill(0);
  }
  if (values.length === 1) {
    return Array(size).fill(values[0]);
  }
  const out: number[] = [];
  for (let i = 0; i < size; i++) {
    const pos = (i / (size - 1)) * (values.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(values.length - 1, lo + 1);
    const t = pos - lo;
    out.push(values[lo] * (1 - t) + values[hi] * t);
  }
  return out;
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) {
    return 0;
  }
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

/**
 * 0..100 "rhythm" similarity of two loudness envelopes: trims silence,
 * stretches both to the same length, and takes the best correlation over a
 * small time shift.
 */
export function envelopeSimilarity(a: number[], b: number[]): number {
  const size = 48;
  const ta = resample(trimEnvelope(a), size);
  const tb = resample(trimEnvelope(b), size);
  let best = -1;
  for (let shift = -4; shift <= 4; shift++) {
    const xa = shift >= 0 ? ta.slice(shift) : ta.slice(0, size + shift);
    const xb = shift >= 0 ? tb.slice(0, size - shift) : tb.slice(-shift);
    best = Math.max(best, pearson(xa, xb));
  }
  // Map correlation (-0.2..1) onto 0..100.
  const mapped = (best + 0.2) / 1.2;
  return Math.round(Math.min(1, Math.max(0, mapped)) * 100);
}

export interface ReverseScore {
  total: number;
  /** Null when either transcript was empty. */
  words: number | null;
  rhythm: number;
}

/**
 * Scores how close the flipped-back attempt is to the original phrase:
 * transcript similarity when speech recognition heard both, plus loudness
 * rhythm and a duration-match factor.
 */
export function scoreReverseAttempt(input: {
  originalTranscript: string;
  attemptTranscript: string;
  originalEnvelope: number[];
  attemptEnvelope: number[];
  originalDuration: number;
  attemptDuration: number;
}): ReverseScore {
  const rhythmRaw = envelopeSimilarity(input.originalEnvelope, input.attemptEnvelope);
  const longer = Math.max(input.originalDuration, input.attemptDuration, 0.01);
  const shorter = Math.min(input.originalDuration, input.attemptDuration);
  const durationFactor = Math.sqrt(shorter / longer);
  const rhythm = Math.round(rhythmRaw * (0.6 + 0.4 * durationFactor));

  const a = normalizeWords(input.originalTranscript).join('');
  const b = normalizeWords(input.attemptTranscript).join('');
  const words = a && b ? Math.round(stringSimilarity(a, b) * 100) : null;

  const total = words === null ? rhythm : Math.round(words * 0.6 + rhythm * 0.4);
  return { total, words, rhythm };
}

/** Lightweight text helpers used by the practice / reading flows. */

export interface SpokenToken {
  word: string;
  /** True for pure-whitespace gaps that should not be highlighted. */
  isSpace: boolean;
}

/**
 * Splits a phrase into word tokens (keeping spacing) so a practice screen can
 * highlight one word at a time without losing the original layout.
 */
export function tokenizeWords(phrase: string): SpokenToken[] {
  const matches = phrase.match(/\S+|\s+/g) ?? [];
  return matches.map(chunk => ({
    word: chunk,
    isSpace: /^\s+$/.test(chunk),
  }));
}

/** Returns only the speakable (non-space) token indexes. */
export function speakableIndexes(tokens: SpokenToken[]): number[] {
  const result: number[] = [];
  tokens.forEach((t, i) => {
    if (!t.isSpace) {
      result.push(i);
    }
  });
  return result;
}

/** Pluralises a count with a unit, e.g. plural(1, 'twister') -> "1 twister". */
export function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** Clamps a number to a range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Fisher–Yates shuffle returning a new array (non-mutating). */
export function shuffled<T>(input: readonly T[]): T[] {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Stable id generator for locally-created records. */
export function makeLocalId(prefix = 'local'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

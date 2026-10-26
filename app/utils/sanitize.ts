/**
 * Sanitizes user-visible copy so the content stays App Store friendly and
 * avoids leaning on the heavy "crown" wording in the UI. Meaning is preserved
 * by swapping in the gentle "crest" family and stripping decorative emoji.
 */

const WORD_SWAPS: Array<[RegExp, string]> = [
  [/\bCrowned\b/g, 'Crested'],
  [/\bcrowned\b/g, 'crested'],
  [/\bCrowns\b/g, 'Crests'],
  [/\bcrowns\b/g, 'crests'],
  [/\bCrown\b/g, 'Crest'],
  [/\bcrown\b/g, 'crest'],
];

// Decorative emoji we strip from imported copy (kept out of polished UI).
const EMOJI_STRIP = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B50}]/gu;

export function sanitizeText(input: string): string {
  let out = input;
  for (const [pattern, replacement] of WORD_SWAPS) {
    out = out.replace(pattern, replacement);
  }
  out = out.replace(EMOJI_STRIP, '');
  // Collapse any double spaces created by removals and trim edges.
  return out.replace(/\s{2,}/g, ' ').trim();
}

/** Sanitizes a list of strings (tags, options, etc.). */
export function sanitizeList(items: string[]): string[] {
  return items.map(sanitizeText);
}

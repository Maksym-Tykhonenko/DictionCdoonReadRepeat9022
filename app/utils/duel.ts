/**
 * Tongue-twister duels shared as a short code (and a dictioncrown:// link).
 * Only built-in twisters can be duelled, since the code carries just the id.
 *
 *   seed-12 / 87%  ->  DC-EN12-87
 *   uk-5    / 64%  ->  DC-UK5-64
 */

import type { LanguageCode } from '../i18n';

export interface DuelChallenge {
  twisterId: string;
  lang: LanguageCode;
  score: number;
  code: string;
}

const PREFIX_BY_LANG: Record<LanguageCode, string> = {
  en: 'seed',
  uk: 'uk',
  es: 'es',
  de: 'de',
  pt: 'pt',
};

export const DUEL_SCHEME = 'dictioncrown://duel';

export function encodeDuel(twisterId: string, score: number): string | null {
  const match = /^(seed|uk|es|de|pt)-(\d+)$/.exec(twisterId);
  if (!match) {
    return null;
  }
  const lang = match[1] === 'seed' ? 'EN' : match[1].toUpperCase();
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  return `DC-${lang}${match[2]}-${pct}`;
}

export function duelLink(code: string): string {
  return `${DUEL_SCHEME}?c=${code}`;
}

/** Accepts a bare code, text containing one, or a dictioncrown:// link. */
export function parseDuel(input: string): DuelChallenge | null {
  const match = /DC-(EN|UK|ES|DE|PT)(\d{1,4})-(\d{1,3})/i.exec(input);
  if (!match) {
    return null;
  }
  const lang = match[1].toLowerCase() as LanguageCode;
  const score = Number(match[3]);
  if (score > 100) {
    return null;
  }
  return {
    lang,
    twisterId: `${PREFIX_BY_LANG[lang]}-${Number(match[2])}`,
    score,
    code: `DC-${match[1].toUpperCase()}${Number(match[2])}-${score}`,
  };
}

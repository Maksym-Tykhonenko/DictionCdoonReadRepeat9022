import rawTwisters from '../../cordartio/tongueTwisters';
import rawPacks from '../../cordartio/twisterPacks';
import { sanitizeText } from '../utils/sanitize';
import type { LanguageCode } from '../i18n';
import type { Difficulty, TwisterEntry } from './types';

interface RawTwister {
  id: number;
  title: string;
  difficulty: string;
  text: string;
}

function normalizeDifficulty(value: string): Difficulty {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') {
    return value;
  }
  return 'Medium';
}

function buildDeck(items: RawTwister[], lang: LanguageCode, idPrefix: string): TwisterEntry[] {
  return items.map(item => ({
    id: `${idPrefix}-${item.id}`,
    title: sanitizeText(item.title),
    difficulty: normalizeDifficulty(item.difficulty),
    text: sanitizeText(item.text),
    custom: false,
    lang,
  }));
}

/** Curated, sanitized English deck sourced from the content pack. */
export const TWISTER_DECK: TwisterEntry[] = buildDeck(
  rawTwisters as RawTwister[],
  'en',
  'seed',
);

const PACKS = rawPacks as Record<Exclude<LanguageCode, 'en'>, RawTwister[]>;

const DECKS: Record<LanguageCode, TwisterEntry[]> = {
  en: TWISTER_DECK,
  uk: buildDeck(PACKS.uk, 'uk', 'uk'),
  es: buildDeck(PACKS.es, 'es', 'es'),
  de: buildDeck(PACKS.de, 'de', 'de'),
  pt: buildDeck(PACKS.pt, 'pt', 'pt'),
};

/** The built-in twister deck for a language. */
export function twisterDeckFor(lang: LanguageCode): TwisterEntry[] {
  return DECKS[lang] ?? TWISTER_DECK;
}

export const DIFFICULTY_FILTERS: Array<'All' | Difficulty> = [
  'All',
  'Easy',
  'Medium',
  'Hard',
];

export const DIFFICULTY_CHOICES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

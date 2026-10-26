import rawEmotion from '../../cordartio/emotionReading';
import { sanitizeText } from '../utils/sanitize';
import type { EmotionScript } from './types';

interface RawChunk {
  staticHint: string;
  readableText: string;
}

interface RawEmotion {
  id: number;
  title: string;
  description: string;
  emotionTags: string[];
  practiceTextStructure: RawChunk[];
}

/** Sanitized expressive-reading scripts grouped by emotion tags. */
export const EMOTION_SCRIPTS: EmotionScript[] = (rawEmotion as RawEmotion[]).map(
  item => ({
    id: `script-${item.id}`,
    title: sanitizeText(item.title),
    description: sanitizeText(item.description),
    emotions: item.emotionTags.map(sanitizeText),
    chunks: item.practiceTextStructure.map(chunk => ({
      cue: sanitizeText(chunk.staticHint),
      text: sanitizeText(chunk.readableText),
    })),
  }),
);

/** Distinct emotion tags, ordered by first appearance, for the filter row. */
export const EMOTION_TAGS: string[] = (() => {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const script of EMOTION_SCRIPTS) {
    for (const tag of script.emotions) {
      if (!seen.has(tag)) {
        seen.add(tag);
        order.push(tag);
      }
    }
  }
  return order;
})();

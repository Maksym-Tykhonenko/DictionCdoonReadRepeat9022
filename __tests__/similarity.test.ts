import {
  alignWords,
  envelopeSimilarity,
  normalizeWords,
  scorePronunciation,
  scoreReverseAttempt,
} from '../app/utils/similarity';

describe('normalizeWords', () => {
  it('strips punctuation, case and accents', () => {
    expect(normalizeWords('¿Qué clavito clavó Pablito?')).toEqual([
      'que',
      'clavito',
      'clavo',
      'pablito',
    ]);
  });

  it('keeps Cyrillic words', () => {
    expect(normalizeWords('Бабин біб розцвів у дощ — буде бабі біб у борщ.')).toHaveLength(10);
  });
});

describe('scorePronunciation', () => {
  const text = 'Fischers Fritz fischt frische Fische';

  it('gives 100% for an exact read', () => {
    const r = scorePronunciation(text, 'fischers fritz fischt frische fische', 3);
    expect(r.accuracy).toBe(100);
    expect(r.verdicts.every(v => v === 'hit')).toBe(true);
    expect(r.wpm).toBe(100);
  });

  it('marks skipped and slightly wrong words', () => {
    const r = scorePronunciation(text, 'fischer fritz frische fische', 3);
    expect(r.verdicts[2]).toBe('miss');
    expect(r.accuracy).toBeLessThan(100);
    expect(r.accuracy).toBeGreaterThan(50);
  });

  it('scores 0 when nothing matches', () => {
    expect(scorePronunciation(text, 'hello world', 2).accuracy).toBe(0);
  });
});

describe('alignWords', () => {
  it('handles out-of-order extras without crashing', () => {
    expect(alignWords(['a', 'b'], [])).toEqual(['miss', 'miss']);
    expect(alignWords([], ['a'])).toEqual([]);
  });
});

describe('reverse game scoring', () => {
  const env = [0, 0, 0.2, 0.8, 1, 0.6, 0.3, 0.9, 0.5, 0.1, 0, 0];

  it('rates identical envelopes highly and flat ones low', () => {
    expect(envelopeSimilarity(env, env)).toBeGreaterThan(95);
    expect(envelopeSimilarity(env, env.map(() => 0.5))).toBeLessThan(40);
  });

  it('falls back to rhythm when transcripts are missing', () => {
    const s = scoreReverseAttempt({
      originalTranscript: '',
      attemptTranscript: '',
      originalEnvelope: env,
      attemptEnvelope: env,
      originalDuration: 2,
      attemptDuration: 2,
    });
    expect(s.words).toBeNull();
    expect(s.total).toBe(s.rhythm);
  });

  it('blends transcript similarity in when both were heard', () => {
    const s = scoreReverseAttempt({
      originalTranscript: 'hello there',
      attemptTranscript: 'hello there',
      originalEnvelope: env,
      attemptEnvelope: env,
      originalDuration: 2,
      attemptDuration: 2,
    });
    expect(s.words).toBe(100);
    expect(s.total).toBeGreaterThan(95);
  });
});

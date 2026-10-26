import {
  advanceScriptPosition,
  analyzeRehearsal,
  countFillers,
  findPauses,
  paceVerdict,
} from '../app/utils/speechCoach';
import { normalizeWords } from '../app/utils/similarity';
import { duelLink, encodeDuel, parseDuel } from '../app/utils/duel';
import { daysBetween, dayKey } from '../app/utils/days';

describe('countFillers', () => {
  it('counts multi-word phrases before single words', () => {
    const words = normalizeWords('So, you know, I like, basically think you know what');
    const counts = Object.fromEntries(countFillers(words, 'en').map(f => [f.phrase, f.count]));
    expect(counts['you know']).toBe(2);
    expect(counts.like).toBe(1);
    expect(counts.basically).toBe(1);
  });

  it('handles Ukrainian fillers', () => {
    const words = normalizeWords('Ну, це типу важливо, ну як би так');
    const total = countFillers(words, 'uk').reduce((s, f) => s + f.count, 0);
    expect(total).toBe(4);
  });
});

describe('rehearsal analysis', () => {
  it('computes pace, coverage and pauses', () => {
    const envelope = [0, 1, 1, 0, 0, 0, 1, 1, 1, 0];
    const report = analyzeRehearsal({
      script: 'one two three four',
      transcript: 'one two like three',
      duration: 2,
      envelope,
      lang: 'en',
    });
    expect(report.wpm).toBe(120);
    expect(report.pace).toBe('good');
    expect(report.fillerTotal).toBe(1);
    expect(report.coverage).toBe(75);
    expect(findPauses(envelope, 10, 2)).toEqual({ count: 1, longest: 3 });
  });

  it('classifies pace', () => {
    expect(paceVerdict(90)).toBe('slow');
    expect(paceVerdict(140)).toBe('good');
    expect(paceVerdict(200)).toBe('fast');
  });

  it('moves the teleprompter forward, never back', () => {
    const script = normalizeWords('Good morning everyone and thank you for coming today');
    const p1 = advanceScriptPosition(script, 'good morning everyone', 0);
    expect(p1).toBe(3);
    expect(advanceScriptPosition(script, 'good morning', p1)).toBe(3);
    expect(advanceScriptPosition(script, 'good morning everyone and thank you', p1)).toBe(6);
  });
});

describe('duel codes', () => {
  it('round-trips built-in twisters', () => {
    const code = encodeDuel('uk-5', 87.4);
    expect(code).toBe('DC-UK5-87');
    expect(parseDuel(duelLink(code!))).toEqual({
      lang: 'uk',
      twisterId: 'uk-5',
      score: 87,
      code: 'DC-UK5-87',
    });
    expect(parseDuel('dc-en12-100')?.twisterId).toBe('seed-12');
  });

  it('rejects custom twisters and bad codes', () => {
    expect(encodeDuel('custom-abc-1', 50)).toBeNull();
    expect(parseDuel('DC-EN12-140')).toBeNull();
    expect(parseDuel('hello')).toBeNull();
  });
});

describe('days', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-10-19', '2026-10-20')).toBe(1);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

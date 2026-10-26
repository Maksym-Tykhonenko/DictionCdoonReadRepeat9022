import { useCallback, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import { useVoiceCapture } from './useVoiceCapture';
import { VoiceLab, type RecordingResult } from '../native/voiceLab';
import { scoreReverseAttempt, type ReverseScore } from '../utils/similarity';
import { useI18n, type StringKey } from '../i18n';
import { useProgress } from './useProgress';

/**
 * Reverse Voice Game on real audio:
 *   1. record a phrase (with live transcription when allowed)
 *   2. play it reversed
 *   3. record the player imitating the reversed sound
 *   4. reverse that attempt back and score it against the original
 * The round can then be exported as a vertical share video.
 */

export type GamePhase =
  | 'idle'
  | 'recording'
  | 'preparing'
  | 'recorded'
  | 'repeat'
  | 'repeating'
  | 'checking'
  | 'result'
  | 'denied';

export type Clip = 'reversed' | 'original' | 'flipped';

const PHRASE_LIMIT = 6;
const ATTEMPT_LIMIT = 8;
const MIN_SECONDS = 0.6;

export function useReverseRecorder() {
  const { t, speechLocale } = useI18n();
  const capture = useVoiceCapture();
  const { recordPractice } = useProgress();

  const [phase, setPhase] = useState<GamePhase>('idle');
  const [notice, setNotice] = useState<StringKey | null>(null);
  const [original, setOriginal] = useState<RecordingResult | null>(null);
  const [reversed, setReversed] = useState<RecordingResult | null>(null);
  const [flipped, setFlipped] = useState<RecordingResult | null>(null);
  const [attemptTranscript, setAttemptTranscript] = useState('');
  const [score, setScore] = useState<ReverseScore | null>(null);
  const [playing, setPlaying] = useState<Clip | null>(null);
  const [sharing, setSharing] = useState(false);

  const speechAllowed = useRef(false);
  const roundRef = useRef(0);

  useEffect(() => {
    return () => {
      VoiceLab.stopPlayback().catch(() => {});
    };
  }, []);

  const stopAudio = useCallback(async () => {
    setPlaying(null);
    await VoiceLab.stopPlayback().catch(() => {});
  }, []);

  const startRecording = useCallback(async () => {
    setNotice(null);
    await stopAudio();
    const perms = await capture.ensurePermissions().catch(() => null);
    if (!perms || perms.mic !== 'granted') {
      setPhase('denied');
      return;
    }
    speechAllowed.current = perms.speech === 'granted';
    const round = ++roundRef.current;
    setPhase('recording');
    const started = await capture.start({
      locale: speechLocale,
      transcribe: speechAllowed.current,
      maxSeconds: PHRASE_LIMIT,
      onDone: async result => {
        if (round !== roundRef.current) {
          return;
        }
        if (result.duration < MIN_SECONDS) {
          setNotice('game.tooShort');
          setPhase('idle');
          return;
        }
        setPhase('preparing');
        try {
          const rev = await VoiceLab.reverse(result.path);
          if (round !== roundRef.current) {
            return;
          }
          setOriginal(result);
          setReversed(rev);
          setPhase('recorded');
        } catch {
          setNotice('game.error');
          setPhase('idle');
        }
      },
      onError: () => {
        setNotice('game.error');
        setPhase('idle');
      },
    });
    if (!started) {
      setNotice('game.error');
      setPhase('idle');
    }
  }, [capture, speechLocale, stopAudio]);

  const stopRecording = useCallback(() => {
    void capture.stop();
  }, [capture]);

  const play = useCallback(
    async (clip: Clip) => {
      const source = clip === 'reversed' ? reversed : clip === 'original' ? original : flipped;
      if (!source) {
        return;
      }
      setPlaying(clip);
      try {
        await VoiceLab.play(source.path);
      } catch {
        // Playback errors are non-fatal; the buttons stay usable.
      }
      setPlaying(current => (current === clip ? null : current));
      if (clip === 'reversed') {
        setPhase(p => (p === 'recorded' ? 'repeat' : p));
      }
    },
    [reversed, original, flipped],
  );

  const startRepeat = useCallback(async () => {
    if (!original) {
      return;
    }
    setNotice(null);
    await stopAudio();
    const round = roundRef.current;
    setPhase('repeating');
    const started = await capture.start({
      transcribe: false,
      maxSeconds: ATTEMPT_LIMIT,
      onDone: async attempt => {
        if (round !== roundRef.current) {
          return;
        }
        if (attempt.duration < MIN_SECONDS) {
          setNotice('game.tooShort');
          setPhase('repeat');
          return;
        }
        setPhase('checking');
        try {
          const back = await VoiceLab.reverse(attempt.path);
          const heard = speechAllowed.current
            ? await VoiceLab.transcribeFile(back.path, speechLocale).catch(() => '')
            : '';
          if (round !== roundRef.current) {
            return;
          }
          setFlipped(back);
          setAttemptTranscript(heard);
          setScore(
            scoreReverseAttempt({
              originalTranscript: original.transcript,
              attemptTranscript: heard,
              originalEnvelope: original.envelope,
              attemptEnvelope: back.envelope,
              originalDuration: original.duration,
              attemptDuration: back.duration,
            }),
          );
          setPhase('result');
          recordPractice();
        } catch {
          setNotice('game.error');
          setPhase('repeat');
        }
      },
      onError: () => {
        setNotice('game.error');
        setPhase('repeat');
      },
    });
    if (!started) {
      setNotice('game.error');
      setPhase('repeat');
    }
  }, [capture, original, speechLocale, stopAudio, recordPractice]);

  const shareVideo = useCallback(async () => {
    if (!original || !reversed || !flipped || !score || sharing) {
      return;
    }
    await stopAudio();
    setSharing(true);
    setNotice(null);
    try {
      const path = await VoiceLab.exportShareVideo({
        segments: [
          { path: original.path, label: t('game.video.seg1') },
          { path: reversed.path, label: t('game.video.seg2') },
          { path: flipped.path, label: t('game.video.seg3') },
        ],
        title: t('game.video.title'),
        teaser: t('game.video.teaser'),
        scoreLabel: t('game.video.scoreLabel'),
        score: `${score.total}%`,
        cta: t('game.video.cta'),
        brand: 'Diction Crown',
        footer: t('game.video.footer'),
      });
      await Share.share({
        url: `file://${path}`,
        message: t('game.shareMessage', { pct: score.total }),
      });
    } catch {
      setNotice('game.shareFailed');
    } finally {
      setSharing(false);
    }
  }, [original, reversed, flipped, score, sharing, stopAudio, t]);

  const restart = useCallback(async () => {
    roundRef.current += 1;
    await capture.cancel();
    await stopAudio();
    setOriginal(null);
    setReversed(null);
    setFlipped(null);
    setAttemptTranscript('');
    setScore(null);
    setNotice(null);
    setPhase('idle');
  }, [capture, stopAudio]);

  // Active step (1-4) for the stepper UI.
  const activeStep =
    phase === 'idle' || phase === 'recording' || phase === 'denied'
      ? 1
      : phase === 'preparing' || phase === 'recorded'
      ? 2
      : phase === 'repeat' || phase === 'repeating' || phase === 'checking'
      ? 3
      : 4;

  return {
    phase,
    notice,
    activeStep,
    phraseLimit: PHRASE_LIMIT,
    elapsed: capture.elapsed,
    levels: capture.levels,
    original,
    reversed,
    flipped,
    attemptTranscript,
    score,
    playing,
    sharing,
    startRecording,
    stopRecording,
    play,
    stopAudio,
    startRepeat,
    shareVideo,
    restart,
  };
}

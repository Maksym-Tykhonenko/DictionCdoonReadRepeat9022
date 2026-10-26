import { useCallback, useEffect, useRef, useState } from 'react';
import {
  VoiceLab,
  voiceLabAvailable,
  type RecordingResult,
  type VoicePermissions,
} from '../native/voiceLab';

const POLL_MS = 90;
const LEVEL_HISTORY = 28;

export interface CaptureOptions {
  locale?: string;
  transcribe?: boolean;
  continuous?: boolean;
  envelopeBinsPerSecond?: number;
  /** Auto-stop after this many seconds. */
  maxSeconds: number;
  /** Called once with the finished recording (manual stop or auto-stop). */
  onDone: (result: RecordingResult) => void;
  onError?: (error: unknown) => void;
}

/**
 * Microphone capture with a live level history + partial transcript.
 * Polls the native module while recording; the same `onDone` fires for a
 * manual stop and for the auto-stop at `maxSeconds`.
 */
export function useVoiceCapture() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(LEVEL_HISTORY).fill(0));
  const [liveTranscript, setLiveTranscript] = useState('');
  const [permissions, setPermissions] = useState<VoicePermissions | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef<CaptureOptions | null>(null);
  const stoppingRef = useRef(false);
  const mounted = useRef(true);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearPoll();
      if (voiceLabAvailable) {
        VoiceLab.cancelRecording().catch(() => {});
      }
    };
  }, [clearPoll]);

  const ensurePermissions = useCallback(async (): Promise<VoicePermissions> => {
    if (!voiceLabAvailable) {
      const none: VoicePermissions = { mic: 'denied', speech: 'denied' };
      setPermissions(none);
      return none;
    }
    const result = await VoiceLab.requestPermissions();
    if (mounted.current) {
      setPermissions(result);
    }
    return result;
  }, []);

  const stop = useCallback(async () => {
    const opts = optionsRef.current;
    if (!opts || stoppingRef.current) {
      return;
    }
    stoppingRef.current = true;
    clearPoll();
    try {
      const result = await VoiceLab.stopRecording();
      if (mounted.current) {
        setRecording(false);
        opts.onDone(result);
      }
    } catch (e) {
      if (mounted.current) {
        setRecording(false);
        opts.onError?.(e);
      }
    } finally {
      optionsRef.current = null;
      stoppingRef.current = false;
    }
  }, [clearPoll]);

  const start = useCallback(
    async (opts: CaptureOptions): Promise<boolean> => {
      if (!voiceLabAvailable) {
        opts.onError?.(new Error('unavailable'));
        return false;
      }
      try {
        await VoiceLab.startRecording({
          locale: opts.locale,
          transcribe: opts.transcribe,
          continuous: opts.continuous,
          envelopeBinsPerSecond: opts.envelopeBinsPerSecond,
        });
      } catch (e) {
        opts.onError?.(e);
        return false;
      }
      optionsRef.current = opts;
      stoppingRef.current = false;
      setLevels(Array(LEVEL_HISTORY).fill(0));
      setLiveTranscript('');
      setElapsed(0);
      setRecording(true);

      clearPoll();
      pollRef.current = setInterval(async () => {
        try {
          const live = await VoiceLab.getLiveState();
          if (!mounted.current || !live.recording) {
            return;
          }
          setElapsed(live.elapsed);
          setLevels(prev => [...prev.slice(1), live.level]);
          setLiveTranscript(live.transcript);
          if (live.elapsed >= opts.maxSeconds) {
            void stop();
          }
        } catch {
          // Ignore a missed poll; the next tick will catch up.
        }
      }, POLL_MS);
      return true;
    },
    [clearPoll, stop],
  );

  const cancel = useCallback(async () => {
    clearPoll();
    optionsRef.current = null;
    setRecording(false);
    if (voiceLabAvailable) {
      await VoiceLab.cancelRecording().catch(() => {});
    }
  }, [clearPoll]);

  return {
    available: voiceLabAvailable,
    recording,
    elapsed,
    levels,
    liveTranscript,
    permissions,
    ensurePermissions,
    start,
    stop,
    cancel,
  };
}

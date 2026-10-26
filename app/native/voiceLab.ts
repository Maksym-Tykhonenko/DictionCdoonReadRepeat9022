import { NativeModules, Platform } from 'react-native';

/** Typed bridge to the iOS `VoiceLab` native module (see ios/.../VoiceLab). */

export type MicPermission = 'granted' | 'denied';
export type SpeechPermission = 'granted' | 'denied' | 'restricted' | 'unknown';

export interface VoicePermissions {
  mic: MicPermission;
  speech: SpeechPermission;
}

export interface RecordingResult {
  path: string;
  /** Seconds. */
  duration: number;
  /** Normalized (0..1) RMS envelope, 96 bins. */
  envelope: number[];
  /** Live recognition result; empty when transcription was off/unavailable. */
  transcript: string;
}

export interface LiveState {
  recording: boolean;
  elapsed: number;
  /** 0..1 meter value. */
  level: number;
  transcript: string;
}

export interface ShareVideoOptions {
  segments: Array<{ path: string; label: string }>;
  title: string;
  teaser: string;
  scoreLabel: string;
  score: string;
  cta: string;
  brand: string;
  footer: string;
}

export interface StartOptions {
  locale?: string;
  transcribe?: boolean;
  /** Keep recognising past Apple's ~1 minute per-request limit. */
  continuous?: boolean;
  /** Envelope resolution for long takes (default: fixed 96 bins). */
  envelopeBinsPerSecond?: number;
}

interface VoiceLabNative {
  requestPermissions(): Promise<VoicePermissions>;
  isRecognitionAvailable(locale: string): Promise<boolean>;
  startRecording(options: StartOptions): Promise<{ path: string }>;
  getLiveState(): Promise<LiveState>;
  stopRecording(): Promise<RecordingResult>;
  cancelRecording(): Promise<void>;
  reverse(path: string): Promise<RecordingResult>;
  transcribeFile(path: string, locale: string): Promise<string>;
  /** Resolves `true` when playback finished, `false` when it was stopped. */
  play(path: string): Promise<boolean>;
  stopPlayback(): Promise<void>;
  exportShareVideo(options: ShareVideoOptions): Promise<string>;
}

const native: VoiceLabNative | undefined =
  Platform.OS === 'ios' ? NativeModules.VoiceLab : undefined;

export const voiceLabAvailable = native != null;

function requireNative(): VoiceLabNative {
  if (!native) {
    throw new Error('VoiceLab is only available on iOS.');
  }
  return native;
}

export const VoiceLab = {
  requestPermissions: () => requireNative().requestPermissions(),
  isRecognitionAvailable: (locale: string) =>
    requireNative().isRecognitionAvailable(locale),
  startRecording: (options: StartOptions) =>
    requireNative().startRecording(options),
  getLiveState: () => requireNative().getLiveState(),
  stopRecording: () => requireNative().stopRecording(),
  cancelRecording: () => requireNative().cancelRecording(),
  reverse: (path: string) => requireNative().reverse(path),
  transcribeFile: (path: string, locale: string) =>
    requireNative().transcribeFile(path, locale),
  play: (path: string) => requireNative().play(path),
  stopPlayback: () => requireNative().stopPlayback(),
  exportShareVideo: (options: ShareVideoOptions) =>
    requireNative().exportShareVideo(options),
};

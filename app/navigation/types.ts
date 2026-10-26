import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { TwisterEntry } from '../data/types';

/** Every screen in the root stack and its params. */
export type RootStackParamList = {
  Loader: undefined;
  Intro: undefined;
  /** Tabs with the floating dock (twisters, reading, tips, quiz, game). */
  Main: undefined;
  TwisterPractice: { entry: TwisterEntry; duelScore?: number };
  AddTwister: undefined;
  EmotionPractice: { scriptId: string };
  SpeechEdit: { speechId?: string };
  SpeechRehearsal: { speechId: string };
  TipDetail: { pointerId: string };
  QuizPlay: undefined;
  QuizResult: { correct: number; total: number; review: boolean[] };
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

/** Typed navigation for any screen or component inside the stack. */
export function useRootNavigation(): RootNavigation {
  return useNavigation<RootNavigation>();
}

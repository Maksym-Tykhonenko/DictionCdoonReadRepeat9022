import React, { useCallback, useEffect, useState } from 'react';
import { useLibrary } from '../hooks/useLibrary';
import { useSpeeches } from '../hooks/useSpeeches';
import { BootLoaderScreen } from '../screens/BootLoaderScreen';
import { IntroJourneyScreen } from '../screens/IntroJourneyScreen';
import { TwisterPracticeScreen } from '../screens/twisters/TwisterPracticeScreen';
import { AddTwisterScreen } from '../screens/twisters/AddTwisterScreen';
import { EmotionPracticeScreen } from '../screens/reading/EmotionPracticeScreen';
import { SpeechEditScreen } from '../screens/reading/SpeechEditScreen';
import { SpeechRehearsalScreen } from '../screens/reading/SpeechRehearsalScreen';
import { TipDetailScreen } from '../screens/tips/TipDetailScreen';
import { QuizPlayScreen } from '../screens/quiz/QuizPlayScreen';
import { QuizResultScreen } from '../screens/quiz/QuizResultScreen';
import { EMOTION_SCRIPTS } from '../data/emotionScripts';
import { VOICE_POINTERS } from '../data/voicePointers';
import { KNOWLEDGE_QUESTIONS, QUIZ_ROUND_SIZE } from '../data/knowledgeQuestions';
import type { QuizQuestion } from '../data/types';
import { shuffled } from '../utils/text';
import { TabShell } from './TabShell';
import type { RootScreenProps } from './types';

/**
 * Thin adapters between the stack and the screens: they read route params
 * and turn navigation into the `onBack` / `onDone` props the screens use.
 */

const LOADER_MIN_MS = 2100;

export function LoaderRoute({ navigation }: RootScreenProps<'Loader'>) {
  const { ready, introDone } = useLibrary();
  const [minElapsed, setMinElapsed] = useState(false);

  // Keep the themed loader on screen for a moment instead of flashing.
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), LOADER_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && minElapsed) {
      navigation.replace(introDone ? 'Main' : 'Intro');
    }
  }, [ready, minElapsed, introDone, navigation]);

  return <BootLoaderScreen />;
}

export function IntroRoute({ navigation }: RootScreenProps<'Intro'>) {
  const { completeIntro } = useLibrary();
  return (
    <IntroJourneyScreen
      onDone={() => {
        completeIntro();
        navigation.replace('Main');
      }}
    />
  );
}

export function MainRoute() {
  return <TabShell />;
}

export function TwisterPracticeRoute({ route, navigation }: RootScreenProps<'TwisterPractice'>) {
  return (
    <TwisterPracticeScreen
      entry={route.params.entry}
      duelScore={route.params.duelScore ?? null}
      onBack={() => navigation.goBack()}
    />
  );
}

export function AddTwisterRoute({ navigation }: RootScreenProps<'AddTwister'>) {
  return <AddTwisterScreen onBack={() => navigation.goBack()} />;
}

export function EmotionPracticeRoute({ route, navigation }: RootScreenProps<'EmotionPractice'>) {
  const script = EMOTION_SCRIPTS.find(s => s.id === route.params.scriptId);
  if (!script) {
    return null;
  }
  return (
    <EmotionPracticeScreen
      script={script}
      onBack={() => navigation.goBack()}
      onAnother={() => navigation.goBack()}
    />
  );
}

export function SpeechEditRoute({ route, navigation }: RootScreenProps<'SpeechEdit'>) {
  const { speeches, saveSpeech } = useSpeeches();
  const speech = route.params.speechId
    ? speeches.find(s => s.id === route.params.speechId) ?? null
    : null;
  return (
    <SpeechEditScreen
      speech={speech}
      onBack={() => navigation.goBack()}
      onSave={draft => {
        const id = saveSpeech(draft);
        navigation.replace('SpeechRehearsal', { speechId: id });
      }}
    />
  );
}

export function SpeechRehearsalRoute({ route, navigation }: RootScreenProps<'SpeechRehearsal'>) {
  const { speeches, addAttempt } = useSpeeches();
  const speech = speeches.find(s => s.id === route.params.speechId);
  // A just-saved speech can take one render to appear in the store.
  if (!speech) {
    return null;
  }
  return (
    <SpeechRehearsalScreen
      speech={speech}
      onAttempt={attempt => addAttempt(speech.id, attempt)}
      onBack={() => navigation.goBack()}
    />
  );
}

export function TipDetailRoute({ route, navigation }: RootScreenProps<'TipDetail'>) {
  const pointer = VOICE_POINTERS.find(p => p.id === route.params.pointerId);
  if (!pointer) {
    return null;
  }
  return <TipDetailScreen pointer={pointer} onBack={() => navigation.goBack()} />;
}

/** One quiz round: holds the shuffled questions and answers until the end. */
export function QuizPlayRoute({ navigation }: RootScreenProps<'QuizPlay'>) {
  const { recordQuiz } = useLibrary();
  const [round] = useState<QuizQuestion[]>(() =>
    shuffled(KNOWLEDGE_QUESTIONS).slice(0, QUIZ_ROUND_SIZE),
  );
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(round.length).fill(null));

  const select = useCallback(
    (optionIndex: number) => {
      setAnswers(prev => {
        if (prev[current] !== null) {
          return prev;
        }
        const copy = [...prev];
        copy[current] = optionIndex;
        return copy;
      });
    },
    [current],
  );

  const next = useCallback(() => {
    if (current + 1 < round.length) {
      setCurrent(c => c + 1);
      return;
    }
    const review = round.map((q, i) => answers[i] === q.correctIndex);
    const correct = review.filter(Boolean).length;
    recordQuiz(correct, round.length);
    navigation.replace('QuizResult', { correct, total: round.length, review });
  }, [current, round, answers, recordQuiz, navigation]);

  const question = round[current];
  if (!question) {
    return null;
  }
  return (
    <QuizPlayScreen
      question={question}
      index={current}
      total={round.length}
      selected={answers[current]}
      onSelect={select}
      onNext={next}
      onBack={() => navigation.goBack()}
    />
  );
}

export function QuizResultRoute({ route, navigation }: RootScreenProps<'QuizResult'>) {
  return (
    <QuizResultScreen
      correct={route.params.correct}
      total={route.params.total}
      review={route.params.review}
      onRetry={() => navigation.replace('QuizPlay')}
      onBackToQuiz={() => navigation.goBack()}
    />
  );
}

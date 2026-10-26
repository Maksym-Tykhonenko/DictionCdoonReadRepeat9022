import React from 'react';
import { QuizIntroScreen } from './QuizIntroScreen';
import { useRootNavigation } from '../../navigation/types';

/** Quiz intro; a round runs as the QuizPlay → QuizResult stack screens. */
export function QuizTab() {
  const navigation = useRootNavigation();
  return <QuizIntroScreen onStart={() => navigation.navigate('QuizPlay')} />;
}

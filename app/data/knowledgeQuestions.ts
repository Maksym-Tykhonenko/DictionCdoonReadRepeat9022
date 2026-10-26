import rawQuiz from '../../cordartio/quiz';
import { sanitizeText } from '../utils/sanitize';
import type { QuizQuestion } from './types';

interface RawQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  correctAnswer: string;
}

/** Sanitized voice-knowledge quiz pool. */
export const KNOWLEDGE_QUESTIONS: QuizQuestion[] = (rawQuiz as RawQuestion[]).map(
  item => ({
    id: `q-${item.id}`,
    question: sanitizeText(item.question),
    options: item.options.map(sanitizeText),
    correctIndex: item.correctAnswerIndex,
  }),
);

/** How many questions make up one quiz round. */
export const QUIZ_ROUND_SIZE = Math.min(10, KNOWLEDGE_QUESTIONS.length);

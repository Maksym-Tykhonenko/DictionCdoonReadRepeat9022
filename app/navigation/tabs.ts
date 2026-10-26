import {
  AudioLines,
  BookOpen,
  Lightbulb,
  CircleQuestionMark,
  Shuffle,
  type LucideIcon,
} from '../components/icons';

export type TabKey = 'twisters' | 'reading' | 'tips' | 'quiz' | 'game';

export interface TabDef {
  key: TabKey;
  icon: LucideIcon;
}

export const TAB_DEFS: TabDef[] = [
  { key: 'twisters', icon: AudioLines },
  { key: 'reading', icon: BookOpen },
  { key: 'tips', icon: Lightbulb },
  { key: 'quiz', icon: CircleQuestionMark },
  { key: 'game', icon: Shuffle },
];

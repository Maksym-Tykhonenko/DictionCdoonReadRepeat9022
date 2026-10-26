import React from 'react';
import {
  Wind,
  MessageSquare,
  Pause,
  Turtle,
  Smile,
  Volume2,
  PersonStanding,
  Target,
  Drama,
  MessagesSquare,
  Music4,
  Droplet,
  Mic,
  Sparkles,
  Brain,
  Flag,
} from './icons';
import type { VoicePointerIcon } from '../data/types';

const MAP = {
  wind: Wind,
  speech: MessageSquare,
  pause: Pause,
  turtle: Turtle,
  smile: Smile,
  volume: Volume2,
  posture: PersonStanding,
  target: Target,
  mirror: Drama,
  message: MessagesSquare,
  music: Music4,
  droplet: Droplet,
  mic: Mic,
  sparkle: Sparkles,
  brain: Brain,
  flag: Flag,
} as const;

interface Props {
  name: VoicePointerIcon;
  size?: number;
  color: string;
  strokeWidth?: number;
}

/** Resolves a VoicePointerIcon key to its lucide vector icon. */
export function PointerGlyph({ name, size = 22, color, strokeWidth = 2 }: Props) {
  const Icon = MAP[name] ?? Sparkles;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

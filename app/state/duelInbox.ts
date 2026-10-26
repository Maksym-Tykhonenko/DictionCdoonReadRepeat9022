import type { DuelChallenge } from '../utils/duel';

/**
 * Tiny hand-off for an incoming duel (deep link or typed code): the shell
 * switches to the Twisters tab and the tab opens the challenged twister.
 */

let pending: DuelChallenge | null = null;
const listeners = new Set<() => void>();

export function pushDuel(duel: DuelChallenge): void {
  pending = duel;
  listeners.forEach(listener => listener());
}

export function peekDuel(): DuelChallenge | null {
  return pending;
}

export function takeDuel(): DuelChallenge | null {
  const duel = pending;
  pending = null;
  return duel;
}

export function subscribeDuel(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

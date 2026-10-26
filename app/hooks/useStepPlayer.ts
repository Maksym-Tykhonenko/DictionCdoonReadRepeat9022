import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** Number of steps to walk through. */
  count: number;
  /** Duration (ms) the given step index should stay highlighted. */
  durationFor: (index: number) => number;
}

export interface StepPlayer {
  index: number;
  playing: boolean;
  finished: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
}

/**
 * Advances a highlight through `count` steps while "playing", honoring a
 * per-step duration. Cleans up its timer on unmount and supports pause /
 * restart with a completion flag.
 */
export function useStepPlayer({ count, durationFor }: Options): StepPlayer {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationRef = useRef(durationFor);
  durationRef.current = durationFor;

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Schedule the next advance whenever we are playing.
  useEffect(() => {
    if (!playing) {
      return;
    }
    if (index >= count - 1) {
      // Reached the final step; let it linger, then finish.
      timer.current = setTimeout(() => {
        setPlaying(false);
        setFinished(true);
      }, durationRef.current(index));
      return clear;
    }
    timer.current = setTimeout(() => {
      setIndex(i => i + 1);
    }, durationRef.current(index));
    return clear;
  }, [playing, index, count, clear]);

  useEffect(() => clear, [clear]);

  const play = useCallback(() => {
    if (finished) {
      setIndex(0);
      setFinished(false);
    }
    setPlaying(true);
  }, [finished]);

  const pause = useCallback(() => {
    clear();
    setPlaying(false);
  }, [clear]);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
    } else {
      play();
    }
  }, [playing, pause, play]);

  const restart = useCallback(() => {
    clear();
    setIndex(0);
    setFinished(false);
    setPlaying(false);
  }, [clear]);

  return { index, playing, finished, play, pause, toggle, restart };
}

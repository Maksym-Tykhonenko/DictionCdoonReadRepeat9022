import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { palette } from '../theme';

interface Props {
  /** Values in 0..1, oldest first. */
  values: number[];
  height?: number;
  color?: string;
  /** Fraction (0..1) of bars drawn in `color`; the rest are dimmed. */
  progress?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bar graph of real audio levels: a live mic meter while recording, or a
 * recording's loudness envelope (with playback progress) afterwards.
 */
export function LevelBars({
  values,
  height = 44,
  color = palette.goldMark,
  progress = 1,
  style,
}: Props) {
  const lit = Math.round(values.length * progress);
  return (
    <View style={[styles.row, { height }, style]}>
      {values.map((v, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: Math.max(3, Math.min(1, v) * height),
              backgroundColor: i < lit ? color : palette.violetEdge,
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Downsamples an envelope for display. */
export function compactEnvelope(envelope: number[], bars = 32): number[] {
  if (envelope.length <= bars) {
    return envelope;
  }
  const size = envelope.length / bars;
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const slice = envelope.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    out.push(slice.length ? Math.max(...slice) : 0);
  }
  return out;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  bar: {
    flex: 1,
    maxWidth: 6,
    marginHorizontal: 1.5,
    borderRadius: 3,
  },
});

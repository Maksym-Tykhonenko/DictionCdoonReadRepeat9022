import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { accentForLabel, radius, space, fontFamily } from '../theme';

interface Props {
  label: string;
  /** Stable key for the tint when `label` is translated (e.g. "Easy"). */
  accentKey?: string;
  /** Show a small leading dot (emotion-tag style). */
  dot?: boolean;
}

/** Small tinted chip for difficulty / emotion labels. */
export function TagPill({ label, accentKey, dot }: Props) {
  const accent = accentForLabel(accentKey ?? label);
  return (
    <View style={[styles.pill, { backgroundColor: accent.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: accent.fg }]} />}
      <Text style={[styles.text, { color: accent.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
});

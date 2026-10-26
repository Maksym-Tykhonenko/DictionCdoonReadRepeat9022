import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, space, type } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  accentLine?: boolean;
}

/** Screen header block: small gold accent line, title, optional subtitle. */
export function SectionIntro({ title, subtitle, accentLine = true }: Props) {
  return (
    <View style={styles.wrap}>
      {accentLine && <View style={styles.accent} />}
      <Text style={type.display}>{title}</Text>
      {subtitle ? <Text style={[type.body, styles.sub]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.lg,
  },
  accent: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.goldMark,
    marginBottom: space.md,
  },
  sub: {
    marginTop: 6,
  },
});

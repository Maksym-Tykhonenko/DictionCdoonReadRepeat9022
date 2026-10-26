import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../../components/GlassCard';
import { palette, space, type, fontFamily } from '../../theme';

interface Props {
  step: number;
  title: string;
  subtitle: string;
  active: boolean;
  done: boolean;
  children?: React.ReactNode;
}

/** One step in the reverse-voice flow; highlights when active, dims otherwise. */
export function StepCard({ step, title, subtitle, active, done, children }: Props) {
  return (
    <GlassCard active={active} padded style={[styles.card, !active && styles.idle]}>
      <View style={styles.row}>
        <View
          style={[
            styles.numCircle,
            active && styles.numActive,
            done && styles.numDone,
          ]}>
          <Text
            style={[
              styles.num,
              { color: active || done ? palette.textOnGold : palette.textMuted },
            ]}>
            {step}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={[type.bodyStrong, !active && styles.dimText]}>{title}</Text>
          <Text style={[type.caption, styles.sub]}>{subtitle}</Text>
        </View>
      </View>
      {active && children ? <View style={styles.body}>{children}</View> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md,
  },
  idle: {
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    backgroundColor: palette.violetSoft,
    marginRight: space.md,
  },
  numActive: {
    backgroundColor: palette.goldMark,
    borderColor: palette.goldBright,
  },
  numDone: {
    backgroundColor: palette.goldDeep,
    borderColor: palette.goldDeep,
  },
  num: {
    fontFamily,
    fontWeight: '800',
    fontSize: 14,
  },
  col: {
    flex: 1,
  },
  dimText: {
    color: palette.textSecondary,
  },
  sub: {
    marginTop: 2,
  },
  body: {
    marginTop: space.lg,
    alignItems: 'center',
  },
});

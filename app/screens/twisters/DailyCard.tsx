import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircleCheck, Flame, Play } from '../../components/icons';
import { GlassCard } from '../../components/GlassCard';
import { AuroraButton } from '../../components/AuroraButton';
import { PressBounce } from '../../components/PressBounce';
import { ProgressSheet } from './ProgressSheet';
import { useProgress } from '../../hooks/useProgress';
import { useI18n } from '../../i18n';
import type { TwisterEntry } from '../../data/types';
import { palette, radius, space, type } from '../../theme';

/** Twister of the day + streak chip (opens the progress sheet). */
export function DailyCard({ onPractice }: { onPractice: (entry: TwisterEntry) => void }) {
  const { t } = useI18n();
  const { streak, dailyTwister, dailyDoneToday } = useProgress();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!dailyTwister) {
    return null;
  }

  return (
    <GlassCard active={!dailyDoneToday} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={[type.overline, styles.label]}>{t('daily.title')}</Text>
        <PressBounce
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('progress.title')}
          style={[styles.streakChip, streak > 0 && styles.streakChipOn]}>
          <Flame
            size={15}
            color={streak > 0 ? palette.amber : palette.textMuted}
            strokeWidth={2.4}
            fill={streak > 0 ? palette.amber : 'transparent'}
          />
          <Text style={[styles.streakText, streak > 0 && styles.streakTextOn]}>
            {streak > 0 ? t('streak.days', { n: streak }) : t('streak.zero')}
          </Text>
        </PressBounce>
      </View>

      <Text style={[type.heading, styles.title]} numberOfLines={1}>
        {dailyTwister.title}
      </Text>
      <Text style={[type.body, styles.text]} numberOfLines={2}>
        {dailyTwister.text}
      </Text>

      {dailyDoneToday ? (
        <View style={styles.doneRow}>
          <CircleCheck size={17} color={palette.mint} strokeWidth={2.4} />
          <Text style={styles.doneText}>{t('daily.done')}</Text>
        </View>
      ) : (
        <>
          <Text style={[type.caption, styles.subtitle]}>{t('daily.subtitle')}</Text>
          <AuroraButton
            label={t('daily.cta')}
            compact
            onPress={() => onPractice(dailyTwister)}
            icon={<Play size={16} color={palette.textOnGold} strokeWidth={2.6} />}
            style={styles.cta}
          />
        </>
      )}

      <ProgressSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: palette.goldMark,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
  },
  streakChipOn: {
    backgroundColor: palette.amberSoft,
    borderColor: 'rgba(242,166,90,0.5)',
  },
  streakText: {
    marginLeft: 5,
    color: palette.textSecondary,
    fontWeight: '800',
    fontSize: 12,
  },
  streakTextOn: {
    color: palette.amber,
  },
  title: {
    marginTop: space.md,
  },
  text: {
    marginTop: space.xs,
  },
  subtitle: {
    marginTop: space.md,
  },
  cta: {
    marginTop: space.md,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
  },
  doneText: {
    marginLeft: space.sm,
    color: palette.mint,
    fontWeight: '700',
  },
});

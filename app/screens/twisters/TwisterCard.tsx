import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Play, Trash2 } from '../../components/icons';
import { GlassCard } from '../../components/GlassCard';
import { TagPill } from '../../components/TagPill';
import { SaveToggle } from '../../components/SaveToggle';
import { AuroraButton } from '../../components/AuroraButton';
import { PressBounce } from '../../components/PressBounce';
import { palette, space, type } from '../../theme';
import type { TwisterEntry } from '../../data/types';
import { useI18n } from '../../i18n';

interface Props {
  entry: TwisterEntry;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onPractice: (entry: TwisterEntry) => void;
  onRemove?: (id: string) => void;
  /** Best pronunciation accuracy, if the twister was checked before. */
  best?: number;
}

function TwisterCardBase({ entry, saved, onToggleSave, onPractice, onRemove, best }: Props) {
  const { t } = useI18n();
  return (
    <GlassCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={type.heading} numberOfLines={1}>
            {entry.title}
          </Text>
          <View style={styles.pillRow}>
            <TagPill label={t(`difficulty.${entry.difficulty}`)} accentKey={entry.difficulty} />
            {entry.custom ? (
              <View style={styles.minePill}>
                <Text style={styles.mineText}>{t('twisters.yours')}</Text>
              </View>
            ) : null}
            {best !== undefined ? (
              <View style={styles.bestPill}>
                <Text style={styles.bestText}>{t('twisters.best', { pct: best })}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <SaveToggle saved={saved} onToggle={() => onToggleSave(entry.id)} iconOnly />
      </View>

      <Text style={[type.body, styles.preview]} numberOfLines={2}>
        {entry.text}
      </Text>

      <View style={styles.actions}>
        <AuroraButton
          label={t('twisters.practice')}
          compact
          onPress={() => onPractice(entry)}
          icon={<Play size={16} color={palette.textOnGold} strokeWidth={2.6} />}
          style={styles.practiceBtn}
        />
        {entry.custom && onRemove ? (
          <PressBounce
            onPress={() => onRemove(entry.id)}
            accessibilityLabel={t('twisters.delete')}
            style={styles.trashBtn}>
            <Trash2 size={18} color={palette.coral} strokeWidth={2.2} />
          </PressBounce>
        ) : null}
      </View>
    </GlassCard>
  );
}

export const TwisterCard = memo(TwisterCardBase);

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    paddingRight: space.sm,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  minePill: {
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.violetEdge,
  },
  mineText: {
    color: palette.neonViolet,
    fontSize: 11,
    fontWeight: '700',
  },
  bestPill: {
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.goldDeep,
  },
  bestText: {
    color: palette.goldMark,
    fontSize: 11,
    fontWeight: '800',
  },
  preview: {
    marginTop: space.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
  },
  practiceBtn: {
    flex: 1,
  },
  trashBtn: {
    marginLeft: space.md,
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.coralSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,124,140,0.4)',
  },
});

import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Mic, Pencil, Plus, Trash2 } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { SectionIntro } from '../../components/SectionIntro';
import { GlassCard } from '../../components/GlassCard';
import { AuroraButton } from '../../components/AuroraButton';
import { PressBounce } from '../../components/PressBounce';
import { normalizeWords } from '../../utils/similarity';
import { useI18n } from '../../i18n';
import type { SpeechDraft } from '../../storage/vault';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';

interface Props {
  speeches: SpeechDraft[];
  /** Emotion / speech mode switch rendered above the list. */
  modeSwitch: React.ReactNode;
  onNew: () => void;
  onEdit: (speech: SpeechDraft) => void;
  onRehearse: (speech: SpeechDraft) => void;
  onRemove: (id: string) => void;
}

export function SpeechListScreen({ speeches, modeSwitch, onNew, onEdit, onRehearse, onRemove }: Props) {
  const { t } = useI18n();

  const renderItem = useCallback(
    ({ item }: { item: SpeechDraft }) => {
      const words = normalizeWords(item.text).length;
      const last = item.attempts[0];
      return (
        <GlassCard style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.flex}>
              <Text style={type.heading} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[type.caption, styles.meta]}>
                {item.lang.toUpperCase()} ·{' '}
                {t('speech.words', { n: words, min: Math.max(1, Math.round(words / 140)) })}
              </Text>
            </View>
            <PressBounce
              onPress={() => onEdit(item)}
              accessibilityLabel={t('speech.edit')}
              style={styles.iconBtn}>
              <Pencil size={17} color={palette.textSecondary} strokeWidth={2.2} />
            </PressBounce>
            <PressBounce
              onPress={() => onRemove(item.id)}
              accessibilityLabel={t('speech.delete')}
              style={[styles.iconBtn, styles.trash]}>
              <Trash2 size={17} color={palette.coral} strokeWidth={2.2} />
            </PressBounce>
          </View>
          <Text style={[type.body, styles.preview]} numberOfLines={2}>
            {item.text}
          </Text>
          <Text style={[type.caption, styles.last]}>
            {last
              ? t('speech.last', { wpm: last.wpm, fillers: last.fillerTotal })
              : t('speech.never')}
          </Text>
          <AuroraButton
            label={t('speech.rehearse')}
            compact
            onPress={() => onRehearse(item)}
            icon={<Mic size={16} color={palette.textOnGold} strokeWidth={2.6} />}
            style={styles.btn}
          />
        </GlassCard>
      );
    },
    [t, onEdit, onRemove, onRehearse],
  );

  return (
    <ScreenBackdrop>
      <FlatList
        data={speeches}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View style={styles.flex}>
                <SectionIntro title={t('speech.title')} subtitle={t('speech.subtitle')} />
              </View>
              <PressBounce onPress={onNew} style={styles.addBtn} accessibilityLabel={t('speech.new')}>
                <Plus size={16} color={palette.textOnGold} strokeWidth={2.8} />
              </PressBounce>
            </View>
            {modeSwitch}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.body, styles.emptyText]}>{t('speech.empty')}</Text>
            <AuroraButton
              label={t('speech.new')}
              onPress={onNew}
              icon={<Plus size={18} color={palette.textOnGold} strokeWidth={2.6} />}
              style={styles.btn}
            />
          </View>
        }
      />
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: SCROLL_BOTTOM_GAP,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldMark,
    marginTop: space.xs,
  },
  card: {
    marginBottom: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  meta: {
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.violetSoft,
    marginLeft: space.sm,
  },
  trash: {
    backgroundColor: palette.coralSoft,
  },
  preview: {
    marginTop: space.md,
  },
  last: {
    marginTop: space.sm,
    color: palette.goldMark,
  },
  btn: {
    marginTop: space.lg,
  },
  empty: {
    paddingVertical: space.xxl,
  },
  emptyText: {
    textAlign: 'center',
  },
});

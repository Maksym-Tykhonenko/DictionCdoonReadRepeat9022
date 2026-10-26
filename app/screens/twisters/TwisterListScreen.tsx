import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Plus, Bookmark } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { SectionIntro } from '../../components/SectionIntro';
import { SegmentToggle } from '../../components/SegmentToggle';
import { PressBounce } from '../../components/PressBounce';
import { TwisterCard } from './TwisterCard';
import { useLibrary } from '../../hooks/useLibrary';
import { DIFFICULTY_FILTERS } from '../../data/twisterDeck';
import { LanguageButton } from '../../components/LanguagePicker';
import { DailyCard } from './DailyCard';
import { useI18n } from '../../i18n';
import type { Difficulty, TwisterEntry } from '../../data/types';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';

type Filter = 'All' | Difficulty;

interface Props {
  onPractice: (entry: TwisterEntry) => void;
  onAdd: () => void;
}

export function TwisterListScreen({ onPractice, onAdd }: Props) {
  const { twisters, savedIds, isSaved, toggleSaved, removeCustomTwister, twisterBest } =
    useLibrary();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>('All');
  const [savedOnly, setSavedOnly] = useState(false);

  const data = useMemo(() => {
    return twisters.filter(tw => {
      if (savedOnly && !savedIds.includes(tw.id)) {
        return false;
      }
      if (filter !== 'All' && tw.difficulty !== filter) {
        return false;
      }
      return true;
    });
  }, [twisters, savedIds, savedOnly, filter]);

  const renderItem = useCallback(
    ({ item }: { item: TwisterEntry }) => (
      <TwisterCard
        entry={item}
        saved={isSaved(item.id)}
        onToggleSave={toggleSaved}
        onPractice={onPractice}
        onRemove={removeCustomTwister}
        best={twisterBest[item.id]}
      />
    ),
    [isSaved, toggleSaved, onPractice, removeCustomTwister, twisterBest],
  );

  const header = (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <SectionIntro title={t('twisters.title')} subtitle={t('twisters.subtitle')} />
        </View>
        <View style={styles.headerActions}>
          <LanguageButton />
          <PressBounce onPress={onAdd} style={styles.addBtn} accessibilityLabel={t('twisters.addA11y')}>
            <Plus size={16} color={palette.textOnGold} strokeWidth={2.8} />
            <Text style={styles.addText}>{t('twisters.add')}</Text>
          </PressBounce>
        </View>
      </View>

      <DailyCard onPractice={onPractice} />

      <SegmentToggle
        options={DIFFICULTY_FILTERS}
        value={filter}
        onChange={setFilter}
        labelFor={f => (f === 'All' ? t('common.all') : t(`difficulty.${f}`))}
        scroll
        style={styles.filters}
      />

      <PressBounce
        onPress={() => setSavedOnly(s => !s)}
        style={[styles.savedRow, savedOnly && styles.savedRowActive]}>
        <Bookmark
          size={17}
          color={savedOnly ? palette.goldMark : palette.textSecondary}
          strokeWidth={2.2}
        />
        <Text style={[styles.savedLabel, savedOnly && styles.savedLabelActive]}>
          {t('twisters.saved')}
        </Text>
        <View style={styles.countChip}>
          <Text style={styles.countText}>{savedIds.length}</Text>
        </View>
      </PressBounce>
    </View>
  );

  return (
    <ScreenBackdrop>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.body, styles.emptyText]}>
              {savedOnly ? t('twisters.emptySaved') : t('twisters.emptyFilter')}
            </Text>
          </View>
        }
        initialNumToRender={6}
        windowSize={9}
        removeClippedSubviews
      />
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: SCROLL_BOTTOM_GAP,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.goldMark,
  },
  addText: {
    color: palette.textOnGold,
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 5,
  },
  filters: {
    marginBottom: space.md,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    marginBottom: space.lg,
  },
  savedRowActive: {
    borderColor: palette.goldDeep,
    backgroundColor: palette.goldSoft,
  },
  savedLabel: {
    flex: 1,
    marginLeft: space.md,
    color: palette.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  savedLabelActive: {
    color: palette.textPrimary,
  },
  countChip: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.violetSoft,
  },
  countText: {
    color: palette.goldMark,
    fontWeight: '800',
    fontSize: 12,
  },
  empty: {
    paddingVertical: space.xxxl,
    paddingHorizontal: space.lg,
  },
  emptyText: {
    textAlign: 'center',
  },
});

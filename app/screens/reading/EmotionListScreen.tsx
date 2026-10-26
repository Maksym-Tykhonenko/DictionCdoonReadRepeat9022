import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { SectionIntro } from '../../components/SectionIntro';
import { SegmentToggle } from '../../components/SegmentToggle';
import { EmotionCard } from './EmotionCard';
import { useLibrary } from '../../hooks/useLibrary';
import { EMOTION_SCRIPTS, EMOTION_TAGS } from '../../data/emotionScripts';
import type { EmotionScript } from '../../data/types';
import { space, type, SCROLL_BOTTOM_GAP } from '../../theme';
import { useI18n } from '../../i18n';

export function EmotionListScreen({
  onStart,
  modeSwitch,
}: {
  onStart: (script: EmotionScript) => void;
  /** Emotion / speech mode switch rendered above the filters. */
  modeSwitch?: React.ReactNode;
}) {
  const { isReadingDone } = useLibrary();
  const { t } = useI18n();
  const [filter, setFilter] = useState<string>('All');

  const filters = useMemo(() => ['All', ...EMOTION_TAGS], []);

  const data = useMemo(() => {
    if (filter === 'All') {
      return EMOTION_SCRIPTS;
    }
    return EMOTION_SCRIPTS.filter(s => s.emotions.includes(filter));
  }, [filter]);

  const renderItem = useCallback(
    ({ item }: { item: EmotionScript }) => (
      <EmotionCard script={item} done={isReadingDone(item.id)} onStart={onStart} />
    ),
    [isReadingDone, onStart],
  );

  const header = (
    <View>
      <SectionIntro
        title={t('reading.title')}
        subtitle={t('reading.subtitle')}
      />
      {modeSwitch}
      <SegmentToggle
        options={filters}
        value={filter}
        onChange={setFilter}
        labelFor={f => (f === 'All' ? t('common.all') : f)}
        scroll
        style={styles.filters}
      />
    </View>
  );

  return (
    <ScreenBackdrop>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[type.body, styles.empty]}>{t('reading.empty')}</Text>
        }
        initialNumToRender={5}
        windowSize={9}
        removeClippedSubviews
      />
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: SCROLL_BOTTOM_GAP,
  },
  filters: {
    marginBottom: space.lg,
  },
  empty: {
    textAlign: 'center',
    marginTop: space.xxxl,
  },
});

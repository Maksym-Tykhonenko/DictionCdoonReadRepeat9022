import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { SectionIntro } from '../../components/SectionIntro';
import { TipRow } from './TipRow';
import { VOICE_POINTERS } from '../../data/voicePointers';
import type { VoicePointer } from '../../data/types';
import { space, SCROLL_BOTTOM_GAP } from '../../theme';
import { useI18n } from '../../i18n';

export function TipsListScreen({
  onOpen,
}: {
  onOpen: (pointer: VoicePointer) => void;
}) {
  const { t } = useI18n();
  const renderItem = useCallback(
    ({ item }: { item: VoicePointer }) => <TipRow pointer={item} onOpen={onOpen} />,
    [onOpen],
  );

  return (
    <ScreenBackdrop>
      <FlatList
        data={VOICE_POINTERS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            <SectionIntro
              title={t('tips.title')}
              subtitle={t('tips.subtitle')}
            />
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
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
});

import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SegmentToggle } from '../../components/SegmentToggle';
import { EmotionListScreen } from './EmotionListScreen';
import { SpeechListScreen } from './SpeechListScreen';
import { useSpeeches } from '../../hooks/useSpeeches';
import { useRootNavigation } from '../../navigation/types';
import { useI18n } from '../../i18n';
import type { EmotionScript } from '../../data/types';
import { space } from '../../theme';

type Mode = 'emotion' | 'speech';

export function ReadingTab() {
  const { t } = useI18n();
  const navigation = useRootNavigation();
  const [mode, setMode] = useState<Mode>('emotion');
  const { speeches, removeSpeech } = useSpeeches();

  const openPractice = useCallback(
    (script: EmotionScript) => navigation.navigate('EmotionPractice', { scriptId: script.id }),
    [navigation],
  );

  const modeSwitch = (
    <SegmentToggle
      options={['emotion', 'speech'] as const}
      value={mode}
      onChange={setMode}
      labelFor={m => (m === 'emotion' ? t('reading.modeEmotion') : t('reading.modeSpeech'))}
      style={styles.modeSwitch}
    />
  );

  if (mode === 'emotion') {
    return <EmotionListScreen onStart={openPractice} modeSwitch={modeSwitch} />;
  }
  return (
    <SpeechListScreen
      speeches={speeches}
      modeSwitch={modeSwitch}
      onNew={() => navigation.navigate('SpeechEdit', {})}
      onEdit={item => navigation.navigate('SpeechEdit', { speechId: item.id })}
      onRehearse={item => navigation.navigate('SpeechRehearsal', { speechId: item.id })}
      onRemove={removeSpeech}
    />
  );
}

const styles = StyleSheet.create({
  modeSwitch: {
    marginBottom: space.lg,
  },
});

import React, { useCallback } from 'react';
import { TipsListScreen } from './TipsListScreen';
import { useRootNavigation } from '../../navigation/types';
import type { VoicePointer } from '../../data/types';

export function TipsTab() {
  const navigation = useRootNavigation();
  const open = useCallback(
    (pointer: VoicePointer) => navigation.navigate('TipDetail', { pointerId: pointer.id }),
    [navigation],
  );
  return <TipsListScreen onOpen={open} />;
}

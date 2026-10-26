import React, { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { TwisterListScreen } from './TwisterListScreen';
import type { TwisterEntry } from '../../data/types';
import { twisterDeckFor } from '../../data/twisterDeck';
import { subscribeDuel, takeDuel } from '../../state/duelInbox';
import { useRootNavigation } from '../../navigation/types';
import { useI18n } from '../../i18n';

export function TwistersTab() {
  const navigation = useRootNavigation();
  const { t } = useI18n();

  // Open a challenged twister from a deep link or a typed code.
  useEffect(() => {
    const open = () => {
      const duel = takeDuel();
      if (!duel) {
        return;
      }
      const entry = twisterDeckFor(duel.lang).find(item => item.id === duel.twisterId);
      if (!entry) {
        Alert.alert(t('progress.duelUnknown'));
        return;
      }
      navigation.navigate('TwisterPractice', { entry, duelScore: duel.score });
    };
    open();
    return subscribeDuel(open);
  }, [t, navigation]);

  const openPractice = useCallback(
    (entry: TwisterEntry) => navigation.navigate('TwisterPractice', { entry }),
    [navigation],
  );

  return (
    <TwisterListScreen onPractice={openPractice} onAdd={() => navigation.navigate('AddTwister')} />
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { ToneDock } from './ToneDock';
import type { TabKey } from './tabs';
import { peekDuel, subscribeDuel } from '../state/duelInbox';
import { TwistersTab } from '../screens/twisters/TwistersTab';
import { ReadingTab } from '../screens/reading/ReadingTab';
import { TipsTab } from '../screens/tips/TipsTab';
import { QuizTab } from '../screens/quiz/QuizTab';
import { GameTab } from '../screens/game/GameTab';

function renderTab(key: TabKey) {
  switch (key) {
    case 'twisters':
      return <TwistersTab />;
    case 'reading':
      return <ReadingTab />;
    case 'tips':
      return <TipsTab />;
    case 'quiz':
      return <QuizTab />;
    case 'game':
      return <GameTab />;
  }
}

/** Crossfades whenever the active tab key changes. */
function TabFader({ tabKey }: { tabKey: TabKey }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tabKey, fade]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: fade,
          transform: [
            {
              translateY: fade.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}>
      {renderTab(tabKey)}
    </Animated.View>
  );
}

/**
 * The "Main" stack screen: five tabs with the floating dock. Detail screens
 * are pushed on the root stack above it, so the dock is simply covered.
 */
export function TabShell() {
  const [active, setActive] = useState<TabKey>('twisters');

  // An incoming duel always lands on the Twisters tab.
  useEffect(
    () =>
      subscribeDuel(() => {
        if (peekDuel()) {
          setActive('twisters');
        }
      }),
    [],
  );

  return (
    <View style={styles.root}>
      <TabFader tabKey={active} />
      <View style={styles.dockLayer}>
        <ToneDock active={active} onSelect={setActive} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dockLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

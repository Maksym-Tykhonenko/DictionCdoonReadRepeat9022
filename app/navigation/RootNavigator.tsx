import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { parseDuel } from '../utils/duel';
import { pushDuel } from '../state/duelInbox';
import { palette } from '../theme';
import type { RootStackParamList } from './types';
import {
  AddTwisterRoute,
  EmotionPracticeRoute,
  IntroRoute,
  LoaderRoute,
  MainRoute,
  QuizPlayRoute,
  QuizResultRoute,
  SpeechEditRoute,
  SpeechRehearsalRoute,
  TipDetailRoute,
  TwisterPracticeRoute,
} from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.goldMark,
    background: palette.abyss,
    card: palette.abyss,
    text: palette.textPrimary,
    border: palette.hairline,
    notification: palette.goldMark,
  },
};

/** Root stack: loader → intro → tabs, with every detail screen pushed on top. */
export function RootNavigator() {
  // Duel links: dictioncrown://duel?c=DC-EN12-87 (cold start + while running).
  useEffect(() => {
    const handle = (url: string | null) => {
      const duel = url ? parseDuel(url) : null;
      if (duel) {
        pushDuel(duel);
      }
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', event => handle(event.url));
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Loader"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: palette.abyss },
        }}>
        <Stack.Screen name="Loader" component={LoaderRoute} options={{ animation: 'fade' }} />
        <Stack.Screen name="Intro" component={IntroRoute} options={{ animation: 'fade' }} />
        <Stack.Screen name="Main" component={MainRoute} options={{ animation: 'fade' }} />
        <Stack.Screen name="TwisterPractice" component={TwisterPracticeRoute} />
        <Stack.Screen
          name="AddTwister"
          component={AddTwisterRoute}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="EmotionPractice" component={EmotionPracticeRoute} />
        <Stack.Screen name="SpeechEdit" component={SpeechEditRoute} />
        <Stack.Screen name="SpeechRehearsal" component={SpeechRehearsalRoute} />
        <Stack.Screen name="TipDetail" component={TipDetailRoute} />
        <Stack.Screen name="QuizPlay" component={QuizPlayRoute} />
        <Stack.Screen name="QuizResult" component={QuizResultRoute} options={{ animation: 'fade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

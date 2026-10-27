import React, { useEffect, useState }  from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './app/i18n';
import { LibraryProvider } from './app/hooks/useLibrary';
import { ProgressProvider } from './app/hooks/useProgress';
import { SpeechesProvider } from './app/hooks/useSpeeches';
import { RootNavigator } from './app/navigation/RootNavigator';
//
import {LogLevel, OneSignal} from 'react-native-onesignal';
// Значення міняємо в src/config/projectConfig.jsx, не тут.
import { ONESIGNAL_APP_ID } from './app/config/projectConfig';

export default function App() {
  const [oneSignKkkk] = useState(ONESIGNAL_APP_ID);

  useEffect(() => {
    const initOnsignall = async () => {
      try {
        // Verbose-логи лишаємо тільки в дебазі
        if (__DEV__) {
          OneSignal.Debug.setLogLevel(LogLevel.Verbose);
        }

        // OneSignal ініціалізація
        if (ONESIGNAL_APP_ID) {
          OneSignal.initialize(oneSignKkkk);
        }
      } catch (e) {
        //console.log('OneSignal init error:', e);
      }
    };

    initOnsignall();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <LibraryProvider>
          <ProgressProvider>
            <SpeechesProvider>
              <RootNavigator />
            </SpeechesProvider>
          </ProgressProvider>
        </LibraryProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

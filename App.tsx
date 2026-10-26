import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './app/i18n';
import { LibraryProvider } from './app/hooks/useLibrary';
import { ProgressProvider } from './app/hooks/useProgress';
import { SpeechesProvider } from './app/hooks/useSpeeches';
import { RootNavigator } from './app/navigation/RootNavigator';

export default function App() {
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

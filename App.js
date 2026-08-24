import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { JournalProvider } from './src/context/JournalContext';

import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  return (
    <SettingsProvider>
      <JournalProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </JournalProvider>
    </SettingsProvider>
  );
}

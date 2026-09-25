import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { EBGaramond_400Regular, EBGaramond_500Medium, EBGaramond_600SemiBold, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { JournalProvider } from './src/context/JournalContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { StatusBar } from 'react-native';
import PinLockModal from './src/components/PinLockModal';
import { initDB } from './src/database/db';

initDB();

function MainAppContent() {
  const { isUnlocked, pinLockEnabled, isDark, theme } = useSettings();

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.cardBackground,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background} 
        translucent={false}
      />
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
      <PinLockModal visible={!isUnlocked && pinLockEnabled} mode="unlock" />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Lora_400Regular,
    Lora_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
  });

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <JournalProvider>
          <MainAppContent />
        </JournalProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

import React, { createContext, useState, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

const SettingsContext = createContext();

export const lightTheme = {
  background: '#F7F9FC',
  cardBackground: '#FFFFFF',
  cardCompleted: '#F9F9F9',
  text: '#1A1A1A',
  textSecondary: '#8E8E93',
  textCompleted: '#A0A0A0',
  border: '#F0F0F0',
  primary: '#007AFF',
  primaryBackground: '#E6F4FE',
  tabBar: '#FFFFFF',
  inputBackground: '#F2F2F7',
  iconInactive: '#666',
  buttonBackground: '#D1D1D6',
};

export const darkTheme = {
  background: '#000000',
  cardBackground: '#1C1C1E',
  cardCompleted: '#121212',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textCompleted: '#636366',
  border: '#38383A',
  primary: '#0A84FF',
  primaryBackground: '#002E5C',
  tabBar: '#1C1C1E',
  inputBackground: '#2C2C2E',
  iconInactive: '#999',
  buttonBackground: '#3A3A3C',
};

export function SettingsProvider({ children }) {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark'
  const [themePreference, setThemePreference] = useState('system'); // 'light' | 'dark' | 'system'
  const [language, setLanguage] = useState('es'); // 'es' | 'en'
  const [timezone, setTimezone] = useState('Europe/Madrid'); // 'system' | 'Europe/Madrid' | ...
  const [fontFamily, setFontFamily] = useState('system'); // 'system' | 'inter' | 'lora' | 'jetbrains'

  const [typographyConfig, setTypographyConfig] = useState({
    h1: { fontFamily: null, fontSize: 30, fontWeight: '800', color: null },
    h2: { fontFamily: null, fontSize: 24, fontWeight: '800', color: null },
    h3: { fontFamily: null, fontSize: 20, fontWeight: '700', color: null },
    body: { fontFamily: null, fontSize: 16, fontWeight: '500', color: null },
    caption: { fontFamily: null, fontSize: 13, fontWeight: '600', color: null },
    micro: { fontFamily: null, fontSize: 12, fontWeight: '400', color: null }
  });

  const activeTheme = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themePreference === 'dark' ? darkTheme : lightTheme;
  }, [themePreference, systemColorScheme]);

  return (
    <SettingsContext.Provider value={{
      themePreference,
      setThemePreference,
      language,
      setLanguage,
      timezone,
      setTimezone,
      fontFamily,
      setFontFamily,
      typographyConfig,
      setTypographyConfig,
      theme: activeTheme,
      isDark: activeTheme === darkTheme
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

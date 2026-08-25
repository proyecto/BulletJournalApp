import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import db from '../database/db';

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
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [themePreference, setThemePreferenceState] = useState('system'); // 'light' | 'dark' | 'system'
  const [language, setLanguageState] = useState('es'); // 'es' | 'en'
  const [timezone, setTimezoneState] = useState('Europe/Madrid'); // 'system' | 'Europe/Madrid' | ...
  const [fontFamily, setFontFamilyState] = useState('system'); // 'system' | 'inter' | 'lora' | 'jetbrains'

  const [typographyConfig, setTypographyConfigState] = useState({
    h1: { fontFamily: null, fontSize: 30, fontWeight: '800', color: null },
    h2: { fontFamily: null, fontSize: 24, fontWeight: '800', color: null },
    h3: { fontFamily: null, fontSize: 20, fontWeight: '700', color: null },
    body: { fontFamily: null, fontSize: 16, fontWeight: '500', color: null },
    caption: { fontFamily: null, fontSize: 13, fontWeight: '600', color: null },
    micro: { fontFamily: null, fontSize: 12, fontWeight: '400', color: null }
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const rows = await db.getAllAsync('SELECT key, value FROM settings');
        const settings = {};
        rows.forEach(row => { settings[row.key] = row.value; });
        
        if (settings.themePreference) setThemePreferenceState(settings.themePreference);
        if (settings.language) setLanguageState(settings.language);
        if (settings.timezone) setTimezoneState(settings.timezone);
        if (settings.fontFamily) setFontFamilyState(settings.fontFamily);
        if (settings.typographyConfig) setTypographyConfigState(JSON.parse(settings.typographyConfig));
      } catch (e) {
        console.error('Error loading settings from SQLite', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const saveSetting = async (key, value) => {
    try {
      const valString = typeof value === 'string' ? value : JSON.stringify(value);
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, valString]);
    } catch (e) {
      console.error('Error saving setting to SQLite', e);
    }
  };

  const setThemePreference = (val) => { setThemePreferenceState(val); saveSetting('themePreference', val); };
  const setLanguage = (val) => { setLanguageState(val); saveSetting('language', val); };
  const setTimezone = (val) => { setTimezoneState(val); saveSetting('timezone', val); };
  const setFontFamily = (val) => { setFontFamilyState(val); saveSetting('fontFamily', val); };
  
  const setTypographyConfig = (val) => { 
    setTypographyConfigState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSetting('typographyConfig', next);
      return next;
    }); 
  };

  const activeTheme = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themePreference === 'dark' ? darkTheme : lightTheme;
  }, [themePreference, systemColorScheme]);

  if (!isLoaded) return null;

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

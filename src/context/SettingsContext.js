/**
 * @module SettingsContext
 * @pattern Facade + Observer + Memoization
 *
 * FACADE: Expone una API limpia para leer y escribir preferencias de usuario.
 * Internamente coordina el SettingsRepository para la persistencia.
 *
 * OBSERVER: Via React Context, todos los componentes suscritos se re-renderizan
 * cuando cambia cualquier preferencia (tema, idioma, fuente...).
 *
 * MEMOIZATION (useMemo): El cálculo del tema activo (`activeTheme`) se memoiza.
 * Solo se recalcula cuando cambian `themePreference` o el scheme del sistema,
 * evitando cálculos innecesarios en cada render.
 */

import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SettingsRepository from '../repositories/SettingsRepository';
import {
  lightTheme,
  darkTheme,
  sepiaTheme,
  obsidianTheme,
  thingsTheme,
  nordTheme,
  matchaTheme,
  asanaTheme,
  todoistTheme,
  trelloTheme,
  THEMES_MAP,
  themeOptions,
  TYPOGRAPHY_PRESETS,
} from '../constants/themes';

// ─── Re-exportación de Temas ─────────────────────────────────────────────────
export {
  lightTheme,
  darkTheme,
  sepiaTheme,
  obsidianTheme,
  thingsTheme,
  nordTheme,
  matchaTheme,
  asanaTheme,
  todoistTheme,
  trelloTheme,
  THEMES_MAP,
  themeOptions,
  TYPOGRAPHY_PRESETS,
};

// ─── Contexto ─────────────────────────────────────────────────────────────────

const SettingsContext = createContext();

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Proveedor de configuración de la aplicación.
 * Gestiona el tema, idioma, timezone y configuración tipográfica.
 * Persiste automáticamente cualquier cambio en SQLite via SettingsRepository.
 *
 * @param {React.ReactNode} children - Componentes hijos que tendrán acceso a la configuración.
 */
export function SettingsProvider({ children }) {
  // El colorScheme del sistema operativo: 'light' | 'dark' | null
  const systemColorScheme = useColorScheme();
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Estado de preferencias del usuario ──────────────────────────────────────
  /** @type {'light'|'dark'|'system'} Preferencia de tema del usuario */
  const [themePreference, setThemePreferenceState] = useState('system');
  /** @type {'es'|'en'} Idioma de la interfaz */
  const [language, setLanguageState] = useState('es');
  /** @type {string} Identificador IANA de timezone (ej: 'Europe/Madrid') */
  const [timezone, setTimezoneState] = useState('Europe/Madrid');
  /** @type {'monday'|'sunday'} Primer día de la semana */
  const [firstDayOfWeek, setFirstDayOfWeekState] = useState('monday');
  /** @type {string} Familia tipográfica global ('system'|'inter'|'lora'|'jetbrains') */
  const [fontFamily, setFontFamilyState] = useState('system');
  /** @type {Object} Configuración detallada de variantes tipográficas (h1, body, etc.) */
  const [typographyConfig, setTypographyConfigState] = useState({
    h1:      { fontFamily: null, fontSize: 30, fontWeight: '800', color: null },
    h2:      { fontFamily: null, fontSize: 24, fontWeight: '800', color: null },
    h3:      { fontFamily: null, fontSize: 20, fontWeight: '700', color: null },
    body:    { fontFamily: null, fontSize: 16, fontWeight: '500', color: null },
    caption: { fontFamily: null, fontSize: 13, fontWeight: '600', color: null },
    micro:   { fontFamily: null, fontSize: 12, fontWeight: '400', color: null },
  });

  /** @type {boolean} Si la fuente recomendada del tema se sincroniza al cambiar de tema */
  const [syncThemeFont, setSyncThemeFontState] = useState(true);

  /** @type {boolean} Si el bloqueo por PIN está activado */
  const [pinLockEnabled, setPinLockEnabledState] = useState(false);
  /** @type {string|null} Código PIN numérico de 4 dígitos */
  const [pinCode, setPinCodeState] = useState(null);
  /** @type {boolean} Estado de sesión actual (true = desbloqueada, false = requiere PIN) */
  const [isUnlocked, setIsUnlockedState] = useState(true);

  /**
   * Carga inicial de todas las preferencias guardadas desde SQLite.
   * Se ejecuta una sola vez al montar el Provider.
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // El repositorio devuelve un objeto plano { key: value }
        const settings = await SettingsRepository.getAllSettings();

        if (settings.themePreference) setThemePreferenceState(settings.themePreference);
        if (settings.language)        setLanguageState(settings.language);
        if (settings.timezone)        setTimezoneState(settings.timezone);
        if (settings.firstDayOfWeek)  setFirstDayOfWeekState(settings.firstDayOfWeek);
        if (settings.fontFamily)      setFontFamilyState(settings.fontFamily);
        if (settings.pinCode)         setPinCodeState(settings.pinCode);

        if (settings.syncThemeFont !== undefined) {
          const isSync = settings.syncThemeFont === 'true' || settings.syncThemeFont === true;
          setSyncThemeFontState(isSync);
        }

        if (settings.pinLockEnabled !== undefined) {
          const isEnabled = settings.pinLockEnabled === 'true' || settings.pinLockEnabled === true;
          setPinLockEnabledState(isEnabled);
          if (isEnabled && settings.pinCode) {
            setIsUnlockedState(false); // Requiere PIN al arrancar si está activado
          }
        }

        if (settings.typographyConfig) {
          // typographyConfig es un objeto complejo serializado como JSON string
          setTypographyConfigState(JSON.parse(settings.typographyConfig));
        }
      } catch (e) {
        console.error('[SettingsContext] Error cargando configuración de SQLite:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // ── Setters que persisten automáticamente ────────────────────────────────────

  /**
   * Patrón genérico: cada setter actualiza el estado de React Y persiste en SQLite.
   * Si en el futuro la persistencia cambia (ej: a una API REST), solo se cambia aquí.
   */

  /** Actualiza la preferencia de tema y la persiste, sincronizando la fuente si está activado. */
  const setThemePreference = useCallback((val) => {
    setThemePreferenceState(val);
    SettingsRepository.saveSetting('themePreference', val);
    if (syncThemeFont) {
      const themeObj = THEMES_MAP[val];
      if (themeObj && themeObj.recommendedFont) {
        setFontFamilyState(themeObj.recommendedFont);
        SettingsRepository.saveSetting('fontFamily', themeObj.recommendedFont);
      }
    }
  }, [syncThemeFont]);

  /** Activa o desactiva la sincronización de la fuente recomendada con el tema. */
  const setSyncThemeFont = useCallback((val) => {
    setSyncThemeFontState(val);
    SettingsRepository.saveSetting('syncThemeFont', val ? 'true' : 'false');
  }, []);

  /** Actualiza el idioma de la interfaz y lo persiste. */
  const setLanguage = useCallback((val) => {
    setLanguageState(val);
    SettingsRepository.saveSetting('language', val);
  }, []);

  /** Actualiza el timezone y lo persiste. */
  const setTimezone = useCallback((val) => {
    setTimezoneState(val);
    SettingsRepository.saveSetting('timezone', val);
  }, []);

  /** Actualiza el primer día de la semana ('monday' | 'sunday') y lo persiste. */
  const setFirstDayOfWeek = useCallback((val) => {
    setFirstDayOfWeekState(val);
    SettingsRepository.saveSetting('firstDayOfWeek', val);
  }, []);

  /** Configura un nuevo PIN de 4 dígitos y activa el bloqueo. */
  const setupPin = useCallback((code) => {
    setPinCodeState(code);
    setPinLockEnabledState(true);
    setIsUnlockedState(true);
    SettingsRepository.saveSetting('pinCode', code);
    SettingsRepository.saveSetting('pinLockEnabled', 'true');
  }, []);

  /** Elimina el PIN y desactiva el bloqueo. */
  const removePin = useCallback(() => {
    setPinCodeState(null);
    setPinLockEnabledState(false);
    setIsUnlockedState(true);
    SettingsRepository.saveSetting('pinCode', '');
    SettingsRepository.saveSetting('pinLockEnabled', 'false');
  }, []);

  /** Comprueba el PIN introducido y desbloquea si es correcto. */
  const verifyPin = useCallback((enteredCode) => {
    if (enteredCode === pinCode) {
      setIsUnlockedState(true);
      return true;
    }
    return false;
  }, [pinCode]);

  /** Bloquea manualmente la sesión de la aplicación. */
  const lockApp = useCallback(() => {
    if (pinLockEnabled && pinCode) {
      setIsUnlockedState(false);
    }
  }, [pinLockEnabled, pinCode]);

  /** Actualiza la familia tipográfica global y la persiste. */
  const setFontFamily = useCallback((val) => {
    setFontFamilyState(val);
    SettingsRepository.saveSetting('fontFamily', val);
  }, []);

  /**
   * Actualiza la configuración tipográfica detallada y la persiste como JSON.
   */
  const setTypographyConfig = useCallback((val) => {
    setTypographyConfigState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      SettingsRepository.saveSetting('typographyConfig', next);
      return next;
    });
  }, []);

  /**
   * Aplica un preset tipográfico completo (fuente global y variantes h1..micro).
   */
  const applyTypographyPreset = useCallback((presetId) => {
    const preset = TYPOGRAPHY_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    if (preset.globalFont) {
      setFontFamilyState(preset.globalFont);
      SettingsRepository.saveSetting('fontFamily', preset.globalFont);
    }
    if (preset.config) {
      setTypographyConfigState(preset.config);
      SettingsRepository.saveSetting('typographyConfig', preset.config);
    }
  }, []);

  // ── Tema Activo (Memoization) ─────────────────────────────────────────────────

  const activeTheme = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return THEMES_MAP[themePreference] || (themePreference === 'dark' ? darkTheme : lightTheme);
  }, [themePreference, systemColorScheme]);

  // ── Sincronizar Barra de Navegación de Android ─────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'android' && activeTheme) {
      NavigationBar.setBackgroundColorAsync(activeTheme.background).catch(() => {});
      NavigationBar.setButtonStyleAsync(activeTheme.isDark ? 'light' : 'dark').catch(() => {});
    }
  }, [activeTheme]);

  const resetSettings = useCallback(() => {
    setThemePreferenceState('system');
    setLanguageState('es');
    setTimezoneState('Europe/Madrid');
    setFirstDayOfWeekState('monday');
    setPinLockEnabledState(false);
    setPinCodeState(null);
    setIsUnlockedState(true);
    setFontFamilyState('system');
    setSyncThemeFontState(true);
    setTypographyConfigState({
      h1:      { fontFamily: null, fontSize: 30, fontWeight: '800', color: null },
      h2:      { fontFamily: null, fontSize: 24, fontWeight: '800', color: null },
      h3:      { fontFamily: null, fontSize: 20, fontWeight: '700', color: null },
      body:    { fontFamily: null, fontSize: 16, fontWeight: '500', color: null },
      caption: { fontFamily: null, fontSize: 13, fontWeight: '600', color: null },
      micro:   { fontFamily: null, fontSize: 12, fontWeight: '400', color: null },
    });
  }, []);

  const contextValue = useMemo(() => ({
    themePreference,
    setThemePreference,
    language,
    setLanguage,
    timezone,
    setTimezone,
    firstDayOfWeek,
    setFirstDayOfWeek,
    pinLockEnabled,
    pinCode,
    isUnlocked,
    setupPin,
    removePin,
    verifyPin,
    lockApp,
    fontFamily,
    setFontFamily,
    syncThemeFont,
    setSyncThemeFont,
    typographyConfig,
    setTypographyConfig,
    applyTypographyPreset,
    resetSettings,
    theme: activeTheme,
    isDark: Boolean(activeTheme?.isDark),
  }), [
    themePreference,
    setThemePreference,
    language,
    setLanguage,
    timezone,
    setTimezone,
    firstDayOfWeek,
    setFirstDayOfWeek,
    pinLockEnabled,
    pinCode,
    isUnlocked,
    setupPin,
    removePin,
    verifyPin,
    lockApp,
    fontFamily,
    setFontFamily,
    syncThemeFont,
    setSyncThemeFont,
    typographyConfig,
    setTypographyConfig,
    applyTypographyPreset,
    resetSettings,
    activeTheme,
  ]);

  // Esperamos a tener los datos cargados antes de renderizar
  if (!isLoaded) return null;

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// ─── Hook personalizado ───────────────────────────────────────────────────────

/**
 * Hook de acceso al SettingsContext.
 * Añade validación: lanza un error descriptivo si se usa fuera del Provider.
 *
 * @returns {Object} El valor del contexto con { theme, language, timezone, ... }
 * @throws {Error} Si se usa fuera de un SettingsProvider.
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('[useSettings] Debe usarse dentro de un <SettingsProvider>.');
  }
  return context;
}

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

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SettingsRepository from '../repositories/SettingsRepository';

// ─── Definición de Temas ─────────────────────────────────────────────────────

/**
 * Tema claro de la aplicación.
 * Todos los colores de la app deben consumirse de aquí (via `theme.xxx`)
 * para garantizar la consistencia visual y el soporte de modo oscuro.
 */
export const lightTheme = {
  background:       '#F7F9FC',
  cardBackground:   '#FFFFFF',
  cardCompleted:    '#F9F9F9',
  text:             '#1A1A1A',
  textSecondary:    '#8E8E93',
  textCompleted:    '#A0A0A0',
  border:           '#F0F0F0',
  primary:          '#007AFF',
  primaryBackground:'#E6F4FE',
  tabBar:           '#FFFFFF',
  inputBackground:  '#F2F2F7',
  iconInactive:     '#666',
  buttonBackground: '#D1D1D6',
};

/**
 * Tema oscuro de la aplicación.
 * Tiene exactamente las mismas claves que `lightTheme` para que los componentes
 * puedan intercambiarlo sin necesidad de lógica condicional en la UI.
 */
export const darkTheme = {
  background:       '#000000',
  cardBackground:   '#1C1C1E',
  cardCompleted:    '#121212',
  text:             '#FFFFFF',
  textSecondary:    '#EBEBF5',
  textCompleted:    '#636366',
  border:           '#38383A',
  primary:          '#0A84FF',
  primaryBackground:'#002E5C',
  tabBar:           '#1C1C1E',
  inputBackground:  '#2C2C2E',
  iconInactive:     '#999',
  buttonBackground: '#3A3A3C',
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
        if (settings.fontFamily)      setFontFamilyState(settings.fontFamily);
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

  /** Actualiza la preferencia de tema y la persiste. */
  const setThemePreference = (val) => {
    setThemePreferenceState(val);
    SettingsRepository.saveSetting('themePreference', val);
  };

  /** Actualiza el idioma de la interfaz y lo persiste. */
  const setLanguage = (val) => {
    setLanguageState(val);
    SettingsRepository.saveSetting('language', val);
  };

  /** Actualiza el timezone y lo persiste. */
  const setTimezone = (val) => {
    setTimezoneState(val);
    SettingsRepository.saveSetting('timezone', val);
  };

  /** Actualiza la familia tipográfica global y la persiste. */
  const setFontFamily = (val) => {
    setFontFamilyState(val);
    SettingsRepository.saveSetting('fontFamily', val);
  };

  /**
   * Actualiza la configuración tipográfica detallada y la persiste como JSON.
   * Acepta tanto un valor directo como una función actualizadora (como `setState`).
   * @param {Object|Function} val - El nuevo config o una función (prev) => newConfig.
   */
  const setTypographyConfig = (val) => {
    setTypographyConfigState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      SettingsRepository.saveSetting('typographyConfig', next);
      return next;
    });
  };

  // ── Tema Activo (Memoization) ─────────────────────────────────────────────────

  /**
   * Calcula el tema activo basándose en la preferencia del usuario y el scheme del sistema.
   * `useMemo` garantiza que este cálculo solo se repite cuando alguna de sus
   * dependencias cambia, no en cada render.
   */
  const activeTheme = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themePreference === 'dark' ? darkTheme : lightTheme;
  }, [themePreference, systemColorScheme]);

  const resetSettings = () => {
    setThemePreferenceState('system');
    setLanguageState('es');
    setTimezoneState('Europe/Madrid');
    setFontFamilyState('system');
    setTypographyConfigState({
      h1:      { fontFamily: null, fontSize: 30, fontWeight: '800', color: null },
      h2:      { fontFamily: null, fontSize: 24, fontWeight: '800', color: null },
      h3:      { fontFamily: null, fontSize: 20, fontWeight: '700', color: null },
      body:    { fontFamily: null, fontSize: 16, fontWeight: '500', color: null },
      caption: { fontFamily: null, fontSize: 13, fontWeight: '600', color: null },
      micro:   { fontFamily: null, fontSize: 12, fontWeight: '400', color: null },
    });
  };

  // Esperamos a tener los datos cargados antes de renderizar
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
      resetSettings,
      theme: activeTheme,
      isDark: activeTheme === darkTheme,
    }}>
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

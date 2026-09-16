import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { SettingsProvider, useSettings, lightTheme, darkTheme } from './SettingsContext';
import * as SettingsRepository from '../repositories/SettingsRepository';

describe('SettingsContext', () => {
  beforeEach(() => {
    global.__mockDb.execSync('DELETE FROM entries');
  });

  it('throws an error when useSettings is called outside of SettingsProvider', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useSettings())).rejects.toThrow(
      '[useSettings] Debe usarse dentro de un <SettingsProvider>.'
    );
    consoleSpy.mockRestore();
  });

  it('loads default settings when database is empty', async () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;
    const { result } = await renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current?.language).toBeTruthy();
    });

    expect(result.current.themePreference).toBe('system');
    expect(result.current.language).toBe('es');
    expect(result.current.timezone).toBe('Europe/Madrid');
    expect(result.current.fontFamily).toBe('system');
    expect(result.current.theme).toEqual(lightTheme);
  });

  it('updates themePreference and switches theme', async () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;
    const { result } = await renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current?.language).toBeTruthy());

    await act(async () => {
      result.current.setThemePreference('dark');
    });

    expect(result.current.themePreference).toBe('dark');
    expect(result.current.theme).toEqual(darkTheme);

    const saved = await SettingsRepository.getAllSettings();
    expect(saved.themePreference).toBe('dark');
  });

  it('updates language and persists to repository', async () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;
    const { result } = await renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current?.language).toBeTruthy());

    await act(async () => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
    const saved = await SettingsRepository.getAllSettings();
    expect(saved.language).toBe('en');
  });

  it('updates timezone, fontFamily, and typographyConfig', async () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;
    const { result } = await renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current?.language).toBeTruthy());

    await act(async () => {
      result.current.setTimezone('America/New_York');
      result.current.setFontFamily('PatrickHand');
      result.current.setTypographyConfig(prev => ({ ...prev, body: { ...prev.body, fontSize: 18 } }));
    });

    expect(result.current.timezone).toBe('America/New_York');
    expect(result.current.fontFamily).toBe('PatrickHand');
    expect(result.current.typographyConfig.body.fontSize).toBe(18);
  });

  it('resets settings to defaults with resetSettings', async () => {
    const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;
    const { result } = await renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current?.language).toBeTruthy());

    await act(async () => {
      result.current.setLanguage('en');
      result.current.setThemePreference('dark');
    });

    expect(result.current.language).toBe('en');

    await act(async () => {
      result.current.resetSettings();
    });

    expect(result.current.language).toBe('es');
    expect(result.current.themePreference).toBe('system');
  });
});

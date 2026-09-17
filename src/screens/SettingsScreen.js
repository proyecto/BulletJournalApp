import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, FlatList, Text as RNText, Alert } from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useJournal } from '../context/JournalContext';
import { resetDatabase } from '../database/db';
import { fontOptions } from '../constants/fonts';
import PinLockModal from '../components/PinLockModal';

import { exportToMarkdown, exportToJSON, importFromJSON } from '../services/ExportImportService';

export default function SettingsScreen({ navigation }) {
  const { 
    theme, 
    themePreference, 
    setThemePreference, 
    language, 
    setLanguage, 
    timezone, 
    setTimezone, 
    firstDayOfWeek, 
    setFirstDayOfWeek, 
    fontFamily, 
    setFontFamily, 
    resetSettings,
    pinLockEnabled,
  } = useSettings();
  const { entries, lists, resetJournal, reloadJournalData } = useJournal();
  const insets = useSafeAreaInsets();

  const [isFontModalVisible, setFontModalVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalMode, setPinModalMode] = useState('setup');

  const currentFontLabel = fontOptions.find(f => f.id === fontFamily)?.label || fontOptions[0].label;

  const handleExportMarkdown = async () => {
    try {
      await exportToMarkdown(entries, lists, language);
    } catch (err) {
      console.error('Error al exportar Markdown:', err);
      Alert.alert(
        language === 'es' ? 'Error al exportar' : 'Export error',
        err.message || (language === 'es' ? 'No se pudo generar el archivo Markdown.' : 'Could not generate Markdown file.')
      );
    }
  };

  const handleExportJSON = async () => {
    try {
      await exportToJSON(entries, lists, { fontFamily, language, themePreference, timezone }, language);
    } catch (err) {
      console.error('Error al exportar JSON:', err);
      Alert.alert(
        language === 'es' ? 'Error al exportar' : 'Export error',
        err.message || (language === 'es' ? 'No se pudo generar la copia de seguridad.' : 'Could not generate backup file.')
      );
    }
  };

  const handleImportJSON = async () => {
    try {
      const res = await importFromJSON(reloadJournalData, language);
      if (res.success) {
        Alert.alert(
          language === 'es' ? 'Importación completada' : 'Import successful',
          language === 'es'
            ? `Se han incorporado ${res.count} registros nuevos a tu Bullet Journal.`
            : `Successfully added ${res.count} new items to your Bullet Journal.`
        );
      } else if (res.error) {
        Alert.alert(
          language === 'es' ? 'Error al importar' : 'Import Error',
          res.error
        );
      }
    } catch (err) {
      console.error('Error al importar JSON:', err);
      Alert.alert(
        language === 'es' ? 'Error al importar' : 'Import Error',
        err.message || (language === 'es' ? 'Ocurrió un error al procesar la copia de seguridad.' : 'An error occurred processing the backup.')
      );
    }
  };

  const handleFactoryReset = () => {
    Alert.alert(
      language === 'es' ? 'Restablecer datos de fábrica' : 'Factory Reset',
      language === 'es' 
        ? '¿Estás seguro de que deseas borrar todas las tareas, listas y configuraciones? Esta acción no se puede deshacer.'
        : 'Are you sure you want to delete all tasks, lists and settings? This action cannot be undone.',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { 
          text: language === 'es' ? 'Restablecer' : 'Reset', 
          style: 'destructive',
          onPress: () => {
            try {
              resetDatabase();
              resetSettings();
              resetJournal();
              Alert.alert(
                language === 'es' ? 'Completado' : 'Success',
                language === 'es' ? 'La aplicación se ha restablecido a los valores de fábrica.' : 'App has been reset to factory defaults.'
              );
            } catch (err) {
              console.error('Error al restablecer:', err);
            }
          }
        }
      ]
    );
  };

  const renderSectionHeader = (title) => (
    <Text variant="caption" style={[styles.sectionHeader, { color: theme.textSecondary }]}>{title}</Text>
  );

  const renderOption = (label, isSelected, onPress, iconName) => (
    <TouchableOpacity 
      style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <Ionicons name={iconName} size={20} color={isSelected ? theme.primary : theme.textSecondary} style={styles.optionIcon} />
        <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark" size={20} color={theme.primary} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <View style={[styles.header, { alignItems: 'center' }]}>
        <Text variant="h1" style={[styles.title, { color: theme.text }]}>
          {language === 'es' ? 'Ajustes' : 'Settings'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSectionHeader(language === 'es' ? 'APARIENCIA' : 'APPEARANCE')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {renderOption(language === 'es' ? 'Automático (Sistema)' : 'System Default', themePreference === 'system', () => setThemePreference('system'), 'phone-portrait-outline')}
          {renderOption(language === 'es' ? 'Modo Claro' : 'Light Mode', themePreference === 'light', () => setThemePreference('light'), 'sunny-outline')}
          {renderOption(language === 'es' ? 'Modo Oscuro' : 'Dark Mode', themePreference === 'dark', () => setThemePreference('dark'), 'moon-outline')}
        </View>

        {renderSectionHeader(language === 'es' ? 'ZONA HORARIA' : 'TIMEZONE')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {renderOption(language === 'es' ? 'Automático (Local)' : 'Local (System)', timezone === 'system', () => setTimezone('system'), 'time-outline')}
          {renderOption('Europa / Madrid', timezone === 'Europe/Madrid', () => setTimezone('Europe/Madrid'), 'globe-outline')}
        </View>

        {renderSectionHeader(language === 'es' ? 'IDIOMA' : 'LANGUAGE')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {renderOption('Español', language === 'es', () => setLanguage('es'), 'language-outline')}
          {renderOption('English', language === 'en', () => setLanguage('en'), 'language-outline')}
        </View>

        {renderSectionHeader(language === 'es' ? 'PRIMER DÍA DE LA SEMANA' : 'FIRST DAY OF THE WEEK')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {renderOption(language === 'es' ? 'Lunes (por defecto)' : 'Monday (Default)', firstDayOfWeek === 'monday', () => setFirstDayOfWeek('monday'), 'calendar-outline')}
          {renderOption(language === 'es' ? 'Domingo' : 'Sunday', firstDayOfWeek === 'sunday', () => setFirstDayOfWeek('sunday'), 'calendar-number-outline')}
        </View>

        {renderSectionHeader(language === 'es' ? 'TIPOGRAFÍA' : 'TYPOGRAPHY')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]} 
            onPress={() => setFontModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="text-outline" size={20} color={theme.primary} style={styles.optionIcon} />
              <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>{currentFontLabel}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomWidth: 0 }]} 
            onPress={() => navigation.navigate('AdvancedTypography')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="color-wand-outline" size={20} color={theme.primary} style={styles.optionIcon} />
              <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>
                {language === 'es' ? 'Tipografía Avanzada' : 'Advanced Typography'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {renderSectionHeader(language === 'es' ? 'SEGURIDAD Y PRIVACIDAD' : 'SECURITY & PRIVACY')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomColor: pinLockEnabled ? theme.border : 'transparent', borderBottomWidth: pinLockEnabled ? StyleSheet.hairlineWidth : 0 }]} 
            onPress={() => {
              setPinModalMode(pinLockEnabled ? 'disable' : 'setup');
              setPinModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={pinLockEnabled ? 'lock-closed-outline' : 'lock-open-outline'} size={20} color={theme.primary} style={styles.optionIcon} />
              <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>
                {language === 'es' ? 'Bloqueo por PIN' : 'PIN Lock'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="caption" style={{ color: pinLockEnabled ? theme.primary : theme.textSecondary, marginRight: 6 }}>
                {pinLockEnabled ? (language === 'es' ? 'Activado' : 'Enabled') : (language === 'es' ? 'Desactivado' : 'Disabled')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          {pinLockEnabled && (
            <TouchableOpacity 
              style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomWidth: 0 }]} 
              onPress={() => {
                setPinModalMode('change');
                setPinModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="key-outline" size={20} color={theme.primary} style={styles.optionIcon} />
                <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>
                  {language === 'es' ? 'Cambiar PIN' : 'Change PIN'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {renderSectionHeader(language === 'es' ? 'EXPORTAR E IMPORTAR' : 'EXPORT & IMPORT')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]} 
            onPress={handleExportMarkdown}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} style={styles.optionIcon} />
              <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>
                {language === 'es' ? 'Exportar a Markdown (.md)' : 'Export to Markdown (.md)'}
              </Text>
            </View>
            <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]} 
            onPress={handleExportJSON}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={theme.primary} style={styles.optionIcon} />
              <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>
                {language === 'es' ? 'Exportar Copia de Seguridad (JSON)' : 'Export Backup (JSON)'}
              </Text>
            </View>
            <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomWidth: 0 }]} 
            onPress={handleImportJSON}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="cloud-download-outline" size={20} color={theme.primary} style={styles.optionIcon} />
              <Text variant="body" style={[styles.optionLabel, { color: theme.text }]}>
                {language === 'es' ? 'Importar Copia de Seguridad (JSON)' : 'Import Backup (JSON)'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {renderSectionHeader(language === 'es' ? 'DATOS Y SISTEMA' : 'DATA & SYSTEM')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomWidth: 0 }]} 
            onPress={handleFactoryReset}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" style={styles.optionIcon} />
              <Text variant="body" style={[styles.optionLabel, { color: '#FF3B30', fontWeight: '600' }]}>
                {language === 'es' ? 'Restablecer de fábrica' : 'Factory Reset'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text variant="caption" style={[styles.versionText, { color: theme.textSecondary }]}>
            BulletJournalApp v1.0.7 (Build 8)
          </Text>
        </View>
      </ScrollView>

      {/* Selector Modal de Fuente */}
      <Modal
        visible={isFontModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFontModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setFontModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {language === 'es' ? 'Seleccionar Tipografía' : 'Select Typography'}
              </Text>
            </View>
            <FlatList
              data={fontOptions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalOption, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setFontFamily(item.id);
                    setFontModalVisible(false);
                  }}
                >
                  <RNText style={[styles.modalOptionText, { color: theme.text }, item.fontStyle]}>
                    {item.label}
                  </RNText>
                  {fontFamily === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Configuración/Modificación/Desactivación de PIN */}
      <PinLockModal
        visible={pinModalVisible}
        mode={pinModalMode}
        onSuccess={() => setPinModalVisible(false)}
        onCancel={() => setPinModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, alignItems: 'center' },
  title: { letterSpacing: -0.5, textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 10, flex: 1 },
  sectionHeader: { marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  cardGroup: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: { marginRight: 12 },
  optionLabel: { },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, maxHeight: '80%' },
  modalHeader: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalOptionText: { fontSize: 16 },
  versionContainer: { alignItems: 'center', marginTop: 24, marginBottom: 40 },
  versionText: { fontSize: 12, opacity: 0.6 },
});

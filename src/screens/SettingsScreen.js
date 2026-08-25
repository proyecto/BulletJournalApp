import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const { theme, themePreference, setThemePreference, language, setLanguage, timezone, setTimezone, fontFamily, setFontFamily } = useSettings();
  const insets = useSafeAreaInsets();
  
  const [isFontModalVisible, setFontModalVisible] = useState(false);

  const fontOptions = [
    { id: 'system', label: language === 'es' ? 'Predeterminado' : 'System Default', fontStyle: undefined },
{ id: 'inter', label: 'Inter', fontStyle: { fontFamily: 'Inter_400Regular' } },
    { id: 'lora', label: 'Lora', fontStyle: { fontFamily: 'Lora_400Regular' } },
    { id: 'jetbrains', label: 'JetBrains Mono', fontStyle: { fontFamily: 'JetBrainsMono_400Regular' } },
    { id: 'roboto', label: 'Roboto', fontStyle: { fontFamily: 'Roboto_400Regular' } },
    { id: 'lato', label: 'Lato', fontStyle: { fontFamily: 'Lato_400Regular' } },
    { id: 'montserrat', label: 'Montserrat', fontStyle: { fontFamily: 'Montserrat_400Regular' } },
    { id: 'nunito', label: 'Nunito', fontStyle: { fontFamily: 'Nunito_400Regular' } },
    { id: 'poppins', label: 'Poppins', fontStyle: { fontFamily: 'Poppins_400Regular' } },
    { id: 'quicksand', label: 'Quicksand', fontStyle: { fontFamily: 'Quicksand_400Regular' } },
    { id: 'oswald', label: 'Oswald', fontStyle: { fontFamily: 'Oswald_400Regular' } },
    { id: 'raleway', label: 'Raleway', fontStyle: { fontFamily: 'Raleway_400Regular' } },
    { id: 'ubuntu', label: 'Ubuntu', fontStyle: { fontFamily: 'Ubuntu_400Regular' } },
    { id: 'rubik', label: 'Rubik', fontStyle: { fontFamily: 'Rubik_400Regular' } },
    { id: 'work-sans', label: 'Work Sans', fontStyle: { fontFamily: 'WorkSans_400Regular' } },
    { id: 'fira-sans', label: 'Fira Sans', fontStyle: { fontFamily: 'FiraSans_400Regular' } },
    { id: 'playfair-display', label: 'Playfair Display', fontStyle: { fontFamily: 'PlayfairDisplay_400Regular' } },
    { id: 'merriweather', label: 'Merriweather', fontStyle: { fontFamily: 'Merriweather_400Regular' } },
    { id: 'eb-garamond', label: 'Eb Garamond', fontStyle: { fontFamily: 'EBGaramond_400Regular' } },
    { id: 'pt-serif', label: 'Pt Serif', fontStyle: { fontFamily: 'PTSerif_400Regular' } },
    { id: 'noto-serif', label: 'Noto Serif', fontStyle: { fontFamily: 'NotoSerif_400Regular' } },
    { id: 'libre-baskerville', label: 'Libre Baskerville', fontStyle: { fontFamily: 'LibreBaskerville_400Regular' } },
    { id: 'cormorant-garamond', label: 'Cormorant Garamond', fontStyle: { fontFamily: 'CormorantGaramond_400Regular' } },
    { id: 'crimson-text', label: 'Crimson Text', fontStyle: { fontFamily: 'CrimsonText_400Regular' } },
    { id: 'fira-code', label: 'Fira Code', fontStyle: { fontFamily: 'FiraCode_400Regular' } },
    { id: 'space-mono', label: 'Space Mono', fontStyle: { fontFamily: 'SpaceMono_400Regular' } },
    { id: 'inconsolata', label: 'Inconsolata', fontStyle: { fontFamily: 'Inconsolata_400Regular' } },
    { id: 'source-code-pro', label: 'Source Code Pro', fontStyle: { fontFamily: 'SourceCodePro_400Regular' } },
    { id: 'caveat', label: 'Caveat', fontStyle: { fontFamily: 'Caveat_400Regular' } },
    { id: 'pacifico', label: 'Pacifico', fontStyle: { fontFamily: 'Pacifico_400Regular' } },
    { id: 'dancing-script', label: 'Dancing Script', fontStyle: { fontFamily: 'DancingScript_400Regular' } },
  ];

  const currentFontLabel = fontOptions.find(f => f.id === fontFamily)?.label || fontOptions[0].label;

  const renderSectionHeader = (title) => (
    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{title}</Text>
  );

  const renderOption = (label, isSelected, onPress, iconName) => (
    <TouchableOpacity 
      style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <Ionicons name={iconName} size={20} color={isSelected ? theme.primary : theme.textSecondary} style={styles.optionIcon} />
        <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark" size={20} color={theme.primary} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
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

        {renderSectionHeader(language === 'es' ? 'TIPOGRAFÍA' : 'TYPOGRAPHY')}
        <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border, marginBottom: 40 }]}>
          <TouchableOpacity 
            style={[styles.optionRow, { backgroundColor: theme.cardBackground, borderBottomWidth: 0 }]} 
            onPress={() => setFontModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="text-outline" size={20} color={theme.primary} style={styles.optionIcon} />
              <Text style={[styles.optionLabel, { color: theme.text }]}>{currentFontLabel}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
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
                  <Text style={[styles.modalOptionText, { color: theme.text }, item.fontStyle]}>
                    {item.label}
                  </Text>
                  {fontFamily === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  content: { paddingHorizontal: 20, paddingTop: 10, flex: 1 },
  sectionHeader: { fontSize: 13, fontWeight: '600', marginTop: 24, marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  cardGroup: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: { marginRight: 12 },
  optionLabel: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, maxHeight: '80%' },
  modalHeader: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalOptionText: { fontSize: 16 },
});

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, FlatList, Text as RNText } from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { fontOptions } from '../constants/fonts';

const VARIANTS = [
  { id: 'h1', labelEs: 'Título Gigante (H1)', labelEn: 'Giant Title (H1)' },
  { id: 'h2', labelEs: 'Título Secundario (H2)', labelEn: 'Secondary Title (H2)' },
  { id: 'h3', labelEs: 'Título de Calendario (H3)', labelEn: 'Calendar Title (H3)' },
  { id: 'body', labelEs: 'Cuerpo de Texto', labelEn: 'Body Text' },
  { id: 'caption', labelEs: 'Encabezados Pequeños', labelEn: 'Small Headers' },
  { id: 'micro', labelEs: 'Micro-textos (Badges)', labelEn: 'Micro-texts (Badges)' },
];

const WEIGHTS = ['400', '500', '600', '700', '800'];
const SIZES = [10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 30, 36, 42];

export default function AdvancedTypographyScreen({ navigation }) {
  const { theme, language, typographyConfig, setTypographyConfig } = useSettings();
  const insets = useSafeAreaInsets();
  
  const [activeVariant, setActiveVariant] = useState(null);
  const [modalType, setModalType] = useState(null); // 'family', 'size', 'weight'

  const handleUpdate = (variant, key, value) => {
    setTypographyConfig(prev => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [key]: value
      }
    }));
  };

  const renderSectionHeader = (title) => (
    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{title}</Text>
  );

  const getFontLabel = (fontFamilyId) => {
    if (!fontFamilyId) return language === 'es' ? 'Global' : 'Global';
    const opt = fontOptions.find(f => f.id === fontFamilyId);
    return opt ? opt.label : 'Global';
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {language === 'es' ? 'Tipografía Avanzada' : 'Advanced Typography'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {VARIANTS.map(variantItem => {
          const config = typographyConfig[variantItem.id];
          return (
            <View key={variantItem.id} style={{ marginBottom: 24 }}>
              {renderSectionHeader(language === 'es' ? variantItem.labelEs : variantItem.labelEn)}
              <View style={[styles.cardGroup, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                
                {/* Family Row */}
                <TouchableOpacity 
                  style={[styles.optionRow, { borderBottomColor: theme.border }]} 
                  onPress={() => { setActiveVariant(variantItem.id); setModalType('family'); }}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons name="text-outline" size={20} color={theme.textSecondary} style={styles.optionIcon} />
                    <Text style={[styles.optionLabel, { color: theme.text }]}>
                      {language === 'es' ? 'Familia' : 'Family'}
                    </Text>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={{ color: theme.primary, marginRight: 8 }}>{getFontLabel(config.fontFamily)}</Text>
                    <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>

                {/* Size Row */}
                <TouchableOpacity 
                  style={[styles.optionRow, { borderBottomColor: theme.border }]} 
                  onPress={() => { setActiveVariant(variantItem.id); setModalType('size'); }}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons name="resize-outline" size={20} color={theme.textSecondary} style={styles.optionIcon} />
                    <Text style={[styles.optionLabel, { color: theme.text }]}>
                      {language === 'es' ? 'Tamaño' : 'Size'}
                    </Text>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={{ color: theme.primary, marginRight: 8 }}>{config.fontSize}px</Text>
                    <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>

                {/* Weight Row */}
                <TouchableOpacity 
                  style={[styles.optionRow, { borderBottomWidth: 0 }]} 
                  onPress={() => { setActiveVariant(variantItem.id); setModalType('weight'); }}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons name="barbell-outline" size={20} color={theme.textSecondary} style={styles.optionIcon} />
                    <Text style={[styles.optionLabel, { color: theme.text }]}>
                      {language === 'es' ? 'Grosor (Weight)' : 'Weight'}
                    </Text>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={{ color: theme.primary, marginRight: 8 }}>{config.fontWeight}</Text>
                    <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>

              </View>
            </View>
          );
        })}
        <View style={{height: 40}} />
      </ScrollView>

      {/* MODAL */}
      <Modal visible={!!modalType} transparent={true} animationType="fade" onRequestClose={() => setModalType(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalType(null)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {language === 'es' ? 'Seleccionar' : 'Select'}
              </Text>
            </View>
            
            {modalType === 'family' && (
              <FlatList
                data={[{ id: null, label: language === 'es' ? 'Heredar Global' : 'Inherit Global' }, ...fontOptions.filter(f => f.id !== 'system')]}
                keyExtractor={item => item.id || 'inherit'}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalOption, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      handleUpdate(activeVariant, 'fontFamily', item.id);
                      setModalType(null);
                    }}
                  >
                    <RNText style={[styles.modalOptionText, { color: theme.text }, item.fontStyle]}>
                      {item.label}
                    </RNText>
                    {typographyConfig[activeVariant]?.fontFamily === item.id && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {modalType === 'size' && (
              <FlatList
                data={SIZES}
                keyExtractor={item => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalOption, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      handleUpdate(activeVariant, 'fontSize', item);
                      setModalType(null);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: theme.text }]}>
                      {item}px
                    </Text>
                    {typographyConfig[activeVariant]?.fontSize === item && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {modalType === 'weight' && (
              <FlatList
                data={WEIGHTS}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalOption, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      handleUpdate(activeVariant, 'fontWeight', item);
                      setModalType(null);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: theme.text, fontWeight: item }]}>
                      {item}
                    </Text>
                    {typographyConfig[activeVariant]?.fontWeight === item && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  backButton: { marginRight: 16, padding: 4 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  content: { paddingHorizontal: 20, flex: 1 },
  sectionHeader: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  cardGroup: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionRight: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: { marginRight: 12 },
  optionLabel: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, maxHeight: '80%' },
  modalHeader: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalOptionText: { fontSize: 16 },
});

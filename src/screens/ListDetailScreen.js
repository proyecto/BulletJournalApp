import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useJournal } from '../context/JournalContext';

export default function ListDetailScreen({ route, navigation }) {
  const { list } = route.params;
  const { theme, language } = useSettings();
  const { entries, addEntry, toggleStatus } = useJournal();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');

  // Filtrar solo las entradas que pertenecen a esta lista
  const listItems = entries.filter(entry => entry.listId === list.id);

  const handleAddItem = () => {
    if (inputText.trim().length > 0) {
      addEntry({
        id: Date.now().toString(),
        text: inputText.trim(),
        type: 'task', // Por ahora lo creamos como task genérico
        status: 'open',
        listId: list.id
      });
      setInputText('');
    }
  };

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'completed';
    return (
      <TouchableOpacity 
        style={[styles.itemContainer, { borderBottomColor: theme.border }]}
        onPress={() => toggleStatus(item.id, null)}
        activeOpacity={0.7}
      >
        <View style={[styles.bullet, { borderColor: theme.text }]}>
          {isCompleted && <Ionicons name="close" size={16} color={theme.text} />}
        </View>
        <Text style={[
          styles.itemText, 
          { color: isCompleted ? theme.textCompleted : theme.text },
          isCompleted && styles.itemTextCompleted
        ]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {list.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {listItems.length} {language === 'es' ? 'elementos' : 'items'}
            </Text>
          </View>
        </View>

        <FlatList
          data={listItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={64} color={theme.textCompleted} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {language === 'es' 
                  ? 'Esta lista está vacía. Añade el primer elemento abajo.' 
                  : 'This list is empty. Add the first item below.'}
              </Text>
            </View>
          }
        />

        <View style={[styles.inputWrapper, { 
          backgroundColor: theme.cardBackground, 
          borderTopColor: theme.border,
          paddingBottom: 12 
        }]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
              placeholder={language === 'es' ? 'Añadir elemento...' : 'Add item...'}
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAddItem}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: inputText.trim() ? theme.text : theme.buttonBackground },
                inputText.trim() ? { shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 } : null
              ]} 
              onPress={handleAddItem}
              disabled={!inputText.trim()}
            >
              <Ionicons name="arrow-up" size={24} color={theme.cardBackground} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <View style={{ height: insets.bottom, backgroundColor: theme.cardBackground }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 15 },
  backButton: { marginRight: 12, padding: 4 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, flexGrow: 1 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  bullet: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 16, flex: 1 },
  itemTextCompleted: { textDecorationLine: 'line-through' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60 },
  emptyIcon: { opacity: 0.5, marginBottom: 16 },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  inputWrapper: { borderTopWidth: 1, paddingTop: 12, paddingBottom: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  textInput: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 20, fontSize: 16 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
});

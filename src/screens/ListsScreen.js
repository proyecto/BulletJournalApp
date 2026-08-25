import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useJournal } from '../context/JournalContext';

export default function ListsScreen({ navigation }) {
  const { theme, language } = useSettings();
  const { lists, addList, reorderLists } = useJournal();
  const insets = useSafeAreaInsets();
  
  const [inputText, setInputText] = useState('');

  const handleAddList = () => {
    if (inputText.trim().length > 0) {
      addList(inputText.trim());
      setInputText('');
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newLists = [...lists];
    const temp = newLists[index];
    newLists[index] = newLists[index - 1];
    newLists[index - 1] = temp;
    reorderLists(newLists);
  };

  const moveDown = (index) => {
    if (index === lists.length - 1) return;
    const newLists = [...lists];
    const temp = newLists[index];
    newLists[index] = newLists[index + 1];
    newLists[index + 1] = temp;
    reorderLists(newLists);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.cardBackground, 
          shadowColor: theme.text,
          elevation: 1,
          shadowOpacity: 0.03,
        }
      ]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ListDetail', { list: item })}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="list" size={20} color={theme.textSecondary} />
      </View>
      <Text style={[styles.cardText, { color: theme.text }]}>
        {item.title}
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => moveUp(index)}
          disabled={index === 0}
        >
          <Ionicons 
            name="chevron-up" 
            size={24} 
            color={index === 0 ? theme.border : theme.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => moveDown(index)}
          disabled={index === lists.length - 1}
        >
          <Ionicons 
            name="chevron-down" 
            size={24} 
            color={index === lists.length - 1 ? theme.border : theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      {/* Usamos exactamente el mismo patrón que DailyLogScreen en este commit */}
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {language === 'es' ? 'Listas' : 'Lists'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {language === 'es' ? 'Tus colecciones' : 'Your collections'}
          </Text>
        </View>

        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list" size={64} color={theme.textCompleted} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {language === 'es' 
                  ? 'Aquí podrás crear tus propias colecciones personalizadas (libros, películas, notas).' 
                  : 'Here you will be able to create custom collections (books, movies, notes).'}
              </Text>
            </View>
          }
        />

        <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
              placeholder={language === 'es' ? 'Nueva lista...' : 'New list...'}
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAddList}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: inputText.trim() ? theme.text : theme.buttonBackground },
                inputText.trim() ? { shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 } : null
              ]} 
              onPress={handleAddList}
              disabled={!inputText.trim()}
            >
              <Ionicons name="add" size={24} color={theme.cardBackground} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, borderRadius: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  iconContainer: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardText: { fontSize: 16, flex: 1, fontWeight: '500' },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 4, marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60 },
  emptyIcon: { opacity: 0.5, marginBottom: 16 },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  inputWrapper: { borderTopWidth: 1, paddingTop: 12, paddingBottom: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  textInput: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 20, fontSize: 16 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
});

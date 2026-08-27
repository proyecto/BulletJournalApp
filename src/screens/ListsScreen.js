import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import DragList from 'react-native-draglist';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useJournal } from '../context/JournalContext';
import SmartInput from '../components/SmartInput';

export default function ListsScreen({ navigation }) {
  const { theme, language } = useSettings();
  const { lists, addList, deleteList, reorderLists } = useJournal();
  const insets = useSafeAreaInsets();
  
  const [inputText, setInputText] = useState('');

  const handleAddList = () => {
    if (inputText.trim().length > 0) {
      addList(inputText.trim());
      setInputText('');
    }
  };

  const confirmDelete = (listId, title) => {
    Alert.alert(
      language === 'es' ? 'Eliminar lista' : 'Delete list',
      language === 'es' 
        ? `¿Estás seguro de que quieres eliminar la lista "${title}" y todas sus notas?` 
        : `Are you sure you want to delete the list "${title}" and all its notes?`,
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { text: language === 'es' ? 'Eliminar' : 'Delete', style: 'destructive', onPress: () => deleteList(listId) }
      ]
    );
  };

  const renderItem = ({ item, onDragStart, onDragEnd, isActive }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.cardBackground, 
          shadowColor: theme.text,
          elevation: isActive ? 5 : 1,
          shadowOpacity: isActive ? 0.2 : 0.03,
          opacity: isActive ? 0.9 : 1,
        }
      ]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ListDetail', { list: item })}
      disabled={isActive}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="list" size={20} color={theme.textSecondary} />
      </View>
      <Text variant="body" style={[styles.cardText, { color: theme.text }]}>
        {item.title}
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => confirmDelete(item.id, item.title)}
        >
          <Ionicons 
            name="trash-outline" 
            size={20} 
            color={theme.error || '#ff3b30'} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconButton, { marginLeft: 8 }]}
          onLongPress={onDragStart}
          onPressOut={onDragEnd}
          delayLongPress={200}
        >
          <Ionicons 
            name="menu" 
            size={24} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <View style={styles.header}>
        <Text variant="h1" style={[styles.title, { color: theme.text }]}>
          {language === 'es' ? 'Listas' : 'Lists'}
        </Text>
        <Text variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {language === 'es' ? 'Tus colecciones' : 'Your collections'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <DragList
          data={lists}
          keyExtractor={(item) => item.id}
          onReordered={async (fromIndex, toIndex) => {
            const newLists = [...lists];
            const temp = newLists.splice(fromIndex, 1)[0];
            newLists.splice(toIndex, 0, temp);
            reorderLists(newLists);
          }}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list" size={64} color={theme.textCompleted} style={styles.emptyIcon} />
              <Text variant="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
                {language === 'es' 
                  ? 'Aquí podrás crear tus propias colecciones personalizadas (libros, películas, notas).' 
                  : 'Here you will be able to create custom collections (books, movies, notes).'}
              </Text>
            </View>
          }
        />
      </View>

      <SmartInput 
        value={inputText}
        onChangeText={setInputText}
        onSubmit={handleAddList}
        placeholder={language === 'es' ? 'Nueva lista...' : 'New list...'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, alignItems: 'center' },
  title: { letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { marginTop: 4, textAlign: 'center' },
  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, borderRadius: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  iconContainer: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardText: { flex: 1 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 4, marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60 },
  emptyIcon: { opacity: 0.5, marginBottom: 16 },
  emptyText: { textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
});

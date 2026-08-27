/**
 * @screen ListDetailScreen
 * @description Pantalla de detalle de una lista personalizada del usuario.
 *
 * Muestra todos los elementos de la lista seleccionada y permite añadir nuevos.
 * A diferencia del Daily Log, los elementos de lista son siempre de tipo 'task'
 * y no tienen lógica de migración temporal.
 *
 * ARQUITECTURA:
 * - Usa `EntryFactory.createListEntry()` para crear elementos, garantizando
 *   que todos los campos obligatorios (incluido `date`) están presentes.
 * - La lógica de filtrado (entries por listId) es lo suficientemente simple
 *   como para mantenerse en la pantalla sin necesitar un servicio dedicado.
 */

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useJournal } from '../context/JournalContext';
import SmartInput from '../components/SmartInput';
import { createListEntry } from '../factories/EntryFactory';

export default function ListDetailScreen({ route, navigation }) {
  // La lista que el usuario seleccionó en ListsScreen, pasada via route params
  const { list } = route.params;

  // ── Acceso a datos y configuración (Observer Pattern) ────────────────────────
  const { theme, language, timezone } = useSettings();
  const { entries, toggleStatus, addEntry, deleteEntry } = useJournal();
  const insets = useSafeAreaInsets();

  /** Texto que el usuario está escribiendo en el SmartInput */
  const [inputText, setInputText] = useState('');

  // ── Filtrado de entradas ───────────────────────────────────────────────────────

  /**
   * Filtra las entradas del estado global para mostrar solo las de esta lista.
   * No necesita un servicio externo porque la lógica es trivial (una comparación de IDs).
   */
  const listItems = entries.filter(entry => entry.listId === list.id);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  /**
   * Crea y añade un nuevo elemento a la lista usando EntryFactory (Factory Method).
   * Antes, esto se hacía con un objeto literal manual, lo que provocaba que
   * se olvidara el campo `date` y causaba un error NOT NULL en SQLite.
   */
  const handleAddItem = () => {
    if (!inputText.trim()) return;

    // EntryFactory.createListEntry garantiza la estructura correcta, incluyendo `date`
    const newEntry = createListEntry(inputText, list.id, timezone);
    addEntry(newEntry);
    setInputText('');
  };

  /**
   * Muestra un diálogo de confirmación para eliminar un elemento de la lista.
   * @param {string} id - El ID del elemento a eliminar.
   */
  const confirmDeleteItem = (id) => {
    Alert.alert(
      language === 'es' ? 'Eliminar elemento' : 'Delete item',
      language === 'es' 
        ? '¿Estás seguro de que quieres eliminar este elemento de forma permanente?' 
        : 'Are you sure you want to delete this item permanently?',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { text: language === 'es' ? 'Eliminar' : 'Delete', style: 'destructive', onPress: () => deleteEntry(id) }
      ]
    );
  };

  // ── Renderizado de Items ───────────────────────────────────────────────────────

  /**
   * Renderiza cada elemento de la lista como una fila interactiva con estilo Bullet Journal:
   * un círculo hueco (tarea abierta) o un círculo con X (tarea completada).
   *
   * @param {{ item: Object }} param0 - El objeto de la entrada a renderizar.
   */
  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'completed';
    return (
      <View style={[styles.itemContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.itemMainArea}
          onPress={() => toggleStatus(item.id, null)} // null: los items de lista no usan completedAt
          activeOpacity={0.7}
        >
          {/* Bullet: círculo hueco (abierta) o círculo con X (completada) */}
          <View style={[styles.bullet, { borderColor: theme.text }]}>
            {isCompleted && <Ionicons name="close" size={16} color={theme.text} />}
          </View>

          {/* Texto del elemento, tachado si está completado */}
          <Text
            variant="body"
            style={[
              styles.itemText,
              { color: isCompleted ? theme.textCompleted : theme.text },
              isCompleted && styles.itemTextCompleted,
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>

        {/* Botón de papelera para eliminar */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteItem(item.id)}
          accessibilityLabel={language === 'es' ? 'Eliminar' : 'Delete'}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={18} color={theme.error || '#ff3b30'} />
        </TouchableOpacity>
      </View>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>

      {/* Cabecera con botón de retroceso y título de la lista */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text variant="h2" style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {list.title}
          </Text>
          <Text variant="caption" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {listItems.length} {language === 'es' ? 'elementos' : 'items'}
          </Text>
        </View>
      </View>

      {/* Lista de elementos */}
      <FlatList
        style={{ flex: 1 }}
        data={listItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={64} color={theme.textCompleted} style={styles.emptyIcon} />
            <Text variant="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              {language === 'es'
                ? 'Esta lista está vacía. Añade el primer elemento abajo.'
                : 'This list is empty. Add the first item below.'}
            </Text>
          </View>
        }
      />

      {/* Input reutilizable sin extras (sin topContent ni leftContent) */}
      <SmartInput
        value={inputText}
        onChangeText={setInputText}
        onSubmit={handleAddItem}
        placeholder={language === 'es' ? 'Añadir elemento...' : 'Add item...'}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:             { flex: 1 },
  header:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 15 },
  backButton:           { marginRight: 12, padding: 4 },
  headerTitleContainer: { flex: 1 },
  title:                { letterSpacing: -0.5 },
  subtitle:             { marginTop: 2 },
  listContent:          { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, flexGrow: 1 },
  itemContainer:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  itemMainArea:         { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  deleteButton:         { padding: 8, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  bullet:               { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  itemText:             { flex: 1 },
  itemTextCompleted:    { textDecorationLine: 'line-through' },
  emptyContainer:       { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60 },
  emptyIcon:            { opacity: 0.5, marginBottom: 16 },
  emptyText:            { textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
});

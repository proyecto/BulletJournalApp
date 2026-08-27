/**
 * @screen DailyLogScreen
 * @description Pantalla principal del Bullet Journal: el "Daily Log".
 *
 * Muestra las entradas del día seleccionado, aplica las reglas de migración
 * del Bullet Journal (via DailyLogService) y permite añadir nuevas entradas.
 *
 * ARQUITECTURA:
 * - Esta pantalla es un componente de PRESENTACIÓN ("smart component").
 *   Solo orquesta datos y eventos, no contiene lógica de negocio.
 * - La lógica de filtrado/migración está en `DailyLogService` (Strategy).
 * - La creación de entradas está en `EntryFactory` (Factory Method).
 * - El acceso a datos está en `JournalContext` (Facade + Observer).
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
import SmartInput from '../components/SmartInput';
import { createDailyEntry } from '../factories/EntryFactory';
import { filterEntriesForDay, getEntryIcon, isEntryTemporallyDisplaced } from '../services/DailyLogService';

export default function DailyLogScreen() {
  // ── Acceso a datos y configuración (Observer Pattern) ────────────────────────
  const { entries, addEntry, toggleStatus, deleteEntry } = useJournal();
  const { theme, language, timezone } = useSettings();
  const insets = useSafeAreaInsets();

  // ── Estado local de la pantalla ──────────────────────────────────────────────

  /** Texto que el usuario está escribiendo en el SmartInput */
  const [inputText, setInputText] = useState('');

  /** Tipo de entrada seleccionado para el SmartInput: 'task' | 'event' | 'note' */
  const [selectedType, setSelectedType] = useState('task');

  /**
   * Fecha programada para la nueva entrada.
   * Por defecto es hoy, pero el usuario puede cambiarla con el DateTimePicker.
   * Se resetea a hoy después de cada envío.
   */
  const [selectedDate, setSelectedDate] = useState(new Date());

  /** Controla la visibilidad del DateTimePicker nativo */
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**
   * La fecha del "día" que el usuario está visualizando en el log.
   * Es independiente de `selectedDate` (fecha de la nueva entrada).
   * El usuario navega entre días con las flechas < >.
   */
  const [currentLogDate, setCurrentLogDate] = useState(new Date());

  // Versión string de la fecha actual del log para comparaciones (evita instanciar Date en cada render)
  const currentLogDateStr = getFormattedDate(currentLogDate, timezone);

  // ── Entradas Filtradas (Strategy Pattern via DailyLogService) ─────────────────

  /**
   * Las entradas visibles para el día actual, con las reglas de migración aplicadas.
   * En lugar de tener esta lógica inline en JSX, delegamos al DailyLogService.
   */
  const dailyLogEntries = filterEntriesForDay(entries, currentLogDateStr);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  /**
   * Navega al día anterior o siguiente.
   * @param {-1|1} direction - -1 para atrás, 1 para adelante.
   */
  const navigateDay = (direction) => {
    const newDate = new Date(currentLogDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentLogDate(newDate);
  };

  /**
   * Crea y añade una nueva entrada al diario usando EntryFactory (Factory Method).
   * La Factory garantiza que todos los campos obligatorios (como `date`) están presentes,
   * evitando el error `NOT NULL constraint failed` que tuvimos anteriormente.
   */
  const handleAddEntry = () => {
    if (!inputText.trim()) return;

    // EntryFactory.createDailyEntry garantiza la estructura correcta del objeto
    const newEntry = createDailyEntry(inputText, selectedType, selectedDate, timezone);
    addEntry(newEntry);

    // Reset del estado del input
    setInputText('');
    setSelectedDate(new Date()); // Resetear la fecha a hoy tras cada envío
  };

  /**
   * Muestra un diálogo de confirmación para eliminar un registro del diario.
   * @param {string} id - El ID de la entrada a eliminar.
   */
  const confirmDeleteEntry = (id) => {
    Alert.alert(
      language === 'es' ? 'Eliminar registro' : 'Delete entry',
      language === 'es' 
        ? '¿Estás seguro de que quieres eliminar este registro de forma permanente?' 
        : 'Are you sure you want to delete this entry permanently?',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { text: language === 'es' ? 'Eliminar' : 'Delete', style: 'destructive', onPress: () => deleteEntry(id) }
      ]
    );
  };

  /**
   * Callback del DateTimePicker nativo.
   * En Android, el picker se cierra automáticamente al seleccionar una fecha.
   * En iOS (si se implementara), habría que cerrarlo manualmente.
   * @param {Event} event - El evento nativo del picker.
   * @param {Date|undefined} selected - La fecha seleccionada por el usuario.
   */
  const onChangeDate = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios'); // En Android, se cierra solo
    if (selected) {
      setSelectedDate(selected);
    }
  };

  // ── Renderizado de Items ───────────────────────────────────────────────────────

  /**
   * Renderiza cada entrada del log como una tarjeta interactiva.
   * Usa DailyLogService para determinar el ícono y colores apropiados
   * según el tipo, estado y posición temporal de la entrada.
   *
   * @param {{ item: Object }} param0 - El objeto de la entrada a renderizar.
   */
  const renderItem = ({ item }) => {
    const isCompleted  = item.status === 'completed';
    const iconName     = getEntryIcon(item, currentLogDateStr, timezone);
    const isDisplaced  = isEntryTemporallyDisplaced(item, currentLogDateStr, timezone);
    const iconColor    = isCompleted
      ? theme.textCompleted
      : (isDisplaced ? theme.primary : theme.text);

    return (
      <View 
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground, shadowColor: theme.text },
          isCompleted && { backgroundColor: theme.cardCompleted },
        ]}
      >
        <TouchableOpacity
          style={styles.cardMainArea}
          onPress={() => toggleStatus(item.id, currentLogDateStr)}
          activeOpacity={item.type === 'task' ? 0.7 : 1}
        >
          {/* Ícono del tipo/estado de la entrada */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={iconName}
              size={item.type === 'note' ? 24 : 16}
              color={iconColor}
              style={item.type === 'task' && !isCompleted && !isDisplaced ? styles.taskIcon : null}
            />
          </View>

          {/* Texto y badge de fecha */}
          <View style={styles.cardContent}>
            <Text
              variant="body"
              style={[
                styles.cardText,
                { color: theme.text },
                isCompleted && { color: theme.textCompleted, textDecorationLine: 'line-through' },
              ]}
            >
              {item.text}
            </Text>
            {/* Badge de fecha: solo aparece si la entrada está programada para una fecha diferente a hoy */}
            {item.date !== getFormattedDate(new Date(), timezone) && (
              <Text
                variant="micro"
                style={[
                  styles.dateBadge,
                  { color: theme.primary, backgroundColor: theme.primaryBackground },
                  isCompleted && { opacity: 0.5 },
                ]}
              >
                📅 {item.date}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Botón de papelera para eliminar */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteEntry(item.id)}
          accessibilityLabel={language === 'es' ? 'Eliminar' : 'Delete'}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={18} color={theme.error || '#ff3b30'} />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Variable de Render ─────────────────────────────────────────────────────────

  /** True si el usuario está viendo el día de hoy (para mostrar 'Daily Log' como título) */
  const isViewingToday = currentLogDateStr === getFormattedDate(new Date(), timezone);

  // ── JSX ───────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>

      {/* Cabecera con navegación de días */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigateDay(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            {/* Título: 'Daily Log' si es hoy, fecha si es otro día */}
            <Text variant="h1" style={[styles.title, { color: theme.text }]}>
              {isViewingToday ? 'Daily Log' : currentLogDateStr}
            </Text>
            <Text variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              {currentLogDate.toLocaleDateString(
                language === 'es' ? 'es-ES' : 'en-US',
                { weekday: 'long', month: 'long', day: 'numeric' }
              )}
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigateDay(1)} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de entradas del día */}
      <FlatList
        style={{ flex: 1 }}
        data={dailyLogEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              {language === 'es' ? 'Ningún registro en este día.' : 'No entries on this day.'}
            </Text>
          </View>
        }
      />

      {/* Input reutilizable con selector de tipo y botón de calendario */}
      <SmartInput
        value={inputText}
        onChangeText={setInputText}
        onSubmit={handleAddEntry}
        placeholder={language === 'es' ? 'Añadir...' : 'Add entry...'}
        topContent={
          <>
            {/* Selector de tipo: Tarea (•), Evento (○), Nota (—) */}
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: selectedType === 'task' ? theme.text : theme.inputBackground }]}
              onPress={() => setSelectedType('task')}
              accessibilityLabel={language === 'es' ? 'Tarea' : 'Task'}
            >
              <Ionicons name="ellipse" size={10} color={selectedType === 'task' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: selectedType === 'event' ? theme.text : theme.inputBackground }]}
              onPress={() => setSelectedType('event')}
              accessibilityLabel={language === 'es' ? 'Evento' : 'Event'}
            >
              <Ionicons name="ellipse-outline" size={12} color={selectedType === 'event' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: selectedType === 'note' ? theme.text : theme.inputBackground }]}
              onPress={() => setSelectedType('note')}
              accessibilityLabel={language === 'es' ? 'Nota' : 'Note'}
            >
              <Ionicons name="remove" size={16} color={selectedType === 'note' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
          </>
        }
        leftContent={
          /* Botón de calendario: cambia de color si la fecha seleccionada es diferente a hoy */
          <TouchableOpacity style={styles.calendarButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons
              name="calendar"
              size={22}
              color={
                getFormattedDate(selectedDate, timezone) !== getFormattedDate(new Date(), timezone)
                  ? theme.primary       // Resaltado si hay fecha programada
                  : theme.textSecondary // Apagado si es la fecha de hoy
              }
            />
          </TouchableOpacity>
        }
      />

      {/* DateTimePicker nativo de Android */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:         { flex: 1 },
  header:           { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  headerNav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitles:     { alignItems: 'center' },
  navButton:        { padding: 8 },
  title:            { letterSpacing: -0.5 },
  subtitle:         { marginTop: 4, textTransform: 'capitalize' },
  listContent:      { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  card:             { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10, borderRadius: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardMainArea:     { flex: 1, flexDirection: 'row', alignItems: 'center' },
  deleteButton:     { padding: 8, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  iconContainer:    { width: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  taskIcon:         { transform: [{ scale: 0.8 }] },
  cardContent:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardText:         { flex: 1 },
  dateBadge:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden', marginLeft: 8 },
  emptyContainer:   { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText:        {},
  /** Botones de selección de tipo: pill redondeado */
  typeButton:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  calendarButton:   { padding: 4 },
});

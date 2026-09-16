/**
 * @screen DailyLogScreen
 * @pattern Facade Consumer + Observer Consumer + Strategy Consumer
 *
 * ─── RESPONSABILIDAD ─────────────────────────────────────────────────────────
 * Pantalla principal del Bullet Journal: el "Daily Log".
 *
 * Arquitectura en capas:
 *   ┌──────────────────────────────┐
 *   │      DailyLogScreen.js       │  ← UI (esta pantalla)
 *   ├──────────────────────────────┤
 *   │  useDragAndDrop (Hook)       │  ← Lógica de interacción gestual
 *   ├──────────────────────────────┤
 *   │  DailyLogService (Facade)    │  ← Lógica de negocio del diario
 *   ├──────────────────────────────┤
 *   │  JournalContext (Facade)     │  ← API de negocio simplificada
 *   ├──────────────────────────────┤
 *   │  EntryRepository             │  ← Acceso a datos (SQLite)
 *   └──────────────────────────────┘
 *
 * ─── FUNCIONALIDADES ─────────────────────────────────────────────────────────
 * - Muestra las entradas del día seleccionado (tareas, eventos, notas).
 * - Aplica el traspaso automático de tareas abiertas de días anteriores a HOY.
 * - Permite navegar entre días (← →).
 * - Registra la fecha de completado en el historial (completedAt).
 * - Permite añadir nuevas entradas con tipo configurable (tarea/evento/nota).
 * - Permite reordenar entradas mediante drag & drop animado.
 * - Permite mover una entrada a otro día mediante pulsación larga.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomDatePickerModal from '../components/CustomDatePickerModal';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
import SmartInput from '../components/SmartInput';
import { createDailyEntry } from '../factories/EntryFactory';
import { filterEntriesForDay, getEntryIcon, isEntryCompleted } from '../services/DailyLogService';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

// ─── Constantes de Layout ─────────────────────────────────────────────────────

/**
 * Dimensiones fijas de cada "slot" para el cálculo determinista de posiciones.
 * SLOT_HEIGHT = CARD_HEIGHT + CARD_GAP  →  unidad de rejilla para el drag.
 */
const CARD_HEIGHT = 56;
const CARD_GAP    = 10;
const SLOT_HEIGHT = CARD_HEIGHT + CARD_GAP;

// ─── Pantalla Principal ───────────────────────────────────────────────────────

/**
 * Pantalla "Daily Log" del Bullet Journal.
 *
 * @returns {JSX.Element} La pantalla renderizada.
 */
export default function DailyLogScreen() {

  // ── Acceso a datos y configuración (Observer Pattern) ────────────────────────

  const { entries, addEntry, toggleStatus, deleteEntry, updateEntryDate, reorderEntries } = useJournal();
  const { theme, language, timezone } = useSettings();
  const insets = useSafeAreaInsets();

  // ── Estado local de la pantalla ──────────────────────────────────────────────

  /** Texto del campo de nueva entrada */
  const [inputText, setInputText] = useState('');

  /** Tipo de entrada seleccionado en el selector del SmartInput */
  const [selectedType, setSelectedType] = useState('task');

  /** Fecha seleccionada para la nueva entrada (puede diferir del día visualizado) */
  const [selectedDate, setSelectedDate] = useState(new Date());

  /** Controla la visibilidad del DatePicker para crear nueva entrada */
  const [showDatePicker, setShowDatePicker] = useState(false);

  /** Entrada que el usuario quiere mover a otro día (pulsación larga) */
  const [reschedulingItem, setReschedulingItem] = useState(null);

  /** Fecha del día que se está visualizando actualmente */
  const [currentLogDate, setCurrentLogDate] = useState(new Date());

  // ── Fechas formateadas ────────────────────────────────────────────────────────

  /** HOY en formato 'YYYY-MM-DD' (constante durante la sesión) */
  const todayStr = getFormattedDate(new Date(), timezone);

  /** Fecha del día visualizado en formato 'YYYY-MM-DD' */
  const currentLogDateStr = getFormattedDate(currentLogDate, timezone);

  // ── Filtrado de entradas (Facade a DailyLogService) ──────────────────────────

  /**
   * Delegamos el filtrado al servicio `DailyLogService`.
   * El servicio aplica las reglas de negocio del Bullet Journal:
   *   - Entradas creadas para `currentLogDateStr`
   *   - Tareas abiertas de días ANTERIORES que "migran" a HOY
   * La pantalla no necesita conocer estas reglas internamente.
   */
  const dailyLogEntries = filterEntriesForDay(entries, currentLogDateStr, todayStr);

  // ── Lógica de Drag & Drop (Template Method + Strategy Pattern) ───────────────

  /**
   * Delegamos TODA la lógica de arrastre al hook especializado.
   *
   * Strategy: `reorderEntries` es la estrategia de persistencia intercambiable.
   * Template Method: el hook define el algoritmo; `slotHeight` lo especializa.
   */
  const {
    orderedItems: orderedEntries,
    setOrderedItems: setOrderedEntries,
    draggingIndex,
    itemAnimMap,
    panResponders,
    isDraggingRef,
  } = useDragAndDrop({
    items: dailyLogEntries,
    onReorder: reorderEntries,
    slotHeight: SLOT_HEIGHT,
  });

  // ── Sincronización con el estado global (Observer) ───────────────────────────

  /**
   * Sincroniza la fecha del selector con el día visualizado al cambiar de día.
   */
  useEffect(() => {
    setSelectedDate(currentLogDate);
  }, [currentLogDate]);

  /**
   * Cuando el contexto global (`entries`) cambia (nueva entrada, toggle, cambio de día),
   * sincronizamos el estado local con la nueva fuente de verdad.
   *
   * GUARD: `isDraggingRef.current` evita que una actualización interrumpa un drag activo.
   *
   * Comparación profunda: verificamos `id`, `status`, `text` y `date` para detectar
   * cualquier cambio relevante (no solo reordenaciones).
   */
  useEffect(() => {
    if (isDraggingRef.current) return;

    const isSame =
      orderedEntries.length === dailyLogEntries.length &&
      orderedEntries.every(
        (item, idx) =>
          item.id     === dailyLogEntries[idx]?.id     &&
          item.status === dailyLogEntries[idx]?.status &&
          item.text   === dailyLogEntries[idx]?.text   &&
          item.date   === dailyLogEntries[idx]?.date
      );

    if (!isSame) {
      Object.values(itemAnimMap).forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });
      setOrderedEntries(dailyLogEntries);
    }
  }, [entries, currentLogDateStr, todayStr]);

  // ── Handlers de Negocio ──────────────────────────────────────────────────────

  /**
   * Navega al día anterior (-1) o siguiente (+1).
   * @param {-1 | 1} direction - Dirección de la navegación.
   */
  const navigateDay = (direction) => {
    const newDate = new Date(currentLogDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentLogDate(newDate);
  };

  /**
   * Añade una nueva entrada al día visualizado.
   * Usa `EntryFactory.createDailyEntry` para garantizar la estructura correcta.
   * El `order_index` se asigna al final de la lista actual.
   */
  const handleAddEntry = () => {
    if (!inputText.trim()) return;

    const newEntry = createDailyEntry(
      inputText,
      selectedType,
      selectedDate,
      timezone,
      orderedEntries.length
    );
    addEntry(newEntry);

    // Resetear el input y la fecha al día visualizado
    setInputText('');
    setSelectedDate(currentLogDate);
  };

  /**
   * Abre el selector de fecha para mover una entrada existente a otro día.
   * @param {Object} item - La entrada a reprogramar.
   */
  const handleOpenDatePickerForItem = (item) => {
    setReschedulingItem(item);
  };

  /**
   * Confirma el movimiento de una entrada a la nueva fecha seleccionada.
   * @param {Date} newDate - La nueva fecha destino.
   */
  const handleMoveEntryDate = (newDate) => {
    if (!reschedulingItem) return;
    const newDateStr = getFormattedDate(newDate, timezone);
    updateEntryDate(reschedulingItem.id, newDateStr);
    setReschedulingItem(null);
  };

  /**
   * Muestra un diálogo de confirmación antes de eliminar una entrada.
   * @param {string} id - ID de la entrada a eliminar.
   */
  const confirmDeleteEntry = (id) => {
    Alert.alert(
      language === 'es' ? 'Eliminar registro' : 'Delete entry',
      language === 'es'
        ? '¿Estás seguro de que quieres eliminar este registro de forma permanente?'
        : 'Are you sure you want to delete this entry permanently?',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Eliminar' : 'Delete',
          style: 'destructive',
          onPress: () => deleteEntry(id),
        },
      ]
    );
  };

  // ── Computed ──────────────────────────────────────────────────────────────────

  /** Indica si el usuario está viendo el día de hoy */
  const isViewingToday = currentLogDateStr === todayStr;

  // ── Renderizado ───────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) },
      ]}
    >
      {/* ── Cabecera con navegación de días ──────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigateDay(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
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

      {/* ── Lista de entradas con drag & drop animado ────────────────────── */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={draggingIndex === null}
        >
          {orderedEntries.length === 0 ? (
            // ── Estado vacío ────────────────────────────────────────────────
            <View style={styles.emptyContainer}>
              <Text variant="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
                {language === 'es' ? 'Ningún registro en este día.' : 'No entries on this day.'}
              </Text>
            </View>
          ) : (
            // ── Tarjetas de entrada (con drag & drop animado) ───────────────
            orderedEntries.map((item, index) => {
              const isDragging    = draggingIndex === index;
              const isDraggingAny = draggingIndex !== null;

              // Cálculos de presentación delegados al servicio
              const isCompleted = isEntryCompleted(item, todayStr);
              const iconName    = getEntryIcon(item, todayStr);
              const iconColor   = isCompleted ? theme.textCompleted : theme.text;

              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.slotContainer,
                    isDraggingAny && itemAnimMap[item.id]
                      ? { transform: [{ translateY: itemAnimMap[item.id] }] }
                      : null,
                    {
                      zIndex:    isDragging ? 999 : 1,
                      elevation: isDragging ? 8   : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.cardBackground,
                        shadowColor:     theme.text,
                        shadowOpacity:   isDragging ? 0.3  : 0.03,
                        opacity:         isDragging ? 0.95 : 1,
                      },
                      isCompleted && { backgroundColor: theme.cardCompleted },
                    ]}
                  >
                    {/* ── Área principal: toggle de estado + mover fecha ──── */}
                    <TouchableOpacity
                      style={styles.cardMainArea}
                      onPress={() => item.type !== 'note' && toggleStatus(item.id, currentLogDateStr)}
                      onLongPress={() => handleOpenDatePickerForItem(item)}
                      delayLongPress={350}
                      activeOpacity={0.7}
                      disabled={draggingIndex !== null}
                    >
                      {/* Ícono del tipo/estado de la entrada */}
                      <View style={styles.iconContainer}>
                        <Ionicons
                          name={iconName}
                          size={item.type === 'note' ? 24 : 16}
                          color={iconColor}
                          style={item.type === 'task' && !isCompleted ? styles.taskIcon : null}
                        />
                      </View>

                      {/* Texto de la entrada */}
                      <View style={styles.cardContent}>
                        <Text
                          variant="body"
                          style={[
                            styles.cardText,
                            { color: theme.text },
                            isCompleted && { color: theme.textCompleted, textDecorationLine: 'line-through' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.text}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* ── Acciones: eliminar y arrastrar ──────────────────── */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => confirmDeleteEntry(item.id)}
                        accessibilityLabel={language === 'es' ? 'Eliminar' : 'Delete'}
                        accessibilityRole="button"
                        disabled={draggingIndex !== null}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.error || '#ff3b30'} />
                      </TouchableOpacity>

                      <View
                        style={styles.dragHandle}
                        {...panResponders[index]?.panHandlers}
                        accessibilityLabel={
                          language === 'es' ? 'Arrastrar para ordenar' : 'Drag to reorder'
                        }
                      >
                        <Ionicons
                          name="menu"
                          size={24}
                          color={isDragging ? theme.primary : theme.textSecondary}
                        />
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ── Input con selector de tipo y fecha ──────────────────────────── */}
      <SmartInput
        value={inputText}
        onChangeText={setInputText}
        onSubmit={handleAddEntry}
        placeholder={language === 'es' ? 'Añadir...' : 'Add entry...'}
        topContent={
          <>
            {/* Selector de tipo: Tarea */}
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: selectedType === 'task' ? theme.text : theme.inputBackground }]}
              onPress={() => setSelectedType('task')}
              accessibilityLabel={language === 'es' ? 'Tarea' : 'Task'}
            >
              <Ionicons name="ellipse" size={10} color={selectedType === 'task' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>

            {/* Selector de tipo: Evento */}
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: selectedType === 'event' ? theme.text : theme.inputBackground }]}
              onPress={() => setSelectedType('event')}
              accessibilityLabel={language === 'es' ? 'Evento' : 'Event'}
            >
              <Ionicons name="ellipse-outline" size={12} color={selectedType === 'event' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>

            {/* Selector de tipo: Nota */}
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
          /* Botón de calendario para seleccionar fecha de la nueva entrada */
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowDatePicker(true)}
            accessibilityLabel={language === 'es' ? 'Seleccionar fecha' : 'Select date'}
          >
            <Ionicons
              name="calendar"
              size={22}
              color={
                getFormattedDate(selectedDate, timezone) !== currentLogDateStr
                  ? theme.primary       // Destacado si la fecha difiere del día actual
                  : theme.textSecondary
              }
            />
          </TouchableOpacity>
        }
      />

      {/* ── Modal: selector de fecha para nueva entrada ──────────────────── */}
      <CustomDatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onSelectDate={(date) => setSelectedDate(date)}
        onClose={() => setShowDatePicker(false)}
      />

      {/* ── Modal: selector de fecha para MOVER entrada existente ────────── */}
      <CustomDatePickerModal
        visible={!!reschedulingItem}
        selectedDate={reschedulingItem?.date || currentLogDateStr}
        onSelectDate={handleMoveEntryDate}
        onClose={() => setReschedulingItem(null)}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  /** Cabecera con navegación de días */
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitles: { alignItems: 'center' },
  navButton: { padding: 8 },
  title: { letterSpacing: -0.5 },
  subtitle: { marginTop: 4, textTransform: 'capitalize' },

  listContent: {
    paddingHorizontal: 20,
    paddingTop:        10,
    paddingBottom:     20,
    flexGrow:          1,
  },

  /** Slot de altura fija: unidad fundamental de la rejilla del drag */
  slotContainer: {
    height:       CARD_HEIGHT,
    marginBottom: CARD_GAP,
  },

  card: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    borderRadius:      12,
    shadowOffset:      { width: 0, height: 2 },
    shadowRadius:      4,
  },
  cardMainArea: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width:          24,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    12,
  },
  taskIcon: { transform: [{ scale: 0.8 }] },
  cardContent: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  cardText: { flex: 1 },

  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginLeft: 2 },
  dragHandle: {
    padding:        8,
    marginLeft:     4,
    marginRight:    -4,
    alignItems:     'center',
    justifyContent: 'center',
  },

  emptyContainer: {
    alignItems:  'center',
    justifyContent: 'center',
    marginTop:   60,
  },
  emptyText: {},

  /** Selector de tipo de entrada (tarea/evento/nota) */
  typeButton: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      16,
  },
  calendarButton: { padding: 4 },
});

/**
 * @screen DailyLogScreen
 * @description Pantalla principal del Bullet Journal: el "Daily Log".
 *
 * Muestra las entradas del día seleccionado, aplica el traspaso automático
 * de tareas abiertas a HOY, registra la fecha de completado en el historial,
 * permite añadir nuevas entradas y reordenarlas mediante slots animados.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Platform,
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

// Dimensiones fijas de cada "slot" para cálculo matemático perfecto
const CARD_HEIGHT = 56;
const CARD_GAP = 10;
const SLOT_HEIGHT = CARD_HEIGHT + CARD_GAP;

export default function DailyLogScreen() {
  // ── Acceso a datos y configuración (Observer Pattern) ────────────────────────
  const { entries, addEntry, toggleStatus, deleteEntry, updateEntryDate, reorderEntries } = useJournal();
  const { theme, language, timezone } = useSettings();
  const insets = useSafeAreaInsets();

  // ── Estado local de la pantalla ──────────────────────────────────────────────
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState('task');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reschedulingItem, setReschedulingItem] = useState(null);
  const [currentLogDate, setCurrentLogDate] = useState(new Date());
  const [draggingIndex, setDraggingIndex] = useState(null);

  // Fechas en formato 'YYYY-MM-DD'
  const todayStr = getFormattedDate(new Date(), timezone);
  const currentLogDateStr = getFormattedDate(currentLogDate, timezone);

  // Entradas filtradas para el día visualizado
  const dailyLogEntries = filterEntriesForDay(entries, currentLogDateStr, todayStr);

  // Estado local para sincronizar la renderización atómica en el drop y evitar parpadeos
  const [orderedEntries, setOrderedEntries] = useState(dailyLogEntries);

  useEffect(() => {
    setSelectedDate(currentLogDate);
  }, [currentLogDate]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      Object.values(itemAnimMap).forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });
      setOrderedEntries(dailyLogEntries);
    }
  }, [entries, currentLogDateStr, todayStr]);

  // Mapa de valores animados estables vinculados directamente al ID único de cada entrada
  const itemAnimMap = useRef({}).current;

  // Asegurar que cada elemento tenga siempre su propio Animated.Value estable
  orderedEntries.forEach((item) => {
    if (!itemAnimMap[item.id]) {
      itemAnimMap[item.id] = new Animated.Value(0);
    }
  });

  // Referencias para controlar el estado de arrastre sin desfases de closure
  const isDraggingRef = useRef(false);
  const draggingIndexRef = useRef(null);
  const targetIndexRef = useRef(null);
  const currentDyRef = useRef(0);
  const entriesRef = useRef(orderedEntries);
  entriesRef.current = orderedEntries;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const navigateDay = (direction) => {
    const newDate = new Date(currentLogDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentLogDate(newDate);
  };

  const handleAddEntry = () => {
    if (!inputText.trim()) return;

    // EntryFactory.createDailyEntry garantiza la estructura correcta del objeto con order_index
    const newEntry = createDailyEntry(
      inputText,
      selectedType,
      selectedDate,
      timezone,
      orderedEntries.length
    );
    addEntry(newEntry);

    // Reset del texto del input y de la fecha seleccionada
    setInputText('');
    setSelectedDate(currentLogDate);
  };

  const handleOpenDatePickerForItem = (item) => {
    setReschedulingItem(item);
  };

  const handleMoveEntryDate = (newDate) => {
    if (!reschedulingItem) return;
    const newDateStr = getFormattedDate(newDate, timezone);
    updateEntryDate(reschedulingItem.id, newDateStr);
    setReschedulingItem(null);
  };

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

  /**
   * Recalcula y anima las posiciones de todos los slots no arrastrados
   * abriendo el hueco en 'targetIdx' inmediatamente mediante cálculo de rango.
   */
  const updateSlots = (fromIdx, toIdx) => {
    const total = entriesRef.current.length;
    for (let j = 0; j < total; j++) {
      if (j === fromIdx) continue;

      const item = entriesRef.current[j];
      if (!item || !itemAnimMap[item.id]) continue;

      // Rango del elemento entre los restantes (0 .. total-2)
      const rank = j < fromIdx ? j : j - 1;
      // Slot asignado cuando el hueco está en toIdx
      const assignedSlot = rank < toIdx ? rank : rank + 1;
      // Desplazamiento respecto a su posición de reposo
      const targetOffset = (assignedSlot - j) * SLOT_HEIGHT;

      // Detener cualquier animación previa para evitar que el spring nativo continúe de fondo
      itemAnimMap[item.id].stopAnimation();
      Animated.spring(itemAnimMap[item.id], {
        toValue: targetOffset,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  };

  /**
   * Finaliza el arrastre asentando el elemento en su slot de destino y persistiendo el nuevo orden.
   */
  const finishDrag = () => {
    if (!isDraggingRef.current || draggingIndexRef.current === null) return;

    const fromIdx = draggingIndexRef.current;
    const toIdx = targetIndexRef.current !== null ? targetIndexRef.current : fromIdx;
    const draggedItem = entriesRef.current[fromIdx];

    let finalized = false;
    const finalize = () => {
      if (finalized) return;
      finalized = true;

      // 1. Detener todas las animaciones nativas activas y resetear sus valores a 0
      Object.values(itemAnimMap).forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });

      // 2. Si cambió de posición, calculamos y actualizamos el estado local atómicamente
      if (fromIdx !== toIdx) {
        const nextEntries = [...entriesRef.current];
        const [movedItem] = nextEntries.splice(fromIdx, 1);
        nextEntries.splice(toIdx, 0, movedItem);

        // Actualizar el estado local y persistir
        setOrderedEntries(nextEntries);
        reorderEntries(nextEntries);
      }

      // 3. Resetear estado de arrastre
      currentDyRef.current = 0;
      draggingIndexRef.current = null;
      targetIndexRef.current = null;
      isDraggingRef.current = false;
      setDraggingIndex(null);
    };

    const finalSlotDelta = (toIdx - fromIdx) * SLOT_HEIGHT;
    const currentVal = currentDyRef.current || 0;

    // Si apenas se movió del slot objetivo o no existe la tarjeta, finalizar de inmediato
    if (!draggedItem || !itemAnimMap[draggedItem.id] || Math.abs(currentVal - finalSlotDelta) < 3) {
      finalize();
      return;
    }

    // Temporizador de seguridad: asegura que el estado se libere siempre aunque el native driver no emita callback
    const safetyTimer = setTimeout(finalize, 250);

    itemAnimMap[draggedItem.id].stopAnimation();
    Animated.spring(itemAnimMap[draggedItem.id], {
      toValue: finalSlotDelta,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start(() => {
      clearTimeout(safetyTimer);
      finalize();
    });
  };

  // PanResponders individuales asociados al botón de arrastre de cada fila
  const panResponders = useMemo(() => {
    return orderedEntries.map((item, index) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dy) > 2,
        onPanResponderTerminationRequest: () => false, // Impide que ScrollView u otros contenedores aborten el gesto
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          draggingIndexRef.current = index;
          targetIndexRef.current = index;
          currentDyRef.current = 0;

          // Detener animaciones previas en todos los elementos
          Object.values(itemAnimMap).forEach((anim) => anim.stopAnimation());

          if (itemAnimMap[item.id]) {
            itemAnimMap[item.id].setValue(0);
          }
          setDraggingIndex(index);
          updateSlots(index, index);
        },
        onPanResponderMove: (_, gestureState) => {
          const total = entriesRef.current.length;
          const minDy = -index * SLOT_HEIGHT;
          const maxDy = (total - 1 - index) * SLOT_HEIGHT;

          // Clampear el desplazamiento estrictamente dentro del rango de los slots disponibles
          const clampedDy = Math.max(minDy - 6, Math.min(maxDy + 6, gestureState.dy));
          currentDyRef.current = clampedDy;
          if (itemAnimMap[item.id]) {
            itemAnimMap[item.id].setValue(clampedDy);
          }

          const rawTarget = Math.round(index + clampedDy / SLOT_HEIGHT);
          const clampedTarget = Math.max(0, Math.min(total - 1, rawTarget));

          if (clampedTarget !== targetIndexRef.current) {
            targetIndexRef.current = clampedTarget;
            updateSlots(index, clampedTarget);
          }
        },
        onPanResponderRelease: () => {
          finishDrag();
        },
        onPanResponderTerminate: () => {
          finishDrag();
        },
      })
    );
  }, [orderedEntries.length, orderedEntries]);

  const isViewingToday = currentLogDateStr === todayStr;

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) },
      ]}
    >
      {/* Cabecera con navegación de días */}
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

      {/* Lista de entradas del día con ordenación por slots */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={draggingIndex === null}
        >
          {orderedEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
                {language === 'es' ? 'Ningún registro en este día.' : 'No entries on this day.'}
              </Text>
            </View>
          ) : (
            orderedEntries.map((item, index) => {
              const isDragging = draggingIndex === index;
              const translateY = itemAnimMap[item.id] || 0;
              const isCompleted = isEntryCompleted(item, todayStr);
              const iconName = getEntryIcon(item, todayStr);
              const iconColor = isCompleted ? theme.textCompleted : theme.text;

              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.slotContainer,
                    {
                      transform: [{ translateY }],
                      zIndex: isDragging ? 999 : 1,
                      elevation: isDragging ? 8 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.cardBackground,
                        shadowColor: theme.text,
                        shadowOpacity: isDragging ? 0.3 : 0.03,
                        opacity: isDragging ? 0.95 : 1,
                      },
                      isCompleted && { backgroundColor: theme.cardCompleted },
                    ]}
                  >
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

                    {/* Botones de acción: Papelera y Tirador de arrastre */}
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
                          language === 'es'
                            ? 'Arrastrar para ordenar'
                            : 'Drag to reorder'
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

      {/* Input reutilizable con selector de tipo */}
      <SmartInput
        value={inputText}
        onChangeText={setInputText}
        onSubmit={handleAddEntry}
        placeholder={language === 'es' ? 'Añadir...' : 'Add entry...'}
        topContent={
          <>
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
                  ? theme.primary
                  : theme.textSecondary
              }
            />
          </TouchableOpacity>
        }
      />

      {/* Modal selector de fecha para crear nueva entrada */}
      <CustomDatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onSelectDate={(date) => setSelectedDate(date)}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Modal selector de fecha para MOVER una entrada existente al hacer pulsación prolongada */}
      <CustomDatePickerModal
        visible={!!reschedulingItem}
        selectedDate={reschedulingItem?.date || currentLogDateStr}
        onSelectDate={handleMoveEntryDate}
        onClose={() => setReschedulingItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitles: { alignItems: 'center' },
  navButton: { padding: 8 },
  title: { letterSpacing: -0.5 },
  subtitle: { marginTop: 4, textTransform: 'capitalize' },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  slotContainer: {
    height: CARD_HEIGHT,
    marginBottom: CARD_GAP,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskIcon: { transform: [{ scale: 0.8 }] },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: { flex: 1 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginLeft: 2 },
  dragHandle: {
    padding: 8,
    marginLeft: 4,
    marginRight: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {},
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  calendarButton: { padding: 4 },
});


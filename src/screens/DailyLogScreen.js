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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomDatePickerModal from '../components/CustomDatePickerModal';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
import SmartInput from '../components/SmartInput';
import { createDailyEntry } from '../factories/EntryFactory';
import {
  filterEntriesForLogMode,
  getEntryIcon,
  isEntryCompleted,
  getSignifierSymbol,
} from '../services/DailyLogService';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { getFormattedWeekSubtitle, getFormattedMonthSubtitle } from '../utils/dateUtils';
import SearchModal from '../components/SearchModal';

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
 * Pantalla "Daily Log / Week Log / Month Log" del Bullet Journal.
 *
 * @param {Object} props
 * @param {Object} [props.navigation] - Objeto de navegación.
 * @returns {JSX.Element} La pantalla renderizada.
 */
export default function DailyLogScreen({ navigation }) {

  // ── Acceso a datos y configuración (Observer Pattern) ────────────────────────

  // ── Acceso a datos y configuración (Observer Pattern) ────────────────────────

  const {
    entries,
    addEntry,
    toggleStatus,
    toggleSignifier,
    deleteEntry,
    updateEntryDate,
    updateEntryDateTime,
    reorderEntries,
  } = useJournal();
  const { theme, language, timezone, firstDayOfWeek = 'monday' } = useSettings();
  const insets = useSafeAreaInsets();

  // ── Estado local de la pantalla ──────────────────────────────────────────────

  /** Modo de log activo ('daily' | 'week' | 'month') */
  const [logMode, setLogMode] = useState('daily');

  /** Visibilidad del desplegable para cambiar de modo de log */
  const [showLogModeMenu, setShowLogModeMenu] = useState(false);

  /** Visibilidad del buscador global */
  const [showSearchModal, setShowSearchModal] = useState(false);

  /** Texto del campo de nueva entrada */
  const [inputText, setInputText] = useState('');

  /** Tipo de entrada seleccionado en el selector del SmartInput */
  const [selectedType, setSelectedType] = useState('task');

  /** Significador purista seleccionado para la nueva entrada ('priority' | 'inspiration' | null) */
  const [selectedSignifier, setSelectedSignifier] = useState(null);

  /** Fecha seleccionada para la nueva entrada (puede diferir del día visualizado) */
  const [selectedDate, setSelectedDate] = useState(new Date());

  /** Hora seleccionada para la nueva entrada ('HH:mm' | null) */
  const [selectedTime, setSelectedTime] = useState(null);

  /** Controla la visibilidad del DatePicker para crear nueva entrada */
  const [showDatePicker, setShowDatePicker] = useState(false);

  /** Entrada que el usuario quiere mover a otro día (pulsación larga) */
  const [reschedulingItem, setReschedulingItem] = useState(null);

  /** Fecha del día/semana/mes que se está visualizando actualmente */
  const [currentLogDate, setCurrentLogDate] = useState(new Date());

  // ── Fechas formateadas ────────────────────────────────────────────────────────

  /** HOY en formato 'YYYY-MM-DD' (constante durante la sesión) */
  const todayStr = getFormattedDate(new Date(), timezone);

  /** Fecha del día visualizado en formato 'YYYY-MM-DD' */
  const currentLogDateStr = getFormattedDate(currentLogDate, timezone);

  // ── Filtrado de entradas (Facade a DailyLogService) ──────────────────────────

  /**
   * Delegamos el filtrado al servicio `DailyLogService`.
   * El servicio aplica las reglas de negocio del Bullet Journal para Daily, Week y Month log.
   * `useMemo` evita recalcular el filtrado y ordenamiento de todas las tareas al teclear en el input.
   */
  const currentLogEntries = useMemo(() => {
    return filterEntriesForLogMode(entries, currentLogDateStr, todayStr, logMode, firstDayOfWeek);
  }, [entries, currentLogDateStr, todayStr, logMode, firstDayOfWeek]);

  // ── Lógica de Drag & Drop (Template Method + Strategy Pattern) ───────────────

  const {
    orderedItems: orderedEntries,
    setOrderedItems: setOrderedEntries,
    draggingIndex,
    itemAnimMap,
    panResponders,
    isDraggingRef,
  } = useDragAndDrop({
    items: currentLogEntries,
    onReorder: reorderEntries,
    slotHeight: SLOT_HEIGHT,
  });

  // ── Sincronización con el estado global (Observer) ───────────────────────────

  useEffect(() => {
    setSelectedDate(currentLogDate);
    setSelectedTime(null);
  }, [currentLogDate]);

  useEffect(() => {
    if (isDraggingRef.current) return;

    const isSame =
      orderedEntries.length === currentLogEntries.length &&
      orderedEntries.every(
        (item, idx) =>
          item.id        === currentLogEntries[idx]?.id        &&
          item.status    === currentLogEntries[idx]?.status    &&
          item.signifier === currentLogEntries[idx]?.signifier &&
          item.text      === currentLogEntries[idx]?.text      &&
          item.time      === currentLogEntries[idx]?.time      &&
          item.date      === currentLogEntries[idx]?.date
      );

    if (!isSame) {
      Object.values(itemAnimMap).forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });
      setOrderedEntries(currentLogEntries);
    }
  }, [entries, currentLogDateStr, todayStr, logMode]);

  // ── Handlers de Negocio ──────────────────────────────────────────────────────

  /**
   * Navega según el modo activo (-1 o +1 unidad: días, semanas o meses).
   * @param {-1 | 1} direction - Dirección de la navegación.
   */
  const navigatePeriod = (direction) => {
    const newDate = new Date(currentLogDate);
    if (logMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (logMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentLogDate(newDate);
  };

  /**
   * Título principal según el modo activo e idioma.
   */
  const getLogTitle = () => {
    if (logMode === 'week') {
      return language === 'es' ? 'Log Semanal' : 'Week Log';
    }
    if (logMode === 'month') {
      return language === 'es' ? 'Log Mensual' : 'Month Log';
    }
    return language === 'es' ? 'Log Diario' : 'Daily Log';
  };

  /**
   * Subtítulo con rango de fechas o nombre de fecha.
   */
  const getLogSubtitle = () => {
    if (logMode === 'week') {
      return getFormattedWeekSubtitle(currentLogDate, language, firstDayOfWeek);
    }
    if (logMode === 'month') {
      return getFormattedMonthSubtitle(currentLogDate, language);
    }
    return currentLogDate.toLocaleDateString(
      language === 'es' ? 'es-ES' : 'en-US',
      { weekday: 'long', month: 'long', day: 'numeric' }
    );
  };

  const handleAddEntry = () => {
    if (!inputText.trim()) return;

    const newEntry = createDailyEntry(
      inputText,
      selectedType,
      selectedDate,
      timezone,
      orderedEntries.length,
      selectedSignifier,
      selectedTime
    );
    addEntry(newEntry);

    setInputText('');
    setSelectedSignifier(null);
    setSelectedTime(null);
    setSelectedDate(currentLogDate);
  };

  const handleOpenDatePickerForItem = (item) => {
    setReschedulingItem(item);
  };

  const handleMoveEntryDate = (newDate, newTime) => {
    if (!reschedulingItem) return;
    const newDateStr = getFormattedDate(newDate, timezone);
    updateEntryDateTime(reschedulingItem.id, newDateStr, newTime);
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
   * Navega o salta a la entrada seleccionada desde el buscador.
   */
  const handleSelectSearchResult = (item) => {
    if (item.listId && navigation) {
      navigation.navigate('Listas', {
        screen: 'ListDetail',
        params: { list: { id: item.listId, title: item.listName || '' } },
      });
    } else if (item.date || item.completedAt) {
      const targetDate = item.date || item.completedAt;
      setCurrentLogDate(new Date(targetDate));
      setLogMode('daily');
    }
  };

  // ── Renderizado ───────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      {/* ── Cabecera con navegación de días ──────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigatePeriod(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <TouchableOpacity
              style={[
                styles.titleSelector,
                { backgroundColor: theme.inputBackground }
              ]}
              onPress={() => setShowLogModeMenu(prev => !prev)}
              activeOpacity={0.6}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              accessibilityLabel={language === 'es' ? 'Cambiar vista de log' : 'Change log view'}
            >
              <Text variant="h1" style={[styles.title, { color: theme.text }]}>
                {getLogTitle()}
              </Text>
              <Ionicons
                name={showLogModeMenu ? "caret-up" : "caret-down"}
                size={14}
                color={theme.text}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>

            <Text variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              {getLogSubtitle()}
            </Text>
          </View>

          <View style={styles.rightHeaderButtons}>
            <TouchableOpacity onPress={() => setShowSearchModal(true)} style={styles.navButton}>
              <Ionicons name="search" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigatePeriod(1)} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
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
                {logMode === 'week'
                  ? (language === 'es' ? 'Ningún registro en esta semana.' : 'No entries in this week.')
                  : logMode === 'month'
                  ? (language === 'es' ? 'Ningún registro en este mes.' : 'No entries in this month.')
                  : (language === 'es' ? 'Ningún registro en este día.' : 'No entries on this day.')}
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
                    {/* ── Área principal: toggle de significador (* / !) + toggle de estado + mover fecha ──── */}
                    <View style={styles.cardMainArea}>
                      {/* Ícono del tipo/estado de la entrada + Significador purista (* / !) */}
                      <TouchableOpacity
                        style={styles.iconContainer}
                        onPress={() => toggleSignifier(item.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        disabled={draggingIndex !== null}
                        activeOpacity={0.5}
                      >
                        {item.signifier ? (
                          <Text
                            style={[
                              styles.signifierText,
                              { color: isCompleted ? theme.textCompleted : theme.text },
                            ]}
                          >
                            {getSignifierSymbol(item.signifier)}
                          </Text>
                        ) : null}
                        <Ionicons
                          name={iconName}
                          size={item.type === 'note' ? 24 : 16}
                          color={iconColor}
                          style={item.type === 'task' && !isCompleted ? styles.taskIcon : null}
                        />
                      </TouchableOpacity>

                      {/* Texto de la entrada + hora opcional */}
                      <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => item.type !== 'note' && toggleStatus(item.id, currentLogDateStr)}
                        onLongPress={() => handleOpenDatePickerForItem(item)}
                        delayLongPress={350}
                        activeOpacity={0.7}
                        disabled={draggingIndex !== null}
                      >
                        {item.time ? (
                          <View style={[styles.timeBadge, { backgroundColor: theme.inputBackground }]}>
                            <Text style={[styles.timeBadgeText, { color: isCompleted ? theme.textCompleted : theme.text }]}>
                              {item.time}
                            </Text>
                          </View>
                        ) : null}

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
                      </TouchableOpacity>
                    </View>

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

            {/* Divisor suave */}
            <View style={{ width: 1, height: 18, backgroundColor: theme.border, marginHorizontal: 4 }} />

            {/* Significador purista: Prioridad (*) */}
            <TouchableOpacity
              style={[
                styles.typeButton,
                { backgroundColor: selectedSignifier === 'priority' ? theme.text : theme.inputBackground },
              ]}
              onPress={() => setSelectedSignifier(selectedSignifier === 'priority' ? null : 'priority')}
              accessibilityLabel={language === 'es' ? 'Prioridad (*)' : 'Priority (*)'}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: selectedSignifier === 'priority' ? theme.cardBackground : theme.iconInactive,
                }}
              >
                *
              </Text>
            </TouchableOpacity>

            {/* Significador purista: Inspiración (!) */}
            <TouchableOpacity
              style={[
                styles.typeButton,
                { backgroundColor: selectedSignifier === 'inspiration' ? theme.text : theme.inputBackground },
              ]}
              onPress={() => setSelectedSignifier(selectedSignifier === 'inspiration' ? null : 'inspiration')}
              accessibilityLabel={language === 'es' ? 'Inspiración (!)' : 'Inspiration (!)'}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: selectedSignifier === 'inspiration' ? theme.cardBackground : theme.iconInactive,
                }}
              >
                !
              </Text>
            </TouchableOpacity>
          </>
        }
        leftContent={
          /* Botón de calendario para seleccionar fecha u hora de la nueva entrada */
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowDatePicker(true)}
            accessibilityLabel={language === 'es' ? 'Seleccionar fecha u hora' : 'Select date or time'}
          >
            <Ionicons
              name="calendar"
              size={22}
              color={
                getFormattedDate(selectedDate, timezone) !== currentLogDateStr || selectedTime
                  ? theme.primary       // Destacado si la fecha/hora difiere
                  : theme.textSecondary
              }
            />
          </TouchableOpacity>
        }
      />

      {/* ── Modal: selector de fecha y hora para nueva entrada ─────────────── */}
      <CustomDatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSelectDate={(date, time) => {
          setSelectedDate(date);
          setSelectedTime(time || null);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      {/* ── Modal: selector de fecha y hora para MOVER entrada existente ──── */}
      <CustomDatePickerModal
        visible={!!reschedulingItem}
        selectedDate={reschedulingItem?.date || currentLogDateStr}
        selectedTime={reschedulingItem?.time || null}
        onSelectDate={handleMoveEntryDate}
        onClose={() => setReschedulingItem(null)}
      />

      {/* ── Desplegable flotante: Selector de vista (Log Diario / Semanal / Mensual) ── */}
      {showLogModeMenu && (
        <View style={styles.inlineOverlayContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.inlineBackdrop}
            activeOpacity={1}
            onPress={() => setShowLogModeMenu(false)}
          />
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                shadowColor: theme.text,
                top: Math.max(insets.top, 30) + 55,
              },
            ]}
          >
            {[
              { id: 'daily', labelEs: 'Log Diario',  labelEn: 'Daily Log', icon: 'today-outline' },
              { id: 'week',  labelEs: 'Log Semanal', labelEn: 'Week Log',  icon: 'calendar-outline' },
              { id: 'month', labelEs: 'Log Mensual', labelEn: 'Month Log', icon: 'calendar-number-outline' },
            ].map((option) => {
              const isSelected = logMode === option.id;
              const label = language === 'es' ? option.labelEs : option.labelEn;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    isSelected && { backgroundColor: theme.primaryBackground || theme.inputBackground },
                  ]}
                  onPress={() => {
                    setLogMode(option.id);
                    setShowLogModeMenu(false);
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? theme.primary : theme.text}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    variant="body"
                    style={[
                      styles.dropdownItemText,
                      { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '400' },
                    ]}
                  >
                    {label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.primary}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Modal de Búsqueda Global ────────────────────────────────────────── */}
      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectResult={handleSelectSearchResult}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, position: 'relative' },

  /** Cabecera con navegación de días */
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, zIndex: 10 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitles: { alignItems: 'center' },
  rightHeaderButtons: { flexDirection: 'row', alignItems: 'center' },
  titleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
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
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    12,
  },
  signifierText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 3,
  },
  taskIcon: { transform: [{ scale: 0.8 }] },
  timeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardContent: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'flex-start',
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

  inlineOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    elevation: 9998,
  },
  inlineBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    alignSelf: 'center',
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 9999,
    zIndex: 9999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  dropdownItemText: {
    fontSize: 15,
  },
});

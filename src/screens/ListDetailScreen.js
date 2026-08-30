/**
 * @screen ListDetailScreen
 * @description Pantalla de detalle de una lista personalizada del usuario.
 *
 * Muestra todos los elementos de la lista seleccionada, permite añadir nuevos,
 * alternar su estado y reordenarlos mediante el sistema determinista de slots animados.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useJournal } from '../context/JournalContext';
import SmartInput from '../components/SmartInput';
import { createListEntry } from '../factories/EntryFactory';

// Dimensiones fijas de cada "slot" para cálculo matemático perfecto
const CARD_HEIGHT = 56;
const CARD_GAP = 10;
const SLOT_HEIGHT = CARD_HEIGHT + CARD_GAP;

export default function ListDetailScreen({ route, navigation }) {
  // La lista que el usuario seleccionó en ListsScreen, pasada via route params
  const { list } = route.params;

  // ── Acceso a datos y configuración (Observer Pattern) ────────────────────────
  const { theme, language, timezone } = useSettings();
  const { entries, toggleStatus, addEntry, deleteEntry, reorderEntries } = useJournal();
  const insets = useSafeAreaInsets();

  /** Texto que el usuario está escribiendo en el SmartInput */
  const [inputText, setInputText] = useState('');
  const [draggingIndex, setDraggingIndex] = useState(null);

  // ── Filtrado de entradas de la lista ──────────────────────────────────────────
  const listItems = entries.filter((entry) => entry.listId === list.id);

  // Estado local para sincronizar la renderización atómica en el drop y evitar parpadeos
  const [orderedItems, setOrderedItems] = useState(listItems);

  useEffect(() => {
    if (!isDraggingRef.current) {
      Object.values(itemAnimMap).forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });
      setOrderedItems(listItems);
    }
  }, [entries, list.id]);

  // Mapa de valores animados estables vinculados directamente al ID único de cada elemento
  const itemAnimMap = useRef({}).current;

  // Asegurar que cada elemento tenga siempre su propio Animated.Value estable
  orderedItems.forEach((item) => {
    if (!itemAnimMap[item.id]) {
      itemAnimMap[item.id] = new Animated.Value(0);
    }
  });

  // Referencias para controlar el estado de arrastre sin desfases de closure
  const isDraggingRef = useRef(false);
  const draggingIndexRef = useRef(null);
  const targetIndexRef = useRef(null);
  const currentDyRef = useRef(0);
  const itemsRef = useRef(orderedItems);
  itemsRef.current = orderedItems;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleAddItem = () => {
    if (!inputText.trim()) return;

    // EntryFactory.createListEntry garantiza la estructura correcta, incluyendo date y order_index
    const newEntry = createListEntry(
      inputText,
      list.id,
      timezone,
      orderedItems.length
    );
    addEntry(newEntry);
    setInputText('');
  };

  const confirmDeleteItem = (id) => {
    Alert.alert(
      language === 'es' ? 'Eliminar elemento' : 'Delete item',
      language === 'es'
        ? '¿Estás seguro de que quieres eliminar este elemento de forma permanente?'
        : 'Are you sure you want to delete this item permanently?',
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
    const total = itemsRef.current.length;
    for (let j = 0; j < total; j++) {
      if (j === fromIdx) continue;

      const item = itemsRef.current[j];
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
    const draggedItem = itemsRef.current[fromIdx];

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
        const nextItems = [...itemsRef.current];
        const [movedItem] = nextItems.splice(fromIdx, 1);
        nextItems.splice(toIdx, 0, movedItem);

        // Actualizar el estado local y persistir
        setOrderedItems(nextItems);
        reorderEntries(nextItems);
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
    return orderedItems.map((item, index) =>
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
          const total = itemsRef.current.length;
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
  }, [orderedItems.length, orderedItems]);

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) },
      ]}
    >
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
            {orderedItems.length} {language === 'es' ? 'elementos' : 'items'}
          </Text>
        </View>
      </View>

      {/* Lista de elementos con ordenación por slots */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={draggingIndex === null}
        >
          {orderedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="documents-outline"
                size={64}
                color={theme.textCompleted}
                style={styles.emptyIcon}
              />
              <Text
                variant="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                {language === 'es'
                  ? 'Esta lista está vacía. Añade el primer elemento abajo.'
                  : 'This list is empty. Add the first item below.'}
              </Text>
            </View>
          ) : (
            orderedItems.map((item, index) => {
              const isDragging = draggingIndex === index;
              const translateY = itemAnimMap[item.id] || 0;
              const isCompleted = item.status === 'completed';

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
                      onPress={() => toggleStatus(item.id, null)}
                      activeOpacity={0.7}
                      disabled={draggingIndex !== null}
                    >
                      {/* Bullet: círculo hueco o con X */}
                      <View style={[styles.bullet, { borderColor: theme.text }]}>
                        {isCompleted && <Ionicons name="close" size={16} color={theme.text} />}
                      </View>

                      {/* Texto del elemento */}
                      <Text
                        variant="body"
                        style={[
                          styles.cardText,
                          { color: isCompleted ? theme.textCompleted : theme.text },
                          isCompleted && styles.itemTextCompleted,
                        ]}
                        numberOfLines={1}
                      >
                        {item.text}
                      </Text>
                    </TouchableOpacity>

                    {/* Botones de acción: Papelera y Tirador de arrastre */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => confirmDeleteItem(item.id)}
                        accessibilityLabel={language === 'es' ? 'Eliminar' : 'Delete'}
                        accessibilityRole="button"
                        disabled={draggingIndex !== null}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.error || '#ff3b30'}
                        />
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

      {/* Input reutilizable sin extras */}
      <SmartInput
        value={inputText}
        onChangeText={setInputText}
        onSubmit={handleAddItem}
        placeholder={language === 'es' ? 'Añadir elemento...' : 'Add item...'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: { marginRight: 12, padding: 4 },
  headerTitleContainer: { flex: 1 },
  title: { letterSpacing: -0.5 },
  subtitle: { marginTop: 2 },
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
  bullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  itemTextCompleted: { textDecorationLine: 'line-through' },
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIcon: { opacity: 0.5, marginBottom: 16 },
  emptyText: { textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
});

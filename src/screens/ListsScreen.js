import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useJournal } from '../context/JournalContext';
import SmartInput from '../components/SmartInput';

// Dimensiones fijas de cada "slot" para cálculo matemático perfecto
const CARD_HEIGHT = 56;
const CARD_GAP = 10;
const SLOT_HEIGHT = CARD_HEIGHT + CARD_GAP;

export default function ListsScreen({ navigation }) {
  const { theme, language } = useSettings();
  const { lists, addList, deleteList, reorderLists } = useJournal();
  const insets = useSafeAreaInsets();

  const [inputText, setInputText] = useState('');
  const [draggingIndex, setDraggingIndex] = useState(null);

  // Referencias para controlar el estado de arrastre sin desfases de closure
  const isDraggingRef = useRef(false);
  const draggingIndexRef = useRef(null);
  const targetIndexRef = useRef(null);
  const listsRef = useRef(lists);
  listsRef.current = lists;

  // Valor animado para la tarjeta activa (la que se está arrastrando)
  const draggedPanY = useRef(new Animated.Value(0)).current;

  // Array de valores animados para los desplazamientos Y de las tarjetas en reposo
  const itemTranslations = useRef([]);

  // Sincronizar el array de Animated.Values con el número actual de listas
  if (itemTranslations.current.length !== lists.length) {
    itemTranslations.current = lists.map(
      (_, i) => itemTranslations.current[i] || new Animated.Value(0)
    );
  }

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
        {
          text: language === 'es' ? 'Eliminar' : 'Delete',
          style: 'destructive',
          onPress: () => deleteList(listId),
        },
      ]
    );
  };

  /**
   * Recalcula y anima las posiciones de todos los slots no arrastrados
   * abriendo el hueco en 'targetIdx' inmediatamente.
   */
  const updateSlots = (fromIdx, toIdx) => {
    const total = listsRef.current.length;
    for (let j = 0; j < total; j++) {
      if (j === fromIdx) continue;

      let targetOffset = 0;
      if (fromIdx < toIdx) {
        // Elemento baja: los elementos entre fromIdx+1 y toIdx suben 1 slot
        if (j > fromIdx && j <= toIdx) {
          targetOffset = -SLOT_HEIGHT;
        }
      } else if (fromIdx > toIdx) {
        // Elemento sube: los elementos entre toIdx y fromIdx-1 bajan 1 slot
        if (j >= toIdx && j < fromIdx) {
          targetOffset = SLOT_HEIGHT;
        }
      }

      Animated.spring(itemTranslations.current[j], {
        toValue: targetOffset,
        friction: 8,
        tension: 70,
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
    const toIdx = targetIndexRef.current;

    // Animar la tarjeta que se arrastra hacia su posición final en el slot
    const finalSlotDelta = (toIdx - fromIdx) * SLOT_HEIGHT;

    Animated.spring(draggedPanY, {
      toValue: finalSlotDelta,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start(() => {
      // Limpiar y resetear todas las animaciones a 0
      itemTranslations.current.forEach((anim) => anim.setValue(0));
      draggedPanY.setValue(0);
      draggingIndexRef.current = null;
      targetIndexRef.current = null;
      isDraggingRef.current = false;
      setDraggingIndex(null);

      // Si cambió de posición, aplicar reordenación
      if (fromIdx !== toIdx) {
        const currentLists = [...listsRef.current];
        const [movedItem] = currentLists.splice(fromIdx, 1);
        currentLists.splice(toIdx, 0, movedItem);
        reorderLists(currentLists);
      }
    });
  };

  // PanResponders individuales asociados al botón de arrastre de cada fila
  const panResponders = useMemo(() => {
    return lists.map((_, index) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          draggingIndexRef.current = index;
          targetIndexRef.current = index;
          draggedPanY.setValue(0);
          setDraggingIndex(index);
          updateSlots(index, index);
        },
        onPanResponderMove: (_, gestureState) => {
          draggedPanY.setValue(gestureState.dy);
          const total = listsRef.current.length;
          const rawTarget = Math.round(index + gestureState.dy / SLOT_HEIGHT);
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
  }, [lists.length, lists]);

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) },
      ]}
    >
      <View style={styles.header}>
        <Text variant="h1" style={[styles.title, { color: theme.text }]}>
          {language === 'es' ? 'Listas' : 'Lists'}
        </Text>
        <Text variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {language === 'es' ? 'Tus colecciones' : 'Your collections'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={draggingIndex === null}
        >
          {lists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="list"
                size={64}
                color={theme.textCompleted}
                style={styles.emptyIcon}
              />
              <Text
                variant="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                {language === 'es'
                  ? 'Aquí podrás crear tus propias colecciones personalizadas (libros, películas, notas).'
                  : 'Here you will be able to create custom collections (books, movies, notes).'}
              </Text>
            </View>
          ) : (
            lists.map((item, index) => {
              const isDragging = draggingIndex === index;
              const translateY = isDragging
                ? draggedPanY
                : itemTranslations.current[index] || 0;

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
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.cardMainArea}
                      onPress={() => navigation.navigate('ListDetail', { list: item })}
                      activeOpacity={0.7}
                      disabled={draggingIndex !== null}
                    >
                      <View style={styles.iconContainer}>
                        <Ionicons name="list" size={20} color={theme.textSecondary} />
                      </View>
                      <Text
                        variant="body"
                        style={[styles.cardText, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => confirmDelete(item.id, item.title)}
                        accessibilityLabel={
                          language === 'es' ? 'Eliminar listado' : 'Delete list'
                        }
                        accessibilityRole="button"
                        disabled={draggingIndex !== null}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: { letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { marginTop: 4, textAlign: 'center' },
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
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIcon: { opacity: 0.5, marginBottom: 16 },
  emptyText: { textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
});

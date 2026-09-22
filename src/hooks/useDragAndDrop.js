/**
 * @module useDragAndDrop
 * @pattern Custom Hook  (encapsulación de lógica de estado reutilizable)
 * @pattern Template Method (el hook define el algoritmo, los parámetros definen el comportamiento)
 * @pattern Strategy (onReorder es la estrategia intercambiable de persistencia)
 *
 * ─── PROPÓSITO ───────────────────────────────────────────────────────────────
 * Este hook centraliza TODO el mecanismo de arrastre y reordenación de tarjetas
 * animadas que antes estaba duplicado en ListsScreen, DailyLogScreen y
 * ListDetailScreen. Al extraerlo aquí conseguimos:
 *
 *   1. DRY (Don't Repeat Yourself): una sola implementación probada.
 *   2. Separación de responsabilidades: la pantalla solo describe QUÉ se muestra;
 *      este hook gestiona CÓMO se mueven las tarjetas.
 *   3. Testabilidad: la lógica de slots puede testearse de forma aislada.
 *   4. Patrón Strategy aplicado a `onReorder`: cada pantalla pasa su propia
 *      función de persistencia (reorderLists, reorderEntries…) sin que el hook
 *      necesite saber nada de la capa de datos.
 *
 * ─── ALGORITMO DETERMINISTA DE SLOTS ─────────────────────────────────────────
 * En lugar de rastrear posiciones absolutas en pantalla, usamos una rejilla virtual:
 *
 *   SLOT_HEIGHT = CARD_HEIGHT + CARD_GAP   →  cada "celda" del layout
 *
 * Cuando el usuario arrastra el elemento A desde la posición i hasta la posición j,
 * los demás elementos se reposicionan mediante un cálculo de rango matemático
 * puro (sin colisiones físicas):
 *
 *   rank        = posición del elemento ignorando la "ranura vacía" de A
 *   assignedSlot= dónde debe quedar ese elemento dado que el hueco está en j
 *   targetOffset= (assignedSlot - índiceActual) × SLOT_HEIGHT
 *
 * Esto garantiza que los elementos nunca se superponen ni dejan huecos.
 *
 * @param {Object}   options
 * @param {Array}    options.items       - Array actual de elementos a reordenar.
 * @param {Function} options.onReorder   - Callback (Strategy) que persiste el nuevo orden.
 * @param {number}   options.slotHeight  - Altura de cada slot (CARD_HEIGHT + GAP).
 *
 * @returns {Object}
 *   @property {Array}    orderedItems    - Copia local con el orden actualizado.
 *   @property {Function} setOrderedItems - Setter para sincronizar desde el padre.
 *   @property {number|null} draggingIndex- Índice del elemento arrastrado (o null).
 *   @property {Object}   itemAnimMap     - Mapa { [id]: Animated.Value } para transforms.
 *   @property {Array}    panResponders   - Array de PanResponder, uno por elemento.
 *   @property {React.MutableRefObject} isDraggingRef - Ref que indica si hay drag activo.
 */

import { useState, useRef, useMemo } from 'react';
import { Animated, PanResponder } from 'react-native';

/**
 * Hook genérico que encapsula la lógica completa de arrastre de tarjetas animadas
 * sobre una cuadrícula virtual de slots de altura fija.
 */
export function useDragAndDrop({ items, onReorder, slotHeight }) {

  // ── Estado local ─────────────────────────────────────────────────────────────

  /**
   * Copia local del array con el orden "en vuelo".
   * Separarla del `items` del padre evita parpadeos: la pantalla solo repinta
   * cuando este estado local cambia, no en cada ciclo del contexto global.
   */
  const [orderedItems, setOrderedItems] = useState(items);

  /**
   * Índice del elemento bajo arrastre activo, o null si no hay drag.
   * Controla el z-index y la opacidad visual del elemento.
   */
  const [draggingIndex, setDraggingIndex] = useState(null);

  // ── Mapa de valores animados (Flyweight pattern) ──────────────────────────────

  /**
   * Objeto estable (no re-creado en renders) que mantiene un Animated.Value
   * por cada ID de elemento. Usamos `useRef({}).current` para que las
   * actualizaciones a estos valores NO disparen re-renders.
   *
   * El driver es JS (useNativeDriver: false) porque el valor es también fuente
   * de verdad para cálculos de posición síncronos con el estado de React.
   */
  const itemAnimMap = useRef({}).current;

  // Limpieza de memoria: eliminar de itemAnimMap los IDs que ya no están en orderedItems
  const currentIds = new Set(orderedItems.map((item) => item.id));
  Object.keys(itemAnimMap).forEach((id) => {
    if (!currentIds.has(id)) {
      if (itemAnimMap[id]) {
        itemAnimMap[id].stopAnimation();
      }
      delete itemAnimMap[id];
    }
  });

  // Garantizar que cada elemento del array actual tenga su Animated.Value
  orderedItems.forEach((item) => {
    if (!itemAnimMap[item.id]) {
      itemAnimMap[item.id] = new Animated.Value(0);
    }
  });

  // ── Referencias de arrastre (sin desfases de closure) ────────────────────────

  /** Flag global: ¿está activo un arrastre en este momento? */
  const isDraggingRef = useRef(false);

  /** Índice desde donde comenzó el arrastre actual. */
  const draggingIndexRef = useRef(null);

  /** Índice de destino calculado en tiempo real durante el movimiento. */
  const targetIndexRef = useRef(null);

  /** Desplazamiento Y acumulado del dedo (en píxeles). */
  const currentDyRef = useRef(0);

  /**
   * Referencia "viva" al array `orderedItems`.
   * Permite que `finishDrag` y `updateSlots` accedan al array actual sin
   * quedar atrapados en el closure del useMemo con un valor desactualizado.
   */
  const itemsRef = useRef(orderedItems);
  itemsRef.current = orderedItems;

  // ── Lógica interna del algoritmo de slots ────────────────────────────────────

  /**
   * Recalcula y anima las posiciones de TODOS los elementos no arrastrados.
   *
   * Algoritmo de rango:
   *   1. Ignoramos el elemento en `fromIdx` (es el que se arrastra).
   *   2. Para cada elemento j, calculamos su "rank" entre los restantes.
   *   3. Calculamos `assignedSlot`: la posición visual dado que el hueco está en `toIdx`.
   *   4. Animamos desde la posición de reposo hasta `(assignedSlot - j) × slotHeight`.
   *
   * @param {number} fromIdx - Índice actual del elemento arrastrado.
   * @param {number} toIdx   - Índice de destino actual (se actualiza en tiempo real).
   */
  const updateSlots = (fromIdx, toIdx) => {
    const total = itemsRef.current.length;

    for (let j = 0; j < total; j++) {
      // El elemento arrastrado se posiciona directamente por el dedo
      if (j === fromIdx) continue;

      const item = itemsRef.current[j];
      if (!item || !itemAnimMap[item.id]) continue;

      // rank: posición del elemento en la lista sin el arrastrado (0-based)
      const rank = j < fromIdx ? j : j - 1;

      // assignedSlot: slot visual dado que el hueco está en toIdx
      const assignedSlot = rank < toIdx ? rank : rank + 1;

      // targetOffset: desplazamiento en píxeles desde su posición de reposo
      const targetOffset = (assignedSlot - j) * slotHeight;

      // Cancelar spring previo para evitar que continúe animando en segundo plano
      itemAnimMap[item.id].stopAnimation();

      Animated.spring(itemAnimMap[item.id], {
        toValue: targetOffset,
        friction: 8,
        tension: 80,
        useNativeDriver: false, // JS driver: necesario para sincronía con el estado de React
      }).start();
    }
  };

  /**
   * Finaliza el arrastre: anima el elemento al slot de destino, reordena
   * el array de forma atómica y persiste el cambio mediante `onReorder`.
   *
   * Usa el patrón de "finalización guardada" (flag `finalized` + safetyTimer)
   * para garantizar que el estado siempre se libera, incluso si el spring falla.
   */
  const finishDrag = () => {
    if (!isDraggingRef.current || draggingIndexRef.current === null) return;

    const fromIdx = draggingIndexRef.current;
    const toIdx = targetIndexRef.current !== null ? targetIndexRef.current : fromIdx;
    const draggedItem = itemsRef.current[fromIdx];

    /**
     * Función de cierre idempotente: el flag `finalized` evita ejecución doble
     * si tanto el spring como el safetyTimer disparan simultáneamente.
     */
    let finalized = false;
    const finalize = () => {
      if (finalized) return;
      finalized = true;

      // ── FIX: el orden de operaciones es crítico para evitar el flash visual ──
      //
      // PROBLEMA ANTERIOR:
      //   1. anim.setValue(0)         → INMEDIATO (bypassa React) → items visibles en orden ANTIGUO
      //   2. setOrderedItems(next)    → ASÍNCRONO (React batch)   → items re-renderizan en orden NUEVO
      //   → El frame entre 1 y 2 mostraba los nombres/orden antiguos (el "flash")
      //
      // SOLUCIÓN:
      //   1. setOrderedItems(next)    → React agenda re-render con nuevo orden
      //   2. setDraggingIndex(null)   → React agenda re-render sin transforms (isDraggingAny = false)
      //   → React agrupa ambas en UN SOLO render: items en NUEVO orden SIN transforms
      //   3. requestAnimationFrame    → resetear valores animados DESPUÉS del render
      //      (invisibles porque isDraggingAny ya es false y los transforms no se aplican)

      // 1. Reordenar el array y persistir si el elemento cambió de posición
      if (fromIdx !== toIdx) {
        const nextItems = [...itemsRef.current];
        const [movedItem] = nextItems.splice(fromIdx, 1);
        nextItems.splice(toIdx, 0, movedItem);

        // Actualización atómica: sincroniza el render con el nuevo orden
        setOrderedItems(nextItems);

        // Strategy Pattern: delegar la persistencia al callback del llamador
        onReorder(nextItems);
      }

      // 2. Limpiar referencias de arrastre y quitar transforms del JSX
      //    React agrupa setOrderedItems + setDraggingIndex en un único render:
      //    → items en nuevo orden, sin transform prop (isDraggingAny = false)
      currentDyRef.current = 0;
      draggingIndexRef.current = null;
      targetIndexRef.current = null;
      isDraggingRef.current = false;
      setDraggingIndex(null);

      // 3. Resetear valores animados en el siguiente frame de animación.
      //    Para entonces React ya habrá renderiado el nuevo orden sin transforms,
      //    así que esta operación es visualmente silenciosa (no produce flash).
      requestAnimationFrame(() => {
        Object.values(itemAnimMap).forEach((anim) => {
          anim.stopAnimation();
          anim.setValue(0);
        });
      });
    };

    // Calcular el delta hasta el slot final
    const finalSlotDelta = (toIdx - fromIdx) * slotHeight;
    const currentVal = currentDyRef.current || 0;

    // Si el elemento ya está en el slot final (o no existe), finalizar de inmediato
    if (!draggedItem || !itemAnimMap[draggedItem.id] || Math.abs(currentVal - finalSlotDelta) < 3) {
      finalize();
      return;
    }

    // Temporizador de seguridad: libera el estado aunque el spring falle
    const safetyTimer = setTimeout(finalize, 250);

    // Animar el elemento arrastrado hasta su posición de destino final
    itemAnimMap[draggedItem.id].stopAnimation();
    Animated.spring(itemAnimMap[draggedItem.id], {
      toValue: finalSlotDelta,
      friction: 8,
      tension: 90,
      useNativeDriver: false,
    }).start(() => {
      clearTimeout(safetyTimer);
      finalize();
    });
  };

  // ── PanResponders (Factory Method implícito, uno por elemento) ────────────────

  /**
   * `useMemo` construye un PanResponder por cada elemento del array.
   * El array solo se recrea si cambia `orderedItems`, no en cada render:
   * esto evita que los gestores de gestos se re-registren durante el drag.
   *
   * IMPORTANTE: Los handlers NO acceden al estado de React directamente;
   * usan los `Ref` para leer siempre el valor actual (evita closures stale).
   */
  const panResponders = useMemo(() => {
    return orderedItems.map((item, index) =>
      PanResponder.create({
        // El gesto comienza en el touchstart del handle de arrastre
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,

        // Solo capturamos si hay desplazamiento vertical significativo
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dy) > 2,

        // Evitamos que ScrollView u otros contenedores aborten el gesto una vez iniciado
        onPanResponderTerminationRequest: () => false,

        /**
         * onPanResponderGrant: el usuario ha "agarrado" el handle.
         * Inicializamos todas las referencias de estado del drag.
         */
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          draggingIndexRef.current = index;
          targetIndexRef.current = index;
          currentDyRef.current = 0;

          // Cancelar y resetear TODAS las animaciones al iniciar un nuevo drag.
          // Esto limpia cualquier valor residual del drag anterior (p.ej: si el
          // requestAnimationFrame del finalize aún no había disparado).
          Object.values(itemAnimMap).forEach((anim) => {
            anim.stopAnimation();
            anim.setValue(0);
          });

          setDraggingIndex(index);
          updateSlots(index, index);
        },

        /**
         * onPanResponderMove: el usuario está moviendo el dedo.
         * Actualizamos el offset del elemento y recalculamos el slot objetivo.
         */
        onPanResponderMove: (_, gestureState) => {
          const total = itemsRef.current.length;

          // Límites: el elemento no puede salir del rango de slots disponibles
          const minDy = -index * slotHeight;
          const maxDy = (total - 1 - index) * slotHeight;

          // Clampear con margen de 6px para sensación táctil natural
          const clampedDy = Math.max(minDy - 6, Math.min(maxDy + 6, gestureState.dy));
          currentDyRef.current = clampedDy;

          // Mover visualmente el elemento arrastrado siguiendo al dedo
          if (itemAnimMap[item.id]) {
            itemAnimMap[item.id].setValue(clampedDy);
          }

          // Calcular el nuevo slot objetivo
          const rawTarget = Math.round(index + clampedDy / slotHeight);
          const clampedTarget = Math.max(0, Math.min(total - 1, rawTarget));

          // Solo recalcular los demás si el slot objetivo cambió
          if (clampedTarget !== targetIndexRef.current) {
            targetIndexRef.current = clampedTarget;
            updateSlots(index, clampedTarget);
          }
        },

        // El usuario levantó el dedo: finalizar el arrastre
        onPanResponderRelease: () => finishDrag(),

        // El sistema canceló el gesto: finalizar igualmente
        onPanResponderTerminate: () => finishDrag(),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedItems.length, orderedItems]);

  // ── API pública del hook ──────────────────────────────────────────────────────

  return {
    /** Array local con el orden actual (puede diferir del `items` del padre durante el drag) */
    orderedItems,

    /** Setter para que el padre sincronice el array cuando cambia el origen de datos */
    setOrderedItems,

    /** Índice del elemento bajo arrastre activo, o null */
    draggingIndex,

    /**
     * Mapa de Animated.Values indexado por ID.
     * Usar en JSX: style={[{ transform: [{ translateY: itemAnimMap[item.id] }] }]}
     */
    itemAnimMap,

    /**
     * Array de PanResponder, uno por elemento, en el mismo orden que `orderedItems`.
     * Usar en el handle: {...panResponders[index]?.panHandlers}
     */
    panResponders,

    /**
     * Ref que indica si hay un drag activo.
     * Imprescindible para que los useEffect del padre no sobreescriban
     * el estado local durante un arrastre en curso.
     */
    isDraggingRef,
  };
}

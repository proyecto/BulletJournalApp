/**
 * @test useDragAndDrop
 *
 * Suite de tests unitarios para el hook `useDragAndDrop`.
 *
 * Estrategia final:
 *   - El mock de PanResponder.create retorna el config como parte del objeto,
 *     exponiendo `_config` con todos los handlers.
 *   - Accedemos a los handlers via `result.current.panResponders[i]._config`.
 *   - Esto es robusto ante useMemo: si los PanResponders se reutilizan,
 *     `result.current.panResponders[i]` siempre está disponible.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDragAndDrop } from './useDragAndDrop';

// ── Mock de React Native ──────────────────────────────────────────────────────

jest.mock('react-native', () => {
  class MockAnimatedValue {
    constructor(val) { this._value = val; }
    stopAnimation() {}
    setValue(v) { this._value = v; }
  }

  return {
    Animated: {
      Value: MockAnimatedValue,
      spring: jest.fn(() => ({
        start: jest.fn((cb) => { if (cb) cb(); }),
      })),
    },
    PanResponder: {
      /**
       * El mock retorna el config completo como `_config`
       * para que los tests puedan acceder a los handlers via
       * `result.current.panResponders[i]._config.onPanResponderGrant()`.
       */
      create: jest.fn((config) => ({
        panHandlers: {},
        _config: config,
      })),
    },
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeItems = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}` }));

/** Shortcut para obtener el config de handlers del PanResponder en el índice `i` */
const cfg = (panResponders, i) => panResponders[i]._config;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDragAndDrop', () => {

  // ── Estado inicial ──────────────────────────────────────────────────────────

  describe('Estado inicial', () => {
    it('inicializa orderedItems con los items recibidos', async () => {
      const items = makeItems(3);
      const { result } = await renderHook(() =>
        useDragAndDrop({ items, onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(result.current.orderedItems).toHaveLength(3);
      expect(result.current.orderedItems[0].id).toBe('item-0');
      expect(result.current.orderedItems[2].id).toBe('item-2');
    });

    it('inicializa draggingIndex como null', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(result.current.draggingIndex).toBeNull();
    });

    it('inicializa isDraggingRef.current como false', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(result.current.isDraggingRef.current).toBe(false);
    });

    it('crea un Animated.Value por elemento en itemAnimMap', async () => {
      const items = makeItems(3);
      const { result } = await renderHook(() =>
        useDragAndDrop({ items, onReorder: jest.fn(), slotHeight: 66 })
      );
      items.forEach((item) => {
        expect(result.current.itemAnimMap[item.id]).toBeDefined();
      });
    });

    it('crea N PanResponders para N elementos', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(4), onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(result.current.panResponders).toHaveLength(4);
    });

    it('funciona con array vacío', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: [], onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(result.current.orderedItems).toHaveLength(0);
      expect(result.current.panResponders).toHaveLength(0);
    });

    it('funciona con un solo elemento', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(1), onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(result.current.orderedItems).toHaveLength(1);
      expect(result.current.panResponders).toHaveLength(1);
    });

    it('expone todas las propiedades de la API pública', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(result.current).toHaveProperty('orderedItems');
      expect(result.current).toHaveProperty('setOrderedItems');
      expect(result.current).toHaveProperty('draggingIndex');
      expect(result.current).toHaveProperty('itemAnimMap');
      expect(result.current).toHaveProperty('panResponders');
      expect(result.current).toHaveProperty('isDraggingRef');
    });
  });

  // ── setOrderedItems ──────────────────────────────────────────────────────────

  describe('setOrderedItems', () => {
    it('actualiza el estado local', async () => {
      const items = makeItems(3);
      const { result } = await renderHook(() =>
        useDragAndDrop({ items, onReorder: jest.fn(), slotHeight: 66 })
      );
      const reordered = [items[2], items[0], items[1]];
      await act(async () => { result.current.setOrderedItems(reordered); });
      await waitFor(() => {
        expect(result.current.orderedItems[0].id).toBe('item-2');
        expect(result.current.orderedItems[1].id).toBe('item-0');
      });
    });
  });

  // ── Handlers predefinidos del PanResponder ────────────────────────────────────

  describe('Handlers predefinidos del PanResponder', () => {
    it('onMoveShouldSetPanResponder: true si |dy| > 2', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder: jest.fn(), slotHeight: 66 })
      );
      const fn = cfg(result.current.panResponders, 0).onMoveShouldSetPanResponder;
      expect(fn(null, { dy: 3 })).toBe(true);
      expect(fn(null, { dy: -3 })).toBe(true);
      expect(fn(null, { dy: 1 })).toBe(false);
    });

    it('onPanResponderTerminationRequest: siempre false', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(cfg(result.current.panResponders, 0).onPanResponderTerminationRequest()).toBe(false);
    });

    it('onStartShouldSetPanResponder: siempre true', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder: jest.fn(), slotHeight: 66 })
      );
      expect(cfg(result.current.panResponders, 0).onStartShouldSetPanResponder()).toBe(true);
    });
  });

  // ── Inicio del drag ───────────────────────────────────────────────────────────

  describe('Inicio del drag (onPanResponderGrant)', () => {
    it('activa isDraggingRef y establece draggingIndex = 0', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(3), onReorder: jest.fn(), slotHeight: 66 })
      );
      await act(async () => { cfg(result.current.panResponders, 0).onPanResponderGrant(); });
      await waitFor(() => {
        expect(result.current.isDraggingRef.current).toBe(true);
        expect(result.current.draggingIndex).toBe(0);
      });
    });

    it('establece draggingIndex = 2 al agarrar el tercer PanResponder', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(3), onReorder: jest.fn(), slotHeight: 66 })
      );
      await act(async () => { cfg(result.current.panResponders, 2).onPanResponderGrant(); });
      await waitFor(() => expect(result.current.draggingIndex).toBe(2));
    });
  });

  // ── Fin del drag sin movimiento ───────────────────────────────────────────────

  describe('Fin del drag sin movimiento', () => {
    it('NO llama a onReorder si no hubo movimiento de slot', async () => {
      const onReorder = jest.fn();
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(3), onReorder, slotHeight: 66 })
      );
      await act(async () => {
        cfg(result.current.panResponders, 0).onPanResponderGrant();
        cfg(result.current.panResponders, 0).onPanResponderRelease();
      });
      await waitFor(() => expect(result.current.draggingIndex).toBeNull());
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('resetea isDraggingRef a false', async () => {
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder: jest.fn(), slotHeight: 66 })
      );
      await act(async () => {
        cfg(result.current.panResponders, 0).onPanResponderGrant();
        cfg(result.current.panResponders, 0).onPanResponderRelease();
      });
      await waitFor(() => expect(result.current.isDraggingRef.current).toBe(false));
    });
  });

  // ── Reordenación real ─────────────────────────────────────────────────────────

  describe('Reordenación real', () => {
    it('llama a onReorder con el orden correcto: ítem 0 → posición 2', async () => {
      const items = makeItems(3);
      const onReorder = jest.fn();
      const SLOT = 66;
      const { result } = await renderHook(() =>
        useDragAndDrop({ items, onReorder, slotHeight: SLOT })
      );
      await act(async () => {
        cfg(result.current.panResponders, 0).onPanResponderGrant();
        cfg(result.current.panResponders, 0).onPanResponderMove(null, { dy: 2 * SLOT });
        cfg(result.current.panResponders, 0).onPanResponderRelease();
      });
      await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1));
      const newOrder = onReorder.mock.calls[0][0];
      expect(newOrder[2].id).toBe('item-0');
      expect(newOrder[0].id).toBe('item-1');
      expect(newOrder[1].id).toBe('item-2');
    });

    it('actualiza orderedItems: ítem 0 → posición 1', async () => {
      const items = makeItems(3);
      const SLOT = 66;
      const { result } = await renderHook(() =>
        useDragAndDrop({ items, onReorder: jest.fn(), slotHeight: SLOT })
      );
      await act(async () => {
        cfg(result.current.panResponders, 0).onPanResponderGrant();
        cfg(result.current.panResponders, 0).onPanResponderMove(null, { dy: 1 * SLOT });
        cfg(result.current.panResponders, 0).onPanResponderRelease();
      });
      await waitFor(() => {
        expect(result.current.orderedItems[0].id).toBe('item-1');
        expect(result.current.orderedItems[1].id).toBe('item-0');
      });
    });

    it('resetea draggingIndex a null tras el drop', async () => {
      const items = makeItems(3);
      const SLOT = 66;
      const { result } = await renderHook(() =>
        useDragAndDrop({ items, onReorder: jest.fn(), slotHeight: SLOT })
      );
      await act(async () => {
        cfg(result.current.panResponders, 0).onPanResponderGrant();
        cfg(result.current.panResponders, 0).onPanResponderMove(null, { dy: 1 * SLOT });
        cfg(result.current.panResponders, 0).onPanResponderRelease();
      });
      await waitFor(() => expect(result.current.draggingIndex).toBeNull());
    });
  });

  // ── Terminación forzada ───────────────────────────────────────────────────────

  describe('Terminación forzada (onPanResponderTerminate)', () => {
    it('limpia el estado sin llamar a onReorder', async () => {
      const onReorder = jest.fn();
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder, slotHeight: 66 })
      );
      await act(async () => {
        cfg(result.current.panResponders, 0).onPanResponderGrant();
        cfg(result.current.panResponders, 0).onPanResponderTerminate();
      });
      await waitFor(() => {
        expect(result.current.isDraggingRef.current).toBe(false);
        expect(result.current.draggingIndex).toBeNull();
      });
      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  // ── Condiciones de borde ──────────────────────────────────────────────────────

  describe('Condiciones de borde', () => {
    it('clampea el movimiento negativo en el primer ítem (no puede superar índice 0)', async () => {
      const onReorder = jest.fn();
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(3), onReorder, slotHeight: 66 })
      );
      await act(async () => {
        cfg(result.current.panResponders, 0).onPanResponderGrant();
        cfg(result.current.panResponders, 0).onPanResponderMove(null, { dy: -999 });
        cfg(result.current.panResponders, 0).onPanResponderRelease();
      });
      await waitFor(() => expect(result.current.draggingIndex).toBeNull());
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('release sin grant previo: no provoca errores ni llama a onReorder', async () => {
      const onReorder = jest.fn();
      const { result } = await renderHook(() =>
        useDragAndDrop({ items: makeItems(2), onReorder, slotHeight: 66 })
      );
      // isDraggingRef permanece false → finishDrag hace early return
      await act(async () => { cfg(result.current.panResponders, 0).onPanResponderRelease(); });
      expect(onReorder).not.toHaveBeenCalled();
      expect(result.current.isDraggingRef.current).toBe(false);
    });
  });
});

/**
 * @module JournalContext
 * @pattern Facade + Observer
 *
 * FACADE: Este módulo expone una API simple y unificada a las pantallas de la app.
 * Internamente coordina EntryRepository, ListRepository y EntryFactory,
 * pero las pantallas solo ven funciones de alto nivel como `addEntry()` o `deleteList()`.
 * Si la implementación interna cambia (p.ej: se añade caché), la API pública no cambia.
 *
 * OBSERVER: El patrón Observer está implementado mediante React Context + useState.
 * Los componentes suscritos (via `useJournal()`) son notificados automáticamente
 * cuando el estado cambia, sin necesidad de polling ni eventos manuales.
 *
 * @example
 * // En cualquier pantalla o componente:
 * const { entries, addEntry } = useJournal();
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import * as EntryRepository from '../repositories/EntryRepository';
import * as ListRepository from '../repositories/ListRepository';
import { createList } from '../factories/EntryFactory';
// Re-exportamos getFormattedDate desde su módulo utilitario para que los
// consumidores que ya importaban desde JournalContext sigan funcionando sin cambios.
export { getFormattedDate } from '../utils/dateUtils';

// ─── Contexto (Observer) ──────────────────────────────────────────────────────

/**
 * El contexto React que actúa como el "canal de comunicación" del patrón Observer.
 * Los componentes suscritos via `useJournal()` se re-renderizan automáticamente
 * cuando cualquier valor del Provider cambia.
 */
const JournalContext = createContext();

// ─── Provider (Facade) ────────────────────────────────────────────────────────

/**
 * El proveedor del contexto. Envuelve a los componentes que necesitan
 * acceso al estado del diario. Debe colocarse en lo alto del árbol de componentes.
 *
 * @param {React.ReactNode} children - Los componentes hijos que tendrán acceso al contexto.
 */
export const JournalProvider = ({ children }) => {
  // Estado en memoria de la app (la "caché" de lo que hay en SQLite)
  const [entries, setEntries] = useState([]);
  const [lists,   setLists]   = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Carga inicial de datos desde SQLite al arrancar la app.
   * Se ejecuta una sola vez gracias al array de dependencias vacío `[]`.
   * El flag `isLoaded` evita que la app se renderice antes de tener datos.
   */
  useEffect(() => {
    const loadJournal = async () => {
      try {
        const [loadedLists, loadedEntries] = await Promise.all([
          ListRepository.getAllLists(),
          EntryRepository.getAllEntries(),
        ]);
        setLists(loadedLists);
        setEntries(loadedEntries);
      } catch (e) {
        console.error('[JournalContext] Error cargando datos de SQLite:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadJournal();
  }, []);

  // ─── Métodos de la Facade (API Pública) ────────────────────────────────────

  /**
   * Añade una nueva entrada al diario.
   * Persiste en SQLite y actualiza el estado en memoria para notificar a los observers.
   * El objeto `entry` debe ser creado con `EntryFactory` para garantizar
   * que todos los campos obligatorios están presentes.
   *
   * @param {Object} entry - El objeto entrada (creado por EntryFactory).
   */
  const addEntry = async (entry) => {
    try {
      await EntryRepository.insertEntry(entry);
      // Actualización optimista: añadimos al estado sin re-consultar la BD
      setEntries(prev => [...prev, entry]);
    } catch (e) {
      console.error('[JournalContext] Error al añadir entrada:', e);
    }
  };

  /**
   * Añade una nueva lista de usuario.
   * Usa `EntryFactory.createList()` para garantizar la consistencia del objeto.
   *
   * @param {string} title - El nombre de la nueva lista.
   */
  const addList = async (title) => {
    // La factory calcula el order_index basándose en el número de listas actuales
    const newList = createList(title, lists.length);
    try {
      await ListRepository.insertList(newList);
      setLists(prev => [...prev, newList]);
    } catch (e) {
      console.error('[JournalContext] Error al añadir lista:', e);
    }
  };

  /**
   * Persiste el nuevo orden de las listas tras un drag & drop.
   * Usa una actualización optimista: el estado se actualiza inmediatamente
   * para que la UI sea fluida, y la persistencia ocurre en segundo plano.
   *
   * @param {Array<Object>} newOrder - El array de listas en su nuevo orden.
   */
  const reorderLists = async (newOrder) => {
    // Optimistic update: el usuario ve el cambio inmediatamente
    setLists(newOrder);
    try {
      // Persistimos cada cambio de orden en la BD secuencialmente
      for (let i = 0; i < newOrder.length; i++) {
        await ListRepository.updateListOrder(newOrder[i].id, i);
      }
    } catch (e) {
      console.error('[JournalContext] Error al reordenar listas:', e);
    }
  };

  /**
   * Elimina una lista y TODAS sus entradas asociadas.
   * El orden de operaciones es crítico: primero borrar las entradas (hijos),
   * luego la lista (padre). SQLite no tiene Foreign Key constraints activadas
   * por defecto en expo-sqlite, así que gestionamos la integridad manualmente.
   *
   * @param {string} id - El ID de la lista a eliminar.
   */
  const deleteList = async (id) => {
    try {
      // 1. Borrar entradas hijas (integridad referencial manual)
      await EntryRepository.deleteEntriesByListId(id);
      // 2. Borrar la lista padre
      await ListRepository.deleteList(id);
      // 3. Actualizar el estado en memoria
      setLists(prev => prev.filter(list => list.id !== id));
      setEntries(prev => prev.filter(entry => entry.listId !== id));
    } catch (e) {
      console.error('[JournalContext] Error al eliminar lista:', e);
    }
  };

  /**
   * Alterna el estado de completado de una tarea.
   * Solo funciona con entradas de tipo 'task'.
   * Si la tarea está 'open' -> la completa y guarda `completedAt`.
   * Si la tarea está 'completed' -> la reabre y borra `completedAt`.
   *
   * @param {string} id - El ID de la entrada a modificar.
   * @param {string|null} currentLogDate - La fecha del día visualizado (para `completedAt`).
   */
  const toggleStatus = async (id, currentLogDate) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || entry.type !== 'task') return; // Solo las tareas se pueden completar

    const isCompleting    = entry.status === 'open';
    const newStatus       = isCompleting ? 'completed' : 'open';
    const newCompletedAt  = isCompleting ? currentLogDate : null;

    try {
      await EntryRepository.updateEntryStatus(id, newStatus, newCompletedAt);
      // Actualización inmutable del estado: creamos un nuevo array con la entrada modificada
      setEntries(prev =>
        prev.map(e => e.id === id ? { ...e, status: newStatus, completedAt: newCompletedAt } : e)
      );
    } catch (e) {
      console.error('[JournalContext] Error al cambiar estado de tarea:', e);
    }
  };

  /**
   * Elimina una entrada del diario por su ID (facade al EntryRepository).
   *
   * @param {string} id - El ID de la entrada a eliminar.
   */
  const deleteEntry = async (id) => {
    try {
      await EntryRepository.deleteEntryById(id);
      // Actualización inmutable del estado
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (e) {
      console.error('[JournalContext] Error al eliminar entrada:', e);
    }
  };

  // Mientras los datos de SQLite no se han cargado, no renderizamos nada.
  // Esto evita un flash de contenido vacío al arrancar la app.
  if (!isLoaded) return null;

  return (
    <JournalContext.Provider value={{
      entries,
      addEntry,
      toggleStatus,
      deleteEntry, // Exponemos el método a las pantallas
      lists,
      addList,
      reorderLists,
      deleteList,
    }}>
      {children}
    </JournalContext.Provider>
  );
};

// ─── Hook personalizado ───────────────────────────────────────────────────────

/**
 * Hook de acceso al JournalContext.
 * Usar este hook (en lugar de `useContext(JournalContext)` directamente) añade
 * validación: lanza un error descriptivo si se usa fuera del Provider.
 *
 * @returns {Object} El valor del contexto con { entries, addEntry, toggleStatus, lists, ... }
 * @throws {Error} Si se usa fuera de un JournalProvider.
 */
export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('[useJournal] Debe usarse dentro de un <JournalProvider>.');
  }
  return context;
};

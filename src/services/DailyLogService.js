/**
 * @module DailyLogService
 * @pattern Strategy
 *
 * El patrón STRATEGY define una familia de algoritmos, los encapsula y los hace
 * intercambiables. Aquí, el "algoritmo" es la lógica de filtrado y migración
 * de entradas según la metodología del Bullet Journal.
 *
 * ¿Por qué sacarlo de la pantalla?
 * Antes, `DailyLogScreen.js` contenía directamente esta lógica en su cuerpo:
 *
 *   const dailyLogEntries = entries.filter(entry => {
 *     if (entry.date < currentLogDateStr) {
 *       if (entry.type === 'task' && !entry.completedAt) return true;
 *       ...
 *     }
 *   });
 *
 * Problemas de eso:
 * 1. Si la lógica de migración cambia, hay que buscarla entre el JSX de la pantalla.
 * 2. Si otra pantalla (ej: un Registro Mensual) necesita esta lógica, se copia y pega.
 * 3. Es imposible testear esta lógica sin renderizar toda la pantalla.
 *
 * Con este servicio, la lógica de negocio del Bullet Journal vive en un lugar
 * dedicado, reutilizable y fácilmente testeable.
 */

/**
 * Filtra y ordena las entradas visibles para un día específico del Daily Log,
 * aplicando las reglas de migración del Bullet Journal:
 *
 * REGLA 1: Las entradas creadas hoy (entry.date === viewingDateStr) siempre se muestran.
 * REGLA 2: Las entradas futuras (entry.date > viewingDateStr) nunca se muestran.
 * REGLA 3 (Migración): Las tareas de días anteriores que siguen abiertas (sin completar)
 *   se "migran" al día actual y aparecen con un icono especial (chevron-forward).
 * REGLA 4: Las notas y eventos de días anteriores NO migran.
 *
 * @param {Array<Object>} allEntries - Todas las entradas en memoria del JournalContext.
 * @param {string} viewingDateStr - La fecha que el usuario está viendo, en formato 'YYYY-MM-DD'.
 * @returns {Array<Object>} Las entradas filtradas y listas para mostrar en el log.
 */
export const filterEntriesForDay = (allEntries, viewingDateStr) => {
  return allEntries.filter(entry => {
    // REGLA 2: Ocultar entradas futuras
    if (entry.date > viewingDateStr) return false;

    // REGLA 1: Mostrar siempre las entradas de hoy
    if (entry.date === viewingDateStr) return true;

    // REGLA 3 y 4: Para entradas de días anteriores...
    if (entry.date < viewingDateStr) {
      // Solo las TAREAS migran. Eventos y notas son puntuales.
      if (entry.type !== 'task') return false;

      // Una tarea migra si NO ha sido completada.
      if (!entry.completedAt) return true;

      // Una tarea completada DESPUÉS del día que se ve (completedAt >= viewingDate)
      // también se muestra (para que el usuario vea que la completó en ese día o después).
      // Una tarea completada ANTES del día que se ve se oculta (ya está hecha).
      return entry.completedAt >= viewingDateStr;
    }

    return false;
  });
};

import { getFormattedDate } from '../utils/dateUtils';

/**
 * Determina el ícono correcto a mostrar para una entrada del Daily Log,
 * según su tipo, estado y relación temporal con el día visualizado.
 *
 * @param {Object} entry - El objeto entrada.
 * @param {string} currentLogDateStr - La fecha del día que se visualiza ('YYYY-MM-DD').
 * @param {string} [timezone='system'] - El timezone activo del usuario.
 * @returns {string} El nombre del ícono de Ionicons a renderizar.
 */
export const getEntryIcon = (entry, currentLogDateStr, timezone = 'system') => {
  if (entry.type === 'event') return 'ellipse-outline';
  if (entry.type === 'note')  return 'remove';

  // Lógica de iconos para tareas:
  if (entry.status === 'completed') return 'close';           // Tarea completada: X

  // Usamos getFormattedDate con el timezone correcto en lugar de toISOString (que usa UTC y genera desfases horarios)
  const creationDate = getFormattedDate(new Date(parseInt(entry.id)), timezone);
  const isScheduled = entry.date !== creationDate;            // Entrada programada hacia adelante
  const isMigrated  = entry.date < currentLogDateStr;        // Tarea arrastrada de días anteriores

  if (isMigrated)  return 'chevron-forward';  // Migrada: >
  if (isScheduled) return 'chevron-back';     // Programada: <
  return 'ellipse';                           // Tarea normal: •
};

/**
 * Determina si una entrada está "desplazada temporalmente" (programada o migrada).
 * Usado para aplicar colores especiales (primary) al ícono y texto.
 *
 * @param {Object} entry - El objeto entrada.
 * @param {string} currentLogDateStr - La fecha del día visualizado.
 * @param {string} [timezone='system'] - El timezone activo del usuario.
 * @returns {boolean} True si la entrada tiene una fecha diferente a hoy.
 */
export const isEntryTemporallyDisplaced = (entry, currentLogDateStr, timezone = 'system') => {
  const creationDate = getFormattedDate(new Date(parseInt(entry.id)), timezone);
  const isScheduled = entry.date !== creationDate;
  const isMigrated  = entry.date < currentLogDateStr;
  return isScheduled || isMigrated;
};

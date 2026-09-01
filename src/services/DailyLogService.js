/**
 * @module DailyLogService
 * @pattern Strategy
 *
 * Encapsula la lógica de filtrado y visualización de entradas del Daily Log.
 *
 * REGLAS DE NEGOCIO:
 * 1. Tareas abiertas: Mientras una tarea no se complete, pasa automáticamente
 *    al día actual (HOY) del Daily Log, sin importar cuándo fue creada.
 * 2. Tareas completadas: Una vez completada, no se traspasa más y se queda
 *    registrada en la fecha exacta en la que se completó (`completedAt`).
 * 3. Eventos: Asociados a la fecha en que ocurren. Una vez pasada su fecha (< HOY),
 *    se marcan automáticamente como completados en su día de registro.
 * 4. Notas: Quedan asociadas a la fecha en que se tomaron para consulta histórica
 *    permanente (nunca se completan).
 * 5. Listas personalizadas: Las entradas con `listId` no pertenecen al Daily Log.
 */

import { getFormattedDate } from '../utils/dateUtils.js';

/**
 * Determina si una entrada se considera completada.
 * - Tareas: cuando su status es 'completed' o tiene 'completedAt'.
 * - Eventos: cuando su status es 'completed' o cuando su fecha ya ha pasado (< todayStr).
 * - Notas: nunca se completan (son solo registros históricos).
 *
 * @param {Object} entry - La entrada a evaluar.
 * @param {string} [todayStr] - La fecha de hoy en formato 'YYYY-MM-DD'.
 * @returns {boolean} True si la entrada está completada.
 */
export const isEntryCompleted = (entry, todayStr) => {
  if (!entry) return false;
  if (entry.type === 'note') return false;
  if (entry.status === 'completed' || entry.completedAt) return true;
  if (entry.type === 'event' && entry.date && todayStr && entry.date < todayStr) {
    return true;
  }
  return false;
};

/**
 * Filtra las entradas visibles para un día específico del Daily Log.
 *
 * @param {Array<Object>} allEntries - Todas las entradas del diario.
 * @param {string} viewingDateStr - La fecha visualizada ('YYYY-MM-DD').
 * @param {string} todayStr - La fecha actual del sistema ('YYYY-MM-DD').
 * @returns {Array<Object>} Las entradas que corresponden a viewingDateStr.
 */
export const filterEntriesForDay = (allEntries, viewingDateStr, todayStr) => {
  if (!allEntries || !Array.isArray(allEntries)) return [];

  return allEntries.filter(entry => {
    // Las entradas de listas personalizadas no se muestran en el Daily Log
    if (entry.listId) return false;

    // 1. TAREAS:
    if (entry.type === 'task') {
      // Tareas completadas: se muestran en la fecha en que se completaron
      if (entry.status === 'completed' || entry.completedAt) {
        return entry.completedAt === viewingDateStr;
      }

      // Tareas programadas para una fecha futura (entry.date > todayStr):
      // No salen en el Daily Log de hoy; solo aparecen en el día para el que están programadas.
      if (entry.date && entry.date > todayStr) {
        return entry.date === viewingDateStr;
      }

      // Tareas abiertas cuya fecha ya llegó o pasó (entry.date <= todayStr o sin fecha):
      // Se trasladan día a día y aparecen exclusivamente en el día actual (HOY).
      return viewingDateStr === todayStr;
    }

    // 2. EVENTOS:
    // Pertenecen a la fecha en que ocurren. Una vez pasada su fecha, se marcan como completados en esa fecha.
    if (entry.type === 'event') {
      const eventDate = entry.date || todayStr;
      return eventDate === viewingDateStr;
    }

    // 3. NOTAS:
    // Pertenecen a la fecha en que se tomaron para consulta histórica permanente
    if (entry.type === 'note') {
      const noteDate = entry.date || todayStr;
      return noteDate === viewingDateStr;
    }

    return false;
  });
};

/**
 * Determina el ícono a mostrar para una entrada según su tipo y estado.
 *
 * @param {Object} entry - El objeto entrada.
 * @param {string} [todayStr] - Fecha actual para verificar si eventos pasados están completados.
 * @returns {string} El nombre del ícono de Ionicons.
 */
export const getEntryIcon = (entry, todayStr) => {
  if (!entry) return 'ellipse';
  if (entry.type === 'note') return 'remove';
  const completed = isEntryCompleted(entry, todayStr);
  if (completed) return 'close'; // Tarea o evento completado: X
  if (entry.type === 'event') return 'ellipse-outline'; // Evento pendiente: o
  return 'ellipse'; // Tarea abierta: •
};

/**
 * Función auxiliar mantenida por compatibilidad hacia atrás.
 * @returns {boolean} Siempre false en el nuevo modelo sin badges temporales.
 */
export const isEntryTemporallyDisplaced = () => false;



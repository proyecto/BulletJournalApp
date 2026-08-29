/**
 * @module EntryFactory
 * @pattern Factory Method
 *
 * El patrón FACTORY METHOD centraliza la creación de objetos complejos.
 * En lugar de que cada pantalla construya su propio objeto `entry` manualmente
 * (y pueda olvidar campos obligatorios como `date`, causando errores en SQLite),
 * toda la creación de entidades pasa por este módulo.
 *
 * Beneficios:
 * 1. SEGURIDAD: Si el esquema de la BD cambia (ej: se añade un campo nuevo),
 *    solo hay que actualizar la Factory, no buscar todos los `Date.now()` dispersos.
 * 2. CORRECCIÓN: Garantiza que `date` siempre esté presente (fue el origen del
 *    error `NOT NULL constraint failed: entries.date`).
 * 3. LEGIBILIDAD: `EntryFactory.createDailyEntry(text, type, date)` es más
 *    expresivo que un objeto literal con 7 campos.
 */

// Importamos desde el módulo utilitario directo, NO desde JournalContext,
// para evitar la dependencia circular:
// JournalContext → EntryFactory → JournalContext ✗
// JournalContext → EntryFactory → dateUtils      ✓
import { getFormattedDate } from '../utils/dateUtils';

/**
 * Genera un ID único basado en el timestamp actual.
 * Centralizar la generación de IDs permite cambiar la estrategia en un solo lugar
 * (ej: migrar a UUID en el futuro sin buscar `Date.now()` por toda la app).
 * @returns {string} Un string con el timestamp en ms.
 */
const generateId = () => Date.now().toString();

/**
 * Crea un objeto entrada válido para el Daily Log.
 * Garantiza que todos los campos obligatorios (`date`, `status`, `type`) están presentes.
 *
 * @param {string} text - El texto de la entrada escrito por el usuario.
 * @param {string} type - El tipo de entrada: 'task' | 'event' | 'note'.
 * @param {Date} date - El objeto Date para cuando la entrada está programada.
 * @param {string} timezone - El timezone del usuario (de SettingsContext).
 * @returns {Object} Un objeto entry listo para ser persistido por EntryRepository.
 */
export const createDailyEntry = (text, type, date, timezone) => ({
  id: generateId(),
  text: text.trim(),
  type,
  status: 'open',
  date: getFormattedDate(date, timezone), // Conversión segura al formato YYYY-MM-DD
  completedAt: null,
  listId: null, // Las entradas del Daily Log no pertenecen a ninguna lista
});

/**
 * Crea un objeto entrada válido para una Lista personalizada.
 * Las entradas de lista siempre son de tipo 'task' y tienen un `listId` asociado.
 *
 * @param {string} text - El texto del elemento de la lista.
 * @param {string} listId - El ID de la lista a la que pertenece este elemento.
 * @param {string} timezone - El timezone del usuario (de SettingsContext).
 * @returns {Object} Un objeto entry listo para ser persistido por EntryRepository.
 */
export const createListEntry = (text, listId, timezone) => ({
  id: generateId(),
  text: text.trim(),
  type: 'task',   // Los elementos de lista son siempre tareas
  status: 'open',
  date: getFormattedDate(new Date(), timezone), // Fecha de creación = hoy
  completedAt: null,
  listId,          // Asociación con la lista padre
});

/**
 * Crea un objeto lista válido.
 * @param {string} title - El nombre de la lista.
 * @param {number} orderIndex - La posición de la lista en el orden del usuario.
 * @returns {Object} Un objeto list listo para ser persistido por ListRepository.
 */
export const createList = (title, orderIndex) => ({
  id: generateId(),
  title: title.trim(),
  order_index: orderIndex,
});

/**
 * Crea un objeto entrada válido para las tareas del Monthly Log.
 * Estas tareas se asocian con un mes ('YYYY-MM') en lugar de un día concreto.
 * 
 * @param {string} text - El texto de la tarea.
 * @param {string} monthStr - El mes en formato YYYY-MM.
 * @returns {Object} Un objeto entry de tipo task listo para SQLite.
 */
export const createMonthlyTask = (text, monthStr) => ({
  id: generateId(),
  text: text.trim(),
  type: 'task',
  status: 'open',
  date: monthStr, // ej: "2026-08"
  completedAt: null,
  listId: null,
});

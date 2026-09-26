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

const generateId = () => {
  if (typeof globalThis?.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
};

/**
 * Extrae automáticamente un significador purista (* o !) al inicio del texto si existe.
 * Ejemplos:
 *   "* Comprar leche" -> { signifier: 'priority', text: 'Comprar leche' }
 *   "! Idea de app"   -> { signifier: 'inspiration', text: 'Idea de app' }
 *
 * @param {string} rawText - Texto escrito por el usuario.
 * @returns {{ signifier: string|null, text: string }} Texto limpio y significador detectado.
 */
export const parseSignifierFromText = (rawText) => {
  if (!rawText) return { signifier: null, text: '' };
  const trimmed = rawText.trim();
  if (trimmed.startsWith('* ') || (trimmed.startsWith('*') && trimmed.length > 1 && trimmed[1] !== '*')) {
    const textWithoutStar = trimmed.substring(1).trim();
    if (textWithoutStar.length > 0) {
      return { signifier: 'priority', text: textWithoutStar };
    }
  }
  if (trimmed.startsWith('! ') || (trimmed.startsWith('!') && trimmed.length > 1 && trimmed[1] !== '!')) {
    const textWithoutExclamation = trimmed.substring(1).trim();
    if (textWithoutExclamation.length > 0) {
      return { signifier: 'inspiration', text: textWithoutExclamation };
    }
  }
  return { signifier: null, text: trimmed };
};

/**
 * Extrae automáticamente una hora en formato HH:mm al inicio del texto si existe.
 * Ejemplos:
 *   "10:30 Reunión de equipo" -> { time: '10:30', text: 'Reunión de equipo' }
 *   "9:15 Llamar al médico"   -> { time: '09:15', text: 'Llamar al médico' }
 *
 * @param {string} rawText - Texto escrito por el usuario.
 * @returns {{ time: string|null, text: string }} Hora detectada y texto limpio.
 */
export const parseTimeFromText = (rawText) => {
  if (!rawText) return { time: null, text: '' };
  const trimmed = rawText.trim();
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?:\s+|$)/;
  const match = trimmed.match(timeRegex);

  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    const cleanText = trimmed.substring(match[0].length).trim();
    return {
      time: `${hours}:${minutes}`,
      text: cleanText || trimmed,
    };
  }

  return { time: null, text: trimmed };
};

/**
 * Crea un objeto entrada válido para el Daily Log.
 * Garantiza que todos los campos obligatorios (`date`, `status`, `type`) están presentes.
 *
 * @param {string} text - El texto de la entrada escrito por el usuario.
 * @param {string} type - El tipo de entrada: 'task' | 'event' | 'note'.
 * @param {Date} date - El objeto Date para cuando la entrada está programada.
 * @param {string} timezone - El timezone del usuario (de SettingsContext).
 * @param {number} [orderIndex=0] - Índice de ordenamiento.
 * @param {string|null} [signifier=null] - Significador purista ('priority' | 'inspiration' | null).
 * @param {string|null} [time=null] - Hora en formato 'HH:mm' o null.
 * @returns {Object} Un objeto entry listo para ser persistido por EntryRepository.
 */
export const createDailyEntry = (
  text,
  type,
  date,
  timezone,
  orderIndex = 0,
  signifier = null,
  time = null
) => {
  let finalSignifier = signifier;
  let finalTime = time;
  let finalText = text || '';

  if (!finalSignifier && typeof finalText === 'string') {
    const parsedSig = parseSignifierFromText(finalText);
    finalSignifier = parsedSig.signifier;
    finalText = parsedSig.text;
  }

  if (!finalTime && typeof finalText === 'string') {
    const parsedTime = parseTimeFromText(finalText);
    if (parsedTime.time) {
      finalTime = parsedTime.time;
      finalText = parsedTime.text;
    }
  }

  return {
    id: generateId(),
    text: finalText.trim(),
    type,
    status: 'open',
    date: getFormattedDate(date || new Date(), timezone),
    completedAt: null,
    listId: null, // Las entradas del Daily Log no pertenecen a ninguna lista
    order_index: orderIndex,
    signifier: finalSignifier || null,
    time: finalTime || null,
  };
};

/**
 * Crea un objeto entrada válido para una Lista personalizada.
 * Las entradas de lista siempre son de tipo 'task' y tienen un `listId` asociado.
 *
 * @param {string} text - El texto del elemento de la lista.
 * @param {string} listId - El ID de la lista a la que pertenece este elemento.
 * @param {string} timezone - El timezone del usuario (de SettingsContext).
 * @param {number} [orderIndex=0] - La posición en el orden de la lista.
 * @param {string|null} [signifier=null] - Significador purista ('priority' | 'inspiration' | null).
 * @returns {Object} Un objeto entry listo para ser persistido por EntryRepository.
 */
export const createListEntry = (text, listId, timezone, orderIndex = 0, signifier = null) => {
  let finalSignifier = signifier;
  let finalText = text || '';

  if (!finalSignifier && typeof text === 'string') {
    const parsed = parseSignifierFromText(text);
    finalSignifier = parsed.signifier;
    finalText = parsed.text;
  }

  return {
    id: generateId(),
    text: finalText.trim(),
    type: 'task',   // Los elementos de lista son siempre tareas
    status: 'open',
    date: getFormattedDate(new Date(), timezone), // Fecha de creación = hoy
    completedAt: null,
    listId,          // Asociación con la lista padre
    order_index: orderIndex,
    signifier: finalSignifier || null,
  };
};

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

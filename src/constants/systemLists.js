/**
 * @module systemLists
 *
 * Define los identificadores y metadatos de las listas del sistema:
 * listas especiales que siempre están presentes, no se pueden borrar
 * ni reordenar, y cuyo contenido es una vista calculada (no datos propios).
 */

/** ID fijo para la lista "Archivo de Notas" del sistema. */
export const SYSTEM_NOTES_ARCHIVE_ID = 'system_notes_archive';

/**
 * Objeto completo que representa la lista de sistema de Archivo de Notas.
 * Se inyecta en primera posición en ListsScreen sin tocar la base de datos.
 */
export const SYSTEM_NOTES_ARCHIVE = {
  id:          SYSTEM_NOTES_ARCHIVE_ID,
  title:       'Archivo de Notas',
  order_index: -1,   // Siempre antes que cualquier lista de usuario
  isSystem:    true, // Flag para distinguirla en el renderizado
};

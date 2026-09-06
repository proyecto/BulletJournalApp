/**
 * @module EntryRepository
 * @pattern Repository
 *
 * El patrón REPOSITORY actúa como una colección en memoria que abstrae
 * el acceso a los datos persistentes. Las capas superiores (contextos, servicios)
 * trabajan con objetos JS puros y no saben si los datos vienen de SQLite,
 * de una API REST, o de AsyncStorage.
 *
 * Beneficios:
 * - Si mañana se migra de SQLite a una API REST, solo se cambia este archivo.
 * - Las queries SQL complejas están en un solo lugar, no dispersas por la app.
 * - Facilita el testeo: se puede mockear el repositorio para probar la lógica de negocio.
 *
 * Este repositorio gestiona exclusivamente la tabla `entries`.
 */

import db from '../database/db';

/**
 * Obtiene todas las entradas de la base de datos ordenadas por order_index.
 * @returns {Promise<Array<Object>>} Un array de objetos entry ordenados.
 */
export const getAllEntries = async () => {
  return await db.getAllAsync('SELECT * FROM entries ORDER BY order_index ASC, id ASC');
};

/**
 * Inserta una nueva entrada en la base de datos.
 * @param {Object} entry - El objeto entrada a persistir.
 * @param {string} entry.id - ID único (generado por EntryFactory).
 * @param {string} entry.text - El texto de la entrada.
 * @param {string} entry.type - 'task' | 'event' | 'note'.
 * @param {string} entry.status - 'open' | 'completed'.
 * @param {string} entry.date - Fecha en formato 'YYYY-MM-DD'. OBLIGATORIO.
 * @param {string|null} entry.completedAt - Fecha de completado o null.
 * @param {string|null} entry.listId - ID de la lista padre o null.
 * @param {number} [entry.order_index] - Posición en el orden de entradas.
 * @returns {Promise<void>}
 */
export const insertEntry = async (entry) => {
  await db.runAsync(
    'INSERT INTO entries (id, text, type, status, date, completedAt, listId, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      entry.id,
      entry.text,
      entry.type,
      entry.status,
      entry.date,       // Este campo causaba el error NOT NULL antes de la Factory
      entry.completedAt ?? null,
      entry.listId ?? null,
      entry.order_index ?? 0,
    ]
  );
};

/**
 * Actualiza el order_index de una entrada.
 * @param {string} id - ID de la entrada a actualizar.
 * @param {number} newIndex - El nuevo índice de orden.
 * @returns {Promise<void>}
 */
export const updateEntryOrder = async (id, newIndex) => {
  await db.runAsync(
    'UPDATE entries SET order_index = ? WHERE id = ?',
    [newIndex, id]
  );
};

/**
 * Actualiza el order_index de múltiples entradas en una única transacción.
 * Esto evita el problema de las consultas N+1 durante la reordenación.
 * @param {Array<{id: string, index: number}>} orderUpdates - Array de actualizaciones.
 * @returns {Promise<void>}
 */
export const updateEntriesOrder = async (orderUpdates) => {
  await db.withTransactionAsync(async () => {
    for (const update of orderUpdates) {
      await db.runAsync(
        'UPDATE entries SET order_index = ? WHERE id = ?',
        [update.index, update.id]
      );
    }
  });
};

/**
 * Actualiza el estado y la fecha de completado de una entrada.
 * Se usa cuando el usuario pulsa sobre una tarea para marcarla como hecha/pendiente.
 * @param {string} id - ID de la entrada a actualizar.
 * @param {string} newStatus - El nuevo estado ('open' | 'completed').
 * @param {string|null} newCompletedAt - La nueva fecha de completado o null.
 * @returns {Promise<void>}
 */
export const updateEntryStatus = async (id, newStatus, newCompletedAt) => {
  await db.runAsync(
    'UPDATE entries SET status = ?, completedAt = ? WHERE id = ?',
    [newStatus, newCompletedAt, id]
  );
};

/**
 * Elimina todas las entradas que pertenecen a una lista específica.
 * Se usa como operación previa al borrar la lista padre (integridad referencial manual).
 * SQLite sin Foreign Keys activadas no hace esto automáticamente.
 * @param {string} listId - ID de la lista cuyas entradas se borrarán.
 * @returns {Promise<void>}
 */
export const deleteEntriesByListId = async (listId) => {
  await db.runAsync('DELETE FROM entries WHERE listId = ?', [listId]);
};

/**
 * Elimina una única entrada por su ID.
 * @param {string} id - ID de la entrada a eliminar.
 * @returns {Promise<void>}
 */
export const deleteEntryById = async (id) => {
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
};

/**
 * Actualiza la fecha de una entrada.
 * Se usa para migrar tareas (ej: mover una tarea del mes a un día concreto).
 * @param {string} id - ID de la entrada.
 * @param {string} newDate - La nueva fecha en formato 'YYYY-MM-DD' o 'YYYY-MM'.
 * @returns {Promise<void>}
 */
export const updateEntryDate = async (id, newDate) => {
  await db.runAsync(
    'UPDATE entries SET date = ? WHERE id = ?',
    [newDate, id]
  );
};

/**
 * @module ListRepository
 * @pattern Repository
 *
 * Gestiona exclusivamente el acceso a datos de la tabla `lists`.
 * Ver EntryRepository.js para una descripción completa del patrón Repository.
 */

import db from '../database/db';

/**
 * Obtiene todas las listas ordenadas por su índice de orden personalizado.
 * El `ORDER BY order_index ASC` garantiza que el usuario vea las listas
 * en el orden que él mismo las organizó mediante drag & drop.
 * @returns {Promise<Array<Object>>} Un array de objetos list ordenados.
 */
export const getAllLists = async () => {
  return await db.getAllAsync('SELECT * FROM lists ORDER BY order_index ASC');
};

/**
 * Inserta una nueva lista en la base de datos.
 * @param {Object} list - La lista a persistir.
 * @param {string} list.id - ID único.
 * @param {string} list.title - Nombre de la lista.
 * @param {number} list.order_index - Posición en el orden de listas.
 * @returns {Promise<void>}
 */
export const insertList = async (list) => {
  await db.runAsync(
    'INSERT INTO lists (id, title, order_index) VALUES (?, ?, ?)',
    [list.id, list.title, list.order_index]
  );
};

/**
 * Actualiza el `order_index` de una lista.
 * Se llama en bucle tras un drag & drop para persistir el nuevo orden.
 * @param {string} id - ID de la lista a actualizar.
 * @param {number} newIndex - El nuevo índice de orden.
 * @returns {Promise<void>}
 */
export const updateListOrder = async (id, newIndex) => {
  await db.runAsync(
    'UPDATE lists SET order_index = ? WHERE id = ?',
    [newIndex, id]
  );
};

/**
 * Actualiza el `order_index` de múltiples listas en una sola transacción.
 * Optimiza significativamente el rendimiento tras un drag & drop.
 * @param {Array<{id: string, newIndex: number}>} updates - Array de objetos con el id y el nuevo índice.
 * @returns {Promise<void>}
 */
export const updateListsOrderTransaction = async (updates) => {
  await db.withTransactionAsync(async () => {
    for (const update of updates) {
      await db.runAsync(
        'UPDATE lists SET order_index = ? WHERE id = ?',
        [update.newIndex, update.id]
      );
    }
  });
};

/**
 * Elimina una lista de la base de datos por su ID.
 * IMPORTANTE: Llamar a `EntryRepository.deleteEntriesByListId` ANTES de esto
 * para mantener la integridad referencial.
 * @param {string} id - ID de la lista a eliminar.
 * @returns {Promise<void>}
 */
export const deleteList = async (id) => {
  await db.runAsync('DELETE FROM lists WHERE id = ?', [id]);
};

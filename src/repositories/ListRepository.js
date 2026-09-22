/**
 * @module ListRepository
 * @pattern Repository
 *
 * Gestiona exclusivamente el acceso a datos de la tabla `lists`.
 * Ver EntryRepository.js para una descripción completa del patrón Repository.
 */

import db, { runInTransaction } from '../database/db';

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
 * Actualiza el orden de múltiples listas dentro de una única transacción atómica.
 * @param {Array<{id: string, order_index?: number}>} orderedLists - Array de listas con nuevo orden.
 * @returns {Promise<void>}
 */
export const batchUpdateListOrders = async (orderedLists) => {
  if (!orderedLists || orderedLists.length === 0) return;
  await runInTransaction(async () => {
    if (orderedLists.length <= 50) {
      const ids = orderedLists.map((l) => l.id);
      const caseClauses = orderedLists.map(() => 'WHEN id = ? THEN ?').join(' ');
      const placeholders = ids.map(() => '?').join(',');
      const sql = `UPDATE lists SET order_index = CASE ${caseClauses} END WHERE id IN (${placeholders})`;

      const pairs = [];
      orderedLists.forEach((l, idx) => {
        const order = l.order_index !== undefined ? l.order_index : idx;
        pairs.push(l.id, order);
      });

      const params = [...pairs, ...ids];
      await db.runAsync(sql, params);
    } else {
      for (let i = 0; i < orderedLists.length; i++) {
        const item = orderedLists[i];
        const newIndex = item.order_index !== undefined ? item.order_index : i;
        await db.runAsync('UPDATE lists SET order_index = ? WHERE id = ?', [newIndex, item.id]);
      }
    }
  });
};

/**
 * Inserta múltiples listas dentro de una única transacción atómica.
 * @param {Array<Object>} lists - Array de listas a insertar.
 * @returns {Promise<void>}
 */
export const batchInsertLists = async (lists) => {
  if (!lists || lists.length === 0) return;
  await runInTransaction(async () => {
    for (const list of lists) {
      await db.runAsync(
        'INSERT INTO lists (id, title, order_index) VALUES (?, ?, ?)',
        [list.id, list.title, list.order_index]
      );
    }
  });
};

/**
 * Elimina una lista de la base de datos por su ID.
 * @param {string} id - ID de la lista a eliminar.
 * @returns {Promise<void>}
 */
export const deleteList = async (id) => {
  await db.runAsync('DELETE FROM lists WHERE id = ?', [id]);
};

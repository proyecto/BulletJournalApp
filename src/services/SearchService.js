/**
 * @module SearchService
 * @pattern Service / Pure Utility
 *
 * Encapsula la lógica de búsqueda sobre el conjunto global de entradas del diario.
 */

/**
 * Busca entradas que coincidan con el término `query` dentro de todas las entradas.
 *
 * @param {Array<Object>} allEntries - Colección global de entradas.
 * @param {Array<Object>} [allLists=[]] - Colección de listas personalizadas.
 * @param {string} [query=''] - Término de búsqueda.
 * @returns {Array<Object>} Entradas coincidentes ordenadas por relevancia y fecha.
 */
export const searchEntries = (allEntries, allLists = [], query = '') => {
  if (!allEntries || !Array.isArray(allEntries) || !query || typeof query !== 'string') {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const listsMap = new Map((allLists || []).map(l => [l.id, l.title || l.name]));

  return allEntries
    .filter(entry => entry && entry.text && entry.text.toLowerCase().includes(cleanQuery))
    .map(entry => {
      const listName = entry.listId ? (listsMap.get(entry.listId) || null) : null;
      return {
        ...entry,
        listName,
      };
    })
    .sort((a, b) => {
      // Coincidencia al inicio del texto se prioriza
      const aStarts = a.text.toLowerCase().startsWith(cleanQuery);
      const bStarts = b.text.toLowerCase().startsWith(cleanQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Orden descendente por fecha si existe
      const dateA = a.date || a.completedAt || '';
      const dateB = b.date || b.completedAt || '';
      return dateB.localeCompare(dateA);
    });
};

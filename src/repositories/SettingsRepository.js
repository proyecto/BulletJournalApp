/**
 * @module SettingsRepository
 * @pattern Repository
 *
 * Gestiona exclusivamente el acceso a datos de la tabla `settings`.
 * La tabla `settings` usa un esquema clave-valor simple, lo que la hace
 * muy flexible para añadir nuevas preferencias sin alterar el esquema de la BD.
 *
 * Ver EntryRepository.js para una descripción completa del patrón Repository.
 */

import db from '../database/db';

/**
 * Obtiene todas las preferencias guardadas del usuario.
 * Devuelve un objeto plano `{ key: value }` listo para consumir,
 * en lugar de el array crudo de filas de SQLite.
 * @returns {Promise<Object>} Un objeto con todas las configuraciones { key: value }.
 */
export const getAllSettings = async () => {
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  // Transformación: array de { key, value } -> objeto { [key]: value }
  // Esto facilita el acceso directo: settings.themePreference en lugar de
  // settings.find(s => s.key === 'themePreference').value
  const settings = {};
  rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
};

/**
 * Guarda o actualiza una preferencia del usuario.
 * Usa `INSERT OR REPLACE` (upsert) para no tener que comprobar si la clave ya existe.
 * Los valores no-string se serializan como JSON para que puedan persistirse
 * objetos complejos como `typographyConfig`.
 * @param {string} key - El nombre de la preferencia (ej: 'themePreference').
 * @param {*} value - El valor a guardar. Puede ser string, number u object.
 * @returns {Promise<void>}
 */
export const saveSetting = async (key, value) => {
  // Serialización: si el valor es un objeto o array, lo convertimos a JSON string
  const valueString = typeof value === 'string' ? value : JSON.stringify(value);
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, valueString]
  );
};

/**
 * @module db
 * @pattern Singleton
 *
 * Este módulo implementa el patrón SINGLETON para la conexión a la base de datos SQLite.
 *
 * ¿Por qué Singleton?
 * Una conexión a una base de datos es un recurso costoso. Abrir múltiples conexiones
 * simultáneas puede causar errores de concurrencia (race conditions) y consumo excesivo
 * de memoria. El patrón Singleton garantiza que, a lo largo de toda la vida de la app,
 * exista una única instancia de la conexión compartida por todos los módulos que la necesiten.
 *
 * Expo SQLite (`openDatabaseSync`) ya implementa esto internamente: si llamas a
 * `openDatabaseSync` con el mismo nombre, devuelve la misma instancia. Este módulo
 * centraliza y documenta explícitamente ese comportamiento para que quede claro.
 *
 * @example
 * import db from '../database/db';
 * const rows = await db.getAllAsync('SELECT * FROM entries');
 */

import * as SQLite from 'expo-sqlite';

/**
 * La única instancia de la conexión a la base de datos de la aplicación.
 * Es creada una única vez cuando este módulo se importa por primera vez.
 * Todas las importaciones posteriores de `db` en otros archivos recibirán
 * exactamente el mismo objeto (esto es como JavaScript gestiona los módulos ES).
 */
const db = SQLite.openDatabaseSync('bulletjournal.db');

/**
 * Inicializa el esquema de la base de datos.
 * Crea las tablas si no existen (`CREATE TABLE IF NOT EXISTS`), por lo que
 * es seguro llamarla en cada arranque de la aplicación.
 *
 * PRAGMA journal_mode = WAL (Write-Ahead Logging): Mejora el rendimiento
 * en entornos con lecturas y escrituras concurrentes, que es el caso de
 * React Native donde el JS thread y el native thread pueden acceder a la BD.
 */
export const initDB = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = -2000;
    PRAGMA foreign_keys = ON;

    -- Tabla de listas personalizadas del usuario (ej: "Películas", "Libros")
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      order_index INTEGER DEFAULT 0
    );

    -- Tabla de entradas del diario (tareas, eventos, notas)
    -- 'date': Fecha en formato YYYY-MM-DD (requerida, NOT NULL)
    -- 'completedAt': Fecha en que se completó la tarea (NULL si no está completada)
    -- 'listId': Clave foránea a 'lists'. NULL si es una entrada del Daily Log.
    -- 'signifier': Significador purista BuJo ('priority' [*] | 'inspiration' [!] | NULL)
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      completedAt TEXT,
      listId TEXT,
      order_index INTEGER DEFAULT 0,
      signifier TEXT,
      time TEXT,
      FOREIGN KEY (listId) REFERENCES lists(id) ON DELETE CASCADE
    );

    -- Tabla de configuración clave-valor para persistir las preferencias del usuario
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Índices de alto rendimiento para búsquedas y ordenaciones frecuentes
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
    CREATE INDEX IF NOT EXISTS idx_entries_listId ON entries(listId);
    CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
    CREATE INDEX IF NOT EXISTS idx_entries_order ON entries(order_index);
    CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
    CREATE INDEX IF NOT EXISTS idx_entries_date_order ON entries(date, order_index);
    CREATE INDEX IF NOT EXISTS idx_entries_archive ON entries(type, listId, date);
    CREATE INDEX IF NOT EXISTS idx_entries_log_query ON entries(listId, status, date);
    CREATE INDEX IF NOT EXISTS idx_lists_order ON lists(order_index);
  `);

  // Migración segura para bases de datos existentes que no tenían la columna order_index en entries
  try {
    db.execSync('ALTER TABLE entries ADD COLUMN order_index INTEGER DEFAULT 0;');
  } catch (e) {
    // La columna ya existe, se ignora de forma segura
  }

  // Migración segura para bases de datos existentes que no tenían la columna signifier en entries
  try {
    db.execSync('ALTER TABLE entries ADD COLUMN signifier TEXT DEFAULT NULL;');
  } catch (e) {
    // La columna ya existe, se ignora de forma segura
  }

  // Migración segura para bases de datos existentes que no tenían la columna time en entries
  try {
    db.execSync('ALTER TABLE entries ADD COLUMN time TEXT DEFAULT NULL;');
  } catch (e) {
    // La columna ya existe, se ignora de forma segura
  }
};

/**
 * Ejecuta operaciones compuestas dentro de una transacción SQLite atómica.
 * Agrupa múltiples operaciones I/O en una única transacción de disco para máxima velocidad.
 *
 * @param {Function} callback - Función asíncrona que contiene las operaciones a ejecutar.
 * @returns {Promise<*>} El resultado de la ejecución del callback.
 */
export const runInTransaction = async (callback) => {
  if (typeof db.withTransactionAsync === 'function') {
    return await db.withTransactionAsync(callback);
  }
  try {
    if (typeof db.execAsync === 'function') {
      await db.execAsync('BEGIN TRANSACTION;');
      const result = await callback();
      await db.execAsync('COMMIT;');
      return result;
    }
  } catch (err) {
    if (typeof db.execAsync === 'function') {
      try {
        await db.execAsync('ROLLBACK;');
      } catch (_) {}
    }
    throw err;
  }
  return await callback();
};

/**
 * Restablece la base de datos completa eliminando todos los registros.
 */
export const resetDatabase = () => {
  db.execSync(`
    DELETE FROM entries;
    DELETE FROM lists;
    DELETE FROM settings;
  `);
};

export default db;

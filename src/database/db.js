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
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      completedAt TEXT,
      listId TEXT
    );

    -- Tabla de configuración clave-valor para persistir las preferencias del usuario
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
};

export default db;

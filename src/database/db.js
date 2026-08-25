import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('bulletjournal.db');

export const initDB = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      order_index INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      completedAt TEXT,
      listId TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
};

export default db;

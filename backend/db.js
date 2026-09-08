const Database = require('better-sqlite3');

const db = new Database('buildtrack.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    budget REAL NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'On Track',
    manager TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
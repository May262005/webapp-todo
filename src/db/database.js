const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ruta de la BD (persistente vía volumen Docker)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'todo.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crear tablas normalizadas
db.exec(`
  CREATE TABLE IF NOT EXISTS listas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    color TEXT DEFAULT '#3498db',
    creadaEn TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    completada INTEGER DEFAULT 0,
    prioridad TEXT DEFAULT 'media',
    listaId INTEGER NOT NULL,
    creadaEn TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listaId) REFERENCES listas(id) ON DELETE CASCADE
  );
`);

// Insertar elemento en la tabla listas
function insertElement(element) {
    const stmt = db.prepare('INSERT INTO listas (nombre, descripcion, color) VALUES (?, ?, ?)');
    const result = stmt.run(element, 'Insertado vía Socket', '#3498db');
    return { id: result.lastInsertRowid, nombre: element };
}

// Obtener elemento por nombre de la tabla listas
function getElement(element) {
    const stmt = db.prepare('SELECT * FROM listas WHERE nombre LIKE ?');
    return stmt.all(`%${element}%`);
}

module.exports = { db, DB_PATH, DATA_DIR, insertElement, getElement };
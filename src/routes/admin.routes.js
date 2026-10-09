const express = require('express');
const router = express.Router();
const fs = require('fs');
const { db, DB_PATH } = require('../db/database');

const ok = (data = [], message = null, statusCode = 200) => ({
  statusCode,
  data,
  message
});

// 10. GET backup de la BD
router.get('/backup', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const { DATA_DIR } = require('../db/database');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(DATA_DIR, `backup_${timestamp}.db`);

  try {
    // Fuerza el checkpoint del WAL hacia el archivo principal
    db.pragma('wal_checkpoint(TRUNCATE)');

    // Copia el archivo .db ya consolidado
    fs.copyFileSync(DB_PATH, backupPath);

    res.download(backupPath, path.basename(backupPath), (err) => {
      if (err) console.error('Error al enviar backup:', err);
      // Borra el backup temporal después de enviarlo
      try { fs.unlinkSync(backupPath); } catch (e) {}
    });
  } catch (error) {
    console.error('Error al generar backup:', error);
    res.status(500).json({ statusCode: 500, data: [], message: error.message });
  }
});

// 11. DELETE vaciar toda la BD
router.delete('/vaciar', (req, res) => {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM tareas').run();
    db.prepare('DELETE FROM listas').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('listas','tareas')").run();
  });
  tx();
  res.json(ok([], 'Base de datos vaciada correctamente'));
});

// 12. GET status / health
router.get('/status', (req, res) => {
  const listas = db.prepare('SELECT COUNT(*) AS c FROM listas').get().c;
  const tareas = db.prepare('SELECT COUNT(*) AS c FROM tareas').get().c;
  res.json(ok({
    status: 'OK uteq',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    listas,
    tareas,
    dbPath: DB_PATH
  }));
});

// 13. GET hora del servidor (endpoint de prueba CI/CD)
router.get('/hora', (req, res) => {
  res.json(ok({
    hora: new Date().toISOString(),
    mensaje: 'Primer demo CI/CD - Pipeline funciona perfecto',
    version: 'v3-demo-cicd',
    servidor: 'AWS EC2'
  }, 'Endpoint nuevo desplegado con CI/CD'));
});

module.exports = router;
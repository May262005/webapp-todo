const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

const ok = (data = [], message = null, statusCode = 200) => ({
  statusCode,
  data,
  message
});

// 6. GET todas las tareas (filtros opcionales)
router.get('/', (req, res) => {
  const { listaId, completada } = req.query;
  let sql = 'SELECT * FROM tareas WHERE 1=1';
  const params = [];

  if (listaId) { sql += ' AND listaId = ?'; params.push(listaId); }
  if (completada !== undefined) { sql += ' AND completada = ?'; params.push(completada === 'true' ? 1 : 0); }

  sql += ' ORDER BY id DESC';
  res.json(ok(db.prepare(sql).all(...params)));
});

// 7. POST crear tarea
router.post('/', (req, res) => {
  const { titulo, descripcion = '', listaId, prioridad = 'media' } = req.body;
  if (!titulo || !listaId)
    return res.status(400).json(ok([], 'titulo y listaId son obligatorios', 400));

  const lista = db.prepare('SELECT * FROM listas WHERE id = ?').get(listaId);
  if (!lista) return res.status(404).json(ok([], 'La lista no existe', 404));

  const info = db.prepare(`
    INSERT INTO tareas (titulo, descripcion, listaId, prioridad) VALUES (?, ?, ?, ?)
  `).run(titulo, descripcion, listaId, prioridad);

  const nueva = db.prepare('SELECT * FROM tareas WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(ok(nueva, 'Tarea creada', 201));
});

// 8. PUT actualizar tarea (marcar completada / editar)
router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json(ok([], 'Tarea no encontrada', 404));

  const { titulo, descripcion, completada, prioridad } = req.body;

  db.prepare(`
    UPDATE tareas SET titulo = ?, descripcion = ?, completada = ?, prioridad = ?
    WHERE id = ?
  `).run(
    titulo ?? existente.titulo,
    descripcion ?? existente.descripcion,
    completada !== undefined ? (completada ? 1 : 0) : existente.completada,
    prioridad ?? existente.prioridad,
    req.params.id
  );

  const actualizada = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
  res.json(ok(actualizada, 'Tarea actualizada'));
});

// 9. DELETE eliminar tarea
router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json(ok([], 'Tarea no encontrada', 404));

  db.prepare('DELETE FROM tareas WHERE id = ?').run(req.params.id);
  res.json(ok({ id: Number(req.params.id) }, 'Tarea eliminada'));
});

module.exports = router;
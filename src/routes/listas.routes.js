const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// Helper para el JSON schema requerido
const ok = (data = [], message = null, statusCode = 200) => ({
  statusCode,
  data,
  message
});

// 1. GET todas las listas (con conteo de tareas)
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, 
      (SELECT COUNT(*) FROM tareas t WHERE t.listaId = l.id) AS totalTareas,
      (SELECT COUNT(*) FROM tareas t WHERE t.listaId = l.id AND t.completada = 1) AS tareasCompletadas
    FROM listas l
    ORDER BY l.id DESC
  `).all();
  res.json(ok(rows));
});

// 2. GET lista por id (con sus tareas)
router.get('/:id', (req, res) => {
  const lista = db.prepare('SELECT * FROM listas WHERE id = ?').get(req.params.id);
  if (!lista) return res.status(404).json(ok([], 'Lista no encontrada', 404));
  lista.tareas = db.prepare('SELECT * FROM tareas WHERE listaId = ?').all(lista.id);
  res.json(ok(lista));
});

// 3. POST crear lista
router.post('/', (req, res) => {
  const { nombre, descripcion = '', color = '#3498db' } = req.body;
  if (!nombre) return res.status(400).json(ok([], 'El nombre es obligatorio', 400));

  const info = db.prepare(
    'INSERT INTO listas (nombre, descripcion, color) VALUES (?, ?, ?)'
  ).run(nombre, descripcion, color);

  const nueva = db.prepare('SELECT * FROM listas WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(ok(nueva, 'Lista creada', 201));
});

// 4. PUT actualizar lista
router.put('/:id', (req, res) => {
  const { nombre, descripcion, color } = req.body;
  const existente = db.prepare('SELECT * FROM listas WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json(ok([], 'Lista no encontrada', 404));

  db.prepare(`
    UPDATE listas SET nombre = ?, descripcion = ?, color = ? WHERE id = ?
  `).run(
    nombre ?? existente.nombre,
    descripcion ?? existente.descripcion,
    color ?? existente.color,
    req.params.id
  );

  const actualizada = db.prepare('SELECT * FROM listas WHERE id = ?').get(req.params.id);
  res.json(ok(actualizada, 'Lista actualizada'));
});

// 5. DELETE eliminar lista (borra tareas por CASCADE)
router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM listas WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json(ok([], 'Lista no encontrada', 404));

  db.prepare('DELETE FROM listas WHERE id = ?').run(req.params.id);
  res.json(ok({ id: Number(req.params.id) }, 'Lista eliminada'));
});

module.exports = router;
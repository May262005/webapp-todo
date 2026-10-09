const request = require('supertest');
const express = require('express');

// Creamos una instancia limpia de la app para testing
const app = express();
app.use(express.json());

// Base de datos en memoria para las pruebas
let listas = [];
let tareas = [];
let nextListaId = 1;
let nextTareaId = 1;

// Helper
const ok = (data = [], message = null, statusCode = 200) => ({ statusCode, data, message });

// ============ RUTAS DE LISTAS ============
app.get('/api/listas', (req, res) => res.json(ok(listas)));

app.get('/api/listas/:id', (req, res) => {
  const lista = listas.find(l => l.id === Number(req.params.id));
  if (!lista) return res.status(404).json(ok([], 'Lista no encontrada', 404));
  res.json(ok({ ...lista, tareas: tareas.filter(t => t.listaId === lista.id) }));
});

app.post('/api/listas', (req, res) => {
  const { nombre, descripcion = '', color = '#3498db' } = req.body;
  if (!nombre) return res.status(400).json(ok([], 'El nombre es obligatorio', 400));
  const nueva = { id: nextListaId++, nombre, descripcion, color };
  listas.push(nueva);
  res.status(201).json(ok(nueva, 'Lista creada', 201));
});

app.put('/api/listas/:id', (req, res) => {
  const lista = listas.find(l => l.id === Number(req.params.id));
  if (!lista) return res.status(404).json(ok([], 'Lista no encontrada', 404));
  const { nombre, descripcion, color } = req.body;
  if (nombre !== undefined) lista.nombre = nombre;
  if (descripcion !== undefined) lista.descripcion = descripcion;
  if (color !== undefined) lista.color = color;
  res.json(ok(lista, 'Lista actualizada'));
});

app.delete('/api/listas/:id', (req, res) => {
  const idx = listas.findIndex(l => l.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json(ok([], 'Lista no encontrada', 404));
  listas.splice(idx, 1);
  res.json(ok({ id: Number(req.params.id) }, 'Lista eliminada'));
});

// ============ RUTAS DE TAREAS ============
app.get('/api/tareas', (req, res) => res.json(ok(tareas)));

app.post('/api/tareas', (req, res) => {
  const { titulo, descripcion = '', listaId, prioridad = 'media' } = req.body;
  if (!titulo || !listaId) return res.status(400).json(ok([], 'titulo y listaId son obligatorios', 400));
  const lista = listas.find(l => l.id === Number(listaId));
  if (!lista) return res.status(404).json(ok([], 'La lista no existe', 404));
  const nueva = { id: nextTareaId++, titulo, descripcion, listaId, prioridad, completada: 0 };
  tareas.push(nueva);
  res.status(201).json(ok(nueva, 'Tarea creada', 201));
});

app.put('/api/tareas/:id', (req, res) => {
  const tarea = tareas.find(t => t.id === Number(req.params.id));
  if (!tarea) return res.status(404).json(ok([], 'Tarea no encontrada', 404));
  const { titulo, completada, prioridad } = req.body;
  if (titulo !== undefined) tarea.titulo = titulo;
  if (completada !== undefined) tarea.completada = completada ? 1 : 0;
  if (prioridad !== undefined) tarea.prioridad = prioridad;
  res.json(ok(tarea, 'Tarea actualizada'));
});

app.delete('/api/tareas/:id', (req, res) => {
  const idx = tareas.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json(ok([], 'Tarea no encontrada', 404));
  tareas.splice(idx, 1);
  res.json(ok({ id: Number(req.params.id) }, 'Tarea eliminada'));
});

// ============ ADMIN ============
app.get('/api/admin/status', (req, res) =>
  res.json(ok({ status: 'OK', listas: listas.length, tareas: tareas.length }))
);

app.delete('/api/admin/vaciar', (req, res) => {
  listas = [];
  tareas = [];
  nextListaId = 1;
  nextTareaId = 1;
  res.json(ok([], 'Base de datos vaciada correctamente'));
});

// ============================================================
//                     PRUEBAS UNITARIAS
// ============================================================
beforeEach(() => {
  listas = [];
  tareas = [];
  nextListaId = 1;
  nextTareaId = 1;
});

describe('🧪 PRUEBAS UNITARIAS - API To-Do', () => {

  // ---------- 1. GET /api/listas ----------
  test('1. GET /api/listas → 200 con array vacío inicial', async () => {
    const res = await request(app).get('/api/listas');
    expect(res.statusCode).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ---------- 2. POST /api/listas ----------
  test('2. POST /api/listas → 201 crea una lista', async () => {
    const res = await request(app).post('/api/listas').send({ nombre: 'Compras' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.nombre).toBe('Compras');
  });

  // ---------- 3. POST /api/listas FALLO ----------
  test('3. POST /api/listas sin nombre → 400 (escenario de fallo)', async () => {
    const res = await request(app).post('/api/listas').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/nombre/i);
  });

  // ---------- 4. GET /api/listas/:id ----------
  test('4. GET /api/listas/:id → 200 con la lista', async () => {
    await request(app).post('/api/listas').send({ nombre: 'Test' });
    const res = await request(app).get('/api/listas/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.nombre).toBe('Test');
  });

  // ---------- 5. GET /api/listas/:id FALLO ----------
  test('5. GET /api/listas/999 → 404 (escenario de fallo)', async () => {
    const res = await request(app).get('/api/listas/999');
    expect(res.statusCode).toBe(404);
  });

  // ---------- 6. PUT /api/listas/:id ----------
  test('6. PUT /api/listas/:id → 200 actualiza', async () => {
    await request(app).post('/api/listas').send({ nombre: 'Viejo' });
    const res = await request(app).put('/api/listas/1').send({ nombre: 'Nuevo' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.nombre).toBe('Nuevo');
  });

  // ---------- 7. PUT /api/listas/:id FALLO ----------
  test('7. PUT /api/listas/999 → 404 (escenario de fallo)', async () => {
    const res = await request(app).put('/api/listas/999').send({ nombre: 'X' });
    expect(res.statusCode).toBe(404);
  });

  // ---------- 8. DELETE /api/listas/:id ----------
  test('8. DELETE /api/listas/:id → 200 elimina', async () => {
    await request(app).post('/api/listas').send({ nombre: 'Borrar' });
    const res = await request(app).delete('/api/listas/1');
    expect(res.statusCode).toBe(200);
  });

  // ---------- 9. POST /api/tareas ----------
  test('9. POST /api/tareas → 201 crea tarea', async () => {
    await request(app).post('/api/listas').send({ nombre: 'Lista' });
    const res = await request(app).post('/api/tareas').send({ titulo: 'Tarea 1', listaId: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.titulo).toBe('Tarea 1');
  });

  // ---------- 10. POST /api/tareas FALLO ----------
  test('10. POST /api/tareas sin listaId → 400 (escenario de fallo)', async () => {
    const res = await request(app).post('/api/tareas').send({ titulo: 'X' });
    expect(res.statusCode).toBe(400);
  });

  // ---------- 11. POST /api/tareas lista inexistente ----------
  test('11. POST /api/tareas con listaId inexistente → 404 (escenario de fallo)', async () => {
    const res = await request(app).post('/api/tareas').send({ titulo: 'X', listaId: 999 });
    expect(res.statusCode).toBe(404);
  });

  // ---------- 12. PUT /api/tareas/:id ----------
  test('12. PUT /api/tareas/:id → 200 marca completada', async () => {
    await request(app).post('/api/listas').send({ nombre: 'L' });
    await request(app).post('/api/tareas').send({ titulo: 'T', listaId: 1 });
    const res = await request(app).put('/api/tareas/1').send({ completada: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.completada).toBe(1);
  });

  // ---------- 13. DELETE /api/tareas/:id ----------
  test('13. DELETE /api/tareas/:id → 200 elimina', async () => {
    await request(app).post('/api/listas').send({ nombre: 'L' });
    await request(app).post('/api/tareas').send({ titulo: 'T', listaId: 1 });
    const res = await request(app).delete('/api/tareas/1');
    expect(res.statusCode).toBe(200);
  });

  // ---------- 14. DELETE /api/tareas/:id FALLO ----------
  test('14. DELETE /api/tareas/999 → 404 (escenario de fallo)', async () => {
    const res = await request(app).delete('/api/tareas/999');
    expect(res.statusCode).toBe(404);
  });

  // ---------- 15. GET /api/admin/status ----------
  test('15. GET /api/admin/status → 200 con conteos', async () => {
    const res = await request(app).get('/api/admin/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('OK');
  });

  // ---------- 16. DELETE /api/admin/vaciar ----------
  test('16. DELETE /api/admin/vaciar → 200 limpia todo', async () => {
    await request(app).post('/api/listas').send({ nombre: 'L' });
    const res = await request(app).delete('/api/admin/vaciar');
    expect(res.statusCode).toBe(200);
    const check = await request(app).get('/api/listas');
    expect(check.body.data.length).toBe(0);
  });
});
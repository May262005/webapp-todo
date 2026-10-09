const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const listasRoutes = require('./routes/listas.routes');
const tareasRoutes = require('./routes/tareas.routes');
const adminRoutes  = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 80;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta raíz con documentación básica
app.get('/', (req, res) => {
  res.json({
    statusCode: 200,
    data: {
      nombre: 'WebApp To-Do API',
      version: '1.0.0',
      endpoints: {
        listas: [
          'GET    /api/listas',
          'GET    /api/listas/:id',
          'POST   /api/listas',
          'PUT    /api/listas/:id',
          'DELETE /api/listas/:id'
        ],
        tareas: [
          'GET    /api/tareas',
          'POST   /api/tareas',
          'PUT    /api/tareas/:id',
          'DELETE /api/tareas/:id'
        ],
        admin: [
          'GET    /api/admin/status',
          'GET    /api/admin/backup',
          'DELETE /api/admin/vaciar'
        ]
      }
    },
    message: null
  });
});

// Rutas
app.use('/api/listas', listasRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/admin',  adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ statusCode: 404, data: [], message: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ statusCode: 500, data: [], message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 API To-Do v2 (CI/CD) escuchando en http://0.0.0.0:${PORT}`);
});
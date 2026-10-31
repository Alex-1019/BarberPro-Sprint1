
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Conexión con MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 10
});

// Comprobar backend y base de datos
app.get('/api/estado', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS conectado');

    res.json({
      mensaje: 'Backend funcionando',
      baseDeDatos: rows[0].conectado === 1
        ? 'Conectada'
        : 'Sin conexión'
    });
  } catch (error) {
    console.error('Error de MySQL:', error.message);

    res.status(500).json({
      mensaje: 'No se pudo conectar con la base de datos'
    });
  }
});

// Registrar usuario
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, correo, password, aceptaTratamiento } = req.body || {};

    if (
      typeof nombre !== 'string' ||
      typeof correo !== 'string' ||
      typeof password !== 'string' ||
      !nombre.trim() ||
      !correo.trim() ||
      !password
    ) {
      return res.status(400).json({
        mensaje: 'Completa nombre, correo y contraseña'
      });
    }

    if (aceptaTratamiento !== true) {
      return res.status(400).json({
        mensaje: 'Debes aceptar el tratamiento de datos personales para crear una cuenta'
      });
    }

    const nombreLimpio = nombre.trim();
    const correoLimpio = correo.trim().toLowerCase();

    if (
      nombreLimpio.length > 100 ||
      correoLimpio.length > 150 ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        mensaje: 'Revisa los datos. La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
      });
    }

    // Comprobar si el correo ya está registrado
    const [existentes] = await pool.execute(
      'SELECT id FROM usuarios WHERE correo = ? LIMIT 1',
      [correoLimpio]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        mensaje: 'Ya existe una cuenta con ese correo'
      });
    }

    // Generar hash seguro de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Guardar el usuario en MySQL
    const [resultado] = await pool.execute(
      `INSERT INTO usuarios
       (nombre, correo, password_hash)
       VALUES (?, ?, ?)`,
      [nombreLimpio, correoLimpio, passwordHash]
    );

    console.log('Usuario registrado correctamente. ID:', resultado.insertId);

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: {
        id: resultado.insertId,
        nombre: nombreLimpio,
        correo: correoLimpio
      }
    });

  } catch (error) {
    // Mostrar el error real en la terminal de desarrollo
    console.error('Error al registrar usuario:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        mensaje: 'Ya existe una cuenta con ese correo'
      });
    }

    return res.status(500).json({
      mensaje: 'Error al registrar el usuario',
      detalle: error.message,
      codigo: error.code || 'ERROR_DESCONOCIDO'
    });
  }
});

// Iniciar sesión
app.post('/api/login', async (req, res) => {
  try {
    const { correo, password } = req.body || {};

    if (
      typeof correo !== 'string' ||
      typeof password !== 'string' ||
      !correo.trim() ||
      !password
    ) {
      return res.status(400).json({
        mensaje: 'Introduce tu correo y contraseña'
      });
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const correoLimpio = correo.trim().toLowerCase();

    // Buscar usuario por correo
    const [usuarios] = await pool.execute(
      `SELECT id, nombre, correo, password_hash
       FROM usuarios
       WHERE correo = ?
       LIMIT 1`,
      [correoLimpio]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const usuario = usuarios[0];

    // Comparar contraseña con el hash guardado
    const passwordCorrecta = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordCorrecta) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    console.log('Inicio de sesión correcto. ID:', usuario.id);

    return res.json({
      mensaje: 'Inicio de sesión correcto',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo
      }
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);

    return res.status(500).json({
      mensaje: 'Error al iniciar sesión',
      detalle: error.message,
      codigo: error.code || 'ERROR_DESCONOCIDO'
    });
  }
});

// Ruta para direcciones inexistentes
app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada',
    metodo: req.method,
    ruta: req.originalUrl
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend disponible en http://localhost:${PORT}`);
});

// Controlador del Portal de Estudiantes
// Flujo: correo + código de estudiante permanente (EST-XXXX) → JWT
const { promisePool } = require('../config/database');
const jwt = require('jsonwebtoken');
const { sendLoginNotification } = require('../utils/emailService');

// ─────────────────────────────────────────────
// LOGIN: correo + código permanente (EST-XXXX)
// POST /api/portal/login
// ─────────────────────────────────────────────
exports.loginEstudiante = async (req, res) => {
  try {
    let { email, codigo } = req.body;

    email  = email?.trim().toLowerCase();
    codigo = codigo?.trim().toUpperCase();

    if (!email || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'El correo y el código de estudiante son obligatorios.'
      });
    }

    if (email.length > 100 || codigo.length > 20) {
      return res.status(400).json({ success: false, message: 'Datos inválidos.' });
    }

    // Buscar estudiante activo con ese correo Y ese código
    const [estudiantes] = await promisePool.query(
      `SELECT id, codigo, nombres, apellidos, email, dni, telefono,
              fecha_nacimiento, direccion, nombre_apoderado, telefono_apoderado
       FROM estudiantes
       WHERE email = ? AND codigo = ? AND estado = 'activo'`,
      [email, codigo]
    );

    if (estudiantes.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Correo o código de estudiante incorrecto.'
      });
    }

    const estudiante = estudiantes[0];

    if (!process.env.JWT_SECRET) throw new Error('CRITICAL: JWT_SECRET no configurado');

    // Generar JWT con rol 'estudiante' — NO sirve para rutas del admin
    const token = jwt.sign(
      {
        id: estudiante.id,
        codigo: estudiante.codigo,
        nombres: estudiante.nombres,
        rol: 'estudiante'
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Enviar correo de notificación oficial vía Brevo
    sendLoginNotification(estudiante).catch(err => console.error("Email error:", err));

    res.json({
      success: true,
      message: '¡Acceso exitoso!',
      data: {
        token,
        estudiante: {
          id: estudiante.id,
          codigo: estudiante.codigo,
          nombres: estudiante.nombres,
          apellidos: estudiante.apellidos,
          email: estudiante.email
        }
      }
    });
  } catch (error) {
    console.error('Error en login del estudiante:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
  }
};

// ─────────────────────────────────────────────
// PERFIL del estudiante autenticado
// ─────────────────────────────────────────────
exports.getMiPerfil = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT id, codigo, nombres, apellidos, email, dni, telefono,
              fecha_nacimiento, direccion, nombre_apoderado, telefono_apoderado
       FROM estudiantes WHERE id = ? AND estado = 'activo'`,
      [req.estudiante.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Estudiante no encontrado.' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
  }
};

// ─────────────────────────────────────────────
// MIS MATRÍCULAS
// ─────────────────────────────────────────────
exports.getMisMatriculas = async (req, res) => {
  try {
    const [matriculas] = await promisePool.query(
      `SELECT
         m.id, m.codigo, m.fecha_matricula, m.estado_pago,
         m.monto_total, m.monto_pagado,
         c.nombre AS curso_nombre, c.id AS curso_id, c.nivel, c.horario,
          ci.nombre AS ciclo_nombre, ci.id AS ciclo_id, ci.fecha_inicio, ci.fecha_fin,
          CONCAT(d.nombres, ' ', d.apellidos) AS docente_nombre
        FROM matriculas m
        INNER JOIN cursos c ON m.curso_id = c.id
        LEFT  JOIN ciclos  ci ON c.ciclo_id   = ci.id
        LEFT  JOIN docentes d  ON c.docente_id = d.id
       WHERE m.estudiante_id = ?
       ORDER BY m.fecha_matricula DESC`,
      [req.estudiante.id]
    );
    res.json({ success: true, data: matriculas, total: matriculas.length });
  } catch (error) {
    console.error('Error al obtener matrículas:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
  }
};

// ─────────────────────────────────────────────
// MIS PAGOS
// ─────────────────────────────────────────────
exports.getMisPagos = async (req, res) => {
  try {
    const [pagos] = await promisePool.query(
      `SELECT
         p.id, p.codigo, p.monto, p.fecha_pago, p.metodo_pago, p.numero_recibo,
         m.codigo AS matricula_codigo,
         c.nombre AS curso_nombre
       FROM pagos p
       INNER JOIN matriculas m ON p.matricula_id = m.id
       INNER JOIN cursos     c ON m.curso_id     = c.id
       WHERE m.estudiante_id = ?
       ORDER BY p.fecha_pago DESC`,
      [req.estudiante.id]
    );
    res.json({ success: true, data: pagos, total: pagos.length });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
  }
};

// ─────────────────────────────────────────────
// MI HORARIO
// ─────────────────────────────────────────────
exports.getMiHorario = async (req, res) => {
  try {
    const [horario] = await promisePool.query(
      `SELECT
         c.id AS curso_id, c.nombre AS curso_nombre, c.nivel, c.horario,
          ci.nombre AS ciclo_nombre, ci.fecha_inicio, ci.fecha_fin,
          CONCAT(d.nombres, ' ', d.apellidos) AS docente_nombre,
          m.estado_pago
        FROM matriculas m
        INNER JOIN cursos   c  ON m.curso_id   = c.id AND c.estado = 'activo'
        LEFT  JOIN ciclos   ci ON c.ciclo_id   = ci.id
        LEFT  JOIN docentes d  ON c.docente_id = d.id
       WHERE m.estudiante_id = ?
       ORDER BY c.nombre`,
      [req.estudiante.id]
    );
    res.json({ success: true, data: horario, total: horario.length });
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
  }
};

// ─────────────────────────────────────────────
// MIS ASISTENCIAS
// ─────────────────────────────────────────────
exports.getMisAsistencias = async (req, res) => {
  try {
    const [asistencias] = await promisePool.query(
      `SELECT a.id, a.fecha, a.estado, c.nombre as curso_nombre, c.id as curso_id
       FROM asistencias a
       INNER JOIN matriculas m ON a.matricula_id = m.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.estudiante_id = ?
       ORDER BY a.fecha DESC`,
      [req.estudiante.id]
    );
    res.json({ success: true, data: asistencias, total: asistencias.length });
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
  }
};


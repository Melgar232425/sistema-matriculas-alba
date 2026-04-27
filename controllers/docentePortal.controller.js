const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

exports.loginDocente = async (req, res) => {
  try {
    const { email, dni } = req.body;
    if (!email || !dni) return res.status(400).json({ success: false, message: 'Falta correo o DNI' });

    const [rows] = await promisePool.query(
      `SELECT id, codigo, nombres, apellidos, email, especialidad 
       FROM docentes 
       WHERE email = ? AND dni = ? AND estado = 'activo'`,
      [email, dni]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Correo o DNI incorrecto, o cuenta inactiva' });
    }

    const docente = rows[0];
    const token = jwt.sign(
      { id: docente.id, rol: 'docente', nombres: docente.nombres },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ success: true, data: { token, docente } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCursos = async (req, res) => {
  try {
    const [cursos] = await promisePool.query(
      `SELECT c.id, c.nombre, c.horario, c.estado, ci.nombre as ciclo_nombre 
       FROM cursos c
       LEFT JOIN ciclos ci ON c.ciclo_id = ci.id
       WHERE c.docente_id = ? AND c.estado = 'activo'`,
      [req.docente.id]
    );
    res.json({ success: true, data: cursos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEstudiantesAsistencia = async (req, res) => {
  try {
    const { id } = req.params; // id del curso
    const { fecha } = req.query; // fecha (YYYY-MM-DD)

    // Validar que el curso pertenezca al docente
    const [curso] = await promisePool.query('SELECT id FROM cursos WHERE id = ? AND docente_id = ?', [id, req.docente.id]);
    if (curso.length === 0) return res.status(403).json({ success: false, message: 'Curso no pertenece al docente' });

    // Obtener los estudiantes matriculados en este curso y que su matrícula esté activa o terminada... asumiendo activa
    // Obtener los estudiantes matriculados en este curso (únicos usando subconsulta limpia)
    const [estudiantes] = await promisePool.query(
      `SELECT 
        m.id as matricula_id, 
        e.id as estudiante_id, 
        e.codigo, 
        e.nombres, 
        e.apellidos, 
        COALESCE(a.estado, 'no_registrado') as estado_asistencia,
        (SELECT COUNT(*) FROM asistencias WHERE matricula_id = m.id AND estado = 'ausente') as total_faltas
       FROM (
         SELECT MAX(id) as id, estudiante_id 
         FROM matriculas 
         WHERE curso_id = ? AND estado_matricula = 'activa' 
         GROUP BY estudiante_id
       ) m_latest
       JOIN matriculas m ON m.id = m_latest.id
       JOIN estudiantes e ON m.estudiante_id = e.id
       LEFT JOIN asistencias a ON a.matricula_id = m.id AND a.fecha = ?
       ORDER BY e.apellidos ASC`,
      [id, fecha]
    );
    
    res.json({ success: true, data: estudiantes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.marcarAsistencia = async (req, res) => {
  try {
    const { curso_id } = req.params;
    const { matricula_id, fecha, estado } = req.body;

    // Verificar permiso
    const [curso] = await promisePool.query('SELECT id FROM cursos WHERE id = ? AND docente_id = ?', [curso_id, req.docente.id]);
    if (curso.length === 0) return res.status(403).json({ success: false, message: 'Permiso denegado' });

    // Insertar o Actualizar
    await promisePool.query(
      `INSERT INTO asistencias (matricula_id, fecha, estado) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE estado = ?`,
      [matricula_id, fecha, estado, estado]
    );

    res.json({ success: true, message: 'Asistencia registrada' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

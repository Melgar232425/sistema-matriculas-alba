const { promisePool } = require('../config/database');
const { parsearHorario, hayCruce } = require('../utils/scheduleValidator');

// Generar código de matrícula automático
const generarCodigoMatricula = async () => {
  try {
    const [rows] = await promisePool.query(
      'SELECT codigo FROM matriculas ORDER BY id DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return 'MAT-0001';
    }

    const ultimoCodigo = rows[0].codigo;
    const numero = parseInt(ultimoCodigo.split('-')[1]) + 1;
    return `MAT-${numero.toString().padStart(4, '0')}`;
  } catch (error) {
    throw error;
  }
};

// Obtener todas las matrículas
exports.obtenerTodas = async (req, res) => {
  try {
    const { estado_pago, estado_matricula } = req.query;
    let query = `
      SELECT m.*, 
             e.codigo as estudiante_codigo, e.nombres, e.apellidos, e.dni,
             c.codigo as curso_codigo, c.nombre as curso_nombre, c.nivel, c.estado as curso_estado
      FROM matriculas m
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      INNER JOIN cursos c ON m.curso_id = c.id
      WHERE c.estado = 'activo'
    `;
    const params = [];

    if (estado_pago) {
      query += ' AND m.estado_pago = ?';
      params.push(estado_pago);
    }

    if (estado_matricula) {
      query += ' AND m.estado_matricula = ?';
      params.push(estado_matricula);
    }

    query += ' ORDER BY m.fecha_matricula DESC';

    const [matriculas] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: matriculas,
      total: matriculas.length
    });
  } catch (error) {
    console.error('Error al obtener matrículas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener matrículas',
      error: error.message
    });
  }
};

// Obtener matrícula por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [matriculas] = await promisePool.query(
      `SELECT m.*, 
              e.codigo as estudiante_codigo, e.nombres, e.apellidos, e.dni,
              c.codigo as curso_codigo, c.nombre as curso_nombre, c.nivel, c.horario
       FROM matriculas m
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    if (matriculas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula no encontrada'
      });
    }

    res.json({
      success: true,
      data: matriculas[0]
    });
  } catch (error) {
    console.error('Error al obtener matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener matrícula',
      error: error.message
    });
  }
};

// Crear nueva matrícula
exports.crear = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      estudiante_id,
      curso_id,
      fecha_matricula,
      observaciones
    } = req.body;

    // Validar campos requeridos
    if (!estudiante_id || !curso_id || !fecha_matricula) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // Verificar que el estudiante existe y está activo
    const [estudiante] = await connection.query(
      'SELECT id FROM estudiantes WHERE id = ? AND estado = ?',
      [estudiante_id, 'activo']
    );

    if (estudiante.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Estudiante no encontrado o inactivo'
      });
    }

    // Verificar que el curso existe y tiene cupos disponibles
    const [curso] = await connection.query(
      'SELECT id, precio, cupos_disponibles, horario FROM cursos WHERE id = ? AND estado = ?',
      [curso_id, 'activo']
    );

    if (curso.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Curso no encontrado o inactivo'
      });
    }

    if (curso[0].cupos_disponibles <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No hay cupos disponibles para este curso'
      });
    }

    // Verificar que el estudiante no esté ya matriculado en este curso
    const [matriculaExistente] = await connection.query(
      'SELECT id FROM matriculas WHERE estudiante_id = ? AND curso_id = ? AND estado_matricula = ?',
      [estudiante_id, curso_id, 'activa']
    );

    if (matriculaExistente.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'El estudiante ya está matriculado en este curso'
      });
    }

    // Verificar CRUCES DE HORARIO del estudiante
    if (curso[0].horario) {
      const horarioNuevoParsed = parsearHorario(curso[0].horario);

      if (horarioNuevoParsed) {
        // Obtener los horarios de los cursos donde ya está matriculado
        const [cursosActuales] = await connection.query(
          `SELECT c.nombre, c.horario 
           FROM matriculas m
           JOIN cursos c ON m.curso_id = c.id
           WHERE m.estudiante_id = ? AND m.estado_matricula = 'activa' AND c.estado = 'activo'`,
          [estudiante_id]
        );

        for (const cursoRegistrado of cursosActuales) {
          if (cursoRegistrado.horario) {
            const horarioRegistradoParsed = parsearHorario(cursoRegistrado.horario);
            if (horarioRegistradoParsed && hayCruce(horarioNuevoParsed, horarioRegistradoParsed)) {
              await connection.rollback();
              return res.status(400).json({
                success: false,
                message: `Cruce de horario: El estudiante ya está matriculado en "${cursoRegistrado.nombre}" que se dicta en el horario: ${cursoRegistrado.horario}`
              });
            }
          }
        }
      }
    }

    // Generar código de matrícula
    const codigo = await generarCodigoMatricula();

    // Insertar matrícula
    const [result] = await connection.query(
      `INSERT INTO matriculas 
       (codigo, estudiante_id, curso_id, fecha_matricula, monto_total, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codigo, estudiante_id, curso_id, fecha_matricula, curso[0].precio, observaciones]
    );

    // Reducir cupos disponibles del curso
    await connection.query(
      'UPDATE cursos SET cupos_disponibles = cupos_disponibles - 1 WHERE id = ?',
      [curso_id]
    );

    await connection.commit();

    // Obtener la matrícula creada
    const [nuevaMatricula] = await promisePool.query(
      `SELECT m.*, 
              e.codigo as estudiante_codigo, e.nombres, e.apellidos,
              c.codigo as curso_codigo, c.nombre as curso_nombre
       FROM matriculas m
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Matrícula registrada exitosamente',
      data: nuevaMatricula[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear matrícula',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Actualizar matrícula
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    // Verificar si la matrícula existe
    const [existente] = await promisePool.query(
      'SELECT id FROM matriculas WHERE id = ?',
      [id]
    );

    if (existente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula no encontrada'
      });
    }

    // Actualizar matrícula
    await promisePool.query(
      'UPDATE matriculas SET observaciones = ? WHERE id = ?',
      [observaciones, id]
    );

    // Obtener la matrícula actualizada
    const [matriculaActualizada] = await promisePool.query(
      `SELECT m.*, 
              e.codigo as estudiante_codigo, e.nombres, e.apellidos,
              c.codigo as curso_codigo, c.nombre as curso_nombre
       FROM matriculas m
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Matrícula actualizada exitosamente',
      data: matriculaActualizada[0]
    });
  } catch (error) {
    console.error('Error al actualizar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar matrícula',
      error: error.message
    });
  }
};

// Cancelar matrícula
exports.cancelar = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Verificar si la matrícula existe
    const [matricula] = await connection.query(
      'SELECT id, curso_id, estado_matricula FROM matriculas WHERE id = ?',
      [id]
    );

    if (matricula.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Matrícula no encontrada'
      });
    }

    if (matricula[0].estado_matricula !== 'activa') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'La matrícula ya no está activa'
      });
    }

    // Cambiar estado a retirada
    await connection.query(
      'UPDATE matriculas SET estado_matricula = ? WHERE id = ?',
      ['retirada', id]
    );

    // Aumentar cupos disponibles del curso
    await connection.query(
      'UPDATE cursos SET cupos_disponibles = cupos_disponibles + 1 WHERE id = ?',
      [matricula[0].curso_id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Matrícula cancelada exitosamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al cancelar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar matrícula',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Obtener pagos de una matrícula
exports.obtenerPagos = async (req, res) => {
  try {
    const { id } = req.params;

    const [pagos] = await promisePool.query(
      'SELECT * FROM pagos WHERE matricula_id = ? ORDER BY fecha_pago DESC',
      [id]
    );

    res.json({
      success: true,
      data: pagos,
      total: pagos.length
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};
// Obtener todas las matrículas de un estudiante
exports.obtenerPorEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;

    const [matriculas] = await promisePool.query(
      `SELECT m.*, 
              c.codigo as curso_codigo, c.nombre as curso_nombre, c.nivel, c.horario
       FROM matriculas m
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.estudiante_id = ?
       ORDER BY m.fecha_matricula DESC`,
      [estudiante_id]
    );

    res.json({
      success: true,
      data: matriculas,
      total: matriculas.length
    });
  } catch (error) {
    console.error('Error al obtener matrículas del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener matrículas del estudiante',
      error: error.message
    });
  }
};

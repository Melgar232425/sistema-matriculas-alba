// Controlador para gestión de estudiantes
const { promisePool } = require('../config/database');
const { sendWelcomeEmail } = require('../utils/emailService');

// Función para generar código basado en ID
const formatearCodigoEstudiante = (id) => {
  return `EST-${id.toString().padStart(4, '0')}`;
};

// Obtener todos los estudiantes
exports.obtenerTodos = async (req, res) => {
  try {
    const { estado } = req.query;
    let query = 'SELECT * FROM estudiantes';
    const params = [];

    if (estado) {
      query += ' WHERE estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY apellidos, nombres';

    const [estudiantes] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: estudiantes,
      total: estudiantes.length
    });
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes',
      error: error.message
    });
  }
};

// Obtener estudiante por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [estudiantes] = await promisePool.query(
      'SELECT * FROM estudiantes WHERE id = ?',
      [id]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    res.json({
      success: true,
      data: estudiantes[0]
    });
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiante',
      error: error.message
    });
  }
};

// Buscar estudiante por DNI
exports.buscarPorDni = async (req, res) => {
  try {
    const { dni } = req.params;

    const [estudiantes] = await promisePool.query(
      'SELECT * FROM estudiantes WHERE dni = ?',
      [dni]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    res.json({
      success: true,
      data: estudiantes[0]
    });
  } catch (error) {
    console.error('Error al buscar estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar estudiante',
      error: error.message
    });
  }
};

// Crear nuevo estudiante
exports.crear = async (req, res) => {
  try {
    const {
      dni,
      nombres,
      apellidos,
      fecha_nacimiento,
      direccion,
      telefono,
      email,
      telefono_apoderado,
      nombre_apoderado
    } = req.body;

    // Validar campos requeridos
    if (!dni || !nombres || !apellidos || !fecha_nacimiento) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: DNI, nombres, apellidos y fecha de nacimiento'
      });
    }

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'El DNI debe tener exactamente 8 dígitos numéricos'
      });
    }

    // Validar formato de nombres y apellidos (solo letras y espacios)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombres) || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidos)) {
      return res.status(400).json({
        success: false,
        message: 'Nombres y apellidos solo deben contener letras'
      });
    }

    // Validar formato de email si se proporciona
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo electrónico es inválido'
      });
    }

    // Validar teléfono si se proporciona (9 dígitos)
    if (telefono && !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener 9 dígitos'
      });
    }

    // Verificar si el DNI ya existe Y está activo en estudiantes
    const [existente] = await promisePool.query(
      'SELECT id, estado FROM estudiantes WHERE dni = ?',
      [dni]
    );

    if (existente.length > 0 && existente[0].estado === 'activo') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un estudiante activo con ese DNI'
      });
    }

    // Verificar si el DNI pertenece a un docente
    const [enDocentes] = await promisePool.query(
      'SELECT id, nombres, apellidos FROM docentes WHERE dni = ?',
      [dni]
    );

    if (enDocentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `El DNI ya pertenece al docente: ${enDocentes[0].nombres} ${enDocentes[0].apellidos}`
      });
    }

    // Si existe pero está inactivo, reactivarlo en lugar de crear uno nuevo
    if (existente.length > 0 && existente[0].estado === 'inactivo') {
      await promisePool.query(
        `UPDATE estudiantes 
     SET nombres = ?, apellidos = ?, fecha_nacimiento = ?, direccion = ?, 
         telefono = ?, email = ?, telefono_apoderado = ?, nombre_apoderado = ?,
         estado = 'activo'
     WHERE dni = ?`,
        [nombres, apellidos, fecha_nacimiento, direccion, telefono,
          email, telefono_apoderado, nombre_apoderado, dni]
      );

      const [estudianteReactivado] = await promisePool.query(
        'SELECT * FROM estudiantes WHERE dni = ?',
        [dni]
      );

      // Enviar correo de bienvenida (Seguimiento asíncrono)
      if (estudianteReactivado[0].email) {
        sendWelcomeEmail(estudianteReactivado[0]).catch(e => console.error('Error enviando email:', e));
      }

      return res.status(200).json({
        success: true,
        message: 'Estudiante reactivado exitosamente',
        data: estudianteReactivado[0]
      });
    }
    if (existente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un estudiante con ese DNI'
      });
    }

    // Insertar estudiante con código temporal
    const [result] = await promisePool.query(
      `INSERT INTO estudiantes 
       (codigo, dni, nombres, apellidos, fecha_nacimiento, direccion, telefono, 
        email, telefono_apoderado, nombre_apoderado, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
      ['TEMP', dni, nombres, apellidos, fecha_nacimiento, direccion,
        telefono, email, telefono_apoderado, nombre_apoderado]
    );

    const estudianteId = result.insertId;
    const codigoFinal = formatearCodigoEstudiante(estudianteId);

    // Actualizar con el código real
    await promisePool.query(
      'UPDATE estudiantes SET codigo = ? WHERE id = ?',
      [codigoFinal, estudianteId]
    );

    // Obtener el estudiante creado
    const [nuevoEstudiante] = await promisePool.query(
      'SELECT * FROM estudiantes WHERE id = ?',
      [result.insertId]
    );

    // Enviar correo de bienvenida al estudiante (ejecución asíncrona para no retrasar respuesta)
    if (nuevoEstudiante[0].email) {
      sendWelcomeEmail(nuevoEstudiante[0]).catch(e => console.error('Error enviando email de bienvenida:', e));
    }

    res.status(201).json({
      success: true,
      message: 'Estudiante registrado exitosamente',
      data: nuevoEstudiante[0]
    });
  } catch (error) {
    console.error('Error al crear estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear estudiante',
      error: error.message
    });
  }
};

// Actualizar estudiante
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dni,
      nombres,
      apellidos,
      fecha_nacimiento,
      direccion,
      telefono,
      email,
      telefono_apoderado,
      nombre_apoderado,
      estado
    } = req.body;

    // Validaciones de formato
    if (dni && !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'El DNI debe tener exactamente 8 dígitos numéricos'
      });
    }

    if (nombres && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombres)) {
      return res.status(400).json({
        success: false,
        message: 'Nombres solo deben contener letras'
      });
    }

    if (apellidos && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidos)) {
      return res.status(400).json({
        success: false,
        message: 'Apellidos solo deben contener letras'
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo electrónico es inválido'
      });
    }

    if (telefono && !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener 9 dígitos'
      });
    }

    // Verificar si el estudiante existe
    const [existente] = await promisePool.query(
      'SELECT id, email FROM estudiantes WHERE id = ?',
      [id]
    );

    if (existente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Verificar si el DNI ya existe en otro estudiante
    if (dni) {
      const [dniExistente] = await promisePool.query(
        'SELECT id FROM estudiantes WHERE dni = ? AND id != ?',
        [dni, id]
      );

      if (dniExistente.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro estudiante con ese DNI'
        });
      }

      // Verificar si el DNI pertenece a un docente
      const [enDocentes] = await promisePool.query(
        'SELECT id, nombres, apellidos FROM docentes WHERE dni = ?',
        [dni]
      );

      if (enDocentes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `El DNI ya pertenece al docente: ${enDocentes[0].nombres} ${enDocentes[0].apellidos}`
        });
      }
    }

    // Actualizar estudiante
    await promisePool.query(
      `UPDATE estudiantes 
       SET dni = ?, nombres = ?, apellidos = ?, fecha_nacimiento = ?, 
           direccion = ?, telefono = ?, email = ?, 
           telefono_apoderado = ?, nombre_apoderado = ?, estado = ?
       WHERE id = ?`,
      [dni, nombres, apellidos, fecha_nacimiento, direccion, telefono,
        email, telefono_apoderado, nombre_apoderado, estado || 'activo', id]
    );

    // Obtener el estudiante actualizado
    const [estudianteActualizado] = await promisePool.query(
      'SELECT * FROM estudiantes WHERE id = ?',
      [id]
    );

    // Enviar notificación al nuevo correo si fue actualizado
    if (email && email !== existente[0].email) {
        try {
            sendWelcomeEmail(estudianteActualizado[0]).catch(e => console.error('Error enviando email actualizado:', e));
        } catch (e) {
            console.error('Error al preparar email de actualización:', e);
        }
    }

    res.json({
      success: true,
      message: 'Estudiante actualizado exitosamente',
      data: estudianteActualizado[0]
    });
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estudiante',
      error: error.message
    });
  }
};

// Eliminar estudiante (cambiar estado a inactivo)
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el estudiante existe
    const [existente] = await promisePool.query(
      'SELECT id FROM estudiantes WHERE id = ?',
      [id]
    );

    if (existente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Cambiar estado a inactivo en lugar de borrarlo
    await promisePool.query(
      'UPDATE estudiantes SET estado = ? WHERE id = ?',
      ['inactivo', id]
    );

    res.json({
      success: true,
      message: 'Estudiante desactivado exitosamente y mantenido en la lista'
    });
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar estudiante',
      error: error.message
    });
  }
};

// Obtener matrículas de un estudiante
exports.obtenerMatriculas = async (req, res) => {
  try {
    const { id } = req.params;

    const [matriculas] = await promisePool.query(
      `SELECT m.*, c.nombre as curso_nombre, c.nivel, c.horario
       FROM matriculas m
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.estudiante_id = ? AND c.estado = 'activo'
       ORDER BY m.fecha_matricula DESC`,
      [id]
    );

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

// Obtener historial completo de un estudiante (datos, matriculas, pagos)
exports.obtenerHistorial = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Obtener datos del estudiante
    const [estudiante] = await promisePool.query(
      'SELECT * FROM estudiantes WHERE id = ?',
      [id]
    );

    if (estudiante.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // 2. Obtener matrículas con cursos
    const [matriculas] = await promisePool.query(
      `SELECT m.*, c.nombre as curso_nombre, c.nivel, c.horario, ci.nombre as ciclo_nombre
       FROM matriculas m
       INNER JOIN cursos c ON m.curso_id = c.id
       LEFT JOIN ciclos ci ON c.ciclo_id = ci.id
       WHERE m.estudiante_id = ? AND ci.estado = 'activo'
       ORDER BY m.fecha_matricula DESC`,
      [id]
    );

    // 3. Obtener pagos
    const [pagos] = await promisePool.query(
      `SELECT p.*, m.codigo as matricula_codigo, c.nombre as curso_nombre
       FROM pagos p
       INNER JOIN matriculas m ON p.matricula_id = m.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.estudiante_id = ? AND c.estado = 'activo'
       ORDER BY p.fecha_pago DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        datosPersonales: estudiante[0],
        matriculas: matriculas,
        pagos: pagos
      }
    });

  } catch (error) {
    console.error('Error al obtener historial del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial del estudiante',
      error: error.message
    });
  }
};

// Controlador para gestión de pagos
const { promisePool } = require('../config/database');

// Generar código de pago automático
const generarCodigoPago = async () => {
  try {
    const [rows] = await promisePool.query(
      'SELECT codigo FROM pagos ORDER BY id DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      return 'PAG-0001';
    }
    
    const ultimoCodigo = rows[0].codigo;
    const numero = parseInt(ultimoCodigo.split('-')[1]) + 1;
    return `PAG-${numero.toString().padStart(4, '0')}`;
  } catch (error) {
    throw error;
  }
};

// Actualizar estado de pago de la matrícula
const actualizarEstadoPagoMatricula = async (connection, matricula_id) => {
  try {
    // Obtener monto total y monto pagado
    const [matricula] = await connection.query(
      'SELECT monto_total, monto_pagado FROM matriculas WHERE id = ?',
      [matricula_id]
    );
    
    if (matricula.length > 0) {
      const { monto_total, monto_pagado } = matricula[0];
      let estado_pago = 'pendiente';
      
      if (monto_pagado >= monto_total) {
        estado_pago = 'pagado';
      } else if (monto_pagado > 0) {
        estado_pago = 'parcial';
      }
      
      await connection.query(
        'UPDATE matriculas SET estado_pago = ? WHERE id = ?',
        [estado_pago, matricula_id]
      );
    }
  } catch (error) {
    throw error;
  }
};

// Obtener todos los pagos
exports.obtenerTodos = async (req, res) => {
  try {
    const [pagos] = await promisePool.query(
      `SELECT p.*, 
              m.codigo as matricula_codigo,
              e.nombres, e.apellidos, e.dni,
              c.nombre as curso_nombre
       FROM pagos p
       INNER JOIN matriculas m ON p.matricula_id = m.id
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       INNER JOIN cursos c ON m.curso_id = c.id
       ORDER BY p.fecha_pago DESC`
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

// Obtener pago por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [pagos] = await promisePool.query(
      `SELECT p.*, 
              m.codigo as matricula_codigo,
              e.nombres, e.apellidos, e.dni,
              c.nombre as curso_nombre
       FROM pagos p
       INNER JOIN matriculas m ON p.matricula_id = m.id
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    
    if (pagos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: pagos[0]
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
};

// Registrar nuevo pago
exports.registrar = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      matricula_id,
      monto,
      fecha_pago,
      metodo_pago,
      numero_recibo,
      observaciones,
      usuario_registro
    } = req.body;
    
    // Validar campos requeridos
    if (!matricula_id || !monto || !fecha_pago || !metodo_pago) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }
    
    // Verificar que la matrícula existe
    const [matricula] = await connection.query(
      'SELECT id, monto_total, monto_pagado FROM matriculas WHERE id = ?',
      [matricula_id]
    );
    
    if (matricula.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Matrícula no encontrada'
      });
    }
    
    // Verificar que el monto no exceda lo pendiente
    const montoPendiente = matricula[0].monto_total - matricula[0].monto_pagado;
    if (monto > montoPendiente) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `El monto excede lo pendiente (S/ ${montoPendiente.toFixed(2)})`
      });
    }
    
    // Generar código de pago
    const codigo = await generarCodigoPago();
    
    // Insertar pago
    const [result] = await connection.query(
      `INSERT INTO pagos 
       (codigo, matricula_id, monto, fecha_pago, metodo_pago, numero_recibo, 
        observaciones, usuario_registro) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, matricula_id, monto, fecha_pago, metodo_pago, numero_recibo, 
       observaciones, usuario_registro]
    );
    
    // Actualizar monto pagado en la matrícula
    await connection.query(
      'UPDATE matriculas SET monto_pagado = monto_pagado + ? WHERE id = ?',
      [monto, matricula_id]
    );
    
    // Actualizar estado de pago de la matrícula
    await actualizarEstadoPagoMatricula(connection, matricula_id);
    
    await connection.commit();
    
    // Obtener el pago creado
    const [nuevoPago] = await promisePool.query(
      `SELECT p.*, 
              m.codigo as matricula_codigo,
              e.nombres, e.apellidos
       FROM pagos p
       INNER JOIN matriculas m ON p.matricula_id = m.id
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: nuevoPago[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Anular pago
exports.anular = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Obtener información del pago
    const [pago] = await connection.query(
      'SELECT id, matricula_id, monto FROM pagos WHERE id = ?',
      [id]
    );
    
    if (pago.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }
    
    // Eliminar pago
    await connection.query('DELETE FROM pagos WHERE id = ?', [id]);
    
    // Actualizar monto pagado en la matrícula
    await connection.query(
      'UPDATE matriculas SET monto_pagado = monto_pagado - ? WHERE id = ?',
      [pago[0].monto, pago[0].matricula_id]
    );
    
    // Actualizar estado de pago de la matrícula
    await actualizarEstadoPagoMatricula(connection, pago[0].matricula_id);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Pago anulado exitosamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al anular pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al anular pago',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

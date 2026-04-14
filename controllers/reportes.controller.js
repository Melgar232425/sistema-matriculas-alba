// Controlador para reportes y estadísticas
const { promisePool } = require('../config/database');

// Dashboard con estadísticas generales
exports.dashboard = async (req, res) => {
  try {
    // Total de estudiantes activos
    const [totalEstudiantes] = await promisePool.query(
      'SELECT COUNT(*) as total FROM estudiantes WHERE estado = ?',
      ['activo']
    );

    // Total de cursos activos
    const [totalCursos] = await promisePool.query(
      'SELECT COUNT(*) as total FROM cursos WHERE estado = ?',
      ['activo']
    );

    // Total de matrículas activas
    const [totalMatriculas] = await promisePool.query(
      'SELECT COUNT(*) as total FROM matriculas WHERE estado_matricula = ?',
      ['activa']
    );

    // Ingresos totales (Histórico)
    const [ingresosTotales] = await promisePool.query(
      'SELECT COALESCE(SUM(monto), 0) as total FROM pagos'
    );

    // Ingresos del mes actual
    const [ingresosMes] = await promisePool.query(
      `SELECT COALESCE(SUM(monto), 0) as total 
       FROM pagos 
       WHERE MONTH(fecha_pago) = MONTH(CURRENT_DATE()) 
       AND YEAR(fecha_pago) = YEAR(CURRENT_DATE())`
    );

    // Estudiantes con pagos pendientes
    const [estudiantesMorosos] = await promisePool.query(
      `SELECT COUNT(DISTINCT m.estudiante_id) as total 
       FROM matriculas m 
       WHERE m.estado_matricula = 'activa' 
       AND m.estado_pago IN ('pendiente', 'parcial')`
    );

    // Matrículas totales
    const [matriculasTotales] = await promisePool.query(
      "SELECT COUNT(*) as total FROM matriculas WHERE estado_matricula = 'activa'"
    );

    // Matrículas del mes actual
    const [matriculasMes] = await promisePool.query(
      `SELECT COUNT(*) as total 
       FROM matriculas 
       WHERE MONTH(fecha_matricula) = MONTH(CURRENT_DATE()) 
       AND YEAR(fecha_matricula) = YEAR(CURRENT_DATE())`
    );

    // Cursos con mayor matrícula
    const [cursosPopulares] = await promisePool.query(
      `SELECT c.nombre, c.nivel, COUNT(m.id) as total_matriculas
       FROM cursos c
       LEFT JOIN matriculas m ON c.id = m.curso_id AND m.estado_matricula = 'activa'
       WHERE c.estado = 'activo'
       GROUP BY c.id, c.nombre, c.nivel
       ORDER BY total_matriculas DESC
       LIMIT 5`
    );

    // Últimos 5 pagos realizados (Actividad Reciente)
    const [pagosRecientes] = await promisePool.query(
      `SELECT p.id, p.monto, p.fecha_pago, p.metodo_pago, e.nombres, e.apellidos, c.nombre as curso_nombre
       FROM pagos p
       INNER JOIN matriculas m ON p.matricula_id = m.id
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       INNER JOIN cursos c ON m.curso_id = c.id
       ORDER BY p.fecha_pago DESC, p.id DESC
       LIMIT 5`
    );

    // Distribución por métodos de pago (Histórico completo - Cantidad de transacciones)
    const [metodosPago] = await promisePool.query(
      `SELECT metodo_pago as name, COUNT(*) as value
       FROM pagos
       GROUP BY metodo_pago`
    );

    res.json({
      success: true,
      data: {
        totalEstudiantes: totalEstudiantes[0].total,
        totalCursos: totalCursos[0].total,
        totalMatriculas: totalMatriculas[0].total,
        ingresosMes: parseFloat(ingresosMes[0].total).toFixed(2),
        ingresosTotales: parseFloat(ingresosTotales[0].total).toFixed(2),
        estudiantesMorosos: estudiantesMorosos[0].total,
        matriculasMes: matriculasMes[0].total,
        matriculasTotales: matriculasTotales[0].total,
        cursosPopulares: cursosPopulares,
        pagosRecientes: pagosRecientes,
        metodosPago: metodosPago.map(item => ({
          ...item,
          value: parseInt(item.value || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Reporte de estudiantes por curso
exports.estudiantesPorCurso = async (req, res) => {
  try {
    const { curso_id } = req.query;

    let query = `
      SELECT c.codigo as curso_codigo, c.nombre as curso, c.nivel, c.horario,
             e.codigo as estudiante_codigo, e.dni, e.nombres, e.apellidos,
             e.telefono, e.email,
             m.codigo as matricula_codigo, m.fecha_matricula, m.estado_pago
      FROM matriculas m
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      INNER JOIN cursos c ON m.curso_id = c.id
      WHERE m.estado_matricula = 'activa'
    `;
    const params = [];

    if (curso_id) {
      query += ' AND c.id = ?';
      params.push(curso_id);
    }

    query += ' ORDER BY c.nombre, e.apellidos, e.nombres';

    const [estudiantes] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: estudiantes,
      total: estudiantes.length
    });
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte',
      error: error.message
    });
  }
};

// Reporte de ingresos por período
exports.ingresos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let query = `
      SELECT p.fecha_pago, p.codigo, p.monto, p.metodo_pago, p.numero_recibo,
             e.nombres, e.apellidos, e.dni,
             c.nombre as curso,
             m.codigo as matricula_codigo
      FROM pagos p
      INNER JOIN matriculas m ON p.matricula_id = m.id
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      INNER JOIN cursos c ON m.curso_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha_inicio) {
      query += ' AND DATE(p.fecha_pago) >= ?';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      query += ' AND DATE(p.fecha_pago) <= ?';
      params.push(fecha_fin);
    }

    query += ' ORDER BY p.fecha_pago DESC';

    const [pagos] = await promisePool.query(query, params);

    // Calcular totales
    const total = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);

    // Totales por método de pago
    const totalesPorMetodo = pagos.reduce((acc, pago) => {
      if (!acc[pago.metodo_pago]) {
        acc[pago.metodo_pago] = 0;
      }
      acc[pago.metodo_pago] += parseFloat(pago.monto);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        pagos: pagos,
        total: total.toFixed(2),
        totalesPorMetodo: totalesPorMetodo,
        cantidad: pagos.length
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte de ingresos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de ingresos',
      error: error.message
    });
  }
};

// Reporte de morosidad
exports.morosidad = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let query = `SELECT e.codigo as estudiante_codigo, e.dni, e.nombres, e.apellidos,
              e.telefono, e.telefono_apoderado, e.nombre_apoderado,
              GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') as curso,
              GROUP_CONCAT(DISTINCT c.nivel SEPARATOR ', ') as nivel,
              SUM(CAST(IFNULL(m.monto_total, 0) AS DECIMAL(10,2))) as monto_total, 
              SUM(CAST(IFNULL(m.monto_pagado, 0) AS DECIMAL(10,2))) as monto_pagado,
              SUM(CAST(IFNULL(m.monto_total, 0) AS DECIMAL(10,2)) - CAST(IFNULL(m.monto_pagado, 0) AS DECIMAL(10,2))) as monto_pendiente,
              MIN(m.fecha_matricula) as fecha_matricula
       FROM matriculas m
       INNER JOIN estudiantes e ON m.estudiante_id = e.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.estado_matricula = 'activa'
       AND m.estado_pago IN ('pendiente', 'parcial')`;

    const params = [];

    // Ignoramos fecha_inicio y fecha_fin para morosidad porque la morosidad 
    // debe ser el total histórico adeudado por el estudiante.
    // FILTROS DE FECHAS REMOVIDOS DEL REPORTE DE MOROSIDAD.

    query += ' GROUP BY e.id ORDER BY monto_pendiente DESC, e.apellidos, e.nombres';

    const [morosos] = await promisePool.query(query, params);

    // Calcular total de deuda
    const totalDeuda = morosos.reduce((sum, m) => sum + parseFloat(m.monto_pendiente), 0);

    res.json({
      success: true,
      data: {
        morosos: morosos,
        totalMorosos: morosos.length,
        totalDeuda: totalDeuda.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte de morosidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de morosidad',
      error: error.message
    });
  }
};

// Reporte de matrículas por período
exports.matriculasPorPeriodo = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let query = `
      SELECT m.codigo, m.fecha_matricula, m.monto_total, m.estado_pago, m.estado_matricula,
             e.codigo as estudiante_codigo, e.dni, e.nombres, e.apellidos,
             c.codigo as curso_codigo, c.nombre as curso, c.nivel
      FROM matriculas m
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      INNER JOIN cursos c ON m.curso_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha_inicio) {
      query += ' AND DATE(m.fecha_matricula) >= ?';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      query += ' AND DATE(m.fecha_matricula) <= ?';
      params.push(fecha_fin);
    }

    query += ' ORDER BY m.fecha_matricula DESC';

    const [matriculas] = await promisePool.query(query, params);

    // Estadísticas
    const totalMatriculas = matriculas.length;
    const matriculasActivas = matriculas.filter(m => m.estado_matricula === 'activa').length;
    const totalIngresos = matriculas.reduce((sum, m) => sum + parseFloat(m.monto_total), 0);

    res.json({
      success: true,
      data: {
        matriculas: matriculas,
        estadisticas: {
          total: totalMatriculas,
          activas: matriculasActivas,
          totalIngresos: totalIngresos.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte de matrículas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de matrículas',
      error: error.message
    });
  }
};

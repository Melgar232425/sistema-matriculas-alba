const { promisePool } = require('../config/database');

// Obtener todos los seguimientos de un estudiante específico
exports.obtenerPorEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const [seguimientos] = await promisePool.query(
      'SELECT * FROM seguimientos WHERE estudiante_id = ? ORDER BY fecha DESC',
      [estudianteId]
    );
    res.json({ 
        success: true, 
        data: seguimientos 
    });
  } catch (error) {
    console.error('Error al obtener seguimientos:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Error al obtener seguimientos', 
        error: error.message 
    });
  }
};

// Guardar una nueva observación de tutoría
exports.crear = async (req, res) => {
  try {
    const { estudiante_id, comentario, contacto_padre } = req.body;
    
    if (!estudiante_id || !comentario) {
        return res.status(400).json({
            success: false,
            message: 'El ID del estudiante y el comentario son obligatorios'
        });
    }

    const [result] = await promisePool.query(
      'INSERT INTO seguimientos (estudiante_id, comentario, contacto_padre) VALUES (?, ?, ?)',
      [estudiante_id, comentario, contacto_padre]
    );

    res.status(201).json({ 
        success: true, 
        message: 'Seguimiento registrado exitosamente', 
        id: result.insertId 
    });
  } catch (error) {
    console.error('Error al guardar seguimiento:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Error al guardar seguimiento', 
        error: error.message 
    });
  }
};

const { promisePool } = require('../config/database');

// Obtener todos los ciclos
exports.obtenerTodos = async (req, res) => {
    try {
        const [ciclos] = await promisePool.query('SELECT * FROM ciclos ORDER BY created_at DESC');
        res.json({
            success: true,
            data: ciclos
        });
    } catch (error) {
        console.error('Error al obtener ciclos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener ciclos' });
    }
};

// Crear ciclo
exports.crear = async (req, res) => {
    try {
        const { nombre, fecha_inicio, fecha_fin } = req.body;
        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO ciclos (nombre, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?)',
            [nombre, fecha_inicio || null, fecha_fin || null, 'activo']
        );

        res.status(201).json({
            success: true,
            message: 'Ciclo creado exitosamente',
            data: { id: result.insertId, nombre, estado: 'activo' }
        });
    } catch (error) {
        console.error('Error al crear ciclo:', error);
        res.status(500).json({ success: false, message: 'Error al crear ciclo' });
    }
};

// Cambiar estado del ciclo y sus cursos
exports.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // 'activo' o 'inactivo'

        if (!['activo', 'inactivo'].includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado no válido' });
        }

        // Iniciar transacción para asegurar que ambos cambios ocurran
        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Actualizar estado del ciclo
            await connection.query('UPDATE ciclos SET estado = ? WHERE id = ?', [estado, id]);

            // 2. Actualizar estado de todos los cursos pertenecientes a ese ciclo
            await connection.query('UPDATE cursos SET estado = ? WHERE ciclo_id = ?', [estado, id]);

            await connection.commit();
            res.json({
                success: true,
                message: `Ciclo y todos sus cursos marcados como ${estado}`
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al cambiar estado del ciclo:', error);
        res.status(500).json({ success: false, message: 'Error al procesar el cambio de estado' });
    }
};

// Eliminar ciclo (BORRADO TOTAL EN CASCADA: Pagos -> Matrículas -> Cursos -> Ciclo)
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Borrar PAGOS asociados a las matrículas de los cursos de este ciclo
            await connection.query(`
                DELETE FROM pagos 
                WHERE matricula_id IN (
                    SELECT id FROM matriculas 
                    WHERE curso_id IN (SELECT id FROM cursos WHERE ciclo_id = ?)
                )`, [id]);

            // 2. Borrar MATRÍCULAS asociadas a los cursos de este ciclo
            await connection.query(`
                DELETE FROM matriculas 
                WHERE curso_id IN (SELECT id FROM cursos WHERE ciclo_id = ?)
            `, [id]);

            // 3. Borrar CURSOS asociados al ciclo
            await connection.query('DELETE FROM cursos WHERE ciclo_id = ?', [id]);
            
            // 4. Finalmente borrar el CICLO
            await connection.query('DELETE FROM ciclos WHERE id = ?', [id]);

            await connection.commit();
            res.json({ success: true, message: 'Ciclo y todos sus datos asociados eliminados permanentemente' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al eliminar ciclo completo:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el ciclo y sus datos' });
    }
};

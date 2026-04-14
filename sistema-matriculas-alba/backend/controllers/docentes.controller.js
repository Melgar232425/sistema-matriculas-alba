const { promisePool } = require('../config/database');
const { successResponse, createdResponse, errorResponse } = require('../utils/apiResponse');
const { sendTeacherWelcomeEmail } = require('../utils/emailService');

/**
 * Función interna para formatear código de docente
 * @param {number} id 
 * @returns {string}
 */
const formatearCodigoDocente = (id) => {
    return `DOC-${id.toString().padStart(3, '0')}`;
};

/**
 * Obtener todos los docentes
 */
exports.obtenerTodos = async (req, res, next) => {
    try {
        const { estado } = req.query;
        let query = 'SELECT id, codigo, nombres, apellidos, dni, telefono, email, especialidad, estado, fecha_registro FROM docentes';
        const params = [];

        if (estado) {
            query += ' WHERE estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY apellidos, nombres';

        const [docentes] = await promisePool.query(query, params);
        return successResponse(res, docentes, 'Docentes obtenidos correctamente');
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener un docente por su ID
 */
exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [docentes] = await promisePool.query('SELECT * FROM docentes WHERE id = ?', [id]);

        if (docentes.length === 0) {
            return errorResponse(res, 'Docente no encontrado', 404);
        }

        return successResponse(res, docentes[0]);
    } catch (error) {
        next(error);
    }
};

/**
 * Crear un nuevo docente
 * Implementa lógica anti-duplicados y generación de código segura
 */
exports.crear = async (req, res, next) => {
    try {
        const { nombres, apellidos, dni, telefono, email, especialidad } = req.body;

        // Validaciones básicas
        if (!nombres || !apellidos || !dni || !email) {
            return errorResponse(res, 'Faltan campos obligatorios', 400);
        }

        // Transacción no es necesaria para un simple insert, pero usamos lógica POST-INSERT para el código
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Verificar duplicados (DNI o Correo)
            const [existentes] = await connection.query(
                'SELECT id FROM docentes WHERE dni = ? OR email = ?',
                [dni, email]
            );

            if (existentes.length > 0) {
                await connection.release();
                return errorResponse(res, 'El DNI o correo ya está registrado', 400);
            }

            // 2. Insertar con código temporal
            const [result] = await connection.query(
                `INSERT INTO docentes (codigo, nombres, apellidos, dni, telefono, email, especialidad) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['TEMP', nombres, apellidos, dni, telefono, email, especialidad]
            );

            const lastId = result.insertId;
            const codigoFinal = formatearCodigoDocente(lastId);

            // 3. Actualizar con código real
            await connection.query('UPDATE docentes SET codigo = ? WHERE id = ?', [codigoFinal, lastId]);

            // 4. Enviar email de bienvenida de forma asíncrona
            try {
                const docenteInfo = { codigo: codigoFinal, nombres, apellidos, dni, telefono, email, especialidad };
                sendTeacherWelcomeEmail(docenteInfo).catch(e => console.error('Error email docente:', e));
            } catch (e) {
                console.error('Error al preparar email de docente:', e);
            }

            return createdResponse(res, { id: lastId, codigo: codigoFinal }, 'Docente registrado exitosamente');
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar datos de un docente
 */
exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, dni, telefono, email, especialidad, estado } = req.body;

        // Verificar existencia y obtener mail antiguo
        const [existente] = await promisePool.query('SELECT id, email FROM docentes WHERE id = ?', [id]);
        if (existente.length === 0) return errorResponse(res, 'Docente no encontrado', 404);

        // Actualización optimizada
        await promisePool.query(
            `UPDATE docentes 
             SET nombres = ?, apellidos = ?, dni = ?, telefono = ?, email = ?, especialidad = ?, estado = ?
             WHERE id = ?`,
            [nombres, apellidos, dni, telefono, email, especialidad, estado || 'activo', id]
        );

        if (email && email !== existente[0].email) {
            try {
                const [docenteActualizado] = await promisePool.query('SELECT * FROM docentes WHERE id = ?', [id]);
                sendTeacherWelcomeEmail(docenteActualizado[0]).catch(e => console.error('Error enviando email actualizado a docente:', e));
            } catch (e) {
                console.error('Error al preparar email de actualización:', e);
            }
        }

        return successResponse(res, null, 'Docente actualizado correctamente');
    } catch (error) {
        next(error);
    }
};

/**
 * Desactivar docente (Soft Delete)
 * Verifica que no tenga cursos activos antes de proceder
 */
exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Validar existencia
        const [docente] = await promisePool.query('SELECT id, nombres FROM docentes WHERE id = ?', [id]);
        if (docente.length === 0) return errorResponse(res, 'Docente no encontrado', 404);

        // 2. Validar cursos activos (Regla de negocio Senior)
        const [cursos] = await promisePool.query(
            'SELECT id FROM cursos WHERE docente_id = ? AND estado = ?',
            [id, 'activo']
        );

        if (cursos.length > 0) {
            return errorResponse(res, `No se puede desactivar al docente porque tiene ${cursos.length} curso(s) activo(s)`, 400);
        }

        // 3. Desactivación
        await promisePool.query('UPDATE docentes SET estado = "inactivo" WHERE id = ?', [id]);
        
        return successResponse(res, null, 'Docente desactivado correctamente');
    } catch (error) {
        next(error);
    }
};

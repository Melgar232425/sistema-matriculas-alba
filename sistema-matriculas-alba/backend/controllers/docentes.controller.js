// Controlador para gestión de docentes
const { promisePool } = require('../config/database');

// Generar código de docente
const generarCodigoDocente = async () => {
    try {
        const [rows] = await promisePool.query(
            'SELECT codigo FROM docentes ORDER BY id DESC LIMIT 1'
        );

        if (rows.length === 0) {
            return 'DOC-001';
        }

        const ultimoCodigo = rows[0].codigo;
        const numero = parseInt(ultimoCodigo.split('-')[1]) + 1;
        return `DOC-${numero.toString().padStart(3, '0')}`;
    } catch (error) {
        throw error;
    }
};

// Obtener todos los docentes
exports.obtenerTodos = async (req, res) => {
    try {
        const { estado } = req.query;
        let query = 'SELECT * FROM docentes';
        const params = [];

        if (estado) {
            query += ' WHERE estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY apellidos, nombres';

        const [docentes] = await promisePool.query(query, params);

        res.json({
            success: true,
            data: docentes,
            total: docentes.length
        });
    } catch (error) {
        console.error('Error al obtener docentes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener docentes',
            error: error.message
        });
    }
};

// Obtener docente por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [docentes] = await promisePool.query(
            'SELECT * FROM docentes WHERE id = ?',
            [id]
        );

        if (docentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Docente no encontrado'
            });
        }

        res.json({
            success: true,
            data: docentes[0]
        });
    } catch (error) {
        console.error('Error al obtener docente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener docente',
            error: error.message
        });
    }
};

// Crear nuevo docente
exports.crear = async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            dni,
            telefono,
            email,
            especialidad
        } = req.body;

        // Validar campos requeridos
        if (!nombres || !apellidos || !dni || !email) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombres, apellidos, DNI y correo electrónico'
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

        // Validar formato de email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

        // Verificar si DNI o email ya existen en docentes
        const [existentes] = await promisePool.query(
            'SELECT id FROM docentes WHERE dni = ? OR email = ?',
            [dni, email]
        );

        if (existentes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El DNI o correo electrónico ya está registrado por otro docente'
            });
        }

        // Verificar si el DNI ya existe en estudiantes
        const [enEstudiantes] = await promisePool.query(
            'SELECT id, nombres, apellidos FROM estudiantes WHERE dni = ?',
            [dni]
        );

        if (enEstudiantes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `El DNI ya pertenece al estudiante: ${enEstudiantes[0].nombres} ${enEstudiantes[0].apellidos}`
            });
        }

        // Generar código
        const codigo = await generarCodigoDocente();

        // Insertar docente
        const [result] = await promisePool.query(
            `INSERT INTO docentes 
       (codigo, nombres, apellidos, dni, telefono, email, especialidad) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombres, apellidos, dni, telefono, email, especialidad]
        );

        // Obtener el docente creado
        const [nuevoDocente] = await promisePool.query(
            'SELECT * FROM docentes WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Docente registrado exitosamente',
            data: nuevoDocente[0]
        });
    } catch (error) {
        console.error('Error al registrar docente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar docente',
            error: error.message
        });
    }
};

// Actualizar docente
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombres,
            apellidos,
            dni,
            telefono,
            email,
            especialidad,
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

        // Verificar si el docente existe
        const [existente] = await promisePool.query(
            'SELECT id FROM docentes WHERE id = ?',
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Docente no encontrado'
            });
        }

        // Verificar si DNI o email pertenecen a otro docente
        const [duplicados] = await promisePool.query(
            'SELECT id FROM docentes WHERE (dni = ? OR email = ?) AND id != ?',
            [dni, email, id]
        );

        if (duplicados.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El DNI o correo electrónico ya está en uso por otro docente'
            });
        }

        // Verificar si el DNI existe en la tabla de estudiantes
        const [enEstudiantes] = await promisePool.query(
            'SELECT id, nombres, apellidos FROM estudiantes WHERE dni = ?',
            [dni]
        );

        if (enEstudiantes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `El DNI ya pertenece al estudiante: ${enEstudiantes[0].nombres} ${enEstudiantes[0].apellidos}`
            });
        }

        // Actualizar docente
        await promisePool.query(
            `UPDATE docentes 
       SET nombres = ?, apellidos = ?, dni = ?, 
            telefono = ?, email = ?, especialidad = ?, estado = ?
       WHERE id = ?`,
            [nombres, apellidos, dni, telefono, email, especialidad, estado || 'activo', id]
        );

        // Obtener el docente actualizado
        const [docenteActualizado] = await promisePool.query(
            'SELECT * FROM docentes WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Docente actualizado exitosamente',
            data: docenteActualizado[0]
        });
    } catch (error) {
        console.error('Error al actualizar docente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar docente',
            error: error.message
        });
    }
};

// Eliminar docente (cambiar estado a inactivo)
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el docente existe
        const [existente] = await promisePool.query(
            'SELECT id FROM docentes WHERE id = ?',
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Docente no encontrado'
            });
        }

        // Verificar si tiene cursos activos asignados
        const [cursosAsignados] = await promisePool.query(
            'SELECT id, nombre FROM cursos WHERE docente_id = ? AND estado = ?',
            [id, 'activo']
        );

        if (cursosAsignados.length > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede desactivar a este docente porque tiene ${cursosAsignados.length} curso(s) activo(s) asignado(s) (Ej: ${cursosAsignados[0].nombre}). Redirija o cancele los cursos del docente primero.`,
                cursos: cursosAsignados
            });
        }

        // Cambiar estado a inactivo
        await promisePool.query(
            'UPDATE docentes SET estado = ? WHERE id = ?',
            ['inactivo', id]
        );

        res.json({
            success: true,
            message: 'Docente desactivado exitosamente'
        });
    } catch (error) {
        console.error('Error al desactivar docente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar docente',
            error: error.message
        });
    }
};

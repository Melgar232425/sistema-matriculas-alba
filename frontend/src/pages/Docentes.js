import React, { useState, useEffect } from 'react';
import { docentesAPI } from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Docentes = () => {
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [docenteActual, setDocenteActual] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dniDuplicado, setDniDuplicado] = useState(false);

    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: '',
        especialidad: '',
        estado: 'activo'
    });

    useEffect(() => {
        cargarDocentes();
    }, []);

    // Effect for auto-generating email based on names and surnames
    useEffect(() => {
        if (!modoEdicion && (formData.nombres || formData.apellidos)) {
            const generarEmail = (nombres, apellidos) => {
                const primerNombre = nombres.trim().split(' ')[0].toLowerCase();

                // Handle case where apellidos might be empty
                let primerApellido = '';
                if (apellidos.trim()) {
                    primerApellido = apellidos.trim().split(' ')[0].toLowerCase();
                }

                // Remove accents
                const cleanNombre = primerNombre ? primerNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
                const cleanApellido = primerApellido ? primerApellido.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';

                if (cleanNombre && cleanApellido) {
                    return `${cleanNombre}.${cleanApellido}@academiaalba.com`;
                } else if (cleanNombre) {
                    return `${cleanNombre}@academiaalba.com`;
                }
                return '';
            };

            const nuevoEmail = generarEmail(formData.nombres, formData.apellidos);
            // Only update if it generates a complete email to avoid overwriting manually cleared fields immediately
            if (nuevoEmail !== formData.email) {
                setFormData(prev => ({ ...prev, email: nuevoEmail }));
            }
        }
    }, [formData.nombres, formData.apellidos, modoEdicion, formData.email]);

    const cargarDocentes = async () => {
        try {
            setLoading(true);
            const response = await docentesAPI.getAll({ estado: 'activo' });
            setDocentes(response.data.data);
        } catch (error) {
            console.error('Error al cargar docentes:', error);
            toast.error('Error al cargar docentes');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = async (e) => {
        const { name, value } = e.target;
        
        // Validaciones preventivas en tiempo real
        if (name === 'dni') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 8) {
                setFormData({ ...formData, [name]: onlyNums });
                
                if (onlyNums.length === 8 && !modoEdicion) {
                    const existenteLocal = docentes.find(d => d.dni === onlyNums);
                    if (existenteLocal) {
                        setDniDuplicado(`¡DNI duplicado! Ya existe el docente: ${existenteLocal.nombres} ${existenteLocal.apellidos}`);
                        toast.error(`❌ ¡DNI duplicado! Ya existe el docente: ${existenteLocal.nombres} ${existenteLocal.apellidos}`, { icon: '' });
                    }
                } else {
                    setDniDuplicado(false);
                }
            }
            return;
        }

        if (name === 'telefono') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 9) {
                setFormData({ ...formData, [name]: onlyNums });
            }
            return;
        }

        if (name === 'nombres' || name === 'apellidos') {
            const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
            setFormData({ ...formData, [name]: onlyLetters });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones finales
        if (formData.dni.length !== 8) {
            toast.error('❌ El DNI debe tener exactamente 8 números.', { icon: '' });
            return;
        }

        if (formData.telefono && formData.telefono.length !== 9) {
            toast.error('❌ El teléfono debe tener 9 números (9XXXXXXXX).', { icon: '' });
            return;
        }

        if (dniDuplicado) {
            toast.error('❌ No se puede guardar: el DNI ya está registrado.', { icon: '' });
            return;
        }

        try {
            if (modoEdicion) {
                await docentesAPI.update(docenteActual.id, formData);
                toast.success('Docente actualizado exitosamente');
            } else {
                await docentesAPI.create(formData);
                toast.success('Docente registrado exitosamente');
            }
            cerrarModal();
            cargarDocentes();
        } catch (error) {
            console.error('Error:', error);
            toast.error(`❌ ${error.response?.data?.message || 'Error al guardar docente'}`, { icon: '' });
        }
    };

    const abrirModalNuevo = () => {
        setModoEdicion(false);
        setDocenteActual(null);
        setDniDuplicado(false);
        setFormData({
            nombres: '',
            apellidos: '',
            dni: '',
            telefono: '',
            email: '',
            especialidad: '',
            estado: 'activo'
        });
        setShowModal(true);
    };

    const abrirModalEditar = (docente) => {
        setModoEdicion(true);
        setDocenteActual(docente);
        setFormData({
            nombres: docente.nombres,
            apellidos: docente.apellidos,
            dni: docente.dni,
            telefono: docente.telefono || '',
            email: docente.email,
            especialidad: docente.especialidad || '',
            estado: docente.estado || 'activo'
        });
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setModoEdicion(false);
        setDocenteActual(null);
        setDniDuplicado(false);
    };

    const eliminarDocente = async (id) => {
        if (window.confirm('¿Estás seguro de desactivar este docente?')) {
            try {
                await docentesAPI.delete(id);
                toast.success('Docente desactivado exitosamente');
                cargarDocentes();
            } catch (error) {
                console.error('Error:', error);
                toast.error(error.response?.data?.message || 'Error al desactivar docente');
            }
        }
    };

    return (
        <div className="main-content">
            <div className="card">
                <div className="card-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
                    <h2 className="card-title">Lista de Docentes</h2>
                    <button className="btn btn-primary" onClick={abrirModalNuevo}>
                        <FaPlus /> Nuevo Docente
                    </button>
                </div>

                {/* Buscador Premium de Docentes */}
                <div style={{
                    padding: '0 24px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div className="search-box" style={{ flex: '1 1 300px', maxWidth: '100%', marginBottom: 0 }}>
                        <FaSearch style={{ left: '14px', right: 'auto' }} />
                        <input
                            type="text"
                            placeholder="Buscar docente por nombre o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-control"
                            style={{ paddingLeft: '42px', borderRadius: '50px', backgroundColor: '#f8fafc' }}
                        />
                        {searchTerm && (
                            <FaTimes
                                onClick={() => setSearchTerm('')}
                                style={{ cursor: 'pointer', color: '#ef4444' }}
                            />
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: searchTerm ? '#4361ee' : '#cbd5e1'
                        }}></span>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                            {searchTerm ? `Resultado: ${docentes.filter(docente => {
                                const term = searchTerm.toLowerCase();
                                return (
                                    docente.nombres.toLowerCase().includes(term) ||
                                    docente.apellidos.toLowerCase().includes(term) ||
                                    docente.dni.includes(term)
                                );
                            }).length} docente(s)` : `Total: ${docentes.length} docente(s) registrado(s)`}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Apellidos y Nombres</th>
                                    <th>DNI</th>
                                    <th>Contacto</th>
                                    <th>Especialidad</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docentes.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                            No hay docentes registrados
                                        </td>
                                    </tr>
                                ) : (
                                    docentes.filter(docente => {
                                        if (searchTerm === '') return true;
                                        const term = searchTerm.toLowerCase();
                                        return (
                                            docente.nombres.toLowerCase().includes(term) ||
                                            docente.apellidos.toLowerCase().includes(term) ||
                                            docente.dni.includes(term)
                                        );
                                    }).map((docente) => (
                                        <tr key={docente.id}>
                                            <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                                                {docente.codigo}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{docente.apellidos}</div>
                                                <div style={{ fontSize: '0.9em', color: '#64748b' }}>{docente.nombres}</div>
                                            </td>
                                            <td>{docente.dni}</td>
                                            <td>
                                                <div style={{ fontSize: '0.9em' }}>{docente.email}</div>
                                                {docente.telefono && (
                                                    <div style={{ fontSize: '0.85em', color: '#64748b' }}>
                                                        {docente.telefono}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{docente.especialidad || '-'}</td>
                                            <td>
                                                <span className={`badge ${docente.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                                                    {docente.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn-icon btn-icon-edit"
                                                        onClick={() => abrirModalEditar(docente)}
                                                        title="Editar docente"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-icon-delete"
                                                        onClick={() => eliminarDocente(docente.id)}
                                                        title="Desactivar docente"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de formulario */}
            {showModal && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {modoEdicion ? 'Editar Docente' : 'Nuevo Docente'}
                            </h2>
                            <button className="modal-close" onClick={cerrarModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombres</label>
                                        <input
                                            type="text"
                                            name="nombres"
                                            value={formData.nombres}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Apellidos</label>
                                        <input
                                            type="text"
                                            name="apellidos"
                                            value={formData.apellidos}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>DNI</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            value={formData.dni}
                                            onChange={handleInputChange}
                                            maxLength="8"
                                            pattern="\d{8}"
                                            title="El DNI debe tener 8 dígitos"
                                            required
                                            style={dniDuplicado ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                                        />
                                        {dniDuplicado && (
                                            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>
                                                {dniDuplicado}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Correo Electrónico (Auto-generado)</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            required
                                            style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                                            title="El correo se genera automáticamente a partir del nombre y no puede ser editado manualmente"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Especialidad</label>
                                        <select
                                            name="especialidad"
                                            value={formData.especialidad}
                                            onChange={handleInputChange}
                                            required
                                            className="form-control"
                                        >
                                            <option value="">Seleccionar especialidad</option>
                                            <option value="Ingeniería / Ciencias Exactas">Ingeniería / Ciencias Exactas</option>
                                            <option value="Matemática / Física">Matemática / Física</option>
                                            <option value="Ciencias de la Salud / Biología">Ciencias de la Salud / Biología</option>
                                            <option value="Biología / Química">Biología / Química</option>
                                            <option value="Letras / Comunicación">Letras / Comunicación</option>
                                            <option value="Lengua / Literatura">Lengua / Literatura</option>
                                            <option value="Ciencias Sociales / Humanidades">Ciencias Sociales / Humanidades</option>
                                            <option value="Historia y Geografía">Historia y Geografía</option>
                                        </select>
                                    </div>
                                </div>

                                {modoEdicion && (
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Estado</label>
                                            <select
                                                name="estado"
                                                value={formData.estado}
                                                onChange={handleInputChange}
                                            >
                                                <option value="activo">Activo</option>
                                                <option value="inactivo">Inactivo</option>
                                            </select>
                                        </div>
                                        <div className="form-group"></div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                    <button type="button" className="btn btn-outline" onClick={cerrarModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Docentes;

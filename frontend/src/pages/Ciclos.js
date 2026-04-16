import React, { useState, useEffect } from 'react';
import { ciclosAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaCalendarAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const Ciclos = () => {
    const [ciclos, setCiclos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCiclo, setNewCiclo] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    const handlePreset = (e) => {
        const tipo = e.target.value;
        if (!tipo) return;

        const year = new Date().getFullYear();
        let name = '';
        let start = '';
        let end = '';

        if (tipo === 'verano') {
            name = `Ciclo Verano ${year}`;
            start = `${year}-01-05`;
            end = `${year}-02-28`;
        } else if (tipo === 'ciclo1') {
            name = `Ciclo I ${year}`;
            start = `${year}-04-01`;
            end = `${year}-07-31`;
        } else if (tipo === 'ciclo2') {
            name = `Ciclo II ${year}`;
            start = `${year}-08-15`;
            end = `${year}-12-15`;
        }

        setNewCiclo({
            nombre: name,
            fecha_inicio: start,
            fecha_fin: end
        });
    };

    const cargarCiclos = async () => {
        try {
            setLoading(true);
            const response = await ciclosAPI.getAll();
            if (response.data.success) {
                setCiclos(response.data.data);
            }
        } catch (error) {
            toast.error('Error al cargar ciclos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCiclos();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await ciclosAPI.create(newCiclo);
            if (response.data.success) {
                toast.success('Ciclo creado exitosamente');
                setShowModal(false);
                setNewCiclo({ nombre: '', fecha_inicio: '', fecha_fin: '' });
                cargarCiclos();
            }
        } catch (error) {
            toast.error(`❌ ${error.response?.data?.message || 'Error al crear ciclo'}`, { icon: '' });
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
        const confirmMsg = newStatus === 'inactivo' 
            ? '¿Estás seguro de cerrar este ciclo? Se desactivarán todos los cursos asociados.' 
            : '¿Deseas abrir este ciclo? Se activarán todos los cursos asociados.';
            
        if (!window.confirm(confirmMsg)) return;

        try {
            const response = await ciclosAPI.toggleStatus(id, newStatus);
            if (response.data.success) {
                toast.success(response.data.message);
                cargarCiclos();
            }
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este ciclo? Solo se puede eliminar si no tiene cursos.')) return;
        try {
            const response = await ciclosAPI.delete(id);
            if (response.data.success) {
                toast.success('Ciclo eliminado');
                cargarCiclos();
            }
        } catch (error) {
            toast.error(`❌ ${error.response?.data?.message || 'Error al eliminar'}`, { icon: '' });
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        let update = { ...newCiclo, [name]: value };
        
        // Si cambia la fecha de inicio, calcular automáticamente 4 meses después
        if (name === 'fecha_inicio' && value) {
            const startDate = new Date(value);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 4);
            update.fecha_fin = endDate.toISOString().split('T')[0];
        }
        
        setNewCiclo(update);
    };

    return (
        <div className="main-content">
            <Navbar title="Ciclos Académicos" />

            <div className="card">
                <div className="card-header" style={{ flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2 className="card-title">Configuración de Ciclos</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                            Administra los periodos escolares y abre/cierra cursos en bloque.
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nuevo Ciclo
                    </button>
                </div>

                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-icon primary"><FaCalendarAlt /></div>
                        <div className="stat-info">
                            <h3>{ciclos.length}</h3>
                            <p>Total Ciclos</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success"><FaToggleOn /></div>
                        <div className="stat-info">
                            <h3>{ciclos.filter(c => c.estado === 'activo').length}</h3>
                            <p>Activos</p>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre del Ciclo</th>
                                <th>Inicio</th>
                                <th>Fin</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Cargando...</td></tr>
                            ) : ciclos.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No hay ciclos registrados</td></tr>
                            ) : (
                                ciclos.map(ciclo => (
                                    <tr key={ciclo.id}>
                                        <td style={{ fontWeight: '600' }}>{ciclo.nombre}</td>
                                        <td>{ciclo.fecha_inicio ? new Date(ciclo.fecha_inicio).toLocaleDateString() : '-'}</td>
                                        <td>{ciclo.fecha_fin ? new Date(ciclo.fecha_fin).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <span className={`badge ${ciclo.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                                                {ciclo.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="btn-icon"
                                                    style={{ 
                                                        backgroundColor: ciclo.estado === 'activo' ? '#fee2e2' : '#dcfce7',
                                                        color: ciclo.estado === 'activo' ? '#dc2626' : '#16a34a',
                                                        border: 'none'
                                                    }}
                                                    title={ciclo.estado === 'activo' ? 'Cerrar Ciclo' : 'Abrir Ciclo'}
                                                    onClick={() => handleToggleStatus(ciclo.id, ciclo.estado)}
                                                >
                                                    {ciclo.estado === 'activo' ? <FaToggleOn /> : <FaToggleOff />}
                                                </button>
                                                <button 
                                                    className="btn-icon"
                                                    style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: 'none' }}
                                                    title="Eliminar"
                                                    onClick={() => handleDelete(ciclo.id)}
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
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Crear Nuevo Ciclo Académico</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Plantilla de Ciclo (Opcional)</label>
                                <select 
                                    className="form-control" 
                                    onChange={handlePreset}
                                    style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}
                                >
                                    <option value="">-- Seleccionar para autocompletar --</option>
                                    <option value="verano">Verano (Enero - Febrero)</option>
                                    <option value="ciclo1">Ciclo I (Abril - Julio)</option>
                                    <option value="ciclo2">Ciclo II (Agosto - Diciembre)</option>
                                </select>
                                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                    Selecciona un periodo estándar para llenar las fechas automáticamente.
                                </p>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label>Nombre del Ciclo</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Ciclo Verano 2026"
                                        required 
                                        value={newCiclo.nombre}
                                        onChange={e => setNewCiclo({...newCiclo, nombre: e.target.value})}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Fecha de Inicio</label>
                                        <input 
                                            type="date" 
                                            name="fecha_inicio"
                                            required
                                            value={newCiclo.fecha_inicio}
                                            onChange={handleDateChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de Fin</label>
                                        <input 
                                            type="date" 
                                            name="fecha_fin"
                                            required
                                            value={newCiclo.fecha_fin}
                                            onChange={handleDateChange}
                                        />
                                    </div>
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '10px', 
                                    justifyContent: 'flex-end', 
                                    marginTop: '25px',
                                    borderTop: '1px solid #f1f5f9',
                                    paddingTop: '20px' 
                                }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Crear Ciclo
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

export default Ciclos;

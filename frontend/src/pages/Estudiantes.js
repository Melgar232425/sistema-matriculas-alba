import React, { useState, useEffect } from 'react';
import { estudiantesAPI } from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Estudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [historialData, setHistorialData] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [estudianteActual, setEstudianteActual] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [dniDuplicado, setDniDuplicado] = useState(false);
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: '',
    email: '',
    telefono_apoderado: '',
    nombre_apoderado: '',
    estado: 'activo'
  });

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      const response = await estudiantesAPI.getAll();
      setEstudiantes(response.data.data);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'dni' && !modoEdicion && value.length === 8) {
      try {
        const existente = estudiantes.find(est => est.dni === value);
        if (existente) {
          setDniDuplicado(true);
          toast.error(`❌ ¡DNI duplicado! Ya existe el estudiante: ${existente.nombres} ${existente.apellidos}`, { icon: '' });
        } else {
          setDniDuplicado(false);
        }
      } catch {
        setDniDuplicado(false);
      }
    } else if (name === 'dni') {
      setDniDuplicado(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dniDuplicado) {
      toast.error('❌ No se puede guardar: el DNI ya está registrado en el sistema.', { icon: '' });
      return;
    }
    try {
      if (modoEdicion) {
        await estudiantesAPI.update(estudianteActual.id, formData);
        toast.success('Estudiante actualizado exitosamente');
      } else {
        await estudiantesAPI.create(formData);
        toast.success('Estudiante registrado exitosamente');
      }
      cerrarModal();
      cargarEstudiantes();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`❌ ${error.response?.data?.message || 'Error al guardar estudiante'}`, { icon: '' });
    }
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setEstudianteActual(null);
    setDniDuplicado(false);
    setFormData({
      dni: '', nombres: '', apellidos: '', fecha_nacimiento: '', direccion: '',
      telefono: '', email: '', telefono_apoderado: '', nombre_apoderado: '', estado: 'activo'
    });
    setShowModal(true);
  };

  const abrirModalEditar = (estudiante) => {
    setModoEdicion(true);
    setEstudianteActual(estudiante);
    setFormData({
      dni: estudiante.dni,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      fecha_nacimiento: estudiante.fecha_nacimiento.split('T')[0],
      direccion: estudiante.direccion || '',
      telefono: estudiante.telefono || '',
      email: estudiante.email || '',
      telefono_apoderado: estudiante.telefono_apoderado || '',
      nombre_apoderado: estudiante.nombre_apoderado || '',
      estado: estudiante.estado || 'activo'
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setModoEdicion(false);
    setEstudianteActual(null);
    setDniDuplicado(false);
  };

  const abrirModalHistorial = async (id) => {
    try {
      setShowModalHistorial(true);
      const response = await estudiantesAPI.getHistorial(id);
      setHistorialData(response.data.data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar el historial del estudiante');
      setShowModalHistorial(false);
    }
  };

  const cerrarModalHistorial = () => {
    setShowModalHistorial(false);
    setHistorialData(null);
  };

  const eliminarEstudiante = async (id) => {
    if (window.confirm('¿Estás seguro de ELIMINAR PERMANENTEMENTE este estudiante?')) {
      try {
        const responseMatriculas = await estudiantesAPI.getMatriculas(id);
        if (responseMatriculas.data.data.length > 0) {
          toast.error('No se puede eliminar. El estudiante tiene matrículas registradas.');
          return;
        }
        await estudiantesAPI.delete(id);
        toast.success('Estudiante eliminado exitosamente');
        cargarEstudiantes();
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al eliminar estudiante');
      }
    }
  };

  const estudiantesFiltrados = estudiantes.filter(est =>
    est.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    est.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
    est.dni.includes(busqueda) ||
    est.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Lista de Estudiantes</h2>
          <button className="btn btn-primary" onClick={abrirModalNuevo}>
            <FaPlus /> Nuevo Estudiante
          </button>
        </div>

        <div style={{ padding: '0 32px 32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="search-box" style={{ flex: '1' }}>
            <FaSearch />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre, DNI o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-control"
              style={{ backgroundColor: '#f8fafc' }}
            />
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
             Total: {estudiantesFiltrados.length} estudiantes
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
                  <th>DNI</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map((estudiante) => (
                  <tr key={estudiante.id}>
                    <td>{estudiante.codigo}</td>
                    <td>{estudiante.dni}</td>
                    <td>{estudiante.nombres}</td>
                    <td>{estudiante.apellidos}</td>
                    <td><span className={`badge ${estudiante.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>{estudiante.estado}</span></td>
                    <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-icon btn-icon-view" onClick={() => abrirModalHistorial(estudiante.id)} title="Ver Historial"><FaEye /></button>
                      <button className="btn-icon btn-icon-edit" onClick={() => abrirModalEditar(estudiante)} title="Editar"><FaEdit /></button>
                      <button className="btn-icon btn-icon-delete" onClick={() => eliminarEstudiante(estudiante.id)} title="Eliminar"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modoEdicion ? 'Editar Estudiante' : 'Nuevo Estudiante'}</h2>
              <button className="modal-close" onClick={cerrarModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>DNI</label>
                    <input type="text" name="dni" value={formData.dni} onChange={handleInputChange} maxLength="8" required />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Nacimiento</label>
                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombres</label>
                    <input type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Apellidos</label>
                    <input type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Correo</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Apoderado</label>
                    <input type="text" name="nombre_apoderado" value={formData.nombre_apoderado} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Tel. Apoderado</label>
                    <input type="text" name="telefono_apoderado" value={formData.telefono_apoderado} onChange={handleInputChange} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showModalHistorial && (
        <div className="modal-overlay" onClick={cerrarModalHistorial}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Historial del Estudiante</h2>
              <button className="modal-close" onClick={cerrarModalHistorial}>×</button>
            </div>
            <div className="modal-body">
               {/* Simplified content for safety */}
               {historialData && (
                 <div>
                    <p><strong>DNI:</strong> {historialData.datosPersonales.dni}</p>
                    <p><strong>Nombre:</strong> {historialData.datosPersonales.nombres} {historialData.datosPersonales.apellidos}</p>
                    {/* Add more as needed */}
                 </div>
               )}
               <button className="btn btn-outline" onClick={cerrarModalHistorial}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estudiantes;

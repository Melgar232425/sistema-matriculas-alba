// Página de Estudiantes - CRUD completo
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { estudiantesAPI } from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Estudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [historialData, setHistorialData] = useState(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [tabActiva, setTabActiva] = useState('datos');
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

    // Verificar DNI duplicado en tiempo real (solo en modo creación)
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

    // Bloquear si el DNI ya existe
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
      setLoadingHistorial(true);
      setShowModalHistorial(true);
      setTabActiva('datos');
      const response = await estudiantesAPI.getHistorial(id);
      setHistorialData(response.data.data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar el historial del estudiante');
      setShowModalHistorial(false);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cerrarModalHistorial = () => {
    setShowModalHistorial(false);
    setHistorialData(null);
  };

  const eliminarEstudiante = async (id) => {
    if (window.confirm('¿Estás seguro de ELIMINAR PERMANENTEMENTE este estudiante? Esta acción NO se puede deshacer.')) {
      try {
        // Primero verificar que no tenga matrículas activas
        const responseMatriculas = await estudiantesAPI.getMatriculas(id);
        if (responseMatriculas.data.data.length > 0) {
          toast.error('No se puede eliminar. El estudiante tiene matrículas registradas.');
          return;
        }

        // Si no tiene matrículas, eliminar permanentemente
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
      <Navbar title="Gestión de Estudiantes" />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Lista de Estudiantes</h2>
          <button className="btn btn-primary" onClick={abrirModalNuevo}>
            <FaPlus /> Nuevo Estudiante
          </button>
        </div>

        {/* Buscador Premium */}
        <div style={{
          padding: '0 24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '20px'
        }}>
          <div className="search-box" style={{ flex: 1, maxWidth: '400px', marginBottom: 0 }}>
            <FaSearch style={{ left: '14px', right: 'auto' }} />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre, apellido, DNI o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '42px', borderRadius: '50px', backgroundColor: '#f8fafc' }}
            />
            {busqueda && (
              <FaTimes
                onClick={() => setBusqueda('')}
                style={{ cursor: 'pointer', color: '#ef4444' }}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: busqueda ? '#4361ee' : '#cbd5e1'
            }}></span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
              {busqueda ? `Resultado: ${estudiantesFiltrados.length} estudiante(s)` : `Total: ${estudiantes.length} estudiante(s) registrado(s)`}
            </span>
          </div>
        </div>

        {/* Tabla */}
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
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                      No se encontraron estudiantes
                    </td>
                  </tr>
                ) : (
                  estudiantesFiltrados.map((estudiante) => (
                    <tr key={estudiante.id}>
                      <td>{estudiante.codigo}</td>
                      <td>{estudiante.dni}</td>
                      <td>{estudiante.nombres}</td>
                      <td>{estudiante.apellidos}</td>
                      <td>{estudiante.telefono || '-'}</td>
                      <td>{estudiante.email || '-'}</td>
                      <td>
                        <span className={`badge ${estudiante.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                          {estudiante.estado}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon btn-icon-view"
                          onClick={() => abrirModalHistorial(estudiante.id)}
                          title="Ver Historial"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn-icon btn-icon-edit"
                          onClick={() => abrirModalEditar(estudiante)}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon btn-icon-delete"
                          onClick={() => eliminarEstudiante(estudiante.id)}
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
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
                {modoEdicion ? 'Editar Estudiante' : 'Nuevo Estudiante'}
              </h2>
              <button className="modal-close" onClick={cerrarModal}>×</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>DNI</label>
                    <input
                      type="text"
                      name="dni"
                      placeholder="8 dígitos"
                      value={formData.dni}
                      onChange={handleInputChange}
                      maxLength="8"
                      required
                      style={dniDuplicado ? { borderColor: '#ef4444', backgroundColor: '#fff1f2' } : {}}
                    />
                    {dniDuplicado && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: '700' }}>
                        ¡DNI ya registrado!
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Fecha de Nacimiento</label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nombres</label>
                    <input
                      type="text"
                      name="nombres"
                      placeholder="Nombres completos"
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
                      placeholder="Apellidos completos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Dirección de Residencia</label>
                  <input
                    type="text"
                    name="direccion"
                    placeholder="Calle, Número, Distrito..."
                    value={formData.direccion}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono Móvil</label>
                    <input
                      type="text"
                      name="telefono"
                      placeholder="Ej: 999 888 777"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="ejemplo@correo.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre del Apoderado</label>
                    <input
                      type="text"
                      name="nombre_apoderado"
                      placeholder="Padre, Madre o Tutor"
                      value={formData.nombre_apoderado}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Teléfono del Apoderado</label>
                    <input
                      type="text"
                      name="telefono_apoderado"
                      placeholder="Teléfono de contacto"
                      value={formData.telefono_apoderado}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {modoEdicion && (
                  <div className="form-group">
                    <label>Estado del Estudiante</label>
                    <select
                      name="estado"
                      value={formData.estado || 'activo'}
                      onChange={handleInputChange}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  justifyContent: 'flex-end', 
                  marginTop: '25px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '20px' 
                }}>
                  <button type="button" className="btn btn-outline" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modoEdicion ? 'Actualizar Estudiante' : 'Guardar Estudiante'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {showModalHistorial && (
        <div className="modal-overlay" onClick={cerrarModalHistorial}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                Historial del Estudiante
              </h2>
              <button className="modal-close" onClick={cerrarModalHistorial}>×</button>
            </div>

            {loadingHistorial ? (
              <div className="loading" style={{ margin: '40px 0' }}><div className="spinner"></div></div>
            ) : historialData ? (
              <div className="modal-body">
                <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                  <button
                    className={`tab-btn ${tabActiva === 'datos' ? 'active' : ''}`}
                    onClick={() => setTabActiva('datos')}
                    style={{ padding: '10px 20px', border: 'none', background: tabActiva === 'datos' ? '#f0f0f0' : 'transparent', cursor: 'pointer', fontWeight: tabActiva === 'datos' ? 'bold' : 'normal' }}
                  >
                    Datos Personales
                  </button>
                  <button
                    className={`tab-btn ${tabActiva === 'cursos' ? 'active' : ''}`}
                    onClick={() => setTabActiva('cursos')}
                    style={{ padding: '10px 20px', border: 'none', background: tabActiva === 'cursos' ? '#f0f0f0' : 'transparent', cursor: 'pointer', fontWeight: tabActiva === 'cursos' ? 'bold' : 'normal' }}
                  >
                    Cursos Matriculados
                  </button>
                  <button
                    className={`tab-btn ${tabActiva === 'pagos' ? 'active' : ''}`}
                    onClick={() => setTabActiva('pagos')}
                    style={{ padding: '10px 20px', border: 'none', background: tabActiva === 'pagos' ? '#f0f0f0' : 'transparent', cursor: 'pointer', fontWeight: tabActiva === 'pagos' ? 'bold' : 'normal' }}
                  >
                    Historial de Pagos
                  </button>
                </div>

                <div className="tab-content" style={{ minHeight: '300px' }}>
                  {tabActiva === 'datos' && (
                    <div className="datos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <p><strong>DNI:</strong> {historialData.datosPersonales.dni}</p>
                      <p><strong>Código:</strong> {historialData.datosPersonales.codigo}</p>
                      <p><strong>Nombres:</strong> {historialData.datosPersonales.nombres}</p>
                      <p><strong>Apellidos:</strong> {historialData.datosPersonales.apellidos}</p>
                      <p><strong>F. Nacimiento:</strong> {new Date(historialData.datosPersonales.fecha_nacimiento).toLocaleDateString()}</p>
                      <p><strong>Teléfono:</strong> {historialData.datosPersonales.telefono || '-'}</p>
                      <p><strong>Correo:</strong> {historialData.datosPersonales.email || '-'}</p>
                      <p><strong>Dirección:</strong> {historialData.datosPersonales.direccion || '-'}</p>
                      <p><strong>Apoderado:</strong> {historialData.datosPersonales.nombre_apoderado || '-'} ({historialData.datosPersonales.telefono_apoderado || '-'})</p>
                      <p><strong>Estado:</strong> <span className={`badge ${historialData.datosPersonales.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>{historialData.datosPersonales.estado}</span></p>
                    </div>
                  )}

                  {tabActiva === 'cursos' && (
                    <div className="table-container">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0 }}>Cursos del Estudiante</h4>
                      </div>
                      {historialData.matriculas.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px' }}>No hay matrículas registradas.</p>
                      ) : (
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Curso</th>
                              <th>Fecha Matrícula</th>
                              <th>Estado</th>
                              <th>Pago</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialData.matriculas.map(m => (
                              <tr key={m.id}>
                                <td>{m.codigo}</td>
                                <td>{m.curso_nombre} ({m.nivel})</td>
                                <td>{new Date(m.fecha_matricula).toLocaleDateString()}</td>
                                <td><span className={`badge ${m.estado === 'activa' ? 'badge-success' : m.estado === 'anulada' ? 'badge-danger' : 'badge-warning'}`}>{m.estado}</span></td>
                                <td>
                                  <span className={`badge ${m.estado_pago === 'pagado' ? 'badge-success' : m.estado_pago === 'parcial' ? 'badge-warning' : 'badge-danger'}`}>
                                    {m.estado_pago}
                                  </span>
                                  <br />
                                  <small>S/ {m.monto_pagado} de S/ {m.monto_total}</small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {tabActiva === 'pagos' && (
                    <div className="table-container">
                      {historialData.pagos.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px' }}>No hay pagos registrados.</p>
                      ) : (
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Recibo</th>
                              <th>Fecha</th>
                              <th>Curso</th>
                              <th>Método</th>
                              <th>Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialData.pagos.map(p => (
                              <tr key={p.id}>
                                <td>{p.numero_recibo || p.codigo}</td>
                                <td>{new Date(p.fecha_pago).toLocaleDateString()}</td>
                                <td>{p.curso_nombre}<br /><small>{p.matricula_codigo}</small></td>
                                <td><span className="badge badge-info">{p.metodo_pago}</span></td>
                                <td style={{ fontWeight: 'bold' }}>S/ {p.monto}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                  <button type="button" className="btn btn-outline" onClick={cerrarModalHistorial}>
                    Cerrar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}


    </div>
  );
};

export default Estudiantes;

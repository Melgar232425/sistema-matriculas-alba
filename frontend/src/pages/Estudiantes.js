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

  const formatName = (text) => {
    return text.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Validaciones preventivas en tiempo real
    if (name === 'dni') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 8) {
        setFormData({ ...formData, [name]: onlyNums });
        
        if (onlyNums.length === 8 && !modoEdicion) {
          const existente = estudiantes.find(est => est.dni === onlyNums);
          if (existente) {
            setDniDuplicado(true);
            toast.error(`❌ ¡DNI duplicado! Ya existe el estudiante: ${existente.nombres} ${existente.apellidos}`, { icon: '' });
          } else {
            setDniDuplicado(false);
          }
        } else {
          setDniDuplicado(false);
        }
      }
      return;
    }

    if (name === 'telefono' || name === 'telefono_apoderado') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 9) {
        setFormData({ ...formData, [name]: onlyNums });
      }
      return;
    }

    if (name === 'nombres' || name === 'apellidos' || name === 'nombre_apoderado') {
      const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
      setFormData({ ...formData, [name]: onlyLetters });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones finales antes de enviar
    if (formData.dni.length !== 8) {
      toast.error('❌ El DNI debe tener exactamente 8 números.', { icon: '' });
      return;
    }

    if (formData.nombres.trim().length < 2 || formData.apellidos.trim().length < 2) {
      toast.error('❌ Los nombres y apellidos deben ser válidos.', { icon: '' });
      return;
    }

    // Validación de Edad (Mínimo 12 años)
    const fechaNac = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
    
    if (edad < 12) {
      toast.error('❌ El estudiante debe tener al menos 12 años para el nivel preuniversitario.', { icon: '' });
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('❌ El formato del correo electrónico es inválido.', { icon: '' });
      return;
    }

    if (formData.telefono && formData.telefono_apoderado && formData.telefono === formData.telefono_apoderado) {
      toast.error('❌ El teléfono del apoderado debe ser diferente al del estudiante para una mejor comunicación.', { icon: '' });
      return;
    }

    if (formData.telefono && formData.telefono.length !== 9) {
      toast.error('❌ El teléfono del estudiante debe tener 9 números.', { icon: '' });
      return;
    }

    if (formData.telefono_apoderado && formData.telefono_apoderado.length !== 9) {
      toast.error('❌ El teléfono del apoderado debe tener 9 números.', { icon: '' });
      return;
    }

    if (dniDuplicado) {
      toast.error('❌ No se puede guardar: el DNI ya está registrado en el sistema.', { icon: '' });
      return;
    }
    try {
      // Autoformatear nombres antes de enviar
      const dataToSave = {
        ...formData,
        nombres: formatName(formData.nombres),
        apellidos: formatName(formData.apellidos),
        nombre_apoderado: formatName(formData.nombre_apoderado)
      };

      if (modoEdicion) {
        await estudiantesAPI.update(estudianteActual.id, dataToSave);
        toast.success('Estudiante actualizado exitosamente');
      } else {
        await estudiantesAPI.create(dataToSave);
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

        <div style={{
          padding: '0 15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div className="search-box" style={{ flex: '1 1 250px', maxWidth: '100%', marginBottom: 0 }}>
            <FaSearch style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar estudiante o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '45px', borderRadius: '50px', backgroundColor: '#f8fafc', height: '42px' }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            backgroundColor: '#f1f5f9', 
            padding: '4px 12px', 
            borderRadius: '20px',
            flexShrink: 0
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: busqueda ? '#4361ee' : '#cbd5e1'
            }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
               {estudiantesFiltrados.length} Registrados
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
            <div className="modal-body" style={{ padding: '0 30px 30px' }}>
               {historialData ? (
                 <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Sección 1: Datos Personales */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                       <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>DNI</label>
                          <div style={{ fontWeight: '700' }}>{historialData.datosPersonales.dni}</div>
                       </div>
                       <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Teléfono</label>
                          <div style={{ fontWeight: '700' }}>{historialData.datosPersonales.telefono || '—'}</div>
                       </div>
                       <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Correo</label>
                          <div style={{ fontWeight: '700' }}>{historialData.datosPersonales.email || '—'}</div>
                       </div>
                       <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Dirección</label>
                          <div style={{ fontWeight: '700' }}>{historialData.datosPersonales.direccion || '—'}</div>
                       </div>
                       <div>
                          <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Apoderado</label>
                          <div style={{ fontWeight: '700' }}>{historialData.datosPersonales.nombre_apoderado || '—'}</div>
                       </div>
                    </div>

                    {/* Sección 2: Matrículas y Pagos */}
                    <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ width: '4px', height: '16px', background: '#4361ee', borderRadius: '2px' }}></span>
                       RESUMEN DE CURSOS Y PAGOS
                    </h3>
                    
                    <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                             <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '12px', fontSize: '10px', color: '#94a3b8', textAlign: 'left' }}>CURSO / CICLO</th>
                                <th style={{ padding: '12px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>TOTAL</th>
                                <th style={{ padding: '12px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>PAGADO</th>
                                <th style={{ padding: '12px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>SALDO</th>
                                <th style={{ padding: '12px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>ESTADO</th>
                             </tr>
                          </thead>
                          <tbody>
                             {historialData.matriculas && historialData.matriculas.length > 0 ? (
                                historialData.matriculas.map((m, idx) => {
                                   const saldo = m.monto_total - m.monto_pagado;
                                   return (
                                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                         <td style={{ padding: '12px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: '700' }}>{m.curso}</div>
                                            <div style={{ fontSize: '10px', color: '#64748b' }}>{m.ciclo}</div>
                                         </td>
                                         <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>S/ {parseFloat(m.monto_total).toFixed(2)}</td>
                                         <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#10b981', fontWeight: '700' }}>S/ {parseFloat(m.monto_pagado).toFixed(2)}</td>
                                         <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: saldo > 0 ? '#ef4444' : '#10b981', fontWeight: '700' }}>S/ {saldo.toFixed(2)}</td>
                                         <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{ 
                                               padding: '4px 8px', 
                                               borderRadius: '6px', 
                                               fontSize: '10px', 
                                               fontWeight: '800',
                                               background: saldo <= 0 ? '#f0fdf4' : (m.monto_pagado > 0 ? '#fffbeb' : '#fef2f2'),
                                               color: saldo <= 0 ? '#10b981' : (m.monto_pagado > 0 ? '#f59e0b' : '#ef4444')
                                            }}>
                                               {saldo <= 0 ? 'PAGADO' : (m.monto_pagado > 0 ? 'PARCIAL' : 'PENDIENTE')}
                                            </span>
                                         </td>
                                      </tr>
                                   );
                                })
                             ) : (
                                <tr>
                                   <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No registra matrículas activas.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
                       <button className="btn btn-outline" onClick={cerrarModalHistorial}>Cerrar Historial</button>
                    </div>
                 </div>
               ) : (
                 <div className="loading"><div className="spinner"></div></div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estudiantes;

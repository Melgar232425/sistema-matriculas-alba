// Página de Matrículas
import React, { useState, useEffect } from 'react';
import { matriculasAPI, estudiantesAPI, cursosAPI } from '../services/api';
import { FaPlus, FaSearch, FaTimes, FaTrash, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Matriculas = () => {
  const [matriculas, setMatriculas] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDni, setFiltroDni] = useState('');
  const [buscadorDniModal, setBuscadorDniModal] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    estudiante_id: '',
    curso_id: '',
    fecha_matricula: new Date().toISOString().split('T')[0],
    observaciones: ''
  });
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [estudianteCursosModal, setEstudianteCursosModal] = useState(null);
  const [submitting, setSubmitting] = useState(false); // Punto 12 & U3
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resMatriculas, resEstudiantes, resCursos] = await Promise.all([
        matriculasAPI.getAll(),
        estudiantesAPI.getAll({ estado: 'activo' }),
        cursosAPI.getDisponibles()
      ]);
      const cursosActivos = resCursos.data.data || [];
      const idsCursosActivos = cursosActivos.map(c => c.id);
      
      // Filtrar matrículas para que solo queden las de cursos activos Y matrículas activas
      const matriculasFiltradas = (resMatriculas.data.data || []).filter(m => 
        idsCursosActivos.includes(m.curso_id) && m.estado_matricula === 'activa'
      );
      
      setMatriculas(matriculasFiltradas);
      setEstudiantes(resEstudiantes.data.data);
      setCursos(cursosActivos);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.estudiante_id || !formData.curso_id) {
        toast.error('❌ Seleccione un estudiante y un curso.', { icon: '' });
        return;
    }

    // 1. Validar Duplicado en el mismo Ciclo
    const cursoSel = cursos.find(c => c.id.toString() === formData.curso_id.toString());
    const estudianteYaMatriculado = matriculas.find(m => 
      m.estudiante_id.toString() === formData.estudiante_id.toString() && 
      m.curso_id.toString() === formData.curso_id.toString() &&
      m.ciclo_id === cursoSel?.ciclo_id
    );

    if (estudianteYaMatriculado) {
      toast.error(`❌ El estudiante ya está matriculado en "${cursoSel?.nombre}" para este ciclo.`, { icon: '' });
      return;
    }

    // 2. Validar Vacantes
    if (cursoSel && cursoSel.cupos_disponibles <= 0) {
      toast.error(`❌ ¡VACANTES AGOTADAS! No quedan cupos para el curso "${cursoSel.nombre}".`, { icon: '' });
      return;
    }

    // 3. Validar Restricción Financiera (Deuda Pendiente)
    const estudianteDeudas = matriculas.filter(m => 
        m.estudiante_id.toString() === formData.estudiante_id.toString() &&
        (m.monto_total - m.monto_pagado) > 0.01 // Margen para decimales
    );

    if (estudianteDeudas.length > 0) {
        toast.error(`❌ REGISTRO BLOQUEADO: El estudiante mantiene deuda(s) pendiente(s). Regularice los pagos anteriores antes de registrar una nueva matrícula.`, { duration: 6000 });
        return;
    }

    try {
      setSubmitting(true);
      await matriculasAPI.create(formData);
      toast.success('Matrícula registrada con éxito');
      setShowModal(false);
      setBuscadorDniModal('');
      cargarDatos();
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || 'Error al matricular'}`, { icon: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const eliminarMatricula = async (id, cursoNombre, alumnoNombre) => {
    if (window.confirm(`¿Estás seguro de eliminar la matrícula de "${alumnoNombre}" en el curso "${cursoNombre}"?`)) {
      try {
        await matriculasAPI.cancel(id);
        toast.success('Matrícula eliminada exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar matrícula:', error);
        toast.error(`❌ ${error.response?.data?.message || 'Error al eliminar matrícula'}`, { icon: '' });
      }
    }
  };


  const agruparMatriculas = (lista) => {
    const grupos = lista.reduce((acc, mat) => {
      // Failsafe: Si el backend no filtra, filtramos en el frontend
      // mat.curso_estado solo existe si el backend se reinició, de lo contrario mat.estado_matricula
      // Pero el usuario dice que "los cursos se eliminaron" (estado 'inactivo')
      if (mat.curso_estado && mat.curso_estado !== 'activo') return acc;

      if (!acc[mat.estudiante_id]) {
        acc[mat.estudiante_id] = {
          estudiante_id: mat.estudiante_id,
          codigo_estudiante: mat.estudiante_codigo,
          nombres: mat.nombres,
          apellidos: mat.apellidos,
          dni: mat.dni,
          matriculas: []
        };
      }
      acc[mat.estudiante_id].matriculas.push(mat);
      return acc;
    }, {});
    return Object.values(grupos);
  };

  const matriculasAgrupadas = agruparMatriculas(matriculas).filter(grupo =>
    !filtroDni || (grupo.dni && grupo.dni.includes(filtroDni))
  );

  const abrirNuevaMatriculaParaEstudiante = (estudiante) => {
    setFormData({
      ...formData,
      estudiante_id: estudiante.estudiante_id,
      observaciones: `Nueva matrícula para ${estudiante.nombres} ${estudiante.apellidos}`
    });
    setBuscadorDniModal(estudiante.dni || '');
    setCursoSeleccionado(null);
    setShowModal(true);
  };

  const handleCursoChange = (e) => {
    const id = e.target.value;
    const curso = cursos.find(c => c.id.toString() === id);
    setCursoSeleccionado(curso || null);
    setFormData({ ...formData, curso_id: id });
  };

  const cerrarModal = () => {
    setShowModal(false);
    setBuscadorDniModal('');
    setCursoSeleccionado(null);
    setFormData({
      estudiante_id: '',
      curso_id: '',
      fecha_matricula: new Date().toISOString().split('T')[0],
      observaciones: ''
    });
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="card-title">Lista de Estudiantes Matriculados</h2>
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              estudiante_id: '',
              curso_id: '',
              fecha_matricula: new Date().toISOString().split('T')[0],
              observaciones: ''
            });
            setCursoSeleccionado(null);
            setShowModal(true);
          }}>
            <FaPlus /> Nueva Matrícula
          </button>
        </div>

        {/* Buscador de Estudiantes con Estilo Premium y Responsivo */}
        <div style={{
          padding: '0 15px 20px', // Reducido para móviles
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
              placeholder="Buscar estudiante o DNI..."
              value={filtroDni}
              onChange={(e) => setFiltroDni(e.target.value)}
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
              backgroundColor: filtroDni ? '#4361ee' : '#cbd5e1'
            }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
               {matriculasAgrupadas.length} Estudiantes
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
                  <th>DNI</th>
                  <th>Estudiante</th>
                  <th style={{ textAlign: 'center' }}>Cursos Matriculados</th>
                  <th>Total Inversión</th>
                  <th>Total Pagado</th>
                  <th>Estado Global</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matriculasAgrupadas.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                      No hay estudiantes matriculados
                    </td>
                  </tr>
                ) : (
                  matriculasAgrupadas.map((grupo) => {
                    const totalInversion = grupo.matriculas.reduce((sum, m) => sum + parseFloat(m.monto_total), 0);
                    const totalPagado = grupo.matriculas.reduce((sum, m) => sum + parseFloat(m.monto_pagado), 0);
                    const tieneDeuda = grupo.matriculas.some(m => m.estado_pago !== 'pagado');

                    return (
                      <tr key={grupo.estudiante_id}>
                        <td>{grupo.dni}</td>
                        <td>
                          <strong>{grupo.nombres} {grupo.apellidos}</strong>
                          <br />
                          <small style={{ color: '#6b7280' }}>{grupo.codigo_estudiante}</small>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-icon btn-icon-view"
                            onClick={() => setEstudianteCursosModal(grupo)}
                            title="Ver Cursos"
                          >
                            <FaEye />
                          </button>
                        </td>
                        <td>S/ {totalInversion.toFixed(2)}</td>
                        <td style={{ color: '#059669', fontWeight: '600' }}>S/ {totalPagado.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${!tieneDeuda ? 'badge-success' : 'badge-danger'}`}>
                            {!tieneDeuda ? 'Al día' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              className="btn-icon btn-icon-edit"
                              onClick={() => abrirNuevaMatriculaParaEstudiante(grupo)}
                              title="Agregar nueva matrícula"
                              style={{ width: '28px', height: '28px' }}
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Matrícula */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva Matrícula</h2>
              <button className="modal-close" onClick={cerrarModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Seleccionar Estudiante</label>
                  <div className="search-box" style={{ marginBottom: '12px', border: 'none' }}>
                    <FaSearch style={{ left: '14px', right: 'auto' }} />
                    <input
                      type="text"
                      placeholder="Escribe DNI para filtrar..."
                      value={buscadorDniModal}
                      onChange={(e) => setBuscadorDniModal(e.target.value)}
                      className="form-control"
                      maxLength="8"
                      style={{
                        paddingLeft: '42px',
                        borderRadius: '50px',
                        backgroundColor: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                    {buscadorDniModal && (
                      <FaTimes
                        onClick={() => setBuscadorDniModal('')}
                        style={{ cursor: 'pointer', color: '#64748b' }}
                      />
                    )}
                  </div>
                  <select
                    name="estudiante_id"
                    value={formData.estudiante_id}
                    onChange={(e) => setFormData({ ...formData, estudiante_id: e.target.value })}
                    style={{ borderRadius: '10px' }}
                    required
                  >
                    <option value="">
                      {buscadorDniModal
                        ? (estudiantes.filter(est => est.dni && est.dni.includes(buscadorDniModal)).length > 0 ? 'Seleccionar de los resultados' : 'Sin resultados')
                        : 'Seleccionar estudiante'}
                    </option>
                    {estudiantes
                      .filter(est => !buscadorDniModal || (est.dni && est.dni.includes(buscadorDniModal)))
                      .filter(est => {
                        // Si hay un curso seleccionado, ocultar los alumnos que YA están en ese curso
                        if (formData.curso_id) {
                          const yaEnCurso = matriculas.some(m => m.estudiante_id === est.id && m.curso_id.toString() === formData.curso_id.toString());
                          if (yaEnCurso) return false;
                        }
                        return true;
                      })
                      .map(est => (
                        <option key={est.id} value={est.id}>
                          {est.dni} - {est.nombres} {est.apellidos}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Curso</label>
                  <select
                    name="curso_id"
                    value={formData.curso_id}
                    onChange={handleCursoChange}
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {cursos
                      .filter(curso => {
                        // Si hay un estudiante seleccionado, ocultar los cursos en los que YA está matriculado
                        if (formData.estudiante_id) {
                          const yaMatriculado = matriculas.some(m => m.curso_id === curso.id && m.estudiante_id.toString() === formData.estudiante_id.toString());
                          if (yaMatriculado) return false;
                        }
                        return true;
                      })
                      .map(curso => (
                      <option key={curso.id} value={curso.id} disabled={curso.cupos_disponibles <= 0}>
                        {curso.nombre} - {curso.ciclo_nombre || 'Sin ciclo'} ({curso.cupos_disponibles} vacantes)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detalles del Curso Separados */}
                {cursoSeleccionado && (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    borderLeft: '4px solid #0284c7',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></div>
                      <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Información del Curso</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Periodo Académico</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                        {cursoSeleccionado.fecha_inicio ? new Date(cursoSeleccionado.fecha_inicio).toLocaleDateString() : 'Ver ciclo'} - {cursoSeleccionado.fecha_fin ? new Date(cursoSeleccionado.fecha_fin).toLocaleDateString() : 'Ver ciclo'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Inversión</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                        S/ {parseFloat(cursoSeleccionado.precio).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Disponibilidad</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: cursoSeleccionado.cupos_disponibles > 5 ? '#0f172a' : '#ef4444' }}>
                        {cursoSeleccionado.cupos_disponibles} vacantes
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Fecha de Matrícula</label>
                  <input
                    type="date"
                    value={formData.fecha_matricula}
                    onChange={(e) => setFormData({ ...formData, fecha_matricula: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Observaciones 
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>({formData.observaciones.length}/500)</span>
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value.substring(0, 500) })}
                    rows="3"
                    placeholder="Ej: Pago adelantado, requiere horario especial..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Registrando...' : 'Matricular'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Cursos del Estudiante */}
      {estudianteCursosModal && (
        <div className="modal-overlay" onClick={() => setEstudianteCursosModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Cursos de {estudianteCursosModal.nombres}</h2>
              <button className="modal-close" onClick={() => setEstudianteCursosModal(null)}>×</button>
            </div>
            
            <div style={{ padding: '16px 24px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {estudianteCursosModal.matriculas.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{m.curso_nombre}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`badge ${m.estado_matricula === 'activa' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                          {m.estado_matricula}
                        </span>
                        <span className={`badge ${m.estado_pago === 'pagado' ? 'badge-success' : m.estado_pago === 'parcial' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                          {m.estado_pago === 'pagado' ? 'Pagado' : 'Deuda: S/' + (m.monto_total - m.monto_pagado).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      className="btn-icon btn-icon-delete"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => {
                        eliminarMatricula(m.id, m.curso_nombre, `${estudianteCursosModal.nombres} ${estudianteCursosModal.apellidos}`);
                        // Optionally refresh the modal content or close it. 
                        // The user will see the change when the table re-renders,
                        // so we can just close the modal to be safe, or leave it open
                        // and let `cargarDatos` update the background. Given `estudianteCursosModal`
                        // is a snapshot, we should close it so it doesn't show stale data.
                        setEstudianteCursosModal(null);
                      }}
                      title={`Anular matrícula en: ${m.curso_nombre}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setEstudianteCursosModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matriculas;

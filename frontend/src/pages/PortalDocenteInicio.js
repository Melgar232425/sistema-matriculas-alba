import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docentePortalAPI } from '../services/api';
import { FaUserTie, FaSignOutAlt, FaBookOpen, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PortalDocenteInicio = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('docente_token');
    if (!token) { navigate('/portal-docente'); return; }
    fetchCursos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (cursoSeleccionado && fecha) {
      setCambiosPendientes({}); // Resetear cambios al cambiar de curso o fecha
      fetchEstudiantes(cursoSeleccionado.id, fecha);
    }
  }, [cursoSeleccionado, fecha]);

  const fetchCursos = async () => {
    try {
      const res = await docentePortalAPI.getCursos();
      setCursos(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstudiantes = async (cursoId, fechaBuscada) => {
    try {
      const res = await docentePortalAPI.getEstudiantesAsistencia(cursoId, fechaBuscada);
      setEstudiantes(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('docente_token');
    localStorage.removeItem('docente_user');
    navigate('/portal-docente');
  };

  const marcarAsistenciaLocal = (matricula_id, estado) => {
    setCambiosPendientes(prev => ({
      ...prev,
      [matricula_id]: estado
    }));
  };

  const guardarCambios = async () => {
    if (Object.keys(cambiosPendientes).length === 0) return;
    
    setGuardando(true);
    const loadingToast = toast.loading('Guardando asistencia...');
    
    try {
      const promesas = Object.entries(cambiosPendientes).map(([matricula_id, estado]) => 
        docentePortalAPI.marcarAsistencia(cursoSeleccionado.id, { 
          matricula_id: parseInt(matricula_id), 
          fecha, 
          estado 
        })
      );
      
      await Promise.all(promesas);
      
      toast.dismiss(loadingToast);
      toast.success('Asistencia guardada correctamente');
      setCambiosPendientes({});
      fetchEstudiantes(cursoSeleccionado.id, fecha);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Error al guardar la asistencia');
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div style={styles.center}><div style={styles.spinner}></div></div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
            <FaUserTie size={24} color="#0ea5e9" />
            <span style={{ fontWeight: 800, fontSize: 18 }}>Portal Docente | Hola, {user.nombres?.split(' ')[0]}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FaSignOutAlt /> <span className="hide-mobile">Salir</span>
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          
          {/* Panel de Cursos */}
          <div style={styles.sidebar}>
            <h3 style={{ marginBottom: 15, fontSize: 16 }}>Mis Cursos Activos</h3>
            {cursos.length === 0 ? <p style={{ fontSize: 13, color: '#64748b' }}>No tienes cursos activos.</p> : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cursos.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    if (Object.keys(cambiosPendientes).length > 0 && !window.confirm('Tienes cambios sin guardar. ¿Deseas cambiar de curso y perder los cambios?')) {
                      return;
                    }
                    setCursoSeleccionado(c);
                  }}
                  style={{...styles.cursoCard, ...(cursoSeleccionado?.id === c.id ? styles.cursoActive : {})}}
                >
                  <FaBookOpen color={cursoSeleccionado?.id === c.id ? '#fff' : '#0ea5e9'} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{c.horario} | {c.ciclo_nombre}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel de Asistencia */}
          <div style={styles.content}>
            {!cursoSeleccionado ? (
              <div style={styles.emptyState}>
                Selecciona un curso a la izquierda para registrar asistencia.
              </div>
            ) : (
              <>
                <div style={styles.contentHeader}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800 }}>Control de Asistencia</h2>
                    <p style={{ color: '#64748b', fontSize: 14 }}>{cursoSeleccionado.nombre} ({cursoSeleccionado.horario})</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {Object.keys(cambiosPendientes).length > 0 && (
                      <button 
                        onClick={guardarCambios}
                        disabled={guardando}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        <FaCheck /> GUARDAR CAMBIOS ({Object.keys(cambiosPendientes).length})
                      </button>
                    )}
                    <input 
                      type="date" 
                      value={fecha} 
                      onChange={e => {
                        if (Object.keys(cambiosPendientes).length > 0 && !window.confirm('Tienes cambios sin guardar. ¿Deseas cambiar la fecha y perder los cambios?')) {
                          return;
                        }
                        setFecha(e.target.value);
                      }} 
                      max={new Date().toISOString().split('T')[0]}
                      style={styles.dateInput}
                    />
                  </div>
                </div>

                {(() => {
                  // Normalizar para ignorar tildes al comparar
                  const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                  
                  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
                  const fechaObj = new Date(fecha + 'T00:00:00');
                  const nombreDia = diasSemana[fechaObj.getDay()];
                  
                  const horarioNormalizado = normalizar(cursoSeleccionado.horario);
                  const diaNormalizado = normalizar(nombreDia);
                  
                  const esDiaProgramado = horarioNormalizado.includes(diaNormalizado);
                  
                  if (!esDiaProgramado) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#f8fafc',
                        borderRadius: '16px',
                        border: '2px dashed #e2e8f0',
                        color: '#64748b'
                      }}>
                        <div style={{
                          background: '#fff7ed',
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px'
                        }}>
                          <FaExclamationTriangle color="#f97316" size={30} />
                        </div>
                        <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>No hay clases programadas</h3>
                        <p style={{ maxWidth: '300px', margin: '0 auto', fontSize: '14px', lineHeight: '1.6' }}>
                          Hoy es <strong>{nombreDia}</strong>. Según el horario (<em>{cursoSeleccionado.horario}</em>), este curso no se dicta hoy.
                        </p>
                        <p style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
                          Selecciona una fecha válida en el calendario de arriba para ver el control de asistencia.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="portal-table-wrap">
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Alumno</th>
                            <th style={styles.th}>Código</th>
                            <th style={styles.th}>Estado {fecha}</th>
                            <th style={styles.th}>Alertas</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Acción Rápida</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantes.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>No hay estudiantes matriculados.</td></tr>
                          ) : null}
                          {estudiantes.map(e => {
                            const estadoFinal = cambiosPendientes[e.matricula_id] || e.estado_asistencia;
                            const tieneCambio = !!cambiosPendientes[e.matricula_id];

                            return (
                              <tr key={e.estudiante_id} style={{
                                ...styles.tr,
                                backgroundColor: tieneCambio ? '#f0f9ff' : 'transparent'
                              }}>
                                <td style={styles.td}><strong>{e.apellidos}</strong>, {e.nombres}</td>
                                <td style={styles.td}><span style={styles.code}>{e.codigo}</span></td>
                                <td style={styles.td}>
                                  {estadoFinal === 'presente' && <span style={styles.badgeSuccess}>Presente</span>}
                                  {estadoFinal === 'ausente' && <span style={styles.badgeDanger}>Ausente</span>}
                                  {estadoFinal === 'tardanza' && <span style={styles.badgeWarning}>Tardanza</span>}
                                  {estadoFinal === 'no_registrado' && <span style={styles.badgeNeutral}>Sin Registrar</span>}
                                  {tieneCambio && <span style={{ fontSize: 10, display: 'block', color: '#0ea5e9', fontWeight: 700 }}>Pendiente guardar</span>}
                                </td>
                                <td style={styles.td}>
                                  {e.total_faltas >= 3 ? (
                                    <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <FaExclamationTriangle /> {e.total_faltas} faltas
                                    </span>
                                  ) : <span style={{ color: '#64748b', fontSize: 12 }}>{e.total_faltas} faltas</span>}
                                </td>
                                <td style={{...styles.td, textAlign: 'right'}}>
                                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <button 
                                      onClick={() => marcarAsistenciaLocal(e.matricula_id, estadoFinal === 'presente' ? 'ausente' : 'presente')} 
                                      style={{
                                        ...styles.quickCheck, 
                                        background: estadoFinal === 'presente' ? '#10b981' : '#f1f5f9',
                                        color: estadoFinal === 'presente' ? 'white' : '#94a3b8',
                                        borderColor: estadoFinal === 'presente' ? '#059669' : '#e2e8f0'
                                      }}
                                      title="Marcar como Presente / Ausente"
                                    >
                                      <FaCheck size={14} />
                                    </button>
                                    <select 
                                      value={estadoFinal} 
                                      onChange={(ev) => marcarAsistenciaLocal(e.matricula_id, ev.target.value)}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '13px',
                                        background: 'white',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        fontWeight: tieneCambio ? 'bold' : 'normal'
                                      }}
                                    >
                                      <option value="no_registrado">Sin marcar</option>
                                      <option value="presente">Presente</option>
                                      <option value="tardanza">Tardanza</option>
                                      <option value="ausente">Ausente</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Final UI Logic

const styles = {
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  page: { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '15px 30px' },
  headerInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  main: { maxWidth: 1200, margin: '0 auto', padding: '20px', display: 'flex', gap: 20, flexWrap: 'wrap' },
  sidebar: { flex: '1 1 300px', background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', minHeight: 'fit-content' },
  cursoCard: { padding: 15, borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 15, transition: 'all 0.2s' },
  cursoActive: { background: '#0ea5e9', color: 'white', borderColor: '#0ea5e9', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' },
  content: { flex: '2 1 600px', minWidth: 320, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px' },
  emptyState: { textAlign: 'center', padding: '100px 0', color: '#64748b', fontSize: 16 },
  contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dateInput: { padding: '10px 15px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontWeight: 600, fontFamily: 'inherit' },
  tableWrap: { overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: 12 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: 14, textAlign: 'left', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '2px solid #e2e8f0' },
  td: { padding: 14, borderBottom: '1px solid #f1f5f9', fontSize: 14, color: '#0f172a', verticalAlign: 'middle' },
  tr: { transition: 'background 0.1s' },
  code: { background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#475569' },
  actionBtn: { width: 32, height: 32, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontWeight: 700, transition: 'transform 0.1s' },
  quickCheck: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    border: '2px solid', 
    cursor: 'pointer', 
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  badgeSuccess: { background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  badgeDanger: { background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  badgeWarning: { background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  badgeNeutral: { background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
};

export default PortalDocenteInicio;

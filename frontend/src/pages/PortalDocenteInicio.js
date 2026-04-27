import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docentePortalAPI } from '../services/api';
import { FaSignOutAlt, FaBookOpen, FaCheck, FaUsers, FaCalendarAlt, FaChalkboardTeacher } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PortalDocenteInicio = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('docente_user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('docente_token');
    if (!token) { navigate('/portal-docente'); return; }
    fetchCursos();
  }, [navigate]);

  useEffect(() => {
    if (cursoSeleccionado && fecha) {
      setCambiosPendientes({});
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
    setCambiosPendientes(prev => ({ ...prev, [matricula_id]: estado }));
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
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner}></div>
      <p style={{ marginTop: '20px', color: '#64748b', fontWeight: 'bold' }}>Cargando Panel Docente...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Header Premium */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={styles.logoCircle}>ALBA</div>
            <div className="hide-mobile">
              <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Portal Docente</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Gestión Académica de Élite</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }} className="hide-mobile">
              <div style={{ fontWeight: '800', fontSize: '14px' }}>Prof. {user.nombres}</div>
              <div style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: 'bold' }}>DOCENTE ACTIVO</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <FaSignOutAlt /> <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Banner de Bienvenida Premium */}
        <div style={styles.banner}>
          <div style={{ flex: 1 }}>
            <div style={styles.badgeTop}>SISTEMA ACADÉMICO ALBA</div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              ¡Hola, Prof. {user.nombres}! 👋
            </h2>
            <p style={{ opacity: 0.9, fontSize: '15px', fontWeight: '500' }}>
              Tu pasión por la enseñanza construye el futuro de la Academia Alba.
            </p>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.miniStat}>
              <div style={styles.miniIcon}><FaBookOpen /></div>
              <div>
                <div style={styles.miniVal}>{cursos.length}</div>
                <div style={styles.miniLab}>CURSOS</div>
              </div>
            </div>
            <div style={styles.miniStat}>
              <div style={styles.miniIcon}><FaUsers /></div>
              <div>
                <div style={styles.miniVal}>{estudiantes.length || '0'}</div>
                <div style={styles.miniLab}>ALUMNOS</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.layout}>
          {/* Columna Izquierda: Mis Cursos */}
          <div style={styles.sidebar}>
            <div style={styles.sectionHeader}>
              <FaChalkboardTeacher /> <span>MIS CURSOS ACTIVOS</span>
            </div>
            <div style={styles.cursoList}>
              {cursos.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    if (Object.keys(cambiosPendientes).length > 0 && !window.confirm('¿Deseas perder los cambios de asistencia?')) return;
                    setCursoSeleccionado(c);
                  }}
                  style={{...styles.cursoCard, ...(cursoSeleccionado?.id === c.id ? styles.cursoActive : {})}}
                >
                  <div style={{...styles.cursoIcon, background: cursoSeleccionado?.id === c.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9'}}>
                    <FaBookOpen color={cursoSeleccionado?.id === c.id ? '#fff' : '#4361ee'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>{c.nombre}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px', fontWeight: '600' }}>{c.horario}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Control de Asistencia */}
          <div style={styles.content}>
            {!cursoSeleccionado ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}><FaCalendarAlt /></div>
                <h3 style={{ fontWeight: '900', color: '#0f172a' }}>Selector de Aula Virtual</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>Elige un curso del panel izquierdo para comenzar a gestionar las asistencias y ver el progreso de tus alumnos.</p>
              </div>
            ) : (
              <>
                <div style={styles.panelHeader}>
                  <div>
                    <div style={styles.breadcrumb}>GESTIÓN ACADÉMICA / ASISTENCIA</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{cursoSeleccionado.nombre}</h2>
                      <div style={styles.asistenciaProgress}>
                         <div style={styles.progressText}>
                            {estudiantes.filter(e => e.estado_asistencia !== 'no_registrado' || cambiosPendientes[e.matricula_id]).length} / {estudiantes.length} Marcados
                         </div>
                         <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill,
                              width: `${(estudiantes.filter(e => e.estado_asistencia !== 'no_registrado' || cambiosPendientes[e.matricula_id]).length / estudiantes.length) * 100}%`
                            }}></div>
                         </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input 
                      type="date" 
                      value={fecha} 
                      onChange={e => setFecha(e.target.value)} 
                      max={new Date().toISOString().split('T')[0]}
                      style={styles.dateInput}
                    />
                    {Object.keys(cambiosPendientes).length > 0 && (
                      <button onClick={guardarCambios} disabled={guardando} style={styles.saveBtn}>
                        <FaCheck /> GUARDAR ASISTENCIA ({Object.keys(cambiosPendientes).length})
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.tableCard}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Estudiante</th>
                        <th style={styles.th}>Estado de Asistencia</th>
                        <th style={{...styles.th, textAlign: 'center'}}>Inasistencias</th>
                        <th style={{...styles.th, textAlign: 'right'}}>Control de Aula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map(e => {
                        const estado = cambiosPendientes[e.matricula_id] || e.estado_asistencia;
                        const modificado = !!cambiosPendientes[e.matricula_id];

                        return (
                          <tr key={e.estudiante_id} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={{ fontWeight: '800', color: '#1e293b' }}>{e.apellidos}, {e.nombres}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>CÓDIGO: {e.codigo}</div>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.statusBadge(estado)}>
                                {estado.replace('_', ' ').toUpperCase()}
                              </div>
                              {modificado && <span style={styles.pendingDot}>PENDIENTE DE GUARDAR</span>}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                               <div style={{ 
                                 fontSize: '13px', 
                                 color: e.total_faltas >= 3 ? '#e11d48' : '#059669', 
                                 fontWeight: '900',
                                 background: e.total_faltas >= 3 ? '#fff1f2' : '#f0fdf4',
                                 padding: '4px 12px',
                                 borderRadius: '10px',
                                 display: 'inline-block'
                               }}>
                                 {e.total_faltas} Faltas
                               </div>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>
                              <select 
                                value={estado} 
                                onChange={(ev) => marcarAsistenciaLocal(e.matricula_id, ev.target.value)}
                                style={styles.select(modificado)}
                              >
                                <option value="no_registrado">Seleccionar estado...</option>
                                <option value="presente">Presente ✅</option>
                                <option value="tardanza">Tardanza ⏳</option>
                                <option value="ausente">Ausente ❌</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' },
  spinner: { width: 50, height: 50, border: '5px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  page: { minHeight: '100vh', background: '#f8fafc', color: '#0f172a' },
  header: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '15px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoCircle: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' },
  logoutBtn: { background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  main: { maxWidth: 1400, margin: '0 auto', padding: '30px 40px' },
  banner: { background: 'linear-gradient(135deg, #4361ee, #2563eb)', color: 'white', padding: '35px 40px', borderRadius: '28px', marginBottom: '35px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.2)' },
  badgeTop: { background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: '900', display: 'inline-block', marginBottom: '12px', letterSpacing: '0.1em' },
  statsRow: { display: 'flex', gap: '30px' },
  miniStat: { display: 'flex', alignItems: 'center', gap: '15px' },
  miniIcon: { padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', fontSize: '18px', color: 'white' },
  miniVal: { fontSize: '24px', fontWeight: '900' },
  miniLab: { fontSize: '10px', fontWeight: '800', opacity: 0.8, letterSpacing: '0.05em' },
  layout: { display: 'flex', gap: '35px' },
  sidebar: { width: '300px', flexShrink: 0 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '20px', paddingLeft: '5px', letterSpacing: '0.05em' },
  cursoList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  cursoCard: { background: 'white', padding: '18px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  cursoIcon: { width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  cursoActive: { background: '#4361ee', color: 'white', borderColor: '#4361ee', boxShadow: '0 12px 20px rgba(67, 97, 238, 0.25)', transform: 'translateY(-2px)' },
  content: { flex: 1 },
  asistenciaProgress: { background: '#f1f5f9', padding: '10px 18px', borderRadius: '15px', minWidth: '180px' },
  progressText: { fontSize: '11px', fontWeight: '900', color: '#475569', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' },
  progressBar: { width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '10px', transition: 'width 0.5s ease' },
  emptyState: { textAlign: 'center', padding: '100px 40px', background: 'white', borderRadius: '28px', border: '2px dashed #e2e8f0' },
  emptyIcon: { fontSize: '48px', color: '#cbd5e1', marginBottom: '20px' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' },
  breadcrumb: { fontSize: '10px', fontWeight: '900', color: '#4361ee', marginBottom: '8px', letterSpacing: '0.05em' },
  dateInput: { background: 'white', border: '2px solid #f1f5f9', padding: '12px 18px', borderRadius: '15px', fontSize: '14px', fontWeight: '800', color: '#1e293b', outline: 'none', transition: 'all 0.2s' },
  saveBtn: { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' },
  tableCard: { background: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '20px 25px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '22px 25px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  tr: { transition: 'all 0.2s' },
  statusBadge: (status) => ({
    background: status === 'presente' ? '#ecfdf5' : status === 'ausente' ? '#fff1f2' : status === 'tardanza' ? '#fffbeb' : '#f8fafc',
    color: status === 'presente' ? '#059669' : status === 'ausente' ? '#e11d48' : status === 'tardanza' ? '#d97706' : '#94a3b8',
    padding: '6px 12px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '900',
    display: 'inline-block',
    border: `1px solid ${status === 'presente' ? '#d1fae5' : status === 'ausente' ? '#fee2e2' : status === 'tardanza' ? '#fef3c7' : '#e2e8f0'}`
  }),
  pendingDot: { display: 'block', fontSize: '9px', color: '#4361ee', fontWeight: '900', marginTop: '5px', letterSpacing: '0.02em' },
  select: (mod) => ({
    padding: '10px 15px',
    borderRadius: '12px',
    border: `2px solid ${mod ? '#4361ee' : '#f1f5f9'}`,
    fontSize: '13px',
    fontWeight: mod ? '900' : '700',
    background: 'white',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  })
};

export default PortalDocenteInicio;

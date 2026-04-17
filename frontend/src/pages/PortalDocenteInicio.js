import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docentePortalAPI } from '../services/api';
import { FaUserTie, FaSignOutAlt, FaBookOpen, FaCheck, FaExclamationTriangle, FaUsers, FaCalendarAlt, FaChalkboardTeacher } from 'react-icons/fa';
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
        {/* Banner de Bienvenida y Stats */}
        <div style={styles.banner}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>¡Hola, Docente! 👋</h2>
            <p style={{ opacity: 0.9, fontSize: '15px' }}>Hoy es un buen día para inspirar a tus alumnos.</p>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.miniStat}>
              <div style={{ ...styles.miniIcon, background: 'rgba(255,255,255,0.2)' }}><FaBookOpen /></div>
              <div>
                <div style={styles.miniVal}>{cursos.length}</div>
                <div style={styles.miniLab}>CURSOS</div>
              </div>
            </div>
            <div style={styles.miniStat}>
              <div style={{ ...styles.miniIcon, background: 'rgba(255,255,255,0.2)' }}><FaUsers /></div>
              <div>
                <div style={styles.miniVal}>{estudiantes.length || '--'}</div>
                <div style={styles.miniLab}>ALUMNOS</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.layout}>
          {/* Columna Izquierda: Mis Cursos */}
          <div style={styles.sidebar}>
            <div style={styles.sectionHeader}>
              <FaChalkboardTeacher /> <span>MIS CURSOS</span>
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
                    <FaBookOpen color={cursoSeleccionado?.id === c.id ? '#fff' : '#0ea5e9'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>{c.nombre}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{c.horario}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Control */}
          <div style={styles.content}>
            {!cursoSeleccionado ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}><FaCalendarAlt /></div>
                <h3>Selector de Aula Virtual</h3>
                <p>Elige un curso del panel izquierdo para comenzar a gestionar las asistencias y ver a tus alumnos.</p>
              </div>
            ) : (
              <>
                <div style={styles.panelHeader}>
                  <div>
                    <div style={styles.breadcrumb}>GESTIÓN ACADÉMICA / ASISTENCIA</div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{cursoSeleccionado.nombre}</h2>
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
                        <FaCheck /> GUARDAR ({Object.keys(cambiosPendientes).length})
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.tableCard}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Estudiante</th>
                        <th style={styles.th}>Estado Actual</th>
                        <th style={{...styles.th, textAlign: 'center'}}>Rendimiento</th>
                        <th style={{...styles.th, textAlign: 'right'}}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map(e => {
                        const estado = cambiosPendientes[e.matricula_id] || e.estado_asistencia;
                        const modificado = !!cambiosPendientes[e.matricula_id];

                        return (
                          <tr key={e.estudiante_id} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={{ fontWeight: '700' }}>{e.apellidos}, {e.nombres}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {e.codigo}</div>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.statusBadge(estado)}>
                                {estado.replace('_', ' ').toUpperCase()}
                              </div>
                              {modificado && <span style={styles.pendingDot}>Pendiente</span>}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                               <div style={{ fontSize: '12px', color: e.total_faltas >= 3 ? '#ef4444' : '#10b981', fontWeight: '800' }}>
                                 {e.total_faltas} Inasistencias
                               </div>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>
                              <select 
                                value={estado} 
                                onChange={(ev) => marcarAsistenciaLocal(e.matricula_id, ev.target.value)}
                                style={styles.select(modificado)}
                              >
                                <option value="no_registrado">Sin marcar</option>
                                <option value="presente">Presente</option>
                                <option value="tardanza">Tardanza</option>
                                <option value="ausente">Ausente</option>
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
  spinner: { width: 50, height: 50, border: '5px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  page: { minHeight: '100vh', background: '#f8fafc', color: '#0f172a' },
  header: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '15px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoCircle: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' },
  logoutBtn: { background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  main: { maxWidth: 1400, margin: '0 auto', padding: '30px 40px' },
  banner: { background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white', padding: '30px', borderRadius: '24px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)' },
  statsRow: { display: 'flex', gap: '25px' },
  miniStat: { display: 'flex', alignItems: 'center', gap: '12px' },
  miniIcon: { padding: '10px', borderRadius: '12px' },
  miniVal: { fontSize: '20px', fontWeight: '900' },
  miniLab: { fontSize: '10px', fontWeight: '800', opacity: 0.8 },
  layout: { display: 'flex', gap: '30px' },
  sidebar: { width: '300px', flexShrink: 0 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: '900', color: '#94a3b8', marginBottom: '15px', paddingLeft: '5px' },
  cursoList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  cursoCard: { background: 'white', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  cursoIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cursoActive: { background: '#0ea5e9', color: 'white', borderColor: '#0ea5e9', boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)', transform: 'translateY(-2px)' },
  content: { flex: 1 },
  emptyState: { textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' },
  emptyIcon: { fontSize: '40px', color: '#e2e8f0', marginBottom: '15px' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px' },
  breadcrumb: { fontSize: '10px', fontWeight: '900', color: '#0ea5e9', marginBottom: '5px' },
  dateInput: { background: 'white', border: '1.5px solid #e2e8f0', padding: '10px 15px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', color: '#475569', outline: 'none' },
  saveBtn: { background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
  tableCard: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '18px 25px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '18px 25px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  tr: { transition: 'all 0.2s' },
  statusBadge: (status) => ({
    background: status === 'presente' ? '#d1fae5' : status === 'ausente' ? '#fee2e2' : status === 'tardanza' ? '#fef3c7' : '#f1f5f9',
    color: status === 'presente' ? '#059669' : status === 'ausente' ? '#dc2626' : status === 'tardanza' ? '#d97706' : '#64748b',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '800',
    display: 'inline-block'
  }),
  pendingDot: { display: 'block', fontSize: '10px', color: '#0ea5e9', fontWeight: 'bold', marginTop: '3px' },
  select: (mod) => ({
    padding: '8px 12px',
    borderRadius: '10px',
    border: `1.5px solid ${mod ? '#0ea5e9' : '#e2e8f0'}`,
    fontSize: '13px',
    fontWeight: mod ? '900' : '600',
    background: 'white',
    outline: 'none',
    cursor: 'pointer'
  })
};

export default PortalDocenteInicio;

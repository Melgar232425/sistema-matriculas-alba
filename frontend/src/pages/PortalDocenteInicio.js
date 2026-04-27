import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docentePortalAPI } from '../services/api';
import { FaSignOutAlt, FaBookOpen, FaCheck, FaChalkboardTeacher } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PortalDocenteInicio = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
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
      setLoading(true);
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
      setLoadingEstudiantes(true);
      const res = await docentePortalAPI.getEstudiantesAsistencia(cursoId, fechaBuscada);
      setEstudiantes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEstudiantes(false);
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
    const loadingToast = toast.loading('Sincronizando con la nube...');
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
      toast.success('Asistencia sincronizada');
      setCambiosPendientes({});
      fetchEstudiantes(cursoSeleccionado.id, fecha);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Error de sincronización');
    } finally {
      setGuardando(false);
    }
  };

  // Componente de Carga Elegante (Skeleton)
  const Skeleton = ({ width, height, borderRadius = '10px' }) => (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite linear'
    }} />
  );

  if (loading) return (
    <div style={styles.page}>
      <div style={styles.header}>
         <div style={styles.headerInner}><Skeleton width="150px" height="30px" /></div>
      </div>
      <div style={styles.main}>
         <Skeleton width="100%" height="150px" borderRadius="24px" />
         <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
            <div style={{ width: '300px' }}><Skeleton width="100%" height="400px" borderRadius="24px" /></div>
            <div style={{ flex: 1 }}><Skeleton width="100%" height="400px" borderRadius="24px" /></div>
         </div>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .course-card:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 30px -5px rgba(67, 97, 238, 0.3) !important; }
        .btn-hover:hover { filter: brightness(1.1); transform: scale(1.02); }
      `}</style>

      {/* Header Estilo Apple/Elite */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img 
              src="/logo_oficial.png" 
              alt="Logo Alba" 
              style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '10px' }} 
            />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: '#1e293b' }}>ACADEMIA ALBA</h1>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontWeight: '700', letterSpacing: '0.1em' }}>PORTAL DOCENTE</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>{user.nombres} {user.apellidos}</div>
              <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '900', letterSpacing: '0.05em' }}>● DOCENTE VERIFICADO</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} className="btn-hover">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main} className="fade-in">
        {/* Banner con Glassmorphism */}
        <div style={styles.banner}>
          <div style={{ flex: 1 }}>
            <div style={styles.badgeTop}>PANEL DE CONTROL ACADÉMICO</div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              ¡Excelente jornada, {user.nombres.split(' ')[0]}! 🚀
            </h2>
            <p style={{ opacity: 0.85, fontSize: '16px', fontWeight: '500', maxWidth: '500px' }}>
              Gestione sus aulas y monitoree el rendimiento estudiantil con herramientas de precisión.
            </p>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.miniStat}>
              <div style={styles.miniVal}>{cursos.length}</div>
              <div style={styles.miniLab}>Cursos</div>
            </div>
            <div style={styles.miniStat}>
              <div style={styles.miniVal}>{estudiantes.length || '0'}</div>
              <div style={styles.miniLab}>Alumnos</div>
            </div>
          </div>
        </div>

        <div style={styles.layout}>
          {/* Sidebar Minimalista */}
          <div style={styles.sidebar}>
            <div style={styles.sectionHeader}>AULAS ASIGNADAS</div>
            <div style={styles.cursoList}>
              {cursos.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    if (Object.keys(cambiosPendientes).length > 0 && !window.confirm('¿Perder cambios pendientes?')) return;
                    setCursoSeleccionado(c);
                  }}
                  style={{...styles.cursoCard, ...(cursoSeleccionado?.id === c.id ? styles.cursoActive : {})}}
                  className="course-card"
                >
                  <div style={{...styles.cursoIcon, background: cursoSeleccionado?.id === c.id ? 'rgba(255,255,255,0.2)' : '#f8fafc'}}>
                    <FaBookOpen size={16} color={cursoSeleccionado?.id === c.id ? '#fff' : '#4361ee'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '13px' }}>{c.nombre.toUpperCase()}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '3px', fontWeight: '700' }}>{c.horario}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Área de Trabajo */}
          <div style={styles.content}>
            {!cursoSeleccionado ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}><FaChalkboardTeacher /></div>
                <h3 style={{ fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>Seleccione un aula virtual</h3>
                <p style={{ color: '#64748b', maxWidth: '350px', margin: '0 auto', fontSize: '14px' }}>
                  Comience la gestión del día eligiendo uno de sus cursos asignados en el panel izquierdo.
                </p>
              </div>
            ) : (
              <div className="fade-in">
                <div style={styles.panelHeader}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.breadcrumb}>GESTIÓN DE ASISTENCIA / {cursoSeleccionado.ciclo_nombre}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{cursoSeleccionado.nombre}</h2>
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
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      value={fecha} 
                      onChange={e => setFecha(e.target.value)} 
                      max={new Date().toISOString().split('T')[0]}
                      style={styles.dateInput}
                    />
                    {Object.keys(cambiosPendientes).length > 0 && (
                      <button onClick={guardarCambios} disabled={guardando} style={styles.saveBtn} className="btn-hover">
                        <FaCheck /> GUARDAR CAMBIOS
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.tableWrapper}>
                  {loadingEstudiantes ? (
                    <div style={{ padding: '40px' }}>
                       <Skeleton width="100%" height="40px" borderRadius="10px" />
                       <div style={{ marginTop: '10px' }}><Skeleton width="100%" height="40px" borderRadius="10px" /></div>
                       <div style={{ marginTop: '10px' }}><Skeleton width="100%" height="40px" borderRadius="10px" /></div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  header: { background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '12px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoCircle: { background: '#1e293b', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px' },
  logoutBtn: { background: '#f1f5f9', color: '#475569', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' },
  main: { maxWidth: 1400, margin: '0 auto', padding: '40px' },
  banner: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', padding: '45px 50px', borderRadius: '32px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' },
  badgeTop: { background: 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 14px', borderRadius: '50px', fontSize: '9px', fontWeight: '900', display: 'inline-block', marginBottom: '15px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.1)' },
  statsRow: { display: 'flex', gap: '40px' },
  miniStat: { textAlign: 'center' },
  miniVal: { fontSize: '32px', fontWeight: '900', marginBottom: '2px' },
  miniLab: { fontSize: '10px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' },
  layout: { display: 'flex', gap: '40px' },
  sidebar: { width: '280px', flexShrink: 0 },
  sectionHeader: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', marginBottom: '20px', letterSpacing: '0.15em', paddingLeft: '5px' },
  cursoList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  cursoCard: { background: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cursoIcon: { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cursoActive: { background: '#1e293b', color: 'white', borderColor: '#1e293b', transform: 'translateX(8px)' },
  content: { flex: 1 },
  asistenciaProgress: { background: '#f1f5f9', padding: '10px 18px', borderRadius: '15px', minWidth: '180px' },
  progressText: { fontSize: '10px', fontWeight: '900', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' },
  progressBar: { width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#10b981', borderRadius: '10px', transition: 'width 0.8s cubic-bezier(0.65, 0, 0.35, 1)' },
  emptyState: { textAlign: 'center', padding: '120px 40px', background: 'white', borderRadius: '32px', border: '2px dashed #e2e8f0' },
  emptyIcon: { fontSize: '50px', color: '#e2e8f0', marginBottom: '25px' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px' },
  breadcrumb: { fontSize: '9px', fontWeight: '900', color: '#4361ee', marginBottom: '8px', letterSpacing: '0.1em' },
  dateInput: { background: 'white', border: '2px solid #f1f5f9', padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: '800', color: '#1e293b', outline: 'none', transition: 'all 0.2s' },
  saveBtn: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '16px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)' },
  tableWrapper: { background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '22px 30px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '24px 30px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  tr: { transition: 'all 0.2s' },
  statusBadge: (status) => ({
    background: status === 'presente' ? '#f0fdf4' : status === 'ausente' ? '#fff1f2' : status === 'tardanza' ? '#fffbeb' : '#f8fafc',
    color: status === 'presente' ? '#16a34a' : status === 'ausente' ? '#e11d48' : status === 'tardanza' ? '#d97706' : '#94a3b8',
    padding: '6px 14px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: '900',
    display: 'inline-block',
    border: `1px solid ${status === 'presente' ? '#dcfce7' : status === 'ausente' ? '#fee2e2' : status === 'tardanza' ? '#fef3c7' : '#e2e8f0'}`
  }),
  pendingDot: { display: 'block', fontSize: '9px', color: '#4361ee', fontWeight: '900', marginTop: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' },
  select: (mod) => ({
    padding: '10px 18px',
    borderRadius: '14px',
    border: `2px solid ${mod ? '#4361ee' : '#f1f5f9'}`,
    fontSize: '13px',
    fontWeight: mod ? '900' : '700',
    background: 'white',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s'
  })
};

export default PortalDocenteInicio;

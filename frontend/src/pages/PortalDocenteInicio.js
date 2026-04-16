import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docentePortalAPI } from '../services/api';
import { FaUserTie, FaSignOutAlt, FaBookOpen, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PortalDocenteInicio = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('docente_user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('docente_token');
    if (!token) { navigate('/portal-docente'); return; }
    fetchCursos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (cursoSeleccionado && fecha) {
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

  const marcarAsistencia = async (matricula_id, estado) => {
    try {
      await docentePortalAPI.marcarAsistencia(cursoSeleccionado.id, { matricula_id, fecha, estado });
      
      // Actualizar localmente para no hacer otra request
      setEstudiantes(prev => prev.map(e => 
        e.matricula_id === matricula_id ? { ...e, estado_asistencia: estado } : e
      ));
      toast.success(`Asistencia marcada como: ${estado}`, { duration: 1500 });
    } catch (err) {
      toast.error('Error al guardar asistencia');
    }
  };

  if (loading) return <div style={styles.center}><div style={styles.spinner}></div></div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <FaUserTie size={24} color="#0ea5e9" />
            <span style={{ fontWeight: 800, fontSize: 18 }}>Portal Docente | Hola, {user.nombres?.split(' ')[0]}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FaSignOutAlt /> Salir
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
                  onClick={() => setCursoSeleccionado(c)}
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
                  <input 
                    type="date" 
                    value={fecha} 
                    onChange={e => setFecha(e.target.value)} 
                    style={styles.dateInput}
                  />
                </div>

                <div style={styles.tableWrap}>
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
                      {estudiantes.map(e => (
                        <tr key={e.estudiante_id} style={styles.tr}>
                          <td style={styles.td}><strong>{e.apellidos}</strong>, {e.nombres}</td>
                          <td style={styles.td}><span style={styles.code}>{e.codigo}</span></td>
                          <td style={styles.td}>
                            {e.estado_asistencia === 'presente' && <span style={styles.badgeSuccess}>Presente</span>}
                            {e.estado_asistencia === 'ausente' && <span style={styles.badgeDanger}>Ausente</span>}
                            {e.estado_asistencia === 'tardanza' && <span style={styles.badgeWarning}>Tardanza</span>}
                            {e.estado_asistencia === 'no_registrado' && <span style={styles.badgeNeutral}>Sin Registrar</span>}
                          </td>
                          <td style={styles.td}>
                            {e.total_faltas >= 3 ? (
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FaExclamationTriangle /> {e.total_faltas} faltas
                              </span>
                            ) : <span style={{ color: '#64748b', fontSize: 12 }}>{e.total_faltas} faltas</span>}
                          </td>
                          <td style={{...styles.td, textAlign: 'right'}}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button onClick={() => marcarAsistencia(e.matricula_id, 'presente')} style={{...styles.actionBtn, background: '#10b981', color: 'white'}}><FaCheck /> P</button>
                              <button onClick={() => marcarAsistencia(e.matricula_id, 'tardanza')} style={{...styles.actionBtn, background: '#f59e0b', color: 'white'}}><FaClock /> T</button>
                              <button onClick={() => marcarAsistencia(e.matricula_id, 'ausente')} style={{...styles.actionBtn, background: '#ef4444', color: 'white'}}><FaTimes /> F</button>
                            </div>
                          </td>
                        </tr>
                      ))}
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

const FaClock = () => <span style={{fontSize: 12, fontWeight: 'bold'}}>T</span>;

const styles = {
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  page: { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '15px 30px' },
  headerInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  main: { maxWidth: 1200, margin: '0 auto', padding: '30px', display: 'flex' },
  sidebar: { width: 300, background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' },
  cursoCard: { padding: 15, borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 15, transition: 'all 0.2s' },
  cursoActive: { background: '#0ea5e9', color: 'white', borderColor: '#0ea5e9', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' },
  content: { flex: 1, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 30 },
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
  badgeSuccess: { background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  badgeDanger: { background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  badgeWarning: { background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  badgeNeutral: { background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
};

export default PortalDocenteInicio;

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import { 
  FaUserGraduate, FaCalendarCheck, FaMoneyBillWave, FaCalendarAlt, 
  FaSignOutAlt, FaCheckCircle, FaExclamationCircle, FaClock, FaBars, FaTimes, FaChartBar
} from 'react-icons/fa';

const PortalAsistencia = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarActive, setSidebarActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('student_token')) { navigate('/portal'); return; }
    fetchAsistencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchAsistencias = async () => {
    try {
      const res = await portalAPI.getAsistencias();
      setAsistencias(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    navigate('/portal');
  };

  // Calcular resumen por curso usando useMemo para eficiencia
  const resumenPorCurso = useMemo(() => {
    const resumen = {};
    asistencias.forEach(a => {
      if (!resumen[a.curso_nombre]) {
        resumen[a.curso_nombre] = { total: 0, asistencias: 0, faltas: 0, tardanzas: 0 };
      }
      resumen[a.curso_nombre].total += 1;
      if (a.estado === 'presente') resumen[a.curso_nombre].asistencias += 1;
      else if (a.estado === 'ausente') resumen[a.curso_nombre].faltas += 1;
      else if (a.estado === 'tardanza') resumen[a.curso_nombre].tardanzas += 1;
    });
    return Object.entries(resumen).map(([nombre, stats]) => {
      const porcFaltas = ((stats.faltas / stats.total) * 100).toFixed(1);
      return { nombre, ...stats, porcFaltas };
    });
  }, [asistencias]);

  const statusBadge = (estado) => {
    const map = {
      presente: { color: '#10b981', bg: '#f0fdf4', label: 'Presente', icon: <FaCheckCircle /> },
      ausente:  { color: '#ef4444', bg: '#fef2f2', label: 'Falta', icon: <FaExclamationCircle /> },
      tardanza: { color: '#f59e0b', bg: '#fffbeb', label: 'Tardanza', icon: <FaClock /> },
    };
    const s = map[estado] || { color: '#64748b', bg: '#f1f5f9', label: estado, icon: null };
    return (
      <span style={{ 
        background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 8, 
        fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 
      }}>
        {s.icon} {s.label}
      </span>
    );
  };

  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  return (
    <div className="portal-page">
      <button className="sidebar-toggle" onClick={() => setSidebarActive(!sidebarActive)}>
        {sidebarActive ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`portal-sidebar ${sidebarActive ? 'active' : ''}`}>
        <div style={styles.sidebarHeader}>
          <img src="/logo_oficial.png" alt="Academia Alba" style={{ width: '100%', maxWidth: 120 }} />
        </div>
        <nav style={styles.nav}>
          <Link to="/portal/inicio" style={styles.navLink}><FaUserGraduate /> <span>Mi Perfil</span></Link>
          <Link to="/portal/horario" style={styles.navLink}><FaCalendarAlt /> <span>Mi Horario</span></Link>
          <Link to="/portal/asistencia" style={{...styles.navLink, ...styles.navLinkActive}}><FaCalendarCheck /> <span>Mi Asistencia</span></Link>
          <Link to="/portal/pagos" style={styles.navLink}><FaMoneyBillWave /> <span>Mis Pagos</span></Link>
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /> Salir</button>
      </aside>

      <main className="portal-main">
        <div style={styles.header}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Mi Asistencia Académica</h1>
            <p style={{ color: '#64748b' }}>Resumen de puntualidad y registro detallado</p>
        </div>

        {/* 1. RESUMEN POR CURSO (VISTA TIPO UNIVERSIDAD) */}
        <div style={styles.card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaChartBar color="#4361ee" /> CUADRO RESUMEN DE ASISTENCIAS
          </h2>
          {resumenPorCurso.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>No hay estadísticas disponibles todavía.</p>
          ) : (
            <div className="portal-table-wrap">
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Curso</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Conteo</th>
                    <th style={{...styles.th, textAlign: 'center'}}>% Inasistencias</th>
                    <th style={styles.th}>Indicador Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenPorCurso.map((item, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 700}}>{item.nombre}</td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <span style={styles.countBadge}>{item.asistencias + item.tardanzas} de {item.total}</span>
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <span style={{ 
                          fontWeight: 800, 
                          color: item.porcFaltas > 20 ? '#ef4444' : '#1e293b',
                          background: item.porcFaltas > 20 ? '#fef2f2' : 'transparent',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {item.porcFaltas}%
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.progressBarBg}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${100 - item.porcFaltas}%`,
                            backgroundColor: item.porcFaltas > 20 ? '#ef4444' : item.porcFaltas > 10 ? '#f59e0b' : '#10b981'
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. HISTORIAL DETALLADO */}
        <div style={{...styles.card, marginTop: 30}}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#1e293b' }}>Registro Histórico Detallado</h2>
          {asistencias.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Aún no tienes registros de asistencia.</p>
          ) : (
            <div className="portal-table-wrap">
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha de Clase</th>
                    <th style={styles.th}>Curso</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Sustento</th>
                  </tr>
                </thead>
                <tbody>
                  {[...asistencias].reverse().map(a => (
                    <tr key={a.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}</strong>
                          <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>
                            {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long' })}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>{a.curso_nombre}</td>
                      <td style={styles.td}>{statusBadge(a.estado)}</td>
                      <td style={styles.td}>
                        {a.estado === 'ausente' ? (
                          <span style={{ fontSize: 12, color: '#ef4444', fontStyle: 'italic' }}>⚠️ Requiere justificación</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  spinner: { width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebarHeader: { background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', padding: '24px', display: 'flex', justifyContent: 'center' },
  nav: { flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 5 },
  navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  navLinkActive: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white' },
  logoutBtn: { margin: '12px', padding: '12px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 },
  header: { marginBottom: 20 },
  card: { background: 'white', borderRadius: 20, padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '16px', borderBottom: '1px solid #f8fafc', fontSize: 14 },
  tr: { transition: 'background 0.1s' },
  
  countBadge: { background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: 12, fontWeight: 700 },
  progressBarBg: { width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '10px', transition: 'width 0.5s ease-out' }
};

export default PortalAsistencia;

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import { 
  FaUserGraduate, FaCalendarCheck, FaMoneyBillWave, FaCalendarAlt, 
  FaSignOutAlt, FaCheckCircle, FaExclamationCircle, FaClock, FaBars, FaTimes 
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
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Historial de Asistencia</h1>
            <p style={{ color: '#64748b' }}>Consulta tu puntualidad y asistencia por fecha</p>
        </div>

        <div style={styles.card}>
          {asistencias.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Aún no tienes registros de asistencia.</p>
          ) : (
            <div className="portal-table-wrap">
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Curso</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map(a => (
                    <tr key={a.id} style={styles.tr}>
                      <td style={styles.td}><strong>{new Date(a.fecha).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></td>
                      <td style={styles.td}>{a.curso_nombre}</td>
                      <td style={styles.td}>{statusBadge(a.estado)}</td>
                      <td style={styles.td}>
                        {a.estado === 'ausente' ? '⚠️ Justifica tus faltas con secretaría' : '—'}
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
  page: { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  spinner: { width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebar: { background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', padding: '24px', display: 'flex', justifyContent: 'center' },
  nav: { flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 5 },
  navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  navLinkActive: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white' },
  logoutBtn: { margin: '12px', padding: '12px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 },
  main: { flex: 1, padding: '32px' },
  header: { marginBottom: 28 },
  card: { background: 'white', borderRadius: 20, padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '16px', borderBottom: '1px solid #f8fafc', fontSize: 14 },
  tr: { transition: 'background 0.1s' }
};

export default PortalAsistencia;

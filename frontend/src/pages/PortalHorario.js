import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import { FaCalendarAlt, FaUserGraduate, FaMoneyBillWave, FaSignOutAlt, FaChalkboardTeacher, FaLayerGroup } from 'react-icons/fa';

const PortalHorario = () => {
  const [horario, setHorario] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('student_token')) { navigate('/portal'); return; }
    portalAPI.getHorario()
      .then(res => setHorario(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    navigate('/portal');
  };

  // Mapeo de días para el grid visual
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const COLORES = ['#4361ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) return <div style={styles.loading}><div style={styles.spinner} /></div>;

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <img src="/logo_oficial.png" alt="Academia Alba" style={{ width: '100%', maxWidth: 120, height: 'auto' }} />
        </div>
        <nav style={styles.nav}>
          {[
            { to: '/portal/inicio',  icon: <FaUserGraduate />,  label: 'Mi Perfil' },
            { to: '/portal/horario', icon: <FaCalendarAlt />,   label: 'Mi Horario' },
            { to: '/portal/pagos',   icon: <FaMoneyBillWave />, label: 'Mis Pagos' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ ...styles.navLink, ...(window.location.pathname === item.to ? styles.navLinkActive : {}) }}>
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /> Salir</button>
      </aside>

      <main style={styles.main}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={styles.pageTitle}><FaCalendarAlt style={{ marginRight: 12, color: '#4361ee' }} />Mi Horario</h1>
          <p style={styles.pageSub}>Cursos activos en los que estás matriculado</p>
        </div>

        {horario.length === 0 ? (
          <div style={styles.emptyState}>
            <FaCalendarAlt size={48} color="#cbd5e1" />
            <p style={styles.emptyTitle}>Sin cursos matriculados</p>
            <p style={styles.emptyText}>Cuando te matricules en un curso activo, aparecerá aquí tu horario.</p>
          </div>
        ) : (
          <>
            {/* Cards de cursos */}
            <div style={styles.cursosGrid}>
              {horario.map((c, i) => {
                const color = COLORES[i % COLORES.length];
                return (
                  <div key={c.curso_id} style={{ ...styles.cursoCard, borderTop: `4px solid ${color}` }}>
                    <div style={{ ...styles.cursoIcon, background: `${color}18`, color }}>
                      <FaChalkboardTeacher size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={styles.cursoNombre}>{c.curso_nombre}</h3>
                      <span style={{ ...styles.nivelBadge, background: `${color}18`, color }}>
                        {c.nivel}
                      </span>
                      <div style={styles.cursoMeta}>
                        <div style={styles.metaItem}>
                          <FaLayerGroup style={{ color: '#94a3b8' }} />
                          <span>{c.ciclo_nombre || 'Sin ciclo'}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <FaUserGraduate style={{ color: '#94a3b8' }} />
                          <span>{c.docente_nombre || 'Sin asignar'}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <FaCalendarAlt style={{ color: '#94a3b8' }} />
                          <span style={{ fontWeight: 700, color: '#4361ee' }}>{c.horario || 'Sin horario'}</span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.estadoPago}>
                      {c.estado_pago === 'pagado'
                        ? <span style={{ ...styles.estadoBadge, background: '#f0fdf4', color: '#10b981' }}>✓ Pagado</span>
                        : c.estado_pago === 'parcial'
                          ? <span style={{ ...styles.estadoBadge, background: '#fffbeb', color: '#f59e0b' }}>Parcial</span>
                          : <span style={{ ...styles.estadoBadge, background: '#fef2f2', color: '#ef4444' }}>Pendiente</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista de días */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Resumen por Días</h2>
              <div style={styles.diasGrid}>
                {DIAS.map(dia => {
                  const cursosDia = horario.filter(c => c.horario?.toLowerCase().includes(dia.toLowerCase()));
                  return (
                    <div key={dia} style={{ ...styles.diaCol, ...(cursosDia.length > 0 ? styles.diaColActivo : {}) }}>
                      <p style={styles.diaLabel}>{dia}</p>
                      {cursosDia.length === 0
                        ? <p style={styles.diaVacio}>Libre</p>
                        : cursosDia.map((c, i) => (
                          <div key={i} style={{ ...styles.diaEvento, background: `${COLORES[horario.indexOf(c) % COLORES.length]}18`, color: COLORES[horario.indexOf(c) % COLORES.length] }}>
                            <strong style={{ fontSize: 12 }}>{c.curso_nombre}</strong>
                          </div>
                        ))
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinner: { width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebar: { width: 240, background: 'white', borderRight: '1px solid #e2e8f0', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', padding: '0 0 24px 0', zIndex: 100 },
  sidebarHeader: { background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  navLinkActive: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' },
  logoutBtn: { margin: '0 12px', padding: '12px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  main: { marginLeft: 240, flex: 1, padding: '32px 36px' },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', marginBottom: 6 },
  pageSub: { color: '#64748b', fontSize: 14, fontWeight: 500 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#475569' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 320 },
  cursosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16, marginBottom: 28 },
  cursoCard: { background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', gap: 16, alignItems: 'flex-start' },
  cursoIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cursoNombre: { fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  nivelBadge: { padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' },
  cursoMeta: { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', fontWeight: 500 },
  estadoPago: { flexShrink: 0 },
  estadoBadge: { padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-block' },
  card: { background: 'white', borderRadius: 20, padding: '28px 32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 },
  diasGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 },
  diaCol: { background: '#f8fafc', borderRadius: 12, padding: 14, minHeight: 100, border: '1px solid #f1f5f9' },
  diaColActivo: { background: '#f0f4ff', border: '1px solid #c7d2fe' },
  diaLabel: { fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.3px' },
  diaVacio: { fontSize: 12, color: '#cbd5e1', fontWeight: 500, textAlign: 'center', marginTop: 12 },
  diaEvento: { padding: '6px 10px', borderRadius: 8, marginBottom: 6, textAlign: 'center' },
};

export default PortalHorario;

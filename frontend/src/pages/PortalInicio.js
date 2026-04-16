import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import {
  FaUserGraduate, FaClipboardList, FaMoneyBillWave, FaCalendarAlt,
  FaSignOutAlt, FaCheckCircle, FaExclamationCircle, FaClock
} from 'react-icons/fa';

const PortalInicio = () => {
  const [perfil, setPerfil] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (!token) { navigate('/portal'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [perfilRes, matriculasRes, pagosRes] = await Promise.all([
        portalAPI.getPerfil(),
        portalAPI.getMatriculas(),
        portalAPI.getPagos(),
      ]);
      setPerfil(perfilRes.data.data);
      setMatriculas(matriculasRes.data.data || []);
      setPagos(pagosRes.data.data || []);
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

  const totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
  const totalDeuda = matriculas.reduce((acc, m) => acc + Math.max(0, parseFloat(m.monto_total || 0) - parseFloat(m.monto_pagado || 0)), 0);

  const estadoBadge = (estado) => {
    const map = {
      pagado:   { color: '#10b981', bg: '#f0fdf4', label: 'Pagado',   icon: <FaCheckCircle /> },
      parcial:  { color: '#f59e0b', bg: '#fffbeb', label: 'Parcial',  icon: <FaClock /> },
      pendiente:{ color: '#ef4444', bg: '#fef2f2', label: 'Pendiente',icon: <FaExclamationCircle /> },
    };
    const s = map[estado] || map.pendiente;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        {s.icon} {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <p style={{ color: '#64748b', fontWeight: 600, marginTop: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cargando tu información...</p>
      </div>
    );
  }

  return (
    <div className="portal-page">
      {/* SIDEBAR del portal */}
      <aside className="portal-sidebar">
        <div style={styles.sidebarHeader}>
          <img src="/logo_oficial.png" alt="Academia Alba" style={{ width: '100%', maxWidth: 120, height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
        </div>
        <nav style={styles.nav}>
          {[
            { to: '/portal/inicio',  icon: <FaUserGraduate />,    label: 'Mi Perfil' },
            { to: '/portal/horario', icon: <FaCalendarAlt />,     label: 'Mi Horario' },
            { to: '/portal/asistencia', icon: <FaCheckCircle />, label: 'Mi Asistencia' },
            { to: '/portal/pagos',   icon: <FaMoneyBillWave />,   label: 'Mis Pagos' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                ...styles.navLink,
                ...(window.location.pathname === item.to ? styles.navLinkActive : {})
              }}
            >
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <FaSignOutAlt /> Salir
        </button>
      </aside>

      {/* CONTENIDO */}
      <main className="portal-main">
        {/* Bienvenida */}
        <div style={styles.welcomeBanner}>
          <div>
            <h1 style={styles.welcomeTitle}>
              ¡Hola, {perfil?.nombres?.split(' ')[0]}! 👋
            </h1>
            <p style={styles.welcomeSub}>
              Bienvenido a tu portal estudiantil — Academia Alba Perú
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { label: 'Matrículas activas', value: matriculas.length, icon: <FaClipboardList />, color: '#4361ee', bg: '#eff6ff' },
            { label: 'Total pagado', value: `S/ ${totalPagado.toFixed(2)}`, icon: <FaMoneyBillWave />, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Saldo pendiente', value: `S/ ${totalDeuda.toFixed(2)}`, icon: <FaExclamationCircle />, color: totalDeuda > 0 ? '#ef4444' : '#10b981', bg: totalDeuda > 0 ? '#fef2f2' : '#f0fdf4' },
            { label: 'Pagos realizados', value: pagos.length, icon: <FaCheckCircle />, color: '#8b5cf6', bg: '#f5f3ff' },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p style={styles.statValue}>{s.value}</p>
                <p style={styles.statLabel}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Datos personales */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}><FaUserGraduate style={{ marginRight: 10, color: '#4361ee' }} />Mis Datos Personales</h2>
          <div style={styles.infoGrid}>
            {[
              { label: 'Nombres completos', value: `${perfil?.nombres} ${perfil?.apellidos}` },
              { label: 'DNI', value: perfil?.dni },
              { label: 'Correo electrónico', value: perfil?.email },
              { label: 'Teléfono', value: perfil?.telefono || '—' },
              { label: 'Dirección', value: perfil?.direccion || '—' },
              { label: 'Apoderado', value: perfil?.nombre_apoderado || '—' },
            ].map((item, i) => (
              <div key={i} style={styles.infoItem}>
                <span style={styles.infoLabel}>{item.label}</span>
                <span style={styles.infoValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matrículas recientes */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={styles.cardTitle}><FaClipboardList style={{ marginRight: 10, color: '#4361ee' }} />Mis Matrículas</h2>
            <Link to="/portal/horario" style={styles.viewAllLink}>Ver horario →</Link>
          </div>
          {matriculas.length === 0 ? (
            <p style={styles.emptyText}>No tienes matrículas registradas.</p>
          ) : (
            <div className="portal-table-wrap">
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Código', 'Curso', 'Ciclo', 'Horario', 'Monto Total', 'Estado Pago'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map(m => (
                    <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}><code style={styles.code}>{m.codigo}</code></td>
                      <td style={styles.td}><strong>{m.curso_nombre}</strong><br /><small style={{ color: '#64748b' }}>{m.nivel}</small></td>
                      <td style={styles.td}>{m.ciclo_nombre || '—'}</td>
                      <td style={styles.td}><span style={styles.horarioPill}>{m.horario || '—'}</span></td>
                      <td style={styles.td}>S/ {parseFloat(m.monto_total || 0).toFixed(2)}</td>
                      <td style={styles.td}>{estadoBadge(m.estado_pago)}</td>
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
  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' },
  spinner: { width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebar: {
    background: 'white', borderRight: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column',
    padding: '0 0 24px 0', boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
  },
  sidebarHeader: {
    background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', padding: '28px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    borderRadius: 12, color: '#475569', textDecoration: 'none', fontWeight: 600,
    fontSize: 14, transition: 'all 0.2s',
  },
  navLinkActive: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' },
  logoutBtn: {
    margin: '0 12px', padding: '12px 16px', background: '#fef2f2', color: '#ef4444',
    border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  main: { flex: 1, padding: '32px 36px' },
  welcomeBanner: {
    background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', borderRadius: 20,
    padding: '28px 32px', color: 'white', marginBottom: 28, display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 8px 24px rgba(67,97,238,0.3)',
  },
  welcomeTitle: { fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'white' },
  welcomeSub: { fontSize: 14, opacity: 0.8, color: 'white' },
  codigoBadge: {
    background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12,
    display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700,
    color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 },
  statCard: {
    background: 'white', borderRadius: 16, padding: '20px 24px', display: 'flex',
    alignItems: 'center', gap: 16, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  statValue: { fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  card: { background: 'white', borderRadius: 20, padding: '28px 32px', marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 24px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: 4, padding: '12px', background: '#f8fafc', borderRadius: 10 },
  infoLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3px' },
  infoValue: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f8fafc', fontSize: 13, color: '#0f172a', verticalAlign: 'middle' },
  tr: { transition: 'background 0.15s' },
  code: { background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#4361ee' },
  horarioPill: { background: '#eff6ff', color: '#3b82f6', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  emptyText: { color: '#94a3b8', fontWeight: 500, textAlign: 'center', padding: '20px 0' },
  viewAllLink: { color: '#4361ee', fontWeight: 700, textDecoration: 'none', fontSize: 14 },
};

export default PortalInicio;

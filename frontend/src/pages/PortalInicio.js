import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import StudentNavbar from '../components/StudentNavbar';
import {
  FaUserGraduate, FaClipboardList, FaMoneyBillWave,
  FaSignOutAlt, FaExclamationCircle, FaCheckCircle, FaClock
} from 'react-icons/fa';

const Skeleton = ({ width, height, borderRadius }) => (
  <div style={{ 
    width, height, borderRadius, 
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s infinite linear'
  }} />
);

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
      <div style={styles.page} className="premium-dashboard">
        <header style={styles.header}>
           <div style={styles.headerInner}><Skeleton width="150px" height="30px" /></div>
        </header>
        <main style={styles.main}>
           <Skeleton width="100%" height="150px" borderRadius="24px" />
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '30px' }}>
              {[1,2,3,4].map(i => <Skeleton key={i} width="100%" height="100px" borderRadius="20px" />)}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page} className="premium-dashboard">
      <style>{`
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1) !important; }
      `}</style>

      {/* Header Estilo Apple/Elite */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img src="/logo_oficial.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: '#1e293b' }}>ACADEMIA ALBA</h1>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontWeight: '700', letterSpacing: '0.1em' }}>PORTAL ALUMNO</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>{perfil?.nombres} {perfil?.apellidos}</div>
              <div style={{ fontSize: '10px', color: '#4361ee', fontWeight: '900', letterSpacing: '0.05em' }}>● ALUMNO ACTIVO</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Cerrar Sesión">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>
      <StudentNavbar />

      <main style={styles.main} className="fade-in">
        {/* Banner con Glassmorphism */}
        <div style={styles.banner}>
          <div style={{ flex: 1 }}>
            <div style={styles.badgeTop}>CENTRO DE APRENDIZAJE</div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              ¡Hola de nuevo, {perfil?.nombres?.split(' ')[0]}! 🎓
            </h2>
            <p style={{ opacity: 0.85, fontSize: '16px', fontWeight: '500', maxWidth: '500px' }}>
              Sigue tu progreso, revisa tus clases y mantente al día con tus metas académicas.
            </p>
          </div>
          <div style={styles.codigoBadge}>
             <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: '800', marginBottom: '4px' }}>CÓDIGO ALUMNO</div>
             <div style={{ fontSize: '20px', fontWeight: '900' }}>{perfil?.codigo}</div>
          </div>
        </div>

        {/* Stats Grid - Premium Cards */}
        <div style={styles.statsGrid}>
          {[
            { label: 'Matrículas', value: matriculas.length, icon: <FaClipboardList />, color: '#4361ee', bg: '#eff6ff' },
            { label: 'Total Pagado', value: `S/ ${totalPagado.toFixed(2)}`, icon: <FaMoneyBillWave />, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Saldo Pendiente', value: `S/ ${totalDeuda.toFixed(2)}`, icon: <FaExclamationCircle />, color: totalDeuda > 0 ? '#ef4444' : '#10b981', bg: totalDeuda > 0 ? '#fef2f2' : '#f0fdf4' },
            { label: 'Cursos Activos', value: matriculas.filter(m => m.estado_matricula === 'activa').length, icon: <FaUserGraduate />, color: '#8b5cf6', bg: '#f5f3ff' },
          ].map((s, i) => (
            <div key={i} style={styles.statCard} className="stat-card">
              <div style={{ ...styles.statIcon, background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <div style={styles.statLabel}>{s.label.toUpperCase()}</div>
                <div style={styles.statValue}>{s.value}</div>
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
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  header: { background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '12px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { background: '#f1f5f9', color: '#ef4444', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' },
  main: { maxWidth: 1400, margin: '0 auto', padding: '40px' },
  banner: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', padding: '45px 50px', borderRadius: '32px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' },
  badgeTop: { background: 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 14px', borderRadius: '50px', fontSize: '9px', fontWeight: '900', display: 'inline-block', marginBottom: '15px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.1)' },
  codigoBadge: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 25px', borderRadius: '20px', textAlign: 'center', backdropFilter: 'blur(5px)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' },
  statCard: { background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' },
  statIcon: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.05em' },
  statValue: { fontSize: '24px', fontWeight: '900', color: '#1e293b' },
  card: { background: 'white', borderRadius: '32px', padding: '35px', marginBottom: '30px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)' },
  cardTitle: { fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  infoItem: { background: '#f8fafc', padding: '18px 22px', borderRadius: '20px', border: '1px solid #f1f5f9' },
  infoLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' },
  infoValue: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '18px 25px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 25px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#475569' },
  tr: { transition: 'all 0.2s' },
  code: { background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#4361ee' },
  horarioPill: { background: '#eff6ff', color: '#4361ee', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' },
  emptyText: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '600' },
  viewAllLink: { color: '#4361ee', fontWeight: '800', textDecoration: 'none', fontSize: '14px', transition: 'all 0.2s' },
};

export default PortalInicio;

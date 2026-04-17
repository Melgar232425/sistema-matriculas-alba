import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import { FaCalendarAlt, FaUserGraduate, FaMoneyBillWave, FaSignOutAlt, FaChalkboardTeacher, FaBars, FaTimes, FaClock, FaCheckCircle } from 'react-icons/fa';

const PortalHorario = () => {
  const [horario, setHorario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarActive, setSidebarActive] = useState(false);
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

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const HORAS = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', 
    '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
  ];
  const COLORES = ['#4361ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Función para parsear el horario (Ej: "Lunes, Miercoles y Viernes 7:00 AM - 9:00 AM")
  const parseHorario = (str) => {
    if (!str) return [];
    try {
      const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      
      // Separar días de horas
      const match = str.match(/(.*)\s+(\d{1,2}:\d{2}\s+(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s+(?:AM|PM))/i);
      if (!match) return [];

      const [, diasStr, startStr, endStr] = match;
      const diasDetectados = DIAS.filter(d => normalizar(diasStr).includes(normalizar(d)));

      return diasDetectados.map(dia => ({
        dia,
        inicio: startStr.trim().toUpperCase(),
        fin: endStr.trim().toUpperCase()
      }));
    } catch (e) {
      return [];
    }
  };

  if (loading) return <div style={styles.loading}><div style={styles.spinner} /></div>;

  return (
    <div className="portal-page">
      <button className="sidebar-toggle" onClick={() => setSidebarActive(!sidebarActive)}>
        {sidebarActive ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`portal-sidebar ${sidebarActive ? 'active' : ''}`}>
        <div style={styles.sidebarHeader}>
          <img src="/logo_oficial.png" alt="Academia Alba" style={{ width: '100%', maxWidth: 120, height: 'auto' }} />
        </div>
        <nav style={styles.nav}>
          {[
            { to: '/portal/inicio',  icon: <FaUserGraduate />,  label: 'Mi Perfil' },
            { to: '/portal/horario', icon: <FaCalendarAlt />,   label: 'Mi Horario' },
            { to: '/portal/asistencia', icon: <FaCheckCircle />, label: 'Mi Asistencia' },
            { to: '/portal/pagos',   icon: <FaMoneyBillWave />, label: 'Mis Pagos' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ ...styles.navLink, ...(window.location.pathname === item.to ? styles.navLinkActive : {}) }}>
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /> Salir</button>
      </aside>

      <main className="portal-main">
        <div style={{ marginBottom: 28 }}>
          <h1 style={styles.pageTitle}><FaCalendarAlt style={{ marginRight: 12, color: '#4361ee' }} />Mi Horario Semanal</h1>
          <p style={styles.pageSub}>Vista interactiva de tus clases programadas</p>
        </div>

        {horario.length === 0 ? (
          <div style={styles.emptyState}>
            <FaCalendarAlt size={48} color="#cbd5e1" />
            <p style={styles.emptyTitle}>Sin cursos matriculados</p>
            <p style={styles.emptyText}>Cuando te matricules en un curso activo, aparecerá aquí tu horario semanal.</p>
          </div>
        ) : (
          <>
            {/* GRID DE CALENDARIO SEMANAL */}
            <div style={styles.calendarCard}>
              <div className="calendar-grid-header" style={styles.calendarHeader}>
                <div style={{...styles.headerCell, width: '80px'}}>Hora</div>
                {DIAS.map(dia => (
                  <div key={dia} style={styles.headerCell}>{dia}</div>
                ))}
              </div>

              <div style={styles.calendarBody}>
                {HORAS.map((hora, hIdx) => (
                  <div key={hora} style={styles.calendarRow}>
                    <div style={styles.timeLabel}>{hora}</div>
                    {DIAS.map(dia => {
                      // Buscar si hay algún curso en este día y esta hora
                      const cursoEnSlot = horario.find(c => {
                        const slots = parseHorario(c.horario);
                        return slots.some(s => {
                          if (s.dia !== dia) return false;
                          // Simplificación: si la hora de inicio coincide con el slot
                          return s.inicio === hora;
                        });
                      });

                      // Si coincide con la hora de inicio, calculamos duración
                      let duration = 0;
                      if (cursoEnSlot) {
                        const slot = parseHorario(cursoEnSlot.horario).find(s => s.dia === dia && s.inicio === hora);
                        const startH = parseInt(slot.inicio.split(':')[0]) + (slot.inicio.includes('PM') && !slot.inicio.startsWith('12') ? 12 : 0);
                        const endH = parseInt(slot.fin.split(':')[0]) + (slot.fin.includes('PM') && !slot.fin.startsWith('12') ? 12 : 0);
                        duration = endH - startH;
                      }

                      return (
                        <div key={dia} style={styles.calendarCell}>
                          {cursoEnSlot && (
                            <div style={{
                              ...styles.eventBlock,
                              height: `calc(${duration * 100}% + ${duration * 2}px)`,
                              background: COLORES[horario.indexOf(cursoEnSlot) % COLORES.length],
                              zIndex: 10
                            }}>
                              <span style={styles.eventTitle}>{cursoEnSlot.curso_nombre}</span>
                              <span style={styles.eventTime}>{cursoEnSlot.horario.split(' ').slice(-3).join(' ')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Listado de cursos para detalle (Cards compactos) */}
            <div style={{ marginTop: 40, marginBottom: 20 }}>
               <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Detalle de Cursos</h2>
            </div>
            <div style={styles.cursosGrid}>
              {horario.map((c, i) => {
                const color = COLORES[i % COLORES.length];
                return (
                  <div key={c.curso_id} style={{ ...styles.cursoCard, borderTop: `4px solid ${color}` }}>
                    <div style={{ ...styles.cursoIcon, background: `${color}18`, color }}>
                      <FaChalkboardTeacher size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={styles.cursoNombre}>{c.curso_nombre}</h3>
                      <div style={styles.cursoMeta}>
                        <div style={styles.metaItem}>
                          <FaUserGraduate size={12} />
                          <span>{c.docente_nombre}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <FaClock size={12} color={color} />
                          <span style={{ fontWeight: 700, color: color }}>{c.horario}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const styles = {
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinner: { width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebarHeader: { background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  navLinkActive: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' },
  logoutBtn: { margin: '0 12px', padding: '12px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', marginBottom: 6 },
  pageSub: { color: '#64748b', fontSize: 14, fontWeight: 500, marginBottom: 20 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#475569' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 320 },
  
  calendarCard: { 
    background: 'white', 
    borderRadius: 20, 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    overflowX: 'auto' // Crucial para móviles
  },
  calendarHeader: {
    display: 'grid',
    gridTemplateColumns: '80px repeat(6, 1fr)',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  headerCell: {
    padding: '16px 8px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  calendarBody: {
    minWidth: '800px' // Asegura que las columnas no se aplasten
  },
  calendarRow: {
    display: 'grid',
    gridTemplateColumns: '80px repeat(6, 1fr)',
    height: '60px', // Altura de 1 hora
    borderBottom: '1px solid #f1f5f9'
  },
  timeLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid #f1f5f9',
    background: '#fcfcfc'
  },
  calendarCell: {
    position: 'relative',
    borderRight: '1px solid #f8fafc',
    padding: '2px'
  },
  eventBlock: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    right: '2px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    padding: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    cursor: 'pointer'
  },
  eventTitle: {
    fontSize: '11px',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: '1.2',
    marginBottom: '2px'
  },
  eventTime: {
    fontSize: '9px',
    opacity: 0.9,
    fontWeight: '600'
  },
  
  cursosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 28 },
  cursoCard: { background: 'white', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center' },
  cursoIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cursoNombre: { fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 },
  cursoMeta: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', fontWeight: 600 },
};

export default PortalHorario;

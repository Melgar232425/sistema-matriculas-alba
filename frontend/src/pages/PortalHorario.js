import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import { FaCalendarAlt, FaCalendarCheck, FaUserGraduate, FaMoneyBillWave, FaSignOutAlt, FaBars, FaTimes, FaClock } from 'react-icons/fa';

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
  
  const COLORES_PREMIUM = [
    { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1' }, 
    { bg: '#dcfce7', border: '#22c55e', text: '#15803d' }, 
    { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' }, 
    { bg: '#ffedd5', border: '#f97316', text: '#c2410b' }, 
    { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' }, 
    { bg: '#f3e8ff', border: '#a855f7', text: '#7e22ce' }, 
    { bg: '#fae8ff', border: '#d946ef', text: '#a21caf' }, 
    { bg: '#f1f5f9', border: '#64748b', text: '#334155' }
  ];

  const normalizarHora = (timeStr, meridiem) => {
    let [hh, mm] = timeStr.split(':');
    return `${hh.padStart(2, '0')}:${mm} ${meridiem.toUpperCase()}`;
  };

  const parseHorario = (str) => {
    if (!str) return [];
    try {
      const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const regex = /^(.*?)\s*(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)$/i;
      const match = str.trim().match(regex);
      if (!match) return [];
      const [, diasStr, hInicio, mInicio, hFin, mFin] = match;
      
      let diasDetectados = [];
      const diasNorm = normalizar(diasStr);
      
      if (diasNorm.includes(' a ')) {
        const [inicioDia, finDia] = diasNorm.split(' a ');
        const idxInicio = DIAS.findIndex(d => normalizar(d).includes(inicioDia.trim()));
        const idxFin = DIAS.findIndex(d => normalizar(d).includes(finDia.trim()));
        if (idxInicio !== -1 && idxFin !== -1) {
          diasDetectados = DIAS.slice(idxInicio, idxFin + 1);
        }
      } else {
        diasDetectados = DIAS.filter(d => diasNorm.includes(normalizar(d)));
      }

      return diasDetectados.map(dia => ({
        dia,
        inicio: normalizarHora(hInicio, mInicio),
        fin: normalizarHora(hFin, mFin)
      }));
    } catch (e) { return []; }
  };

  const calcularHorasDuration = (inicio, fin) => {
    const parse = (h) => {
      let [time, mer] = h.split(' ');
      let [hh, mm] = time.split(':').map(Number);
      if (mer === 'PM' && hh !== 12) hh += 12;
      if (mer === 'AM' && hh === 12) hh = 0;
      return hh + mm/60;
    };
    return Math.max(1, parse(fin) - parse(inicio));
  };

  if (loading) return <div style={styles.center}><div style={styles.spinner}></div></div>;

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
          <Link to="/portal/horario" style={{...styles.navLink, ...styles.navLinkActive}}><FaCalendarAlt /> <span>Mi Horario</span></Link>
          <Link to="/portal/asistencia" style={styles.navLink}><FaCalendarCheck size={16} /> <span>Mi Asistencia</span></Link>
          <Link to="/portal/pagos" style={styles.navLink}><FaMoneyBillWave /> <span>Mis Pagos</span></Link>
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /> Salir</button>
      </aside>

      <main className="portal-main">
        <div style={styles.header}>
            <h1 style={styles.pageTitle}>Calendario Semanal de Clases</h1>
            <p style={styles.pageSub}>Distribución de tus lecciones académicas del periodo</p>
        </div>

        {horario.length === 0 ? (
          <div style={styles.emptyState}>
             <FaCalendarAlt size={40} color="#cbd5e1" />
             <p style={styles.emptyTitle}>No tienes cursos matriculados</p>
             <p style={styles.emptyText}>Tu horario aparecerá automáticamente cuando te registres en algún curso.</p>
          </div>
        ) : (
          <>
            <div style={styles.calendarCard}>
              <div style={styles.calendarHeader}>
                <div style={styles.headerCell}>HORA</div>
                {DIAS.map(d => <div key={d} style={styles.headerCell}>{d}</div>)}
              </div>
              <div style={styles.calendarBody}>
                {HORAS.map(hora => (
                  <div key={hora} style={styles.calendarRow}>
                    <div style={styles.timeLabel}>{hora}</div>
                    {DIAS.map(dia => {
                      let cursoEnSlot = null;
                      let duration = 1;
                      let slotRef = null;

                      horario.forEach(c => {
                        const slots = parseHorario(c.horario);
                        const match = slots.find(s => s.dia === dia && s.inicio === hora);
                        if (match) {
                           cursoEnSlot = c;
                           slotRef = match;
                           duration = calcularHorasDuration(match.inicio, match.fin);
                        }
                      });

                      const colorIdx = (horario.findIndex(c => c.curso_id === cursoEnSlot?.curso_id) % COLORES_PREMIUM.length);
                      const cp = cursoEnSlot ? COLORES_PREMIUM[colorIdx] : null;

                      return (
                        <div key={dia} style={styles.calendarCell}>
                          {cursoEnSlot && (
                            <div style={{
                              ...styles.eventBlock,
                              height: `calc(${duration * 100}% + ${(duration - 1) * 1}px)`,
                              backgroundColor: cp.bg,
                              borderLeft: `4px solid ${cp.border}`,
                              color: cp.text,
                              zIndex: 10
                            }}>
                              <div style={styles.eventTitle}>{cursoEnSlot.curso_nombre}</div>
                              <div style={styles.eventDocente}>{cursoEnSlot.docente_nombre}</div>
                              <div style={styles.eventTimeRange}>{slotRef.inicio} - {slotRef.fin}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 40, marginBottom: 20 }}>
               <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Resumen Detallado de Matrícula</h2>
            </div>
            <div style={styles.cursosGrid}>
          {horario.map((c, i) => {
            const cp = COLORES_PREMIUM[i % COLORES_PREMIUM.length];
            return (
              <div key={c.curso_id + '-' + i} style={{ ...styles.cursoCard, borderTop: `4px solid ${cp.border}` }}>
                <div style={{ ...styles.cursoIcon, background: cp.bg, color: cp.border }}>
                  <FaUserGraduate size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={styles.cursoNombre}>{c.curso_nombre}</h3>
                    <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', color: '#64748b' }}>
                      {c.ciclo_nombre || 'Ciclo Activo'}
                    </span>
                  </div>
                  <div style={styles.cursoMeta}>
                    <div style={styles.metaItem}>
                      <span>Cod: {c.estudiante_codigo} | Prof: {c.docente_nombre}</span>
                    </div>
                    <div style={{ ...styles.metaItem, color: cp.border, fontWeight: '700' }}>
                      <FaClock size={12} style={{ marginRight: 5 }} />
                      {c.horario}
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
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinner: { width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebarHeader: { background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  navLinkActive: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' },
  logoutBtn: { margin: '0 12px', padding: '12px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { marginBottom: 25 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  pageSub: { color: '#64748b', fontSize: 14, fontWeight: 500 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#475569' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 320 },
  calendarCard: { background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)', overflowX: 'auto', marginBottom: 30 },
  calendarHeader: { display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', minWidth: '900px' },
  headerCell: { padding: '16px 8px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  calendarBody: { minWidth: '900px' },
  calendarRow: { display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', height: '70px', borderBottom: '1px solid #f1f5f9' },
  timeLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRight: '1px solid #f1f5f9' },
  calendarCell: { position: 'relative', borderRight: '1px solid #f8fafc' },
  eventBlock: { position: 'absolute', top: 1, left: 1, right: 1, borderRadius: '6px', padding: '6px 8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', boxSizing: 'border-box', zIndex: 5 },
  eventTitle: { fontSize: '10px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.1' },
  eventDocente: { fontSize: '8px', fontWeight: '500', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  eventTimeRange: { fontSize: '8px', fontWeight: '700', marginTop: 'auto' },
  cursosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
  cursoCard: { background: 'white', borderRadius: '12px', padding: '15px', display: 'flex', gap: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cursoIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cursoNombre: { fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' },
  cursoMeta: { display: 'flex', flexDirection: 'column', gap: '6px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: '500' }
};

export default PortalHorario;

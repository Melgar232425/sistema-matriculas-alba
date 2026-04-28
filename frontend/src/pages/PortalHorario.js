import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalAPI } from '../services/api';
import StudentNavbar from '../components/StudentNavbar';
import { FaCalendarAlt, FaUserGraduate, FaSignOutAlt, FaClock } from 'react-icons/fa';

const PortalHorario = () => {
  const [horario, setHorario] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('student_token')) { navigate('/portal'); return; }
    portalAPI.getHorario()
      .then(res => setHorario(res.data.data || []))
      .catch(() => { /* Error de red silencioso */ })
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
    <div style={styles.page} className="premium-dashboard">
      {/* Header Estilo Apple/Elite */}
      <header style={styles.headerPremium}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img src="/logo_oficial.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: 'white' }}>ACADEMIA ALBA</h1>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontWeight: '700', letterSpacing: '0.1em' }}>HORARIO ALUMNO</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Cerrar Sesión">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>
      <StudentNavbar />

      <main style={styles.mainContent}>
        <div style={styles.pageHeader}>
            <div style={styles.badgeTop}>CALENDARIO ACADÉMICO</div>
            <h1 style={styles.pageTitle}>Mi Horario Semanal</h1>
            <p style={styles.pageSub}>Organización de tus lecciones para el periodo vigente</p>
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
               <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Resumen Detallado de Matrícula</h2>
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
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  headerPremium: { background: '#0f172a', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '12px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { color: '#4361ee', textDecoration: 'none', fontWeight: '800', fontSize: '13px' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' },
  mainContent: { maxWidth: 1400, margin: '0 auto', padding: '40px' },
  pageHeader: { marginBottom: '35px' },
  badgeTop: { background: '#eff6ff', color: '#4361ee', padding: '5px 14px', borderRadius: '50px', fontSize: '9px', fontWeight: '900', display: 'inline-block', marginBottom: '12px', letterSpacing: '0.1em' },
  pageTitle: { fontSize: '28px', fontWeight: '900', color: '#1e293b', marginBottom: '6px', letterSpacing: '-0.02em' },
  pageSub: { color: '#64748b', fontSize: '14px', fontWeight: '500' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinner: { width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12, background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0' },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#475569' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 320 },
  calendarCard: { background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)', overflowX: 'auto', marginBottom: '40px', padding: '20px' },
  calendarHeader: { display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', background: '#f8fafc', borderRadius: '16px', marginBottom: '10px', minWidth: '900px' },
  headerCell: { padding: '16px 8px', textAlign: 'center', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  calendarBody: { minWidth: '900px' },
  calendarRow: { display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', height: '75px', borderBottom: '1px solid #f8fafc' },
  timeLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f8fafc' },
  calendarCell: { position: 'relative' },
  eventBlock: { position: 'absolute', top: 2, left: 2, right: 2, borderRadius: '12px', padding: '8px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box', zIndex: 5, transition: 'all 0.2s' },
  eventTitle: { fontSize: '11px', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  eventDocente: { fontSize: '9px', fontWeight: '600', opacity: 0.8 },
  eventTimeRange: { fontSize: '9px', fontWeight: '900', marginTop: 'auto', opacity: 0.7 },
  cursosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  cursoCard: { background: 'white', borderRadius: '24px', padding: '20px', display: 'flex', gap: '15px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'all 0.3s' },
  cursoIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cursoNombre: { fontSize: '16px', fontWeight: '900', color: '#1e293b', marginBottom: '4px' },
  cursoMeta: { display: 'flex', flexDirection: 'column', gap: '6px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: '600' }
};

export default PortalHorario;

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../services/api';
import { 
  FaUserGraduate, FaMoneyBillWave, FaCalendarAlt, 
  FaSignOutAlt, FaCheckCircle, FaBars, FaTimes, FaFilePdf
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const PortalPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [sidebarActive, setSidebarActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('student_token')) { navigate('/portal'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [pagosRes, matRes] = await Promise.all([portalAPI.getPagos(), portalAPI.getMatriculas()]);
      setPagos(pagosRes.data.data || []);
      setMatriculas(matRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    navigate('/portal');
  };

  const pagosFiltrados = filtro
    ? pagos.filter(p => p.curso_nombre?.toLowerCase().includes(filtro.toLowerCase()))
    : pagos;

  const totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
  const totalDeuda = matriculas.reduce((acc, m) => acc + Math.max(0, parseFloat(m.monto_total || 0) - parseFloat(m.monto_pagado || 0)), 0);

  const metodoBadge = (metodo) => {
    const map = { efectivo: '#10b981', transferencia: '#3b82f6', yape: '#8b5cf6', plin: '#ec4899' };
    const color = map[metodo?.toLowerCase()] || '#64748b';
    return <span style={{ background: `${color}18`, color, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{metodo}</span>;
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
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}><FaMoneyBillWave style={{ marginRight: 12, color: '#4361ee' }} />Mis Pagos</h1>
            <p style={styles.pageSub}>Historial completo de tus abonos registrados</p>
          </div>
        </div>

        {/* Resumen */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total de pagos', value: pagos.length, color: '#4361ee', bg: '#eff6ff' },
            { label: 'Total pagado', value: `S/ ${totalPagado.toFixed(2)}`, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Saldo pendiente', value: `S/ ${totalDeuda.toFixed(2)}`, color: totalDeuda > 0 ? '#ef4444' : '#10b981', bg: totalDeuda > 0 ? '#fef2f2' : '#f0fdf4' },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
              <p style={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div style={styles.card}>
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="🔍  Buscar por curso..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {pagosFiltrados.length === 0 ? (
            <p style={styles.emptyText}>No se encontraron pagos.</p>
          ) : (
            <div className="portal-table-wrap">
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Código Pago', 'Curso', 'Monto', 'Fecha', 'Método', 'N° Recibo', 'Acciones'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map(p => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}><code style={styles.code}>{p.codigo}</code></td>
                      <td style={styles.td}><strong>{p.curso_nombre}</strong></td>
                      <td style={styles.td}><span style={styles.montoPill}>S/ {parseFloat(p.monto).toFixed(2)}</span></td>
                      <td style={styles.td}>{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-PE') : '—'}</td>
                      <td style={styles.td}>{metodoBadge(p.metodo_pago)}</td>
                      <td style={styles.td}><span style={{ color: '#64748b' }}>{p.numero_recibo || '—'}</span></td>
                      <td style={styles.td}>
                        <button
                          onClick={() => {
                            try {
                              const doc = new jsPDF();
                              const pageWidth = doc.internal.pageSize.getWidth();
                              
                              // Cabecera Alba
                              doc.setFillColor(67, 97, 238);
                              doc.rect(0, 0, pageWidth, 45, 'F');
                              doc.setTextColor(255, 255, 255);
                              doc.setFontSize(22);
                              doc.setFont('helvetica', 'bold');
                              doc.text('RECIBO DE PAGO OFICIAL', 15, 25);
                              
                              doc.setFontSize(10);
                              doc.setFont('helvetica', 'normal');
                              doc.text('ACADEMIA ALBA PERÚ - ÁREA DE FINANZAS', 15, 33);
                              doc.text(`Fecha de Impresión: ${new Date().toLocaleDateString('es-PE')}`, 15, 38);

                              // Cuerpo
                              doc.setTextColor(30, 41, 59);
                              doc.setFontSize(12);
                              doc.setFont('helvetica', 'bold');
                              doc.text('DETALLES DEL ABONO', 15, 60);

                              const tableData = [
                                ['CÓDIGO DE OPERACIÓN', p.codigo],
                                ['CONCEPTO / CURSO', p.curso_nombre.toUpperCase()],
                                ['MONTO ABONADO', `S/ ${parseFloat(p.monto).toFixed(2)}`],
                                ['FECHA DE PAGO', new Date(p.fecha_pago).toLocaleDateString('es-PE')],
                                ['MÉTODO DE PAGO', p.metodo_pago.toUpperCase()],
                                ['NÚMERO DE COMPROBANTE', p.numero_recibo || 'N/A']
                              ];

                              doc.autoTable({
                                startY: 70,
                                body: tableData,
                                theme: 'grid',
                                styles: { fontSize: 10, cellPadding: 6 },
                                columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 60 } }
                              });

                              const finalY = doc.lastAutoTable.finalY + 20;
                              doc.setFontSize(9);
                              doc.setTextColor(148, 163, 184);
                              doc.text('Este documento es una constancia digital de pago realizada en nuestro portal.', 15, finalY);
                              doc.text('Gracias por su confianza en Academia Alba Perú.', 15, finalY + 5);

                              doc.save(`Recibo_Alba_${p.numero_recibo || p.codigo}.pdf`);
                              toast.success('Recibo descargado');
                            } catch(e) { toast.error('Error al generar PDF'); }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#eff6ff', color: '#4361ee', border: 'none',
                            padding: '6px 12px', borderRadius: 8, fontSize: 12,
                            fontWeight: 700, cursor: 'pointer'
                          }}
                          title="Descargar PDF"
                        >
                          <FaFilePdf size={14} /> PDF
                        </button>
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
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinner: { width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebar: { background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '0 0 24px 0', zIndex: 100 },
  sidebarHeader: { background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  nav: { flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  navLinkActive: { background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', boxShadow: '0 4px 12px rgba(67,97,238,0.3)' },
  logoutBtn: { margin: '0 12px', padding: '12px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  main: { flex: 1, padding: '32px 36px' },
  header: { marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', marginBottom: 6 },
  pageSub: { color: '#64748b', fontSize: 14, fontWeight: 500 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 },
  statCard: { background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  statValue: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: 600 },
  card: { background: 'white', borderRadius: 20, padding: '24px 28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' },
  searchInput: { width: '100%', maxWidth: 340, height: 42, border: '2px solid #e2e8f0', borderRadius: 50, paddingLeft: 20, fontSize: 14, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f8fafc', fontSize: 13, color: '#0f172a', verticalAlign: 'middle' },
  tr: {},
  code: { background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#4361ee' },
  montoPill: { background: '#f0fdf4', color: '#10b981', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700 },
  emptyText: { color: '#94a3b8', fontWeight: 500, textAlign: 'center', padding: '24px 0' },
};

export default PortalPagos;

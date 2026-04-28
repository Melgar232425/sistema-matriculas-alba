import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalAPI } from '../services/api';
import StudentNavbar from '../components/StudentNavbar';
import { 
  FaMoneyBillWave, FaSignOutAlt, FaFilePdf
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const PortalPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
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
    <div style={styles.page} className="premium-dashboard">
      {/* Header Estilo Apple/Elite */}
      <header style={styles.headerPremium}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img src="/logo_oficial.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: 'white' }}>ACADEMIA ALBA</h1>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontWeight: '700', letterSpacing: '0.1em' }}>PAGOS ALUMNO</p>
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
        {/* Banner con Glassmorphism */}
        <div style={styles.banner}>
          <div style={{ flex: 1 }}>
            <div style={styles.badgeTop}>ESTADO DE CUENTA</div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              Mi Historial de Pagos 💸
            </h2>
            <p style={{ opacity: 0.85, fontSize: '16px', fontWeight: '500', maxWidth: '500px' }}>
              Consulta tus abonos, descarga recibos oficiales y mantén tus finanzas académicas al día.
            </p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '20px 30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
             <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: '900', marginBottom: '5px' }}>SALDO PENDIENTE</div>
             <div style={{ fontSize: '28px', fontWeight: '900', color: totalDeuda > 0 ? '#ff8a8a' : '#fff' }}>S/ {totalDeuda.toFixed(2)}</div>
          </div>
        </div>

        {/* Stats Row - Premium Cards */}
        <div style={styles.statsRow}>
          {[
            { label: 'Abonos realizados', value: pagos.length, color: '#4361ee', bg: '#eff6ff' },
            { label: 'Inversión total', value: `S/ ${totalPagado.toFixed(2)}`, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Cursos con deuda', value: matriculas.filter(m => (m.monto_total - m.monto_pagado) > 0).length, color: totalDeuda > 0 ? '#ef4444' : '#10b981', bg: totalDeuda > 0 ? '#fef2f2' : '#f0fdf4' },
          ].map((s, i) => (
            <div key={i} style={styles.statCard} className="stat-card">
              <div style={{ ...styles.statIcon, background: s.bg, color: s.color }}><FaMoneyBillWave /></div>
              <div>
                <div style={styles.statLabel}>{s.label.toUpperCase()}</div>
                <div style={styles.statValue}>{s.value}</div>
              </div>
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
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  headerPremium: { background: '#0f172a', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '12px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { color: '#4361ee', textDecoration: 'none', fontWeight: '800', fontSize: '13px' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' },
  mainContent: { maxWidth: 1400, margin: '0 auto', padding: '40px' },
  banner: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', padding: '45px 50px', borderRadius: '32px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' },
  badgeTop: { background: 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 14px', borderRadius: '50px', fontSize: '9px', fontWeight: '900', display: 'inline-block', marginBottom: '15px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.1)' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' },
  spinner: { width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' },
  statCard: { background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' },
  statIcon: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.05em' },
  statValue: { fontSize: '24px', fontWeight: '900', color: '#0f172a' },
  card: { background: 'white', borderRadius: '32px', padding: '35px', marginBottom: '30px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)' },
  searchInput: { width: '100%', maxWidth: '340px', background: '#f8fafc', border: '2px solid #f1f5f9', padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', color: '#0f172a', outline: 'none', transition: 'all 0.2s', marginBottom: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '18px 25px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 25px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#475569' },
  tr: { transition: 'all 0.2s' },
  code: { background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#4361ee' },
  montoPill: { background: '#f0fdf4', color: '#10b981', padding: '6px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: '900' },
  emptyText: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '600' }
};

export default PortalPagos;

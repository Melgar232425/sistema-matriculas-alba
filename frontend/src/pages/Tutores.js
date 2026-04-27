import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { estudiantesAPI, pagosAPI, matriculasAPI, seguimientosAPI } from '../services/api';
import { FaSearch, FaPhone, FaExclamationTriangle, FaCheckCircle, FaClipboardList, FaCommentDots, FaFilePdf, FaUserGraduate, FaIdCard, FaUsers, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Tutores = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [historialSeguimiento, setHistorialSeguimiento] = useState([]);
  const [seguimiento, setSeguimiento] = useState({ comentario: '', contacto_padre: '' });
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [saving, setSaving] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resEst, , resMat] = await Promise.all([
        estudiantesAPI.getAll(),
        pagosAPI.getAll(),
        matriculasAPI.getAll()
      ]);

      const dataEnriquecida = resEst.data.data.map(est => {
        const misMatriculas = resMat.data.data.filter(m => m.estudiante_id === est.id);
        const tieneDeuda = misMatriculas.some(m => (m.monto_total - m.monto_pagado) > 0);
        
        return {
          ...est,
          tieneDeuda,
          totalCursos: misMatriculas.length,
          matriculas: misMatriculas
        };
      });

      setEstudiantes(dataEnriquecida);
    } catch (error) {
      toast.error('Error al cargar datos de seguimiento');
    } finally {
      setLoading(false);
    }
  };

  // Componente de Carga Elegante (Skeleton)
  const Skeleton = ({ width, height, borderRadius = '12px' }) => (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite linear'
    }} />
  );

  const handlesaveSeguimiento = async (e) => {
    e.preventDefault();
    if (seguimiento.comentario.length < 5) {
      toast.error('❌ El comentario es muy corto.');
      return;
    }
    
    try {
      setSaving(true);
      await seguimientosAPI.create({
        estudiante_id: selectedEstudiante.id,
        comentario: seguimiento.comentario,
        contacto_padre: seguimiento.contacto_padre
      });
      
      toast.success(`Seguimiento registrado con éxito`);
      setSeguimiento({ comentario: '', contacto_padre: '' });
      
      // Recargar historial
      const res = await seguimientosAPI.getPorEstudiante(selectedEstudiante.id);
      setHistorialSeguimiento(res.data.data);
    } catch (err) {
      toast.error('Error al guardar el seguimiento');
    } finally {
      setSaving(false);
    }
  };

  const abrirPerfil = async (est) => {
    setSelectedEstudiante(est);
    setHistorialSeguimiento([]);
    try {
      const res = await seguimientosAPI.getPorEstudiante(est.id);
      setHistorialSeguimiento(res.data.data);
    } catch (err) {
      console.error("Error al cargar historial", err);
    }
  };

  const estudiantesFiltrados = estudiantes.filter(est =>
    est.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    est.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
    est.dni.includes(busqueda)
  );

  const generarPDF = (est, mat) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Azul Alba
      doc.setFillColor(67, 97, 238);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTADO DE CUENTA', 15, 30);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('SISTEMA DE TUTORÍA - ACADEMIA ALBA PERÚ', 15, 40);

      // Cuerpo
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.text('DETALLE DEL ESTUDIANTE', 15, 65);

      const rows = [
        ['ESTUDIANTE', `${est.nombres} ${est.apellidos}`.toUpperCase()],
        ['DNI', est.dni],
        ['CURSO', mat.curso_nombre],
        ['SITUACIÓN', (mat.monto_total - mat.monto_pagado) > 0 ? 'DEUDA PENDIENTE' : 'CANCELADO'],
        ['TOTAL CURSO', `S/ ${parseFloat(mat.monto_total).toFixed(2)}`],
        ['PAGADO', `S/ ${parseFloat(mat.monto_pagado).toFixed(2)}`],
        ['PENDIENTE', `S/ ${(mat.monto_total - mat.monto_pagado).toFixed(2)}`]
      ];

      doc.autoTable({
        startY: 75,
        body: rows,
        theme: 'striped',
        styles: { fontSize: 11, cellPadding: 8 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } }
      });

      doc.save(`Alba_Seguimiento_${est.dni}.pdf`);
      toast.success('Estado de cuenta generado');
    } catch (err) {
      toast.error('Error al generar PDF');
    }
  };

  return (
    <div style={styles.page}>
      {/* Header Premium Estilo Alba */}
      <header style={styles.headerPremium}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img src="/logo_oficial.png" alt="Logo Alba" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: '#f8fafc' }}>ACADEMIA ALBA</h1>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, fontWeight: '700', letterSpacing: '0.1em' }}>PORTAL TUTOR</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>
                {(user?.nombres || user?.nombre) ? `${user.nombres || user.nombre} ${user.apellidos || ''}`.trim() : 'Tutor Verificado'}
              </div>
              <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', letterSpacing: '0.05em' }}>
                ● TUTOR ACADÉMICO
              </div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Cerrar Sesión">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>

      <main style={styles.mainContent}>
        <style>{`
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .student-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important; }
        .filter-btn:hover { background: #e2e8f0; }
      `}</style>

      {/* Dashboard Ejecutivo de Tutoría */}
      <div style={styles.statsDashboard} className="fade-in">
        <div style={styles.statBox}>
          <div style={{...styles.statCircle, background: '#eef2ff', color: '#4361ee'}}><FaUsers /></div>
          <div>
            <div style={styles.statValue}>{estudiantes.length}</div>
            <div style={styles.statLabel}>Estudiantes Totales</div>
          </div>
        </div>
        <div style={styles.statBox}>
          <div style={{...styles.statCircle, background: '#fff1f2', color: '#e11d48'}}><FaExclamationTriangle /></div>
          <div>
            <div style={styles.statValue}>{estudiantes.filter(e => e.tieneDeuda).length}</div>
            <div style={styles.statLabel}>En Riesgo Financiero</div>
          </div>
        </div>
        <div style={styles.statBox}>
          <div style={{...styles.statCircle, background: '#f0fdf4', color: '#16a34a'}}><FaCheckCircle /></div>
          <div>
            <div style={styles.statValue}>{estudiantes.filter(e => !e.tieneDeuda).length}</div>
            <div style={styles.statLabel}>Al Día / Solventes</div>
          </div>
        </div>
      </div>

      {/* Filtros Inteligentes */}
      <div style={styles.filterBar} className="fade-in">
        <div style={styles.filterTabs}>
          {['Todos', 'Deudores', 'Al Día'].map(tab => (
            <button 
              key={tab}
              onClick={() => setFiltroEstado(tab)}
              style={{
                ...styles.filterTab,
                ...(filtroEstado === tab ? styles.filterTabActive : {})
              }}
              className="filter-btn"
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Buscador Integrado */}
        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div style={styles.grid}>
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} width="100%" height="220px" borderRadius="24px" />)}
        </div>
      ) : (
        <div style={styles.grid} className="fade-in">
          {estudiantesFiltrados
            .filter(est => {
              if (filtroEstado === 'Deudores') return est.tieneDeuda;
              if (filtroEstado === 'Al Día') return !est.tieneDeuda;
              return true;
            })
            .map(est => (
            <div key={est.id} style={styles.estCard(est.tieneDeuda)} onClick={() => abrirPerfil(est)} className="student-card">
              <div style={styles.cardTop}>
                <div style={styles.userAvatar}><FaUserGraduate /></div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1e293b' }}>{est.apellidos}, {est.nombres}</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800' }}>DNI: {est.dni}</span>
                </div>
                {est.tieneDeuda ? (
                  <div style={styles.debtTag}>RIESGO</div>
                ) : (
                  <div style={styles.paidTag}>SOLVENTE</div>
                )}
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}><FaClipboardList color="#4361ee" size={14} /> <span>{est.totalCursos} Cursos Inscritos</span></div>
                <div style={styles.infoRow}><FaPhone color="#10b981" size={14} /> <span>{est.telefono_apoderado || 'S/APODERADO'}</span></div>
              </div>

              <div style={styles.cardFooter}>
                <button style={styles.trackBtn}>
                   <FaCommentDots /> GESTIONAR SEGUIMIENTO
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Tutoría Premium */}
      {selectedEstudiante && (
        <div className="modal-overlay" onClick={() => setSelectedEstudiante(null)}>
          <div className="modal" style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                 <div style={styles.modalAvatar}><FaIdCard /></div>
                 <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{selectedEstudiante.nombres} {selectedEstudiante.apellidos}</h2>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Historial Académico y Tutoría</p>
                 </div>
               </div>
               <button style={styles.closeModal} onClick={() => setSelectedEstudiante(null)}>×</button>
            </div>

            <div style={styles.modalContent}>
               <h4 style={styles.sectionTitle}>SITUACIÓN FINANCIERA X CURSO</h4>
               <div style={styles.matList}>
                 {selectedEstudiante.matriculas.map(m => (
                   <div key={m.id} style={styles.matRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '14px' }}>{m.curso_nombre}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Estado: {m.estado_pago.toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontWeight: '900', color: (m.monto_total - m.monto_pagado) > 0 ? '#ef4444' : '#10b981' }}>
                           S/ {(m.monto_total - m.monto_pagado).toFixed(2)}
                        </div>
                        <button onClick={() => generarPDF(selectedEstudiante, m)} style={styles.pdfBtn}>
                          <FaFilePdf /> PDF
                        </button>
                      </div>
                   </div>
                 ))}
               </div>

                {/* Historial de Seguimiento */}
                <h4 style={{ ...styles.sectionTitle, marginTop: '30px' }}><FaHistory /> HISTORIAL DE TUTORÍA</h4>
                <div style={styles.historyContainer}>
                  {historialSeguimiento.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No hay registros previos para este estudiante.</p>
                  ) : (
                    historialSeguimiento.map(item => (
                      <div key={item.id} style={styles.historyItem}>
                        <div style={styles.historyMeta}>
                          <span style={styles.historyDate}>{new Date(item.fecha).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={styles.historyContent}>{item.comentario}</div>
                      </div>
                    ))
                  )}
                </div>

                <form style={{ marginTop: '30px' }} onSubmit={handlesaveSeguimiento}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#475569', marginBottom: '8px' }}>
                    OBSERVACIONES / SEGUIMIENTO DEL TUTOR
                  </label>
                  <textarea 
                    style={styles.textarea}
                    placeholder="Escribe aquí las incidencias, llamadas a padres o acuerdos con el alumno..."
                    value={seguimiento.comentario}
                    onChange={e => setSeguimiento({...seguimiento, comentario: e.target.value})}
                    required
                  />
                  <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button type="button" onClick={() => setSelectedEstudiante(null)} style={styles.cancelBtn} disabled={saving}>Cancelar</button>
                    <button type="submit" style={styles.saveModalBtn} disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar Seguimiento'}
                    </button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  headerPremium: { background: '#0f172a', padding: '15px 40px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  headerInner: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  mainContent: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px' },
  statsDashboard: { display: 'flex', gap: '25px', marginBottom: '40px', flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: '260px', background: 'white', padding: '24px', borderRadius: '28px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  statCircle: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statValue: { fontSize: '28px', fontWeight: '900', color: '#1e293b', lineHeight: '1' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: '800', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '25px', flexWrap: 'wrap' },
  filterTabs: { display: 'flex', background: 'rgba(241, 245, 249, 0.8)', backdropFilter: 'blur(10px)', padding: '6px', borderRadius: '20px', gap: '5px', border: '1px solid #e2e8f0' },
  filterTab: { padding: '12px 28px', borderRadius: '16px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '800', color: '#64748b', cursor: 'pointer', transition: 'all 0.3s' },
  filterTabActive: { background: 'white', color: '#4361ee', boxShadow: '0 10px 15px -3px rgba(67, 97, 238, 0.15)' },
  searchContainer: { position: 'relative', flex: '1', maxWidth: '450px' },
  searchIcon: { position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '16px 20px 16px 60px', background: 'white', border: '2px solid #f1f5f9', borderRadius: '50px', fontSize: '14px', fontWeight: '600', outline: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'all 0.3s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' },
  estCard: (debt) => ({
    background: 'white',
    padding: '28px',
    borderRadius: '32px',
    border: `1px solid ${debt ? '#fecdd3' : '#e2e8f0'}`,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    position: 'relative',
    overflow: 'hidden'
  }),
  cardTop: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '25px' },
  userAvatar: { width: '50px', height: '50px', background: '#f8fafc', color: '#4361ee', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid #f1f5f9' },
  debtTag: { background: '#fff1f2', color: '#e11d48', fontWeight: '900', fontSize: '9px', padding: '5px 12px', borderRadius: '50px', letterSpacing: '0.05em' },
  paidTag: { background: '#f0fdf4', color: '#16a34a', fontWeight: '900', fontSize: '9px', padding: '5px 12px', borderRadius: '50px', letterSpacing: '0.05em' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '25px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#475569', fontWeight: '700' },
  cardFooter: { borderTop: '1px solid #f1f5f9', paddingTop: '22px' },
  trackBtn: { width: '100%', background: '#f8fafc', border: '1.5px dashed #e2e8f0', padding: '14px', borderRadius: '18px', color: '#4361ee', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' },
  modal: { 
    maxWidth: '700px', 
    width: '95%', 
    maxHeight: '90vh', 
    borderRadius: '32px', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column',
    position: 'relative',
    background: 'white'
  },
  modalHeader: { 
    padding: '30px', 
    background: 'white', 
    borderBottom: '1px solid #f1f5f9', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexShrink: 0
  },
  modalContent: {
    padding: '30px',
    overflowY: 'auto',
    flex: 1,
    scrollbarWidth: 'thin',
    scrollbarColor: '#e2e8f0 transparent'
  },
  modalAvatar: { width: '54px', height: '54px', background: '#eef2ff', color: '#4361ee', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  closeModal: { background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '22px', transition: 'all 0.2s' },
  sectionTitle: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '20px', textTransform: 'uppercase' },
  matList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  matRow: { background: '#f8fafc', padding: '18px 25px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', transition: 'all 0.2s' },
  pdfBtn: { background: 'white', color: '#ef4444', border: '1.5px solid #fee2e2', padding: '8px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  textarea: { width: '100%', padding: '22px', borderRadius: '20px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: '600', outline: 'none', minHeight: '140px', fontFamily: 'inherit', background: '#fcfcfc', transition: 'all 0.3s' },
  saveModalBtn: { flex: 2, background: 'linear-gradient(135deg, #4361ee, #2563eb)', color: 'white', border: 'none', padding: '16px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(67, 97, 238, 0.4)', transition: 'all 0.3s' },
  cancelBtn: { flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '16px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s' },
  historyContainer: { display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' },
  historyItem: { background: '#f8fafc', padding: '15px', borderRadius: '16px', borderLeft: '4px solid #4361ee' },
  historyMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' },
  historyDate: { fontSize: '11px', fontWeight: '800', color: '#4361ee' },
  historyContent: { fontSize: '13px', color: '#1e293b', fontWeight: '500', lineHeight: '1.5' }
};

export default Tutores;

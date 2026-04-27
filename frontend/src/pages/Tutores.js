import React, { useState, useEffect } from 'react';
import { estudiantesAPI, pagosAPI, matriculasAPI } from '../services/api';
import { FaSearch, FaPhone, FaExclamationTriangle, FaCheckCircle, FaClipboardList, FaCommentDots, FaFilePdf, FaUserGraduate, FaIdCard, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Tutores = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [seguimiento, setSeguimiento] = useState({ comentario: '', contacto_padre: '' });
  const [filtroEstado, setFiltroEstado] = useState('Todos');

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

  const handlesaveSeguimiento = (e) => {
    e.preventDefault();
    if (seguimiento.comentario.length < 10) {
      toast.error('❌ El comentario debe ser más descriptivo.');
      return;
    }
    toast.success(`Seguimiento registrado con éxito`);
    setSeguimiento({ comentario: '', contacto_padre: '' });
    setSelectedEstudiante(null);
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
    <div className="main-content" style={{ padding: '30px' }}>
      {/* Dashboard Ejecutivo de Tutoría */}
      <div style={styles.statsDashboard}>
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
      <div style={styles.filterBar}>
        <div style={styles.filterTabs}>
          {['Todos', 'Deudores', 'Al Día'].map(tab => (
            <button 
              key={tab}
              onClick={() => {
                if (tab === 'Todos') setBusqueda('');
                if (tab === 'Deudores') { setBusqueda(''); /* Logic for state filter */ }
                setFiltroEstado(tab);
              }}
              style={{
                ...styles.filterTab,
                ...(filtroEstado === tab ? styles.filterTabActive : {})
              }}
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
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '20px', fontWeight: 'bold', color: '#64748b' }}>Cargando Estudiantes...</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {estudiantesFiltrados
            .filter(est => {
              if (filtroEstado === 'Deudores') return est.tieneDeuda;
              if (filtroEstado === 'Al Día') return !est.tieneDeuda;
              return true;
            })
            .map(est => (
            <div key={est.id} style={styles.estCard(est.tieneDeuda)} onClick={() => setSelectedEstudiante(est)}>
              <div style={styles.cardTop}>
                <div style={styles.userAvatar}><FaUserGraduate /></div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{est.apellidos}, {est.nombres}</h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>DNI: {est.dni}</span>
                </div>
                {est.tieneDeuda ? (
                  <div style={styles.debtTag}><FaExclamationTriangle /> DEUDA</div>
                ) : (
                  <div style={styles.paidTag}><FaCheckCircle /> AL DÍA</div>
                )}
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}><FaClipboardList color="#3b82f6" /> <span>{est.totalCursos} Cursos Inscritos</span></div>
                <div style={styles.infoRow}><FaPhone color="#10b981" /> <span>{est.telefono_apoderado || 'Sin apoderado'}</span></div>
              </div>

              <div style={styles.cardFooter}>
                <button style={styles.trackBtn}>
                   <FaCommentDots /> REGISTRAR SEGUIMIENTO
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

            <div style={{ padding: '25px' }}>
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
                    <button type="button" onClick={() => setSelectedEstudiante(null)} style={styles.cancelBtn}>Cancelar</button>
                    <button type="submit" style={styles.saveModalBtn}>Guardar Seguimiento</button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  headerIcon: { width: '55px', height: '55px', background: 'linear-gradient(135deg, #4361ee, #6366f1)', color: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 10px 15px -3px rgba(67, 97, 238, 0.3)' },
  statsDashboard: { display: 'flex', gap: '25px', marginBottom: '35px', flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: '240px', background: 'white', padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  statCircle: { width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statValue: { fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: '1' },
  statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '4px' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '20px', flexWrap: 'wrap' },
  filterTabs: { display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '16px', gap: '5px' },
  filterTab: { padding: '10px 24px', borderRadius: '12px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '800', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' },
  filterTabActive: { background: 'white', color: '#4361ee', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  searchContainer: { position: 'relative', flex: '1', maxWidth: '400px' },
  searchIcon: { position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '14px 15px 14px 55px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '50px', fontSize: '14px', outline: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'all 0.3s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  estCard: (debt) => ({
    background: 'white',
    padding: '24px',
    borderRadius: '24px',
    border: `1px solid ${debt ? '#fecada' : '#e2e8f0'}`,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  cardTop: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  userAvatar: { width: '45px', height: '45px', background: '#f1f5f9', color: '#6366f1', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  debtTag: { background: '#fff1f2', color: '#e11d48', fontWeight: '900', fontSize: '10px', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' },
  paidTag: { background: '#f0fdf4', color: '#16a34a', fontWeight: '900', fontSize: '10px', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', fontWeight: '600' },
  cardFooter: { borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  trackBtn: { width: '100%', background: '#f8fafc', border: '1.5px dashed #e2e8f0', padding: '12px', borderRadius: '15px', color: '#6366f1', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' },
  modal: { maxWidth: '650px', borderRadius: '28px' },
  modalHeader: { padding: '25px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalAvatar: { width: '50px', height: '50px', background: '#eef2ff', color: '#4361ee', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
  closeModal: { background: '#f1f5f9', border: 'none', width: '35px', height: '35px', borderRadius: '10px', cursor: 'pointer', fontWeight: '900', fontSize: '20px' },
  sectionTitle: { fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '15px' },
  matList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  matRow: { background: '#f8fafc', padding: '15px 20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9' },
  pdfBtn: { background: 'white', color: '#ef4444', border: '1px solid #fee2e2', padding: '6px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
  textarea: { width: '100%', padding: '18px', borderRadius: '18px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', minHeight: '120px', fontFamily: 'inherit', background: '#fcfcfc' },
  saveModalBtn: { flex: 2, background: 'linear-gradient(135deg, #4361ee, #2563eb)', color: 'white', border: 'none', padding: '15px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)' },
  cancelBtn: { flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '15px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' }
};

export default Tutores;

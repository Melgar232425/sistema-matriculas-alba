import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalAPI } from '../services/api';
import StudentNavbar from '../components/StudentNavbar';
import { 
  FaSignOutAlt, FaChartBar, FaFilePdf
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const getDiasDeClase = (horarioStr) => {
  if (!horarioStr) return [];
  const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const horNorm = horarioStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return DIAS_SEMANA.filter(d => horNorm.includes(d));
};

const calcularTotalSesiones = (fechaInicio, fechaFin, horarioStr) => {
  if (!fechaInicio || !fechaFin || !horarioStr) return 0;
  const diasClase = getDiasDeClase(horarioStr);
  if (diasClase.length === 0) return 0;
  const startStr = typeof fechaInicio === 'string' ? fechaInicio.split('T')[0] : new Date(fechaInicio).toISOString().split('T')[0];
  const endStr = typeof fechaFin === 'string' ? fechaFin.split('T')[0] : new Date(fechaFin).toISOString().split('T')[0];
  
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  let count = 0;
  const current = new Date(start);
  const diasSemanaMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const normalizar = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  while (current <= end) {
    const diaActual = normalizar(diasSemanaMap[current.getDay()]);
    if (diasClase.includes(diaActual)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const PortalAsistencia = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('student_user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('student_token')) { navigate('/portal'); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [asisRes, matRes] = await Promise.all([
        portalAPI.getAsistencias(),
        portalAPI.getMatriculas()
      ]);
      setAsistencias(asisRes.data.data || []);
      setMatriculas(matRes.data.data || []);
    } catch {
      // Error de red: el usuario ya ve la UI vacía
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    navigate('/portal');
  };

  const resumenPorCurso = useMemo(() => {
    const cursosMap = {};
    
    // Inicializar con datos de matrículas usando curso_id único
    matriculas.forEach(m => {
      const key = `${m.curso_id}_${m.id}`; // Llave única por curso y matrícula
      cursosMap[key] = {
        id: m.curso_id,
        nombre: m.curso_nombre,
        horario: m.horario,
        asistencias: 0,
        faltas: 0,
        totalCiclo: calcularTotalSesiones(m.fecha_inicio, m.fecha_fin, m.horario)
      };
    });

    // Sumar asistencias reales filtrando por matricula_id
    asistencias.forEach(a => {
      // Buscamos la matrícula correspondiente usando matricula_id (a.matricula_id) o curso_id (a.curso_id)
      // Pero para ser 100% precisos usamos la combinación matricula_id si está disponible
      const key = Object.keys(cursosMap).find(k => k.endsWith(`_${a.matricula_id}`));
      if (key) {
        if (a.estado === 'presente' || a.estado === 'tardanza') {
          cursosMap[key].asistencias++;
        } else if (a.estado === 'ausente') {
          cursosMap[key].faltas++;
        }
      }
    });

    return Object.values(cursosMap);
  }, [asistencias, matriculas]);

  const handleDescargarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(15, 23, 42); // Navy Blue
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE ASISTENCIAS', 15, 25);
      doc.setFontSize(10);
      doc.text('Academia Alba Perú - Gestión Académica', 15, 35);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text(`Alumno: ${user.nombres} ${user.apellidos}`, 15, 60);
      doc.text(`Código: ${user.codigo || '—'}`, 15, 67);

      const tableData = resumenPorCurso.map(item => [
        item.nombre,
        `${item.asistencias} de ${item.totalCiclo}`,
        `${item.totalCiclo > 0 ? ((item.faltas / item.totalCiclo) * 100).toFixed(1) : 0}%`,
        item.totalCiclo > 0 ? (item.asistencias / item.totalCiclo * 100).toFixed(0) + '%' : '0%'
      ]);

      doc.autoTable({
        startY: 80,
        head: [['CURSO', 'ASISTENCIAS', '% FALTAS', 'CUMPLIMIENTO']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });

      doc.save(`Asistencia_Alba_${user.apellidos}.pdf`);
    } catch { /* PDF: error silencioso */ }
  };

  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  return (
    <div style={styles.page} className="premium-dashboard">
      <header style={styles.headerPremium}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img src="/logo_oficial.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: 'white' }}>ACADEMIA ALBA</h1>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: '700', letterSpacing: '0.1em' }}>ASISTENCIA ALUMNO</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /></button>
        </div>
      </header>
      <StudentNavbar />

      <main style={styles.mainContent}>
        <div style={styles.banner}>
          <div style={{ flex: 1 }}>
            <div style={styles.badgeTop}>CONTROL ACADÉMICO</div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>Mi Registro de Asistencias 📋</h2>
            <p style={{ opacity: 0.85, fontSize: '16px', fontWeight: '500' }}>Sigue tu progreso real basado en el ciclo completo.</p>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 25, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 15 }}>
            <FaChartBar color="#4361ee" /> RESUMEN ACUMULADO DEL CICLO
          </h2>
          
          <div className="portal-table-wrap">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Materia / Curso</th>
                  <th style={{...styles.th, textAlign: 'center'}}>Conteo Asist.</th>
                  <th style={{...styles.th, textAlign: 'center'}}>% Inasistencias</th>
                  <th style={{...styles.th, width: '30%'}}>Estado Visual</th>
                </tr>
              </thead>
              <tbody>
                {resumenPorCurso.map((item, idx) => {
                  const porcAsistencia = item.totalCiclo > 0 ? Math.round((item.asistencias / item.totalCiclo) * 100) : 0;
                  const porcFaltas = item.totalCiclo > 0 ? ((item.faltas / item.totalCiclo) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx} style={styles.tr}>
                      <td style={{...styles.td, color: '#1e293b'}}>
                        <div style={{fontWeight: 700}}>{item.nombre}</div>
                        <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>{item.horario}</div>
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <div style={styles.countBadge}>{item.asistencias} de {item.totalCiclo}</div>
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <span style={{ 
                          fontWeight: 800, 
                          color: parseFloat(porcFaltas) > 20 ? '#ef4444' : '#1e293b',
                          background: parseFloat(porcFaltas) > 20 ? '#fef2f2' : '#f8fafc',
                          padding: '4px 12px', borderRadius: '8px', fontSize: '13px'
                        }}>
                          {porcFaltas}%
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.progressBarBg}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${porcAsistencia}%`,
                            background: 'linear-gradient(90deg, #4361ee, #4cc9f0)'
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, paddingBottom: 40 }}>
           <button onClick={handleDescargarPDF} style={styles.pdfFullBtn}>
             <FaFilePdf size={20} /> DESCARGAR REPORTE DETALLADO (PDF)
           </button>
        </div>
      </main>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  headerPremium: { background: '#0f172a', padding: '12px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  mainContent: { maxWidth: 1400, margin: '0 auto', padding: '40px' },
  banner: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '45px 50px', borderRadius: '32px', marginBottom: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' },
  badgeTop: { background: 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 14px', borderRadius: '50px', fontSize: '9px', fontWeight: '900', display: 'inline-block', marginBottom: '15px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.1)' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  spinner: { width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  card: { background: 'white', borderRadius: '32px', padding: '35px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '18px 25px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 25px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#475569' },
  tr: { transition: 'all 0.2s' },
  countBadge: { background: '#eff6ff', color: '#4361ee', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 800, display: 'inline-block' },
  progressBarBg: { width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '10px', transition: 'width 1s ease' },
  pdfFullBtn: { background: '#0f172a', color: 'white', border: 'none', padding: '18px 45px', borderRadius: '20px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }
};

export default PortalAsistencia;

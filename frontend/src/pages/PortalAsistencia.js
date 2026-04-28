import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalAPI } from '../services/api';
import StudentNavbar from '../components/StudentNavbar';
import { 
  FaSignOutAlt, FaChartBar, FaFilePdf
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const PortalAsistencia = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    const start = new Date(fechaInicio + 'T12:00:00');
    const end = new Date(fechaFin + 'T12:00:00');
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

  const user = JSON.parse(localStorage.getItem('student_user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('student_token')) { navigate('/portal'); return; }
    fetchAsistencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchAsistencias = async () => {
    try {
      const [asisRes, matRes] = await Promise.all([
        portalAPI.getAsistencias(),
        portalAPI.getMatriculas()
      ]);
      setAsistencias(asisRes.data.data || []);
      setMatriculas(matRes.data.data || []);
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

  const formatearFechaStr = (fechaRaw) => {
    try {
      if (!fechaRaw) return '—';
      const dateStr = fechaRaw.includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {
      return 'Fecha no disponible';
    }
  };

  const handleDescargarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(67, 97, 238);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DETALLADO DE ASISTENCIAS', 15, 25);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Academia Alba Perú - Gestión Académica Integral', 15, 33);
      doc.text(`Periodo Lectivo: ${new Date().getFullYear()} I-B`, 15, 38);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(15, 41, 100, 41);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN GENERAL DEL ALUMNO', 15, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nombres y Apellidos: ${user.nombres} ${user.apellidos}`, 15, 68);
      doc.text(`DNI / Código: ${user.codigo || '—'}`, 15, 74);
      doc.text(`Fecha de Impresión: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, 15, 80);

      const tableData = [...asistencias].reverse().map(a => [
        formatearFechaStr(a.fecha).toUpperCase(),
        a.curso_nombre,
        a.estado.toUpperCase(),
        a.estado === 'ausente' ? 'FALTA INJUSTIFICADA' : 'REGISTRO OK'
      ]);

      doc.autoTable({
        startY: 90,
        head: [['FECHA DE CLASE', 'CURSO / MATERIA', 'ESTADO', 'OBSERVACIÓN']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [67, 97, 238], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 4, valign: 'middle' },
        columnStyles: { 0: { cellWidth: 50 }, 2: { fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Este documento es un reporte digital generado desde el Portal Académico de Academia Alba Perú.', 15, finalY);
      doc.save(`Alba_Reporte_Asistencia_${user.apellidos}.pdf`);
    } catch (err) { alert("Error al generar el PDF."); }
  };

  const resumenPorCurso = useMemo(() => {
    const cursosMap = {};
    
    // Inicializar con datos de matrículas para tener las fechas del ciclo
    matriculas.forEach(m => {
      cursosMap[m.curso_nombre] = {
        nombre: m.curso_nombre,
        asistencias: 0,
        faltas: 0,
        totalCiclo: calcularTotalSesiones(m.fecha_inicio, m.fecha_fin, m.horario)
      };
    });

    // Sumar asistencias reales
    asistencias.forEach(a => {
      if (!cursosMap[a.curso_nombre]) {
        cursosMap[a.curso_nombre] = { nombre: a.curso_nombre, asistencias: 0, faltas: 0, totalCiclo: 0 };
      }
      if (a.estado === 'presente' || a.estado === 'tardanza') {
        cursosMap[a.curso_nombre].asistencias++;
      } else if (a.estado === 'ausente') {
        cursosMap[a.curso_nombre].faltas++;
      }
    });

    return Object.values(cursosMap);
  }, [asistencias, matriculas]);

  if (loading) return <div style={styles.center}><div style={styles.spinner} /></div>;

  return (
    <div style={styles.page} className="premium-dashboard">
      {/* Header Estilo Apple/Elite */}
      <header style={styles.headerPremium}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <img src="/logo_oficial.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: 'white' }}>ACADEMIA ALBA</h1>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0, fontWeight: '700', letterSpacing: '0.1em' }}>ASISTENCIA ALUMNO</p>
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
            <div style={styles.badgeTop}>CONTROL ACADÉMICO</div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              Mi Registro de Asistencias 📋
            </h2>
            <p style={{ opacity: 0.85, fontSize: '16px', fontWeight: '500', maxWidth: '500px' }}>
              Mantén un seguimiento riguroso de tus clases asistidas y tardanzas del periodo vigente.
            </p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '20px 30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
             <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: '900', marginBottom: '5px' }}>CUMPLIMIENTO TOTAL</div>
             <div style={{ fontSize: '28px', fontWeight: '900' }}>{asistencias.length > 0 ? (100 - (asistencias.filter(a => a.estado === 'ausente').length / asistencias.length * 100)).toFixed(0) : 0}%</div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 25, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 15 }}>
            <FaChartBar color="#4361ee" /> CURSOS MATRICULADOS EN EL PERIODO - MIS ASISTENCIAS
          </h2>
          {resumenPorCurso.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay registros de asistencia.</p>
          ) : (
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
                        <td style={{...styles.td, fontWeight: 700, color: '#1e293b'}}>{item.nombre}</td>
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
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, paddingBottom: 40 }}>
           <button onClick={handleDescargarPDF} style={styles.pdfFullBtn}>
             <FaFilePdf size={20} /> REPORTE DETALLADO DE ASISTENCIAS DEL PERIODO
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
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' },
  mainContent: { maxWidth: 1400, margin: '0 auto', padding: '40px' },
  banner: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', padding: '45px 50px', borderRadius: '32px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' },
  badgeTop: { background: 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 14px', borderRadius: '50px', fontSize: '9px', fontWeight: '900', display: 'inline-block', marginBottom: '15px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.1)' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' },
  spinner: { width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  card: { background: 'white', borderRadius: '32px', padding: '35px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '18px 25px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 25px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#475569' },
  tr: { transition: 'all 0.2s' },
  countBadge: { background: '#eff6ff', color: '#4361ee', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 800, display: 'inline-block' },
  progressBarBg: { width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f1f5f9' },
  progressBarFill: { height: '100%', borderRadius: '10px', transition: 'width 1s cubic-bezier(0.65, 0, 0.35, 1)' },
  pdfFullBtn: { background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', color: 'white', border: 'none', padding: '18px 45px', borderRadius: '20px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 15px 30px -5px rgba(239, 68, 68, 0.3)', transition: 'all 0.3s' }
};

export default PortalAsistencia;

import React, { useState, useEffect } from 'react';
import { estudiantesAPI, pagosAPI, matriculasAPI } from '../services/api';
import { FaSearch, FaUserShield, FaPhone, FaExclamationTriangle, FaCheckCircle, FaClipboardList, FaCommentDots } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Tutores = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [seguimiento, setSeguimiento] = useState({ comentario: '', contacto_padre: '' });

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

      // Enriquecer datos de estudiantes con estado de pagos y matrícula
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
      toast.error('❌ El comentario de seguimiento debe ser más descriptivo (mín. 10 carac.).');
      return;
    }
    toast.success(`Seguimiento registrado para ${selectedEstudiante.nombres}`);
    setSeguimiento({ comentario: '', contacto_padre: '' });
    setSelectedEstudiante(null);
  };

  const estudiantesFiltrados = estudiantes.filter(est =>
    est.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    est.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
    est.dni.includes(busqueda)
  );

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className="stat-icon primary" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                <FaUserShield />
              </div>
              <h2 className="card-title">Módulo de Seguimiento y Tutoría</h2>
           </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '45px', borderRadius: '50px', backgroundColor: '#f8fafc' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <div style={{ padding: '0 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {estudiantesFiltrados.map(est => (
              <div key={est.id} className="card" style={{ padding: '20px', border: est.tieneDeuda ? '1px solid #fecaca' : '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setSelectedEstudiante(est)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                   <div style={{ fontWeight: '800', fontSize: '16px' }}>{est.nombres} {est.apellidos}</div>
                   {est.tieneDeuda ? <FaExclamationTriangle color="#ef4444" title="Deuda Pendiente" /> : <FaCheckCircle color="#10b981" title="Al día" />}
                </div>
                
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaClipboardList /> {est.totalCursos} Cursos Matriculados
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaPhone /> {est.telefono_apoderado || 'Sin tel. apoderado'}
                   </div>
                </div>

                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${est.tieneDeuda ? 'badge-danger' : 'badge-success'}`}>
                        {est.tieneDeuda ? 'Moroso' : 'Al día'}
                    </span>
                    <button className="btn-icon btn-icon-view"><FaCommentDots /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEstudiante && (
        <div className="modal-overlay" onClick={() => setSelectedEstudiante(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>Seguimiento: {selectedEstudiante.nombres}</h2>
               <button onClick={() => setSelectedEstudiante(null)}>×</button>
            </div>
            <div className="modal-body">
               <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                   <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Resumen de Matrículas</h4>
                   {selectedEstudiante.matriculas.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>Sin matrículas</p> : null}
                   {selectedEstudiante.matriculas.map(m => (
                       <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                           <span>{m.curso_nombre}</span>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                               <span style={{ fontWeight: 'bold', color: (m.monto_total - m.monto_pagado) > 0 ? '#ef4444' : '#10b981' }}>
                                   S/ {(m.monto_total - m.monto_pagado).toFixed(2)} pendiente
                               </span>
                               <button 
                                 title="Descargar Estado de Cuenta (PDF)"
                                 className="btn-icon" 
                                 style={{ width: '28px', height: '28px', background: '#fee2e2', color: '#ef4444' }}
                                 onClick={() => {
                                   try {
                                     const jsPDF = require('jspdf').default || require('jspdf');
                                     const doc = new jsPDF();
                                     doc.text("ESTADO DE CUENTA", 105, 20, { align: "center" });
                                     doc.text(`Alumno: ${selectedEstudiante.nombres} ${selectedEstudiante.apellidos}`, 20, 40);
                                     doc.text(`DNI: ${selectedEstudiante.dni}`, 20, 50);
                                     doc.text(`Curso: ${m.curso_nombre}`, 20, 60);
                                     doc.text(`Monto Total: S/ ${m.monto_total}`, 20, 70);
                                     doc.text(`Pagado: S/ ${m.monto_pagado}`, 20, 80);
                                     doc.text(`Deuda Pendiente: S/ ${(m.monto_total - m.monto_pagado).toFixed(2)}`, 20, 90);
                                     doc.setDrawColor(200);
                                     doc.line(20, 100, 190, 100);
                                     doc.text("Academia Alba Perú - Tutoría", 105, 110, { align: "center" });
                                     doc.save(`Estado_Cuenta_${selectedEstudiante.dni}_${m.curso_id}.pdf`);
                                     toast.success('PDF generado con éxito');
                                   } catch(err) {
                                     console.error(err);
                                     toast.error('Error al generar PDF');
                                   }
                                 }}
                               >
                                 PDF
                               </button>
                           </div>
                       </div>
                   ))}
               </div>

               <form onSubmit={handlesaveSeguimiento}>
                  <div className="form-group">
                      <label>Comentario del Tutor (Llamada / Entrevista)</label>
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        value={seguimiento.comentario}
                        onChange={e => setSeguimiento({...seguimiento, comentario: e.target.value})}
                        placeholder="Ej: Se llamó al padre por tardanzas constantes. Refiere problemas de transporte..."
                        required
                      ></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedEstudiante(null)}>Cerrar</button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Nota</button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutores;

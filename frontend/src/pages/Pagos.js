import React, { useState, useEffect } from 'react';
import { pagosAPI, matriculasAPI } from '../services/api';
import { FaSearch, FaFilePdf } from 'react-icons/fa';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const Pagos = () => {
  const [pagos, setPagos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [buscadorDni, setBuscadorDni] = useState('');
  const [formData, setFormData] = useState({
    matricula_id: '',
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    numero_recibo: '',
    observaciones: ''
  });

  const generarNumeroRecibo = () => {
    const ahora = new Date();
    const strFecha = ahora.getFullYear().toString() + (ahora.getMonth() + 1).toString().padStart(2, '0') + ahora.getDate().toString().padStart(2, '0');
    const strHora = ahora.getHours().toString().padStart(2, '0') + ahora.getMinutes().toString().padStart(2, '0') + ahora.getSeconds().toString().padStart(2, '0');
    return `REC-${strFecha}-${strHora}`;
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resPagos, resMatriculas] = await Promise.all([
        pagosAPI.getAll(),
        matriculasAPI.getAll({ estado_matricula: 'activa' })
      ]);
      setPagos(resPagos.data.data);
      setMatriculas(resMatriculas.data.data.filter(m => m.estado_pago !== 'pagado'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatriculaChange = (e) => {
    const id = e.target.value;
    const sel = matriculas.find(m => m.id.toString() === id);
    if (sel) {
      setFormData({ ...formData, matricula_id: id, monto: (sel.monto_total - sel.monto_pagado).toFixed(2), numero_recibo: generarNumeroRecibo() });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const montoNum = parseFloat(formData.monto);
    if (montoNum <= 0) {
      toast.error('❌ El monto a pagar debe ser mayor a 0.', { icon: '' });
      return;
    }

    // Validar que no pague más de la deuda
    const sel = matriculas.find(m => m.id.toString() === formData.matricula_id.toString());
    if (sel) {
        const deudaPendiente = sel.monto_total - sel.monto_pagado;
        if (montoNum > (deudaPendiente + 0.01)) { // Margen pequeño por redondeo
            toast.error(`❌ El monto (S/ ${montoNum}) supera la deuda pendiente (S/ ${deudaPendiente.toFixed(2)}).`, { icon: '' });
            return;
        }
    }

    try {
      await pagosAPI.create(formData);
      toast.success('Pago registrado con éxito');
      setShowModal(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar pago');
    }
  };

  const cerrarModal = () => setShowModal(false);

  const exportarReciboPDF = (pago) => {
      const doc = new jsPDF();
      doc.text("RECIBO DE PAGO", 105, 20, { align: "center" });
      doc.text(`Alumno: ${pago.nombres} ${pago.apellidos}`, 20, 40);
      doc.text(`Monto: S/ ${pago.monto}`, 20, 50);
      doc.save(`Recibo_${pago.codigo}.pdf`);
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Registro de Pagos</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Registrar Pago</button>
        </div>

        <div style={{
          padding: '0 15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div className="search-box" style={{ flex: '1 1 250px', maxWidth: '100%', marginBottom: 0 }}>
            <FaSearch style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Filtrar por código de pago..." 
              value={filtroCodigo} 
              onChange={e => setFiltroCodigo(e.target.value)} 
              className="form-control"
              style={{ paddingLeft: '45px', borderRadius: '50px', backgroundColor: '#f8fafc', height: '42px' }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            backgroundColor: '#f1f5f9', 
            padding: '4px 12px', 
            borderRadius: '20px',
            flexShrink: 0
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: filtroCodigo ? '#4361ee' : '#cbd5e1'
            }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
               {pagos.filter(p => p.codigo.includes(filtroCodigo)).length} Pagos
            </span>
          </div>
        </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Estudiante</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.filter(p => p.codigo.includes(filtroCodigo)).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{p.codigo}</td>
                    <td>{new Date(p.fecha_pago).toLocaleDateString()}</td>
                    <td>
                        <div style={{ fontWeight: '600' }}>{p.nombres} {p.apellidos}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800' }}>S/ {p.monto}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon btn-icon-view" 
                        onClick={() => exportarReciboPDF(p)}
                        title="Descargar PDF"
                      >
                         <FaFilePdf />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                 <h2>Nuevo Pago</h2>
                 <button onClick={cerrarModal}>×</button>
            </div>
            <div className="modal-body">
                 <form onSubmit={handleSubmit}>
                     <div className="form-group">
                         <label>DNI Alumno</label>
                         <input type="text" value={buscadorDni} onChange={e => setBuscadorDni(e.target.value)} />
                     </div>
                     <div className="form-group">
                         <label>Matrícula</label>
                         <select value={formData.matricula_id} onChange={handleMatriculaChange} required>
                             <option value="">Seleccionar</option>
                             {matriculas.filter(m => m.dni.includes(buscadorDni)).map(m => (
                                 <option key={m.id} value={m.id}>{m.nombres} - {m.curso_nombre}</option>
                             ))}
                         </select>
                     </div>
                     <div className="form-group">
                         <label>Monto</label>
                         <input type="number" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} required />
                     </div>
                     <button type="submit" className="btn btn-primary">Registrar</button>
                 </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;

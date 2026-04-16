// Página de Pagos
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { pagosAPI, matriculasAPI } from '../services/api';
import { FaPlus, FaFilePdf, FaSearch, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Pagos = () => {
  const [pagos, setPagos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [buscadorDni, setBuscadorDni] = useState('');
  const [matriculaSeleccionada, setMatriculaSeleccionada] = useState(null);
  const [formData, setFormData] = useState({
    matricula_id: '',
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    numero_recibo: '',
    observaciones: ''
  });

  // Función para generar un número de recibo aleatorio basado en la fecha y hora
  const generarNumeroRecibo = () => {
    const ahora = new Date();
    const strFecha = ahora.getFullYear().toString() +
      (ahora.getMonth() + 1).toString().padStart(2, '0') +
      ahora.getDate().toString().padStart(2, '0');
    const strHora = ahora.getHours().toString().padStart(2, '0') +
      ahora.getMinutes().toString().padStart(2, '0') +
      ahora.getSeconds().toString().padStart(2, '0');
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

      const matriculasConDeuda = resMatriculas.data.data.filter(
        m => m.estado_pago === 'pendiente' || m.estado_pago === 'parcial'
      );

      setPagos(resPagos.data.data);
      setMatriculas(matriculasConDeuda);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.matricula_id || !matriculaSeleccionada) {
      toast.error('❌ Debe seleccionar una matrícula válida con deuda pendiente.', { icon: '' });
      return;
    }

    if (parseFloat(formData.monto) <= 0) {
      toast.error('❌ El monto debe ser mayor a 0.', { icon: '' });
      return;
    }

    try {
      await pagosAPI.create({
        ...formData,
        monto: parseFloat(formData.monto),
        usuario_registro: 'admin'
      });

      const alumno = matriculaSeleccionada
        ? `${matriculaSeleccionada.nombres} ${matriculaSeleccionada.apellidos}`
        : 'el estudiante';

      toast.success(`Pago de S/ ${parseFloat(formData.monto).toFixed(2)} registrado exitosamente para ${alumno}`);
      setShowModal(false);
      setMatriculaSeleccionada(null);
      setBuscadorDni('');
      setFormData({
        matricula_id: '',
        monto: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        numero_recibo: '',
        observaciones: ''
      });
      cargarDatos();
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || 'Error al registrar pago'}`, { icon: '' });
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setMatriculaSeleccionada(null);
    setBuscadorDni('');
    setFormData({
      matricula_id: '',
      monto: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      numero_recibo: '',
      observaciones: ''
    });
  };

  const handleMatriculaChange = (e) => {
    const id = e.target.value;
    const seleccionada = matriculas.find(m => m.id.toString() === id);
    setMatriculaSeleccionada(seleccionada || null);

    if (seleccionada) {
      const montoPendiente = (seleccionada.monto_total - seleccionada.monto_pagado).toFixed(2);
      setFormData({
        ...formData,
        matricula_id: id,
        monto: montoPendiente,
        numero_recibo: generarNumeroRecibo()
      });
    } else {
      setFormData({
        ...formData,
        matricula_id: id,
        monto: '',
        numero_recibo: ''
      });
    }
  };

  const exportarReciboPDF = (pago) => {
    // Orientación horizontal (landscape) o vertical (portrait)
    const doc = new jsPDF();

    // Colores corporativos (Azul Alba y Grises)
    const primaryColor = [30, 64, 175];   // Azul
    const secondaryColor = [243, 244, 246]; // Gris claro para fondos
    const textColor = [55, 65, 81];       // Gris oscuro para texto

    // 1. Cabecera (Fondo de color superior)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F'); // Ancho A4: 210, Altura cabecera: 35

    // Título Principal en Blanco
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("ACADEMIA ALBA", 105, 22, { align: "center" });

    // 2. Título Secundario - Comprobante
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.text("COMPROBANTE DE PAGO", 105, 50, { align: "center" });

    // Línea separadora sutil
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 56, 190, 56);

    // 3. Información Principal (Cajas lado a lado)
    const startY = 65;

    // Caja Izquierda: Detalle de Recibo
    doc.setFillColor(...secondaryColor);
    doc.roundedRect(20, startY, 80, 25, 3, 3, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Número de Recibo:", 25, startY + 8);
    doc.text("Fecha Emisión:", 25, startY + 18);

    doc.setFont("helvetica", "bold");
    doc.text(pago.codigo || pago.numero_recibo || "Generado Auto.", 58, startY + 8);
    doc.text(new Date(pago.fecha_pago).toLocaleDateString(), 55, startY + 18);

    // Caja Derecha: Emisor (Academia)
    doc.roundedRect(110, startY, 80, 25, 3, 3, 'F');

    doc.setFont("helvetica", "normal");
    doc.text("RUC:", 115, startY + 8);
    doc.text("Dirección:", 115, startY + 18);

    doc.setFont("helvetica", "bold");
    doc.text("20123456789", 125, startY + 8);
    doc.text("Campus Central", 133, startY + 18);

    // 4. Datos del Estudiante
    const studentY = startY + 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text("DATOS DEL ESTUDIANTE", 20, studentY);

    // Fila del estudiante
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    doc.text("Nombre:", 20, studentY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(`${pago.nombres} ${pago.apellidos}`, 40, studentY + 8);

    doc.setFont("helvetica", "bold");
    doc.text("Curso:", 20, studentY + 16);
    doc.setFont("helvetica", "normal");
    doc.text(pago.curso_nombre || pago.curso || 'No especificado', 35, studentY + 16);

    // 5. Tabla de Detalles del Pago
    autoTable(doc, {
      startY: studentY + 25,
      head: [['Descripción del Concepto', 'Forma de Pago', 'Importe Neto']],
      body: [
        ['Abono a Matrícula Escolar', (pago.metodo_pago || 'efectivo').toUpperCase(), `S/ ${parseFloat(pago.monto).toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 10,
        textColor: 50
      },
      columnStyles: {
        0: { halign: 'left', cellPadding: 5 },
        1: { halign: 'center', cellPadding: 5 },
        2: { halign: 'right', fontStyle: 'bold', cellPadding: 5 }
      },
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.1}
    });

    // 6. Sección de Totales
    const finalY = doc.lastAutoTable.finalY + 5; // Añadido un poco de espacio

    // Cuadro resumen de pago (ampliado hacia la izquierda)
    doc.setFillColor(...secondaryColor);
    doc.rect(120, finalY, 70, 20, 'F');
    // Línea de borde izquierda para el cuadro resumen
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(120, finalY, 120, finalY + 20);

    doc.setFontSize(11); // Reducido un punto para evitar choque
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PAGADO", 125, finalY + 12);

    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.text(`S/ ${parseFloat(pago.monto).toFixed(2)}`, 185, finalY + 13, { align: "right" });

    // 7. Sello de la Academia (Texto legal)
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text("Este recibo tiene validez oficial dentro de la institución.", 105, 270, { align: "center" });
    doc.text("Conserve este documento para cualquier aclaración futura.", 105, 275, { align: "center" });

    // 8. Generar PDF
    const safeName = `${pago.nombres}_${pago.apellidos}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Recibo_Alba_${pago.codigo || pago.numero_recibo}_${safeName}.pdf`);
  };

  return (
    <div className="main-content">
      <Navbar title="Gestión de Pagos" />

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="card-title">Registro de Pagos</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Registrar Pago
          </button>
        </div>

        {/* Buscador Premium de Pagos */}
        <div style={{
          padding: '0 24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div className="search-box" style={{ flex: '1 1 300px', maxWidth: '100%', marginBottom: 0 }}>
            <FaSearch style={{ left: '14px', right: 'auto' }} />
            <input
              type="text"
              placeholder="Buscar por código o recibo..."
              value={filtroCodigo}
              onChange={(e) => setFiltroCodigo(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '42px', borderRadius: '50px', backgroundColor: '#f8fafc' }}
            />
            {filtroCodigo && (
              <FaTimes
                onClick={() => setFiltroCodigo('')}
                style={{ cursor: 'pointer', color: '#ef4444' }}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: filtroCodigo ? '#4361ee' : '#cbd5e1'
            }}></span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
              {filtroCodigo ? `Resultado: ${pagos.filter(p =>
                (p.codigo && p.codigo.toLowerCase().includes(filtroCodigo.toLowerCase())) ||
                (p.numero_recibo && p.numero_recibo.toLowerCase().includes(filtroCodigo.toLowerCase()))
              ).length} pago(s)` : 'Todos los pagos registrados'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Recibo Original</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                      No hay pagos registrados
                    </td>
                  </tr>
                ) : (
                  pagos
                    .filter(pago =>
                      !filtroCodigo ||
                      (pago.codigo && pago.codigo.toLowerCase().includes(filtroCodigo.toLowerCase())) ||
                      (pago.numero_recibo && pago.numero_recibo.toLowerCase().includes(filtroCodigo.toLowerCase()))
                    )
                    .map((pago) => (
                      <tr key={pago.id}>
                        <td>{pago.codigo}</td>
                        <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                        <td>{pago.nombres} {pago.apellidos}</td>
                        <td>{pago.curso_nombre}</td>
                        <td>S/ {parseFloat(pago.monto).toFixed(2)}</td>
                        <td>
                          <span className="badge badge-info">{pago.metodo_pago}</span>
                        </td>
                        <td>{pago.numero_recibo || '-'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => exportarReciboPDF(pago)}
                            title="Descargar Recibo en PDF"
                          >
                            <FaFilePdf color="#e63946" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar Pago</h2>
              <button className="modal-close" onClick={cerrarModal}>×</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Buscador por DNI */}
                <div className="form-group">
                  <label>Buscar por DNI del alumno</label>
                  <input
                    type="text"
                    placeholder="Escribe el DNI para filtrar..."
                    value={buscadorDni}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setBuscadorDni(newValue);
                      
                      // Siempre reiniciar la selección cuando el DNI cambia para evitar 
                      // que quede seleccionado un ID antiguo (fuga de estado)
                      if (formData.matricula_id) {
                        setMatriculaSeleccionada(null);
                        setFormData(prev => ({ ...prev, matricula_id: '', monto: '', numero_recibo: '' }));
                      }
                    }}
                    maxLength="8"
                  />
                </div>

                <div className="form-group">
                  <label>Matrícula</label>
                  <select
                    value={formData.matricula_id}
                    onChange={handleMatriculaChange}
                    required
                  >
                    <option value="">
                      {buscadorDni
                        ? matriculas.filter(m => m.dni && m.dni.includes(buscadorDni)).length === 0
                          ? 'Este alumno ya no tiene deudas pendientes'
                          : 'Seleccionar matrícula'
                        : 'Escribe el DNI arriba para filtrar'}
                    </option>
                    {matriculas
                      .filter(m => !buscadorDni || (m.dni && m.dni.includes(buscadorDni)))
                      .map(mat => (
                        <option key={mat.id} value={mat.id}>
                          {mat.dni} - {mat.nombres} {mat.apellidos} | {mat.curso_nombre}
                          {' '}(Pendiente: S/ {(mat.monto_total - mat.monto_pagado).toFixed(2)})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Recuadro de confirmación visual */}
                {matriculaSeleccionada && (
                  <div style={{
                    backgroundColor: '#eff6ff',
                    padding: '15px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    borderLeft: '4px solid #4361ee'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '14px' }}>Detalles de la Matrícula</h4>
                    <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Estudiante:</strong> {matriculaSeleccionada.nombres} {matriculaSeleccionada.apellidos}</p>
                    <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Curso:</strong> {matriculaSeleccionada.curso_nombre}</p>
                    <p style={{ margin: '5px 0', color: '#e63946', fontWeight: 'bold', fontSize: '13px' }}><strong>Monto Pendiente:</strong> S/ {(matriculaSeleccionada.monto_total - matriculaSeleccionada.monto_pagado).toFixed(2)}</p>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Monto a Pagar (S/)</label>
                    <input
                      type="number"
                      value={formData.monto}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (matriculaSeleccionada) {
                          const max = (matriculaSeleccionada.monto_total - matriculaSeleccionada.monto_pagado);
                          if (val > max) {
                            setFormData({ ...formData, monto: max.toFixed(2) });
                          } else {
                            setFormData({ ...formData, monto: val });
                          }
                        } else {
                          setFormData({ ...formData, monto: val });
                        }
                      }}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Pago</label>
                    <input
                      type="date"
                      value={formData.fecha_pago}
                      onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Método de Pago</label>
                    <select
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                      required
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="yape">Yape</option>
                      <option value="plin">Plin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Número de Recibo</label>
                    <input
                      type="text"
                      value={formData.numero_recibo}
                      onChange={(e) => setFormData({ ...formData, numero_recibo: e.target.value })}
                      readOnly
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows="2"
                    placeholder="Opcional: Detalles del depósito, banco, etc."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div >
      )}
    </div >
  );
};

export default Pagos;

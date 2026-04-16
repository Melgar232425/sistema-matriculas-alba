// Página de Reportes
import React, { useState, useEffect } from 'react';
import { reportesAPI } from '../services/api';
import { FaFileExport, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import XLSX from 'xlsx-js-style';

const Reportes = () => {
  const [morosidad, setMorosidad] = useState(null);
  const [ingresos, setIngresos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const [resMorosidad, resIngresos] = await Promise.all([
        reportesAPI.getMorosidad({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
        reportesAPI.getIngresos({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      ]);
      setMorosidad(resMorosidad.data.data);
      setIngresos(resIngresos.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcelConsolidado = () => {
    // Verificar que haya datos en al menos uno de los dos
    const hayIngresos = ingresos && ingresos.pagos && ingresos.pagos.length > 0;
    const hayMorosidad = morosidad && morosidad.morosos && morosidad.morosos.length > 0;

    if (!hayIngresos && !hayMorosidad) {
      toast.error("❌ No hay datos para exportar en este período.", { icon: '' });
      return;
    }

    const wb = XLSX.utils.book_new();

    // =============================
    // HOJA 1: INGRESOS DETALLADOS
    // =============================
    if (hayIngresos) {
      const rowsIngresos = [];
      rowsIngresos.push(["", {
        v: "REPORTE OFICIAL DE INGRESOS - ACADEMIA ALBA",
        t: "s",
        s: {
          font: { name: "Arial", sz: 16, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E40AF" } },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }]);
      rowsIngresos.push(["", {
        v: `Período: ${fechaInicio} al ${fechaFin}`,
        t: "s",
        s: { font: { name: "Arial", sz: 12, italic: true }, alignment: { horizontal: "center" } }
      }]);
      rowsIngresos.push([""]);
      rowsIngresos.push(["",
        { v: `Total Ingresos: S/ ${ingresos.total || '0.00'}`, t: "s", s: { font: { bold: true, sz: 12, color: { rgb: "10B981" } } } },
        { v: `Cantidad de Pagos: ${ingresos.cantidad || 0}`, t: "s", s: { font: { bold: true, sz: 12 } } }
      ]);
      rowsIngresos.push([""]);

      const headersIngresos = ["", "Fecha", "Código de Recibo", "Nombres", "Apellidos", "Curso", "Monto (S/)", "Método de Pago"];
      rowsIngresos.push(headersIngresos.map((h, i) => i === 0 ? "" : ({
        v: h, t: "s",
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: { top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } }, left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } } }
        }
      })));

      ingresos.pagos.forEach(pago => {
        rowsIngresos.push([
          "",
          { v: new Date(pago.fecha_pago).toLocaleDateString(), t: "s", s: { alignment: { horizontal: "center" } } },
          { v: pago.codigo, t: "s", s: { alignment: { horizontal: "center" } } },
          { v: pago.nombres, t: "s" },
          { v: pago.apellidos, t: "s" },
          { v: pago.curso, t: "s" },
          { v: parseFloat(pago.monto), t: "n", s: { numFmt: '"S/" #,##0.00', font: { bold: true } } },
          { v: pago.metodo_pago, t: "s", s: { alignment: { horizontal: "center" } } }
        ]);
      });

      const wsIngresos = XLSX.utils.aoa_to_sheet(rowsIngresos);
      wsIngresos["!merges"] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 1 }, e: { r: 1, c: 7 } }
      ];
      // Aumentamos los anchos de columna para que el contenido no se corte
      wsIngresos['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 20 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(wb, wsIngresos, "Ingresos");
    }

    // =============================
    // HOJA 2: DEUDAS PENDIENTES
    // =============================
    if (hayMorosidad) {
      const rowsDeudas = [];
      rowsDeudas.push(["", {
        v: "REPORTE DE MOROSIDAD Y DEUDAS PENDIENTES - ACADEMIA ALBA",
        t: "s",
        s: {
          font: { name: "Arial", sz: 16, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "B45309" } },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }]);
      rowsDeudas.push(["", {
        v: `Matrículas del Período: ${fechaInicio} al ${fechaFin}`,
        t: "s",
        s: { font: { name: "Arial", sz: 12, italic: true }, alignment: { horizontal: "center" } }
      }]);
      rowsDeudas.push([""]);
      rowsDeudas.push(["",
        { v: `Deuda Total Acumulada: S/ ${morosidad.totalDeuda || '0.00'}`, t: "s", s: { font: { bold: true, sz: 12, color: { rgb: "EF4444" } } } },
        { v: `Total de Morosos: ${morosidad.totalMorosos || 0}`, t: "s", s: { font: { bold: true, sz: 12 } } }
      ]);
      rowsDeudas.push([""]);

      const headersDeudas = ["", "DNI", "Estudiante", "Curso", "Teléfono", "Monto Total", "Pagado", "Deuda Pendiente", "Fecha Matrícula"];
      rowsDeudas.push(headersDeudas.map((h, i) => i === 0 ? "" : ({
        v: h, t: "s",
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "F59E0B" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: { top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } }, left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } } }
        }
      })));

      morosidad.morosos.forEach(m => {
        rowsDeudas.push([
          "",
          { v: m.dni, t: "s", s: { alignment: { horizontal: "center" } } },
          { v: `${m.nombres} ${m.apellidos}`, t: "s" },
          { v: m.curso, t: "s" },
          { v: m.telefono || m.telefono_apoderado || '-', t: "s" },
          { v: parseFloat(m.monto_total), t: "n", s: { numFmt: '"S/" #,##0.00' } },
          { v: parseFloat(m.monto_pagado), t: "n", s: { numFmt: '"S/" #,##0.00' } },
          { v: parseFloat(m.monto_pendiente), t: "n", s: { numFmt: '"S/" #,##0.00', font: { bold: true, color: { rgb: "EF4444" } } } },
          { v: new Date(m.fecha_matricula).toLocaleDateString(), t: "s", s: { alignment: { horizontal: "center" } } }
        ]);
      });

      const wsDeudas = XLSX.utils.aoa_to_sheet(rowsDeudas);
      wsDeudas["!merges"] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 1 }, e: { r: 1, c: 8 } }
      ];
      // Aumentamos los anchos de columna
      wsDeudas['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsDeudas, "Morosidad");
    }

    XLSX.writeFile(wb, `Reporte_Consolidado_Alba_${fechaInicio}_a_${fechaFin}.xlsx`);
  };


  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="card-title">Reporte de Ingresos</h2>
          <button
            className="btn btn-primary"
            onClick={exportarExcelConsolidado}
            style={{ backgroundColor: '#10b981', color: 'white' }}
          >
            <FaFileExport /> Descargar Excel
          </button>
        </div>

        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={cargarReportes}>
              Generar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="stats-grid" style={{ marginBottom: '25px' }}>
                <div className="stat-card">
                  <div className="stat-icon success" style={{ background: '#dcfce7', color: '#10b981' }}>S/</div>
                  <div className="stat-info">
                      <h3>S/ {ingresos?.total || '0.00'}</h3>
                      <p>Total Ingresos</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon primary" style={{ background: '#eff6ff', color: '#3b82f6' }}>#</div>
                  <div className="stat-info">
                      <h3>{ingresos?.cantidad || 0}</h3>
                      <p>Cantidad de Pagos</p>
                  </div>
                </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Código</th>
                    <th>Estudiante</th>
                    <th>Curso</th>
                    <th>Monto</th>
                    <th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos?.pagos && ingresos.pagos.length > 0 ? (
                    ingresos.pagos.map((pago) => (
                      <tr key={pago.codigo}>
                        <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                        <td>{pago.codigo}</td>
                        <td>{pago.nombres} {pago.apellidos}</td>
                        <td>{pago.curso}</td>
                        <td>S/ {parseFloat(pago.monto).toFixed(2)}</td>
                        <td><span className="badge badge-info">{pago.metodo_pago}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                        No hay pagos en este período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Reporte de Morosidad */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaExclamationTriangle style={{ color: '#f59e0b', flexShrink: 0 }} />
            Reporte de Morosidad
          </h2>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fef3c7', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div>
                  <p style={{ color: '#92400e', fontSize: '14px' }}>Total Morosos</p>
                  <h2 style={{ color: '#b45309', fontSize: '24px' }}>{morosidad?.totalMorosos || 0}</h2>
                </div>
                <div>
                  <p style={{ color: '#92400e', fontSize: '14px' }}>Deuda Total</p>
                  <h2 style={{ color: '#ef4444', fontSize: '24px' }}>S/ {morosidad?.totalDeuda || '0.00'}</h2>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>DNI</th>
                    <th>Estudiante</th>
                    <th>Curso</th>
                    <th>Teléfono</th>
                    <th>Monto Total</th>
                    <th>Pagado</th>
                    <th>Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {morosidad?.morosos && morosidad.morosos.length > 0 ? (
                    morosidad.morosos.map((moroso) => (
                      <tr key={moroso.estudiante_codigo}>
                        <td>{moroso.estudiante_codigo}</td>
                        <td>{moroso.dni}</td>
                        <td>{moroso.nombres} {moroso.apellidos}</td>
                        <td>{moroso.curso}</td>
                        <td>{moroso.telefono || moroso.telefono_apoderado || '-'}</td>
                        <td>S/ {parseFloat(moroso.monto_total).toFixed(2)}</td>
                        <td>S/ {parseFloat(moroso.monto_pagado).toFixed(2)}</td>
                        <td style={{ color: '#ef4444', fontWeight: 'bold' }}>
                          S/ {parseFloat(moroso.monto_pendiente).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                        No hay estudiantes con deudas pendientes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reportes;

// Página de Cursos - Gestión de cursos
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { cursosAPI, docentesAPI, ciclosAPI } from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaCopy, FaSearch, FaTimes, FaSync, FaCalendarCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CURSOS_PRESET = [
  // Ciencias Exactas (4)
  "Aritmética",
  "Álgebra",
  "Geometría",
  "Trigonometría",
  // Ciencias (3)
  "Física",
  "Química",
  "Biología",
  // Letras (2)
  "Razonamiento Verbal",
  "Lenguaje y Literatura",
  // Razonamiento (1)
  "Razonamiento Matemático",
  // Humanidades (2)
  "Historia y Geografía",
  "Historia del Perú"
];

const SPECIALTY_MAP = {
  // Ingeniería / Ciencias Exactas
  "Aritmética":             ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Álgebra":                ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Geometría":              ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Trigonometría":          ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Física":                 ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Razonamiento Matemático":["Ingeniería / Ciencias Exactas", "Matemática / Física"],

  // Ciencias de la Salud / Biología
  "Química":                ["Ciencias de la Salud / Biología", "Biología / Química", "Ingeniería / Ciencias Exactas"],
  "Biología":               ["Ciencias de la Salud / Biología", "Biología / Química"],

  // Letras / Comunicación
  "Razonamiento Verbal":    ["Letras / Comunicación", "Lengua / Literatura"],
  "Lenguaje y Literatura":  ["Letras / Comunicación", "Lengua / Literatura"],

  // Ciencias Sociales / Humanidades
  "Historia y Geografía":   ["Ciencias Sociales / Humanidades", "Historia y Geografía"],
  "Historia del Perú":      ["Ciencias Sociales / Humanidades", "Historia y Geografía"]};

const Cursos = () => {
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cursoActual, setCursoActual] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCiclo, setFiltroCiclo] = useState('');
  const [bloquesOcupados, setBloquesOcupados] = useState({}); // { bloque: "razon" }
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    dias: '',
    horas: '',
    cupos_totales: 40,
    precio: '',
    fecha_inicio: '',
    fecha_fin: '',
    docente_id: '',
    seccion: '',
    aula: '',
    ciclo_id: ''
  });

  const opcionesDias = [
    // Días individuales (para cursos del sistema)
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
    // Combinaciones frecuentes
    'Lunes a Viernes',
    'Lunes, Miércoles y Viernes',
    'Martes y Jueves',
    'Sábados',
    'Sábados y Domingos'
  ];

  const opcionesHoras = [
    // Turno Mañana
    '7:00 AM - 9:00 AM',
    '9:00 AM - 11:00 AM',
    '11:30 AM - 1:30 PM',
    // Turno Tarde
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM'
  ];

  const opcionesAulas = [
    'Aula 1', 'Aula 2', 'Aula 3', 'Aula 4', 'Aula 5',
    'Aula 6', 'Aula 7', 'Aula 8',
    'Laboratorio 1', 'Laboratorio 2'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [cursosRes, docentesRes, ciclosRes] = await Promise.all([
        cursosAPI.getAll(),
        docentesAPI.getAll({ estado: 'activo' }),
        ciclosAPI.getAll()
      ]);
      setCursos(cursosRes.data.data);
      setDocentes(docentesRes.data.data);
      setCiclos(ciclosRes.data.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Consulta disponibilidad de bloques horarios al backend
  const fetchDisponibilidad = async (ciclo_id, dia, docente_id, excluir_id) => {
    if (!ciclo_id || !dia) {
      setBloquesOcupados({});
      return;
    }
    try {
      const params = { ciclo_id, dia };
      if (docente_id) params.docente_id = docente_id;
      if (excluir_id) params.curso_id_excluir = excluir_id;

      const res = await cursosAPI.getDisponibilidad(params);
      const { ocupados } = res.data?.data || {};

      const map = {};
      if (ocupados) {
        Object.keys(ocupados).forEach(k => {
          map[k.trim().toUpperCase()] = ocupados[k];
        });
      }
      setBloquesOcupados(map);
    } catch (err) {
      console.error('Error al obtener disponibilidad:', err?.response?.data || err.message);
      setBloquesOcupados({});
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]: value
    };

    // Si se selecciona un aula, fijar cupos a 40
    if (name === 'aula' && value !== '') {
      newFormData.cupos_totales = 40;
    }

    // Sincronizar Turno automáticamente según las horas
    if (name === 'horas') {
      const manana = ["7:00 AM - 9:00 AM", "9:00 AM - 11:00 AM", "11:30 AM - 1:30 PM"];
      const tarde = ["2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM", "6:00 PM - 7:00 PM"];

      if (manana.includes(value)) {
        newFormData.seccion = "Turno Mañana";
      } else if (tarde.includes(value)) {
        newFormData.seccion = "Turno Tarde";
      } else {
        newFormData.seccion = ""; // Resetear si se pone en vacío
      }
    }

    // Sincronizar Fechas automáticamente según el Ciclo
    if (name === 'ciclo_id') {
      const selectedCiclo = ciclos.find(c => c.id === parseInt(value));
      if (selectedCiclo) {
        newFormData.fecha_inicio = selectedCiclo.fecha_inicio ? selectedCiclo.fecha_inicio.split('T')[0] : '';
        newFormData.fecha_fin = selectedCiclo.fecha_fin ? selectedCiclo.fecha_fin.split('T')[0] : '';
      } else {
        newFormData.fecha_inicio = '';
        newFormData.fecha_fin = '';
      }
      // Actualizar disponibilidad cuando cambia el ciclo
      fetchDisponibilidad(value, newFormData.dias, newFormData.docente_id, modoEdicion && cursoActual ? cursoActual.id : null);
    }

    // Actualizar disponibilidad cuando cambia el día
    if (name === 'dias') {
      fetchDisponibilidad(newFormData.ciclo_id, value, newFormData.docente_id, modoEdicion && cursoActual ? cursoActual.id : null);
    }

    // Actualizar disponibilidad cuando cambia el docente (puede tener sus propios bloques ocupados)
    if (name === 'docente_id') {
      fetchDisponibilidad(newFormData.ciclo_id, newFormData.dias, value, modoEdicion && cursoActual ? cursoActual.id : null);
    }

    // Validar Especialidad del Docente
    if (name === 'docente_id' && value !== '') {
      const selectedDocente = docentes.find(d => d.id === parseInt(value));
      const cursoNombre = newFormData.nombre;
      
      if (selectedDocente && cursoNombre && SPECIALTY_MAP[cursoNombre]) {
        const requiredSpecialty = SPECIALTY_MAP[cursoNombre];
        const docenteSpecialty = selectedDocente.especialidad;
        
        const isCompatible = Array.isArray(requiredSpecialty) 
          ? requiredSpecialty.includes(docenteSpecialty)
          : requiredSpecialty === docenteSpecialty;

        if (!isCompatible) {
          toast.error(`❌ ¡Error de Especialidad! El docente ${selectedDocente.nombres} ${selectedDocente.apellidos} es especialista en "${docenteSpecialty}" y NO puede dictar "${cursoNombre}".`, {
            duration: 6000,
            icon: ''
          });
        }
      }
    }

    // Validar cuando cambia el nombre del curso
    if (name === 'nombre' && newFormData.docente_id !== '') {
      const selectedDocente = docentes.find(d => d.id === parseInt(newFormData.docente_id));
      if (selectedDocente && SPECIALTY_MAP[value]) {
        const requiredSpecialty = SPECIALTY_MAP[value];
        const docenteSpecialty = selectedDocente.especialidad;
        
        const isCompatible = Array.isArray(requiredSpecialty) 
          ? requiredSpecialty.includes(docenteSpecialty)
          : requiredSpecialty === docenteSpecialty;

        if (!isCompatible) {
          toast.error(`❌ ¡Error! Este docente no es especialista en "${value}" y no podrá ser asignado.`, { icon: '' });
        }
      }
    }

    setFormData(newFormData);
  };

  // Carga disponibilidad al abrir modal en modo edición
  useEffect(() => {
    if (showModal && modoEdicion && formData.ciclo_id && formData.dias) {
      fetchDisponibilidad(
        formData.ciclo_id,
        formData.dias,
        formData.docente_id,
        cursoActual?.id
      );
    } else if (!showModal) {
      setBloquesOcupados({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // VALIDACIÓN ESTRICTA DE ESPECIALIDAD
      if (formData.docente_id) {
        const selectedDocente = docentes.find(d => d.id === parseInt(formData.docente_id));
        const cursoNombre = formData.nombre;

        if (selectedDocente && cursoNombre && SPECIALTY_MAP[cursoNombre]) {
          const requiredSpecialty = SPECIALTY_MAP[cursoNombre];
          const docenteSpecialty = selectedDocente.especialidad;

          const isCompatible = Array.isArray(requiredSpecialty)
            ? requiredSpecialty.includes(docenteSpecialty)
            : requiredSpecialty === docenteSpecialty;

          if (!isCompatible) {
            toast.error(`❌ No se puede guardar: El docente seleccionado no es especialista en "${cursoNombre}".`, {
              icon: '',
              duration: 5000
            });
            return; // BLOQUEAR GUARDADO
          }
        }
      }

      // Validar fechas contra el ciclo seleccionado

      const horarioGenerado = formData.dias && formData.horas ? `${formData.dias} ${formData.horas}` : '';
      // En modo edición, si no se puede reconstruir el horario desde dias+horas, usar el horario original del curso
      const horarioFinal = horarioGenerado || (modoEdicion && cursoActual?.horario) || '';

      const data = {
        ...formData,
        nivel: 'Preuniversitario', // Hardcoded value since all are Preuniversitario
        horario: horarioFinal,
        cupos_totales: parseInt(formData.cupos_totales),
        precio: parseFloat(formData.precio),
        docente_id: formData.docente_id ? parseInt(formData.docente_id) : null,
        ciclo_id: formData.ciclo_id ? parseInt(formData.ciclo_id) : null
      };

      if (modoEdicion) {
        await cursosAPI.update(cursoActual.id, {
          ...data,
          cupos_disponibles: cursoActual.cupos_disponibles
        });
        toast.success('Curso actualizado exitosamente');
      } else {
        await cursosAPI.create(data);
        toast.success('Curso creado exitosamente');
      }
      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Error al guardar curso';
      toast.error(`❌ ${msg}`, { icon: '' });
    }
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setCursoActual(null);
    setFormData({
      nombre: '',
      descripcion: '',
      dias: '',
      horas: '',
      cupos_totales: 40,
      precio: '',
      fecha_inicio: '',
      fecha_fin: '',
      docente_id: '',
      seccion: '',
      aula: '',
      ciclo_id: ''
    });
    setShowModal(true);
  };

  const abrirModalEditar = (curso) => {
    setModoEdicion(true);
    setCursoActual(curso);

    // Intentar separar el horario actual en días y horas si coincide con nuestras opciones
    let currDias = '';
    let currHoras = '';
    if (curso.horario) {
      for (const d of opcionesDias) {
        if (curso.horario.includes(d)) {
          currDias = d;
          break;
        }
      }
      for (const h of opcionesHoras) {
        if (curso.horario.includes(h)) {
          currHoras = h;
          break;
        }
      }
      // Fallback si era un texto libre antiguamente
      if (!currDias && !currHoras) {
        currDias = curso.horario;
        // Si no hace match con opciones fijas, al menos conservar el texto en 'días' para no perderlo
      }
    }

    // Buscar fechas del ciclo si el curso no las tiene (para cursos creados masivamente)
    const selectedCiclo = ciclos.find(c => c.id === curso.ciclo_id);
    const cycleStart = selectedCiclo?.fecha_inicio ? selectedCiclo.fecha_inicio.split('T')[0] : '';
    const cycleEnd = selectedCiclo?.fecha_fin ? selectedCiclo.fecha_fin.split('T')[0] : '';

    setFormData({
      nombre: curso.nombre,
      descripcion: curso.descripcion || '',
      dias: currDias,
      horas: currHoras,
      cupos_totales: 40,
      precio: curso.precio,
      fecha_inicio: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : cycleStart,
      fecha_fin: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : cycleEnd,
      docente_id: curso.docente_id || '',
      seccion: curso.seccion || '',
      aula: curso.aula || '',
      ciclo_id: curso.ciclo_id || ''
    });
    setShowModal(true);
  };

  const duplicarCurso = (curso) => {
    setModoEdicion(false);
    setCursoActual(null);

    // Buscar fechas del ciclo
    const selectedCiclo = ciclos.find(c => c.id === curso.ciclo_id);
    const cycleStart = selectedCiclo?.fecha_inicio ? selectedCiclo.fecha_inicio.split('T')[0] : '';
    const cycleEnd = selectedCiclo?.fecha_fin ? selectedCiclo.fecha_fin.split('T')[0] : '';

    setFormData({
      nombre: curso.nombre,
      descripcion: curso.descripcion || '',
      dias: '',
      horas: '',
      cupos_totales: 40,
      precio: curso.precio,
      fecha_inicio: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : cycleStart,
      fecha_fin: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : cycleEnd,
      docente_id: '',
      seccion: '',
      aula: '',
      ciclo_id: curso.ciclo_id || ''
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setModoEdicion(false);
    setCursoActual(null);
  };

  const eliminarCurso = async (id) => {
    if (window.confirm('¿Estás seguro de desactivar este curso?')) {
      try {
        await cursosAPI.delete(id);
        toast.success('Curso desactivado exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al desactivar curso');
      }
    }
  };

  return (
    <div className="main-content">
      <Navbar title="Gestión de Cursos" />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Lista de Cursos</h2>
          <button className="btn btn-primary" onClick={abrirModalNuevo}>
            <FaPlus /> Nuevo Curso
          </button>
        </div>

        {/* Buscador Premium de Cursos */}
        <div style={{
          padding: '0 24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '20px'
        }}>
          <div className="search-box" style={{ flex: 1, maxWidth: '400px', marginBottom: 0 }}>
            <FaSearch style={{ left: '14px', right: 'auto' }} />
            <input
              type="text"
              placeholder="Buscar curso por nombre, sección o docente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '42px', borderRadius: '50px', backgroundColor: '#f8fafc' }}
            />
            {searchTerm && (
              <FaTimes
                onClick={() => setSearchTerm('')}
                style={{ cursor: 'pointer', color: '#ef4444' }}
              />
            )}
          </div>

          <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaSync color="#64748b" />
            <select
              value={filtroCiclo}
              onChange={e => setFiltroCiclo(e.target.value)}
              className="form-control"
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px', minWidth: '180px' }}
            >
              <option value="">Todos los Ciclos</option>
              {ciclos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '-'} al {c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString() : '-'}) {c.estado === 'inactivo' ? '(Cerrado)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: searchTerm ? '#4361ee' : '#cbd5e1'
            }}></span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
              {searchTerm ? `Resultado: ${cursos.filter(curso => curso.estado !== 'inactivo').filter(curso => {
                const term = searchTerm.toLowerCase();
                const nombreDocente = curso.docente_nombres ? `${curso.docente_nombres} ${curso.docente_apellidos}`.toLowerCase() : '';
                return (
                  curso.nombre.toLowerCase().includes(term) ||
                  (curso.seccion && curso.seccion.toLowerCase().includes(term)) ||
                  nombreDocente.includes(term) ||
                  curso.codigo.toLowerCase().includes(term)
                );
              }).length} curso(s)` : `Mostrando ${cursos.filter(c => c.estado !== 'inactivo').length} curso(s) activos`}
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
                  <th>Curso</th>
                  <th>Ciclo</th>
                  <th style={{ textAlign: 'center' }}>Aula</th>
                  <th>Docente</th>
                  <th>Horario</th>
                  <th style={{ textAlign: 'center' }}>Cupos</th>
                  <th>Precio</th>
                  <th>Inicio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cursos.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '20px' }}>
                      No hay cursos registrados
                    </td>
                  </tr>
                ) : (
                  cursos.filter(curso => curso.estado !== 'inactivo').filter(curso => {
                    if (searchTerm === '' && filtroCiclo === '') return true;
                    const term = searchTerm.toLowerCase();
                    const nombreDocente = curso.docente_nombres ? `${curso.docente_nombres} ${curso.docente_apellidos}`.toLowerCase() : '';

                    const matchSearch = (
                      curso.nombre.toLowerCase().includes(term) ||
                      (curso.seccion && curso.seccion.toLowerCase().includes(term)) ||
                      nombreDocente.includes(term) ||
                      curso.codigo.toLowerCase().includes(term)
                    );

                    const matchCiclo = filtroCiclo ? curso.ciclo_id === parseInt(filtroCiclo) : true;

                    return matchSearch && matchCiclo;
                  }).map((curso) => {
                    const isVencido = curso.fecha_fin && new Date(curso.fecha_fin) < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <tr key={curso.id} style={{ opacity: isVencido ? 0.7 : 1 }}>
                        <td style={{ fontWeight: '700', color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
                          {curso.codigo}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{curso.nombre}</div>
                          <div style={{ fontSize: '0.85em', color: '#64748b' }}>{curso.seccion || 'Única'}</div>
                        </td>
                        <td style={{ fontSize: '0.9em', color: '#475569' }}>
                           {curso.ciclo_nombre || '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                           <span className={curso.aula ? 'badge badge-info' : 'badge badge-secondary'} style={{ background: curso.aula ? '#e0f2fe' : '#f1f5f9', color: curso.aula ? '#0369a1' : '#64748b', minWidth: '80px' }}>
                              {curso.aula || 'Sin aula'}
                           </span>
                        </td>
                        <td style={{ fontSize: '0.95em' }}>
                          {curso.docente_nombres ? `${curso.docente_nombres} ${curso.docente_apellidos}` : <em>Por asignar</em>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="badge badge-light" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', fontSize: '11px' }}>
                            {curso.horario || '-'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            color: curso.cupos_disponibles === 0 ? '#ef4444' : '#1e293b',
                            background: '#f8fafc',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            display: 'inline-block',
                            minWidth: '60px'
                          }}>
                            {curso.cupos_disponibles}/{curso.cupos_totales}
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>S/ {parseFloat(curso.precio).toFixed(2)}</td>
                        <td>
                          {curso.fecha_inicio ? new Date(curso.fecha_inicio).toLocaleDateString() : '-'}
                          {curso.fecha_fin && (
                            <div style={{ fontSize: '0.8em', color: '#666' }}>
                              al {new Date(curso.fecha_fin).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td>
                          {isVencido ? (
                            <span className="badge badge-danger">Finalizado</span>
                          ) : (
                            <span className={`badge ${curso.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                              {curso.estado}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-small btn-warning"
                              onClick={() => abrirModalEditar(curso)}
                              title="Editar curso"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => eliminarCurso(curso.id)}
                              title="Desactivar curso"
                            >
                              <FaTrash />
                            </button>
                            <button
                              className="btn btn-small btn-info"
                              onClick={() => duplicarCurso(curso)}
                              title="Duplicar curso (Crear nueva sección)"
                              style={{ backgroundColor: '#0ea5e9', color: 'white' }}
                            >
                              <FaCopy />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modoEdicion ? 'Editar Curso' : 'Nuevo Curso'}
              </h2>
              <button className="modal-close" onClick={cerrarModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* BLOQUE 1: Identidad y Ciclo */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del Curso</label>
                  <select
                    name="nombre"
                    className="form-control"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {CURSOS_PRESET.map((c, index) => (
                      <option key={index} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ciclo Académico</label>
                  <select
                    name="ciclo_id"
                    value={formData.ciclo_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar ciclo</option>
                    {ciclos.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.estado === 'inactivo' ? '(Cerrado)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BLOQUE 2: Fechas del Ciclo */}
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Inicio del Ciclo</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Fin del Ciclo</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* BLOQUE 3: Logística del Curso */}
              <div className="form-row">
                <div className="form-group">
                  <label>Docente Asignado</label>
                  <select
                    name="docente_id"
                    value={formData.docente_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Sin asignar</option>
                    {docentes.map(d => (
                      <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Aula (Seleccionar Horario primero)</label>
                  <select
                    name="aula"
                    className="form-control"
                    value={formData.aula}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar Aula (Opcional)</option>
                    {opcionesAulas.map(aula => (
                      <option key={aula} value={aula}>
                        {aula}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BLOQUE 4: Programación y Horarios */}
              <div className="form-group">
                <label>Horario Fijo</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    name="dias"
                    value={formData.dias}
                    onChange={handleInputChange}
                    style={{ flex: 1 }}
                    required
                  >
                    <option value="">Días</option>
                    {opcionesDias.map(d => <option key={d} value={d}>{d}</option>)}
                    {formData.dias && !opcionesDias.includes(formData.dias) && (
                      <option value={formData.dias}>{formData.dias} (Personalizado)</option>
                    )}
                  </select>

                  <select
                    name="horas"
                    value={formData.horas}
                    onChange={handleInputChange}
                    style={{ flex: 1 }}
                    required
                  >
                    <option value="">Bloque de Hora</option>
                    <optgroup label="Turno Mañana">
                      {["7:00 AM - 9:00 AM", "9:00 AM - 11:00 AM", "11:30 AM - 1:30 PM"].map(bloque => {
                        const key = bloque.trim().toUpperCase();
                        const razonOcupado = bloquesOcupados[key];
                        const isOcupado = !!razonOcupado;

                        return (
                          <option key={bloque} value={bloque} disabled={isOcupado}
                            style={{ color: isOcupado ? '#ef4444' : '#16a34a', fontWeight: '500' }}>
                            {bloque} {isOcupado ? `— ${razonOcupado}` : '— Disponible'}
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="Turno Tarde">
                      {["2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM", "6:00 PM - 7:00 PM"].map(bloque => {
                        const key = bloque.trim().toUpperCase();
                        const razonOcupado = bloquesOcupados[key];
                        const isOcupado = !!razonOcupado;

                        return (
                          <option key={bloque} value={bloque} disabled={isOcupado}
                            style={{ color: isOcupado ? '#ef4444' : '#16a34a', fontWeight: '500' }}>
                            {bloque} {isOcupado ? `— ${razonOcupado}` : '— Disponible'}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>
                {formData.dias && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 15px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}>
                    <FaCalendarCheck color="#3b82f6" size={16} />
                    <span>
                      <strong>Estado del {formData.dias}:</strong> 
                      {!formData.horas ? " Consulta el desplegable de horas para ver disponibilidad." : " Horario seleccionado correctamente."}
                    </span>
                  </div>
                )}
              </div>

              {/* BLOQUE 5: Detalles Finales (Turno, Cupos, Precio) */}
              <div className="form-row">
                <div className="form-group">
                  <label>Turno / Sección (Auto)</label>
                  <input
                    type="text"
                    name="seccion"
                    value={formData.seccion}
                    readOnly
                    placeholder="Auto-asignado por horario"
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold' }}
                  />
                </div>

                <div className="form-group">
                  <label>Cupos Totales (Auto)</label>
                  <input
                    type="number"
                    name="cupos_totales"
                    value={formData.cupos_totales}
                    onChange={handleInputChange}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold' }}
                    title="La capacidad está fijada en 40 estudiantes por aula según normativa."
                  />
                </div>

                <div className="form-group">
                  <label>Precio (S/)</label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    style={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                </div>
              </div>

              {/* OPCIONAL: Descripción */}
              <div className="form-group">
                <label>Descripción / Observación (Opcional)</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Detalles adicionales sobre el curso..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cursos;

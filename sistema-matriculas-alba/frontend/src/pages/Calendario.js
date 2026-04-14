// Página de Calendario de Cursos - Vista semanal
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { cursosAPI, ciclosAPI } from '../services/api';
import { FaCalendarAlt, FaClock, FaBook, FaInfoCircle, FaExclamationTriangle, FaChalkboardTeacher, FaMapMarkerAlt } from 'react-icons/fa';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const KEYWORDS_DIAS = {
    'Lunes': ['lunes', 'lun', ' lu ', ' lu,', ' lu-'],
    'Martes': ['martes', 'mar', ' ma ', ' ma,', ' ma-'],
    'Miércoles': ['miercoles', 'miércoles', 'mie', 'mié', ' mi ', ' mi,', ' mi-'],
    'Jueves': ['jueves', 'jue', ' ju ', ' ju,', ' ju-'],
    'Viernes': ['viernes', 'vie', ' vi ', ' vi,', ' vi-'],
    'Sábado': ['sabado', 'sábado', 'sab', 'sáb', ' sa ', ' sa,', ' sa-'],
    'Domingo': ['domingo', 'dom', ' do ', ' do,', ' do-'],
};

// Palabras que indican que el curso es todos los días
const KEYWORDS_DIARIO = ['diario', 'todos los dias', 'todos los días', 'lunes a viernes', 'lun a vie', 'lunes - viernes'];

const AULAS_PRESET = ['Aula 1', 'Aula 2', 'Aula 3', 'Aula 4', 'Aula 5', 'Aula 6', 'Aula 7', 'Aula 8'];
const LABORATORIOS_PRESET = ['Laboratorio 1', 'Laboratorio 2'];

// Removed COLORES_NIVEL as all courses are now uniform (Preuniversitario)

const parsearDiasCurso = (horario) => {
    if (!horario) return [];
    const h = ' ' + horario.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') + ' ';

    // Si es "diario" o similar, devolver todos los días de lunes a viernes
    if (KEYWORDS_DIARIO.some(kw => h.includes(kw))) {
        return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    }

    const diasEncontrados = [];
    for (const [dia, keywords] of Object.entries(KEYWORDS_DIAS)) {
        if (keywords.some(kw => h.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
            diasEncontrados.push(dia);
        }
    }
    return diasEncontrados;
};

const extraerHora = (horario) => {
    if (!horario) return '';
    const match = horario.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?(\s*-\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)?)?/);
    return match ? match[0] : '';
};

// Convierte un string de hora a minutos para poder ordenar (ej: "7:00 AM" -> 420)
const horaAMinutos = (horaStr) => {
    if (!horaStr) return 9999;

    // Usar la función extraerHora para limpiar cualquier texto extra (días, guiones, etc)
    const horaLimpia = extraerHora(horaStr);
    if (!horaLimpia) return 9999;

    let cleanTime = horaLimpia.trim().toLowerCase();
    
    // Si sigue siendo un rango, tomar solo el inicio
    if (cleanTime.includes('-')) {
        cleanTime = cleanTime.split('-')[0].trim();
    }

    let isPM = cleanTime.includes('pm') || cleanTime.includes('p.m');
    let isAM = cleanTime.includes('am') || cleanTime.includes('a.m');

    // Extraer solo dígitos y el separador :
    const matchDigits = cleanTime.match(/(\d{1,2}):(\d{2})/);
    if (!matchDigits) {
        // Intentar solo horas
        const matchHour = cleanTime.match(/(\d{1,2})/);
        if (!matchHour) return 9999;
        let hours = parseInt(matchHour[0], 10);
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return hours * 60;
    }

    let hours = parseInt(matchDigits[1], 10);
    const minutes = parseInt(matchDigits[2], 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
};

const PIXELS_PER_MINUTE = 0.8;
const START_HOUR = 7; // 7 AM
const END_HOUR = 19; // 7 PM

const getCoursePosition = (horario) => {
    if (!horario) return null;

    const cleanHorario = horario.toLowerCase();
    const parts = cleanHorario.split('-').map(p => p.trim());
    if (parts.length < 2) return null;

    const startMin = horaAMinutos(parts[0]);
    const endMin = horaAMinutos(parts[1]);

    if (startMin === 9999 || endMin === 9999) return null;

    const top = (startMin - (START_HOUR * 60)) * PIXELS_PER_MINUTE;
    const height = (endMin - startMin) * PIXELS_PER_MINUTE;

    return { top, height, startMin, endMin };
};

const CalendarioCurso = ({ curso, columnIndex, totalColumns }) => {
    const pos = getCoursePosition(curso.horario);
    if (!pos) return null;

    const styleVars = { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' };
    
    // Calcular ancho y posición horizontal basado en el número de columnas
    const widthPercent = 100 / (totalColumns || 1);
    const leftPercent = (columnIndex || 0) * widthPercent;

    return (
        <div style={{
            position: 'absolute',
            top: `${pos.top}px`,
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            height: `${pos.height - 4}px`,
            background: styleVars.bg,
            border: `1px solid ${styleVars.border}`,
            borderRadius: '4px',
            padding: '4px 6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${styleVars.border}`,
            transition: 'all 0.15s ease',
            cursor: 'default',
            zIndex: 10 + (columnIndex || 0),
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}
            onMouseEnter={e => {
                e.currentTarget.style.zIndex = 100;
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.zIndex = 10 + (columnIndex || 0);
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ margin: 0, fontWeight: '700', color: styleVars.text, fontSize: (totalColumns || 1) > 1 ? '9px' : '11px', lineHeight: 1.1 }}>
                    {curso.nombre}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                {curso.docente_nombres && pos.height > 50 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#4b5563', fontSize: '9px' }}>
                        <FaChalkboardTeacher size={8} color={styleVars.border} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(totalColumns || 1) > 1 ? curso.docente_nombres[0] + '. ' + curso.docente_apellidos.split(' ')[0] : `${curso.docente_nombres} ${curso.docente_apellidos.split(' ')[0]}`}
                        </span>
                    </div>
                )}
                {curso.aula && pos.height > 70 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#64748b', fontSize: '9px' }}>
                        <FaMapMarkerAlt size={8} color="#64748b" />
                        <span>Aula: {curso.aula}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Calendario = () => {
    const [cursos, setCursos] = useState([]);
    const [ciclos, setCiclos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroDocente, setFiltroDocente] = useState('');
    const [filtroAula, setFiltroAula] = useState(''); // Default to All Aulas
    const [filtroCurso, setFiltroCurso] = useState('');
    const [filtroCiclo, setFiltroCiclo] = useState('');

    useEffect(() => {
        cargarCursos();
    }, []);

    const cargarCursos = async () => {
        try {
            setLoading(true);
            const [cursosRes, ciclosRes] = await Promise.all([
                cursosAPI.getAll(),
                ciclosAPI.getAll()
            ]);
            setCursos(cursosRes.data.data);
            setCiclos(ciclosRes.data.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cursosFiltrados = cursos.filter(c => {
        if (c.estado === 'inactivo') return false; // Ocultar cursos eliminados

        let matchDocente = true;
        if (filtroDocente) {
            const nombreCompleto = `${c.docente_nombres || ''} ${c.docente_apellidos || ''}`.trim();
            // Comparación más flexible para evitar problemas de espacios o mayúsculas
            matchDocente = nombreCompleto.toLowerCase() === filtroDocente.toLowerCase();
        }

        const matchAula = filtroAula ? String(c.aula).toLowerCase() === filtroAula.toLowerCase() : true;
        const matchCurso = filtroCurso ? String(c.nombre).toLowerCase() === filtroCurso.toLowerCase() : true;
        const matchCiclo = filtroCiclo ? String(c.ciclo_id) === String(filtroCiclo) : true;

        return matchDocente && matchAula && matchCurso && matchCiclo;
    });

    const docentesUnicos = [...new Set(cursos
        .filter(c => c.estado !== 'inactivo')
        .map(c => `${c.docente_nombres || ''} ${c.docente_apellidos || ''}`.trim())
        .filter(Boolean))].sort();
        
    const nombresUnicos = [...new Set(cursos
        .filter(c => c.estado !== 'inactivo')
        .map(c => c.nombre)
        .filter(Boolean))].sort();

    // Lógica para detectar solapamientos y asignar columnas
    const procesarCursosConColumnas = (dia) => {
        const cursosDelDia = cursosFiltrados.filter(curso => {
            const dias = parsearDiasCurso(curso.horario);
            return dias.includes(dia);
        }).map(curso => {
            const pos = getCoursePosition(curso.horario);
            return { ...curso, ...pos };
        }).filter(c => c.top !== undefined); // Solo los que se pueden posicionar

        // Ordenar por hora de inicio
        cursosDelDia.sort((a, b) => a.startMin - b.startMin);

        const groups = [];
        let currentGroup = [];

        // Agrupar cursos que se solapan
        cursosDelDia.forEach(curso => {
            if (currentGroup.length === 0) {
                currentGroup.push(curso);
            } else {
                // Si el inicio de este curso es antes del fin del grupo actual, se solapa
                const maxEndMin = Math.max(...currentGroup.map(c => c.endMin));
                if (curso.startMin < maxEndMin) {
                    currentGroup.push(curso);
                } else {
                    groups.push([...currentGroup]);
                    currentGroup = [curso];
                }
            }
        });
        if (currentGroup.length > 0) groups.push(currentGroup);

        // Para cada grupo, asignar columnas
        const finalCursos = [];
        groups.forEach(group => {
            const columns = []; // Cada elemento es el tiempo de fin de la columna
            group.forEach(curso => {
                let placed = false;
                for (let i = 0; i < columns.length; i++) {
                    if (curso.startMin >= columns[i]) {
                        curso.columnIndex = i;
                        columns[i] = curso.endMin;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    curso.columnIndex = columns.length;
                    columns.push(curso.endMin);
                }
            });

            // El total de columnas para este grupo es el número de columnas que necesitamos
            const totalCols = columns.length;
            group.forEach(curso => {
                curso.totalColumns = totalCols;
                finalCursos.push(curso);
            });
        });

        return finalCursos;
    };

    // Cursos sin horario asignado
    const cursosSinDia = cursosFiltrados.filter(curso => parsearDiasCurso(curso.horario).length === 0);

    const totalCursos = cursosFiltrados.length;
    const cursosConHorario = cursosFiltrados.filter(c => parsearDiasCurso(c.horario).length > 0).length;

    return (
        <div className="main-content">
            <Navbar title="Calendario de Cursos" />

            {/* Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {[
                    { label: 'Total Cursos', value: totalCursos, color: '#2563eb', icon: <FaBook /> },
                    { label: 'Con Horario', value: cursosConHorario, color: '#16a34a', icon: <FaCalendarAlt /> },
                    { label: 'Sin Horario', value: cursosSinDia.length, color: '#d97706', icon: <FaClock /> },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: 'white', borderRadius: '12px', padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '14px',
                        border: `1px solid #f3f4f6`
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: stat.color + '18', color: stat.color, fontSize: '18px'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>{stat.label}</p>
                            <h3 style={{ margin: 0, fontSize: '24px', color: '#1f2937', fontWeight: '700' }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '12px', 
                marginBottom: '20px' 
            }}>
                {/* 1. Ciclo */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Ciclo</p>
                    <select
                        value={filtroCiclo}
                        onChange={e => setFiltroCiclo(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                        <option value="">Todos los ciclos</option>
                        {ciclos.map(ciclo => (
                            <option key={ciclo.id} value={ciclo.id}>{ciclo.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Docente */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Docente</p>
                    <select
                        value={filtroDocente}
                        onChange={e => setFiltroDocente(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                        <option value="">Todos los docentes</option>
                        {docentesUnicos.map(doc => (
                            <option key={doc} value={doc}>{doc}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Aula / Laboratorio Selector */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Aula / Lab</p>
                    <select
                        value={filtroAula}
                        onChange={e => setFiltroAula(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                        <option value="">Todas las aulas</option>
                        <optgroup label="Aulas">
                            {AULAS_PRESET.map(aula => (
                                <option key={aula} value={aula}>{aula}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Laboratorios">
                            {LABORATORIOS_PRESET.map(lab => (
                                <option key={lab} value={lab}>{lab}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                {/* 4. Nombre de Curso */}
                <div style={{ background: 'white', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Nombre del Curso</p>
                    <select
                        value={filtroCurso}
                        onChange={e => setFiltroCurso(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                        <option value="">Todos los cursos</option>
                        {nombresUnicos.map(nombre => (
                            <option key={nombre} value={nombre}>{nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : (
                <div className="calendar-content">
                    <div className="card" style={{ padding: '0', overflow: 'auto', maxHeight: '1000px' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '80px repeat(7, 1fr)',
                            minWidth: '1200px',
                            backgroundColor: 'white',
                            position: 'relative'
                        }}>
                            {/* Esquina vacía */}
                            <div style={{ 
                                borderRight: '1px solid #e2e8f0', 
                                borderBottom: '2px solid #e2e8f0',
                                background: '#f8fafc' 
                            }}></div>

                            {/* Headers de los días */}
                            {DIAS_SEMANA.map((dia) => (
                                <div key={dia} style={{
                                    padding: '12px 10px',
                                    textAlign: 'center',
                                    background: '#f8fafc',
                                    color: '#1e2937',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderBottom: '2px solid #e2e8f0',
                                    borderRight: '1px solid #e2e8f0',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 50
                                }}>
                                    {dia}
                                </div>
                            ))}

                            {/* Eje de Horas (Columna Izquierda) */}
                            <div style={{ gridColumn: '1', position: 'relative', height: `${(END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE}px`, background: '#f8fafc', borderRight: '1px solid #e5e7eb' }}>
                                {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                                    const hour = START_HOUR + i;
                                    const label = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                                    return (
                                        <div key={hour} style={{
                                            position: 'absolute',
                                            top: `${i * 60 * PIXELS_PER_MINUTE}px`,
                                            width: '100%',
                                            textAlign: 'right',
                                            paddingRight: '12px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            fontFamily: 'monospace',
                                            transform: 'translateY(-50%)',
                                            zIndex: 20,
                                            background: '#f8fafc',
                                            padding: '2px 4px'
                                        }}>
                                            {label}
                                        </div>
                                    );
                                })}

                                {/* Horario del Receso en el Eje de Tiempo */}
                                <div style={{
                                    position: 'absolute',
                                    top: `${(11.0 - START_HOUR) * 60 * PIXELS_PER_MINUTE}px`,
                                    width: '100%',
                                    textAlign: 'right',
                                    paddingRight: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#0369a1',
                                    transform: 'translateY(-50%)',
                                    background: '#f0f9ff',
                                    zIndex: 25,
                                    borderRadius: '4px 0 0 4px',
                                    border: '1px solid #bae6fd',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    11:00 AM
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    top: `${(11.5 - START_HOUR) * 60 * PIXELS_PER_MINUTE}px`,
                                    width: '100%',
                                    textAlign: 'right',
                                    paddingRight: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#0369a1',
                                    transform: 'translateY(-50%)',
                                    background: '#f0f9ff',
                                    zIndex: 25,
                                    borderRadius: '4px 0 0 4px',
                                    border: '1px solid #bae6fd',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    11:30 AM
                                </div>
                            </div>

                            {DIAS_SEMANA.map((dia) => {
                                const cursosDia = procesarCursosConColumnas(dia);
                                const isDomingo = dia === 'Domingo';
                                return (
                                    <div key={dia} style={{
                                        position: 'relative',
                                        height: `${(END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE}px`,
                                        borderRight: '1px solid #e2e8f0',
                                        background: isDomingo ? '#f8fafc' : 'transparent'
                                    }}>
                                        {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                                            <div key={i} style={{
                                                position: 'absolute',
                                                top: `${i * 60 * PIXELS_PER_MINUTE}px`,
                                                left: 0,
                                                right: 0,
                                                borderBottom: i === 0 ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                zIndex: 1
                                            }}></div>
                                        ))}

                                        {/* RECREO VISUALMENTE MEJORADO - Z-INDEX CORREGIDO */}
                                        <div style={{
                                            position: 'absolute',
                                            top: `${(11.0 - START_HOUR) * 60 * PIXELS_PER_MINUTE}px`,
                                            left: 0,
                                            right: 0,
                                            height: `${30 * PIXELS_PER_MINUTE}px`,
                                            background: 'rgba(240, 249, 255, 0.7)', // Ligeramente transparente
                                            borderTop: '1px dashed #bae6fd',
                                            borderBottom: '1px dashed #bae6fd',
                                            zIndex: 1, // Z-INDEX 1: Detrás de los cursos (que tienen 10)
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            pointerEvents: 'none'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                color: '#0369a1', 
                                                backgroundColor: 'white',
                                                padding: '2px 10px',
                                                borderRadius: '20px',
                                                border: '1px solid #bae6fd',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                opacity: 0.8
                                            }}>
                                                <span style={{ 
                                                    fontSize: '9px', 
                                                    fontWeight: '800', 
                                                    letterSpacing: '2px', 
                                                    textTransform: 'uppercase' 
                                                }}>
                                                    RECESO
                                                </span>
                                            </div>
                                        </div>

                                        {cursosDia.map(curso => (
                                            <CalendarioCurso 
                                                key={curso.id} 
                                                curso={curso} 
                                                columnIndex={curso.columnIndex}
                                                totalColumns={curso.totalColumns}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cursos sin día asignado */}
                    {cursosSinDia.length > 0 && (
                        <div className="card" style={{ marginTop: '20px', border: '2px solid #fcd34d' }}>
                            <div className="card-header" style={{ background: '#fffbeb', borderBottom: '1px solid #fcd34d' }}>
                                <h2 className="card-title" style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaExclamationTriangle color="#d97706" />
                                    Cursos sin día detectado
                                    <span style={{
                                        background: '#d97706', color: 'white',
                                        borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '700'
                                    }}>
                                        {cursosSinDia.length}
                                    </span>
                                </h2>
                            </div>

                            {/* Cuadro de ayuda con formatos aceptados */}
                            <div style={{
                                background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px',
                                padding: '14px 16px', margin: '16px 16px 4px', display: 'flex', gap: '12px', alignItems: 'flex-start'
                            }}>
                                <FaInfoCircle color="#2563eb" size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#1e40af', fontSize: '13px' }}>
                                        ¿Por qué aparecen aquí?
                                    </p>
                                    <p style={{ margin: '0 0 8px', color: '#374151', fontSize: '12px' }}>
                                        El calendario no pudo identificar un día de la semana en el horario guardado.
                                        Edita el curso e incluye el día con alguno de estos formatos:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {[
                                            'Lunes y Miércoles 3:00 PM',
                                            'Lunes a Viernes 8:00 AM',
                                            'Sábado 10:00 AM - 12:00 PM',
                                            'Mar, Jue 4:00 PM',
                                            'Diario 9:00 AM',
                                        ].map(ej => (
                                            <code key={ej} style={{
                                                background: '#dbeafe', color: '#1e40af',
                                                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600'
                                            }}>
                                                {ej}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tarjetas de cursos sin horario */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '16px' }}>
                                {cursosSinDia.map(curso => (
                                    <div key={curso.id} style={{
                                        background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px',
                                        padding: '12px 16px', minWidth: '220px', maxWidth: '280px'
                                    }}>
                                        <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#92400e', fontSize: '13px' }}>
                                            {curso.nombre}
                                        </p>
                                        <div style={{ marginTop: '8px', background: '#fff7ed', borderRadius: '6px', padding: '5px 8px', border: '1px dashed #f59e0b' }}>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#b45309', fontWeight: '600' }}>
                                                Horario guardado:
                                            </p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontStyle: curso.horario ? 'normal' : 'italic' }}>
                                                {curso.horario || '(sin horario)'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Removing useless legend as there are no levels anymore */}
                </div>
            )}
        </div>
    );
};

export default Calendario;

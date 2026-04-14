// No moment import needed (Point 6)

const DIAS_SEMANA = {
    'lunes': 1, 'lun': 1, 'lu': 1,
    'martes': 2, 'mar': 2, 'ma': 2,
    'miercoles': 3, 'miércoles': 3, 'mie': 3, 'mié': 3, 'mi': 3,
    'jueves': 4, 'jue': 4, 'ju': 4,
    'viernes': 5, 'vie': 5, 'vi': 5,
    'sabado': 6, 'sábado': 6, 'sab': 6, 'sáb': 6, 'sa': 6
};

const KEYWORDS_DIARIO = ['diario', 'todos los dias', 'todos los días', 'lunes a viernes', 'lun a vie'];

const BLOQUES_PERMITIDOS = [
    '7:00 am - 9:00 am',
    '9:00 am - 11:00 am',
    '11:30 am - 1:30 pm',
    '2:00 pm - 4:00 pm',
    '4:00 pm - 6:00 pm',
    '6:00 pm - 7:00 pm'
];

const AULAS_PERMITIDAS = [
    'Aula 1', 'Aula 2', 'Aula 3', 'Aula 4', 'Aula 5',
    'Aula 6', 'Aula 7', 'Aula 8',
    'Laboratorio 1', 'Laboratorio 2'
];

/**
 * Normaliza un string quitando acentos y pasándolo a minúsculas
 */
const normalizarTexto = (texto) => {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
};

/**
 * Extrae los días de la semana de un string de horario
 * Retorna un arreglo de números (0=Dom, 1=Lun, ..., 6=Sab)
 */
const extraerDias = (horarioStr) => {
    const normStr = normalizarTexto(horarioStr);

    if (KEYWORDS_DIARIO.some(kw => normStr.includes(normalizarTexto(kw)))) {
        return [1, 2, 3, 4, 5]; // Lunes a Viernes
    }

    const diasEncontrados = new Set();

    // Buscar palabras clave en el string
    // Añadimos espacios alrededor para buscar palabras completas, excepto para abreviaturas seguidas de comas
    const paddedStr = ` ${normStr.replace(/[,;]/g, ' ')} `;

    for (const [kw, numDia] of Object.entries(DIAS_SEMANA)) {
        if (paddedStr.includes(` ${kw} `) || paddedStr.includes(` ${kw}-`) || paddedStr.includes(`-${kw} `)) {
            diasEncontrados.add(numDia);
        }
    }

    return Array.from(diasEncontrados);
};

/**
 * Convierte un string de hora como "4:00 PM" o "16:00" a minutos desde la medianoche
 */
const horaAMinutos = (horaStr) => {
    if (!horaStr) return null;

    // Limpiar espacios extra
    let cleanTime = horaStr.trim().toLowerCase();

    let hours = 0;
    let minutes = 0;
    let isPM = cleanTime.includes('pm') || cleanTime.includes('p.m');
    let isAM = cleanTime.includes('am') || cleanTime.includes('a.m');

    // Remover am/pm del string para parsear números
    cleanTime = cleanTime.replace(/[a-z.]/g, '').trim();

    if (cleanTime.includes(':')) {
        const parts = cleanTime.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
    } else {
        // Si solo dieron el número de la hora, e.g., "4 PM"
        hours = parseInt(cleanTime, 10);
    }

    if (isNaN(hours) || isNaN(minutes)) return null;

    // Ajuste de horas formato 12h
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
};

/**
 * Extrae el rango de horas de un string de horario
 * Retorna { inicio: minutos, fin: minutos }
 */
const extraerRangoHoras = (horarioStr) => {
    if (!horarioStr) return null;

    // Buscar un patrón de horas tipo: "4:00 PM - 6:00 PM" o "16:00 a 18:00" o "16:00-18:00"
    // Expresión regular para encontrar tiempos (1 o 2 tiempos en el string)
    const timeRegex = /\b\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b/ig;
    const matches = horarioStr.match(timeRegex);

    if (!matches || matches.length === 0) return null;

    const inicioMinutos = horaAMinutos(matches[0]);
    if (inicioMinutos === null) return null;

    // Si no especifican hora de fin, asuminos +2 horas por defecto (120 minutos)
    let finMinutos = inicioMinutos + 120;

    if (matches.length > 1) {
        const finParseado = horaAMinutos(matches[1]);
        if (finParseado !== null) {
            finMinutos = finParseado;

            // Si el formato era "4:00 - 6:00 PM", y el primero se parseó como AM por omisión, lo corregimos
            if (horarioStr.toLowerCase().includes('pm') && matches[0].toLowerCase().indexOf('pm') === -1 && matches[0].toLowerCase().indexOf('am') === -1) {
                if (inicioMinutos < 12 * 60 && finMinutos > 12 * 60) {
                    // El inicio probablemente era PM también si el fin lo es y no tenía indicador explícito
                    // Solo si el inicio es un numero pequeño (e.g. 4)
                    const inicioHora = Math.floor(inicioMinutos / 60);
                    if (inicioHora < 12 && (inicioHora + 12) * 60 < finMinutos) {
                        // Dejarlo como AM si es lógico (ej 10 AM a 2 PM)
                    } else {
                        return { inicio: inicioMinutos + 12 * 60, fin: finMinutos };
                    }
                }
            }
        }
    }

    // Prevenir que el fin sea menor que el inicio (por ejemplo cruzan medianoche, raro en academias pero posible)
    if (finMinutos <= inicioMinutos) {
        finMinutos += 24 * 60;
    }

    return { inicio: inicioMinutos, fin: finMinutos };
};

/**
 * Parsea completamente un string de horario
 * Retorna { dias: [1, 3, 5], inicio: 960, fin: 1080 }
 */
const parsearHorario = (horarioStr) => {
    if (!horarioStr) return null;
    const dias = extraerDias(horarioStr);
    const rango = extraerRangoHoras(horarioStr);

    if (dias.length === 0 || !rango) {
        return null; // Formato ininteligible
    }

    return { dias, ...rango };
};

/**
 * Verifica si dos objetos de horario (parseados) se cruzan
 */
const hayCruce = (horarioA, horarioB) => {
    if (!horarioA || !horarioB) return false;

    // Tienen algún día en común?
    const interseccionDias = horarioA.dias.filter(d => horarioB.dias.includes(d));
    if (interseccionDias.length === 0) return false;

    // Se solapan en el tiempo?
    // Se solapan si (Inicio A < Fin B) Y (Inicio B < Fin A)
    // Añadimos un pequeño "buffer" opcional, si un curso acaba a las 4:00 y otro empieza a las 4:00, no es cruce estricto
    return (horarioA.inicio < horarioB.fin) && (horarioB.inicio < horarioA.fin);
};

/**
 * Verifica si un horario dado contiene uno de los bloques estrictos de tiempo
 * requeridos por la institución (bloques de 2h y 1h).
 */
const esBloquePermitido = (horarioStr) => {
    if (!horarioStr) return false;
    const lowerStr = horarioStr.toLowerCase();
    
    // Si no tiene horas (ej. solo dice "Lunes"), lo dejamos pasar o lo bloqueamos según el contexto
    // En este caso el requisito es que, SI tiene horas, deben estar en los bloques permitidos.
    // Para simplificar: el requerimiento asume que todo horario VÁLIDO debe tener horas marcadas.
    const tieneHora = /\d{1,2}:\d{2}/.test(lowerStr);
    if (!tieneHora) return true; // Cursos antiguos sin hora no se rompen

    return BLOQUES_PERMITIDOS.some(bloque => lowerStr.includes(bloque));
};

/**
 * Verifica si el aula proporcionada está dentro de la lista de aulas físicas
 * aprobadas por la academia, para evitar errores tipográficos o aulas inexistentes.
 */
const esAulaPermitida = (aulaStr) => {
    if (!aulaStr) return true; // Cursos sin asignar sala
    // Ser tolerantes a diferencias de formato (mayúsculas/espacios/acentos)
    const aulaNorm = normalizarTexto(aulaStr).replace(/\s+/g, ' ');
    return AULAS_PERMITIDAS.some((a) => normalizarTexto(a).replace(/\s+/g, ' ') === aulaNorm);
};

module.exports = {
    parsearHorario,
    hayCruce,
    esBloquePermitido,
    esAulaPermitida,
    extraerDias,
    normalizarTexto,
    AULAS_PERMITIDAS,
    BLOQUES_PERMITIDOS
};

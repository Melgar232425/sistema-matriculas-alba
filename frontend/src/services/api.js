// Servicio para comunicarse con el backend
import axios from 'axios';

// URL base del backend - Forzamos Railway para evitar fallos de conexión
const API_URL = 'https://sistema-matriculas-alba-production.up.railway.app/api';

// Crear instancia de axios con configuración por defecto
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Punto S7: 15 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para atrapar errores de autenticación (Token expirado/inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la petición era de login, NO redirigir ni cerrar sesión, solo dejar que el componente muestre el error
    if (error.config && error.config.url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Token inválido o expirado. Cerrando sesión...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTENTICACIÓN ============
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// ============ ESTUDIANTES ============
export const estudiantesAPI = {
  getAll: (params) => api.get('/estudiantes', { params }),
  getById: (id) => api.get(`/estudiantes/${id}`),
  getByDni: (dni) => api.get(`/estudiantes/buscar/dni/${dni}`),
  create: (data) => api.post('/estudiantes', data),
  update: (id, data) => api.put(`/estudiantes/${id}`, data),
  delete: (id) => api.delete(`/estudiantes/${id}`),
  getMatriculas: (id) => api.get(`/estudiantes/${id}/matriculas`),
  getHistorial: (id) => api.get(`/estudiantes/${id}/historial`),
};

// ============ DOCENTES ============
export const docentesAPI = {
  getAll: (params) => api.get('/docentes', { params }),
  getById: (id) => api.get(`/docentes/${id}`),
  create: (data) => api.post('/docentes', data),
  update: (id, data) => api.put(`/docentes/${id}`, data),
  delete: (id) => api.delete(`/docentes/${id}`),
};

// ============ CURSOS ============
export const cursosAPI = {
  getAll: (params) => api.get('/cursos', { params }),
  getById: (id) => api.get(`/cursos/${id}`),
  getDisponibles: () => api.get('/cursos/disponibles/lista'),
  getDisponibilidad: (params) => api.get('/cursos/disponibilidad', { params }),
  create: (data) => api.post('/cursos', data),
  update: (id, data) => api.put(`/cursos/${id}`, data),
  delete: (id) => api.delete(`/cursos/${id}`),
};

// ============ MATRÍCULAS ============
export const matriculasAPI = {
  getAll: (params) => api.get('/matriculas', { params }),
  getById: (id) => api.get(`/matriculas/${id}`),
  create: (data) => api.post('/matriculas', data),
  update: (id, data) => api.put(`/matriculas/${id}`, data),
  cancel: (id) => api.delete(`/matriculas/${id}`),
  getPagos: (id) => api.get(`/matriculas/${id}/pagos`),
};

// ============ PAGOS ============
export const pagosAPI = {
  getAll: (params) => api.get('/pagos', { params }),
  getById: (id) => api.get(`/pagos/${id}`),
  create: (data) => api.post('/pagos', data),
  delete: (id) => api.delete(`/pagos/${id}`),
};

// ============ REPORTES ============
export const reportesAPI = {
  getDashboard: () => api.get('/reportes/dashboard'),
  getEstudiantesPorCurso: (params) => api.get('/reportes/estudiantes-por-curso', { params }),
  getIngresos: (params) => api.get('/reportes/ingresos', { params }),
  getMorosidad: (params) => api.get('/reportes/morosidad', { params }),
  getMatriculasPorPeriodo: (params) => api.get('/reportes/matriculas-periodo', { params }),
};

// ============ CICLOS ============
export const ciclosAPI = {
  getAll: () => api.get('/ciclos'),
  create: (data) => api.post('/ciclos', data),
  toggleStatus: (id, estado) => api.put(`/ciclos/${id}/estado`, { estado }),
  delete: (id) => api.delete(`/ciclos/${id}`),
};

// ============ SEGUIMIENTOS ============
export const seguimientosAPI = {
  getPorEstudiante: (estudianteId) => api.get(`/seguimientos/estudiante/${estudianteId}`),
  create: (data) => api.post('/seguimientos', data),
};

// ============ PORTAL DE ESTUDIANTES ============
// Instancia separada que usa el token del estudiante (student_token)
const portalApi = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('student_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la petición de fallo fue por credenciales incorrectas en el login, no recargar la página.
    if (error.config && error.config.url.includes('/portal/login')) {
      return Promise.reject(error);
    }

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      window.location.href = '/portal';
    }
    return Promise.reject(error);
  }
);

export const portalAPI = {
  login: (credentials) => portalApi.post('/portal/login', credentials),
  getPerfil: () => portalApi.get('/portal/perfil'),
  getMatriculas: () => portalApi.get('/portal/matriculas'),
  getPagos: () => portalApi.get('/portal/pagos'),
  getHorario: () => portalApi.get('/portal/horario'),
  getAsistencias: () => portalApi.get('/portal/asistencias'),
};

// ============ PORTAL DE DOCENTES ============
const docenteApi = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

docenteApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('docente_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

docenteApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config && error.config.url.includes('/portal-docente/login')) {
      return Promise.reject(error);
    }
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('docente_token');
      localStorage.removeItem('docente_user');
      window.location.href = '/portal-docente';
    }
    return Promise.reject(error);
  }
);

export const docentePortalAPI = {
  login: (credentials) => docenteApi.post('/portal-docente/login', credentials),
  getCursos: () => docenteApi.get('/portal-docente/cursos'),
  getEstudiantesAsistencia: (cursoId, fecha) => docenteApi.get(`/portal-docente/cursos/${cursoId}/estudiantes`, { params: { fecha } }),
  marcarAsistencia: (cursoId, data) => docenteApi.post(`/portal-docente/cursos/${cursoId}/asistencias`, data),
};

export default api;


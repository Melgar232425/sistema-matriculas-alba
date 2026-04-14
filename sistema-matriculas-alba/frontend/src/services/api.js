// Servicio para comunicarse con el backend
import axios from 'axios';

// URL base del backend
const API_URL = 'http://localhost:5000/api';

// Crear instancia de axios con configuración por defecto
const api = axios.create({
  baseURL: API_URL,
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
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Si el error es 401 o 403 NO Autorizado (token expirado o inválido)
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

export default api;

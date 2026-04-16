import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Estudiantes from './pages/Estudiantes';
import Cursos from './pages/Cursos';
import Matriculas from './pages/Matriculas';
import Pagos from './pages/Pagos';
import Reportes from './pages/Reportes';
import Calendario from './pages/Calendario';
import Docentes from './pages/Docentes';
import Tutores from './pages/Tutores';
import Ciclos from './pages/Ciclos';
import './styles/App.css';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import PortalLogin from './pages/PortalLogin';
import PortalInicio from './pages/PortalInicio';
import PortalPagos from './pages/PortalPagos';
import PortalHorario from './pages/PortalHorario';
import PortalAsistencia from './pages/PortalAsistencia';
import PortalDocenteLogin from './pages/PortalDocenteLogin';
import PortalDocenteInicio from './pages/PortalDocenteInicio';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'react-hot-toast';

// Componente para proteger rutas según rol
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    if (user.rol === 'matriculador') {
      return <Navigate to="/matriculas" replace />;
    }
    if (user.rol === 'tutor') {
      return <Navigate to="/tutores" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// Guard para rutas del portal estudiantil
const StudentRoute = ({ children }) => {
  const token = localStorage.getItem('student_token');
  if (!token) return <Navigate to="/portal" replace />;
  return children;
};

// Guard para rutas del portal docente
const DocenteRoute = ({ children }) => {
  const token = localStorage.getItem('docente_token');
  if (!token) return <Navigate to="/portal-docente" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* 1. RUTAS PÚBLICAS Y DE LOGIN (Deben estar primero) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/portal" element={<PortalLogin />} />
          <Route path="/portal-docente" element={<PortalDocenteLogin />} />

          {/* 2. RUTAS DE PORTAL ESTUDIANTE (Protegidas) */}
          <Route path="/portal/inicio" element={<StudentRoute><PortalInicio /></StudentRoute>} />
          <Route path="/portal/asistencia" element={<StudentRoute><PortalAsistencia /></StudentRoute>} />
          <Route path="/portal/pagos" element={<StudentRoute><PortalPagos /></StudentRoute>} />
          <Route path="/portal/horario" element={<StudentRoute><PortalHorario /></StudentRoute>} />

          {/* 3. RUTAS DE PORTAL DOCENTE (Protegidas) */}
          <Route path="/portal-docente/inicio" element={<DocenteRoute><PortalDocenteInicio /></DocenteRoute>} />

          {/* 4. RUTAS ADMINISTRATIVAS (Dentro de Layout con Sidebar) */}
          <Route path="/admin/*" element={
            <PrivateRoute allowedRoles={['director', 'admin']}>
              <div className="app">
                <Sidebar />
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </div>
            </PrivateRoute>
          } />

          <Route path="/estudiantes" element={
            <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
              <div className="app"><Sidebar /><Estudiantes /></div>
            </PrivateRoute>
          } />
          
          <Route path="/docentes" element={
            <PrivateRoute allowedRoles={['director', 'admin']}>
              <div className="app"><Sidebar /><Docentes /></div>
            </PrivateRoute>
          } />
          
          <Route path="/tutores" element={
            <PrivateRoute allowedRoles={['director', 'admin', 'tutor']}>
              <div className="app"><Sidebar /><Tutores /></div>
            </PrivateRoute>
          } />

          <Route path="/cursos" element={
            <PrivateRoute allowedRoles={['director', 'admin']}>
              <div className="app"><Sidebar /><Cursos /></div>
            </PrivateRoute>
          } />

          <Route path="/ciclos" element={
            <PrivateRoute allowedRoles={['director', 'admin']}>
              <div className="app"><Sidebar /><Ciclos /></div>
            </PrivateRoute>
          } />

          <Route path="/matriculas" element={
            <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
              <div className="app"><Sidebar /><Matriculas /></div>
            </PrivateRoute>
          } />

          <Route path="/pagos" element={
            <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
              <div className="app"><Sidebar /><Pagos /></div>
            </PrivateRoute>
          } />

          <Route path="/reportes" element={
            <PrivateRoute allowedRoles={['director', 'admin']}>
              <div className="app"><Sidebar /><Reportes /></div>
            </PrivateRoute>
          } />

          <Route path="/calendario" element={
            <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
              <div className="app"><Sidebar /><Calendario /></div>
            </PrivateRoute>
          } />

          {/* CATCH ALL - Redirigir a landing si nada coincide */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

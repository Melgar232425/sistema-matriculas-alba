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
import Ciclos from './pages/Ciclos';
import './styles/App.css';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
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

  // Si no tiene el rol permitido, enviarlo a su vista predeterminada en lugar del Dashboard
  // Si no tiene el rol permitido, enviarlo a su vista predeterminada
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    if (user.rol === 'matriculador') {
      return <Navigate to="/matriculas" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <div className="app">
          <Sidebar />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <PrivateRoute allowedRoles={['director', 'admin']}>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/estudiantes" element={
              <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
                <Estudiantes />
              </PrivateRoute>
            } />
            <Route path="/docentes" element={
              <PrivateRoute allowedRoles={['director', 'admin']}>
                <Docentes />
              </PrivateRoute>
            } />
            <Route path="/cursos" element={
              <PrivateRoute allowedRoles={['director', 'admin']}>
                <Cursos />
              </PrivateRoute>
            } />
            <Route path="/ciclos" element={
              <PrivateRoute allowedRoles={['director', 'admin']}>
                <Ciclos />
              </PrivateRoute>
            } />
            <Route path="/matriculas" element={
              <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
                <Matriculas />
              </PrivateRoute>
            } />
            <Route path="/pagos" element={
              <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
                <Pagos />
              </PrivateRoute>
            } />
            <Route path="/reportes" element={
              <PrivateRoute allowedRoles={['director', 'admin']}>
                <Reportes />
              </PrivateRoute>
            } />
            <Route path="/calendario" element={
              <PrivateRoute allowedRoles={['director', 'admin', 'matriculador']}>
                <Calendario />
              </PrivateRoute>
            } />
            <Route path="*" element={
              <Navigate to="/" replace />
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

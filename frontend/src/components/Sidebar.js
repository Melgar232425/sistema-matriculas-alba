import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUserGraduate,
  FaBook,
  FaClipboardList,
  FaMoneyBillWave,
  FaChartBar,
  FaSignOutAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaUserTie,
  FaLayerGroup // Punto 14
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  // No renderizar el Sidebar si no hay usuario (ej. en Login)
  if (!user) return null;

  const menuItems = [
    { path: '/', icon: <FaHome />, label: 'Inicio', roles: ['director', 'admin'] },
    { path: '/ciclos', icon: <FaLayerGroup />, label: 'Gestión de Ciclos', roles: ['director', 'admin'] }, // Punto 14
    { path: '/estudiantes', icon: <FaUserGraduate />, label: 'Estudiantes', roles: ['director', 'admin', 'matriculador'] },
    { path: '/docentes', icon: <FaUserTie />, label: 'Docentes', roles: ['director', 'admin'] },
    { path: '/cursos', icon: <FaBook />, label: 'Cursos', roles: ['director', 'admin'] },
    { path: '/matriculas', icon: <FaClipboardList />, label: 'Matrículas', roles: ['director', 'admin', 'matriculador'] },
    { path: '/pagos', icon: <FaMoneyBillWave />, label: 'Pagos y Recibos', roles: ['director', 'admin', 'matriculador'] },
    { path: '/calendario', icon: <FaCalendarAlt />, label: 'Calendario Acad.', roles: ['director', 'admin', 'matriculador'] },
    { path: '/reportes', icon: <FaChartBar />, label: 'Estadísticas', roles: ['director', 'admin'] },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ textAlign: 'center', padding: '20px 10px' }}>
        <img 
          src="/logo_oficial.png" 
          alt="Academia Alba" 
          style={{ width: 'auto', height: '90px', marginBottom: '15px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} 
        />
        <h2 style={{ fontSize: '20px', letterSpacing: '1px' }}>Academia Alba</h2>
        <p style={{ opacity: 0.8, fontSize: '13px' }}>Preuniversitaria</p>
      </div>

      <ul className="sidebar-menu">
        {menuItems
          .filter(item => item.roles.includes(user.rol))
          .map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
      </ul>

      {/* Perfil Simplificado abajo */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', padding: '0 10px' }}>
             <FaUserCircle size={32} color="var(--text-light)" />
             <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.nombre_completo}</span>
                <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>{user.rol}</span>
             </div>
        </div>
        <button className="btn" onClick={logout} style={{ width: '100%', background: '#fef2f2', color: '#ef4444', justifyContent: 'center' }}>
          <FaSignOutAlt /> Salir
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

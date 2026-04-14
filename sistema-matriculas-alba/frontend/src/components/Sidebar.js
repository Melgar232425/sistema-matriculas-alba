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
  FaUserTie
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  // No renderizar el Sidebar si no hay usuario (ej. en Login)
  if (!user) return null;

  const menuItems = [
    { path: '/', icon: <FaHome />, label: 'Dashboard', roles: ['director', 'admin'] },
    { path: '/ciclos', icon: <FaCalendarAlt />, label: 'Ciclos', roles: ['director', 'admin'] },
    { path: '/estudiantes', icon: <FaUserGraduate />, label: 'Estudiantes', roles: ['director', 'admin', 'matriculador'] },
    { path: '/docentes', icon: <FaUserTie />, label: 'Docentes', roles: ['director', 'admin'] },
    { path: '/cursos', icon: <FaBook />, label: 'Cursos', roles: ['director', 'admin'] },
    { path: '/matriculas', icon: <FaClipboardList />, label: 'Matrículas', roles: ['director', 'admin', 'matriculador'] },
    { path: '/pagos', icon: <FaMoneyBillWave />, label: 'Pagos', roles: ['director', 'admin', 'matriculador'] },
    { path: '/calendario', icon: <FaCalendarAlt />, label: 'Calendario', roles: ['director', 'admin', 'matriculador'] },
    { path: '/reportes', icon: <FaChartBar />, label: 'Reportes', roles: ['director', 'admin'] },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ color: 'var(--primary-color)' }}>Academia Alba</h2>
        <p style={{ color: 'var(--text-light)' }}>Sistema de Gestión</p>
      </div>

      {/* Información del usuario logueado */}
      <div style={{ padding: '20px 24px', margin: '0 16px', background: '#f8fafc', borderRadius: '16px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-color)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}>
            <FaUserCircle size={24} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{user.nombre_completo}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px', fontWeight: '700' }}>{user.rol}</span>
          </div>
        </div>
      </div>

      <ul className="sidebar-menu" style={{ flex: 1, overflowY: 'auto' }}>
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

      {/* Botón de cerrar sesión al final */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#dc2626',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontWeight: '600',
            fontSize: '14px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FaSignOutAlt /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

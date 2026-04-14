// Componente Navbar - Barra superior
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ title = 'Dashboard' }) => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="navbar-title">
        <h1>{title}</h1>
      </div>
      <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ cursor: 'default', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '10px',
            height: '10px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
          }}></div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginLeft: '10px' }}>
            {usuario.nombres ? `${usuario.nombres} - Activo` : 'Sistema - Activo'}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <FaSignOutAlt /> Salir
        </button>
      </div>
    </div>
  );
};

export default Navbar;

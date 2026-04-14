import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaSignOutAlt, FaRocket, FaUserAlt } from 'react-icons/fa';

const Navbar = ({ title = 'Panel de Administración' }) => {
  const navigate = useNavigate();
  const { user, logout } = React.useContext(AuthContext); // Punto 11

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="navbar-title" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img src="/logo_oficial.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
        <h1>{title}</h1>
      </div>
      <div className="navbar-status">
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaRocket style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 5px rgba(67, 97, 238, 0.4))' }} />
          <span>Servidor: <b style={{ color: 'var(--secondary)' }}>En línea</b></span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn"
          style={{ background: '#334155', color: 'white', padding: '8px 16px', fontSize: '13px' }}
        >
          <FaSignOutAlt /> Desconectar
        </button>
      </div>
    </div>
  );
};

export default Navbar;

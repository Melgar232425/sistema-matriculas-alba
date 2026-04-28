import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaClipboardList, FaMoneyCheckAlt } from 'react-icons/fa';

const StudentNavbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { path: '/portal/inicio', label: 'Inicio', icon: <FaHome /> },
    { path: '/portal/horario', label: 'Mi Horario', icon: <FaCalendarAlt /> },
    { path: '/portal/asistencia', label: 'Mi Asistencia', icon: <FaClipboardList /> },
    { path: '/portal/pagos', label: 'Mis Pagos', icon: <FaMoneyCheckAlt /> }
  ];

  return (
    <nav style={styles.navContainer}>
      <div style={styles.navInner}>
        {links.map((link) => {
          const isActive = currentPath === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {})
              }}
              className="student-nav-link"
            >
              <span style={{ ...styles.icon, ...(isActive ? styles.iconActive : {}) }}>
                {link.icon}
              </span>
              <span style={{ fontWeight: isActive ? '900' : '700' }}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
      <style>{`
        .student-nav-link:hover {
          background: rgba(67, 97, 238, 0.05);
          transform: translateY(-2px);
        }
      `}</style>
    </nav>
  );
};

const styles = {
  navContainer: {
    background: '#1e293b',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    position: 'sticky',
    top: '60px', /* Ajustado a la altura del header */
    zIndex: 90,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
  },
  navInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 40px',
    display: 'flex',
    gap: '15px',
    overflowX: 'auto',
    scrollbarWidth: 'none'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '18px 12px',
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.02em',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  navItemActive: {
    color: 'white',
    borderBottomColor: '#4361ee',
    background: 'rgba(255,255,255,0.03)'
  },
  icon: {
    fontSize: '16px',
    opacity: 0.8
  },
  iconActive: {
    opacity: 1,
    transform: 'scale(1.1)'
  }
};

export default StudentNavbar;

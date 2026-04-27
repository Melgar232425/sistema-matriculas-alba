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
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: '70px', /* Adjust based on header height */
    zIndex: 90,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 40px',
    display: 'flex',
    gap: '30px',
    overflowX: 'auto',
    scrollbarWidth: 'none' /* Hide scrollbar for clean look */
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 8px',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '13px',
    letterSpacing: '0.02em',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap'
  },
  navItemActive: {
    color: '#4361ee',
    borderBottomColor: '#4361ee'
  },
  icon: {
    fontSize: '16px',
    transition: 'transform 0.2s'
  },
  iconActive: {
    transform: 'scale(1.15)'
  }
};

export default StudentNavbar;

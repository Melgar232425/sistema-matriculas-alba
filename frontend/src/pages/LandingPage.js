import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaUserTie, FaUserShield, FaArrowRight } from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();

  const portals = [
    {
      title: 'Portal Estudiantil',
      desc: 'Consulta tus notas, horarios, matriculas y pagos.',
      icon: <FaUserGraduate size={40} />,
      path: '/portal',
      color: '#4361ee',
      bg: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)'
    },
    {
      title: 'Portal Docente',
      desc: 'Gestiona tus cursos y registra asistencia de alumnos.',
      icon: <FaUserTie size={40} />,
      path: '/portal-docente',
      color: '#0ea5e9',
      bg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
    },
    {
      title: 'Administración',
      desc: 'Gestión académica completa para personal autorizado.',
      icon: <FaUserShield size={40} />,
      path: '/login',
      color: '#6366f1',
      bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <img src="/logo_oficial.png" alt="Academia Alba" style={styles.logo} />
          <h1 style={styles.title}>Plataforma Académica Digital</h1>
          <p style={styles.subtitle}>Selecciona el portal correspondiente a tu perfil para continuar</p>
        </div>

        <div style={styles.grid}>
          {portals.map((p, i) => (
            <div 
              key={i} 
              style={styles.card} 
              onClick={() => navigate(p.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)';
              }}
            >
              <div style={{ ...styles.iconWrap, background: p.bg }}>
                {p.icon}
              </div>
              <h2 style={styles.cardTitle}>{p.title}</h2>
              <p style={styles.cardDesc}>{p.desc}</p>
              <div style={{ ...styles.actionBtn, color: p.color }}>
                Acceder ahora <FaArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>

        <footer style={styles.footer}>
          © 2026 Academia Alba Perú. Todos los derechos reservados.
        </footer>
      </div>

      {/* Decoraciones de fondo */}
      <div style={{ ...styles.circle, width: 600, height: 600, top: -200, right: -200, background: 'rgba(67, 97, 238, 0.03)' }} />
      <div style={{ ...styles.circle, width: 400, height: 400, bottom: -100, left: -100, background: 'rgba(14, 165, 233, 0.03)' }} />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden'
  },
  content: {
    maxWidth: 1100,
    width: '100%',
    position: 'relative',
    zIndex: 2,
    textAlign: 'center'
  },
  header: {
    marginBottom: 60
  },
  logo: {
    width: 280,
    marginBottom: 30,
    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.08))'
  },
  title: {
    fontSize: 42,
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-1px',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 500
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 30,
    marginBottom: 60
  },
  card: {
    background: 'white',
    borderRadius: 32,
    padding: '40px 30px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    marginBottom: 24,
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 14
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#64748b',
    marginBottom: 24,
    flex: 1
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 700,
    fontSize: 16,
    padding: '10px 20px',
    borderRadius: 12,
    background: '#f8fafc',
    transition: 'all 0.2s'
  },
  footer: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 500
  },
  circle: {
    position: 'absolute',
    borderRadius: '50%',
    zIndex: 1
  }
};

export default LandingPage;

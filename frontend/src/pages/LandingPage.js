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
      bg: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
      roles: 'Alumno / Estudiante'
    },
    {
      title: 'Portal Docente',
      desc: 'Gestiona tus cursos y registra asistencia de alumnos.',
      icon: <FaUserTie size={40} />,
      path: '/portal-docente',
      color: '#0ea5e9',
      bg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      roles: 'Profesores / Tutores'
    },
    {
      title: 'Administración',
      desc: 'Gestión académica completa para personal autorizado.',
      icon: <FaUserShield size={40} />,
      path: '/login',
      color: '#6366f1',
      bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      roles: 'Director / Admin / Personal'
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
                e.currentTarget.style.transform = 'translateY(-15px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = p.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#f1f5f9';
              }}
            >
              <div style={{ ...styles.iconWrap, background: p.bg }}>
                {p.icon}
              </div>
              <h2 style={styles.cardTitle}>{p.title}</h2>
              <div style={{ ...styles.roleBadge, background: `${p.color}10`, color: p.color }}>
                {p.roles}
              </div>
              <p style={styles.cardDesc}>{p.desc}</p>
              <div style={{ ...styles.actionBtn, background: p.bg, color: 'white' }}>
                Ingresar al Portal <FaArrowRight size={14} />
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
    marginBottom: 80
  },
  logo: {
    width: '80%',
    maxWidth: 280,
    marginBottom: 30,
    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.08))'
  },
  title: {
    fontSize: 'clamp(28px, 5vw, 42px)',
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
    marginBottom: 80
  },
  card: {
    background: 'white',
    borderRadius: 40,
    padding: '50px 40px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
    border: '2px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  roleBadge: {
    padding: '6px 14px',
    borderRadius: 50,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 20
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
    justifyContent: 'center',
    gap: 12,
    fontWeight: 800,
    fontSize: 16,
    padding: '16px 32px',
    borderRadius: 18,
    width: '100%',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
  },
  footer: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 500,
    marginTop: 'auto'
  },
  circle: {
    position: 'absolute',
    borderRadius: '50%',
    zIndex: 1
  }
};

export default LandingPage;

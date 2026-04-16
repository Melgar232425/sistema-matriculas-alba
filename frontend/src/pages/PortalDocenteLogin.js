import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docentePortalAPI } from '../services/api';
import { FaUserTie, FaEnvelope, FaIdCard, FaSignInAlt, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import '../styles/App.css';

const PortalDocenteLogin = () => {
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !dni) { setError('Completa todos los campos.'); return; }

    setLoading(true);
    try {
      const res = await docentePortalAPI.login({ email, dni });
      if (res.data.success) {
        localStorage.setItem('docente_token', res.data.data.token);
        localStorage.setItem('docente_user', JSON.stringify(res.data.data.docente));
        navigate('/portal-docente/inicio');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="responsive-split">
      {/* Panel izquierdo decorativo */}
      <div className="hide-mobile" style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.iconWrap}>
            <FaUserTie size={60} color="white" />
          </div>
          <h1 style={styles.leftTitle}>Área de Docentes</h1>
          <p style={styles.leftSubtitle}>Academia Alba Perú</p>
          
          <div style={styles.featureList}>
            {[
              'Gestión de cursos asignados',
              'Registro rápido de asistencia',
              'Alertas de inasistencia (Riesgo)',
              'Consulta de carga horaria semanales'
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <FaCheckCircle style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Círculos decorativos */}
        <div style={{ ...styles.circle, width: 350, height: 350, top: -50, right: -150 }} />
        <div style={{ ...styles.circle, width: 200, height: 200, bottom: -50, left: -50 }} />
      </div>

      {/* Panel derecho: formulario */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
             <img 
               src="/logo_oficial.png" 
               alt="Academia Alba" 
               style={{ width: 170, marginBottom: 20, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }} 
             />
             <h2 style={styles.formTitle}>Acceso Docente</h2>
             <p style={styles.formSubtitle}>Ingresa con tu <strong>correo</strong> y <strong>DNI</strong> para gestionar tus clases</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>❌</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Correo Electrónico</label>
              <div style={styles.inputWrap}>
                <FaEnvelope style={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Número de DNI</label>
              <div style={styles.inputWrap}>
                <FaIdCard style={styles.inputIcon} />
                <input
                  type="password"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  style={styles.input}
                  placeholder="12345678"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Verificando...' : <><FaSignInAlt /> Ingresar al Sistema</>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <a href="/" style={styles.backLink}>
              <FaArrowLeft size={12} /> Regresar a Portales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  leftPanel: { 
    flex: 1, 
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: 'white',
    padding: '60px 50px',
    position: 'relative',
    overflow: 'hidden'
  },
  leftContent: { maxWidth: 420, position: 'relative', zIndex: 2 },
  iconWrap: { 
    width: 90, 
    height: 90, 
    background: 'rgba(255,255,255,0.15)', 
    borderRadius: 24, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  leftTitle: { fontSize: 34, fontWeight: 900, marginBottom: 8 },
  leftSubtitle: { fontSize: 17, opacity: 0.8, marginBottom: 35 },
  featureList: { display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 30 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 500 },
  circle: { position: 'absolute', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' },
  
  rightPanel: { 
    flex: 1, 
    background: '#f8fafc', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '40px 30px' 
  },
  formCard: { 
    background: 'white', 
    borderRadius: 28, 
    padding: '44px', 
    width: '100%', 
    maxWidth: 460, 
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9'
  },
  formTitle: { fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: '#64748b', lineHeight: 1.6 },
  errorBox: { background: '#fff1f2', color: '#e11d48', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14, fontWeight: 600, border: '1px solid #ffe4e6', display: 'flex', alignItems: 'center', gap: 10 },
  formGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#94a3b8', fontSize: 15, zIndex: 1 },
  input: { width: '100%', height: 50, paddingLeft: 42, paddingRight: 16, border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 15, color: '#0f172a', background: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  submitBtn: { 
    width: '100%', 
    height: 52, 
    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
    color: 'white', 
    border: 'none', 
    borderRadius: 14, 
    fontWeight: 700, 
    fontSize: 15, 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    marginTop: 8,
    boxShadow: '0 8px 20px rgba(14,165,233,0.3)',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0ea5e9', textDecoration: 'none', fontSize: 14, fontWeight: 600 }
};

export default PortalDocenteLogin;

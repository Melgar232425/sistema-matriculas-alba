import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalAPI } from '../services/api';
import {
  FaGraduationCap, FaEnvelope, FaIdCard,
  FaSignInAlt, FaEye, FaEyeSlash, FaCheckCircle
} from 'react-icons/fa';
import '../styles/App.css';

const PortalLogin = () => {
  const [email, setEmail]       = useState('');
  const [codigo, setCodigo]     = useState('');
  const [showCod, setShowCod]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !codigo) { setError('Completa todos los campos.'); return; }

    setLoading(true);
    try {
      const res = await portalAPI.login({ email, codigo });
      if (res.data.success) {
        const { token, estudiante } = res.data.data;
        localStorage.setItem('student_token', token);
        localStorage.setItem('student_user', JSON.stringify(estudiante));
        navigate('/portal/inicio');
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
          <div style={styles.logoBadgeWrap}>
            <img src="/logo_oficial.png" alt="Alba" style={{ width: '80%' }} />
          </div>
          <h1 style={styles.leftTitle}>Portal Estudiantil</h1>
          <p style={styles.leftSubtitle}>Tu camino al éxito académico comienza aquí</p>
          
          <div style={styles.featureList}>
            {[
              'Consulta de matrículas y cursos',
              'Seguimiento de pagos y saldos',
              'Horarios y asistencias en tiempo real',
              'Acceso a información académica'
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <div style={styles.checkWrap}><FaCheckCircle size={14} /></div>
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
             <h2 style={styles.formTitle}>Acceso Alumno</h2>
             <p style={styles.formSubtitle}>Ingresa con tu <strong>correo</strong> y tu <strong>código</strong> de estudiante</p>
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
              <label style={styles.label}>Código de Estudiante</label>
              <div style={styles.inputWrap}>
                <FaIdCard style={styles.inputIcon} />
                <input
                  type={showCod ? 'text' : 'password'}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  style={styles.input}
                  placeholder="EST-0000"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCod(!showCod)}
                  style={styles.eyeBtn}
                >
                  {showCod ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Verificando...' : <><FaSignInAlt /> Ingresar al Portal</>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <a href="/" style={styles.backLink}>
              Regresar a Portales
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
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: 'white',
    padding: '60px 50px',
    position: 'relative',
    overflow: 'hidden'
  },
  leftContent: { maxWidth: 420, position: 'relative', zIndex: 2 },
  logoBadgeWrap: { 
    width: 100, 
    height: 100, 
    background: 'white', 
    borderRadius: 24, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    padding: '10px'
  },
  leftTitle: { fontSize: 34, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' },
  leftSubtitle: { fontSize: 17, opacity: 0.8, marginBottom: 35, fontWeight: '500' },
  featureList: { display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 30 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)' },
  checkWrap: { width: 24, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' },
  circle: { position: 'absolute', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' },
  
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
  input: { width: '100%', height: 50, paddingLeft: 42, paddingRight: 46, border: '2px solid #e2e8f0', borderRadius: 12, fontSize: 15, color: '#0f172a', background: 'white', outline: 'none', transition: 'all 0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  eyeBtn: { position: 'absolute', right: 14, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  submitBtn: { 
    width: '100%', 
    height: 52, 
    background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
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
    boxShadow: '0 8px 20px rgba(15,23,42,0.2)',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  backLink: { color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 600 }
};

export default PortalLogin;

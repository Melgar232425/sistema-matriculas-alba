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
    <div style={styles.container}>

      {/* ── Panel izquierdo decorativo ── */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.iconWrap}>
            <FaGraduationCap size={60} color="white" />
          </div>
          <h1 style={styles.leftTitle}>Portal Estudiantil</h1>
          <p style={styles.leftSubtitle}>Academia Alba Perú</p>

          <div style={styles.featureList}>
            {[
              'Consulta tus matrículas activas',
              'Revisa el estado de tus pagos',
              'Ve tu horario de clases',
              'Accede a tu información personal',
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <FaCheckCircle style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Círculos decorativos */}
        <div style={{ ...styles.circle, width: 320, height: 320, top: -100, right: -100 }} />
        <div style={{ ...styles.circle, width: 180, height: 180, bottom: 60, left: -60 }} />
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img
              src="/logo_oficial.png"
              alt="Academia Alba"
              style={{ width: 170, height: 'auto', marginBottom: 22, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))' }}
            />
            <h2 style={styles.formTitle}>Bienvenido</h2>
            <p style={styles.formSubtitle}>
              Ingresa con tu <strong>correo</strong> y tu <strong>código de estudiante</strong>
            </p>
          </div>

          {error && (
            <div role="alert" style={styles.errorBox}>
              <span>❌</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Correo */}
            <div style={styles.formGroup}>
              <label htmlFor="portal-email" style={styles.label}>
                Correo Electrónico
              </label>
              <div style={styles.inputWrap}>
                <FaEnvelope style={styles.inputIcon} />
                <input
                  id="portal-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#4361ee'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Código */}
            <div style={styles.formGroup}>
              <label htmlFor="portal-codigo" style={styles.label}>
                Código de Estudiante
              </label>
              <div style={styles.inputWrap}>
                <FaIdCard style={styles.inputIcon} />
                <input
                  id="portal-codigo"
                  type={showCod ? 'text' : 'password'}
                  autoComplete="off"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.toUpperCase())}
                  placeholder="EST-0001"
                  required
                  style={{ ...styles.input, paddingRight: 46 }}
                  onFocus={e => e.target.style.borderColor = '#4361ee'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="button"
                  onClick={() => setShowCod(v => !v)}
                  style={styles.eyeBtn}
                  aria-label={showCod ? 'Ocultar código' : 'Mostrar código'}
                >
                  {showCod ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <span style={styles.hint}>
                📧 Lo recibiste por correo cuando la academia te registró
              </span>
            </div>

            <button
              id="portal-submit"
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading
                ? <><span style={styles.spinner} /> Verificando...</>
                : <><FaSignInAlt /> Ingresar al Portal</>
              }
            </button>

          </form>

          <p style={styles.footer}>
            ¿Eres del personal?{' '}
            <a href="/login" style={styles.footerLink}>Acceso Administrativo →</a>
          </p>
          <p style={{ ...styles.footer, marginTop: 6 }}>
            Sistema de Matrículas © 2026 Academia Alba
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Estilos ── */
const styles = {
  container: {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(145deg, #4361ee 0%, #3a0ca3 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 50px', position: 'relative', overflow: 'hidden',
  },
  leftContent: { position: 'relative', zIndex: 2, color: 'white', maxWidth: 420 },
  iconWrap: {
    width: 90, height: 90,
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  leftTitle: { fontSize: 34, fontWeight: 800, marginBottom: 6, color: 'white' },
  leftSubtitle: { fontSize: 16, opacity: 0.75, marginBottom: 32, color: 'white' },
  featureList: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 500,
  },
  exampleCard: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 16, padding: '18px 22px',
    backdropFilter: 'blur(8px)',
  },
  exampleLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7, margin: '0 0 6px 0', color: 'white' },
  exampleCode: { fontSize: 26, fontWeight: 900, letterSpacing: 4, margin: '0 0 8px 0', color: 'white' },
  exampleHint: { fontSize: 12, opacity: 0.7, margin: 0, lineHeight: 1.5, color: 'white' },
  circle: {
    position: 'absolute', background: 'rgba(255,255,255,0.06)',
    borderRadius: '50%',
  },
  rightPanel: {
    flex: 1, background: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 30px',
  },
  formCard: {
    background: 'white', borderRadius: 28, padding: '44px',
    width: '100%', maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
  },
  formTitle: { fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: '#64748b', lineHeight: 1.6 },
  errorBox: {
    background: '#fff1f2', color: '#e11d48',
    padding: '12px 16px', borderRadius: 12, marginBottom: 20,
    fontSize: 14, fontWeight: 600, border: '1px solid #ffe4e6',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  formGroup: { marginBottom: 20 },
  label: {
    display: 'block', marginBottom: 8, fontSize: 12,
    fontWeight: 700, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.3px',
  },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#94a3b8', fontSize: 15, zIndex: 1 },
  input: {
    width: '100%', height: 50, paddingLeft: 42, paddingRight: 16,
    border: '2px solid #e2e8f0', borderRadius: 12,
    fontSize: 15, color: '#0f172a', background: 'white',
    outline: 'none', transition: 'border-color 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  eyeBtn: {
    position: 'absolute', right: 12, background: 'none', border: 'none',
    color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 4,
    display: 'flex', alignItems: 'center',
  },
  hint: { display: 'block', marginTop: 7, fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  submitBtn: {
    width: '100%', height: 52,
    background: 'linear-gradient(135deg, #4361ee, #6366f1)',
    color: 'white', border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8, boxShadow: '0 8px 20px rgba(67,97,238,0.3)',
    transition: 'opacity 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  spinner: {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white', borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  footer: { textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 24, fontWeight: 500 },
  footerLink: { color: '#4361ee', textDecoration: 'none', fontWeight: 700 },
};

export default PortalLogin;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docentePortalAPI } from '../services/api';
import { FaUserTie, FaEnvelope, FaIdCard, FaSignInAlt } from 'react-icons/fa';

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
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.iconWrap}>
            <FaUserTie size={50} color="white" />
          </div>
          <h1 style={styles.leftTitle}>Portal Docente</h1>
          <p style={styles.leftSubtitle}>Registro rápido de Asistencia</p>
          <div style={styles.featureItem}>
            <span>✔️ Consulta tus cursos asignados</span>
          </div>
          <div style={styles.featureItem}>
            <span>✔️ Pasa asistencia en segundos</span>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
             <img src="/logo_oficial.png" alt="Logo" style={{ width: 120, marginBottom: 15 }} />
             <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Acceso Docente</h2>
             <p style={{ color: '#64748b', fontSize: 14 }}>Ingresa con tu correo y DNI</p>
          </div>

          {error && <div style={styles.errorBox}>❌ {error}</div>}

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
              <label style={styles.label}>DNI</label>
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
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/login" style={{ color: '#0ea5e9', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Ir a Administración</a>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  leftPanel: { flex: 1, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  leftContent: { maxWidth: 400, padding: 30 },
  iconWrap: { width: 80, height: 80, background: 'rgba(255,255,255,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  leftTitle: { fontSize: 32, fontWeight: 800, marginBottom: 5 },
  leftSubtitle: { fontSize: 16, opacity: 0.8, marginBottom: 30 },
  featureItem: { fontSize: 15, fontWeight: 600, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 },
  rightPanel: { flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  formCard: { background: 'white', padding: 40, borderRadius: 24, width: '100%', maxWidth: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' },
  errorBox: { background: '#fff1f2', color: '#e11d48', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 20 },
  formGroup: { marginBottom: 20 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#94a3b8' },
  input: { width: '100%', height: 48, paddingLeft: 40, border: '2px solid #e2e8f0', borderRadius: 12, outline: 'none', fontSize: 15 },
  submitBtn: { width: '100%', height: 50, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }
};

export default PortalDocenteLogin;

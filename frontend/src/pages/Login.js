import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUserShield, FaEnvelope, FaLock, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';
import '../styles/App.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        const result = await login(username, password);

        if (result.success) {
            const rol = result.user?.rol;
            if (rol === 'matriculador') {
                navigate('/matriculas');
            } else {
                navigate('/admin');
            }
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="responsive-split">
            {/* Panel Izquierdo: Branding Administrativo */}
            <div className="hide-mobile" style={styles.leftPanel}>
                <div style={styles.leftContent}>
                    <div style={styles.iconWrap}>
                        <FaUserShield size={50} color="white" />
                    </div>
                    <h1 style={styles.leftTitle}>Panel de Gestión</h1>
                    <p style={styles.leftSubtitle}>Control Académico Administrativo</p>
                    
                    <div style={styles.features}>
                        <div style={styles.featureItem}>
                            <FaCheckCircle style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                            <span>Gestión de Ciclos y Cursos</span>
                        </div>
                        <div style={styles.featureItem}>
                            <FaCheckCircle style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                            <span>Control de Matrículas y Pagos</span>
                        </div>
                        <div style={styles.featureItem}>
                            <FaCheckCircle style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                            <span>Reportes y Estadísticas en tiempo real</span>
                        </div>
                        <div style={styles.featureItem}>
                            <FaCheckCircle style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                            <span>Configuración de Calendario Académico</span>
                        </div>
                    </div>
                </div>

                {/* Círculos decorativos idénticos al portal estudiantil */}
                <div style={{ ...styles.circle, width: 320, height: 320, top: -100, right: -100 }} />
                <div style={{ ...styles.circle, width: 180, height: 180, bottom: 60, left: -60 }} />
            </div>

            {/* Panel Derecho: Formulario */}
            <div style={styles.rightPanel}>
                <div style={styles.formCard}>
                    <div style={{ textAlign: 'center', marginBottom: 30 }}>
                        <img 
                            src="/logo_oficial.png" 
                            alt="Academia Alba" 
                            style={{ width: 180, marginBottom: 20, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} 
                        />
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Acceso Administrativo</h2>
                        <p style={{ color: '#64748b', fontSize: 14 }}>Plataforma Universitaria Oficial</p>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <span>❌</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Usuario / Email</label>
                            <div style={styles.inputWrap}>
                                <FaEnvelope style={styles.inputIcon} />
                                <input
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ingrese su usuario o correo"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Contraseña</label>
                            <div style={styles.inputWrap}>
                                <FaLock style={styles.inputIcon} />
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading}
                            style={styles.submitBtn}
                        >
                            {loading ? 'Iniciando Sesión...' : <><FaSignInAlt /> Entrar al Sistema</>}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 30 }}>
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
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: 50,
        borderRight: '1px solid rgba(255,255,255,0.1)'
    },
    leftContent: { maxWidth: 400 },
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
    leftTitle: { fontSize: 34, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' },
    leftSubtitle: { fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 40 },
    features: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 },
    featureItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)' },
    circle: {
        position: 'absolute', background: 'rgba(255,255,255,0.06)',
        borderRadius: '50%',
    },
    rightPanel: {
        flex: 1,
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30
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
  errorBox: {
    background: '#fff1f2',
    color: '#e11d48',
    padding: '12px 16px',
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 600,
    border: '1px solid #ffe4e6',
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  formGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#94a3b8', fontSize: 15, zIndex: 1 },
  input: {
    width: '100%',
    height: 50,
    paddingLeft: 42,
    paddingRight: 16,
    border: '2px solid #e2e8f0',
    borderRadius: 12,
    fontSize: 15,
    color: '#0f172a',
    background: 'white',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
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
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        color: '#64748b',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 600,
        transition: 'color 0.2s'
    }
};

export default Login;

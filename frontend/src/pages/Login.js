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
            const rol = result.data?.usuario?.rol;
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
                        <div style={styles.featureItem}>✔️ Gestión de Ciclos y Cursos</div>
                        <div style={styles.featureItem}>✔️ Control de Matrículas y Pagos</div>
                        <div style={styles.featureItem}>✔️ Reportes y Estadísticas en tiempo real</div>
                        <div style={styles.featureItem}>✔️ Configuración de Calendario</div>
                    </div>
                </div>
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
        width: 100,
        height: 100,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.1)'
    },
    leftTitle: { fontSize: 36, fontWeight: 900, marginBottom: 10, letterSpacing: '-1px' },
    leftSubtitle: { fontSize: 18, color: '#94a3b8', marginBottom: 40 },
    features: { display: 'flex', flexDirection: 'column', gap: 15 },
    featureItem: { fontSize: 15, fontWeight: 600, color: '#cbd5e1' },
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
        padding: 50,
        borderRadius: 32,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
        border: '1px solid #f1f5f9'
    },
    errorBox: {
        background: '#fff1f2',
        color: '#e11d48',
        padding: '14px 18px',
        borderRadius: 14,
        marginBottom: 25,
        fontSize: 14,
        fontWeight: 600,
        border: '1px solid #ffe4e6',
        display: 'flex',
        alignItems: 'center',
        gap: 10
    },
    formGroup: { marginBottom: 20 },
    label: { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
    inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: 16, color: '#94a3b8' },
    input: {
        width: '100%',
        height: 54,
        paddingLeft: 46,
        paddingRight: 20,
        border: '2px solid #e2e8f0',
        borderRadius: 14,
        outline: 'none',
        fontSize: 15,
        transition: 'all 0.2s',
        fontFamily: 'inherit'
    },
    submitBtn: {
        width: '100%',
        height: 56,
        marginTop: 10,
        borderRadius: 14,
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 800
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

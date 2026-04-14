import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaSignInAlt, FaGraduationCap } from 'react-icons/fa';
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
            // Punto 10: Redirección según rol
            const rol = result.data?.usuario?.rol;
            if (rol === 'matriculador') {
                navigate('/matriculas');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                        <img 
                            src="/logo_oficial.png" 
                            alt="Academia Alba" 
                            style={{ 
                                width: '250px', 
                                height: 'auto', 
                                margin: '0 auto',
                                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' 
                            }} 
                        />
                    </div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Acceso al Sistema</h1>
                    <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Plataforma Universitaria Oficial</p>
                </div>

                {error && (
                    <div 
                        role="alert" // Punto U10
                        style={{
                        background: '#fff1f2',
                        color: '#e11d48',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '25px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid #ffe4e6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>❌</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#475569' }}>
                            Usuario
                        </label>
                        <input
                            type="text"
                            autoComplete="username" // Punto U8
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ 
                                height: '50px', 
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '0 16px',
                                fontSize: '15px',
                                width: '100%',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="Ingrese su usuario"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#475569' }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            autoComplete="current-password" // Punto U8
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ 
                                height: '50px', 
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '0 16px',
                                fontSize: '15px',
                                width: '100%',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ 
                            width: '100%', 
                            height: '52px', 
                            borderRadius: '12px',
                            justifyContent: 'center', 
                            fontSize: '16px',
                            boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : <><FaSignInAlt /> Iniciar Sesión</>}
                    </button>
                    
                    <p style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                        Sistema de Matrículas &copy; 2026 Academia Alba
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;

import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    // Punto 9: Verificar si el token sigue siendo válido con el servidor
                    const response = await authAPI.getProfile();
                    setUser(response.data.data);
                } catch (error) {
                    console.error("Sesión inválida o expirada");
                    logout(); // Si falla, limpiamos todo
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authAPI.login({ username, password });
            if (response.data.success) {
                const { token, usuario } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(usuario));
                setUser(usuario);
                return { success: true, user: usuario };
            }
            return { success: false, message: 'Fallo al iniciar sesión' };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Error de conexión al servidor'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

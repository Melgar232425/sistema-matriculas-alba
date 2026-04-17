import React, { useState, useEffect, useContext } from 'react';
import { reportesAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  FaUserGraduate,
  FaBook,
  FaClipboardList,
  FaMoneyBillWave,
  FaUserPlus
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4361ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const response = await reportesAPI.getDashboard();
      setStats(response.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="main-content">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="main-content">

      {/* Saludo y Acción Rápida */}
      <div style={{ marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '800' }}>¡Hola! 👋</h2>
          <p style={{ color: 'var(--text-muted)' }}>Esto es lo que está pasando hoy en la Academia Alba Perú.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
             {user && user.rol === 'tutor' && (
                  <button className="btn btn-primary" onClick={() => window.location.href='/tutores'} style={{ whiteSpace: 'nowrap', background: 'var(--success)' }}>
                     <FaUserGraduate /> Ver Alumnos del Ciclo
                  </button>
             )}
             {user && ['admin', 'director', 'matriculador'].includes(user.rol) && (
                  <button className="btn btn-primary" onClick={() => window.location.href='/admin/matriculas'} style={{ whiteSpace: 'nowrap' }}>
                     <FaUserPlus /> Nueva Matrícula
                  </button>
             )}
        </div>
      </div>

      {/* Tarjetas de estadísticas Premium */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><FaUserGraduate /></div>
          <div className="stat-info">
            <h3>{stats?.totalEstudiantes || 0}</h3>
            <p>Estudiantes Totales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success"><FaBook /></div>
          <div className="stat-info">
            <h3>{stats?.totalCursos || 0}</h3>
            <p>Cursos Activos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning"><FaClipboardList /></div>
          <div className="stat-info">
            <h3>{stats?.totalMatriculas || 0}</h3>
            <p>Matrículas este Mes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success"><FaMoneyBillWave /></div>
          <div className="stat-info">
            <h3>S/ {stats?.ingresosTotales || '0.00'}</h3>
            <p>Recaudación Total</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* Gráfico de Barras: Popularidad */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Tendencia de Inscripciones</h2>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={stats?.cursosPopulares || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nombre" fontSize={11} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total_matriculas" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Circular: Métodos de Pago */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Canales de Pago</h2>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats?.metodosPago || []}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {(stats?.metodosPago || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '-20px' }}>
                {(stats?.metodosPago || []).map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 'bold' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                        {entry.name}
                    </div>
                ))}
            </div>
          </div>
        </div>

      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Estado del Ciclo Académico</h2>
          <span className="badge badge-info">Año 2026</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold' }}>ESTUDIANTES</p>
                <h4 style={{ fontSize: '24px', margin: '5px 0' }}>{stats?.totalEstudiantes}</h4>
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '10px' }}>
                    <div style={{ width: '75%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                </div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold' }}>RECAUDADO</p>
                <h4 style={{ fontSize: '24px', margin: '5px 0' }}>S/ {stats?.ingresosTotales}</h4>
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '10px' }}>
                    <div style={{ width: '60%', height: '100%', background: 'var(--secondary)', borderRadius: '2px' }}></div>
                </div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold' }}>CURSOS</p>
                <h4 style={{ fontSize: '24px', margin: '5px 0' }}>{stats?.totalCursos}</h4>
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '10px' }}>
                    <div style={{ width: '90%', height: '100%', background: 'var(--warning)', borderRadius: '2px' }}></div>
                </div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold' }}>META MENSUAL</p>
                <h4 style={{ fontSize: '24px', margin: '5px 0' }}>85%</h4>
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '10px' }}>
                    <div style={{ width: '85%', height: '100%', background: '#8b5cf6', borderRadius: '2px' }}></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

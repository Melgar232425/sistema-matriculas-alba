// Página Dashboard - Inicio con estadísticas
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { reportesAPI } from '../services/api';
import {
  FaUserGraduate,
  FaBook,
  FaClipboardList,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaChartLine
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4361ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const response = await reportesAPI.getDashboard();
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar estadísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="main-content">
        <Navbar title="Dashboard" />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <Navbar title="Dashboard" />
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Navbar title="Dashboard" />

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card" style={{ transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div className="stat-icon primary">
            <FaUserGraduate />
          </div>
          <div className="stat-info">
            <h3>{stats?.totalEstudiantes || 0}</h3>
            <p>Estudiantes Activos</p>
          </div>
        </div>

        <div className="stat-card" style={{ transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div className="stat-icon success">
            <FaBook />
          </div>
          <div className="stat-info">
            <h3>{stats?.totalCursos || 0}</h3>
            <p>Cursos Disponibles</p>
          </div>
        </div>

        <div className="stat-card" style={{ transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div className="stat-icon warning">
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>{stats?.totalMatriculas || 0}</h3>
            <p>Matrículas Activas</p>
          </div>
        </div>

        <div className="stat-card" style={{ transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div className="stat-icon success">
            <FaMoneyBillWave />
          </div>
          <div className="stat-info">
            <h3>S/ {stats?.ingresosTotales || '0.00'}</h3>
            <p>Ingresos Totales</p>
          </div>
        </div>

        <div className="stat-card" style={{ transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div className="stat-icon danger">
            <FaExclamationTriangle />
          </div>
          <div className="stat-info">
            <h3>{stats?.estudiantesMorosos || 0}</h3>
            <p>Alumnos con Deuda</p>
          </div>
        </div>

        <div className="stat-card" style={{ transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div className="stat-icon primary">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>{stats?.totalMatriculas || 0}</h3>
            <p>Matrículas Totales</p>
          </div>
        </div>
      </div>

      {/* Gráficos y Actividad Reciente */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>

        {/* Gráfico de Cursos Populares */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h2 className="card-title">Cursos Más Populares</h2>
          </div>
          <div style={{ width: '100%', height: 300, padding: '10px' }}>
            <ResponsiveContainer>
              <BarChart data={stats?.cursosPopulares || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="nombre"
                  fontSize={10}
                  tick={{ fill: '#475569' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis fontSize={12} tick={{ fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total_matriculas" fill="#4361ee" radius={[4, 4, 0, 0]} name="Matrículas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Métodos de Pago */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h2 className="card-title">Métodos de Pago</h2>
          </div>
          <div style={{ width: '100%', height: 300, padding: '10px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats?.metodosPago || []}
                  cx="50%"
                  cy="55%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(stats?.metodosPago || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resumen Final simple */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Resumen del Sistema</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '15px', borderLeft: '4px solid #4361ee', background: '#f8fafc' }}>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Estudiantes Totales</p>
            <h3 style={{ fontSize: '24px', margin: 0 }}>{stats?.totalEstudiantes || 0}</h3>
          </div>
          <div style={{ padding: '15px', borderLeft: '4px solid #10b981', background: '#f8fafc' }}>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Cursos Activos</p>
            <h3 style={{ fontSize: '24px', margin: 0 }}>{stats?.totalCursos || 0}</h3>
          </div>
          <div style={{ padding: '15px', borderLeft: '4px solid #f59e0b', background: '#f8fafc' }}>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ingresos del Mes</p>
            <h3 style={{ fontSize: '24px', margin: 0 }}>S/ {stats?.ingresosMes || '0.00'}</h3>
          </div>
          <div style={{ padding: '15px', borderLeft: '4px solid #ef4444', background: '#f8fafc' }}>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Balance Total</p>
            <h3 style={{ fontSize: '24px', margin: 0, color: '#10b981' }}>S/ {stats?.ingresosTotales || '0.00'}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

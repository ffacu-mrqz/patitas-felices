'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { Users, FileText, Dog, Cat, Plus, ArrowRight, Loader2, HeartPulse } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPacientes: 0,
    totalPerros: 0,
    totalGatos: 0,
    totalAtenciones: 0,
  })
  const [ultimosPacientes, setUltimosPacientes] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Obtener pacientes
      const { data: pacientesData, error: errorPacientes } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false })

      if (errorPacientes) throw errorPacientes

      // 2. Obtener total de atenciones médicas
      const { count: atencionesCount, error: errorAtenciones } = await supabase
        .from('historial_clinico')
        .select('*', { count: 'exact', head: true })

      if (errorAtenciones) throw errorAtenciones

      const pacientes = pacientesData || []
      const perros = pacientes.filter(p => p.especie?.toLowerCase().includes('perro')).length
      const gatos = pacientes.filter(p => p.especie?.toLowerCase().includes('gato')).length

      setStats({
        totalPacientes: pacientes.length,
        totalPerros: perros,
        totalGatos: gatos,
        totalAtenciones: atencionesCount || 0,
      })

      // Guardar los últimos 5 pacientes registrados
      setUltimosPacientes(pacientes.slice(0, 5))
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-wrapper">
      <header className="page-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="subtitle">Bienvenido al sistema de gestión de Patitas Felices</p>
        </div>
      </header>

      {/* Grid de Métricas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Pacientes</span>
            <span className="stat-value">{loading ? '...' : stats.totalPacientes}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Dog size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Perros Registrados</span>
            <span className="stat-value">{loading ? '...' : stats.totalPerros}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Cat size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Gatos Registrados</span>
            <span className="stat-value">{loading ? '...' : stats.totalGatos}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <HeartPulse size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Atenciones Médicas</span>
            <span className="stat-value">{loading ? '...' : stats.totalAtenciones}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Sección de Accesos Rápidos */}
        <section className="quick-actions">
          <h2>Acciones Rápidas</h2>
          <div className="actions-grid">
            <Link href="/dashboard/pacientes" className="action-card">
              <div className="action-icon">
                <Plus size={20} />
              </div>
              <div className="action-text">
                <h3>Nuevo Paciente</h3>
                <p>Registra una nueva mascota y su tutor</p>
              </div>
              <ArrowRight size={18} className="arrow" />
            </Link>

            <Link href="/dashboard/historial" className="action-card">
              <div className="action-icon">
                <FileText size={20} />
              </div>
              <div className="action-text">
                <h3>Nueva Consulta</h3>
                <p>Carga un diagnóstico e historial clínico</p>
              </div>
              <ArrowRight size={18} className="arrow" />
            </Link>
          </div>
        </section>

        {/* Últimos Pacientes Registrados */}
        <section className="recent-section">
          <div className="section-header">
            <h2>Pacientes Recientes</h2>
            <Link href="/dashboard/pacientes" className="see-all">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-state">
                <Loader2 size={24} className="spinner" />
                <span>Cargando pacientes...</span>
              </div>
            ) : ultimosPacientes.length === 0 ? (
              <div className="empty-state">No hay pacientes registrados aún.</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Especie</th>
                    <th>Raza</th>
                    <th>Tutor</th>
                    <th>Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPacientes.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold">{p.nombre}</td>
                      <td>
                        <span className={`badge ${p.especie?.toLowerCase().includes('perro') ? 'dog' : 'cat'}`}>
                          {p.especie}
                        </span>
                      </td>
                      <td>{p.raza || '-'}</td>
                      <td>{p.tutor}</td>
                      <td>{p.telefono || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: #f8fafc;
          margin: 0;
        }

        .subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.green { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .stat-icon-wrapper.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .stat-icon-wrapper.purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
        .stat-icon-wrapper.orange { background: rgba(249, 115, 22, 0.15); color: #fb923c; }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #f8fafc;
        }

        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        h2 {
          font-size: 18px;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 12px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        :global(.action-card) {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        :global(.action-card:hover) {
          border-color: rgba(16, 185, 129, 0.4);
          transform: translateY(-2px);
          background: rgba(30, 41, 59, 0.6);
        }

        .action-icon {
          width: 42px;
          height: 42px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-text h3 {
          font-size: 15px;
          font-weight: 600;
          color: #f8fafc;
          margin: 0;
        }

        .action-text p {
          font-size: 12px;
          color: #94a3b8;
          margin: 2px 0 0 0;
        }

        :global(.arrow) {
          margin-left: auto;
          color: #64748b;
          transition: transform 0.2s;
        }

        :global(.action-card:hover .arrow) {
          color: #34d399;
          transform: translateX(4px);
        }

        .recent-section {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2 {
          margin: 0;
        }

        :global(.see-all) {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #34d399;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        :global(.see-all:hover) {
          text-decoration: underline;
        }

        .table-container {
          overflow-x: auto;
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .custom-table th {
          padding: 12px 14px;
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .custom-table td {
          padding: 14px;
          font-size: 14px;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .font-semibold {
          font-weight: 600;
          color: #f8fafc !important;
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.dog { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .badge.cat { background: rgba(168, 85, 247, 0.15); color: #c084fc; }

        .loading-state, .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 30px;
          color: #94a3b8;
          font-size: 14px;
        }

        :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
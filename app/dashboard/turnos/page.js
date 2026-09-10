'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Dog,
  FileText,
  Stethoscope,
  Edit
} from 'lucide-react'

export default function TurnosPage() {
  const supabase = createClient()

  const [turnos, setTurnos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTurno, setEditingTurno] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Campos del formulario
  const [pacienteId, setPacienteId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [service, setService] = useState('Consulta General')
  const [motivo, setMotivo] = useState('')
  const [estado, setEstado] = useState('Pendiente')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Cargamos pacientes para el selector del modal
      const { data: pacientesData, error: errorPacientes } = await supabase
        .from('pacientes')
        .select('*')
        .order('nombre', { ascending: true })

      if (errorPacientes) throw errorPacientes
      setPacientes(pacientesData || [])

      // Relación explícita paciente_id
      const { data: turnosData, error: errorTurnos } = await supabase
        .from('turnos')
        .select('*, pacientes!paciente_id(*)')
        .order('date', { ascending: true })

      if (errorTurnos) throw errorTurnos
      setTurnos(turnosData || [])
    } catch (error) {
      console.error('Error al cargar agenda de turnos:', error.message || error)
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear
  const handleOpenCreateModal = () => {
    setEditingTurno(null)
    setPacienteId('')
    setFecha('')
    setHora('')
    setService('Consulta General')
    setMotivo('')
    setEstado('Pendiente')
    setShowModal(true)
  }

  // Abrir modal para editar
  const handleOpenEditModal = (turno) => {
    setEditingTurno(turno)
    setPacienteId(turno.paciente_id || '')
    setFecha(turno.date || turno.fecha || '')
    setHora(turno.time || turno.hora || '')
    setService(turno.service || 'Consulta General')
    setMotivo(turno.motivo || '')
    setEstado(turno.estado || 'Pendiente')
    setShowModal(true)
  }

  // Manejar guardado (Crear o Editar)
  const handleSaveTurno = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const turnoPayload = {
        paciente_id: pacienteId,
        date: fecha,    // Mapeado a la columna de la BD 'date'
        fecha: fecha,   // Mantenido por compatibilidad
        time: hora,     // Campo obligatorio de la BD 'time' (NOT NULL)
        hora: hora,     // Mantenido por compatibilidad
        service,
        motivo: motivo.trim() || null,
        estado
      }

      if (editingTurno) {
        // MODO EDICIÓN
        const { data, error } = await supabase
          .from('turnos')
          .update(turnoPayload)
          .eq('id', editingTurno.id)
          .select('*, pacientes!paciente_id(*)')

        if (error) throw error

        if (data && data.length > 0) {
          const updated = data[0]
          setTurnos((prev) =>
            prev.map((t) => (t.id === editingTurno.id ? updated : t))
          )
        }
      } else {
        // MODO CREACIÓN
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData?.user) {
          throw new Error('No se pudo identificar al usuario actual para asignar como owner.')
        }

        turnoPayload.owner = authData.user.id

        const { data, error } = await supabase
          .from('turnos')
          .insert([turnoPayload])
          .select('*, pacientes!paciente_id(*)')

        if (error) throw error

        if (data && data.length > 0) {
          setTurnos((prev) => [...prev, data[0]])
        }
      }

      // Cerrar modal y resetear campos
      setShowModal(false)
      setEditingTurno(null)
    } catch (error) {
      console.error('Error al guardar turno:', error.message || error)
      alert(`Error al guardar el turno: ${error.message || 'Error inesperado'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('turnos')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error

      setTurnos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t))
      )
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert('No se pudo actualizar el estado del turno.')
    }
  }

  const handleDeleteTurno = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este turno?')) return

    try {
      const { error } = await supabase.from('turnos').delete().eq('id', id)
      if (error) throw error

      setTurnos((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Error al eliminar turno:', error)
      alert('Error al eliminar el turno.')
    }
  }

  const filteredTurnos = turnos.filter((t) => {
    const term = searchTerm.toLowerCase()
    const nombreMascota = t.pacientes?.nombre?.toLowerCase() || ''
    const tutor = t.pacientes?.tutor?.toLowerCase() || ''
    const motivoText = t.motivo?.toLowerCase() || ''
    const serviceText = t.service?.toLowerCase() || ''
    return (
      nombreMascota.includes(term) ||
      tutor.includes(term) ||
      motivoText.includes(term) ||
      serviceText.includes(term)
    )
  })

  return (
    <div className="turnos-wrapper">
      <header className="page-header">
        <div>
          <h1>Agenda de Turnos</h1>
          <p className="subtitle">Gestión de citas médicas y atención clínica</p>
        </div>
        <button className="primary-btn" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Agendar Turno</span>
        </button>
      </header>

      {/* Buscador */}
      <div className="search-bar-container">
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Buscar por paciente, tutor, servicio o motivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => setSearchTerm('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabla de Turnos */}
      <div className="table-card">
        {loading ? (
          <div className="state-box">
            <Loader2 size={28} className="spinner" />
            <span>Cargando agenda de turnos...</span>
          </div>
        ) : filteredTurnos.length === 0 ? (
          <div className="state-box">
            <span>{searchTerm ? 'No se encontraron turnos con ese criterio.' : 'No hay turnos agendados.'}</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Paciente</th>
                  <th>Tutor</th>
                  <th>Servicio</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTurnos.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="date-time-cell">
                        <span><CalendarIcon size={14} /> {t.date || t.fecha}</span>
                        <span className="time-badge"><Clock size={12} /> {t.time || t.hora}</span>
                      </div>
                    </td>
                    <td className="font-semibold">
                      <div className="paciente-cell">
                        <Dog size={16} color="#60a5fa" />
                        {t.pacientes?.nombre || 'Paciente no asignado'}
                      </div>
                    </td>
                    <td>{t.pacientes?.tutor || '-'}</td>
                    <td>
                      <span className="service-tag">
                        <Stethoscope size={12} />
                        {t.service || 'General'}
                      </span>
                    </td>
                    <td>{t.motivo || 'Sin detalles'}</td>
                    <td>
                      <span className={`badge ${t.estado?.toLowerCase()}`}>
                        {t.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          title="Editar turno"
                          onClick={() => handleOpenEditModal(t)}
                        >
                          <Edit size={16} />
                        </button>
                        {t.estado !== 'Completado' && (
                          <button
                            className="action-btn complete-btn"
                            title="Marcar como completado"
                            onClick={() => handleUpdateEstado(t.id, 'Completado')}
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {t.estado !== 'Cancelado' && (
                          <button
                            className="action-btn cancel-btn"
                            title="Cancelar turno"
                            onClick={() => handleUpdateEstado(t.id, 'Cancelado')}
                          >
                            <AlertCircle size={16} />
                          </button>
                        )}
                        <button
                          className="action-btn delete-btn"
                          title="Eliminar turno"
                          onClick={() => handleDeleteTurno(t.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo / Editar Turno */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTurno ? 'Modificar Turno' : 'Agendar Nuevo Turno'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTurno} className="modal-form">
              <div className="form-group">
                <label>Seleccionar Paciente *</label>
                <select
                  required
                  className="select-input"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                >
                  <option value="">-- Selecciona un paciente --</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Tutor: {p.tutor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label>Fecha *</label>
                  <div className="input-wrapper">
                    <CalendarIcon size={16} color="#94a3b8" />
                    <input
                      type="date"
                      required
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Hora *</label>
                  <div className="input-wrapper">
                    <Clock size={16} color="#94a3b8" />
                    <input
                      type="time"
                      required
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Servicio / Especialidad *</label>
                <select
                  required
                  className="select-input"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="Consulta General">Consulta General</option>
                  <option value="Vacunación">Vacunación</option>
                  <option value="Desparasitación">Desparasitación</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Control Post-Operatorio">Control Post-Operatorio</option>
                  <option value="Peluquería / Estética">Peluquería / Estética</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Motivo u Observación</label>
                <div className="input-wrapper">
                  <FileText size={16} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Ej: Refuerzo quíntuple, corte de uñas..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Estado</label>
                <select
                  className="select-input"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Completado">Completado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="spinner" /> : (editingTurno ? 'Actualizar Turno' : 'Guardar Turno')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .turnos-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .search-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px 16px;
        }

        .search-bar-container input {
          width: 100%;
          background: none;
          border: none;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .table-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 10px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .custom-table th {
          padding: 14px;
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

        .date-time-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .time-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .paciente-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .service-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.pendiente { background: rgba(234, 179, 8, 0.15); color: #facc15; }
        .badge.confirmado { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .badge.completado { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .badge.cancelado { background: rgba(239, 68, 68, 0.15); color: #f87171; }

        .actions-cell {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
        }

        .edit-btn:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .complete-btn {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
        }

        .complete-btn:hover {
          background: rgba(16, 185, 129, 0.2);
        }

        .cancel-btn {
          background: rgba(234, 179, 8, 0.1);
          color: #facc15;
        }

        .cancel-btn:hover {
          background: rgba(234, 179, 8, 0.2);
        }

        .delete-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .state-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: #94a3b8;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 20px;
        }

        .modal-content {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          font-size: 20px;
          color: #f8fafc;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
        }

        .close-btn:hover {
          color: #f8fafc;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .input-wrapper input {
          background: none;
          border: none;
          color: #f8fafc;
          width: 100%;
          outline: none;
          font-size: 14px;
        }

        .select-input {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: #f8fafc;
          outline: none;
          font-size: 14px;
          width: 100%;
        }

        .select-input option {
          background: #0f172a;
          color: #f8fafc;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
        }

        .submit-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
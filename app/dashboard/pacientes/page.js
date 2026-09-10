'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { uploadImage } from '../../../lib/supabase/storage'
import {
  Search,
  Plus,
  Trash2,
  Dog,
  Cat,
  Loader2,
  X,
  User,
  Phone,
  Tag,
  Calendar,
  Heart,
  FileText,
  Stethoscope,
  Weight,
  Thermometer,
  ClipboardList,
  Printer,
  Pill,
  Camera
} from 'lucide-react'

export default function PacientesPage() {
  const supabase = createClient()

  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modales
  const [showModal, setShowModal] = useState(false)
  const [showHistorialModal, setShowHistorialModal] = useState(false)
  const [showRecetaModal, setShowRecetaModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Paciente Seleccionado para Ver Ficha
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [historiales, setHistoriales] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  // Estado Formulario Nuevo Paciente
  const [nombre, setNombre] = useState('')
  const [especie, setEspecie] = useState('Perro')
  const [raza, setRaza] = useState('')
  const [edad, setEdad] = useState('')
  const [tutor, setTutor] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)

  // Estado Formulario Nueva Consulta
  const [motivo, setMotivo] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [peso, setPeso] = useState('')
  const [temperatura, setTemperatura] = useState('')
  const [notas, setNotas] = useState('')
  const [submittingConsulta, setSubmittingConsulta] = useState(false)

  // Estado Formulario Dinámico de Receta
  const [prescripciones, setPrescripciones] = useState([
    { medicamento: '', dosis: '', frecuencia: '', duracion: '' }
  ])
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('')

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false })

      if (error) throw error
      setPacientes(data || [])
    } catch (error) {
      console.error('Error al cargar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPacientes()
  }, [fetchPacientes])

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFotoFile(file)
      setFotoPreview(URL.createObjectURL(file))
    }
  }

  const uploadFotoMascota = async (file) => {
    if (!file) return null
    return uploadImage(file, { bucket: 'mascotas', folder: 'pacientes' })
  }

  const handleCreatePaciente = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let fotoUrl = null
      if (fotoFile) {
        fotoUrl = await uploadFotoMascota(fotoFile)
      }

      const { data, error } = await supabase
        .from('pacientes')
        .insert([
          {
            nombre: nombre.trim(),
            especie,
            raza: raza.trim() || null,
            edad: edad !== '' ? parseInt(edad, 10) : null,
            tutor: tutor.trim(),
            telefono: telefono.trim() || null,
            foto_url: fotoUrl
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setPacientes((prev) => [data[0], ...prev])
      }

      resetPacienteForm()
      setShowModal(false)
    } catch (err) {
      console.error('Error al guardar paciente:', err)
      alert(`Error al guardar: ${err.message || 'Error inesperado'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const resetPacienteForm = () => {
    setNombre('')
    setEspecie('Perro')
    setRaza('')
    setEdad('')
    setTutor('')
    setTelefono('')
    setFotoFile(null)
    setFotoPreview(null)
  }

  const handleDeletePaciente = async (id, nombreMascota) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${nombreMascota}?`)) return

    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', id)
      if (error) throw error

      setPacientes((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Error al eliminar paciente:', error)
      alert('Error al borrar el paciente. Verifica si tiene fichas asociadas.')
    }
  }

  // --- HISTORIAL CLÍNICO ---
  const handleOpenHistorial = async (paciente) => {
    setSelectedPaciente(paciente)
    setShowHistorialModal(true)
    setLoadingHistorial(true)

    try {
      const { data, error } = await supabase
        .from('historial_clinico')
        .select('*')
        .eq('paciente_id', paciente.id)
        .order('fecha', { ascending: false })

      if (error) throw error
      setHistoriales(data || [])
    } catch (err) {
      console.error('Error al cargar historial:', err)
    } finally {
      setLoadingHistorial(false)
    }
  }

  const handleCreateConsulta = async (e) => {
    e.preventDefault()
    if (!selectedPaciente) return
    setSubmittingConsulta(true)

    try {
      const { data, error } = await supabase
        .from('historial_clinico')
        .insert([
          {
            paciente_id: selectedPaciente.id,
            motivo: motivo.trim(),
            diagnostico: diagnostico.trim() || null,
            tratamiento: tratamiento.trim() || null,
            peso: peso !== '' ? parseFloat(peso) : null,
            temperatura: temperatura !== '' ? parseFloat(temperatura) : null,
            notas: notas.trim() || null,
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setHistoriales((prev) => [data[0], ...prev])
      }

      setMotivo('')
      setDiagnostico('')
      setTratamiento('')
      setPeso('')
      setTemperatura('')
      setNotas('')
    } catch (err) {
      console.error('Error al guardar consulta:', err)
      alert(`Error inesperado: ${err.message || 'Ocurrió un problema'}`)
    } finally {
      setSubmittingConsulta(false)
    }
  }

  // --- PRESCRIPCIÓN Y RECETA DINÁMICA ---
  const handleAddItemReceta = () => {
    setPrescripciones([
      ...prescripciones,
      { medicamento: '', dosis: '', frecuencia: '', duracion: '' }
    ])
  }

  const handleRemoveItemReceta = (index) => {
    setPrescripciones(prescripciones.filter((_, i) => i !== index))
  }

  const handlePrescripcionChange = (index, field, value) => {
    const updated = [...prescripciones]
    updated[index][field] = value
    setPrescripciones(updated)
  }

  const handlePrintReceta = () => {
    window.print()
  }

  const filteredPacientes = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase()
    return (
      p.nombre?.toLowerCase().includes(term) ||
      p.tutor?.toLowerCase().includes(term) ||
      p.especie?.toLowerCase().includes(term) ||
      p.raza?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="pacientes-wrapper">
      <header className="page-header no-print">
        <div>
          <h1>Gestión de Pacientes</h1>
          <p className="subtitle">Administra los registros médicos y tutores de las mascotas</p>
        </div>
        <button className="primary-btn" onClick={() => { resetPacienteForm(); setShowModal(true); }}>
          <Plus size={18} />
          <span>Nuevo Paciente</span>
        </button>
      </header>

      {/* Búsqueda */}
      <div className="search-bar-container no-print">
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Buscar por mascota, tutor, especie o raza..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => setSearchTerm('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabla de Pacientes */}
      <div className="table-card no-print">
        {loading ? (
          <div className="state-box">
            <Loader2 size={28} className="spinner" />
            <span>Cargando lista de pacientes...</span>
          </div>
        ) : filteredPacientes.length === 0 ? (
          <div className="state-box">
            <span>{searchTerm ? 'No se encontraron resultados.' : 'No hay pacientes registrados aún.'}</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Especie</th>
                  <th>Raza</th>
                  <th>Edad</th>
                  <th>Tutor</th>
                  <th>Teléfono</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPacientes.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="patient-cell">
                        {p.foto_url ? (
                          <img src={p.foto_url} alt={p.nombre} className="patient-avatar" />
                        ) : (
                          <div className="patient-avatar-placeholder">
                            {p.especie?.toLowerCase().includes('perro') ? <Dog size={16} /> : <Cat size={16} />}
                          </div>
                        )}
                        <span className="font-semibold">{p.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.especie?.toLowerCase().includes('perro') ? 'dog' : p.especie?.toLowerCase().includes('gato') ? 'cat' : 'other'}`}>
                        {p.especie?.toLowerCase().includes('perro') ? (
                          <Dog size={12} />
                        ) : p.especie?.toLowerCase().includes('gato') ? (
                          <Cat size={12} />
                        ) : (
                          <Heart size={12} />
                        )}
                        {p.especie}
                      </span>
                    </td>
                    <td>{p.raza || '-'}</td>
                    <td>{p.edad !== null && p.edad !== undefined ? `${p.edad} año(s)` : '-'}</td>
                    <td>{p.tutor}</td>
                    <td>{p.telefono || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button
                          className="action-btn history-btn"
                          title="Ver Ficha Clínica / Historial"
                          onClick={() => handleOpenHistorial(p)}
                        >
                          <FileText size={16} />
                          <span>Ficha</span>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Eliminar paciente"
                          onClick={() => handleDeletePaciente(p.id, p.nombre)}
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

      {/* Modal Nuevo Paciente */}
      {showModal && (
        <div className="modal-overlay no-print" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nuevo Paciente</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePaciente} className="modal-form">
              <div className="photo-upload-wrapper">
                <label className="photo-upload-container">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Previsualización" className="photo-preview" />
                  ) : (
                    <div className="photo-placeholder">
                      <Camera size={24} color="#94a3b8" />
                      <span>Subir Foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFotoChange} hidden />
                </label>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre de la Mascota *</label>
                  <div className="input-wrapper">
                    <Heart size={16} color="#94a3b8" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Firulais"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Especie *</label>
                  <select className="select-input" value={especie} onChange={(e) => setEspecie(e.target.value)}>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Raza</label>
                  <div className="input-wrapper">
                    <Tag size={16} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Ej: Labrador"
                      value={raza}
                      onChange={(e) => setRaza(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Edad (Años)</label>
                  <div className="input-wrapper">
                    <Calendar size={16} color="#94a3b8" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej: 3"
                      value={edad}
                      onChange={(e) => setEdad(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nombre del Tutor *</label>
                  <div className="input-wrapper">
                    <User size={16} color="#94a3b8" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={tutor}
                      onChange={(e) => setTutor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <div className="input-wrapper">
                    <Phone size={16} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Ej: 3548-123456"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="spinner" /> : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial y Consultas */}
      {showHistorialModal && selectedPaciente && (
        <div className="modal-overlay no-print" onClick={() => setShowHistorialModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-patient-info">
                {selectedPaciente.foto_url ? (
                  <img src={selectedPaciente.foto_url} alt={selectedPaciente.nombre} className="modal-patient-avatar" />
                ) : (
                  <div className="modal-patient-placeholder">
                    {selectedPaciente.especie?.toLowerCase().includes('perro') ? <Dog size={20} /> : <Cat size={20} />}
                  </div>
                )}
                <div>
                  <h2>Ficha Clínica: {selectedPaciente.nombre}</h2>
                  <p className="modal-subtitle">
                    {selectedPaciente.especie} {selectedPaciente.raza ? `• ${selectedPaciente.raza}` : ''} | Tutor: {selectedPaciente.tutor}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="primary-btn receta-btn"
                  onClick={() => setShowRecetaModal(true)}
                >
                  <Pill size={16} />
                  <span>Generar Receta</span>
                </button>
                <button className="close-btn" onClick={() => setShowHistorialModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="historial-body">
              <div className="consulta-form-card">
                <h3><Stethoscope size={18} /> Registrar Nueva Consulta</h3>
                <form onSubmit={handleCreateConsulta}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Motivo de Consulta *</label>
                    <input
                      type="text"
                      required
                      className="text-input"
                      placeholder="Ej: Control de rutina, Decaimiento..."
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Diagnóstico</label>
                      <input
                        type="text"
                        className="text-input"
                        placeholder="Ej: Gastroenteritis leve"
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tratamiento / Indicaciones</label>
                      <input
                        type="text"
                        className="text-input"
                        placeholder="Ej: Amoxicilina 250mg c/12hs"
                        value={tratamiento}
                        onChange={(e) => setTratamiento(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ marginTop: '12px' }}>
                    <div className="form-group">
                      <label>Peso (kg)</label>
                      <div className="input-wrapper">
                        <Weight size={16} color="#94a3b8" />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ej: 12.5"
                          value={peso}
                          onChange={(e) => setPeso(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Temperatura (°C)</label>
                      <div className="input-wrapper">
                        <Thermometer size={16} color="#94a3b8" />
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ej: 38.5"
                          value={temperatura}
                          onChange={(e) => setTemperatura(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label>Notas Adicionales</label>
                    <textarea
                      rows="2"
                      className="textarea-input"
                      placeholder="Observaciones adicionales..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="submit-btn" style={{ marginTop: '14px', width: '100%' }} disabled={submittingConsulta}>
                    {submittingConsulta ? <Loader2 size={18} className="spinner" /> : 'Guardar Consulta'}
                  </button>
                </form>
              </div>

              <div className="consultas-list-card">
                <h3><ClipboardList size={18} /> Historial de Atenciones</h3>
                {loadingHistorial ? (
                  <div className="state-box">
                    <Loader2 size={24} className="spinner" />
                    <span>Cargando historial...</span>
                  </div>
                ) : historiales.length === 0 ? (
                  <div className="state-box">
                    <span>No hay registros de consultas.</span>
                  </div>
                ) : (
                  <div className="consultas-timeline">
                    {historiales.map((item) => (
                      <div key={item.id} className="timeline-item">
                        <div className="timeline-header">
                          <span className="timeline-date">
                            {new Date(item.fecha).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="timeline-motivo">{item.motivo}</span>
                        </div>

                        <div className="timeline-content">
                          {item.diagnostico && <p><strong>Diagnóstico:</strong> {item.diagnostico}</p>}
                          {item.tratamiento && <p><strong>Tratamiento:</strong> {item.tratamiento}</p>}
                          <div className="timeline-vitals">
                            {item.peso && <span><Weight size={14} /> {item.peso} kg</span>}
                            {item.temperatura && <span><Thermometer size={14} /> {item.temperatura} °C</span>}
                          </div>
                          {item.notas && <p className="timeline-notas">{item.notas}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECETA */}
      {showRecetaModal && selectedPaciente && (
        <div className="modal-overlay" onClick={() => setShowRecetaModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <h2>Generar Receta / Indicaciones Médicas</h2>
              <button className="close-btn" onClick={() => setShowRecetaModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="receta-form-container no-print">
              <h3>Medicamentos / Tratamiento</h3>
              {prescripciones.map((p, idx) => (
                <div key={idx} className="prescripcion-row">
                  <input
                    type="text"
                    placeholder="Medicamento / Droga"
                    className="text-input"
                    value={p.medicamento}
                    onChange={(e) => handlePrescripcionChange(idx, 'medicamento', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Dosis (ej: 1 comp / 2.5 ml)"
                    className="text-input"
                    value={p.dosis}
                    onChange={(e) => handlePrescripcionChange(idx, 'dosis', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Frecuencia (ej: c/12 hs)"
                    className="text-input"
                    value={p.frecuencia}
                    onChange={(e) => handlePrescripcionChange(idx, 'frecuencia', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duración (ej: 7 días)"
                    className="text-input"
                    value={p.duracion}
                    onChange={(e) => handlePrescripcionChange(idx, 'duracion', e.target.value)}
                  />
                  {prescripciones.length > 1 && (
                    <button
                      type="button"
                      className="delete-btn action-btn"
                      onClick={() => handleRemoveItemReceta(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="add-row-btn" onClick={handleAddItemReceta}>
                <Plus size={16} /> Añadir Medicamento
              </button>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Indicaciones Generales / Recomendaciones</label>
                <textarea
                  rows="3"
                  className="textarea-input"
                  placeholder="Ej: Dieta blanda por 48 hs, abundante agua fresca..."
                  value={indicacionesGenerales}
                  onChange={(e) => setIndicacionesGenerales(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button className="primary-btn" onClick={handlePrintReceta}>
                  <Printer size={18} />
                  <span>Imprimir / Exportar a PDF</span>
                </button>
              </div>
            </div>

            {/* HOJA IMPRESA */}
            <div className="official-prescription-sheet">
              <header className="sheet-header">
                <div>
                  <h1 className="clinic-title">CENTRO VETERINARIO</h1>
                  <p className="clinic-sub">Atención Clínica y Cirugía Especializada</p>
                </div>
                <div className="clinic-contact">
                  <p>Fecha: {new Date().toLocaleDateString('es-AR')}</p>
                  <p>Tel: (3548) 123-456</p>
                </div>
              </header>

              <hr className="divider" />

              <section className="patient-info-block">
                <div><strong>Paciente:</strong> {selectedPaciente.nombre}</div>
                <div><strong>Especie/Raza:</strong> {selectedPaciente.especie} {selectedPaciente.raza ? `(${selectedPaciente.raza})` : ''}</div>
                <div><strong>Tutor:</strong> {selectedPaciente.tutor}</div>
                <div><strong>Edad:</strong> {selectedPaciente.edad !== null && selectedPaciente.edad !== undefined ? `${selectedPaciente.edad} años` : 'N/A'}</div>
              </section>

              <hr className="divider" />

              <section className="prescription-body">
                <h2>PRESCRIPCIÓN MÉDICA</h2>
                <table className="prescription-table">
                  <thead>
                    <tr>
                      <th>Medicamento / Indicación</th>
                      <th>Dosis</th>
                      <th>Frecuencia</th>
                      <th>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescripciones.map((p, idx) => (
                      <tr key={idx}>
                        <td>{p.medicamento || '-'}</td>
                        <td>{p.dosis || '-'}</td>
                        <td>{p.frecuencia || '-'}</td>
                        <td>{p.duracion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {indicacionesGenerales && (
                  <div className="general-notes">
                    <h3>Indicaciones Adicionales:</h3>
                    <p>{indicacionesGenerales}</p>
                  </div>
                )}
              </section>

              <footer className="sheet-footer">
                <div className="signature-box">
                  <div className="line"></div>
                  <p>Firma y Sello del Veterinario</p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pacientes-wrapper {
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

        .receta-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .primary-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .search-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 10px 16px;
        }

        .search-bar-container input {
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          width: 100%;
          font-size: 14px;
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .table-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          overflow: hidden;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
          color: #cbd5e1;
        }

        .custom-table th {
          background: #0f172a;
          padding: 14px 16px;
          font-weight: 600;
          color: #94a3b8;
          border-bottom: 1px solid #334155;
        }

        .custom-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #334155;
        }

        .patient-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .patient-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .patient-avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.dog {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }

        .badge.cat {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
        }

        .badge.other {
          background: rgba(234, 179, 8, 0.15);
          color: #facc15;
        }

        .actions-cell {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .history-btn {
          background: #334155;
          color: #f8fafc;
        }

        .history-btn:hover {
          background: #475569;
        }

        .delete-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.2);
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          width: 100%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .modal-content.large-modal {
          max-width: 800px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #334155;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .modal-form {
          padding: 20px;
        }

        .photo-upload-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .photo-upload-container {
          cursor: pointer;
        }

        .photo-preview {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #10b981;
        }

        .photo-placeholder {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 2px dashed #475569;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #94a3b8;
          font-size: 11px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
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
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 8px 12px;
        }

        .input-wrapper input {
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          width: 100%;
          font-size: 14px;
        }

        .select-input, .text-input, .textarea-input {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 8px 12px;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
          width: 100%;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn {
          background: transparent;
          border: 1px solid #334155;
          color: #cbd5e1;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }

        .submit-btn {
          background: #10b981;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-patient-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-patient-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
        }

        .modal-patient-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        .modal-subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .historial-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .consulta-form-card, .consultas-list-card {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
        }

        .consulta-form-card h3, .consultas-list-card h3 {
          font-size: 15px;
          color: #f8fafc;
          margin-top: 0;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .consultas-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-item {
          background: #1e293b;
          border-left: 3px solid #10b981;
          border-radius: 0 8px 8px 0;
          padding: 12px;
        }

        .timeline-header {
          display: flex;
          gap: 12px;
          margin-bottom: 6px;
        }

        .timeline-date {
          font-size: 12px;
          color: #10b981;
          font-weight: 600;
        }

        .timeline-motivo {
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
        }

        .timeline-content p {
          margin: 4px 0;
          font-size: 13px;
          color: #cbd5e1;
        }

        .timeline-vitals {
          display: flex;
          gap: 16px;
          margin-top: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .timeline-vitals span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .timeline-notas {
          font-style: italic;
          color: #94a3b8 !important;
        }

        /* Prescripciones / Recetas */
        .receta-form-container {
          padding: 20px;
        }

        .prescripcion-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 8px;
          margin-bottom: 8px;
        }

        .add-row-btn {
          background: transparent;
          border: 1px dashed #334155;
          color: #60a5fa;
          width: 100%;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          margin-top: 8px;
        }

        /* HOJA IMPRESA - ESTILOS PREDETERMINADOS Y PRINT */
        .official-prescription-sheet {
          display: none;
          background: white;
          color: black;
          padding: 40px;
          font-family: Arial, sans-serif;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .no-print {
            display: none !important;
          }

          .modal-overlay {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            padding: 0;
          }

          .modal-content {
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            max-width: 100% !important;
          }

          .official-prescription-sheet {
            display: block !important;
            visibility: visible;
          }

          .official-prescription-sheet * {
            visibility: visible;
          }

          .sheet-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .clinic-title {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            color: #000;
          }

          .clinic-sub {
            font-size: 12px;
            color: #555;
            margin: 2px 0 0 0;
          }

          .clinic-contact p {
            margin: 2px 0;
            font-size: 12px;
            text-align: right;
          }

          .divider {
            border: none;
            border-top: 1px solid #ccc;
            margin: 15px 0;
          }

          .patient-info-block {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            font-size: 13px;
          }

          .prescription-body h2 {
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            letter-spacing: 1px;
          }

          .prescription-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .prescription-table th, .prescription-table td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 12px;
            text-align: left;
          }

          .prescription-table th {
            background-color: #f2f2f2;
          }

          .general-notes {
            margin-top: 20px;
            font-size: 12px;
          }

          .general-notes h3 {
            font-size: 13px;
            margin-bottom: 4px;
          }

          .sheet-footer {
            margin-top: 80px;
            display: flex;
            justify-content: flex-end;
          }

          .signature-box {
            text-align: center;
            width: 200px;
          }

          .signature-box .line {
            border-top: 1px solid #000;
            margin-bottom: 4px;
          }

          .signature-box p {
            font-size: 11px;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
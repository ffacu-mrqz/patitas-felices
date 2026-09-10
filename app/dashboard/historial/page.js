'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '../../../lib/supabase/client'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  FileText,
  Plus,
  Search,
  PawPrint,
  User,
  Calendar,
  Stethoscope,
  Syringe,
  Weight,
  X,
  CheckCircle2,
  Download,
  Loader2,
  Pencil,
  Trash2
} from 'lucide-react'

const INITIAL_FORM_STATE = {
  pet: '',
  owner: '',
  weight: '',
  diagnosis: '',
  treatment: '',
  vaccine: 'N/A',
  vet: 'Dr. López'
}

export default function HistorialPage() {
  const supabase = useMemo(() => createClient(), [])

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exportingId, setExportingId] = useState(null)
  const [mounted, setMounted] = useState(false)

  const [records, setRecords] = useState([])
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)

  useEffect(() => {
    setMounted(true)
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('historial_clinico')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al cargar historiales:', error.message)
    } else if (data) {
      setRecords(data)
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormData(INITIAL_FORM_STATE)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (record) => {
    setEditingId(record.id)
    setFormData({
      pet: record.pet || '',
      owner: record.owner || '',
      weight: record.weight || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      vaccine: record.vaccine || 'N/A',
      vet: record.vet || 'Dr. López'
    })
    setIsModalOpen(true)
  }

  const handleSaveRecord = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingId) {
        const { error } = await supabase
          .from('historial_clinico')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('historial_clinico')
          .insert([formData])

        if (error) throw error
      }

      setIsModalOpen(false)
      setEditingId(null)
      setFormData(INITIAL_FORM_STATE)
      await fetchRecords()
    } catch (error) {
      alert(`Error al guardar la consulta: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecord = async (id, petName) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la consulta de "${petName}"?`
    )
    if (!confirmDelete) return

    const { error } = await supabase
      .from('historial_clinico')
      .delete()
      .eq('id', id)

    if (!error) {
      setRecords((prev) => prev.filter((item) => item.id !== id))
    } else {
      alert('Error al eliminar el registro: ' + error.message)
    }
  }

  const exportToPDF = async (recordId, petName) => {
    const element = document.getElementById(`record-${recordId}`)
    if (!element) return

    setExportingId(recordId)
    const actionButtons = element.querySelectorAll('.card-action-btn')

    try {
      actionButtons.forEach((btn) => (btn.style.display = 'none'))

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        scrollY: -window.scrollY
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save(`Ficha_Medica_${(petName || 'Mascota').replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error('Error al generar el PDF:', err)
    } finally {
      actionButtons.forEach((btn) => (btn.style.display = 'flex'))
      setExportingId(null)
    }
  }

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return records

    return records.filter(
      (r) =>
        r.pet?.toLowerCase().includes(term) ||
        r.owner?.toLowerCase().includes(term) ||
        r.diagnosis?.toLowerCase().includes(term)
    )
  }, [records, searchTerm])

  // Contenido del Modal separado para portal
  const modalContent = isModalOpen ? (
    <div className="modal-overlay" onClick={() => !saving && setIsModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Stethoscope size={22} color="#10b981" />
            <h2>{editingId ? 'Editar Consulta Médica' : 'Registrar Consulta Médica'}</h2>
          </div>
          <button
            className="close-modal-btn"
            onClick={() => setIsModalOpen(false)}
            disabled={saving}
          >
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        <form onSubmit={handleSaveRecord} className="modal-form">
          <div className="form-body">
            <div className="form-row">
              <div className="form-group">
                <label>Mascota</label>
                <input
                  type="text"
                  name="pet"
                  required
                  placeholder="Ej. Firulais"
                  value={formData.pet}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Dueño / Tutor</label>
                <input
                  type="text"
                  name="owner"
                  required
                  placeholder="Ej. Carlos Gómez"
                  value={formData.owner}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Peso Actual</label>
                <input
                  type="text"
                  name="weight"
                  placeholder="Ej. 12 kg"
                  value={formData.weight}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Vacuna Aplicada (Opcional)</label>
                <input
                  type="text"
                  name="vaccine"
                  placeholder="Ej. Antirrábica / Ninguna"
                  value={formData.vaccine}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Diagnóstico / Observaciones</label>
              <textarea
                name="diagnosis"
                rows={2}
                required
                placeholder="Descripción del estado del paciente..."
                value={formData.diagnosis}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Tratamiento Prescripto</label>
              <textarea
                name="treatment"
                rows={3}
                required
                placeholder="Medicamentos, dosis, recomendaciones..."
                value={formData.treatment}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? (
                <Loader2 className="spinner" size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              <span>
                {saving
                  ? 'Guardando...'
                  : editingId
                  ? 'Actualizar Ficha'
                  : 'Guardar Ficha'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  return (
    <div className="historial-page">
      <div className="header-section">
        <div>
          <h1 className="title">Historial Clínico</h1>
          <p className="subtitle">
            Registro detallado de diagnósticos, tratamientos y vacunación en tiempo real.
          </p>
        </div>
        <button className="action-btn" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Nueva Consulta</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por paciente, dueño o diagnóstico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={24} color="#10b981" />
          <p>Cargando ficha médica desde Supabase...</p>
        </div>
      ) : (
        <div className="records-list">
          {filteredRecords.length === 0 ? (
            <p className="empty-state">No se encontraron registros de consultas.</p>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                id={`record-${record.id}`}
                className="record-card"
              >
                <div className="record-header">
                  <div className="pet-meta">
                    <div className="avatar-box">
                      <PawPrint size={22} color="#10b981" />
                    </div>
                    <div>
                      <h3 className="pet-name">{record.pet}</h3>
                      <span className="owner-name">Tutor: {record.owner}</span>
                    </div>
                  </div>

                  <div className="header-right">
                    <button
                      onClick={() => handleOpenEditModal(record)}
                      className="card-action-btn edit-btn"
                      title="Editar consulta"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record.id, record.pet)}
                      className="card-action-btn delete-btn"
                      title="Eliminar consulta"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => exportToPDF(record.id, record.pet)}
                      className="card-action-btn download-pdf-btn"
                      disabled={exportingId === record.id}
                    >
                      {exportingId === record.id ? (
                        <Loader2 className="spinner" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      <span>{exportingId === record.id ? 'Exportando...' : 'PDF'}</span>
                    </button>
                    <div className="record-date">
                      <Calendar size={14} color="#94a3b8" />
                      <span>
                        {new Date(record.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-divider" />

                <div className="record-body">
                  <div className="badge-group">
                    <div className="info-chip">
                      <Weight size={14} color="#10b981" />
                      <span>Peso: {record.weight || 'N/A'}</span>
                    </div>
                    <div className="info-chip">
                      <Syringe size={14} color="#0284c7" />
                      <span>Vacuna: {record.vaccine || 'N/A'}</span>
                    </div>
                    <div className="info-chip">
                      <User size={14} color="#8b5cf6" />
                      <span>Atendió: {record.vet}</span>
                    </div>
                  </div>

                  <div className="clinical-details">
                    <div className="detail-block">
                      <div className="block-title">
                        <Stethoscope size={15} color="#10b981" />
                        <span>Diagnóstico / Motivo</span>
                      </div>
                      <p>{record.diagnosis}</p>
                    </div>

                    <div className="detail-block">
                      <div className="block-title">
                        <FileText size={15} color="#0284c7" />
                        <span>Tratamiento e Indicaciones</span>
                      </div>
                      <p>{record.treatment}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Renderizar modal directamente en document.body para evitar recortes */}
      {mounted && createPortal(modalContent, document.body)}

      <style jsx>{`
        .historial-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
          animation: fadeIn 0.5s ease forwards;
        }

        .header-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }

        .subtitle {
          margin: 6px 0 0 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 16px;
          width: 360px;
          max-width: 100%;
        }

        .search-input {
          background: none;
          border: none;
          outline: none;
          color: #f8fafc;
          font-size: 14px;
          width: 100%;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #94a3b8;
        }

        .empty-state {
          color: #94a3b8;
          font-size: 14px;
        }

        .records-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .record-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .record-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .record-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pet-meta {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar-box {
          width: 46px;
          height: 46px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pet-name {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #f8fafc;
        }

        .owner-name {
          font-size: 13px;
          color: #94a3b8;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .card-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.05);
        }

        .edit-btn {
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.2);
        }

        .edit-btn:hover {
          background: rgba(56, 189, 248, 0.15);
          transform: translateY(-1px);
        }

        .delete-btn {
          color: #f87171;
          border-color: rgba(248, 113, 113, 0.2);
        }

        .delete-btn:hover {
          background: rgba(248, 113, 113, 0.15);
          transform: translateY(-1px);
        }

        .download-pdf-btn {
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #34d399;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .download-pdf-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.3);
          transform: translateY(-1px);
        }

        .download-pdf-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .record-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #94a3b8;
          margin-left: 4px;
        }

        .card-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 18px 0;
        }

        .badge-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .info-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12px;
          color: #cbd5e1;
        }

        .clinical-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .detail-block {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 16px;
        }

        .block-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 8px;
        }

        .detail-block p {
          margin: 0;
          font-size: 13px;
          color: #cbd5e1;
          line-height: 1.5;
        }

        /* --- Estilos Globales para romper el encuadre del layout --- */
        :global(.modal-overlay) {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(0, 0, 0, 0.75) !important;
          backdrop-filter: blur(8px) !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 20px !important;
          box-sizing: border-box !important;
        }

        :global(.modal-content) {
          background: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 24px !important;
          width: 100% !important;
          max-width: 560px !important;
          max-height: calc(100vh - 40px) !important;
          display: flex !important;
          flex-direction: column !important;
          padding: 24px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
          box-sizing: border-box !important;
        }

        :global(.modal-header) {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding-bottom: 16px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          margin-bottom: 16px !important;
          flex-shrink: 0 !important;
        }

        :global(.modal-title-group) {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
        }

        :global(.modal-title-group h2) {
          margin: 0 !important;
          font-size: 20px !important;
          color: #f8fafc !important;
        }

        :global(.close-modal-btn) {
          background: none !important;
          border: none !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        :global(.modal-form) {
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          flex: 1 !important;
        }

        :global(.form-body) {
          display: flex !important;
          flex-direction: column !important;
          gap: 16px !important;
          overflow-y: auto !important;
          padding-right: 4px !important;
        }

        :global(.form-row) {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 16px !important;
        }

        @media (max-width: 500px) {
          :global(.form-row) {
            grid-template-columns: 1fr !important;
          }
        }

        :global(.form-group) {
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
        }

        :global(.form-group label) {
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #cbd5e1 !important;
          text-transform: uppercase !important;
        }

        :global(.form-group input),
        :global(.form-group textarea) {
          background: rgba(30, 41, 59, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 10px !important;
          padding: 10px 12px !important;
          color: #f8fafc !important;
          font-size: 14px !important;
          outline: none !important;
          font-family: inherit !important;
        }

        :global(.form-group input:focus),
        :global(.form-group textarea:focus) {
          border-color: #10b981 !important;
        }

        :global(.modal-actions) {
          display: flex !important;
          justify-content: flex-end !important;
          gap: 12px !important;
          margin-top: 16px !important;
          padding-top: 16px !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          flex-shrink: 0 !important;
        }

        :global(.cancel-btn) {
          background: none !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #cbd5e1 !important;
          padding: 10px 18px !important;
          border-radius: 10px !important;
          cursor: pointer !important;
        }

        :global(.save-btn) {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          background: #10b981 !important;
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
        }

        :global(.save-btn:disabled) {
          opacity: 0.7 !important;
          cursor: not-allowed !important;
        }

        :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
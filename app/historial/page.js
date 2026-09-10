'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Pencil, 
  Trash2, 
  FileDown, 
  Plus, 
  Paperclip, 
  X, 
  Search, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';

export default function HistorialClinicoPage() {
  // 1. Inicialización de cliente Supabase
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  // Estados de la aplicación
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del Modal y Formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const initialFormState = {
    paciente_nombre: '',
    especie: 'Canino',
    raza: '',
    edad: '',
    sexo: 'Macho',
    tutor_nombre: '',
    tutor_telefono: '',
    motivo_consulta: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    adjuntos: []
  };

  const [formData, setFormData] = useState(initialFormState);

  // Cargar registros al montar
  useEffect(() => {
    fetchRecords();
  }, []);

  // 2. Obtener historiales clínicos de Supabase
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('historial_clinico')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err.message);
      alert('Error al cargar los registros clínicos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Subir archivos adjuntos a Supabase Storage
  const uploadAttachments = async (files) => {
    const uploadedUrls = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `consultas/${fileName}`;

      const { data, error } = await supabase.storage
        .from('estudios-clinicos')
        .upload(filePath, file);

      if (error) {
        console.error('Error al subir archivo:', error.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('estudios-clinicos')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  // 4. Guardar o Actualizar registro
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let currentAdjuntos = formData.adjuntos || [];

      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        const newUploadedUrls = await uploadAttachments(selectedFiles);
        currentAdjuntos = [...currentAdjuntos, ...newUploadedUrls];
      }

      const payload = {
        ...formData,
        adjuntos: currentAdjuntos
      };

      if (editingId) {
        const { error } = await supabase
          .from('historial_clinico')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('historial_clinico')
          .insert([payload]);

        if (error) throw error;
      }

      handleCloseModal();
      fetchRecords();
    } catch (err) {
      console.error('Error saving record:', err.message);
      alert('Error al guardar el registro: ' + err.message);
    } finally {
      setSaving(false);
      setUploadingFiles(false);
    }
  };

  // 5. Eliminar registro
  const handleDeleteRecord = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro clínico? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('historial_clinico')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecords(records.filter((rec) => rec.id !== id));
    } catch (err) {
      console.error('Error deleting record:', err.message);
      alert('Error al eliminar el registro: ' + err.message);
    }
  };

  // Abre modal en modo Edición
  const handleOpenEditModal = (record) => {
    setEditingId(record.id);
    setFormData(record);
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  // Abre modal en modo Creación
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
    setSelectedFiles([]);
  };

  // 6. Exportación a PDF sin elementos de UI (.no-print)
  const handleExportPDF = async (recordId, pacienteNombre) => {
    const element = document.getElementById(`record-card-${recordId}`);
    if (!element) return;

    // Ocultar temporalmente los elementos marcados con .no-print
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => (el.style.display = 'none'));

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Historial_${pacienteNombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF.');
    } finally {
      // Restaurar visibilidad
      noPrintElements.forEach((el) => (el.style.display = ''));
    }
  };

  // Filtrado de búsquedas
  const filteredRecords = records.filter((rec) => {
    const term = searchQuery.toLowerCase();
    return (
      rec.paciente_nombre?.toLowerCase().includes(term) ||
      rec.tutor_nombre?.toLowerCase().includes(term) ||
      rec.diagnostico?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Historial Clínico Veterinario</h1>
            <p className="text-slate-500 text-sm">Gestión de consultas, tratamientos y fichas clínicas</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-sm"
          >
            <Plus className="w-5 h-5" /> Nueva Consulta
          </button>
        </div>

        {/* Bar de Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, tutor o diagnóstico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* Lista de Fichas Clínicas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No se encontraron registros clínicos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                id={`record-card-${record.id}`}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{record.paciente_nombre}</h2>
                    <p className="text-sm text-slate-500">
                      {record.especie} • {record.raza || 'Sin raza'} • {record.sexo} • {record.edad || 'Edad N/I'}
                    </p>
                  </div>

                  {/* Botones de Acción (Ocultos en PDF) */}
                  <div className="flex items-center gap-2 no-print">
                    <button
                      onClick={() => handleExportPDF(record.id, record.paciente_nombre)}
                      title="Exportar a PDF"
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      <FileDown className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(record)}
                      title="Editar Consulta"
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      title="Eliminar Consulta"
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Detalles del Tutor */}
                <div className="bg-slate-50 p-3 rounded-lg text-sm grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                  <div><span className="font-semibold">Tutor:</span> {record.tutor_nombre || 'N/A'}</div>
                  <div><span className="font-semibold">Teléfono:</span> {record.tutor_telefono || 'N/A'}</div>
                  <div><span className="font-semibold">Fecha:</span> {new Date(record.created_at).toLocaleDateString()}</div>
                </div>

                {/* Secciones Clínicas */}
                <div className="space-y-3 text-sm">
                  {record.motivo_consulta && (
                    <div>
                      <h4 className="font-semibold text-slate-900">Motivo de Consulta:</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{record.motivo_consulta}</p>
                    </div>
                  )}

                  {record.diagnostico && (
                    <div>
                      <h4 className="font-semibold text-slate-900">Diagnóstico:</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{record.diagnostico}</p>
                    </div>
                  )}

                  {record.tratamiento && (
                    <div>
                      <h4 className="font-semibold text-slate-900">Tratamiento Indicado:</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{record.tratamiento}</p>
                    </div>
                  )}

                  {record.observaciones && (
                    <div>
                      <h4 className="font-semibold text-slate-900">Observaciones:</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{record.observaciones}</p>
                    </div>
                  )}
                </div>

                {/* Adjuntos */}
                {record.adjuntos && record.adjuntos.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-slate-500" /> Adjuntos y Estudios
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {record.adjuntos.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition font-medium no-print"
                        >
                          Ver Adjunto {idx + 1} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de Crear / Editar */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
              {/* Encabezado del Modal */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Editar Ficha Clínica' : 'Nueva Ficha Clínica'}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSaveRecord} className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Paciente *</label>
                    <input
                      required
                      type="text"
                      value={formData.paciente_nombre}
                      onChange={(e) => setFormData({ ...formData, paciente_nombre: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Especie</label>
                    <select
                      value={formData.especie}
                      onChange={(e) => setFormData({ ...formData, especie: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      <option value="Canino">Canino</option>
                      <option value="Felino">Felino</option>
                      <option value="Ave">Ave</option>
                      <option value="Exótico">Exótico</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Raza</label>
                    <input
                      type="text"
                      value={formData.raza}
                      onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Edad</label>
                    <input
                      type="text"
                      placeholder="Ej: 3 años"
                      value={formData.edad}
                      onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sexo</label>
                    <select
                      value={formData.sexo}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Tutor</label>
                    <input
                      type="text"
                      value={formData.tutor_nombre}
                      onChange={(e) => setFormData({ ...formData, tutor_nombre: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Tutor</label>
                    <input
                      type="text"
                      value={formData.tutor_telefono}
                      onChange={(e) => setFormData({ ...formData, tutor_telefono: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de Consulta</label>
                  <textarea
                    rows={2}
                    value={formData.motivo_consulta}
                    onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnóstico</label>
                  <textarea
                    rows={2}
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tratamiento Indicado</label>
                  <textarea
                    rows={2}
                    value={formData.tratamiento}
                    onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones</label>
                  <textarea
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Campo para adjuntar nuevos archivos */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adjuntar Ecografías / Análisis (Imágenes o PDF)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>

                {/* Footer del Modal */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingFiles}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {(saving || uploadingFiles) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
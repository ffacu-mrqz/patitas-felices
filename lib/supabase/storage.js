import { createClient } from './client'

export async function uploadImage(file, { bucket = 'mascotas', folder = 'imagenes' } = {}) {
  if (!(file instanceof File)) {
    throw new Error('Debes proporcionar un archivo válido')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${folder}/${crypto.randomUUID()}.${extension}`
  const supabase = createClient()

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)

  if (!data?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública')
  }

  return data.publicUrl
}

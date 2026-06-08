import type { Establishment, RecognitionItem } from '../types'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isRecognitionItemValid(item: RecognitionItem): string | null {
  if (!item.tipo_reconocimiento) return 'Selecciona el tipo de reconocimiento.'
  if (item.tipo_reconocimiento === 'Otro' && !item.tipo_reconocimiento_otro.trim()) {
    return 'Especifica el tipo de reconocimiento "Otro".'
  }
  if (item.cantidad === '' || Number(item.cantidad) <= 0) {
    return 'La cantidad requerida debe ser mayor a cero.'
  }
  if (!item.dimension) return 'Selecciona la dimensión asociada.'
  if (!item.subdimension) return 'Selecciona la subdimensión asociada.'
  if (!item.nombre_accion.trim()) return 'Indica el nombre de la acción asociada.'
  return null
}

export function validateRequest(
  establishment: Establishment | null,
  items: RecognitionItem[],
): string | null {
  if (!establishment) return 'No se ha cargado un establecimiento válido.'
  if (items.length === 0) return 'Debes agregar al menos un reconocimiento.'

  for (let i = 0; i < items.length; i++) {
    const error = isRecognitionItemValid(items[i])
    if (error) return `Reconocimiento #${i + 1}: ${error}`
  }
  return null
}

export function emptyRecognitionItem(): RecognitionItem {
  return {
    tipo_reconocimiento: '',
    tipo_reconocimiento_otro: '',
    cantidad: '',
    dimension: '',
    subdimension: '',
    codigo_pme: '',
    nombre_accion: '',
    descripcion: '',
    fecha_estimada_uso: '',
    observaciones: '',
  }
}

import type { Establishment } from '../types'

const FIELD_ALIASES: Record<string, string[]> = {
  RBD: ['RBD'],
  'Nombre del establecimiento': ['NOMBRE ESTABLECIMIENTO', 'NOMBRE DEL ESTABLECIMIENTO'],
  Comuna: ['COMUNA'],
  Dirección: ['DIRECCION', 'DIRECCIÓN'],
  'Correo electrónico': ['CORREO ELECTRONICO', 'CORREO ELECTRÓNICO'],
  'Director o directora': ['DIRECTOR/A', 'DIRECTOR O DIRECTORA', 'DIRECTOR'],
  Dependencia: ['DEPENDENCIA'],
  'Tipo de enseñanza': ['TIPO DE ENSEÑANZA', 'TIPO ENSEÑANZA', 'TIPO'],
  'Zona / Ruralidad': ['RURAL/URBANO', 'ZONA'],
  Teléfono: ['TELEFONO CELULAR', 'TELEFONO', 'TELEFONO FIJO/ANEXOS'],
}

function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

/** Devuelve los pares [etiqueta, valor] de los campos relevantes que existan en la fila. */
export function pickEstablishmentFields(establishment: Establishment): [string, string][] {
  const normalizedEntries = Object.entries(establishment).map(
    ([key, value]) => [normalizeKey(key), value] as const,
  )

  const result: [string, string][] = []
  const usedKeys = new Set<string>()

  for (const [label, aliases] of Object.entries(FIELD_ALIASES)) {
    const normalizedAliases = aliases.map(normalizeKey)
    const match = normalizedEntries.find(([key]) => normalizedAliases.includes(key))
    if (match && match[1] !== null && match[1] !== '' && match[1] !== undefined) {
      result.push([label, String(match[1])])
      usedKeys.add(match[0])
    }
  }

  // Agrega cualquier otro campo no contemplado explícitamente, para no perder datos relevantes.
  for (const [key, value] of normalizedEntries) {
    if (usedKeys.has(key)) continue
    if (key === 'N°' || key === 'COMUNA_1') continue
    if (value === null || value === '' || value === undefined) continue
    result.push([toTitleCase(key), String(value)])
  }

  return result
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export function getEstablishmentValue(
  establishment: Establishment,
  aliases: string[],
): string {
  const normalizedAliases = aliases.map(normalizeKey)
  for (const [key, value] of Object.entries(establishment)) {
    if (normalizedAliases.includes(normalizeKey(key)) && value !== null && value !== undefined) {
      return String(value)
    }
  }
  return ''
}

export function getEstablishmentName(establishment: Establishment): string {
  return getEstablishmentValue(establishment, ['NOMBRE ESTABLECIMIENTO', 'NOMBRE DEL ESTABLECIMIENTO'])
}

export function getEstablishmentRbd(establishment: Establishment): string {
  return getEstablishmentValue(establishment, ['RBD'])
}

export function getEstablishmentComuna(establishment: Establishment): string {
  return getEstablishmentValue(establishment, ['COMUNA'])
}

export function getEstablishmentEmail(establishment: Establishment): string {
  return getEstablishmentValue(establishment, ['CORREO ELECTRONICO', 'CORREO ELECTRÓNICO'])
}

export function formatDateTime(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CL').format(value)
}

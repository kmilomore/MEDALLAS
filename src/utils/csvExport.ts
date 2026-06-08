import type { AdminRequest, RequestDetail } from '../types'
import { formatDateTime } from './formatters'

export type ConsolidatedRow = {
  request: AdminRequest
  detail: RequestDetail
}

const HEADERS = [
  'ID solicitud',
  'Fecha envío',
  'RBD',
  'Establecimiento',
  'Comuna',
  'Correo director',
  'Tipo reconocimiento',
  'Cantidad',
  'Dimensión',
  'Subdimensión',
  'Código PME',
  'Acción asociada',
  'Descripción',
  'Fecha estimada de uso',
  'Observaciones',
  'Estado de revisión',
]

function escapeCsvValue(value: string | number): string {
  const text = String(value ?? '')
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function buildConsolidatedCsv(rows: ConsolidatedRow[]): string {
  const lines = [HEADERS.join(';')]

  for (const { request, detail } of rows) {
    const tipo =
      detail.tipo_reconocimiento === 'Otro' && detail.tipo_reconocimiento_otro
        ? `Otro (${detail.tipo_reconocimiento_otro})`
        : detail.tipo_reconocimiento
    const subdimension =
      detail.subdimension === 'Otro' && detail.subdimension_otro
        ? `Otro (${detail.subdimension_otro})`
        : detail.subdimension

    lines.push(
      [
        request.id_solicitud,
        formatDateTime(request.fecha_envio),
        detail.rbd,
        detail.nombre_establecimiento,
        request.comuna,
        detail.correo_electronico,
        tipo,
        detail.cantidad,
        detail.dimension,
        subdimension,
        detail.codigo_pme,
        detail.nombre_accion,
        detail.descripcion,
        detail.fecha_estimada_uso,
        detail.observaciones,
        request.estado_revision,
      ]
        .map(escapeCsvValue)
        .join(';'),
    )
  }

  return lines.join('\n')
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// La base de establecimientos proviene de BaseDeDatos.csv y sus encabezados
// pueden variar, por lo que el tipo se mantiene flexible y dinámico.
export type Establishment = {
  [key: string]: string | number | boolean | null
}

export type RecognitionType =
  | 'Medallas'
  | 'Galvanos'
  | 'Diplomas'
  | 'Trofeos'
  | 'Certificados'
  | 'Reconocimientos especiales'
  | 'Otro'

export type DimensionOption =
  | 'Participación educativa'
  | 'Formación integral'
  | 'Vinculación territorial'
  | 'Convivencia educativa'
  | 'Trayectoria educativa'
  | 'Actividades extraescolares'
  | 'Reconocimiento institucional'
  | 'Otro'

export type SubdimensionOption =
  | 'Actividades deportivas'
  | 'Actividades culturales'
  | 'Liderazgo estudiantil'
  | 'Participación de apoderados'
  | 'Centros de estudiantes'
  | 'Centros de padres, madres y apoderados'
  | 'Consejos escolares'
  | 'Ceremonias institucionales'
  | 'Premiaciones'
  | 'Ferias, encuentros o congresos'
  | 'Reconocimiento a trayectorias'
  | 'Otro'

export type RecognitionItem = {
  tipo_reconocimiento: RecognitionType | ''
  tipo_reconocimiento_otro: string
  cantidad: number | ''
  dimension: DimensionOption | ''
  subdimension: SubdimensionOption | ''
  subdimension_otro: string
  nombre_accion: string
  descripcion: string
  fecha_estimada_uso: string
  observaciones: string
}

export type RequestPayload = {
  action: 'createRequest'
  establishment: Establishment
  generalObservations: string
  items: RecognitionItem[]
}

export type AdminRequest = {
  id_solicitud: string
  fecha_envio: string
  correo_electronico: string
  rbd: string
  nombre_establecimiento: string
  comuna: string
  total_reconocimientos: number
  estado_revision: string
  observaciones_generales: string
}

export type RequestDetail = {
  id_detalle: string
  id_solicitud: string
  correo_electronico: string
  rbd: string
  nombre_establecimiento: string
  tipo_reconocimiento: string
  tipo_reconocimiento_otro: string
  cantidad: number
  dimension: string
  subdimension: string
  subdimension_otro: string
  nombre_accion: string
  descripcion: string
  fecha_estimada_uso: string
  observaciones: string
}

export type ReviewStatus = 'Recibido' | 'En revisión' | 'Validado' | 'Observado' | 'Cerrado'

export const REVIEW_STATUSES: ReviewStatus[] = [
  'Recibido',
  'En revisión',
  'Validado',
  'Observado',
  'Cerrado',
]

export const RECOGNITION_TYPES: RecognitionType[] = [
  'Medallas',
  'Galvanos',
  'Diplomas',
  'Trofeos',
  'Certificados',
  'Reconocimientos especiales',
  'Otro',
]

export const DIMENSIONS: DimensionOption[] = [
  'Participación educativa',
  'Formación integral',
  'Vinculación territorial',
  'Convivencia educativa',
  'Trayectoria educativa',
  'Actividades extraescolares',
  'Reconocimiento institucional',
  'Otro',
]

export const SUBDIMENSIONS: SubdimensionOption[] = [
  'Actividades deportivas',
  'Actividades culturales',
  'Liderazgo estudiantil',
  'Participación de apoderados',
  'Centros de estudiantes',
  'Centros de padres, madres y apoderados',
  'Consejos escolares',
  'Ceremonias institucionales',
  'Premiaciones',
  'Ferias, encuentros o congresos',
  'Reconocimiento a trayectorias',
  'Otro',
]

export type DashboardStats = {
  totalEstablecimientos: number
  establecimientosQueRespondieron: number
  establecimientosPendientes: number
  porcentajeAvance: number
  totalReconocimientos: number
  totalPorTipo: Record<string, number>
  totalPorDimension: Record<string, number>
  totalPorComuna: Record<string, number>
  totalPorEstado: Record<string, number>
}

export type GasResponse<T = unknown> = {
  success: boolean
  message?: string
} & T

export type ValidateEmailResponse = {
  success: boolean
  message: string
  establishment?: Establishment
}

// El acceso ahora se valida vía Google Auth: primero contra la base de
// establecimientos (perfil "director") y, si no hay coincidencia, contra la
// hoja "Admin" (perfil "admin"). Ambos perfiles comparten una forma flexible
// porque sus encabezados pueden variar entre planillas.
export type UserRole = 'director' | 'admin'

export type ValidateUserAccessResponse = {
  success: boolean
  message?: string
  role?: UserRole
  establishment?: Establishment
  admin?: Establishment
}

export type CreateRequestResponse = {
  success: boolean
  message: string
  requestId?: string
}

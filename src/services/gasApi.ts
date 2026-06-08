import type {
  CreateRequestResponse,
  DashboardStats,
  Establishment,
  GasResponse,
  PmeOption,
  RecognitionItem,
  RequestDetail,
  AdminRequest,
  ValidateEmailResponse,
  ValidateUserAccessResponse,
} from '../types'

const GAS_WEB_APP_URL =
  import.meta.env.VITE_GAS_WEB_APP_URL ||
  'https://script.google.com/macros/s/AKfycbx5pY4YwzqIcPi0lDNd9oycqXwFWHvDF2knkyAePwqX6u7KpiWaMExSXRrMyQmG2qgI/exec'

async function callGasApi<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Error al conectar con Google Apps Script')
  }

  return (await response.json()) as T
}

export async function validateDirectorEmail(email: string): Promise<ValidateEmailResponse> {
  return callGasApi<ValidateEmailResponse>({
    action: 'validateDirectorEmail',
    email,
  })
}

/**
 * Valida el correo entregado por Google Auth contra la base de
 * establecimientos y, si no hay coincidencia, contra la hoja "Admin",
 * devolviendo el perfil ("director" | "admin") junto con su registro.
 */
export async function validateUserAccess(email: string): Promise<ValidateUserAccessResponse> {
  return callGasApi<ValidateUserAccessResponse>({
    action: 'validateUserAccess',
    email,
  })
}

export async function createRequest(
  establishment: Establishment,
  generalObservations: string,
  items: RecognitionItem[],
): Promise<CreateRequestResponse> {
  return callGasApi<CreateRequestResponse>({
    action: 'createRequest',
    establishment,
    generalObservations,
    items,
  })
}

export async function getRequests(): Promise<GasResponse<{ requests: AdminRequest[] }>> {
  return callGasApi<GasResponse<{ requests: AdminRequest[] }>>({
    action: 'getRequests',
  })
}

export async function getRequestDetails(
  requestId: string,
): Promise<GasResponse<{ details: RequestDetail[] }>> {
  return callGasApi<GasResponse<{ details: RequestDetail[] }>>({
    action: 'getRequestDetails',
    requestId,
  })
}

export async function updateRequestStatus(
  requestId: string,
  status: string,
): Promise<GasResponse> {
  return callGasApi<GasResponse>({
    action: 'updateRequestStatus',
    requestId,
    status,
  })
}

export async function getDashboardStats(): Promise<GasResponse<{ stats: DashboardStats }>> {
  return callGasApi<GasResponse<{ stats: DashboardStats }>>({
    action: 'getDashboardStats',
  })
}

export async function getPmeOptions(): Promise<GasResponse<{ opciones: PmeOption[] }>> {
  return callGasApi<GasResponse<{ opciones: PmeOption[] }>>({
    action: 'getPmeOptions',
  })
}

export async function getAdmins(): Promise<GasResponse<{ admins: Establishment[] }>> {
  return callGasApi<GasResponse<{ admins: Establishment[] }>>({
    action: 'getAdmins',
  })
}

export async function createAdmin(admin: Record<string, string>): Promise<GasResponse> {
  return callGasApi<GasResponse>({
    action: 'createAdmin',
    admin,
  })
}

export async function deleteAdmin(email: string): Promise<GasResponse> {
  return callGasApi<GasResponse>({
    action: 'deleteAdmin',
    email,
  })
}

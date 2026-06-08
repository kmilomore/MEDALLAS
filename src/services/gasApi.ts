import type {
  CreateRequestResponse,
  DashboardStats,
  Establishment,
  GasResponse,
  RecognitionItem,
  RequestDetail,
  AdminRequest,
  ValidateEmailResponse,
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

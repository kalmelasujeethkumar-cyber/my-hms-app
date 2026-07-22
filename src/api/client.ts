/* ============================================================
   MediCare HMS — API Client
   Connects the React frontend to the Node/Express backend API.
   Handles automatic token header injection and fallback.
   ============================================================ */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('hms_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password?: string) =>
    fetchAPI<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => fetchAPI<{ user: any }>('/auth/me'),

  getUsers: () => fetchAPI<any[]>('/auth/users'),

  registerDoctor: (doctorData: { name: string; username: string; password?: string; specialty?: string; branch?: string }) =>
    fetchAPI<any>('/auth/register-doctor', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    }),

  registerDoctorsBatch: (doctors: any[]) =>
    fetchAPI<any>('/auth/register-doctors-batch', {
      method: 'POST',
      body: JSON.stringify({ doctors }),
    }),

  deleteDoctor: (username: string) =>
    fetchAPI<any>(`/auth/delete-doctor/${encodeURIComponent(username)}`, {
      method: 'DELETE',
    }),

  // Patients
  getPatients: (params?: { branch?: string; doctor?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI<any[]>(`/patients${query ? `?${query}` : ''}`);
  },

  addPatient: (patientData: any) =>
    fetchAPI<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    }),

  dischargePatient: (id: string) =>
    fetchAPI<any>(`/patients/${id}/discharge`, {
      method: 'PATCH',
    }),

  // Doctor & Session
  getDoctorStats: (doctorName?: string) =>
    fetchAPI<any>(`/doctors/stats${doctorName ? `?doctorName=${encodeURIComponent(doctorName)}` : ''}`),

  saveSessionNote: (note: any) =>
    fetchAPI<any>('/doctors/sessions/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    }),

  uploadReport: (report: any) =>
    fetchAPI<any>('/doctors/reports/upload', {
      method: 'POST',
      body: JSON.stringify(report),
    }),

  postGPS: (gps: any) =>
    fetchAPI<any>('/doctors/gps', {
      method: 'POST',
      body: JSON.stringify(gps),
    }),

  // Audit Logs
  getAuditLogs: () => fetchAPI<any[]>('/audit-logs'),

  addAuditLog: (log: any) =>
    fetchAPI<any>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    }),
};

export default api;

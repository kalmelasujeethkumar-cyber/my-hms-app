/* ============================================================
   VPC-HMS — API Client
   Connects the React frontend to the Node/Express backend API.
   Handles automatic token header injection and fallback.
   ============================================================ */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vpc_hms_token');

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

  // ── Admin-only endpoints (require admin JWT) ──────────────────────

  /**
   * Fetches all patient records enriched with their uploaded reports.
   * Requires admin role — will throw 403 for non-admin callers.
   */
  getAdminPatientRecords: (params?: { branch?: string; doctor?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI<any[]>(`/patients/admin/records${query ? `?${query}` : ''}`);
  },

  /**
   * Triggers download of the admin patient Excel export from the backend.
   * Handles the binary blob response and creates an <a> click to save the file.
   * Falls back gracefully if the backend is unreachable.
   */
  exportAdminExcel: async (fallbackPatients?: any[]): Promise<void> => {
    const token = localStorage.getItem('vpc_hms_token');
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/patients/admin/export-excel`, { headers });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VPC_HMS_Patient_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: generate a client-side CSV if the backend is unavailable
      if (!fallbackPatients || fallbackPatients.length === 0) return;

      const headers = [
        'Patient Name', 'Phone', 'Health Issue / Diagnosis', 'Treatment',
        'Branch', 'Doctor', 'Visit Type', 'Date of Admission',
        'Discharge Date', 'Status', 'Visit Count', 'Reports (File / URL)',
      ];

      const rows = fallbackPatients.map((p: any) => {
        const reportsCol = p.reports && p.reports.length > 0
          ? p.reports.map((r: any, i: number) => {
              const url = r.fileUrl || `http://localhost:5000/api/doctors/files/view/${r.id || 'temp'}`;
              return `${i + 1}. ${r.type} (${r.fileName}): ${url}`;
            }).join(' | ')
          : 'No reports uploaded';
        return [
          p.name, p.phone, p.issue, p.treatment, p.branch, p.doctor,
          p.type, p.entryDate, p.dischargeDate || 'Still Active', p.status,
          p.visitCount, reportsCol,
        ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`);
      });

      const csv = [headers.map(h => `"${h}"`), ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VPC_HMS_Patient_Records_${new Date().toISOString().split('T')[0]}_fallback.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },
};

export default api;

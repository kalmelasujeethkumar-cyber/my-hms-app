import { Request, Response } from 'express';

const DOCTOR_STATS = {
  'Dr. Manish': {
    activePatient: 'Srinivasa Rao',
    homeVisits: 3,
    inHospital: 0,
    totalVisits: 3,
    thisMonth: 18,
    annualTotal: 215,
    monthlyData: [
      { month: 'Jul', home: 14, hospital: 2 },
      { month: 'Aug', home: 16, hospital: 1 },
      { month: 'Sep', home: 12, hospital: 3 },
      { month: 'Oct', home: 20, hospital: 0 },
      { month: 'Nov', home: 15, hospital: 2 },
      { month: 'Dec', home: 18, hospital: 1 },
    ],
  },
  'Dr. Krupakar': {
    activePatient: 'Priya Sharma',
    homeVisits: 2,
    inHospital: 1,
    totalVisits: 3,
    thisMonth: 22,
    annualTotal: 268,
    monthlyData: [
      { month: 'Jul', home: 18, hospital: 4 },
      { month: 'Aug', home: 21, hospital: 3 },
      { month: 'Sep', home: 19, hospital: 5 },
      { month: 'Oct', home: 24, hospital: 2 },
      { month: 'Nov', home: 20, hospital: 4 },
      { month: 'Dec', home: 22, hospital: 3 },
    ],
  },
};

interface SessionNote {
  doctorName: string;
  patientName: string;
  notes: string;
  durationSeconds: number;
  timestamp: string;
}

export interface UploadRecord {
  id?: string;
  patientId?: string;
  doctorName: string;
  patientName: string;
  type: string;
  fileName: string;
  timestamp: string;
  fileUrl?: string | null;
  fileData?: string | null;
}

interface GPSRecord {
  doctorName: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

export const SESSION_NOTES: SessionNote[] = [];

const defaultBaseUrl = process.env.PUBLIC_URL || 'http://localhost:5000';

export const UPLOADS: UploadRecord[] = [
  {
    id: 'up-p1-1',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Blood Report',
    fileName: 'blood_routine_report.pdf',
    timestamp: '2025-10-16T10:30:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p1-1`,
  },
  {
    id: 'up-p1-2',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Scan / X-Ray',
    fileName: 'brain_mri_scan.png',
    timestamp: '2025-10-18T14:15:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p1-2`,
  },
  {
    id: 'up-p1-3',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Prescription',
    fileName: 'neuro_rehab_rx.pdf',
    timestamp: '2025-10-20T11:00:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p1-3`,
  },
  {
    id: 'up-p1-4',
    patientId: 'p1',
    patientName: 'Srinivasa Rao',
    doctorName: 'Dr. Manish',
    type: 'Field Visit Photo',
    fileName: 'mobility_session_photo.jpg',
    timestamp: '2025-10-22T09:45:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p1-4`,
  },
  {
    id: 'up-p2-1',
    patientId: 'p2',
    patientName: 'Lakshmi Devi',
    doctorName: 'Dr. Manish',
    type: 'Blood Report',
    fileName: 'arthritic_profile_blood.pdf',
    timestamp: '2025-11-02T11:20:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p2-1`,
  },
  {
    id: 'up-p2-2',
    patientId: 'p2',
    patientName: 'Lakshmi Devi',
    doctorName: 'Dr. Manish',
    type: 'Scan / X-Ray',
    fileName: 'knee_joint_xray.png',
    timestamp: '2025-11-03T16:00:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p2-2`,
  },
  {
    id: 'up-p2-3',
    patientId: 'p2',
    patientName: 'Lakshmi Devi',
    doctorName: 'Dr. Manish',
    type: 'Prescription',
    fileName: 'joint_physio_rx.pdf',
    timestamp: '2025-11-04T12:30:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p2-3`,
  },
  {
    id: 'up-p6-1',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Blood Report',
    fileName: 'cbc_spine_panel.pdf',
    timestamp: '2025-09-21T09:00:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p6-1`,
  },
  {
    id: 'up-p6-2',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Scan / X-Ray',
    fileName: 'spine_ct_scan.png',
    timestamp: '2025-09-22T15:30:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p6-2`,
  },
  {
    id: 'up-p6-3',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Prescription',
    fileName: 'gait_rehab_rx.pdf',
    timestamp: '2025-09-25T10:15:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p6-3`,
  },
  {
    id: 'up-p6-4',
    patientId: 'p6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Krupakar',
    type: 'Field Visit Photo',
    fileName: 'gait_training_photo.jpg',
    timestamp: '2025-09-28T14:00:00.000Z',
    fileUrl: `${defaultBaseUrl}/api/doctors/files/view/up-p6-4`,
  },
];
const GPS_HISTORY: GPSRecord[] = [];

export const getDoctorStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorName } = req.query;
    if (doctorName && typeof doctorName === 'string') {
      const stats = DOCTOR_STATS[doctorName as keyof typeof DOCTOR_STATS];
      if (!stats) {
        res.status(404).json({ error: 'Doctor stats not found' });
        return;
      }
      res.json(stats);
      return;
    }

    res.json(DOCTOR_STATS);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveSessionNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const note: SessionNote = req.body;
    if (!note.doctorName || !note.notes) {
      res.status(400).json({ error: 'doctorName and notes are required' });
      return;
    }
    SESSION_NOTES.push(note);
    res.status(201).json({ message: 'Session note saved successfully', note });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const upload: UploadRecord = req.body;
    if (!upload.doctorName || !upload.fileName) {
      res.status(400).json({ error: 'doctorName and fileName are required' });
      return;
    }

    if (!upload.id) {
      upload.id = `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    if (!upload.fileUrl) {
      upload.fileUrl = `${baseUrl}/api/doctors/files/view/${upload.id}`;
    }

    UPLOADS.push(upload);
    res.status(201).json({ message: 'Report recorded successfully', upload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const viewFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const upload = UPLOADS.find(u => u.id === id);

    if (!upload) {
      res.status(404).send('Report file not found');
      return;
    }

    if (upload.fileData && upload.fileData.startsWith('data:')) {
      const parts = upload.fileData.split(';base64,');
      const mimeType = parts[0].replace('data:', '');
      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${upload.fileName}"`);
      res.send(buffer);
      return;
    }

    // Dynamic clean SVG view if binary data was omitted
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <rect x="50" y="50" width="700" height="500" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <circle cx="120" cy="120" r="30" fill="#3b82f6" opacity="0.2"/>
        <text x="120" y="128" font-family="sans-serif" font-size="28" font-weight="bold" fill="#3b82f6" text-anchor="middle">🏥</text>
        <text x="170" y="115" font-family="sans-serif" font-size="24" font-weight="bold" fill="#f8fafc">VPC-HMS — Patient Medical Report</text>
        <text x="170" y="140" font-family="sans-serif" font-size="14" fill="#94a3b8">Document View Endpoint • Certified Digital Record</text>
        <line x1="90" y1="170" x2="710" y2="170" stroke="#334155" stroke-width="1.5"/>
        <text x="90" y="220" font-family="sans-serif" font-size="16" fill="#94a3b8">Patient Name:</text>
        <text x="240" y="220" font-family="sans-serif" font-size="18" font-weight="bold" fill="#38bdf8">${upload.patientName}</text>
        <text x="90" y="260" font-family="sans-serif" font-size="16" fill="#94a3b8">Report Type:</text>
        <text x="240" y="260" font-family="sans-serif" font-size="18" font-weight="bold" fill="#4ade80">${upload.type}</text>
        <text x="90" y="300" font-family="sans-serif" font-size="16" fill="#94a3b8">File Name:</text>
        <text x="240" y="300" font-family="sans-serif" font-size="16" fill="#f8fafc">${upload.fileName}</text>
        <text x="90" y="340" font-family="sans-serif" font-size="16" fill="#94a3b8">Doctor:</text>
        <text x="240" y="340" font-family="sans-serif" font-size="16" fill="#f8fafc">${upload.doctorName}</text>
        <text x="90" y="380" font-family="sans-serif" font-size="16" fill="#94a3b8">Timestamp:</text>
        <text x="240" y="380" font-family="sans-serif" font-size="16" fill="#f8fafc">${upload.timestamp}</text>
        <rect x="90" y="430" width="620" height="80" rx="8" fill="#0f172a" stroke="#334155"/>
        <text x="110" y="475" font-family="sans-serif" font-size="14" fill="#38bdf8">✓ Verified Report Document for ${upload.patientName}</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `inline; filename="${upload.fileName}.svg"`);
    res.send(svg);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const postGPSLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const gps: GPSRecord = req.body;
    if (!gps.doctorName || gps.lat === undefined || gps.lng === undefined) {
      res.status(400).json({ error: 'doctorName, lat, and lng are required' });
      return;
    }
    GPS_HISTORY.unshift(gps);
    res.status(201).json({ message: 'GPS location updated', location: gps });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGPSHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorName } = req.query;
    if (doctorName && typeof doctorName === 'string') {
      res.json(GPS_HISTORY.filter(g => g.doctorName.toLowerCase() === doctorName.toLowerCase()));
      return;
    }
    res.json(GPS_HISTORY);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

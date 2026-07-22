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

interface UploadRecord {
  doctorName: string;
  patientName: string;
  type: string;
  fileName: string;
  timestamp: string;
}

interface GPSRecord {
  doctorName: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

const SESSION_NOTES: SessionNote[] = [];
const UPLOADS: UploadRecord[] = [];
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
    UPLOADS.push(upload);
    res.status(201).json({ message: 'Report recorded successfully', upload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

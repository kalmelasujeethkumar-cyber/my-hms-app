/* ============================================================
   VPC-HMS — Admin (HOD) Dashboard
   Dr. B Vamsi Pavan sees everything: 5 tabs covering both branches,
   all patients, doctor stats, home visits, and audit logs.
   ============================================================ */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { DOCTOR_STATS } from '../data/mockData';
import {
  Users, MapPin, Building2, Home, Activity, Download,
  Search, Filter, TrendingUp, Clock, FileText, Shield,
  FileSpreadsheet, Plus, Upload, Save, Trash2, CheckCircle2, AlertCircle, Key, RefreshCw,
  FileDown, Eye, X, Pill, Image, Camera, Loader2, ExternalLink,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import type { Branch, PatientWithReports, ReportRecord } from '../types';
import api from '../api/client';

type Tab = 'overview' | 'patients' | 'stats' | 'homevisits' | 'audit' | 'doctors';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'patients', label: 'All Patients', icon: Users },
  { key: 'stats', label: 'Doctor Stats', icon: TrendingUp },
  { key: 'homevisits', label: 'Home Visits', icon: Home },
  { key: 'audit', label: 'Audit Log', icon: Shield },
  { key: 'doctors', label: 'Add Doctors (Excel)', icon: FileSpreadsheet },
];

/** Format an ISO date string to a readable format (e.g. "02 Nov 2025") */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Active';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Get today's date as a readable string */
function getTodayString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function AdminDashboard() {
  const { patients, auditLog, allUsers, uploads, addDoctorsBatch, removeDoctor } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Home' | 'In-Hospital'>('All');
  const [statRange, setStatRange] = useState<'Today' | 'Month' | '6 Months' | 'Annual'>('Month');

  // ── Admin Patient Records with Reports ─────────────────
  // Enriched patient list fetched from the admin API endpoint.
  // Falls back to base patients (without reports) if the backend is unavailable.
  const [adminRecords, setAdminRecords] = useState<PatientWithReports[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [excelExporting, setExcelExporting] = useState(false);

  // ── Report Preview Modal State ──────────────────────────
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    patientName: string;
    report: ReportRecord;
  } | null>(null);

  // Load admin records when the patients tab becomes active
  useEffect(() => {
    if (activeTab !== 'patients') return;
    setRecordsLoading(true);
    api.getAdminPatientRecords()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAdminRecords(data as PatientWithReports[]);
        } else {
          // Backend unavailable or empty — build local enriched records from context
          setAdminRecords(buildLocalEnrichedRecords());
        }
      })
      .catch(() => {
        // Backend unavailable — enrich locally from context uploads
        setAdminRecords(buildLocalEnrichedRecords());
      })
      .finally(() => setRecordsLoading(false));
  }, [activeTab, patients, uploads]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Build enriched patient records from context state (offline fallback) */
  const buildLocalEnrichedRecords = useCallback((): PatientWithReports[] => {
    return patients.map(p => ({
      ...p,
      reports: uploads
        .filter(u => (u.patientId && u.patientId === p.id) || (u.patientName && u.patientName.toLowerCase() === p.name.toLowerCase()))
        .map(u => ({
          id: u.id,
          patientId: u.patientId || p.id,
          type: u.type,
          fileName: u.fileName,
          doctorName: u.doctorName,
          timestamp: u.timestamp,
          fileUrl: u.fileUrl ?? `http://localhost:5000/api/doctors/files/view/${u.id}`,
          fileData: u.fileData || null,
        })),
    }));
  }, [patients, uploads]);

  // Refresh admin records when uploads change
  useEffect(() => {
    if (activeTab === 'patients') {
      setAdminRecords(buildLocalEnrichedRecords());
    }
  }, [uploads, buildLocalEnrichedRecords, activeTab]);

  /** Download the patient Excel report */
  const handleDownloadExcel = async () => {
    setExcelExporting(true);
    try {
      // Try backend first (real .xlsx); falls back to client-side CSV
      await api.exportAdminExcel(adminRecords.length > 0 ? adminRecords : buildLocalEnrichedRecords());
    } finally {
      setExcelExporting(false);
    }
  };

  /** Refresh patient records and reset UI filters (Option A) */
  const handleResetAndRefresh = useCallback(async () => {
    setRecordsLoading(true);
    setSearchQuery('');
    setFilterType('All');
    try {
      const data = await api.getAdminPatientRecords();
      if (Array.isArray(data) && data.length > 0) {
        setAdminRecords(data as PatientWithReports[]);
      } else {
        setAdminRecords(buildLocalEnrichedRecords());
      }
    } catch (e) {
      setAdminRecords(buildLocalEnrichedRecords());
    } finally {
      setRecordsLoading(false);
    }
  }, [buildLocalEnrichedRecords]);

  // ── 24-Hour Cycle Auto-Reset (Option A) ──────────────────
  useEffect(() => {
    if (activeTab !== 'patients') return;

    // Check every 30 seconds if we need to reset the page view
    const interval = setInterval(() => {
      const now = new Date();
      // Reset view filters at exactly 11:59 PM IST (23:59)
      if (now.getHours() === 23 && now.getMinutes() === 59) {
        console.log('[Dashboard] Auto-resetting patient records page view filters...');
        handleResetAndRefresh();
      }
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [activeTab, handleResetAndRefresh]);

  /** Open report preview modal */
  const openReportPreview = (patientName: string, report: ReportRecord) => {
    setPreviewModal({ isOpen: true, patientName, report });
  };

  /** Icon component for a report type badge */
  const ReportTypeIcon = ({ type }: { type: ReportRecord['type'] }) => {
    switch (type) {
      case 'Blood Report':    return <FileText className="w-3 h-3" />;
      case 'Scan / X-Ray':   return <Image className="w-3 h-3" />;
      case 'Prescription':   return <Pill className="w-3 h-3" />;
      case 'Field Visit Photo': return <Camera className="w-3 h-3" />;
      default:               return <FileText className="w-3 h-3" />;
    }
  };

  /** Color class for a report type badge */
  const reportBadgeStyle = (type: ReportRecord['type']): string => {
    switch (type) {
      case 'Blood Report':      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'Scan / X-Ray':      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'Prescription':      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'Field Visit Photo': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      default:                  return 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
    }
  };


  interface GridRow {
    id: string;
    name: string;
    specialty: string;
    branch: Branch;
    username: string;
    password: string;
    isSaved: boolean;
    errorMsg?: string;
  }

  const excelFileInputRef = useRef<HTMLInputElement | null>(null);

  // 2-Step Delete Verification Confirmation State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    step: 1 | 2;
    doctorRow: GridRow;
  } | null>(null);

  // Initialize Excel grid with provisioned doctors + 2 draft rows
  const [excelRows, setExcelRows] = useState<GridRow[]>(() => {
    const doctors = allUsers.filter(u => u.role === 'doctor');
    const existingRows: GridRow[] = doctors.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty || 'General Physiotherapy',
      branch: (d.branch as Branch) || 'Guntur',
      username: d.username,
      password: d.password,
      isSaved: true,
    }));

    return [
      ...existingRows,
      { id: `draft-1`, name: '', specialty: 'Neurological Rehab', branch: 'Guntur', username: '', password: '', isSaved: false },
      { id: `draft-2`, name: '', specialty: 'Orthopedic Rehab', branch: 'Hyderabad', username: '', password: '', isSaved: false },
    ];
  });

  const [provisionSuccessMsg, setProvisionSuccessMsg] = useState<string | null>(null);
  const [provisionErrorMsg, setProvisionErrorMsg] = useState<string | null>(null);

  const handleAddGridRow = () => {
    const newRow: GridRow = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      specialty: 'Physiotherapy & Care',
      branch: 'Guntur',
      username: '',
      password: '',
      isSaved: false,
    };
    setExcelRows(prev => [...prev, newRow]);
  };

  const handleCellChange = (id: string, field: keyof GridRow, value: any) => {
    setExcelRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // ── 2-Step Delete Verification Handlers ─────────────────
  const initiateDelete = (row: GridRow) => {
    setDeleteConfirmState({
      isOpen: true,
      step: 1,
      doctorRow: row,
    });
  };

  const handleStep1Confirm = () => {
    if (deleteConfirmState) {
      setDeleteConfirmState({
        ...deleteConfirmState,
        step: 2,
      });
    }
  };

  const handleFinalDeleteRevoke = () => {
    if (!deleteConfirmState) return;
    const { doctorRow } = deleteConfirmState;

    // Revoke doctor access in AuthContext & Backend
    if (doctorRow.username) {
      removeDoctor(doctorRow.username);
    }

    // Remove from local grid state
    setExcelRows(prev => prev.filter(r => r.id !== doctorRow.id));

    setProvisionSuccessMsg(`Revoked system access for ${doctorRow.name || doctorRow.username || 'doctor'} in real time.`);
    setDeleteConfirmState(null);
  };

  const handleProvisionAccess = () => {
    setProvisionSuccessMsg(null);
    setProvisionErrorMsg(null);

    const unsaved = excelRows.filter(r => !r.isSaved && r.name.trim() && r.username.trim());
    if (unsaved.length === 0) {
      setProvisionErrorMsg('Please fill in Name and Username for at least one new doctor row before provisioning access.');
      return;
    }

    // Check for duplicate usernames in allUsers
    const existingUsernames = new Set(allUsers.map(u => u.username.toLowerCase()));
    const validBatch: { name: string; username: string; password: string; specialty: string; branch: Branch }[] = [];
    const errors: string[] = [];

    unsaved.forEach(r => {
      const uname = r.username.trim().toLowerCase();
      if (existingUsernames.has(uname)) {
        errors.push(`Username "${r.username}" is already taken.`);
      } else {
        existingUsernames.add(uname);
        validBatch.push({
          name: r.name.trim(),
          username: r.username.trim(),
          password: r.password.trim() || r.username.trim(),
          specialty: r.specialty.trim() || 'General Medicine',
          branch: r.branch,
        });
      }
    });

    if (errors.length > 0) {
      setProvisionErrorMsg(errors.join(' '));
      if (validBatch.length === 0) return;
    }

    if (validBatch.length > 0) {
      addDoctorsBatch(validBatch);
      setExcelRows(prev =>
        prev.map(row => {
          const isNewlyAdded = validBatch.some(b => b.username.toLowerCase() === row.username.trim().toLowerCase());
          return isNewlyAdded ? { ...row, isSaved: true } : row;
        })
      );
      setProvisionSuccessMsg(`🎉 Real-Time Access Provisioned! Created credentials for ${validBatch.length} doctor account(s). They can log in immediately.`);
    }
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const parsedRows: GridRow[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('username'))) return;

        const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 2) {
          const name = cols[0] || `Dr. Member ${index}`;
          const specialty = cols[1] || 'Physiotherapy';
          const branch: Branch = (cols[2] && cols[2].toLowerCase().includes('hyd')) ? 'Hyderabad' : 'Guntur';
          const username = cols[3] || name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const password = cols[4] || username;

          parsedRows.push({
            id: `excel-${Date.now()}-${index}`,
            name,
            specialty,
            branch,
            username,
            password,
            isSaved: false,
          });
        }
      });

      if (parsedRows.length > 0) {
        setExcelRows(prev => [...prev, ...parsedRows]);
        setProvisionSuccessMsg(`Imported ${parsedRows.length} doctor row(s) from Excel file. Click "Provision Real-Time Access" to activate credentials.`);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent = "Doctor Name,Specialty,Branch,Username,Password\n" +
      "Dr. Vikram Sarabhai,Cardiology Rehab,Guntur,vikram,vikram123\n" +
      "Dr. Ananya Roy,Neurology Physiotherapy,Hyderabad,ananya,ananya123\n" +
      "Dr. Suresh Raina,Sports Orthopedics,Guntur,suresh,suresh123\n";

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Doctor_Access_Import_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDoctorsCSV = () => {
    const headers = ['Doctor Name', 'Specialty', 'Branch', 'Username', 'Password', 'Access Status'];
    const rows = excelRows.map(r => [
      r.name, r.specialty, r.branch, r.username, r.password, r.isSaved ? 'Provisioned (Active)' : 'Draft (Pending)',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpc_hms_doctor_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Computed Stats ─────────────────────────────────────
  const gunturPatients = useMemo(() => patients.filter(p => p.branch === 'Guntur'), [patients]);
  const hydPatients = useMemo(() => patients.filter(p => p.branch === 'Hyderabad'), [patients]);
  const homeVisitPatients = useMemo(() => patients.filter(p => p.type === 'Home'), [patients]);
  const activePatients = useMemo(() => patients.filter(p => p.status === 'Active'), [patients]);

  // Branch-specific stats
  const gunturActive = gunturPatients.filter(p => p.status === 'Active').length;
  const gunturDischarged = gunturPatients.filter(p => p.status === 'Discharged').length;
  const gunturHomeVisits = gunturPatients.filter(p => p.type === 'Home').length;

  const hydActive = hydPatients.filter(p => p.status === 'Active').length;
  const hydDischarged = hydPatients.filter(p => p.status === 'Discharged').length;
  const hydHomeVisits = hydPatients.filter(p => p.type === 'Home').length;

  // Filtered patients for the table
  const filteredPatients = useMemo(() => {
    let result = patients;
    if (filterType !== 'All') {
      result = result.filter(p => p.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.issue.toLowerCase().includes(q)
      );
    }
    return result;
  }, [patients, filterType, searchQuery]);

  // ── CSV Export ─────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Issue', 'Treatment', 'Branch', 'Doctor', 'Entry Date', 'Discharge Date', 'Type', 'Status'];
    const rows = patients.map(p => [
      p.name, p.phone, p.issue, p.treatment, p.branch, p.doctor,
      formatDate(p.entryDate), p.dischargeDate ? formatDate(p.dischargeDate) : 'Active',
      p.type, p.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpc_hms_patients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Tab Navigation ──────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-2 sm:px-4">
        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide snap-x">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap snap-start min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* ═══════════════════════════════════════════════
            OVERVIEW TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                { label: 'Total Patients', value: patients.length, icon: Users, color: 'blue' },
                { label: 'Guntur Branch', value: gunturPatients.length, icon: Building2, color: 'teal' },
                { label: 'Hyderabad Branch', value: hydPatients.length, icon: Building2, color: 'indigo' },
                { label: 'Home Visits', value: homeVisitPatients.length, icon: Home, color: 'emerald' },
                { label: 'Active Now', value: activePatients.length, icon: Activity, color: 'amber' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className={`bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight min-w-0">{stat.label}</span>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-${stat.color}-50 flex items-center justify-center flex-shrink-0 ml-1`}>
                      <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${stat.color}-600`} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Branch Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guntur Branch */}
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Guntur Branch</h3>
                  <span className="ml-auto text-sm font-bold text-teal-600">{gunturPatients.length} patients</span>
                </div>
                <div className="flex gap-6 text-sm mb-3">
                  <div>
                    <span className="text-slate-500">Active</span>
                    <span className="ml-2 font-bold text-green-600">{gunturActive}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Discharged</span>
                    <span className="ml-2 font-bold text-slate-600">{gunturDischarged}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-1">Home visits ratio</div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${gunturPatients.length ? (gunturHomeVisits / gunturPatients.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">{gunturHomeVisits}/{gunturPatients.length} home visits</div>
              </div>

              {/* Hyderabad Branch */}
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Hyderabad Branch</h3>
                  <span className="ml-auto text-sm font-bold text-indigo-600">{hydPatients.length} patients</span>
                </div>
                <div className="flex gap-6 text-sm mb-3">
                  <div>
                    <span className="text-slate-500">Active</span>
                    <span className="ml-2 font-bold text-green-600">{hydActive}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Discharged</span>
                    <span className="ml-2 font-bold text-slate-600">{hydDischarged}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-1">Home visits ratio</div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${hydPatients.length ? (hydHomeVisits / hydPatients.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">{hydHomeVisits}/{hydPatients.length} home visits</div>
              </div>
            </div>

            {/* Doctor Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DOCTOR_STATS).map(([name, stats]) => (
                <div key={name} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                      {name.split(' ')[1]?.[0] || name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{name}</h3>
                      <p className="text-xs text-slate-500">{stats.branch} Branch</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">This Month</p>
                      <p className="text-xl font-bold text-slate-800">{stats.thisMonth}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">Annual Total</p>
                      <p className="text-xl font-bold text-slate-800">{stats.annualTotal}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Excel Doctor Access Banner & CSV Export Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-base">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    Add Doctors (Excel Sheet Workflow)
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">
                    Batch add doctors & provision real-time login credentials via interactive spreadsheet grid or Excel/CSV import.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold text-xs transition-all shadow-md border border-emerald-400"
                >
                  <Plus className="w-4 h-4" />
                  Add Doctors via Excel
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-blue-200" />
                    Quarterly Data Export
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">
                    Auto-archives every 3 months — Includes all patient records in CSV format
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors border border-white/20"
                >
                  <Download className="w-4 h-4" />
                  Export CSV Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ALL PATIENTS TAB — Admin-only secured view
           ═══════════════════════════════════════════════ */}
        {activeTab === 'patients' && (
          <div className="space-y-4 animate-fade-in">

            {/* ── Section Header with Download Excel ────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Patient Records &amp; Medical Reports
                  <span className="text-xs font-normal bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full ml-1">
                    Admin Only
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centralized view of all patient records with uploaded reports. {adminRecords.length} patients loaded.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Active Scheduler Status Badge */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>Daily Auto-Export &amp; Reset Active (11:59 PM IST)</span>
                </div>

                <button
                  id="reset-refresh-btn"
                  onClick={handleResetAndRefresh}
                  disabled={recordsLoading}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px] border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  title="Reset search and filters, and reload records from the server"
                >
                  <RefreshCw className={`w-4 h-4 ${recordsLoading ? 'animate-spin' : ''}`} />
                  <span>Reset &amp; Refresh</span>
                </button>

                <button
                  id="download-excel-btn"
                  onClick={handleDownloadExcel}
                  disabled={excelExporting}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {excelExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  {excelExporting ? 'Generating…' : 'Download Excel'}
                </button>
              </div>
            </div>

            {/* ── Search & Filter Row ────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  id="patient-search-input"
                  placeholder="Search name or health issue…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
                {(['All', 'Home', 'In-Hospital'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filterType === type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Legend for report badge types ─────────────── */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">Report types:</span>
              {(['Blood Report', 'Scan / X-Ray', 'Prescription', 'Field Visit Photo'] as const).map(t => (
                <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${reportBadgeStyle(t)}`}>
                  <ReportTypeIcon type={t} />
                  {t}
                </span>
              ))}
            </div>

            {/* ── Patients Table with Reports Column ────────── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {recordsLoading ? (
                /* Loading skeleton */
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-1/4" />
                        <div className="h-2 bg-slate-50 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Patient</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Health Issue</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Admission</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Discharge</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Branch</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap min-w-[200px]">
                          Reports
                          <span className="ml-1 text-[10px] text-slate-400 font-normal">(click to preview)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredPatients.map(patient => {
                        // Find the enriched record (with reports) for this patient
                        const enriched = adminRecords.find(r => r.id === patient.id);
                        const reports = enriched?.reports ?? [];

                        return (
                          <tr key={patient.id} className="hover:bg-blue-50/20 transition-colors group">
                            {/* Patient Name */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                                  {patient.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 leading-tight">{patient.name}</p>
                                  <p className="text-[11px] text-slate-400">{patient.phone}</p>
                                </div>
                              </div>
                            </td>

                            {/* Health Issue */}
                            <td className="px-4 py-3">
                              <p className="text-slate-700 font-medium text-xs leading-snug">{patient.issue}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{patient.treatment}</p>
                            </td>

                            {/* Admission Date */}
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                              {formatDate(patient.entryDate)}
                            </td>

                            {/* Discharge Date */}
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              {patient.dischargeDate ? (
                                <span className="text-slate-500">{formatDate(patient.dischargeDate)}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                                  Active
                                </span>
                              )}
                            </td>

                            {/* Branch */}
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                patient.branch === 'Guntur'
                                  ? 'bg-teal-50 text-teal-700'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}>
                                {patient.branch}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                patient.status === 'Active'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {patient.status}
                              </span>
                            </td>

                            {/* Reports — serial-wise direct clickable URLs */}
                            <td className="px-4 py-3 min-w-[220px]">
                              {reports.length > 0 ? (
                                <div className="space-y-1">
                                  {reports.map((report, idx) => {
                                    const fileUrl = report.fileUrl || `http://localhost:5000/api/doctors/files/view/${report.id || 'temp'}`;
                                    return (
                                      <div key={idx} className="flex items-center gap-1.5 text-xs">
                                        <span className="font-bold text-slate-400 min-w-[14px]">{idx + 1}.</span>
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors border border-blue-200/60"
                                          title={`Click to view ${report.type} (${report.fileName}) directly in browser`}
                                        >
                                          <ReportTypeIcon type={report.type} />
                                          <span className="truncate max-w-[130px]">{report.type}</span>
                                          <ExternalLink className="w-3 h-3 text-blue-600 ml-0.5 flex-shrink-0" />
                                        </a>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openReportPreview(patient.name, report);
                                          }}
                                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100 transition-colors"
                                          title="Quick details preview"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs italic">— no reports</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredPatients.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No patients found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filter.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Table footer summary */}
              {!recordsLoading && filteredPatients.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
                  </p>
                  <p className="text-xs text-slate-400">
                    {adminRecords.filter(r => r.reports.length > 0).length} patients have uploaded reports
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            DOCTOR STATS TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            {/* Time Range Filter */}
            <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1 w-fit">
              {(['Today', 'Month', '6 Months', 'Annual'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setStatRange(range)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statRange === range
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Doctor Panels */}
            {Object.entries(DOCTOR_STATS).map(([name, stats]) => {
              const doctorPatients = patients.filter(p => p.doctor === name);
              const homeCount = doctorPatients.filter(p => p.type === 'Home').length;
              const hospCount = doctorPatients.filter(p => p.type === 'In-Hospital').length;

              return (
                <div key={name} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                      {name.split(' ')[1]?.[0]}
                    </div>
                    {name} — Full Analytics
                    <span className="ml-auto text-xs text-slate-400 font-normal">{stats.branch} Branch</span>
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Chart */}
                    <div className="lg:col-span-2 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="homeVisits" name="Home Visits" fill="#0d9488" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="inHospital" name="In-Hospital" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Summary Numbers */}
                    <div className="flex flex-col gap-3">
                      <div className="bg-teal-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-teal-600 font-medium">Home Visits</p>
                        <p className="text-2xl font-bold text-teal-700">{homeCount}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-blue-600 font-medium">In-Hospital</p>
                        <p className="text-2xl font-bold text-blue-700">{hospCount}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-slate-500 font-medium">Total Visits</p>
                        <p className="text-2xl font-bold text-slate-800">{homeCount + hospCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            HOME VISITS TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'homevisits' && (
          <div className="space-y-3 animate-fade-in">
            {homeVisitPatients.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Home className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No home visit patients</p>
              </div>
            ) : (
              homeVisitPatients.map(patient => (
                <div key={patient.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-sm font-bold text-teal-700">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{patient.name}</h4>
                        <p className="text-xs text-slate-400">{patient.phone} · {patient.branch}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {patient.visitCount} visits
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        patient.status === 'Active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {patient.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs">Issue:</span>
                      <span className="ml-1 text-slate-700">{patient.issue}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Treatment:</span>
                      <span className="ml-1 text-slate-700">{patient.treatment}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Doctor:</span>
                      <span className="ml-1 text-slate-700">{patient.doctor}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            AUDIT LOG TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Staff Login / Logout Audit Trail
            </h3>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide table-scroll-wrap">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Staff Member</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Timestamp</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...auditLog].reverse().map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{entry.staff}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            entry.action === 'Login'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.timestamp}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{entry.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ADD DOCTORS (EXCEL SPREADSHEET WORKFLOW) TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'doctors' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Description */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <FileSpreadsheet className="w-5 h-5 text-blue-200" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Integrated Excel Doctor Access Manager</h2>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm max-w-2xl">
                  Batch add, edit, or upload doctor profiles via spreadsheet workflow. Entering rows instantly generates real-time login access and permissions across the system.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, .txt"
                  ref={excelFileInputRef}
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => excelFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/20 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4 text-emerald-300" />
                  Upload Excel / CSV
                </button>

                <button
                  onClick={handleDownloadSampleTemplate}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/20 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-blue-200" />
                  Sample Template
                </button>

                <button
                  onClick={handleProvisionAccess}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/30 border border-emerald-400"
                >
                  <Save className="w-4 h-4" />
                  Provision Real-Time Access
                </button>
              </div>
            </div>

            {/* Real-time Alerts */}
            {provisionSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fade-in shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">{provisionSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setProvisionSuccessMsg(null)}
                  className="text-xs bg-emerald-200/60 hover:bg-emerald-200 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {provisionErrorMsg && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 text-amber-900 text-sm animate-fade-in shadow-sm">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="font-medium">{provisionErrorMsg}</span>
                </div>
                <button
                  onClick={() => setProvisionErrorMsg(null)}
                  className="text-xs bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Spreadsheet Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Grid Rows</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{excelRows.length}</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Provisioned (Active)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{excelRows.filter(r => r.isSaved).length}</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Draft Entries</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{excelRows.filter(r => !r.isSaved).length}</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Real-Time Access</p>
                  <p className="text-sm font-bold text-blue-600 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Synchronized
                  </p>
                </div>
                <button
                  onClick={handleExportDoctorsCSV}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-colors"
                  title="Export Doctor List as CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Excel Sheet Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Interactive Excel Spreadsheet Grid</h3>
                  <span className="text-[11px] text-slate-400 font-mono">(Direct Inline Editing Enabled)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddGridRow}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Row
                  </button>
                </div>
              </div>

              {/* Table Sheet View */}
              <div className="overflow-x-auto scrollbar-hide table-scroll-wrap">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="w-10 sm:w-12 px-2 sm:px-3 py-2.5 text-center border-r border-slate-200 bg-slate-200/50 sticky left-0 z-10">#</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 min-w-[180px]">Doctor Name *</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 min-w-[160px]">Specialty</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 min-w-[130px]">Branch</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 min-w-[140px]">New Username *</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 min-w-[140px]">New Password *</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 min-w-[150px]">Login Access Status</th>
                      <th className="w-16 px-3 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {excelRows.map((row, index) => (
                      <tr key={row.id} className={`hover:bg-blue-50/40 transition-colors ${row.isSaved ? 'bg-slate-50/30' : 'bg-amber-50/20'}`}>
                        {/* Index */}
                        <td className="px-2 sm:px-3 py-2 text-center text-slate-400 font-semibold border-r border-slate-200 bg-slate-100/40 sticky left-0 z-10">
                          {index + 1}
                        </td>

                        {/* Name */}
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.name}
                            onChange={e => handleCellChange(row.id, 'name', e.target.value)}
                            placeholder="e.g. Dr. Rajesh Sharma"
                            disabled={row.isSaved}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-sans font-medium text-slate-800 bg-white disabled:bg-transparent disabled:border-transparent text-xs"
                          />
                        </td>

                        {/* Specialty */}
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.specialty}
                            onChange={e => handleCellChange(row.id, 'specialty', e.target.value)}
                            placeholder="e.g. Cardiopulmonary Rehab"
                            disabled={row.isSaved}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-sans text-slate-600 bg-white disabled:bg-transparent disabled:border-transparent text-xs"
                          />
                        </td>

                        {/* Branch */}
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <select
                            value={row.branch}
                            onChange={e => handleCellChange(row.id, 'branch', e.target.value as Branch)}
                            disabled={row.isSaved}
                            className="w-full px-2 py-1.5 rounded border border-slate-200 focus:border-blue-500 outline-none font-sans text-xs bg-white disabled:bg-transparent disabled:border-transparent font-medium"
                          >
                            <option value="Guntur">Guntur</option>
                            <option value="Hyderabad">Hyderabad</option>
                          </select>
                        </td>

                        {/* Username */}
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.username}
                            onChange={e => handleCellChange(row.id, 'username', e.target.value)}
                            placeholder="e.g. drrajesh"
                            disabled={row.isSaved}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-slate-800 font-semibold bg-white disabled:bg-transparent disabled:border-transparent text-xs"
                          />
                        </td>

                        {/* Password */}
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.password}
                            onChange={e => handleCellChange(row.id, 'password', e.target.value)}
                            placeholder="Set password"
                            disabled={row.isSaved}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-slate-700 bg-white disabled:bg-transparent disabled:border-transparent text-xs"
                          />
                        </td>

                        {/* Login Access Status */}
                        <td className="px-3 py-2 border-r border-slate-200 font-sans">
                          {row.isSaved ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 🟢 Active & Provisioned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> 📝 Ready to Provision
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => initiateDelete(row)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title={`Revoke Access for ${row.name || 'Doctor'}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Entering a new doctor row automatically registers login credentials across both client & server databases.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddGridRow}
                    className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Blank Row
                  </button>

                  <button
                    onClick={handleProvisionAccess}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25"
                  >
                    <Save className="w-4 h-4" /> Save & Grant Doctor Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            2-STEP DELETE VERIFICATION CONFIRMATION MODAL
           ═══════════════════════════════════════════════ */}
        {deleteConfirmState?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
              {/* Step 1 Dialog */}
              {deleteConfirmState.step === 1 && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm text-amber-900">Revoke Access — Step 1 of 2</h3>
                      <p className="text-xs text-amber-700">First-level confirmation check</p>
                    </div>
                  </div>

                  <div className="py-2">
                    <p className="text-slate-800 font-semibold text-base leading-relaxed">
                      Do you really want to remove the access to the <span className="text-blue-700 underline font-bold">{deleteConfirmState.doctorRow.name || deleteConfirmState.doctorRow.username || 'selected'}</span> doctor?
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      This will initiate the credentials revocation procedure. A second confirmation will be required to proceed.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmState(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleStep1Confirm}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 Dialog (Final Warning) */}
              {deleteConfirmState.step === 2 && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    <Trash2 className="w-6 h-6 flex-shrink-0 text-red-600" />
                    <div>
                      <h3 className="font-bold text-sm text-red-900">Final Confirmation — Step 2 of 2</h3>
                      <p className="text-xs text-red-700">Irreversible access revocation warning</p>
                    </div>
                  </div>

                  <div className="py-2 bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <p className="text-red-900 font-bold text-base leading-relaxed">
                      Final Warning: This will permanently revoke system access for <span className="underline font-extrabold">{deleteConfirmState.doctorRow.name || deleteConfirmState.doctorRow.username || 'this doctor'}</span>. Proceed?
                    </p>
                    <p className="text-red-700 text-xs mt-2 font-medium">
                      ⚠️ The doctor will no longer be able to log into their dashboard, and their login credentials will be deactivated in real time across the network.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmState(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalDeleteRevoke}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-red-500/25 border border-red-500 flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Yes, Permanently Revoke Access
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ═══════════════════════════════════════════════
            REPORT PREVIEW MODAL
           ═══════════════════════════════════════════════ */}
        {previewModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Report Details
                </h3>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl border ${reportBadgeStyle(previewModal.report.type).split('hover:')[0]}`}>
                    <ReportTypeIcon type={previewModal.report.type} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{previewModal.report.type}</p>
                    <p className="text-lg font-bold text-slate-800 mt-1 break-all">{previewModal.report.fileName}</p>
                  </div>
                </div>

                {previewModal.report.fileData && previewModal.report.fileData.startsWith('data:image') && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 text-center">
                    <img
                      src={previewModal.report.fileData}
                      alt={previewModal.report.fileName}
                      className="max-h-60 mx-auto rounded-lg object-contain"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Patient</p>
                    <p className="text-sm font-semibold text-slate-700">{previewModal.patientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Uploaded By</p>
                    <p className="text-sm font-semibold text-slate-700">{previewModal.report.doctorName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-1">Upload Date</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {new Date(previewModal.report.timestamp).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setPreviewModal(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const url = previewModal.report.fileUrl;
                    if (url) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                      alert(`In a production environment, this would download or open the file:\n\n${previewModal.report.fileName}`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Download className="w-4 h-4" />
                  {previewModal.report.fileUrl ? 'Open File' : 'Simulate Download'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

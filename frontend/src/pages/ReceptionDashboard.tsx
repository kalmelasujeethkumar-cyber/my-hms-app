/* ============================================================
   VPC-HMS — Reception Dashboard
   Branch-specific patient registry. Identical layout for both
   Guntur and Hyderabad — data is filtered by branch.
   ============================================================ */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users, Activity, Home, UserCheck, Plus, Search, X,
  Phone, Calendar, Stethoscope, Camera, Upload, FileText, Trash2,
} from 'lucide-react';
import type { Branch, VisitType } from '../types';

/** Format date for display */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Active';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TREATMENT_OPTIONS = [
  'Manual Therapy',
  'Exercise Therapy',
  'Electrotherapy',
  'Hydrotherapy',
  'Heat & Cold Therapy',
  'Dry Needling / Acupuncture',
  'Vestibular Rehabilitation',
  'Respiratory Physiotherapy',
  'Pelvic Floor Physiotherapy',
  'Taping & Strapping',
  'Patient Education & Ergonomics',
] as const;

interface Props {
  /** Which branch this reception desk belongs to */
  branch: Branch;
}

export default function ReceptionDashboard({ branch }: Props) {
  const { patients, addPatient, dischargePatient, addUpload, allUsers } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sourced from HOD doctor list (single source of truth)
  const activeDoctors = useMemo(() => {
    return allUsers.filter(u => u.role === 'doctor');
  }, [allUsers]);

  // Form state for new patient
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formIssue, setFormIssue] = useState('');
  const [formTreatment, setFormTreatment] = useState<string>('Manual Therapy');
  const [formEntryDate, setFormEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [formVisitType, setFormVisitType] = useState<VisitType>('Home');
  const [formDoctor, setFormDoctor] = useState('');

  // Camera & File Upload state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string; dataUrl?: string }[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Body scroll-lock when modal is open (fixes iOS Safari background scroll) ──
  useEffect(() => {
    if (showAddForm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAddForm]);

  // ── Camera Control ──────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || 'Could not access camera');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploadedFiles(prev => [
          ...prev,
          {
            name: file.name,
            size: (file.size / 1024 < 1024) ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type || 'Document',
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetMediaState = () => {
    stopCamera();
    setPhotoDataUrl(null);
    setUploadedFiles([]);
    setCameraError(null);
  };

  // ── Branch-specific data ────────────────────────────────
  const branchDoctor = branch === 'Guntur' ? 'Dr. Manish' : 'Dr. Krupakar';
  const branchTimings = '8:00 AM – 8:00 PM';

  const branchPatients = useMemo(() => {
    let result = patients.filter(p => p.branch === branch);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.issue.toLowerCase().includes(q)
      );
    }
    return result;
  }, [patients, branch, searchQuery]);

  const totalPatients = branchPatients.length;
  const activeCount = branchPatients.filter(p => p.status === 'Active').length;
  const homeVisitsCount = branchPatients.filter(p => p.type === 'Home').length;
  const dischargedCount = branchPatients.filter(p => p.status === 'Discharged').length;

  // ── Handle form submission ──────────────────────────────
  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formIssue.trim() || !formDoctor) return;

    // Mobile number validation (exactly 10 numeric digits)
    const phoneVal = formPhone.trim();
    if (phoneVal.length !== 10 || !/^\d{10}$/.test(phoneVal)) {
      setPhoneError('Mobile number must be exactly 10 digits');
      return;
    }

    setPhoneError('');
    const assignedDoctor = formDoctor;
    const createdPatientName = formName.trim();

    const newPatient = addPatient({
      name: createdPatientName,
      phone: phoneVal,
      issue: formIssue.trim(),
      treatment: formTreatment || 'Manual Therapy',
      entryDate: formEntryDate,
      dischargeDate: null,
      type: formVisitType,
      status: 'Active',
      branch,
      doctor: assignedDoctor,
      visitCount: 1,
    });

    // Save registration photo or uploaded files as medical report records
    if (photoDataUrl) {
      const uploadId = `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const baseUrl = 'http://localhost:5000';
      addUpload({
        id: uploadId,
        patientId: newPatient?.id,
        doctorName: assignedDoctor,
        patientName: createdPatientName,
        type: 'Field Visit Photo',
        fileName: `registration_photo_${Date.now()}.png`,
        timestamp: new Date().toISOString(),
        fileUrl: `${baseUrl}/api/doctors/files/view/${uploadId}`,
        fileData: photoDataUrl,
      });
    }

    uploadedFiles.forEach((fileItem, idx) => {
      const uploadId = `up-${Date.now() + idx + 1}-${Math.random().toString(36).slice(2, 7)}`;
      const baseUrl = 'http://localhost:5000';
      addUpload({
        id: uploadId,
        patientId: newPatient?.id,
        doctorName: assignedDoctor,
        patientName: createdPatientName,
        type: 'Blood Report',
        fileName: fileItem.name,
        timestamp: new Date().toISOString(),
        fileUrl: `${baseUrl}/api/doctors/files/view/${uploadId}`,
        fileData: fileItem.dataUrl || null,
      });
    });

    // Reset form
    setFormName('');
    setFormPhone('');
    setPhoneError('');
    setFormIssue('');
    setFormTreatment('Manual Therapy');
    setFormEntryDate(new Date().toISOString().split('T')[0]);
    setFormVisitType('Home');
    setFormDoctor('');
    resetMediaState();
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branch Info Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-3">
        <p className="text-xs sm:text-sm text-slate-500 truncate">
          🕐 Branch Timings: {branchTimings} · Emergency: 24/7
        </p>
      </div>

      <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* ── Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Patients', value: totalPatients, icon: Users, color: 'blue' },
            { label: 'Active', value: activeCount, icon: Activity, color: 'green' },
            { label: 'Home Visits', value: homeVisitsCount, icon: Home, color: 'teal' },
            { label: 'Discharged', value: dischargedCount, icon: UserCheck, color: 'slate' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight">{stat.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-${stat.color}-50 flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Patient Registry ──────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 sm:p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-base sm:text-lg">Patient Registry</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
              Add Patient
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>

          {/* Patient List */}
          <div className="divide-y divide-slate-50">
            {branchPatients.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No patients found</p>
              </div>
            ) : (
              branchPatients.map(patient => (
                <div key={patient.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0 mt-0.5">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{patient.name}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {patient.phone}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {formatDate(patient.entryDate)}
                        </p>
                        <div className="mt-2 text-sm text-slate-600">
                          <p><span className="text-slate-400">Issue:</span> {patient.issue}</p>
                          <p><span className="text-slate-400">Treatment:</span> {patient.treatment}</p>
                          <p><span className="text-slate-400">Doctor:</span> {patient.doctor}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        patient.type === 'Home'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {patient.type === 'Home' ? '🏠' : '🏥'} {patient.type}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        patient.status === 'Active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {patient.status}
                      </span>
                      {patient.status === 'Active' && (
                        <button
                          onClick={() => dischargePatient(patient.id)}
                          className="text-xs bg-slate-100 text-slate-600 px-2.5 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          ✓ Mark Discharged
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          ADD PATIENT MODAL
         ═══════════════════════════════════════════════ */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-fade-in">
            {/* Sticky Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Register New Patient
              </h2>
              <button
                onClick={() => { resetMediaState(); setShowAddForm(false); }}
                aria-label="Close modal"
                className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto flex-1">
            <form onSubmit={handleAddPatient} className="p-4 sm:p-5 space-y-4">
              {/* Photo & Document Upload Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Patient Photo & Documents
                </label>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  ref={cameraFileInputRef}
                  onChange={handleCameraFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Camera Capture Live Area */}
                {isCameraActive ? (
                  <div className="relative rounded-lg overflow-hidden bg-black flex flex-col items-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
                    <div className="absolute bottom-2 flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-blue-700 shadow"
                      >
                        <Camera className="w-3.5 h-3.5" /> Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-slate-800 shadow"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Photo Thumbnail / Placeholder */}
                    <div className="relative w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden flex-shrink-0">
                      {photoDataUrl ? (
                        <>
                          <img src={photoDataUrl} alt="Patient" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotoDataUrl(null)}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          Camera Capture
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          Device Storage
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Capture photo via camera or upload images & medical documents.
                      </p>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {cameraError}
                  </p>
                )}

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500">Uploaded Documents ({uploadedFiles.length}):</p>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span className="truncate font-medium text-slate-700">{file.name}</span>
                            <span className="text-[10px] text-slate-400">({file.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(idx)}
                            className="text-slate-400 hover:text-red-500 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Patient full name"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              {/* Issue */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Issue / Diagnosis *
                </label>
                <input
                  type="text"
                  value={formIssue}
                  onChange={e => setFormIssue(e.target.value)}
                  placeholder="e.g. Hypertension"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  id="patient-mobile-input"
                  value={formPhone}
                  maxLength={10}
                  required
                  onChange={e => {
                    const raw = e.target.value;
                    const numeric = raw.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormPhone(numeric);
                    if (raw !== numeric) {
                      setPhoneError('Only numeric digits (0–9) are allowed');
                    } else if (numeric.length > 0 && numeric.length < 10) {
                      setPhoneError(`${10 - numeric.length} more digit(s) required`);
                    } else {
                      setPhoneError('');
                    }
                  }}
                  onKeyDown={e => {
                    const allowed = [
                      'Backspace', 'Delete', 'Tab', 'Enter',
                      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                      'Home', 'End',
                    ];
                    if (e.ctrlKey || e.metaKey) return;
                    if (allowed.includes(e.key)) return;
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                      setPhoneError('Only numeric digits (0–9) are allowed');
                    }
                  }}
                  onPaste={e => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text');
                    const numeric = pasted.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormPhone(numeric);
                    if (pasted !== numeric) {
                      setPhoneError('Non-numeric characters were removed — only digits allowed');
                    } else {
                      setPhoneError('');
                    }
                  }}
                  placeholder="10-digit number"
                  className={`w-full px-3 py-2.5 rounded-lg border text-base sm:text-sm outline-none transition-all ${
                    phoneError
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {phoneError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> {phoneError}
                  </p>
                )}
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Treatment Plan
                </label>
                <select
                  value={formTreatment}
                  onChange={e => setFormTreatment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white font-medium text-slate-800 min-h-[44px]"
                >
                  {TREATMENT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entry Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Entry Date
                </label>
                <input
                  type="date"
                  value={formEntryDate}
                  onChange={e => setFormEntryDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[44px]"
                />
              </div>

              {/* Visit Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Visit Type
                </label>
                <select
                  value={formVisitType}
                  onChange={e => setFormVisitType(e.target.value as VisitType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white min-h-[44px]"
                >
                  <option value="Home">Home</option>
                  <option value="In-Hospital">In-Hospital</option>
                </select>
              </div>

              {/* Assigned Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Assigned Doctor *
                </label>
                <select
                  value={formDoctor}
                  onChange={e => setFormDoctor(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white min-h-[44px]"
                >
                  <option value="">-- Select Assigned Doctor --</option>
                  {activeDoctors.map(doc => (
                    <option key={doc.id} value={doc.doctorName || doc.name}>
                      {doc.name} ({doc.username})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 text-sm min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Register Patient
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MediCare HMS — Doctor Dashboard
   Four tabs: Today's Visits, Session Timer, Upload Reports,
   GPS Tracking. Each doctor only sees their own patients.
   ============================================================ */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { DOCTOR_STATS } from '../data/mockData';
import {
  Users, Activity, Calendar, TrendingUp, Play, Square,
  Upload, MapPin, Clock, FileText, Image, Pill, Camera,
  Navigation, ExternalLink, CheckCircle,
} from 'lucide-react';
import type { GPSLocation } from '../types';

type Tab = 'visits' | 'timer' | 'upload' | 'gps';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'visits', label: "Today's Visits", icon: Calendar },
  { key: 'timer', label: 'Session Timer', icon: Clock },
  { key: 'upload', label: 'Upload Reports', icon: Upload },
  { key: 'gps', label: 'GPS Tracking', icon: MapPin },
];

/** Upload card types for the Upload Reports tab */
const UPLOAD_TYPES = [
  { type: 'Blood Report' as const, icon: FileText, color: 'red' },
  { type: 'Scan / X-Ray' as const, icon: Image, color: 'blue' },
  { type: 'Prescription' as const, icon: Pill, color: 'green' },
  { type: 'Field Visit Photo' as const, icon: Camera, color: 'amber' },
];

/** Format seconds into MM:SS display */
function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function DoctorDashboard() {
  const { currentUser, patients, saveSessionNote, addUpload } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('visits');

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // GPS state
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<GPSLocation[]>([]);
  const [gpsError, setGpsError] = useState('');
  const gpsWatchRef = useRef<number | null>(null);

  // Upload success state
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // ── Doctor-specific data ────────────────────────────────
  const doctorName = currentUser?.doctorName || currentUser?.name || '';
  const stats = DOCTOR_STATS[doctorName as keyof typeof DOCTOR_STATS];
  const branch = currentUser?.branch || 'Guntur';

  const myPatients = useMemo(
    () => patients.filter(p => p.doctor === doctorName && p.status === 'Active'),
    [patients, doctorName]
  );

  const myHomePatients = useMemo(
    () => myPatients.filter(p => p.type === 'Home'),
    [myPatients]
  );

  // ── Timer Logic ─────────────────────────────────────────
  const startTimer = useCallback(() => {
    setTimerRunning(true);
    setNotesSaved(false);
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSaveNotes = () => {
    if (stats && sessionNotes.trim()) {
      saveSessionNote({
        doctorName,
        patientName: stats.activePatient,
        notes: sessionNotes,
        durationSeconds: timerSeconds,
        timestamp: new Date().toISOString(),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── GPS Logic ───────────────────────────────────────────
  const enableGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: GPSLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          patient: stats?.activePatient,
          location: branch,
        };
        setCurrentLocation(loc);
        setLocationHistory(prev => [loc, ...prev]);
        setGpsEnabled(true);
        setGpsError('');
      },
      (error) => {
        setGpsError(`GPS Error: ${error.message}`);
      },
      { enableHighAccuracy: true }
    );

    // Watch for continuous updates
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const loc: GPSLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
        setCurrentLocation(loc);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
  };

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  // ── File Upload Handler ─────────────────────────────────
  const handleFileUpload = (type: typeof UPLOAD_TYPES[number]['type']) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'Field Visit Photo' || type === 'Scan / X-Ray' ? 'image/*' : '.pdf,.doc,.docx,.jpg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        addUpload({
          doctorName,
          patientName: stats?.activePatient || 'Unknown',
          type,
          fileName: file.name,
          timestamp: new Date().toISOString(),
        });
        setUploadSuccess(type);
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    };
    input.click();
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

      <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto">
        {/* ── Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {[
            { label: 'My Patients', value: myPatients.length, icon: Users, color: 'blue' },
            { label: 'Active Home Visits', value: myHomePatients.length, icon: Activity, color: 'teal' },
            { label: 'This Month', value: stats?.thisMonth || 0, icon: Calendar, color: 'indigo' },
            { label: 'Annual Total', value: stats?.annualTotal || 0, icon: TrendingUp, color: 'emerald' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide truncate leading-tight min-w-0 pr-1">{stat.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-${stat.color}-50 flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            TODAY'S VISITS TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'visits' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-800">Active Home Visit Patients</h3>
            {myHomePatients.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400">No active home visits today</p>
              </div>
            ) : (
              myHomePatients.map(patient => (
                <div key={patient.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-sm font-bold text-teal-700">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{patient.name}</h4>
                        <p className="text-xs text-slate-400">{patient.phone} · {patient.branch}</p>
                        <div className="mt-1 text-sm text-slate-600">
                          <span className="text-slate-400">Issue:</span> {patient.issue} ·{' '}
                          <span className="text-slate-400">Treatment:</span> {patient.treatment}
                        </div>
                        <p className="text-xs text-blue-600 font-medium mt-1">Visit #{patient.visitCount}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => { setActiveTab('timer'); }}
                        className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors min-h-[44px]"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start Session
                      </button>
                      <button
                        onClick={() => { setActiveTab('upload'); }}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Report
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SESSION TIMER TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'timer' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-800">Treatment Session Timer</h3>

            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm text-center">
              <p className="text-sm text-slate-500 mb-1">Current Patient</p>
              <h4 className="text-xl font-bold text-slate-800 mb-6">{stats?.activePatient || 'No active patient'}</h4>

              {/* Timer Display */}
              <div className="text-6xl font-mono font-bold text-slate-800 mb-6 tracking-wider">
                {formatTimer(timerSeconds)}
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center gap-3">
                {!timerRunning ? (
                  <button
                    onClick={startTimer}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/25"
                  >
                    <Play className="w-5 h-5" />
                    Start Treatment
                  </button>
                ) : (
                  <button
                    onClick={stopTimer}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Session Notes */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <h4 className="font-semibold text-slate-800 mb-3">Session Notes</h4>
              <textarea
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="Enter treatment notes, observations, or follow-up instructions…"
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={handleSaveNotes}
                  disabled={!sessionNotes.trim()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <FileText className="w-4 h-4" />
                  Save Notes to HOD
                </button>
                {notesSaved && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1 animate-fade-in">
                    <CheckCircle className="w-4 h-4" />
                    Saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            UPLOAD REPORTS TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-800">Upload Medical Reports to HOD</h3>

            {uploadSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                {uploadSuccess} uploaded successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {UPLOAD_TYPES.map(item => (
                <div key={item.type} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-${item.color}-50 flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.type}</h4>
                      <p className="text-xs text-slate-400">Uploads directly to HOD dashboard</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFileUpload(item.type)}
                    className="w-full py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <Upload className="w-4 h-4 inline mr-1.5" />
                    Upload
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            GPS TRACKING TAB
           ═══════════════════════════════════════════════ */}
        {activeTab === 'gps' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-800">Real-Time GPS Tracking</h3>
            <p className="text-sm text-slate-500">Enable GPS to share your live location with the HOD dashboard</p>

            {gpsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {gpsError}
              </div>
            )}

            {!gpsEnabled ? (
              <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm text-center">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <button
                  onClick={enableGPS}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                  <Navigation className="w-5 h-5" />
                  📍 Enable GPS Location
                </button>
              </div>
            ) : (
              <>
                {/* Live Status Card */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-live" />
                    <span className="font-semibold text-green-800">GPS Active — Broadcasting to HOD</span>
                  </div>
                  {currentLocation && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-green-600">Latitude:</span>
                        <span className="ml-1 font-mono text-green-800">{currentLocation.lat.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Longitude:</span>
                        <span className="ml-1 font-mono text-green-800">{currentLocation.lng.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Accuracy:</span>
                        <span className="ml-1 text-green-800">±{currentLocation.accuracy.toFixed(0)}m</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-green-600">Updated: {currentLocation?.timestamp}</span>
                    {currentLocation && (
                      <a
                        href={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* Location History */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Today's Location History
                  </h4>
                  {locationHistory.length === 0 ? (
                    <p className="text-sm text-slate-400">No location history yet</p>
                  ) : (
                    <div className="space-y-3">
                      {locationHistory.map((loc, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                            {idx < locationHistory.length - 1 && (
                              <div className="w-0.5 bg-slate-200 mt-1 flex-grow min-h-[32px]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">{loc.timestamp}</p>
                            <p className="text-xs text-slate-400">
                              {loc.patient ? `Patient: ${loc.patient} — ${loc.location}` : `Location update`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

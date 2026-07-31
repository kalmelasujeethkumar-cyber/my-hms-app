/* ============================================================
   VPC-HMS — App Router & Layout
   Routes users to their role-specific dashboard after login.
   Wraps each dashboard in a consistent header layout.
   ============================================================ */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import { Heart, LogOut } from 'lucide-react';

/** Get today's date as a readable string */
function getTodayString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Dashboard header wrapper with logo, user info, and logout */
function DashboardLayout({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40 safe-top">
        <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight truncate">{title}</h1>
            </div>
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">{currentUser?.name}</p>
              <p className="text-xs text-slate-400">{getTodayString()}</p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {/* Subtitle bar */}
        <div className="px-3 sm:px-6 py-1.5 sm:py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] sm:text-xs text-slate-500 truncate">{subtitle}</p>
        </div>
      </header>

      {/* Page Content */}
      {children}
    </div>
  );
}

/** Protected route that redirects to login if not authenticated */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** Main dashboard router — selects the right dashboard based on user role */
function DashboardRouter() {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  switch (currentUser.role) {
    case 'admin':
      return (
        <DashboardLayout
          title="VPC-HMS"
          subtitle={`Head of Department Dashboard — Full oversight - Guntur & Hyderabad — ${getTodayString()}`}
        >
          <AdminDashboard />
        </DashboardLayout>
      );

    case 'reception':
      return (
        <DashboardLayout
          title="VPC-HMS"
          subtitle={`Reception — ${currentUser.branch} Branch`}
        >
          <ReceptionDashboard branch={currentUser.branch!} />
        </DashboardLayout>
      );

    case 'doctor':
      return (
        <DashboardLayout
          title="VPC-HMS"
          subtitle={`${currentUser.name} — Home Service Specialist — ${getTodayString()}`}
        >
          <DoctorDashboard />
        </DashboardLayout>
      );

    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

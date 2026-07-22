/* ============================================================
   MediCare HMS — Login Page
   Animated gradient background, glass card, 5 quick-access
   role buttons for demo convenience.
   ============================================================ */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Lock, User, Shield, Stethoscope, Building2, Key, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUserDirectory, setShowUserDirectory] = useState(false);

  const { login, allUsers } = useAuth();
  const navigate = useNavigate();

  /** Handle form submission or quick-role click */
  const handleLogin = (uname: string, pwd: string) => {
    setIsLoading(true);
    setError('');

    // Simulate brief loading for UX
    setTimeout(() => {
      const success = login(uname, pwd);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 400);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  const onQuickRole = (uname: string, pwd: string) => {
    setUsername(uname);
    setPassword(pwd);
    handleLogin(uname, pwd);
  };

  // Build role buttons dynamically from allUsers
  const adminUser = allUsers.find(u => u.role === 'admin') || { username: 'admin', password: 'admin', name: 'HOD / Admin' };
  const gunturRecep = allUsers.find(u => u.role === 'reception' && u.branch === 'Guntur') || { username: 'guntur', password: 'guntur', name: 'Reception - Guntur' };
  const hydRecep = allUsers.find(u => u.role === 'reception' && u.branch === 'Hyderabad') || { username: 'hyderabad', password: 'hyderabad', name: 'Reception - HYD' };
  const doctorUsers = allUsers.filter(u => u.role === 'doctor');

  return (
    <div className="login-gradient min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg animate-fade-in space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Heart className="w-7 h-7 text-blue-300" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">MediCare HMS</span>
          </div>
          <p className="text-xs text-blue-200">Health Management System · Multi-Branch & Doctor Portal</p>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-2xl shadow-2xl p-5 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your secure staff portal</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Username field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-base sm:text-sm transition-all bg-white"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-base sm:text-sm transition-all bg-white"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                {error}
              </div>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-60 text-sm min-h-[48px]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Quick Access Role Buttons (Dynamically includes newly added doctors) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Quick Access — Real-Time Roles ({allUsers.length})
            </p>
            <button
              type="button"
              onClick={() => setShowUserDirectory(!showUserDirectory)}
              className="text-xs text-blue-200 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              {showUserDirectory ? 'Hide Credentials Table' : 'View Access Directory'}
              {showUserDirectory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="max-h-[40vh] overflow-y-auto scrollbar-hide grid grid-cols-2 gap-2 pr-0.5">
            {/* Core Admin & Reception Buttons */}
            <button
              onClick={() => onQuickRole(adminUser.username, adminUser.password)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 text-white text-xs font-medium hover:opacity-90 transition-all shadow-md border border-white/10"
            >
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">HOD / Admin</span>
            </button>

            <button
              onClick={() => onQuickRole(gunturRecep.username, gunturRecep.password)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-teal-700 text-white text-xs font-medium hover:opacity-90 transition-all shadow-md border border-white/10"
            >
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Reception - Guntur</span>
            </button>

            <button
              onClick={() => onQuickRole(hydRecep.username, hydRecep.password)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs font-medium hover:opacity-90 transition-all shadow-md border border-white/10"
            >
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Reception - HYD</span>
            </button>

            {/* Dynamic Doctors List */}
            {doctorUsers.map((doc, idx) => (
              <button
                key={doc.id || doc.username}
                onClick={() => onQuickRole(doc.username, doc.password)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all shadow-md border border-white/10 ${
                  idx % 2 === 0
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-800'
                    : 'bg-gradient-to-r from-purple-600 to-purple-800'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 flex-shrink-0 text-indigo-200" />
                <span className="truncate">{doc.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User and Access Login Credentials Management Table */}
        {showUserDirectory && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20 animate-fade-in text-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                User & Access Login Directory
              </h3>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Live Provisioned
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="px-2.5 py-1.5 font-semibold">User Profile</th>
                    <th className="px-2.5 py-1.5 font-semibold">Role</th>
                    <th className="px-2.5 py-1.5 font-semibold">Username</th>
                    <th className="px-2.5 py-1.5 font-semibold">Password</th>
                    <th className="px-2.5 py-1.5 font-semibold text-right">Access Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => onQuickRole(u.username, u.password)}
                      className="hover:bg-blue-50/60 cursor-pointer transition-colors"
                      title="Click to sign in with this profile"
                    >
                      <td className="px-2.5 py-2 font-medium text-slate-800">
                        {u.name}
                        {u.specialty && <span className="block text-[10px] text-slate-400 font-normal">{u.specialty}</span>}
                      </td>
                      <td className="px-2.5 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'reception' ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 font-mono text-slate-700">{u.username}</td>
                      <td className="px-2.5 py-2 font-mono text-slate-700">{u.password}</td>
                      <td className="px-2.5 py-2 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Click any row to automatically authenticate as that user profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

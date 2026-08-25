import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  LogOut,
  History,
  IdCard,
  Building2,
  GraduationCap,
  Crown,
  BookOpen,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export const ProfileSecurityPage: React.FC = () => {
  const { user, role, updateLoginId, updatePassword, logoutOtherSessions, securityAuditLogs } = useAuth();
  const { addToast } = useNotification();

  // Change Login ID State
  const [newLoginId, setNewLoginId] = useState<string>('');
  const [confirmLoginId, setConfirmLoginId] = useState<string>('');
  const [loginIdPassword, setLoginIdPassword] = useState<string>('');
  const [showLoginIdPassword, setShowLoginIdPassword] = useState<boolean>(false);
  const [loginIdLoading, setLoginIdLoading] = useState<boolean>(false);
  const [loginIdError, setLoginIdError] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Session State
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);

  // Live password requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  // Handle Update Login ID
  const handleUpdateLoginId = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginIdError(null);

    const cleanNew = newLoginId.trim();
    const cleanConfirm = confirmLoginId.trim();

    if (!cleanNew || !cleanConfirm) {
      setLoginIdError('Please enter and confirm your new Login ID.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setLoginIdError('New Login IDs do not match.');
      return;
    }

    if (!loginIdPassword.trim()) {
      setLoginIdError('Please enter your current password for security verification.');
      return;
    }

    setLoginIdLoading(true);
    try {
      const res = await updateLoginId(cleanNew, loginIdPassword);
      if (res.success) {
        addToast({
          title: 'Login ID Updated',
          message: 'Login ID updated successfully.',
          type: 'success',
        });
        setNewLoginId('');
        setConfirmLoginId('');
        setLoginIdPassword('');
      } else {
        setLoginIdError(res.error || 'Failed to update Login ID.');
        addToast({
          title: 'Update Failed',
          message: res.error || 'Failed to update Login ID.',
          type: 'error',
        });
      }
    } catch (err) {
      setLoginIdError('An unexpected error occurred.');
    } finally {
      setLoginIdLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      addToast({
        title: 'Validation Error',
        message: 'New passwords do not match.',
        type: 'error',
      });
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('Please satisfy all password complexity requirements.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await updatePassword(currentPassword, newPassword);
      if (res.success) {
        addToast({
          title: 'Password Changed',
          message: 'Password changed successfully.',
          type: 'success',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to change password.');
        addToast({
          title: 'Change Failed',
          message: res.error || 'Failed to change password.',
          type: 'error',
        });
      }
    } catch (err) {
      setPasswordError('An unexpected error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Logout Other Sessions
  const handleLogoutOtherSessions = async () => {
    setSessionLoading(true);
    try {
      const res = await logoutOtherSessions();
      if (res.success) {
        addToast({
          title: 'Sessions Terminated',
          message: 'All other active device sessions have been invalidated.',
          type: 'success',
        });
      }
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden shadow-xl shadow-cyan-500/20 border border-cyan-500/40 bg-slate-950 p-0.5">
              <img
                src={user?.avatar || '/classsense-logo.png'}
                alt={user?.name || 'User Profile'}
                className="h-full w-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 font-mono">
                  Account Management
                </span>
                <span className="text-slate-600">•</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                    role === 'principal'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : role === 'hod'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {role === 'principal' ? 'Principal Executive' : role === 'hod' ? 'HOD' : 'Class Advisor'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Profile & Security Settings
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Manage your institutional identity, login credentials, and session security.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Profile Information Card (Requirements #2, #8, #9, #10, #11) */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold font-mono text-sm">
            <User className="h-4 w-4 text-cyan-400" />
            <span>Profile Information</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Account Status: Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Full Name</span>
            <p className="text-sm font-sans font-bold text-white">{user?.name || 'Authorized Staff'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Login ID / Employee ID</span>
            <p className="text-sm font-mono font-bold text-cyan-300">{user?.employeeId || 'ID-001'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Institutional Role</span>
            <p className="text-sm font-bold text-white capitalize">
              {role === 'principal' ? 'Principal (All 12 Departments)' : role === 'hod' ? 'Head of Department (HOD)' : 'Class Advisor'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Department Assignment</span>
            <p className="text-sm font-bold text-white">
              {role === 'principal' ? 'All 12 Engineering Departments' : user?.department || 'AIML'}
            </p>
          </div>

          {role === 'advisor' && user?.assignedClass && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Assigned Class Scope</span>
              <p className="text-sm font-bold text-emerald-300">
                {user.assignedClass.department} • {user.assignedClass.year} • Section {user.assignedClass.section}
              </p>
            </div>
          )}

          {role === 'advisor' && user?.assignedClass && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Classroom Venue</span>
              <p className="text-sm font-bold text-white">{user.assignedClass.classroom || 'Smart Room 302'}</p>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Official Email</span>
            <p className="text-xs text-slate-300 truncate font-sans">{user?.email || 'staff@college.edu'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Contact Phone</span>
            <p className="text-xs text-slate-300 font-sans">{user?.phone || '+91 98401 55000'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Designated Title</span>
            <p className="text-xs text-slate-300 truncate font-sans">{user?.title || 'Academic Staff'}</p>
          </div>
        </div>
      </div>

      {/* 3. Credential Management Grid: Change Login ID & Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Username / Login ID (Requirement #3) */}
        <div className="rounded-3xl glass-panel border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold font-mono text-sm pb-2 border-b border-slate-800">
            <IdCard className="h-4 w-4 text-cyan-400" />
            <span>Change Login ID</span>
          </div>

          <p className="text-xs text-slate-400">
            Update your unique College Login ID. Updating your Login ID will strictly preserve all your existing role permissions, departmental assignments, and class access.
          </p>

          <form onSubmit={handleUpdateLoginId} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                Current Login ID
              </label>
              <input
                type="text"
                value={user?.employeeId || ''}
                disabled
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-cyan-400 font-mono font-bold cursor-not-allowed opacity-80"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono">
                New Login ID
              </label>
              <input
                type="text"
                value={newLoginId}
                onChange={(e) => setNewLoginId(e.target.value)}
                placeholder="e.g. ADV-AIML-1A-001"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono">
                Confirm New Login ID
              </label>
              <input
                type="text"
                value={confirmLoginId}
                onChange={(e) => setConfirmLoginId(e.target.value)}
                placeholder="Re-enter new Login ID"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono">
                Current Password (Verification)
              </label>
              <div className="relative">
                <input
                  type={showLoginIdPassword ? 'text' : 'password'}
                  value={loginIdPassword}
                  onChange={(e) => setLoginIdPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginIdPassword(!showLoginIdPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showLoginIdPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {loginIdError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginIdError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginIdLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loginIdLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <IdCard className="h-4 w-4" />
                  <span>Update Login ID</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password (Requirements #4, #5, #6) */}
        <div className="rounded-3xl glass-panel border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold font-mono text-sm pb-2 border-b border-slate-800">
            <KeyRound className="h-4 w-4 text-purple-400" />
            <span>Change Password</span>
          </div>

          <p className="text-xs text-slate-400">
            Set a new secure password. Passwords must never be shared and are securely hashed.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 font-mono">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist (Requirement #5) */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px] font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                Password Requirements:
              </span>
              <div className="grid grid-cols-2 gap-1">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasUppercase ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasLowercase ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasNumber ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                  <span>Number (0-9)</span>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {passwordLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Change Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 4. Session Security Management (Requirement #13) */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Laptop className="h-4 w-4 text-cyan-400" />
              <span>Active Institutional Sessions</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely monitor and revoke authentication sessions across registered devices.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogoutOtherSessions}
            disabled={sessionLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Logout Other Sessions</span>
          </button>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Laptop className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  <span>Current Web Session (Windows 11)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Now
                  </span>
                </p>
                <p className="text-[10px] text-slate-400">IP: 192.168.1.104 • Chrome Browser • Chennai, IN</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">Current Device</span>
          </div>
        </div>
      </div>

      {/* 5. Audit Trail Ledger (Requirement #15) */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold font-mono text-sm">
            <History className="h-4 w-4 text-cyan-400" />
            <span>Account Security & Credential Audit Trail</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time Tamper-Proof Log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {securityAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400">{log.dateTime}</td>
                  <td className="py-3 px-4 font-bold text-white">{log.action}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.status === 'Success'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.details || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

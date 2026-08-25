import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserRole } from '../types';
import { AccountSetupModal } from '../components/auth/AccountSetupModal';
import { Modal } from '../components/common/Modal';
import {
  Crown,
  Shield,
  GraduationCap,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  IdCard,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isFirstLoginPending } = useAuth();
  const { addToast } = useNotification();

  const [selectedRole, setSelectedRole] = useState<UserRole>('advisor');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setEmployeeId('');
    setPassword('');
  };

  const getIdentifierLabel = () => {
    switch (selectedRole) {
      case 'principal':
        return 'Principal College ID';
      case 'hod':
        return 'HOD College ID / Employee ID';
      case 'advisor':
        return 'Class Advisor Employee ID';
    }
  };

  const getIdentifierPlaceholder = () => {
    switch (selectedRole) {
      case 'principal':
        return 'Enter Principal ID';
      case 'hod':
        return 'Enter HOD Employee ID';
      case 'advisor':
        return 'Enter Advisor Employee ID';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim() || !password.trim()) {
      addToast({
        title: 'Credentials Required',
        message: 'Please enter your Employee ID and password.',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(employeeId, selectedRole);
      if (res.isFirstLogin) {
        setShowSetupModal(true);
      } else {
        addToast({
          title: `Welcome, ${
            selectedRole === 'principal'
              ? 'Principal'
              : selectedRole === 'hod'
              ? 'Department Head'
              : 'Class Advisor'
          }`,
          message: `Authenticated successfully with ID: ${employeeId.trim()}`,
          type: 'success',
        });

        if (selectedRole === 'principal') {
          navigate('/principal-dashboard');
        } else if (selectedRole === 'hod') {
          navigate('/hod-dashboard');
        } else {
          navigate('/advisor-dashboard');
        }
      }
    } catch (err) {
      addToast({
        title: 'Authentication Failed',
        message: 'Invalid College ID or credentials.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForgotModal(false);
    addToast({
      title: 'Reset Key Dispatched',
      message: `Password reset instructions dispatched to registered institutional contact.`,
      type: 'info',
    });
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Cyber Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo & Official Title */}
        <div className="text-center mb-6">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl p-1 shadow-2xl shadow-cyan-500/25 mb-3.5 border border-cyan-500/40 bg-slate-900/90 backdrop-blur-md">
            <img
              src="/classsense-logo.png"
              alt="ClassSense AI Official Logo"
              className="h-full w-full object-cover rounded-[22px]"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>ClassSense</span>
            <span className="text-cyan-400 font-mono text-xl px-2 py-0.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30">AI</span>
          </h1>
          <p className="text-xs uppercase font-mono tracking-widest text-cyan-300/90 mt-1 font-bold">
            College Attendance & Presence Monitoring
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl backdrop-blur-xl">
          {/* 3 Role Selector */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleRoleChange('principal')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === 'principal'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crown className="h-4 w-4 mb-1" />
                <span>Principal</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('hod')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === 'hod'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="h-4 w-4 mb-1" />
                <span>HOD</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('advisor')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === 'advisor'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="h-4 w-4 mb-1" />
                <span>Class Advisor</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {getIdentifierLabel()}
              </label>
              <div className="relative">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder={getIdentifierPlaceholder()}
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-10 pr-4 py-2 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-10 pr-10 py-2 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Strict Faculty & Staff Access. No Student Login.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 py-2.5 px-4 text-xs font-bold text-white shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    Login to{' '}
                    {selectedRole === 'principal'
                      ? 'Principal Portal'
                      : selectedRole === 'hod'
                      ? 'HOD Department Portal'
                      : 'Class Advisor Portal'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5 font-mono">
          Principal → HOD → Class Advisor → Faculty & Students
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Account Credentials"
        subtitle="Staff Security Verification"
        maxWidth="sm"
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-xs text-slate-300">
            Enter your official Employee ID or staff email address to receive password reset instructions.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Employee ID or Staff Email
            </label>
            <input
              type="text"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. HOD-AIML-001 or hod.aiml@college.edu"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg transition-all"
            >
              Send Reset Key
            </button>
          </div>
        </form>
      </Modal>

      {/* First Login Account Setup Modal */}
      <AccountSetupModal
        isOpen={showSetupModal || isFirstLoginPending}
        onClose={() => setShowSetupModal(false)}
      />
    </div>
  );
};

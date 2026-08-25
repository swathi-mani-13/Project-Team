import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Lock, Building2 } from 'lucide-react';

interface AccountSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AccountSetupModal: React.FC<AccountSetupModalProps> = ({ isOpen, onClose }) => {
  const { user, activateAccount } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [tempPassword, setTempPassword] = useState<string>('Welcome@123');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      addToast({
        title: 'Password Too Short',
        message: 'New security password must be at least 6 characters.',
        type: 'warning',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        title: 'Passwords Mismatch',
        message: 'New password and confirmation password do not match.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      await activateAccount(newPassword);
      addToast({
        title: 'HOD Account Activated!',
        message: `Welcome ${user.name}! Your account setup for ${user.department || 'your department'} is complete.`,
        type: 'success',
      });
      if (onClose) onClose();
      navigate('/hod-dashboard');
    } catch (err) {
      addToast({
        title: 'Activation Failed',
        message: 'Could not activate account. Please retry.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Complete Your Account Setup"
      subtitle="First-time login credential setup for Department Head"
      maxWidth="md"
    >
      <form onSubmit={handleActivate} className="space-y-4">
        {/* Welcome Banner */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-purple-500/30 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{user.name}</h4>
            <p className="text-xs text-purple-300 font-mono">
              Assigned Department: <strong className="text-white">{user.department || 'Department'}</strong>
            </p>
          </div>
        </div>

        {/* Employee ID (Read-only) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Employee ID
          </label>
          <input
            type="text"
            value={user.employeeId}
            disabled
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs font-mono text-purple-300 cursor-not-allowed font-bold"
          />
        </div>

        {/* Temporary Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Temporary Password Provided by Principal
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              required
            />
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Create New Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter secure new password..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Confirm New Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01]"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Activate Account & Proceed to HOD Dashboard</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

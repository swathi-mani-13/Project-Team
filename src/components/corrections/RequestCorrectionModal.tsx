import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Student, AttendanceStatus, CorrectionRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface RequestCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudent?: Student | null;
  onSubmit: (correction: Omit<CorrectionRequest, 'id' | 'requestedAt' | 'status'>) => void;
}

export const RequestCorrectionModal: React.FC<RequestCorrectionModalProps> = ({
  isOpen,
  onClose,
  initialStudent,
  onSubmit,
}) => {
  const { user, role } = useAuth();

  const [studentName, setStudentName] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentStatus, setCurrentStatus] = useState<AttendanceStatus>('Absent');
  const [requestedStatus, setRequestedStatus] = useState<'Present' | 'Late' | 'Excused'>('Present');
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  useEffect(() => {
    if (initialStudent) {
      setStudentName(initialStudent.name);
      setRollNumber(initialStudent.rollNumber);
      setCurrentStatus(initialStudent.status);
    }
  }, [initialStudent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName || !rollNumber || !reason) {
      return;
    }

    onSubmit({
      studentName,
      rollNumber,
      department: initialStudent?.department || user?.department || 'AIML',
      year: initialStudent?.year || user?.assignedClass?.year || '2nd Year',
      section: initialStudent?.section || user?.assignedClass?.section || 'A',
      date,
      currentStatus,
      requestedStatus,
      reason,
      reviewComments: remarks,
      requestedBy: user?.name || 'Class Advisor',
      requestedByRole: role.toUpperCase(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Attendance Correction"
      subtitle="Advisor submission for HOD / Principal review & authorization"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Student Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Roll Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              placeholder="e.g. AIML1024"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Date & Original vs Requested */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Date of Incident
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Original Mark
            </label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as AttendanceStatus)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="Absent">Absent</option>
              <option value="Presence Unverified">Presence Unverified</option>
              <option value="Late">Late</option>
              <option value="Present">Present</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Requested Mark
            </label>
            <select
              value={requestedStatus}
              onChange={(e) => setRequestedStatus(e.target.value as 'Present' | 'Late' | 'Excused')}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none font-bold text-emerald-400"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused (Duty)</option>
            </select>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Reason / Justification <span className="text-rose-400">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            required
          >
            <option value="">-- Select Valid Justification --</option>
            <option value="Medical Certificate Provided">Medical Certificate Provided</option>
            <option value="Authorized College Duty / Symposium">Authorized College Duty / Symposium</option>
            <option value="Camera Blindspot / Face Occlusion">Camera Blindspot / Face Occlusion</option>
            <option value="Late Entry with Advisor Permission">Late Entry with Advisor Permission</option>
            <option value="Sports / Cultural Contingent">Sports / Cultural Contingent</option>
          </select>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Additional Advisor Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Provide supplementary details for audit log..."
            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all"
          >
            <FileCheck className="h-4 w-4" />
            <span>Submit for Authorization</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

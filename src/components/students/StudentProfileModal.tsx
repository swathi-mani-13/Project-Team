import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Student } from '../../types';
import { FaceRegistrationModal } from './FaceRegistrationModal';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  BookOpen,
  Camera,
  Sparkles,
} from 'lucide-react';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestCorrection?: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onRequestCorrection,
}) => {
  const [isFaceModalOpen, setIsFaceModalOpen] = useState<boolean>(false);

  if (!student) return null;

  const isFaceRegistered = student.faceRegistered || student.faceRegistrationStatus === 'Registered';

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Biometric & Academic Profile"
      subtitle={`${student.name} (${student.rollNumber})`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={student.name}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 p-1 rounded-full text-[9px] border ${
                  isFaceRegistered
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-amber-500 text-slate-950 border-amber-400'
                }`}
                title={isFaceRegistered ? 'Face Registered ✓' : 'Face Registration Required'}
              >
                {isFaceRegistered ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white">{student.name}</h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isFaceRegistered
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isFaceRegistered ? 'Face Registered ✓' : 'Face Registration Required ⚠'}
                </span>
              </div>
              <p className="text-xs font-mono text-cyan-300 font-semibold mt-0.5">{student.rollNumber}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-300 font-mono">
                  {student.department} • {student.year} (Sec {student.section})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 self-end sm:self-center">
            <StatusBadge status={student.status} size="md" />
            <span className="text-[11px] font-mono text-slate-400">
              Recognition: <strong className={isFaceRegistered ? 'text-emerald-400' : 'text-amber-400'}>{isFaceRegistered ? 'Ready ✓' : 'Required'}</strong>
            </span>
          </div>
        </div>

        {/* 4 Quick Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Overall Attendance</span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${student.attendancePct < 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {student.attendancePct}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Present Days</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">{student.presentDays}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Absent Days</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-0.5 block">{student.absentDays}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Late Days</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">{student.lateDays}</span>
          </div>
        </div>

        {/* PRACTICAL COLLEGE DATE & PERIOD ATTENDANCE REGISTER */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5 font-mono">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span>Period-Wise Attendance Register (Recent Sessions)</span>
            </h5>
            <span className="text-[10px] font-mono text-slate-400">P = Present, A = Absent, L = Late, OD = On Duty</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-left">Date</th>
                  <th className="py-2.5 px-2">P1 (DBMS)</th>
                  <th className="py-2.5 px-2">P2 (Maths)</th>
                  <th className="py-2.5 px-2">P3 (OS)</th>
                  <th className="py-2.5 px-2">P4 (AI)</th>
                  <th className="py-2.5 px-2">P5 (Networks)</th>
                  <th className="py-2.5 px-2">P6 (Lab)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-left font-bold text-white">25-Aug (Today)</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 text-slate-500">--</td>
                  <td className="py-2.5 px-2 text-slate-500">--</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-left font-bold text-slate-300">23-Jun (Tue)</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-left font-bold text-slate-300">22-Jun (Mon)</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                </tr>
                <tr className="hover:bg-slate-800/40 bg-rose-950/20">
                  <td className="py-2.5 px-3 text-left font-bold text-rose-300">20-Jun (Sat)</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-left font-bold text-slate-300">19-Jun (Fri)</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-left font-bold text-slate-300">18-Jun (Thu)</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-rose-400">A</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-400">P</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SUBJECT-WISE ATTENDANCE BREAKDOWN */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              <span>Subject-Wise Attendance Breakdown</span>
            </h5>
            <span className="text-[10px] font-mono text-slate-400">Faculty Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Subject</th>
                  <th className="pb-2">Course Faculty</th>
                  <th className="pb-2">Attendance %</th>
                  <th className="pb-2">Sessions</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {student.subjectAttendance && student.subjectAttendance.length > 0 ? (
                  student.subjectAttendance.map((sub) => (
                    <tr key={sub.subjectCode} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-bold text-white">
                        <span className="font-mono text-cyan-300">{sub.subjectCode}</span> — {sub.subjectName}
                      </td>
                      <td className="py-2.5 text-slate-300">{sub.facultyName}</td>
                      <td className="py-2.5 font-mono font-bold">
                        <span className={sub.attendancePct < 75 ? 'text-rose-400' : 'text-emerald-400'}>
                          {sub.attendancePct}%
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">
                        {sub.presentSessions} / {sub.totalSessions}
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusBadge status={sub.status} size="sm" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-slate-500 font-mono">
                      No subject breakdowns recorded for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TWO-CAMERA STUDENT PRESENCE TIMELINE (Requirement #8 & #22) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5 font-mono">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Camera 1 (Entrance) & Camera 2 (Center 360°) Presence Timeline</span>
            </h5>
            <span className="text-[10px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
              Dual-Cam Event Fusion
            </span>
          </div>

          {/* Time Tracking Cards (Requirement #12) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">First Entry</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">{student.firstEntryTime || '09:02:14'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Exit Time</span>
              <span className="font-bold text-amber-400 mt-0.5 block">{student.exitTime || '09:42:15'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Re-entry</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">{student.reEntryTime || '10:02:10'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Last Detected</span>
              <span className="font-bold text-white mt-0.5 block">{student.lastDetectionTime || '10:03:00'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 col-span-2 sm:col-span-1">
              <span className="text-[9px] text-emerald-400 block font-semibold uppercase">Current Status</span>
              <span className="font-bold text-emerald-300 mt-0.5 block">{student.currentPresence || 'Inside'}</span>
            </div>
          </div>

          {/* Interactive Chronological Presence Timeline */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">09:02:14</span> — <span className="text-cyan-300">Entry Detected</span> (Entrance Camera)
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">96.4% Conf</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">09:05:00</span> — <span className="text-emerald-300">Presence Confirmed</span> (Center 360° • Front Zone)
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">95.8% Conf</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">09:15:00</span> — <span className="text-emerald-300">Presence Confirmed</span> (Center 360° • Front Zone)
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">96.1% Conf</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-400 mt-1 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">09:42:15</span> — <span className="text-amber-300">Exit Detected</span> (Entrance Camera Doorway)
                </div>
                <span className="text-[10px] text-amber-400 font-bold">95.1% Conf</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-slate-500 mt-1 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-400">09:50:00</span> — <span className="text-slate-400">Not Detected</span> (Center 360° Camera)
                </div>
                <span className="text-[10px] text-slate-500 font-bold">--</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">10:02:10</span> — <span className="text-cyan-300">Re-Entry Detected</span> (Entrance Camera Doorway)
                </div>
                <span className="text-[10px] text-cyan-400 font-bold">96.0% Conf</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">10:03:00</span> — <span className="text-emerald-300 font-bold">Presence Restored</span> (Center 360° • Middle Zone)
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">94.6% Conf</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biometric & Guardian Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Biometric Vector Profile</span>
              </h5>
              <button
                type="button"
                onClick={() => setIsFaceModalOpen(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1 hover:underline"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{isFaceRegistered ? 'Update Face Photo' : 'Enroll Face Photo'}</span>
              </button>
            </div>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Enrollment Status:</span>
                <span className={`font-mono font-bold ${isFaceRegistered ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isFaceRegistered ? '128-D Vector Registered' : 'Registration Required'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Embedding Quality:</span>
                <span className="font-mono text-white">
                  {student.faceQualityScore ? `${student.faceQualityScore}% Optimal` : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Enrolled On:</span>
                <span className="font-mono text-slate-400">{student.registeredDate}</span>
              </div>
            </div>

            {/* Reference Photos Gallery */}
            {student.referencePhotos && student.referencePhotos.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono font-semibold block mb-1.5">
                  Reference Angles ({student.referencePhotos.length}/3 Enrolled):
                </span>
                <div className="flex items-center gap-2">
                  {student.referencePhotos.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Angle ${idx + 1}`}
                      className="h-10 w-10 rounded-lg object-cover border border-slate-700 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <User className="h-4 w-4 text-emerald-400" />
              <span>Guardian Information</span>
            </h5>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Guardian Name:</span>
                <span className="font-semibold text-white">{student.guardianName || 'Guardian'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-white">{student.guardianPhone || '+91 98765 00000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student Email:</span>
                <span className="font-mono text-slate-400 truncate max-w-[150px]">{student.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsFaceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-xs font-semibold transition-all"
          >
            <Camera className="h-4 w-4 text-cyan-400" />
            <span>{isFaceRegistered ? 'Manage Face Biometrics' : 'Enroll Face Profile'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onRequestCorrection && (
              <button
                onClick={() => {
                  onClose();
                  onRequestCorrection(student);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all"
              >
                <FileCheck className="h-4 w-4" />
                <span>Request Attendance Override</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <FaceRegistrationModal
      student={student}
      isOpen={isFaceModalOpen}
      onClose={() => setIsFaceModalOpen(false)}
    />
    </>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Users,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Lock,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const AdvisorTutorPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  const assignedDept = user?.assignedClass?.department || user?.department || 'Department';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const classroom = user?.assignedClass?.classroom || 'Smart Room';
  const advisorName = user?.name || 'Class Advisor';

  const [tutor, setTutor] = useState({
    name: 'Arun',
    employeeId: 'TUT-AIML-001',
    email: 'arun.helper@college.edu',
    phone: '+91 98401 77001',
    designation: 'Assistant Tutor & Class Helper',
    status: 'Active' as const,
    assignedDate: '2023-06-01',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    tasksCompleted: 48,
    lastAssistance: 'Today, 09:15 AM (Period 1 Verification)',
  });

  const handleNotifyTutor = () => {
    addToast({
      title: 'Task Assigned to Tutor Arun',
      message: `Dispatched attendance verification task for ${assignedDept} ${assignedYear} Sec ${assignedSection} to Tutor Arun.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden shadow-xl shadow-cyan-500/20 border border-cyan-500/40 bg-slate-950 p-0.5">
              <img
                src="/classsense-logo.png"
                alt="ClassSense AI Logo"
                className="h-full w-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 font-mono">
                  ClassSense AI
                </span>
                <span className="text-slate-600">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 font-mono">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Primary Class Advisor: {user?.name || 'Sarah'} ({assignedDept} {assignedYear} Sec {assignedSection})
                  <Lock className="h-3 w-3 text-emerald-400" />
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Tutor & Class Helper Coordination
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Supporting assistant assigned to help the Class Advisor with section monitoring, optical anomaly reviews, and daily attendance logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Hierarchy Cards: Primary Advisor + Assigned Tutor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Class Advisor Card */}
        <div className="p-6 rounded-3xl glass-panel border border-emerald-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span>Primary Responsible Person</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Primary In-Charge
            </span>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
              alt={user?.name}
              className="h-16 w-16 rounded-2xl object-cover border border-emerald-500/50 shadow-md"
            />
            <div>
              <h3 className="text-lg font-bold text-white">{user?.name || 'Sarah'}</h3>
              <p className="text-xs font-mono font-bold text-emerald-300">{user?.employeeId || 'ADV-AIML-001'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{assignedDept} • {assignedYear} (Section {assignedSection})</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-white">Full Class Authority:</p>
            <p className="text-slate-400 text-[11px]">
              • Responsible for Overall Class Attendance % (90%)
            </p>
            <p className="text-slate-400 text-[11px]">
              • Manages Low Attendance Watchlist and Student Condonation Risk
            </p>
            <p className="text-slate-400 text-[11px]">
              • Oversees Subject Staff (Priya, Karthik, Rahul, Meena, Vijay)
            </p>
            <p className="text-slate-400 text-[11px]">
              • Authorizes Attendance Override and Guardian Alerts
            </p>
          </div>
        </div>

        {/* Supporting Tutor / Helper Card */}
        <div className="p-6 rounded-3xl glass-panel border border-cyan-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Supporting Tutor / Helper</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Assigned Helper
            </span>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={tutor.avatarUrl}
              alt={tutor.name}
              className="h-16 w-16 rounded-2xl object-cover border border-cyan-500/50 shadow-md"
            />
            <div>
              <h3 className="text-lg font-bold text-white">{tutor.name}</h3>
              <p className="text-xs font-mono font-bold text-cyan-300">{tutor.employeeId}</p>
              <p className="text-xs text-slate-400 mt-0.5">{tutor.designation}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-white">Helper Responsibilities:</p>
            <p className="text-slate-400 text-[11px]">
              • Coordinates under Class Advisor Sarah's supervision
            </p>
            <p className="text-slate-400 text-[11px]">
              • Performs physical check verification for presence unverified events
            </p>
            <p className="text-slate-400 text-[11px]">
              • Assists with lab session attendance checklists
            </p>
            <p className="text-slate-400 text-[11px]">
              • Status: <strong className="text-emerald-400 font-mono">Active In Section</strong>
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-mono">{tutor.tasksCompleted} Tasks Verified</span>
            <button
              onClick={handleNotifyTutor}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-all"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Assign Verification Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clarification Alert */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-slate-300">
          <p className="font-bold text-white">
            Organizational Role Specification:
          </p>
          <p className="text-slate-400 leading-relaxed">
            The Tutor is a supporting helper assigned to assist the Class Advisor. The Class Advisor (<strong className="text-white">Sarah</strong>) retains full primary administrative ownership of <strong className="text-white">{assignedDept} {assignedYear} Sec {assignedSection}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

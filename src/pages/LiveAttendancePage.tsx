import React, { useState, useMemo } from 'react';
import { useCollege } from '../context/CollegeContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { LiveAttendanceRecord } from '../types';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  Camera,
  Play,
  RotateCw,
} from 'lucide-react';

export const LiveAttendancePage: React.FC = () => {
  const { students } = useCollege();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const records: LiveAttendanceRecord[] = useMemo(() => {
    return students.map((st, idx) => ({
      id: `live-${st.id}`,
      studentId: st.id,
      studentName: st.name,
      rollNumber: st.rollNumber,
      avatarUrl: st.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      department: st.department,
      year: st.year,
      section: st.section,
      cameraName: `CAM-${st.department}-${st.year.charAt(0)}${st.section}-Entrance`,
      firstDetected: st.firstEntryTime || '08:45 AM',
      lastDetected: 'Just now',
      detectionCount: (st.faceRegistered || st.faceRegistrationStatus === 'Registered') ? 24 : 0,
      confidence: (st.faceRegistered || st.faceRegistrationStatus === 'Registered') ? (st.confidenceScore || 96.4) : null,
      status: (st.status as any) || 'Present',
    }));
  }, [students]);

  const filtered = records.filter((rec) => {
    const matchStatus = filterStatus === 'All' || rec.status === filterStatus;
    const matchSearch =
      rec.studentName.toLowerCase().includes(search.toLowerCase()) ||
      rec.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      rec.cameraName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Live Attendance Monitor
            </h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              AI STREAM ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time biometric attendance capture with optical vision bounding telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors">
            <RotateCw className="h-4 w-4 text-slate-400" />
            <span>Sync Session</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, roll number, or camera..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
          {['All', 'Present', 'Presence Unverified', 'Late', 'Absent'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Live Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Department & Class</th>
                <th className="py-3.5 px-4">Camera Source</th>
                <th className="py-3.5 px-4">First Detected</th>
                <th className="py-3.5 px-4">Detections</th>
                <th className="py-3.5 px-4">AI Confidence</th>
                <th className="py-3.5 px-4">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      <Camera className="h-5 w-5" />
                    </div>
                    <span>No AI recognition events yet.</span>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.avatarUrl}
                          alt={row.studentName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                        />
                        <span className="font-bold text-white">{row.studentName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-300">
                      {row.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {row.department} • {row.year} (Sec {row.section})
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {row.cameraName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {row.firstDetected}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-300">
                      {row.detectionCount} frames
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {row.confidence ? (
                        <span className="text-emerald-400">{row.confidence}%</span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

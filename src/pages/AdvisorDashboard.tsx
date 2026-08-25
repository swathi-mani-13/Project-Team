import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Sparkles,
  Camera,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck,
  TrendingUp,
  ShieldAlert,
  DoorOpen,
  Compass,
  Coffee,
  Utensils,
  Settings2,
  ShieldCheck,
  Eye,
  Info,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { TimetableSlot, SlotType } from '../types';
import { useNotification } from '../context/NotificationContext';

export const AdvisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getClassStudents, getClassTimetable, updateClassTimetable } = useCollege();
  const { addToast } = useNotification();

  // Read dynamically from the logged-in Advisor account
  const assignedDept = user?.assignedClass?.department || user?.department || 'Department';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const classroom = user?.assignedClass?.classroom || 'Smart Room';
  const advisorName = user?.name || 'Class Advisor';

  const classStudents = getClassStudents(assignedDept, assignedYear, assignedSection);
  const enrolledCount = classStudents.length;

  const presentStudents = classStudents.filter((s) => s.status === 'Present');
  const absentStudents = classStudents.filter((s) => s.status === 'Absent');
  const lateStudents = classStudents.filter((s) => s.status === 'Late Entry');
  const unverifiedStudents = classStudents.filter(
    (s) => s.status === 'Presence Unverified' || (s.confidenceScore && s.confidenceScore < 70)
  );

  const presentToday = presentStudents.length;
  const absentToday = absentStudents.length;
  const lateToday = lateStudents.length;
  const unverifiedToday = unverifiedStudents.length;

  // 7 Academic Periods + 1 Break & 1 Lunch from CollegeContext
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() =>
    getClassTimetable(assignedDept, assignedYear, assignedSection)
  );

  // Allow configuring timetable timings
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [editingSlots, setEditingSlots] = useState<TimetableSlot[]>(timetableSlots);

  // Simulation mode for testing current period vs break vs lunch states
  const [simulatedSlotIndex, setSimulatedSlotIndex] = useState<number>(3); // Default index 3 = P3

  const currentSlot = timetableSlots[simulatedSlotIndex] || timetableSlots[0];
  const nextSlot = timetableSlots[simulatedSlotIndex + 1];

  const academicSlots = timetableSlots.filter((s) => s.slotType === 'period');
  const completedSlots = academicSlots.filter((s) => s.status === 'Completed');
  const pendingSlots = academicSlots.filter((s) => s.status === 'Pending');

  const handleSaveTimings = (e: React.FormEvent) => {
    e.preventDefault();
    updateClassTimetable(assignedDept, assignedYear, assignedSection, editingSlots);
    setTimetableSlots(editingSlots);
    setIsConfigModalOpen(false);
    addToast({
      title: 'Timetable Timings Updated',
      message: `Configured official 7-period schedule timings for ${assignedDept} ${assignedYear} Sec ${assignedSection}.`,
      type: 'success',
    });
  };

  const handleTimingChange = (index: number, field: 'startTime' | 'endTime' | 'subjectName' | 'facultyName', value: string) => {
    setEditingSlots((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Advisor Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl relative overflow-hidden">
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  {assignedDept} • {assignedYear} • Section {assignedSection}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Good Morning, {advisorName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Class Advisor • <strong className="text-cyan-300 font-mono">{assignedDept} • {assignedYear} • Section {assignedSection}</strong> • 7 Academic Periods Schedule • Venue: {classroom}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setEditingSlots(timetableSlots);
                setIsConfigModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 shadow-md transition-all"
            >
              <Settings2 className="h-4 w-4 text-cyan-400" />
              <span>Configure Period Timings</span>
            </button>

            <button
              onClick={() => navigate('/advisor-daily-attendance')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Mark Today's Attendance</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Current Period / Timetable State Banner (Requirement #5) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl border shrink-0 ${
                currentSlot.slotType === 'break'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : currentSlot.slotType === 'lunch'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {currentSlot.slotType === 'break' ? (
                <Coffee className="h-7 w-7 animate-bounce" />
              ) : currentSlot.slotType === 'lunch' ? (
                <Utensils className="h-7 w-7 animate-pulse" />
              ) : (
                <Clock className="h-7 w-7 text-cyan-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  Current Schedule State
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Tuesday, 25-Aug-2026
                </span>
                <span className="text-slate-600">•</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                    currentSlot.slotType === 'break'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : currentSlot.slotType === 'lunch'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {currentSlot.slotType === 'break'
                    ? '☕ MORNING / AFTERNOON BREAK'
                    : currentSlot.slotType === 'lunch'
                    ? '🍱 LUNCH BREAK INTERVAL'
                    : `CURRENT PERIOD: ${currentSlot.shortCode}`}
                </span>
              </div>

              {currentSlot.slotType === 'period' ? (
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>{currentSlot.shortCode}: {currentSlot.subjectName}</span>
                    <span className="text-xs font-mono font-normal text-slate-400">({currentSlot.startTime} – {currentSlot.endTime})</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Faculty In-Charge: <strong className="text-white">{currentSlot.facultyName}</strong> • {currentSlot.presentCount || 37} Present, {currentSlot.absentCount || 3} Absent, {currentSlot.reviewCount || 0} Review Pending.
                  </p>
                </div>
              ) : currentSlot.slotType === 'break' ? (
                <div>
                  <h3 className="text-xl font-extrabold text-amber-300 tracking-tight flex items-center gap-2">
                    <span>☕ Official Break Interval ({currentSlot.startTime} – {currentSlot.endTime})</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    <strong>No academic attendance required.</strong> Student classroom exits are recorded as <span className="text-amber-400 font-mono">Reason: Official Break</span> with 0 false early-exit alerts.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-extrabold text-rose-300 tracking-tight flex items-center gap-2">
                    <span>🍱 College Lunch Interval ({currentSlot.startTime} – {currentSlot.endTime})</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    <strong>No academic attendance required.</strong> Dining movement is logged as <span className="text-rose-400 font-mono">Reason: Official Lunch</span>. Presence monitoring temporarily suspended.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentSlot.slotType === 'period' ? (
              <button
                onClick={() => navigate('/advisor-daily-attendance')}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Open {currentSlot.shortCode} Attendance</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-400">
                <span>⏸ Attendance Paused for {currentSlot.shortCode}</span>
              </div>
            )}

            {/* Quick Demo Simulator Toggle */}
            <div className="hidden sm:flex flex-col items-end text-[10px] text-slate-400 font-mono">
              <span className="text-slate-500 mb-0.5">Test State Simulator:</span>
              <select
                value={simulatedSlotIndex}
                onChange={(e) => setSimulatedSlotIndex(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-cyan-300 focus:outline-none"
              >
                {timetableSlots.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {s.shortCode} - {s.label} ({s.startTime})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {nextSlot && (
          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="text-cyan-400 font-bold">NEXT UP:</span>
              <span className="text-white">{nextSlot.shortCode} — {nextSlot.subjectName || nextSlot.label}</span>
              <span>({nextSlot.startTime} – {nextSlot.endTime})</span>
            </span>
            <span>{nextSlot.slotType === 'period' ? `Faculty: ${nextSlot.facultyName}` : 'Break Interval'}</span>
          </div>
        )}
      </div>

      {/* 3. 7-Period Daily Operations Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono block">
            Academic Periods
          </span>
          <span className="text-xl font-extrabold text-white font-mono block">7 Periods</span>
          <span className="text-[10px] text-slate-500">P1 to P7 Daily</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider font-mono block">
            Completed
          </span>
          <span className="text-xl font-extrabold text-emerald-300 font-mono block">{completedSlots.length}</span>
          <span className="text-[10px] text-emerald-500/80">Periods Finalized</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-1">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider font-mono block">
            Pending
          </span>
          <span className="text-xl font-extrabold text-amber-300 font-mono block">{pendingSlots.length}</span>
          <span className="text-[10px] text-amber-500/80">Awaiting Marking</span>
        </div>

        <div className="p-3.5 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono block">
            Students Enrolled
          </span>
          <span className="text-xl font-extrabold text-white font-mono block">{enrolledCount}</span>
          <span className="text-[10px] text-slate-500">Sec {assignedSection} Roster</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider font-mono block">
            Present Today
          </span>
          <span className="text-xl font-extrabold text-emerald-300 font-mono block">{presentToday}</span>
          <span className="text-[10px] text-emerald-500/80">Avg in Campus</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-1">
          <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider font-mono block">
            Absent Today
          </span>
          <span className="text-xl font-extrabold text-rose-300 font-mono block">{absentToday}</span>
          <span className="text-[10px] text-rose-500/80">Avg Absentees</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-1">
          <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider font-mono block">
            Interspersed Breaks
          </span>
          <span className="text-xl font-extrabold text-purple-200 font-mono block">2 Breaks + Lunch</span>
          <span className="text-[10px] text-purple-400/80">Zero Attendance</span>
        </div>
      </div>

      {/* 4. AI Camera Integration & Timetable Intelligence Card (Requirements #6, #7, #8) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 border border-brand-500/40 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 shrink-0">
            <Camera className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                AI Dual Cameras Timetable Integration
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                {currentSlot.slotType === 'period' ? 'LIVE MONITORING ACTIVE' : 'SUSPENDED FOR BREAK'}
              </span>
            </div>
            <p className="text-sm font-bold text-white">
              Entrance Cam (CAM-{assignedDept}-{assignedYear.charAt(0)}{assignedSection}-Entrance) + Center 360° Cam (CAM-{assignedDept}-{assignedYear.charAt(0)}{assignedSection}-Center)
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentSlot.slotType === 'period' ? (
                <>During academic periods (P1–P7), classroom presence is verified continuously. Any unverified exit creates an Early Exit alert.</>
              ) : (
                <>During Break & Lunch intervals, movements are logged as <span className="text-amber-300 font-mono">Reason: {currentSlot.label}</span> without generating false class-cut alerts. Monitoring resumes automatically at start of next period.</>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/camera-monitor')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
        >
          <Eye className="h-4 w-4 text-cyan-400" />
          <span>Live Dual Camera Feed</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 5. TODAY'S 7-PERIOD TIMETABLE (Requirement #1 & #3) */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-mono">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span>Official 7-Period Daily Timetable & Attendance</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Class: <strong className="text-white">{assignedDept} • {assignedYear} • Section {assignedSection}</strong> • 7 Academic Periods + Morning Break + Lunch (No Afternoon Break)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/advisor-timetable')}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Weekly Timetable</span>
            </button>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/80">
              {completedSlots.length} / 7 Completed
            </span>
          </div>
        </div>

        {/* 7-Period Timeline Visual List */}
        <div className="space-y-3">
          {timetableSlots.map((slot, index) => {
            const isPeriod = slot.slotType === 'period';
            const isBreak = slot.slotType === 'break';
            const isLunch = slot.slotType === 'lunch';
            const isCompleted = slot.status === 'Completed';
            const isPending = slot.status === 'Pending';
            const isCurrent = slot.id === currentSlot.id;

            if (isBreak || isLunch) {
              return (
                <div
                  key={slot.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isLunch
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                      : 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                  } ${isCurrent ? 'ring-2 ring-amber-400 shadow-lg' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        isLunch ? 'bg-rose-900/40 border-rose-700/60' : 'bg-amber-900/40 border-amber-700/60'
                      }`}
                    >
                      {isLunch ? <Utensils className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-extrabold text-xs tracking-wider">
                          {isLunch ? '🍱 LUNCH BREAK INTERVAL' : '☕ MORNING / AFTERNOON BREAK'}
                        </span>
                        <span className="text-xs opacity-75">• {slot.startTime} – {slot.endTime}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                            CURRENTLY ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Official Non-Academic Interval. No attendance taken. Class-cut alerts suspended.
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 font-bold self-start sm:self-auto">
                    No Attendance
                  </span>
                </div>
              );
            }

            return (
              <div
                key={slot.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isCurrent
                    ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/30 shadow-xl'
                    : isCompleted
                    ? 'bg-slate-900/90 border-emerald-800/40'
                    : isPending
                    ? 'bg-slate-900/90 border-amber-700/50'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-extrabold text-xs">
                      {slot.shortCode}
                    </span>

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{slot.subjectName}</span>
                        <span className="text-xs font-mono text-cyan-400 font-normal">({slot.subjectCode})</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Faculty: <strong className="text-slate-200">{slot.facultyName}</strong> • {slot.startTime} – {slot.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${
                        isCompleted
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : isPending
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isCompleted ? '✓ Completed' : isPending ? '⚠ Pending Attendance' : 'Upcoming'}
                    </span>

                    {isCompleted ? (
                      <div className="px-3 py-1 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono text-emerald-300 font-bold">
                        <span>{slot.presentCount || 0}P / {slot.absentCount || 0}A</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate('/advisor-daily-attendance')}
                        className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                          isPending
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                            : 'bg-brand-600 hover:bg-brand-500 text-white'
                        }`}
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Open Attendance</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. CONFIGURE PERIOD TIMINGS MODAL (Requirement #1 & #11) */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={`Configure 7-Period Timetable Timings (${assignedDept} • ${assignedYear} Sec ${assignedSection})`}
        subtitle="Set official college start & end times for all 7 academic periods and break intervals."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTimings} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
            {editingSlots.map((slot, idx) => (
              <div
                key={slot.id}
                className={`p-3 rounded-xl border text-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center ${
                  slot.slotType === 'break'
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : slot.slotType === 'lunch'
                    ? 'bg-rose-950/20 border-rose-800/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="sm:col-span-3 flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400 text-xs px-2 py-0.5 rounded bg-slate-800">
                    {slot.shortCode}
                  </span>
                  <span className="font-semibold text-white truncate">{slot.label}</span>
                </div>

                <div className="sm:col-span-4">
                  {slot.slotType === 'period' ? (
                    <input
                      type="text"
                      value={slot.subjectName || ''}
                      onChange={(e) => handleTimingChange(idx, 'subjectName', e.target.value)}
                      placeholder="Subject Name"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-white text-xs"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Official Interval</span>
                  )}
                </div>

                <div className="sm:col-span-5 flex items-center gap-1.5 font-mono">
                  <input
                    type="text"
                    value={slot.startTime}
                    onChange={(e) => handleTimingChange(idx, 'startTime', e.target.value)}
                    placeholder="09:00 AM"
                    className="w-24 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-cyan-300 text-xs text-center font-bold"
                  />
                  <span className="text-slate-500">–</span>
                  <input
                    type="text"
                    value={slot.endTime}
                    onChange={(e) => handleTimingChange(idx, 'endTime', e.target.value)}
                    placeholder="09:50 AM"
                    className="w-24 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-cyan-300 text-xs text-center font-bold"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30"
            >
              Save Official Timetable Timings
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

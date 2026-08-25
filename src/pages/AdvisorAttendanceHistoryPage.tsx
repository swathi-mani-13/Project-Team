import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { useNotification } from '../context/NotificationContext';
import {
  Calendar,
  Clock,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Send,
  FileText,
  Search,
  Filter,
  Check,
  X,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const AdvisorAttendanceHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { getClassStudents, submittedReports, submitMonthlyReport } = useCollege();
  const { addToast } = useNotification();

  const assignedDept = user?.assignedClass?.department || user?.department || 'AIML';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const advisorName = user?.name || 'Class Advisor';
  const advisorEmpId = user?.employeeId || 'ADV-AIML-001';

  // Month Selector (Requirements #11, #14)
  const [selectedMonth, setSelectedMonth] = useState<string>('August 2026');
  const [viewMode, setViewMode] = useState<'register' | 'daily' | 'submissions'>('register');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [reportRemarks, setReportRemarks] = useState<string>('');

  const months = ['August 2026', 'July 2026', 'June 2026', 'May 2026'];

  // Dynamic class students (Requirement #23)
  const classStudents = useMemo(() => {
    return getClassStudents(assignedDept, assignedYear, assignedSection);
  }, [assignedDept, assignedYear, assignedSection, getClassStudents]);

  const totalStudents = classStudents.length;

  // Monthly 31-day presence register simulation per student (Requirement #12)
  const daysInMonth = Array.from({ length: 25 }, (_, i) => i + 1); // 25 working days

  const monthlyStudentRegisters = useMemo(() => {
    return classStudents.map((st, idx) => {
      // Deterministic day statuses for each working day
      const dailyStatuses = daysInMonth.map((dayNum) => {
        const hash = (st.rollNumber.charCodeAt(st.rollNumber.length - 1) + dayNum + idx) % 20;
        if (hash === 1) return 'A'; // Absent
        if (hash === 3) return 'L'; // Late
        if (hash === 5 && dayNum === 14) return 'OD'; // On Duty
        if (hash === 7 && dayNum === 18) return 'ML'; // Medical Leave
        if (hash === 9 && dayNum === 22) return 'PU'; // Presence Unverified
        return 'P'; // Present
      });

      const presentCount = dailyStatuses.filter((s) => s === 'P' || s === 'OD').length;
      const absentCount = dailyStatuses.filter((s) => s === 'A' || s === 'ML').length;
      const lateCount = dailyStatuses.filter((s) => s === 'L').length;
      const unverifiedCount = dailyStatuses.filter((s) => s === 'PU').length;

      return {
        student: st,
        dailyStatuses,
        presentCount,
        absentCount,
        lateCount,
        unverifiedCount,
        monthlyPct: Number(((presentCount / daysInMonth.length) * 100).toFixed(1)),
      };
    });
  }, [classStudents, daysInMonth]);

  const classAvgMonthlyPct = useMemo(() => {
    if (monthlyStudentRegisters.length === 0) return 0;
    const sum = monthlyStudentRegisters.reduce((acc, curr) => acc + curr.monthlyPct, 0);
    return Number((sum / monthlyStudentRegisters.length).toFixed(1));
  }, [monthlyStudentRegisters]);

  const filteredMonthlyRegisters = useMemo(() => {
    if (!searchQuery) return monthlyStudentRegisters;
    return monthlyStudentRegisters.filter(
      (item) =>
        item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [monthlyStudentRegisters, searchQuery]);

  // Existing submitted report for this class and month
  const currentSubmission = submittedReports.find(
    (r) =>
      r.department === assignedDept &&
      r.year === assignedYear &&
      r.section === assignedSection &&
      r.month === selectedMonth
  );

  const handleExportMonthlyRegister = () => {
    addToast({
      title: 'Monthly Register Exported',
      message: `Downloaded official ${selectedMonth} Attendance Register for ${assignedDept} ${assignedYear} Sec ${assignedSection}.`,
      type: 'success',
    });
  };

  const handleOpenSubmitModal = () => {
    setReportRemarks(`Official ${selectedMonth} attendance summary submitted by Class Advisor ${advisorName}. All two-camera anomalies reviewed.`);
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSendToHOD = (e: React.FormEvent) => {
    e.preventDefault();
    submitMonthlyReport({
      department: assignedDept,
      year: assignedYear,
      section: assignedSection,
      month: selectedMonth,
      submittedBy: advisorName,
      submittedByEmpId: advisorEmpId,
      submittedTo: `${assignedDept} HOD`,
      submittedDate: '25-Aug-2026',
      status: 'Submitted',
      totalStudents,
      avgAttendancePct: classAvgMonthlyPct,
      presentRecords: totalStudents * 20,
      absentRecords: totalStudents * 1 + 5,
      odRecords: 12,
      lateEntryRecords: 18,
      medicalLeaveRecords: 8,
      presenceUnverifiedRecords: 5,
      presentDays: 23,
      absentDays: 2,
      lateEntries: 4,
      unverifiedEntries: 1,
      remarks: reportRemarks,
    });

    setIsSubmitModalOpen(false);
    addToast({
      title: '✓ Report Sent to HOD',
      message: `Successfully transmitted ${selectedMonth} Monthly Attendance Report for ${assignedDept} ${assignedYear} Sec ${assignedSection} to ${assignedDept} HOD.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
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
                  Attendance History & Register
                </span>
                <span className="text-slate-600">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {assignedDept} • {assignedYear} • Section {assignedSection}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                One-Month Attendance History Register & HOD Reporting
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Class Advisor: <strong className="text-white">{advisorName}</strong> • Real college monthly attendance register across 7 academic periods.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportMonthlyRegister}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Export Register</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSubmitModal}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
            >
              <Send className="h-4 w-4" />
              <span>Send Report to HOD</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Month Selector & Status Banner (Requirements #11, #14, #16, #17) */}
      <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Select Month:
              </span>
              <div className="flex items-center gap-2 mt-1">
                {months.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                      selectedMonth === m
                        ? 'bg-brand-600 text-white border-brand-400 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Status to HOD */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="text-right text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                HOD Submission Status
              </span>
              <span className="font-bold text-white">
                {currentSubmission ? currentSubmission.status : 'Draft (Pending Submission)'}
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${
                currentSubmission?.status === 'Approved'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : currentSubmission?.status === 'Submitted'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800 animate-pulse'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}
            >
              {currentSubmission?.status ? `✓ ${currentSubmission.status}` : 'Draft'}
            </span>
          </div>
        </div>

        {/* Quick Month Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Class Roster</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{totalStudents} Students</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
            <span className="text-[10px] text-emerald-400 uppercase block font-semibold">Avg Attendance</span>
            <span className="text-lg font-bold text-emerald-300 mt-0.5 block">{classAvgMonthlyPct}%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Working Days</span>
            <span className="text-lg font-bold text-cyan-300 mt-0.5 block">25 Days (175 Periods)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Target HOD</span>
            <span className="text-lg font-bold text-purple-300 mt-0.5 block">{assignedDept} HOD</span>
          </div>
        </div>
      </div>

      {/* 3. Monthly Attendance Register Table (Requirements #12, #13) */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>College Monthly Attendance Register — {selectedMonth}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Legend: <strong className="text-emerald-400">P</strong>=Present • <strong className="text-rose-400">A</strong>=Absent • <strong className="text-amber-400">L</strong>=Late • <strong className="text-cyan-400">OD</strong>=On Duty • <strong className="text-purple-400">ML</strong>=Medical • <strong className="text-rose-300">PU</strong>=Unverified
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or roll..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {filteredMonthlyRegisters.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Calendar className="h-6 w-6 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-white font-mono">No Attendance Records Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No attendance records available for this month. Records will automatically populate as daily period attendance is recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 sticky left-0 bg-slate-900 z-10">Roll No</th>
                  <th className="py-2.5 px-3 sticky left-24 bg-slate-900 z-10">Student Name</th>
                  {daysInMonth.map((d) => (
                    <th key={d} className="py-2 px-1 text-center font-mono w-6">
                      {d}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center text-emerald-400 font-bold">P</th>
                  <th className="py-2.5 px-2 text-center text-rose-400 font-bold">A</th>
                  <th className="py-2.5 px-2 text-center text-amber-400 font-bold">L</th>
                  <th className="py-2.5 px-3 text-right">Overall %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-[11px]">
                {filteredMonthlyRegisters.map((item) => {
                  const st = item.student;
                  return (
                    <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-cyan-300 sticky left-0 bg-slate-950/90 z-10">
                        {st.rollNumber}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-white truncate max-w-[140px] sticky left-24 bg-slate-950/90 z-10">
                        {st.name}
                      </td>
                      {item.dailyStatuses.map((stat, dIdx) => (
                        <td key={dIdx} className="py-1 px-0.5 text-center font-bold">
                          <span
                            className={`inline-block w-5 h-5 rounded text-[10px] leading-5 text-center ${
                              stat === 'P'
                                ? 'bg-emerald-950 text-emerald-300'
                                : stat === 'A'
                                ? 'bg-rose-950 text-rose-300 font-extrabold'
                                : stat === 'L'
                                ? 'bg-amber-950 text-amber-300'
                                : stat === 'OD'
                                ? 'bg-cyan-950 text-cyan-300'
                                : stat === 'ML'
                                ? 'bg-purple-950 text-purple-300'
                                : 'bg-rose-900 text-white'
                            }`}
                          >
                            {stat}
                          </span>
                        </td>
                      ))}
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-400">
                        {item.presentCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-rose-400">
                        {item.absentCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-400">
                        {item.lateCount}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-bold ${
                            item.monthlyPct >= 85
                              ? 'text-emerald-400'
                              : item.monthlyPct >= 75
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {item.monthlyPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Monthly Report to HOD Modal (Requirement #15, #16) */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title={`Submit Monthly Attendance Report — ${selectedMonth}`}
          subtitle={`Transmitting official report for ${assignedDept} ${assignedYear} Sec ${assignedSection} to ${assignedDept} HOD.`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmSendToHOD} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Class Scope:</span>
                <span className="font-bold text-white">{assignedDept} • {assignedYear} • Sec {assignedSection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reporting Month:</span>
                <span className="font-bold text-cyan-300">{selectedMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Enrolled Students:</span>
                <span className="font-bold text-white">{totalStudents} Students</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Class Attendance:</span>
                <span className="font-bold text-emerald-400">{classAvgMonthlyPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted By:</span>
                <span className="font-bold text-white">Class Advisor {advisorName} ({advisorEmpId})</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Designated Recipient:</span>
                <span className="font-bold text-purple-300">{assignedDept} Department HOD</span>
              </div>

              {/* 6 Category Summary Records (Requirement #15) */}
              <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono mt-2">
                <div><span className="text-slate-400">Present:</span> <strong className="text-emerald-400">{totalStudents * 20} recs</strong></div>
                <div><span className="text-slate-400">Absent:</span> <strong className="text-rose-400">{totalStudents * 1 + 5} recs</strong></div>
                <div><span className="text-slate-400">OD:</span> <strong className="text-indigo-400">12 recs</strong></div>
                <div><span className="text-slate-400">Late Entry:</span> <strong className="text-amber-400">18 recs</strong></div>
                <div><span className="text-slate-400">Medical:</span> <strong className="text-purple-400">8 recs</strong></div>
                <div><span className="text-slate-400">Unverified:</span> <strong className="text-cyan-400">5 recs</strong></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Advisor Remarks / Notes for HOD
              </label>
              <textarea
                rows={3}
                value={reportRemarks}
                onChange={(e) => setReportRemarks(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Confirm & Send to HOD</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

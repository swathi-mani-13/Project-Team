import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { useNotification } from '../context/NotificationContext';
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Phone,
  Mail,
  Shield,
  MapPin,
  Lock,
  UserX,
} from 'lucide-react';

export const AdvisorFacultyListPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { classes } = useCollege();

  const assignedDept = user?.assignedClass?.department || user?.department || 'Department';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const classroom = user?.assignedClass?.classroom || 'Smart Room';
  const advisorName = user?.name || 'Class Advisor';

  const classObj = classes.find(
    (c) => c.department === assignedDept && c.year === assignedYear && c.section === assignedSection
  );

  const dynamicFaculty = (classObj?.subjects && classObj.subjects.length > 0)
    ? classObj.subjects.map((sub, idx) => ({
        id: sub.staffId || `fac-${idx + 1}`,
        name: sub.staffName || `Faculty ${idx + 1}`,
        employeeId: sub.staffEmployeeId || `FAC-${assignedDept}-00${idx + 1}`,
        subjectCode: sub.subjectCode,
        subjectName: sub.subjectName,
        period: `Period ${idx + 1}`,
        todayStatus: 'Pending' as 'Received' | 'Pending' | 'Upcoming',
        presentCount: 0,
        absentCount: 0,
        receivedTime: null as string | null,
        phone: `+91 98401 5500${idx + 1}`,
        email: `${(sub.staffName || 'faculty').toLowerCase().replace(/[^a-z]/g, '')}.faculty@college.edu`,
      }))
    : [];

  const [facultyList, setFacultyList] = useState(dynamicFaculty);

  React.useEffect(() => {
    setFacultyList(dynamicFaculty);
  }, [user?.assignedClass?.department, user?.assignedClass?.year, user?.assignedClass?.section, classes]);

  const handleSendReminder = (facName: string, subName: string) => {
    addToast({
      title: 'Attendance Reminder Dispatched',
      message: `Sent automatic attendance notification to Faculty ${facName} for ${subName}.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
                Class Faculty & Subject Attendance Tracker
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Class Advisor: <strong className="text-white">{advisorName}</strong> • Real-time attendance receipt status across subject faculty teaching staff.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Distinction Banner */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              Primary Class Advisor: <span className="text-emerald-300 font-extrabold">{user?.name || 'Class Advisor'}</span> ({user?.employeeId || 'ADV-001'})
            </p>
            <p className="text-[11px] text-slate-400">
              Only 1 Class Advisor assigned for {assignedDept} {assignedYear} Sec {assignedSection}. Subject Faculty are assigned dynamically per timetable course.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
          {facultyList.length} Teaching Faculty
        </span>
      </div>

      {/* Faculty Cards Grid */}
      {facultyList.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-2xl glass-panel border border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <UserX className="h-6 w-6 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-white font-mono">No faculty assigned yet.</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Faculty assignments will display once subjects and timetable periods are configured for this section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facultyList.map((fac) => {
            const isReceived = fac.todayStatus === 'Received';
            const isPending = fac.todayStatus === 'Pending';

            return (
              <div
                key={fac.id}
                className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                      {fac.subjectCode}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
                      {fac.subjectName}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border flex items-center gap-1 ${
                      isReceived
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                        : isPending
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isReceived && <CheckCircle2 className="h-3 w-3" />}
                    {isPending && <AlertTriangle className="h-3 w-3" />}
                    <span>{fac.todayStatus}</span>
                  </span>
                </div>

                {/* Faculty Info Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Faculty:</span>
                    </span>
                    <span className="font-mono text-cyan-300 font-bold text-[11px]">
                      {fac.employeeId}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{fac.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {fac.phone}</span>
                  </div>
                </div>

                {/* Today's Schedule & Attendance status */}
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{fac.period}</span>
                  </div>

                  {isReceived ? (
                    <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 font-mono text-xs flex items-center justify-between">
                      <span>✓ Received at {fac.receivedTime}</span>
                      <span className="font-bold">{fac.presentCount}P / {fac.absentCount}A</span>
                    </div>
                  ) : isPending ? (
                    <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 font-mono text-xs flex items-center justify-between">
                      <span>⚠ Attendance Pending</span>
                      <button
                        type="button"
                        onClick={() => handleSendReminder(fac.name, fac.subjectName)}
                        className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1"
                      >
                        <Send className="h-2.5 w-2.5" />
                        <span>Remind</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-mono text-xs">
                      <span>⏳ Upcoming Lecture</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

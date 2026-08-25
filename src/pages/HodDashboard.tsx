import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { StudentProfileModal } from '../components/students/StudentProfileModal';
import { MOCK_ALERTS, MOCK_LIVE_RECORDS } from '../data/mockData';
import { Student } from '../types';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  Video,
  Camera,
  ArrowRight,
  Shield,
  GraduationCap,
  Zap,
  Lock,
  Layers,
  Filter,
  BookOpen,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export const HodDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getDepartmentMetrics,
    getDepartmentAdvisors,
    getDepartmentStudents,
  } = useCollege();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  const currentDept = user?.department || 'AIML';
  const deptAdvisors = getDepartmentAdvisors(currentDept);
  const allDeptStudents = getDepartmentStudents(currentDept);

  const filteredStudents = useMemo(() => {
    return allDeptStudents.filter((s) => {
      const matchYear = selectedYear === 'All' || s.year === selectedYear;
      const matchSec = selectedSection === 'All' || s.section === selectedSection;
      return matchYear && matchSec;
    });
  }, [allDeptStudents, selectedYear, selectedSection]);

  const deptMetrics = getDepartmentMetrics(currentDept);

  const deptEvents = MOCK_LIVE_RECORDS.filter(
    (e) => !e.department || e.department === currentDept
  );

  const deptAlerts = MOCK_ALERTS.filter(
    (a) => !a.department || a.department === currentDept
  );

  const pieData = [
    { name: 'Present', value: deptMetrics.presentToday, color: '#10b981' },
    { name: 'Absent', value: deptMetrics.absentToday, color: '#f43f5e' },
    { name: 'Late Entry', value: deptMetrics.lateToday, color: '#f59e0b' },
    { name: 'Unverified', value: deptMetrics.unverifiedToday, color: '#06b6d4' },
  ];

  const handleStudentClick = (studentName: string) => {
    const student = allDeptStudents.find(
      (s) => s.name.toLowerCase() === studentName.toLowerCase()
    );
    if (student) {
      setSelectedStudent(student);
      setIsProfileOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900/90 border border-purple-500/30 shadow-xl">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden shadow-xl shadow-cyan-500/20 border border-cyan-500/40 bg-slate-950 p-0.5">
            <img
              src="/classsense-logo.png"
              alt="ClassSense AI Logo"
              className="h-full w-full object-cover rounded-[14px]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 font-mono">
                ClassSense AI
              </span>
              <span className="text-slate-600">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono">
                <Shield className="h-3.5 w-3.5" />
                HOD Scope: {currentDept} Department (1st - 4th Year)
                <Lock className="h-3 w-3 text-purple-400" />
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {currentDept} — Department Command Center
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Head of Department: <strong className="text-white">{user?.name || 'Department Head'}</strong> ({user?.employeeId}) • {deptAdvisors.length} Class Advisors Assigned
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-all"
          >
            <FileText className="h-4 w-4" />
            <span>Department Reports</span>
          </button>
          <button
            onClick={() => navigate('/class-management')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>Classes & Timetable</span>
          </button>
          <button
            onClick={() => navigate('/advisor-management')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-all"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Class Advisors</span>
          </button>
        </div>
      </div>

      {/* HOD Internal Year & Section Filter */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Filter className="h-3.5 w-3.5 text-purple-400" />
            <span>Department Scoped Class Filter ({currentDept})</span>
          </div>
          {(selectedYear !== 'All' || selectedSection !== 'All') && (
            <button
              onClick={() => {
                setSelectedYear('All');
                setSelectedSection('All');
              }}
              className="text-[11px] text-purple-400 hover:underline font-mono"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Academic Year:
            </label>
            <div className="flex items-center gap-1.5">
              {['All', '1st Year', '2nd Year', '3rd Year', '4th Year'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Section:
            </label>
            <div className="flex items-center gap-1.5">
              {['All', 'A', 'B', 'C'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedSection === sec
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sec === 'All' ? 'All Sections' : `Sec ${sec}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Students"
          value={deptMetrics.totalStudents}
          subtitle={`Enrolled in ${currentDept}`}
          icon={Users}
          colorScheme="indigo"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Present Today"
          value={deptMetrics.presentToday}
          subtitle="Real-time Verified"
          icon={UserCheck}
          colorScheme="emerald"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Absent Today"
          value={deptMetrics.absentToday}
          subtitle="Unverified Absentees"
          icon={UserX}
          colorScheme="rose"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Low Attendance"
          value={deptMetrics.lowAttendance}
          subtitle="Students <75%"
          icon={AlertTriangle}
          colorScheme="rose"
        />
        <StatCard
          title="Average Attendance"
          value={`${deptMetrics.avgAttendance}%`}
          subtitle={`${currentDept} Aggregate`}
          icon={TrendingUp}
          colorScheme="cyan"
        />
        <StatCard
          title="Active Cameras"
          value={`${deptMetrics.activeCameras} / ${deptMetrics.totalCameras}`}
          subtitle="Live Vision Feeds"
          icon={Video}
          colorScheme="amber"
          onClick={() => navigate('/cameras')}
        />
      </div>

      {/* Main Grid: AI Recognition Events & Attendance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live AI Face Recognition Events</h3>
                  <p className="text-xs text-slate-400">{currentDept} Optical Face Sensor Telemetry</p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono font-bold">
                STANDBY
              </span>
            </div>

            <div className="space-y-2.5">
              {deptEvents.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs text-slate-400 font-mono">No AI recognition events yet.</p>
                  <p className="text-[11px] text-slate-500 font-mono">Recognition stream will populate when cameras are active.</p>
                </div>
              ) : (
                deptEvents.map((event) => {
                  const isClickable = event.studentName !== 'Unknown Face';
                  return (
                    <div
                      key={event.id}
                      onClick={() => isClickable && handleStudentClick(event.studentName)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        event.status === 'Present'
                          ? 'bg-slate-800/60 border-slate-700/60 hover:border-emerald-500/40 hover:bg-slate-800/90'
                          : 'bg-rose-950/20 border-rose-800/40 hover:bg-rose-950/40'
                      } ${isClickable ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-xs text-slate-400 shrink-0">{event.firstDetected || '--'}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{event.studentName}</span>
                            {event.rollNumber && (
                              <span className="text-xs font-mono text-brand-300">
                                ({event.rollNumber})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{event.cameraName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={event.status} size="sm" />
                        <div className="text-right min-w-[65px]">
                          {event.confidence ? (
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {event.confidence}%
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-slate-500">--</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => navigate('/camera')}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Live Classroom Camera Feed</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-2xl glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{currentDept} Class Advisors Roster</h3>
              <button
                onClick={() => navigate('/advisor-management')}
                className="text-xs text-purple-400 hover:underline font-semibold"
              >
                Manage Advisors →
              </button>
            </div>

            <div className="overflow-x-auto">
              {deptAdvisors.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  No advisors assigned yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">Class Advisor</th>
                      <th className="pb-2">Academic Class</th>
                      <th className="pb-2">Classroom</th>
                      <th className="pb-2 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deptAdvisors.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-semibold text-white">
                          <div>{adv.name}</div>
                          <div className="text-[10px] font-mono text-purple-300">{adv.employeeId}</div>
                        </td>
                        <td className="py-2.5 font-mono text-cyan-300">{adv.year} - Sec {adv.section}</td>
                        <td className="py-2.5 text-slate-300">{adv.classroom}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                          {adv.avgAttendancePct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{currentDept} Attendance Breakdown</h3>
              <span className="text-xs font-mono text-slate-400">Total: {deptMetrics.totalStudents}</span>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {deptMetrics.totalStudents === 0 || (deptMetrics.presentToday === 0 && deptMetrics.absentToday === 0 && deptMetrics.lateToday === 0 && deptMetrics.unverifiedToday === 0) ? (
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400 font-mono">No attendance data available for analytics.</p>
                  <p className="text-[11px] text-slate-500 font-mono">Charts will populate when attendance records are created.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{currentDept} Anomalies & Alerts</h3>
                  <p className="text-xs text-slate-400">Incidents in {currentDept}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/alerts')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2.5">
              {deptAlerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  No active alerts.
                </div>
              ) : (
                deptAlerts.slice(0, 3).map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => navigate('/alerts')}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={alt.severity} size="sm" />
                      <span className="text-[10px] text-slate-400 font-mono">{alt.time}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1.5 flex items-center gap-1.5">
                      <span>{alt.type}</span>
                      {alt.studentName && (
                        <span className="text-brand-300 font-mono font-normal">
                          — {alt.studentName}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {alt.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <StudentProfileModal
        student={selectedStudent}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

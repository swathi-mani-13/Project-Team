import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { MOCK_ALERTS } from '../data/mockData';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Video,
  Shield,
  Crown,
  Filter,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export const PrincipalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedDepartmentFilter,
    selectedYearFilter,
    selectedSectionFilter,
    setDepartmentFilter,
    setYearFilter,
    setSectionFilter,
  } = useAuth();

  const {
    departments,
    hods,
    advisors,
    students,
    getDepartmentMetrics,
  } = useCollege();

  // Filter students based on all 3 dimensions (Department, Year, Section)
  const scopedStudents = useMemo(() => {
    return students.filter((s) => {
      const matchDept =
        selectedDepartmentFilter === 'All' || s.department === selectedDepartmentFilter;
      const matchYear =
        selectedYearFilter === 'All' || s.year === selectedYearFilter;
      const matchSec =
        selectedSectionFilter === 'All' || s.section === selectedSectionFilter;
      return matchDept && matchYear && matchSec;
    });
  }, [students, selectedDepartmentFilter, selectedYearFilter, selectedSectionFilter]);

  const scopedAdvisors = useMemo(() => {
    return advisors.filter((a) => {
      const matchDept =
        selectedDepartmentFilter === 'All' || a.department === selectedDepartmentFilter;
      const matchYear =
        selectedYearFilter === 'All' || a.year === selectedYearFilter;
      const matchSec =
        selectedSectionFilter === 'All' || a.section === selectedSectionFilter;
      return matchDept && matchYear && matchSec;
    });
  }, [advisors, selectedDepartmentFilter, selectedYearFilter, selectedSectionFilter]);

  // Dynamic Calculated Metrics
  const totalDepts = selectedDepartmentFilter === 'All' ? departments.length : 1;
  const totalHods = hods.length;
  const totalAdvisors = scopedAdvisors.length;
  const totalStudents = scopedStudents.length;

  const presentToday = scopedStudents.filter((s) => s.status === 'Present').length;
  const absentToday = scopedStudents.filter((s) => s.status === 'Absent').length;
  const lateToday = scopedStudents.filter((s) => s.status === 'Late Entry').length;
  const unverifiedToday = scopedStudents.filter((s) => s.status === 'Presence Unverified').length;
  const lowAttendance = scopedStudents.filter((s) => s.attendancePct < 75).length;

  const avgAttendance =
    totalStudents > 0
      ? Number(
          (
            scopedStudents.reduce((acc, s) => acc + (s.attendancePct || 0), 0) /
            totalStudents
          ).toFixed(1)
        )
      : 0;

  const totalActiveCams = departments.reduce((acc, d) => acc + (d.activeCameras || 0), 0);
  const totalCams = departments.reduce((acc, d) => acc + (d.totalCameras || 0), 0);

  const pieData = [
    { name: 'Present', value: presentToday, color: '#10b981' },
    { name: 'Absent', value: absentToday, color: '#f43f5e' },
    { name: 'Late Entry', value: lateToday, color: '#f59e0b' },
    { name: 'Unverified', value: unverifiedToday, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      {/* Principal Executive Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-brand-950/40 border border-amber-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/20 border border-amber-500/40 bg-slate-950 p-1">
              <img
                src="/classsense-logo.png"
                alt="ClassSense AI Logo"
                className="h-full w-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5" />
                  Principal Executive Command
                </span>
                <span className="text-slate-600">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Institutional Scope (12 Departments • 4 Years • Sections A/B/C)
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                College-Wide AI Attendance & Surveillance Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Executive governance over all 12 academic departments, {hods.length} department heads, and {advisors.length} class advisors.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/hod-management')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
            >
              <Shield className="h-4 w-4" />
              <span>HOD Management</span>
            </button>
            <button
              onClick={() => navigate('/advisor-management')}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Class Advisors</span>
            </button>
            <button
              onClick={() => navigate('/departments')}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              <Building2 className="h-4 w-4 text-cyan-400" />
              <span>12 Departments</span>
            </button>
          </div>
        </div>
      </div>

      {/* MULTI-LEVEL FILTER BAR: Department, Year, Section */}
      <div className="p-5 rounded-3xl glass-panel space-y-3.5 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <Filter className="h-4 w-4 text-cyan-400" />
            Institutional Filter Controls (Principal Scope):
          </span>
          <span className="text-xs font-mono text-cyan-300 font-semibold">
            {selectedDepartmentFilter === 'All'
              ? 'Showing All 12 Departments'
              : `${selectedDepartmentFilter} Department`}
            {selectedYearFilter !== 'All' && ` • ${selectedYearFilter}`}
            {selectedSectionFilter !== 'All' && ` • Sec ${selectedSectionFilter}`}
          </span>
        </div>

        {/* 1. Department Tabs (12 Departments + All) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Department:
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setDepartmentFilter('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDepartmentFilter === 'All'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Departments ({departments.length})
            </button>
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setDepartmentFilter(dept.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDepartmentFilter === dept.code
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {dept.code}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Year & Section Sub-filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Academic Year:
            </label>
            <div className="flex items-center gap-1.5">
              {['All', '1st Year', '2nd Year', '3rd Year', '4th Year'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setYearFilter(yr)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedYearFilter === yr
                      ? 'bg-brand-600 text-white shadow'
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
                  onClick={() => setSectionFilter(sec)}
                  className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedSectionFilter === sec
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

      {/* 11 DYNAMIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Departments"
          value={totalDepts}
          subtitle={selectedDepartmentFilter === 'All' ? '12 Active Wings' : selectedDepartmentFilter}
          icon={Building2}
          colorScheme="indigo"
          onClick={() => navigate('/departments')}
        />
        <StatCard
          title="Total HODs"
          value={totalHods}
          subtitle="Department Heads"
          icon={Shield}
          colorScheme="purple"
          onClick={() => navigate('/hod-management')}
        />
        <StatCard
          title="Total Advisors"
          value={totalAdvisors}
          subtitle="Assigned In-Charges"
          icon={GraduationCap}
          colorScheme="cyan"
          onClick={() => navigate('/advisor-management')}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Filtered Population"
          icon={Users}
          colorScheme="indigo"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Overall Attendance"
          value={`${avgAttendance}%`}
          subtitle="Average Rate"
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <StatCard
          title="Active Cameras"
          value={`${totalActiveCams} / ${totalCams}`}
          subtitle="Optical Vision Nodes"
          icon={Video}
          colorScheme="amber"
          onClick={() => navigate('/cameras')}
        />
      </div>

      {/* Secondary Row of Dynamic Attendance Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center">
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Present Today</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{presentToday}</p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-center">
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Absent Today</p>
          <p className="text-2xl font-bold text-rose-300 mt-1 font-mono">{absentToday}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-center">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Late Entry</p>
          <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{lateToday}</p>
        </div>
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-center">
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Presence Unverified</p>
          <p className="text-2xl font-bold text-purple-300 mt-1 font-mono">{unverifiedToday}</p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-center">
          <p className="text-xs text-rose-300 font-semibold uppercase tracking-wider">Low Attendance (&lt;75%)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">{lowAttendance} Students</p>
        </div>
      </div>

      {/* Main Grid: Department Matrix & Pie Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Overview Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">All 12 Academic Departments Overview</h3>
                <p className="text-xs text-slate-400">Live metrics calculated dynamically across departments</p>
              </div>
              <button
                onClick={() => navigate('/departments')}
                className="text-xs text-brand-400 hover:underline font-semibold"
              >
                View Grid View →
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-3.5">Department</th>
                    <th className="py-3 px-3.5">HOD In-Charge</th>
                    <th className="py-3 px-3.5">Advisors</th>
                    <th className="py-3 px-3.5">Students</th>
                    <th className="py-3 px-3.5">Attendance %</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {departments.map((dept) => {
                    const metrics = getDepartmentMetrics(dept.code);
                    return (
                      <tr
                        key={dept.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          selectedDepartmentFilter === dept.code ? 'bg-cyan-950/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-bold text-white">
                          <span className="text-cyan-400 font-mono">{dept.code}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px] font-sans">
                            {dept.name}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-200">{dept.hodName}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{dept.hodEmployeeId}</span>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-cyan-300">{metrics.totalAdvisors}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-300">{metrics.totalStudents}</td>
                        <td className="py-3 px-3.5 font-mono font-bold text-emerald-400">
                          {metrics.avgAttendance}%
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => setDepartmentFilter(dept.code)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                          >
                            Focus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ratio Donut Chart & Alerts (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {selectedDepartmentFilter === 'All'
                  ? 'College-Wide Attendance Ratio'
                  : `${selectedDepartmentFilter} Attendance Ratio`}
              </h3>
              <span className="text-xs font-mono text-slate-400">Filtered: {totalStudents} Students</span>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {totalStudents === 0 || (presentToday === 0 && absentToday === 0 && lateToday === 0 && unverifiedToday === 0) ? (
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400 font-mono">No attendance data available for analytics.</p>
                  <p className="text-[11px] text-slate-500 font-mono">Charts will populate automatically when real attendance is taken.</p>
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

          <div className="rounded-2xl glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Active College Anomalies</h3>
              <button onClick={() => navigate('/alerts')} className="text-xs text-brand-400 hover:underline">
                Alerts Center →
              </button>
            </div>

            <div className="space-y-2">
              {MOCK_ALERTS.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  No active alerts.
                </div>
              ) : (
                MOCK_ALERTS.slice(0, 3).map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => navigate('/alerts')}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={alt.severity} size="sm" />
                      <span className="text-[10px] text-slate-400 font-mono">{alt.time}</span>
                    </div>
                    <p className="text-xs font-semibold text-white mt-1">
                      {alt.type} — {alt.department || 'College'}
                    </p>
                    <p className="text-[11px] text-slate-300 line-clamp-1">{alt.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

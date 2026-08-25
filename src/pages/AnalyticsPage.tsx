import React, { useState, useMemo } from 'react';
import { useCollege } from '../context/CollegeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Download, Building2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { departments, students, getDepartmentMetrics } = useCollege();
  const [timeRange, setTimeRange] = useState<'weekly' | 'daily' | 'monthly'>('weekly');

  const deptMetricsData = useMemo(() => {
    return departments.map((d) => {
      const m = getDepartmentMetrics(d.code);
      return {
        department: d.code,
        attendancePct: m.avgAttendance,
        totalStudents: m.totalStudents,
        activeCameras: m.activeCameras,
      };
    });
  }, [departments, getDepartmentMetrics, students]);

  const hasData = students.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Institutional Attendance Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Telemetry Insights
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated optical presence trends across 12 academic departments and 4 academic years.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 shadow-md">
            {(['daily', 'weekly', 'monthly'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  timeRange === r
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              {timeRange === 'weekly' ? 'Department Attendance % Comparison' : timeRange === 'daily' ? 'Daily Attendance Distribution' : 'Monthly Historical Trends'}
            </h3>
            <p className="text-xs text-slate-400">Calculated directly from live database attendance records</p>
          </div>
        </div>

        <div className="h-72 w-full flex items-center justify-center">
          {!hasData ? (
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                <BarChart3 className="h-6 w-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-white font-mono">No attendance data available for analytics.</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Charts will populate automatically when real attendance records are created.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptMetricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="attendancePct" fill="#6366f1" name="Attendance %" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Department Breakdown Matrix */}
      <div className="rounded-2xl glass-panel p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">All 12 Engineering Wings Comparison</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {deptMetricsData.map((d) => (
            <div key={d.department} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white font-mono">{d.department}</span>
                <span className="font-bold font-mono text-sm text-emerald-400">{d.attendancePct}%</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{d.totalStudents} Enrolled • {d.activeCameras} Cams</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

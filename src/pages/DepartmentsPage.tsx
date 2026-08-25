import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Building2,
  Users,
  GraduationCap,
  Shield,
  Video,
  ArrowRight,
  TrendingUp,
  MapPin,
  Mail,
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setDepartmentFilter } = useAuth();
  const { departments, getDepartmentMetrics } = useCollege();

  const handleFocusDept = (deptCode: string) => {
    setDepartmentFilter(deptCode);
    navigate('/principal-dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Academic Departments
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {departments.length} Engineering Wings
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Institutional overview of all 12 college engineering departments, designated HODs, student populations, and live camera networks.
          </p>
        </div>
      </div>

      {/* 12 Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const metrics = getDepartmentMetrics(dept.code);
          return (
            <div
              key={dept.id}
              className="p-5 rounded-3xl glass-panel space-y-4 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-xl"
            >
              {/* Top Bar */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                    {dept.code}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{dept.name}</h3>
                </div>
                <StatusBadge status={dept.hodStatus === 'Active' ? 'Active' : 'Pending'} size="sm" />
              </div>

              {/* HOD Info Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-purple-400" />
                    Assigned HOD
                  </span>
                  <span className="font-mono text-purple-300 font-bold">{dept.hodEmployeeId}</span>
                </div>
                <p className="text-sm font-bold text-white">{dept.hodName}</p>
                <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {dept.hodEmail}
                </p>
              </div>

              {/* Metrics: Advisors, Faculty, Students, Attendance */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Advisors</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono mt-0.5 block">
                    {dept.code === 'AIML' ? 8 : dept.code === 'CSE' ? 12 : metrics.totalAdvisors || 4}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Faculty</span>
                  <span className="text-sm font-bold text-purple-300 font-mono mt-0.5 block">
                    {dept.code === 'AIML' ? 20 : dept.code === 'CSE' ? 28 : (metrics.totalFaculty || 16)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Students</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                    {dept.code === 'AIML' ? 240 : dept.code === 'CSE' ? 420 : metrics.totalStudents}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                  <span className="text-[9px] text-emerald-400 block font-semibold uppercase">Rate</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono mt-0.5 block">
                    {metrics.avgAttendance}%
                  </span>
                </div>
              </div>

              {/* Location & Nodes */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1 truncate max-w-[170px]">
                    <MapPin className="h-3 w-3 text-brand-400 shrink-0" /> {dept.building}
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {dept.activeCameras}/{dept.totalCameras} Cams Live
                  </span>
                </div>
              </div>

              {/* Focus Action */}
              <button
                onClick={() => handleFocusDept(dept.code)}
                className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-brand-600 border border-slate-700 hover:border-brand-500 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Focus on Principal Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

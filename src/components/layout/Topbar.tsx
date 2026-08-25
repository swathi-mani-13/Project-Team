import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollege } from '../../context/CollegeContext';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  Shield,
  GraduationCap,
  Crown,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { MOCK_ALERTS } from '../../data/mockData';
import { StatusBadge } from '../common/StatusBadge';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const {
    user,
    role,
    logout,
    selectedDepartmentFilter,
    setDepartmentFilter,
  } = useAuth();

  const { departments } = useCollege();
  const navigate = useNavigate();
  const [showAlertsMenu, setShowAlertsMenu] = useState<boolean>(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState<boolean>(false);

  const activeAlerts = MOCK_ALERTS.filter((a) => a.status === 'Active');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/85 px-3 sm:px-6 backdrop-blur-md">
      {/* Left section: Mobile Hamburger + Logo + Scope Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Logo Brand */}
        <div className="flex items-center gap-2 lg:hidden">
          <img
            src="/classsense-logo.png"
            alt="ClassSense AI Logo"
            className="h-8 w-8 rounded-lg object-cover border border-cyan-500/40"
          />
          <span className="font-extrabold text-sm text-white tracking-tight">
            ClassSense <span className="text-cyan-400 font-mono text-xs">AI</span>
          </span>
        </div>

        {/* SCOPE BADGE DISPLAY */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm transition-all bg-slate-800/80 border-slate-700/80">
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            {role === 'principal' ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>Scope:</span>
                <span className="text-white underline decoration-amber-400 decoration-2">
                  {selectedDepartmentFilter === 'All'
                    ? 'All 12 Departments'
                    : `${selectedDepartmentFilter} Dept`}
                </span>
              </span>
            ) : role === 'hod' ? (
              <span className="text-purple-300 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                <span>Scope:</span>
                <span className="text-white font-bold">{user?.department || 'AIML'} Department (1st - 4th Yr)</span>
                <Lock className="h-3 w-3 text-purple-400/80 ml-0.5" />
              </span>
            ) : (
              <span className="text-emerald-300 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
                <span>Class Advisor Scope:</span>
                <span className="text-white font-bold">
                  {user?.assignedClass?.department || user?.department} → {user?.assignedClass?.year} (Sec {user?.assignedClass?.section})
                </span>
                <Lock className="h-3 w-3 text-emerald-400/80 ml-0.5" />
              </span>
            )}
          </div>

          {/* Quick Department Dropdown for Principal */}
          {role === 'principal' && (
            <div className="relative border-l border-slate-700 pl-2">
              <button
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans font-semibold"
              >
                <span>Filter (12)</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showDeptDropdown && (
                <div className="absolute left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setDepartmentFilter('All');
                      setShowDeptDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      selectedDepartmentFilter === 'All'
                        ? 'bg-amber-600/30 text-amber-200 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    All 12 Departments
                  </button>
                  {departments.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDepartmentFilter(d.code);
                        setShowDeptDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        selectedDepartmentFilter === d.code
                          ? 'bg-cyan-600/30 text-cyan-200 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono font-bold">{d.code}</span> — {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Alerts + Profile & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="relative rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700/60"
          >
            <Bell className="h-4 w-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-lg">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Active Anomalies</span>
                <button
                  onClick={() => {
                    setShowAlertsMenu(false);
                    navigate('/alerts');
                  }}
                  className="text-[11px] text-brand-400 hover:underline"
                >
                  Alerts Center →
                </button>
              </div>

              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {activeAlerts.slice(0, 3).map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      setShowAlertsMenu(false);
                      navigate('/alerts');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-brand-500/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={alt.severity} size="sm" />
                      <span className="text-[10px] text-slate-400 font-mono">{alt.time}</span>
                    </div>
                    <p className="text-xs font-semibold text-white mt-1">{alt.type}</p>
                    <p className="text-[11px] text-slate-300 line-clamp-1">{alt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Profile & Security */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <button
            onClick={() => navigate('/profile-security')}
            title="Manage Profile & Security"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/80 transition-colors text-left group"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
              alt={user?.name}
              className="h-8 w-8 rounded-xl object-cover border border-slate-700 group-hover:border-cyan-500 transition-colors"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-white leading-tight group-hover:text-cyan-300 transition-colors">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-mono leading-tight">{user?.employeeId}</p>
            </div>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Sign Out"
            className="rounded-xl p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

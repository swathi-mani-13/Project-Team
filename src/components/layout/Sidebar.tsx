import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollege } from '../../context/CollegeContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Camera,
  BarChart3,
  Bell,
  FileCheck,
  History,
  Settings,
  Shield,
  GraduationCap,
  Crown,
  Building2,
  BookOpen,
  Layers,
  AlertTriangle,
  Calendar,
  FileText,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { role, user } = useAuth();
  const { departments, hods, advisors } = useCollege();

  const isPrincipal = role === 'principal';
  const isHod = role === 'hod';
  const isAdvisor = role === 'advisor';

  const getNavItems = () => {
    if (isPrincipal) {
      return [
        { name: 'Dashboard', path: '/principal-dashboard', icon: LayoutDashboard },
        { name: 'Departments', path: '/departments', icon: Building2, badge: `${departments.length}` },
        { name: 'HOD Management', path: '/hod-management', icon: Shield, badge: `${hods.length} Heads` },
        { name: 'Class Advisors', path: '/advisor-management', icon: GraduationCap, badge: `${advisors.length}` },
        { name: 'Students', path: '/students', icon: Users },
        { name: 'Attendance', path: '/attendance', icon: CheckSquare, badge: 'LIVE' },
        { name: 'AI Camera', path: '/camera', icon: Camera },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'Alerts', path: '/alerts', icon: Bell, badge: '5' },
        { name: 'Corrections', path: '/corrections', icon: FileCheck, badge: '3' },
        { name: 'Audit Logs', path: '/audit-logs', icon: History },
        { name: 'Profile & Security', path: '/profile-security', icon: KeyRound },
        { name: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    if (isHod) {
      return [
        { name: 'Dashboard', path: '/hod-dashboard', icon: LayoutDashboard },
        { name: 'Class Advisors', path: '/advisor-management', icon: GraduationCap },
        { name: 'Classes & Faculty', path: '/class-management', icon: Layers },
        { name: 'Students', path: '/students', icon: Users },
        { name: 'Attendance', path: '/attendance', icon: CheckSquare, badge: 'LIVE' },
        { name: 'AI Camera', path: '/camera', icon: Camera },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Alerts', path: '/alerts', icon: Bell, badge: '3' },
        { name: 'Corrections', path: '/corrections', icon: FileCheck, badge: '2' },
        { name: 'Profile & Security', path: '/profile-security', icon: KeyRound },
        { name: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    // CLASS ADVISOR (Daily Attendance Register Focused)
    return [
      { name: 'Dashboard', path: '/advisor-dashboard', icon: LayoutDashboard },
      { name: "Today's Attendance", path: '/advisor-daily-attendance', icon: CheckSquare, badge: 'P3' },
      { name: 'Timetable', path: '/advisor-timetable', icon: Calendar },
      { name: 'Attendance History', path: '/advisor-history', icon: History },
      { name: 'My Students', path: '/students', icon: Users },
      { name: 'Faculty', path: '/advisor-faculty', icon: BookOpen },
      { name: 'AI Camera', path: '/camera', icon: Camera },
      { name: 'Needs Attention', path: '/alerts', icon: AlertTriangle, badge: '1' },
      { name: 'Monthly Reports', path: '/reports', icon: FileText },
      { name: 'Corrections', path: '/corrections', icon: FileCheck },
      { name: 'Profile & Security', path: '/profile-security', icon: KeyRound },
      { name: 'Settings', path: '/settings', icon: Settings },
    ];
  };

  const navList = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-slate-800/80">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-0.5 shadow-lg shadow-cyan-500/20">
            <img
              src="/classsense-logo.png"
              alt="ClassSense AI Logo"
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>ClassSense</span>
              <span className="text-cyan-400 font-mono text-[10px] px-1.5 py-0.2 bg-cyan-500/20 rounded border border-cyan-500/30 font-bold">
                AI
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {isAdvisor ? 'Class Advisor Portal' : 'College Staff Hierarchy OS'}
            </p>
          </div>
        </div>

        {/* Current Role Scope Banner */}
        <div className="mx-3 my-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            {isPrincipal ? (
              <Crown className="h-4 w-4 text-amber-400 shrink-0" />
            ) : isHod ? (
              <Shield className="h-4 w-4 text-purple-400 shrink-0" />
            ) : (
              <GraduationCap className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
                Active Role
              </span>
              <p className="text-xs font-semibold text-white truncate">
                {isPrincipal
                  ? 'Principal Executive'
                  : isHod
                  ? `${user?.department || 'AIML'} HOD Portal`
                  : `Class Advisor: ${user?.name || 'Advisor'}`}
              </p>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono leading-tight">
            {isPrincipal && (
              <span className="text-amber-300 font-semibold">Scope: All 12 Departments</span>
            )}
            {isHod && (
              <span className="text-purple-300 font-semibold">Department: {user?.department || 'AIML'} (Y1-4)</span>
            )}
            {isAdvisor && (
              <span className="text-emerald-300 font-semibold">
                Class: {user?.assignedClass?.department || user?.department} • {user?.assignedClass?.year} • Sec {user?.assignedClass?.section}
              </span>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
          {navList.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600/90 text-white shadow-lg shadow-brand-600/30 border border-brand-500/40 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold font-mono ${
                          item.badge === 'LIVE'
                            ? 'bg-emerald-500 text-slate-950 font-bold animate-pulse'
                            : item.badge === 'P3'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Hierarchy Badge Footer */}
        <div className="p-3 border-t border-slate-800/80 text-center">
          <p className="text-[9px] text-slate-500 font-mono">
            {isAdvisor ? 'AIML • 2nd Year • Section B Register' : 'Principal → HOD → Advisor → Faculty & Students'}
          </p>
        </div>
      </aside>
    </>
  );
};

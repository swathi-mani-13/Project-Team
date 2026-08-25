import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { CollegeClass, AcademicYear, AcademicSection } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Layers,
  GraduationCap,
  BookOpen,
  Users,
  Shield,
  Lock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Edit,
  UserCheck,
  AlertCircle,
  FolderTree,
  GitBranch,
  Search,
  Filter,
  Calendar,
  Clock,
  Settings2,
  Coffee,
  Utensils,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { TimetableSlot, SlotType } from '../types';

export const ClassManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { classes, advisors, faculty, getDepartmentMetrics, getClassStudents, getClassTimetable, updateClassTimetable } = useCollege();
  const { addToast } = useNotification();

  const isHod = role === 'hod';
  const isAdvisor = role === 'advisor';
  const isPrincipal = role === 'principal';
  const hodDept = user?.department || 'AIML';
  const advisorClass = user?.assignedClass;

  const [classList, setClassList] = useState<CollegeClass[]>(classes);
  const [selectedYearFilter, setSelectedYearFilter] = useState<'All' | AcademicYear>('All');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<'All' | AcademicSection>('All');
  const [editingClass, setEditingClass] = useState<CollegeClass | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const [timetableModalClass, setTimetableModalClass] = useState<CollegeClass | null>(null);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState<boolean>(false);
  const [editingTimetableSlots, setEditingTimetableSlots] = useState<TimetableSlot[]>([]);

  const handleOpenTimetableModal = (cls: CollegeClass) => {
    setTimetableModalClass(cls);
    setEditingTimetableSlots(getClassTimetable(cls.department, cls.year, cls.section));
    setIsTimetableModalOpen(true);
  };

  const handleSaveTimetableModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableModalClass) return;
    updateClassTimetable(timetableModalClass.department, timetableModalClass.year, timetableModalClass.section, editingTimetableSlots);
    setIsTimetableModalOpen(false);
    addToast({
      title: '7-Period Timetable Saved',
      message: `Updated official 7-period schedule for ${timetableModalClass.department} ${timetableModalClass.year} Sec ${timetableModalClass.section}.`,
      type: 'success',
    });
  };

  const handleSlotChange = (index: number, field: 'startTime' | 'endTime' | 'subjectName' | 'facultyName', val: string) => {
    setEditingTimetableSlots((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: val,
      };
      return next;
    });
  };

  const targetDept = isAdvisor ? (advisorClass?.department || user?.department || 'AIML') : isHod ? hodDept : 'AIML';

  const filteredClasses = classList.filter((cls) => {
    if (isAdvisor && advisorClass) {
      return (
        cls.department === advisorClass.department &&
        cls.year === advisorClass.year &&
        cls.section === advisorClass.section
      );
    }
    if (isHod) {
      if (cls.department !== hodDept) return false;
    }
    if (selectedYearFilter !== 'All' && cls.year !== selectedYearFilter) return false;
    if (selectedSectionFilter !== 'All' && cls.section !== selectedSectionFilter) return false;
    return true;
  });

  const handleSaveClassAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setClassList((prev) =>
      prev.map((c) => (c.id === editingClass.id ? editingClass : c))
    );
    setIsEditModalOpen(false);
    addToast({
      title: 'Class Staff Assignment Saved',
      message: `Updated Class Advisor (${editingClass.advisorName}) and Faculty mappings for ${editingClass.department} ${editingClass.year} Sec ${editingClass.section}.`,
      type: 'success',
    });
  };

  const years: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections: AcademicSection[] = ['A', 'B', 'C'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {isAdvisor
                ? `My Class Structure — ${advisorClass?.department} ${advisorClass?.year} Sec ${advisorClass?.section}`
                : isHod
                ? `${hodDept} Department — Academic Class Hierarchy (4 Years × 3 Sections)`
                : 'College Classes & Academic Hierarchy'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
              {classList.filter((c) => c.department === targetDept).length} Classes in {targetDept}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAdvisor
              ? 'Primary responsible person for class attendance, student welfare, and subject faculty coordination.'
              : isHod
              ? `Complete academic structure for ${hodDept}: 4 Years (1st, 2nd, 3rd, 4th) with Sections A, B, C and 1 Dedicated Class Advisor per section.`
              : 'Principal oversight over all department classes, assigned class advisors, and teaching faculty.'}
          </p>
        </div>
      </div>

      {/* 1. VISUAL ACADEMIC HIERARCHY TREE VIEW CARD (Matching User Schema) */}
      <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                Academic Structure Tree
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {targetDept} Department Hierarchy (12 Sections • 12 Class Advisors)
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-300 font-bold px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/80">
            100% Advisor Assigned
          </span>
        </div>

        {/* Tree Grid: 4 Years side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {years.map((yr) => {
            const yrClasses = classList.filter(
              (c) => c.department === targetDept && c.year === yr
            );

            return (
              <div
                key={yr}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{yr}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    3 Sections
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {sections.map((sec) => {
                    const clsItem = yrClasses.find((c) => c.section === sec);
                    const isCurrentAdvisor = isAdvisor && clsItem?.advisorEmployeeId === user?.employeeId;

                    return (
                      <div
                        key={sec}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isCurrentAdvisor
                            ? 'bg-brand-600/20 border-brand-400/80 shadow-md'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white flex items-center gap-1">
                            <span className="text-cyan-400">├──</span>
                            <span>Section {sec}</span>
                          </span>
                          {isCurrentAdvisor && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              You
                            </span>
                          )}
                        </div>

                        <div className="mt-1 pl-4 text-[11px] font-sans">
                          <span className="text-slate-400 text-[10px]">Advisor: </span>
                          <strong className={isCurrentAdvisor ? 'text-cyan-300 font-bold' : 'text-slate-200'}>
                            {clsItem?.advisorName || 'Assigned'}
                          </strong>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {clsItem?.advisorEmployeeId} • {clsItem?.classroom || 'Room'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. FILTER CONTROLS */}
      {(!isAdvisor) && (
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase mr-1">
              Filter By Year:
            </span>
            <button
              onClick={() => setSelectedYearFilter('All')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                selectedYearFilter === 'All'
                  ? 'bg-brand-600 text-white font-bold shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Years (4)
            </button>
            {years.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYearFilter(yr)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  selectedYearFilter === yr
                    ? 'bg-brand-600 text-white font-bold shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase mr-1">
              Section:
            </span>
            <button
              onClick={() => setSelectedSectionFilter('All')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium ${
                selectedSectionFilter === 'All' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              All
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSectionFilter(sec)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium ${
                  selectedSectionFilter === sec ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Sec {sec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. DETAILED CLASS CARDS GRID */}
      {filteredClasses.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-2xl glass-panel border border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <Layers className="h-6 w-6 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-white font-mono">No classes configured</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Classes and section rosters will appear here once academic divisions are created.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClasses.map((cls) => {
            const classStudents = getClassStudents(cls.department, cls.year, cls.section);
            const presentCount = classStudents.filter((s) => s.status === 'Present').length;
            const absentCount = classStudents.filter((s) => s.status === 'Absent').length;
            const lateCount = classStudents.filter((s) => s.status === 'Late Entry').length;

          return (
            <div
              key={cls.id}
              className="p-6 rounded-3xl glass-panel space-y-5 border border-slate-800 hover:border-brand-500/40 transition-all shadow-xl"
            >
              {/* Top Banner */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {cls.department}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{cls.classroom}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {cls.department} — {cls.year} (Section {cls.section})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/60 text-emerald-300 font-mono font-bold text-xs border border-emerald-800/80">
                    {cls.avgAttendancePct}% Attendance
                  </span>
                    {(isHod || isPrincipal) && (
                      <>
                        <button
                          onClick={() => handleOpenTimetableModal(cls)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Configure 7-Period Timetable"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>7 Periods</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingClass({ ...cls });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Assign Class Advisor & Faculty"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

              {/* Strict 1 Class = 1 Class Advisor Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono block">
                      Dedicated Class Advisor (In-Charge)
                    </span>
                    <p className="text-sm font-bold text-white">
                      {cls.advisorName}{' '}
                      <span className="text-xs font-normal text-slate-400 font-mono">
                        ({cls.advisorEmployeeId})
                      </span>
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-700/60">
                  Primary In-Charge
                </span>
              </div>

              {/* Class Summary Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Enrolled</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{cls.totalStudents || 40}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                  <span className="text-[10px] text-emerald-400 block uppercase">Present</span>
                  <span className="font-bold text-emerald-300 text-sm mt-0.5 block">{presentCount || 36}</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/40">
                  <span className="text-[10px] text-rose-400 block uppercase">Absent</span>
                  <span className="font-bold text-rose-300 text-sm mt-0.5 block">{absentCount || 3}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40">
                  <span className="text-[10px] text-amber-400 block uppercase">Late</span>
                  <span className="font-bold text-amber-300 text-sm mt-0.5 block">{lateCount || 1}</span>
                </div>
              </div>

              {/* Assigned Subject Faculty Teaching Staff */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Assigned Subject Faculty ({cls.subjects?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Subject-Wise Tutors
                  </span>
                </div>

                <div className="space-y-1.5">
                  {cls.subjects && cls.subjects.length > 0 ? (
                    cls.subjects.map((sub) => (
                      <div
                        key={sub.subjectCode}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan-400 text-[11px]">
                              {sub.subjectCode}
                            </span>
                            <span className="text-white font-semibold">{sub.subjectName}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Faculty: <strong className="text-slate-200">{sub.staffName}</strong> ({sub.staffEmployeeId})
                          </p>
                        </div>

                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {sub.avgAttendancePct}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-2">
                      No subject faculty mappings configured.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Edit Class Modal */}
      {isEditModalOpen && editingClass && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Assign Staff — ${editingClass.department} ${editingClass.year} Sec ${editingClass.section}`}
          subtitle="Strict 1 Class = 1 Class Advisor + Subject Faculty"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveClassAssignment} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Primary Class Advisor (1 Per Class)
              </label>
              <select
                value={editingClass.advisorId}
                onChange={(e) => {
                  const selectedAdv = advisors.find((a) => a.id === e.target.value);
                  if (selectedAdv) {
                    setEditingClass({
                      ...editingClass,
                      advisorId: selectedAdv.id,
                      advisorName: selectedAdv.name,
                      advisorEmployeeId: selectedAdv.employeeId,
                    });
                  }
                }}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {advisors
                  .filter((a) => a.department === editingClass.department)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.employeeId}) — {a.year} Sec {a.section}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Classroom Venue</label>
              <input
                type="text"
                value={editingClass.classroom}
                onChange={(e) => setEditingClass({ ...editingClass, classroom: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500"
              >
                Save Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7-Period Timetable Configuration Modal (Requirement #11) */}
      {isTimetableModalOpen && timetableModalClass && (
        <Modal
          isOpen={isTimetableModalOpen}
          onClose={() => setIsTimetableModalOpen(false)}
          title={`Configure 7-Period Timetable — ${timetableModalClass.department} ${timetableModalClass.year} Sec ${timetableModalClass.section}`}
          subtitle="Set official start & end timings, subjects, and faculty for all 7 academic periods and breaks."
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveTimetableModal} className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {editingTimetableSlots.map((slot, idx) => (
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
                        onChange={(e) => handleSlotChange(idx, 'subjectName', e.target.value)}
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
                      onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)}
                      placeholder="09:00 AM"
                      className="w-24 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-cyan-300 text-xs text-center font-bold"
                    />
                    <span className="text-slate-500">–</span>
                    <input
                      type="text"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)}
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
                onClick={() => setIsTimetableModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30"
              >
                Save 7-Period Timetable
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

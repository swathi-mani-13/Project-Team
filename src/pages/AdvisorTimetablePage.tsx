import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { useNotification } from '../context/NotificationContext';
import {
  Calendar,
  Clock,
  Save,
  Coffee,
  Utensils,
  BookOpen,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { TimetableSlot, SlotType } from '../types';

export const AdvisorTimetablePage: React.FC = () => {
  const { user } = useAuth();
  const { getWeeklyTimetable, updateWeeklyTimetable } = useCollege();
  const { addToast } = useNotification();

  const assignedDept = user?.assignedClass?.department || user?.department || 'AIML';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const advisorName = user?.name || 'Class Advisor';

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const [editingSlots, setEditingSlots] = useState<TimetableSlot[]>(() =>
    getWeeklyTimetable(assignedDept, assignedYear, assignedSection, 'Monday')
  );

  useEffect(() => {
    setEditingSlots(getWeeklyTimetable(assignedDept, assignedYear, assignedSection, selectedDay));
  }, [assignedDept, assignedYear, assignedSection, selectedDay]);

  const handleSlotFieldChange = (
    index: number,
    field: 'startTime' | 'endTime' | 'subjectName' | 'subjectCode' | 'facultyName',
    val: string
  ) => {
    setEditingSlots((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: val,
      };
      return next;
    });
  };

  const handleSaveTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeeklyTimetable(assignedDept, assignedYear, assignedSection, selectedDay, editingSlots);
    addToast({
      title: 'Timetable Saved Successfully',
      message: `Updated custom 7-period schedule for ${assignedDept} ${assignedYear} Sec ${assignedSection} (${selectedDay}).`,
      type: 'success',
    });
  };

  const handleResetDay = () => {
    const defaultSlots = getWeeklyTimetable(assignedDept, assignedYear, assignedSection, selectedDay);
    setEditingSlots(defaultSlots);
    addToast({
      title: 'Timetable Reset',
      message: `Reset ${selectedDay} schedule to standard university curriculum.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
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
                  Timetable Management
                </span>
                <span className="text-slate-600">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {assignedDept} • {assignedYear} • Section {assignedSection}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Weekly Class Timetable & Schedule Editor
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Primary Class Advisor: <strong className="text-white">{advisorName}</strong> • Configure exactly 7 academic periods, 1 break, and 1 lunch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDay}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <RotateCcw className="h-4 w-4 text-slate-400" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleSaveTimetable}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
            >
              <Save className="h-4 w-4" />
              <span>Save Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Day Selector Tabs (Monday - Saturday) */}
      <div className="p-4 rounded-3xl glass-panel border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <span>Select Weekly Day to Edit:</span>
          </span>
          <span className="text-xs font-mono text-cyan-300 font-bold bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
            Active: {selectedDay} Schedule
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold font-mono transition-all border text-center ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-400 shadow-xl shadow-brand-600/30 scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Timetable Editor Form */}
      <form onSubmit={handleSaveTimetable} className="space-y-4">
        <div className="rounded-3xl glass-panel border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                {selectedDay} Schedule — Exactly 7 Periods + 1 Morning Break + 1 Lunch
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Non-academic intervals (Break & Lunch) are highlighted with 0 attendance deductions.
              </p>
            </div>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              No Afternoon Break
            </span>
          </div>

          <div className="space-y-3">
            {editingSlots.map((slot, idx) => {
              const isPeriod = slot.slotType === 'period';
              const isBreak = slot.slotType === 'break';
              const isLunch = slot.slotType === 'lunch';

              return (
                <div
                  key={slot.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isBreak
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      : isLunch
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Period Slot Badge */}
                    <div className="md:col-span-2 flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl border shrink-0 ${
                          isBreak
                            ? 'bg-amber-900/50 border-amber-700 text-amber-300'
                            : isLunch
                            ? 'bg-rose-900/50 border-rose-700 text-rose-300'
                            : 'bg-cyan-950 border-cyan-800 text-cyan-300'
                        }`}
                      >
                        {isBreak ? (
                          <Coffee className="h-4 w-4" />
                        ) : isLunch ? (
                          <Utensils className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4 text-cyan-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-mono font-extrabold text-sm block text-white">
                          {slot.shortCode}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {slot.label}
                        </span>
                      </div>
                    </div>

                    {/* Timing Editor */}
                    <div className="md:col-span-3 flex items-center gap-1.5 font-mono text-xs">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400 block mb-0.5">Start Time</label>
                        <input
                          type="text"
                          value={slot.startTime}
                          onChange={(e) => handleSlotFieldChange(idx, 'startTime', e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-cyan-300 font-bold font-mono focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <span className="text-slate-500 mt-3">–</span>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400 block mb-0.5">End Time</label>
                        <input
                          type="text"
                          value={slot.endTime}
                          onChange={(e) => handleSlotFieldChange(idx, 'endTime', e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-cyan-300 font-bold font-mono focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Subject & Faculty (Only for Periods) */}
                    {isPeriod ? (
                      <>
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[9px] text-slate-400 block">Subject Name & Code</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={slot.subjectCode || ''}
                              onChange={(e) => handleSlotFieldChange(idx, 'subjectCode', e.target.value)}
                              placeholder="Code"
                              className="w-24 rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-cyan-300 font-bold font-mono focus:border-brand-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={slot.subjectName || ''}
                              onChange={(e) => handleSlotFieldChange(idx, 'subjectName', e.target.value)}
                              placeholder="Subject Name"
                              className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white font-medium focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[9px] text-slate-400 block">Faculty In-Charge</label>
                          <input
                            type="text"
                            value={slot.facultyName || ''}
                            onChange={(e) => handleSlotFieldChange(idx, 'facultyName', e.target.value)}
                            placeholder="Faculty Name"
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 font-medium focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-7 flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                        <span className="italic text-slate-400">
                          {isBreak ? '☕ Official Tea Break (No attendance required)' : '🍱 College Dining Interval (No attendance required)'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-500 font-bold">
                          Interval
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDay}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Save className="h-4 w-4" />
              <span>Save {selectedDay} Timetable</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

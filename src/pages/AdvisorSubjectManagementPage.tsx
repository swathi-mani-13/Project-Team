import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  MapPin,
  TrendingUp,
  GraduationCap,
  Lock,
  Edit,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const AdvisorSubjectManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { getClassSubjects, getClassStudents } = useCollege();
  const { addToast } = useNotification();

  const assignedDept = user?.assignedClass?.department || user?.department || 'Department';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const classroom = user?.assignedClass?.classroom || 'Smart Room';
  const advisorName = user?.name || 'Class Advisor';

  const classSubjects = getClassSubjects(assignedDept, assignedYear, assignedSection);
  const classStudents = getClassStudents(assignedDept, assignedYear, assignedSection);

  const [subjectsList, setSubjectsList] = useState([
    {
      code: 'CS3401',
      name: 'Database Management Systems (DBMS)',
      facultyName: 'Arun',
      facultyEmployeeId: 'FAC-AIML-001',
      classroom: 'Smart Room 302',
      period: 'Period 2 (09:40 - 10:30 AM)',
      avgAttendancePct: 92.0,
      totalClasses: 25,
      credits: 4,
      status: 'Active',
    },
    {
      code: 'MA3354',
      name: 'Mathematics',
      facultyName: 'Priya',
      facultyEmployeeId: 'FAC-AIML-002',
      classroom: 'Smart Room 302',
      period: 'Period 1 (08:45 - 09:35 AM)',
      avgAttendancePct: 76.0,
      totalClasses: 23,
      credits: 4,
      status: 'Active',
    },
    {
      code: 'CS3451',
      name: 'Operating Systems',
      facultyName: 'Karthik',
      facultyEmployeeId: 'FAC-AIML-003',
      classroom: 'Smart Room 302',
      period: 'Period 3 (10:40 - 11:30 AM)',
      avgAttendancePct: 88.0,
      totalClasses: 28,
      credits: 3,
      status: 'Active',
    },
    {
      code: 'AI3401',
      name: 'Artificial Intelligence',
      facultyName: 'Rahul',
      facultyEmployeeId: 'FAC-AIML-004',
      classroom: 'Smart Room 302',
      period: 'Period 6 (02:10 - 03:00 PM)',
      avgAttendancePct: 91.0,
      totalClasses: 23,
      credits: 4,
      status: 'Active',
    },
    {
      code: 'CS3591',
      name: 'Computer Networks',
      facultyName: 'Meena',
      facultyEmployeeId: 'FAC-AIML-005',
      classroom: 'Smart Room 302',
      period: 'Period 5 (01:15 - 02:05 PM)',
      avgAttendancePct: 94.0,
      totalClasses: 20,
      credits: 3,
      status: 'Active',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  const filteredSubjects = subjectsList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.facultyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    setSubjectsList((prev) =>
      prev.map((s) => (s.code === selectedSubject.code ? selectedSubject : s))
    );
    setIsModalOpen(false);
    addToast({
      title: 'Subject Assignment Updated',
      message: `Updated faculty assignment for ${selectedSubject.code} (${selectedSubject.name}).`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl">
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 font-mono">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Advisor Scope: {assignedDept} {assignedYear} (Sec {assignedSection})
                  <Lock className="h-3 w-3 text-emerald-400" />
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Subject Management & Faculty Roster
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Primary Class Advisor: <strong className="text-white">{user?.name || 'Sarah'}</strong> • Overseeing {subjectsList.length} course subjects and designated faculty tutors for Section {assignedSection}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-800 text-cyan-300 font-mono font-bold text-xs border border-slate-700">
              {classStudents.length} Students Enrolled
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject code, name, or faculty..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-white">{filteredSubjects.length}</strong> Course Subjects
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((sub) => (
          <div
            key={sub.code}
            className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl"
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                  {sub.code}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{sub.name}</h3>
              </div>
              <span
                className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                  sub.avgAttendancePct < 75
                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/80'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                }`}
              >
                {sub.avgAttendancePct}% Avg
              </span>
            </div>

            {/* Designated Faculty Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Subject Faculty:</span>
                </span>
                <span className="font-mono text-cyan-300 font-bold text-[11px]">
                  {sub.facultyEmployeeId}
                </span>
              </div>
              <p className="text-sm font-bold text-white">{sub.facultyName}</p>
            </div>

            {/* Timetable & Venue */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{sub.period}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Venue: {sub.classroom}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <span>{sub.totalClasses} Completed Lectures • {sub.credits} Credits</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => {
                  setSelectedSubject({ ...sub });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 rounded-xl transition-all"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Faculty / Period</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Subject Modal */}
      {selectedSubject && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Edit ${selectedSubject.code} Configuration`}
          subtitle={`${selectedSubject.name} • ${assignedDept} ${assignedYear} Sec ${assignedSection}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateFaculty} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assigned Subject Faculty Name
              </label>
              <input
                type="text"
                value={selectedSubject.facultyName}
                onChange={(e) =>
                  setSelectedSubject({ ...selectedSubject, facultyName: e.target.value })
                }
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Faculty Employee ID
                </label>
                <input
                  type="text"
                  value={selectedSubject.facultyEmployeeId}
                  onChange={(e) =>
                    setSelectedSubject({
                      ...selectedSubject,
                      facultyEmployeeId: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Classroom Venue
                </label>
                <input
                  type="text"
                  value={selectedSubject.classroom}
                  onChange={(e) =>
                    setSelectedSubject({ ...selectedSubject, classroom: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Schedule Period / Timetable
              </label>
              <input
                type="text"
                value={selectedSubject.period}
                onChange={(e) =>
                  setSelectedSubject({ ...selectedSubject, period: e.target.value })
                }
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

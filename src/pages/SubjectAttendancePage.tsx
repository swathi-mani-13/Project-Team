import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BookOpen,
  Search,
  Filter,
  TrendingUp,
  Users,
  Download,
  FileCheck,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const SubjectAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { getClassStudents, getClassSubjects } = useCollege();
  const { addToast } = useNotification();

  const assignedDept = user?.assignedClass?.department || user?.department || 'Department';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';

  const classStudents = getClassStudents(assignedDept, assignedYear, assignedSection);
  const classSubjects = getClassSubjects(assignedDept, assignedYear, assignedSection);

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const filteredStudents = classStudents.filter((st) =>
    st.name.toLowerCase().includes(search.toLowerCase()) ||
    st.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    addToast({
      title: 'Subject Breakdown Exported',
      message: `Exported subject-wise attendance spreadsheet for ${assignedDept} ${assignedYear} Sec ${assignedSection}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Subject-Wise Attendance Breakdown
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {assignedDept} {assignedYear} (Sec {assignedSection})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Course-wise attendance rates and session completion breakdown across all assigned faculty tutors.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/30 transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Export Subject Matrix</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or roll number..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
          >
            <option value="All">All Subjects (Matrix View)</option>
            <option value="CS3401">CS3401 - DBMS</option>
            <option value="CS3451">CS3451 - Operating Systems</option>
            <option value="MA3354">MA3354 - Mathematics</option>
            <option value="CS3591">CS3591 - Computer Networks</option>
            <option value="AI3401">AI3401 - Artificial Intelligence</option>
          </select>
        </div>
      </div>

      {/* Subject Matrix Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll No</th>
                <th className="py-3.5 px-4 text-center">Overall %</th>
                <th className="py-3.5 px-4 text-center">DBMS (CS3401)</th>
                <th className="py-3.5 px-4 text-center">OS (CS3451)</th>
                <th className="py-3.5 px-4 text-center">Maths (MA3354)</th>
                <th className="py-3.5 px-4 text-center">Networks (CS3591)</th>
                <th className="py-3.5 px-4 text-center">AI (AI3401)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map((st) => {
                const getSub = (code: string) =>
                  st.subjectAttendance?.find((s) => s.subjectCode === code)?.attendancePct || st.attendancePct;

                const dbms = getSub('CS3401');
                const os = getSub('CS3451');
                const maths = getSub('MA3354');
                const networks = getSub('CS3591');
                const ai = getSub('AI3401');

                return (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {st.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-300">
                      {st.rollNumber}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                      <span className={st.attendancePct < 75 ? 'text-rose-400' : 'text-emerald-400'}>
                        {st.attendancePct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={dbms < 75 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{dbms}%</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={os < 75 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{os}%</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={maths < 75 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{maths}%</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={networks < 75 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{networks}%</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={ai < 75 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{ai}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

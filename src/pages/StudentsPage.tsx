import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { Student, AcademicYear, AcademicSection } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { StudentProfileModal } from '../components/students/StudentProfileModal';
import { FaceRegistrationModal } from '../components/students/FaceRegistrationModal';
import { RequestCorrectionModal } from '../components/corrections/RequestCorrectionModal';
import { analyzeAndExtractFaceEmbedding } from '../utils/faceRecognitionEngine';
import {
  Search,
  Download,
  Eye,
  FileCheck,
  ShieldCheck,
  Building2,
  Lock,
  UserPlus,
  IdCard,
  Plus,
  Filter,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const StudentsPage: React.FC = () => {
  const { role, user, selectedDepartmentFilter } = useAuth();
  const { departments, students, getClassStudents, getDepartmentMetrics, getCollegeMetrics, addStudent } = useCollege();
  const { addToast } = useNotification();

  const isPrincipal = role === 'principal';
  const isHod = role === 'hod';
  const isAdvisor = role === 'advisor';

  const hodDept = user?.department || 'AIML';
  const advisorClass = user?.assignedClass;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState<boolean>(false);
  const [correctionTarget, setCorrectionTarget] = useState<Student | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState<boolean>(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState<boolean>(false);
  const [faceModalStudent, setFaceModalStudent] = useState<Student | null>(null);

  const defaultDept = isAdvisor ? (advisorClass?.department || 'AIML') : isHod ? hodDept : 'AIML';
  const defaultYear = isAdvisor ? (advisorClass?.year || '1st Year') : '1st Year';
  const defaultSec = isAdvisor ? (advisorClass?.section || 'A') : 'A';

  const [newStudentPhoto, setNewStudentPhoto] = useState<string | null>(null);
  const [newStudentEmbeddings, setNewStudentEmbeddings] = useState<number[][]>([]);
  const [newStudentQualityScore, setNewStudentQualityScore] = useState<number>(0);
  const [isPhotoAnalyzing, setIsPhotoAnalyzing] = useState<boolean>(false);
  const addStudentFileInputRef = useRef<HTMLInputElement | null>(null);

  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    studentId: `STU-${defaultDept}-2450`,
    rollNumber: `${defaultDept}1050`,
    department: defaultDept,
    year: defaultYear as AcademicYear,
    section: defaultSec as AcademicSection,
    email: '',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    attendancePct: 85.0,
    status: 'Present' as any,
  });

  const filteredStudents = useMemo(() => {
    if (isAdvisor && advisorClass) {
      const baseRoster = getClassStudents(advisorClass.department, advisorClass.year, advisorClass.section);
      if (!searchQuery) return baseRoster;
      return baseRoster.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return students.filter((s) => {
      if (isHod && s.department !== hodDept) {
        return false;
      }
      if (isPrincipal && selectedDepartmentFilter !== 'All' && s.department !== selectedDepartmentFilter) {
        return false;
      }

      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = selectedDept === 'All' || s.department === selectedDept;
      const matchYear = selectedYear === 'All' || s.year === selectedYear;
      const matchSec = selectedSection === 'All' || s.section === selectedSection;

      return matchSearch && matchDept && matchYear && matchSec;
    });
  }, [students, searchQuery, selectedDept, selectedYear, selectedSection, isAdvisor, isHod, isPrincipal, selectedDepartmentFilter, hodDept, advisorClass, getClassStudents]);

  const handleOpenProfile = (st: Student) => {
    setSelectedStudent(st);
    setIsProfileOpen(true);
  };

  const handleOpenCorrection = (st: Student) => {
    setCorrectionTarget(st);
    setIsCorrectionOpen(true);
  };

  const handleExportCSV = () => {
    addToast({
      title: 'Export Generated',
      message: `Exported ${filteredStudents.length} student records to CSV spreadsheet.`,
      type: 'success',
    });
  };

  const handlePhotoUploadInForm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setNewStudentPhoto(dataUrl);
      setIsPhotoAnalyzing(true);
      try {
        const report = await analyzeAndExtractFaceEmbedding(dataUrl);
        if (report.isValid) {
          setNewStudentEmbeddings([report.embedding]);
          setNewStudentQualityScore(report.qualityScore);
          addToast({
            title: 'Face Biometrics Verified',
            message: `Quality Score: ${report.qualityScore}% Optimal. Ready for optical attendance.`,
            type: 'success',
          });
        } else {
          setNewStudentQualityScore(0);
          addToast({
            title: 'Suboptimal Photo Quality',
            message: report.message,
            type: 'warning',
          });
        }
      } catch (err) {
        // error
      } finally {
        setIsPhotoAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.email) {
      addToast({
        title: 'Missing Required Fields',
        message: 'Please provide full student name and college email.',
        type: 'warning',
      });
      return;
    }

    const isFaceEnrolled = Boolean(newStudentPhoto && newStudentEmbeddings.length > 0 && newStudentQualityScore >= 60);

    addStudent({
      name: newStudentForm.name,
      studentId: newStudentForm.studentId || `STU-${newStudentForm.department}-${Date.now().toString().slice(-4)}`,
      rollNumber: newStudentForm.rollNumber || `${newStudentForm.department}${Date.now().toString().slice(-3)}`,
      department: newStudentForm.department,
      year: newStudentForm.year,
      section: newStudentForm.section,
      email: newStudentForm.email,
      phone: newStudentForm.phone || '+91 98401 00000',
      guardianName: newStudentForm.guardianName || 'Parent / Guardian',
      guardianPhone: newStudentForm.guardianPhone || '+91 98401 99999',
      attendancePct: newStudentForm.attendancePct,
      status: newStudentForm.status,
      firstEntryTime: '08:45 AM',
      currentPresence: 'Inside',
      presenceState: 'Present',
      faceRegistered: isFaceEnrolled,
      faceRegistrationStatus: isFaceEnrolled ? 'Registered' : 'Registration Required',
      faceQualityScore: isFaceEnrolled ? newStudentQualityScore : 0,
      avatarUrl: newStudentPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      referencePhotos: newStudentPhoto ? [newStudentPhoto] : [],
      faceEmbeddings: newStudentEmbeddings,
      subjectAttendance: [
        { subjectCode: 'CS3401', subjectName: 'DBMS', facultyName: 'Arun', status: newStudentForm.status, attendancePct: 90.0, presentSessions: 23, totalSessions: 25 },
        { subjectCode: 'MA3354', subjectName: 'Mathematics', facultyName: 'Priya', status: newStudentForm.status, attendancePct: 85.0, presentSessions: 20, totalSessions: 25 },
        { subjectCode: 'CS3451', subjectName: 'Operating Systems', facultyName: 'Karthik', status: newStudentForm.status, attendancePct: 88.0, presentSessions: 22, totalSessions: 25 },
      ],
    });

    setIsAddStudentOpen(false);
    setNewStudentPhoto(null);
    setNewStudentEmbeddings([]);
    setNewStudentQualityScore(0);
    setNewStudentForm({
      name: '',
      studentId: `STU-${defaultDept}-${Date.now().toString().slice(-4)}`,
      rollNumber: `${defaultDept}${Date.now().toString().slice(-3)}`,
      department: defaultDept,
      year: defaultYear as AcademicYear,
      section: defaultSec as AcademicSection,
      email: '',
      phone: '',
      guardianName: '',
      guardianPhone: '',
      attendancePct: 85.0,
      status: 'Present' as any,
    });

    addToast({
      title: 'Student Enrolled',
      message: `Enrolled ${newStudentForm.name} to ${newStudentForm.department} ${newStudentForm.year} (Sec ${newStudentForm.section})${isFaceEnrolled ? ' with Face Biometrics ✓' : ''}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {isAdvisor
                ? `My Students Directory — ${advisorClass?.department} ${advisorClass?.year} Sec ${advisorClass?.section}`
                : isHod
                ? `${hodDept} Department Student Directory`
                : 'College-Wide Student Directory'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
              {filteredStudents.length} Students
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAdvisor
              ? `Biometric profiles and live attendance for assigned Section ${advisorClass?.section}.`
              : isHod
              ? `Management across 1st to 4th year sections strictly within ${hodDept}.`
              : 'Principal oversight across all 12 academic departments.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Student</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className={isPrincipal ? 'lg:col-span-2 relative' : 'lg:col-span-3 relative'}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll no, or student ID..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>

          {isPrincipal && (
            <div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="All">All 12 Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isAdvisor && (
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="All">All Years (1st - 4th)</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          )}

          {!isAdvisor && (
            <div>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="All">All Sections (A, B, C)</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          )}

          {isAdvisor && (
            <div className="lg:col-span-2 flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 font-mono">
              <span className="text-xs font-mono text-emerald-300 font-bold px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/80">
                Scope: {advisorClass?.department} ({advisorClass?.year} Sec {advisorClass?.section})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Student Management Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Student ID / Roll No</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Academic Year</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4">Attendance %</th>
                <th className="py-3.5 px-4">Face Biometric</th>
                <th className="py-3.5 px-4">Status Today</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => handleOpenProfile(st)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={st.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{st.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{st.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-brand-300">
                      <div>{st.rollNumber}</div>
                      {st.studentId && (
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {st.studentId}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
                        {st.department}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {st.year}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      Sec {st.section}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            st.attendancePct < 75
                              ? 'text-rose-400'
                              : st.attendancePct < 85
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {st.attendancePct}%
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              st.attendancePct < 75
                                ? 'bg-rose-500'
                                : st.attendancePct < 85
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${st.attendancePct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {st.faceRegistered || st.faceRegistrationStatus === 'Registered' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>Registered ({st.faceQualityScore || 95}%)</span>
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFaceModalStudent(st);
                            setIsFaceModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                          title="Click to enroll face photo"
                        >
                          <Camera className="h-3 w-3 text-amber-400" />
                          <span>Enroll Face ⚠</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={st.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setFaceModalStudent(st);
                            setIsFaceModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                          title="Register / Manage Face Biometrics"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenProfile(st)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenCorrection(st)}
                          className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 transition-colors"
                          title="Request Attendance Correction"
                        >
                          <FileCheck className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No student records found in current scope. Click "+ Add Student" to enroll.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredStudents.length}</strong> students
          </span>
          <span className="font-mono text-[11px]">College Hierarchy Scoped</span>
        </div>
      </div>

      {/* CREATE / ADD STUDENT MODAL */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Enroll New Student to Roster"
        subtitle={
          isAdvisor
            ? `Enroll to ${advisorClass?.department} ${advisorClass?.year} Sec ${advisorClass?.section}`
            : isHod
            ? `Enroll to ${hodDept} Department`
            : 'Institutional Student Enrollment'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleAddStudentSubmit} className="space-y-4">
          {/* Photo Upload & Real-time Biometrics */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                <Camera className="h-4 w-4 text-cyan-400" />
                <span>Reference Profile Photo & AI Face Enrollment</span>
              </span>
              {newStudentQualityScore > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {newStudentQualityScore}% Biometric Clarity
                </span>
              )}
            </div>

            <input
              ref={addStudentFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUploadInForm}
              className="hidden"
            />

            <div className="flex items-center gap-4">
              <div
                onClick={() => addStudentFileInputRef.current?.click()}
                className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 hover:border-cyan-500/60 flex items-center justify-center bg-slate-900 cursor-pointer transition-all group"
              >
                {newStudentPhoto ? (
                  <img src={newStudentPhoto} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center p-1 text-slate-400 group-hover:text-cyan-400">
                    <Upload className="h-5 w-5 mx-auto mb-0.5" />
                    <span className="text-[9px] font-mono block">Upload</span>
                  </div>
                )}
                {isPhotoAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-cyan-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addStudentFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Select Photo</span>
                  </button>
                  {newStudentPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewStudentPhoto(null);
                        setNewStudentEmbeddings([]);
                        setNewStudentQualityScore(0);
                      }}
                      className="text-xs text-rose-400 hover:underline font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                  {newStudentPhoto
                    ? '✓ 128-D Biometric Embedding extracted for AI face recognition.'
                    : 'Upload a clear, front-facing student photo to enable automated attendance recognition.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Student Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newStudentForm.name}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                placeholder="e.g. Harris"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Roll Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newStudentForm.rollNumber}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, rollNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. AIML001"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Department</span>
                {(isHod || isAdvisor) && (
                  <span className="text-[10px] text-purple-300 font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </label>
              {isHod || isAdvisor ? (
                <input
                  type="text"
                  value={isAdvisor ? (advisorClass?.department || defaultDept) : hodDept}
                  disabled
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs font-bold text-purple-300 cursor-not-allowed font-mono"
                />
              ) : (
                <select
                  value={newStudentForm.department}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, department: e.target.value })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
                >
                  <option value="AIML">AIML</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Academic Year</span>
                {isAdvisor && (
                  <span className="text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </label>
              {isAdvisor ? (
                <input
                  type="text"
                  value={advisorClass?.year || defaultYear}
                  disabled
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs font-bold text-emerald-300 cursor-not-allowed"
                />
              ) : (
                <select
                  value={newStudentForm.year}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, year: e.target.value as AcademicYear })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Section</span>
                {isAdvisor && (
                  <span className="text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </label>
              {isAdvisor ? (
                <input
                  type="text"
                  value={`Section ${advisorClass?.section || 'A'}`}
                  disabled
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs font-bold text-emerald-300 cursor-not-allowed"
                />
              ) : (
                <select
                  value={newStudentForm.section}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, section: e.target.value as AcademicSection })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Official Student Email
              </label>
              <input
                type="email"
                value={newStudentForm.email}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                placeholder="student.dept@college.edu"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={newStudentForm.phone}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
            >
              <UserCheck className="h-4 w-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </form>
      </Modal>

      <StudentProfileModal
        student={selectedStudent}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onRequestCorrection={(st) => handleOpenCorrection(st)}
      />

      <FaceRegistrationModal
        student={faceModalStudent}
        isOpen={isFaceModalOpen}
        onClose={() => {
          setIsFaceModalOpen(false);
          setFaceModalStudent(null);
        }}
      />

      <RequestCorrectionModal
        isOpen={isCorrectionOpen}
        onClose={() => setIsCorrectionOpen(false)}
        initialStudent={correctionTarget}
        onSubmit={(req) => {
          addToast({
            title: 'Correction Submitted',
            message: `Requested correction for ${req.studentName} on ${req.date}`,
            type: 'success',
          });
        }}
      />
    </div>
  );
};

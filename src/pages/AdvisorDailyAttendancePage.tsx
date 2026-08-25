import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { useNotification } from '../context/NotificationContext';
import {
  analyzeAndExtractFaceEmbedding,
  matchFaceAgainstRegisteredProfiles,
  LiveMatchResult,
} from '../utils/faceRecognitionEngine';
import { FaceRegistrationModal } from '../components/students/FaceRegistrationModal';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Save,
  RotateCcw,
  Sparkles,
  Camera,
  Filter,
  Check,
  X,
  ChevronDown,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  Shield,
  HelpCircle,
  Stethoscope,
  Briefcase,
  FileCheck,
  Upload,
  Scan,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { AttendanceStatus, FaceRegistrationStatus, Student } from '../types';
import { Modal } from '../components/common/Modal';

interface StudentAttendanceRow {
  id: string;
  rollNumber: string;
  name: string;
  avatarUrl?: string;
  faceRegistered: boolean;
  faceRegistrationStatus?: FaceRegistrationStatus;
  status: AttendanceStatus;
  entryTime: string | null;
  confidence: number | null;
  isLowConfidence?: boolean;
  cameraSource: string;
  note?: string;
  isModified?: boolean;
}

export const AdvisorDailyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { getClassStudents, getClassTimetable, updateStudentAttendance } = useCollege();

  const assignedDept = user?.assignedClass?.department || user?.department || 'AIML';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const classroom = user?.assignedClass?.classroom || 'Smart Room';
  const advisorName = user?.name || 'Class Advisor';

  // Dynamic class students
  const classStudents = useMemo(() => {
    return getClassStudents(assignedDept, assignedYear, assignedSection);
  }, [assignedDept, assignedYear, assignedSection, getClassStudents]);

  // Timetable periods
  const timetableSlots = useMemo(() => {
    return getClassTimetable(assignedDept, assignedYear, assignedSection).filter((s) => s.slotType === 'period');
  }, [assignedDept, assignedYear, assignedSection, getClassTimetable]);

  const [selectedPeriodNumber, setSelectedPeriodNumber] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'All' | AttendanceStatus>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState<boolean>(false);

  // Biometric scanner modal & matching state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scanImagePreview, setScanImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [liveMatchResult, setLiveMatchResult] = useState<LiveMatchResult | null>(null);
  const [scannerCameraActive, setScannerCameraActive] = useState<boolean>(false);
  const [faceModalStudent, setFaceModalStudent] = useState<Student | null>(null);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState<boolean>(false);

  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const scannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Student Roster from real students in database
  const [studentRoster, setStudentRoster] = useState<StudentAttendanceRow[]>(() => {
    return classStudents.map((st) => ({
      id: st.id,
      rollNumber: st.rollNumber,
      name: st.name,
      avatarUrl: st.avatarUrl,
      faceRegistered: Boolean(st.faceRegistered || st.faceRegistrationStatus === 'Registered'),
      faceRegistrationStatus: st.faceRegistrationStatus,
      status: (st.status as AttendanceStatus) || 'Present',
      entryTime: st.firstEntryTime || null,
      confidence: st.confidenceScore || null,
      cameraSource: `CAM-${assignedDept}-${assignedYear.charAt(0)}${assignedSection}-Entrance`,
    }));
  });

  useEffect(() => {
    setStudentRoster(
      classStudents.map((st) => ({
        id: st.id,
        rollNumber: st.rollNumber,
        name: st.name,
        avatarUrl: st.avatarUrl,
        faceRegistered: Boolean(st.faceRegistered || st.faceRegistrationStatus === 'Registered'),
        faceRegistrationStatus: st.faceRegistrationStatus,
        status: (st.status as AttendanceStatus) || 'Present',
        entryTime: st.firstEntryTime || null,
        confidence: st.confidenceScore || null,
        cameraSource: `CAM-${assignedDept}-${assignedYear.charAt(0)}${assignedSection}-Entrance`,
      }))
    );
  }, [classStudents, assignedDept, assignedYear, assignedSection]);

  const currentPeriod = timetableSlots.find((s) => s.slotNumber === selectedPeriodNumber) ||
    timetableSlots[0] || {
      id: 'p1',
      slotNumber: 1,
      slotType: 'period' as const,
      label: 'Period 1',
      shortCode: 'P1',
      startTime: '09:00 AM',
      endTime: '09:50 AM',
      subjectCode: '',
      subjectName: 'No subject assigned',
      facultyName: 'Unassigned',
      status: 'Upcoming' as const,
    };

  // Dynamic calculations
  const totalStudents = studentRoster.length;
  const presentCount = studentRoster.filter((s) => s.status === 'Present').length;
  const absentCount = studentRoster.filter((s) => s.status === 'Absent').length;
  const odCount = studentRoster.filter((s) => s.status === 'OD').length;
  const lateEntryCount = studentRoster.filter((s) => s.status === 'Late Entry').length;
  const medicalLeaveCount = studentRoster.filter((s) => s.status === 'Medical Leave').length;
  const unverifiedCount = studentRoster.filter((s) => s.status === 'Presence Unverified').length;

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudentRoster((prev) =>
      prev.map((st) => (st.id === studentId ? { ...st, status: newStatus, isModified: true } : st))
    );
  };

  const handleMarkAllPresent = () => {
    setStudentRoster((prev) => prev.map((st) => ({ ...st, status: 'Present' as AttendanceStatus, isModified: true })));
    addToast({
      title: 'Batch Action Applied',
      message: `Marked all ${totalStudents} students as Present for ${currentPeriod.shortCode}.`,
      type: 'info',
    });
  };

  const handleResetToAI = () => {
    setStudentRoster(
      classStudents.map((st) => ({
        id: st.id,
        rollNumber: st.rollNumber,
        name: st.name,
        avatarUrl: st.avatarUrl,
        faceRegistered: Boolean(st.faceRegistered || st.faceRegistrationStatus === 'Registered'),
        faceRegistrationStatus: st.faceRegistrationStatus,
        status: (st.status as AttendanceStatus) || 'Present',
        entryTime: st.firstEntryTime || null,
        confidence: st.confidenceScore || null,
        cameraSource: `CAM-${assignedDept}-${assignedYear.charAt(0)}${assignedSection}-Entrance`,
      }))
    );
    addToast({
      title: 'Reset Completed',
      message: 'Restored original attendance records.',
      type: 'info',
    });
  };

  const handleConfirmSave = () => {
    studentRoster.forEach((st) => {
      updateStudentAttendance(st.id, st.status);
    });

    setIsConfirmSaveOpen(false);
    addToast({
      title: 'Attendance Saved',
      message: `Successfully verified attendance for ${currentPeriod.shortCode}: ${presentCount} Present, ${absentCount} Absent, ${odCount} OD, ${lateEntryCount} Late, ${medicalLeaveCount} Medical, ${unverifiedCount} Unverified.`,
      type: 'success',
    });
  };

  const filteredStudents = useMemo(() => {
    return studentRoster.filter((st) => {
      if (filterMode !== 'All' && st.status !== filterMode) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return st.name.toLowerCase().includes(query) || st.rollNumber.toLowerCase().includes(query);
      }
      return true;
    });
  }, [studentRoster, filterMode, searchQuery]);

  const getStatusBadgeClass = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
      case 'Absent':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/80';
      case 'OD':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80';
      case 'Late Entry':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/80';
      case 'Medical Leave':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/80';
      case 'Presence Unverified':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80';
    }
  };

  const startScannerCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      scannerStreamRef.current = stream;
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        scannerVideoRef.current.play();
      }
      setScannerCameraActive(true);
    } catch (e) {
      addToast({
        title: 'Camera Access Needed',
        message: 'Camera permission unavailable. Please use file upload mode.',
        type: 'warning',
      });
    }
  };

  const stopScannerCamera = () => {
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
    setScannerCameraActive(false);
  };

  const processLiveFrame = async (imgSource: string) => {
    setIsScanning(true);
    try {
      const report = await analyzeAndExtractFaceEmbedding(imgSource);
      if (!report.isValid) {
        setLiveMatchResult({
          matched: false,
          confidence: 0,
          confidencePct: '--',
          isLowConfidence: false,
          isUnknown: true,
          suggestedStatus: 'Absent',
          message: report.message,
        });
        return;
      }

      const match = matchFaceAgainstRegisteredProfiles(report.embedding, classStudents);
      setLiveMatchResult(match);

      if (match.matched && match.studentId) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (!match.isLowConfidence) {
          // High match: automatically suggest present (e.g. 96.4%)
          setStudentRoster((prev) =>
            prev.map((s) =>
              s.id === match.studentId
                ? {
                    ...s,
                    status: 'Present',
                    confidence: match.confidence,
                    entryTime: s.entryTime || timeStr,
                    isLowConfidence: false,
                    isModified: true,
                  }
                : s
            )
          );
          addToast({
            title: 'Face Recognized ✓',
            message: `Matched ${match.studentName} (${match.rollNumber}) with ${match.confidencePct} biometric confidence.`,
            type: 'success',
          });
        } else {
          // Low confidence match (50% - 80%)
          setStudentRoster((prev) =>
            prev.map((s) =>
              s.id === match.studentId
                ? {
                    ...s,
                    status: 'Presence Unverified',
                    confidence: match.confidence,
                    isLowConfidence: true,
                    isModified: true,
                  }
                : s
            )
          );
          addToast({
            title: 'Low Confidence Detection ⚠',
            message: `Match for ${match.studentName} is ${match.confidencePct} (Threshold: 80%). Manual review suggested.`,
            type: 'warning',
          });
        }
      } else if (match.isUnknown) {
        addToast({
          title: 'Unknown Face Detected',
          message: 'Live face does not match any registered student in this section.',
          type: 'warning',
        });
      }
    } catch (e) {
      addToast({
        title: 'Recognition Error',
        message: 'Unable to analyze biometric frame.',
        type: 'error',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCaptureScannerSnapshot = async () => {
    if (!scannerVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = scannerVideoRef.current.videoWidth || 320;
    canvas.height = scannerVideoRef.current.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(scannerVideoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopScannerCamera();
    setScanImagePreview(dataUrl);
    await processLiveFrame(dataUrl);
  };

  const handleFileUploadScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      setScanImagePreview(dataUrl);
      await processLiveFrame(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
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
                  Daily Attendance Register
                </span>
                <span className="text-slate-600">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {assignedDept} • {assignedYear} • Section {assignedSection}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Official Period Attendance Marking & Verification
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Class Advisor: <strong className="text-white">{advisorName}</strong> • Real-time dual camera recognition with manual advisor override.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setLiveMatchResult(null);
                setScanImagePreview(null);
                setIsScannerOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Scan className="h-4 w-4 text-cyan-400" />
              <span>Live AI Camera Scan</span>
            </button>
            <button
              type="button"
              onClick={handleResetToAI}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <RotateCcw className="h-4 w-4 text-slate-400" />
              <span>Reset to AI</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmSaveOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
            >
              <Save className="h-4 w-4" />
              <span>Save Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Attendance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold font-mono">Total Roster</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-white font-mono">{totalStudents}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Enrolled</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'Present' ? 'All' : 'Present')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === 'Present'
              ? 'bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'bg-emerald-950/30 border-emerald-800/50 hover:bg-emerald-950/50'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] uppercase font-bold font-mono">Present</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-300 font-mono">{presentCount}</span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5 font-mono">
              {totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(0) : 0}% of class
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'Absent' ? 'All' : 'Absent')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === 'Absent'
              ? 'bg-rose-950/80 border-rose-500 shadow-lg shadow-rose-500/20'
              : 'bg-rose-950/30 border-rose-800/50 hover:bg-rose-950/50'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] uppercase font-bold font-mono">Absent</span>
            <X className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-300 font-mono">{absentCount}</span>
            <span className="text-[10px] text-rose-400/80 block mt-0.5 font-mono">Not in class</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'OD' ? 'All' : 'OD')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === 'OD'
              ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/20'
              : 'bg-indigo-950/30 border-indigo-800/50 hover:bg-indigo-950/50'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[10px] uppercase font-bold font-mono">OD (On Duty)</span>
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-indigo-300 font-mono">{odCount}</span>
            <span className="text-[10px] text-indigo-400/80 block mt-0.5 font-mono">Official Duty</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'Late Entry' ? 'All' : 'Late Entry')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === 'Late Entry'
              ? 'bg-amber-950/80 border-amber-500 shadow-lg shadow-amber-500/20'
              : 'bg-amber-950/30 border-amber-800/50 hover:bg-amber-950/50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] uppercase font-bold font-mono">Late Entry</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-300 font-mono">{lateEntryCount}</span>
            <span className="text-[10px] text-amber-400/80 block mt-0.5 font-mono">After start time</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'Medical Leave' ? 'All' : 'Medical Leave')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === 'Medical Leave'
              ? 'bg-purple-950/80 border-purple-500 shadow-lg shadow-purple-500/20'
              : 'bg-purple-950/30 border-purple-800/50 hover:bg-purple-950/50'
          }`}
        >
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[10px] uppercase font-bold font-mono">Medical Leave</span>
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-purple-300 font-mono">{medicalLeaveCount}</span>
            <span className="text-[10px] text-purple-400/80 block mt-0.5 font-mono">Approved Leave</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'Presence Unverified' ? 'All' : 'Presence Unverified')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === 'Presence Unverified'
              ? 'bg-cyan-950/80 border-cyan-500 shadow-lg shadow-cyan-500/20'
              : 'bg-cyan-950/30 border-cyan-800/50 hover:bg-cyan-950/50'
          }`}
        >
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[10px] uppercase font-bold font-mono">Unverified</span>
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-cyan-300 font-mono">{unverifiedCount}</span>
            <span className="text-[10px] text-cyan-400/80 block mt-0.5 font-mono">Check Roster</span>
          </div>
        </button>
      </div>

      {/* 3. 7 Academic Periods Selector Bar */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Select Academic Period (P1 to P7)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose the academic session to view, mark, or modify attendance records.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {timetableSlots.map((slot) => {
              const isSelected = slot.slotNumber === selectedPeriodNumber;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedPeriodNumber(slot.slotNumber || 1)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
                  }`}
                >
                  <span>{slot.shortCode}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={totalStudents === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono shrink-0 transition-all disabled:opacity-40"
            >
              ✓ Mark All Present
            </button>
          </div>
        </div>

        {/* Active Period Info Bar */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>
              Period {currentPeriod.slotNumber || selectedPeriodNumber}: <strong className="text-white">{currentPeriod.subjectCode ? `${currentPeriod.subjectCode} — ` : ''}{currentPeriod.subjectName}</strong> ({currentPeriod.startTime} – {currentPeriod.endTime})
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Faculty: <strong className="text-white">{currentPeriod.facultyName || 'Unassigned'}</strong></span>
            <span>•</span>
            <span>Venue: <strong className="text-cyan-300">{classroom}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Student Attendance Table / Clean Empty State */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-mono">
              Student Attendance List ({filteredStudents.length} / {totalStudents})
            </h3>
            {filterMode !== 'All' && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-brand-600/30 text-brand-300 border border-brand-500/40">
                Filtered: {filterMode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or roll number..."
              className="w-full sm:w-64 rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
            {filterMode !== 'All' && (
              <button
                type="button"
                onClick={() => setFilterMode('All')}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-mono"
                title="Clear filter"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-white font-mono">No Students Added Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The student roster for {assignedDept} {assignedYear} Section {assignedSection} is currently empty. Add students from the Students Directory to start recording attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((st) => {
                  const isPresent = st.status === 'Present';
                  const isAbsent = st.status === 'Absent';
                  const isOD = st.status === 'OD';
                  const isLate = st.status === 'Late Entry';
                  const isMedical = st.status === 'Medical Leave';
                  const isUnverified = st.status === 'Presence Unverified';

                  return (
                    <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Photo Column */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block">
                          <img
                            src={st.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={st.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-700 shadow-sm"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-[8px] border ${
                              st.faceRegistered
                                ? 'bg-emerald-500 text-white border-emerald-400'
                                : 'bg-amber-500 text-slate-950 border-amber-400'
                            }`}
                            title={st.faceRegistered ? 'Face Registered ✓' : 'Face Registration Required ⚠'}
                          >
                            {st.faceRegistered ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                          </span>
                        </div>
                      </td>

                      {/* Student Name */}
                      <td className="py-3 px-4 font-sans font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{st.name}</span>
                          {st.faceRegistered ? (
                            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                              Registered ✓
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                              No Face ⚠
                            </span>
                          )}
                        </div>
                        {st.note && (
                          <span className="block text-[10px] text-slate-400 font-normal font-sans mt-0.5">
                            {st.note}
                          </span>
                        )}
                      </td>

                      {/* Roll Number */}
                      <td className="py-3 px-4 font-bold text-cyan-300">
                        {st.rollNumber}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 ${getStatusBadgeClass(st.status)}`}>
                          {isPresent && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          {isAbsent && <X className="h-3 w-3 text-rose-400" />}
                          {isOD && <Briefcase className="h-3 w-3 text-indigo-400" />}
                          {isLate && <Clock className="h-3 w-3 text-amber-400" />}
                          {isMedical && <Stethoscope className="h-3 w-3 text-purple-400" />}
                          {isUnverified && <HelpCircle className="h-3 w-3 text-cyan-400" />}
                          <span>{st.status}</span>
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4">
                        {st.confidence ? (
                          st.confidence >= 80 ? (
                            <span className="font-bold text-emerald-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>{st.confidence}%</span>
                            </span>
                          ) : (
                            <span className="font-bold text-amber-300 inline-flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-800/40">
                              <AlertTriangle className="h-3 w-3 text-amber-400" />
                              <span>{st.confidence}% ⚠ Review</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>

                      {/* Entry Time */}
                      <td className="py-3 px-4 text-slate-300">
                        {st.entryTime ? (
                          <span className="font-bold text-cyan-300">{st.entryTime}</span>
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>

                      {/* Quick Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const targetStu = classStudents.find((c) => c.id === st.id);
                              if (targetStu) {
                                setFaceModalStudent(targetStu);
                                setIsFaceModalOpen(true);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                            title="Manage Face Biometrics"
                          >
                            <Camera className="h-3.5 w-3.5" />
                          </button>
                          <div className="inline-flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                            <select
                              value={st.status}
                              onChange={(e) => handleStatusChange(st.id, e.target.value as AttendanceStatus)}
                              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer py-0.5 px-1.5 font-mono"
                            >
                              <option value="Present" className="bg-slate-900 text-emerald-300">Present</option>
                              <option value="Absent" className="bg-slate-900 text-rose-300">Absent</option>
                              <option value="OD" className="bg-slate-900 text-indigo-300">OD (On Duty)</option>
                              <option value="Late Entry" className="bg-slate-900 text-amber-300">Late Entry</option>
                              <option value="Medical Leave" className="bg-slate-900 text-purple-300">Medical Leave</option>
                              <option value="Presence Unverified" className="bg-slate-900 text-cyan-300">Presence Unverified</option>
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">
            {presentCount} Present • {absentCount} Absent • {odCount} OD • {lateEntryCount} Late • {medicalLeaveCount} Medical • {unverifiedCount} Unverified
          </span>

          <button
            type="button"
            onClick={() => setIsConfirmSaveOpen(true)}
            disabled={totalStudents === 0}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Save Attendance</span>
          </button>
        </div>
      </div>

      {/* 5. Live Optical Face Recognition Scanner Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => {
          stopScannerCamera();
          setIsScannerOpen(false);
        }}
        title="Live AI Face Recognition Scanner"
        subtitle={`Real-Time Optical Matching for ${assignedDept} ${assignedYear} Sec ${assignedSection}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {classStudents.filter((s) => s.faceRegistered || s.faceRegistrationStatus === 'Registered').length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Face Profiles Registered</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Please register student face photos in the Students Directory to enable AI face recognition attendance.
              </p>
            </div>
          ) : (
            <>
              {/* Input Area */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <input
                  ref={scannerFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUploadScan}
                  className="hidden"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-cyan-400" />
                    <span>Entrance Optical Stream / Snapshot</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scannerFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Frame</span>
                    </button>
                    {!scannerCameraActive ? (
                      <button
                        type="button"
                        onClick={startScannerCamera}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Live Webcam</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCaptureScannerSnapshot}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 animate-pulse"
                      >
                        <Scan className="h-3.5 w-3.5" />
                        <span>Match Frame</span>
                      </button>
                    )}
                  </div>
                </div>

                {scannerCameraActive ? (
                  <div className="relative h-60 rounded-2xl overflow-hidden border border-cyan-500 bg-black flex items-center justify-center">
                    <video
                      ref={scannerVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute inset-0 border border-cyan-400/40 pointer-events-none flex items-center justify-center">
                      <div className="w-40 h-48 border-2 border-cyan-400 rounded-2xl shadow-2xl flex items-start justify-between p-2">
                        <span className="text-[10px] font-mono font-bold bg-black/80 text-cyan-300 px-1.5 py-0.5 rounded">
                          AI SCAN
                        </span>
                      </div>
                    </div>
                  </div>
                ) : scanImagePreview ? (
                  <div className="flex items-center justify-center p-2 bg-slate-900 rounded-2xl">
                    <img
                      src={scanImagePreview}
                      alt="Scan Preview"
                      className="h-44 rounded-xl object-contain border border-slate-700"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => scannerFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <Scan className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white">Select Live Camera Image or Stream Webcam</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">The AI will extract 128-D facial vector and match against registered class profiles</p>
                  </div>
                )}
              </div>

              {/* LIVE DETECTION MATCH RESULT CARD */}
              {isScanning ? (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                  <span className="text-xs font-mono font-bold text-cyan-300">Extracting 128-D Embedding & Matching Profiles...</span>
                </div>
              ) : liveMatchResult ? (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    liveMatchResult.matched && !liveMatchResult.isLowConfidence
                      ? 'bg-emerald-950/40 border-emerald-500/50'
                      : liveMatchResult.isLowConfidence
                      ? 'bg-amber-950/40 border-amber-500/50'
                      : 'bg-rose-950/40 border-rose-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400">
                      LIVE DETECTION RESULT
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                        liveMatchResult.matched && !liveMatchResult.isLowConfidence
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : liveMatchResult.isLowConfidence
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {liveMatchResult.matched && !liveMatchResult.isLowConfidence
                        ? `Recognized (${liveMatchResult.confidencePct})`
                        : liveMatchResult.isLowConfidence
                        ? `⚠ Low Confidence (${liveMatchResult.confidencePct})`
                        : 'UNKNOWN FACE'}
                    </span>
                  </div>

                  {liveMatchResult.matched ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={liveMatchResult.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={liveMatchResult.studentName}
                            className="h-14 w-14 rounded-xl object-cover border-2 border-emerald-500"
                          />
                          <span className="absolute -bottom-1 -right-1 px-1 bg-black text-[9px] font-mono text-cyan-300 rounded font-bold border border-slate-700">
                            REF
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{liveMatchResult.studentName}</p>
                          <p className="text-xs font-mono text-cyan-300 font-semibold">{liveMatchResult.rollNumber}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Event: Entry • Time: Just Now</p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs space-y-1">
                        <div>
                          <span className="text-slate-400">Biometric Match: </span>
                          <strong className="text-emerald-400">{liveMatchResult.confidencePct}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Attendance: </span>
                          <strong className={liveMatchResult.isLowConfidence ? 'text-amber-400' : 'text-emerald-400'}>
                            {liveMatchResult.isLowConfidence ? 'Review Required' : 'Marked Present'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/80 text-xs font-mono text-slate-300 space-y-1">
                      <p className="text-rose-400 font-bold">UNKNOWN FACE: No student match found.</p>
                      <p className="text-slate-400 text-[11px]">
                        The live facial vector did not meet similarity thresholds for any registered student in this class. Unknown face event recorded.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}

          <div className="flex items-center justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopScannerCamera();
                setIsScannerOpen(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* 6. Face Registration Modal */}
      <FaceRegistrationModal
        student={faceModalStudent}
        isOpen={isFaceModalOpen}
        onClose={() => {
          setIsFaceModalOpen(false);
          setFaceModalStudent(null);
        }}
      />

      {/* 7. Confirmation Save Modal */}
      <Modal
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        title="Confirm Daily Attendance Save"
        subtitle={`Verify & save attendance records for ${currentPeriod.shortCode} (${assignedDept} ${assignedYear} Sec ${assignedSection}).`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Attendance Summary:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                <span>Present: <strong>{presentCount}</strong></span>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300">
                <span>Absent: <strong>{absentCount}</strong></span>
              </div>
              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300">
                <span>OD (On-Duty): <strong>{odCount}</strong></span>
              </div>
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300">
                <span>Late Entry: <strong>{lateEntryCount}</strong></span>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300">
                <span>Medical Leave: <strong>{medicalLeaveCount}</strong></span>
              </div>
              <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300">
                <span>Unverified: <strong>{unverifiedCount}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsConfirmSaveOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-600/30 flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Confirm & Save</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

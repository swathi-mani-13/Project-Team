import React, { useState } from 'react';
import { Camera, ShieldCheck, CheckCircle2, UserPlus, Upload, RefreshCw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const FaceRegistrationPage: React.FC = () => {
  const { addToast } = useNotification();
  const [studentName, setStudentName] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [department, setDepartment] = useState<string>('AIML');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captured, setCaptured] = useState<boolean>(false);

  const handleCapture = () => {
    if (!studentName || !rollNumber) {
      addToast({
        title: 'Missing Details',
        message: 'Please enter Student Name and Roll Number first.',
        type: 'warning',
      });
      return;
    }

    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      setCaptured(true);
      addToast({
        title: 'Biometric Profile Enrolled',
        message: `Captured 128 multi-angle face embeddings for ${studentName} (${rollNumber}). Quality score: 98.4%.`,
        type: 'success',
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Student Face Registration & Biometric Enrollment
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Enroll student face vector embeddings into the AI surveillance engine for automatic classroom recognition.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Camera Capture Box (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Optical Capture Viewport
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                SENSOR READY
              </span>
            </div>

            <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                alt="Student Capture Mock"
                className="h-full w-full object-cover opacity-90"
              />

              {/* Centered Target Oval */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-2 border-dashed border-cyan-400 rounded-[999px] flex items-center justify-center bg-cyan-500/10">
                  <span className="text-[11px] font-mono font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded">
                    Align Face in Oval
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Lighting: Optimal • 1080p 60FPS</span>
              <button
                type="button"
                onClick={handleCapture}
                disabled={isCapturing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
              >
                {isCapturing ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Capture Face Vector</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enrollment Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Student Biometric Details</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Harris"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Roll Number / Student ID</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. AIML1024"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 font-mono font-bold text-cyan-300 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value="AIML (Artificial Intelligence & Machine Learning)"
                  disabled
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-slate-400 font-mono"
                />
              </div>
            </div>

            {captured && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Biometric Face Enrollment Active
                </p>
                <p className="text-[11px] text-slate-300">
                  Vector hash registered to ArcFace database. Student will now be auto-detected in classroom camera streams.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

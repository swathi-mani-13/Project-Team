import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Student } from '../../types';
import { useCollege } from '../../context/CollegeContext';
import { useNotification } from '../../context/NotificationContext';
import {
  analyzeAndExtractFaceEmbedding,
  FaceQualityReport,
} from '../../utils/faceRecognitionEngine';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  XCircle,
  Eye,
  UserCheck,
} from 'lucide-react';

interface FaceRegistrationModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FaceRegistrationModal: React.FC<FaceRegistrationModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateStudentFaceProfile } = useCollege();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [qualityReport, setQualityReport] = useState<FaceQualityReport | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Multi-photo reference support (up to 3 reference angles)
  const [referencePhotos, setReferencePhotos] = useState<string[]>(
    student?.referencePhotos || (student?.avatarUrl ? [student.avatarUrl] : [])
  );
  const [storedEmbeddings, setStoredEmbeddings] = useState<number[][]>(
    student?.faceEmbeddings || []
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError('Unable to access webcam. Please check camera permissions or use Photo Upload.');
      setIsCameraActive(false);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    setSelectedImage(dataUrl);
    await runBiometricAnalysis(dataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'Invalid File',
        message: 'Please select a valid image file (JPG, PNG, or WebP).',
        type: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      await runBiometricAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runBiometricAnalysis = async (imgSrc: string) => {
    setIsAnalyzing(true);
    try {
      const report = await analyzeAndExtractFaceEmbedding(imgSrc);
      setQualityReport(report);
      if (!report.isValid) {
        addToast({
          title: 'Quality Check Warning',
          message: report.message,
          type: 'warning',
        });
      }
    } catch (err) {
      addToast({
        title: 'Analysis Error',
        message: 'Failed to extract face embedding. Please retry with another photo.',
        type: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddReferenceAngle = () => {
    if (!selectedImage || !qualityReport || !qualityReport.isValid) return;

    const newPhotos = [...referencePhotos, selectedImage].slice(0, 3);
    const newEmbeddings = [...storedEmbeddings, qualityReport.embedding].slice(0, 3);

    setReferencePhotos(newPhotos);
    setStoredEmbeddings(newEmbeddings);
    setSelectedImage(null);
    setQualityReport(null);

    addToast({
      title: 'Reference Angle Added',
      message: `Captured Angle ${newPhotos.length}/3 for recognition robustness.`,
      type: 'info',
    });
  };

  const handleSaveFaceProfile = () => {
    if (!student) return;

    const primaryPhoto = referencePhotos[0] || selectedImage;
    const embeddings = storedEmbeddings.length > 0 ? storedEmbeddings : qualityReport?.embedding ? [qualityReport.embedding] : [];
    const qualityScore = qualityReport?.qualityScore || student.faceQualityScore || 94;

    if (!primaryPhoto || embeddings.length === 0) {
      addToast({
        title: 'Registration Incomplete',
        message: 'Please provide at least one valid face photo with passing quality check.',
        type: 'warning',
      });
      return;
    }

    updateStudentFaceProfile(student.id, {
      avatarUrl: primaryPhoto,
      faceRegistered: true,
      faceRegistrationStatus: 'Registered',
      faceQualityScore: qualityScore,
      referencePhotos: referencePhotos.length > 0 ? referencePhotos : [primaryPhoto],
      faceEmbeddings: embeddings,
      faceQualityChecks: qualityReport?.qualityChecks,
    });

    stopCamera();
    addToast({
      title: 'Face Profile Registered',
      message: `Biometric 128-D vector securely registered for ${student.name} (${student.rollNumber}).`,
      type: 'success',
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    setSelectedImage(null);
    setQualityReport(null);
    onClose();
  };

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Biometric Face Profile Registration"
      subtitle={`${student.name} • ${student.rollNumber} (${student.department} ${student.year} Sec ${student.section})`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Method Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Student Photo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Capture Using Camera</span>
          </button>
        </div>

        {/* Capture / Upload Area */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          {activeTab === 'upload' ? (
            <div className="space-y-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              {selectedImage ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-44 w-44 rounded-2xl overflow-hidden border-2 border-cyan-500 shadow-xl shadow-cyan-500/20">
                    <img
                      src={selectedImage}
                      alt="Student Face Preview"
                      className="h-full w-full object-cover"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-400 text-xs font-mono gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span>Analyzing Biometrics...</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-cyan-400 hover:underline font-mono"
                  >
                    Change / Re-upload Photo
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 cursor-pointer transition-all hover:bg-slate-900/60 group"
                >
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 mb-3 transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-white">Click to Upload Student Face Photo</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP (Centered, Good Lighting)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-center">
              {isCameraActive ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-56 w-72 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute inset-0 border border-emerald-400/40 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-36 h-44 border-2 border-dashed border-emerald-400/80 rounded-full" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Capture Face Snapshot</span>
                  </button>
                </div>
              ) : selectedImage ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-44 w-44 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl">
                    <img
                      src={selectedImage}
                      alt="Captured Face"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="text-xs text-emerald-400 hover:underline font-mono flex items-center gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retake Camera Snapshot</span>
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {cameraError ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      {cameraError}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 mx-auto"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Start Web Camera</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time Quality Checks Feedback */}
        {qualityReport && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Biometric Validation Quality Checks</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  qualityReport.isValid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                Quality Score: {qualityReport.qualityScore}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div
                className={`p-2 rounded-xl border flex items-center gap-2 ${
                  qualityReport.qualityChecks.singleFace
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {qualityReport.qualityChecks.singleFace ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>Single Face</span>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center gap-2 ${
                  qualityReport.qualityChecks.centered
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                }`}
              >
                {qualityReport.qualityChecks.centered ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                )}
                <span>Centered</span>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center gap-2 ${
                  qualityReport.qualityChecks.lighting
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                }`}
              >
                {qualityReport.qualityChecks.lighting ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                )}
                <span>Good Lighting</span>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center gap-2 ${
                  qualityReport.qualityChecks.sharpness
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {qualityReport.qualityChecks.sharpness ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>Sharp Focus</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-mono pt-1">
              {qualityReport.message}
            </p>

            {qualityReport.isValid && referencePhotos.length < 3 && (
              <button
                type="button"
                onClick={handleAddReferenceAngle}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold font-mono flex items-center gap-1.5 pt-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Add as Reference Angle ({referencePhotos.length + 1}/3)</span>
              </button>
            )}
          </div>
        )}

        {/* Multi-angle reference gallery */}
        {referencePhotos.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Reference Identity Photos ({referencePhotos.length}/3 Enrolled)
            </span>
            <div className="flex items-center gap-3">
              {referencePhotos.map((url, idx) => (
                <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-700">
                  <img src={url} alt={`Angle ${idx + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 right-0 px-1 text-[9px] font-mono font-bold bg-black/80 text-cyan-300 rounded-tl">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveFaceProfile}
            disabled={!qualityReport?.isValid && referencePhotos.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>Save Face Profile ✓</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

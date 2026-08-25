import React, { useState, useEffect } from 'react';
import { Camera, ShieldCheck, Eye, RefreshCw, Maximize2, Zap, Radio, AlertCircle } from 'lucide-react';
import { CameraDevice } from '../../types';

interface CameraPreviewProps {
  camera: CameraDevice;
  className?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ camera, className = '' }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [showMesh, setShowMesh] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl ${className}`}>
      {/* CCTV HUD Top Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 py-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-mono font-bold tracking-wider text-rose-400">● LIVE REC</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-slate-200 font-semibold">{camera.name}</span>
          <span className="hidden sm:inline-block text-slate-400 font-mono">[{camera.location}]</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">{camera.fps} FPS</span>
            <span className="text-slate-500">•</span>
            <span>{camera.resolution}</span>
          </div>
          <div className="font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Simulated Classroom Viewport with Deep Dark Classroom BG */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center">
        {/* Background Visual (Simulated Smart Classroom) */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Geometric Classroom Isometric Mockup Visual */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full opacity-25" viewBox="0 0 800 450" fill="none">
            {/* Classroom Perspective Grid */}
            <path d="M0 450 L300 280 L500 280 L800 450" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M300 280 L300 150 L500 150 L500 280" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M100 450 L350 280" stroke="#6366f1" strokeWidth="0.75" />
            <path d="M700 450 L450 280" stroke="#6366f1" strokeWidth="0.75" />
            {/* Whiteboard outline */}
            <rect x="330" y="160" width="140" height="70" rx="4" stroke="#00f2fe" strokeWidth="1.5" fill="#00f2fe" fillOpacity="0.05" />
            <text x="400" y="200" textAnchor="middle" fill="#00f2fe" fontSize="10" fontFamily="monospace">CLASS 302 - AI & ML</text>
          </svg>
        </div>

        {/* Scanline / Radar Animation */}
        {isScanning && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f2fe] animate-scan z-10 opacity-70" />
        )}

        {/* Face Bounding Box 1: Harris (96.4% Verified) */}
        <div className="absolute top-[28%] left-[22%] w-[22%] sm:w-[17%] aspect-[4/5] z-10 transition-all duration-300">
          {/* Bounding Box Corner Reticle */}
          <div className="relative w-full h-full border-2 border-emerald-400 bg-emerald-500/10 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            {/* Corner highlights */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white"></div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white"></div>
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white"></div>
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white"></div>

            {/* Face Mesh Points Mock */}
            {showMesh && (
              <div className="absolute inset-2 flex items-center justify-center opacity-40">
                <div className="w-full h-full border border-dashed border-emerald-300/40 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                </div>
              </div>
            )}

            {/* Floating Tag */}
            <div className="absolute -top-8 left-0 flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/60 backdrop-blur-md px-2 py-0.5 rounded shadow-lg">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-wide leading-tight">Harris</span>
                <span className="text-[9px] font-mono text-emerald-300 leading-tight">96.4% CONF</span>
              </div>
            </div>

            {/* Roll / Timestamp Footer */}
            <div className="absolute -bottom-5 left-0 text-[9px] font-mono text-emerald-400 bg-black/70 px-1 rounded">
              AIML1024 • SEAT 14
            </div>
          </div>
        </div>

        {/* Face Bounding Box 2: Arun (94.8% Verified) */}
        <div className="absolute top-[32%] right-[28%] w-[20%] sm:w-[16%] aspect-[4/5] z-10 transition-all duration-300">
          <div className="relative w-full h-full border-2 border-emerald-400 bg-emerald-500/10 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white"></div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white"></div>
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white"></div>
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white"></div>

            {showMesh && (
              <div className="absolute inset-2 flex items-center justify-center opacity-40">
                <div className="w-full h-full border border-dashed border-emerald-300/40 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                </div>
              </div>
            )}

            <div className="absolute -top-8 left-0 flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/60 backdrop-blur-md px-2 py-0.5 rounded shadow-lg">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-wide leading-tight">Arun</span>
                <span className="text-[9px] font-mono text-emerald-300 leading-tight">94.8% CONF</span>
              </div>
            </div>

            <div className="absolute -bottom-5 left-0 text-[9px] font-mono text-emerald-400 bg-black/70 px-1 rounded">
              AIML1025 • SEAT 18
            </div>
          </div>
        </div>

        {/* Face Bounding Box 3: Rahman (Presence Unverified) */}
        <div className="absolute top-[42%] right-[8%] w-[18%] sm:w-[14%] aspect-[4/5] z-10 transition-all duration-300">
          <div className="relative w-full h-full border-2 border-purple-400/80 bg-purple-500/10 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <div className="absolute -top-7 left-0 flex items-center gap-1.5 bg-purple-950/90 border border-purple-500/60 backdrop-blur-md px-2 py-0.5 rounded shadow-lg">
              <AlertCircle className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-purple-200 leading-tight">Rahman</span>
                <span className="text-[8px] font-mono text-purple-300 leading-tight">UNVERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Face Bounding Box 4: Unknown Subject */}
        <div className="absolute top-[24%] left-[5%] w-[16%] sm:w-[12%] aspect-[4/5] z-10 transition-all duration-300">
          <div className="relative w-full h-full border-2 border-amber-500 bg-amber-500/10 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
            <div className="absolute -top-7 left-0 flex items-center gap-1 bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 rounded shadow">
              <Eye className="h-3 w-3 text-amber-400 shrink-0" />
              <span className="text-[9px] font-mono font-bold text-amber-300">UNKNOWN</span>
            </div>
          </div>
        </div>

        {/* Center Target HUD Crosshair */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-12 h-12 border border-cyan-400 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Camera Information & Control Strip */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Camera Name</p>
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-brand-400" />
              <span className="font-semibold text-white text-sm">{camera.name}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Location</p>
            <span className="text-slate-200 text-sm font-medium">{camera.location}</span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Status</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
              <span className="text-sm font-medium text-emerald-400">{camera.status}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Last Seen</p>
            <span className="text-slate-300 text-sm font-mono">{camera.lastSeen}</span>
          </div>
        </div>

        {/* Toggle Overlays Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isScanning
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isScanning ? 'AI Scanner Active' : 'AI Scanner Paused'}</span>
            </button>

            <button
              onClick={() => setShowMesh(!showMesh)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                showMesh
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Biometric Mesh</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Active Detections: {camera.activeDetections} Faces</span>
          </div>
        </div>
      </div>
    </div>
  );
};

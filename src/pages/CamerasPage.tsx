import React from 'react';
import { MOCK_CAMERAS } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { Video, Plus, Settings, RefreshCw, Eye, CameraOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CamerasPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Classroom Camera Nodes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              RTSP Optical Network
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Surveillance node configuration and health telemetry for all 12 academic departments.
          </p>
        </div>

        <button
          onClick={() => navigate('/camera')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/30 transition-all"
        >
          <Eye className="h-4 w-4" />
          <span>Open Live Grid View</span>
        </button>
      </div>

      {/* Grid of Cameras */}
      {MOCK_CAMERAS.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-2xl glass-panel border border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <CameraOff className="h-6 w-6 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-white font-mono">No cameras configured</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Camera nodes start offline until RTSP stream endpoints and IP sensors are registered.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_CAMERAS.map((cam) => (
            <div
              key={cam.id}
              className="p-5 rounded-2xl glass-panel hover:border-slate-600 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-400">{cam.id.toUpperCase()}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{cam.name}</h3>
                  <p className="text-xs text-slate-400">{cam.location}</p>
                </div>
                <StatusBadge status={cam.status} size="sm" />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">RTSP Stream:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[170px]">{cam.rtspUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="font-mono text-slate-200">{cam.resolution} @ {cam.fps} FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Detections:</span>
                  <span className="font-mono font-bold text-emerald-400">{cam.activeDetections} Faces</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">Department: <strong className="text-white">{cam.department || 'AIML'}</strong></span>
                <button
                  onClick={() => navigate('/camera')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  View Feed →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

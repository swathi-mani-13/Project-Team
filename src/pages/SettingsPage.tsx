import React from 'react';
import { Settings, Shield, Bell, Key, Database, Cpu, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          System & AI Configuration
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Parameters for continuous biometric surveillance, confidence thresholds, and institutional policy.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Model Parameters */}
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>AI Recognition Engine Parameters</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Face Recognition Model</label>
              <input
                type="text"
                value="RetinaFace (ResNet50) + ArcFace Embedding (512-D)"
                disabled
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Confidence Acceptance Threshold</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="70"
                  max="99"
                  defaultValue="85"
                  className="flex-1 accent-brand-500"
                />
                <span className="font-mono font-bold text-cyan-400 text-xs">85.0%</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Presence Verification Window</label>
              <select className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white">
                <option>Continuous (Minimum 10 Minutes Detection)</option>
                <option>Session Start (First 15 Minutes Only)</option>
                <option>Interval Periodic (Every 15 Minutes)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Multi-Role Policy */}
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Shield className="h-4 w-4 text-purple-400" />
            <span>Institutional Governance Policy</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <p className="font-bold text-white">Strict Hierarchy Enforcement</p>
                <p className="text-slate-400 text-[11px]">Principal → 12 HODs → Class Advisors</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-4 w-4" /> Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <p className="font-bold text-white">Low Attendance Guardian Alert</p>
                <p className="text-slate-400 text-[11px]">Automated SMS/Email when rate &lt; 75%</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-4 w-4" /> Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <p className="font-bold text-white">Liveness Detection (Anti-Spoofing)</p>
                <p className="text-slate-400 text-[11px]">Micro-blink & 3D depth check</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-4 w-4" /> Active
              </span>
            </div>
          </div>
        </div>
        {/* Account Credentials & Security */}
        <div className="p-5 rounded-2xl glass-panel space-y-4 md:col-span-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Key className="h-4 w-4 text-amber-400" />
              <span>Personal Account Credentials & Security</span>
            </div>
            <a
              href="/profile-security"
              className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <span>Manage Profile & Security →</span>
            </a>
          </div>
          <p className="text-xs text-slate-400">
            Securely change your official Login ID, update account password with live complexity validation, and manage active device sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

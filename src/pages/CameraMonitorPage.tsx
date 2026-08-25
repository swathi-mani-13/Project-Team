import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { useNotification } from '../context/NotificationContext';
import {
  Camera,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  RefreshCw,
  Sliders,
  Shield,
  Activity,
  ArrowRight,
  Clock,
  MapPin,
  Compass,
  Maximize2,
  Lock,
  DoorOpen,
  Wifi,
  WifiOff,
  Coffee,
  Utensils,
} from 'lucide-react';
import { CameraEventType, DetectedZone } from '../types';

interface CameraEventFeedItem {
  id: string;
  time: string;
  studentName: string;
  rollNumber?: string;
  eventType: CameraEventType;
  cameraName: string;
  cameraType: 'entrance' | 'center_360';
  confidence: number | null;
  zone?: DetectedZone;
  direction?: 'Outside → Inside (Entry)' | 'Inside → Outside (Exit)';
  reason?: string; // e.g. "Official Break", "Official Lunch", "Classroom Movement"
}

export const CameraMonitorPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { getClassStudents } = useCollege();

  const assignedDept = user?.assignedClass?.department || user?.department || 'Department';
  const assignedYear = user?.assignedClass?.year || '1st Year';
  const assignedSection = user?.assignedClass?.section || 'A';
  const classroom = user?.assignedClass?.classroom || 'Smart Room';
  const advisorName = user?.name || 'Class Advisor';

  const classStudents = getClassStudents(assignedDept, assignedYear, assignedSection);
  const registeredFaceStudents = classStudents.filter((s) => s.faceRegistered || s.faceRegistrationStatus === 'Registered');
  const sampleRegisteredStudent = registeredFaceStudents[0] || null;

  // Configurable Presence Verification Interval
  const [verificationIntervalMinutes, setVerificationIntervalMinutes] = useState<number>(10);

  // Camera Status States
  const [entranceCamOnline, setEntranceCamOnline] = useState<boolean>(true);
  const [centerCamOnline, setCenterCamOnline] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'both' | 'entrance' | 'center'>('both');
  const [selectedEventFilter, setSelectedEventFilter] = useState<'All' | 'EntryExit' | 'Exceptions'>('All');
  const [liveEvents, setLiveEvents] = useState<CameraEventFeedItem[]>([]);

  const handleSimulateVerificationCheck = () => {
    addToast({
      title: `360° Presence Verification Check (${verificationIntervalMinutes} min interval)`,
      message: `Periodic sweep completed: 37 / 40 confirmed present across Front, Middle, and Back zones.`,
      type: 'info',
    });
  };

  const filteredEvents = liveEvents.filter((ev) => {
    if (selectedEventFilter === 'EntryExit') return ev.eventType === 'Entry' || ev.eventType === 'Exit';
    if (selectedEventFilter === 'Exceptions') {
      return (
        ev.eventType === 'Possible Early Exit' ||
        ev.eventType === 'Presence Unverified' ||
        ev.eventType === 'Unknown Face' ||
        ev.eventType === 'Low Confidence'
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/90 border border-cyan-500/30 p-6 shadow-xl relative overflow-hidden">
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  {assignedDept} • {assignedYear} • Section {assignedSection}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Two-Camera Classroom Monitoring Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Camera 1 (Entrance Entry/Exit) + Camera 2 (Center 360° Panoramic Presence) • Venue: {classroom}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Configurable Verification Interval */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400 font-semibold">Sweep Interval:</span>
              <select
                value={verificationIntervalMinutes}
                onChange={(e) => setVerificationIntervalMinutes(Number(e.target.value))}
                className="bg-slate-900 border border-slate-600 text-cyan-300 font-mono font-bold rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value={5}>5 mins</option>
                <option value={10}>10 mins</option>
                <option value={15}>15 mins</option>
              </select>
            </div>

            <button
              onClick={handleSimulateVerificationCheck}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Trigger Sweep</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offline Alert Notices if any camera disconnected */}
      {(!entranceCamOnline || !centerCamOnline) && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs space-y-1.5 animate-pulse">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Camera Pipeline Disruption Warning:</span>
          </div>
          {!entranceCamOnline && (
            <p>• <strong>Entrance Camera Offline:</strong> Student doorway entry/exit detection and directional tracking are unavailable.</p>
          )}
          {!centerCamOnline && (
            <p>• <strong>Center 360° Camera Offline:</strong> Periodic classroom presence verification and zone movement observation are unavailable.</p>
          )}
        </div>
      )}

      {/* 2. TWO CAMERA CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* CAMERA 1: ENTRANCE CAMERA */}
        {/* ============================================================ */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <DoorOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  CAMERA 1
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  Entrance Camera (Doorway Tracking)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEntranceCamOnline(!entranceCamOnline)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 transition-all ${
                  entranceCamOnline
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                }`}
                title="Toggle Online/Offline for test"
              >
                {entranceCamOnline ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Entrance Live Preview Shell with Virtual Doorway Zone */}
          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center group">
            {entranceCamOnline ? (
              <>
                {/* Background Camera Mock Frame */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/80" />
                <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

                {/* Virtual Doorway Zone Overlay */}
                <div className="absolute inset-x-8 top-6 bottom-12 border-2 border-dashed border-cyan-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-3 bg-cyan-950/10">
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60 max-w-fit">
                    <span>Virtual Entry/Exit Crossing Zone</span>
                  </div>

                  {/* Direction arrow indication */}
                  <div className="flex items-center justify-center gap-4 text-[11px] font-mono font-extrabold text-cyan-300">
                    <span className="px-2 py-0.5 bg-slate-900/90 rounded border border-cyan-600/40">
                      Outside (Corridor)
                    </span>
                    <span className="text-emerald-400">➔ ENTRY ➔</span>
                    <span className="px-2 py-0.5 bg-slate-900/90 rounded border border-cyan-600/40">
                      Inside (Room 302)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span>Active Vector: Door Crossing Algorithm v4.2</span>
                    <span>1080p @ 30 FPS</span>
                  </div>
                </div>

                {/* Simulated Bounding Box for Detected Person Crossing */}
                {sampleRegisteredStudent ? (
                  <div className="absolute left-1/3 top-1/4 w-40 border-2 border-emerald-400 rounded-2xl p-1.5 bg-emerald-500/10 backdrop-blur-[1px] animate-in fade-in flex flex-col justify-between shadow-2xl shadow-emerald-500/20">
                    <div className="bg-emerald-950/95 p-1.5 rounded-xl text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/60 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={sampleRegisteredStudent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={sampleRegisteredStudent.name}
                          className="h-7 w-7 rounded-lg object-cover border border-emerald-400"
                        />
                        <div>
                          <div className="text-white font-bold">{sampleRegisteredStudent.name}</div>
                          <div className="text-cyan-300">{sampleRegisteredStudent.rollNumber}</div>
                        </div>
                      </div>
                      <div className="mt-1.5 pt-1 border-t border-emerald-800/80 flex items-center justify-between text-[8px]">
                        <span className="text-emerald-400 font-bold">96.4% CONF</span>
                        <span className="text-white bg-emerald-700/60 px-1.5 py-0.5 rounded font-bold">ENTRY</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-x-8 bottom-3 p-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-center">
                    <span className="text-[10px] font-mono text-amber-300 font-bold">
                      No Face Profiles Registered. Register student faces to enable AI recognition.
                    </span>
                  </div>
                )}

                {/* Top Corner Live Telemetry */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>REC • {assignedDept}-{assignedYear.charAt(0)}{assignedSection}-Entrance</span>
                </div>
              </>
            ) : (
              <div className="text-center space-y-2 p-6 text-slate-500">
                <WifiOff className="h-10 w-10 mx-auto text-rose-400" />
                <p className="text-sm font-bold text-white">Entrance Camera Disconnected</p>
                <p className="text-xs text-slate-400">RTSP pipeline lost. Entry/exit crossing detection paused.</p>
              </div>
            )}
          </div>

          {/* Telemetry Details */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Purpose</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">Entry / Exit</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Last Entry</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">10:42:10 (Harris)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Last Exit</span>
              <span className="font-bold text-amber-400 mt-0.5 block">10:15:22 (Karthik)</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CAMERA 2: CENTER 360° CLASSROOM CAMERA */}
        {/* ============================================================ */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  CAMERA 2
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  Center 360° Camera (Classroom Coverage)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCenterCamOnline(!centerCamOnline)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 transition-all ${
                  centerCamOnline
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                }`}
                title="Toggle Online/Offline for test"
              >
                {centerCamOnline ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 360° Classroom Coverage Mock Preview */}
          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center group">
            {centerCamOnline ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/80" />
                <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />

                {/* 360° Classroom Zones Overlay */}
                <div className="absolute inset-4 rounded-xl border border-purple-500/40 p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono text-purple-300">
                    <span className="px-2 py-0.5 bg-purple-950/80 rounded border border-purple-700/60 font-bold">
                      Classroom Zone: FRONT (Whiteboard / Podium)
                    </span>
                    <span className="font-bold text-emerald-400">12 Students Detected</span>
                  </div>

                  {/* Middle and Center Zone */}
                  <div className="my-auto flex items-center justify-between px-2 text-[10px] font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300">
                      <span className="font-bold text-white block">MIDDLE ZONE</span>
                      <span className="text-emerald-400 font-bold">16 Students</span>
                    </div>

                    <div className="h-12 w-12 rounded-full border border-dashed border-purple-400/80 flex items-center justify-center text-[9px] font-mono text-purple-300 font-bold bg-purple-950/40">
                      360° Hub
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300">
                      <span className="font-bold text-white block">DOOR AREA</span>
                      <span className="text-cyan-300 font-bold">1 In-Transit</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-purple-300">
                    <span className="px-2 py-0.5 bg-purple-950/80 rounded border border-purple-700/60 font-bold">
                      Classroom Zone: BACK (Lab Workstations)
                    </span>
                    <span className="font-bold text-emerald-400">9 Students Detected</span>
                  </div>
                </div>

                {/* Top Corner 360 Telemetry */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-purple-300 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                  <span>REC • {assignedDept}-{assignedYear.charAt(0)}{assignedSection}-Center</span>
                </div>
              </>
            ) : (
              <div className="text-center space-y-2 p-6 text-slate-500">
                <WifiOff className="h-10 w-10 mx-auto text-rose-400" />
                <p className="text-sm font-bold text-white">Center 360° Camera Disconnected</p>
                <p className="text-xs text-slate-400">Classroom coverage verification paused.</p>
              </div>
            )}
          </div>

          {/* Telemetry Details */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Coverage</span>
              <span className="font-bold text-purple-300 mt-0.5 block">Full 360° Room</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Detected</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">37 / 40 Students</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Last Sweep</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">10:42:30 (Active)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TWO-CAMERA PRESENCE FUSION ENGINE & TIMELINE FEED */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-600/30 text-brand-300">
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Presence Engine Live Event Fusion Feed
              </h3>
              <p className="text-[11px] text-slate-400">
                Combined real-time event pipeline from Entrance Camera and Center 360° Camera
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedEventFilter('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedEventFilter === 'All'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Events ({liveEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedEventFilter('EntryExit')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedEventFilter === 'EntryExit'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Door Entry / Exit
            </button>
            <button
              type="button"
              onClick={() => setSelectedEventFilter('Exceptions')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedEventFilter === 'Exceptions'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Exceptions Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Student / Subject</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Reason / Interval</th>
                <th className="py-3 px-4">Source Camera</th>
                <th className="py-3 px-4">Detected Zone / Direction</th>
                <th className="py-3 px-4 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      <Eye className="h-5 w-5" />
                    </div>
                    <span>No AI recognition events yet.</span>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item) => {
                  const isEntry = item.eventType === 'Entry';
                  const isExit = item.eventType === 'Exit';
                  const isRestored = item.eventType === 'Presence Restored';
                  const isUnverified = item.eventType === 'Presence Unverified';
                  const isUnknown = item.eventType === 'Unknown Face';
                  const isLowConf = item.eventType === 'Low Confidence';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isUnknown || isUnverified
                          ? 'bg-rose-950/20'
                          : isLowConf
                          ? 'bg-amber-950/20'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-400 font-bold">
                        {item.time}
                      </td>

                      <td className="py-3 px-4 font-sans font-bold text-white">
                        {item.studentName}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isEntry
                              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80'
                              : isExit
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                              : isRestored
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                              : isUnverified
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/80 animate-pulse'
                              : isUnknown
                              ? 'bg-rose-950/60 text-rose-300 border-rose-700 font-extrabold'
                              : isLowConf
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                              : 'bg-purple-950/60 text-purple-300 border-purple-800/80'
                          }`}
                        >
                          {item.eventType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {item.reason ? (
                          <span className="text-[11px] font-mono text-cyan-300 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.reason}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Academic Period</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-sans">
                        <div className="flex items-center gap-1.5">
                          {item.cameraType === 'entrance' ? (
                            <DoorOpen className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          ) : (
                            <Compass className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          )}
                          <span>{item.cameraName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {item.direction ? (
                          <span className="text-cyan-300 font-semibold">{item.direction}</span>
                        ) : item.zone ? (
                          <span>Zone: <strong className="text-white">{item.zone}</strong></span>
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {item.confidence !== null ? (
                          <span
                            className={`font-bold ${
                              item.confidence >= 90
                                ? 'text-emerald-400'
                                : item.confidence >= 70
                                ? 'text-cyan-300'
                                : 'text-amber-400'
                            }`}
                          >
                            {item.confidence}%
                          </span>
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

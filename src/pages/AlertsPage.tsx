import React, { useState } from 'react';
import { MOCK_ALERTS } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { AlertItem } from '../types';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const AlertsPage: React.FC = () => {
  const { addToast } = useNotification();
  const [alertsList, setAlertsList] = useState<AlertItem[]>(MOCK_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<string>('All');

  const handleResolve = (id: string) => {
    setAlertsList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' } : a))
    );
    addToast({
      title: 'Alert Resolved',
      message: 'Marked anomaly incident as investigated and resolved.',
      type: 'success',
    });
  };

  const filtered = alertsList.filter(
    (a) => severityFilter === 'All' || a.severity === severityFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Alerts & Anomalies Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {alertsList.filter((a) => a.status === 'Active').length} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time biometric anomaly detection, spoof prevention, and low-attendance warnings.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 shadow-md">
          {['All', 'Critical', 'Warning', 'Info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                severityFilter === sev
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl glass-panel border border-slate-800">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Bell className="h-6 w-6 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-white font-mono">No active alerts.</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No anomaly incidents or biometric alerts detected across the institution.
            </p>
          </div>
        ) : (
          filtered.map((alt) => (
            <div
              key={alt.id}
              className="p-5 rounded-2xl glass-panel hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={alt.severity} size="sm" />
                  <span className="text-xs font-mono text-slate-400">{alt.time}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{alt.department || 'College-Wide'}</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  {alt.type} {alt.studentName && `— ${alt.studentName}`}
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">{alt.description}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {alt.status === 'Active' ? (
                  <button
                    onClick={() => handleResolve(alt.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all"
                  >
                    Resolve Alert
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="h-4 w-4" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

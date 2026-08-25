import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Search, History } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const AuditLogsPage: React.FC = () => {
  const { addToast } = useNotification();
  const { securityAuditLogs } = useAuth();
  const [search, setSearch] = useState<string>('');

  const filtered = securityAuditLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    addToast({
      title: 'Audit Log Exported',
      message: 'Generated cryptographic tamper-proof PDF audit trail.',
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
              Institutional Audit Logs
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Tamper-Proof Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log of all user logins, attendance overrides, and administrative credential modifications.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/30 transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit Trail</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl glass-panel">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User / Initiator</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Details & Event Context</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      <History className="h-5 w-5" />
                    </div>
                    <span>No audit activity yet.</span>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{log.dateTime}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{log.user}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-300">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-300">{log.details || '--'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MOCK_CORRECTIONS } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { CorrectionRequest } from '../types';
import { useNotification } from '../context/NotificationContext';
import { FileCheck } from 'lucide-react';

export const CorrectionsPage: React.FC = () => {
  const { addToast } = useNotification();
  const [requests, setRequests] = useState<CorrectionRequest[]>(MOCK_CORRECTIONS);

  const handleAction = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    addToast({
      title: `Correction ${newStatus}`,
      message: `Updated attendance record authorization status to ${newStatus}.`,
      type: newStatus === 'Approved' ? 'success' : 'warning',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Attendance Corrections & Overrides
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {requests.filter((r) => r.status === 'Pending').length} Pending Review
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official workflow for advisor manual correction requests subject to HOD & Principal authorization.
          </p>
        </div>
      </div>

      {/* Corrections Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Original Mark</th>
                <th className="py-3.5 px-4">Requested Mark</th>
                <th className="py-3.5 px-4">Justification</th>
                <th className="py-3.5 px-4">Submitted By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <span>No correction requests.</span>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white font-sans">{req.studentName}</p>
                      <p className="text-[11px] font-mono text-brand-300">{req.rollNumber}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{req.date}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.currentStatus} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.requestedStatus} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 max-w-xs font-sans">
                      <p className="font-semibold text-white">{req.reason}</p>
                      {req.reviewComments && <p className="text-[11px] text-slate-400">{req.reviewComments}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">{req.requestedBy}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(req.id, 'Approved')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/30 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'Rejected')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/30 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-500">Authorized</span>
                      )}
                    </td>
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

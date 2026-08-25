import React, { useState } from 'react';
import { useCollege } from '../context/CollegeContext';
import { HodAccount, AccountStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useNotification } from '../context/NotificationContext';
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  UserPlus,
  KeyRound,
  IdCard,
} from 'lucide-react';

export const HodManagementPage: React.FC = () => {
  const {
    departments,
    hods,
    addHod,
    updateHodStatus,
    resetHodPassword,
    getDepartmentMetrics,
  } = useCollege();

  const { addToast } = useNotification();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedHod, setSelectedHod] = useState<HodAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // New HOD Form State
  const [formData, setFormData] = useState({
    name: '',
    employeeId: 'HOD-CSBS-002',
    email: '',
    department: 'AIML',
    tempPassword: 'Welcome@2026',
    phone: '',
    status: 'Pending' as AccountStatus,
  });

  const handleDepartmentSelect = (deptCode: string) => {
    const formattedDept = deptCode.replace(/\s+/g, '').replace('&', '').toUpperCase();
    setFormData({
      ...formData,
      department: deptCode,
      employeeId: `HOD-${formattedDept}-001`,
    });
  };

  const filteredHods = hods.filter((h) => {
    const matchSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateHOD = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      addToast({
        title: 'Missing Details',
        message: 'Please provide full name and official email address.',
        type: 'warning',
      });
      return;
    }

    addHod({
      name: formData.name,
      employeeId: formData.employeeId,
      email: formData.email,
      department: formData.department,
      phone: formData.phone || '+91 98401 00000',
      status: 'Pending',
      lastLogin: 'Never (Pending First Setup)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    setIsCreateModalOpen(false);
    setFormData({
      name: '',
      employeeId: 'HOD-AIML-002',
      email: '',
      department: 'AIML',
      tempPassword: 'Welcome@2026',
      phone: '',
      status: 'Pending',
    });

    addToast({
      title: 'HOD Account Created',
      message: `Created HOD account for ${formData.name} (${formData.department}). Status is Pending first-login activation.`,
      type: 'success',
    });
  };

  const handleToggleStatus = (id: string, newStatus: AccountStatus) => {
    updateHodStatus(id, newStatus);
    addToast({
      title: `Account ${newStatus}`,
      message: `Updated HOD account status to ${newStatus}.`,
      type: 'info',
    });
  };

  const handleReset = (hod: HodAccount) => {
    resetHodPassword(hod.id);
    addToast({
      title: 'Credentials Reset',
      message: `Temporary activation code dispatched to ${hod.email}. Status reset to Pending.`,
      type: 'warning',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Head of Department (HOD) Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {hods.length} HOD Accounts Registered
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Principal authority to create, assign, and govern Department Heads across all 12 college engineering wings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Create HOD Account</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by HOD name, employee ID..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">Status:</span>
          {['All', 'Active', 'Pending', 'Deactivated'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* HOD Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">HOD Name</th>
                <th className="py-3.5 px-4">HOD Employee ID</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Advisors</th>
                <th className="py-3.5 px-4">Students</th>
                <th className="py-3.5 px-4">Official Email</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHods.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      <Shield className="h-5 w-5" />
                    </div>
                    <span>No HOD accounts assigned yet.</span>
                  </td>
                </tr>
              ) : (
                filteredHods.map((hod) => {
                  const metrics = getDepartmentMetrics(hod.department);
                  return (
                    <tr key={hod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={hod.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={hod.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">{hod.name}</p>
                            <p className="text-[10px] text-slate-400">{hod.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                        {hod.employeeId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono">
                          {hod.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-300 font-bold">
                        {metrics.totalAdvisors} Advisors
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {metrics.totalStudents} Students
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {hod.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={hod.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {hod.lastLogin}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedHod(hod);
                              setIsDetailModalOpen(true);
                            }}
                            title="View Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {hod.status !== 'Active' ? (
                            <button
                              onClick={() => handleToggleStatus(hod.id, 'Active')}
                              title="Activate Account"
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(hod.id, 'Deactivated')}
                              title="Deactivate Account"
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleReset(hod)}
                            title="Reset Account & Force Setup"
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE HOD MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create & Assign New HOD Account"
        subtitle="Principal Authorization • College ID-Card Creation"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateHOD} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              HOD Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Sarah Jenkins"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assigned Department (Strict 1-to-1)
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleDepartmentSelect(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                HOD Employee ID (Generated)
              </label>
              <div className="relative">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-3 py-2.5 text-xs font-mono font-bold text-purple-300 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Official Staff Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="hod.dept@college.edu"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Temporary Password
              </label>
              <input
                type="text"
                value={formData.tempPassword}
                onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-purple-400" />
              First Login Setup Protocol:
            </p>
            <p className="text-[11px] text-slate-300">
              Account status will be set to <strong>Pending</strong>. The HOD will log in with their unique ID (e.g. <code>{formData.employeeId}</code>) and temporary password, then complete account setup before gaining department access.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all"
            >
              Create HOD Account
            </button>
          </div>
        </form>
      </Modal>

      {/* HOD DETAIL MODAL */}
      {selectedHod && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`HOD Profile: ${selectedHod.name}`}
          subtitle={`${selectedHod.employeeId} • ${selectedHod.department} Department`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700">
              <img
                src={selectedHod.avatarUrl}
                alt={selectedHod.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <p className="font-bold text-white text-sm">{selectedHod.name}</p>
                <p className="text-slate-400">{selectedHod.department} Department Head</p>
                <StatusBadge status={selectedHod.status} size="sm" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">Class Advisors</span>
                <span className="text-base font-bold text-white mt-1 block">
                  {getDepartmentMetrics(selectedHod.department).totalAdvisors} Advisors
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">Department Enrolment</span>
                <span className="text-base font-bold text-cyan-300 mt-1 block">
                  {getDepartmentMetrics(selectedHod.department).totalStudents} Students
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

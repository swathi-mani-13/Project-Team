import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollege } from '../context/CollegeContext';
import { AdvisorAccount, AccountStatus, AcademicYear, AcademicSection } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useNotification } from '../context/NotificationContext';
import {
  GraduationCap,
  Search,
  UserPlus,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Lock,
  IdCard,
} from 'lucide-react';

export const AdvisorManagementPage: React.FC = () => {
  const { role, user } = useAuth();
  const { departments, advisors, addAdvisor, updateAdvisorStatus } = useCollege();
  const { addToast } = useNotification();

  const isHod = role === 'hod';
  const hodDepartment = user?.department || 'AIML';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: isHod ? `ADV-${hodDepartment}-00${advisors.length + 1}` : 'ADV-AIML-008',
    email: '',
    department: isHod ? hodDepartment : 'AIML',
    year: '2nd Year' as AcademicYear,
    section: 'A' as AcademicSection,
    classroom: 'Smart Room 302',
    phone: '',
  });

  const filteredAdvisors = advisors.filter((adv) => {
    const matchDept = isHod ? adv.department === hodDepartment : selectedDeptFilter === 'All' || adv.department === selectedDeptFilter;
    const matchSearch =
      adv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adv.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adv.classroom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchYear = selectedYearFilter === 'All' || adv.year === selectedYearFilter;

    return matchDept && matchSearch && matchYear;
  });

  const handleCreateAdvisor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      addToast({
        title: 'Missing Information',
        message: 'Please provide full name and official email.',
        type: 'warning',
      });
      return;
    }

    const assignedDept = isHod ? hodDepartment : formData.department;

    addAdvisor({
      name: formData.name,
      employeeId: formData.employeeId || `ADV-${assignedDept}-00${advisors.length + 1}`,
      email: formData.email,
      department: assignedDept,
      year: formData.year,
      section: formData.section,
      classroom: formData.classroom || 'Classroom',
      phone: formData.phone || '+91 98765 00000',
      status: 'Active',
      lastLogin: 'Never (Just Created)',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    setIsCreateModalOpen(false);
    setFormData({
      name: '',
      employeeId: `ADV-${assignedDept}-00${advisors.length + 2}`,
      email: '',
      department: assignedDept,
      year: '2nd Year',
      section: 'A',
      classroom: 'Smart Room 302',
      phone: '',
    });

    addToast({
      title: 'Class Advisor Assigned',
      message: `Assigned ${formData.name} (${formData.employeeId}) as Advisor for ${assignedDept} ${formData.year} (Sec ${formData.section}).`,
      type: 'success',
    });
  };

  const handleToggleStatus = (id: string, newStatus: AccountStatus) => {
    updateAdvisorStatus(id, newStatus);
    addToast({
      title: `Advisor Status Updated`,
      message: `Account status set to ${newStatus}.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Class Advisor Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {isHod ? `${hodDepartment} Faculty Scope` : `${advisors.length} College-Wide Advisors`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isHod
              ? `Manage and assign Class Advisors strictly across ${hodDepartment} 1st - 4th Year (Sections A, B, C).`
              : 'Principal governance across all section advisors in all 12 college engineering departments.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setFormData({
                ...formData,
                department: isHod ? hodDepartment : 'AIML',
                employeeId: `ADV-${isHod ? hodDepartment : 'AIML'}-00${advisors.length + 1}`,
              });
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Advisor</span>
          </button>
        </div>
      </div>

      {/* Scope Banner for HOD */}
      {isHod && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                Department Enforcement: <span className="text-purple-300 font-bold">{hodDepartment}</span>
                <Lock className="h-3.5 w-3.5 text-purple-400" />
              </p>
              <p className="text-xs text-slate-400">
                You can only manage advisors assigned to {hodDepartment} Year 1 to Year 4 sections (A, B, C).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search advisor name, ID..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {!isHod && (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
            >
              <option value="All">All 12 Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.code}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">Year:</span>
            {['All', '1st Year', '2nd Year', '3rd Year', '4th Year'].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYearFilter(yr)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedYearFilter === yr
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advisors Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Advisor Name</th>
                <th className="py-3.5 px-4">Advisor Employee ID</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Assigned Class Scope</th>
                <th className="py-3.5 px-4">Classroom</th>
                <th className="py-3.5 px-4">Enrolled Students</th>
                <th className="py-3.5 px-4">Avg Attendance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAdvisors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <span>No Class Advisors assigned yet.</span>
                  </td>
                </tr>
              ) : (
                filteredAdvisors.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={adv.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                          alt={adv.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{adv.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{adv.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                      {adv.employeeId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
                        {adv.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40">
                        {adv.year} - Sec {adv.section}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {adv.classroom}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {adv.assignedStudentsCount}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {adv.avgAttendancePct}%
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={adv.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAdvisor(adv);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Info"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(adv.id, adv.status === 'Active' ? 'Deactivated' : 'Active')}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            adv.status === 'Active'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          }`}
                          title={adv.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {adv.status === 'Active' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADVISOR MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign New Class Advisor"
        subtitle={isHod ? `Assign Section In-Charge for ${hodDepartment}` : 'Assign Section In-Charge'}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAdvisor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Advisor Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Arun Kumar"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Department</span>
                {isHod && (
                  <span className="text-[10px] text-purple-300 flex items-center gap-1 font-mono">
                    <Lock className="h-3 w-3" /> Auto-Inherited from HOD
                  </span>
                )}
              </label>
              {isHod ? (
                <input
                  type="text"
                  value={hodDepartment}
                  disabled
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs font-bold text-purple-300 cursor-not-allowed font-mono"
                />
              ) : (
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Advisor Employee ID
              </label>
              <div className="relative">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-3 py-2.5 text-xs font-mono font-bold text-emerald-300 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Academic Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value as AcademicYear })}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value as AcademicSection })}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assigned Classroom
              </label>
              <input
                type="text"
                value={formData.classroom}
                onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                placeholder="e.g. Smart Room 302"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                required
              />
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
                placeholder="advisor@college.edu"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              Create Advisor
            </button>
          </div>
        </form>
      </Modal>

      {/* ADVISOR DETAIL MODAL */}
      {selectedAdvisor && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Advisor Profile: ${selectedAdvisor.name}`}
          subtitle={`${selectedAdvisor.employeeId} • ${selectedAdvisor.department}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700">
              <img
                src={selectedAdvisor.avatarUrl}
                alt={selectedAdvisor.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <p className="font-bold text-white text-sm">{selectedAdvisor.name}</p>
                <p className="text-emerald-300 font-mono">
                  {selectedAdvisor.department} • {selectedAdvisor.year} (Sec {selectedAdvisor.section})
                </p>
                <StatusBadge status={selectedAdvisor.status} size="sm" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">Classroom Venue</span>
                <span className="text-sm font-bold text-white mt-1 block">{selectedAdvisor.classroom}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block">Assigned Roster</span>
                <span className="text-sm font-bold text-cyan-300 mt-1 block">{selectedAdvisor.assignedStudentsCount} Students</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

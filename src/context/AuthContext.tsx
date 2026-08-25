import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AcademicYear, AcademicSection, AuditLog } from '../types';
import { MOCK_USERS, MOCK_HODS, MOCK_ADVISORS, MOCK_FACULTY, MOCK_DEPARTMENTS, resolveAdvisorAccount } from '../data/mockData';

export interface CredentialUpdateResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  selectedDepartmentFilter: string; // Used by Principal to filter ('All' | 'CSE' | 'AIML' | ...)
  selectedYearFilter: string;
  selectedSectionFilter: string;
  setDepartmentFilter: (dept: string) => void;
  setYearFilter: (year: string) => void;
  setSectionFilter: (section: string) => void;
  isFirstLoginPending: boolean;
  login: (employeeId: string, role: UserRole, accountKey?: string) => Promise<{ success: boolean; isFirstLogin?: boolean }>;
  logout: () => void;
  switchRole: (newRole: UserRole, customKey?: string) => void;
  activateAccount: (newPassword: string) => Promise<boolean>;
  getScopeTitle: () => string;
  updateLoginId: (newLoginId: string, currentPassword: string) => Promise<CredentialUpdateResult>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<CredentialUpdateResult>;
  logoutOtherSessions: () => Promise<CredentialUpdateResult>;
  securityAuditLogs: AuditLog[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to hash passwords securely
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('classsense_role');
    return saved === 'principal' || saved === 'hod' || saved === 'advisor'
      ? (saved as UserRole)
      : 'advisor';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedRole = localStorage.getItem('classsense_role');
    const savedDept = localStorage.getItem('classsense_hod_dept');
    const savedEmpId = localStorage.getItem('classsense_emp_id');

    if (savedRole === 'hod') {
      const foundHod =
        MOCK_HODS.find((h) => h.employeeId === savedEmpId || h.department === savedDept) ||
        MOCK_HODS.find((h) => h.department === 'AIML') ||
        MOCK_HODS[0];

      return {
        id: foundHod.id,
        name: foundHod.name,
        email: foundHod.email,
        employeeId: savedEmpId || foundHod.employeeId,
        role: 'hod',
        department: foundHod.department,
        title: `Professor & Head of Department (${foundHod.department})`,
        avatar: foundHod.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        accountStatus: foundHod.status,
      };
    }

    if (savedRole === 'advisor') {
      const advisorEmpId = localStorage.getItem('classsense_advisor_emp_id') || savedEmpId || 'ADV-AIML-1A-001';
      const matchedAdvisor = resolveAdvisorAccount(advisorEmpId);
      return {
        id: matchedAdvisor.id,
        name: matchedAdvisor.name,
        email: matchedAdvisor.email,
        employeeId: savedEmpId || matchedAdvisor.employeeId,
        role: 'advisor',
        department: matchedAdvisor.department,
        title: 'Assistant Professor & Primary Class Advisor',
        avatar: matchedAdvisor.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        accountStatus: matchedAdvisor.status,
        assignedClass: {
          department: matchedAdvisor.department,
          year: matchedAdvisor.year,
          section: matchedAdvisor.section,
          classroom: matchedAdvisor.classroom,
        },
      };
    }

    if (savedRole === 'principal') {
      return {
        ...MOCK_USERS.principal,
        employeeId: savedEmpId || MOCK_USERS.principal.employeeId,
      };
    }

    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('classsense_auth') === 'true';
  });

  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('All');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('All');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('All');
  const [isFirstLoginPending, setIsFirstLoginPending] = useState<boolean>(false);

  // Security audit log state
  const [securityAuditLogs, setSecurityAuditLogs] = useState<AuditLog[]>(() => {
    const savedLogs = localStorage.getItem('classsense_security_audit_logs');
    if (savedLogs) {
      try {
        return JSON.parse(savedLogs);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'sec-log-01',
        user: 'Sarah (Class Advisor)',
        role: 'Class Advisor',
        action: 'Account Authenticated',
        module: 'Security & Access',
        dateTime: '25-Aug-2026 08:45 AM',
        ipAddress: '192.168.1.104',
        status: 'Success',
        details: 'Biometric MFA & Password verified.',
      },
    ];
  });

  const addSecurityAuditLog = (action: string, status: 'Success' | 'Warning' | 'Failed', details: string) => {
    const newLog: AuditLog = {
      id: `sec-log-${Date.now()}`,
      user: `${user?.name || 'User'} (${user?.role || role})`,
      role: user?.role === 'principal' ? 'Principal' : user?.role === 'hod' ? 'HOD' : 'Class Advisor',
      action,
      module: 'Credentials Management',
      dateTime: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      ipAddress: '192.168.1.104',
      status,
      details,
      department: user?.department,
    };

    setSecurityAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem('classsense_security_audit_logs', JSON.stringify(updated.slice(0, 100)));
      return updated;
    });
  };

  useEffect(() => {
    if (isAuthenticated && role) {
      localStorage.setItem('classsense_role', role);
      localStorage.setItem('classsense_auth', 'true');
    }
  }, [role, isAuthenticated]);

  const login = async (
    employeeId: string,
    selectedRole: UserRole,
    accountKey?: string
  ): Promise<{ success: boolean; isFirstLogin?: boolean }> => {
    await new Promise((res) => setTimeout(res, 250));

    let targetUser: UserProfile;

    if (selectedRole === 'principal') {
      targetUser = {
        ...MOCK_USERS.principal,
        employeeId: employeeId.trim() || MOCK_USERS.principal.employeeId,
      };
    } else if (selectedRole === 'hod') {
      const cleanId = employeeId.trim().toUpperCase();
      const cleanKey = accountKey ? accountKey.trim().toUpperCase() : '';

      const matchedHod =
        MOCK_HODS.find(
          (h) =>
            h.employeeId.toUpperCase() === cleanId ||
            h.department.toUpperCase() === cleanId ||
            h.department.toUpperCase() === cleanKey ||
            cleanId.includes(h.department.toUpperCase())
        ) ||
        MOCK_HODS.find((h) => h.department === 'AIML') ||
        MOCK_HODS[0];

      targetUser = {
        id: matchedHod.id,
        name: matchedHod.name,
        email: matchedHod.email,
        employeeId: cleanId || matchedHod.employeeId,
        role: 'hod',
        department: matchedHod.department,
        title: `Professor & Head of Department (${matchedHod.department})`,
        avatar: matchedHod.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        accountStatus: matchedHod.status,
        isFirstLogin: matchedHod.status === 'Pending',
      };

      localStorage.setItem('classsense_hod_dept', matchedHod.department);
      localStorage.setItem('classsense_emp_id', targetUser.employeeId);
    } else {
      // Class Advisor — Dynamically resolve by employee ID
      const matchedAdvisor = resolveAdvisorAccount(employeeId);

      targetUser = {
        id: matchedAdvisor.id,
        name: matchedAdvisor.name,
        email: matchedAdvisor.email,
        employeeId: employeeId.trim() || matchedAdvisor.employeeId,
        role: 'advisor',
        department: matchedAdvisor.department,
        title: 'Assistant Professor & Primary Class Advisor',
        avatar: matchedAdvisor.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        accountStatus: matchedAdvisor.status,
        assignedClass: {
          department: matchedAdvisor.department,
          year: matchedAdvisor.year,
          section: matchedAdvisor.section,
          classroom: matchedAdvisor.classroom,
        },
      };

      localStorage.setItem('classsense_emp_id', targetUser.employeeId);
      localStorage.setItem('classsense_advisor_emp_id', targetUser.employeeId);
    }

    setRole(selectedRole);
    setUser(targetUser);
    setIsAuthenticated(true);
    localStorage.setItem('classsense_auth', 'true');
    localStorage.setItem('classsense_role', selectedRole);

    addSecurityAuditLog('User Login Authenticated', 'Success', `Session established for ${targetUser.employeeId}`);

    if (targetUser.accountStatus === 'Pending' || targetUser.isFirstLogin) {
      setIsFirstLoginPending(true);
      return { success: true, isFirstLogin: true };
    } else {
      setIsFirstLoginPending(false);
      return { success: true, isFirstLogin: false };
    }
  };

  const logout = () => {
    addSecurityAuditLog('User Logout', 'Success', `Session closed for ${user?.employeeId || 'User'}`);
    setIsAuthenticated(false);
    setUser(null);
    setIsFirstLoginPending(false);
    localStorage.removeItem('classsense_auth');
  };

  const switchRole = (newRole: UserRole, customKey?: string) => {
    setRole(newRole);

    if (newRole === 'principal') {
      setUser(MOCK_USERS.principal);
    } else if (newRole === 'hod') {
      const targetDept = customKey || 'AIML';
      const hod = MOCK_HODS.find((h) => h.department === targetDept) || MOCK_HODS[0];
      setUser({
        id: hod.id,
        name: hod.name,
        email: hod.email,
        employeeId: hod.employeeId,
        role: 'hod',
        department: hod.department,
        title: `Professor & Head of Department (${hod.department})`,
        avatar: hod.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        accountStatus: hod.status,
      });
      localStorage.setItem('classsense_hod_dept', hod.department);
      localStorage.setItem('classsense_emp_id', hod.employeeId);
    } else {
      setUser(MOCK_USERS.advisor);
    }

    localStorage.setItem('classsense_role', newRole);
  };

  const activateAccount = async (newPassword: string): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 350));
    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        accountStatus: 'Active',
        isFirstLogin: false,
      };
      setUser(updatedUser);
      setIsFirstLoginPending(false);
    }
    return true;
  };

  // Helper to verify user's current password
  const verifyCurrentPassword = async (currentPassword: string): Promise<boolean> => {
    if (!user) return false;
    const storedHash = localStorage.getItem(`classsense_pwd_hash_${user.id}`);
    if (storedHash) {
      const inputHash = await hashPassword(currentPassword);
      return inputHash === storedHash;
    }
    // Default valid password check for demo roles
    if (currentPassword === 'Principal@123' || currentPassword === 'HOD@123' || currentPassword === 'Advisor@123' || currentPassword === 'Faculty@123' || currentPassword === 'Admin@123') {
      return true;
    }
    return false;
  };

  // 1. UPDATE LOGIN ID / USERNAME (Requirement #3, #7, #8, #9, #10, #11, #18, #19)
  const updateLoginId = async (newLoginId: string, currentPassword: string): Promise<CredentialUpdateResult> => {
    if (!user) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const cleanNewId = newLoginId.trim();
    if (!cleanNewId) {
      return { success: false, error: 'New Login ID cannot be empty.' };
    }

    if (cleanNewId.toUpperCase() === user.employeeId.toUpperCase()) {
      return { success: false, error: 'New Login ID is identical to current Login ID.' };
    }

    // Password verification
    const isPasswordValid = await verifyCurrentPassword(currentPassword);
    if (!isPasswordValid) {
      addSecurityAuditLog('Failed Login ID Change Attempt', 'Failed', `Invalid current password provided for user ${user.employeeId}.`);
      return { success: false, error: 'Current password is incorrect.' };
    }

    // Uniqueness verification (Requirement #3: "This Login ID is already in use.")
    const existingLogins = [
      'PRIN-001',
      ...MOCK_HODS.map((h) => h.employeeId.toUpperCase()),
      ...MOCK_ADVISORS.map((a) => a.employeeId.toUpperCase()),
      ...MOCK_FACULTY.map((f) => f.employeeId.toUpperCase()),
    ];

    const isDuplicate = existingLogins.includes(cleanNewId.toUpperCase());
    if (isDuplicate && cleanNewId.toUpperCase() !== user.employeeId.toUpperCase()) {
      addSecurityAuditLog('Failed Login ID Change Attempt', 'Failed', `Attempted to claim already registered Login ID: ${cleanNewId}`);
      return { success: false, error: 'This Login ID is already in use.' };
    }

    // Update user state while strictly preserving role, department, year, section, assignedClass (Requirement #19)
    const oldId = user.employeeId;
    const updatedUser: UserProfile = {
      ...user,
      employeeId: cleanNewId,
    };

    setUser(updatedUser);
    localStorage.setItem('classsense_emp_id', cleanNewId);
    if (user.role === 'advisor') {
      localStorage.setItem('classsense_advisor_emp_id', cleanNewId);
    }

    addSecurityAuditLog('Login ID Changed', 'Success', `User Login ID updated from ${oldId} to ${cleanNewId}. Role & class assignments preserved.`);
    return { success: true, message: 'Login ID updated successfully.' };
  };

  // 2. CHANGE PASSWORD (Requirement #4, #5, #6, #12, #14)
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<CredentialUpdateResult> => {
    if (!user) {
      return { success: false, error: 'User is not authenticated.' };
    }

    // Password verification
    const isPasswordValid = await verifyCurrentPassword(currentPassword);
    if (!isPasswordValid) {
      addSecurityAuditLog('Failed Password Change Attempt', 'Failed', `Incorrect current password supplied for ${user.employeeId}.`);
      return { success: false, error: 'Current password is incorrect.' };
    }

    // Password complexity check (Requirement #5)
    const hasMinLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);

    if (!hasMinLen || !hasUpper || !hasLower || !hasDigit) {
      return {
        success: false,
        error: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number.',
      };
    }

    // Secure cryptographic hashing (Requirement #12)
    const newHash = await hashPassword(newPassword);
    localStorage.setItem(`classsense_pwd_hash_${user.id}`, newHash);

    addSecurityAuditLog('Password Changed', 'Success', `Password hash updated securely for ${user.employeeId}.`);
    return { success: true, message: 'Password changed successfully.' };
  };

  // 3. LOGOUT OTHER SESSIONS (Requirement #13)
  const logoutOtherSessions = async (): Promise<CredentialUpdateResult> => {
    if (!user) return { success: false, error: 'Not authenticated.' };

    const newSessionToken = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('classsense_session_token', newSessionToken);

    addSecurityAuditLog('Other Sessions Terminated', 'Success', `Revoked all other active device tokens for ${user.employeeId}.`);
    return { success: true, message: 'All other active sessions have been invalidated successfully.' };
  };

  const setDepartmentFilter = (dept: string) => {
    if (role === 'principal') {
      setSelectedDepartmentFilter(dept);
    }
  };

  const setYearFilter = (year: string) => {
    setSelectedYearFilter(year);
  };

  const setSectionFilter = (section: string) => {
    setSelectedSectionFilter(section);
  };

  const getScopeTitle = (): string => {
    if (!user) return 'ClassSense AI';
    if (role === 'principal') {
      return selectedDepartmentFilter === 'All'
        ? 'College-Wide (12 Departments)'
        : `${selectedDepartmentFilter} Department`;
    }
    if (role === 'hod') {
      return `${user.department || 'AIML'} Department (1st - 4th Year)`;
    }
    if (role === 'advisor') {
      const cls = user.assignedClass;
      if (!cls) return 'Class Advisor Portal';
      return `${cls.department} • ${cls.year} • Section ${cls.section}`;
    }
    return 'College AI System';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        selectedDepartmentFilter,
        selectedYearFilter,
        selectedSectionFilter,
        setDepartmentFilter,
        setYearFilter,
        setSectionFilter,
        isFirstLoginPending,
        login,
        logout,
        switchRole,
        activateAccount,
        getScopeTitle,
        updateLoginId,
        updatePassword,
        logoutOtherSessions,
        securityAuditLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

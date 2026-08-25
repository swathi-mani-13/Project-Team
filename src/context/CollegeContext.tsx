import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DepartmentInfo,
  HodAccount,
  AdvisorAccount,
  SubjectFacultyAccount,
  SubjectItem,
  CollegeClass,
  Student,
  AcademicYear,
  AcademicSection,
  AccountStatus,
  AttendanceStatus,
  FacultyAssignment,
  TimetableSlot,
  SubmittedReport,
  ReportStatus,
} from '../types';
import {
  MOCK_DEPARTMENTS,
  MOCK_HODS,
  MOCK_ADVISORS,
  MOCK_FACULTY,
  MOCK_SUBJECTS,
  MOCK_CLASSES,
  MOCK_STUDENTS,
  MOCK_SUBMITTED_REPORTS,
  getDefaultClassTimetable,
  getDefaultClassTimetableForDay,
} from '../data/mockData';

export interface ScopeMetrics {
  totalStudents: number;
  totalAdvisors: number;
  totalFaculty: number;
  totalClasses: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  unverifiedToday: number;
  lowAttendance: number;
  avgAttendance: number;
  activeCameras: number;
  totalCameras: number;
}

export interface SubjectScopeMetrics {
  subjectCode: string;
  subjectName: string;
  totalEnrolled: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  unverifiedToday: number;
  avgSubjectAttendance: number;
}

interface CollegeContextType {
  departments: DepartmentInfo[];
  hods: HodAccount[];
  advisors: AdvisorAccount[];
  faculty: SubjectFacultyAccount[];
  subjects: SubjectItem[];
  classes: CollegeClass[];
  students: Student[];
  submittedReports: SubmittedReport[];
  addHod: (newHod: Omit<HodAccount, 'id' | 'assignedDate'>) => void;
  updateHodStatus: (id: string, status: AccountStatus) => void;
  resetHodPassword: (id: string) => void;
  addAdvisor: (newAdv: Omit<AdvisorAccount, 'id' | 'assignedDate' | 'assignedStudentsCount' | 'avgAttendancePct'>) => void;
  updateAdvisorStatus: (id: string, status: AccountStatus) => void;
  assignClassAdvisor?: (dept: string, year: AcademicYear, section: AcademicSection, advisor: AdvisorAccount) => { success: boolean; message?: string };
  addFaculty: (newFac: Omit<SubjectFacultyAccount, 'id' | 'assignedDate' | 'assignments'> & { initialAssignments?: FacultyAssignment[] }) => void;
  updateFacultyStatus: (id: string, status: AccountStatus) => void;
  assignSubjectFaculty: (facultyId: string, assignment: Omit<FacultyAssignment, 'id'>) => void;
  addStudent: (newStudent: Omit<Student, 'id' | 'registeredDate' | 'presentDays' | 'absentDays' | 'lateDays' | 'totalSessions' | 'riskLevel'> & { faceRegistered?: boolean; faceQualityScore?: number }) => void;
  updateStudentFaceProfile: (studentId: string, faceData: Partial<Student>) => void;
  updateStudentAttendance: (studentId: string, status: AttendanceStatus) => void;
  markSubjectAttendance: (studentId: string, subjectCode: string, status: AttendanceStatus) => void;
  getDepartmentMetrics: (deptCode: string) => ScopeMetrics;
  getCollegeMetrics: () => ScopeMetrics;
  getClassMetrics: (deptCode: string, year: AcademicYear, section: AcademicSection) => ScopeMetrics;
  getSubjectMetrics: (deptCode: string, year: AcademicYear, section: AcademicSection, subjectCode: string) => SubjectScopeMetrics;
  getDepartmentAdvisors: (deptCode: string) => AdvisorAccount[];
  getDepartmentFaculty: (deptCode: string) => SubjectFacultyAccount[];
  getDepartmentStudents: (deptCode: string) => Student[];
  getClassStudents: (deptCode: string, year: AcademicYear, section: AcademicSection) => Student[];
  getClassSubjects: (deptCode: string, year: AcademicYear, section: AcademicSection) => SubjectItem[];
  getFacultyByIdOrEmployeeId: (idOrEmpId: string) => SubjectFacultyAccount | undefined;
  getClassTimetable: (deptCode: string, year: AcademicYear, section: AcademicSection) => TimetableSlot[];
  updateClassTimetable: (deptCode: string, year: AcademicYear, section: AcademicSection, slots: TimetableSlot[]) => void;
  getWeeklyTimetable: (deptCode: string, year: AcademicYear, section: AcademicSection, day: string) => TimetableSlot[];
  updateWeeklyTimetable: (deptCode: string, year: AcademicYear, section: AcademicSection, day: string, slots: TimetableSlot[]) => void;
  submitMonthlyReport: (report: Omit<SubmittedReport, 'id'>) => void;
  updateReportStatus: (id: string, status: ReportStatus, remarks?: string) => void;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export const CollegeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<DepartmentInfo[]>(MOCK_DEPARTMENTS);
  const [hods, setHods] = useState<HodAccount[]>(MOCK_HODS);
  const [advisors, setAdvisors] = useState<AdvisorAccount[]>(MOCK_ADVISORS);
  const [faculty, setFaculty] = useState<SubjectFacultyAccount[]>(MOCK_FACULTY);
  const [subjects, setSubjects] = useState<SubjectItem[]>(MOCK_SUBJECTS);
  const [classes, setClasses] = useState<CollegeClass[]>(MOCK_CLASSES);
  const [timetables, setTimetables] = useState<Record<string, TimetableSlot[]>>({});
  const [submittedReports, setSubmittedReports] = useState<SubmittedReport[]>(MOCK_SUBMITTED_REPORTS);

  // Initialize students from local persistence or empty array
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('classsense_real_students');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Sync real students to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('classsense_real_students', JSON.stringify(students));
  }, [students]);

  // Dynamic Add HOD
  const addHod = (newHodData: Omit<HodAccount, 'id' | 'assignedDate'>) => {
    const newHod: HodAccount = {
      ...newHodData,
      id: 'hod-' + Math.random().toString(36).substring(2, 7),
      assignedDate: new Date().toISOString().split('T')[0],
      avatarUrl: newHodData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    setHods((prev) => [newHod, ...prev]);

    setDepartments((prev) =>
      prev.map((d) =>
        d.code === newHod.department
          ? {
              ...d,
              hodName: newHod.name,
              hodEmployeeId: newHod.employeeId,
              hodEmail: newHod.email,
              hodStatus: newHod.status,
            }
          : d
      )
    );
  };

  const updateHodStatus = (id: string, status: AccountStatus) => {
    setHods((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status } : h))
    );
  };

  const resetHodPassword = (id: string) => {
    setHods((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status: 'Pending' } : h))
    );
  };

  // Dynamic Add Advisor
  const addAdvisor = (
    newAdvData: Omit<AdvisorAccount, 'id' | 'assignedDate' | 'assignedStudentsCount' | 'avgAttendancePct'>
  ) => {
    const newAdv: AdvisorAccount = {
      ...newAdvData,
      id: 'adv-' + Math.random().toString(36).substring(2, 7),
      assignedDate: new Date().toISOString().split('T')[0],
      avatarUrl: newAdvData.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      assignedStudentsCount: 0,
      avgAttendancePct: 0,
    };

    setAdvisors((prev) => {
      const filtered = prev.filter(
        (a) =>
          !(
            a.department === newAdvData.department &&
            a.year === newAdvData.year &&
            a.section === newAdvData.section
          )
      );
      return [newAdv, ...filtered];
    });
  };

  const updateAdvisorStatus = (id: string, status: AccountStatus) => {
    setAdvisors((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const assignClassAdvisor = (
    dept: string,
    year: AcademicYear,
    section: AcademicSection,
    advisor: AdvisorAccount
  ): { success: boolean; message?: string } => {
    setAdvisors((prev) => {
      const filtered = prev.filter(
        (a) => !(a.department === dept && a.year === year && a.section === section)
      );
      return [advisor, ...filtered];
    });

    setClasses((prev) =>
      prev.map((c) =>
        c.department === dept && c.year === year && c.section === section
          ? {
              ...c,
              advisorId: advisor.id,
              advisorName: advisor.name,
              advisorEmployeeId: advisor.employeeId,
            }
          : c
      )
    );

    return {
      success: true,
      message: `Assigned ${advisor.name} as Primary Class Advisor for ${dept} ${year} Section ${section}.`,
    };
  };

  // Dynamic Add Faculty
  const addFaculty = (
    newFacData: Omit<SubjectFacultyAccount, 'id' | 'assignedDate' | 'assignments'> & {
      initialAssignments?: FacultyAssignment[];
    }
  ) => {
    const facId = 'fac-' + Math.random().toString(36).substring(2, 7);
    const assignedDate = new Date().toISOString().split('T')[0];

    const formattedAssignments: FacultyAssignment[] = (newFacData.initialAssignments || []).map((asg, idx) => ({
      ...asg,
      id: `asg-${facId}-${idx + 1}`,
      totalClasses: asg.totalClasses || 0,
      avgSubjectAttendancePct: asg.avgSubjectAttendancePct || 0,
    }));

    const newFac: SubjectFacultyAccount = {
      ...newFacData,
      id: facId,
      assignedDate,
      avatarUrl: newFacData.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      assignments: formattedAssignments,
    };

    setFaculty((prev) => [newFac, ...prev]);
  };

  const updateFacultyStatus = (id: string, status: AccountStatus) => {
    setFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
  };

  const assignSubjectFaculty = (facultyId: string, assignment: Omit<FacultyAssignment, 'id'>) => {
    const asgId = 'asg-' + Math.random().toString(36).substring(2, 7);
    const newAsg: FacultyAssignment = {
      ...assignment,
      id: asgId,
      totalClasses: 0,
      avgSubjectAttendancePct: 0,
    };

    setFaculty((prev) =>
      prev.map((f) =>
        f.id === facultyId
          ? {
              ...f,
              assignments: [...f.assignments, newAsg],
            }
          : f
      )
    );
  };

  // Dynamic Add Student
  const addStudent = (
    newStuData: Omit<Student, 'id' | 'registeredDate' | 'presentDays' | 'absentDays' | 'lateDays' | 'totalSessions' | 'riskLevel'> & {
      faceRegistered?: boolean;
      faceQualityScore?: number;
    }
  ) => {
    const isFaceRegistered = Boolean(newStuData.faceRegistered);
    const newStudent: Student = {
      ...newStuData,
      id: 'stu-' + Math.random().toString(36).substring(2, 7),
      registeredDate: new Date().toISOString().split('T')[0],
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      totalSessions: 0,
      attendancePct: 0,
      status: 'Present',
      riskLevel: 'Normal',
      faceRegistered: isFaceRegistered,
      faceRegistrationStatus: newStuData.faceRegistrationStatus || (isFaceRegistered ? 'Registered' : 'Registration Required'),
      faceQualityScore: newStuData.faceQualityScore || (isFaceRegistered ? 92 : 0),
      avatarUrl: newStuData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    setStudents((prev) => [newStudent, ...prev]);
  };

  // Dynamic Update Student Biometric / Face Profile
  const updateStudentFaceProfile = (studentId: string, faceData: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, ...faceData } : s))
    );
  };

  // Update Student Attendance Status
  const updateStudentAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, status } : s))
    );
  };

  // Mark Subject Attendance
  const markSubjectAttendance = (studentId: string, subjectCode: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId && st.studentId !== studentId) return st;

        const currentSubs = st.subjectAttendance || [];
        const existingIdx = currentSubs.findIndex((sub) => sub.subjectCode === subjectCode);

        let updatedSubs = [...currentSubs];
        if (existingIdx >= 0) {
          const sub = updatedSubs[existingIdx];
          const newPresent = status === 'Present' ? sub.presentSessions + 1 : sub.presentSessions;
          const newTotal = sub.totalSessions + 1;
          const newPct = newTotal > 0 ? Number(((newPresent / newTotal) * 100).toFixed(1)) : 0;

          updatedSubs[existingIdx] = {
            ...sub,
            status,
            presentSessions: newPresent,
            totalSessions: newTotal,
            attendancePct: newPct,
          };
        }

        return {
          ...st,
          subjectAttendance: updatedSubs,
        };
      })
    );
  };

  // Scope Metrics for Department
  const getDepartmentMetrics = (deptCode: string): ScopeMetrics => {
    const deptStudents = students.filter((s) => s.department === deptCode);
    const deptAdvisors = advisors.filter((a) => a.department === deptCode);
    const deptFaculty = faculty.filter((f) => f.department === deptCode);
    const dept = departments.find((d) => d.code === deptCode);

    const totalStudents = deptStudents.length;
    const presentToday = deptStudents.filter((s) => s.status === 'Present').length;
    const absentToday = deptStudents.filter((s) => s.status === 'Absent').length;
    const lateToday = deptStudents.filter((s) => s.status === 'Late Entry').length;
    const unverifiedToday = deptStudents.filter((s) => s.status === 'Presence Unverified').length;
    const lowAttendance = deptStudents.filter((s) => s.attendancePct < 75).length;

    const avgAttendance =
      totalStudents > 0
        ? Number((deptStudents.reduce((acc, s) => acc + (s.attendancePct || 0), 0) / totalStudents).toFixed(1))
        : 0;

    return {
      totalStudents,
      totalAdvisors: deptAdvisors.length,
      totalFaculty: deptFaculty.length,
      totalClasses: deptAdvisors.length,
      presentToday,
      absentToday,
      lateToday,
      unverifiedToday,
      lowAttendance,
      avgAttendance,
      activeCameras: dept?.activeCameras || 0,
      totalCameras: dept?.totalCameras || 0,
    };
  };

  // Scope Metrics for College-Wide (Principal)
  const getCollegeMetrics = (): ScopeMetrics => {
    const totalStudents = students.length;
    const presentToday = students.filter((s) => s.status === 'Present').length;
    const absentToday = students.filter((s) => s.status === 'Absent').length;
    const lateToday = students.filter((s) => s.status === 'Late Entry').length;
    const unverifiedToday = students.filter((s) => s.status === 'Presence Unverified').length;
    const lowAttendance = students.filter((s) => s.attendancePct < 75).length;

    const avgAttendance =
      totalStudents > 0
        ? Number((students.reduce((acc, s) => acc + (s.attendancePct || 0), 0) / totalStudents).toFixed(1))
        : 0;

    const totalActiveCams = departments.reduce((acc, d) => acc + (d.activeCameras || 0), 0);
    const totalCams = departments.reduce((acc, d) => acc + (d.totalCameras || 0), 0);

    return {
      totalStudents,
      totalAdvisors: advisors.length,
      totalFaculty: faculty.length,
      totalClasses: advisors.length,
      presentToday,
      absentToday,
      lateToday,
      unverifiedToday,
      lowAttendance,
      avgAttendance,
      activeCameras: totalActiveCams,
      totalCameras: totalCams,
    };
  };

  // Scope Metrics for Specific Class (Class Advisor Scope)
  const getClassMetrics = (
    deptCode: string,
    year: AcademicYear,
    section: AcademicSection
  ): ScopeMetrics => {
    const classStudents = students.filter(
      (s) => s.department === deptCode && s.year === year && s.section === section
    );

    const totalStudents = classStudents.length;
    const presentToday = classStudents.filter((s) => s.status === 'Present').length;
    const absentToday = classStudents.filter((s) => s.status === 'Absent').length;
    const lateToday = classStudents.filter((s) => s.status === 'Late Entry').length;
    const unverifiedToday = classStudents.filter((s) => s.status === 'Presence Unverified').length;
    const lowAttendance = classStudents.filter((s) => s.attendancePct < 75).length;

    const avgAttendance =
      totalStudents > 0
        ? Number((classStudents.reduce((acc, s) => acc + (s.attendancePct || 0), 0) / totalStudents).toFixed(1))
        : 0;

    return {
      totalStudents,
      totalAdvisors: advisors.filter((a) => a.department === deptCode && a.year === year && a.section === section).length,
      totalFaculty: faculty.filter((f) => f.department === deptCode).length,
      totalClasses: 1,
      presentToday,
      absentToday,
      lateToday,
      unverifiedToday,
      lowAttendance,
      avgAttendance,
      activeCameras: 0,
      totalCameras: 0,
    };
  };

  // Scope Metrics for Specific Subject
  const getSubjectMetrics = (
    deptCode: string,
    year: AcademicYear,
    section: AcademicSection,
    subjectCode: string
  ): SubjectScopeMetrics => {
    const classStudents = students.filter(
      (s) => s.department === deptCode && s.year === year && s.section === section
    );

    let present = 0;
    let absent = 0;
    let late = 0;
    let unverified = 0;
    let totalPct = 0;
    let subjectName = 'Subject';

    classStudents.forEach((st) => {
      const sub = st.subjectAttendance?.find((s) => s.subjectCode === subjectCode);
      if (sub) {
        subjectName = sub.subjectName;
        if (sub.status === 'Present') present++;
        else if (sub.status === 'Absent') absent++;
        else if (sub.status === 'Late Entry') late++;
        else unverified++;
        totalPct += sub.attendancePct || 0;
      }
    });

    const count = classStudents.length;
    const avg = count > 0 ? Number((totalPct / count).toFixed(1)) : 0;

    return {
      subjectCode,
      subjectName,
      totalEnrolled: count,
      presentToday: present,
      absentToday: absent,
      lateToday: late,
      unverifiedToday: unverified,
      avgSubjectAttendance: avg,
    };
  };

  const getDepartmentAdvisors = (deptCode: string) => {
    return advisors.filter((a) => a.department === deptCode);
  };

  const getDepartmentFaculty = (deptCode: string) => {
    return faculty.filter((f) => f.department === deptCode);
  };

  const getDepartmentStudents = (deptCode: string) => {
    return students.filter((s) => s.department === deptCode);
  };

  const getClassStudents = (deptCode: string, year: AcademicYear, section: AcademicSection) => {
    return students.filter(
      (s) => s.department === deptCode && s.year === year && s.section === section
    );
  };

  const getClassSubjects = (deptCode: string, year: AcademicYear, section: AcademicSection) => {
    return subjects.filter((s) => s.department === deptCode && s.year === year);
  };

  const getFacultyByIdOrEmployeeId = (idOrEmpId: string) => {
    return faculty.find((f) => f.id === idOrEmpId || f.employeeId === idOrEmpId);
  };

  const getClassTimetable = (deptCode: string, year: AcademicYear, section: AcademicSection) => {
    const key = `${deptCode}-${year}-${section}`;
    if (timetables[key]) {
      return timetables[key];
    }
    return getDefaultClassTimetable(deptCode, year, section);
  };

  const updateClassTimetable = (deptCode: string, year: AcademicYear, section: AcademicSection, slots: TimetableSlot[]) => {
    const key = `${deptCode}-${year}-${section}`;
    setTimetables((prev) => ({
      ...prev,
      [key]: slots,
    }));
  };

  const getWeeklyTimetable = (deptCode: string, year: AcademicYear, section: AcademicSection, day: string) => {
    const key = `${deptCode}-${year}-${section}-${day}`;
    if (timetables[key]) {
      return timetables[key];
    }
    return getDefaultClassTimetableForDay(deptCode, year, section, day);
  };

  const updateWeeklyTimetable = (deptCode: string, year: AcademicYear, section: AcademicSection, day: string, slots: TimetableSlot[]) => {
    const key = `${deptCode}-${year}-${section}-${day}`;
    setTimetables((prev) => ({
      ...prev,
      [key]: slots,
    }));
  };

  const submitMonthlyReport = (report: Omit<SubmittedReport, 'id'>) => {
    const newReport: SubmittedReport = {
      ...report,
      id: `rep-${report.department.toLowerCase()}-${report.year.charAt(0)}${report.section.toLowerCase()}-${Date.now()}`,
    };
    setSubmittedReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
  };

  const updateReportStatus = (id: string, status: ReportStatus, remarks?: string) => {
    setSubmittedReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              remarks: remarks !== undefined ? remarks : r.remarks,
              reviewedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            }
          : r
      )
    );
  };

  return (
    <CollegeContext.Provider
      value={{
        departments,
        hods,
        advisors,
        faculty,
        subjects,
        classes,
        students,
        submittedReports,
        addHod,
        updateHodStatus,
        resetHodPassword,
        addAdvisor,
        updateAdvisorStatus,
        addFaculty,
        updateFacultyStatus,
        assignSubjectFaculty,
        assignClassAdvisor,
        addStudent,
        updateStudentFaceProfile,
        updateStudentAttendance,
        markSubjectAttendance,
        getDepartmentMetrics,
        getCollegeMetrics,
        getClassMetrics,
        getSubjectMetrics,
        getDepartmentAdvisors,
        getDepartmentFaculty,
        getDepartmentStudents,
        getClassStudents,
        getClassSubjects,
        getFacultyByIdOrEmployeeId,
        getClassTimetable,
        updateClassTimetable,
        getWeeklyTimetable,
        updateWeeklyTimetable,
        submitMonthlyReport,
        updateReportStatus,
      }}
    >
      {children}
    </CollegeContext.Provider>
  );
};

export const useCollege = () => {
  const context = useContext(CollegeContext);
  if (!context) {
    throw new Error('useCollege must be used within a CollegeProvider');
  }
  return context;
};

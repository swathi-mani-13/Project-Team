import {
  Student,
  LiveAttendanceRecord,
  RecognitionEvent,
  AlertItem,
  CorrectionRequest,
  AuditLog,
  CameraDevice,
  UserProfile,
  HodAccount,
  AdvisorAccount,
  DepartmentInfo,
  AcademicYear,
  AcademicSection,
  SubjectItem,
  SubjectFacultyAccount,
  TutorHelperAccount,
  CollegeClass,
  TimetableSlot,
  SlotType,
  DayTimetableConfig,
  SubmittedReport,
} from '../types';

export const MOCK_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'dept-01',
    name: 'Computer Science and Engineering',
    code: 'CSE',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.cse@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block A (Alan Turing Wing)',
    building: 'Block A',
  },
  {
    id: 'dept-02',
    name: 'Artificial Intelligence and Machine Learning',
    code: 'AIML',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.aiml@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block B (Von Neumann Wing)',
    building: 'Block B',
  },
  {
    id: 'dept-03',
    name: 'Computer Science and Business Systems',
    code: 'CSBS',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.csbs@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block A (Floor 4)',
    building: 'Block A',
  },
  {
    id: 'dept-04',
    name: 'Aeronautical Engineering',
    code: 'AERO',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.aero@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block F (Aerospace Complex)',
    building: 'Block F',
  },
  {
    id: 'dept-05',
    name: 'Electronics and Communication Engineering',
    code: 'ECE',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.ece@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block C (Shannon Wing)',
    building: 'Block C',
  },
  {
    id: 'dept-06',
    name: 'Electrical and Electronics Engineering',
    code: 'EEE',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.eee@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block D (Tesla Wing)',
    building: 'Block D',
  },
  {
    id: 'dept-07',
    name: 'Civil Engineering',
    code: 'Civil',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.civil@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block E (Structures Wing)',
    building: 'Block E',
  },
  {
    id: 'dept-08',
    name: 'Mechanical Engineering',
    code: 'Mechanical',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.mech@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block G (Thermodynamics Lab)',
    building: 'Block G',
  },
  {
    id: 'dept-09',
    name: 'Mechatronics Engineering',
    code: 'Mechatronics',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.mechatronics@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block H (Robotics & Automation)',
    building: 'Block H',
  },
  {
    id: 'dept-10',
    name: 'Information Technology',
    code: 'IT',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.it@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block A (IT Wing)',
    building: 'Block A',
  },
  {
    id: 'dept-11',
    name: 'Biomedical Engineering',
    code: 'Biomedical',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.bme@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block K (Medical Imaging Lab)',
    building: 'Block K',
  },
  {
    id: 'dept-12',
    name: 'Chemical Engineering',
    code: 'Chemical',
    hodName: 'Unassigned',
    hodEmployeeId: '',
    hodEmail: 'hod.chem@college.edu',
    hodStatus: 'Pending',
    activeCameras: 0,
    totalCameras: 0,
    roomLocations: 'Block L (Process Engineering)',
    building: 'Block L',
  },
];

export const MOCK_USERS: Record<string, UserProfile> = {
  principal: {
    id: 'usr-prin-01',
    name: 'College Principal',
    email: 'principal@college.edu',
    employeeId: 'PRIN-001',
    role: 'principal',
    title: 'Principal & Head of Institution',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    accountStatus: 'Active',
  },
  hod: {
    id: 'usr-hod-01',
    name: 'Department Head',
    email: 'hod@college.edu',
    employeeId: 'HOD-AIML-001',
    role: 'hod',
    department: 'AIML',
    title: 'Professor & Head of Department',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    accountStatus: 'Active',
  },
  advisor: {
    id: 'usr-adv-01',
    name: 'Class Advisor',
    email: 'advisor@college.edu',
    employeeId: 'ADV-AIML-1A-001',
    role: 'advisor',
    department: 'AIML',
    title: 'Assistant Professor & Primary Class Advisor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    accountStatus: 'Active',
    assignedClass: {
      department: 'AIML',
      year: '1st Year',
      section: 'A',
      classroom: 'Smart Room 301',
    },
  },
};

export const MOCK_HODS: HodAccount[] = [];

export const MOCK_ADVISORS: AdvisorAccount[] = [];

export const resolveAdvisorAccount = (employeeId: string): AdvisorAccount => {
  const cleanId = employeeId.trim().toUpperCase();

  // Parse dynamic ID patterns (e.g. ADV-AIML-1A-001, ADV-CSE-2B, etc.)
  const patternMatch = cleanId.match(/^(?:ADV-)?([A-Z]+)-?([1-4])[-_]?([A-C])(?:-\d+)?$/i);
  if (patternMatch) {
    const rawDept = patternMatch[1].toUpperCase();
    const yrNum = patternMatch[2];
    const sec = patternMatch[3].toUpperCase() as AcademicSection;

    const deptInfo = MOCK_DEPARTMENTS.find(
      (d) => d.code.toUpperCase() === rawDept || d.name.toUpperCase().includes(rawDept)
    );
    const department = deptInfo ? deptInfo.code : rawDept;
    const year: AcademicYear =
      yrNum === '1' ? '1st Year' : yrNum === '2' ? '2nd Year' : yrNum === '3' ? '3rd Year' : '4th Year';

    return {
      id: `adv-${department.toLowerCase()}-${yrNum}${sec.toLowerCase()}`,
      name: `Class Advisor (${department} ${year} Sec ${sec})`,
      employeeId: cleanId,
      email: `advisor.${department.toLowerCase()}${yrNum}${sec.toLowerCase()}@college.edu`,
      department,
      year,
      section: sec,
      classroom: `Room ${yrNum}0${sec === 'A' ? '1' : sec === 'B' ? '2' : '3'}`,
      phone: '+91 98401 55000',
      status: 'Active',
      lastLogin: 'Active Now',
      assignedDate: '2026-08-01',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      assignedStudentsCount: 0,
      avgAttendancePct: 0,
    };
  }

  return {
    id: 'adv-default',
    name: 'Class Advisor',
    employeeId: cleanId || 'ADV-001',
    email: 'advisor@college.edu',
    department: 'AIML',
    year: '1st Year',
    section: 'A',
    classroom: 'Smart Room 301',
    phone: '+91 98401 55000',
    status: 'Active',
    lastLogin: 'Active Now',
    assignedDate: '2026-08-01',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    assignedStudentsCount: 0,
    avgAttendancePct: 0,
  };
};

export const MOCK_STUDENTS: Student[] = [];

export const MOCK_ALERTS: AlertItem[] = [];

export const MOCK_CORRECTIONS: CorrectionRequest[] = [];

export const MOCK_CAMERAS: CameraDevice[] = [];

export const MOCK_AUDIT_LOGS: AuditLog[] = [];

export const MOCK_LIVE_RECORDS: LiveAttendanceRecord[] = [];

export const MOCK_ANALYTICS = {
  daily: [],
  weekly: [],
  monthly: [],
  sections: [],
  departments: [],
};

export const MOCK_SUBJECTS: SubjectItem[] = [];

export const MOCK_FACULTY: SubjectFacultyAccount[] = [];

export const MOCK_CLASSES: CollegeClass[] = [];

export const DEFAULT_CONFIGURABLE_TIMINGS = [
  { slotNumber: 1, slotType: 'period' as SlotType, label: 'Period 1', shortCode: 'P1', startTime: '09:00 AM', endTime: '09:50 AM' },
  { slotNumber: 2, slotType: 'period' as SlotType, label: 'Period 2', shortCode: 'P2', startTime: '09:50 AM', endTime: '10:40 AM' },
  { slotNumber: undefined, slotType: 'break' as SlotType, label: 'Morning Tea Break', shortCode: 'BREAK', startTime: '10:40 AM', endTime: '10:50 AM' },
  { slotNumber: 3, slotType: 'period' as SlotType, label: 'Period 3', shortCode: 'P3', startTime: '10:50 AM', endTime: '11:40 AM' },
  { slotNumber: 4, slotType: 'period' as SlotType, label: 'Period 4', shortCode: 'P4', startTime: '11:40 AM', endTime: '12:30 PM' },
  { slotNumber: undefined, slotType: 'lunch' as SlotType, label: 'Lunch Break Interval', shortCode: 'LUNCH', startTime: '12:30 PM', endTime: '01:15 PM' },
  { slotNumber: 5, slotType: 'period' as SlotType, label: 'Period 5', shortCode: 'P5', startTime: '01:15 PM', endTime: '02:05 PM' },
  { slotNumber: 6, slotType: 'period' as SlotType, label: 'Period 6', shortCode: 'P6', startTime: '02:05 PM', endTime: '02:55 PM' },
  { slotNumber: 7, slotType: 'period' as SlotType, label: 'Period 7', shortCode: 'P7', startTime: '02:55 PM', endTime: '03:45 PM' },
];

export const getDefaultClassTimetable = (
  deptCode: string = 'AIML',
  year: AcademicYear = '1st Year',
  section: AcademicSection = 'A'
): TimetableSlot[] => {
  const yrNum = year.charAt(0);

  return DEFAULT_CONFIGURABLE_TIMINGS.map((slot) => {
    if (slot.slotType === 'period') {
      return {
        id: `slot-${deptCode.toLowerCase()}-${yrNum}${section.toLowerCase()}-${slot.shortCode}`,
        slotNumber: slot.slotNumber,
        slotType: 'period' as SlotType,
        label: slot.label,
        shortCode: slot.shortCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectCode: '',
        subjectName: 'No subject assigned',
        facultyName: 'Unassigned',
        facultyEmployeeId: '',
        status: 'Upcoming' as const,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        reviewCount: 0,
      };
    } else {
      return {
        id: `slot-${deptCode.toLowerCase()}-${yrNum}${section.toLowerCase()}-${slot.shortCode}`,
        slotType: slot.slotType,
        label: slot.label,
        shortCode: slot.shortCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    }
  });
};

export interface TimetableEvaluation {
  currentSlot: TimetableSlot;
  isAcademicPeriod: boolean;
  isBreak: boolean;
  isLunch: boolean;
  nextSlot?: TimetableSlot;
  monitoringState: 'ACTIVE_PERIOD' | 'BREAK_SUSPENDED' | 'LUNCH_SUSPENDED' | 'SCHOOL_CLOSED';
  statusBannerText: string;
}

export const evaluateTimetableState = (slots: TimetableSlot[], mockTimeStr: string = '09:00 AM'): TimetableEvaluation => {
  const defaultSlot = slots.find((s) => s.shortCode === 'P1') || slots[0] || {
    id: 'default-slot',
    slotNumber: 1,
    slotType: 'period' as SlotType,
    label: 'Period 1',
    shortCode: 'P1',
    startTime: '09:00 AM',
    endTime: '09:50 AM',
    subjectName: 'No subject assigned',
  };
  const nextSlot = slots.find((s) => s.shortCode === 'P2');

  return {
    currentSlot: defaultSlot,
    isAcademicPeriod: defaultSlot.slotType === 'period',
    isBreak: defaultSlot.slotType === 'break',
    isLunch: defaultSlot.slotType === 'lunch',
    nextSlot,
    monitoringState: 'ACTIVE_PERIOD',
    statusBannerText: `${defaultSlot.shortCode} • ${defaultSlot.subjectName || defaultSlot.label} (${defaultSlot.startTime} – ${defaultSlot.endTime})`,
  };
};

export const getDefaultClassTimetableForDay = (
  deptCode: string = 'AIML',
  year: AcademicYear = '1st Year',
  section: AcademicSection = 'A',
  day: string = 'Monday'
): TimetableSlot[] => {
  const yrNum = year.charAt(0);

  return DEFAULT_CONFIGURABLE_TIMINGS.map((slot) => {
    if (slot.slotType === 'period') {
      return {
        id: `slot-${deptCode.toLowerCase()}-${yrNum}${section.toLowerCase()}-${day.toLowerCase()}-${slot.shortCode}`,
        slotNumber: slot.slotNumber,
        slotType: 'period' as SlotType,
        label: slot.label,
        shortCode: slot.shortCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectCode: '',
        subjectName: 'No subject assigned',
        facultyName: 'Unassigned',
        facultyEmployeeId: '',
        status: 'Upcoming' as const,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        reviewCount: 0,
      };
    } else {
      return {
        id: `slot-${deptCode.toLowerCase()}-${yrNum}${section.toLowerCase()}-${day.toLowerCase()}-${slot.shortCode}`,
        slotNumber: undefined,
        slotType: slot.slotType,
        label: slot.label,
        shortCode: slot.shortCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    }
  });
};

export const MOCK_SUBMITTED_REPORTS: SubmittedReport[] = [];

export type UserRole = 'principal' | 'hod' | 'advisor';

export type AccountStatus = 'Active' | 'Pending' | 'Deactivated';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type AcademicSection = 'A' | 'B' | 'C';

export type DepartmentCode =
  | 'CSE'
  | 'AIML'
  | 'CSBS'
  | 'AERO'
  | 'ECE'
  | 'EEE'
  | 'Civil'
  | 'Mechanical'
  | 'Mechatronics'
  | 'IT'
  | 'Biomedical'
  | 'Chemical';

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  department: string;
  year: AcademicYear;
  semester: string;
  credits: number;
}

export interface FacultyAssignment {
  id: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  year: AcademicYear;
  section: AcademicSection;
  classroom: string;
  schedulePeriod?: string;
  totalClasses?: number;
  avgSubjectAttendancePct?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: UserRole;
  department?: string;
  title: string;
  avatar: string;
  phone?: string;
  accountStatus?: AccountStatus;
  isFirstLogin?: boolean;
  assignedClass?: {
    department: string;
    year: AcademicYear;
    section: AcademicSection;
    classroom: string;
  };
  assignedFaculty?: FacultyAssignment[];
}

export interface HodAccount {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  phone: string;
  status: AccountStatus;
  lastLogin: string;
  assignedDate: string;
  avatarUrl?: string;
  totalAdvisors?: number;
  totalFaculty?: number;
  totalStudents?: number;
}

export interface AdvisorAccount {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  year: AcademicYear;
  section: AcademicSection;
  classroom: string;
  phone: string;
  status: AccountStatus;
  lastLogin: string;
  assignedDate: string;
  avatarUrl?: string;
  assignedStudentsCount: number;
  avgAttendancePct: number;
}

export interface TutorHelperAccount {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  year: AcademicYear;
  section: AcademicSection;
  advisorId: string;
  advisorName: string;
  phone: string;
  status: AccountStatus;
  lastLogin?: string;
  assignedDate: string;
  avatarUrl?: string;
}

export interface SubjectStaffAccount {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  status: AccountStatus;
  lastLogin?: string;
  assignedDate: string;
  avatarUrl?: string;
  assignments: FacultyAssignment[];
}

export type SubjectFacultyAccount = SubjectStaffAccount;

export interface CollegeClass {
  id: string;
  department: string;
  year: AcademicYear;
  section: AcademicSection;
  classroom: string;
  advisorId?: string;
  advisorName?: string; // e.g. Sarah (Primary Class Advisor)
  advisorEmployeeId?: string;
  tutorId?: string;
  tutorName?: string; // e.g. Arun (Advisor's Tutor / Helper)
  tutorEmployeeId?: string;
  totalStudents: number;
  avgAttendancePct: number;
  subjects: {
    subjectCode: string;
    subjectName: string;
    staffId?: string;
    staffName?: string; // e.g. Priya (DBMS Staff), Karthik (OS Staff), Rahul (Maths Staff)
    staffEmployeeId?: string;
    facultyId?: string;
    facultyName?: string;
    facultyEmployeeId?: string;
    avgAttendancePct: number;
  }[];
}

export interface DepartmentInfo {
  id: string;
  name: string;
  code: DepartmentCode | string;
  hodName: string;
  hodEmployeeId: string;
  hodEmail: string;
  hodStatus: AccountStatus;
  activeCameras: number;
  totalCameras: number;
  roomLocations: string;
  building: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'OD'
  | 'Late Entry'
  | 'Medical Leave'
  | 'Presence Unverified';
export type RiskLevel = 'Normal' | 'Warning' | 'Critical';

export interface SubjectAttendanceRecord {
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  status: AttendanceStatus;
  attendancePct: number;
  presentSessions: number;
  totalSessions: number;
  lastMarkedTime?: string;
}

export interface AttendanceHistoryEntry {
  date: string;
  status: AttendanceStatus;
  firstDetected: string;
  lastDetected: string;
  confidence: number | null;
  camera: string;
  durationMinutes: number;
  subjectCode?: string;
  subjectName?: string;
}

export type PresenceState =
  | 'Present'
  | 'Late'
  | 'Presence Unverified'
  | 'Presence Restored'
  | 'Possible Early Exit'
  | 'Unknown Face'
  | 'Low Confidence'
  | 'Camera Offline';

export type DetectedZone = 'Front' | 'Middle' | 'Back' | 'Door Area' | 'Center';

export type CameraEventType =
  | 'Entry'
  | 'Exit'
  | 'Presence Confirmed'
  | 'Presence Unverified'
  | 'Presence Restored'
  | 'Possible Early Exit'
  | 'Unknown Face'
  | 'Low Confidence';

export type SlotType = 'period' | 'break' | 'lunch';

export interface TimetableSlot {
  id: string;
  slotNumber?: number; // 1 to 7 for academic periods (omitted for break/lunch)
  slotType: SlotType;
  label: string; // "Period 1", "Morning Break", "Period 3", "Lunch Break", etc.
  shortCode: string; // "P1", "BREAK", "P3", "LUNCH", etc.
  startTime: string; // "09:00 AM" or "09:00"
  endTime: string; // "09:50 AM" or "09:50"
  subjectCode?: string;
  subjectName?: string;
  facultyName?: string;
  facultyEmployeeId?: string;
  status?: 'Completed' | 'Pending' | 'Upcoming';
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  reviewCount?: number;
}

export interface DayTimetableConfig {
  department: string;
  year: AcademicYear;
  section: AcademicSection;
  day?: string;
  slots: TimetableSlot[];
}

export interface StudentPresenceTimelineEvent {
  id: string;
  time: string;
  eventType: CameraEventType;
  cameraName: string;
  cameraType: 'entrance' | 'center_360';
  details: string;
  confidence: number | null;
  zone?: DetectedZone;
  reason?: string; // e.g. "Official Break", "Official Lunch", "Classroom Exit"
}

export type FaceRegistrationStatus = 'Registered' | 'Not Registered' | 'Registration Required';

export interface Student {
  id: string;
  studentId?: string;
  name: string;
  rollNumber: string;
  department: string;
  year: AcademicYear;
  section: AcademicSection;
  attendancePct: number; // Overall Attendance %
  status: AttendanceStatus;
  presenceState?: PresenceState;
  firstEntryTime?: string;
  exitTime?: string;
  reEntryTime?: string;
  lastDetectionTime?: string;
  currentPresence?: 'Inside' | 'Outside' | 'Unknown';
  detectedZone?: DetectedZone;
  presenceTimeline?: StudentPresenceTimelineEvent[];
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  faceRegistered: boolean;
  faceRegistrationStatus?: FaceRegistrationStatus;
  faceQualityScore: number;
  faceQualityChecks?: {
    singleFace: boolean;
    visible: boolean;
    lighting: boolean;
    sharpness: boolean;
    centered: boolean;
  };
  confidenceScore?: number;
  registeredDate: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalSessions: number;
  riskLevel: RiskLevel;
  avatarUrl?: string;
  referencePhotos?: string[]; // Multiple reference angles (1-3)
  faceEmbeddings?: number[][]; // 128D / 512D unit-normalized facial biometric vectors
  subjectAttendance?: SubjectAttendanceRecord[];
  recentHistory?: AttendanceHistoryEntry[];
}

export interface LiveAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year?: AcademicYear;
  section: string;
  currentSubject?: string;
  status: AttendanceStatus;
  presenceState?: PresenceState;
  confidence: number | null;
  firstDetected: string | null;
  firstEntryTime?: string | null;
  exitTime?: string | null;
  reEntryTime?: string | null;
  lastDetected: string | null;
  currentPresence?: 'Inside' | 'Outside' | 'Unknown';
  detectedZone?: DetectedZone;
  cameraName: string;
  detectionCount: number;
  avatarUrl?: string;
  presenceTimeline?: StudentPresenceTimelineEvent[];
}

export type RecognitionEventType =
  | 'Recognized'
  | 'Presence Unverified'
  | 'Unknown Face'
  | 'Low Confidence'
  | 'Entry'
  | 'Exit'
  | 'Presence Restored'
  | 'Possible Early Exit';

export interface RecognitionEvent {
  id: string;
  time: string;
  studentName: string;
  rollNumber?: string;
  department?: string;
  year?: AcademicYear;
  section?: string;
  currentSubject?: string;
  status: RecognitionEventType;
  confidence: number | null;
  cameraName: string;
  location: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type AlertType =
  | 'Low Attendance'
  | 'Low Subject Attendance'
  | 'Unknown Face'
  | 'Low Confidence'
  | 'Presence Not Detected'
  | 'Camera Offline'
  | 'Late Entry'
  | 'Possible Early Exit';

export type AlertSeverity = 'Critical' | 'Warning' | 'Info';
export type AlertStatus = 'Active' | 'Resolved' | 'Investigating';

export interface AlertItem {
  id: string;
  type: AlertType;
  studentName?: string;
  rollNumber?: string;
  department?: string;
  year?: AcademicYear;
  section?: string;
  subject?: string;
  time: string;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  cameraLocation?: string;
}

export interface CorrectionRequest {
  id: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year?: AcademicYear;
  section: string;
  subject?: string;
  date: string;
  currentStatus: AttendanceStatus;
  requestedStatus: 'Present' | 'Late' | 'Excused';
  reason: string;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewComments?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  dateTime: string;
  ipAddress: string;
  status: 'Success' | 'Warning' | 'Failed';
  details?: string;
  department?: string;
}

export interface CameraDevice {
  id: string;
  name: string;
  location: string;
  department: string;
  status: 'Connected' | 'Streaming' | 'Offline' | 'Calibrating';
  lastSeen: string;
  fps: number;
  resolution: string;
  ip: string;
  activeDetections: number;
  rtspUrl: string;
}

export type ReportStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Returned';

export interface SubmittedReport {
  id: string;
  department: string;
  year: AcademicYear;
  section: AcademicSection;
  month: string; // e.g. "August 2026"
  submittedBy: string; // Advisor name e.g. "Sarah"
  submittedByEmpId: string;
  submittedTo: string; // HOD e.g. "AIML HOD"
  submittedDate: string; // e.g. "25-Aug-2026"
  status: ReportStatus;
  totalStudents: number;
  avgAttendancePct: number;
  presentRecords?: number;
  absentRecords?: number;
  odRecords?: number;
  lateEntryRecords?: number;
  medicalLeaveRecords?: number;
  presenceUnverifiedRecords?: number;
  presentDays?: number;
  absentDays?: number;
  lateEntries?: number;
  unverifiedEntries?: number;
  remarks?: string;
  reviewedDate?: string;
}

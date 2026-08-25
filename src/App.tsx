import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CollegeProvider } from './context/CollegeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { PrincipalDashboard } from './pages/PrincipalDashboard';
import { HodDashboard } from './pages/HodDashboard';
import { AdvisorDashboard } from './pages/AdvisorDashboard';
import { AdvisorDailyAttendancePage } from './pages/AdvisorDailyAttendancePage';
import { AdvisorAttendanceHistoryPage } from './pages/AdvisorAttendanceHistoryPage';
import { AdvisorTimetablePage } from './pages/AdvisorTimetablePage';
import { AdvisorFacultyListPage } from './pages/AdvisorFacultyListPage';
import { ClassManagementPage } from './pages/ClassManagementPage';
import { SubjectAttendancePage } from './pages/SubjectAttendancePage';
import { HodManagementPage } from './pages/HodManagementPage';
import { AdvisorManagementPage } from './pages/AdvisorManagementPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { StudentsPage } from './pages/StudentsPage';
import { LiveAttendancePage } from './pages/LiveAttendancePage';
import { CameraMonitorPage } from './pages/CameraMonitorPage';
import { FaceRegistrationPage } from './pages/FaceRegistrationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { CorrectionsPage } from './pages/CorrectionsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { CamerasPage } from './pages/CamerasPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfileSecurityPage } from './pages/ProfileSecurityPage';

const RootRedirect: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'principal') {
    return <Navigate to="/principal-dashboard" replace />;
  }
  if (role === 'hod') {
    return <Navigate to="/hod-dashboard" replace />;
  }
  return <Navigate to="/advisor-dashboard" replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <CollegeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<RootRedirect />} />
                <Route path="principal-dashboard" element={<PrincipalDashboard />} />
                <Route path="hod-dashboard" element={<HodDashboard />} />
                <Route path="advisor-dashboard" element={<AdvisorDashboard />} />
                <Route path="advisor-daily-attendance" element={<AdvisorDailyAttendancePage />} />
                <Route path="advisor-timetable" element={<AdvisorTimetablePage />} />
                <Route path="advisor-history" element={<AdvisorAttendanceHistoryPage />} />
                <Route path="advisor-faculty" element={<AdvisorFacultyListPage />} />
                <Route path="class-management" element={<ClassManagementPage />} />
                <Route path="subject-attendance" element={<SubjectAttendancePage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="hod-management" element={<HodManagementPage />} />
                <Route path="advisor-management" element={<AdvisorManagementPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="attendance" element={<LiveAttendancePage />} />
                <Route path="camera" element={<CameraMonitorPage />} />
                <Route path="face-registration" element={<FaceRegistrationPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="corrections" element={<CorrectionsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="cameras" element={<CamerasPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile-security" element={<ProfileSecurityPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </CollegeProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;

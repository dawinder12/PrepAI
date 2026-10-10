import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumeJobPage } from './pages/ResumeJobPage';
import { SkillGapPage } from './pages/SkillGapPage';
import { PreparationPlanPage } from './pages/PreparationPlanPage';
import { RAGDocumentsPage } from './pages/RAGDocumentsPage';
import { MockInterviewSetupPage } from './pages/MockInterviewSetupPage';
import { MockInterviewRoomPage } from './pages/MockInterviewRoomPage';
import { InterviewSummaryPage } from './pages/InterviewSummaryPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Verifying session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-job"
            element={
              <ProtectedRoute>
                <ResumeJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-gap"
            element={
              <ProtectedRoute>
                <SkillGapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <PreparationPlanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rag"
            element={
              <ProtectedRoute>
                <RAGDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview/setup"
            element={
              <ProtectedRoute>
                <MockInterviewSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview/:id"
            element={
              <ProtectedRoute>
                <MockInterviewRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview/:id/summary"
            element={
              <ProtectedRoute>
                <InterviewSummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { GuideModeProvider } from './contexts/GuideModeContext';

import StudentLogin from "./users/students/login/Login.jsx";
import StudentSignup from "./users/students/signup/Signup.jsx";
import AdminLogin from "./users/admin/login/Login.jsx";
import RegistrationSuccess from "./users/students/signup/RegistrationSuccess.jsx";
import ForgotPassword from "./users/students/login/ForgotPassword.jsx";
import ResetPassword from "./users/students/login/ResetPassword.jsx";

// Student routes
import StudentLayout from "./layout/StudentLayout.jsx";
import Start from "./users/students/start/Start.jsx";
import Dashboard from "./users/students/pages/dashboard/pages/Dashboard.jsx";
import WeeklyTest from "./users/students/pages/weeklytest/pages/WeeklyTest.jsx";
import Reviewers from "./users/students/pages/reviewers/pages/Reviewers.jsx";
import Ranking from "./users/students/pages/ranking/pages/Ranking.jsx";
import Profile from "./users/students/pages/profile/pages/Profile.jsx";
import Crew from "./users/students/pages/crew/pages/Crew.jsx";
import Partymmr from "./users/students/pages/partymmr/pages/Partymmr.jsx";
import VersusModeLobby from "./users/students/pages/versusmodelobby/pages/versusmodelobby.jsx";
import SketchfabViewer from "./users/students/pages/dashboard/pages/SketchfabViewer.jsx";

// Admin routes
import AdminLayout from "./layout/adminlayout.jsx";
import AdminDashboard from "./users/admin/pages/dashboard/AdminDashboard.jsx";
import StudentList from "./users/admin/pages/students/StudentList.jsx";
import AddStudents from "./users/admin/pages/students/AddStudents.jsx";
import Subjects from "./users/admin/pages/subjects/Subjects.jsx";
import Unauthorized from './components/Unauthorized';
import Settings from "./users/admin/pages/settings/Settings.jsx";
import AddQuestions from "./users/admin/pages/questions/AddQuestions.jsx";
import QuestionList from "./users/admin/pages/questions/QuestionList.jsx";
import WeekSchedule from "./users/admin/pages/weeks/WeekSchedule.jsx";
import CurrentSchedules from "./users/admin/pages/weeks/CurrentSchedules";

const App = () => {
  return (
    <AuthProvider>
      <GuideModeProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<StudentLogin />} />
            <Route path="/register" element={<StudentSignup />} />
            <Route path="/alogin" element={<AdminLogin />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="start" element={<Start />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student routes */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute requireStudent>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >

              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="weeklytest" element={<WeeklyTest />} />
              <Route path="reviewers" element={<Reviewers />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="profile" element={<Profile />} />
              <Route path="crew" element={<Crew />} />
              <Route path="partymmr" element={<Partymmr />} />
              <Route path="versusmodelobby" element={<VersusModeLobby />} />
              <Route path="sketchfab" element={<SketchfabViewer />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="addquestions" element={<AddQuestions />} />
              <Route path="questionlist" element={<QuestionList />} />
              <Route path="weeks/schedule" element={<WeekSchedule />} />
              <Route path="weeks/current" element={<CurrentSchedules />} />
              <Route path="students" element={<StudentList />} />
              <Route path="settings" element={<Settings />} />
              <Route path="addstudent" element={<AddStudents />} />
              <Route path="studentlist" element={<StudentList />} />
            </Route>

            {/* Redirect root to appropriate dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {({ isAdmin }) => (
                    <Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} replace />
                  )}
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </GuideModeProvider>
    </AuthProvider>
  );
};

export default App;

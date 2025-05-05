import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import FacultyPage from './pages/FacultyPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentSignupPage from './pages/StudentSignupPage';
import FacultySignupPage from './pages/FacultySignupPage';
import Dashboard from './components/dashboard/Dashboard';
import Footer from './components/Footer';
import ProjectDetailPage from './pages/ProjectDetailPage';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/student" element={<StudentSignupPage />} />
          <Route path="/signup/faculty" element={<FacultySignupPage />} />
          
          {/* Protected routes - using the component */}
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
                <ProjectsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Dashboard route - available to all authenticated users */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Update the route to make the Faculty page accessible to all users */}
          <Route 
            path="/faculty" 
            element={
              <FacultyPage />
            } 
          />

          {/* New routes for project detail page */}
          <Route 
            path="/projects/:projectId" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
                <ProjectDetailPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects/:projectId/apply" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
                <ProjectDetailPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
        
        {/* Footer Component */}
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;

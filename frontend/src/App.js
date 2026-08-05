import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/patient/Home';
import FindDoctor from './pages/patient/FindDoctor';
import Appointments from './pages/patient/Appointments';
import Medicines from './pages/patient/Medicines';
import Notifications from './pages/patient/Notifications';
import Profile from './pages/patient/Profile';
import AIScreening from './pages/patient/AIScreening';

import Login from './pages/auth/Login';
import RegisterSelect from './pages/auth/RegisterSelect';
import RegisterPatient from './pages/auth/RegisterPatient';
import RegisterClinic from './pages/auth/RegisterClinic';
import RegisterLab from './pages/auth/RegisterLab';
import RegisterInsurance from './pages/auth/RegisterInsurance';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import DoctorSetup from './pages/auth/DoctorSetup';
import PendingApproval from './pages/auth/PendingApproval';
import Landing from './pages/Landing';
import RoleHome from './pages/RoleHome';

import ClinicLayout from './layouts/ClinicLayout';
import ClinicOverview from './pages/clinic/ClinicOverview';
import ClinicDoctors from './pages/clinic/ClinicDoctors';
import ClinicDoctorDetail from './pages/clinic/ClinicDoctorDetail';
import ClinicPatients from './pages/clinic/ClinicPatients';
import ClinicPatientDetail from './pages/clinic/ClinicPatientDetail';
import ClinicPlaceholder from './pages/clinic/ClinicPlaceholder';

import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminOrganizationDetail from './pages/admin/AdminOrganizationDetail';
import AdminClinics from './pages/admin/AdminClinics';
import AdminPatients from './pages/admin/AdminPatients';
import AdminPatientDetail from './pages/admin/AdminPatientDetail';

import { AuthProvider, useAuth } from './context/AuthContext';
import { isOrganizationApproved, isOrganizationRole } from './utils/orgAccess';

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center text-sm text-ink-500">Loading…</div>
);

const ProtectedRoute = ({ children, roles, requireOrgApproval = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requireOrgApproval && isOrganizationRole(user.role) && !isOrganizationApproved(user)) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterSelect />} />
      <Route path="/register/patient" element={<RegisterPatient />} />
      <Route path="/register/clinic" element={<RegisterClinic />} />
      <Route path="/register/lab" element={<RegisterLab />} />
      <Route path="/register/insurance" element={<RegisterInsurance />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/doctor/setup" element={<DoctorSetup />} />
      <Route
        path="/pending-approval"
        element={
          <ProtectedRoute roles={['clinic_admin', 'lab_tech', 'insurance']}>
            <PendingApproval />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/home"
        element={
          <ProtectedRoute roles={['patient']}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="/patient/doctors" element={<FindDoctor />} />
      <Route path="/patient/appointments" element={<Appointments />} />
      <Route path="/patient/medicines" element={<Medicines />} />
      <Route path="/patient/notifications" element={<Notifications />} />
      <Route path="/patient/profile" element={<Profile />} />
      <Route path="/patient/ai-screening" element={<AIScreening />} />

      <Route
        path="/clinic"
        element={
          <ProtectedRoute roles={['clinic_admin']} requireOrgApproval>
            <ClinicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<ClinicOverview />} />
        <Route path="doctors" element={<ClinicDoctors />} />
        <Route path="doctors/:doctorId" element={<ClinicDoctorDetail />} />
        <Route
          path="appointments"
          element={
            <ClinicPlaceholder
              title="Appointments"
              description="Facility-wide appointment board and waiting room controls will live here."
            />
          }
        />
        <Route path="patients" element={<ClinicPatients />} />
        <Route path="patients/:patientId" element={<ClinicPatientDetail />} />
        <Route
          path="insights"
          element={
            <ClinicPlaceholder
              title="Insights"
              description="Deeper analytics and reporting for your facility are on the roadmap."
            />
          }
        />
        <Route
          path="profile"
          element={
            <ClinicPlaceholder
              title="Facility profile"
              description="Update branding, registration details, and plan information here."
            />
          }
        />
        <Route
          path="settings"
          element={
            <ClinicPlaceholder
              title="Settings"
              description="Notification preferences, seats, and access controls will sit here."
            />
          }
        />
        <Route
          path="support"
          element={
            <ClinicPlaceholder
              title="Support"
              description="Reach Alive Health support and browse help resources."
            />
          }
        />
        <Route index element={<Navigate to="home" replace />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<AdminOverview />} />
        <Route path="organizations" element={<AdminOrganizations />} />
        <Route path="organizations/:orgId" element={<AdminOrganizationDetail />} />
        <Route path="clinics" element={<AdminClinics />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="patients/:patientId" element={<AdminPatientDetail />} />
        <Route
          path="settings"
          element={
            <ClinicPlaceholder
              title="Settings"
              description="Platform configuration and admin preferences will sit here."
            />
          }
        />
        <Route
          path="support"
          element={
            <ClinicPlaceholder
              title="Support"
              description="Internal support tools and documentation for the super admin team."
            />
          }
        />
        <Route index element={<Navigate to="home" replace />} />
      </Route>

      <Route
        path="/doctor/home"
        element={
          <ProtectedRoute roles={['doctor']}>
            <RoleHome title="Doctor portal" blurb="Your consultations and schedule will live here." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab/home"
        element={
          <ProtectedRoute roles={['lab_tech']} requireOrgApproval>
            <RoleHome title="Lab portal" blurb="Lab orders and results workflows coming next." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insurance/home"
        element={
          <ProtectedRoute roles={['insurance']} requireOrgApproval>
            <RoleHome title="Insurance portal" blurb="Claims and coverage tools coming next." />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-lg font-semibold text-ink-900">Page not found</p>
            <Link to="/" className="text-sm font-semibold text-brand-500">
              Go home
            </Link>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white font-sans text-ink-900">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'border border-slate-200 bg-white text-slate-700 shadow-lg',
              success: {
                iconTheme: { primary: '#2563eb', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#fff' }
              }
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
